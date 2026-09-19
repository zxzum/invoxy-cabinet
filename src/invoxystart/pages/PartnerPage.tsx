import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Check, Sparkles, Wallet } from '@/invoxystart/components/ui/RuneIcon';
import { referralApi, withdrawalApi } from '@/invoxystart/api';
import { useToast } from '@/invoxystart/components/layout/ToastProvider';
import {
  AccountPage,
  AccountPanel,
  EmptyState,
  ErrorState,
  LoadingState,
  formatDate,
  formatMoney,
} from '@/invoxystart/components/account/AccountPrimitives';
import { LivelyCopyButton } from '@/invoxystart/components/ui/LivelyCopyButton';

type ReferralInfo = {
  referral_code?: string | null;
  referral_link?: string | null;
  bot_referral_link?: string | null;
  total_referrals?: number;
  active_referrals?: number;
  total_earnings_kopeks?: number;
  total_earnings_rubles?: number;
  available_balance_kopeks?: number;
  available_balance_rubles?: number;
  withdrawn_kopeks?: number;
  commission_percent?: number;
};

type ReferralLevel = {
  level?: number;
  title?: string;
  name?: string;
  description?: string;
  percent?: number;
  reward_percent?: number;
  threshold?: number;
  is_current?: boolean;
  rewards?: string[];
  pays_referrer?: boolean;
  trigger_label?: string;
  required_referrals?: number;
  referee_reward?: string | null;
};
type ReferralTerms = {
  is_enabled?: boolean;
  commission_percent?: number;
  scheme?: string;
  level_descriptions?: string[];
  levels?: ReferralLevel[];
  allow_reward_kind_choice?: boolean;
  allow_days_target_choice?: boolean;
  reward_preference?: string | null;
};
type WithdrawalBalance = {
  available_total?: number;
  available_referral?: number;
  min_amount_kopeks?: number;
  min_amount_rubles?: number;
  can_request?: boolean;
  cannot_request_reason?: string | null;
  is_withdrawal_enabled?: boolean;
  requisites_text?: string | null;
};
type WithdrawalItem = {
  id: number;
  amount_kopeks?: number;
  amount_rubles?: number;
  status?: string;
  created_at?: string;
  processed_at?: string | null;
};

