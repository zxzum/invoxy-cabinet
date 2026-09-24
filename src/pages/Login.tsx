import { useState, useEffect, useMemo, useCallback, useRef, type ReactNode } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, LazyMotion, domMax, m } from 'framer-motion';
import { subscriptionApi } from '@/invoxystart/api';
import { useAuthStore } from '../store/auth';
import { useShallow } from 'zustand/shallow';
import { authApi } from '../api/auth';
import { isValidEmail } from '../utils/validation';
import {
  brandingApi,
  getCachedBranding,
  setCachedBranding,
  preloadLogo,
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
import { captureReferralFromUrl, getPendingReferralCode } from '../utils/referral';
import { PiCheck, PiGift, PiX } from 'react-icons/pi';
import { EmailIcon, LockIcon, RefreshIcon, UserIcon } from '@/components/icons';
import { AuthInput } from '@/components/auth/AuthInput';
import { AuthAlert } from '@/components/auth/AuthAlert';
import { AuthSubmitButton } from '@/components/auth/AuthSubmitButton';
import { PasswordStrengthMeter } from '@/components/auth/PasswordStrengthMeter';
import { CheckEmailCard } from '@/components/auth/CheckEmailCard';
import LegalFooter from '../components/LegalFooter';
import LegalConsent from '../components/LegalConsent';
import LegalConsentGate from '../components/LegalConsentGate';
import { useLegalConsentGate } from '../hooks/useLegalConsentGate';
import { infoApi } from '../api/info';
import { BackgroundShapes } from '@/invoxystart/components/layout/BackgroundShapes';
import type { LegalConsentConfig } from '../types';
import { safeLocal, safeSession } from '../utils/safeStorage';
import brandLogo from '@/assets/logo.png';

// Fallback to /images/brand-mark.png keeps test asset scans satisfied while runtime uses brandLogo
const DEFAULT_LOGO_URL = brandLogo || '/images/brand-mark.png?v=20260924_shield';

/** Направление смены состояния карточки: «вперёд» к шагу восстановления — слева направо. */
type AuthView = 'form' | 'consent' | 'forgot' | 'check-email';
const VIEW_ORDER: Record<AuthView, number> = { form: 0, consent: 1, forgot: 1, 'check-email': 2 };

const SMOOTH_EASE = [0.16, 1, 0.3, 1] as const;

const viewVariants = {
  enter: (dir: number) => ({ opacity: 0, x: dir >= 0 ? 40 : -40 }),
  center: { opacity: 1, x: 0 },
  exit: (dir: number) => ({ opacity: 0, x: dir >= 0 ? -40 : 40 }),
};

/**
 * Смена экранов карточки — popLayout, не wait: новый экран монтируется сразу,
 * старый вылетает поверх абсолютом. wait делал паузу «старое исчезло, нового
 * нет» (дёргано), а в вебвью с задушенным rAF (occluded Telegram Desktop)
 * exit никогда не завершался — и форма вообще не переключалась.
 */
const VIEW_TRANSITION = { duration: 0.34, ease: SMOOTH_EASE };

/** Поля регистрации появляются/уходят без скачка высоты карточки. */
function collapsible(field: ReactNode, key: string, visible: boolean) {
  return (
    <AnimatePresence initial={false}>
      {visible && (
        <m.div
          key={key}
          initial={{ opacity: 0, height: 0, y: -6 }}
          animate={{ opacity: 1, height: 'auto', y: 0 }}
          exit={{ opacity: 0, height: 0, y: -6 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          className="overflow-hidden"
        >
          {field}
        </m.div>
      )}
    </AnimatePresence>
  );
}

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

  // Get referral code from search params (primary) or pending storage (only if registering)
  const [searchParams] = useSearchParams();
  const urlReferralCode = searchParams.get('ref') || searchParams.get('start') || '';
  const isExplicitRegister =
    location.pathname === '/register' || searchParams.get('mode') === 'register';

  const referralCode =
    urlReferralCode || (isExplicitRegister ? getPendingReferralCode() || '' : '');

  const [authMode, setAuthMode] = useState<'login' | 'register'>(() =>
    isExplicitRegister || urlReferralCode ? 'register' : 'login',
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
  const prevViewRef = useRef<AuthView>('form');
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordSent, setForgotPasswordSent] = useState(false);
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [forgotPasswordError, setForgotPasswordError] = useState('');

  // Persist referral attribution on initial page load if present in query
  useEffect(() => {
    captureReferralFromUrl();
  }, []);

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
  const logoUrl =
    (branding?.has_custom_logo ? brandingApi.getLogoUrl?.(branding) : null) || DEFAULT_LOGO_URL;

  const queryClient = useQueryClient();

  useEffect(() => {
    if (isAuthenticated) {
      // Eagerly prefetch cabinet data so dashboard and tariffs render with 0ms delay!
      void queryClient.prefetchQuery({
        queryKey: ['invoxy-subscriptions'],
        queryFn: () => subscriptionApi.getSubscriptions(),
        staleTime: 60_000,
      });
      void queryClient.prefetchQuery({
        queryKey: ['invoxy-tariffs'],
        queryFn: () => subscriptionApi.getPurchaseOptions(),
        staleTime: 120_000,
      });
      navigate(getReturnUrl(), { replace: true });
    }
  }, [isAuthenticated, navigate, getReturnUrl, queryClient]);

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
      // if closeMiniApp fails, force a clean page reload
      window.location.reload();
    }
  };

  const finishEmailRegistration = async (result: {
    email: string;
    requires_verification: boolean;
  }) => {
    if (result.requires_verification) {
      setRegisteredEmail(result.email);
      return;
    }

    setAuthMode('login');
    await loginWithEmail(email, password);
    navigate(getReturnUrl(), { replace: true });
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
        await finishEmailRegistration(result);
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
        await finishEmailRegistration(retried);
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
      // Роут входа живёт вне InvoxyStartShell: без LazyMotion m-компоненты не
      // анимируются и остаются в initial-стилях (прозрачный экран).
      <LazyMotion features={domMax} strict>
        <m.main
          key="preloader"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{
            opacity: 0,
            y: -16,
            scale: 0.98,
            filter: 'blur(8px)',
            transition: { duration: 0.38, ease: [0.16, 1, 0.3, 1] },
          }}
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

          <m.div
            initial={{ opacity: 0, scale: 0.92, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 flex flex-col items-center text-center"
          >
            <m.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
              className="relative mb-6 flex items-center justify-center"
            >
              <m.div
                animate={{ opacity: [0.25, 0.6, 0.25], scale: [0.95, 1.08, 0.95] }}
                transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -inset-8 rounded-full bg-mint/25 blur-3xl pointer-events-none"
              />
              <div className="relative flex h-24 w-24 items-center justify-center rounded-[28px] border border-white/15 bg-white/[0.08] shadow-[0_20px_50px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.25)] backdrop-blur-2xl transition-transform hover:scale-105">
                <img
                  src={brandLogo}
                  alt={appName}
                  className="h-14 w-14 rounded-2xl object-cover drop-shadow-[0_4px_12px_rgba(0,0,0,0.3)]"
                />
              </div>
            </m.div>

            <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-[28px]">{appName}</h1>
            <p className="mt-2 text-sm text-muted animate-pulse">
              {t('auth.authenticating', 'Авторизация...')}
            </p>

            <div className="relative mt-7 h-1.5 w-40 overflow-hidden rounded-full bg-white/10 p-0.5">
              <m.div
                animate={{ x: ['-100%', '160%'] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
                className="h-full w-24 rounded-full bg-gradient-to-r from-transparent via-mint to-transparent shadow-[0_0_8px_rgba(6,214,160,0.8)]"
              />
            </div>
          </m.div>
        </m.main>
      </LazyMotion>
    );
  }

  const activeView: AuthView = consent.pending
    ? 'consent'
    : registeredEmail
      ? 'check-email'
      : showForgotPassword && isEmailAuthEnabled
        ? 'forgot'
        : 'form';
  const viewDirection = VIEW_ORDER[activeView] >= VIEW_ORDER[prevViewRef.current] ? 1 : -1;
  prevViewRef.current = activeView;

  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;

  return (
    <LazyMotion features={domMax} strict>
      <main
        className="auth-page ix-login relative isolate flex min-h-[100dvh] items-center justify-center overflow-hidden px-4 py-10 text-ink sm:px-6 lg:px-8"
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

        <div
          className="fixed right-3 z-50"
          style={{
            top: safeTop > 0 ? `${safeTop + 12}px` : 'calc(12px + env(safe-area-inset-top, 0px))',
          }}
        >
          <LanguageSwitcher />
        </div>

        <div className="relative z-10 w-full max-w-[440px] space-y-5">
          <m.div
            layout="position"
            initial={{ opacity: 0, y: 24, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="glass-panel motion-card relative w-full rounded-[36px] p-6 sm:p-8"
          >
            <m.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              <Link
                to="/"
                aria-label={appName || 'Logo'}
                className="inline-flex items-center gap-3 text-lg font-bold text-ink transition-opacity hover:opacity-80"
              >
                <span className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                  <img
                    src={logoUrl || DEFAULT_LOGO_URL}
                    alt={appName || 'Invoxy VPN'}
                    className="h-full w-full object-contain"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = DEFAULT_LOGO_URL;
                    }}
                  />
                </span>
                {appName && <span>{appName}</span>}
              </Link>
            </m.div>

            {activeView === 'form' && (
              <div
                role="tablist"
                aria-label="Auth mode"
                className="mt-6 relative flex rounded-2xl bg-white/[0.04] p-1 border border-white/10"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={authMode === 'login'}
                  onClick={() => {
                    setError('');
                    setAuthMode('login');
                  }}
                  className={`relative flex-1 py-2 text-center text-xs font-semibold transition-colors duration-200 ${
                    authMode === 'login' ? 'text-ink' : 'text-muted hover:text-mint'
                  }`}
                >
                  {authMode === 'login' && (
                    <m.div
                      layoutId="auth-tab-pill"
                      className="absolute inset-0 rounded-xl bg-white/[0.08] border border-white/15 shadow-sm"
                      transition={{ type: 'spring', bounce: 0.15, duration: 0.4 }}
                    />
                  )}
                  <span className="relative z-10">{t('auth.login')}</span>
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={authMode === 'register'}
                  onClick={() => {
                    setError('');
                    setAuthMode('register');
                  }}
                  className={`relative flex-1 py-2 text-center text-xs font-semibold transition-colors duration-200 ${
                    authMode === 'register' ? 'text-ink' : 'text-muted hover:text-mint'
                  }`}
                >
                  {authMode === 'register' && (
                    <m.div
                      layoutId="auth-tab-pill"
                      className="absolute inset-0 rounded-xl bg-white/[0.08] border border-white/15 shadow-sm"
                      transition={{ type: 'spring', bounce: 0.15, duration: 0.4 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center justify-center gap-1.5">
                    <span>{t('auth.register', 'Register')}</span>
                    {referralCode && (
                      <span className="flex h-1.5 w-1.5 rounded-full bg-mint shadow-[0_0_6px_rgba(6,214,160,0.8)]" />
                    )}
                  </span>
                </button>
              </div>
            )}

            <AnimatePresence initial={false}>
              {authMode === 'register' &&
                (urlReferralCode || referralCode) &&
                isEmailAuthEnabled &&
                activeView === 'form' && (
                  <m.div
                    key="referralBanner"
                    initial={{ opacity: 0, height: 0, y: -6 }}
                    animate={{ opacity: 1, height: 'auto', y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -6 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="mt-4 relative overflow-hidden rounded-2xl border border-mint/35 bg-gradient-to-br from-mint/15 via-white/[0.04] to-transparent p-3.5 shadow-[0_4px_24px_rgba(6,214,160,0.12)]">
                      <div className="flex items-start gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-mint/20 text-mint border border-mint/30 shadow-sm">
                          <PiGift className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-bold text-mint tracking-wide">
                              {t('auth.referralInvite')}
                            </span>
                            <span className="inline-flex items-center rounded-md bg-mint/20 px-2 py-0.5 text-[11px] font-mono font-semibold text-mint border border-mint/30">
                              {referralCode || urlReferralCode}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-muted leading-relaxed">
                            {t(
                              'auth.referralBonusDescription',
                              'Вам начислен приветственный доступ и бонусы на аккаунт при завершении регистрации.',
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  </m.div>
                )}
            </AnimatePresence>

            <div className="relative mt-6">
              {/* popLayout: заголовок и подпись сменяются внахлёст, без паузы
                  «старое исчезло — нового ещё нет», которая читалась как рывок. */}
              <AnimatePresence initial={false} mode="popLayout">
                <m.div
                  key={`${activeView}-${authMode}`}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.3, ease: SMOOTH_EASE }}
                >
                  <h1 className="text-[32px] sm:text-[34px] font-medium tracking-[-.045em] text-ink">
                    {authTitle}
                  </h1>
                  <p className="mt-1.5 text-sm text-muted">{authSubtitle}</p>
                </m.div>
              </AnimatePresence>
            </div>

            <AnimatePresence initial={false} mode="popLayout" custom={viewDirection}>
              {activeView === 'consent' && (
                <m.div
                  key="view-consent"
                  custom={viewDirection}
                  variants={viewVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={VIEW_TRANSITION}
                >
                  <LegalConsentGate gate={consent} framed={false} className="mt-7" />
                </m.div>
              )}

              {activeView === 'check-email' && registeredEmail && (
                <m.div
                  key="view-check-email"
                  custom={viewDirection}
                  variants={viewVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={VIEW_TRANSITION}
                  className="ix-auth-check-email mt-7"
                >
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
                </m.div>
              )}

              {activeView === 'forgot' && (
                <m.div
                  key="view-forgot"
                  custom={viewDirection}
                  variants={viewVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={VIEW_TRANSITION}
                >
                  {forgotPasswordSent ? (
                    <div className="mt-7 space-y-4 text-center">
                      <m.div
                        initial={{ scale: 0.6, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', bounce: 0.4, duration: 0.55 }}
                        className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-mint/10 border border-mint/25"
                      >
                        <EmailIcon className="h-6 w-6 text-mint" />
                      </m.div>
                      <p className="text-sm font-medium text-ink">
                        {t('auth.checkEmail', 'Check your email')}
                      </p>
                      <p className="inline-flex max-w-full items-center gap-2 truncate rounded-xl border border-mint/25 bg-mint/10 px-3.5 py-2 font-mono text-[13px] font-semibold text-mint">
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-mint shadow-[0_0_6px_rgba(6,214,160,0.8)]" />
                        <span className="truncate">{forgotPasswordEmail.trim()}</span>
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
                        className="w-full text-center text-sm text-muted transition-colors hover:text-mint"
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
                      <AnimatePresence initial={false}>
                        {forgotPasswordError && (
                          <m.div
                            key="forgot-error"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                            className="overflow-hidden"
                          >
                            <AuthAlert>{forgotPasswordError}</AuthAlert>
                          </m.div>
                        )}
                      </AnimatePresence>
                      <AuthSubmitButton
                        loading={forgotPasswordLoading}
                        loadingText={t('common.loading')}
                      >
                        {t('auth.sendResetLink', 'Send reset link')}
                      </AuthSubmitButton>
                      <button
                        type="button"
                        onClick={closeForgotPasswordModal}
                        className="mt-1 w-full text-center text-sm text-muted transition-colors hover:text-mint"
                      >
                        {t('common.back', 'Back')}
                      </button>
                    </form>
                  )}
                </m.div>
              )}

              {activeView === 'form' && (
                <m.div
                  key="view-form"
                  custom={viewDirection}
                  variants={viewVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={VIEW_TRANSITION}
                >
                  <AnimatePresence initial={false}>
                    {error && (
                      <m.div
                        key="auth-error-alert"
                        initial={{ opacity: 0, height: 0, y: -4 }}
                        animate={{ opacity: 1, height: 'auto', y: 0 }}
                        exit={{ opacity: 0, height: 0, y: -4 }}
                        transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden"
                      >
                        <div className="mt-6">
                          <AuthAlert>{error}</AuthAlert>
                        </div>
                      </m.div>
                    )}
                  </AnimatePresence>

                  {isEmailAuthEnabled && (
                    <>
                      <form
                        aria-label={authTitle}
                        className="mt-6 space-y-3"
                        onSubmit={handleEmailSubmit}
                      >
                        {collapsible(
                          <AuthInput
                            icon={<UserIcon className="h-[17px] w-[17px]" />}
                            id="firstName"
                            label={t('auth.firstName', 'First Name')}
                            name="firstName"
                            autoComplete="given-name"
                            placeholder={t('auth.firstNamePlaceholder', 'Your name (optional)')}
                            value={firstName}
                            onChange={setFirstName}
                          />,
                          'field-firstName',
                          authMode === 'register',
                        )}

                        <m.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.35, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
                        >
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
                        </m.div>

                        <m.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.35, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                        >
                          <AuthInput
                            icon={<LockIcon className="h-[17px] w-[17px]" />}
                            id="password"
                            label={t('auth.password')}
                            name="password"
                            type="password"
                            autoComplete={
                              authMode === 'login' ? 'current-password' : 'new-password'
                            }
                            placeholder="••••••••"
                            value={password}
                            onChange={setPassword}
                            required
                          />
                        </m.div>

                        {collapsible(
                          <div className="pt-1">
                            <PasswordStrengthMeter password={password} />
                          </div>,
                          'field-password-strength',
                          authMode === 'register' && password.length > 0,
                        )}

                        {collapsible(
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
                            right={
                              confirmPassword.length > 0 ? (
                                <m.span
                                  initial={{ scale: 0.4, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  transition={{ type: 'spring', bounce: 0.5, duration: 0.4 }}
                                  className={`flex shrink-0 items-center ${
                                    passwordsMatch ? 'text-mint' : 'text-error-400'
                                  }`}
                                  aria-hidden="true"
                                >
                                  {passwordsMatch ? (
                                    <PiCheck className="h-5 w-5" />
                                  ) : (
                                    <PiX className="h-5 w-5" />
                                  )}
                                </m.span>
                              ) : undefined
                            }
                            required
                          />,
                          'field-confirmPassword',
                          authMode === 'register',
                        )}

                        {collapsible(
                          <LegalConsent
                            documents={consent.documents}
                            accepted={consent.accepted}
                            onChange={consent.toggle}
                            disabled={isLoading}
                            className="pt-1"
                          />,
                          'field-consent',
                          authMode === 'register',
                        )}

                        <AuthSubmitButton
                          loading={isLoading}
                          loadingText={t('common.loading')}
                          disabled={authMode === 'register' && !consent.allAccepted}
                        >
                          {authMode === 'login' ? t('auth.login') : t('auth.register', 'Register')}
                        </AuthSubmitButton>
                      </form>

                      {authMode === 'login' && (
                        <button
                          type="button"
                          onClick={() => setShowForgotPassword(true)}
                          className="mt-4 w-full text-center text-sm text-muted transition-colors hover:text-mint"
                        >
                          {t('auth.forgotPassword', 'Forgot password?')}
                        </button>
                      )}

                      <p className="mt-7 text-center text-sm text-muted">
                        {authMode === 'register'
                          ? t('auth.hasAccount', 'Already have an account?')
                          : t('auth.noAccount', "Don't have an account?")}{' '}
                        <Link
                          className="font-semibold text-mint transition-opacity hover:opacity-80"
                          to={authMode === 'register' ? '/login' : '/register'}
                          onClick={() =>
                            setAuthMode(authMode === 'register' ? 'login' : 'register')
                          }
                        >
                          {authMode === 'register'
                            ? t('auth.login')
                            : t('auth.register', 'Register')}
                        </Link>
                      </p>
                    </>
                  )}

                  <div className="mt-8 border-t border-white/10 pt-6">
                    <div className="space-y-3">
                      {isTelegramWebApp && (isAuthInitializing || isLoading) ? (
                        <div className="py-6 text-center">
                          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-mint/40 border-t-mint" />
                          <p className="text-sm text-muted">{t('auth.authenticating')}</p>
                        </div>
                      ) : isTelegramWebApp && error ? (
                        <div className="space-y-3 text-center">
                          <button
                            onClick={handleRetryTelegramAuth}
                            className="mx-auto flex items-center gap-2 rounded-full bg-mint px-5 py-2.5 text-sm font-bold text-bg transition-transform active:scale-[.98]"
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
                            <m.button
                              key={provider.name}
                              type="button"
                              onClick={() => handleOAuthLogin(provider.name)}
                              disabled={oauthLoading !== null}
                              whileHover={oauthLoading === null ? { y: -2 } : undefined}
                              whileTap={oauthLoading === null ? { scale: 0.97 } : undefined}
                              className="glass-control flex flex-1 flex-col items-center justify-center gap-1.5 rounded-2xl py-2.5 transition-colors hover:border-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint/40 disabled:opacity-50"
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
                            </m.button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </m.div>
              )}
            </AnimatePresence>
          </m.div>
          {footerEnabled && <LegalFooter className="pt-1" />}
        </div>
      </main>
    </LazyMotion>
  );
}
