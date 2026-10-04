import { Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { appApi, APP_PLATFORMS, detectAppPlatform } from '@/invoxystart/api/app';
import { Smartphone, Zap } from '@/invoxystart/components/ui/RuneIcon';

export function QuickConnect() {
  const { data } = useQuery({
    queryKey: ['invoxy-app-config'],
    queryFn: appApi.getConfig,
    staleTime: 10 * 60_000,
  });
  const platform = detectAppPlatform();
  const download = platform ? data?.links.downloads[platform] : null;
  const platformLabel = APP_PLATFORMS.find((p) => p.key === platform)?.label;

  return (
    <div className="flex w-full flex-col gap-2.5">
      <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h3 className="text-[17px] font-bold text-ink">Приложение Invoxy VPN</h3>
          <p className="mt-0.5 text-[11px] text-muted">
            Вход через кабинет или Telegram — ключ вводить не нужно.
          </p>
        </div>
        <Link
          to="/app"
          className="flex shrink-0 items-center gap-1.5 whitespace-nowrap text-xs font-bold text-mint hover:underline"
        >
          <Smartphone size={14} /> Все устройства →
        </Link>
      </div>

      <div className="glass-panel motion-card flex flex-col gap-2 rounded-[26px] p-3">
        {download ? (
          <a
            href={download}
            target="_blank"
            rel="noopener noreferrer"
            className="glass-control flex h-11 w-full items-center justify-center gap-2 rounded-xl px-3 text-[13px] font-bold text-mint transition-colors hover:border-mint/30 hover:bg-white/[.06] active:scale-[0.98]"
          >
            <Zap size={14} /> Скачать для {platformLabel}
          </a>
        ) : (
          <Link
            to="/app"
            className="glass-control flex h-11 w-full items-center justify-center gap-2 rounded-xl px-3 text-[13px] font-bold text-mint transition-colors hover:border-mint/30 hover:bg-white/[.06] active:scale-[0.98]"
          >
            <Zap size={14} /> Как подключить устройство
          </Link>
        )}
        <p className="px-1 text-[11px] leading-relaxed text-muted">
          В приложении нажмите «Войти через сайт» и подтвердите вход на этой странице.
        </p>
      </div>
    </div>
  );
}
