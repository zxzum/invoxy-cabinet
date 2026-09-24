import type { ReactNode } from 'react';
import { AnimatePresence, m } from 'framer-motion';
import { ExclamationIcon } from '@/components/icons';

export const AUTH_LOGO_FALLBACK = '/images/brand-mark.png?v=20260924_shield';

type AuthStatus = 'loading' | 'success' | 'error';

interface AuthStatusScreenProps {
  state: AuthStatus;
  /** Логотип для состояния загрузки; при null рисует кольцо-спиннер. */
  logo?: string | null;
  appName?: string;
  title?: ReactNode;
  subtitle?: ReactNode;
  /** Кнопки и ссылки под текстом. */
  children?: ReactNode;
  /** Показать полосу прогресса редиректа на указанное число секунд (success). */
  redirectSeconds?: number;
}

/** Развязка одного экрана: загрузка — галочка — ошибка. Общий визуальный язык с формой входа. */
export function AuthStatusScreen({
  state,
  logo,
  appName,
  title,
  subtitle,
  children,
  redirectSeconds,
}: AuthStatusScreenProps) {
  return (
    <div className="flex flex-col items-center text-center">
      <AnimatePresence initial={false} mode="wait">
        {state === 'loading' && (
          <m.div
            key="status-loading"
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center"
          >
            <m.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
              className="relative mb-5 flex items-center justify-center"
            >
              <m.div
                animate={{ opacity: [0.25, 0.6, 0.25], scale: [0.95, 1.08, 0.95] }}
                transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
                className="pointer-events-none absolute -inset-8 rounded-full bg-mint/25 blur-3xl"
              />
              <div className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-[26px] border border-white/15 bg-white/[0.08] shadow-[0_20px_50px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.25)] backdrop-blur-2xl">
                {logo ? (
                  <img
                    src={logo}
                    alt={appName || ''}
                    className="h-12 w-12 rounded-2xl object-cover"
                  />
                ) : (
                  <span className="h-8 w-8 animate-spin rounded-full border-2 border-mint/30 border-t-mint" />
                )}
              </div>
            </m.div>

            {appName && <h1 className="text-xl font-bold tracking-tight text-ink">{appName}</h1>}
            {title && <h2 className="text-lg font-semibold text-ink">{title}</h2>}
            {subtitle && <p className="mt-1.5 max-w-[300px] text-sm text-muted">{subtitle}</p>}

            <div className="relative mt-6 h-1.5 w-40 overflow-hidden rounded-full bg-white/10 p-0.5">
              <m.div
                animate={{ x: ['-100%', '160%'] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
                className="h-full w-24 rounded-full bg-gradient-to-r from-transparent via-mint to-transparent shadow-[0_0_8px_rgba(6,214,160,0.8)]"
              />
            </div>
          </m.div>
        )}

        {state === 'success' && (
          <m.div
            key="status-success"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="flex w-full flex-col items-center"
          >
            <div className="mb-4 flex h-[74px] w-[74px] items-center justify-center rounded-full bg-mint/10 ring-1 ring-mint/30">
              <m.svg viewBox="0 0 52 52" className="h-10 w-10" aria-hidden="true">
                <m.circle
                  cx="26"
                  cy="26"
                  r="23"
                  fill="none"
                  stroke="rgba(165,232,196,0.9)"
                  strokeWidth="2.5"
                  initial={{ pathLength: 0, rotate: -90 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  style={{ originX: '50%', originY: '50%' }}
                />
                <m.path
                  d="M15.5 27l7 7 14.5-15.5"
                  fill="none"
                  stroke="#a5e8c4"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ delay: 0.32, duration: 0.32, ease: 'easeOut' }}
                />
              </m.svg>
            </div>
            {title && <h2 className="text-lg font-semibold text-ink">{title}</h2>}
            {subtitle && <p className="mt-1.5 max-w-[320px] text-sm text-muted">{subtitle}</p>}
            {typeof redirectSeconds === 'number' && (
              <div className="mt-5 h-1 w-44 overflow-hidden rounded-full bg-white/10">
                <m.div
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: redirectSeconds, ease: 'linear' }}
                  className="h-full rounded-full bg-mint shadow-[0_0_8px_rgba(6,214,160,0.6)]"
                />
              </div>
            )}
            {children && <div className="mt-6 w-full">{children}</div>}
          </m.div>
        )}

        {state === 'error' && (
          <m.div
            key="status-error"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0, x: [0, -8, 8, -4, 4, 0] }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="flex w-full flex-col items-center"
          >
            <div className="mb-4 flex h-[74px] w-[74px] items-center justify-center rounded-full bg-error-500/10 ring-1 ring-error-500/30">
              <ExclamationIcon className="h-9 w-9 text-error-400" />
            </div>
            {title && <h2 className="text-lg font-semibold text-ink">{title}</h2>}
            {subtitle && (
              <p className="mt-1.5 max-w-[320px] text-sm leading-relaxed text-muted">{subtitle}</p>
            )}
            {children && <div className="mt-6 w-full">{children}</div>}
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
