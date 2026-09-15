import { NavLink } from 'react-router';
import {
  House,
  Layers,
  Users,
  UserRound,
  Info,
  Bell,
  ShieldCheck,
} from '@/invoxystart/components/ui/RuneIcon';
import { BrandLogo } from './BrandLogo';
import { useAuth } from '@/invoxystart/auth';

export function Sidebar({ onTopUp, onHelp }: { onTopUp: () => void; onHelp: () => void }) {
  const { user, isAdmin } = useAuth();
  const balance = user?.balance_rubles ?? 0;
  const navItems = [
    { to: '/dashboard', label: 'Кабинет', icon: House },
    { to: '/tariffs', label: 'Тарифы', icon: Layers },
    { to: '/referrals', label: 'Рефералы', icon: Users },
    { to: '/info', label: 'Информация', icon: Info },
    { to: '/news', label: 'Новости', icon: Bell },
    ...(isAdmin ? [{ to: '/admin', label: 'Админка', icon: ShieldCheck }] : []),
  ];

  return (
    <aside className="glass-panel sticky top-4 hidden h-[calc(100vh-32px)] w-full shrink-0 flex-col gap-4 rounded-[24px] p-6 lg:top-0 lg:h-screen lg:gap-[clamp(16px,1.2vw,24px)] lg:rounded-l-none lg:rounded-r-[clamp(24px,1.2vw,28px)] lg:border-l-0 lg:p-[clamp(20px,1.2vw,24px)] lg:flex">
      <div className="flex items-center gap-2.5 lg:gap-[clamp(10px,0.65vw,13px)]">
        <BrandLogo
          iconClassName="h-[38px] w-[38px] rounded-xl object-cover lg:h-[clamp(38px,2.4vw,48px)] lg:w-[clamp(38px,2.4vw,48px)] lg:rounded-[clamp(12px,0.8vw,16px)]"
          textClassName="text-lg font-bold text-ink lg:text-[clamp(18px,1.2vw,24px)]"
        />
      </div>

      <nav className="flex flex-col gap-2 lg:gap-[clamp(8px,0.55vw,11px)]">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/dashboard'}
            className={({ isActive }) =>
              `relative flex h-11 items-center gap-3 rounded-xl px-3.5 text-sm transition-colors lg:h-[clamp(44px,2.9vw,58px)] lg:gap-[clamp(12px,0.8vw,16px)] lg:rounded-[clamp(12px,0.8vw,16px)] lg:px-[clamp(14px,0.9vw,18px)] lg:text-[clamp(14px,0.8vw,16px)] ${
                isActive ? 'text-bg font-bold' : 'text-muted font-normal hover:text-ink'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <div className="absolute inset-0 rounded-xl bg-ink lg:rounded-[clamp(12px,0.8vw,16px)]" />
                )}
                <item.icon
                  size={18}
                  variant={isActive && item.to !== '/dashboard' ? 'fill' : 'normal'}
                  className={`relative z-10 ${isActive ? 'text-bg' : ''}`}
                />
                <span className="relative z-10">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="flex-1" />

      <button
        type="button"
        aria-label="Открыть поддержку"
        onClick={onHelp}
        className="help-button glass-control group flex flex-col gap-2 rounded-2xl p-3.5 text-left lg:gap-[clamp(8px,0.5vw,10px)] lg:rounded-[clamp(16px,1vw,20px)] lg:p-[clamp(14px,1.2vw,24px)]"
      >
        <Info
          size={18}
          className="text-mint transition-transform duration-500 group-hover:rotate-6 group-hover:scale-110"
        />
        <p className="text-xs font-bold text-ink lg:text-[clamp(12px,0.8vw,16px)]">Нужна помощь?</p>
        <p className="text-[11px] text-muted lg:text-[clamp(11px,0.7vw,14px)]">Мы на связи 24/7</p>
      </button>

      <div className="glass-control flex flex-col gap-2 rounded-2xl p-4 lg:gap-[clamp(8px,0.5vw,10px)] lg:rounded-[clamp(16px,1vw,20px)] lg:p-[clamp(16px,1.2vw,24px)]">
        <p className="text-[11px] font-bold tracking-[0.6px] text-muted lg:text-[clamp(11px,0.7vw,14px)]">
          БАЛАНС
        </p>
        <p className="text-[25px] font-bold text-ink lg:text-[clamp(25px,1.6vw,32px)]">
          ₽ {balance.toLocaleString('ru-RU')}
        </p>
        <button
          onClick={onTopUp}
          className="flex h-[34px] cursor-pointer items-center justify-center rounded-[10px] border border-mint text-[11px] font-bold text-mint transition-colors hover:bg-mint/10 active:scale-[0.97] lg:h-[clamp(34px,2.3vw,46px)] lg:rounded-[clamp(10px,0.65vw,13px)] lg:text-[clamp(11px,0.7vw,14px)]"
        >
          Пополнить
        </button>
      </div>

      <NavLink
        to="/profile"
        className={({ isActive }) =>
          `relative flex h-11 items-center gap-3 rounded-xl px-3.5 text-sm transition-colors lg:h-[clamp(44px,2.9vw,58px)] lg:gap-[clamp(12px,0.8vw,16px)] lg:rounded-[clamp(12px,0.8vw,16px)] lg:px-[clamp(14px,0.9vw,18px)] lg:text-[clamp(14px,0.8vw,16px)] ${
            isActive ? 'text-bg font-bold' : 'text-muted font-normal hover:text-ink'
          }`
        }
      >
        {({ isActive }) => (
          <>
            {isActive && (
              <div className="absolute inset-0 rounded-xl bg-ink lg:rounded-[clamp(12px,0.8vw,16px)]" />
            )}
            <UserRound
              size={18}
              variant="normal"
              className={`relative z-10 ${isActive ? 'text-bg' : ''}`}
            />
            <span className="relative z-10">Профиль</span>
          </>
        )}
      </NavLink>
    </aside>
  );
}
