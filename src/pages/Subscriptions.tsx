import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Navigate, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import {
  CalendarIcon,
  CheckIcon,
  ClipboardIcon,
  ChevronRightIcon,
  DevicesIcon,
  PlusIcon,
  SubscriptionIcon,
} from '@/components/icons';
import { subscriptionApi } from '../api/subscription';
import { balanceApi } from '../api/balance';
import { useTheme } from '../hooks/useTheme';
import { getGlassColors } from '../utils/glassTheme';
import { useAuthStore } from '../store/auth';
import { getApiErrorMessage } from '../utils/api-error';
import TrialOfferCard from '../components/dashboard/TrialOfferCard';
import { Skeleton, SkeletonGroup } from '@/components/ui/skeleton';

function formatDate(iso: string | null, locale: string) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString(locale, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
}

function EmptyState({ onBuy }: { onBuy: () => void }) {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const g = getGlassColors(isDark);

  return (
    <div
      className="glass-surface rounded-2xl p-10 text-center"
      style={{ background: g.cardBg, borderColor: g.cardBorder }}
    >
      <div
        className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl"
        style={{ background: g.innerBg }}
      >
        <ClipboardIcon className="h-8 w-8 opacity-40" />
      </div>
      <h3 className="mb-2 text-xl font-semibold" style={{ color: g.text }}>
        {t('subscriptions.empty', 'Нет подписок')}
      </h3>
      <p className="mb-6 text-sm" style={{ color: g.textSecondary }}>
        {t('subscriptions.emptyDesc', 'У вас пока нет активных подписок')}
      </p>
      <button
        onClick={onBuy}
        className="rounded-xl bg-accent-500 px-8 py-3 text-sm font-medium text-on-accent transition-colors hover:bg-accent-600"
      >
        {t('subscriptions.buy', 'Купить подписку')}
      </button>
    </div>
  );
}

