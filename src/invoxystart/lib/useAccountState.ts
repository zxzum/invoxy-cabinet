import { useQuery } from '@tanstack/react-query';
import { subscriptionApi } from '../api/subscription';
import type { TrialInfo } from '../api/types';
import { deriveAccountState, type AccountState } from './accountState';

/**
 * Состояние аккаунта для навигации и экранов. Использует те же query-ключи,
 * что и дашборд, поэтому дополнительных запросов не создаёт.
 */
export function useAccountState(): { state: AccountState | null; loading: boolean } {
  const { data: subsData, isLoading } = useQuery({
    queryKey: ['invoxy-subscriptions'],
    queryFn: () => subscriptionApi.getSubscriptions(),
    staleTime: 30_000,
  });
  const subscriptions = subsData?.subscriptions ?? [];
  const { data: trialInfo } = useQuery<TrialInfo | null>({
    queryKey: ['invoxy-trial-info'],
    queryFn: () => subscriptionApi.getTrialInfo().catch(() => null),
    enabled: Boolean(subsData) && subscriptions.length === 0,
    staleTime: 60_000,
  });

  if (!subsData) return { state: null, loading: isLoading };
  return { state: deriveAccountState(subscriptions, trialInfo), loading: false };
}
