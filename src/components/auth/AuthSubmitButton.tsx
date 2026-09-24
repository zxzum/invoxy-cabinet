import type { ReactNode } from 'react';
import { AnimatePresence, m } from 'framer-motion';
import { ArrowRightIcon } from '@/components/icons';

interface AuthSubmitButtonProps {
  children: ReactNode;
  loading?: boolean;
  loadingText?: string;
  disabled?: boolean;
  /** Стрелка справа, уезжающая вперёд на hover. */
  withArrow?: boolean;
}

/** Главная мятная кнопка форм авторизации. Класс bg-mint держит фирменный цвет на тёмном фоне. */
export function AuthSubmitButton({
  children,
  loading = false,
  loadingText,
  disabled = false,
  withArrow = true,
}: AuthSubmitButtonProps) {
  return (
    <m.button
      type="submit"
      disabled={disabled || loading}
      whileTap={disabled || loading ? undefined : { scale: 0.98 }}
      className="group mt-2 flex h-[52px] w-full items-center justify-center gap-2 rounded-full bg-mint text-sm font-bold text-bg transition-[opacity,box-shadow,transform] duration-200 hover:shadow-[0_8px_28px_rgba(6,214,160,0.35)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:shadow-none"
    >
      <AnimatePresence initial={false} mode="wait" aria-live="polite">
        <m.span
          key={loading ? 'loading' : 'idle'}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/20 border-t-black" />
              {loadingText}
            </>
          ) : (
            <>
              {children}
              {withArrow && (
                <ArrowRightIcon className="h-[17px] w-[17px] transition-transform duration-200 group-hover:translate-x-0.5" />
              )}
            </>
          )}
        </m.span>
      </AnimatePresence>
    </m.button>
  );
}
