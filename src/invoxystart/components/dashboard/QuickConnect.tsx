import type { ConnectionLinkResponse } from '@/invoxystart/api/subscription';

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
  const happLink =
    connection?.happ_redirect_link ||
    connection?.happ_scheme_link ||
    connection?.happ_link ||
    connection?.happ_cryptolink ||
    connection?.happ_crypto_link;
  const incyLink = connection?.subscription_url
    ? `incy://import/${connection.subscription_url}`
    : null;
  const links: Record<string, string | null> = { happ: happLink || null, incy: incyLink };

  return (
    <div className="flex w-full flex-col gap-2.5">
      <h3 className="text-[17px] font-bold text-ink">Быстрое подключение</h3>
      <div className="glass-panel motion-card grid w-full gap-2 rounded-[26px] p-3 2xl:grid-cols-2">
        {options.map((opt) => {
          const href = links[opt.id];
          return (
            <a
              key={opt.id}
              href={href || undefined}
              aria-disabled={!href}
              onClick={(event) => {
                if (!href) event.preventDefault();
              }}
              className={`glass-control flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-xl px-3 text-center text-xs font-semibold text-ink transition-colors hover:border-mint/30 hover:bg-white/[.06] active:scale-[0.98] ${href ? '' : 'cursor-not-allowed opacity-50'}`}
            >
              <span className="flex h-5 shrink-0 items-center">
                <img src={opt.icon} alt="" className="h-4 w-auto max-w-12 object-contain" />
              </span>
              {opt.label}
            </a>
          );
        })}
      </div>
    </div>
  );
}
