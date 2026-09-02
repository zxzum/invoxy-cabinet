import type { Transition } from 'framer-motion';

// Spring-конфиги сведены в одном месте (значения выверены по референсу):
// nav — плашка активного таба, pill — сайдбар/мелкие индикаторы,
// success — галки и confirmation, count — счётчики чисел,
// progress — полосы прогресса (mass < 1, чтобы частые обновления не дёргались).
export const navSpring: Transition = { type: 'spring', stiffness: 420, damping: 34 };
export const pillSpring: Transition = { type: 'spring', stiffness: 500, damping: 40 };
export const pressSpring: Transition = { type: 'spring', stiffness: 500, damping: 30 };
export const successSpring: Transition = { type: 'spring', stiffness: 300, damping: 18 };
export const countSpring: Transition = { type: 'spring', stiffness: 90, damping: 20 };
export const progressSpring: Transition = {
  type: 'spring',
  stiffness: 110,
  damping: 20,
  mass: 0.9,
};

// Основная кривая входов (easeOutQuint-подобная) — НЕ spring: входы секций
// на spring выглядят «желейно».
export const easeOutQuint = [0.22, 1, 0.36, 1] as const;

interface StaggerEntrance {
  initial: { opacity: number; y: number };
  animate: { opacity: number; y: number };
  transition: { duration: number; ease: typeof easeOutQuint; delay: number };
}

/**
 * Готовый набор props для входа элемента списка: y 16 → 0 с задержкой
 * base + index*step. Спредить в motion-элемент:
 * <motion.div {...staggerEntrance(i)}>…</motion.div>
 */
export function staggerEntrance(index: number, baseDelay = 0.05, step = 0.06): StaggerEntrance {
  return {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.35, ease: easeOutQuint, delay: baseDelay + index * step },
  };
}
