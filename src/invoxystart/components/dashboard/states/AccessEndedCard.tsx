import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { ArrowRight } from '@/invoxystart/components/ui/RuneIcon';
import type { AccountState } from '@/invoxystart/lib/accountState';
import { tariffsUrl } from '@/invoxystart/lib/usePurchaseIntent';

const formatPrice = (price: number) => `${price.toLocaleString('ru-RU')} ₽`;

/**
 * Экран «доступ закончился»: без подключения и устройств, одна крупная кнопка.
 * Для истёкшей платной подписки — продление текущего тарифа с ценой, иначе —
 * переход к выбору тарифа.
 */
export function AccessEndedCard({
  state,
  tariffName,
  tariffId,
  endDate,
  renewal,
  onRenew,
}: {
  state: Extract<AccountState, 'trial_expired' | 'paid_expired' | 'disabled'>;
  tariffName?: string | null;
  tariffId?: number | null;
  endDate?: string;
  /** Цена и срок продления по умолчанию, если продление доступно. */
  renewal?: { price: number; label: string } | null;
  onRenew: () => void;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const canRenew = state === 'paid_expired' && Boolean(renewal);

  return (
    <section className="glass-panel motion-card relative w-full overflow-hidden rounded-[28px] border border-rose-400/25 p-5 shadow-[0_0_30px_rgba(244,63,94,0.06)] sm:p-7">
      <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.14em] text-rose-300">
        <span className="h-2 w-2 rounded-full bg-rose-400" />
        {t(`invoxy.ended.eyebrow.${state}`)}
      </p>
      <h2 className="mt-3 text-[26px] font-medium leading-tight tracking-[-.04em] sm:text-4xl">
        {t(`invoxy.ended.title.${state}`)}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        {state === 'paid_expired' && tariffName
          ? t('invoxy.ended.paidSubtitle', { name: tariffName, date: endDate ?? '—' })
          : t(`invoxy.ended.subtitle.${state}`)}
      </p>

      <button
        type="button"
        onClick={canRenew ? onRenew : () => navigate('/tariffs')}
        className="button-lift mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-mint px-4 py-3 text-sm font-bold text-bg"
      >
        {canRenew && renewal
          ? t('invoxy.ended.renew', { price: formatPrice(renewal.price), term: renewal.label })
          : t('invoxy.ended.chooseTariff')}
        <ArrowRight size={16} />
      </button>
      <button
        type="button"
        onClick={() =>
          navigate(state === 'disabled' ? '/support' : tariffsUrl(canRenew ? tariffId : null))
        }
        className="mt-2 flex min-h-11 w-full items-center justify-center text-sm font-semibold text-muted transition-colors hover:text-ink"
      >
        {state === 'disabled'
          ? t('invoxy.ended.contactSupport')
          : canRenew
            ? t('invoxy.ended.otherTariffs')
            : t('invoxy.ended.compareTariffs')}
      </button>
    </section>
  );
}
