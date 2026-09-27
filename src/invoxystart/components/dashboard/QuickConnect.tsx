import { useState } from 'react';
import type { ConnectionLinkResponse } from '@/invoxystart/api/subscription';
import {
  ConnectDeviceModal,
  detectUserOS,
} from '@/invoxystart/components/connection/ConnectDeviceModal';
import { AppConnectModal } from '@/invoxystart/components/connection/AppConnectModal';
import { Smartphone, Zap } from '@/invoxystart/components/ui/RuneIcon';
import { openDeepLink } from '@/utils/openDeepLink';

const options = [
  { id: 'happ', label: 'Подключить в HAPP', icon: '/images/apps/happ.png' },
  { id: 'incy', label: 'Подключить в INCY', icon: '/images/apps/incy.png' },
];

export function QuickConnect({
  connection,
}: {
  connection?: Pick<
    ConnectionLinkResponse,
    | 'subscription_url'
    | 'happ_redirect_link'
    | 'happ_scheme_link'
    | 'happ_cryptolink'
    | 'happ_crypto_link'
    | 'happ_link'
  > | null;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [appConnectOpen, setAppConnectOpen] = useState(false);

  const happLink =
    connection?.happ_redirect_link ||
    connection?.happ_scheme_link ||
    connection?.happ_link ||
    connection?.happ_cryptolink ||
    connection?.happ_crypto_link ||
    (connection?.subscription_url ? `happ://add/${connection.subscription_url}` : null);
  const incyLink = connection?.subscription_url
    ? `incy://import/${connection.subscription_url}`
    : null;
  const links: Record<string, string | null> = { happ: happLink || null, incy: incyLink };

  const supportsInvoxyApp = ['android', 'windows', 'macos'].includes(detectUserOS());

  return (
    <div className="flex w-full flex-col gap-2.5">
      <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h3 className="text-[17px] font-bold text-ink">Быстрое подключение</h3>
          <p className="mt-0.5 text-[11px] text-muted">
            Первый раз? Откройте «Все устройства» для инструкции.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="flex shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap text-xs font-bold text-mint hover:underline"
        >
          <Smartphone size={14} /> Все устройства →
        </button>
      </div>

      <div className="glass-panel motion-card flex flex-col gap-2 rounded-[26px] p-3">
        {/* Primary Options: HAPP and INCY */}
        <div className="grid w-full gap-2 2xl:grid-cols-2">
          {options.map((opt) => {
            const href = links[opt.id];
            return (
              <button
                key={opt.id}
                type="button"
                disabled={!href}
                onClick={() => {
                  if (href) openDeepLink(href);
                }}
                className={`glass-control flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl px-3 text-center text-[13px] font-bold text-mint transition-colors hover:border-mint/30 hover:bg-white/[.06] active:scale-[0.98] lg:h-10 lg:text-xs lg:font-semibold lg:text-ink ${href ? '' : 'cursor-not-allowed opacity-50'}`}
              >
                <span className="flex h-5 shrink-0 items-center">
                  <img src={opt.icon} alt="" className="h-4 w-auto max-w-12 object-contain" />
                </span>
                {opt.label}
              </button>
            );
          })}
        </div>

        {/* Secondary Option: Invoxy VPN Native App (shown after Happ/Incy, hidden on iOS) */}
        {supportsInvoxyApp && (
          <button
            type="button"
            onClick={() => setAppConnectOpen(true)}
            className="flex min-h-10 w-full cursor-pointer flex-col items-start justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-left text-xs font-medium text-ink transition-all hover:border-mint/30 hover:bg-white/[0.08] active:scale-[0.98] md:flex-row md:items-center md:justify-between md:gap-3 md:py-2"
          >
            <div className="flex min-w-0 items-center gap-2">
              <Zap size={14} className="shrink-0 text-mint" />
              <span className="whitespace-nowrap font-semibold text-ink">
                Приложение Invoxy VPN
              </span>
            </div>
            <span className="max-w-full whitespace-nowrap rounded-full border border-mint/30 bg-mint/15 px-2 py-0.5 text-[9px] font-bold uppercase text-mint md:text-[10px]">
              Android · Windows · macOS
            </span>
          </button>
        )}
      </div>

      <ConnectDeviceModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        accessLink={connection?.subscription_url}
        happLink={happLink}
        incyLink={incyLink}
      />

      <AppConnectModal open={appConnectOpen} onClose={() => setAppConnectOpen(false)} />
    </div>
  );
}
