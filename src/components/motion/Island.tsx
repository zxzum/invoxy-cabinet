import type { HTMLMotionProps } from 'framer-motion';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

type IslandProps = HTMLMotionProps<'section'> & {
  hover?: boolean;
};

export function Island({ hover = true, className, children, ...props }: IslandProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
      whileHover={hover ? { y: -2 } : undefined}
      whileTap={hover ? { scale: 0.995 } : undefined}
      className={cn('ix-island', className)}
      {...props}
    >
      {children}
    </motion.section>
  );
}
