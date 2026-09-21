import { useState } from 'react';
import type { ConnectionLinkResponse } from '@/invoxystart/api/subscription';
import { ConnectDeviceModal } from '@/invoxystart/components/connection/ConnectDeviceModal';
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

  return (
    <div className="flex w-full flex-col gap-2.5">
      <div className="flex items-center justify-between">
        <h3 className="text-[17px] font-bold text-ink">Быстрое подключение</h3>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-1.5 text-xs font-bold text-mint hover:underline cursor-pointer"
        >
          <Smartphone size={14} /> Все устройства →
        </button>
      </div>

      <div className="glass-panel motion-card flex flex-col gap-2 rounded-[26px] p-3">
        {/* Primary Option: Invoxy VPN Native App */}
        <button
          type="button"
          onClick={() => setAppConnectOpen(true)}
          className="flex h-11 w-full cursor-pointer items-center justify-between gap-2 rounded-xl border border-mint/50 bg-mint/15 px-3.5 text-xs font-bold text-mint transition-all hover:bg-mint/25 hover:border-mint active:scale-[0.98] shadow-[0_0_15px_rgba(165,232,196,0.15)]"
        >
          <div className="flex items-center gap-2">
            <Zap size={16} className="text-mint animate-pulse" />
            <span className="text-ink font-bold">Приложение Invoxy VPN</span>
          </div>
          <span className="rounded-full bg-mint px-2 py-0.5 text-[10px] font-extrabold text-bg uppercase">
            Вход в 1 клик
          </span>
        </button>

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
                className={`glass-control flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-xl px-3 text-center text-xs font-semibold text-ink transition-colors hover:border-mint/30 hover:bg-white/[.06] active:scale-[0.98] ${href ? '' : 'cursor-not-allowed opacity-50'}`}
              >
                <span className="flex h-5 shrink-0 items-center">
                  <img src={opt.icon} alt="" className="h-4 w-auto max-w-12 object-contain" />
                </span>
                {opt.label}
              </button>
            );
          })}
        </div>
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
