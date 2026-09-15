import { useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router';
import {
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Layers,
  Plus,
} from '@/invoxystart/components/ui/RuneIcon';
import { subscriptionApi } from '@/invoxystart/api';
import {
  AccountPage,
  AccountPanel,
  EmptyState,
  ErrorState,
  LoadingState,
  formatDate,
} from '@/invoxystart/components/account/AccountPrimitives';

type SubscriptionItem = {
  id: number;
  tariff_name?: string | null;
  status?: string | null;
  is_trial?: boolean;
  is_daily?: boolean;
  is_daily_paused?: boolean;
  autopay_enabled?: boolean;
  traffic_limit_gb?: number | null;
  traffic_used_gb?: number | null;
  device_limit?: number | null;
  end_date?: string | null;
  connected_squads?: string[] | null;
};

function statusLabel(item: SubscriptionItem) {
  if (item.is_trial) return 'Пробный период';
  if (item.is_daily_paused) return 'Приостановлена';
  if (item.status === 'active' || !item.status) return 'Активна';
  if (item.status === 'limited') return 'Ограничена';
  if (item.status === 'expired') return 'Завершена';
  return item.status;
}

function statusClass(item: SubscriptionItem) {
  return item.status === 'expired' ? 'bg-red-300/15 text-red-200' : 'bg-mint text-bg';
}

export default function SubscriptionsPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<SubscriptionItem[]>([]);
  const [multiTariffEnabled, setMultiTariffEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await subscriptionApi.getSubscriptions();
      setItems(
        Array.isArray(result?.subscriptions) ? (result.subscriptions as SubscriptionItem[]) : [],
      );
      setMultiTariffEnabled(Boolean(result?.multi_tariff_enabled));
    } catch {
      setError('Не удалось загрузить подписки');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <AccountPage title="Мои подписки" subtitle="Все тарифы и подключённые сервисы">
      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={() => void load()} />
      ) : items.length === 0 ? (
        <EmptyState
          title="Нет подписок"
          description="Выберите тариф, чтобы подключить Invoxy."
          action={
            <button
              type="button"
              onClick={() => navigate('/tariffs')}
              className="button-lift rounded-full bg-mint px-6 py-3 text-sm font-bold text-bg"
            >
              Посмотреть тарифы
            </button>
          }
        />
      ) : (
        <div className="grid gap-5 xl:grid-cols-2">
          {items.map((item) => {
            const traffic =
              item.traffic_limit_gb && item.traffic_limit_gb > 0
                ? Math.min(100, ((item.traffic_used_gb ?? 0) / item.traffic_limit_gb) * 100)
                : 0;
            return (
              <button
                type="button"
                key={item.id}
                onClick={() => navigate(`/subscriptions/${item.id}`)}
                className="glass-panel motion-card group rounded-[30px] p-5 text-left lg:p-7"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="glass-control grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-mint">
                      <Layers size={19} />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-lg font-medium">
                        {item.tariff_name || `Подписка #${item.id}`}
                      </p>
                      <p className="mt-1 text-xs text-muted">ID {item.id}</p>
                    </div>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-3 py-1.5 text-[10px] font-bold ${statusClass(item)}`}
                  >
                    {statusLabel(item)}
                  </span>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
                  <Metric
                    icon={<CalendarDays size={15} />}
                    label="До"
                    value={formatDate(item.end_date)}
                  />
                  <Metric
                    icon={<CheckCircle2 size={15} />}
                    label="Автопродление"
                    value={item.autopay_enabled ? 'Включено' : 'Выключено'}
                  />
                  <Metric
                    label="Трафик"
                    value={
                      item.traffic_limit_gb
                        ? `${item.traffic_used_gb ?? 0} / ${item.traffic_limit_gb} ГБ`
                        : 'Безлимит'
                    }
                  />
                  <Metric
                    label="Устройства"
                    value={item.device_limit ? `${item.device_limit} макс.` : '—'}
                  />
                </div>
                {item.traffic_limit_gb ? (
                  <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-mint" style={{ width: `${traffic}%` }} />
                  </div>
                ) : null}
                <div className="mt-5 flex items-center justify-end gap-1 text-xs font-bold text-mint">
                  Управление{' '}
                  <ChevronRight
                    size={14}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </div>
              </button>
            );
          })}
          {multiTariffEnabled && (
            <AccountPanel className="flex min-h-44 items-center justify-center border-dashed">
              <Link
                to="/tariffs?mode=add"
                className="flex min-h-16 items-center gap-2 rounded-full px-6 text-sm font-bold text-mint"
              >
                <Plus size={18} /> Подключить ещё тариф
              </Link>
            </AccountPanel>
          )}
        </div>
      )}
    </AccountPage>
  );
}

function Metric({ icon, label, value }: { icon?: ReactNode; label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-2xl bg-white/5 px-3 py-3">
      <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-[.1em] text-muted">
        {icon}
        {label}
      </p>
      <p className="mt-1 truncate font-medium">{value}</p>
    </div>
  );
}

export { SubscriptionsPage };
