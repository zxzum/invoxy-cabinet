import { uiLocale } from '@/utils/uiLocale';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { infoApi } from '../api/info';
import { formatContent } from '../utils/legalContent';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { Skeleton, SkeletonGroup } from '@/components/ui/skeleton';

export type PublicLegalDoc = 'offer' | 'privacy' | 'recurrent';

const LEGAL_NAV = [
  { href: '/info?tab=faq', labelKey: 'info.faq', fallback: 'FAQ' },
  { href: '/info?tab=rules', labelKey: 'info.rules', fallback: 'Правила' },
  { href: '/privacy', doc: 'privacy' as const, labelKey: 'info.privacy', fallback: 'Политика' },
  { href: '/offer', doc: 'offer' as const, labelKey: 'info.offer', fallback: 'Оферта' },
  {
    href: '/recurrent-payments',
    doc: 'recurrent' as const,
    labelKey: 'footer.recurrent',
    fallback: 'Рекуррентные платежи',
  },
] as const;

interface PublicLegalProps {
  doc: PublicLegalDoc;
}

const DOC_CONFIG: Record<
  PublicLegalDoc,
  {
    queryKey: string;
    titleKey: string;
    titleFallback: string;
    fetch: () => Promise<{ content: string; updated_at: string | null }>;
  }
> = {
  offer: {
    queryKey: 'public-offer',
    titleKey: 'footer.offer',
    titleFallback: 'Публичная оферта',
    fetch: infoApi.getPublicOffer,
  },
  privacy: {
    queryKey: 'privacy-policy',
    titleKey: 'footer.privacy',
    titleFallback: 'Политика конфиденциальности',
    fetch: infoApi.getPrivacyPolicy,
  },
  recurrent: {
    queryKey: 'recurrent-payments',
    titleKey: 'footer.recurrent',
    titleFallback: 'Рекуррентные платежи',
    fetch: infoApi.getRecurrentPayments,
  },
};

// Public, unauthenticated viewer for the legal documents linked from the login
// footer. Reads the same public /cabinet/info endpoints the authenticated Info page
// uses, so the pages are reachable before login instead of bouncing to /login.
export default function PublicLegal({ doc }: PublicLegalProps) {
  const { t } = useTranslation();
  const config = DOC_CONFIG[doc];

  const { data, isLoading, isError } = useQuery({
    queryKey: ['public-legal', config.queryKey],
    queryFn: config.fetch,
    staleTime: 5 * 60 * 1000,
  });

  const title = t(config.titleKey, config.titleFallback);

  return (
    <div className="min-h-viewport bg-dark-950 px-4 py-8 sm:py-12">
      <div className="fixed right-4 top-4 z-50">
        <LanguageSwitcher />
      </div>

      <div className="mx-auto w-full max-w-3xl">
        <h1 className="mb-6 text-2xl font-semibold text-dark-100">{title}</h1>

        <nav
          aria-label={t('info.legalNavigation', 'Разделы информации')}
          className="scrollbar-hide mb-6 flex gap-2 overflow-x-auto rounded-xl border border-dark-700/70 bg-dark-900/60 p-2"
        >
          {LEGAL_NAV.map((link) => {
            const active = 'doc' in link && link.doc === doc;
            return (
              <Link
                key={link.href}
                to={link.href}
                aria-current={active ? 'page' : undefined}
                className={`shrink-0 rounded-full px-4 py-2.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500/50 ${active ? 'bg-accent-500 text-on-accent' : 'text-dark-300 hover:bg-dark-800 hover:text-dark-100'}`}
              >
                {t(link.labelKey, link.fallback)}
              </Link>
            );
          })}
        </nav>

        {isLoading ? (
          <SkeletonGroup className="space-y-3">
            <Skeleton variant="card" count={3} className="h-16" />
          </SkeletonGroup>
        ) : isError || !data?.content ? (
          <div className="bento-card text-dark-400">
            {t('info.documentUnavailable', 'Документ пока недоступен.')}
          </div>
        ) : (
          <div className="bento-card prose prose-invert max-w-none" role="document">
            <div dangerouslySetInnerHTML={{ __html: formatContent(data.content) }} />
            {data.updated_at && (
              <p className="mt-4 text-xs text-dark-500">
                {t('info.updatedAt', 'Обновлено')}:{' '}
                {new Date(data.updated_at).toLocaleDateString(uiLocale())}
              </p>
            )}
          </div>
        )}

        <div className="mt-6">
          <Link to="/login" className="btn-secondary">
            {t('auth.backToLogin', 'Вернуться ко входу')}
          </Link>
        </div>
      </div>
    </div>
  );
}
