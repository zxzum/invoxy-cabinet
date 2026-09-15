import { useCallback, useEffect, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import {
  CheckCircle2,
  Image,
  MessageCircle,
  Paperclip,
  Plus,
  Send,
  X,
} from '@/invoxystart/components/ui/RuneIcon';
import { PageHeader } from '@/invoxystart/components/layout/PageHeader';
import { ticketsApi, type Ticket as ApiTicket, type TicketDetail } from '@/invoxystart/api';

export default function SupportPage() {
  const [tickets, setTickets] = useState<ApiTicket[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selected, setSelected] = useState<TicketDetail | null>(null);
  const [composing, setComposing] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);
  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [listError, setListError] = useState('');
  const [detailError, setDetailError] = useState('');
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState<'create' | 'reply' | null>(null);

  const loadTickets = useCallback(async () => {
    setLoading(true);
    setListError('');
    try {
      const result = await ticketsApi.getTickets({ per_page: 100 });
      setTickets(result.items);
    } catch {
      setListError('Не удалось загрузить обращения');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTickets();
  }, [loadTickets]);

  async function selectTicket(id: number) {
    setSelectedId(id);
    setSelected(null);
    setComposing(false);
    setDetailError('');
    setDetailLoading(true);
    try {
      setSelected(await ticketsApi.getTicket(id));
    } catch {
      setDetailError('Не удалось загрузить обращение');
    } finally {
      setDetailLoading(false);
    }
  }

  function startComposing() {
    setComposing(true);
    setSelectedId(null);
    setSelected(null);
    setFormError('');
  }

  async function createTicket(event: FormEvent) {
    event.preventDefault();
    const title = subject.trim();
    const text = message.trim();
    if (title.length < 3 || (!text && !attachment)) {
      setFormError('Укажите тему и опишите проблему или прикрепите изображение.');
      return;
    }
    setBusy('create');
    setFormError('');
    try {
      const uploaded = attachment ? await ticketsApi.uploadMedia(attachment, 'photo') : null;
      const created = await ticketsApi.createTicket(
        title,
        text,
        uploaded ? { media_type: uploaded.media_type, media_file_id: uploaded.file_id } : undefined,
      );
      setTickets((current) => [
        toListItem(created),
        ...current.filter((ticket) => ticket.id !== created.id),
      ]);
      setSelectedId(created.id);
      setSelected(created);
      setComposing(false);
      setSubject('');
      setMessage('');
      setAttachment(null);
    } catch {
      setFormError('Не удалось создать обращение. Попробуйте ещё раз.');
    } finally {
      setBusy(null);
    }
  }

  async function sendReply(event: FormEvent) {
    event.preventDefault();
    if (!selected || !reply.trim() || selected.status === 'closed' || selected.is_reply_blocked)
      return;
    const text = reply.trim();
    setBusy('reply');
    setDetailError('');
    try {
      const added = await ticketsApi.addMessage(selected.id, text);
      const nextStatus = selected.status === 'answered' ? 'pending' : selected.status;
      const nextDetail: TicketDetail = {
        ...selected,
        status: nextStatus,
        updated_at: added.created_at,
        messages: [...selected.messages, added],
      };
      setSelected(nextDetail);
      setTickets((current) =>
        current.map((ticket) => (ticket.id === selected.id ? toListItem(nextDetail) : ticket)),
      );
      setReply('');
    } catch {
      setDetailError('Не удалось отправить сообщение');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex min-w-0 flex-col gap-5 pb-28 lg:gap-6 lg:pb-0">
      <div className="relative z-50">
        <PageHeader title="Поддержка" subtitle="Ответим и поможем решить вопрос" notifications />
        <button
          type="button"
          onClick={startComposing}
          className="button-lift absolute right-16 top-0 z-50 hidden h-12 items-center gap-2 rounded-2xl bg-mint px-5 text-sm font-bold text-bg lg:flex"
        >
          <Plus size={18} /> Новый тикет
        </button>
      </div>

      <section className="glass-panel motion-card flex min-w-0 flex-wrap items-center gap-4 rounded-[28px] p-4 lg:flex-nowrap lg:p-5">
        <span className="glass-control grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-mint">
          <MessageCircle size={21} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-medium">Связаться с поддержкой</h2>
          <p className="mt-0.5 text-xs text-muted">@invoxyvpn · обычно отвечаем за 5 минут</p>
        </div>
        <a
          href="https://t.me/invoxyvpn"
          target="_blank"
          rel="noreferrer"
          className="button-lift w-full rounded-xl border border-white/10 px-4 py-2.5 text-center text-sm font-semibold hover:border-mint/30 lg:w-auto"
        >
          Написать
        </a>
      </section>

      <button
        type="button"
        onClick={startComposing}
        className="button-lift flex h-12 items-center justify-center gap-2 rounded-2xl bg-mint text-sm font-bold text-bg lg:hidden"
      >
        <Plus size={18} /> Новый тикет
      </button>

      <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(260px,.68fr)_minmax(0,1.32fr)]">
        <section className="glass-panel motion-card min-h-[340px] min-w-0 rounded-[28px] p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium">Ваши обращения</h2>
            <span className="rounded-full bg-white/5 px-2.5 py-1 text-[10px] text-muted">
              {tickets.length}
            </span>
          </div>
          {loading ? (
            <div className="mt-4 rounded-2xl bg-white/[.035] p-8 text-center text-xs text-muted">
              Загрузка обращений…
            </div>
          ) : listError ? (
            <div className="mt-4 rounded-2xl border border-red-300/20 bg-red-300/8 p-4 text-center text-xs text-red-200">
              <p role="alert">{listError}</p>
              <button
                type="button"
                onClick={() => void loadTickets()}
                className="mt-3 rounded-full bg-mint px-4 py-2 font-bold text-bg"
              >
                Повторить
              </button>
            </div>
          ) : tickets.length === 0 ? (
            <EmptyState icon={<MessageCircle size={28} />} text="Нет обращений" />
          ) : (
            <div className="mt-4 grid gap-2">
              {tickets.map((ticket, index) => (
                <button
                  type="button"
                  key={ticket.id}
                  onClick={() => void selectTicket(ticket.id)}
                  className={`ticket-enter group min-w-0 rounded-2xl border p-3.5 text-left transition-colors ${selectedId === ticket.id ? 'border-mint/40 bg-mint/[.08]' : 'border-white/8 bg-white/[.025] hover:border-white/15'}`}
                  style={{ animationDelay: `${index * 45}ms` }}
                >
                  <span className="flex items-center justify-between gap-3">
                    <strong className="truncate text-sm">{ticket.title}</strong>
                    <span
                      className={`shrink-0 rounded-full px-2 py-1 text-[9px] font-bold ${ticket.status === 'closed' ? 'bg-white/6 text-muted' : 'bg-mint/12 text-mint'}`}
                    >
                      {statusLabel(ticket.status)}
                    </span>
                  </span>
                  <span className="mt-2 block text-[10px] text-muted">
                    #{String(ticket.id).slice(-6)} ·{' '}
                    {formatTicketDate(ticket.updated_at || ticket.created_at)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="glass-panel motion-card min-h-[420px] min-w-0 rounded-[28px] p-5 lg:p-7">
          {composing ? (
            <form
              className="form-step-enter"
              onSubmit={(event) => void createTicket(event)}
              noValidate
            >
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-xl font-medium">Создать обращение</h2>
                <button
                  type="button"
                  aria-label="Отмена"
                  onClick={() => {
                    setComposing(false);
                    setFormError('');
                  }}
                  className="button-lift grid h-10 w-10 place-items-center rounded-full glass-control"
                >
                  <X size={17} />
                </button>
              </div>
              <label className="mt-6 block text-sm text-muted">
                Тема
                <input
                  value={subject}
                  onChange={(event) => {
                    setSubject(event.target.value);
                    setFormError('');
                  }}
                  placeholder="Кратко опишите проблему"
                  className="glass-control mt-2 h-12 w-full rounded-2xl px-4 text-sm text-ink outline-none transition-colors focus:border-mint/50"
                />
              </label>
              <label className="mt-4 block text-sm text-muted">
                Сообщение
                <textarea
                  value={message}
                  onChange={(event) => {
                    setMessage(event.target.value);
                    setFormError('');
                  }}
                  placeholder="Подробно опишите вашу проблему…"
                  rows={6}
                  className="glass-control mt-2 w-full resize-none rounded-2xl p-4 text-sm text-ink outline-none transition-colors focus:border-mint/50"
                />
              </label>
              <label className="button-lift mt-4 flex cursor-pointer items-center gap-2 text-sm text-muted hover:text-ink">
                <Image size={18} /> {attachment ? attachment.name : 'Прикрепить изображение'}
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(event) => setAttachment(event.target.files?.[0] || null)}
                />
              </label>
              {formError && (
                <p
                  role="alert"
                  className="mt-4 rounded-2xl border border-red-300/20 bg-red-300/8 px-4 py-3 text-sm text-red-200"
                >
                  {formError}
                </p>
              )}
              <div className="mt-5 flex flex-wrap gap-2">
                <button
                  type="submit"
                  disabled={busy === 'create'}
                  className="button-lift flex h-12 items-center gap-2 rounded-2xl bg-mint px-5 text-sm font-bold text-bg disabled:opacity-50"
                >
                  <Send size={17} />
                  {busy === 'create' ? 'Отправка…' : 'Отправить'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setComposing(false);
                    setFormError('');
                  }}
                  className="button-lift h-12 rounded-2xl glass-control px-5 text-sm"
                >
                  Отмена
                </button>
              </div>
            </form>
          ) : detailLoading ? (
            <div className="grid min-h-[370px] place-items-center text-sm text-muted">
              Загрузка обращения…
            </div>
          ) : detailError && !selected ? (
            <EmptyState icon={<MessageCircle size={30} />} text={detailError} />
          ) : selected ? (
            <div key={selected.id} className="form-step-enter flex min-h-[370px] flex-col">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold tracking-[.12em] text-mint">
                    ТИКЕТ #{String(selected.id).slice(-6)}
                  </p>
                  <h2 className="mt-2 truncate text-xl font-medium">{selected.title}</h2>
                  <p className="mt-1 text-xs text-muted">{formatTicketDate(selected.created_at)}</p>
                </div>
                <span
                  className={`shrink-0 rounded-xl px-3 py-2 text-xs font-semibold ${selected.status === 'closed' ? 'bg-white/6 text-muted' : 'bg-mint/12 text-mint'}`}
                >
                  {statusLabel(selected.status)}
                </span>
              </div>
              <div className="my-5 grid flex-1 content-start gap-3">
                {selected.messages.map((item) => (
                  <div
                    key={item.id}
                    className={`ticket-enter max-w-[85%] rounded-2xl px-4 py-3 text-sm ${item.is_from_admin ? 'bg-white/6' : 'ml-auto bg-mint text-bg'}`}
                  >
                    <p>{item.message_text}</p>
                    {item.has_media && (
                      <p
                        className={`mt-2 flex items-center gap-1 text-[10px] ${item.is_from_admin ? 'text-muted' : 'text-bg/70'}`}
                      >
                        <Paperclip size={13} /> Вложение
                      </p>
                    )}
                    <span
                      className={`mt-1 block text-[9px] ${item.is_from_admin ? 'text-muted' : 'text-bg/60'}`}
                    >
                      {item.is_from_admin ? 'Поддержка' : 'Вы'} ·{' '}
                      {formatTicketDate(item.created_at)}
                    </span>
                  </div>
                ))}
              </div>
              {detailError && (
                <p
                  role="alert"
                  className="mb-3 rounded-2xl border border-red-300/20 bg-red-300/8 px-4 py-3 text-xs text-red-200"
                >
                  {detailError}
                </p>
              )}
              {selected.status === 'closed' ? (
                <p className="flex items-center gap-2 text-sm text-muted">
                  <CheckCircle2 size={17} className="text-mint" /> Обращение закрыто
                </p>
              ) : selected.is_reply_blocked ? (
                <p className="flex items-center gap-2 text-sm text-muted">
                  <CheckCircle2 size={17} className="text-mint" /> Ответы временно недоступны
                </p>
              ) : (
                <form onSubmit={(event) => void sendReply(event)} className="flex gap-2">
                  <label className="min-w-0 flex-1">
                    <span className="sr-only">Ответ</span>
                    <input
                      value={reply}
                      onChange={(event) => setReply(event.target.value)}
                      placeholder="Напишите ответ…"
                      className="glass-control h-12 w-full rounded-2xl px-4 text-sm outline-none focus:border-mint/50"
                    />
                  </label>
                  <button
                    type="submit"
                    aria-label="Отправить ответ"
                    disabled={busy === 'reply' || !reply.trim()}
                    className="button-lift grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-mint text-bg disabled:opacity-40"
                  >
                    <Send size={17} />
                  </button>
                </form>
              )}
            </div>
          ) : (
            <EmptyState
              icon={<MessageCircle size={30} />}
              text="Выберите обращение или создайте новое"
            />
          )}
        </section>
      </div>
    </div>
  );
}

function toListItem(detail: TicketDetail): ApiTicket {
  return {
    id: detail.id,
    title: detail.title,
    status: detail.status,
    priority: detail.priority,
    created_at: detail.created_at,
    updated_at: detail.updated_at,
    closed_at: detail.closed_at,
    messages_count: detail.messages.length,
    last_message: detail.messages[detail.messages.length - 1] || null,
  };
}

function statusLabel(status: string) {
  return status === 'closed'
    ? 'Закрыт'
    : status === 'answered'
      ? 'Есть ответ'
      : status === 'pending'
        ? 'Ожидает'
        : 'Открыт';
}

function formatTicketDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString('ru-RU', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
}

function EmptyState({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <div className="grid min-h-[260px] place-items-center text-center text-muted">
      <div>
        <span className="glass-control mx-auto grid h-16 w-16 place-items-center rounded-2xl">
          {icon}
        </span>
        <p className="mt-4 text-sm">{text}</p>
      </div>
    </div>
  );
}
