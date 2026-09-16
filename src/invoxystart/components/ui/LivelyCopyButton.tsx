import { useState, useCallback } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { Copy, Check } from '@/invoxystart/components/ui/RuneIcon';
import { copyToClipboard } from '@/utils/clipboard';
import { useHaptic } from '@/platform';

interface LivelyCopyButtonProps {
  text: string;
  label?: string;
  copiedLabel?: string;
  className?: string;
  variant?: 'pill' | 'circle';
  onCopied?: () => void;
  disabled?: boolean;
}

export function LivelyCopyButton({
  text,
  label = 'Скопировать ключ',
  copiedLabel = 'Скопировано!',
  className = '',
  variant = 'pill',
  onCopied,
  disabled = false,
}: LivelyCopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const [ripples, setRipples] = useState<number[]>([]);
  const haptic = useHaptic();

  const handleCopy = useCallback(async () => {
    if (!text || disabled) return;

    try {
      await copyToClipboard(text);
    } catch {
      // fallback
    }

    try {
      haptic.notification('success');
    } catch {}

    setRipples((prev) => [...prev, Date.now()]);
    setCopied(true);
    onCopied?.();

    setTimeout(() => {
      setCopied(false);
    }, 2200);
  }, [text, disabled, haptic, onCopied]);

  if (variant === 'circle') {
    return (
      <m.button
        type="button"
        disabled={disabled || !text}
        onClick={() => void handleCopy()}
        whileTap={{ scale: 0.85 }}
        whileHover={{ scale: 1.05 }}
        transition={{ type: 'spring', stiffness: 500, damping: 25 }}
        aria-label={copied ? copiedLabel : label}
        className={`relative grid h-12 w-12 shrink-0 place-items-center rounded-full bg-mint text-bg shadow-[0_0_20px_rgba(6,214,160,0.35)] transition-all duration-300 disabled:opacity-40 cursor-pointer ${
          copied ? 'bg-mint ring-4 ring-mint/30 shadow-[0_0_25px_rgba(6,214,160,0.6)]' : ''
        } ${className}`}
      >
        <AnimatePresence>
          {ripples.map((id) => (
            <m.span
              key={id}
              initial={{ scale: 0.8, opacity: 0.8 }}
              animate={{ scale: 1.8, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="pointer-events-none absolute inset-0 rounded-full border-2 border-mint"
              onAnimationComplete={() => {
                setRipples((prev) => prev.filter((item) => item !== id));
              }}
            />
          ))}
        </AnimatePresence>

        <AnimatePresence mode="wait" initial={false}>
          {copied ? (
            <m.span
              key="check"
              initial={{ scale: 0, rotate: -45 }}
              animate={{ scale: [0, 1.3, 1], rotate: 0 }}
              exit={{ scale: 0, rotate: 45 }}
              transition={{ type: 'spring', stiffness: 450, damping: 18 }}
              className="flex items-center justify-center text-bg"
            >
              <Check size={18} />
            </m.span>
          ) : (
            <m.span
              key="copy"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ duration: 0.15 }}
              className="flex items-center justify-center text-bg"
            >
              <Copy size={17} />
            </m.span>
          )}
        </AnimatePresence>
      </m.button>
    );
  }

  return (
    <m.button
      type="button"
      disabled={disabled || !text}
      onClick={() => void handleCopy()}
      whileTap={{ scale: 0.94 }}
      whileHover={{ scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={`relative flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-full font-bold text-sm transition-all duration-300 disabled:opacity-40 ${
        copied
          ? 'bg-mint text-bg shadow-[0_0_25px_rgba(6,214,160,0.5)] ring-2 ring-mint/40'
          : 'bg-mint text-bg shadow-[0_4px_16px_rgba(6,214,160,0.25)] hover:shadow-[0_4px_22px_rgba(6,214,160,0.4)]'
      } ${className}`}
    >
      <AnimatePresence>
        {ripples.map((id) => (
          <m.span
            key={id}
            initial={{ scale: 0.95, opacity: 0.7 }}
            animate={{ scale: 1.15, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="pointer-events-none absolute inset-0 rounded-full border-2 border-mint"
            onAnimationComplete={() => {
              setRipples((prev) => prev.filter((item) => item !== id));
            }}
          />
        ))}
      </AnimatePresence>

      <AnimatePresence mode="wait" initial={false}>
        {copied ? (
          <m.span
            key="copied"
            initial={{ opacity: 0, y: 4, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 500, damping: 20 }}
            className="flex items-center gap-2 font-bold"
          >
            <m.span
              initial={{ scale: 0, rotate: -40 }}
              animate={{ scale: [0, 1.35, 1], rotate: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 15 }}
            >
              <Check size={18} />
            </m.span>
            <span>{copiedLabel}</span>
          </m.span>
        ) : (
          <m.span
            key="initial"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="flex items-center gap-2 font-bold"
          >
            <Copy size={18} />
            <span>{label}</span>
          </m.span>
        )}
      </AnimatePresence>
    </m.button>
  );
}
