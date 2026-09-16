import { useState, useEffect, useMemo, useCallback, useRef, type ReactNode } from 'react';
import { Link, useNavigate, useLocation } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../store/auth';
import { useShallow } from 'zustand/shallow';
import { authApi } from '../api/auth';
import { isValidEmail } from '../utils/validation';
import {
  brandingApi,
  getCachedBranding,
  setCachedBranding,
  preloadLogo,
  isLogoPreloaded,
  type BrandingInfo,
  type EmailAuthEnabled,
} from '../api/branding';
import { getAndClearReturnUrl, tokenStorage } from '../utils/token';
import { getApiErrorMessage } from '../utils/api-error';
import { isInTelegramWebApp, getTelegramInitData, useTelegramSDK } from '../hooks/useTelegramSDK';
import { closeMiniApp } from '@telegram-apps/sdk-react';
import LanguageSwitcher from '../components/LanguageSwitcher';
import TelegramLoginButton from '../components/TelegramLoginButton';
import OAuthProviderIcon from '../components/OAuthProviderIcon';
import { saveOAuthState } from '../utils/oauth';
import { getPendingReferralCode } from '../utils/referral';
import {
  ArrowRightIcon,
  EmailIcon,
  LockIcon,
  RefreshIcon,
  UserIcon,
  UsersIcon,
} from '@/components/icons';
import { CheckEmailCard } from '@/components/auth/CheckEmailCard';
import LegalFooter from '../components/LegalFooter';
import LegalConsent from '../components/LegalConsent';
import LegalConsentGate from '../components/LegalConsentGate';
import { useLegalConsentGate } from '../hooks/useLegalConsentGate';
import { infoApi } from '../api/info';
import { BackgroundShapes } from '@/invoxystart/components/layout/BackgroundShapes';
import type { LegalConsentConfig } from '../types';
import { safeLocal, safeSession } from '../utils/safeStorage';

const DEFAULT_LOGO_URL = '/invoxy_logo.jpg?v=2c0c067a';

