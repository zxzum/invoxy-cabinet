import { useState } from 'react';
import { Smartphone, Wallet } from '@/invoxystart/components/ui/RuneIcon';
import { NotificationMenu } from '@/invoxystart/components/layout/NotificationMenu';
import { AnimatedBalance } from '@/invoxystart/components/ui/AnimatedBalance';
import { AppConnectModal } from '@/invoxystart/components/connection/AppConnectModal';

export function Header({
  balance,
  userName,
  onWalletClick,
}: {
  balance: number | string;
  userName?: string | null;
  onWalletClick: () => void;
}) {
  const [appModalOpen, setAppModalOpen] = useState(false);

  return (
    <div className="motion-reveal relative z-50 flex w-full items-center justify-between">
      <div className="min-w-0 flex flex-col gap-1 lg:gap-1.5">
        <h1 className="text-[28px] font-medium leading-[1.05] tracking-[-1px] text-ink lg:text-[clamp(30px,2.2vw,44px)] lg:tracking-[clamp(-1px,-0.035vw,-0.5px)]">
          Доброе утро, {userName?.trim() || 'гость'}!
        </h1>
        <p className="text-xs tracking-[0.01em] text-muted lg:text-[clamp(13px,0.9vw,18px)]">
          Ваш кабинет · всё под контролем
        </p>
      </div>

      <div className="flex items-center gap-2">
        {/* Prominent App Connect Button */}
        <button
          type="button"
          onClick={() => setAppModalOpen(true)}
          className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border border-mint/40 bg-mint/15 px-3 py-1.5 text-xs font-bold text-mint transition-all hover:bg-mint/25 hover:border-mint active:scale-95 shadow-[0_0_12px_rgba(165,232,196,0.18)]"
        >
          <Smartphone size={15} />
          <span className="hidden sm:inline">Приложение Invoxy</span>
          <span className="sm:hidden">Приложение</span>
          <span className="rounded-full bg-mint px-1.5 py-0.5 text-[9px] font-extrabold text-bg uppercase">
            1 клик
          </span>
        </button>

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
      </div>

      <AppConnectModal open={appModalOpen} onClose={() => setAppModalOpen(false)} />
    </div>
  );
}
