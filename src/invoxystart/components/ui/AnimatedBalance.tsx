import { useEffect, useRef, useState } from 'react';

export interface AnimatedBalanceProps {
  value: number;
  currency?: string;
  prefix?: string;
  className?: string;
  showDiffBadge?: boolean;
}

export function AnimatedBalance({
  value,
  currency = '₽',
  prefix = '',
  className = '',
  showDiffBadge = true,
}: AnimatedBalanceProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const [diff, setDiff] = useState<number | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const prevValueRef = useRef(value);
  const animationFrameRef = useRef<number | null>(null);
  const badgeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const prev = prevValueRef.current;
    if (prev === value) return;

    prevValueRef.current = value;
    const delta = value - prev;
    if (delta !== 0) {
      setDiff(delta);
      setIsAnimating(true);
      if (badgeTimeoutRef.current) clearTimeout(badgeTimeoutRef.current);
      badgeTimeoutRef.current = setTimeout(() => {
        setDiff(null);
        setIsAnimating(false);
      }, 3000);
    }

    const duration = 1200; // ms
    const startTime = performance.now();
    const startVal = prev;
    const endVal = value;

    const tick = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(1, elapsed / duration);
      // Cubic ease out
      const eased = 1 - (1 - progress) ** 3;
      const current = Math.round(startVal + (endVal - startVal) * eased);
      setDisplayValue(current);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(tick);
      } else {
        setDisplayValue(endVal);
      }
    };

    animationFrameRef.current = requestAnimationFrame(tick);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [value]);

  useEffect(() => {
    return () => {
      if (badgeTimeoutRef.current) clearTimeout(badgeTimeoutRef.current);
    };
  }, []);

  const formatted = displayValue.toLocaleString('ru-RU');

  return (
    <span className="relative inline-flex items-center gap-1.5">
      <span
        className={`inline-block transition-all duration-300 ${isAnimating && (diff ?? 0) > 0 ? 'text-mint drop-shadow-[0_0_12px_rgba(6,214,160,0.5)] scale-105' : ''} ${className}`}
      >
        {prefix ? `${prefix} ` : ''}
        {formatted} {currency}
      </span>
      {showDiffBadge && diff !== null && (
        <span
          className={`animate-fade-in-up text-[10px] font-extrabold px-1.5 py-0.5 rounded-full tracking-tight transition-opacity ${
            diff > 0
              ? 'bg-mint/20 text-mint border border-mint/40 shadow-[0_0_8px_rgba(6,214,160,0.3)]'
              : 'bg-white/10 text-muted border border-white/20'
          }`}
        >
          {diff > 0 ? `+${diff.toLocaleString('ru-RU')}` : diff.toLocaleString('ru-RU')} {currency}
        </span>
      )}
    </span>
  );
}
