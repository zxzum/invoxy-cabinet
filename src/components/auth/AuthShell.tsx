import type { ReactNode } from 'react';
import { LazyMotion, domMax } from 'framer-motion';
import { useTelegramSDK } from '@/hooks/useTelegramSDK';
import { AuthBackground } from '@/components/auth/AuthBackground';
import LanguageSwitcher from '@/components/LanguageSwitcher';

interface AuthShellProps {
  children: ReactNode;
  /** Ширина колонки контента, по умолчанию 440px — как карточка входа. */
  maxWidth?: number;
  /** Переключатель языка в правом верхнем углу. */
  withLanguageSwitcher?: boolean;
}

/**
 * Общая сцена для всех экранов авторизации: фон, «стеклянная» подсветка,
 * safe-area Telegram и переключатель языка. Карточка с формой и все анимации
 * живут в детях — сцена не анимируется, чтобы не спорить с ними.
 *
 * LazyMotion обязателен: роуты авторизации живут вне InvoxyStartShell, и без
 * загруженных фич m-компоненты остаются в initial-стилях (opacity: 0) — экран
 * выглядит пустым при прямом заходе на /login или /reset-password.
 */
export function AuthShell({
  children,
  maxWidth = 440,
  withLanguageSwitcher = true,
}: AuthShellProps) {
  const { safeAreaInset, contentSafeAreaInset } = useTelegramSDK();
  const safeTop = Math.max(safeAreaInset.top, contentSafeAreaInset.top);
  const safeBottom = Math.max(safeAreaInset.bottom, contentSafeAreaInset.bottom);

  return (
    <LazyMotion features={domMax} strict>
      <main
        className="auth-page relative isolate flex min-h-[100dvh] items-center justify-center overflow-hidden px-4 py-10 text-ink sm:px-6 lg:px-8"
        style={{
          paddingTop:
            safeTop > 0 ? `${safeTop + 16}px` : 'calc(1rem + env(safe-area-inset-top, 0px))',
          paddingBottom:
            safeBottom > 0
              ? `${safeBottom + 16}px`
              : 'calc(1rem + env(safe-area-inset-bottom, 0px))',
        }}
      >
        <AuthBackground />

        {withLanguageSwitcher && (
          <div
            className="fixed right-3 z-50"
            style={{
              top: safeTop > 0 ? `${safeTop + 12}px` : 'calc(12px + env(safe-area-inset-top, 0px))',
            }}
          >
            <LanguageSwitcher />
          </div>
        )}

        <div className="relative z-10 flex w-full flex-col items-center" style={{ maxWidth }}>
          {children}
        </div>
      </main>
    </LazyMotion>
  );
}
