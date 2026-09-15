import { useState, useEffect, useMemo, useRef } from 'react';
import { useQueries, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { openLink as sdkOpenLink } from '@telegram-apps/sdk-react';
import { useAuthStore } from '../store/auth';
import { displayName } from '../utils/displayName';
import { useBlockingStore } from '../store/blocking';
import { subscriptionApi } from '../api/subscription';
import { referralApi } from '../api/referral';
import { balanceApi } from '../api/balance';
import { wheelApi } from '../api/wheel';
import Onboarding, { useOnboarding } from '../components/Onboarding';
import PromoOffersSection from '../components/PromoOffersSection';
import NewsSection from '../components/news/NewsSection';
import SubscriptionCardExpired from '../components/dashboard/SubscriptionCardExpired';
import StatsGrid from '../components/dashboard/StatsGrid';
import { giftApi } from '../api/gift';
import { promoApi } from '../api/promo';
import PendingGiftCard from '../components/dashboard/PendingGiftCard';
import { DeviceLimitSheet } from '../components/subscription/DeviceLimitSheet';
import { DeviceTopupSheet } from '../components/subscription/sheets/DeviceTopupSheet';
import { TrafficTopupSheet } from '../components/subscription/sheets/TrafficTopupSheet';
import {
  LunaActiveDashboard,
  LunaLoadingState,
  type LunaActiveLabels,
  type LunaTrafficSnapshot,
} from '../components/dashboard/luna/active';
import {
  ReferralPromo,
  StandardOffer,
  SupportStrip,
  TrialHero,
} from '../components/dashboard/luna/welcome';
import { API } from '../config/constants';
import { ChevronRightIcon, StarIcon } from '@/components/icons';
import { staggerEntrance } from '@/components/motion';
import { safeLocal } from '../utils/safeStorage';
import { getApiErrorMessage } from '../utils/api-error';
import { useCurrency } from '../hooks/useCurrency';
import { useTheme } from '../hooks/useTheme';
import { uiLocale } from '../utils/uiLocale';
import { formatTraffic } from '../utils/formatTraffic';
import { isHappCryptolinkMode, resolveConnectionUrlForUi } from '../utils/connectionLink';
import { copyToClipboard } from '../utils/clipboard';
import { openAppScheme } from '../utils/openAppScheme';
import { isInTelegramWebApp } from '../hooks/useTelegramSDK';
import { useNativeDialog } from '@/platform';
import type { Device, RenewalOption, TrafficPackage } from '../types';

export default function Dashboard() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const refreshUser = useAuthStore((state) => state.refreshUser);
  const queryClient = useQueryClient();
  const { isCompleted: isOnboardingCompleted, complete: completeOnboarding } = useOnboarding();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const blockingType = useBlockingStore((state) => state.blockingType);
  const [trialError, setTrialError] = useState<string | null>(null);
  const { formatAmount, currencySymbol } = useCurrency();
  const { isDark } = useTheme();
  const nativeDialog = useNativeDialog();

  // Auth bootstrap already provides the user. Avoid a duplicate /me request on
  // every return to the dashboard; refresh only while that bootstrap is empty.
  useEffect(() => {
    if (!user) refreshUser();
  }, [refreshUser, user]);

  // Fetch balance from API
  const { data: balanceData } = useQuery({
    queryKey: ['balance'],
    queryFn: balanceApi.getBalance,
    staleTime: API.BALANCE_STALE_TIME_MS,
  });

  // Multi-tariff: check if user has multiple subscriptions
  const {
    data: multiSubData,
    isError: subscriptionsError,
    refetch: refetchSubscriptions,
  } = useQuery({
    queryKey: ['subscriptions-list'],
    queryFn: () => subscriptionApi.getSubscriptions(),
    staleTime: 60_000,
  });
  const isMultiTariff = multiSubData?.multi_tariff_enabled ?? false;

  const { data: subscriptionResponse, isLoading: subLoading } = useQuery({
    queryKey: ['subscription', undefined],
    queryFn: () => subscriptionApi.getSubscription(),
    retry: false,
    staleTime: API.BALANCE_STALE_TIME_MS,
    enabled: !isMultiTariff,
  });

  const subscription = subscriptionResponse?.subscription ?? null;

  const visibleSubscriptions = useMemo(
    () => multiSubData?.subscriptions?.slice(0, 3) ?? [],
    [multiSubData],
  );
  const [selectedSubId, setSelectedSubId] = useState<number | null>(null);
  const selectedSubscriptionId = isMultiTariff
    ? (selectedSubId ?? visibleSubscriptions[0]?.id)
    : undefined;

  useEffect(() => {
    if (!isMultiTariff) return;
    const firstId = visibleSubscriptions[0]?.id ?? null;
    if (!visibleSubscriptions.some((item) => item.id === selectedSubId)) {
      setSelectedSubId(firstId);
    }
  }, [isMultiTariff, selectedSubId, visibleSubscriptions]);

  const {
    data: selectedSubscriptionResponse,
    isLoading: selectedSubscriptionLoading,
    isError: selectedSubscriptionError,
    refetch: refetchSelectedSubscription,
  } = useQuery({
    queryKey: ['subscription', selectedSubscriptionId],
    queryFn: () => subscriptionApi.getSubscription(selectedSubscriptionId),
    enabled: isMultiTariff && selectedSubscriptionId != null,
    retry: false,
    staleTime: API.BALANCE_STALE_TIME_MS,
  });

  const dashboardSubscription = isMultiTariff
    ? (selectedSubscriptionResponse?.subscription ?? null)
    : subscription;
  const dashboardSubscriptionLoading = isMultiTariff ? selectedSubscriptionLoading : subLoading;

  // Выбранная живая подписка — единственный случай, когда дашборд рендерит
  // Luna-композицию. Expired/disabled/limited уходят в SubscriptionCardExpired
  // с платёжным flow, поэтому тяжёлые запросы (продление, пакеты, ссылки)
  // для них не нужны.
  const activeSubscription =
    dashboardSubscription &&
    !dashboardSubscription.is_expired &&
    dashboardSubscription.status !== 'disabled' &&
    !dashboardSubscription.is_limited
      ? dashboardSubscription
      : null;
  const activeSubId = activeSubscription?.id;

  const { data: trialInfo, isLoading: trialLoading } = useQuery({
    queryKey: ['trial-info'],
    queryFn: () => subscriptionApi.getTrialInfo(),
    enabled: !isMultiTariff && !subscription && !subLoading,
  });

  const {
    data: devicesData,
    isLoading: devicesLoading,
    isError: devicesError,
    refetch: refetchDevices,
  } = useQuery({
    queryKey: ['devices', activeSubId],
    queryFn: () => subscriptionApi.getDevices(activeSubId),
    enabled: activeSubId != null,
    staleTime: API.BALANCE_STALE_TIME_MS,
  });

  // В мультитарифной ветке каждая карточка показывает число устройств и
  // открывает покупку ещё одного, поэтому запрос нужен для каждой подписки.
  // Ключ ['devices', id] совпадает со страницей подписки — кэш общий.
  const deviceQueries = useQueries({
    queries: visibleSubscriptions.map((sub) => ({
      queryKey: ['devices', sub.id],
      queryFn: () => subscriptionApi.getDevices(sub.id),
      staleTime: API.BALANCE_STALE_TIME_MS,
    })),
  });

  // Подписка, у которой разбираем исчерпанный лимит устройств.
  const [deviceLimitSubId, setDeviceLimitSubId] = useState<number | null>(null);
  const deviceLimitSub = visibleSubscriptions.find((s) => s.id === deviceLimitSubId) ?? null;
  const deviceLimitDevices =
    deviceQueries[visibleSubscriptions.findIndex((s) => s.id === deviceLimitSubId)]?.data;

  const { data: referralInfo, isLoading: refLoading } = useQuery({
    queryKey: ['referral-info'],
    queryFn: referralApi.getReferralInfo,
    staleTime: 60_000,
  });

  const { data: wheelConfig } = useQuery({
    queryKey: ['wheel-config'],
    queryFn: wheelApi.getConfig,
    staleTime: 60000,
    retry: false,
  });

  const { data: pendingGifts } = useQuery({
    queryKey: ['pending-gifts'],
    queryFn: giftApi.getPendingGifts,
    staleTime: 30_000,
    retry: false,
  });

  const { data: promoGroupData } = useQuery({
    queryKey: ['promo-group-discounts'],
    queryFn: promoApi.getGroupDiscounts,
    staleTime: 60_000,
    retry: false,
  });

  // ── Luna active dashboard: данные выбранной живой подписки ──────────
  // Ключи совпадают со страницами Subscription/RenewSubscription, чтобы кэш
  // был общим и переходы между экранами не дёргали сеть повторно.

  const {
    data: renewalOptions,
    isLoading: renewalLoading,
    isError: renewalError,
    refetch: refetchRenewalOptions,
  } = useQuery({
    queryKey: ['renewal-options', activeSubId],
    queryFn: () => subscriptionApi.getRenewalOptions(activeSubId),
    enabled: activeSubId != null,
    staleTime: 60_000,
  });

  const {
    data: regularTrafficPackages,
    isLoading: regularTrafficPackagesLoading,
    isError: regularTrafficPackagesError,
    refetch: refetchRegularTrafficPackages,
  } = useQuery({
    queryKey: ['traffic-packages', activeSubId, 'regular'],
    queryFn: () => subscriptionApi.getTrafficPackages(activeSubId, 'regular'),
    enabled: activeSubId != null,
    staleTime: 60_000,
  });

  const hasLteTraffic = (activeSubscription?.whitelist_traffic_limit_gb ?? 0) > 0;

  const {
    data: lteTrafficPackages,
    isLoading: lteTrafficPackagesLoading,
    isError: lteTrafficPackagesError,
    refetch: refetchLteTrafficPackages,
  } = useQuery({
    queryKey: ['traffic-packages', activeSubId, 'whitelist'],
    queryFn: () => subscriptionApi.getTrafficPackages(activeSubId, 'whitelist'),
    enabled: activeSubId != null && hasLteTraffic,
    staleTime: 60_000,
  });

  const {
    data: connectionLink,
    isLoading: connectionLinkLoading,
    isError: connectionLinkError,
    refetch: refetchConnectionLink,
  } = useQuery({
    queryKey: ['connection-link', activeSubId],
    queryFn: () => subscriptionApi.getConnectionLink(activeSubId),
    enabled: activeSubId != null,
    retry: false,
    staleTime: 60_000,
  });

  // Нужен только флаг happ_enabled: если админ выключил HAPP, кнопку
  // «Подключить в HAPP» не показываем даже при наличии deeplink в ответе.
  const {
    data: happDownloads,
    isLoading: happDownloadsLoading,
    isError: happDownloadsError,
    refetch: refetchHappDownloads,
  } = useQuery({
    queryKey: ['happ-downloads'],
    queryFn: () => subscriptionApi.getHappDownloads(),
    enabled: activeSubId != null,
    retry: false,
    staleTime: 300_000,
  });

  const {
    data: purchaseOptions,
    isLoading: purchaseOptionsLoading,
    isError: purchaseOptionsError,
    refetch: refetchPurchaseOptions,
  } = useQuery({
    queryKey: ['purchase-options', activeSubId],
    queryFn: () => subscriptionApi.getPurchaseOptions(activeSubId),
    enabled: activeSubId != null,
    staleTime: 60_000,
  });

  const deleteDeviceMutation = useMutation({
    mutationFn: (hwid: string) => subscriptionApi.deleteDevice(hwid, activeSubId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices', activeSubId] });
      queryClient.invalidateQueries({ queryKey: ['devices'] });
    },
  });

  const activateTrialMutation = useMutation({
    mutationFn: () => subscriptionApi.activateTrial(),
    onSuccess: () => {
      setTrialError(null);
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      queryClient.invalidateQueries({ queryKey: ['subscriptions-list'] });
      queryClient.invalidateQueries({ queryKey: ['trial-info'] });
      queryClient.invalidateQueries({ queryKey: ['balance'] });
      queryClient.invalidateQueries({ queryKey: ['purchase-options'] });
      refreshUser();
    },
    onError: (error: unknown) => {
      setTrialError(getApiErrorMessage(error, t('common.error')));
    },
  });

  // Traffic refresh state and mutation
  const [trafficRefreshCooldown, setTrafficRefreshCooldown] = useState(0);
  const [pendingRemovalHwid, setPendingRemovalHwid] = useState<string | null>(null);
  const [trafficData, setTrafficData] = useState<{
    traffic_used_gb: number;
    traffic_used_percent: number;
    is_unlimited: boolean;
  } | null>(null);

  const refreshTrafficMutation = useMutation({
    mutationFn: () => subscriptionApi.refreshTraffic(activeSubId),
    onSuccess: (data) => {
      setTrafficData({
        traffic_used_gb: data.traffic_used_gb,
        traffic_used_percent: data.traffic_used_percent,
        is_unlimited: data.is_unlimited,
      });
      safeLocal.setItem(`traffic_refresh_ts_${activeSubId ?? 'default'}`, Date.now().toString());
      if (data.rate_limited && data.retry_after_seconds) {
        setTrafficRefreshCooldown(data.retry_after_seconds);
      } else {
        setTrafficRefreshCooldown(30);
      }
      queryClient.invalidateQueries({ queryKey: ['subscription', activeSubId] });
      queryClient.invalidateQueries({ queryKey: ['subscription', undefined] });
    },
    onError: (error: {
      response?: { status?: number; headers?: { get?: (key: string) => string } };
    }) => {
      if (error.response?.status === 429) {
        const retryAfter = error.response.headers?.get?.('Retry-After');
        setTrafficRefreshCooldown(retryAfter ? parseInt(retryAfter, 10) : 30);
      }
    },
  });

  // Cooldown timer
  useEffect(() => {
    if (trafficRefreshCooldown <= 0) return;
    const timer = setInterval(() => {
      setTrafficRefreshCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [trafficRefreshCooldown]);

  // Auto-refresh traffic on mount (with 30s caching)
  const autoRefreshedSubId = useRef<number | null>(null);

  useEffect(() => {
    if (!activeSubscription || activeSubId == null) return;
    if (autoRefreshedSubId.current === activeSubId) return;
    autoRefreshedSubId.current = activeSubId;

    const lastRefresh = safeLocal.getItem(`traffic_refresh_ts_${activeSubId ?? 'default'}`);
    const now = Date.now();
    const cacheMs = API.TRAFFIC_CACHE_MS;

    if (lastRefresh && now - parseInt(lastRefresh, 10) < cacheMs) {
      const elapsed = now - parseInt(lastRefresh, 10);
      const remaining = Math.ceil((cacheMs - elapsed) / 1000);
      if (remaining > 0) {
        setTrafficRefreshCooldown(remaining);
      }
      return;
    }

    refreshTrafficMutation.mutate();
  }, [activeSubId, activeSubscription, refreshTrafficMutation]);

  // В multi-tariff /cabinet/subscription отключён, поэтому subscriptionResponse=undefined.
  // Используем список из /cabinet/subscriptions/list — пустой массив означает «нет подписок»,
  // и тогда показываем TrialOfferCard. Без этой ветки multi-tariff юзер никогда не видел триал.
  const hasNoSubscription = isMultiTariff
    ? multiSubData !== undefined && (multiSubData.subscriptions?.length ?? 0) === 0
    : subscriptionResponse?.has_subscription === false && !subLoading;

  // Есть ли НАСТОЯЩАЯ (платная, не триал) живая подписка — от этого зависит CTA:
  // «+ Купить ещё» только при наличии платной; иначе явная «Посмотреть тарифы».
  const hasActivePaid = (multiSubData?.subscriptions ?? []).some(
    (s) => !s.is_trial && (s.status === 'active' || s.status === 'limited'),
  );

  // Show onboarding for new users after data loads
  useEffect(() => {
    if (!isOnboardingCompleted && !subLoading && !refLoading && !blockingType) {
      const timer = setTimeout(() => setShowOnboarding(true), 500);
      return () => clearTimeout(timer);
    }
  }, [isOnboardingCompleted, subLoading, refLoading, blockingType]);

  const onboardingSteps = useMemo(() => {
    type Placement = 'top' | 'bottom' | 'left' | 'right';
    const steps: Array<{
      target: string;
      title: string;
      description: string;
      placement: Placement;
    }> = [
      {
        target: 'welcome',
        title: t('onboarding.steps.welcome.title'),
        description: t('onboarding.steps.welcome.description'),
        placement: 'bottom',
      },
      {
        target: 'balance',
        title: t('onboarding.steps.balance.title'),
        description: t('onboarding.steps.balance.description'),
        placement: 'bottom',
      },
    ];

    if (dashboardSubscription?.subscription_url) {
      steps.splice(1, 0, {
        target: 'connect-devices',
        title: t('onboarding.steps.connectDevices.title'),
        description: t('onboarding.steps.connectDevices.description'),
        placement: 'bottom',
      });
    }

    return steps;
  }, [dashboardSubscription, t]);

  const handleOnboardingComplete = () => {
    completeOnboarding();
    setShowOnboarding(false);
  };

  const userName = displayName(user);

  // Подпись под числом с правильным склонением: «1 день», «2 дня», «5 дней».
  const pluralLabel = (baseKey: string, count: number) => {
    const form = new Intl.PluralRules(i18n.language).select(count);
    return t(`${baseKey}_${form}`, t(`${baseKey}_many`));
  };

  // ── Luna active dashboard: производные значения и обработчики ────────

  const regularTraffic: LunaTrafficSnapshot | null = activeSubscription
    ? {
        usedGb: trafficData?.traffic_used_gb ?? activeSubscription.traffic_used_gb,
        limitGb: activeSubscription.traffic_limit_gb,
        percent: trafficData?.traffic_used_percent ?? activeSubscription.traffic_used_percent,
        isUnlimited: trafficData?.is_unlimited ?? activeSubscription.traffic_limit_gb <= 0,
      }
    : null;

  const lteTraffic: LunaTrafficSnapshot | null =
    activeSubscription && hasLteTraffic
      ? {
          usedGb: activeSubscription.whitelist_traffic_used_gb ?? 0,
          limitGb: activeSubscription.whitelist_traffic_limit_gb ?? 0,
          percent: activeSubscription.whitelist_traffic_used_percent ?? 0,
          isUnlimited: false,
        }
      : null;

  const hideAccessLink =
    connectionLink?.hide_link ?? activeSubscription?.hide_subscription_link ?? false;
  const accessLink = hideAccessLink
    ? null
    : (connectionLink?.subscription_url ??
      connectionLink?.display_link ??
      activeSubscription?.subscription_url ??
      null);
  const happLink =
    happDownloads && !happDownloads.happ_enabled
      ? null
      : isHappCryptolinkMode(connectionLink?.connect_mode)
        ? resolveConnectionUrlForUi({
            mode: connectionLink?.connect_mode,
            happSchemeLink: connectionLink?.happ_scheme_link,
            displayLink: connectionLink?.display_link,
            subscriptionUrl: connectionLink?.subscription_url,
            happCryptLink: connectionLink?.happ_cryptolink,
            happCryptoLink: connectionLink?.happ_crypto_link,
            happLink: connectionLink?.happ_link,
            fallbackUrl: activeSubscription?.subscription_url,
          })
        : (connectionLink?.happ_scheme_link ??
          connectionLink?.happ_redirect_link ??
          connectionLink?.happ_link ??
          null);

  const qrConnectionUrl = useMemo(
    () =>
      resolveConnectionUrlForUi({
        mode: connectionLink?.connect_mode,
        happSchemeLink: connectionLink?.happ_scheme_link,
        displayLink: connectionLink?.display_link,
        subscriptionUrl: connectionLink?.subscription_url,
        happCryptLink: connectionLink?.happ_cryptolink,
        happCryptoLink: connectionLink?.happ_crypto_link,
        happLink: connectionLink?.happ_link,
        fallbackUrl: activeSubscription?.subscription_url,
      }),
    [connectionLink, activeSubscription?.subscription_url],
  );

  // Как Connection.tsx: в Telegram deeplink идёт через redirect-обёртку и
  // sdkOpenLink, в браузере — openAppScheme (iframe для custom-схем).
  const openDeepLink = (url: string) => {
    let target = url;
    if (isInTelegramWebApp()) {
      const isHttpUrl = /^https?:\/\//i.test(target);
      if (!isHttpUrl) {
        target = `${window.location.origin}/miniapp/redirect.html?url=${encodeURIComponent(target)}&lang=${i18n.language || 'en'}`;
      }
      try {
        sdkOpenLink(target, { tryInstantView: false });
        return;
      } catch {
        // SDK недоступен — уходим в браузерный путь ниже.
      }
    }
    openAppScheme(target);
  };

  const [accessCopied, setAccessCopied] = useState(false);
  useEffect(() => {
    if (!accessCopied) return;
    const timer = setTimeout(() => setAccessCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [accessCopied]);

  const handleCopyAccess = () => {
    if (!accessLink) return;
    void copyToClipboard(accessLink)
      .then(() => setAccessCopied(true))
      .catch(() => setAccessCopied(false));
  };

  const handleShowQr = () => {
    const url = qrConnectionUrl ?? accessLink;
    if (!url) return;
    navigate('/connection/qr', {
      state: { url, hideLink: hideAccessLink, subscriptionId: activeSubId },
    });
  };

  // Быстрое продление: цену/оплату не дублируем — подтверждение уводит в
  // существующий flow /subscriptions/:id/renew.
  const [selectedRenewalPeriod, setSelectedRenewalPeriod] = useState<number | null>(null);
  const effectiveRenewalPeriod =
    selectedRenewalPeriod ??
    renewalOptions?.find((option) => option.is_highlighted)?.period_days ??
    renewalOptions?.[0]?.period_days ??
    null;

  const [showTrafficTopup, setShowTrafficTopup] = useState(false);
  const [selectedTrafficPackage, setSelectedTrafficPackage] = useState<number | null>(null);
  const [trafficTopupScope, setTrafficTopupScope] = useState<'regular' | 'whitelist'>('regular');
  const [showDeviceTopup, setShowDeviceTopup] = useState(false);
  const [devicesToAdd, setDevicesToAdd] = useState(1);

  const openTrafficTopup = (pkg: TrafficPackage, scope: 'regular' | 'whitelist') => {
    setTrafficTopupScope(scope);
    setSelectedTrafficPackage(pkg.gb);
    setShowTrafficTopup(true);
  };

  const handleRemoveDevice = (device: Device) => {
    if (pendingRemovalHwid || deleteDeviceMutation.isPending) return;
    setPendingRemovalHwid(device.hwid);
    void nativeDialog
      .confirm(t('subscription.deleteDevice', 'Удалить устройство'))
      .then((confirmed) => {
        if (!confirmed) {
          setPendingRemovalHwid(null);
          return;
        }
        deleteDeviceMutation.mutate(device.hwid, {
          onSettled: () => setPendingRemovalHwid(null),
        });
      })
      .catch(() => setPendingRemovalHwid(null));
  };

  const handleRefreshTraffic = () => {
    if (activeSubId == null || trafficRefreshCooldown > 0 || refreshTrafficMutation.isPending)
      return;
    refreshTrafficMutation.mutate();
  };

  const formatKopeks = (kopeks: number) => `${formatAmount(kopeks / 100)} ${currencySymbol}`;
  const formatDate = (date: string) => new Date(date).toLocaleDateString(uiLocale());

  const lunaLabels: LunaActiveLabels = {
    hero: {
      trial: t('dashboard.luna.hero.trial', 'Пробная подписка'),
      paid: t('dashboard.luna.hero.paid', 'Ваша подписка'),
      manage: t('dashboard.luna.hero.manage', 'Управление'),
      until: t('dashboard.luna.hero.until', 'Активна до'),
      daysLeft: activeSubscription
        ? pluralLabel('subscription.trial.daysLabel', activeSubscription.days_left)
        : undefined,
    },
    traffic: {
      regular: t('dashboard.luna.traffic.regular', 'Основной трафик'),
      lte: t('dashboard.luna.traffic.lte', 'LTE-трафик'),
      unit: t('common.units.gb', 'ГБ'),
      regularEmpty: t('dashboard.luna.traffic.regularEmpty', 'Данные о трафике недоступны'),
      lteEmpty: t('dashboard.luna.traffic.lteEmpty', 'LTE-трафик не подключён'),
      refresh: t('dashboard.luna.traffic.refresh', 'Обновить трафик'),
      refreshing: t('dashboard.luna.traffic.refreshing', 'Обновляем трафик…'),
    },
    devices: {
      title: t('dashboard.luna.devices.title', 'Подключённые устройства'),
      manage: t('dashboard.luna.devices.manage', 'Управление устройствами'),
      disconnect: t('dashboard.luna.devices.disconnect', 'Отключить'),
      empty: t('dashboard.luna.devices.empty', 'Нет подключённых устройств'),
    },
    renewal: {
      title: t('dashboard.luna.renewal.title', 'Быстрое продление'),
      allOptions: t('dashboard.luna.renewal.allOptions', 'Все варианты'),
      submit: t('dashboard.luna.renewal.submit', 'Продлить подписку'),
      empty: t('dashboard.luna.renewal.empty', 'Нет доступных вариантов продления'),
    },
    connection: {
      title: t('dashboard.luna.connection.title', 'Доступ и подключение'),
      copy: t('dashboard.luna.connection.copy', 'Скопировать ссылку'),
      copied: t('dashboard.luna.connection.copied', 'Ссылка скопирована'),
      happ: t('dashboard.luna.connection.happ', 'Подключить в HAPP'),
      incy: t('dashboard.luna.connection.incy', 'Подключить в INCY'),
      qr: t('dashboard.luna.connection.qr', 'Показать QR-код'),
      empty: t('dashboard.luna.connection.empty', 'Ссылка подписки недоступна'),
    },
    addons: {
      title: t('dashboard.luna.addons.title', 'Докупка'),
      devices: t('dashboard.luna.addons.devices', 'Дополнительные устройства'),
      traffic: t('dashboard.luna.addons.traffic', 'Основной трафик'),
      lte: t('dashboard.luna.addons.lte', 'LTE-трафик'),
      addDevices: t('dashboard.luna.addons.addDevices', 'Добавить устройства'),
      addTraffic: t('dashboard.luna.addons.addTraffic', 'Добавить трафик'),
      addLte: t('dashboard.luna.addons.addLte', 'Добавить LTE-трафик'),
      unlimited: t('dashboard.unlimited', 'Безлимит'),
      unavailable: t('dashboard.luna.addons.unavailable', 'Недоступно'),
      empty: t('dashboard.luna.addons.empty', 'Докупка недоступна'),
    },
  };

  const devicesConfig = purchaseOptions?.sales_mode === 'classic' ? purchaseOptions.devices : null;

  const activeDashboardLoading = Boolean(
    activeSubscription &&
      (devicesLoading ||
        renewalLoading ||
        regularTrafficPackagesLoading ||
        (hasLteTraffic && lteTrafficPackagesLoading) ||
        connectionLinkLoading ||
        happDownloadsLoading ||
        purchaseOptionsLoading),
  );
  const activeDashboardError = Boolean(
    activeSubscription &&
      (devicesError ||
        renewalError ||
        regularTrafficPackagesError ||
        (hasLteTraffic && lteTrafficPackagesError) ||
        connectionLinkError ||
        happDownloadsError ||
        purchaseOptionsError),
  );
  const retryActiveDashboard = () => {
    void Promise.all([
      refetchDevices(),
      refetchRenewalOptions(),
      refetchRegularTrafficPackages(),
      ...(hasLteTraffic ? [refetchLteTrafficPackages()] : []),
      refetchConnectionLink(),
      refetchHappDownloads(),
      refetchPurchaseOptions(),
    ]);
  };

  // Stagger-вход секций дашборда: фиксированные индексы (задержка = база + индекс*шаг),
  // взаимоисключающие ветки получают одинаковый индекс. Exit не задаём — уход страницы
  // уже анимирован AnimatePresence в AppShell, второй exit дал бы мигание.
  const section = (index: number) => staggerEntrance(index, 0.05, 0.07);

  const trialIsFree = trialInfo ? !trialInfo.requires_payment : true;
  const trialCanAfford =
    trialInfo != null && (balanceData?.balance_kopeks ?? 0) >= trialInfo.price_kopeks;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div data-onboarding="welcome" {...section(0)}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-3xl font-bold tracking-tight text-dark-50 sm:text-4xl">
              {t('dashboard.title', 'Кабинет')}
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <p className="text-dark-400">
                {userName
                  ? t('dashboard.welcome', { name: userName })
                  : t('dashboard.welcomeNoName', 'Ваша подписка и подключённые устройства')}
              </p>
              {promoGroupData?.group_name && (
                <span
                  className="inline-flex max-w-[160px] items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                  style={{
                    background: 'rgba(var(--color-accent-400), 0.1)',
                    border: '1px solid rgba(var(--color-accent-400), 0.2)',
                    color: 'rgb(var(--color-accent-400))',
                  }}
                >
                  <StarIcon filled className="h-2.5 w-2.5 shrink-0" />
                  <span className="truncate">{promoGroupData.group_name}</span>
                </span>
              )}
            </div>
          </div>
          <Link
            to="/balance"
            data-onboarding="balance"
            className="glass-surface flex shrink-0 flex-col rounded-2xl px-4 py-2 transition-colors hover:border-accent-400/30"
          >
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-dark-400">
              {t('dashboard.currentBalance', 'Текущий баланс')}
            </span>
            <span className="mt-0.5 text-lg font-bold leading-tight text-dark-50">
              {formatAmount(balanceData?.balance_rubles ?? 0)} {currencySymbol}
            </span>
          </Link>
        </div>
      </motion.div>

      {subscriptionsError && (
        <motion.div {...section(1)} className="glass-surface space-y-3 p-4" role="alert">
          <p className="text-sm text-dark-300">
            {t('dashboard.subscriptionsError', 'Не удалось загрузить подписки')}
          </p>
          <button
            type="button"
            onClick={() => refetchSubscriptions()}
            className="btn-secondary min-h-10 px-4 py-2 text-xs"
          >
            {t('common.retry', 'Повторить')}
          </button>
        </motion.div>
      )}

      {/* Pending Gift Activations */}
      {pendingGifts && pendingGifts.length > 0 && (
        <motion.div {...section(1)}>
          <PendingGiftCard gifts={pendingGifts} />
        </motion.div>
      )}

      {/* Multi-tariff selector. The selected item feeds the same Luna composition
          below, so every subscription keeps its real target queries and actions. */}
      {isMultiTariff && multiSubData?.subscriptions && multiSubData.subscriptions.length > 0 && (
        <motion.div {...section(1)} className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-sm font-medium text-dark-400">
              {t('dashboard.subscriptions', 'Подписки')}
            </span>
            <Link to="/subscriptions" className="text-xs text-accent-400 hover:underline">
              {t('dashboard.manageAll', 'Управление')} →
            </Link>
          </div>
          <div
            role="radiogroup"
            aria-label={t('dashboard.subscriptionSelector', 'Dashboard subscriptions')}
            className="grid gap-2 sm:grid-cols-3"
          >
            {visibleSubscriptions.map((sub, index) => {
              const connectedDevices = deviceQueries[index]?.data?.total;
              const isSelected = sub.id === selectedSubscriptionId;
              const isAtDeviceLimit =
                connectedDevices != null &&
                sub.device_limit > 0 &&
                connectedDevices >= sub.device_limit;

              return (
                <div key={sub.id} className="space-y-2">
                  <button
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    aria-label={sub.tariff_name || t('subscription.defaultName', 'Подписка')}
                    onClick={() => setSelectedSubId(sub.id)}
                    className={`w-full rounded-2xl border p-3 text-left transition-colors ${
                      isSelected
                        ? 'border-accent-400 bg-accent-400/10 text-dark-50'
                        : 'border-dark-700/70 bg-dark-800/35 text-dark-300 hover:border-accent-400/30'
                    }`}
                  >
                    <span className="block truncate text-sm font-semibold">
                      {sub.tariff_name || t('subscription.defaultName', 'Подписка')}
                    </span>
                    <span className="mt-1 block text-xs text-dark-400">{sub.status}</span>
                    {connectedDevices != null && (
                      <span className="mt-1 block text-xs text-dark-400">
                        {connectedDevices} / {sub.device_limit || '∞'}
                      </span>
                    )}
                  </button>
                  {isAtDeviceLimit && (
                    <button
                      type="button"
                      onClick={() => setDeviceLimitSubId(sub.id)}
                      className="w-full rounded-xl border border-warning-400/20 bg-warning-400/10 px-3 py-2 text-xs font-medium text-warning-400"
                    >
                      {t('subscription.connectFooter.full', 'Все слоты заняты')}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          {multiSubData.subscriptions.length > 3 && (
            <Link
              to="/subscriptions"
              className="flex w-full items-center justify-center rounded-2xl border border-dashed border-white/15 p-3 text-xs opacity-50 transition-opacity hover:opacity-80"
            >
              {t('dashboard.showAll', 'Показать все')} ({multiSubData.subscriptions.length})
            </Link>
          )}
          {hasActivePaid ? (
            <Link
              to="/subscription/purchase"
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-accent-500/15 p-3.5 text-sm font-medium text-accent-400 transition-all hover:bg-accent-500/25"
            >
              <span className="text-base">+</span>{' '}
              {t('subscriptions.buyAnother', 'Купить ещё тариф')}
            </Link>
          ) : (
            <Link
              to="/subscription/purchase"
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-accent-500 p-3.5 text-sm font-semibold text-on-accent transition-colors hover:bg-accent-600"
            >
              <span className="text-base">+</span>{' '}
              {t('subscriptions.browsePlans', 'Посмотреть тарифы и купить подписку')}
            </Link>
          )}
        </motion.div>
      )}

      {/* Selected subscription status */}
      {(isMultiTariff ? selectedSubscriptionId != null : true) && (
        <motion.div
          {...section(1)}
          data-onboarding={dashboardSubscription?.subscription_url ? 'connect-devices' : undefined}
        >
          {dashboardSubscriptionLoading ? (
            <LunaLoadingState message={t('dashboard.luna.loading', 'Загружаем подписку…')} />
          ) : isMultiTariff && selectedSubscriptionError ? (
            <div className="glass-surface space-y-3 p-4" role="alert">
              <p className="text-sm text-dark-300">
                {t('dashboard.subscriptionError', 'Не удалось загрузить подписку')}
              </p>
              <button
                type="button"
                onClick={() => refetchSelectedSubscription()}
                className="btn-secondary min-h-10 px-4 py-2 text-xs"
              >
                {t('common.retry', 'Повторить')}
              </button>
            </div>
          ) : dashboardSubscription?.is_expired ||
            dashboardSubscription?.status === 'disabled' ||
            dashboardSubscription?.is_limited ? (
            <SubscriptionCardExpired
              subscription={dashboardSubscription}
              balanceKopeks={balanceData?.balance_kopeks ?? 0}
              balanceRubles={balanceData?.balance_rubles ?? 0}
            />
          ) : activeSubscription ? (
            activeDashboardError ? (
              <div className="glass-surface space-y-3 p-4" role="alert">
                <p className="text-sm text-dark-300">
                  {t('dashboard.activeError', 'Не удалось загрузить данные подписки')}
                </p>
                <button
                  type="button"
                  onClick={retryActiveDashboard}
                  className="btn-secondary min-h-10 px-4 py-2 text-xs"
                >
                  {t('common.retry', 'Повторить')}
                </button>
              </div>
            ) : (
              <LunaActiveDashboard
                subscription={activeSubscription}
                devices={devicesData?.devices ?? []}
                regularTraffic={regularTraffic}
                lteTraffic={lteTraffic}
                accessLink={accessLink}
                happLink={happLink}
                incyLink={null}
                incyAvailable={Boolean(connectionLink)}
                qrAvailable={Boolean(qrConnectionUrl ?? accessLink)}
                renewalOptions={renewalOptions ?? []}
                selectedRenewalPeriod={effectiveRenewalPeriod}
                regularTrafficPackages={regularTrafficPackages ?? []}
                lteTrafficPackages={lteTrafficPackages ?? []}
                devicesConfig={devicesConfig}
                labels={lunaLabels}
                loadingMessage={t('dashboard.luna.loading', 'Загружаем подписку…')}
                emptyMessage={t('dashboard.luna.empty', 'Нет активной подписки')}
                formatDate={formatDate}
                formatDeviceDate={formatDate}
                formatUsage={(traffic) =>
                  traffic.isUnlimited
                    ? t('dashboard.unlimited', 'Безлимит')
                    : `${formatTraffic(traffic.usedGb)} / ${formatTraffic(traffic.limitGb)}`
                }
                formatPrice={(option: RenewalOption) => formatKopeks(option.price_kopeks)}
                formatPackagePrice={(pkg: TrafficPackage) => formatKopeks(pkg.price_kopeks)}
                formatPeriod={(periodDays) =>
                  `${String(periodDays)} ${pluralLabel('subscription.trial.daysLabel', periodDays)}`
                }
                isLoading={activeDashboardLoading}
                isCopied={accessCopied}
                isRemovingHwid={pendingRemovalHwid}
                onRefreshTraffic={handleRefreshTraffic}
                isRefreshingTraffic={refreshTrafficMutation.isPending}
                trafficRefreshCooldown={trafficRefreshCooldown}
                onManageSubscription={() => navigate(`/subscriptions/${activeSubscription.id}`)}
                onManageDevices={() => navigate(`/subscriptions/${activeSubscription.id}`)}
                onRemoveDevice={handleRemoveDevice}
                onCopyAccess={handleCopyAccess}
                onConnectHapp={happLink ? () => openDeepLink(happLink) : undefined}
                onConnectIncy={
                  connectionLink
                    ? () => navigate(`/connection?sub=${activeSubscription.id}`)
                    : undefined
                }
                onShowQr={handleShowQr}
                onSelectRenewal={(option) => setSelectedRenewalPeriod(option.period_days)}
                onSubmitRenewal={undefined}
                onOpenRenewalOptions={() =>
                  navigate(`/subscriptions/${activeSubscription.id}/renew`)
                }
                onOpenDeviceAddon={() => setShowDeviceTopup(true)}
                onOpenTrafficAddon={(pkg) => openTrafficTopup(pkg, 'regular')}
                onOpenLteAddon={(pkg) => openTrafficTopup(pkg, 'whitelist')}
                submitRenewalLabel={t('dashboard.luna.renewal.open', 'Open renewal options')}
              />
            )
          ) : null}
        </motion.div>
      )}

      {/* Нет подписок: welcome-композиция — триал (если доступен), оффер,
          рефералка и поддержка. Явная кнопка покупки живёт в StandardOffer —
          раньше при доступном триале это был единственный экран без кнопки
          покупки (Telegram-баг #605056/#605063). */}
      {hasNoSubscription && !trialLoading && (
        <motion.div {...section(2)} className="space-y-4">
          {trialInfo?.is_available && (
            <TrialHero
              eyebrow={t('dashboard.luna.trial.eyebrow', 'Пробный период')}
              title={
                trialIsFree
                  ? t('dashboard.trialOffer.freeTitle')
                  : t('dashboard.trialOffer.paidTitle')
              }
              description={
                trialIsFree
                  ? t('dashboard.trialOffer.freeDesc')
                  : t('dashboard.trialOffer.paidDesc')
              }
              stats={[
                {
                  value: String(trialInfo.duration_days),
                  label: pluralLabel('subscription.trial.daysLabel', trialInfo.duration_days),
                },
                {
                  value:
                    trialInfo.traffic_limit_gb === 0 ? '∞' : String(trialInfo.traffic_limit_gb),
                  label: t('common.units.gb', 'ГБ'),
                },
                {
                  value: trialInfo.device_limit === 0 ? '∞' : String(trialInfo.device_limit),
                  label: pluralLabel('subscription.trial.devicesLabel', trialInfo.device_limit),
                },
              ]}
              price={
                !trialIsFree && trialInfo.price_kopeks > 0
                  ? formatKopeks(trialInfo.price_kopeks)
                  : undefined
              }
              priceLabel={t('dashboard.luna.trial.priceLabel', 'Стоимость')}
              balance={
                !trialIsFree && trialInfo.price_kopeks > 0
                  ? `${formatAmount(balanceData?.balance_rubles ?? 0)} ${currencySymbol}`
                  : undefined
              }
              balanceLabel={t('balance.currentBalance', 'Текущий баланс')}
              error={
                trialError ??
                (!trialIsFree && !trialCanAfford
                  ? t('subscription.trial.insufficientBalance')
                  : undefined)
              }
              loading={activateTrialMutation.isPending}
              action={
                !trialIsFree && trialInfo.price_kopeks > 0 && !trialCanAfford
                  ? {
                      label: t('subscription.trial.topUpToActivate'),
                      to: '/balance',
                    }
                  : {
                      label: trialIsFree
                        ? t('subscription.trial.activate')
                        : t('subscription.trial.payAndActivate'),
                      loadingLabel: t('common.loading'),
                      onClick: () => {
                        if (!activateTrialMutation.isPending) activateTrialMutation.mutate();
                      },
                    }
              }
            />
          )}

          <div className="grid gap-4 lg:grid-cols-2">
            <StandardOffer
              title={t('dashboard.luna.offer.title', 'Полный доступ без ограничений')}
              description={t(
                'dashboard.luna.offer.description',
                'Выберите тариф с нужным трафиком, числом устройств и сроком — оплата с баланса или картой.',
              )}
              price={t('dashboard.luna.offer.price', 'Гибкие тарифы')}
              priceLabel={t('dashboard.luna.offer.priceLabel', 'на любой сценарий')}
              action={{
                label: t('subscriptions.browsePlans', 'Посмотреть тарифы и купить подписку'),
                to: '/subscription/purchase',
              }}
            />

            <ReferralPromo
              title={t('dashboard.luna.referral.title', 'Приглашайте друзей')}
              description={t(
                'dashboard.luna.referral.description',
                'Делитесь ссылкой и получайте бонусы на баланс за каждую оплату приглашённых.',
              )}
              stats={[
                {
                  value: String(referralInfo?.total_referrals ?? 0),
                  label: t('dashboard.luna.referral.statReferrals', 'Приглашено'),
                },
                {
                  value: `${formatAmount(referralInfo?.available_balance_rubles ?? 0)} ${currencySymbol}`,
                  label: t('dashboard.luna.referral.statEarnings', 'Доступно на балансе'),
                },
              ]}
              loading={refLoading}
              action={{
                label: t('dashboard.luna.referral.action', 'Открыть реферальную программу'),
                to: '/referral',
              }}
            />
          </div>

          <SupportStrip
            title={t('dashboard.luna.support.title', 'Нужна помощь?')}
            description={t(
              'dashboard.luna.support.description',
              'Команда поддержки поможет с подключением и оплатой.',
            )}
            action={{
              label: t('dashboard.luna.support.action', 'Написать в поддержку'),
              to: '/support',
            }}
          />
        </motion.div>
      )}

      {/* Promo Offers */}
      <motion.div {...section(3)}>
        <PromoOffersSection />
      </motion.div>

      {/* Stats Grid */}
      <motion.div {...section(4)}>
        <StatsGrid
          balanceRubles={balanceData?.balance_rubles || 0}
          referralCount={referralInfo?.total_referrals || 0}
          earningsRubles={referralInfo?.available_balance_rubles || 0}
          refLoading={refLoading}
        />
      </motion.div>

      {/* Fortune Wheel Banner */}
      {wheelConfig?.is_enabled && (
        <motion.div {...section(5)}>
          {/* bento-card-hover несёт собственный CSS-вход (bentoFadeIn); вместе со
              stagger-обёрткой получилось бы двойное движение (до 32px по Y) —
              поэтому CSS-анимацию здесь гасим, вход делает stagger. */}
          <Link
            to="/wheel"
            className="bento-card-hover group flex animate-none items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <span className="text-3xl">🎰</span>
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-semibold text-dark-100">{t('wheel.banner.title')}</h3>
                <p className="text-sm text-dark-400">{t('wheel.banner.description')}</p>
              </div>
            </div>
            <div className="flex-shrink-0 text-dark-500 transition-all duration-300 group-hover:translate-x-1 group-hover:text-accent-400">
              <ChevronRightIcon />
            </div>
          </Link>
        </motion.div>
      )}

      {/* News Section */}
      <motion.div {...section(6)}>
        <NewsSection />
      </motion.div>

      {/* Onboarding Tutorial */}
      {showOnboarding && (
        <Onboarding
          steps={onboardingSteps}
          onComplete={handleOnboardingComplete}
          onSkip={handleOnboardingComplete}
        />
      )}

      {deviceLimitSub && (
        <DeviceLimitSheet
          isOpen
          onClose={() => setDeviceLimitSubId(null)}
          subscriptionId={deviceLimitSub.id}
          subscriptionName={deviceLimitSub.tariff_name || t('subscription.defaultName', 'Подписка')}
          deviceLimit={deviceLimitSub.device_limit}
          isTrial={deviceLimitSub.is_trial}
          devices={deviceLimitDevices?.devices ?? []}
          onOpenSubscription={() => {
            setDeviceLimitSubId(null);
            navigate(`/subscriptions/${deviceLimitSub.id}`);
          }}
        />
      )}

      {activeSubscription && showDeviceTopup && (
        <DeviceTopupSheet
          open={showDeviceTopup}
          onOpen={() => setShowDeviceTopup(true)}
          onClose={() => setShowDeviceTopup(false)}
          subscription={activeSubscription}
          subscriptionId={activeSubscription.id}
          devicesToAdd={devicesToAdd}
          onDevicesToAddChange={setDevicesToAdd}
          purchaseOptions={purchaseOptions}
          isDark={isDark}
        />
      )}

      {/* Докупка трафика из Luna add-ons: self-owned sheet со страницы
          подписки; выбранный пакет прокидываем, scope переключается внутри. */}
      {activeSubscription && (
        <TrafficTopupSheet
          key={`${activeSubscription.id}-${trafficTopupScope}`}
          open={showTrafficTopup}
          onOpen={() => setShowTrafficTopup(true)}
          onClose={() => setShowTrafficTopup(false)}
          subscription={activeSubscription}
          subscriptionId={activeSubscription.id}
          initialScope={trafficTopupScope}
          selectedTrafficPackage={selectedTrafficPackage}
          onSelectedTrafficPackageChange={setSelectedTrafficPackage}
          purchaseOptions={purchaseOptions}
          isDark={isDark}
        />
      )}
    </div>
  );
}
