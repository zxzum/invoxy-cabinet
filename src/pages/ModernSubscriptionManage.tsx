import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Navigate, useNavigate, useParams } from 'react-router';
import { QRCodeSVG } from 'qrcode.react';
import { openLink as sdkOpenLink } from '@telegram-apps/sdk-react';

import { CalendarIcon, CopyIcon, ScanIcon, XIcon } from '@/components/icons';
import { Switch } from '@/components/primitives/Switch/Switch';
import LunaDevicesCard from '@/components/dashboard/luna/active/LunaDevicesCard';
import LunaRenewalCard from '@/components/dashboard/luna/active/LunaRenewalCard';
import { subscriptionApi } from '@/api/subscription';
import type { Device, RenewalOption } from '@/types';
import { copyToClipboard } from '@/utils/clipboard';
import { isInTelegramWebApp } from '@/hooks/useTelegramSDK';
import { openAppScheme } from '@/utils/openAppScheme';
import { isHappCryptolinkMode, resolveConnectionUrlForUi } from '@/utils/connectionLink';
import { uiLocale } from '@/utils/uiLocale';
import { useDestructiveConfirm } from '@/platform/hooks/useNativeDialog';
import { useToast } from '@/components/Toast';

type ConnectionData = Awaited<ReturnType<typeof subscriptionApi.getConnectionLink>>;

function formatDate(value: string | null | undefined, locale: string) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatGb(value: number | null | undefined) {
  return (value ?? 0).toLocaleString(uiLocale(), { maximumFractionDigits: 1 });
}

function Panel({
  title,
  description,
  children,
  className = '',
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`glass-panel motion-card rounded-[28px] p-4 sm:p-5 ${className}`}>
      <h2 className="text-lg font-semibold text-dark-50">{title}</h2>
      {description && <p className="mt-1 text-xs text-dark-400">{description}</p>}
      {children}
    </section>
  );
}

function DataRow({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-white/5 px-3 py-3">
      <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-[.1em] text-dark-400">
        {icon}
        {label}
      </p>
      <p className="mt-1 truncate text-sm font-medium text-dark-50">{value}</p>
    </div>
  );
}

