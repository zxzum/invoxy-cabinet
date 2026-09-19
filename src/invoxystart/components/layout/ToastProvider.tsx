import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { AnimatePresence, m } from 'framer-motion';
import { PiCheck, PiX, PiInfo } from 'react-icons/pi';

export type ToastType = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
  dismissToast: (id: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

function detectToastType(message: string, explicitType?: ToastType): ToastType {
  if (explicitType) return explicitType;
  const lower = message.toLowerCase();
  if (
    lower.includes('ошибк') ||
    lower.includes('не удалось') ||
    lower.includes('нельзя') ||
    lower.includes('запрещ') ||
    lower.includes('отклон') ||
    lower.includes('не хватает') ||
    lower.includes('fail')
  ) {
    return 'error';
  }
  if (
    lower.includes('успеш') ||
    lower.includes('подтвержд') ||
    lower.includes('пополнен') ||
    lower.includes('скопирован') ||
    lower.includes('активирован') ||
    lower.includes('сброшен') ||
    lower.includes('отменён') ||
    lower.includes('отменен') ||
    lower.includes('изменён') ||
    lower.includes('изменен')
  ) {
    return 'success';
  }
  return 'info';
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type?: ToastType) => {
      const id = Date.now() + Math.random();
      const resolvedType = detectToastType(message, type);
      setToasts((prev) => [...prev.slice(-3), { id, message, type: resolvedType }]);
      setTimeout(() => {
        dismissToast(id);
      }, 3600);
    },
    [dismissToast],
  );

  return (
    <ToastContext.Provider value={{ showToast, dismissToast }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-4 z-[9999] flex flex-col items-center gap-2 px-4">
        <AnimatePresence mode="popLayout">
          {toasts.map((t) => {
            const isError = t.type === 'error';
            const isSuccess = t.type === 'success';

            return (
              <m.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: -24, scale: 0.85 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -18, scale: 0.85, transition: { duration: 0.15 } }}
                transition={{ type: 'spring', damping: 22, stiffness: 380 }}
                onClick={() => dismissToast(t.id)}
                className="pointer-events-auto group relative flex max-w-sm sm:max-w-md cursor-pointer items-center gap-3 rounded-full border border-white/10 bg-[#16171d]/95 px-4 py-2.5 shadow-[0_12px_32px_rgba(0,0,0,0.6),0_2px_8px_rgba(0,0,0,0.4)] backdrop-blur-xl transition-colors hover:border-white/20 active:scale-[0.98]"
              >
                {/* Micro-animated icon badge */}
                <div
                  className={`grid h-5 w-5 shrink-0 place-items-center rounded-full text-white shadow-sm ${
                    isError
                      ? 'bg-rose-500 shadow-rose-500/40'
                      : isSuccess
                        ? 'bg-emerald-500 shadow-emerald-500/40'
                        : 'bg-sky-500 shadow-sky-500/40'
                  }`}
                >
                  {isError && <PiX className="h-3 w-3 stroke-[3]" />}
                  {isSuccess && <PiCheck className="h-3 w-3 stroke-[3]" />}
                  {!isError && !isSuccess && <PiInfo className="h-3 w-3 stroke-[3]" />}
                </div>

                {/* Message text */}
                <span className="text-[13.5px] font-medium leading-tight text-white/95 pr-1">
                  {t.message}
                </span>

                {/* Subtle close cross */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    dismissToast(t.id);
                  }}
                  className="ml-auto -mr-1 grid h-5 w-5 shrink-0 place-items-center rounded-full text-white/40 transition-colors hover:bg-white/10 hover:text-white"
                  aria-label="Закрыть"
                >
                  <PiX className="h-3 w-3" />
                </button>
              </m.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
