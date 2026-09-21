import { useMemo, useState } from 'react';
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
import { Bell, Laptop, Smartphone, Zap } from '@/invoxystart/components/ui/RuneIcon';
import { LivelyCopyButton } from '@/invoxystart/components/ui/LivelyCopyButton';
import {
  ConnectDeviceModal,
  type PlatformKey,
} from '@/invoxystart/components/connection/ConnectDeviceModal';
import { AppConnectModal } from '@/invoxystart/components/connection/AppConnectModal';
import { subscriptionApi, type TrialInfo } from '@/invoxystart/api';
import { useAuth } from '@/invoxystart/auth';

type AccountState = 'new' | 'trial' | 'active';

export function DashboardPage() {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const { openPayment } = usePayment();
  const { user, refreshUser } = useAuth();
  const queryClient = useQueryClient();

  const { data: subsData, isLoading: subsLoading } = useQuery({
    queryKey: ['invoxy-subscriptions'],
    queryFn: () => subscriptionApi.getSubscriptions(),
    staleTime: 60_000,
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
  const [appConnectModalOpen, setAppConnectModalOpen] = useState(false);

  const activeSubId =
    selectedSubscription && subscriptions.some((s) => s.id === selectedSubscription)
      ? selectedSubscription
      : (subscriptions[0]?.id ?? null);

  const { data: detailsData, isLoading: detailsLoading } = useQuery({
    queryKey: ['invoxy-subscription-details', activeSubId],
    queryFn: async () => {
      if (!activeSubId) return null;
      const [detailResult, connectionResult, devicesResult, renewalResult] =
        await Promise.allSettled([
          subscriptionApi.getSubscription(activeSubId),
          subscriptionApi.getConnectionLink(activeSubId),
          subscriptionApi.getDevices(activeSubId),
          subscriptionApi.getRenewalOptions(activeSubId),
        ]);
      return {
        subscription: detailResult.status === 'fulfilled' ? detailResult.value.subscription : null,
        connection: connectionResult.status === 'fulfilled' ? connectionResult.value : null,
        devices: devicesResult.status === 'fulfilled' ? devicesResult.value.devices : [],
        renewalOptions: renewalResult.status === 'fulfilled' ? renewalResult.value : [],
      };
    },
    enabled: Boolean(activeSubId),
    staleTime: 60_000,
  });

  const subscription = detailsData?.subscription ?? null;
  const connection = detailsData?.connection ?? null;
  const devices = detailsData?.devices ?? [];
  const renewalOptions = detailsData?.renewalOptions ?? [];

  const accountState: AccountState = subscriptions[0]?.is_trial
    ? 'trial'
    : subscriptions.length > 0
      ? 'active'
      : 'new';

  const loading = subsLoading || (subscriptions.length > 0 && detailsLoading && !detailsData);

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

  const selected = subscriptions.find((item) => item.id === activeSubId);
  const current = subscription ?? selected;
  const endDate = current?.end_date ? formatDate(current.end_date) : '—';
  const totalDays =
    subscription?.start_date && subscription.end_date
      ? Math.max(
          1,
          (Date.parse(subscription.end_date) - Date.parse(subscription.start_date)) / 86400000,
        )
      : 0;
  const progress = subscription
    ? Math.min(
        100,
        Math.max(0, totalDays ? ((totalDays - subscription.days_left) / totalDays) * 100 : 0),
      )
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
    const clean = accessLink.replace(/^https?:\/\//, '');
    return `happ://cryptolink/${clean}`;
  }, [accessLink]);

  const handleOpenConnect = (platform?: string) => {
    setConnectPlatform(platform as PlatformKey | undefined);
    setConnectModalOpen(true);
  };
  const managedDevices = devices.map((device) => ({
    id: device.hwid,
    name: device.local_name || device.device_model || 'Устройство',
    status: `${device.platform || 'Неизвестная платформа'}${device.created_at ? ` · ${formatDate(device.created_at)}` : ''}`,
    platform: device.platform,
  }));
  const renewalTerms = renewalOptions.map((option) => ({
    id: String(option.period_days),
    label: `${option.period_days} дней`,
    price: option.price_rubles ?? option.price_kopeks / 100,
    discount: option.discount_percent,
  }));

  const isExpired = Boolean(
    current?.status === 'expired' ||
      current?.is_expired ||
      (current?.days_left !== undefined && current.days_left <= 0) ||
      (current?.end_date ? Date.parse(current.end_date) <= Date.now() : false),
  );
  const isTrial = accountState === 'trial' || Boolean(current?.is_trial);

  return (
    <div className="flex w-full flex-col gap-5 pb-28 lg:gap-[1.1vw] lg:pb-0">
      <Header
        balance={user?.balance_rubles ?? 0}
        userName={user?.first_name || user?.username}
        onWalletClick={() => navigate('/profile#top-up')}
      />

      {/* Prominent App Connect Banner */}
      <div className="relative overflow-hidden rounded-[26px] border border-mint/30 bg-gradient-to-r from-mint/15 via-mint/5 to-cyan-500/10 p-4 sm:p-5 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,255,204,0.08)]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-2xl bg-mint/20 border border-mint/30 shadow-inner">
              <img
                src="/images/apps/invoxy.png"
                alt="Invoxy VPN"
                className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl object-contain"
              />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-white tracking-wide">
                  Официальное приложение Invoxy VPN
                </h3>
                <span className="rounded-full bg-mint/25 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-mint border border-mint/40 animate-pulse">
                  В 1 клик
                </span>
              </div>
              <p className="text-xs text-muted mt-1 leading-relaxed max-w-xl">
                Мгновенное подключение без ввода логина и паролей. Откройте на этом устройстве или
                отсканируйте QR-код с телефона.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
            <button
              type="button"
              onClick={() => setAppConnectModalOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-mint px-4 py-2.5 text-xs font-bold text-bg transition hover:bg-mint/90 active:scale-95 shadow-[0_0_20px_rgba(0,255,204,0.3)] cursor-pointer"
            >
              <Zap size={14} />
              <span>Войти в 1 клик / QR</span>
            </button>
            <a
              href="https://github.com/zxzum/InvoxyApp/releases/latest"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-xl bg-white/5 px-3 py-2.5 text-xs font-semibold text-white/80 border border-white/10 hover:bg-white/10 transition"
            >
              <span>Скачать</span>
              <span className="text-[10px] text-muted">Android / macOS</span>
            </a>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {loading || detailsLoading ? (
          <m.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
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

            {!isExpired && managedDevices.length === 0 && (
              <ZeroDevicesHeroBanner accessLink={accessLink} onConnect={handleOpenConnect} />
            )}

            <ActiveInvoiceCard />

            <div className="flex w-full flex-col gap-5 lg:grid lg:grid-cols-[minmax(0,1.15fr)_minmax(310px,.85fr)] lg:items-start lg:gap-[1.1vw]">
              <div className="contents lg:col-start-1 lg:flex lg:flex-col lg:gap-[1.1vw]">
                <Reveal className="order-1 min-w-0 lg:order-none">
                  <SubscriptionCard
                    trial={isTrial}
                    name={subscription?.tariff_name || selected?.tariff_name || 'Подписка'}
                    days={subscription?.days_left ?? 0}
                    endDate={endDate}
                    hasLte={Boolean(
                      subscription?.whitelist_traffic_limit_gb ??
                        selected?.whitelist_traffic_limit_gb,
                    )}
                    progress={progress}
                    devicesCount={managedDevices.length}
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

                <div className="deferred-section order-2 lg:order-none">
                  <TrafficCards subscription={subscription} />
                </div>

                {/* Active subscription: DevicesCard above Renewal/Offer card.
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
                        devices={managedDevices}
                        deviceLimit={subscription?.device_limit ?? selected?.device_limit}
                        isExpired={isExpired}
                        onRemove={async (device) => {
                          await subscriptionApi.deleteDevice(device.id, activeSubId ?? undefined);
                          await queryClient.invalidateQueries({
                            queryKey: ['invoxy-subscription-details', activeSubId],
                          });
                        }}
                        onConnect={handleOpenConnect}
                      />
                    </Reveal>
                  </>
                ) : (
                  <>
                    <Reveal delay={0.06} className="order-3 min-w-0 lg:order-none">
                      <DevicesCard
                        devices={managedDevices}
                        deviceLimit={subscription?.device_limit ?? selected?.device_limit}
                        isExpired={isExpired}
                        onRemove={async (device) => {
                          await subscriptionApi.deleteDevice(device.id, activeSubId ?? undefined);
                          await queryClient.invalidateQueries({
                            queryKey: ['invoxy-subscription-details', activeSubId],
                          });
                        }}
                        onConnect={handleOpenConnect}
                      />
                    </Reveal>

                    {isTrial ? (
                      <Reveal delay={0.1} className="order-4 min-w-0 lg:order-none">
                        <StandardOfferCard
                          onPay={(amount, purpose, tariffId, periodDays) =>
                            openPayment({ amount, purpose, tariffId, periodDays })
                          }
                        />
                      </Reveal>
                    ) : (
                      <Reveal delay={0.1} className="order-4 min-w-0 lg:order-none">
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
                <Reveal delay={0.15} className="order-5 min-w-0 lg:order-none">
                  <AccessKeyCard accessLink={accessLink} />
                </Reveal>

                <Reveal delay={0.2} className="order-6 min-w-0 lg:order-none">
                  <QuickConnect connection={connection} />
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

      <ConnectDeviceModal
        open={connectModalOpen}
        onClose={() => setConnectModalOpen(false)}
        accessLink={accessLink}
        happLink={happLink}
        incyLink={incyLink}
        initialPlatform={connectPlatform}
      />

      <AppConnectModal open={appConnectModalOpen} onClose={() => setAppConnectModalOpen(false)} />
    </div>
  );
}

function ZeroDevicesHeroBanner({
  accessLink,
  onConnect,
}: {
  accessLink: string | null;
  onConnect: (platform?: PlatformKey) => void;
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
              Ваш персональный скоростной профиль с защитой от блокировок сгенерирован. Подключите
              смартфон, ноутбук или ТВ прямо сейчас, чтобы пользоваться свободным интернетом.
            </p>
          </div>

          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center lg:flex-col lg:items-stretch lg:w-[220px]">
            <button
              type="button"
              onClick={() => onConnect()}
              className="flex h-11 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-mint px-5 font-bold text-xs text-bg shadow-[0_4px_16px_rgba(6,214,160,0.25)] transition-all hover:bg-mint/90 hover:shadow-[0_6px_22px_rgba(6,214,160,0.4)] active:scale-[0.98]"
            >
              <Zap size={15} />
              <span>Подключить в 1 клик</span>
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

        <div className="relative z-10 mt-5 flex flex-wrap items-center gap-2 border-t border-white/8 pt-4">
          <span className="text-[11px] font-medium text-muted mr-1">Инструкция для:</span>
          {(
            [
              { key: 'ios', label: 'iOS / iPhone', icon: Smartphone },
              { key: 'android', label: 'Android', icon: Smartphone },
              { key: 'windows', label: 'Windows', icon: Laptop },
              { key: 'macos', label: 'macOS', icon: Laptop },
              { key: 'tv', label: 'Android TV', icon: Laptop },
            ] as const
          ).map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => onConnect(p.key)}
              className="group flex cursor-pointer items-center gap-1.5 rounded-xl border border-white/8 bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-ink/80 transition-all hover:border-mint/40 hover:bg-mint/10 hover:text-mint active:scale-95"
            >
              <p.icon size={13} className="text-muted/70 transition-colors group-hover:text-mint" />
              <span>{p.label}</span>
            </button>
          ))}
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
