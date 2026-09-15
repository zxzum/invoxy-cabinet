import { useCallback, useEffect, useState } from 'react';
import { CreditCard, X } from '@/invoxystart/components/ui/RuneIcon';
import { balanceApi } from '@/invoxystart/api';
import { useToast } from '@/invoxystart/components/layout/ToastProvider';
import {
  AccountPage,
  AccountPanel,
  EmptyState,
  ErrorState,
  LoadingState,
  formatDate,
} from '@/invoxystart/components/account/AccountPrimitives';
import { useDestructiveConfirm } from '@/platform/hooks/useNativeDialog';

type SavedCard = {
  id: number;
  method_type?: string | null;
  card_last4?: string | null;
  card_type?: string | null;
  title?: string | null;
  created_at?: string | null;
};

export default function SavedCardsPage() {
  const { showToast } = useToast();
  const confirm = useDestructiveConfirm();
  const [cards, setCards] = useState<SavedCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await balanceApi.getSavedCards();
      setCards(Array.isArray(result?.cards) ? (result.cards as SavedCard[]) : []);
    } catch {
      setError('Не удалось загрузить сохранённые карты');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function removeCard(id: number) {
    if (!(await confirm('Удалить сохранённую карту?', 'Подтвердите удаление'))) return;
    setDeleting(id);
    try {
      await balanceApi.deleteSavedCard(id);
      setCards((current) => current.filter((card) => card.id !== id));
      showToast('Карта удалена');
    } catch {
      showToast('Не удалось удалить карту');
    } finally {
      setDeleting(null);
    }
  }

  return (
    <AccountPage title="Сохранённые карты" subtitle="Способы оплаты для автопродления">
      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={() => void load()} />
      ) : cards.length === 0 ? (
        <EmptyState
          title="Нет сохранённых карт"
          description="Карта появится здесь после первой оплаты с включённым сохранением."
        />
      ) : (
        <AccountPanel title="Ваши карты" description="Удалить карту можно в любой момент">
          <div className="mt-4 divide-y divide-white/8">
            {cards.map((card) => (
              <div key={card.id} className="flex items-center gap-3 py-4">
                <span className="glass-control grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-mint">
                  <CreditCard size={19} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {card.title ||
                      `${card.card_type || card.method_type || 'Карта'}${card.card_last4 ? ` · •••• ${card.card_last4}` : ''}`}
                  </p>
                  <p className="mt-1 text-xs text-muted">Добавлена {formatDate(card.created_at)}</p>
                </div>
                <button
                  type="button"
                  disabled={deleting === card.id}
                  onClick={() => void removeCard(card.id)}
                  className="button-lift flex items-center gap-1.5 rounded-full border border-red-300/20 px-3 py-2 text-xs text-red-200 disabled:opacity-50"
                >
                  <X size={14} /> {deleting === card.id ? 'Удаление…' : 'Удалить'}
                </button>
              </div>
            ))}
          </div>
        </AccountPanel>
      )}
    </AccountPage>
  );
}

export { SavedCardsPage };