export default function Login() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const isRegistrationRoute = location.pathname === '/register';
  const {
    isAuthenticated,
    isLoading: isAuthInitializing,
    loginWithTelegram,
    loginWithEmail,
    registerWithEmail,
  } = useAuthStore(
    useShallow((state) => ({
      isAuthenticated: state.isAuthenticated,
      isLoading: state.isLoading,
      loginWithTelegram: state.loginWithTelegram,
      loginWithEmail: state.loginWithEmail,
      registerWithEmail: state.registerWithEmail,
    })),
  );

  // Get referral code from localStorage (captured from ?ref= param at module level in auth store)
  const referralCode = getPendingReferralCode() || '';

  const [authMode, setAuthMode] = useState<'login' | 'register'>(() =>
    referralCode || location.pathname === '/register' ? 'register' : 'login',
  );
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [error, setError] = useState('');
  const [isTelegramWebApp, setIsTelegramWebApp] = useState(() => isInTelegramWebApp());
  const [isLoading, setIsLoading] = useState(
    () => !isRegistrationRoute && isInTelegramWebApp() && Boolean(getTelegramInitData()),
  );
  const telegramAuthAttemptedRef = useRef(false);
  const [logoLoaded, setLogoLoaded] = useState(() => isLogoPreloaded());
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordSent, setForgotPasswordSent] = useState(false);
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [forgotPasswordError, setForgotPasswordError] = useState('');

  // Гейт согласия с офертой/политикой для НОВОГО пользователя. Конфиг публичный:
  // нужен до авторизации, чтобы нарисовать чекбоксы ещё на экране входа.
  const { data: legalConsent } = useQuery<LegalConsentConfig>({
    queryKey: ['legal-consent-config', i18n.language],
    queryFn: () => infoApi.getLegalConsentConfig(i18n.language),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
  // Telegram-вход происходит сам собой, поэтому чекбоксы показываем только когда
  // бэк ответил 428: пользователь новый и без согласия аккаунт не создастся.
  // Гейт помнит, какой именно вход повторить после простановки галочек.
  const consent = useLegalConsentGate(legalConsent);

  // Telegram safe area insets
  const { safeAreaInset, contentSafeAreaInset } = useTelegramSDK();
  const safeTop = Math.max(safeAreaInset.top, contentSafeAreaInset.top);
  const safeBottom = Math.max(safeAreaInset.bottom, contentSafeAreaInset.bottom);

  // Получаем URL для возврата после авторизации
  const getReturnUrl = useCallback(() => {
    // Сначала проверяем state от React Router
    const stateFrom = (location.state as { from?: string })?.from;
    if (stateFrom && stateFrom !== '/login') {
      return stateFrom;
    }
    // Затем проверяем сохранённый URL в sessionStorage (от safeRedirectToLogin)
    const savedUrl = getAndClearReturnUrl();
    if (savedUrl && savedUrl !== '/login') {
      return savedUrl;
    }
    // По умолчанию в защищённый кабинет
    const rootSuffix = location.pathname === '/' ? `${location.search}${location.hash}` : '';
    return rootSuffix ? `/dashboard${rootSuffix}` : '/dashboard';
  }, [location.hash, location.pathname, location.search, location.state]);

  // Fetch branding with unified cache
  const cachedBranding = useMemo(() => getCachedBranding(), []);

  const { data: branding } = useQuery<BrandingInfo>({
    queryKey: ['branding'],
    queryFn: async () => {
      const data = await brandingApi.getBranding();
      setCachedBranding(data);
      await preloadLogo(data);
      return data;
    },
    staleTime: 60000,
    initialData: cachedBranding ?? undefined,
    initialDataUpdatedAt: 0,
  });

  // Check if email auth is enabled
  const { data: emailAuthConfig } = useQuery<EmailAuthEnabled>({
    queryKey: ['email-auth-enabled'],
    queryFn: brandingApi.getEmailAuthEnabled,
    staleTime: 60000,
  });
  const isEmailAuthEnabled = emailAuthConfig?.enabled ?? true;

  const { data: footerEnabled } = useQuery({
    queryKey: ['footer-enabled'],
    queryFn: brandingApi.getFooterEnabled,
    staleTime: 60000,
  });

  // Fetch enabled OAuth providers
  const { data: oauthData } = useQuery({
    queryKey: ['oauth-providers'],
    queryFn: authApi.getOAuthProviders,
    staleTime: 60000,
  });
  const oauthProviders = Array.isArray(oauthData?.providers) ? oauthData.providers : [];

  const [oauthLoading, setOauthLoading] = useState<string | null>(null);

  const handleOAuthLogin = async (provider: string) => {
    setError('');
    setOauthLoading(provider);
    try {
      const { authorize_url, state } = await authApi.getOAuthAuthorizeUrl(provider);

      // Validate redirect URL — only allow HTTPS to prevent open redirect
      let parsed: URL;
      try {
        parsed = new URL(authorize_url);
      } catch {
        throw new Error('Invalid OAuth redirect URL');
      }
      if (parsed.protocol !== 'https:') {
        throw new Error('Invalid OAuth redirect URL');
      }

      if (!saveOAuthState(state, provider)) {
        // Уйти к провайдеру без сохранённого state — значит гарантированно не
        // вернуться в логин: та же ошибка, что и раньше, но без потери страницы.
        throw new Error('OAuth state is not persistable');
      }
      window.location.href = authorize_url;
    } catch {
      setError(t('auth.oauthError', 'Authorization was denied or failed'));
      setOauthLoading(null);
    }
  };

  const appName =
    branding?.name ||
    (import.meta.env.VITE_APP_NAME && import.meta.env.VITE_APP_NAME !== 'Cabinet'
      ? import.meta.env.VITE_APP_NAME
      : 'Invoxy VPN');
  const appLogo = branding?.logo_letter || import.meta.env.VITE_APP_LOGO || 'V';
  const logoUrl =
    (branding?.has_custom_logo ? brandingApi.getLogoUrl?.(branding) : null) || DEFAULT_LOGO_URL;

  useEffect(() => {
    if (isAuthenticated) {
      navigate(getReturnUrl(), { replace: true });
    }
  }, [isAuthenticated, navigate, getReturnUrl]);

  // Try Telegram WebApp authentication on mount (with auto-retry on 401)
  // Wait for auth store initialization to complete to avoid race conditions
  // with stale tokens triggering interceptor refresh/redirect loops
  useEffect(() => {
    // Don't attempt Telegram auth until store initialization is done
    if (isAuthInitializing || isRegistrationRoute || telegramAuthAttemptedRef.current) return;

    const tryTelegramAuth = async () => {
      const initData = getTelegramInitData();
      if (!isInTelegramWebApp() || !initData) return;
      telegramAuthAttemptedRef.current = true;

      setIsTelegramWebApp(true);
      setIsLoading(true);

      const MAX_RETRIES = 1;
      for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
          await loginWithTelegram(initData);
          navigate(getReturnUrl(), { replace: true });
          return;
        } catch (err) {
          const error = err as { response?: { status?: number } };
          const status = error.response?.status;
          const detail = getApiErrorMessage(err, '');
          if (import.meta.env.DEV)
            console.warn(`Telegram auth attempt ${attempt + 1} failed:`, status, detail);

          // Не ошибка входа, а недостающее согласие: показываем чекбоксы.
          const needsConsent = consent.capture(err, async (accepted) => {
            await loginWithTelegram(initData, accepted);
            navigate(getReturnUrl(), { replace: true });
          });
          if (needsConsent) {
            setIsLoading(false);
            return;
          }

          if (status === 401 && attempt < MAX_RETRIES) {
            await new Promise((r) => setTimeout(r, 1500));
            continue;
          }

          // Show backend error detail if available, otherwise generic message
          setError(detail || t('auth.telegramRequired'));
          break;
        }
      }

      setIsLoading(false);
    };

    tryTelegramAuth();
  }, [
    isAuthInitializing,
    isRegistrationRoute,
    loginWithTelegram,
    navigate,
    t,
    getReturnUrl,
    consent.capture,
  ]);

  const handleRetryTelegramAuth = () => {
    // Clear ALL cached auth state to prevent stale token/initData loops
    tokenStorage.clearTokens();
    safeSession.removeItem('tapps/launchParams');
    safeSession.removeItem('telegram_init_data');
    safeLocal.removeItem('cabinet-auth');
    safeLocal.removeItem('tg_user_id');

    try {
      // Close miniapp — Telegram will provide fresh initData on reopen
      closeMiniApp();
    } catch {
      // If closeMiniApp fails, force a clean page reload
      window.location.reload();
    }
  };

  const handleEmailSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setError('');

    // Валидация email
    if (!email.trim() || !isValidEmail(email.trim())) {
      setError(t('auth.invalidEmail', 'Please enter a valid email address'));
      return;
    }

    if (authMode === 'register') {
      // Валидация для регистрации
      if (password !== confirmPassword) {
        setError(t('auth.passwordMismatch', 'Passwords do not match'));
        return;
      }
      if (password.length < 8) {
        setError(t('auth.passwordTooShort', 'Password must be at least 8 characters'));
        return;
      }
    }

    setIsLoading(true);

    try {
      if (authMode === 'login') {
        await loginWithEmail(email, password);
        navigate(getReturnUrl(), { replace: true });
      } else {
        const result = await registerWithEmail(
          email,
          password,
          firstName || undefined,
          referralCode || undefined,
          consent.acceptedKeys,
        );
        // Show "check your email" screen
        setRegisteredEmail(result.email);
      }
    } catch (err: unknown) {
      const error = err as { response?: { status?: number } };
      const status = error.response?.status;
      const detail = getApiErrorMessage(err, '');

      // Конфиг чекбоксов мог протухнуть (админ включил гейт между загрузкой страницы
      // и отправкой формы) — показываем недостающие галочки вместо сырой ошибки.
      const needsConsent = consent.capture(err, async (accepted) => {
        const retried = await registerWithEmail(
          email,
          password,
          firstName || undefined,
          referralCode || undefined,
          accepted,
        );
        setRegisteredEmail(retried.email);
      });
      if (needsConsent) {
        setIsLoading(false);
        return;
      }

      if (status === 400 && detail.includes('already registered')) {
        setError(t('auth.emailAlreadyRegistered', 'This email is already registered'));
      } else if (status === 401 || status === 403) {
        if (detail.includes('verify your email')) {
          setError(t('auth.emailNotVerified', 'Please verify your email first'));
        } else {
          setError(t('auth.invalidCredentials', 'Invalid email or password'));
        }
      } else if (status === 429) {
        setError(t('auth.tooManyAttempts', 'Too many attempts. Please try again later'));
      } else {
        setError(detail || t('common.error'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setForgotPasswordError('');

    if (!forgotPasswordEmail.trim() || !isValidEmail(forgotPasswordEmail.trim())) {
      setForgotPasswordError(t('auth.invalidEmail', 'Please enter a valid email address'));
      return;
    }

    setForgotPasswordLoading(true);
    try {
      await authApi.forgotPassword(forgotPasswordEmail.trim());
      setForgotPasswordSent(true);
    } catch (err: unknown) {
      setForgotPasswordError(getApiErrorMessage(err, t('common.error')));
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  const closeForgotPasswordModal = () => {
    setShowForgotPassword(false);
    setForgotPasswordEmail('');
    setForgotPasswordSent(false);
    setForgotPasswordError('');
  };

  const authTitle = showForgotPassword
    ? t('auth.resetPassword', 'Reset password')
    : authMode === 'register'
      ? t('auth.register', 'Register')
      : t('auth.loginTitle', 'Login to Cabinet');
  const authSubtitle = showForgotPassword
    ? t('auth.forgotPasswordHint', 'Enter your email to receive a reset link')
    : authMode === 'register'
      ? t(
          'auth.verificationEmailNotice',
          'After registration, a verification email will be sent to your address',
        )
      : t('auth.loginSubtitle', 'Sign in with Telegram or use your email');

  const hasTelegramLaunchData =
    (isTelegramWebApp || isInTelegramWebApp()) && Boolean(getTelegramInitData());

  const isAutoAuthenticating =
    !error &&
    !consent.pending &&
    !isRegistrationRoute &&
    ((hasTelegramLaunchData &&
      (isAuthInitializing || isLoading || !telegramAuthAttemptedRef.current)) ||
      (isAuthInitializing && Boolean(tokenStorage.getRefreshToken())));

  if (isAutoAuthenticating) {
    return (
      <main
        className="auth-page ix-login relative isolate flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden px-4 text-ink"
        style={{
          paddingTop:
            safeTop > 0 ? `${safeTop + 16}px` : 'calc(1rem + env(safe-area-inset-top, 0px))',
          paddingBottom:
            safeBottom > 0
              ? `${safeBottom + 16}px`
              : 'calc(1rem + env(safe-area-inset-bottom, 0px))',
        }}
      >
        <BackgroundShapes />

        <div className="relative z-10 flex flex-col items-center text-center animate-fade-in">
          <div className="relative mb-6 flex items-center justify-center">
            <div className="absolute -inset-6 rounded-full bg-mint/20 blur-3xl animate-pulse pointer-events-none" />
            <div className="relative flex h-24 w-24 items-center justify-center rounded-[28px] border border-white/15 bg-white/[0.06] shadow-[0_20px_50px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.2)] backdrop-blur-2xl">
              <img
                src={logoUrl}
                alt={appName}
                className="h-14 w-14 rounded-2xl object-cover shadow-md"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                  const fallback = (e.target as HTMLElement).parentElement?.querySelector(
                    '.brand-letter-fallback',
                  );
                  if (fallback) (fallback as HTMLElement).style.display = 'block';
                }}
              />
              <span className="brand-letter-fallback hidden text-2xl font-bold text-mint">
                {appLogo}
              </span>
            </div>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-[28px]">{appName}</h1>
          <p className="mt-2 text-sm text-muted">{t('auth.authenticating', 'Авторизация...')}</p>

          <div className="relative mt-7 h-1 w-36 overflow-hidden rounded-full bg-white/10">
            <div className="absolute inset-y-0 w-2/5 rounded-full bg-gradient-to-r from-transparent via-mint to-transparent animate-indeterminate-slide" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main
      className="auth-page ix-login relative isolate flex min-h-[100dvh] items-center justify-center overflow-hidden px-4 py-10 text-ink sm:px-6 lg:px-8"
      style={{
        paddingTop:
          safeTop > 0 ? `${safeTop + 16}px` : 'calc(1rem + env(safe-area-inset-top, 0px))',
        paddingBottom:
          safeBottom > 0 ? `${safeBottom + 16}px` : 'calc(1rem + env(safe-area-inset-bottom, 0px))',
      }}
    >
      <div
        className="fixed right-3 z-50"
        style={{
          top: safeTop > 0 ? `${safeTop + 12}px` : 'calc(12px + env(safe-area-inset-top, 0px))',
        }}
      >
        <LanguageSwitcher />
      </div>

      <div className="relative z-10 w-full max-w-[440px] space-y-5">
        <div className="glass-panel motion-card relative w-full rounded-[36px] p-6 sm:p-8">
          <Link
            to="/"
            aria-label={appName || 'Logo'}
            className="inline-flex items-center gap-3 text-lg font-bold text-ink"
          >
            <span className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/5">
              <span
                className={`absolute text-sm font-bold text-mint transition-opacity duration-200 ${branding?.has_custom_logo && logoLoaded ? 'opacity-0' : 'opacity-100'}`}
              >
                {appLogo}
              </span>
              {branding?.has_custom_logo && logoUrl && (
                <img
                  src={logoUrl}
                  alt={appName || 'Logo'}
                  className={`absolute h-full w-full object-contain transition-opacity duration-200 ${logoLoaded ? 'opacity-100' : 'opacity-0'}`}
                  onLoad={() => setLogoLoaded(true)}
                />
              )}
            </span>
            {appName && <span>{appName}</span>}
          </Link>

          {referralCode && isEmailAuthEnabled && (
            <div className="mt-4 rounded-2xl border border-accent-500/30 bg-accent-500/10 p-2.5">
              <div className="flex items-center justify-center gap-2 text-accent-400">
                <UsersIcon className="h-4 w-4 flex-shrink-0" />
                <span className="text-xs font-medium">{t('auth.referralInvite')}</span>
              </div>
            </div>
          )}

          <div className="mt-8">
            <h1 className="text-[34px] font-medium tracking-[-.045em] text-ink">{authTitle}</h1>
            <p className="mt-2 text-sm text-muted">{authSubtitle}</p>
          </div>

          {consent.pending ? (
            <LegalConsentGate gate={consent} framed={false} className="mt-7" />
          ) : registeredEmail ? (
            <div className="ix-auth-check-email mt-7">
              <CheckEmailCard
                email={registeredEmail}
                onBackToLogin={() => {
                  setRegisteredEmail(null);
                  setAuthMode('login');
                }}
                onChangeEmail={() => {
                  // Адрес остаётся в поле: чаще всего его не меняют, а правят опечатку.
                  setEmail(registeredEmail);
                  setRegisteredEmail(null);
                  setAuthMode('register');
                }}
              />
            </div>
          ) : (
            <>
              {error && (
                <div
                  role="alert"
                  className="mt-7 rounded-2xl border border-error-500/30 bg-error-500/10 px-4 py-3 text-sm text-error-400"
                >
                  {error}
                </div>
              )}

              {isEmailAuthEnabled &&
                (showForgotPassword ? (
                  forgotPasswordSent ? (
                    <div className="mt-7 space-y-4 text-center">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-mint/10">
                        <EmailIcon className="h-6 w-6 text-mint" />
                      </div>
                      <p className="text-sm font-medium text-ink">
                        {t('auth.checkEmail', 'Check your email')}
                      </p>
                      <p className="text-xs text-muted">
                        {t(
                          'auth.passwordResetSent',
                          'If an account exists with this email, we sent password reset instructions.',
                        )}
                      </p>
                      <p className="rounded-2xl border border-white/10 bg-white/5 p-3 text-left text-xs leading-relaxed text-muted">
                        {t('auth.spamHint')}
                      </p>
                      <button
                        type="button"
                        onClick={closeForgotPasswordModal}
                        className="w-full text-center text-sm text-muted transition-colors hover:text-ink"
                      >
                        {t('common.back', 'Back')}
                      </button>
                    </div>
                  ) : (
                    <form
                      aria-label={authTitle}
                      onSubmit={handleForgotPassword}
                      className="mt-7 space-y-3"
                    >
                      <AuthInput
                        icon={<EmailIcon className="h-[17px] w-[17px]" />}
                        id="forgotEmail"
                        label={t('auth.email')}
                        name="forgotEmail"
                        type="email"
                        autoComplete="email"
                        placeholder="you@example.com"
                        value={forgotPasswordEmail}
                        onChange={setForgotPasswordEmail}
                        autoFocus
                      />
                      {forgotPasswordError && (
                        <p role="alert" className="text-sm text-error-400">
                          {forgotPasswordError}
                        </p>
                      )}
                      <button
                        type="submit"
                        disabled={forgotPasswordLoading}
                        className="mt-2 flex h-[52px] w-full items-center justify-center gap-2 rounded-full bg-mint text-sm font-bold text-bg transition-transform active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {forgotPasswordLoading ? (
                          <span className="flex items-center justify-center gap-2">
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/20 border-t-black" />
                            {t('common.loading')}
                          </span>
                        ) : (
                          t('auth.sendResetLink', 'Send reset link')
                        )}
                        <ArrowRightIcon className="h-[17px] w-[17px]" />
                      </button>
                      <button
                        type="button"
                        onClick={closeForgotPasswordModal}
                        className="mt-1 w-full text-center text-sm text-muted transition-colors hover:text-ink"
                      >
                        {t('common.back', 'Back')}
                      </button>
                    </form>
                  )
                ) : (
                  <>
                    <form
                      aria-label={authTitle}
                      className="mt-7 space-y-3"
                      onSubmit={handleEmailSubmit}
                    >
                      {authMode === 'register' && (
                        <AuthInput
                          icon={<UserIcon className="h-[17px] w-[17px]" />}
                          id="firstName"
                          label={t('auth.firstName', 'First Name')}
                          name="firstName"
                          autoComplete="given-name"
                          placeholder={t('auth.firstNamePlaceholder', 'Your name (optional)')}
                          value={firstName}
                          onChange={setFirstName}
                        />
                      )}

                      <AuthInput
                        icon={<EmailIcon className="h-[17px] w-[17px]" />}
                        id="email"
                        label={t('auth.email')}
                        name="email"
                        type="email"
                        autoComplete="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={setEmail}
                        required
                      />

                      <AuthInput
                        icon={<LockIcon className="h-[17px] w-[17px]" />}
                        id="password"
                        label={t('auth.password')}
                        name="password"
                        type="password"
                        autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}
                        placeholder="••••••••"
                        value={password}
                        onChange={setPassword}
                        required
                      />
                      {authMode === 'register' && password.length > 0 && password.length < 8 && (
                        <p className="mt-1.5 text-xs text-error-400">
                          {t('auth.passwordTooShort', 'Password must be at least 8 characters')}
                        </p>
                      )}

                      {authMode === 'register' && (
                        <AuthInput
                          icon={<LockIcon className="h-[17px] w-[17px]" />}
                          id="confirmPassword"
                          label={t('auth.confirmPassword', 'Confirm Password')}
                          name="confirmPassword"
                          type="password"
                          autoComplete="new-password"
                          placeholder="••••••••"
                          value={confirmPassword}
                          onChange={setConfirmPassword}
                          required
                        />
                      )}

                      {authMode === 'register' && (
                        <LegalConsent
                          documents={consent.documents}
                          accepted={consent.accepted}
                          onChange={consent.toggle}
                          disabled={isLoading}
                          className="pt-1"
                        />
                      )}

                      <button
                        type="submit"
                        disabled={isLoading || (authMode === 'register' && !consent.allAccepted)}
                        className="mt-2 flex h-[52px] w-full items-center justify-center gap-2 rounded-full bg-mint text-sm font-bold text-bg transition-transform active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isLoading ? (
                          <span className="flex items-center justify-center gap-2">
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/20 border-t-black" />
                            {t('common.loading')}
                          </span>
                        ) : authMode === 'login' ? (
                          t('auth.login')
                        ) : (
                          t('auth.register', 'Register')
                        )}
                        <ArrowRightIcon className="h-[17px] w-[17px]" />
                      </button>
                    </form>

                    {authMode === 'login' && (
                      <button
                        type="button"
                        onClick={() => setShowForgotPassword(true)}
                        className="mt-4 w-full text-center text-sm text-muted transition-colors hover:text-ink"
                      >
                        {t('auth.forgotPassword', 'Forgot password?')}
                      </button>
                    )}

                    <p className="mt-7 text-center text-sm text-muted">
                      {authMode === 'register'
                        ? t('auth.hasAccount', 'Already have an account?')
                        : t('auth.noAccount', "Don't have an account?")}{' '}
                      <Link
                        className="font-semibold text-mint"
                        to={authMode === 'register' ? '/login' : '/register'}
                        onClick={() => setAuthMode(authMode === 'register' ? 'login' : 'register')}
                      >
                        {authMode === 'register' ? t('auth.login') : t('auth.register', 'Register')}
                      </Link>
                    </p>
                  </>
                ))}

              <div className="mt-8 border-t border-white/10 pt-6">
                <div className="space-y-3">
                  {isTelegramWebApp && (isAuthInitializing || isLoading) ? (
                    <div className="py-6 text-center">
                      <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-accent-500 border-t-transparent" />
                      <p className="text-sm text-muted">{t('auth.authenticating')}</p>
                    </div>
                  ) : isTelegramWebApp && error ? (
                    <div className="space-y-3 text-center">
                      <button
                        onClick={handleRetryTelegramAuth}
                        className="btn-primary mx-auto flex items-center gap-2 px-5 py-2.5"
                      >
                        <RefreshIcon className="h-4 w-4" />
                        {t('auth.tryAgain')}
                      </button>
                      <p className="text-xs text-muted">
                        {t(
                          'auth.telegramReopenHint',
                          'If the problem persists, close and reopen the app',
                        )}
                      </p>
                    </div>
                  ) : (
                    <TelegramLoginButton referralCode={referralCode || undefined} />
                  )}
                </div>

                {oauthProviders.length > 0 && (
                  <>
                    <div className="my-5 flex items-center gap-3">
                      <div className="h-px flex-1 bg-white/10" />
                      <span className="text-xs text-muted">{t('auth.or', 'or')}</span>
                      <div className="h-px flex-1 bg-white/10" />
                    </div>
                    <div className="flex items-stretch gap-2">
                      {oauthProviders.map((provider) => (
                        <button
                          key={provider.name}
                          type="button"
                          onClick={() => handleOAuthLogin(provider.name)}
                          disabled={oauthLoading !== null}
                          className="glass-control flex flex-1 flex-col items-center justify-center gap-1.5 rounded-2xl py-2.5 transition-colors hover:border-white/20 disabled:opacity-50"
                          title={provider.display_name}
                        >
                          {oauthLoading === provider.name ? (
                            <span className="h-5 w-5 animate-spin rounded-full border-2 border-dark-400 border-t-white" />
                          ) : (
                            <OAuthProviderIcon provider={provider.name} className="h-5 w-5" />
                          )}
                          <span className="text-[10px] leading-none text-muted">
                            {provider.display_name}
                          </span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </div>
        {footerEnabled && <LegalFooter className="pt-1" />}
      </div>
    </main>
  );
}

function AuthInput({
  icon,
  id,
  label,
  name,
  type = 'text',
  autoComplete,
  placeholder,
  value,
  onChange,
  autoFocus = false,
  required = false,
}: {
  icon: ReactNode;
  id: string;
  label: string;
  name: string;
  type?: string;
  autoComplete: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  autoFocus?: boolean;
  required?: boolean;
}) {
  return (
    <label
      htmlFor={id}
      className="glass-control flex h-14 items-center gap-3 rounded-2xl px-4 focus-within:border-mint/55"
    >
      <span className="text-mint">{icon}</span>
      <span className="sr-only">{label}</span>
      <input
        id={id}
        name={name}
        type={type}
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        required={required}
        placeholder={placeholder ?? label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-full min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-muted"
      />
    </label>
  );
}
