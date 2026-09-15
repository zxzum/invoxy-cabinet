import { useState } from 'react';
import { Link } from 'react-router';
import { ArrowUpRight, CalendarDays } from '@/invoxystart/components/ui/RuneIcon';

const formatPrice = (price: number) => `₽ ${price.toLocaleString('ru-RU')}`;

export function RenewalCard({
  onPay,
  title = 'Подписка',
  subtitle = 'Параметры тарифа',
  terms = [],
  showTariffs = true,
}: {
  onPay: (price: number, term: string, id: string) => void;
  title?: string;
  subtitle?: string;
  terms?: { id: string; label: string; price: number; discount?: number }[];
  showTariffs?: boolean;
}) {
  const [selected, setSelected] = useState(terms[0]?.id ?? '');
  const activeTerm = terms.find((t) => t.id === selected);

  return (
    <div className="flex w-full flex-col gap-3.5">
      <div className="flex w-full items-center gap-2.5 lg:hidden">
        <div className="glass-panel flex h-8 w-8 items-center justify-center rounded-full">
          <CalendarDays size={16} className="text-mint" />
        </div>
        <h3 className="text-[17px] font-bold tracking-[-0.3px] text-ink">
          Быстрое продление · {title}
        </h3>
      </div>

      <div className="glass-panel motion-card flex w-full flex-col gap-2 rounded-[30px] p-5 lg:gap-[clamp(8px,0.5vw,10px)] lg:rounded-[clamp(22px,1.1vw,28px)] lg:p-[clamp(20px,1.1vw,22px)]">
        <div className="flex w-full flex-wrap items-center justify-between gap-3">
          <h3 className="hidden min-w-0 flex-1 text-base font-bold text-ink lg:block lg:text-[clamp(15px,1vw,19px)]">
            Быстрое продление · {title}
          </h3>
          <p className="text-[13px] font-bold text-ink lg:hidden">{title} · выберите срок</p>
          {showTariffs && (
            <Link
              to="/tariffs"
              className="button-lift flex shrink-0 items-center gap-1 whitespace-nowrap text-[11px] font-semibold text-mint"
            >
              Все тарифы <ArrowUpRight size={13} />
            </Link>
          )}
        </div>
        <p className="text-[11px] text-muted lg:text-[clamp(12px,0.8vw,16px)]">{subtitle}</p>

        <div className="mt-1 grid gap-2 lg:mt-1 lg:gap-2">
          {terms.map((term) => {
            const isActive = term.id === selected;
            return (
              <button
                key={term.id}
                onClick={() => setSelected(term.id)}
                className={`grid min-h-[50px] w-full cursor-pointer grid-cols-[minmax(0,1fr)_auto] items-center gap-4 rounded-2xl px-4 py-2 text-left text-sm transition-colors lg:min-h-[clamp(50px,2.9vw,58px)] lg:rounded-[clamp(12px,0.8vw,16px)] lg:px-[clamp(16px,1vw,20px)] lg:text-[clamp(14px,0.9vw,17px)] ${
                  isActive
                    ? 'border border-mint bg-ink font-bold text-bg'
                    : 'glass-control font-normal text-ink hover:border-line'
                } active:scale-[0.99]`}
              >
                <span className="flex min-w-0 flex-col items-start justify-center leading-none">
                  <span className="block whitespace-nowrap">{term.label}</span>
                  {term.discount ? (
                    <span
                      className={`mt-1.5 block text-xs font-medium leading-none lg:text-[clamp(12px,0.8vw,15px)] ${isActive ? 'text-bg/60' : 'text-mint'}`}
                    >
                      −{term.discount}%
                    </span>
                  ) : null}
                </span>
                <span className="min-w-[5.5rem] whitespace-nowrap text-right font-bold leading-none tabular-nums">
                  {formatPrice(term.price)}
                </span>
              </button>
            );
          })}
        </div>

        <button
          onClick={() => activeTerm && onPay(activeTerm.price, activeTerm.label, activeTerm.id)}
          disabled={!activeTerm}
          className="mt-2 flex h-12 w-full cursor-pointer items-center justify-center rounded-full bg-ink text-sm font-bold text-bg transition-transform lg:mt-2 lg:h-[clamp(48px,2.8vw,56px)] lg:text-[clamp(14px,0.85vw,17px)]"
        >
          Оплатить · {activeTerm ? formatPrice(activeTerm.price) : '—'}
        </button>
      </div>
    </div>
  );
}
