import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckIcon } from '@/components/icons';
import { useHaptic } from '@/platform';
import { cn } from '@/lib/utils';
import { copyToClipboard } from '@/utils/clipboard';

interface AnimatedCopyProps {
  value: string;
  /** Текст/иконка в обычном состоянии; по умолчанию — иконка копирования не рисуется, только подпись. */
  children?: ReactNode;
  label?: string;
  className?: string;
  style?: CSSProperties;
  title?: string;
}

/**
 * Копирование с «живым» подтверждением: свап иконки на галку (spring),
 * конфетти-берст, haptic. Берст одноразовый — гаснет за 0.7s.
 */
export function AnimatedCopy({
  value,
  children,
  label,
  className,
  style,
  title,
}: AnimatedCopyProps) {
  const { t } = useTranslation();
  const haptic = useHaptic();
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  const handleCopy = async () => {
    await copyToClipboard(value);
    haptic.notification('success');
    setCopied(true);
    window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <motion.button
      type="button"
      onClick={handleCopy}
      whileTap={{ scale: 0.96 }}
      className={cn('relative inline-flex items-center justify-center gap-2', className)}
      style={style}
      title={title}
      aria-label={label ?? t('common.copy')}
    >
      <AnimatePresence mode="wait" initial={false}>
        {copied ? (
          <motion.span
            key="check"
            initial={{ scale: 0, rotate: -90, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 600, damping: 20 }}
            className="relative inline-flex text-success-400"
          >
            <CheckIcon className="h-4 w-4" />
            {Array.from({ length: 8 }, (_, i) => {
              const angle = (i / 8) * Math.PI * 2;
              return (
                <motion.span
                  key={i}
                  aria-hidden="true"
                  className="absolute left-1/2 top-1/2 h-1 w-1 rounded-full bg-success-400"
                  initial={{ opacity: 1, scale: 1 }}
                  animate={{
                    opacity: 0,
                    scale: 0.4,
                    x: Math.cos(angle) * 26,
                    y: Math.sin(angle) * 18,
                  }}
                  transition={{ duration: 0.7, ease: 'easeOut' }}
                />
              );
            })}
          </motion.span>
        ) : (
          <motion.span
            key="copy"
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.4, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 600, damping: 24 }}
            className="inline-flex items-center gap-2"
          >
            {children ?? label}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
