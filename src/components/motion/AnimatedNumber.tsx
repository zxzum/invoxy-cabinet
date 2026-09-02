import { animate, motion, useMotionValue, useReducedMotion, useTransform } from 'framer-motion';
import { useEffect } from 'react';
import { countSpring } from './springs';

interface AnimatedNumberProps {
  value: number;
  /** Форматирование текущего значения; по умолчанию — округлённое целое. */
  format?: (value: number) => string;
  className?: string;
  testId?: string;
}

/**
 * Счётчик, «перетекающий» между значениями (spring 90/20).
 * Рендерит только текст — безопасен внутри любых строк/ссылок.
 */
export function AnimatedNumber({ value, format, className, testId }: AnimatedNumberProps) {
  const reduceMotion = useReducedMotion();
  const motionValue = useMotionValue(value);
  const text = useTransform(motionValue, (latest) =>
    format ? format(latest) : String(Math.round(latest)),
  );

  useEffect(() => {
    if (reduceMotion) {
      motionValue.jump(value);
      return;
    }
    const controls = animate(motionValue, value, countSpring);
    return () => controls.stop();
  }, [value, motionValue, reduceMotion]);

  return (
    <motion.span className={className} data-testid={testId}>
      {text}
    </motion.span>
  );
}
