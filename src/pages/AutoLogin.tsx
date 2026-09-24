import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { authApi } from '../api/auth';
import { useAuthStore } from '../store/auth';
import { AuthShell } from '@/components/auth/AuthShell';
import { AuthCard } from '@/components/auth/AuthCard';
import { AuthStatusScreen } from '@/components/auth/AuthStatusScreen';
import brandLogo from '@/assets/logo.png';

export default function AutoLogin() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setTokens, setUser, checkAdminStatus } = useAuthStore();
  const [error, setError] = useState(false);
  const attemptedRef = useRef(false);

  const token = searchParams.get('token');

  useEffect(() => {
    // Prevent referrer leaking the token
    const meta = document.createElement('meta');
    meta.name = 'referrer';
    meta.content = 'no-referrer';
    document.head.appendChild(meta);
    return () => {
      document.head.removeChild(meta);
    };
  }, []);

  useEffect(() => {
    if (!token || attemptedRef.current) {
      if (!token) setError(true);
      return;
    }
    attemptedRef.current = true;

    authApi
      .autoLogin(token)
      .then(async (response) => {
        setTokens(response.access_token, response.refresh_token);
        setUser(response.user);
        await checkAdminStatus();
        navigate('/dashboard', { replace: true });
      })
      .catch(() => {
        setError(true);
      });
  }, [token, navigate, setTokens, setUser, checkAdminStatus]);

  return (
    <AuthShell>
      <AuthCard>
        <AuthStatusScreen
          state={error ? 'error' : 'loading'}
          logo={brandLogo}
          title={error ? t('landing.autoLoginFailed') : t('landing.autoLoginProcessing')}
        >
          {error && (
            <button
              type="button"
              onClick={() => navigate('/login', { replace: true })}
              className="flex h-[52px] w-full items-center justify-center rounded-full bg-mint text-sm font-bold text-bg transition-transform active:scale-[.98]"
            >
              {t('auth.login', 'Login')}
            </button>
          )}
        </AuthStatusScreen>
      </AuthCard>
    </AuthShell>
  );
}
