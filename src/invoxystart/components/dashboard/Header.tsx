import { Wallet } from '@/invoxystart/components/ui/RuneIcon';
import { NotificationMenu } from '@/invoxystart/components/layout/NotificationMenu';

export function Header({
  balance,
  userName,
  onWalletClick,
}: {
  balance: string;
  userName?: string | null;
  onWalletClick: () => void;
}) {
  return (
    <div className="motion-reveal flex w-full items-center justify-between">
      <div className="min-w-0 flex flex-col gap-1 lg:gap-1.5">
        <h1 className="text-[28px] font-medium leading-[1.05] tracking-[-1px] text-ink lg:text-[clamp(30px,2.2vw,44px)] lg:tracking-[clamp(-1px,-0.035vw,-0.5px)]">
          Доброе утро, {userName?.trim() || 'гость'}!
        </h1>
        <p className="text-xs tracking-[0.01em] text-muted lg:text-[clamp(13px,0.9vw,18px)]">
          Ваш кабинет · всё под контролем
        </p>
      </div>

      <button
        onClick={onWalletClick}
        aria-label={`Пополнить баланс, текущий баланс ${balance}`}
        className="glass-panel flex shrink-0 cursor-pointer items-center gap-2 rounded-full px-3 py-2.5 active:scale-[0.96] lg:hidden"
      >
        <Wallet size={18} className="text-mint" />
        <span className="whitespace-nowrap text-[13px] font-bold text-ink">{balance}</span>
      </button>

      <NotificationMenu className="hidden lg:block" />
    </div>
  );
}
