import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router';
import { QRCodeSVG } from 'qrcode.react';
import { CalendarDays, Copy, Link2, X } from '@/invoxystart/components/ui/RuneIcon';
import { subscriptionApi } from '@/invoxystart/api';
import { useToast } from '@/invoxystart/components/layout/ToastProvider';
import {
  AccountPage,
  AccountPanel,
  ErrorState,
  LoadingState,
  Toggle,
  copyText,
  formatDate,
} from '@/invoxystart/components/account/AccountPrimitives';
import { RenewalCard } from '@/invoxystart/components/dashboard/RenewalCard';
import { DevicesCard } from '@/invoxystart/components/dashboard/DevicesCard';

type Detail = {
  id: number;
  tariff_name?: string | null;
  status?: string | null;
  is_trial?: boolean;
  is_daily?: boolean;
  is_daily_paused?: boolean;
  autopay_enabled?: boolean;
  autopay_days_before?: number;
  traffic_limit_gb?: number | null;
  traffic_used_gb?: number | null;
  whitelist_traffic_limit_gb?: number | null;
  whitelist_traffic_used_gb?: number | null;
  device_limit?: number | null;
  end_date?: string | null;
  start_date?: string | null;
  connected_squads?: string[] | null;
  subscription_url?: string | null;
};

type Connection = {
  subscription_url?: string | null;
  display_link?: string | null;
  happ_redirect_link?: string | null;
  instructions?: { steps?: string[] };
};

type Device = {
  hwid: string;
  platform?: string;
  device_model?: string;
  local_name?: string | null;
  created_at?: string | null;
};
type RenewalOption = {
  period_days: number;
  price_kopeks?: number;
  price_rubles?: number;
  discount_percent?: number;
  is_highlighted?: boolean;
};

function asResult<T>(result: PromiseSettledResult<T>) {
  return result.status === 'fulfilled' ? result.value : undefined;
}

