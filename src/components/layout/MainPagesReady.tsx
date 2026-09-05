import { useQuery, useQueryClient } from '@tanstack/react-query';
import { subscriptionApi } from '@/api/subscription';
import { balanceApi } from '@/api/balance';
import { referralApi } from '@/api/referral';
import { brandingApi } from '@/api/branding';
import { notificationsApi } from '@/api/notifications';
import { promoApi } from '@/api/promo';
import { giftApi } from '@/api/gift';
import { wheelApi } from '@/api/wheel';
import { newsApi } from '@/api/news';
import type { SubscriptionsListResponse, SubscriptionStatusResponse } from '@/types';
import { useAuthStore } from '@/store/auth';
import PageLoader from '@/components/common/PageLoader';

// Warm the same cache used by the four main tabs. Background refetches keep
// existing content visible; payment mutations still invalidate their queries.
export function MainPagesReady({ children }: { children: React.ReactNode }) {
  const client = useQueryClient();
  const userId = useAuthStore((state) => state.user?.id);
  const { isPending } = useQuery({
    queryKey: ['main-pages-ready', userId],
    staleTime: Infinity,
    gcTime: Infinity,
    retry: false,
    queryFn: async ({ signal }) => {
      const checkSession = () => {
        if (signal.aborted) throw new Error('Session changed');
      };
      const warm = <T,>(queryKey: readonly unknown[], queryFn: () => Promise<T>) => {
        checkSession();
        return client.prefetchQuery({
          queryKey,
          queryFn,
          staleTime: 60_000,
          gcTime: Infinity,
          retry: false,
        });
      };
      await Promise.all([
        warm(['balance'], balanceApi.getBalance),
        warm(['subscriptions-list'], () => subscriptionApi.getSubscriptions()),
        warm(['subscription', undefined], () => subscriptionApi.getSubscription()),
        warm(['purchase-options', undefined], () => subscriptionApi.getPurchaseOptions()),
      ]);
      checkSession();
      await Promise.all([
        warm(['trial-info'], () => subscriptionApi.getTrialInfo()),
        warm(['appConfig', undefined], () => subscriptionApi.getAppConfig()),
        warm(['connectionLink', undefined], () => subscriptionApi.getConnectionLink()),
        warm(['referral-info'], referralApi.getReferralInfo),
      ]);
      checkSession();
      await Promise.all([
        warm(['referral-terms'], referralApi.getReferralTerms),
        warm(['branding'], brandingApi.getBranding),
        warm(['email-auth-enabled'], brandingApi.getEmailAuthEnabled),
        warm(['notification-settings'], notificationsApi.getSettings),
      ]);
      checkSession();
      await Promise.all([
        warm(['promo-offers'], promoApi.getOffers),
        warm(['active-discount'], promoApi.getActiveDiscount),
        warm(['promo-group-discounts'], promoApi.getGroupDiscounts),
        warm(['pending-gifts'], giftApi.getPendingGifts),
        warm(['wheel-config'], wheelApi.getConfig),
        warm(['news', 'list', undefined, 6], () => newsApi.getNews({ limit: 6, offset: 0 })),
      ]);
      checkSession();
      const list = client.getQueryData<SubscriptionsListResponse>(['subscriptions-list']);
      const current = client.getQueryData<SubscriptionStatusResponse>(['subscription', undefined]);
      if (list?.multi_tariff_enabled) {
        await Promise.all(
          list.subscriptions
            .slice(0, 3)
            .map((sub) => warm(['devices', sub.id], () => subscriptionApi.getDevices(sub.id))),
        );
      } else if (current?.subscription) {
        await warm(['devices'], () => subscriptionApi.getDevices());
      }
      checkSession();
      return true;
    },
  });
  return isPending ? <PageLoader variant="dark" /> : children;
}
