import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { PiCheckCircleFill, PiWarningCircleFill, PiInfoFill } from 'react-icons/pi';

export type ToastType = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
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
    lower.includes('отменен')
  ) {
    return 'success';
  }
  return 'info';
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((message: string, type?: ToastType) => {
    const id = Date.now() + Math.random();
    const resolvedType = detectToastType(message, type);
    setToasts((prev) => [...prev.slice(-2), { id, message, type: resolvedType }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-5 z-[100] flex flex-col items-center gap-2.5 px-4">
        {toasts.map((t) => {
          const isError = t.type === 'error';
          const isSuccess = t.type === 'success';

          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex max-w-sm sm:max-w-md w-auto items-center gap-3 rounded-2xl px-4.5 py-3 text-sm font-semibold shadow-2xl backdrop-blur-xl border transition-all duration-300 ${
                isError
                  ? 'bg-[#1e1215]/95 text-red-200 border-red-500/30 shadow-[0_8px_30px_rgba(239,68,68,0.22)]'
                  : isSuccess
                    ? 'bg-[#0f1d18]/95 text-emerald-100 border-mint/35 shadow-[0_8px_30px_rgba(165,232,196,0.18)]'
                    : 'bg-[#14151B]/95 text-ink border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.5)]'
              }`}
            >
              {isError && <PiWarningCircleFill className="h-5 w-5 shrink-0 text-red-400" />}
              {isSuccess && <PiCheckCircleFill className="h-5 w-5 shrink-0 text-mint" />}
              {!isError && !isSuccess && <PiInfoFill className="h-5 w-5 shrink-0 text-sky-400" />}
              <span className="leading-snug">{t.message}</span>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
