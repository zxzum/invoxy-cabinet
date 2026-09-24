import { useEffect, useRef, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, m } from 'framer-motion';
import { PiCheck, PiX } from 'react-icons/pi';
import { authApi } from '../api/auth';
import { getApiErrorMessage } from '../utils/api-error';
import { LockIcon } from '@/components/icons';
import { AuthShell } from '@/components/auth/AuthShell';
import { AuthCard } from '@/components/auth/AuthCard';
import { AuthInput } from '@/components/auth/AuthInput';
import { AuthAlert } from '@/components/auth/AuthAlert';
import { AuthSubmitButton } from '@/components/auth/AuthSubmitButton';
import { PasswordStrengthMeter } from '@/components/auth/PasswordStrengthMeter';
import { AuthStatusScreen } from '@/components/auth/AuthStatusScreen';
import brandLogo from '@/assets/logo.png';

const RESET_REDIRECT_MS = 2000;

export default function ResetPassword() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState<'form' | 'loading' | 'success' | 'error'>('form');
  const [error, setError] = useState('');
  // Track the post-success redirect timer so unmount cancels it instead of
  // firing navigate() on a torn-down component.
  const redirectTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    return () => {
      if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current);
    };
  }, []);

  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError(t('resetPassword.invalidToken', 'Invalid or missing reset token'));
      return;
    }

    if (password.length < 8) {
      setError(t('auth.passwordTooShort', 'Password must be at least 8 characters'));
      return;
    }

    if (password !== confirmPassword) {
      setError(t('auth.passwordMismatch', 'Passwords do not match'));
      return;
    }

    setStatus('loading');

    try {
      await authApi.resetPassword(token, password);
      setStatus('success');
      redirectTimerRef.current = setTimeout(
        () => navigate('/login', { replace: true }),
        RESET_REDIRECT_MS,
      );
    } catch (err: unknown) {
      setStatus('error');
      setError(getApiErrorMessage(err, t('common.error')));
    }
  };

  if (!token) {
    return (
      <AuthShell>
        <AuthCard>
          <AuthStatusScreen
            state="error"
            logo={brandLogo}
            title={t('resetPassword.invalidToken', 'Invalid reset link')}
            subtitle={t(
              'resetPassword.tokenExpiredOrInvalid',
              'This password reset link is invalid or has expired.',
            )}
          >
            <Link
              to="/login"
              className="flex h-[52px] w-full items-center justify-center rounded-full bg-mint text-sm font-bold text-bg transition-transform active:scale-[.98]"
            >
              {t('auth.backToLogin', 'Back to login')}
            </Link>
          </AuthStatusScreen>
        </AuthCard>
      </AuthShell>
    );
  }

  if (status === 'success') {
    return (
      <AuthShell>
        <AuthCard>
          <AuthStatusScreen
            state="success"
            title={t('resetPassword.success', 'Password changed!')}
            subtitle={t('resetPassword.redirectingToLogin', 'Redirecting to login...')}
            redirectSeconds={RESET_REDIRECT_MS / 1000}
          />
        </AuthCard>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <AuthCard>
        <div className="mb-6 flex items-center gap-3">
          <span className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/5">
            <img src={brandLogo} alt="" className="h-full w-full object-contain" />
          </span>
          <span className="text-lg font-bold text-ink">
            {import.meta.env.VITE_APP_NAME && import.meta.env.VITE_APP_NAME !== 'Cabinet'
              ? import.meta.env.VITE_APP_NAME
              : 'Invoxy VPN'}
          </span>
        </div>

        <h1 className="text-[28px] font-medium tracking-[-.04em] text-ink sm:text-[30px]">
          {t('resetPassword.title', 'Set new password')}
        </h1>
        <p className="mt-1.5 text-sm text-muted">
          {t('resetPassword.enterNewPassword', 'Enter your new password below.')}
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-3">
          <AuthInput
            icon={<LockIcon className="h-[17px] w-[17px]" />}
            id="password"
            label={t('auth.password', 'Password')}
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            value={password}
            onChange={setPassword}
            disabled={status === 'loading'}
            required
          />

          <AnimatePresence initial={false}>
            {password.length > 0 && (
              <m.div
                key="reset-strength"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                className="overflow-hidden"
              >
                <div className="pt-1">
                  <PasswordStrengthMeter password={password} />
                </div>
              </m.div>
            )}
          </AnimatePresence>

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
            disabled={status === 'loading'}
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
                  {passwordsMatch ? <PiCheck className="h-5 w-5" /> : <PiX className="h-5 w-5" />}
                </m.span>
              ) : undefined
            }
            required
          />

          <AnimatePresence initial={false}>
            {error && (
              <m.div
                key={error}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                className="overflow-hidden"
              >
                <AuthAlert>{error}</AuthAlert>
              </m.div>
            )}
          </AnimatePresence>

          <AuthSubmitButton loading={status === 'loading'} loadingText={t('common.loading')}>
            {t('resetPassword.setPassword', 'Set new password')}
          </AuthSubmitButton>
        </form>

        <div className="mt-5 text-center">
          <Link to="/login" className="text-sm text-muted transition-colors hover:text-ink">
            {t('auth.backToLogin', 'Back to login')}
          </Link>
        </div>
      </AuthCard>
    </AuthShell>
  );
}
