import { useTranslation } from 'react-i18next';
import { StarIcon } from '@/components/icons';

/**
 * Отметка периода, выбранного оператором как самый выгодный.
 *
 * Цвет намеренно не accent и не success: accent уже означает «этот вариант
 * выбран», success — размер скидки. Третий смысл третьим цветом, иначе рядом со
 * скидкой «−25 %» отметка читается как её продолжение.
 */
export function BestValueBadge({
  className,
  label,
  variant = 'period',
}: {
  className?: string;
  label?: string;
  variant?: 'period' | 'tariff';
}) {
  const { t } = useTranslation();
  const badgeClassName =
    variant === 'tariff'
      ? 'rounded-lg bg-gradient-to-r from-violet-500 to-purple-600 px-3 py-1 text-xs font-semibold text-white shadow-[0_10px_24px_-10px_rgba(124,58,237,0.85)]'
      : 'rounded-full bg-urgent-400/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-urgent-400';

  return (
    <span className={`inline-flex items-center gap-1 ${badgeClassName} ${className ?? ''}`}>
      <StarIcon filled className="h-3 w-3" />
      {label ?? t('subscription.bestValue')}
    </span>
  );
}

/** Цвет рамки выделенного периода — тот же токен, что и у отметки. */
export const BEST_VALUE_BORDER = 'rgb(var(--color-urgent-400))';
