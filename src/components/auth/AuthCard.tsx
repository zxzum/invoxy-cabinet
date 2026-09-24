import type { ReactNode } from 'react';
import { m } from 'framer-motion';

interface AuthCardProps {
  children: ReactNode;
  className?: string;
}

/** «Стеклянная» карточка формы: мягкий вылет при появлении, без дёрганья при смене высоты. */
export function AuthCard({ children, className = '' }: AuthCardProps) {
  return (
    <m.div
      layout="position"
      initial={{ opacity: 0, y: 24, scale: 0.985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={`glass-panel motion-card relative w-full rounded-[36px] p-6 sm:p-8 ${className}`}
    >
      {children}
    </m.div>
  );
}
