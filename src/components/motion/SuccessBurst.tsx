import { motion, useReducedMotion } from 'framer-motion';
import { successSpring } from './springs';

interface SuccessBurstProps {
  size?: number;
  className?: string;
}

// Точки конфетти расходятся эллипсом (по X дальше, чем по Y) —
// читается как «вспышка», а не как идеальный круг.
const BURST_DOTS = Array.from({ length: 10 }, (_, i) => {
  const angle = (i / 10) * Math.PI * 2;
  return { x: Math.cos(angle) * 46, y: Math.sin(angle) * 30 };
});

/**
 * Тайл успеха: круглая плитка, галка прорисовывается pathLength,
 * вокруг разлетается одноразовый конфетти-берст.
 * Никаких бесконечных анимаций — всё гаснет за ~1s.
 * При prefers-reduced-motion берст не рисуется, плитка и галка появляются сразу.
 */
export function SuccessBurst({ size = 64, className }: SuccessBurstProps) {
  const reduceMotion = useReducedMotion();

  return (
    <div className={className} style={{ position: 'relative', width: size, height: size }}>
      {/* При prefers-reduced-motion конфетти не рисуем вовсе — это чистая декорация. */}
      {!reduceMotion &&
        BURST_DOTS.map((dot, index) => (
          <motion.span
            key={index}
            aria-hidden="true"
            className="absolute left-1/2 top-1/2 h-1.5 w-1.5 rounded-full"
            style={{
              background: 'rgb(var(--color-accent-400))',
              x: '-50%',
              y: '-50%',
            }}
            initial={{ opacity: 1, scale: 1 }}
            animate={{ opacity: 0, scale: 0.4, translateX: dot.x, translateY: dot.y }}
            transition={{ duration: 0.7, ease: 'easeOut', delay: 0.1 }}
          />
        ))}
      <motion.div
        initial={reduceMotion ? { scale: 1, opacity: 1 } : { scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={reduceMotion ? { duration: 0 } : successSpring}
        className="flex h-full w-full items-center justify-center rounded-full"
        style={{
          background:
            'linear-gradient(135deg, rgb(var(--color-accent-400)), rgb(var(--color-accent-600)))',
          boxShadow: '0 8px 24px var(--ix-glow)',
        }}
      >
        <motion.svg
          width={size * 0.45}
          height={size * 0.45}
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <motion.path
            d="M5 13l4 4L19 7"
            stroke="white"
            strokeWidth={2.6}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={reduceMotion ? { pathLength: 1 } : { pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={
              reduceMotion ? { duration: 0 } : { duration: 0.35, delay: 0.18, ease: 'easeOut' }
            }
          />
        </motion.svg>
      </motion.div>
    </div>
  );
}