export default function PartnerPage() {
  const { showToast } = useToast();
  const [info, setInfo] = useState<ReferralInfo | null>(null);
  const [terms, setTerms] = useState<ReferralTerms | null>(null);
  const [balance, setBalance] = useState<WithdrawalBalance | null>(null);
  const [history, setHistory] = useState<WithdrawalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reward, setReward] = useState<string | null>(null);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [requisites, setRequisites] = useState('');
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await Promise.all([
        referralApi.getReferralInfo(),
        referralApi.getReferralTerms(),
        withdrawalApi.getBalance(),
        withdrawalApi.getHistory(),
      ]);
      setInfo(result[0] as ReferralInfo);
      setTerms(result[1] as ReferralTerms);
      setReward((result[1] as ReferralTerms).reward_preference === 'days' ? 'days' : 'money');
      setBalance(result[2] as WithdrawalBalance);
      const withdrawals = result[3] as { items?: WithdrawalItem[] };
      setHistory(Array.isArray(withdrawals?.items) ? withdrawals.items : []);
    } catch {
      setError('Не удалось загрузить партнёрскую программу');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const referralLink =
    info?.referral_link ||
    info?.bot_referral_link ||
    (info?.referral_code ? `https://invoxy.app/r/${info.referral_code}` : '');
  const levels = useMemo<ReferralLevel[]>(() => {
    if (terms?.levels?.length) return terms.levels;
    return (terms?.level_descriptions || []).map((description, index) => ({
      level: index + 1,
      description,
    }));
  }, [terms]);

  async function chooseReward(value: string) {
    setReward(value);
    setBusy(`reward-${value}`);
    try {
      await referralApi.updateRewardChoice({
        reward_preference: value,
        set_reward_preference: true,
      });
      showToast('Настройка сохранена');
    } catch {
      setReward(terms?.reward_preference ?? null);
      showToast('Не удалось сохранить настройку');
    } finally {
      setBusy(null);
    }
  }

  async function withdraw() {
    const amountRubles = Number(withdrawAmount.replace(',', '.'));
    const minRubles = balance?.min_amount_rubles ?? (balance?.min_amount_kopeks ?? 0) / 100;
    const availableRubles =
      balance?.available_total != null
        ? balance.available_total / 100
        : (info?.available_balance_rubles ?? (info?.available_balance_kopeks ?? 0) / 100);
    if (
      !Number.isFinite(amountRubles) ||
      amountRubles < minRubles ||
      amountRubles > availableRubles ||
      !requisites.trim()
    ) {
      showToast(
        `Проверьте сумму и реквизиты (доступно ${availableRubles.toLocaleString('ru-RU')} ₽)`,
      );
      return;
    }
    setBusy('withdraw');
    try {
      await withdrawalApi.create({
        amount_kopeks: Math.round(amountRubles * 100),
        payment_details: requisites.trim(),
      });
      setWithdrawAmount('');
      setRequisites('');
      showToast('Заявка на вывод создана');
      await load();
    } catch {
      showToast('Не удалось создать заявку на вывод');
    } finally {
      setBusy(null);
    }
  }

  if (loading)
    return (
      <AccountPage title="Партнёрская программа" subtitle="Приглашайте друзей и получайте бонусы">
        <LoadingState />
      </AccountPage>
    );
  if (error)
    return (
      <AccountPage title="Партнёрская программа" subtitle="Приглашайте друзей и получайте бонусы">
        <ErrorState message={error} onRetry={() => void load()} />
      </AccountPage>
    );
  if (terms?.is_enabled === false)
    return (
      <AccountPage title="Партнёрская программа" subtitle="Приглашайте друзей и получайте бонусы">
        <EmptyState title="Программа временно недоступна" description="Попробуйте зайти позже." />
      </AccountPage>
    );

  return (
    <AccountPage title="Партнёрская программа" subtitle="Приглашайте друзей и получайте бонусы">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(310px,.85fr)]">
        <div className="flex flex-col gap-5">
          <AccountPanel
            title="Ваша ссылка"
            description="Отправьте её другу — начисления будут видны здесь"
          >
            <div className="mt-5 flex gap-2">
              <div className="glass-control min-w-0 flex-1 truncate rounded-2xl px-4 py-3 font-mono text-xs text-muted">
                {referralLink || 'Ссылка пока недоступна'}
              </div>
              <LivelyCopyButton
                text={referralLink || ''}
                variant="circle"
                disabled={!referralLink}
                label="Копировать реферальную ссылку"
                onCopied={() => showToast('Ссылка скопирована', 'success')}
              />
            </div>
            <div className="mt-5 grid grid-cols-3 gap-2">
              <Stat label="Приглашено" value={String(info?.total_referrals ?? 0)} />
              <Stat label="Активных" value={String(info?.active_referrals ?? 0)} />
              <Stat
                label="Начислено"
                value={formatMoney(info?.total_earnings_kopeks, info?.total_earnings_rubles)}
              />
            </div>
          </AccountPanel>

          <AccountPanel
            title="Уровни вознаграждения"
            description={
              terms?.scheme === 'levels'
                ? 'Вознаграждение зависит от уровня программы'
                : `Текущая ставка — ${terms?.commission_percent ?? info?.commission_percent ?? 0}%`
            }
          >
            {levels.length ? (
              <div className="mt-4 grid gap-2">
                {levels.map((level, index) => {
                  const number = level.level ?? index + 1;
                  const rewards = level.rewards?.join(' · ');
                  const percent = level.percent ?? level.reward_percent;
                  const requirement = level.required_referrals ?? level.threshold;
                  return (
                    <div
                      key={`${number}-${level.description || rewards || 'level'}`}
                      className={`rounded-2xl p-4 ${level.is_current ? 'bg-mint/10 ring-1 ring-mint/30' : 'bg-white/5'}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-mint/15 text-sm font-bold text-mint">
                          {number}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium">
                            {level.title || level.name || `Уровень ${number}`}
                          </p>
                          <p className="mt-1 text-xs text-muted">
                            {level.description ||
                              rewards ||
                              (requirement
                                ? `От ${requirement} приглашений`
                                : level.trigger_label || 'Условия уровня загружаются из API')}
                          </p>
                        </div>
                        {percent != null ? (
                          <strong className="shrink-0 text-sm text-mint">{percent}%</strong>
                        ) : null}
                      </div>
                      {level.referee_reward ? (
                        <p className="mt-3 text-xs text-muted">
                          Приглашённому: {level.referee_reward}
                        </p>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="mt-4 text-sm text-muted">Условия уровней пока не настроены.</p>
            )}
          </AccountPanel>

          {terms?.allow_reward_kind_choice ? (
            <AccountPanel
              title="Тип награды"
              description="Выберите, как получать партнёрское вознаграждение"
            >
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <RewardChoice
                  active={reward === 'money'}
                  disabled={busy !== null}
                  onClick={() => void chooseReward('money')}
                  icon={<Wallet size={17} />}
                  title="Деньги"
                  detail="Начисление на баланс для вывода"
                />
                <RewardChoice
                  active={reward === 'days'}
                  disabled={busy !== null}
                  onClick={() => void chooseReward('days')}
                  icon={<Sparkles size={17} />}
                  title="Дни подписки"
                  detail="Продление выбранной подписки"
                />
              </div>
            </AccountPanel>
          ) : null}
        </div>

        <div className="flex flex-col gap-5">
          <AccountPanel
            title="Вывод средств"
            description={`Доступно ${formatMoney(balance?.available_total, balance?.available_total != null ? balance.available_total / 100 : info?.available_balance_rubles)}`}
          >
            {!balance?.is_withdrawal_enabled ? (
              <p className="mt-4 text-sm text-muted">Вывод средств сейчас отключён.</p>
            ) : balance.can_request === false ? (
              <p className="mt-4 text-sm text-muted">
                {balance.cannot_request_reason || 'Заявка на вывод пока недоступна.'}
              </p>
            ) : (
              <div className="mt-4 grid gap-3">
                <label>
                  <span className="sr-only">Сумма вывода</span>
                  <input
                    inputMode="decimal"
                    value={withdrawAmount}
                    onChange={(event) =>
                      setWithdrawAmount(event.target.value.replace(/[^\d.,]/g, ''))
                    }
                    placeholder={`Сумма, минимум ${formatMoney(balance.min_amount_kopeks, balance.min_amount_rubles)}`}
                    className="glass-control h-12 w-full rounded-2xl px-4 text-sm outline-none focus:border-mint/60"
                  />
                </label>
                <label>
                  <span className="sr-only">Реквизиты</span>
                  <textarea
                    value={requisites}
                    onChange={(event) => setRequisites(event.target.value)}
                    placeholder={balance.requisites_text || 'Реквизиты для выплаты'}
                    rows={3}
                    className="glass-control w-full resize-none rounded-2xl px-4 py-3 text-sm outline-none focus:border-mint/60"
                  />
                </label>
                <button
                  type="button"
                  disabled={busy === 'withdraw'}
                  onClick={() => void withdraw()}
                  className="button-lift h-12 rounded-full bg-mint text-sm font-bold text-bg disabled:opacity-50"
                >
                  {busy === 'withdraw' ? 'Создание заявки…' : 'Запросить вывод'}
                </button>
              </div>
            )}
          </AccountPanel>

          <AccountPanel title="История выводов">
            <div className="mt-4 divide-y divide-white/8">
              {history.length ? (
                history.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-3 py-3">
                    <div>
                      <p className="text-sm font-medium">
                        {formatMoney(item.amount_kopeks, item.amount_rubles)}
                      </p>
                      <p className="mt-1 text-xs text-muted">{formatDate(item.created_at)}</p>
                    </div>
                    <span className="rounded-full bg-white/8 px-2.5 py-1 text-[10px] text-muted">
                      {item.status || 'В обработке'}
                    </span>
                  </div>
                ))
              ) : (
                <p className="py-3 text-sm text-muted">Заявок на вывод пока нет.</p>
              )}
            </div>
          </AccountPanel>
        </div>
      </div>
    </AccountPage>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/5 p-3">
      <p className="text-[10px] uppercase tracking-[.1em] text-muted">{label}</p>
      <p className="mt-1 truncate text-sm font-medium">{value}</p>
    </div>
  );
}

function RewardChoice({
  active,
  disabled,
  onClick,
  icon,
  title,
  detail,
}: {
  active: boolean;
  disabled: boolean;
  onClick: () => void;
  icon: ReactNode;
  title: string;
  detail: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`button-lift flex items-start gap-3 rounded-2xl border p-4 text-left disabled:opacity-50 ${active ? 'border-mint/50 bg-mint/10' : 'border-white/8 bg-white/5'}`}
    >
      <span className="text-mint">{active ? <Check size={17} /> : icon}</span>
      <span>
        <strong className="block text-sm">{title}</strong>
        <span className="mt-1 block text-xs text-muted">{detail}</span>
      </span>
    </button>
  );
}

export { PartnerPage };
