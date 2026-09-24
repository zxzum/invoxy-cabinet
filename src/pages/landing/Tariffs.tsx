import { useState } from 'react';
import { Link } from 'react-router';
import { TARIFF_PLANS, TRIAL_SPECS, ADDON_INFO, type TariffPeriodMonths } from '@/data/tariffs';

const BOT_USERNAME = (import.meta.env.VITE_TELEGRAM_BOT_USERNAME || 'invoxy_bot').replace(/^@/, '');
const TELEGRAM_BOT_URL = `https://t.me/${BOT_USERNAME}`;

function TelegramIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .37z" />
    </svg>
  );
}

function CheckIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2.5}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

export function Tariffs() {
  const [period, setPeriod] = useState<TariffPeriodMonths>(1);

  const periods: Array<{ months: TariffPeriodMonths; label: string; badge?: string }> = [
    { months: 1, label: '1 месяц' },
    { months: 3, label: '3 месяца' },
    { months: 6, label: '6 месяцев' },
    { months: 12, label: '12 месяцев', badge: 'до −15%' },
  ];

  return (
    <section id="tariffs" className="py-16 sm:py-24 border-t border-line/40 relative">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Trial banner */}
        <div className="mx-auto max-w-4xl rounded-3xl border border-mint/40 bg-mint/10 p-5 sm:p-7 shadow-[0_0_36px_rgba(165,232,196,0.12)]">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-5">
            <div className="text-center sm:text-left">
              <div className="inline-flex items-center gap-2 rounded-full bg-mint/20 px-3 py-0.5 text-xs font-mono-landing font-bold text-mint uppercase tracking-wider">
                Бесплатный тест
              </div>
              <h3 className="mt-2 font-display-landing text-xl sm:text-2xl font-bold text-ink">
                {TRIAL_SPECS.title}
              </h3>
              <p className="mt-1 text-xs sm:text-sm text-muted">{TRIAL_SPECS.subtitle}</p>
            </div>

            <div className="flex flex-col xs:flex-row items-center gap-2.5 shrink-0 w-full sm:w-auto">
              <a
                href={TELEGRAM_BOT_URL}
                target="_blank"
                rel="noreferrer noopener"
                className="button-lift flex w-full xs:w-auto items-center justify-center gap-2 rounded-xl bg-mint px-5 py-2.5 text-sm font-bold text-bg shadow-[0_0_20px_rgba(165,232,196,0.3)]"
              >
                <TelegramIcon className="h-4 w-4" />
                <span>Забрать в боте</span>
              </a>

              <Link
                to="/register"
                className="button-lift flex w-full xs:w-auto items-center justify-center rounded-xl border border-line bg-surface px-4 py-2.5 text-sm font-medium text-ink hover:bg-surface-2"
              >
                На сайте
              </Link>
            </div>
          </div>
        </div>

        {/* Section title */}
        <div className="text-center max-w-2xl mx-auto mt-16 sm:mt-20">
          <div className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-xs font-mono-landing text-muted mb-3">
            <span>Честные тарифы</span>
          </div>
          <h2 className="font-display-landing text-3xl sm:text-4xl font-bold tracking-tight text-ink">
            Прозрачные цены без скрытых платежей
          </h2>
          <p className="mt-3 text-sm sm:text-base text-muted">
            Оплата через СБП или банковской картой. Никаких принудительных автосписаний.
          </p>
        </div>

        {/* Period Switcher */}
        <div className="mt-8 flex justify-center">
          <div className="inline-flex rounded-2xl border border-line bg-surface p-1.5 gap-1 shadow-inner">
            {periods.map((p) => {
              const active = period === p.months;
              return (
                <button
                  key={p.months}
                  type="button"
                  onClick={() => setPeriod(p.months)}
                  className={`relative rounded-xl px-3.5 sm:px-5 py-2 text-xs sm:text-sm font-medium transition-all ${
                    active
                      ? 'bg-surface-2 text-ink font-semibold shadow-sm border border-line/80'
                      : 'text-muted hover:text-ink'
                  }`}
                >
                  <span>{p.label}</span>
                  {p.badge && (
                    <span className="ml-1.5 hidden sm:inline-block rounded bg-mint/20 px-1.5 py-0.2 font-mono-landing text-[10px] font-bold text-mint">
                      {p.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tariffs Cards Grid */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
          {TARIFF_PLANS.map((plan) => {
            const pricing = plan.pricings[period];
            const isRecommended = plan.recommended;

            return (
              <div
                key={plan.id}
                className={`glass-panel relative rounded-3xl p-6 sm:p-7 flex flex-col justify-between transition-all ${
                  isRecommended
                    ? 'border-mint/60 bg-surface/90 shadow-[0_0_36px_rgba(165,232,196,0.18)] ring-1 ring-mint/40 md:-translate-y-2'
                    : 'border-line/70 bg-surface/70 hover:border-line'
                }`}
              >
                {/* Recommended badge */}
                {isRecommended && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-mint px-3.5 py-1 text-xs font-bold text-bg shadow-[0_0_16px_rgba(165,232,196,0.4)]">
                    {plan.badge || 'Хит продаж'}
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="font-display-landing text-xl font-bold text-ink">{plan.name}</h3>
                    {pricing.discountLabel && (
                      <span className="rounded-full bg-mint/15 px-2.5 py-0.5 font-mono-landing text-xs font-bold text-mint border border-mint/30">
                        {pricing.discountLabel}
                      </span>
                    )}
                  </div>

                  <p className="mt-2 text-xs text-muted min-h-[32px] leading-relaxed">
                    {plan.tagline}
                  </p>

                  {/* Price */}
                  <div className="mt-5 pb-5 border-b border-line/60">
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-mono-landing text-4xl font-extrabold text-ink">
                        {pricing.monthlyPrice} ₽
                      </span>
                      <span className="text-xs text-muted font-mono-landing">/ месяц</span>
                    </div>

                    {period > 1 && (
                      <div className="mt-1 text-xs text-muted font-mono-landing">
                        {pricing.totalPrice} ₽ за {period} мес
                      </div>
                    )}
                  </div>

                  {/* Features list */}
                  <ul className="mt-6 space-y-3 text-xs sm:text-sm text-ink/90">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        <span
                          className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${
                            isRecommended ? 'bg-mint/20 text-mint' : 'bg-surface-2 text-muted'
                          }`}
                        >
                          <CheckIcon className="h-3 w-3" />
                        </span>
                        <span className="leading-snug">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CTAs */}
                <div className="mt-8 pt-5 border-t border-line/50 flex flex-col gap-2.5">
                  <a
                    href={TELEGRAM_BOT_URL}
                    target="_blank"
                    rel="noreferrer noopener"
                    className={`button-lift flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-all ${
                      isRecommended
                        ? 'bg-mint text-bg shadow-[0_0_20px_rgba(165,232,196,0.3)] hover:bg-[#bbf0d4]'
                        : 'border border-line bg-surface-2 text-ink hover:border-mint/40 hover:bg-surface-2/90'
                    }`}
                  >
                    <TelegramIcon className="h-4 w-4" />
                    <span>Подключить в Telegram</span>
                  </a>

                  <Link
                    to="/register"
                    className="text-center text-xs text-muted hover:text-ink py-1 transition-colors"
                  >
                    Или выбрать на сайте →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* Addon details footer */}
        <div className="mt-12 rounded-2xl border border-line/60 bg-surface-2/40 p-4 sm:p-5 max-w-4xl mx-auto text-xs text-muted font-mono-landing">
          <div className="text-ink font-semibold mb-2">Дополнительные опции:</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {ADDON_INFO.map((item, idx) => (
              <div
                key={idx}
                className="border-t sm:border-t-0 sm:border-l first:border-0 border-line/40 sm:pl-3 pt-2 sm:pt-0"
              >
                <span className="text-ink/90 block font-medium">{item.label}:</span>
                <span className="text-muted text-[11px]">{item.price}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
