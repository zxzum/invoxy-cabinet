import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { m } from 'framer-motion';
import { useAuthStore } from '../store/auth';
import { useShallow } from 'zustand/shallow';
import { brandingApi, LOCAL_LOGO_URL } from '../api/branding';
import { isInTelegramWebApp, getTelegramInitData } from '../hooks/useTelegramSDK';
import { tokenStorage } from '../utils/token';
import { getSafeRedirectPath } from '../utils/safeRedirect';
import { ExclamationIcon } from '@/components/icons';
import { safeLocal, safeSession } from '../utils/safeStorage';
import { useLegalConsentGate } from '../hooks/useLegalConsentGate';
import LegalConsentGate from '../components/LegalConsentGate';
import { getApiErrorMessage } from '../utils/api-error';
import { AuthShell } from '@/components/auth/AuthShell';
import { AuthCard } from '@/components/auth/AuthCard';
import { AuthStatusScreen } from '@/components/auth/AuthStatusScreen';

const MAX_RETRY_ATTEMPTS = 3;
const RETRY_COUNT_KEY = 'telegram_redirect_retry_count';

const MINT_BUTTON =
  'flex h-[52px] w-full items-center justify-center rounded-full bg-mint text-sm font-bold text-bg transition-transform active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-50';
const GHOST_BUTTON =
  'glass-control flex h-12 w-full items-center justify-center rounded-full text-sm font-semibold text-ink transition-colors hover:border-white/20';

