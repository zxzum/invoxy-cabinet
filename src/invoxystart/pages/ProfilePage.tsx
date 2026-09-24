import { lazy, Suspense, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { usePlatform } from '@/platform';
import { useNavigate, useLocation } from 'react-router';
import {
  ChevronRight,
  CreditCard,
  Headphones,
  LogOut,
  Mail,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  UserRound,
} from '@/invoxystart/components/ui/RuneIcon';
import { PageHeader } from '@/invoxystart/components/layout/PageHeader';
import { useToast } from '@/invoxystart/components/layout/ToastProvider';
import { HistoryModal } from '@/invoxystart/components/profile/HistoryModal';
import { EmailLinkDialog } from '@/invoxystart/components/profile/EmailLinkDialog';
import { AdaptiveDialog } from '@/invoxystart/components/ui/AdaptiveDialog';
import { ActiveInvoiceCard } from '@/invoxystart/components/dashboard/ActiveInvoiceCard';
import { usePayment } from '@/invoxystart/components/payments/PaymentFlow';
import { useAuth } from '@/invoxystart/auth';
import { AnimatedBalance } from '@/invoxystart/components/ui/AnimatedBalance';
import {
  authApi,
  balanceApi,
  promoApi,
  type LoyaltyTiersResponse,
  type Transaction,
} from '@/invoxystart/api';
import { formatDate, formatMoney } from '@/invoxystart/components/account/AccountPrimitives';
import { infoApi } from '@/api/info';
import { resolveSupportContact, type SupportContactTarget } from '@/utils/supportContact';

const TelegramLinkWidget = lazy(() =>
  import('@/pages/ConnectedAccounts').then((module) => ({ default: module.TelegramLinkWidget })),
);

export default function ProfilePage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { openPayment } = usePayment();
  const { user, logout, refreshUser, isAdmin } = useAuth();
  const { openLink, openTelegramLink } = usePlatform();
  const [emailLinkSent, setEmailLinkSent] = useState(false);
  const [emailResending, setEmailResending] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [nameDialogOpen, setNameDialogOpen] = useState(false);
  const [nameValue, setNameValue] = useState('');
  const [nameError, setNameError] = useState('');
  const [nameSaving, setNameSaving] = useState(false);
  const [telegramDialogOpen, setTelegramDialogOpen] = useState(false);
  const [telegramLinked, setTelegramLinked] = useState(Boolean(user?.telegram_id));
  const [historyOpen, setHistoryOpen] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('1000');
  const [topUpError, setTopUpError] = useState('');
  const [balance, setBalance] = useState(user?.balance_rubles ?? 0);
  const [history, setHistory] = useState<Transaction[]>([]);
  const [historyStatus, setHistoryStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [loyalty, setLoyalty] = useState<LoyaltyTiersResponse | null>(null);
  const [loyaltyStatus, setLoyaltyStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [supportTarget, setSupportTarget] = useState<SupportContactTarget | null>(null);
  const location = useLocation();
  const [highlightTopUp, setHighlightTopUp] = useState(false);

  async function saveName(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = normalizeProfileName(nameValue);
    const error = validateProfileName(name);
    setNameError(error);
    if (error) return;

    setNameSaving(true);
    try {
      await authApi.updateMyName(name);
      await refreshUser();
      setNameDialogOpen(false);
      showToast('Имя сохранено');
    } catch {
      setNameError('Не удалось сохранить имя. Попробуйте ещё раз.');
    } finally {
      setNameSaving(false);
    }
  }

  async function resendEmailVerification() {
    if (emailResending) return;
    setEmailResending(true);
    try {
      await authApi.resendVerification();
      setEmailLinkSent(true);
      showToast('Письмо подтверждения отправлено');
    } catch {
      showToast('Не удалось отправить письмо. Попробуйте позже.');
    } finally {
      setEmailResending(false);
    }
  }

  useEffect(() => {
    let mounted = true;
    void Promise.allSettled([
      balanceApi.getBalance(),
      balanceApi.getTransactions({ per_page: 4 }),
      promoApi.getLoyaltyTiers(),
      infoApi.getSupportConfig(),
    ]).then(([balanceResult, historyResult, loyaltyResult, supportResult]) => {
      if (!mounted) return;
      if (balanceResult.status === 'fulfilled') setBalance(balanceResult.value.balance_rubles);
      if (historyResult.status === 'fulfilled') {
        setHistory(historyResult.value.items);
        setHistoryStatus('ready');
      } else {
        setHistoryStatus('error');
      }
      if (loyaltyResult.status === 'fulfilled') {
        setLoyalty(loyaltyResult.value);
        setLoyaltyStatus('ready');
      } else {
        setLoyaltyStatus('error');
      }
      if (supportResult.status === 'fulfilled') {
        setSupportTarget(resolveSupportContact(supportResult.value));
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (typeof user?.balance_rubles === 'number') {
      setBalance(user.balance_rubles);
    }
  }, [user?.balance_rubles]);

  useEffect(() => {
    if (location.hash === '#top-up') {
      setHighlightTopUp(true);
      const timer = setTimeout(() => {
        const el = document.getElementById('top-up');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 150);

      const clearTimer = setTimeout(() => {
        setHighlightTopUp(false);
      }, 4500);

      return () => {
        clearTimeout(timer);
        clearTimeout(clearTimer);
      };
    }
  }, [location.hash]);

  function openSupport() {
    const target = supportTarget ?? { kind: 'telegram' as const, url: 'https://t.me/invoxyvpn' };
    if (target.kind === 'telegram') openTelegramLink(target.url);
    else openLink(target.url);
  }

  function topUp() {
    const amount = Number(topUpAmount);
    if (!Number.isFinite(amount) || amount < 10) {
      setTopUpError('Минимальная сумма пополнения — 10 ₽');
      return;
    }
    setTopUpError('');
    openPayment({ amount, purpose: 'Пополнение баланса', allowBalance: false, topUp: true });
  }

  const apiTiers = loyalty?.tiers ?? [];
  const baseTier = {
    id: 0,
    name: 'Invoxy Base',
    threshold_rubles: 0,
    server_discount_percent: 0,
    traffic_discount_percent: 0,
    device_discount_percent: 0,
    period_discounts: { '30': 0 },
    is_current: !apiTiers.some((tier) => tier.is_current),
    is_achieved: true,
  };
  const tiers = [baseTier, ...apiTiers];
  const currentTier = tiers.find((tier) => tier.is_current) ?? baseTier;
  const currentDiscount =
    currentTier?.period_discounts?.['30'] ?? currentTier?.traffic_discount_percent ?? 0;
  const spent = loyalty?.current_spent_rubles ?? 0;
  const nextTier = tiers.find((tier) => !tier.is_achieved && tier.threshold_rubles > spent);
  return (
    <div className="flex w-full min-w-0 flex-col gap-5 pb-28 lg:gap-6 lg:pb-0">
      <PageHeader title="Профиль" subtitle="Баланс, данные и поддержка" notifications />

      {isAdmin && (
        <button
          type="button"
          onClick={() => navigate('/admin')}
          className="glass-panel motion-card flex w-full items-center justify-between rounded-[24px] border border-amber-400/30 bg-amber-400/5 p-4 text-left transition hover:border-amber-400/50 hover:bg-amber-400/10 active:scale-[0.99] sm:p-5"
        >
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-400/15 text-amber-400">
              <ShieldCheck size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[15px] font-bold text-ink">Панель администратора</span>
                <span className="rounded-full bg-amber-400/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-300">
                  Admin
                </span>
              </div>
              <p className="mt-0.5 text-xs text-muted">
                Управление пользователями, тарифами, серверами и платежами
              </p>
            </div>
          </div>
          <ChevronRight size={18} className="shrink-0 text-amber-400/70" />
        </button>
      )}

      <div className="grid w-full min-w-0 grid-cols-1 items-start gap-5 xl:grid-cols-2">
        <div className="flex w-full min-w-0 flex-col gap-5">
          <section className="glass-panel motion-card relative overflow-hidden rounded-[32px] p-5 sm:p-6 lg:p-8">
            <img
              src="/images/profile-balance-bg.webp"
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
              decoding="async"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-bg/70 via-bg/20 to-transparent" />
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div className="glass-control grid h-12 w-12 place-items-center rounded-full text-mint">
                  <CreditCard size={20} />
                </div>
                <span className="text-xs text-muted">Баланс Invoxy</span>
              </div>
              <div className="mt-8 text-[44px] font-light tracking-[-0.055em]">
                <AnimatedBalance value={balance} />
              </div>
              <div className="mt-6 flex items-center justify-between rounded-2xl bg-black/25 px-4 py-3 text-sm">
                <span className="text-muted">•••• 4821</span>
                <span className="font-bold tracking-[.18em]">VOXY</span>
              </div>
            </div>
          </section>

          <ActiveInvoiceCard />

          <section
            id="top-up"
            className={`glass-panel motion-card scroll-mt-6 rounded-[30px] p-5 lg:p-7 transition-all duration-500 ${
              highlightTopUp ? 'topup-highlight' : ''
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-medium">Пополнить баланс</h2>
                <p className="mt-1 text-sm text-muted">Выберите или укажите сумму</p>
              </div>
              <CreditCard size={20} className="text-mint" />
            </div>
            <div className="mt-5 grid grid-cols-3 gap-2">
              {[500, 1000, 2500].map((amount) => (
                <button
                  type="button"
                  key={amount}
                  onClick={() => {
                    setTopUpAmount(String(amount));
                    setTopUpError('');
                  }}
                  className={`button-lift h-11 rounded-full text-xs ${topUpAmount === String(amount) ? 'bg-mint font-bold text-bg' : 'glass-control'}`}
                >
                  {amount.toLocaleString('ru-RU')} ₽
                </button>
              ))}
            </div>
            <label className="mt-3 block">
              <span className="sr-only">Сумма пополнения</span>
              <input
                inputMode="numeric"
                value={topUpAmount}
                onChange={(event) => {
                  setTopUpAmount(event.target.value.replace(/\D/g, ''));
                  setTopUpError('');
                }}
                className="glass-control h-12 w-full rounded-2xl px-4 text-center text-base outline-none focus:border-mint/60"
              />
            </label>
            {topUpError && (
              <p role="alert" className="mt-2 text-xs text-red-200">
                {topUpError}
              </p>
            )}
            <button
              type="button"
              onClick={topUp}
              className="button-lift mt-4 h-12 w-full rounded-full bg-ink text-sm font-bold text-bg"
            >
              Пополнить
            </button>
          </section>

          <section className="glass-panel motion-card rounded-[30px] p-5 lg:p-7">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-medium">История операций</h2>
              <button
                type="button"
                onClick={() => setHistoryOpen(true)}
                className="text-xs font-semibold text-mint"
              >
                Все операции →
              </button>
            </div>
            <div className="mt-3 divide-y divide-white/[0.06]">
              {history.length === 0 ? (
                <p className="py-5 text-center text-sm text-muted">
                  {historyStatus === 'loading'
                    ? 'Загрузка операций…'
                    : historyStatus === 'error'
                      ? 'Не удалось загрузить операции'
                      : 'Пока нет операций'}
                </p>
              ) : (
                history.map((item) => {
                  const positive = item.amount_kopeks >= 0;
                  return (
                    <div key={item.id} className="flex items-center justify-between gap-4 py-4">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm">{item.description || item.type}</p>
                        <p className="mt-1 text-xs text-muted">{formatDate(item.created_at)}</p>
                      </div>
                      <strong
                        className={`shrink-0 whitespace-nowrap text-sm ${positive ? 'text-mint' : ''}`}
                      >
                        {positive ? '+' : '−'}
                        {formatMoney(Math.abs(item.amount_kopeks))}
                      </strong>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        </div>

        <div className="flex w-full min-w-0 flex-col gap-5">
          <section className="glass-panel motion-card rounded-[30px] p-5 lg:p-7">
            {loyaltyStatus === 'ready' ? (
              <>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-bold tracking-[0.14em] text-mint">
                      УРОВЕНЬ ЛОЯЛЬНОСТИ
                    </p>
                    <h2 className="mt-3 text-xl font-medium">
                      {currentTier?.name || 'Base'} · скидка {currentDiscount}%
                    </h2>
                  </div>
                  <span className="rounded-full bg-mint px-3 py-1.5 text-[10px] font-bold text-bg">
                    АКТИВЕН
                  </span>
                </div>
                <p className="mt-3 text-sm text-muted">
                  Потрачено {spent.toLocaleString('ru-RU')} ₽ ·{' '}
                  {nextTier
                    ? `до ${nextTier.name} осталось ${Math.max(0, nextTier.threshold_rubles - spent).toLocaleString('ru-RU')} ₽`
                    : 'максимальный уровень достигнут'}
                </p>
                <div className="mt-5 h-2 rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-mint transition-[width] duration-500"
                    style={{
                      width: `${Math.min(100, Math.max(0, Math.round((loyalty?.progress_percent ?? 0) * 10) / 10))}%`,
                    }}
                  />
                </div>
                <div className="relative mt-5 grid grid-cols-3 text-center before:absolute before:left-[16%] before:right-[16%] before:top-2 before:h-px before:bg-white/12">
                  {tiers.slice(0, 3).map((tier) => (
                    <Milestone
                      key={tier.id}
                      done={tier.is_achieved && !tier.is_current}
                      current={tier.is_current}
                      label={`${tier.name} · ${tier.period_discounts?.['30'] ?? tier.traffic_discount_percent}%`}
                      detail={`от ${tier.threshold_rubles.toLocaleString('ru-RU')} ₽`}
                    />
                  ))}
                </div>
              </>
            ) : (
              <div
                role={loyaltyStatus === 'loading' ? 'status' : 'alert'}
                className="flex min-h-36 flex-col justify-center"
              >
                <p className="text-[11px] font-bold tracking-[0.14em] text-mint">
                  УРОВЕНЬ ЛОЯЛЬНОСТИ
                </p>
                <p className="mt-3 text-sm text-muted">
                  {loyaltyStatus === 'loading'
                    ? 'Загружаем уровни лояльности…'
                    : 'Не удалось загрузить уровни лояльности'}
                </p>
                {loyaltyStatus === 'loading' && (
                  <div className="mt-5 h-2 rounded-full bg-white/10" aria-hidden="true" />
                )}
              </div>
            )}
          </section>

          <section className="glass-panel motion-card rounded-[30px] p-5 lg:p-7">
            <h2 className="text-lg font-medium">Данные аккаунта</h2>
            <InfoRow
              icon={<UserRound size={17} />}
              label="Имя"
              value={
                [user?.first_name, user?.last_name].filter(Boolean).join(' ') ||
                (user?.username ? `@${user.username}` : '')
              }
              actionLabel={
                user?.first_name?.trim() || user?.last_name?.trim() ? undefined : 'Указать имя'
              }
              onAction={() => {
                setNameValue('');
                setNameError('');
                setNameDialogOpen(true);
              }}
            />
            <InfoRow
              icon={<Mail size={17} />}
              label="E-mail"
              value={user?.email || ''}
              detail={
                !user?.email
                  ? emailLinkSent
                    ? 'Письмо отправлено · проверьте почту'
                    : undefined
                  : !user.email_verified
                    ? emailLinkSent
                      ? 'Письмо отправлено · проверьте почту'
                      : 'Не подтверждён'
                    : undefined
              }
              actionLabel={
                !user?.email
                  ? 'Привязать Email'
                  : !user.email_verified
                    ? emailResending
                      ? 'Отправка…'
                      : 'Повторить отправку'
                    : undefined
              }
              actionDisabled={emailResending}
              onAction={() => {
                if (!user?.email) setEmailDialogOpen(true);
                else if (!user.email_verified) void resendEmailVerification();
              }}
            />
            <InfoRow
              icon={<ShieldCheck size={17} />}
              label="Telegram ID"
              value={
                user?.telegram_id ? String(user.telegram_id) : telegramLinked ? 'Привязан' : ''
              }
              actionLabel={telegramLinked ? undefined : 'Привязать Telegram'}
              onAction={() => setTelegramDialogOpen(true)}
            />
          </section>

          <section className="glass-panel motion-card rounded-[30px] p-5 lg:p-7">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[.13em] text-mint">
                  Сотрудничество
                </p>
                <h2 className="mt-1 text-lg font-medium">Партнёрская программа</h2>
              </div>
              <span className="rounded-full bg-mint/10 px-3 py-1 text-[10px] font-bold text-mint">
                ДО 50%
              </span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-muted">
              Зарабатывайте на рекомендациях InvoxyVPN. Индивидуальные промокоды, повышенная ставка
              отчислений и регулярные выплаты.
            </p>
            <button
              type="button"
              onClick={() => navigate('/partner')}
              className="button-lift mt-4 flex h-13 w-full items-center justify-between rounded-2xl bg-white/5 px-4 text-sm active:scale-[.99]"
            >
              <span className="flex items-center gap-3">
                <Sparkles size={18} className="text-mint" /> Подать заявку на партнерство
              </span>
              <ChevronRight size={16} />
            </button>
          </section>

          <section className="glass-panel motion-card rounded-[30px] p-5 lg:p-7">
            <h2 className="text-lg font-medium">Поддержка</h2>
            <button
              type="button"
              onClick={openSupport}
              className="button-lift mt-4 flex h-13 w-full items-center justify-between rounded-2xl bg-white/5 px-4 text-sm active:scale-[.99]"
            >
              <span className="flex items-center gap-3">
                <MessageCircle size={18} className="text-mint" /> Написать в Telegram
              </span>
              <ChevronRight size={16} />
            </button>
            <button
              type="button"
              onClick={() => navigate('/support')}
              className="button-lift mt-2 flex h-13 w-full items-center justify-between rounded-2xl bg-white/5 px-4 text-sm active:scale-[.99]"
            >
              <span className="flex items-center gap-3">
                <Headphones size={18} className="text-mint" /> Центр помощи
              </span>
              <ChevronRight size={16} />
            </button>
          </section>

          <button
            type="button"
            onClick={() => void logout().then(() => navigate('/login'))}
            className="glass-panel flex h-14 items-center justify-center gap-2 rounded-full text-sm text-red-300 active:scale-[.98]"
          >
            <LogOut size={17} /> Выйти из аккаунта
          </button>
        </div>
      </div>
      <HistoryModal
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        transactions={history}
      />
      <AdaptiveDialog
        open={nameDialogOpen}
        onClose={() => setNameDialogOpen(false)}
        titleId="profile-name-title"
        maxWidth="max-w-md"
      >
        <p className="text-[10px] font-bold tracking-[.15em] text-mint">ДАННЫЕ АККАУНТА</p>
        <h2 id="profile-name-title" className="mt-2 text-2xl font-medium">
          Указать имя
        </h2>
        <p className="mt-2 text-sm text-muted">
          2–32 буквы; можно использовать пробел, дефис и апостроф.
        </p>
        <form className="mt-6 space-y-4" onSubmit={saveName} noValidate>
          <label className="block">
            <span className="mb-2 block text-xs font-semibold text-muted">Имя</span>
            <input
              autoFocus
              autoComplete="name"
              maxLength={64}
              value={nameValue}
              onChange={(event) => setNameValue(event.target.value)}
              aria-invalid={Boolean(nameError)}
              aria-describedby={nameError ? 'profile-name-error' : undefined}
              className={`glass-control h-12 w-full rounded-2xl px-4 text-sm outline-none transition-colors placeholder:text-muted/60 ${nameError ? 'border-red-300/50' : 'focus:border-mint/60'}`}
              placeholder="Ваше имя"
            />
            {nameError && (
              <span
                id="profile-name-error"
                role="alert"
                className="mt-1.5 block text-xs text-red-200"
              >
                {nameError}
              </span>
            )}
          </label>
          <button
            type="submit"
            disabled={nameSaving}
            className="button-lift h-12 w-full rounded-full bg-mint text-sm font-bold text-bg disabled:cursor-wait disabled:opacity-50"
          >
            {nameSaving ? 'Сохранение…' : 'Сохранить имя'}
          </button>
        </form>
      </AdaptiveDialog>
      <EmailLinkDialog
        open={emailDialogOpen}
        onClose={() => setEmailDialogOpen(false)}
        onSent={() => setEmailLinkSent(true)}
      />
      <AdaptiveDialog
        open={telegramDialogOpen}
        onClose={() => setTelegramDialogOpen(false)}
        titleId="telegram-link-title"
        maxWidth="max-w-md"
      >
        <p className="text-[10px] font-bold tracking-[.15em] text-mint">ДАННЫЕ АККАУНТА</p>
        <h2 id="telegram-link-title" className="mt-2 text-2xl font-medium">
          Привязать Telegram
        </h2>
        <p className="mt-2 text-sm text-muted">
          Подтвердите вход в Telegram, чтобы связать аккаунт с Invoxy.
        </p>
        <div className="mt-6 flex min-h-14 items-center justify-center">
          <Suspense fallback={<span className="text-sm text-muted">Подготовка…</span>}>
            <TelegramLinkWidget
              onLinked={() => {
                setTelegramLinked(true);
                setTelegramDialogOpen(false);
              }}
            />
          </Suspense>
        </div>
      </AdaptiveDialog>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
  detail,
  actionLabel,
  actionDisabled = false,
  onAction,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail?: string;
  actionLabel?: string;
  actionDisabled?: boolean;
  onAction?: () => void;
}) {
  return (
    <div className="mt-1 flex min-h-[58px] w-full items-center gap-3 border-b border-white/[.08] px-2 py-2.5 last:border-0">
      <span className="shrink-0 text-mint">{icon}</span>
      <span className="shrink-0 text-xs text-muted">{label}</span>
      {actionLabel ? (
        <div className="ml-auto flex shrink-0 flex-col items-end gap-1">
          <button
            type="button"
            disabled={actionDisabled}
            onClick={onAction}
            className="button-lift inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full border border-mint/25 bg-mint/[.08] px-3.5 text-[11px] font-semibold text-mint transition-colors hover:border-mint/50 hover:bg-mint/[.14] disabled:cursor-wait disabled:opacity-60 sm:px-4 sm:text-xs"
          >
            {actionLabel}
            <ChevronRight size={14} className="shrink-0" />
          </button>
          {detail && <span className="max-w-full text-right text-[9px] text-muted">{detail}</span>}
        </div>
      ) : (
        <span className="ml-auto min-w-0 break-all text-right text-xs font-medium sm:text-sm">
          {detail ? (
            <>
              <span className="block">{value}</span>
              <span className="mt-0.5 block text-[10px] font-normal text-amber-200">{detail}</span>
            </>
          ) : (
            value
          )}
        </span>
      )}
    </div>
  );
}

function normalizeProfileName(value: string) {
  return value.normalize('NFC').trim().replace(/\s+/gu, ' ');
}

function validateProfileName(name: string) {
  const characters = Array.from(name);
  if (characters.length < 2 || characters.length > 32) {
    return 'Имя должно содержать от 2 до 32 символов.';
  }
  if (!/^\p{L}$/u.test(characters[0]) || !/^\p{L}$/u.test(characters[characters.length - 1])) {
    return 'Имя должно начинаться и заканчиваться буквой.';
  }
  let previousWasSeparator = false;
  let previousWasLetter = false;
  for (const character of characters) {
    if (" -'’".includes(character)) {
      if (previousWasSeparator) return 'Проверьте пробелы, дефисы и апострофы в имени.';
      previousWasSeparator = true;
      previousWasLetter = false;
    } else if (/^\p{L}$/u.test(character)) {
      previousWasSeparator = false;
      previousWasLetter = true;
    } else if (/^\p{M}$/u.test(character) && previousWasLetter) {
      previousWasSeparator = false;
    } else {
      return 'Используйте только буквы, пробел, дефис или апостроф.';
    }
  }
  return '';
}

function Milestone({
  label,
  detail,
  done,
  current,
}: {
  label: string;
  detail: string;
  done?: boolean;
  current?: boolean;
}) {
  return (
    <div className="relative z-10 min-w-0 px-1">
      <span
        className={`mx-auto block h-4 w-4 rounded-full border-2 ${done || current ? 'border-mint bg-mint' : 'border-line bg-surface'} ${current ? 'shadow-[0_0_0_5px_rgba(165,232,196,.12)]' : ''}`}
      />
      <p
        className={`mt-2 text-[10px] font-bold break-words leading-tight ${current ? 'text-mint' : 'text-muted'}`}
      >
        {label}
      </p>
      <p className="mt-1 truncate text-[9px] text-muted">{detail}</p>
    </div>
  );
}
