import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { PALETTE_LIST } from '../config/palettes';
import { usePalette } from '../hooks/usePalette';
import { useHaptic } from '@/platform';
import { cn } from '@/lib/utils';

export function PaletteSwitcher({ compact = false }: { compact?: boolean }) {
  const { t, i18n } = useTranslation();
  const { paletteId, setPalette } = usePalette();
  const haptic = useHaptic();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const isRu = (i18n.language || 'ru').startsWith('ru');

  useEffect(() => {
    if (!open) return;
    const onClick = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const current = PALETTE_LIST.find((item) => item.id === paletteId) ?? PALETTE_LIST[0];

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => {
          haptic.impact('light');
          setOpen((value) => !value);
        }}
        className={cn('ix-icon-btn', compact && 'h-9 w-9 p-0')}
        aria-label={t('theme.palette', 'Палитра')}
        title={t('theme.palette', 'Палитра')}
      >
        <span
          className="block h-4 w-4 rounded-full shadow-[0_0_10px_var(--ix-glow)]"
          style={{ background: current.swatch }}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            className="ix-island absolute right-0 z-50 mt-2 w-56 p-2"
          >
            <div className="px-2 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-wider text-white/40">
              {t('theme.palette', 'Палитра')}
            </div>
            <div className="flex flex-col gap-1">
              {PALETTE_LIST.map((item) => {
                const active = item.id === paletteId;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      haptic.impact('light');
                      setPalette(item.id);
                      setOpen(false);
                    }}
                    className={cn(
                      'flex items-center gap-3 rounded-xl px-2 py-2 text-left text-sm transition-colors',
                      active ? 'bg-white/10 text-white' : 'text-white/70 hover:bg-white/5 hover:text-white',
                    )}
                  >
                    <span
                      className="h-5 w-5 rounded-full ring-2 ring-white/10"
                      style={{ background: item.swatch, boxShadow: active ? `0 0 12px ${item.swatch}` : undefined }}
                    />
                    <span className="flex-1">{isRu ? item.labelRu : item.labelEn}</span>
                    {active && <span className="text-[10px] uppercase tracking-wide text-white/50">on</span>}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