export default function TelegramRedirect() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {
    loginWithTelegram,
    isAuthenticated,
    isLoading: authLoading,
  } = useAuthStore(
    useShallow((state) => ({
      loginWithTelegram: state.loginWithTelegram,
      isAuthenticated: state.isAuthenticated,
      isLoading: state.isLoading,
    })),
  );
  const [status, setStatus] = useState<
    'loading' | 'success' | 'error' | 'not-telegram' | 'consent'
  >('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const consent = useLegalConsentGate();
  const [retryCount, setRetryCount] = useState(() => {
    const stored = safeSession.getItem(RETRY_COUNT_KEY);
    return stored ? parseInt(stored, 10) : 0;
  });

  // Get branding for nice display
  const { data: branding } = useQuery({
    queryKey: ['branding'],
    queryFn: brandingApi.getBranding,
    staleTime: 60000,
  });

  const appName = branding ? branding.name : import.meta.env.VITE_APP_NAME || 'VPN';
  const logoUrl = branding ? brandingApi.getLogoUrl(branding) : null;

  // Get redirect target from URL params (validated)
  const redirectTo = getSafeRedirectPath(searchParams.get('redirect'));

  useEffect(() => {
    // All timers scheduled inside this effect funnel through `timers` so the
    // cleanup can cancel everything when the effect re-runs (deps change
    // during loginWithTelegram) or the page unmounts — preventing
    // setState-on-unmounted-component warnings and stray late navigations.
    const timers: ReturnType<typeof setTimeout>[] = [];
    const schedule = (fn: () => void, ms: number) => {
      timers.push(setTimeout(fn, ms));
    };

    // If already authenticated, redirect immediately
    if (isAuthenticated && !authLoading) {
      setStatus('success');
      schedule(() => navigate(redirectTo), 500);
      return () => timers.forEach(clearTimeout);
    }

    const initTelegram = async () => {
      // Check if running in Telegram WebApp
      const initData = getTelegramInitData();

      if (!isInTelegramWebApp() || !initData) {
        // Not in Telegram, show message and redirect to login
        setStatus('not-telegram');
        schedule(() => navigate('/login'), 2000);
        return;
      }

      // Note: ready(), expand(), and theme CSS vars are already handled by SDK init in main.tsx

      try {
        await loginWithTelegram(initData);
        setStatus('success');
        // Small delay for nice UX
        schedule(() => navigate(redirectTo), 800);
      } catch (err: unknown) {
        // Новый пользователь без согласия: бэк ответил 428 — это не сбой входа,
        // показываем чекбоксы и повторяем вход с теми же initData и галочками.
        const needsConsent = consent.capture(err, async (accepted) => {
          await loginWithTelegram(initData, accepted);
          setStatus('success');
          navigate(redirectTo);
        });
        if (needsConsent) {
          setStatus('consent');
          return;
        }
        console.error('Telegram auth failed:', err);
        setErrorMessage(getApiErrorMessage(err, t('auth.telegramRequired')));
        setStatus('error');
      }
    };

    // Small delay to show loading screen
    schedule(initTelegram, 300);

    return () => timers.forEach(clearTimeout);
  }, [loginWithTelegram, navigate, isAuthenticated, authLoading, redirectTo, t, consent.capture]);

  // Handle retry with limit to prevent infinite loops
  const handleRetry = () => {
    if (retryCount >= MAX_RETRY_ATTEMPTS) {
      setErrorMessage(t('telegramRedirect.maxRetries'));
      safeSession.removeItem(RETRY_COUNT_KEY);
      return;
    }
    const newCount = retryCount + 1;
    setRetryCount(newCount);
    // Счётчик читается после reload, поэтому память тут не считается: если
    // сохранить некуда, лимит попыток не сработает никогда и пользователь
    // останется крутить перезагрузку. Тогда сразу говорим, что попытки исчерпаны.
    if (!safeSession.setItem(RETRY_COUNT_KEY, String(newCount))) {
      setErrorMessage(t('telegramRedirect.maxRetries'));
      return;
    }

    // Clear all cached auth state to prevent stale token/initData loops
    tokenStorage.clearTokens();
    safeSession.removeItem('tapps/launchParams');
    safeSession.removeItem('telegram_init_data');
    safeLocal.removeItem('cabinet-auth');
    safeLocal.removeItem('tg_user_id');

    setStatus('loading');
    setErrorMessage('');
    window.location.reload();
  };

  // Clear retry count on successful auth
  useEffect(() => {
    if (status === 'success') {
      safeSession.removeItem(RETRY_COUNT_KEY);
    }
  }, [status]);

  return (
    <AuthShell withLanguageSwitcher={status === 'consent'}>
      <AuthCard>
        {/* Logo */}
        <m.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto mb-5 flex h-16 w-16 items-center justify-center overflow-hidden rounded-3xl border border-white/15 bg-white/[0.08] shadow-[0_16px_40px_rgba(0,0,0,0.45)] backdrop-blur-xl"
        >
          <img
            src={branding?.has_custom_logo && logoUrl ? logoUrl : LOCAL_LOGO_URL}
            alt={appName}
            className="h-full w-full object-cover"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = LOCAL_LOGO_URL;
            }}
          />
        </m.div>

        <h1 className="mb-6 text-center text-xl font-bold tracking-tight text-ink">{appName}</h1>

        {/* Loading State */}
        {status === 'loading' && (
          <AuthStatusScreen
            state="loading"
            title={t('auth.authenticating')}
            subtitle={t('common.loading')}
          />
        )}

        {/* Success State */}
        {status === 'success' && (
          <AuthStatusScreen
            state="success"
            title={t('auth.loginSuccess')}
            subtitle={t('telegramRedirect.redirecting')}
            redirectSeconds={0.8}
          />
        )}

        {/* Error State */}
        {status === 'error' && (
          <AuthStatusScreen state="error" title={t('auth.loginFailed')} subtitle={errorMessage}>
            <div className="flex flex-col gap-3">
              <button type="button" onClick={handleRetry} className={MINT_BUTTON}>
                {t('auth.tryAgain')}
              </button>
              <button type="button" onClick={() => navigate('/login')} className={GHOST_BUTTON}>
                {t('telegramRedirect.loginAlternative')}
              </button>
            </div>
          </AuthStatusScreen>
        )}

        {/* Consent State: аккаунт новый, бэк ждёт галочки «ознакомлен» */}
        {status === 'consent' && <LegalConsentGate gate={consent} framed={false} />}

        {/* Not in Telegram State */}
        {status === 'not-telegram' && (
          <m.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center text-center"
          >
            <div className="mb-4 flex h-[74px] w-[74px] items-center justify-center rounded-full bg-amber-400/10 ring-1 ring-amber-400/30">
              <ExclamationIcon className="h-9 w-9 text-amber-300" />
            </div>
            <p className="text-lg font-semibold text-ink">{t('telegramRedirect.openInTelegram')}</p>
            <p className="mt-1.5 max-w-[320px] text-sm leading-relaxed text-muted">
              {t('telegramRedirect.openInTelegramDesc')}
            </p>
            <p className="mt-4 text-xs text-muted">{t('telegramRedirect.redirectToLogin')}</p>
          </m.div>
        )}

        {/* Telegram branding */}
        <div className="mt-8 flex items-center justify-center gap-2 border-t border-white/10 pt-5 text-muted/60">
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
          </svg>
          <span className="text-xs">Telegram Mini App</span>
        </div>
      </AuthCard>
    </AuthShell>
  );
}