export default function SubscriptionManagePage() {
  const { subscriptionId } = useParams<{ subscriptionId: string }>();
  const id = Number(subscriptionId);
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [detail, setDetail] = useState<Detail | null>(null);
  const [connection, setConnection] = useState<Connection | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [renewalOptions, setRenewalOptions] = useState<RenewalOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [autopay, setAutopay] = useState(false);
  const [hasMultiple, setHasMultiple] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const load = useCallback(async () => {
    if (!Number.isInteger(id) || id < 1) {
      setError('Некорректный идентификатор подписки');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    const result = await Promise.allSettled([
      subscriptionApi.getSubscriptionById(id),
      subscriptionApi.getConnectionLink(id),
      subscriptionApi.getDevices(id),
      subscriptionApi.getRenewalOptions(id),
      subscriptionApi.getSubscriptions(),
    ]);
    const nextDetail = asResult(result[0]) as Detail | undefined;
    if (!nextDetail) {
      setError('Не удалось загрузить подписку');
      setLoading(false);
      return;
    }
    setDetail(nextDetail);
    setAutopay(Boolean(nextDetail.autopay_enabled));
    setConnection((asResult(result[1]) as Connection | undefined) ?? null);
    const deviceResult = asResult(result[2]) as { devices?: Device[] } | undefined;
    setDevices(Array.isArray(deviceResult?.devices) ? deviceResult.devices : []);
    setRenewalOptions((asResult(result[3]) as RenewalOption[] | undefined) ?? []);
    const subscriptions = asResult(result[4]) as
      | { subscriptions?: unknown[]; multi_tariff_enabled?: boolean }
      | undefined;
    setHasMultiple(
      Boolean(
        subscriptions?.multi_tariff_enabled && (subscriptions.subscriptions?.length ?? 0) > 1,
      ),
    );
    setLoading(false);
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const accessLink = useMemo(
    () =>
      connection?.subscription_url || connection?.display_link || detail?.subscription_url || '',
    [connection, detail],
  );

  async function copyLink() {
    if (!accessLink) return;
    try {
      await copyText(accessLink);
      showToast('Ссылка скопирована');
    } catch {
      showToast('Не удалось скопировать ссылку');
    }
  }

  async function toggleAutopay(value: boolean) {
    setBusy('autopay');
    try {
      const result = await subscriptionApi.updateAutopay(
        value,
        detail?.autopay_days_before ?? 3,
        id,
      );
      setAutopay(Boolean(result.autopay_enabled ?? value));
      showToast(value ? 'Автопродление включено' : 'Автопродление выключено');
    } catch {
      showToast('Не удалось изменить автопродление');
    } finally {
      setBusy(null);
    }
  }

  async function renew(periodDays: number) {
    setBusy(`renew-${periodDays}`);
    try {
      await subscriptionApi.renewSubscription(periodDays, id);
      showToast('Подписка продлена');
      await load();
    } catch {
      showToast('Не удалось продлить подписку');
    } finally {
      setBusy(null);
    }
  }

  async function removeDevice(hwid: string) {
    setBusy(`device-${hwid}`);
    try {
      await subscriptionApi.deleteDevice(hwid, id);
      setDevices((current) => current.filter((item) => item.hwid !== hwid));
      showToast('Устройство отключено');
    } catch {
      showToast('Не удалось отключить устройство');
    } finally {
      setBusy(null);
    }
  }

  if (loading)
    return (
      <AccountPage title="Подписка" subtitle="Загрузка данных">
        <LoadingState />
      </AccountPage>
    );
  if (error || !detail)
    return (
      <AccountPage title="Подписка" subtitle="Управление подпиской">
        <ErrorState message={error || 'Подписка не найдена'} onRetry={() => void load()} />
      </AccountPage>
    );

  const traffic =
    detail.traffic_limit_gb && detail.traffic_limit_gb > 0
      ? Math.min(100, ((detail.traffic_used_gb ?? 0) / detail.traffic_limit_gb) * 100)
      : 0;

  return (
    <AccountPage
      title={detail.tariff_name || `Подписка #${detail.id}`}
      subtitle="Управление подключением и оплатой"
    >
      <div className="flex items-center justify-between gap-3 -mt-2">
        <button
          type="button"
          onClick={() => navigate(hasMultiple ? '/subscriptions' : '/dashboard')}
          className="text-xs font-bold text-mint"
        >
          ← {hasMultiple ? 'Все подписки' : 'Главная'}
        </button>
        <span className="rounded-full bg-mint px-3 py-1.5 text-[10px] font-bold text-bg">
          {detail.status === 'expired'
            ? 'Завершена'
            : detail.is_trial
              ? 'Пробный период'
              : 'Активна'}
        </span>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(310px,.85fr)]">
        <div className="flex min-w-0 flex-col gap-5">
          <AccountPanel
            title="Состояние подписки"
            description="Текущие параметры тарифа"
            className="bg-[linear-gradient(90deg,rgba(12,16,17,.97)_0%,rgba(12,16,17,.9)_58%,rgba(12,16,17,.5)_100%),url('/images/subscription-status-bg.webp')] bg-cover bg-right"
          >
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <DataRow
                icon={<CalendarDays size={16} />}
                label="Действует до"
                value={formatDate(detail.end_date)}
              />
              <DataRow
                label="Устройства"
                value={`${devices.length} / ${detail.device_limit ?? '—'}`}
              />
              <DataRow
                label="Трафик"
                value={
                  detail.traffic_limit_gb
                    ? `${detail.traffic_used_gb ?? 0} / ${detail.traffic_limit_gb} ГБ`
                    : 'Безлимит'
                }
              />
              <DataRow
                label="LTE-трафик"
                value={
                  detail.whitelist_traffic_limit_gb
                    ? `${detail.whitelist_traffic_used_gb ?? 0} / ${detail.whitelist_traffic_limit_gb} ГБ`
                    : 'Не включён'
                }
              />
            </div>
            {detail.traffic_limit_gb ? (
              <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-mint" style={{ width: `${traffic}%` }} />
              </div>
            ) : null}
          </AccountPanel>

          <AccountPanel
            title="Ключ доступа"
            description="Добавьте эту ссылку в приложение для подключения"
          >
            <div className="mt-5 flex items-center gap-2">
              <div className="glass-control flex h-12 min-w-0 flex-1 items-center truncate rounded-2xl px-4 font-mono text-xs leading-none text-muted">
                {accessLink || 'Ссылка пока недоступна'}
              </div>
              <button
                type="button"
                disabled={!accessLink}
                onClick={() => void copyLink()}
                className="button-lift grid h-12 w-12 shrink-0 place-items-center rounded-full bg-mint text-bg disabled:opacity-40"
                aria-label="Копировать ссылку"
              >
                <Copy size={17} />
              </button>
            </div>
            <div className="mt-3 glass-panel motion-card grid gap-2 rounded-[26px] p-3 2xl:grid-cols-2">
              {connection?.happ_redirect_link ? (
                <a
                  href={connection.happ_redirect_link}
                  target="_blank"
                  rel="noreferrer"
                  className="glass-control flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-xl px-3 text-center text-xs font-semibold text-ink transition-colors hover:border-mint/30 hover:bg-white/[.06] active:scale-[0.98]"
                >
                  <span className="flex h-5 shrink-0 items-center">
                    <img
                      src="/images/apps/happ.png"
                      alt=""
                      className="h-4 w-auto max-w-12 object-contain"
                    />
                  </span>
                  Подключить в HAPP
                </a>
              ) : null}
              {accessLink ? (
                <a
                  href={`incy://import/${accessLink}`}
                  className="glass-control flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-xl px-3 text-center text-xs font-semibold text-ink transition-colors hover:border-mint/30 hover:bg-white/[.06] active:scale-[0.98]"
                >
                  <span className="flex h-5 shrink-0 items-center">
                    <img
                      src="/images/apps/incy.png"
                      alt=""
                      className="h-4 w-auto max-w-12 object-contain"
                    />
                  </span>
                  Подключить в INCY
                </a>
              ) : null}
            </div>
            <button
              type="button"
              disabled={!accessLink}
              aria-expanded={qrOpen}
              onClick={() => setQrOpen((open) => !open)}
              className="mt-5 w-full cursor-pointer rounded-2xl bg-white/5 p-4 text-left disabled:cursor-not-allowed disabled:opacity-40"
            >
              <span className="flex items-center gap-2 text-xs font-bold text-mint">
                <Link2 size={15} /> QR-код
              </span>
              <span className="mt-2 block text-xs text-muted">
                {qrOpen
                  ? 'Нажмите, чтобы скрыть QR-код'
                  : 'Нажмите, чтобы показать QR-код на другом устройстве'}
              </span>
              {qrOpen && (
                <span className="mt-4 grid place-items-center">
                  <QRCodeSVG
                    value={accessLink}
                    size={208}
                    bgColor="#f3f1ec"
                    fgColor="#0b0c0e"
                    includeMargin
                    aria-label="QR-код ссылки подписки"
                  />
                </span>
              )}
            </button>
            {connection?.instructions?.steps?.length ? (
              <ol className="mt-5 list-decimal space-y-2 pl-5 text-sm text-muted">
                {connection.instructions.steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            ) : null}
          </AccountPanel>

          <DevicesCard
            devices={devices.map((device) => ({
              id: device.hwid,
              name: device.local_name || device.device_model || 'Устройство',
              status: `${device.platform || 'Неизвестная платформа'} · ${device.hwid}`,
              platform: device.platform,
              timestamp: formatDate(device.created_at),
            }))}
            deviceLimit={detail.device_limit}
            onRemove={(device) => removeDevice(device.id)}
          />
        </div>

        <div className="flex min-w-0 flex-col gap-5">
          <AccountPanel
            title="Автопродление"
            description="Продлевайте подписку автоматически до окончания срока"
          >
            <div className="mt-5 flex items-center justify-between gap-3 rounded-2xl bg-white/5 p-4">
              <div>
                <p className="text-sm font-medium">Автопродление тарифа</p>
                <p className="mt-1 text-xs text-muted">
                  За {detail.autopay_days_before ?? 3} дня до окончания
                </p>
              </div>
              <Toggle
                checked={autopay}
                disabled={busy === 'autopay'}
                onChange={(value) => void toggleAutopay(value)}
                label="Автопродление"
              />
            </div>
            <p className="mt-3 text-xs text-muted">
              Для списания используется сохранённый способ оплаты. Управление картами — в разделе
              «Сохранённые карты».
            </p>
          </AccountPanel>

          {renewalOptions.length ? (
            <RenewalCard
              title={detail.tariff_name || 'Подписка'}
              subtitle={`${detail.traffic_limit_gb ?? '∞'} ГБ · ${detail.whitelist_traffic_limit_gb ?? 0} ГБ LTE · до ${detail.device_limit ?? '—'} устройств`}
              showTariffs={false}
              terms={renewalOptions.map((option) => ({
                id: String(option.period_days),
                label: `${option.period_days} дней`,
                price: option.price_rubles ?? (option.price_kopeks ?? 0) / 100,
                discount: option.discount_percent,
              }))}
              onPay={(_, __, period) => void renew(Number(period))}
            />
          ) : null}

          <AccountPanel title="Опасная зона">
            <button
              type="button"
              onClick={() => showToast('Удаление подписки доступно через поддержку')}
              className="mt-4 flex w-full items-center justify-between rounded-2xl border border-red-300/20 bg-red-300/5 px-4 py-3 text-left text-sm text-red-200"
            >
              <span className="flex items-center gap-2">
                <X size={16} /> Удалить подписку
              </span>
              <span className="text-xs text-red-200/60">Обратитесь в поддержку</span>
            </button>
          </AccountPanel>
        </div>
      </div>
    </AccountPage>
  );
}

function DataRow({ icon, label, value }: { icon?: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/5 px-3 py-3">
      <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-[.1em] text-muted">
        {icon}
        {label}
      </p>
      <p className="mt-1 truncate text-sm font-medium">{value}</p>
    </div>
  );
}

export { SubscriptionManagePage };
