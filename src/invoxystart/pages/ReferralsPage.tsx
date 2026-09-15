import { useEffect, useState } from 'react';
import { Check, Copy, Link2, Send, Share2, Sparkles } from '@/invoxystart/components/ui/RuneIcon';
import { PageHeader } from '@/invoxystart/components/layout/PageHeader';
import { useToast } from '@/invoxystart/components/layout/ToastProvider';
import {
  referralApi,
  type ReferralEarning,
  type ReferralInfo,
  type ReferralItem,
  type ReferralTerms,
} from '@/invoxystart/api';
import { formatDate, formatMoney } from '@/invoxystart/components/account/AccountPrimitives';
import { copyToClipboard } from '@/utils/clipboard';

export default function ReferralsPage() {
  const { showToast } = useToast();
  const [info, setInfo] = useState<ReferralInfo | null>(null);
  const [terms, setTerms] = useState<ReferralTerms | null>(null);
  const [invited, setInvited] = useState<ReferralItem[]>([]);
  const [income, setIncome] = useState<ReferralEarning[]>([]);

  useEffect(() => {
    let mounted = true;
    void Promise.allSettled([
      referralApi.getReferralInfo(),
      referralApi.getReferralTerms(),
      referralApi.getReferralList({ per_page: 20 }),
      referralApi.getReferralEarnings({ per_page: 20 }),
    ]).then(([infoResult, termsResult, invitedResult, earningsResult]) => {
      if (!mounted) return;
      if (infoResult.status === 'fulfilled') setInfo(infoResult.value);
      if (termsResult.status === 'fulfilled') setTerms(termsResult.value);
      if (invitedResult.status === 'fulfilled') setInvited(invitedResult.value.items);
      if (earningsResult.status === 'fulfilled') setIncome(earningsResult.value.items);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const links = [
    { label: 'Telegram', value: info?.bot_referral_link || '' },
    { label: 'Ссылка', value: info?.referral_link || '' },
  ];

  async function copy(value: string) {
    if (!value) {
      showToast('Реферальная ссылка пока недоступна');
      return;
    }
    try {
      await copyToClipboard(value);
      showToast('Ссылка скопирована');
    } catch {
      showToast('Не удалось скопировать ссылку');
    }
  }

  async function share() {
    const url = info?.referral_link || info?.bot_referral_link;
    if (!url) {
      showToast('Реферальная ссылка пока недоступна');
      return;
    }
    const data = { title: 'Invoxy', text: 'Присоединяйся к Invoxy', url };
    if (navigator.share) await navigator.share(data).catch(() => undefined);
    else await copy(url);
  }

  return (
    <div className="flex min-w-0 max-w-full flex-col gap-5 pb-28 lg:gap-6 lg:pb-0">
      <PageHeader title="Приглашения" subtitle="Приглашайте и зарабатывайте!" />

      <div className="grid min-w-0 max-w-full gap-5 xl:grid-cols-2">
        <section className="glass-panel motion-card relative h-[200px] min-w-0 max-w-full overflow-hidden rounded-[30px] p-[22px] lg:h-auto lg:min-h-[270px] lg:rounded-[32px] lg:p-8">
          <img
            src="/images/referral-robot.webp"
            alt=""
            className="pointer-events-none absolute right-[-20px] top-[22px] h-[165px] w-[165px] object-contain opacity-90 lg:bottom-0 lg:right-4 lg:top-auto lg:h-auto lg:w-[330px]"
            decoding="async"
          />
          <div className="relative z-10 max-w-[212px] lg:max-w-[39%]">
            <p className="flex items-center gap-1.5 text-[10px] font-bold tracking-[0.13em] text-mint lg:gap-2 lg:text-[11px]">
              <Sparkles size={14} /> РЕФЕРАЛЬНАЯ ПРОГРАММА
            </p>
            <h2 className="mt-2 text-xl font-bold leading-[1.15] tracking-[-0.035em] lg:mt-5 lg:text-[28px] lg:font-medium lg:leading-[1.06] lg:tracking-[-0.045em]">
              Приглашайте друзей
              <br />и получайте бонусы
            </h2>
            <p className="mt-1.5 text-[11px] text-ink/80 lg:hidden">
              Получайте бонусы вместе с друзьями
            </p>
            <div className="mt-2.5 flex gap-2 lg:mt-7 lg:gap-3">
              <div className="glass-control h-[58px] w-[88px] rounded-2xl p-2 lg:h-auto lg:w-auto lg:px-4 lg:py-3">
                <strong className="block text-[17px] leading-none text-mint lg:text-xl">
                  +{terms?.commission_percent ?? info?.commission_percent ?? 0}%
                </strong>
                <p className="mt-1 text-[9px] leading-[1.1] text-muted lg:text-[10px]">
                  от пополнений
                </p>
              </div>
              <div className="glass-control h-[58px] w-[88px] rounded-2xl p-2 lg:h-auto lg:w-auto lg:px-4 lg:py-3">
                <strong className="block text-[17px] leading-none text-mint lg:text-xl">
                  +{terms?.inviter_bonus_rubles ?? 0} ₽
                </strong>
                <p className="mt-1 text-[9px] leading-[1.1] text-muted lg:text-[10px]">
                  обоим за старт
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="glass-panel motion-card min-w-0 max-w-full overflow-hidden rounded-[32px] p-5 lg:p-7">
          <h2 className="text-lg font-medium">Ваша ссылка</h2>
          <div className="mt-3 divide-y divide-white/10">
            {links.map((link, index) => (
              <div key={link.label} className="flex items-center gap-3 py-4">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-mint/10 text-mint">
                  {index ? <Link2 size={17} /> : <Send size={17} />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold uppercase tracking-[.12em] text-muted">
                    {link.label}
                  </p>
                  <p className="mt-1.5 truncate font-mono text-[13px] text-ink/85">{link.value}</p>
                </div>
                <button
                  type="button"
                  aria-label={`Копировать ${link.label}`}
                  onClick={() => copy(link.value)}
                  className="glass-control grid h-12 w-12 shrink-0 place-items-center rounded-full text-mint active:scale-90"
                >
                  <Copy size={18} />
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={share}
            className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-ink text-sm font-bold text-bg active:scale-[.98]"
          >
            <Share2 size={17} /> Поделиться
          </button>
        </section>
      </div>

      <div className="grid min-w-0 max-w-full gap-5 xl:grid-cols-2">
        <ListCard
          title="Приглашённые"
          icon={<Send size={17} />}
          rows={invited.map((item) => ({
            title:
              item.first_name || (item.username ? `@${item.username}` : `Пользователь #${item.id}`),
            detail: item.has_paid
              ? 'Оплата получена'
              : item.has_subscription
                ? 'Есть подписка'
                : 'Новый пользователь',
            value: item.has_paid ? 'Активен' : '—',
          }))}
        />
        <ListCard
          title="История начислений"
          icon={<Check size={17} />}
          rows={income.map((item) => ({
            title: item.reason || item.tariff_name || 'Начисление',
            detail: formatDate(item.created_at),
            value:
              item.reward_type === 'days'
                ? `+${item.days_granted} дн.`
                : `+${formatMoney(item.amount_kopeks)}`,
          }))}
        />
      </div>
    </div>
  );
}

function ListCard({
  title,
  icon,
  rows,
}: {
  title: string;
  icon: React.ReactNode;
  rows: { title: string; detail: string; value: string }[];
}) {
  return (
    <section className="glass-panel motion-card min-w-0 max-w-full overflow-hidden rounded-[30px] p-5 lg:p-7">
      <div className="flex items-center gap-2">
        <span className="text-mint">{icon}</span>
        <h2 className="text-lg font-medium">{title}</h2>
      </div>
      <div className="mt-4 divide-y divide-white/8">
        {rows.length ? (
          rows.map((row) => (
            <div key={row.title} className="flex min-w-0 items-center justify-between gap-4 py-4">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{row.title}</p>
                <p className="mt-1 truncate text-xs text-muted">{row.detail}</p>
              </div>
              <strong className="shrink-0 text-sm text-mint">{row.value}</strong>
            </div>
          ))
        ) : (
          <p className="py-6 text-center text-xs text-muted">Пока нет данных</p>
        )}
      </div>
    </section>
  );
}
