import type { SubscriptionListItem, TrialInfo } from '../api/types';

export type AccountState =
  | 'none'
  | 'trial_available'
  | 'trial_active'
  | 'trial_expired'
  | 'paid_active'
  | 'paid_expiring'
  | 'paid_expired'
  | 'disabled';

/** Порог, с которого платная подписка считается «заканчивающейся». */
export const EXPIRING_SOON_DAYS = 3;

type SubscriptionLike = Pick<
  SubscriptionListItem,
  'status' | 'is_trial' | 'end_date' | 'days_left'
> & { is_expired?: boolean };

function isExpired(sub: SubscriptionLike, now: number): boolean {
  if (sub.is_expired || sub.status === 'expired') return true;
  if (!sub.end_date) return false;
  const end = Date.parse(sub.end_date);
  return Number.isFinite(end) && end <= now;
}

/**
 * Единая модель состояния аккаунта для экранов кабинета.
 * Берётся «главная» подписка: платная имеет приоритет над триалом,
 * активная — над истёкшей.
 */
export function deriveAccountState(
  subscriptions: SubscriptionLike[],
  trialInfo?: Pick<TrialInfo, 'is_available'> | null,
  now: number = Date.now(),
): AccountState {
  if (subscriptions.length === 0) {
    return trialInfo?.is_available ? 'trial_available' : 'none';
  }

  const alive = subscriptions.filter((sub) => !isExpired(sub, now) && sub.status !== 'disabled');
  const paid = alive.filter((sub) => !sub.is_trial);
  const main = paid[0] ?? alive[0];

  if (main) {
    if (main.is_trial) return 'trial_active';
    const daysLeft = main.end_date
      ? (Date.parse(main.end_date) - now) / 86_400_000
      : (main.days_left ?? Number.POSITIVE_INFINITY);
    return daysLeft <= EXPIRING_SOON_DAYS ? 'paid_expiring' : 'paid_active';
  }

  if (subscriptions.some((sub) => sub.status === 'disabled')) return 'disabled';
  return subscriptions.some((sub) => !sub.is_trial) ? 'paid_expired' : 'trial_expired';
}

/** Подписка закончилась и нужна покупка/продление. */
export function needsPurchase(state: AccountState): boolean {
  return (
    state === 'none' ||
    state === 'trial_available' ||
    state === 'trial_expired' ||
    state === 'paid_expired' ||
    state === 'disabled'
  );
}
