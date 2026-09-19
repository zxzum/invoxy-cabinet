import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, SlidersHorizontal } from '@/invoxystart/components/ui/RuneIcon';
import { AdaptiveDialog } from '@/invoxystart/components/ui/AdaptiveDialog';
import type { Transaction } from '@/invoxystart/api';
import { formatDate, formatMoney } from '@/invoxystart/components/account/AccountPrimitives';

type Operation = [string, string, string, string, string, string];

function operationType(item: Transaction) {
  const value = `${item.type} ${item.description || ''}`.toLowerCase();
  if (value.includes('bonus') || value.includes('бонус') || item.type === 'referral')
    return 'Бонус';
  if (item.amount_kopeks >= 0) return 'Пополнение';
  return 'Списание';
}

export function HistoryModal({
  open,
  onClose,
  transactions = [],
}: {
  open: boolean;
  onClose: () => void;
  transactions?: Transaction[];
}) {
  const [filter, setFilter] = useState('Все');
  const [newest, setNewest] = useState(true);
  const [page, setPage] = useState(0);
  const operations = useMemo<Operation[]>(
    () =>
      transactions.map((item) => {
        const kind = operationType(item);
        const amount = `${item.amount_kopeks >= 0 ? '+' : '−'}${formatMoney(Math.abs(item.amount_kopeks))}`;
        return [
          formatDate(item.created_at),
          item.description || item.type,
          kind,
          amount,
          item.payment_method || 'Баланс Invoxy',
          item.is_completed ? 'Выполнено' : 'В обработке',
        ];
      }),
    [transactions],
  );
  const rows = useMemo(() => {
    const filtered = filter === 'Все' ? operations : operations.filter((row) => row[2] === filter);
    return newest ? filtered : [...filtered].reverse();
  }, [filter, newest, operations]);
  const pageCount = Math.max(1, Math.ceil(rows.length / 4));
  const visible = rows.slice(page * 4, page * 4 + 4);

  return (
    <AdaptiveDialog open={open} onClose={onClose} titleId="history-title" maxWidth="max-w-2xl">
      <div className="pr-12">
        <p className="text-[10px] font-bold tracking-[.14em] text-mint">ОПЕРАЦИИ</p>
        <h2 id="history-title" className="mt-2 text-2xl font-medium">
          История баланса
        </h2>
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        {['Все', 'Пополнение', 'Списание', 'Бонус'].map((value) => (
          <button
            type="button"
            key={value}
            onClick={() => {
              setFilter(value);
              setPage(0);
            }}
            className={`h-9 rounded-full px-4 text-xs ${filter === value ? 'bg-mint font-bold text-bg' : 'glass-control text-muted'}`}
          >
            {value}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setNewest((value) => !value)}
          className="glass-control ml-auto flex h-9 items-center gap-2 rounded-full px-4 text-xs text-muted"
        >
          <SlidersHorizontal size={14} />
          {newest ? 'Сначала новые' : 'Сначала старые'}
        </button>
      </div>
      <div className="mt-4 divide-y divide-white/[0.06]">
        {visible.length ? (
          visible.map(([date, title, type, amount, method, status]) => (
            <article
              key={`${date}-${title}`}
              className="grid gap-3 py-4 sm:grid-cols-[1fr_auto] sm:items-center"
            >
              <div>
                <div className="flex items-center gap-2">
                  <strong className="text-sm">{title}</strong>
                  <span className="rounded-full bg-white/6 px-2 py-1 text-[9px] text-muted">
                    {type}
                  </span>
                </div>
                <p className="mt-1.5 text-xs text-muted">
                  {date} · {method}
                </p>
                <p className="mt-1 text-[10px] text-mint">{status}</p>
              </div>
              <strong className={`text-base ${amount.startsWith('+') ? 'text-mint' : 'text-ink'}`}>
                {amount}
              </strong>
            </article>
          ))
        ) : (
          <p className="py-8 text-center text-xs text-muted">Пока нет операций</p>
        )}
      </div>
      <div className="mt-4 flex items-center justify-between">
        <button
          type="button"
          aria-label="Предыдущая страница"
          disabled={page === 0}
          onClick={() => setPage((value) => value - 1)}
          className="glass-control grid h-11 w-11 place-items-center rounded-full disabled:opacity-30"
        >
          <ChevronLeft size={18} />
        </button>
        <span className="text-xs text-muted">
          {page + 1} / {pageCount}
        </span>
        <button
          type="button"
          aria-label="Следующая страница"
          disabled={page + 1 >= pageCount}
          onClick={() => setPage((value) => value + 1)}
          className="glass-control grid h-11 w-11 place-items-center rounded-full disabled:opacity-30"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </AdaptiveDialog>
  );
}
