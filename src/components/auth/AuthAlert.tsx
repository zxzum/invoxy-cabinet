import type { ReactNode } from 'react';
import { m } from 'framer-motion';

interface AuthAlertProps {
  children: ReactNode;
}

/** Баннер ошибки формы: появляется без скачка высоты и слегка «вздрагивает», привлекая внимание. */
export function AuthAlert({ children }: AuthAlertProps) {
  return (
    <m.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0, x: [0, -9, 9, -5, 5, -2, 0] }}
      transition={{ duration: 0.42, ease: 'easeOut' }}
      role="alert"
      className="rounded-2xl border border-error-500/30 bg-error-500/10 px-4 py-3 text-sm text-error-400"
    >
      {children}
    </m.div>
  );
}
