import type { ReactNode } from 'react';
import { PageHeader } from '@/invoxystart/components/layout/PageHeader';
import { copyToClipboard } from '@/utils/clipboard';

export function AccountPage({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-5 pb-28 lg:gap-6 lg:pb-0">
      <PageHeader title={title} subtitle={subtitle} mobileNotifications />
      {children}
    </div>
  );
}

export function AccountPanel({
  title,
  description,
  children,
  className = '',
}: {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`glass-panel motion-card rounded-[30px] p-5 lg:p-7 ${className}`}>
      {(title || description) && (
        <div>
          {title && <h2 className="text-lg font-medium">{title}</h2>}
          {description && <p className="mt-1 text-sm text-muted">{description}</p>}
        </div>
      )}
      {children}
    </section>
  );
}

export function LoadingState() {
  return <div className="glass-panel h-40 animate-pulse rounded-[30px]" aria-label="Загрузка" />;
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="glass-panel rounded-[30px] p-8 text-center">
      <p role="alert" className="text-sm text-red-200">
        {message}
      </p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="button-lift mt-5 rounded-full bg-mint px-5 py-3 text-xs font-bold text-bg"
        >
          Повторить
        </button>
      )}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="glass-panel rounded-[30px] p-8 text-center">
      <h2 className="text-lg font-medium">{title}</h2>
      <p className="mt-2 text-sm text-muted">{description}</p>
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}

export function formatMoney(kopeks?: number | null, rubles?: number | null) {
  const amount = rubles ?? (kopeks ?? 0) / 100;
  return `${amount.toLocaleString('ru-RU', { maximumFractionDigits: 2 })} ₽`;
}

export function formatDate(value?: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('ru-RU');
}

export function copyText(value: string) {
  return copyToClipboard(value);
}

export function Toggle({
  checked,
  disabled = false,
  onChange,
  label,
}: {
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-7 w-12 rounded-full p-1 transition-colors disabled:opacity-50 ${checked ? 'bg-mint' : 'bg-white/15'}`}
    >
      <span
        className={`block h-5 w-5 rounded-full bg-bg transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`}
      />
    </button>
  );
}
