import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router';
import { PageHeader } from '@/invoxystart/components/layout/PageHeader';
import {
  ArrowRight,
  CalendarDays,
  ChevronRight,
  Image as ImageIcon,
} from '@/invoxystart/components/ui/RuneIcon';
import { formatDate, requestJson, safeExternalUrl, stripMarkup } from './_contentApi';

export interface NewsItem {
  id: number;
  title: string;
  slug: string;
  excerpt?: string | null;
  category?: string | null;
  category_color?: string | null;
  featured_image_url?: string | null;
  published_at?: string | null;
  read_time_minutes?: number;
}

export interface NewsResponse {
  items: NewsItem[];
  total?: number;
  categories?: string[];
}

export type NewsLoader = (params?: {
  category?: string;
  limit?: number;
  offset?: number;
}) => Promise<NewsResponse>;
export type NewsArticleLoader = (
  slug: string,
) => Promise<NewsItem & { content: string; updated_at?: string | null }>;

function loadNews(params?: { category?: string; limit?: number; offset?: number }) {
  const query = new URLSearchParams();
  if (params?.category) query.set('category', params.category);
  if (params?.limit) query.set('limit', String(params.limit));
  if (params?.offset) query.set('offset', String(params.offset));
  return requestJson<NewsResponse>(`/cabinet/news${query.size ? `?${query}` : ''}`);
}

function loadArticle(slug: string) {
  return requestJson<NewsItem & { content: string; updated_at?: string | null }>(
    `/cabinet/news/${encodeURIComponent(slug)}`,
  );
}

