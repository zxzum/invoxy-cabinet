import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useParams } from 'react-router';
import { BrandLogo } from '@/invoxystart/components/layout/BrandLogo';
import {
  Check,
  ChevronRight,
  ShieldCheck,
  Smartphone,
  Sparkles,
} from '@/invoxystart/components/ui/RuneIcon';
import { postJson, requestJson, safeExternalUrl } from './_contentApi';

interface LandingPeriod {
  days: number;
  label: string;
  price_label: string;
  price_kopeks: number;
}
interface LandingTariff {
  id: number;
  name: string;
  description: string | null;
  traffic_limit_gb: number;
  device_limit: number;
  periods: LandingPeriod[];
}
interface LandingMethod {
  method_id: string;
  display_name: string;
  description: string | null;
  icon_url: string | null;
}
interface LandingConfig {
  slug: string;
  title: string;
  subtitle: string | null;
  features: { title: string; description: string }[];
  tariffs: LandingTariff[];
  payment_methods: LandingMethod[];
  gift_enabled: boolean;
  footer_text: string | null;
}
interface PurchaseResponse {
  purchase_token: string;
  payment_url: string;
}

function loadLanding(slug: string) {
  return requestJson<LandingConfig>(`/cabinet/landing/${encodeURIComponent(slug)}`);
}
function purchaseLanding(slug: string, body: Record<string, unknown>) {
  return postJson<PurchaseResponse>(`/cabinet/landing/${encodeURIComponent(slug)}/purchase`, body);
}

