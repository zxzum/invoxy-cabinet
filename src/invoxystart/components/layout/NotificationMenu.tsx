import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, m } from 'framer-motion';
import { useNavigate } from 'react-router';
import { Bell, CheckCircle2 } from '@/invoxystart/components/ui/RuneIcon';
import { notificationsApi } from '@/invoxystart/api';
import ticketNotificationsApi from '@/api/ticketNotifications';

type NotificationRecord = Record<string, unknown> & { source?: 'cabinet' | 'ticket' };

function textValue(value: unknown, fallback: string) {
  return typeof value === 'string' && value.trim() ? value : fallback;
}

export function NotificationMenu({ className = '' }: { className?: string }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const root = useRef<HTMLDivElement>(null);

  const loadNotifications = useCallback(async () => {
    if (document.visibilityState === 'hidden') return;
    const [history, tickets] = await Promise.allSettled([
      notificationsApi.getHistory(30, 0),
      ticketNotificationsApi.getNotifications(false, 30, 0),
    ]);
    const generalItems =
      history.status === 'fulfilled' && Array.isArray(history.value?.notifications)
        ? history.value.notifications.filter((item): item is NotificationRecord =>
            Boolean(item && typeof item === 'object'),
          )
        : [];
    const ticketItems: NotificationRecord[] =
      tickets.status === 'fulfilled'
        ? tickets.value.items.map((ticket) => ({
            id: ticket.id,
            ticket_id: ticket.ticket_id,
            source: 'ticket',
            title: ticket.notification_type === 'admin_reply' ? 'Ответ поддержки' : 'Обращение',
            body: ticket.message || `Новое событие в обращении №${ticket.ticket_id}`,
            created_at: ticket.created_at,
            read_at: ticket.read_at ?? (ticket.is_read ? ticket.created_at : null),
          }))
        : [];
    setNotifications(
      [...generalItems, ...ticketItems].sort(
        (a, b) => Date.parse(textValue(b.created_at, '')) - Date.parse(textValue(a.created_at, '')),
      ),
    );
  }, []);

  useEffect(() => {
    void loadNotifications();
    const interval = setInterval(() => {
      void loadNotifications();
    }, 20000);
    document.addEventListener('visibilitychange', loadNotifications);
    window.addEventListener('focus', loadNotifications);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', loadNotifications);
      window.removeEventListener('focus', loadNotifications);
    };
  }, [loadNotifications]);

  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', onEscape);
    return () => {
      document.removeEventListener('pointerdown', close);
      document.removeEventListener('keydown', onEscape);
    };
  }, [open]);

  const unreadCount = notifications.filter((item) => !item.read_at).length;

  const handleMarkAllRead = async () => {
    await Promise.allSettled([
      notificationsApi.markAllAsRead(),
      ticketNotificationsApi.markAllAsRead(),
    ]);
    void loadNotifications();
  };

  const handleMarkItemRead = async (item: NotificationRecord) => {
    const id = item.id;
    if (typeof id !== 'number') return;
    try {
      if (item.source === 'ticket') await ticketNotificationsApi.markAsRead(id);
      else await notificationsApi.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === id && n.source === item.source ? { ...n, read_at: new Date().toISOString() } : n,
        ),
      );
      if (item.source === 'ticket' && typeof item.ticket_id === 'number') {
        setOpen(false);
        navigate(`/support?ticket=${item.ticket_id}`);
      }
    } catch {
      // ignore
    }
  };

  return (
    <div ref={root} className={`relative z-50 ${className}`}>
      <button
        type="button"
        aria-label="Открыть уведомления"
        aria-expanded={open}
        onClick={() => {
          setOpen((value) => !value);
          void loadNotifications();
        }}
        className="glass-panel relative grid h-12 w-12 place-items-center rounded-xl active:scale-[.96] lg:h-[clamp(40px,2.7vw,54px)] lg:w-[clamp(40px,2.7vw,54px)] lg:rounded-[clamp(12px,0.8vw,16px)]"
      >
        <Bell size={19} className="text-mint" />
        {unreadCount > 0 && (
          <span className="absolute right-2 top-2 flex h-2.5 w-2.5 items-center justify-center">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-mint opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-mint" />
          </span>
        )}
      </button>
      <AnimatePresence>
        {open && (
          <>
            <m.button
              type="button"
              aria-label="Закрыть уведомления"
              onClick={() => setOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="notification-backdrop fixed inset-0 z-[60] cursor-default bg-black/40 backdrop-blur-[2px]"
            />
            <m.div
              role="region"
              aria-label="Уведомления"
              initial={{ opacity: 0, y: -8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="notification-panel absolute right-0 top-[calc(100%+10px)] z-[70] w-[min(360px,calc(100vw-32px))] origin-top-right overflow-hidden rounded-2xl border border-white/15 bg-bg/95 p-3 shadow-[0_20px_50px_rgba(0,0,0,0.7)] backdrop-blur-2xl"
            >
              <div className="flex items-center justify-between border-b border-white/10 px-2 pb-2.5 mb-2">
                <div className="flex items-center gap-2">
                  <strong className="text-sm font-bold text-ink">Уведомления</strong>
                  {unreadCount > 0 && (
                    <span className="rounded-full bg-mint/20 border border-mint/40 px-2 py-0.5 text-[10px] font-extrabold text-mint uppercase">
                      {unreadCount} новых
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllRead}
                    className="text-[11px] font-semibold text-mint hover:underline cursor-pointer"
                  >
                    Прочитать все
                  </button>
                )}
              </div>
              {notifications.length === 0 ? (
                <p className="px-3 py-6 text-center text-xs text-muted">Пока нет уведомлений</p>
              ) : (
                <div className="max-h-[380px] overflow-y-auto pr-1 flex flex-col gap-1.5">
                  {notifications.map((item, index) => {
                    const isUnread = !item.read_at;
                    return (
                      <m.div
                        key={`${item.source ?? 'cabinet'}-${textValue(item.id, String(index))}`}
                        initial={{ opacity: 0, x: 8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.2, delay: index * 0.04 }}
                        onClick={() => void handleMarkItemRead(item)}
                        className={`flex gap-3 rounded-xl p-2.5 transition-all cursor-pointer ${
                          isUnread
                            ? 'bg-mint/[0.08] border border-mint/20 hover:bg-mint/[0.12]'
                            : 'hover:bg-white/5 opacity-80'
                        }`}
                      >
                        <span
                          className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${
                            isUnread ? 'bg-mint text-bg font-bold' : 'glass-control text-mint'
                          }`}
                        >
                          <CheckCircle2 size={14} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <strong className="block text-xs text-ink font-semibold truncate">
                              {textValue(item.title ?? item.name, 'Уведомление')}
                            </strong>
                            {isUnread && (
                              <span className="h-1.5 w-1.5 rounded-full bg-mint shrink-0" />
                            )}
                          </div>
                          <span className="mt-0.5 block text-[11px] text-muted line-clamp-2">
                            {textValue(item.body ?? item.message ?? item.text, '')}
                          </span>
                          <span className="mt-1 block text-[9px] text-muted/60">
                            {textValue(item.created_at ?? item.time, '')}
                          </span>
                        </span>
                      </m.div>
                    );
                  })}
                </div>
              )}
            </m.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
