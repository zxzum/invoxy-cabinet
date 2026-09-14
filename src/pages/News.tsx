import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import NewsSection from '../components/news/NewsSection';
import { Skeleton, SkeletonGroup } from '../components/ui/skeleton';
import { newsApi } from '../api/news';

const NEWS_LIMIT = 6;

/**
 * Page-level boundary for the shared news surface.
 *
 * NewsSection deliberately stays quiet until it has articles so it can be
 * embedded in the dashboard. The route needs to explain the page states on
 * its own, while sharing the same query and API response with that section.
 */
export default function News() {
  const { t } = useTranslation();
  const { data, isError, isLoading } = useQuery({
    queryKey: ['news', 'list', undefined, NEWS_LIMIT],
    queryFn: () => newsApi.getNews({ limit: NEWS_LIMIT, offset: 0 }),
    staleTime: 2 * 60_000,
    gcTime: 10 * 60_000,
  });

  if (isLoading) {
    return (
      <SkeletonGroup className="space-y-3">
        <Skeleton variant="card" count={3} className="h-32" />
      </SkeletonGroup>
    );
  }

  if (isError) {
    return (
      <div className="glass-surface p-8 text-center text-error-400" role="alert">
        {t('common.error')}
      </div>
    );
  }

  if (!data?.items.length) {
    return <div className="glass-surface p-8 text-center text-dark-400">{t('news.noNews')}</div>;
  }

  return (
    <div className="flex flex-col gap-5 pb-28 lg:gap-6 lg:pb-0">
      <NewsSection />
    </div>
  );
}
