import { useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Link, useSearchParams } from 'react-router';
import { subscriptionApi } from '../api/subscription';
import { balanceApi } from '../api/balance';
import { promoApi } from '../api/promo';
import type { Tariff, ClassicPurchaseOptions, DevicesConfig } from '../types';
import { useCloseOnSuccessNotification } from '../store/successNotification';
import { SwitchTariffSheet } from '../components/subscription/sheets/SwitchTariffSheet';
import { TariffPurchaseForm } from '../components/subscription/purchase/TariffPurchaseForm';
import { TariffPickerGrid } from '../components/subscription/purchase/TariffPickerGrid';
import { getTariffCustomerFacingName } from '../components/subscription/purchase/tariffPresentation';
import { ClassicPurchaseWizard } from '../components/subscription/purchase/ClassicPurchaseWizard';
import { ResponsiveSheet } from '../components/ui/ResponsiveSheet';
import LunaAddonsCard from '../components/dashboard/luna/active/LunaAddonsCard';
import { DeviceTopupSheet } from '../components/subscription/sheets/DeviceTopupSheet';
import { TrafficTopupSheet } from '../components/subscription/sheets/TrafficTopupSheet';
import { ExclamationIcon, SparklesIcon, WalletIcon } from '@/components/icons';
import { PageSkeleton, Skeleton } from '@/components/ui/skeleton';
import { useCurrency } from '@/hooks/useCurrency';
import { useTheme } from '@/hooks/useTheme';

