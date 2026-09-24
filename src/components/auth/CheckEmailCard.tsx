import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { m } from 'framer-motion';
import { authApi } from '@/api/auth';
import { EmailIcon } from '@/components/icons';
import { useCountdown } from '@/hooks/useCountdown';
import { isRateLimitedError } from '@/utils/api-error';

/** Своя пауза между отправками, чтобы кнопка не билась в серверный лимит впустую. */
const RESEND_COOLDOWN_SECONDS = 60;

const RING_SIZE = 18;
const RING_RADIUS = 7;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

interface CheckEmailCardProps {
  email: string;
  /** Вернуться к форме входа. */
  onBackToLogin: () => void;
  /** Вернуться к регистрации, чтобы поправить опечатку в адресе. */
  onChangeEmail: () => void;
}

/**
 * Экран «Проверьте почту» после регистрации.
 *
 * Раньше он был тупиком: письмо не пришло — и человеку оставалось только
 * «Вернуться ко входу», где его не пускают без подтверждения. Отсюда три вещи:
 * куда смотреть (папки «Спам» и «Рассылки»), как попросить письмо снова и как
 * исправить опечатку в адресе.
 *
 * Кнопка повторной отправки сразу видна, но ждёт минуту: письмо идёт не мгновенно,
 * и первым делом стоит просто подождать, а не долбить кнопку. Кнопка и уведомления
 * без exit-анимаций: тесты крутят фейковые таймеры и ждут мгновенного исчезновения.
 */
export function CheckEmailCard({ email, onBackToLogin, onChangeEmail }: CheckEmailCardProps) {
  const { t } = useTranslation();
  const [cooldown, startCooldown] = useCountdown();
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);

  // Отсчёт с самого открытия экрана: письмо только что ушло.
  useEffect(() => {
    startCooldown(RESEND_COOLDOWN_SECONDS);
  }, [startCooldown]);

  const handleResend = async () => {
    if (cooldown > 0 || sending) return;
    setSending(true);
    setNotice(null);
    try {
      await authApi.resendVerificationPublic(email);
      setNotice({ kind: 'ok', text: t('auth.resendSent') });
    } catch (err) {
      setNotice({
        kind: 'error',
        text: isRateLimitedError(err) ? t('auth.resendTooOften') : t('auth.resendError'),
      });
    } finally {
      setSending(false);
      // Пауза и после отказа: повтор в ту же секунду ничего не изменит.
      startCooldown(RESEND_COOLDOWN_SECONDS);
    }
  };

  const ringProgress = Math.min(1, cooldown / RESEND_COOLDOWN_SECONDS);

  return (
    <div className="text-center">
      <div className="relative mx-auto mb-4 flex h-14 w-14 items-center justify-center">
        <m.div
          animate={{ scale: [1, 1.22, 1], opacity: [0.45, 0.1, 0.45] }}
          transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute inset-0 rounded-2xl bg-mint/25 blur-md"
          aria-hidden="true"
        />
        <m.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', bounce: 0.4, duration: 0.55 }}
          className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-mint/25 bg-mint/10"
        >
          <EmailIcon className="h-7 w-7 text-mint" />
        </m.div>
      </div>

      <m.h2
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="mb-1 text-xl font-semibold tracking-tight text-ink"
      >
        {t('auth.checkEmail')}
      </m.h2>
      <p className="text-sm text-muted">{t('auth.verificationSent')}</p>
      <p className="mt-3 inline-flex max-w-full items-center gap-2 truncate rounded-xl border border-mint/25 bg-mint/10 px-3.5 py-2 font-mono text-[13px] font-semibold text-mint">
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-mint shadow-[0_0_6px_rgba(6,214,160,0.8)]" />
        <span className="truncate">{email}</span>
      </p>
      <p className="mt-2.5 text-xs leading-relaxed text-muted">{t('auth.clickLinkToVerify')}</p>

      <p className="mt-5 rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-left text-xs leading-relaxed text-muted">
        {t('auth.spamHint')}
      </p>

      {notice && (
        <m.p
          role="status"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
          className={`mt-3 text-xs ${notice.kind === 'ok' ? 'text-mint' : 'text-error-400'}`}
        >
          {notice.text}
        </m.p>
      )}

      <button
        type="button"
        onClick={handleResend}
        disabled={cooldown > 0 || sending}
        className="mt-4 flex h-[52px] w-full items-center justify-center gap-2.5 rounded-full bg-mint text-sm font-bold text-bg transition-all duration-200 active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {cooldown > 0 ? (
          <>
            <svg
              width={RING_SIZE}
              height={RING_SIZE}
              viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
              className="shrink-0 -rotate-90"
              aria-hidden="true"
            >
              <circle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={RING_RADIUS}
                fill="none"
                stroke="rgba(0,0,0,0.18)"
                strokeWidth="2.5"
              />
              <circle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={RING_RADIUS}
                fill="none"
                stroke="#0b0c0e"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeDasharray={RING_CIRCUMFERENCE}
                strokeDashoffset={RING_CIRCUMFERENCE * (1 - ringProgress)}
                style={{ transition: 'stroke-dashoffset 0.35s linear' }}
              />
            </svg>
            <span className="tabular-nums">{t('auth.resendIn', { seconds: cooldown })}</span>
          </>
        ) : (
          <>
            {sending && (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/20 border-t-black" />
            )}
            <span>{t('auth.resendVerification')}</span>
          </>
        )}
      </button>

      <button
        type="button"
        onClick={onChangeEmail}
        className="mt-3 w-full text-center text-sm text-mint transition-opacity hover:opacity-80"
      >
        {t('auth.useAnotherEmail')}
      </button>

      <button
        type="button"
        onClick={onBackToLogin}
        className="glass-control mt-3 flex h-12 w-full items-center justify-center rounded-full text-sm font-semibold text-ink transition-colors hover:border-white/20"
      >
        {t('auth.backToLogin')}
      </button>
    </div>
  );
}
