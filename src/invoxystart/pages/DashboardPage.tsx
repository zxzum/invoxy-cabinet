import { useEffect, useState } from 'react';
import { AnimatePresence, m } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Header } from '@/invoxystart/components/dashboard/Header';
import { SubscriptionCard } from '@/invoxystart/components/dashboard/SubscriptionCard';
import { TrafficCards } from '@/invoxystart/components/dashboard/TrafficCards';
import { DevicesCard } from '@/invoxystart/components/dashboard/DevicesCard';
import { AccessKeyCard } from '@/invoxystart/components/dashboard/AccessKeyCard';
import { QuickConnect } from '@/invoxystart/components/dashboard/QuickConnect';
import { RenewalCard } from '@/invoxystart/components/dashboard/RenewalCard';
import { AddonsCard } from '@/invoxystart/components/dashboard/AddonsCard';
import { ActiveInvoiceCard } from '@/invoxystart/components/dashboard/ActiveInvoiceCard';
import { Reveal } from '@/invoxystart/components/layout/Reveal';
import { useToast } from '@/invoxystart/components/layout/ToastProvider';
import { Link, useNavigate } from 'react-router';
import { usePayment } from '@/invoxystart/components/payments/PaymentFlow';
import {
  PartnerPromoCard,
  ReferralPromoCard,
  StandardOfferCard,
  SupportStrip,
  TrialCard,
} from '@/invoxystart/components/dashboard/WelcomeCards';
import { Bell, Zap } from '@/invoxystart/components/ui/RuneIcon';
import { LivelyCopyButton } from '@/invoxystart/components/ui/LivelyCopyButton';
import { subscriptionApi, type TrialInfo } from '@/invoxystart/api';
import { useAuth } from '@/invoxystart/auth';
import { useTranslation } from 'react-i18next';
import { migrationApi, type MigrationExecuteResult } from '@/api/migrationApi';
import { LazeikaMigrationModal } from '@/components/migration/LazeikaMigrationModal';
import { safeSession } from '@/utils/safeStorage';
import { PiSparkleFill, PiArrowRightBold } from 'react-icons/pi';

