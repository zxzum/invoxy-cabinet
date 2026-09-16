import { NavLink } from 'react-router';
import { House, Layers, Users, UserRound } from '@/invoxystart/components/ui/RuneIcon';
import { usePlatform } from '@/platform';

const navItems = [
  { to: '/dashboard', label: 'Кабинет', icon: House, end: true, activeWidth: 'w-[117px]' },
  { to: '/tariffs', label: 'Тарифы', icon: Layers, end: false, activeWidth: 'w-[115px]' },
  { to: '/referrals', label: 'Рефералы', icon: Users, end: false, activeWidth: 'w-[124px]' },
  { to: '/profile', label: 'Профиль', icon: UserRound, end: false, activeWidth: 'w-[122px]' },
];

export function MobileNav() {
  const { haptic } = usePlatform();
  return (
    <nav className="glass-panel mobile-nav-safe fixed left-1/2 z-40 flex -translate-x-1/2 items-center gap-1 rounded-[34px] p-1.5 lg:hidden">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          aria-label={item.label}
          onClick={() => haptic.selection()}
        >
          {({ isActive }) => (
            <div
              className={`nav-button relative flex h-14 w-14 items-center overflow-hidden rounded-full border active:scale-[0.94] ${
                isActive
                  ? `${item.activeWidth} justify-start border-transparent bg-ink pl-4 text-bg shadow-[0_6px_18px_rgba(255,255,255,0.16)]`
                  : 'glass-control justify-center text-muted hover:bg-surface-2/55 hover:text-ink'
              }`}
            >
              <item.icon
                size={22}
                aria-hidden="true"
                variant={
                  isActive && item.to !== '/dashboard' && item.to !== '/profile' ? 'fill' : 'normal'
                }
                className={`shrink-0 ${isActive ? 'text-bg' : ''}`}
              />
              <span
                aria-hidden={!isActive}
                className={`absolute left-11 whitespace-nowrap pr-2 text-xs font-bold transition-[opacity,transform] duration-300 ease-out ${
                  isActive ? 'translate-x-0 opacity-100 delay-75' : 'translate-x-2 opacity-0'
                }`}
              >
                {item.label}
              </span>
            </div>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
