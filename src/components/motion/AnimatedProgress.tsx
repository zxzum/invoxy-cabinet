import { motion, useReducedMotion } from 'framer-motion';
import { progressSpring } from './springs';

interface AnimatedProgressProps {
  percent: number;
  className?: string;
  barClassName?: string;
  /** Отклонение от брифа: тест рендерит <AnimatedProgress testId="bar" />, а props-тип в брифе testId не объявлял. */
  testId?: string;
}

/**
 * Полоса прогресса на scaleX (compositor, без layout reflow — как в
 * TrafficProgressBar). Fill растёт 0 → значение с progressSpring.
 */
export function AnimatedProgress({
  percent,
  className,
  barClassName,
  testId,
}: AnimatedProgressProps) {
  const reduceMotion = useReducedMotion();
  const clamped = Math.max(0, Math.min(100, percent));

  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
      className={className}
      data-testid={testId}
    >
      <motion.div
        className={barClassName}
        initial={reduceMotion ? { scaleX: clamped / 100 } : { scaleX: 0 }}
        animate={{ scaleX: clamped / 100 }}
        transition={progressSpring}
        style={{ transformOrigin: '0 50%', width: '100%', height: '100%' }}
      />
    </div>
  );
}
