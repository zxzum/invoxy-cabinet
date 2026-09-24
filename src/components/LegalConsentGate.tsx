import { useTranslation } from 'react-i18next';
import type { LegalConsentGateState } from '../hooks/useLegalConsentGate';
import LegalConsent from './LegalConsent';

// Экран «Ещё один шаг»: бэк ответил 428 на вход нового пользователя, без галочек
// «ознакомлен» аккаунт не создастся. Состояние и повтор входа — в useLegalConsentGate.

interface LegalConsentGateProps {
  gate: LegalConsentGateState;
  /** Со своей «стеклянной» рамкой — на standalone-страницах; внутри карточки входа — false. */
  framed?: boolean;
  className?: string;
}

export default function LegalConsentGate({
  gate,
  framed = true,
  className = '',
}: LegalConsentGateProps) {
  const { t } = useTranslation();

  return (
    <div
      className={[framed ? 'glass-panel rounded-3xl p-6' : '', className].filter(Boolean).join(' ')}
    >
      <h2 className="mb-2 text-lg font-bold tracking-tight text-ink">
        {t('auth.legalConsentTitle', 'Ещё один шаг')}
      </h2>
      <p className="mb-4 text-sm text-muted">
        {t(
          'auth.legalConsentSubtitle',
          'Чтобы создать аккаунт, подтвердите, что ознакомились с документами.',
        )}
      </p>

      <LegalConsent
        documents={gate.documents}
        accepted={gate.accepted}
        onChange={gate.toggle}
        disabled={gate.isSubmitting}
      />

      {gate.error && (
        <p className="mt-4 text-sm text-error-400" role="alert">
          {gate.error}
        </p>
      )}

      <button
        type="button"
        className="mt-5 flex h-[52px] w-full items-center justify-center rounded-full bg-mint text-sm font-bold text-bg transition-all duration-200 active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-50"
        disabled={!gate.allAccepted || gate.isSubmitting}
        onClick={() => void gate.confirm(t('common.error'))}
      >
        {gate.isSubmitting
          ? t('common.loading', 'Загрузка...')
          : t('auth.legalConsentContinue', 'Продолжить')}
      </button>
    </div>
  );
}