export default function SubscriptionPurchase() {
  const { t } = useTranslation();
  const { formatWithCurrency } = useCurrency();
  const { isDark } = useTheme();
  const [searchParams] = useSearchParams();
  const subscriptionIdParam = searchParams.get('subscriptionId');
  const subscriptionId = subscriptionIdParam ? parseInt(subscriptionIdParam, 10) : undefined;
  // Subscription query (shares cache with /subscription page)
  const { data: subscriptionResponse, isLoading } = useQuery({
    queryKey: ['subscription', subscriptionId],
    queryFn: () => subscriptionApi.getSubscription(subscriptionId),
    retry: false,
    staleTime: 60_000,
    refetchOnMount: 'always',
  });
  const subscription = subscriptionResponse?.subscription ?? null;

  const { data: balanceData } = useQuery({
    queryKey: ['balance'],
    queryFn: balanceApi.getBalance,
    staleTime: 60_000,
  });
  const balanceRubles = balanceData?.balance_rubles ?? (balanceData?.balance_kopeks ?? 0) / 100;

  // Purchase options
  const {
    data: purchaseOptions,
    isLoading: optionsLoading,
    isError: optionsError,
    refetch: refetchOptions,
  } = useQuery({
    queryKey: ['purchase-options', subscriptionId],
    queryFn: () => subscriptionApi.getPurchaseOptions(subscriptionId),
    staleTime: 60_000,
    refetchOnMount: 'always',
  });

  // Sales mode detection
  const isTariffsMode = purchaseOptions?.sales_mode === 'tariffs';
  const classicOptions = !isTariffsMode ? (purchaseOptions as ClassicPurchaseOptions) : null;
  const tariffs =
    isTariffsMode && purchaseOptions && 'tariffs' in purchaseOptions ? purchaseOptions.tariffs : [];

  const activeAddonSubscription =
    subscription && !subscription.is_trial && (subscription.is_active || subscription.is_limited)
      ? subscription
      : null;
  const currentTariff =
    isTariffsMode && purchaseOptions && 'current_tariff_id' in purchaseOptions
      ? tariffs.find(
          (tariff) =>
            tariff.id === purchaseOptions.current_tariff_id ||
            (purchaseOptions.current_tariff_id == null && tariff.is_current),
        )
      : null;
  const addonDevicesConfig: DevicesConfig | null =
    currentTariff?.device_price_kopeks && currentTariff.device_price_kopeks > 0
      ? {
          min: 1,
          max: currentTariff.max_device_limit ?? 0,
          default: activeAddonSubscription?.device_limit ?? currentTariff.device_limit,
          current: activeAddonSubscription?.device_limit ?? currentTariff.device_limit,
          price_per_device_kopeks: currentTariff.device_price_kopeks,
          price_per_device_label: formatWithCurrency(currentTariff.device_price_kopeks / 100),
          ...(currentTariff.original_device_price_kopeks != null && {
            price_per_device_original_kopeks: currentTariff.original_device_price_kopeks,
          }),
          ...(currentTariff.device_discount_percent != null && {
            discount_percent: currentTariff.device_discount_percent,
          }),
        }
      : null;

  const {
    data: regularTrafficPackages,
    isLoading: regularTrafficPackagesLoading,
    isError: regularTrafficPackagesError,
    refetch: refetchRegularTrafficPackages,
  } = useQuery({
    queryKey: ['traffic-packages', activeAddonSubscription?.id, 'regular'],
    queryFn: () => subscriptionApi.getTrafficPackages(activeAddonSubscription?.id, 'regular'),
    enabled: isTariffsMode && activeAddonSubscription != null,
    staleTime: 60_000,
  });
  const hasLteTraffic = (activeAddonSubscription?.whitelist_traffic_limit_gb ?? 0) > 0;
  const {
    data: lteTrafficPackages,
    isLoading: lteTrafficPackagesLoading,
    isError: lteTrafficPackagesError,
    refetch: refetchLteTrafficPackages,
  } = useQuery({
    queryKey: ['traffic-packages', activeAddonSubscription?.id, 'whitelist'],
    queryFn: () => subscriptionApi.getTrafficPackages(activeAddonSubscription?.id, 'whitelist'),
    enabled: isTariffsMode && activeAddonSubscription != null && hasLteTraffic,
    staleTime: 60_000,
  });

  const { data: loyaltyTiers } = useQuery({
    queryKey: ['loyalty-tiers'],
    queryFn: promoApi.getLoyaltyTiers,
    enabled: isTariffsMode,
    retry: false,
    staleTime: 60_000,
  });

  // Multi-tariff: check via subscriptions list query
  const { data: multiSubData } = useQuery({
    queryKey: ['subscriptions-list'],
    queryFn: () => subscriptionApi.getSubscriptions(),
    staleTime: 60_000,
  });
  const isMultiTariff = multiSubData?.multi_tariff_enabled ?? false;

  // (active promo discount + applyPromoDiscount live in usePromoDiscount;
  //  consumed directly by the sub-components, not threaded as props)

  // (classic-mode state moved into <ClassicPurchaseWizard>)

  // Tariffs mode state
  const [selectedTariff, setSelectedTariff] = useState<Tariff | null>(null);
  const [showTariffPurchase, setShowTariffPurchase] = useState(false);
  const [showDeviceTopup, setShowDeviceTopup] = useState(false);
  const [devicesToAdd, setDevicesToAdd] = useState(1);
  const [showTrafficTopup, setShowTrafficTopup] = useState(false);
  const [selectedTrafficPackage, setSelectedTrafficPackage] = useState<number | null>(null);
  const [trafficTopupScope, setTrafficTopupScope] = useState<'regular' | 'whitelist'>('regular');
  // Шит доигрывает анимацию выезда после isOpen=false — тариф для его
  // содержимого держим в ref, иначе selectedTariff=null размонтировал бы
  // шит посреди анимации.
  const lastSelectedTariffRef = useRef<Tariff | null>(null);
  if (selectedTariff) lastSelectedTariffRef.current = selectedTariff;
  const sheetTariff = selectedTariff ?? lastSelectedTariffRef.current;
  // (selectedTariffPeriod / customDays / customTrafficGb / useCustomDays /
  //  useCustomTraffic moved into <TariffPurchaseForm>; form remounts with
  //  fresh state via key=tariff.id when the parent picks a new tariff)

  // (tariffPurchaseRef moved into <TariffPurchaseForm>; switch-modal ref
  //  moved into <SwitchTariffSheet>)

  // Tariff switch
  const [switchTariffId, setSwitchTariffId] = useState<number | null>(null);

  // Auto-close all modals on success notification
  const handleCloseAllModals = () => {
    // setShowPurchaseForm moved into <ClassicPurchaseWizard>'s own useCloseOnSuccessNotification
    setShowTariffPurchase(false);
    setShowDeviceTopup(false);
    setShowTrafficTopup(false);
    setSelectedTrafficPackage(null);
    setSwitchTariffId(null);

    setSelectedTariff(null);
    // (selectedTariffPeriod lives inside <TariffPurchaseForm> now; unmount clears it)
  };
  useCloseOnSuccessNotification(handleCloseAllModals);

  // (switch preview query + switchTariffMutation moved into <SwitchTariffSheet>)

  // (tariffPurchaseMutation moved into <TariffPurchaseForm>)
  // (auto-scroll effects: switch-modal into <SwitchTariffSheet>,
  //  tariff-purchase into <TariffPurchaseForm>)

  // (classic-mode helpers moved into <ClassicPurchaseWizard>)

  if (isLoading || optionsLoading) {
    return (
      <PageSkeleton leading={1} titleWidth="w-56">
        <Skeleton variant="card" className="h-32" />
        <Skeleton variant="card" count={2} className="h-40" />
      </PageSkeleton>
    );
  }

  if (optionsError || (!purchaseOptions && !optionsLoading)) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-dark-50 sm:text-3xl">{t('subscription.extend')}</h1>
        <div className="glass-surface p-6 text-center">
          <p className="mb-4 text-dark-300">
            {t('subscription.loadError', 'Не удалось загрузить варианты подписки')}
          </p>
          <button
            onClick={() => refetchOptions()}
            className="rounded-xl bg-accent-500 px-6 py-2 text-sm font-medium text-on-accent transition-colors hover:bg-accent-600"
          >
            {t('common.retry')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-28 lg:pb-0">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="ix-page-heading">
          <h1>
            {isMultiTariff && !subscriptionId
              ? t('nav.tariffs', 'Тарифы')
              : !isMultiTariff && subscription?.is_daily && !subscription?.is_trial
                ? t('subscription.switchTariff.title')
                : t('nav.tariffs', 'Тарифы')}
          </h1>
          <p>{t('subscription.choosePlan', 'Выберите подходящий план')}</p>
        </div>
        <Link
          to="/profile#top-up"
          aria-label={t('balance.topUpBalance')}
          className="ix-mobile-balance-pill glass-surface-elevated flex shrink-0 items-center gap-2 rounded-full px-3 py-2.5 text-[13px] font-bold lg:hidden"
        >
          <WalletIcon className="h-[18px] w-[18px] text-accent-300" />
          {formatWithCurrency(balanceRubles, 0)}
        </Link>
      </div>

      {/* Tariffs Section */}
      {isTariffsMode && tariffs.length > 0 && (
        <div className="relative space-y-5">
          {/* Trial upgrade prompt — hidden when expired banner is active */}
          {subscription?.is_trial &&
            !(
              isTariffsMode &&
              purchaseOptions &&
              'subscription_is_expired' in purchaseOptions &&
              purchaseOptions.subscription_is_expired
            ) && (
              <div
                className="mb-6 rounded-[14px] p-4"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(255,184,0,0.08), rgba(var(--color-accent-400),0.06))',
                  border: '1px solid rgba(255,184,0,0.15)',
                }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[10px]"
                    style={{
                      background: 'rgba(255,184,0,0.12)',
                      color: 'rgb(var(--color-urgent-400))',
                    }}
                  >
                    <SparklesIcon className="h-4 w-4" />
                  </div>
                  <div>
                    <div
                      className="text-sm font-semibold"
                      style={{ color: 'rgb(var(--color-urgent-400))' }}
                    >
                      {t('subscription.trialUpgrade.title')}
                    </div>
                    <div className="mt-1 text-[12px] text-dark-400">
                      {t('subscription.trialUpgrade.description')}
                    </div>
                  </div>
                </div>
              </div>
            )}

          {/* Expired subscription notice */}
          {isTariffsMode &&
            purchaseOptions &&
            'subscription_is_expired' in purchaseOptions &&
            purchaseOptions.subscription_is_expired && (
              <div
                className="mb-6 rounded-[14px] p-4"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,59,92,0.08), rgba(255,184,0,0.06))',
                  border: '1px solid rgba(255,59,92,0.15)',
                }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[10px]"
                    style={{
                      background: 'rgba(255,59,92,0.12)',
                      color: 'rgb(var(--color-critical-500))',
                    }}
                  >
                    <ExclamationIcon className="h-4 w-4" />
                  </div>
                  <div>
                    <div
                      className="text-sm font-semibold"
                      style={{ color: 'rgb(var(--color-critical-500))' }}
                    >
                      {t('subscription.expiredBanner.title')}
                    </div>
                    <div className="mt-1 text-[12px] text-dark-400">
                      {t('subscription.expiredBanner.selectTariff')}
                    </div>
                  </div>
                </div>
              </div>
            )}

          {/* Legacy subscription notice */}
          {subscription && !subscription.is_trial && !subscription.tariff_id && (
            <div className="alert-info mb-6 p-4">
              <div className="mb-2 font-medium text-accent-400">
                {t('subscription.legacy.selectTariffTitle')}
              </div>
              <div className="text-sm text-dark-300">
                {t('subscription.legacy.selectTariffDescription')}
              </div>
              <div className="mt-2 text-xs text-dark-500">
                {t('subscription.legacy.currentSubContinues')}
              </div>
            </div>
          )}

          {/* Switch Tariff Preview Modal */}
          <SwitchTariffSheet
            open={switchTariffId !== null}
            tariffId={switchTariffId}
            subscriptionId={subscriptionId}
            tariffs={tariffs}
            onClose={() => setSwitchTariffId(null)}
            onExpiredFallback={(tariff) => {
              setSelectedTariff(tariff);
              setShowTariffPurchase(true);
            }}
          />

          <TariffPickerGrid
            tariffs={tariffs}
            subscription={subscription}
            purchaseOptions={purchaseOptions}
            isTariffsMode={isTariffsMode}
            isMultiTariff={isMultiTariff}
            loyaltyTiers={loyaltyTiers}
            onSelectTariff={(tariff) => {
              setSelectedTariff(tariff);
              setShowTariffPurchase(true);
            }}
            onSwitchTariff={(tariffId) => setSwitchTariffId(tariffId)}
          />

          {sheetTariff && (
            <ResponsiveSheet
              isOpen={showTariffPurchase}
              onClose={() => {
                setShowTariffPurchase(false);
                setSelectedTariff(null);
              }}
              title={getTariffCustomerFacingName(sheetTariff.name, t('subscription.whiteInternet'))}
              className="rounded-t-2xl rounded-b-none sm:rounded-2xl"
            >
              <div className="px-4 pb-4 pt-1">
                <TariffPurchaseForm
                  key={sheetTariff.id}
                  tariff={sheetTariff}
                  subscriptionId={subscriptionId}
                  balanceKopeks={purchaseOptions?.balance_kopeks}
                  showHeader={false}
                  sbpPurchaseEnabled={
                    isTariffsMode &&
                    purchaseOptions !== undefined &&
                    'platega_recurrent_enabled' in purchaseOptions &&
                    purchaseOptions.platega_recurrent_enabled === true
                  }
                  lavaPurchaseEnabled={
                    isTariffsMode &&
                    purchaseOptions !== undefined &&
                    'lava_recurrent_enabled' in purchaseOptions &&
                    purchaseOptions.lava_recurrent_enabled === true
                  }
                  onBack={() => {
                    setShowTariffPurchase(false);
                    setSelectedTariff(null);
                  }}
                />
              </div>
            </ResponsiveSheet>
          )}
        </div>
      )}

      {/* Purchase/Extend Section - Classic Mode */}
      {classicOptions && classicOptions.periods.length > 0 && (
        <ClassicPurchaseWizard
          classicOptions={classicOptions}
          subscription={subscription}
          subscriptionId={subscriptionId}
        />
      )}

      {isTariffsMode && activeAddonSubscription && (
        <section aria-label={t('dashboard.luna.addons.title', 'Дополнительные опции')}>
          <LunaAddonsCard
            devicesConfig={addonDevicesConfig}
            regularTrafficPackages={regularTrafficPackages ?? []}
            lteTrafficPackages={lteTrafficPackages ?? []}
            isLoading={regularTrafficPackagesLoading || lteTrafficPackagesLoading}
            errorMessage={
              regularTrafficPackagesError || (hasLteTraffic && lteTrafficPackagesError)
                ? t('dashboard.luna.addons.error', 'Не удалось загрузить варианты докупки')
                : undefined
            }
            onRetry={() => {
              void Promise.all([
                ...(regularTrafficPackagesError ? [refetchRegularTrafficPackages()] : []),
                ...(hasLteTraffic && lteTrafficPackagesError ? [refetchLteTrafficPackages()] : []),
              ]);
            }}
            retryLabel={t('common.retry', 'Повторить')}
            onOpenDeviceAddon={addonDevicesConfig ? () => setShowDeviceTopup(true) : undefined}
            onOpenTrafficAddon={(packageOption) => {
              setTrafficTopupScope('regular');
              setSelectedTrafficPackage(packageOption.gb);
              setShowTrafficTopup(true);
            }}
            onOpenLteAddon={(packageOption) => {
              setTrafficTopupScope('whitelist');
              setSelectedTrafficPackage(packageOption.gb);
              setShowTrafficTopup(true);
            }}
            formatPackagePrice={(packageOption) =>
              formatWithCurrency(packageOption.price_rubles, 0)
            }
            trafficUnitLabel={t('common.units.gb', 'ГБ')}
            title={t('dashboard.luna.addons.title', 'Дополнительные опции')}
            devicesLabel={t('dashboard.luna.addons.devices', 'Ещё устройства')}
            trafficLabel={t('dashboard.luna.addons.traffic', 'Основной трафик')}
            lteLabel={t('subscription.additionalOptions.whitelistTraffic', 'Доп. LTE-трафик')}
            addDevicesLabel={t('dashboard.luna.addons.addDevices', 'Добавить')}
            addTrafficLabel={t('dashboard.luna.addons.addTraffic', 'Добавить трафик')}
            addLteLabel={t('dashboard.luna.addons.addLte', 'Добавить LTE-трафик')}
            unlimitedLabel={t('dashboard.unlimited', 'Безлимит')}
            unavailableLabel={t('dashboard.luna.addons.unavailable', 'Недоступно')}
            emptyMessage={t('dashboard.luna.addons.empty', 'Докупка недоступна')}
          />

          {activeAddonSubscription && showDeviceTopup && (
            <ResponsiveSheet
              isOpen
              onClose={() => setShowDeviceTopup(false)}
              title={t('subscription.buyDevices', 'Докупить устройства')}
              size="md"
            >
              <DeviceTopupSheet
                open
                onOpen={() => setShowDeviceTopup(true)}
                onClose={() => setShowDeviceTopup(false)}
                subscription={activeAddonSubscription}
                subscriptionId={activeAddonSubscription.id}
                devicesToAdd={devicesToAdd}
                onDevicesToAddChange={setDevicesToAdd}
                purchaseOptions={purchaseOptions}
                isDark={isDark}
              />
            </ResponsiveSheet>
          )}

          {activeAddonSubscription && showTrafficTopup && (
            <ResponsiveSheet
              isOpen
              onClose={() => {
                setShowTrafficTopup(false);
                setSelectedTrafficPackage(null);
              }}
              title={t('subscription.additionalOptions.buyTrafficTitle', 'Докупить трафик')}
              size="lg"
            >
              <TrafficTopupSheet
                open
                onOpen={() => setShowTrafficTopup(true)}
                onClose={() => {
                  setShowTrafficTopup(false);
                  setSelectedTrafficPackage(null);
                }}
                subscription={activeAddonSubscription}
                subscriptionId={activeAddonSubscription.id}
                initialScope={trafficTopupScope}
                onScopeChange={setTrafficTopupScope}
                selectedTrafficPackage={selectedTrafficPackage}
                onSelectedTrafficPackageChange={setSelectedTrafficPackage}
                purchaseOptions={purchaseOptions}
                isDark={isDark}
              />
            </ResponsiveSheet>
          )}
        </section>
      )}

      {/* No options available fallback */}
      {purchaseOptions &&
        !optionsLoading &&
        !(isTariffsMode && tariffs.length > 0) &&
        !(classicOptions && classicOptions.periods.length > 0) && (
          <div className="glass-surface p-6 text-center">
            <p className="mb-4 text-dark-300">
              {t('subscription.noOptionsAvailable', 'Нет доступных вариантов подписки')}
            </p>
            <button
              onClick={() => refetchOptions()}
              className="rounded-xl bg-accent-500 px-6 py-2 text-sm font-medium text-on-accent transition-colors hover:bg-accent-600"
            >
              {t('common.retry')}
            </button>
          </div>
        )}
    </div>
  );
}
