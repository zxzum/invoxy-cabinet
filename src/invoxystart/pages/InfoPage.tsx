import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { PageHeader } from '@/invoxystart/components/layout/PageHeader';
import { ChevronRight, Info as InfoIcon } from '@/invoxystart/components/ui/RuneIcon';
import { formatDate, requestJson, stripMarkup } from './_contentApi';

export type InfoTab = 'faq' | 'rules' | 'privacy' | 'offer' | 'recurrent';

export interface InfoDocument {
  title?: string;
  content: string | Record<string, string>;
  updated_at?: string | null;
}

export interface FaqItem {
  id?: number;
  title?: string;
  question?: string;
  q?: string;
  content?: string;
  answer?: string;
  a?: string;
}

export type InfoLoader = (key: string) => Promise<unknown>;

const tabLabels: Record<InfoTab, string> = {
  faq: 'FAQ',
  rules: 'Правила',
  privacy: 'Политика',
  offer: 'Оферта',
  recurrent: 'Рекуррентные платежи',
};

const tabEndpoints: Record<InfoTab, string> = {
  faq: '/cabinet/info/faq',
  rules: '/cabinet/info/rules',
  privacy: '/cabinet/info/privacy-policy',
  offer: '/cabinet/info/public-offer',
  recurrent: '/cabinet/info/recurrent-payments',
};

const tabs = Object.keys(tabLabels) as InfoTab[];

function loadInfo(key: string): Promise<unknown> {
  if (key in tabEndpoints) return requestJson(tabEndpoints[key as InfoTab]);
  return requestJson(`/cabinet/info-pages/${encodeURIComponent(key)}`);
}

function localized(value: string | Record<string, string> | undefined): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value.ru || value.en || Object.values(value)[0] || '';
}

function normalizeFaq(payload: unknown): FaqItem[] {
  const items = Array.isArray(payload)
    ? payload
    : payload && typeof payload === 'object' && 'items' in payload
      ? (payload as { items?: unknown }).items
      : [];
  if (!Array.isArray(items)) return [];
  return items.filter((item): item is FaqItem => Boolean(item && typeof item === 'object'));
}

function documentFrom(payload: unknown): InfoDocument | null {
  if (!payload || typeof payload !== 'object') return null;
  const value = payload as Partial<InfoDocument>;
  return typeof value.content === 'string' || (value.content && typeof value.content === 'object')
    ? { content: value.content, title: value.title, updated_at: value.updated_at }
    : null;
}

export default function InfoPage({
  document: documentKey,
  load = loadInfo,
}: {
  document?: string;
  load?: InfoLoader;
}) {
  const params = useParams<{ slug?: string }>();
  const requestedKey = documentKey || params.slug || 'faq';
  const [activeKey, setActiveKey] = useState(requestedKey);
  const [payload, setPayload] = useState<unknown>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => setActiveKey(requestedKey), [requestedKey]);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    setPayload(null);
    load(activeKey)
      .then((value) => {
        if (cancelled) return;
        setPayload(value);
        setStatus('ready');
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, [activeKey, load]);

  const isFaq = activeKey === 'faq';
  const title = tabLabels[activeKey as InfoTab] || (documentFrom(payload)?.title ?? 'Информация');
  const faqItems = normalizeFaq(payload);
  const document = documentFrom(payload);

  return (
    <div className="flex flex-col gap-5 pb-28 lg:gap-6 lg:pb-0">
      <PageHeader
        title={title}
        subtitle="Ответы, правила и документы InvoxyVPN"
        mobileNotifications
      />

      <nav
        aria-label="Разделы информации"
        className="glass-panel flex gap-2 overflow-x-auto rounded-[24px] p-2"
      >
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveKey(tab)}
            aria-current={activeKey === tab ? 'page' : undefined}
            className={`shrink-0 rounded-full px-4 py-2.5 text-xs font-semibold transition-colors ${activeKey === tab ? 'bg-mint text-bg' : 'text-muted hover:bg-white/7 hover:text-ink'}`}
          >
            {tabLabels[tab]}
          </button>
        ))}
      </nav>

      {status === 'loading' && (
        <div className="glass-panel h-52 animate-pulse rounded-[30px]" aria-label="Загрузка" />
      )}
      {status === 'error' && (
        <StateCard
          title="Документ временно недоступен"
          text="Попробуйте открыть раздел ещё раз позже."
        />
      )}
      {status === 'ready' && isFaq && <FaqView items={faqItems} />}
      {status === 'ready' && !isFaq && document && (
        <article className="glass-panel motion-card rounded-[30px] p-6 lg:p-8">
          <div className="flex items-center gap-3 text-mint">
            <InfoIcon size={18} />
            <span className="text-[10px] font-bold tracking-[.16em]">ОФИЦИАЛЬНЫЙ ДОКУМЕНТ</span>
          </div>
          <div className="mt-6 whitespace-pre-wrap text-sm leading-7 text-ink/85">
            {stripMarkup(localized(document.content))}
          </div>
          {document.updated_at && (
            <p className="mt-7 border-t border-white/8 pt-4 text-xs text-muted">
              Обновлено: {formatDate(document.updated_at)}
            </p>
          )}
        </article>
      )}
      {status === 'ready' && isFaq && faqItems.length === 0 && (
        <StateCard title="Вопросов пока нет" text="Раздел заполнится после публикации FAQ." />
      )}
      {status === 'ready' && !isFaq && !document && (
        <StateCard title="Документ пока недоступен" text="Содержимое ещё не опубликовано." />
      )}
    </div>
  );
}

function FaqView({ items }: { items: FaqItem[] }) {
  return (
    <section className="grid gap-3">
      {items.map((item, index) => {
        const question = item.question || item.q || item.title || `Вопрос ${index + 1}`;
        const answer = item.answer || item.a || item.content || 'Ответ пока не опубликован.';
        return (
          <details
            key={item.id ?? `${question}-${index}`}
            className="glass-panel motion-card group rounded-[24px]"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-5 text-sm font-medium [&::-webkit-details-marker]:hidden">
              <span>{question}</span>
              <ChevronRight
                size={17}
                className="shrink-0 text-muted transition-transform group-open:rotate-90 group-open:text-mint"
              />
            </summary>
            <div className="border-t border-white/8 px-5 pb-5 pt-4 text-sm leading-7 text-muted whitespace-pre-wrap">
              {stripMarkup(answer)}
            </div>
          </details>
        );
      })}
    </section>
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
