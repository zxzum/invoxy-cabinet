import { useEffect, useState } from 'react';
import { Header } from '@/invoxystart/components/dashboard/Header';
import { SubscriptionCard } from '@/invoxystart/components/dashboard/SubscriptionCard';
import { TrafficCards } from '@/invoxystart/components/dashboard/TrafficCards';
import { DevicesCard } from '@/invoxystart/components/dashboard/DevicesCard';
import { AccessKeyCard } from '@/invoxystart/components/dashboard/AccessKeyCard';
import { QuickConnect } from '@/invoxystart/components/dashboard/QuickConnect';
import { RenewalCard } from '@/invoxystart/components/dashboard/RenewalCard';
import { AddonsCard } from '@/invoxystart/components/dashboard/AddonsCard';
import { Reveal } from '@/invoxystart/components/layout/Reveal';
import { useToast } from '@/invoxystart/components/layout/ToastProvider';
import { Link, useNavigate } from 'react-router';
import { usePayment } from '@/invoxystart/components/payments/PaymentFlow';
import {
  ReferralPromoCard,
  StandardOfferCard,
  SupportStrip,
  TrialCard,
} from '@/invoxystart/components/dashboard/WelcomeCards';
import { Bell } from '@/invoxystart/components/ui/RuneIcon';
import {
  subscriptionApi,
  type ConnectionLinkResponse,
  type Device,
  type RenewalOption,
  type Subscription,
  type SubscriptionListItem,
  type TrialInfo,
} from '@/invoxystart/api';
import { useAuth } from '@/invoxystart/auth';

type AccountState = 'new' | 'trial' | 'active';

