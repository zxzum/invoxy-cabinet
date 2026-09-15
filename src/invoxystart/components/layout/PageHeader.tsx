import { Wallet } from '@/invoxystart/components/ui/RuneIcon';
import { useNavigate } from 'react-router';
import { NotificationMenu } from '@/invoxystart/components/layout/NotificationMenu';
import { useAuth } from '@/invoxystart/auth';

export function PageHeader({
  title,
  subtitle,
  mobileNotifications = false,
  notifications = false,
}: {
  title: string;
  subtitle: string;
  mobileNotifications?: boolean;
  notifications?: boolean;
}) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const balance = user?.balance_rubles ?? 0;
  return (
    <header className="relative z-40 flex items-center justify-between gap-4 px-1 lg:px-0">
      <div className="min-w-0">
        <h1 className="text-[30px] font-medium tracking-[-0.04em] lg:text-[36px]">{title}</h1>
        <p className="mt-1 text-sm text-muted">{subtitle}</p>
      </div>
      {mobileNotifications || notifications ? (
        <NotificationMenu className={`shrink-0 ${notifications ? '' : 'lg:hidden'}`} />
      ) : (
        <button
          type="button"
          aria-label={`Пополнить баланс, текущий баланс ${balance.toLocaleString('ru-RU')} ₽`}
          onClick={() => navigate('/profile#top-up')}
          className="glass-panel flex h-auto shrink-0 whitespace-nowrap items-center gap-2 rounded-full px-3 py-2.5 text-[13px] font-bold active:scale-[.96] lg:hidden"
        >
          <Wallet size={18} className="text-mint" /> ₽ {balance.toLocaleString('ru-RU')}
        </button>
      )}
    </header>
  );
}