export default function QuickPurchasePage({
  load = loadLanding,
  purchase = purchaseLanding,
}: {
  load?: (slug: string) => Promise<LandingConfig>;
  purchase?: (slug: string, body: Record<string, unknown>) => Promise<PurchaseResponse>;
}) {
  const { slug = '' } = useParams<{ slug?: string }>();
  const [landing, setLanding] = useState<LandingConfig | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [tariffId, setTariffId] = useState<number | null>(null);
  const [periodDays, setPeriodDays] = useState<number | null>(null);
  const [contact, setContact] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [isGift, setIsGift] = useState(false);
  const [recipient, setRecipient] = useState('');
  const [giftMessage, setGiftMessage] = useState('');
  const [submitState, setSubmitState] = useState<'idle' | 'submitting' | 'error' | 'success'>(
    'idle',
  );
  const [error, setError] = useState('');
  const [paymentUrl, setPaymentUrl] = useState('');

  useEffect(() => {
    if (!slug) {
      setStatus('error');
      return;
    }
    let cancelled = false;
    setStatus('loading');
    load(slug)
      .then((value) => {
        if (cancelled) return;
        setLanding(value);
        const firstTariff = value.tariffs[0];
        const firstPeriod = firstTariff?.periods[0];
        setTariffId(firstTariff?.id ?? null);
        setPeriodDays(firstPeriod?.days ?? null);
        setPaymentMethod(value.payment_methods[0]?.method_id ?? '');
        setStatus('ready');
      })
      .catch(() => !cancelled && setStatus('error'));
    return () => {
      cancelled = true;
    };
  }, [load, slug]);

  const tariff = landing?.tariffs.find((item) => item.id === tariffId) ?? null;
  const period = tariff?.periods.find((item) => item.days === periodDays) ?? null;
  const canSubmit = Boolean(tariff && period && contact.trim() && paymentMethod);
  const contactType = contact.trim().startsWith('@') ? 'telegram' : 'email';

  function selectTariff(id: number) {
    const next = landing?.tariffs.find((item) => item.id === id);
    setTariffId(id);
    setPeriodDays(next?.periods[0]?.days ?? null);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!tariff || !period || !contact.trim() || !paymentMethod) return;
    if (contactType === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.trim())) {
      setError('Укажите корректный e-mail или Telegram с символом @.');
      return;
    }
    if (isGift && !recipient.trim()) {
      setError('Укажите контакт получателя подарка.');
      return;
    }
    setError('');
    setSubmitState('submitting');
    try {
      const result = await purchase(slug, {
        tariff_id: tariff.id,
        period_days: period.days,
        contact_type: contactType,
        contact_value: contact.trim(),
        payment_method: paymentMethod,
        is_gift: isGift,
        ...(isGift
          ? {
              gift_recipient_value: recipient.trim(),
              gift_recipient_type: recipient.trim().startsWith('@') ? 'telegram' : 'email',
              gift_message: giftMessage.trim() || undefined,
            }
          : {}),
      });
      setPaymentUrl(result.payment_url);
      setSubmitState('success');
      const safeUrl = safeExternalUrl(result.payment_url);
      if (safeUrl) window.location.assign(safeUrl);
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : 'Не удалось создать заказ.');
      setSubmitState('error');
    }
  }

  if (status === 'loading')
    return (
      <PublicFrame>
        <div className="glass-panel h-96 animate-pulse rounded-[34px]" aria-label="Загрузка" />
      </PublicFrame>
    );
  if (status === 'error' || !landing)
    return (
      <PublicFrame>
        <StateCard
          title="Страница покупки не найдена"
          text="Проверьте ссылку или обратитесь в поддержку."
        />
      </PublicFrame>
    );

  return (
    <PublicFrame>
      <div className="grid gap-5 lg:grid-cols-[.8fr_1.2fr] lg:items-start">
        <section className="glass-panel overflow-hidden rounded-[34px] p-6 lg:sticky lg:top-6 lg:p-8">
          <p className="text-[10px] font-bold tracking-[.18em] text-mint">БЫСТРОЕ ПОДКЛЮЧЕНИЕ</p>
          <h1 className="mt-4 text-4xl font-medium tracking-[-.06em] lg:text-5xl">
            {landing.title}
          </h1>
          {landing.subtitle && (
            <p className="mt-4 text-sm leading-relaxed text-muted">{landing.subtitle}</p>
          )}
          <div className="mt-7 grid gap-3">
            {landing.features.map((feature) => (
              <div key={feature.title} className="flex gap-3 rounded-2xl bg-white/[.04] p-3.5">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-mint/10 text-mint">
                  <Check size={16} />
                </span>
                <div>
                  <p className="text-sm font-medium">{feature.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-7 flex items-center gap-2 text-xs text-muted">
            <ShieldCheck size={15} className="text-mint" /> Безопасная оплата через платёжного
            провайдера
          </div>
        </section>
        <form onSubmit={submit} className="glass-panel rounded-[34px] p-5 lg:p-8">
          <div>
            <p className="text-[10px] font-bold tracking-[.16em] text-mint">1 · ТАРИФ</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {landing.tariffs.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => selectTariff(item.id)}
                  className={`text-left rounded-2xl p-4 transition-colors ${tariffId === item.id ? 'bg-mint/12 ring-1 ring-mint/45' : 'glass-control hover:border-mint/30'}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-medium">{item.name}</span>
                    <Smartphone size={16} className="text-mint" />
                  </div>
                  {item.description && (
                    <p className="mt-1 text-xs text-muted">{item.description}</p>
                  )}
                  <p className="mt-3 text-xs text-muted">
                    До {item.device_limit} устройств · {item.traffic_limit_gb} ГБ
                  </p>
                </button>
              ))}
            </div>
          </div>
          {tariff && (
            <div className="mt-7">
              <p className="text-[10px] font-bold tracking-[.16em] text-mint">2 · СРОК</p>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {tariff.periods.map((item) => (
                  <button
                    type="button"
                    key={item.days}
                    onClick={() => setPeriodDays(item.days)}
                    className={`rounded-2xl p-3 text-center text-xs ${periodDays === item.days ? 'bg-mint font-bold text-bg' : 'glass-control text-muted'}`}
                  >
                    <span className="block">{item.label}</span>
                    <strong className="mt-1 block text-sm">{item.price_label}</strong>
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="mt-7">
            <p className="text-[10px] font-bold tracking-[.16em] text-mint">3 · КОНТАКТ И ОПЛАТА</p>
            <label className="mt-3 block">
              <span className="mb-2 block text-sm font-medium">Ваш e-mail или Telegram</span>
              <input
                required
                value={contact}
                onChange={(event) => setContact(event.target.value)}
                placeholder="email@example.com или @username"
                className="glass-control h-12 w-full rounded-2xl px-4 text-sm outline-none focus:border-mint/60"
              />
            </label>
            <label className="mt-3 block">
              <span className="mb-2 block text-sm font-medium">Способ оплаты</span>
              <select
                required
                value={paymentMethod}
                onChange={(event) => setPaymentMethod(event.target.value)}
                className="glass-control h-12 w-full rounded-2xl px-4 text-sm outline-none"
              >
                <option value="" className="bg-surface">
                  Выберите способ
                </option>
                {landing.payment_methods.map((method) => (
                  <option key={method.method_id} value={method.method_id} className="bg-surface">
                    {method.display_name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {landing.gift_enabled && (
            <div className="mt-5 rounded-2xl bg-white/[.035] p-4">
              <label className="flex cursor-pointer items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={isGift}
                  onChange={(event) => setIsGift(event.target.checked)}
                  className="accent-mint"
                />
                <Sparkles size={17} className="text-mint" /> Купить в подарок
              </label>
              {isGift && (
                <div className="mt-3 grid gap-3">
                  <input
                    required
                    value={recipient}
                    onChange={(event) => setRecipient(event.target.value)}
                    placeholder="Контакт получателя"
                    className="glass-control h-12 rounded-2xl px-4 text-sm outline-none"
                  />
                  <textarea
                    value={giftMessage}
                    onChange={(event) => setGiftMessage(event.target.value)}
                    placeholder="Сообщение (необязательно)"
                    rows={3}
                    className="glass-control resize-none rounded-2xl px-4 py-3 text-sm outline-none"
                  />
                </div>
              )}
            </div>
          )}
          {error && (
            <p role="alert" className="mt-4 rounded-2xl bg-red-300/10 p-4 text-sm text-red-200">
              {error}
            </p>
          )}
          {submitState === 'success' && (
            <div className="mt-4 rounded-2xl bg-mint/10 p-4 text-sm text-mint">
              Заказ создан. {paymentUrl ? 'Переходим к оплате…' : 'Проверьте почту или Telegram.'}
            </div>
          )}
          <button
            type="submit"
            disabled={!canSubmit || submitState === 'submitting'}
            className="button-lift mt-6 flex h-13 w-full items-center justify-center gap-2 rounded-full bg-mint text-sm font-bold text-bg disabled:cursor-not-allowed disabled:opacity-45"
          >
            {submitState === 'submitting' ? 'Создаём заказ…' : 'Перейти к оплате'}
            <ChevronRight size={16} />
          </button>
        </form>
      </div>
      {landing.footer_text && (
        <p className="mt-5 text-center text-xs text-muted">{landing.footer_text}</p>
      )}
    </PublicFrame>
  );
}

function PublicFrame({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-bg px-4 py-6 text-ink sm:px-8 sm:py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <Link to="/" aria-label="На главную">
            <BrandLogo iconClassName="h-9 w-9 rounded-xl" textClassName="text-base font-bold" />
          </Link>
          <Link to="/login" className="text-xs font-semibold text-muted hover:text-ink">
            Войти в кабинет
          </Link>
        </div>
        {children}
      </div>
    </main>
  );
}

function StateCard({ title, text }: { title: string; text: string }) {
  return (
    <section className="glass-panel rounded-[30px] px-6 py-16 text-center">
      <h1 className="text-xl font-medium">{title}</h1>
      <p className="mt-2 text-sm text-muted">{text}</p>
    </section>
  );
}