export default function NewsPage({ load = loadNews }: { load?: NewsLoader }) {
  const [response, setResponse] = useState<NewsResponse | null>(null);
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    load({ category: category || undefined, limit: 50 })
      .then((value) => {
        if (!cancelled) {
          setResponse(value);
          setStatus('ready');
        }
      })
      .catch(() => !cancelled && setStatus('error'));
    return () => {
      cancelled = true;
    };
  }, [category, load]);

  const items = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return (response?.items ?? []).filter(
      (item) => !query || `${item.title} ${item.excerpt ?? ''}`.toLocaleLowerCase().includes(query),
    );
  }, [response, search]);

  return (
    <div className="flex flex-col gap-5 pb-28 lg:gap-6 lg:pb-0">
      <PageHeader
        title="Новости"
        subtitle="Обновления сервиса и полезные материалы"
        notifications
        mobileNotifications
      />
      <div className="flex flex-col gap-3 sm:flex-row">
        <label className="glass-control flex h-12 min-w-0 flex-1 items-center rounded-2xl px-4">
          <span className="sr-only">Поиск новостей</span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Найти новость"
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted"
          />
        </label>
        <select
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          className="glass-control h-12 rounded-2xl px-4 text-sm outline-none sm:w-52"
        >
          <option value="" className="bg-surface">
            Все категории
          </option>
          {(response?.categories ?? []).map((item) => (
            <option key={item} value={item} className="bg-surface">
              {item}
            </option>
          ))}
        </select>
      </div>

      {status === 'loading' && (
        <div className="glass-panel h-56 animate-pulse rounded-[30px]" aria-label="Загрузка" />
      )}
      {status === 'error' && (
        <StateCard title="Новости временно недоступны" text="Попробуйте обновить страницу позже." />
      )}
      {status === 'ready' && items.length === 0 && (
        <StateCard
          title="Пока нет публикаций"
          text="Новые материалы появятся здесь после публикации."
        />
      )}
      {status === 'ready' && items.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <NewsCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

function NewsCard({ item }: { item: NewsItem }) {
  const image = safeExternalUrl(item.featured_image_url);
  return (
    <article className="glass-panel motion-card overflow-hidden rounded-[30px] transition-colors hover:border-mint/30">
      {image ? (
        <img src={image} alt="" loading="lazy" className="h-44 w-full object-cover" />
      ) : (
        <div className="grid h-44 place-items-center bg-mint/[.06] text-mint">
          <ImageIcon size={28} />
        </div>
      )}
      <div className="p-5">
        <div className="flex items-center justify-between gap-3 text-[10px] font-bold uppercase tracking-[.12em] text-muted">
          <span className="truncate" style={{ color: item.category_color || undefined }}>
            {item.category || 'Новости'}
          </span>
          {item.published_at && (
            <span className="flex shrink-0 items-center gap-1">
              <CalendarDays size={12} />
              {formatDate(item.published_at)}
            </span>
          )}
        </div>
        <h2 className="mt-3 line-clamp-2 text-lg font-medium tracking-[-.03em]">{item.title}</h2>
        {item.excerpt && (
          <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted">
            {stripMarkup(item.excerpt)}
          </p>
        )}
        <Link
          to={`/news/${encodeURIComponent(item.slug)}`}
          className="button-lift mt-5 inline-flex items-center gap-2 text-xs font-bold text-mint"
        >
          Читать статью <ArrowRight size={14} />
        </Link>
      </div>
    </article>
  );
}

export function NewsArticlePage({ load = loadArticle }: { load?: NewsArticleLoader }) {
  const { slug = '' } = useParams<{ slug?: string }>();
  const [article, setArticle] = useState<
    (NewsItem & { content: string; updated_at?: string | null }) | null
  >(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    if (!slug) {
      setStatus('error');
      return;
    }
    let cancelled = false;
    setStatus('loading');
    load(slug)
      .then((value) => {
        if (!cancelled) {
          setArticle(value);
          setStatus('ready');
        }
      })
      .catch(() => !cancelled && setStatus('error'));
    return () => {
      cancelled = true;
    };
  }, [load, slug]);

  if (status === 'loading')
    return (
      <div className="glass-panel h-96 animate-pulse rounded-[30px]" aria-label="Загрузка статьи" />
    );
  if (status === 'error' || !article)
    return (
      <StateCard
        title="Статья не найдена"
        text="Публикация больше недоступна или ещё не опубликована."
      />
    );
  const image = safeExternalUrl(article.featured_image_url);

  return (
    <div className="flex flex-col gap-5 pb-28 lg:gap-6 lg:pb-0">
      <Link
        to="/news"
        className="inline-flex items-center gap-2 self-start text-xs font-bold text-mint"
      >
        <ChevronRight size={15} className="rotate-180" /> Все новости
      </Link>
      <article className="glass-panel motion-card overflow-hidden rounded-[32px]">
        {image && <img src={image} alt="" className="max-h-[420px] w-full object-cover" />}
        <div className="p-6 lg:p-9">
          <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold uppercase tracking-[.13em] text-muted">
            <span style={{ color: article.category_color || undefined }}>
              {article.category || 'Новости'}
            </span>
            {article.published_at && <span>{formatDate(article.published_at)}</span>}
            {article.read_time_minutes ? <span>Чтение {article.read_time_minutes} мин</span> : null}
          </div>
          <h1 className="mt-4 text-3xl font-medium tracking-[-.05em] lg:text-5xl">
            {article.title}
          </h1>
          <div className="mt-8 whitespace-pre-wrap text-sm leading-8 text-ink/85">
            {stripMarkup(article.content)}
          </div>
          {article.updated_at && (
            <p className="mt-8 border-t border-white/8 pt-4 text-xs text-muted">
              Обновлено: {formatDate(article.updated_at)}
            </p>
          )}
        </div>
      </article>
    </div>
  );
}

function StateCard({ title, text }: { title: string; text: string }) {
  return (
    <section className="glass-panel rounded-[30px] px-6 py-12 text-center">
      <h2 className="text-lg font-medium">{title}</h2>
      <p className="mt-2 text-sm text-muted">{text}</p>
    </section>
  );
}