export function DashboardPage() {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const { openPayment } = usePayment();
  const { user, refreshUser } = useAuth();
  const [accountState, setAccountState] = useState<AccountState>('new');
  const [selectedSubscription, setSelectedSubscription] = useState<number | null>(null);
  const [subscriptions, setSubscriptions] = useState<SubscriptionListItem[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [connection, setConnection] = useState<ConnectionLinkResponse | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [renewalOptions, setRenewalOptions] = useState<RenewalOption[]>([]);
  const [trialInfo, setTrialInfo] = useState<TrialInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        const result = await subscriptionApi.getSubscriptions();
        if (!mounted) return;
        setSubscriptions(result.subscriptions);
        setAccountState(
          result.subscriptions[0]?.is_trial
            ? 'trial'
            : result.subscriptions.length
              ? 'active'
              : 'new',
        );
        setSelectedSubscription((current) =>
          current && result.subscriptions.some((item) => item.id === current)
            ? current
            : (result.subscriptions[0]?.id ?? null),
        );
        if (!result.subscriptions.length) {
          const trial = await subscriptionApi.getTrialInfo().catch(() => null);
          if (mounted) setTrialInfo(trial);
        }
      } catch {
        if (mounted) setAccountState('new');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedSubscription) {
      setDetailsLoading(false);
      setSubscription(null);
      setConnection(null);
      setDevices([]);
      setRenewalOptions([]);
      return;
    }
    setDetailsLoading(true);
    let mounted = true;
    void Promise.allSettled([
      subscriptionApi.getSubscription(selectedSubscription),
      subscriptionApi.getConnectionLink(selectedSubscription),
      subscriptionApi.getDevices(selectedSubscription),
      subscriptionApi.getRenewalOptions(selectedSubscription),
    ]).then(([detailResult, connectionResult, devicesResult, renewalResult]) => {
      if (!mounted) return;
      if (detailResult.status === 'fulfilled') setSubscription(detailResult.value.subscription);
      if (connectionResult.status === 'fulfilled') setConnection(connectionResult.value);
      if (devicesResult.status === 'fulfilled') setDevices(devicesResult.value.devices);
      if (renewalResult.status === 'fulfilled') setRenewalOptions(renewalResult.value);
      setDetailsLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, [selectedSubscription]);

  async function activateTrial() {
    if (!trialInfo?.is_available) return;
    try {
      await subscriptionApi.activateTrial();
      showToast('Пробный период активирован');
      const result = await subscriptionApi.getSubscriptions();
      setSubscriptions(result.subscriptions);
      setAccountState(
        result.subscriptions[0]?.is_trial
          ? 'trial'
          : result.subscriptions.length
            ? 'active'
            : 'new',
      );
      setSelectedSubscription(result.subscriptions[0]?.id ?? null);
      setTrialInfo(null);
      await refreshUser();
    } catch {
      showToast('Не удалось активировать пробный период');
    }
  }

  const selected = subscriptions.find((item) => item.id === selectedSubscription);
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

  if (loading || detailsLoading) {
    return (
      <DashboardLoadingState balance={`₽ ${(user?.balance_rubles ?? 0).toLocaleString('ru-RU')}`} />
    );
  }

  if (accountState === 'new') {
    return (
      <div className="flex w-full flex-col gap-5 pb-28 lg:gap-[1.1vw] lg:pb-0">
        <Header
          balance={`₽ ${(user?.balance_rubles ?? 0).toLocaleString('ru-RU')}`}
          userName={user?.first_name || user?.username}
          onWalletClick={() => navigate('/profile#top-up')}
        />
        <div className="grid w-full gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(310px,.85fr)] lg:gap-[1.1vw]">
          <Reveal className="lg:col-span-2">
            <TrialCard
              trialInfo={trialInfo}
              activated={false}
              onActivate={() => void activateTrial()}
            />
          </Reveal>
          <Reveal delay={0.08}>
            <StandardOfferCard
              onPay={(amount, purpose, tariffId, periodDays) =>
                openPayment({ amount, purpose, tariffId, periodDays })
              }
            />
          </Reveal>
          <div className="flex flex-col gap-5 lg:gap-[1.1vw]">
            <Reveal delay={0.14}>
              <ReferralPromoCard />
            </Reveal>
            <Reveal delay={0.2}>
              <SupportStrip />
            </Reveal>
          </div>
        </div>
        <NewsLink />
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-5 pb-28 lg:gap-[1.1vw] lg:pb-0">
      <Header
        balance={`₽ ${(user?.balance_rubles ?? 0).toLocaleString('ru-RU')}`}
        userName={user?.first_name || user?.username}
        onWalletClick={() => navigate('/profile#top-up')}
      />

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

      <div className="flex w-full flex-col gap-5 lg:grid lg:grid-cols-[minmax(0,1.15fr)_minmax(310px,.85fr)] lg:items-start lg:gap-[1.1vw]">
        <div className="contents lg:col-start-1 lg:flex lg:flex-col lg:gap-[1.1vw]">
          <Reveal className="order-1 min-w-0 lg:order-none">
            <SubscriptionCard
              trial={accountState === 'trial'}
              name={subscription?.tariff_name || selected?.tariff_name || 'Подписка'}
              days={subscription?.days_left ?? 0}
              endDate={endDate}
              hasLte={Boolean(
                subscription?.whitelist_traffic_limit_gb ?? selected?.whitelist_traffic_limit_gb,
              )}
              progress={progress}
              onManage={() =>
                selectedSubscription && navigate(`/subscriptions/${selectedSubscription}`)
              }
            />
          </Reveal>

          <div className="deferred-section order-2 lg:order-none">
            <TrafficCards subscription={subscription} />
          </div>

          <Reveal delay={0.1} className="order-3 min-w-0 lg:order-none">
            <DevicesCard
              devices={managedDevices}
              deviceLimit={subscription?.device_limit ?? selected?.device_limit}
              onRemove={async (device) => {
                await subscriptionApi.deleteDevice(device.id, selectedSubscription ?? undefined);
                setDevices((items) => items.filter((item) => item.hwid !== device.id));
              }}
            />
          </Reveal>

          <Reveal className="order-6 min-w-0 lg:order-none">
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
                  amount: renewalTerms.find((option) => option.id === period)?.price ?? 0,
                  purpose: `Продление подписки · ${term}`,
                  subscriptionId: selectedSubscription ?? undefined,
                  periodDays: Number(period),
                })
              }
            />
          </Reveal>
        </div>

        <div className="contents lg:col-start-2 lg:flex lg:flex-col lg:gap-[1.1vw]">
          <Reveal delay={0.15} className="order-4 min-w-0 lg:order-none">
            <AccessKeyCard accessLink={accessLink} />
          </Reveal>

          <Reveal delay={0.2} className="order-5 min-w-0 lg:order-none">
            <QuickConnect connection={connection} />
          </Reveal>

          <Reveal delay={0.3} className="order-7 min-w-0 lg:order-none">
            <AddonsCard subscriptionId={selectedSubscription} />
          </Reveal>
        </div>
      </div>
      <NewsLink />
    </div>
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

function DashboardLoadingState({ balance }: { balance: string }) {
  return (
    <div
      className="flex w-full flex-col gap-5 pb-28 lg:gap-[1.1vw] lg:pb-0"
      aria-label="Загрузка кабинета"
      aria-busy="true"
    >
      <Header balance={balance} onWalletClick={() => undefined} />
      <div className="grid w-full gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(310px,.85fr)] lg:gap-[1.1vw]">
        <div className="glass-panel h-[292px] animate-pulse rounded-[30px] lg:col-span-2 lg:h-[300px]" />
        <div className="glass-panel h-[250px] animate-pulse rounded-[30px]" />
        <div className="flex flex-col gap-5 lg:gap-[1.1vw]">
          <div className="glass-panel h-[200px] animate-pulse rounded-[30px]" />
          <div className="glass-panel h-16 animate-pulse rounded-[24px]" />
        </div>
      </div>
    </div>
  );
}

function formatDate(value: string | null | undefined) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('ru-RU');
}
