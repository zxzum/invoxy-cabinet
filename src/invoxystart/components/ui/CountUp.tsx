import { useEffect, useRef, useState } from 'react';

interface CountUpProps {
  value: number;
  /** Формат отображения; по умолчанию — ru-RU без дробей. */
  format?: (value: number) => string;
  className?: string;
}

const DURATION_MS = 900;

function prefersReducedMotion() {
  return (
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/** Числа «докручиваются» до значения с экспоненциальным затуханием —
 *  статистика оживает при появлении и обновлении. rAF останавливается по
 *  достижении цели; reduced-motion показывает значение сразу. */
export function CountUp({ value, format, className }: CountUpProps) {
  const fmt = format ?? ((n: number) => Math.round(n).toLocaleString('ru-RU'));
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(0);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const from = fromRef.current;
    if (from === value) return;
    if (prefersReducedMotion()) {
      fromRef.current = value;
      setDisplay(value);
      return;
    }

    let last = from;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / DURATION_MS);
      const eased = 1 - (1 - progress) ** 3;
      last = from + (value - from) * eased;
      setDisplay(last);
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        setDisplay(value);
      }
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      // Следующий апдейт стартует от последнего показанного значения,
      // а не от целевого: цифра не «перепрыгивает» при частых обновлениях.
      fromRef.current = last;
    };
  }, [value]);

  return <span className={className}>{fmt(display)}</span>;
}
