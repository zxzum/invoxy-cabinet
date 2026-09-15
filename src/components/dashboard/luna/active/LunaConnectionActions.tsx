import { CheckIcon, CopyIcon, ScanIcon } from '@/components/icons';
import { LunaEmptyState, LunaErrorState, LunaLoadingState } from './LunaSurfaceState';

export interface LunaConnectionActionsProps {
  accessLink: string | null;
  happLink: string | null;
  incyLink: string | null;
  incyAvailable?: boolean;
  qrAvailable?: boolean;
  errorMessage?: string;
  onRetry?: () => void;
  retryLabel?: string;
  isLoading?: boolean;
  isCopied?: boolean;
  onCopyAccess?: () => void;
  onConnectHapp?: () => void;
  onConnectIncy?: () => void;
  onShowQr?: () => void;
  title?: string;
  copyLabel?: string;
  copiedLabel?: string;
  happLabel?: string;
  incyLabel?: string;
  qrLabel?: string;
  emptyMessage?: string;
  loadingMessage?: string;
}

export default function LunaConnectionActions({
  accessLink,
  happLink,
  incyLink,
  incyAvailable,
  qrAvailable,
  errorMessage,
  onRetry,
  retryLabel,
  isLoading = false,
  isCopied = false,
  onCopyAccess,
  onConnectHapp,
  onConnectIncy,
  onShowQr,
  title = 'Access and connection',
  copyLabel = 'Copy access link',
  copiedLabel = 'Access link copied',
  happLabel = 'Connect in HAPP',
  incyLabel = 'Connect in INCY',
  qrLabel = 'Show QR code',
  emptyMessage = 'Access link unavailable',
  loadingMessage = 'Loading connection details',
}: LunaConnectionActionsProps) {
  if (isLoading) return <LunaLoadingState message={loadingMessage} />;

  const canCopy = Boolean(accessLink && onCopyAccess);
  const canConnectHapp = Boolean(happLink && onConnectHapp);
  const canConnectIncy = Boolean((incyAvailable ?? Boolean(incyLink)) && onConnectIncy);
  const canShowQr = Boolean((qrAvailable ?? Boolean(accessLink)) && onShowQr);

  return (
    <div className="flex w-full flex-col gap-5">
      <section
        className="glass-surface motion-card flex w-full flex-col gap-3 rounded-[26px] p-4 sm:p-5"
        aria-label={title}
      >
        <h2 className="text-[17px] font-bold text-dark-50">{title}</h2>

        {accessLink ? (
          <code className="glass-control flex h-[52px] w-full items-center rounded-2xl px-4 text-sm text-dark-400 opacity-75">
            <span className="truncate">{accessLink}</span>
          </code>
        ) : (
          <LunaEmptyState message={emptyMessage} className="p-4" />
        )}

        {errorMessage && (
          <LunaErrorState message={errorMessage} onRetry={onRetry} retryLabel={retryLabel} />
        )}

        <button
          type="button"
          onClick={onCopyAccess}
          disabled={!canCopy}
          aria-label={isCopied ? copiedLabel : copyLabel}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-accent-400 px-3 text-sm font-bold text-on-accent transition-colors hover:bg-accent-300 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isCopied ? <CheckIcon className="h-4 w-4" /> : <CopyIcon className="h-4 w-4" />}
          {isCopied ? copiedLabel : copyLabel}
        </button>
        {canShowQr && (
          <button
            type="button"
            onClick={onShowQr}
            aria-label={qrLabel}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-full border border-dark-700/70 bg-dark-800/50 px-3 text-sm font-semibold text-dark-200 transition-colors hover:border-accent-400/30 hover:text-accent-300"
          >
            <ScanIcon className="h-4 w-4" />
            {qrLabel}
          </button>
        )}
      </section>

      <section className="flex w-full flex-col gap-2.5" aria-label="Быстрое подключение">
        <h2 className="text-[17px] font-bold text-dark-50">Быстрое подключение</h2>
        <div className="glass-surface motion-card grid w-full gap-2 rounded-[26px] p-3 2xl:grid-cols-2">
          <button
            type="button"
            onClick={onConnectHapp}
            disabled={!canConnectHapp}
            aria-label={happLabel}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-dark-700/70 bg-dark-800/50 px-3 text-center text-xs font-semibold text-dark-200 transition-colors hover:border-accent-400/30 hover:text-accent-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="luna-app-happ h-5 w-5 shrink-0" aria-hidden="true" />
            {happLabel}
          </button>
          <button
            type="button"
            onClick={onConnectIncy}
            disabled={!canConnectIncy}
            aria-label={incyLabel}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-dark-700/70 bg-dark-800/50 px-3 text-center text-xs font-semibold text-dark-200 transition-colors hover:border-accent-400/30 hover:text-accent-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="luna-app-incy h-5 w-5 shrink-0" aria-hidden="true" />
            {incyLabel}
          </button>
        </div>
      </section>
    </div>
  );
}
