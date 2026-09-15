import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react';
import { authApi as legacyAuthApi } from '@/api/auth';
import { useAuthStore, type TelegramWidgetData } from '@/store/auth';
import type { User as LegacyUser } from '@/types';
import type { AuthResponse, RegisterResponse, User } from '@/invoxystart/api/types';

export interface AuthContextValue {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  loginWithEmail: (email: string, password: string) => Promise<User>;
  loginWithTelegram: (initData: string, acceptedLegalDocuments?: string[]) => Promise<User>;
  loginWithTelegramWidget: (
    data: TelegramWidgetData,
    acceptedLegalDocuments?: string[],
  ) => Promise<User>;
  loginWithTelegramOIDC: (idToken: string, acceptedLegalDocuments?: string[]) => Promise<User>;
  registerWithEmail: (
    email: string,
    password: string,
    firstName?: string,
  ) => Promise<RegisterResponse>;
  verifyEmail: (token: string) => Promise<User>;
  refreshUser: () => Promise<User | null>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function asUser(value: unknown): User {
  return value as User;
}

function currentUser(): User {
  const user = useAuthStore.getState().user;
  if (!user) throw new Error('Authenticated user is unavailable');
  return asUser(user);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);
  const isAdmin = useAuthStore((state) => state.isAdmin);
  const loginEmail = useAuthStore((state) => state.loginWithEmail);
  const loginTelegram = useAuthStore((state) => state.loginWithTelegram);
  const loginTelegramWidget = useAuthStore((state) => state.loginWithTelegramWidget);
  const loginTelegramOidc = useAuthStore((state) => state.loginWithTelegramOIDC);
  const registerEmail = useAuthStore((state) => state.registerWithEmail);
  const refresh = useAuthStore((state) => state.refreshUser);
  const logoutStore = useAuthStore((state) => state.logout);

  const loginWithEmail = useCallback(
    async (email: string, password: string) => {
      await loginEmail(email, password);
      return currentUser();
    },
    [loginEmail],
  );
  const loginWithTelegram = useCallback(
    async (initData: string, acceptedLegalDocuments?: string[]) => {
      await loginTelegram(initData, acceptedLegalDocuments);
      return currentUser();
    },
    [loginTelegram],
  );
  const loginWithTelegramWidget = useCallback(
    async (data: TelegramWidgetData, acceptedLegalDocuments?: string[]) => {
      await loginTelegramWidget(data, acceptedLegalDocuments);
      return currentUser();
    },
    [loginTelegramWidget],
  );
  const loginWithTelegramOIDC = useCallback(
    async (idToken: string, acceptedLegalDocuments?: string[]) => {
      await loginTelegramOidc(idToken, acceptedLegalDocuments);
      return currentUser();
    },
    [loginTelegramOidc],
  );
  const registerWithEmail = useCallback(
    async (email: string, password: string, firstName?: string) => {
      return registerEmail(email, password, firstName) as unknown as Promise<RegisterResponse>;
    },
    [registerEmail],
  );
  const verifyEmail = useCallback(async (token: string) => {
    const response = (await legacyAuthApi.verifyEmail(token)) as unknown as AuthResponse;
    useAuthStore.getState().setTokens(response.access_token, response.refresh_token);
    useAuthStore.getState().setUser(response.user as unknown as LegacyUser);
    await useAuthStore.getState().checkAdminStatus();
    return asUser(response.user);
  }, []);
  const refreshUser = useCallback(async () => {
    await refresh();
    return useAuthStore.getState().user ? currentUser() : null;
  }, [refresh]);
  const logout = useCallback(async () => {
    logoutStore();
  }, [logoutStore]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: user ? asUser(user) : null,
      accessToken,
      isAuthenticated,
      isLoading,
      isAdmin,
      loginWithEmail,
      loginWithTelegram,
      loginWithTelegramWidget,
      loginWithTelegramOIDC,
      registerWithEmail,
      verifyEmail,
      refreshUser,
      logout,
    }),
    [
      user,
      accessToken,
      isAuthenticated,
      isLoading,
      isAdmin,
      loginWithEmail,
      loginWithTelegram,
      loginWithTelegramWidget,
      loginWithTelegramOIDC,
      registerWithEmail,
      verifyEmail,
      refreshUser,
      logout,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
