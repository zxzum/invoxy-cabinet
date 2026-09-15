import { m } from 'framer-motion';
import type { ReactNode } from 'react';

export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: 'div';
}) {
  const canObserveViewport = typeof IntersectionObserver !== 'undefined';
  return (
    <m.div
      initial={{ opacity: 0, y: 20 }}
      {...(canObserveViewport
        ? {
            whileInView: { opacity: 1, y: 0 },
            viewport: { once: true, amount: 0.12, margin: '0px 0px -8% 0px' },
          }
        : { animate: { opacity: 1, y: 0 } })}
      transition={{ duration: 0.52, delay, ease: [0.22, 1, 0.36, 1] }}
      className={`scroll-reveal ${className || ''}`}
    >
      {children}
    </m.div>
  );
}

export function RevealStagger({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
  stagger?: number;
}) {
  return <div className={className}>{children}</div>;
}
