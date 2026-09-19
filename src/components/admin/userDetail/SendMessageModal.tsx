import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { adminUsersApi } from '../../../api/adminUsers';
import { useNotify } from '../../../platform/hooks/useNotify';

export interface SendMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: number;
  telegramId: number | null | undefined;
  email: string | null | undefined;
}

export function SendMessageModal({
  isOpen,
  onClose,
  userId,
  telegramId,
  email,
}: SendMessageModalProps) {
  const { t } = useTranslation();
  const notify = useNotify();

  const hasTelegram = Boolean(telegramId);
  const hasEmail = Boolean(email);

  const [channel, setChannel] = useState<'telegram' | 'email'>('telegram');
  const [subject, setSubject] = useState('InvoxyVPN');
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);

  // Set initial channel based on availability
  useEffect(() => {
    if (isOpen) {
      if (hasTelegram) {
        setChannel('telegram');
      } else if (hasEmail) {
        setChannel('email');
      }
      setSubject('InvoxyVPN');
      setText('');
    }
  }, [isOpen, hasTelegram, hasEmail]);

  if (!isOpen) return null;

  const handleSend = async () => {
    const trimmedText = text.trim();
    if (!trimmedText || loading) return;

    if (channel === 'email' && !subject.trim()) {
      notify.error(
        t('admin.users.sendMessage.errors.empty_subject', 'Укажите тему письма'),
        t('common.error'),
      );
      return;
    }

    setLoading(true);
    try {
      if (channel === 'email') {
        await adminUsersApi.sendMessage(userId, {
          text: trimmedText,
          channel: 'email',
          subject: subject.trim(),
        });
        notify.success(
          t('admin.users.sendMessage.successEmail', 'Письмо отправлено на почту'),
          t('common.success'),
        );
      } else {
        await adminUsersApi.sendMessage(userId, {
          text: trimmedText,
          channel: 'telegram',
        });
        notify.success(t('admin.users.sendMessage.success'), t('common.success'));
      }
      onClose();
      setText('');
    } catch (err) {
      const detail = (
        err as { response?: { data?: { detail?: { code?: string; message?: string } | string } } }
      )?.response?.data?.detail;
      const code = typeof detail === 'object' ? detail?.code : undefined;
      const known = [
        'no_telegram_id',
        'no_email',
        'smtp_not_configured',
        'empty_subject',
        'empty_message',
        'send_failed',
        'bot_not_configured',
        'forbidden',
        'bad_request',
      ];
      const message =
        code && known.includes(code)
          ? t(`admin.users.sendMessage.errors.${code}`)
          : (typeof detail === 'object' ? detail?.message : detail) ||
            t('admin.users.userActions.error');
      notify.error(message, t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-dark-950/60"
        onClick={() => !loading && onClose()}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="send-message-title"
        className="relative w-full max-w-md rounded-xl border border-dark-700 bg-dark-800 p-5 shadow-2xl"
      >
        <h3 id="send-message-title" className="mb-3 text-base font-semibold text-dark-100">
          {t('admin.users.sendMessage.title')}
        </h3>

        {/* Channel Selector */}
        <div className="mb-4 flex rounded-lg bg-dark-900/60 p-1">
          <button
            type="button"
            disabled={!hasTelegram}
            onClick={() => setChannel('telegram')}
            title={
              !hasTelegram ? t('admin.users.sendMessage.noTelegram', 'Нет Telegram ID') : undefined
            }
            className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-all ${
              channel === 'telegram'
                ? 'bg-accent-500 text-on-accent shadow-sm'
                : 'text-dark-400 hover:text-dark-200 disabled:opacity-30 disabled:hover:text-dark-400'
            }`}
          >
            {t('admin.users.sendMessage.channelTelegram', 'В бота')}
          </button>
          <button
            type="button"
            disabled={!hasEmail}
            onClick={() => setChannel('email')}
            title={!hasEmail ? t('admin.users.sendMessage.noEmail', 'Нет почты') : undefined}
            className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-all ${
              channel === 'email'
                ? 'bg-accent-500 text-on-accent shadow-sm'
                : 'text-dark-400 hover:text-dark-200 disabled:opacity-30 disabled:hover:text-dark-400'
            }`}
          >
            {t('admin.users.sendMessage.channelEmail', 'На почту')}
          </button>
        </div>

        {/* Subject field (email only) */}
        {channel === 'email' && (
          <div className="mb-3">
            <label className="mb-1 block text-xs font-medium text-dark-300">
              {t('admin.users.sendMessage.subject', 'Тема')}
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              maxLength={200}
              placeholder="InvoxyVPN"
              className="w-full rounded-lg border border-dark-600 bg-dark-900/60 px-3 py-2 text-sm text-dark-100 placeholder-dark-500 focus:border-accent-500 focus:outline-none"
            />
          </div>
        )}

        {/* Message body */}
        <div>
          <label className="mb-1 block text-xs font-medium text-dark-300">
            {t('admin.users.sendMessage.messageLabel', 'Сообщение')}
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={4096}
            rows={5}
            autoFocus
            placeholder={t('admin.users.sendMessage.placeholder')}
            className="w-full resize-y rounded-lg border border-dark-600 bg-dark-900/60 px-3 py-2 text-sm text-dark-100 placeholder-dark-500 focus:border-accent-500 focus:outline-none"
          />
          <div className="mt-1 text-right text-xs text-dark-500">{text.length}/4096</div>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={loading}
            className="rounded-lg bg-dark-700 px-4 py-2 text-sm font-medium text-dark-300 transition-colors hover:bg-dark-600 disabled:opacity-50"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handleSend}
            disabled={loading || !text.trim() || (channel === 'email' && !subject.trim())}
            className="rounded-lg bg-accent-500 px-4 py-2 text-sm font-medium text-on-accent transition-colors hover:bg-accent-600 disabled:opacity-50"
          >
            {loading ? t('admin.users.sendMessage.sending') : t('admin.users.sendMessage.send')}
          </button>
        </div>
      </div>
    </div>
  );
}