function ConnectionPanel({
  accessLink,
  qrLink,
  happLink,
  incyLink,
  instructions,
  isLoading,
  error,
  onCopy,
  onOpen,
}: {
  accessLink: string | null;
  qrLink: string | null;
  happLink: string | null;
  incyLink: string | null;
  instructions: string[];
  isLoading: boolean;
  error: boolean;
  onCopy: () => void;
  onOpen: (url: string) => void;
}) {
  const { t } = useTranslation();
  const [qrOpen, setQrOpen] = useState(false);

  return (
    <Panel
      title={t('dashboard.luna.connection.title', 'Ключ доступа')}
      description={t(
        'modernSubscription.connectionDescription',
        'Добавьте эту ссылку в приложение для подключения',
      )}
    >
      <div className="mt-5 flex items-center gap-2">
        <code className="glass-control flex h-12 min-w-0 flex-1 items-center truncate rounded-2xl px-4 text-xs text-dark-400">
          {isLoading
            ? t('common.loading', 'Загрузка…')
            : accessLink || t('dashboard.luna.connection.empty', 'Ссылка подписки недоступна')}
        </code>
        <button
          type="button"
          disabled={!accessLink}
          onClick={onCopy}
          className="button-lift grid h-12 w-12 shrink-0 place-items-center rounded-full bg-accent-400 text-on-accent disabled:cursor-not-allowed disabled:opacity-40"
          aria-label={t('dashboard.luna.connection.copy', 'Скопировать ключ')}
        >
          <CopyIcon className="h-5 w-5" />
        </button>
      </div>

      {error && (
        <p role="alert" className="mt-3 rounded-xl bg-error-500/10 p-3 text-xs text-error-300">
          {t('dashboard.luna.connection.error', 'Не удалось загрузить данные подключения')}
        </p>
      )}

      <div className="glass-panel motion-card mt-3 grid gap-2 rounded-[26px] p-3 2xl:grid-cols-2">
        {happLink && (
          <button
            type="button"
            onClick={() => onOpen(happLink)}
            className="glass-control flex h-10 w-full items-center justify-center gap-2 rounded-xl px-3 text-center text-xs font-semibold text-dark-200 transition-colors hover:border-accent-400/30 hover:text-accent-300"
          >
            <span className="luna-app-happ h-5 w-5 shrink-0" aria-hidden="true" />
            {t('dashboard.luna.connection.happ', 'Подключить в HAPP')}
          </button>
        )}
        {incyLink && (
          <button
            type="button"
            onClick={() => onOpen(incyLink)}
            className="glass-control flex h-10 w-full items-center justify-center gap-2 rounded-xl px-3 text-center text-xs font-semibold text-dark-200 transition-colors hover:border-accent-400/30 hover:text-accent-300"
          >
            <span className="luna-app-incy h-5 w-5 shrink-0" aria-hidden="true" />
            {t('dashboard.luna.connection.incy', 'Подключить в INCY')}
          </button>
        )}
      </div>

      <button
        type="button"
        disabled={!qrLink}
        aria-expanded={qrOpen}
        onClick={() => setQrOpen((value) => !value)}
        className="mt-4 flex w-full items-center justify-between rounded-2xl bg-white/5 px-4 py-3 text-left text-xs font-semibold text-accent-300 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <span className="flex items-center gap-2">
          <ScanIcon className="h-4 w-4" />
          {t('subscription.showQR', 'Показать QR-код')}
        </span>
        <span className="text-dark-400">{qrOpen ? '−' : '+'}</span>
      </button>
      {qrOpen && qrLink && (
        <div className="mt-4 grid place-items-center rounded-2xl bg-white p-4">
          <QRCodeSVG value={qrLink} size={220} level="M" includeMargin={false} />
        </div>
      )}
      {instructions.length > 0 && (
        <ol className="mt-4 list-decimal space-y-1.5 pl-5 text-xs text-dark-400">
          {instructions.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      )}
    </Panel>
  );
}

export default function ModernSubscriptionManage() {
  const { subscriptionId } = useParams<{ subscriptionId: string }>();
  const id = Number(subscriptionId);
  const validId = Number.isInteger(id) && id > 0;
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const confirmDelete = useDestructiveConfirm();
  const [autopay, setAutopay] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<number | null>(null);
  const [removingHwid, setRemovingHwid] = useState<string | null>(null);

  const detailQuery = useQuery({
    queryKey: ['subscription', id],
    queryFn: () => subscriptionApi.getSubscription(id),
    enabled: validId,
    retry: false,
    staleTime: 0,
    refetchOnMount: 'always',
  });
  const connectionQuery = useQuery({
    queryKey: ['connection-link', id],
    queryFn: () => subscriptionApi.getConnectionLink(id),
    enabled: validId,
    retry: false,
    staleTime: 0,
  });
  const devicesQuery = useQuery({
    queryKey: ['devices', id],
    queryFn: () => subscriptionApi.getDevices(id),
    enabled: validId,
    retry: false,
    staleTime: 30_000,
  });
  const renewalQuery = useQuery({
    queryKey: ['renewal-options', id],
    queryFn: () => subscriptionApi.getRenewalOptions(id),
    enabled: validId,
    retry: false,
    staleTime: 30_000,
  });
  const subscriptionsQuery = useQuery({
    queryKey: ['subscriptions-list'],
    queryFn: () => subscriptionApi.getSubscriptions(),
    enabled: validId,
    retry: false,
    staleTime: 30_000,
  });

  const subscription = detailQuery.data?.subscription ?? null;
  const connection = connectionQuery.data as ConnectionData | undefined;
  useEffect(() => {
    setAutopay(Boolean(subscription?.autopay_enabled));
  }, [subscription?.autopay_enabled]);
  const hasMultiple = Boolean(
    subscriptionsQuery.data?.multi_tariff_enabled &&
      (subscriptionsQuery.data.subscriptions?.length ?? 0) > 1,
  );

  const accessLink = useMemo(() => {
    if (subscription?.hide_subscription_link || connection?.hide_link) {
      return null;
    }
    return (
      connection?.subscription_url ??
      connection?.display_link ??
      subscription?.subscription_url ??
      null
    );
  }, [connection, subscription]);
  const qrLink = useMemo(
    () =>
      resolveConnectionUrlForUi({
        mode: connection?.connect_mode,
        happSchemeLink: connection?.happ_scheme_link,
        displayLink: connection?.display_link,
        subscriptionUrl: connection?.subscription_url,
        happCryptLink: connection?.happ_cryptolink,
        happCryptoLink: connection?.happ_crypto_link,
        happLink: connection?.happ_link,
        fallbackUrl: accessLink,
      }),
    [accessLink, connection],
  );
  const happLink = useMemo(() => {
    if (!connection) return null;
    return isHappCryptolinkMode(connection.connect_mode)
      ? qrLink
      : (connection.happ_scheme_link ??
          connection.happ_redirect_link ??
          connection.happ_link ??
          null);
  }, [connection, qrLink]);
  const incyLink = accessLink ? `incy://import/${accessLink}` : null;
  const renewalOptions = renewalQuery.data ?? [];
  const effectivePeriod =
    selectedPeriod ??
    renewalOptions.find((option) => option.is_highlighted)?.period_days ??
    renewalOptions[0]?.period_days ??
    null;

  const autopayMutation = useMutation({
    mutationFn: (enabled: boolean) =>
      subscriptionApi.updateAutopay(enabled, subscription?.autopay_days_before ?? 3, id),
    onSuccess: (result) => {
      setAutopay(Boolean(result.autopay_enabled));
      queryClient.invalidateQueries({ queryKey: ['subscription', id] });
      queryClient.invalidateQueries({ queryKey: ['subscriptions-list'] });
      showToast({
        type: 'success',
        title: result.autopay_enabled
          ? t('modernSubscription.autopayEnabled', 'Автопродление включено')
          : t('modernSubscription.autopayDisabled', 'Автопродление выключено'),
        message: '',
      });
    },
    onError: () =>
      showToast({
        type: 'error',
        title: t('modernSubscription.autopayError', 'Не удалось изменить автопродление'),
        message: '',
      }),
  });
  const renewalMutation = useMutation({
    mutationFn: (periodDays: number) => subscriptionApi.renewSubscription(periodDays, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription', id] });
      queryClient.invalidateQueries({ queryKey: ['subscriptions-list'] });
      queryClient.invalidateQueries({ queryKey: ['renewal-options', id] });
      queryClient.invalidateQueries({ queryKey: ['balance'] });
      showToast({
        type: 'success',
        title: t('successNotification.subscriptionRenewed.title', 'Подписка продлена'),
        message: '',
      });
    },
    onError: () =>
      showToast({
        type: 'error',
        title: t('modernSubscription.renewalError', 'Не удалось продлить подписку'),
        message: '',
      }),
  });
  const removeDeviceMutation = useMutation({
    mutationFn: (hwid: string) => subscriptionApi.deleteDevice(hwid, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices', id] });
      setRemovingHwid(null);
      showToast({
        type: 'success',
        title: t('modernSubscription.deviceRemoved', 'Устройство отключено'),
        message: '',
      });
    },
    onError: () => {
      setRemovingHwid(null);
      showToast({
        type: 'error',
        title: t('modernSubscription.deviceError', 'Не удалось отключить устройство'),
        message: '',
      });
    },
  });
  const deleteMutation = useMutation({
    mutationFn: () => subscriptionApi.deleteSubscription(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions-list'] });
      showToast({
        type: 'success',
        title: t('modernSubscription.deleted', 'Подписка удалена'),
        message: '',
      });
      navigate('/subscriptions', { replace: true });
    },
    onError: () =>
      showToast({
        type: 'error',
        title: t('modernSubscription.deleteError', 'Не удалось удалить подписку'),
        message: '',
      }),
  });

  const openDeepLink = (url: string) => {
    if (isInTelegramWebApp()) {
      const target = /^https?:\/\//i.test(url)
        ? url
        : `${window.location.origin}/miniapp/redirect.html?url=${encodeURIComponent(url)}&lang=${i18n.language || 'en'}`;
      try {
        sdkOpenLink(target, { tryInstantView: false });
        return;
      } catch {
        // Browser fallback below.
      }
    }
    openAppScheme(url);
  };
  const handleCopy = () => {
    if (!accessLink) return;
    void copyToClipboard(accessLink)
      .then(() =>
        showToast({
          type: 'success',
          title: t('dashboard.luna.connection.copied', 'Ссылка скопирована'),
          message: '',
        }),
      )
      .catch(() =>
        showToast({
          type: 'error',
          title: t('modernSubscription.copyError', 'Не удалось скопировать ссылку'),
          message: '',
        }),
      );
  };
  const handleRemoveDevice = (device: Device) => {
    if (removeDeviceMutation.isPending) return;
    setRemovingHwid(device.hwid);
    removeDeviceMutation.mutate(device.hwid);
  };
  const handleDelete = async () => {
    if (deleteMutation.isPending) return;
    const confirmed = await confirmDelete(
      t('modernSubscription.deleteConfirm', 'Удалить эту подписку?'),
      t('modernSubscription.deleteAction', 'Удалить'),
    );
    if (confirmed) deleteMutation.mutate();
  };

  if (!validId) return <Navigate to="/subscriptions" replace />;

  if (detailQuery.isPending) {
    return (
      <div className="luna-dashboard space-y-6" role="status" aria-busy="true">
        <div className="glass-panel h-20 animate-pulse rounded-[28px]" />
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(310px,.85fr)]">
          <div className="glass-panel h-72 animate-pulse rounded-[28px]" />
          <div className="glass-panel h-72 animate-pulse rounded-[28px]" />
        </div>
      </div>
    );
  }

  if (detailQuery.isError || !subscription) {
    return (
      <div className="luna-dashboard space-y-5">
        <div className="glass-panel space-y-3 rounded-[28px] p-6 text-center" role="alert">
          <h1 className="text-xl font-semibold text-dark-50">
            {t('subscription.notFound', 'Подписка не найдена')}
          </h1>
          <p className="text-sm text-dark-400">
            {t('subscription.notFoundDesc', 'Возможно, подписка была удалена или не существует')}
          </p>
          <button
            type="button"
            onClick={() => void detailQuery.refetch()}
            className="btn-secondary min-h-10 px-4 py-2 text-xs"
          >
            {t('common.retry', 'Повторить')}
          </button>
        </div>
      </div>
    );
  }

  const isExpired =
    subscription.is_expired ||
    subscription.status === 'expired' ||
    subscription.status === 'disabled';
  const statusLabel = subscription.is_trial
    ? t('subscription.trialStatus', 'Пробный период')
    : isExpired
      ? t('subscription.expired', 'Истекла')
      : subscription.is_limited
        ? t('subscription.trafficLimited', 'Трафик исчерпан')
        : t('subscription.active', 'Активна');
  const trafficPercent =
    subscription.traffic_limit_gb > 0
      ? Math.min(100, (subscription.traffic_used_gb / subscription.traffic_limit_gb) * 100)
      : 0;
  const ltePercent =
    (subscription.whitelist_traffic_limit_gb ?? 0) > 0
      ? Math.min(
          100,
          ((subscription.whitelist_traffic_used_gb ?? 0) /
            (subscription.whitelist_traffic_limit_gb ?? 1)) *
            100,
        )
      : 0;
  const devices = (devicesQuery.data?.devices ?? []) as Device[];
  const instructions = connection?.instructions?.steps ?? [];
  const canDelete = isExpired && !subscription.is_trial;

  return (
    <div className="luna-dashboard space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[.14em] text-accent-300">
            {t('modernSubscription.eyebrow', 'Управление подпиской')}
          </p>
          <h1 className="mt-1 truncate text-[28px] font-medium leading-tight tracking-[-0.04em] text-dark-50 lg:text-[clamp(30px,2.2vw,44px)]">
            {subscription.tariff_name || t('subscription.title', 'Подписка')}
          </h1>
          <p className="mt-1 text-sm text-dark-400">
            {t('modernSubscription.subtitle', 'Подключение и оплата под контролем')}
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate(hasMultiple ? '/subscriptions' : '/dashboard')}
          className="rounded-full px-2 py-2 text-sm font-bold text-accent-300 transition-colors hover:text-accent-200"
        >
          ←{' '}
          {hasMultiple
            ? t('modernSubscription.allSubscriptions', 'Все подписки')
            : t('common.back', 'Назад')}
        </button>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(310px,.85fr)]">
        <div className="flex min-w-0 flex-col gap-5">
          <Panel
            title={t('modernSubscription.stateTitle', 'Состояние подписки')}
            description={t('modernSubscription.stateDescription', 'Текущие параметры тарифа')}
            className="luna-subscription-bg bg-cover bg-right"
          >
            <div className="mt-5 flex items-center gap-2">
              <span className="rounded-full bg-accent-400 px-3 py-1.5 text-[10px] font-bold text-on-accent">
                {statusLabel}
              </span>
              <span className="glass-control rounded-full px-3 py-1.5 text-[10px] font-bold text-dark-400">
                {subscription.tariff_name || `#${subscription.id}`}
              </span>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <DataRow
                icon={<CalendarIcon className="h-4 w-4" />}
                label={t('subscription.expiresAt', 'Действует до')}
                value={formatDate(subscription.end_date, i18n.language)}
              />
              <DataRow
                label={t('subscription.devices', 'Устройства')}
                value={`${devices.length} / ${subscription.device_limit === 0 ? '∞' : subscription.device_limit}`}
              />
              <DataRow
                label={t('dashboard.luna.traffic.regular', 'Основной трафик')}
                value={
                  subscription.traffic_limit_gb > 0
                    ? `${formatGb(subscription.traffic_used_gb)} / ${formatGb(subscription.traffic_limit_gb)} ГБ`
                    : t('subscription.unlimited', 'Безлимит')
                }
              />
              <DataRow
                label={t('dashboard.luna.traffic.lte', 'LTE-трафик')}
                value={
                  (subscription.whitelist_traffic_limit_gb ?? 0) > 0
                    ? `${formatGb(subscription.whitelist_traffic_used_gb)} / ${formatGb(subscription.whitelist_traffic_limit_gb)} ГБ`
                    : t('modernSubscription.notIncluded', 'Не включён')
                }
              />
            </div>
            {subscription.traffic_limit_gb > 0 && (
              <div className="mt-5 h-2 overflow-hidden rounded-full bg-dark-800/70">
                <div
                  className="h-full rounded-full bg-accent-400"
                  style={{ width: `${trafficPercent}%` }}
                />
              </div>
            )}
            {(subscription.whitelist_traffic_limit_gb ?? 0) > 0 && (
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-dark-800/70">
                <div
                  className="h-full rounded-full bg-accent-300"
                  style={{ width: `${ltePercent}%` }}
                />
              </div>
            )}
          </Panel>

          <LunaDevicesCard
            devices={devices}
            deviceLimit={subscription.device_limit}
            isLoading={devicesQuery.isPending}
            isRemovingHwid={removingHwid}
            errorMessage={
              devicesQuery.isError
                ? t('dashboard.luna.devices.error', 'Не удалось загрузить устройства')
                : undefined
            }
            onRetry={() => void devicesQuery.refetch()}
            retryLabel={t('common.retry', 'Повторить')}
            onRemoveDevice={handleRemoveDevice}
            formatDeviceDate={(date) => formatDate(date, i18n.language)}
            title={t('dashboard.luna.devices.title', 'Подключённые устройства')}
            disconnectLabel={t('dashboard.luna.devices.disconnect', 'Отключить')}
            emptyMessage={t('dashboard.luna.devices.empty', 'Нет подключённых устройств')}
          />
        </div>

        <div className="flex min-w-0 flex-col gap-5">
          <ConnectionPanel
            accessLink={accessLink}
            qrLink={qrLink}
            happLink={happLink}
            incyLink={incyLink}
            instructions={instructions}
            isLoading={connectionQuery.isPending}
            error={connectionQuery.isError}
            onCopy={handleCopy}
            onOpen={openDeepLink}
          />

          {!subscription.is_trial && !subscription.is_daily && (
            <Panel
              title={t('modernSubscription.autopayTitle', 'Автопродление')}
              description={t(
                'modernSubscription.autopayDescription',
                'Продлевайте подписку автоматически до окончания срока',
              )}
            >
              <div className="mt-5 flex items-center justify-between gap-3 rounded-2xl bg-white/5 p-4">
                <div>
                  <p className="text-sm font-medium text-dark-100">
                    {t('subscription.autoRenewal', 'Автопродление тарифа')}
                  </p>
                  <p className="mt-1 text-xs text-dark-400">
                    {t('subscription.daysBeforeExpiry', {
                      count: subscription.autopay_days_before,
                    })}
                  </p>
                </div>
                <Switch
                  checked={autopay}
                  disabled={autopayMutation.isPending}
                  onCheckedChange={(value) => autopayMutation.mutate(value)}
                  aria-label={t('subscription.autoRenewal', 'Автопродление')}
                />
              </div>
              <p className="mt-3 text-xs text-dark-400">
                {t('modernSubscription.autopayHint', 'Для списания используется баланс кабинета.')}
              </p>
            </Panel>
          )}

          <LunaRenewalCard
            options={renewalOptions}
            selectedPeriodDays={effectivePeriod}
            isLoading={renewalQuery.isPending}
            isSubmitting={renewalMutation.isPending}
            errorMessage={
              renewalQuery.isError
                ? t('dashboard.luna.renewal.error', 'Не удалось загрузить варианты продления')
                : undefined
            }
            onRetry={() => void renewalQuery.refetch()}
            retryLabel={t('common.retry', 'Повторить')}
            onSelect={(option: RenewalOption) => setSelectedPeriod(option.period_days)}
            onSubmit={(option: RenewalOption) => renewalMutation.mutate(option.period_days)}
            formatPrice={(option) =>
              `${option.price_rubles.toLocaleString(i18n.language)} ${t('common.currency')}`
            }
            formatPeriod={(days) => t('subscription.days', { count: days })}
            title={t('dashboard.luna.renewal.title', 'Быстрое продление')}
            submitLabel={t('dashboard.luna.renewal.submit', 'Продлить подписку')}
            emptyMessage={t('dashboard.luna.renewal.empty', 'Нет доступных вариантов продления')}
          />

          {canDelete && (
            <Panel title={t('modernSubscription.dangerTitle', 'Опасная зона')}>
              <button
                type="button"
                onClick={() => void handleDelete()}
                disabled={deleteMutation.isPending}
                className="mt-4 flex w-full items-center justify-between rounded-2xl border border-error-500/25 bg-error-500/10 px-4 py-3 text-left text-sm text-error-300 disabled:opacity-50"
              >
                <span className="flex items-center gap-2">
                  <XIcon className="h-4 w-4" />
                  {t('modernSubscription.deleteAction', 'Удалить подписку')}
                </span>
                <span className="text-xs text-error-300/60">
                  {t('modernSubscription.deleteHint', 'Действие необратимо')}
                </span>
              </button>
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
}

export { ModernSubscriptionManage };
