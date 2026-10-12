import { useAuthStore } from '@/store/auth';

export interface LandingAuth {
  status: 'loading' | 'guest' | 'user';
  name: string;
}

/** Signed-in state for the public landing: the navbar and every CTA change with it. */
export function useLandingAuth(): LandingAuth {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);
  const user = useAuthStore((state) => state.user);

  if (isAuthenticated) {
    const name =
      user?.first_name?.trim() || user?.username?.trim() || user?.email?.split('@')[0] || '';
    return { status: 'user', name };
  }
  if (isLoading) return { status: 'loading', name: '' };
  return { status: 'guest', name: '' };
}

export interface LandingTarget {
  to: string;
  state?: { from: string };
}

/** Where "buy" buttons go: straight to tariffs when signed in, else register and then tariffs. */
export function buyTarget(auth: LandingAuth): LandingTarget {
  return auth.status === 'user'
    ? { to: '/tariffs' }
    : { to: '/register', state: { from: '/tariffs' } };
}

export function cabinetTarget(auth: LandingAuth): LandingTarget {
  return auth.status === 'user' ? { to: '/dashboard' } : { to: '/login' };
}
