import { CheckIcon, CopyIcon, ExternalLinkIcon, KeyIcon, LinkIcon } from '@/components/icons';
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
    <section className="glass-surface rounded-[28px] p-4 sm:p-5" aria-label={title}>
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-400/10 text-accent-300">
          <KeyIcon className="h-5 w-5" />
        </span>
        <h2 className="text-lg font-semibold text-dark-50">{title}</h2>
      </div>

      {accessLink ? (
        <code className="mt-4 block truncate rounded-2xl bg-dark-900/40 px-4 py-3 text-xs text-dark-300">
          {accessLink}
        </code>
      ) : (
        <LunaEmptyState message={emptyMessage} className="mt-4 p-4" />
      )}

      {errorMessage && (
        <LunaErrorState
          message={errorMessage}
          onRetry={onRetry}
          retryLabel={retryLabel}
          className="mt-4"
        />
      )}

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={onCopyAccess}
          disabled={!canCopy}
          aria-label={isCopied ? copiedLabel : copyLabel}
          className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-accent-400/25 bg-accent-400/10 px-3 text-xs font-semibold text-accent-300 transition-colors hover:border-accent-400/45 hover:bg-accent-400/15 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isCopied ? <CheckIcon className="h-4 w-4" /> : <CopyIcon className="h-4 w-4" />}
          {isCopied ? copiedLabel : copyLabel}
        </button>
        <button
          type="button"
          onClick={onShowQr}
          disabled={!canShowQr}
          aria-label={qrLabel}
          className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-dark-700/70 bg-dark-800/50 px-3 text-xs font-semibold text-dark-200 transition-colors hover:border-accent-400/30 hover:text-accent-300 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <LinkIcon className="h-4 w-4" />
          {qrLabel}
        </button>
      </div>

      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={onConnectHapp}
          disabled={!canConnectHapp}
          aria-label={happLabel}
          className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-dark-700/70 bg-dark-800/50 px-3 text-xs font-semibold text-dark-200 transition-colors hover:border-accent-400/30 hover:text-accent-300 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ExternalLinkIcon className="h-4 w-4" />
          {happLabel}
        </button>
        <button
          type="button"
          onClick={onConnectIncy}
          disabled={!canConnectIncy}
          aria-label={incyLabel}
          className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-dark-700/70 bg-dark-800/50 px-3 text-xs font-semibold text-dark-200 transition-colors hover:border-accent-400/30 hover:text-accent-300 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ExternalLinkIcon className="h-4 w-4" />
          {incyLabel}
        </button>
      </div>
    </section>
  );
}
