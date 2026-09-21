import { Wallet } from '@/invoxystart/components/ui/RuneIcon';
import { NotificationMenu } from '@/invoxystart/components/layout/NotificationMenu';
import { AnimatedBalance } from '@/invoxystart/components/ui/AnimatedBalance';
import TicketNotificationBell from '@/components/TicketNotificationBell';

export function Header({
  balance,
  userName,
  onWalletClick,
}: {
  balance: number | string;
  userName?: string | null;
  onWalletClick: () => void;
}) {
  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 6) return 'Доброй ночи';
    if (hour < 12) return 'Доброе утро';
    if (hour < 18) return 'Добрый день';
    return 'Добрый вечер';
  })();

  return (
    <div className="motion-reveal relative z-50 flex w-full items-center justify-between">
      <div className="min-w-0 flex flex-col gap-1 lg:gap-1.5">
        <h1 className="text-[28px] font-medium leading-[1.05] tracking-[-1px] text-ink lg:text-[clamp(30px,2.2vw,44px)] lg:tracking-[clamp(-1px,-0.035vw,-0.5px)]">
          {greeting}, {userName?.trim() || 'гость'}!
        </h1>
        <p className="text-xs tracking-[0.01em] text-muted lg:text-[clamp(13px,0.9vw,18px)]">
          Ваш кабинет · всё под контролем
        </p>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onWalletClick}
          aria-label="Пополнить баланс"
          className="glass-panel flex shrink-0 cursor-pointer items-center gap-2 rounded-full px-3 py-2.5 active:scale-[0.96] lg:hidden"
        >
          <Wallet size={18} className="text-mint" />
          <span className="whitespace-nowrap text-[13px] font-bold text-ink">
            {typeof balance === 'number' ? <AnimatedBalance value={balance} /> : balance}
          </span>
        </button>

        <NotificationMenu className="hidden lg:block" />
        <TicketNotificationBell />
      </div>
    </div>
  );
}
