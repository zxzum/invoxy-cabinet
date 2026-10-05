import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, m } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Header } from '@/invoxystart/components/dashboard/Header';
import { SubscriptionCard } from '@/invoxystart/components/dashboard/SubscriptionCard';
import { TrafficCards } from '@/invoxystart/components/dashboard/TrafficCards';
import { DevicesCard } from '@/invoxystart/components/dashboard/DevicesCard';
import { ConnectPanel } from '@/invoxystart/components/dashboard/ConnectPanel';
import { RenewalCard, defaultTermId } from '@/invoxystart/components/dashboard/RenewalCard';
import { ActiveInvoiceCard } from '@/invoxystart/components/dashboard/ActiveInvoiceCard';
import { StartHero } from '@/invoxystart/components/dashboard/states/StartHero';
import { AccessEndedCard } from '@/invoxystart/components/dashboard/states/AccessEndedCard';
import { TrialUpgradeCard } from '@/invoxystart/components/dashboard/states/TrialUpgradeCard';
import { MoreSection } from '@/invoxystart/components/dashboard/states/MoreSection';
import { useToast } from '@/invoxystart/components/layout/ToastProvider';
import { useNavigate } from 'react-router';
import { usePayment } from '@/invoxystart/components/payments/PaymentFlow';
import { X } from '@/invoxystart/components/ui/RuneIcon';
import {
  ConnectDeviceModal,
  type PlatformKey,
} from '@/invoxystart/components/connection/ConnectDeviceModal';
import { subscriptionApi, type TrialInfo } from '@/invoxystart/api';
import { useAuth } from '@/invoxystart/auth';
import { useTranslation } from 'react-i18next';
import { migrationApi, type MigrationExecuteResult } from '@/api/migrationApi';
import { LazeikaMigrationModal } from '@/components/migration/LazeikaMigrationModal';
import { safeSession } from '@/utils/safeStorage';
import { PiSparkleFill, PiArrowRightBold } from 'react-icons/pi';
import { deriveAccountState } from '@/invoxystart/lib/accountState';
import { useRenewalBreakdown } from '@/invoxystart/lib/useRenewalBreakdown';

const DEVICES_COLLAPSED = 3;

