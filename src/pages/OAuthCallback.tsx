import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/auth';
import { authApi } from '../api/auth';
import {
  peekLinkOAuthState,
  clearLinkOAuthState,
  loadOAuthState,
  clearOAuthState,
  getErrorDetail,
} from '../utils/oauth';
import type { ServerCompleteResponse } from '../types';
import { AuthShell } from '@/components/auth/AuthShell';
import { AuthCard } from '@/components/auth/AuthCard';
import { AuthStatusScreen } from '@/components/auth/AuthStatusScreen';
import brandLogo from '@/assets/logo.png';

type CallbackMode = 'login' | 'link-browser' | 'link-server';

export default function OAuthCallback() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState('');
  const [errorMode, setErrorMode] = useState<CallbackMode>('login');
  const [serverLinkResult, setServerCompleteResponse] = useState<ServerCompleteResponse | null>(
    null,
  );
  const loginWithOAuth = useAuthStore((state) => state.loginWithOAuth);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hasRun = useRef(false);

  // Handle merge redirect via useEffect (not in render)
  useEffect(() => {
    if (serverLinkResult?.merge_required && serverLinkResult.merge_token) {
      navigate(`/merge/${serverLinkResult.merge_token}`, { replace: true });
    }
  }, [serverLinkResult, navigate]);

  useEffect(() => {
    // Prevent double-fire from React StrictMode
    if (hasRun.current) return;
    hasRun.current = true;

    const code = searchParams.get('code');
    const urlState = searchParams.get('state');
    const deviceId = searchParams.get('device_id');

    if (!code || !urlState) {
      setError(t('auth.oauthError', 'Authorization was denied or failed'));
      return;
    }

    // Determine callback mode:
    // 1. Link state in sessionStorage → browser linking flow
    // 2. Login state in sessionStorage → login flow
    // 3. Neither → opened from external browser (Mini App flow) → server-complete
    let mode: CallbackMode = 'link-server';
    let provider: string | undefined;
    let state: string | undefined;

    const linkSaved = peekLinkOAuthState();
    if (linkSaved && linkSaved.state === urlState) {
      clearLinkOAuthState();
      mode = 'link-browser';
      provider = linkSaved.provider;
      state = linkSaved.state;
    } else {
      const loginSaved = loadOAuthState();
      if (loginSaved && loginSaved.state === urlState) {
        clearOAuthState();
        mode = 'login';
        provider = loginSaved.provider;
        state = loginSaved.state;
      }
    }

    const handle = async () => {
      // Clear sensitive OAuth params (code, state) from URL immediately for all modes
      window.history.replaceState({}, '', '/auth/oauth/callback');

      if (mode === 'link-browser' && provider && state) {
        // Browser linking: user is authenticated, complete via JWT-protected endpoint
        try {
          const response = await authApi.linkProviderCallback(
            provider,
            code,
            state,
            deviceId ?? undefined,
          );
          if (response.merge_required && response.merge_token) {
            navigate(`/merge/${response.merge_token}`, { replace: true });
          } else {
            navigate('/profile/accounts', { replace: true });
          }
        } catch (err: unknown) {
          setErrorMode('link-browser');
          setError(getErrorDetail(err) || t('profile.accounts.linkError'));
        }
        return;
      }

      if (mode === 'login' && provider && state) {
        // Login flow
        if (isAuthenticated) {
          navigate('/dashboard', { replace: true });
          return;
        }
        try {
          await loginWithOAuth(provider, code, state, deviceId);
          navigate('/dashboard', { replace: true });
        } catch (err: unknown) {
          const detail = getErrorDetail(err);
          setError(detail || t('auth.oauthError', 'Authorization was denied or failed'));
        }
        return;
      }

      // mode === 'link-server': No sessionStorage state found.
      // This happens when OAuth was opened in external browser from Mini App.
      // Complete linking via state-token-authenticated server endpoint.
      try {
        // Provider is resolved server-side from the state token in Redis.
        const response = await authApi.linkServerComplete(code, urlState, deviceId ?? undefined);
        setServerCompleteResponse(response);
      } catch (err: unknown) {
        setErrorMode('link-server');
        setError(getErrorDetail(err) || t('profile.accounts.linkError'));
      }
    };

    handle();
  }, [searchParams, loginWithOAuth, navigate, isAuthenticated, t]);

  // Server-complete result: show success with "Return to Telegram" link
  // (merge redirect is handled by the useEffect above)
  if (
    serverLinkResult?.success &&
    !(serverLinkResult.merge_required && serverLinkResult.merge_token)
  ) {
    const botUsername = import.meta.env.VITE_TELEGRAM_BOT_USERNAME || '';
    const telegramLink = botUsername ? `https://t.me/${botUsername}` : '';

    return (
      <AuthShell>
        <AuthCard>
          <AuthStatusScreen
            state="success"
            title={t('profile.accounts.linkSuccess')}
            subtitle={t('profile.accounts.returnToTelegram')}
          >
            {telegramLink && (
              <a
                href={telegramLink}
                className="flex h-[52px] w-full items-center justify-center rounded-full bg-mint text-sm font-bold text-bg no-underline transition-transform active:scale-[.98]"
              >
                {t('profile.accounts.openTelegram')}
              </a>
            )}
          </AuthStatusScreen>
        </AuthCard>
      </AuthShell>
    );
  }

  if (error) {
    const isServerMode = errorMode === 'link-server';
    const isLinkBrowserMode = errorMode === 'link-browser';
    const botUsername = import.meta.env.VITE_TELEGRAM_BOT_USERNAME || '';
    const telegramLink = botUsername ? `https://t.me/${botUsername}` : '';

    return (
      <AuthShell>
        <AuthCard>
          <AuthStatusScreen state="error" title={t('auth.loginFailed')} subtitle={error}>
            {isServerMode && telegramLink ? (
              <a
                href={telegramLink}
                className="flex h-[52px] w-full items-center justify-center rounded-full bg-mint text-sm font-bold text-bg no-underline transition-transform active:scale-[.98]"
              >
                {t('profile.accounts.openTelegram')}
              </a>
            ) : isLinkBrowserMode ? (
              <button
                type="button"
                onClick={() => navigate('/profile/accounts', { replace: true })}
                className="flex h-[52px] w-full items-center justify-center rounded-full bg-mint text-sm font-bold text-bg transition-transform active:scale-[.98]"
              >
                {t('profile.accounts.backToAccounts', 'Back to accounts')}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => navigate('/login', { replace: true })}
                className="flex h-[52px] w-full items-center justify-center rounded-full bg-mint text-sm font-bold text-bg transition-transform active:scale-[.98]"
              >
                {t('auth.backToLogin', 'Back to login')}
              </button>
            )}
          </AuthStatusScreen>
        </AuthCard>
      </AuthShell>
    );
  }

  return (
    <AuthShell withLanguageSwitcher={false}>
      <AuthCard>
        <AuthStatusScreen
          state="loading"
          logo={brandLogo}
          title={t('auth.authenticating')}
          subtitle={t('common.loading')}
        />
      </AuthCard>
    </AuthShell>
  );
}
