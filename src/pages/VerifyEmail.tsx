import { useEffect, useRef, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { authApi } from '../api/auth';
import { useAuthStore } from '../store/auth';
import { useShallow } from 'zustand/shallow';
import { consumeCampaignSlug, getPendingCampaignSlug } from '../utils/campaign';
import { tokenStorage } from '../utils/token';
import { getApiErrorMessage } from '../utils/api-error';
import { AuthShell } from '@/components/auth/AuthShell';
import { AuthCard } from '@/components/auth/AuthCard';
import { AuthStatusScreen } from '@/components/auth/AuthStatusScreen';
import brandLogo from '@/assets/logo.png';

const VERIFY_REDIRECT_MS = 1500;

export default function VerifyEmail() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState('');
  const { setTokens, setUser, checkAdminStatus } = useAuthStore(
    useShallow((state) => ({
      setTokens: state.setTokens,
      setUser: state.setUser,
      checkAdminStatus: state.checkAdminStatus,
    })),
  );
  const hasVerified = useRef(false);

  useEffect(() => {
    if (hasVerified.current) return;

    const token = searchParams.get('token');

    if (!token) {
      setStatus('error');
      setError(t('common.error'));
      return;
    }

    hasVerified.current = true;
    let redirectTimer: ReturnType<typeof setTimeout>;

    const verify = async () => {
      try {
        const campaignSlug = getPendingCampaignSlug();
        const response = await authApi.verifyEmail(token, campaignSlug);
        consumeCampaignSlug();
        // Save tokens and log user in
        tokenStorage.setTokens(response.access_token, response.refresh_token);
        setTokens(response.access_token, response.refresh_token);
        setUser(response.user);
        if (response.campaign_bonus) {
          useAuthStore.setState({ pendingCampaignBonus: response.campaign_bonus });
        }
        checkAdminStatus();
        setStatus('success');
        // Redirect to dashboard after short delay
        redirectTimer = setTimeout(
          () => navigate('/dashboard', { replace: true }),
          VERIFY_REDIRECT_MS,
        );
      } catch (err: unknown) {
        setStatus('error');
        setError(getApiErrorMessage(err, t('emailVerification.failed')));
      }
    };

    verify();

    return () => clearTimeout(redirectTimer);
  }, [searchParams, t, navigate, setTokens, setUser, checkAdminStatus]);

  return (
    <AuthShell>
      <AuthCard>
        {status === 'loading' && (
          <AuthStatusScreen
            state="loading"
            logo={brandLogo}
            title={t('emailVerification.verifying')}
            subtitle={t('emailVerification.pleaseWait')}
          />
        )}

        {status === 'success' && (
          <AuthStatusScreen
            state="success"
            title={t('emailVerification.success')}
            subtitle={t('emailVerification.redirecting', 'Redirecting to dashboard...')}
            redirectSeconds={VERIFY_REDIRECT_MS / 1000}
          />
        )}

        {status === 'error' && (
          <AuthStatusScreen state="error" title={t('emailVerification.failed')} subtitle={error}>
            <Link
              to="/login"
              className="flex h-[52px] w-full items-center justify-center rounded-full bg-mint text-sm font-bold text-bg transition-transform active:scale-[.98]"
            >
              {t('emailVerification.goToLogin')}
            </Link>
          </AuthStatusScreen>
        )}
      </AuthCard>
    </AuthShell>
  );
}
