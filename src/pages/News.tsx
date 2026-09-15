import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';

import TicketNotificationBell from '../components/TicketNotificationBell';
import { CalendarIcon, ImageIcon, ArrowRightIcon } from '../components/icons';
import { newsApi } from '../api/news';
import type { NewsListItem } from '../types/news';
import { getSafeExternalUrl } from '../utils/safeExternalUrl';

const NEWS_LIMIT = 50;
const HEX_COLOR_RE = /^#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

function safeColor(color: string | null | undefined): string | undefined {
  return color && HEX_COLOR_RE.test(color) ? color : undefined;
}

function stripMarkup(value: string): string {
  return value
    .replace(/<br\s*\/?>(\s*)/gi, '\n$1')
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function formatDate(value: string | null, locale: string): string {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString(locale);
}

export default function News() {
  const { t, i18n } = useTranslation();
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');

  const { data, isError, isLoading } = useQuery({
    queryKey: ['news', 'list', category || undefined, NEWS_LIMIT],
    queryFn: () =>
      newsApi.getNews({ category: category || undefined, limit: NEWS_LIMIT, offset: 0 }),
    staleTime: 2 * 60_000,
    gcTime: 10 * 60_000,
  });

  const items = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return (data?.items ?? []).filter(
      (item) => !query || `${item.title} ${item.excerpt ?? ''}`.toLocaleLowerCase().includes(query),
    );
  }, [data?.items, search]);

  return (
    <div className="luna-dashboard flex flex-col gap-5 pb-28 lg:gap-6 lg:pb-0">
      <header className="relative z-10 flex items-center justify-between gap-4">
        <div className="ix-page-heading min-w-0">
          <h1>{t('news.pageTitle', 'Новости')}</h1>
          <p>{t('news.pageSubtitle', 'Обновления сервиса и полезные материалы')}</p>
        </div>
        <TicketNotificationBell />
      </header>

      <div className="flex flex-col gap-3 sm:flex-row">
        <label className="glass-control flex h-12 min-w-0 flex-1 items-center rounded-2xl px-4 focus-within:border-accent-400/45">
          <span className="sr-only">{t('news.searchLabel', 'Поиск новостей')}</span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t('news.searchPlaceholder', 'Найти новость')}
            className="w-full bg-transparent text-sm text-dark-100 outline-none placeholder:text-dark-400"
          />
        </label>
        <label className="sm:w-52">
          <span className="sr-only">{t('news.categoryLabel', 'Категория')}</span>
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="glass-control h-12 w-full rounded-2xl px-4 text-sm text-dark-100 outline-none"
          >
            <option value="" className="bg-dark-900">
              {t('news.filterAll', 'Все категории')}
            </option>
            {(data?.categories ?? []).map((item) => (
              <option key={item} value={item} className="bg-dark-900">
                {item}
              </option>
            ))}
          </select>
        </label>
      </div>

      {isLoading && (
        <div
          className="glass-panel h-56 animate-pulse rounded-[30px]"
          role="status"
          aria-busy="true"
        ></div>
      )}
      {isError && (
        <StateCard
          title={t('news.loadErrorTitle', 'Новости временно недоступны')}
          text={t('news.loadErrorText', 'Попробуйте обновить страницу позже.')}
        />
      )}
      {!isLoading && !isError && items.length === 0 && (
        <StateCard
          title={t('news.emptyTitle', 'Пока нет публикаций')}
          text={t('news.emptyText', 'Новые материалы появятся здесь после публикации.')}
        />
      )}
      {!isLoading && !isError && items.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <NewsCard
              key={item.id}
              item={item}
              locale={i18n.language}
              readLabel={t('news.readMore', 'Читать статью')}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function NewsCard({
  item,
  locale,
  readLabel,
}: {
  item: NewsListItem;
  locale: string;
  readLabel: string;
}) {
  const image = getSafeExternalUrl(item.featured_image_url);
  const color = safeColor(item.category_color);

  return (
    <article className="glass-panel motion-card overflow-hidden rounded-[30px] transition-colors hover:border-accent-400/30">
      {image ? (
        <img src={image} alt="" loading="lazy" className="h-44 w-full object-cover" />
      ) : (
        <div className="grid h-44 place-items-center bg-accent-400/[.06] text-accent-300">
          <ImageIcon className="h-7 w-7" />
        </div>
      )}
      <div className="p-5">
        <div className="flex items-center justify-between gap-3 text-[10px] font-bold uppercase tracking-[.12em] text-dark-400">
          <span className="truncate" style={{ color }}>
            {item.category || 'Новости'}
          </span>
          {item.published_at && (
            <span className="flex shrink-0 items-center gap-1">
              <CalendarIcon className="h-3 w-3" />
              {formatDate(item.published_at, locale)}
            </span>
          )}
        </div>
        <h2 className="mt-3 line-clamp-2 text-lg font-medium tracking-[-.03em] text-dark-50">
          {item.title}
        </h2>
        {item.excerpt && (
          <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-dark-400">
            {stripMarkup(item.excerpt)}
          </p>
        )}
        <Link
          to={`/news/${encodeURIComponent(item.slug)}`}
          className="button-lift mt-5 inline-flex items-center gap-2 text-xs font-bold text-accent-300"
        >
          {readLabel}
          <ArrowRightIcon className="h-3.5 w-3.5" />
        </Link>
      </div>
    </article>
  );
}

function StateCard({ title, text }: { title: string; text: string }) {
  return (
    <section className="glass-panel rounded-[30px] px-6 py-12 text-center">
      <h2 className="text-lg font-medium text-dark-50">{title}</h2>
      <p className="mt-2 text-sm text-dark-400">{text}</p>
    </section>
  );
}
