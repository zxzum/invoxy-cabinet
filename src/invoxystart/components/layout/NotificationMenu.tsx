import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, m } from 'framer-motion';
import { Bell, CheckCircle2 } from '@/invoxystart/components/ui/RuneIcon';
import { notificationsApi } from '@/invoxystart/api';

type NotificationRecord = Record<string, unknown>;

function textValue(value: unknown, fallback: string) {
  return typeof value === 'string' && value.trim() ? value : fallback;
}

export function NotificationMenu({ className = '' }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [loaded, setLoaded] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || loaded) return;
    void notificationsApi
      .getHistory()
      .then((result) => {
        setNotifications(
          Array.isArray(result?.notifications)
            ? result.notifications.filter((item): item is NotificationRecord =>
                Boolean(item && typeof item === 'object'),
              )
            : [],
        );
      })
      .catch(() => setNotifications([]))
      .finally(() => setLoaded(true));
  }, [loaded, open]);

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

  return (
    <div ref={root} className={`relative z-50 ${className}`}>
      <button
        type="button"
        aria-label="Открыть уведомления"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="glass-panel relative grid h-12 w-12 place-items-center rounded-xl active:scale-[.96] lg:h-[clamp(40px,2.7vw,54px)] lg:w-[clamp(40px,2.7vw,54px)] lg:rounded-[clamp(12px,0.8vw,16px)]"
      >
        <Bell size={19} className="text-mint" />
        {notifications.length > 0 && (
          <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-mint ring-2 ring-bg" />
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
              className="notification-panel absolute right-0 top-[calc(100%+10px)] z-[70] w-[min(340px,calc(100vw-32px))] origin-top-right overflow-hidden rounded-2xl border border-white/15 bg-bg/95 p-2 shadow-[0_20px_50px_rgba(0,0,0,0.7)] backdrop-blur-2xl"
            >
              <div className="flex items-center justify-between px-3 py-2">
                <strong className="text-sm">Уведомления</strong>
                {notifications.length > 0 && (
                  <span className="text-[10px] font-bold text-mint">
                    {notifications.length} НОВЫХ
                  </span>
                )}
              </div>
              {notifications.length === 0 ? (
                <p className="px-3 py-6 text-center text-xs text-muted">Пока нет уведомлений</p>
              ) : (
                notifications.map((item, index) => (
                  <m.div
                    key={`${textValue(item.id, String(index))}-${index}`}
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.045 }}
                    className="flex gap-3 rounded-xl px-3 py-3 hover:bg-white/5"
                  >
                    <span className="glass-control grid h-9 w-9 shrink-0 place-items-center rounded-full text-mint">
                      <CheckCircle2 size={15} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <strong className="block text-xs">
                        {textValue(item.title ?? item.name, 'Уведомление')}
                      </strong>
                      <span className="mt-1 block text-[11px] text-muted">
                        {textValue(item.text ?? item.message, 'Новое событие в кабинете')}
                      </span>
                      <span className="mt-1.5 block text-[9px] text-muted/70">
                        {textValue(item.time ?? item.created_at, '')}
                      </span>
                    </span>
                  </m.div>
                ))
              )}
            </m.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
