import { useEffect, useState } from 'react';
import { usePlatform } from '@/platform';
import { useNavigate, useLocation } from 'react-router';
import {
  Check,
  ChevronRight,
  CreditCard,
  Headphones,
  Link2,
  LogOut,
  Mail,
  MessageCircle,
  ShieldCheck,
  UserRound,
} from '@/invoxystart/components/ui/RuneIcon';
import { PageHeader } from '@/invoxystart/components/layout/PageHeader';
import { useToast } from '@/invoxystart/components/layout/ToastProvider';
import { HistoryModal } from '@/invoxystart/components/profile/HistoryModal';
import { EmailLinkDialog } from '@/invoxystart/components/profile/EmailLinkDialog';
import { ActiveInvoiceCard } from '@/invoxystart/components/dashboard/ActiveInvoiceCard';
import { usePayment } from '@/invoxystart/components/payments/PaymentFlow';
import { useAuth } from '@/invoxystart/auth';
import {
  balanceApi,
  promoApi,
  type LoyaltyTiersResponse,
  type Transaction,
} from '@/invoxystart/api';
import { formatDate, formatMoney } from '@/invoxystart/components/account/AccountPrimitives';
import { infoApi } from '@/api/info';
import { resolveSupportContact, type SupportContactTarget } from '@/utils/supportContact';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { openPayment } = usePayment();
  const { user, logout } = useAuth();
  const { openLink, openTelegramLink } = usePlatform();
  const [emailLinkSent, setEmailLinkSent] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('1000');
  const [topUpError, setTopUpError] = useState('');
  const [balance, setBalance] = useState(user?.balance_rubles ?? 0);
  const [history, setHistory] = useState<Transaction[]>([]);
  const [loyalty, setLoyalty] = useState<LoyaltyTiersResponse | null>(null);
  const [supportTarget, setSupportTarget] = useState<SupportContactTarget | null>(null);
  const location = useLocation();
  const [highlightTopUp, setHighlightTopUp] = useState(false);

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
      if (historyResult.status === 'fulfilled') setHistory(historyResult.value.items);
      if (loyaltyResult.status === 'fulfilled') setLoyalty(loyaltyResult.value);
      if (supportResult.status === 'fulfilled') {
        setSupportTarget(resolveSupportContact(supportResult.value));
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

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
      <PageHeader title="Профиль" subtitle="Баланс, данные и поддержка" mobileNotifications />
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
              <p className="mt-8 text-[44px] font-light tracking-[-0.055em]">
                ₽ {balance.toLocaleString('ru-RU')}
              </p>
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
              {history.map((item) => {
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
              })}
            </div>
          </section>
        </div>

        <div className="flex w-full min-w-0 flex-col gap-5">
          <section className="glass-panel motion-card rounded-[30px] p-5 lg:p-7">
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
            <div className="mt-5 h-2 rounded-full bg-white/8">
              <div
                className="h-full rounded-full bg-mint transition-[width] duration-500"
                style={{ width: `${loyalty?.progress_percent ?? 0}%` }}
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
          </section>

          <section className="glass-panel motion-card rounded-[30px] p-5 lg:p-7">
            <h2 className="text-lg font-medium">Данные аккаунта</h2>
            <InfoRow
              icon={<UserRound size={17} />}
              label="Имя"
              value={
                [user?.first_name, user?.last_name].filter(Boolean).join(' ') ||
                user?.username ||
                'Не указано'
              }
              onClick={() => showToast('Редактирование имени')}
            />
            <InfoRow
              icon={<Mail size={17} />}
              label="E-mail"
              value={user?.email || 'Не привязан'}
              onClick={() => showToast('Настройки Email')}
            />
            <InfoRow
              icon={<ShieldCheck size={17} />}
              label="Telegram ID"
              value={user?.telegram_id ? String(user.telegram_id) : 'Не привязан'}
              onClick={() => showToast('Данные Telegram')}
            />
            <p className="mt-5 text-[10px] font-bold uppercase tracking-[.13em] text-muted">
              Привязанные профили
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <div className="flex items-center gap-3 rounded-2xl bg-mint/10 px-3.5 py-3 text-sm">
                <Check size={16} className="text-mint" />
                <div>
                  <p className="font-medium">
                    Telegram {user?.telegram_id ? 'привязан' : 'не привязан'}
                  </p>
                  <p className="mt-0.5 text-[10px] text-muted">
                    {user?.username ? `@${user.username}` : ''}
                  </p>
                </div>
              </div>
              {user?.email && user?.email_verified ? (
                <div
                  onClick={() => setEmailDialogOpen(true)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') setEmailDialogOpen(true);
                  }}
                  role="button"
                  tabIndex={0}
                  className="button-lift group flex cursor-pointer items-center gap-3 rounded-2xl bg-mint/10 px-3.5 py-3 text-left text-sm"
                >
                  <Check size={16} className="text-mint shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-ink">Email привязан</p>
                    <p className="mt-0.5 truncate text-[10px] text-muted">{user.email}</p>
                  </div>
                  <ChevronRight
                    size={14}
                    className="ml-auto shrink-0 text-muted transition-transform duration-300 group-hover:translate-x-1 group-hover:text-mint"
                  />
                </div>
              ) : user?.email ? (
                <button
                  type="button"
                  onClick={() => setEmailDialogOpen(true)}
                  className="button-lift email-link-button group flex items-center gap-3 rounded-2xl border border-amber-300/30 bg-amber-300/5 px-3.5 py-3 text-left text-sm"
                >
                  <span className="shrink-0 transition-transform duration-300 group-hover:scale-110">
                    <Link2 size={16} className="text-amber-300" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-amber-200">
                      {emailLinkSent ? 'Письмо отправлено' : 'Email не подтверждён'}
                    </p>
                    <p className="mt-0.5 truncate text-[10px] text-amber-200/70">
                      {emailLinkSent ? 'Проверьте входящие' : user.email}
                    </p>
                  </div>
                  <ChevronRight
                    size={14}
                    className="ml-auto shrink-0 text-amber-200/60 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-amber-200"
                  />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setEmailDialogOpen(true)}
                  className={`button-lift email-link-button group flex items-center gap-3 rounded-2xl border border-dashed px-3.5 py-3 text-left text-sm ${emailLinkSent ? 'border-mint/40 bg-mint/10 text-ink' : 'border-white/15 text-muted'}`}
                >
                  <span className="shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
                    {emailLinkSent ? (
                      <Check size={16} className="text-mint" />
                    ) : (
                      <Link2 size={16} className="text-mint" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-ink">
                      {emailLinkSent ? 'Письмо отправлено' : 'Привязать Email'}
                    </p>
                    <p className="mt-0.5 text-[10px]">
                      {emailLinkSent ? 'Проверьте входящие' : 'Подтвердить почту'}
                    </p>
                  </div>
                  <ChevronRight
                    size={14}
                    className="ml-auto shrink-0 text-muted transition-transform duration-300 group-hover:translate-x-1 group-hover:text-mint"
                  />
                </button>
              )}
            </div>
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
      <EmailLinkDialog
        open={emailDialogOpen}
        onClose={() => setEmailDialogOpen(false)}
        onSent={() => setEmailLinkSent(true)}
      />
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="account-action group mt-1 flex w-full items-center gap-3 border-b border-white/[.08] px-2 py-3.5 text-left last:border-0"
    >
      <span className="text-mint transition-transform duration-500 group-hover:scale-110">
        {icon}
      </span>
      <span className="shrink-0 text-xs text-muted">{label}</span>
      <span className="min-w-0 flex-1 break-all text-right text-xs sm:text-sm font-medium">
        {value}
      </span>
      <ChevronRight
        size={14}
        className="shrink-0 text-muted transition-transform duration-500 group-hover:translate-x-1 group-hover:text-mint"
      />
    </button>
  );
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
