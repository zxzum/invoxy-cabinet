import { m } from 'framer-motion';
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
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [canObserveViewport]);

  return (
    <m.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
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
