import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { XCloseIcon } from '@/components/icons';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { Sheet } from './Sheet';

/** Ширина, с которой нижний шит перестаёт быть уместным. */
const DESKTOP_QUERY = '(min-width: 640px)';

function useIsDesktop(): boolean {
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(DESKTOP_QUERY).matches,
  );

  useEffect(() => {
    const query = window.matchMedia(DESKTOP_QUERY);
    const onChange = (event: MediaQueryListEvent) => setIsDesktop(event.matches);
    query.addEventListener('change', onChange);
    setIsDesktop(query.matches);
    return () => query.removeEventListener('change', onChange);
  }, []);

  return isDesktop;
}

interface ResponsiveSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  /** Ширина окна на десктопе: md для коротких диалогов, lg для форм с сеткой. */
  size?: 'md' | 'lg';
  children: ReactNode;
}

const WIDTH: Record<NonNullable<ResponsiveSheetProps['size']>, string> = {
  md: 'max-w-md',
  lg: 'max-w-2xl',
};

/**
 * Нижний шит на телефоне, обычное окно на десктопе.
 *
 * Шит — мобильная идиома: ручка перетаскивания мышью бессмысленна, а
 * прижатая к нижнему краю плашка на широком экране оставляет центр пустым
 * и обрезает нижние скругления. На десктопе то же содержимое показывается
 * центрированным окном с ловушкой фокуса и закрытием по Escape.
 */
export function ResponsiveSheet({
  isOpen,
  onClose,
  title,
  size = 'md',
  children,
}: ResponsiveSheetProps) {
  const { t } = useTranslation();
  const isDesktop = useIsDesktop();

  // onClose вызывается сразу; выезд доигрывает AnimatePresence (десктоп)
  // или сам Sheet (мобильный) — отдельного таймера закрытия не нужно.
  // Ловушка нужна только своей ветке: у Sheet она уже своя.
  const dialogRef = useFocusTrap<HTMLDivElement>(isOpen && isDesktop, {
    onEscape: onClose,
  });

  if (!isDesktop) {
    return (
      <Sheet isOpen={isOpen} onClose={onClose} title={title}>
        {children}
      </Sheet>
    );
  }

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          initial="closed"
          animate="open"
          exit="closed"
        >
          <motion.div
            aria-hidden="true"
            className="absolute inset-0 cursor-default bg-black/65"
            variants={{ closed: { opacity: 0 }, open: { opacity: 1 } }}
            transition={{ duration: 0.24, ease: 'easeOut' }}
            onClick={onClose}
          />
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            tabIndex={-1}
            variants={{
              closed: { opacity: 0, y: 18, scale: 0.97 },
              open: { opacity: 1, y: 0, scale: 1 },
            }}
            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
            className={`relative flex max-h-[calc(100dvh-2rem)] w-full ${WIDTH[size]} flex-col overflow-hidden rounded-2xl border border-dark-700 bg-dark-900 shadow-2xl`}
          >
            <div className="flex items-center justify-between gap-3 px-4 pb-1 pt-2">
              <h3 className="text-lg font-semibold text-dark-50">{title}</h3>
              <button
                type="button"
                onClick={onClose}
                aria-label={t('common.close', 'Закрыть')}
                className="-mr-1.5 flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-lg text-dark-400 transition-colors hover:bg-dark-800 hover:text-dark-200"
              >
                <XCloseIcon />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