export function DashboardPage() {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const { openPayment } = usePayment();
  const { user, refreshUser } = useAuth();
  const queryClient = useQueryClient();
  const [now, setNow] = useState(Date.now());

  // Check Lazeika migration eligibility (temporary seamless onboarding)
  const { data: migrationData } = useQuery({
    queryKey: ['migration-check'],
    queryFn: migrationApi.check,
    staleTime: 5 * 60 * 1000,
    retry: false,
    enabled: !!user,
  });

  const [isMigrationModalOpen, setIsMigrationModalOpen] = useState(false);
  const [migrationBannerHidden, setMigrationBannerHidden] = useState(false);

  useEffect(() => {
    if (migrationData?.eligible && migrationData?.candidate && user?.id) {
      const dismissed = safeSession.getItem(`invoxy_migration_dismissed_${user.id}`);
      if (!dismissed) {
        setIsMigrationModalOpen(true);
      }
    }
  }, [migrationData, user?.id]);

  const handleCloseMigrationModal = () => {
    setIsMigrationModalOpen(false);
    if (user?.id) {
      safeSession.setItem(`invoxy_migration_dismissed_${user.id}`, 'true');
    }
  };

  const handleMigrationSuccess = (result: MigrationExecuteResult) => {
    queryClient.invalidateQueries({ queryKey: ['invoxy-subscriptions'] });
    queryClient.invalidateQueries({ queryKey: ['subscription'] });
    queryClient.invalidateQueries({ queryKey: ['subscriptions-list'] });
    queryClient.invalidateQueries({ queryKey: ['balance'] });
    queryClient.invalidateQueries({ queryKey: ['migration-check'] });
    refreshUser();
    showToast(result.message || t('lazeikaMigration.success.title'));
  };

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const { data: subsData, isLoading: subsLoading } = useQuery({
    queryKey: ['invoxy-subscriptions'],
    queryFn: () => subscriptionApi.getSubscriptions(),
    placeholderData: (previous) => previous,
    staleTime: 30_000,
  });

  const subscriptions = subsData?.subscriptions ?? [];

  const { data: trialInfo } = useQuery<TrialInfo | null>({
    queryKey: ['invoxy-trial-info'],
    queryFn: () => subscriptionApi.getTrialInfo().catch(() => null),
    enabled: subscriptions.length === 0 && !subsLoading,
    staleTime: 60_000,
  });

  const [selectedSubscription, setSelectedSubscription] = useState<number | null>(null);
  const [connectModalOpen, setConnectModalOpen] = useState(false);
  const [connectPlatform, setConnectPlatform] = useState<PlatformKey | undefined>(undefined);
  const [activatingTrial, setActivatingTrial] = useState(false);

  const activeSubId =
    selectedSubscription && subscriptions.some((s) => s.id === selectedSubscription)
      ? selectedSubscription
      : (subscriptions[0]?.id ?? null);

  const { data: detailsData } = useQuery({
    queryKey: ['invoxy-subscription-details', activeSubId, 'dashboard'],
    queryFn: async () => {
      if (!activeSubId) return null;
      const previous = queryClient.getQueryData<{
        subscription: Awaited<ReturnType<typeof subscriptionApi.getSubscription>>['subscription'];
        connection: Awaited<ReturnType<typeof subscriptionApi.getConnectionLink>> | null;
        devices: Awaited<ReturnType<typeof subscriptionApi.getDevices>>['devices'];
        renewalOptions: Awaited<ReturnType<typeof subscriptionApi.getRenewalOptions>>;
      }>(['invoxy-subscription-details', activeSubId, 'dashboard']);
      const [detailResult, connectionResult, devicesResult, renewalResult] =
        await Promise.allSettled([
          subscriptionApi.getSubscription(activeSubId),
          subscriptionApi.getConnectionLink(activeSubId),
          subscriptionApi.getDevices(activeSubId),
          subscriptionApi.getRenewalOptions(activeSubId),
        ]);
      return {
        subscription:
          detailResult.status === 'fulfilled'
            ? detailResult.value.subscription
            : (previous?.subscription ?? null),
        connection:
          connectionResult.status === 'fulfilled'
            ? connectionResult.value
            : (previous?.connection ?? null),
        devices:
          devicesResult.status === 'fulfilled'
            ? devicesResult.value.devices
            : (previous?.devices ?? []),
        renewalOptions:
          renewalResult.status === 'fulfilled'
            ? renewalResult.value
            : (previous?.renewalOptions ?? []),
      };
    },
    enabled: Boolean(activeSubId),
    placeholderData: (prev) => prev,
    staleTime: 60_000,
  });

  const { data: latestSubscription } = useQuery({
    queryKey: ['invoxy-subscription-status', activeSubId],
    queryFn: () => subscriptionApi.getSubscriptionById(activeSubId!),
    enabled: Boolean(activeSubId),
    staleTime: 30_000,
  });

  const { data: trafficUsage } = useQuery({
    queryKey: ['invoxy-dashboard-traffic', activeSubId],
    queryFn: () =>
      activeSubId === null ? Promise.resolve(null) : subscriptionApi.refreshTraffic(activeSubId),
    enabled: Boolean(activeSubId),
    staleTime: 60_000,
    retry: false,
  });

  const selected = subscriptions.find((item) => item.id === activeSubId);
  const subscription = detailsData?.subscription ?? null;
  const connection = detailsData?.connection ?? null;
  const devices = detailsData?.devices ?? [];
  const renewalOptions = detailsData?.renewalOptions ?? [];

  const loading = !subsData && subsLoading;

  async function activateTrial() {
    if (!trialInfo?.is_available || activatingTrial) return;
    setActivatingTrial(true);
    try {
      await subscriptionApi.activateTrial();
      showToast(t('invoxy.start.trialActivated'), 'success');
      await queryClient.invalidateQueries({ queryKey: ['invoxy-subscriptions'] });
      await queryClient.invalidateQueries({ queryKey: ['invoxy-trial-info'] });
      await refreshUser();
    } catch {
      showToast(t('invoxy.start.trialFailed'), 'error');
    } finally {
      setActivatingTrial(false);
    }
  }

  const baseCurrent = subscription ?? latestSubscription ?? selected;
  const current =
    baseCurrent && trafficUsage
      ? {
          ...baseCurrent,
          traffic_used_gb: trafficUsage.traffic_used_gb,
          traffic_used_percent: trafficUsage.traffic_used_percent,
          ...(trafficUsage.whitelist_traffic_limit_gb !== undefined && {
            whitelist_traffic_limit_gb: trafficUsage.whitelist_traffic_limit_gb,
          }),
          ...(trafficUsage.whitelist_traffic_used_bytes !== undefined && {
            whitelist_traffic_used_bytes: trafficUsage.whitelist_traffic_used_bytes,
          }),
          ...(trafficUsage.whitelist_traffic_used_gb !== undefined && {
            whitelist_traffic_used_gb: trafficUsage.whitelist_traffic_used_gb,
          }),
          ...(trafficUsage.whitelist_traffic_used_percent !== undefined && {
            whitelist_traffic_used_percent: trafficUsage.whitelist_traffic_used_percent,
          }),
        }
      : baseCurrent;

  // Экран строится от состояния выбранной подписки (или аккаунта без подписок).
  const accountState = deriveAccountState(
    current ? [current] : [],
    current ? null : trialInfo,
    now,
  );

  const endTime = current?.end_date ? Date.parse(current.end_date) : Number.NaN;
  const remainingMs = Number.isFinite(endTime) ? Math.max(0, endTime - now) : 0;
  const daysLeft = Math.floor(remainingMs / 86_400_000);
  const hoursLeft = Math.floor((remainingMs % 86_400_000) / 3_600_000);
  const timeLeft = !Number.isFinite(endTime)
    ? '—'
    : t('invoxy.dashboard.timeLeft', { days: daysLeft, hours: hoursLeft });
  const endDate = current?.end_date ? formatDate(current.end_date) : '—';
  const currentStartDate = (current as { start_date?: string | null } | undefined)?.start_date;
  const startTime = currentStartDate ? Date.parse(currentStartDate) : Number.NaN;
  const totalDuration =
    Number.isFinite(startTime) && Number.isFinite(endTime) ? endTime - startTime : 0;
  const progress = current
    ? Math.min(100, Math.max(0, totalDuration > 0 ? ((now - startTime) / totalDuration) * 100 : 0))
    : 0;
  const accessLink =
    connection?.subscription_url || connection?.display_link || current?.subscription_url || null;

  const happLink =
    connection?.happ_redirect_link ||
    connection?.happ_scheme_link ||
    connection?.happ_link ||
    connection?.happ_cryptolink ||
    connection?.happ_crypto_link ||
    null;

  const incyLink = useMemo(() => {
    if (!accessLink) return null;
    return `incy://import/${accessLink}`;
  }, [accessLink]);

  const handleOpenConnect = (platform?: string) => {
    setConnectPlatform(platform as PlatformKey | undefined);
    setConnectModalOpen(true);
  };
  const hasLoadedDetails = Boolean(detailsData);
  const managedDevices = devices.map((device) => ({
    id: device.hwid,
    name: device.local_name || device.device_model || t('invoxy.dashboard.deviceFallback'),
    status: `${device.platform || t('invoxy.dashboard.platformUnknown')}${device.created_at ? ` · ${formatDate(device.created_at)}` : ''}`,
    platform: device.platform,
  }));
  const renewalTerms = renewalOptions.map((option) => ({
    id: String(option.period_days),
    label: t('invoxy.dashboard.periodDays', { count: option.period_days }),
    price: option.price_rubles ?? option.price_kopeks / 100,
    discount: option.discount_percent,
  }));
  const highlightedTermId =
    renewalOptions.find((option) => option.is_highlighted)?.period_days?.toString() ?? null;
  const defaultTerm = renewalTerms.find(
    (term) => term.id === defaultTermId(renewalTerms, highlightedTermId),
  );
  const breakdown = useRenewalBreakdown(current?.tariff_id ?? null, activeSubId);

  const payRenewal = (price: number, term: string, period: string) =>
    openPayment({
      amount: price,
      purpose: t('invoxy.renewal.purpose', { term }),
      subscriptionId: activeSubId ?? undefined,
      periodDays: Number(period),
    });

  const removeDevice = async (device: { id: string }) => {
    await subscriptionApi.deleteDevice(device.id, activeSubId ?? undefined);
    await queryClient.invalidateQueries({
      queryKey: ['invoxy-subscription-details', activeSubId, 'dashboard'],
    });
  };

  const isTrial = accountState === 'trial_active';
  const showMigrationBanner =
    Boolean(migrationData?.eligible && migrationData?.candidate) &&
    !isMigrationModalOpen &&
    !migrationBannerHidden;

  const renewalCard = (
    <RenewalCard
      title={subscription?.tariff_name || selected?.tariff_name || undefined}
      subtitle={
        subscription
          ? t('invoxy.renewal.params', {
              traffic: subscription.traffic_limit_gb || '∞',
              lte: subscription.whitelist_traffic_limit_gb || 0,
              devices: subscription.device_limit || '—',
            })
          : undefined
      }
      terms={renewalTerms}
      highlightedId={highlightedTermId}
      breakdown={breakdown}
      subscriptionId={activeSubId}
      onPay={payRenewal}
    />
  );

  return (
    <div className="flex w-full flex-col gap-5 pb-28 lg:gap-[1.1vw] lg:pb-0">
      <Header
        balance={user?.balance_rubles ?? 0}
        userName={user?.first_name || user?.username}
        onWalletClick={() => navigate('/profile#top-up')}
      />

      {showMigrationBanner && migrationData?.candidate && (
        <div className="relative flex items-center gap-3 overflow-hidden rounded-[22px] border border-accent-500/40 bg-gradient-to-r from-accent-600/20 via-purple-600/15 to-accent-500/10 p-3 pr-2 backdrop-blur-xl">
          <PiSparkleFill className="h-5 w-5 shrink-0 text-accent-400" />
          <button
            type="button"
            onClick={() => setIsMigrationModalOpen(true)}
            className="flex min-h-11 min-w-0 flex-1 cursor-pointer items-center gap-2 text-left"
          >
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-bold text-white">
                {t('invoxy.migration.bannerTitle')}
              </span>
              <span className="block truncate text-xs text-muted">
                {t('invoxy.migration.bannerSubtitle', {
                  tariff: migrationData.candidate.lazeika_tariff_name,
                  days: migrationData.candidate.total_days,
                })}
              </span>
            </span>
            <PiArrowRightBold className="h-4 w-4 shrink-0 text-accent-300" />
          </button>
          <button
            type="button"
            aria-label={t('invoxy.migration.hideBanner')}
            onClick={() => setMigrationBannerHidden(true)}
            className="grid h-11 w-11 shrink-0 cursor-pointer place-items-center rounded-full text-muted hover:text-ink"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <ActiveInvoiceCard />

      {/* popLayout: контент монтируется сразу, скелетон уходит поверх — без
          паузы «пусто между состояниями» и без зависания на задушенном rAF. */}
      <AnimatePresence mode="popLayout">
        {loading ? (
          <m.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.99 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="grid w-full gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(310px,.85fr)] lg:gap-[1.1vw]"
            aria-label={t('invoxy.dashboard.loading')}
            aria-busy="true"
          >
            <div className="glass-panel h-[292px] animate-pulse rounded-[28px] lg:col-span-2 lg:h-[300px]" />
            <div className="glass-panel h-[250px] animate-pulse rounded-[28px]" />
            <div className="glass-panel h-[200px] animate-pulse rounded-[28px]" />
          </m.div>
        ) : (
          <m.div
            key={accountState}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col gap-5 lg:gap-[1.1vw]"
          >
            {subscriptions.length > 1 && (
              <div className="glass-panel grid gap-2 rounded-[22px] p-2.5 sm:flex sm:flex-wrap sm:items-center">
                <div className="flex items-center justify-between gap-3 px-2 sm:contents">
                  <span className="text-[10px] font-bold uppercase tracking-[.12em] text-muted">
                    {t('invoxy.dashboard.subscription')}
                  </span>
                  <button
                    type="button"
                    onClick={() => navigate('/subscriptions')}
                    className="min-h-11 rounded-full py-2 text-xs font-bold text-mint sm:order-last sm:ml-auto sm:px-4"
                  >
                    {t('invoxy.dashboard.allSubscriptions')}
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:contents">
                  {subscriptions.map((item) => (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => setSelectedSubscription(item.id)}
                      className={`min-h-11 min-w-0 truncate rounded-full px-3 py-2 text-xs font-bold ${activeSubId === item.id ? 'bg-mint text-bg' : 'glass-control text-muted'}`}
                    >
                      {item.tariff_name || `#${item.id}`}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {accountState === 'none' || accountState === 'trial_available' ? (
              <StartHero
                trialInfo={trialInfo}
                activating={activatingTrial}
                onActivateTrial={() => void activateTrial()}
              />
            ) : accountState === 'trial_expired' ||
              accountState === 'paid_expired' ||
              accountState === 'disabled' ? (
              <AccessEndedCard
                state={accountState}
                tariffName={current?.tariff_name}
                endDate={endDate}
                renewal={
                  defaultTerm ? { price: defaultTerm.price, label: defaultTerm.label } : null
                }
                onRenew={() =>
                  defaultTerm && payRenewal(defaultTerm.price, defaultTerm.label, defaultTerm.id)
                }
              />
            ) : (
              // Порядок блоков задаёт DOM: на телефоне одна колонка, на десктопе
              // CSS-колонки раскладывают тот же поток без order-N.
              <div className="flex flex-col gap-5 lg:block lg:columns-2 lg:gap-[1.1vw] lg:[&>*]:mb-[1.1vw] [&>*]:break-inside-avoid">
                <SubscriptionCard
                  trial={isTrial}
                  name={current?.tariff_name || t('invoxy.dashboard.subscription')}
                  timeLeft={timeLeft}
                  endDate={endDate}
                  hasLte={Boolean(current?.whitelist_traffic_limit_gb)}
                  trialTrafficGb={current?.traffic_limit_gb ?? null}
                  progress={progress}
                  devicesCount={hasLoadedDetails ? managedDevices.length : undefined}
                  onManage={() =>
                    navigate(activeSubId ? `/subscriptions/${activeSubId}` : '/subscriptions')
                  }
                />

                {accountState === 'paid_expiring' && renewalCard}

                <ConnectPanel
                  accessLink={accessLink}
                  happLink={happLink || (accessLink ? `happ://add/${accessLink}` : null)}
                  incyLink={incyLink}
                  firstConnection={hasLoadedDetails && managedDevices.length === 0}
                  onOpenGuide={() => handleOpenConnect()}
                />

                {isTrial && <TrialUpgradeCard daysLeft={daysLeft} />}

                <div className="deferred-section">
                  <TrafficCards subscription={current} />
                </div>

                {managedDevices.length > 0 && (
                  <DevicesCard
                    devices={managedDevices}
                    deviceLimit={subscription?.device_limit ?? selected?.device_limit}
                    collapsedCount={DEVICES_COLLAPSED}
                    onRemove={removeDevice}
                    onConnect={handleOpenConnect}
                  />
                )}

                {accountState === 'paid_active' && renewalCard}
              </div>
            )}

            <MoreSection />
          </m.div>
        )}
      </AnimatePresence>

      <ConnectDeviceModal
        open={connectModalOpen}
        onClose={() => setConnectModalOpen(false)}
        accessLink={accessLink}
        happLink={happLink}
        incyLink={incyLink}
        initialPlatform={connectPlatform}
      />

      {migrationData?.candidate && (
        <LazeikaMigrationModal
          isOpen={isMigrationModalOpen}
          candidate={migrationData.candidate}
          onClose={handleCloseMigrationModal}
          onMigrated={handleMigrationSuccess}
        />
      )}
    </div>
  );
}

function formatDate(value: string | null | undefined) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('ru-RU');
}
