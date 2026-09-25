import { Wallet } from '@/invoxystart/components/ui/RuneIcon';
import { useNavigate } from 'react-router';
import { m } from 'framer-motion';
import { NotificationMenu } from '@/invoxystart/components/layout/NotificationMenu';
import { useAuth } from '@/invoxystart/auth';

/** Заголовок страницы входит пружиной, подзаголовок догоняет — лёгкая
 * хореография вместо статичного появления вместе с роутом. */
const headerEntrance = (delay: number) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { type: 'spring' as const, stiffness: 240, damping: 24, delay },
});

export function PageHeader({
  title,
  subtitle,
  notifications = false,
  action,
}: {
  title: string;
  subtitle: string;
  notifications?: boolean;
  action?: React.ReactNode;
}) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const balance = user?.balance_rubles ?? 0;
  return (
    <header className="relative z-40 flex items-center justify-between gap-4 px-1 lg:px-0">
      <div className="min-w-0">
        <m.h1
          {...headerEntrance(0)}
          className="text-[30px] font-medium tracking-[-0.04em] lg:text-[36px]"
        >
          {title}
        </m.h1>
        <m.p {...headerEntrance(0.06)} className="mt-1 text-sm text-muted">
          {subtitle}
        </m.p>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        {action}
        {notifications ? (
          <NotificationMenu className="shrink-0" />
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
      </div>
    </header>
  );
}