type AccountState = 'new' | 'trial' | 'active';

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

  const accountState: AccountState = subscriptions[0]?.is_trial
    ? 'trial'
    : subscriptions.length > 0
      ? 'active'
      : 'new';

  const loading = !subsData && subsLoading;

  async function activateTrial() {
    if (!trialInfo?.is_available) return;
    try {
      await subscriptionApi.activateTrial();
      showToast('Пробный период активирован');
      await queryClient.invalidateQueries({ queryKey: ['invoxy-subscriptions'] });
      await queryClient.invalidateQueries({ queryKey: ['invoxy-trial-info'] });
      await refreshUser();
    } catch {
      showToast('Не удалось активировать пробный период');
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
  const endTime = current?.end_date ? Date.parse(current.end_date) : Number.NaN;
  const remainingMs = Number.isFinite(endTime) ? Math.max(0, endTime - now) : 0;
  const daysLeft = Math.floor(remainingMs / 86_400_000);
  const hoursLeft = Math.floor((remainingMs % 86_400_000) / 3_600_000);
  const timeLeft = !Number.isFinite(endTime)
    ? '—'
    : remainingMs <= 0
      ? '0 ч.'
      : `${daysLeft} дн. ${hoursLeft} ч.`;
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

  const handleOpenConnect = () => navigate('/app');
  const hasLoadedDetails = Boolean(detailsData);
  const managedDevices = devices.map((device) => ({
    id: device.hwid,
    name: device.local_name || device.device_model || 'Устройство',
    status: `${device.platform || 'Неизвестная платформа'}${device.created_at ? ` · ${formatDate(device.created_at)}` : ''}`,
    platform: device.platform,
  }));
  const effectiveDevicesCount = hasLoadedDetails
    ? managedDevices.length ||
      (current?.device_limit && current.device_limit > 0
        ? ((current as { active_devices_count?: number })?.active_devices_count ?? 0)
        : 0)
    : undefined;
  const renewalTerms = renewalOptions.map((option) => ({
    id: String(option.period_days),
    label: `${option.period_days} дней`,
    price: option.price_rubles ?? option.price_kopeks / 100,
    discount: option.discount_percent,
  }));

  const isExpired = Boolean(
    current?.status === 'expired' ||
      current?.is_expired ||
      (Number.isFinite(endTime) && endTime <= now),
  );
  const isTrial = accountState === 'trial' || Boolean(current?.is_trial);
  return (
    <div className="flex w-full flex-col gap-5 pb-28 lg:gap-[1.1vw] lg:pb-0">
      <Header
        balance={user?.balance_rubles ?? 0}
        userName={user?.first_name || user?.username}
        onWalletClick={() => navigate('/profile#top-up')}
      />

      {/* Lazeika Migration Persistent Banner */}
      {migrationData?.eligible && migrationData?.candidate && (
        <Reveal>
          <div className="relative overflow-hidden rounded-[28px] border border-accent-500/40 bg-gradient-to-r from-accent-600/20 via-purple-600/15 to-accent-500/10 p-5 shadow-lg shadow-accent-500/10 backdrop-blur-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent-500/20 text-accent-400 ring-1 ring-accent-500/30">
                  <PiSparkleFill className="h-6 w-6 text-accent-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>Доступен перенос из Лазейка ВПН</span>
                    <span className="rounded-md bg-accent-500/20 px-2 py-0.5 text-[11px] font-semibold text-accent-300">
                      +5 дней в подарок
                    </span>
                  </h3>
                  <p className="text-xs text-muted mt-0.5">
                    Тариф:{' '}
                    <b className="text-white">{migrationData.candidate.lazeika_tariff_name}</b> ·
                    Осталось: <b className="text-white">{migrationData.candidate.total_days} дн.</b>
                    {Boolean(
                      migrationData.candidate.balance_rub &&
                        migrationData.candidate.balance_rub > 0,
                    ) && (
                      <span className="text-emerald-400 ml-1.5 font-semibold">
                        · Баланс: +{migrationData.candidate.balance_rub} ₽
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMigrationModalOpen(true)}
                className="shrink-0 cursor-pointer rounded-xl bg-gradient-to-r from-accent-500 to-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-accent-500/20 hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <span>Перенести подписку</span>
                <PiArrowRightBold className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </Reveal>
      )}

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
            aria-label="Загрузка кабинета"
            aria-busy="true"
          >
            <div className="glass-panel h-[292px] animate-pulse rounded-[30px] lg:col-span-2 lg:h-[300px]" />
            <div className="glass-panel h-[250px] animate-pulse rounded-[30px]" />
            <div className="flex flex-col gap-5 lg:gap-[1.1vw]">
              <div className="glass-panel h-[200px] animate-pulse rounded-[30px]" />
              <div className="glass-panel h-16 animate-pulse rounded-[24px]" />
            </div>
          </m.div>
        ) : accountState === 'new' ? (
          <m.div
            key="new"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col gap-5 lg:gap-[1.1vw]"
          >
            <div className="grid w-full gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(310px,.85fr)] lg:gap-[1.1vw]">
              <Reveal className="lg:col-span-2">
                <TrialCard
                  trialInfo={trialInfo}
                  activated={false}
                  onActivate={() => void activateTrial()}
                />
              </Reveal>
              <Reveal delay={0.06}>
                <StandardOfferCard
                  onPay={(amount, purpose, tariffId, periodDays) =>
                    openPayment({ amount, purpose, tariffId, periodDays })
                  }
                />
              </Reveal>
              <div className="flex flex-col gap-5 lg:gap-[1.1vw]">
                <Reveal delay={0.12}>
                  <ReferralPromoCard />
                </Reveal>
                <Reveal delay={0.18}>
                  <SupportStrip />
                </Reveal>
                <Reveal delay={0.22}>
                  <PartnerPromoCard />
                </Reveal>
              </div>
            </div>
            <NewsLink />
          </m.div>
        ) : (
          <m.div
            key="active"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col gap-5 lg:gap-[1.1vw]"
          >
            {subscriptions.length > 1 && (
              <div className="glass-panel grid gap-2 rounded-[24px] p-2.5 sm:flex sm:flex-wrap sm:items-center">
                <div className="flex items-center justify-between gap-3 px-2 sm:contents">
                  <span className="text-[10px] font-bold uppercase tracking-[.12em] text-muted">
                    Подписка
                  </span>
                  <button
                    type="button"
                    onClick={() => navigate('/subscriptions')}
                    className="rounded-full py-2 text-xs font-bold text-mint sm:order-last sm:ml-auto sm:px-4"
                  >
                    Все подписки →
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:contents">
                  {subscriptions.map((item) => (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => setSelectedSubscription(item.id)}
                      className={`min-w-0 truncate rounded-full px-3 py-2 text-xs font-bold ${selectedSubscription === item.id ? 'bg-mint text-bg' : 'glass-control text-muted'}`}
                    >
                      {item.tariff_name || `#${item.id}`}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {!isExpired && hasLoadedDetails && effectiveDevicesCount === 0 && (
              <ZeroDevicesHeroBanner accessLink={accessLink} onConnect={handleOpenConnect} />
            )}

            <ActiveInvoiceCard />

            <div className="flex w-full flex-col gap-5 lg:grid lg:grid-cols-[minmax(0,1.15fr)_minmax(310px,.85fr)] lg:items-start lg:gap-[1.1vw]">
              <div className="contents lg:col-start-1 lg:flex lg:flex-col lg:gap-[1.1vw]">
                <Reveal className="order-1 min-w-0 lg:order-none">
                  <SubscriptionCard
                    trial={isTrial}
                    name={current?.tariff_name || 'Подписка'}
                    timeLeft={timeLeft}
                    endDate={endDate}
                    hasLte={Boolean(current?.whitelist_traffic_limit_gb)}
                    progress={progress}
                    devicesCount={effectiveDevicesCount}
                    isExpired={isExpired}
                    onManage={() => {
                      if (isExpired && isTrial) {
                        navigate('/tariffs');
                      } else if (activeSubId) {
                        navigate(`/subscriptions/${activeSubId}`);
                      } else {
                        navigate('/subscriptions');
                      }
                    }}
                  />
                </Reveal>

                <div
                  className={`deferred-section lg:order-none ${isExpired ? 'order-2' : 'order-4'}`}
                >
                  <TrafficCards subscription={current} />
                </div>

                {/* Mobile single column: for an active subscription the connect
                    actions (access key + Invoxy VPN app) come right after the
                    subscription card, above traffic/devices/renewal, so they are
                    reachable without deep scrolling. Expired subscriptions keep
                    renewal at the top instead. Desktop order is DOM order
                    (lg:order-none).
                    Active subscription: DevicesCard above Renewal/Offer card.
                    Expired subscription: Renewal/Offer card above DevicesCard (accent on renewal). */}
                {isExpired ? (
                  <>
                    {isTrial ? (
                      <Reveal delay={0.06} className="order-3 min-w-0 lg:order-none">
                        <StandardOfferCard
                          onPay={(amount, purpose, tariffId, periodDays) =>
                            openPayment({ amount, purpose, tariffId, periodDays })
                          }
                        />
                      </Reveal>
                    ) : (
                      <Reveal delay={0.06} className="order-3 min-w-0 lg:order-none">
                        <RenewalCard
                          title={subscription?.tariff_name || selected?.tariff_name || 'Подписка'}
                          subtitle={
                            subscription
                              ? `${subscription.traffic_limit_gb || '∞'} ГБ · ${subscription.whitelist_traffic_limit_gb || 0} ГБ LTE · до ${subscription.device_limit || '—'} устройств`
                              : 'Параметры тарифа'
                          }
                          terms={renewalTerms}
                          onPay={(_, term, period) =>
                            openPayment({
                              amount:
                                renewalTerms.find((option) => option.id === period)?.price ?? 0,
                              purpose: `Продление подписки · ${term}`,
                              subscriptionId: activeSubId ?? undefined,
                              periodDays: Number(period),
                            })
                          }
                        />
                      </Reveal>
                    )}

                    <Reveal delay={0.1} className="order-4 min-w-0 lg:order-none">
                      <DevicesCard
                        isLoading={!hasLoadedDetails}
                        devices={managedDevices}
                        deviceLimit={subscription?.device_limit ?? selected?.device_limit}
                        isExpired={isExpired}
                        onRemove={async (device) => {
                          await subscriptionApi.deleteDevice(device.id, activeSubId ?? undefined);
                          await queryClient.invalidateQueries({
                            queryKey: ['invoxy-subscription-details', activeSubId, 'dashboard'],
                          });
                        }}
                        onConnect={handleOpenConnect}
                      />
                    </Reveal>
                  </>
                ) : (
                  <>
                    <Reveal delay={0.06} className="order-5 min-w-0 lg:order-none">
                      <DevicesCard
                        isLoading={!hasLoadedDetails}
                        devices={managedDevices}
                        deviceLimit={subscription?.device_limit ?? selected?.device_limit}
                        isExpired={isExpired}
                        onRemove={async (device) => {
                          await subscriptionApi.deleteDevice(device.id, activeSubId ?? undefined);
                          await queryClient.invalidateQueries({
                            queryKey: ['invoxy-subscription-details', activeSubId, 'dashboard'],
                          });
                        }}
                        onConnect={handleOpenConnect}
                      />
                    </Reveal>

                    {isTrial ? (
                      <Reveal delay={0.1} className="order-6 min-w-0 lg:order-none">
                        <StandardOfferCard
                          onPay={(amount, purpose, tariffId, periodDays) =>
                            openPayment({ amount, purpose, tariffId, periodDays })
                          }
                        />
                      </Reveal>
                    ) : (
                      <Reveal delay={0.1} className="order-6 min-w-0 lg:order-none">
                        <RenewalCard
                          title={subscription?.tariff_name || selected?.tariff_name || 'Подписка'}
                          subtitle={
                            subscription
                              ? `${subscription.traffic_limit_gb || '∞'} ГБ · ${subscription.whitelist_traffic_limit_gb || 0} ГБ LTE · до ${subscription.device_limit || '—'} устройств`
                              : 'Параметры тарифа'
                          }
                          terms={renewalTerms}
                          onPay={(_, term, period) =>
                            openPayment({
                              amount:
                                renewalTerms.find((option) => option.id === period)?.price ?? 0,
                              purpose: `Продление подписки · ${term}`,
                              subscriptionId: activeSubId ?? undefined,
                              periodDays: Number(period),
                            })
                          }
                        />
                      </Reveal>
                    )}
                  </>
                )}
              </div>

              <div className="contents lg:col-start-2 lg:flex lg:flex-col lg:gap-[1.1vw]">
                <Reveal
                  delay={0.15}
                  className={`min-w-0 lg:order-none ${isExpired ? 'order-5' : 'order-2'}`}
                >
                  <AccessKeyCard accessLink={accessLink} />
                </Reveal>

                <Reveal
                  delay={0.2}
                  className={`min-w-0 lg:order-none ${isExpired ? 'order-6' : 'order-3'}`}
                >
                  <QuickConnect />
                </Reveal>

                <Reveal delay={0.25} className="order-7 min-w-0 lg:order-none">
                  <AddonsCard subscriptionId={activeSubId} subscription={current} />
                </Reveal>

                <Reveal delay={0.28} className="order-8 min-w-0 lg:order-none">
                  <PartnerPromoCard />
                </Reveal>
              </div>
            </div>
            <NewsLink />
          </m.div>
        )}
      </AnimatePresence>

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

function ZeroDevicesHeroBanner({
  accessLink,
  onConnect,
}: {
  accessLink: string | null;
  onConnect: () => void;
}) {
  return (
    <Reveal>
      <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-br from-white/[0.04] via-surface-1/90 to-surface-2/70 p-5 shadow-[0_16px_40px_rgba(0,0,0,0.35)] backdrop-blur-2xl sm:p-6 lg:p-7">
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-mint/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-10 -left-10 h-36 w-36 rounded-full bg-cyan-400/8 blur-3xl" />

        <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-mint/25 bg-mint/10 px-3 py-1 text-[11px] font-semibold text-mint backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-mint opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-mint" />
              </span>
              Подписка активна · VPN готов к подключению
            </div>

            <h3 className="text-xl font-bold tracking-tight text-ink sm:text-2xl">
              Остался один шаг — подключите ваше устройство
            </h3>

            <p className="text-xs text-muted leading-relaxed sm:text-sm">
              Установите приложение Invoxy VPN и войдите через этот кабинет или Telegram — ключ
              вводить не нужно.
            </p>
          </div>

          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center lg:flex-col lg:items-stretch lg:w-[220px]">
            <button
              type="button"
              onClick={() => onConnect()}
              className="flex h-11 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-mint px-5 font-bold text-xs text-bg shadow-[0_4px_16px_rgba(6,214,160,0.25)] transition-all hover:bg-mint/90 hover:shadow-[0_6px_22px_rgba(6,214,160,0.4)] active:scale-[0.98]"
            >
              <Zap size={15} />
              <span>Подключить устройство</span>
            </button>

            {accessLink && (
              <LivelyCopyButton
                variant="glass"
                text={accessLink}
                label="Скопировать ключ"
                copiedLabel="Ключ скопирован"
                className="w-full"
              />
            )}
          </div>
        </div>
      </div>
    </Reveal>
  );
}

function NewsLink() {
  return (
    <Link
      to="/news"
      className="glass-panel motion-card flex items-center gap-3 rounded-[24px] p-4 text-sm transition-colors hover:border-mint/30 lg:hidden"
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-mint/10 text-mint">
        <Bell size={18} />
      </span>
      <span className="min-w-0 flex-1">
        <strong className="block">Новости InvoxyVPN</strong>
        <span className="mt-1 block text-xs text-muted">
          Обновления сервиса и полезные материалы
        </span>
      </span>
      <span className="text-mint">→</span>
    </Link>
  );
}

function formatDate(value: string | null | undefined) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('ru-RU');
}
