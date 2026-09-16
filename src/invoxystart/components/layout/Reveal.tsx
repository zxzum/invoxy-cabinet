import { m, useReducedMotion } from 'framer-motion';
import { useEffect, useRef, useState, type ReactNode } from 'react';

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
  const reducedMotion = useReducedMotion();
  const canObserveViewport = typeof IntersectionObserver !== 'undefined';
  const ref = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(!canObserveViewport);

  useEffect(() => {
    if (!canObserveViewport || !ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setIsInView(true);
        observer.disconnect();
      },
      { threshold: 0.01, rootMargin: '120px 0px 40px 0px' },
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [canObserveViewport]);

  if (reducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <m.div
      ref={ref}
      initial={{ opacity: 0, y: 14 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
      transition={{ duration: 0.4, delay, ease: [0.16, 1, 0.3, 1] }}
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
