import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { PALETTE_LIST } from '../config/palettes';
import { usePalette } from '../hooks/usePalette';
import { useHaptic } from '@/platform';
import { cn } from '@/lib/utils';
import { ResponsiveSheet } from '@/components/ui/ResponsiveSheet';
import { CheckIcon } from '@/components/icons';
import { successSpring } from '@/components/motion';

export function PaletteSwitcher({ compact = false }: { compact?: boolean }) {
  const { t, i18n } = useTranslation();
  const { paletteId, setPalette } = usePalette();
  const haptic = useHaptic();
  const [open, setOpen] = useState(false);
  const isRu = (i18n.language || 'ru').startsWith('ru');

  const current = PALETTE_LIST.find((item) => item.id === paletteId) ?? PALETTE_LIST[0];

  return (
    <>
      {/* Триггер живёт снаружи шита: ResponsiveSheet при !isOpen возвращает
          null (children рендерятся только внутри открытого шита), кнопка
          внутри ушла бы вместе с ним. */}
      <button
        type="button"
        onClick={() => {
          haptic.impact('light');
          setOpen(true);
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

      <ResponsiveSheet
        isOpen={open}
        onClose={() => setOpen(false)}
        title={t('theme.paletteTitle', 'Цветовая схема')}
      >
        <div className="flex flex-col gap-1 px-1 pb-2">
          {PALETTE_LIST.map((item) => {
            const active = item.id === paletteId;
            return (
              <motion.button
                key={item.id}
                type="button"
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  haptic.impact('light');
                  setPalette(item.id);
                  setOpen(false);
                }}
                className={cn(
                  'flex items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm transition-colors',
                  active
                    ? 'bg-white/10 text-white'
                    : 'text-white/70 hover:bg-white/5 hover:text-white',
                )}
              >
                <span
                  className="h-6 w-6 shrink-0 rounded-full ring-2 ring-white/10"
                  style={{
                    background: item.swatch,
                    boxShadow: active ? `0 0 14px ${item.swatch}` : undefined,
                  }}
                />
                <span className="flex-1">{isRu ? item.labelRu : item.labelEn}</span>
                {active && (
                  <motion.span
                    initial={{ scale: 0, rotate: -90 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={successSpring}
                    className="text-accent-400"
                  >
                    <CheckIcon className="h-4 w-4" />
                  </motion.span>
                )}
              </motion.button>
            );
          })}
        </div>
      </ResponsiveSheet>
    </>
  );
}
