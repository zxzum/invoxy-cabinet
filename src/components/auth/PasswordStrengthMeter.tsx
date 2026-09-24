import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, m } from 'framer-motion';

/** Критерии те же, что в бэкенд-валидаторе: длина, регистр, цифра, символ/длина. */
export function scorePassword(password: string): number {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 8) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password) || password.length >= 12) score++;
  return score;
}

const LEVEL_COLORS = ['bg-error-500', 'bg-error-500', 'bg-amber-500', 'bg-yellow-400', 'bg-mint'];
const LEVEL_GLOWS = [
  '',
  'shadow-[0_0_8px_rgba(239,71,111,0.55)]',
  'shadow-[0_0_8px_rgba(245,158,11,0.5)]',
  'shadow-[0_0_8px_rgba(245,241,122,0.5)]',
  'shadow-[0_0_8px_rgba(6,214,160,0.6)]',
];

interface PasswordStrengthMeterProps {
  password: string;
  minLength?: number;
}

/** Живая полоска силы пароля: сегменты «заряжаются» пружиной, подпись сменяется плавно. */
export function PasswordStrengthMeter({ password, minLength = 8 }: PasswordStrengthMeterProps) {
  const { t } = useTranslation();
  const score = useMemo(() => scorePassword(password), [password]);

  return (
    <div className="space-y-1.5 px-1">
      <div className="flex h-1 gap-1.5" role="img" aria-label={`${score}/4`}>
        {[1, 2, 3, 4].map((step) => (
          <div key={step} className="h-full flex-1 overflow-hidden rounded-full bg-white/10">
            <m.div
              initial={false}
              animate={{ scaleX: password && score >= step ? 1 : 0.12 }}
              transition={{ type: 'spring', bounce: 0.25, duration: 0.45 }}
              className={`h-full w-full origin-left rounded-full transition-colors duration-300 ${
                password && score >= step
                  ? `${LEVEL_COLORS[Math.min(score, 4)]} ${LEVEL_GLOWS[Math.min(score, 4)]}`
                  : 'bg-white/15'
              }`}
            />
          </div>
        ))}
      </div>
      <div className="flex h-4 items-center justify-between text-[11px] text-muted">
        {password.length < minLength ? (
          <p className="text-error-400">
            {t('auth.passwordTooShort', 'Password must be at least 8 characters')}
          </p>
        ) : (
          <>
            <AnimatePresence initial={false} mode="wait">
              <m.span
                key={score <= 2 ? 'moderate' : 'strong'}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              >
                {score <= 2
                  ? t('auth.passwordModerate', 'Средний пароль')
                  : t('auth.passwordStrong', 'Надёжный пароль')}
              </m.span>
            </AnimatePresence>
            <span className="font-mono text-mint/80">{password.length}</span>
          </>
        )}
      </div>
    </div>
  );
}