export default function Subscriptions() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const g = getGlassColors(isDark);
  const queryClient = useQueryClient();
  const refreshUser = useAuthStore((state) => state.refreshUser);
  const [trialError, setTrialError] = useState<string | null>(null);

  const { data, isError, isLoading, refetch } = useQuery({
    queryKey: ['subscriptions-list'],
    queryFn: () => subscriptionApi.getSubscriptions(),
    staleTime: 30_000,
    refetchOnMount: 'always',
  });

  const subscriptions = data?.subscriptions ?? [];
  const isMultiTariff = data?.multi_tariff_enabled ?? false;
  const hasNoSubscriptions = !isLoading && !isError && subscriptions.length === 0;
  // Есть ли хотя бы одна НАСТОЯЩАЯ (платная, не триал) живая подписка. От этого
  // зависит CTA: «+ Купить ещё» — только если уже есть платная; иначе показываем
  // явную «Посмотреть тарифы и купить подписку» (триал/истёкшие — это ещё не покупка).
  const hasActivePaid = subscriptions.some(
    (s) => !s.is_trial && (s.status === 'active' || s.status === 'limited'),
  );

  // Если у юзера нет подписок — проверяем доступность триала, иначе
  // (в multi-tariff) ему вообще негде увидеть оффер.
  const { data: trialInfo, isLoading: trialLoading } = useQuery({
    queryKey: ['trial-info'],
    queryFn: () => subscriptionApi.getTrialInfo(),
    enabled: hasNoSubscriptions,
    staleTime: 30_000,
  });

  const { data: balanceData } = useQuery({
    queryKey: ['balance'],
    queryFn: balanceApi.getBalance,
    enabled: hasNoSubscriptions && !!trialInfo?.is_available,
    staleTime: 30_000,
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

  // Single-tariff mode with one subscription: skip list, go directly to detail
  if (data && !isMultiTariff && subscriptions.length === 1) {
    return <Navigate to={`/subscriptions/${subscriptions[0].id}`} replace />;
  }

  return (
    <div className="luna-dashboard space-y-6">
      {/* Header */}
      <div className="ix-page-heading">
        <h1>{t('subscriptions.title', 'Мои подписки')}</h1>
        <p>{t('subscriptions.subtitle', 'Все тарифы и подключённые сервисы')}</p>
        {/* «+ Купить ещё» — только если уже есть платная активная подписка */}
        {!isLoading && !isError && hasActivePaid && (
          <button
            onClick={() => navigate('/tariffs')}
            className="button-lift mt-4 flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-accent-400 px-4 py-2 text-sm font-bold text-on-accent transition-colors"
          >
            <PlusIcon className="h-4 w-4" />
            {t('subscriptions.buyAnother', 'Новый тариф')}
          </button>
        )}
      </div>

      {isError && (
        <div className="glass-surface space-y-3 p-5" role="alert">
          <p className="text-sm text-dark-300">
            {t('subscriptions.loadError', 'Не удалось загрузить подписки')}
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="btn-secondary min-h-10 px-4 py-2 text-xs"
          >
            {t('common.retry', 'Повторить')}
          </button>
        </div>
      )}

      {/* Есть подписки, но платной активной нет (только триал/истёкшие) —
          даём ЯВНУЮ primary-кнопку покупки: мы продаём подписки. */}
      {!isLoading && !isError && subscriptions.length > 0 && !hasActivePaid && (
        <button
          onClick={() => navigate('/tariffs')}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-accent-500 p-3.5 text-sm font-semibold text-on-accent transition-colors hover:bg-accent-600"
        >
          <PlusIcon className="h-5 w-5" />
          {t('subscriptions.browsePlans', 'Посмотреть тарифы и купить подписку')}
        </button>
      )}

      {/* Loading */}
      {isLoading && (
        <SkeletonGroup className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[1, 2].map((i) => (
            <Skeleton
              key={i}
              variant="card"
              // Фон и рамку задаёт стеклянная тема, поэтому вариантную заливку гасим.
              className="h-36 border-0 bg-transparent"
              style={{ background: g.innerBg }}
            />
          ))}
        </SkeletonGroup>
      )}

      {/* Empty state: показываем триал, если доступен; иначе — обычный empty */}
      {hasNoSubscriptions && !trialLoading && trialInfo?.is_available && (
        <div className="space-y-4">
          <TrialOfferCard
            trialInfo={trialInfo}
            balanceKopeks={balanceData?.balance_kopeks ?? 0}
            balanceRubles={balanceData?.balance_rubles ?? 0}
            activateTrialMutation={activateTrialMutation}
            trialError={trialError}
          />
          {/* Новый пользователь не обязан активировать триал, чтобы попасть
              в витрину — даём явный путь к покупке подписки. Раньше при
              доступном триале это был единственный экран без кнопки «Купить»
              (Telegram-баг #605056/#605063). */}
          <button
            onClick={() => navigate('/tariffs')}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent-500 px-6 py-3 text-sm font-semibold text-on-accent transition-colors hover:bg-accent-600"
          >
            <PlusIcon className="h-5 w-5" />
            {t('subscriptions.browsePlans', 'Посмотреть тарифы и купить подписку')}
          </button>
        </div>
      )}
      {hasNoSubscriptions && !trialLoading && !trialInfo?.is_available && (
        <EmptyState onBuy={() => navigate('/tariffs')} />
      )}

      {/* Subscription grid */}
      {subscriptions.length > 0 && (
        <div className="grid gap-5 xl:grid-cols-2">
          {subscriptions.map((sub) => {
            const isExpired = sub.status === 'expired' || sub.status === 'disabled';
            const isLimited = sub.status === 'limited';
            const trafficPercent =
              sub.traffic_limit_gb > 0
                ? Math.min(100, (sub.traffic_used_gb / sub.traffic_limit_gb) * 100)
                : 0;
            const statusLabel = sub.is_trial
              ? t('subscription.statusTrial', 'Пробный период')
              : isExpired
                ? t('subscription.statusExpired', 'Завершена')
                : isLimited
                  ? t('subscription.statusLimited', 'Ограничена')
                  : t('subscription.statusActive', 'Активна');

            return (
              <button
                type="button"
                key={sub.id}
                onClick={() => navigate(`/subscriptions/${sub.id}`)}
                className="glass-panel motion-card group rounded-[30px] p-5 text-left transition-transform hover:-translate-y-0.5 lg:p-7"
                aria-label={sub.tariff_name || `Подписка #${sub.id}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="glass-control grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-accent-400">
                      <SubscriptionIcon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-lg font-medium text-dark-50">
                        {sub.tariff_name || `Подписка #${sub.id}`}
                      </p>
                      <p className="mt-1 text-xs text-dark-400">ID {sub.id}</p>
                    </div>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-3 py-1.5 text-[10px] font-bold ${
                      isExpired
                        ? 'bg-error-500/15 text-error-300'
                        : isLimited
                          ? 'bg-warning-500/15 text-warning-300'
                          : 'bg-accent-400 text-on-accent'
                    }`}
                  >
                    {statusLabel}
                  </span>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
                  <div className="min-w-0 rounded-2xl bg-white/5 px-3 py-3">
                    <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-[.1em] text-dark-400">
                      <CalendarIcon className="h-3.5 w-3.5" /> До
                    </p>
                    <p className="mt-1 truncate font-medium text-dark-50">
                      {formatDate(sub.end_date, i18n.language)}
                    </p>
                  </div>
                  <div className="min-w-0 rounded-2xl bg-white/5 px-3 py-3">
                    <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-[.1em] text-dark-400">
                      <CheckIcon className="h-3.5 w-3.5" /> Автопродление
                    </p>
                    <p className="mt-1 truncate font-medium text-dark-50">
                      {sub.autopay_enabled ? 'Включено' : 'Выключено'}
                    </p>
                  </div>
                  <div className="min-w-0 rounded-2xl bg-white/5 px-3 py-3">
                    <p className="text-[10px] uppercase tracking-[.1em] text-dark-400">Трафик</p>
                    <p className="mt-1 truncate font-medium text-dark-50">
                      {sub.traffic_limit_gb > 0
                        ? `${Number(sub.traffic_used_gb).toFixed(1)} / ${sub.traffic_limit_gb} ГБ`
                        : 'Безлимит'}
                    </p>
                  </div>
                  <div className="min-w-0 rounded-2xl bg-white/5 px-3 py-3">
                    <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-[.1em] text-dark-400">
                      <DevicesIcon className="h-3.5 w-3.5" /> Устройства
                    </p>
                    <p className="mt-1 truncate font-medium text-dark-50">
                      {sub.device_limit ? `${sub.device_limit} макс.` : '—'}
                    </p>
                  </div>
                </div>
                {sub.traffic_limit_gb > 0 && (
                  <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-accent-400"
                      style={{ width: `${trafficPercent}%` }}
                    />
                  </div>
                )}
                <div className="mt-5 flex items-center justify-end gap-1 text-xs font-bold text-accent-400">
                  Управление{' '}
                  <ChevronRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </button>
            );
          })}
          {isMultiTariff && (
            <div className="glass-panel flex min-h-44 items-center justify-center rounded-[30px] border-dashed">
              <button
                type="button"
                onClick={() => navigate('/tariffs?mode=add')}
                className="flex min-h-16 items-center gap-2 rounded-full px-6 text-sm font-bold text-accent-400"
              >
                <PlusIcon className="h-4 w-4" /> Подключить ещё тариф
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
