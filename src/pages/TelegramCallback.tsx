import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/auth';
import { useLegalConsentGate } from '../hooks/useLegalConsentGate';
import LegalConsentGate from '../components/LegalConsentGate';
import { getApiErrorMessage } from '../utils/api-error';
import { AuthShell } from '@/components/auth/AuthShell';
import { AuthCard } from '@/components/auth/AuthCard';
import { AuthStatusScreen } from '@/components/auth/AuthStatusScreen';
import brandLogo from '@/assets/logo.png';

export default function TelegramCallback() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState('');
  const loginWithTelegramWidget = useAuthStore((state) => state.loginWithTelegramWidget);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const consent = useLegalConsentGate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
      return;
    }

    const authenticate = async () => {
      // Get auth data from URL params
      const id = searchParams.get('id');
      const firstName = searchParams.get('first_name');
      const lastName = searchParams.get('last_name');
      const username = searchParams.get('username');
      const photoUrl = searchParams.get('photo_url');
      const authDate = searchParams.get('auth_date');
      const hash = searchParams.get('hash');

      // Validate required fields
      if (!id || !firstName || !authDate || !hash) {
        setError(t('auth.telegramRequired'));
        return;
      }

      // Parse and validate numeric fields
      const parsedId = parseInt(id, 10);
      const parsedAuthDate = parseInt(authDate, 10);

      if (Number.isNaN(parsedId) || Number.isNaN(parsedAuthDate)) {
        setError(t('auth.telegramRequired'));
        return;
      }

      const widgetData = {
        id: parsedId,
        first_name: firstName,
        last_name: lastName || undefined,
        username: username || undefined,
        photo_url: photoUrl || undefined,
        auth_date: parsedAuthDate,
        hash: hash,
      };

      try {
        await loginWithTelegramWidget(widgetData);
        navigate('/dashboard');
      } catch (err: unknown) {
        // Новый пользователь без согласия: бэк ответил 428, показываем чекбоксы
        // и повторяем тот же payload виджета с галочками.
        const needsConsent = consent.capture(err, async (accepted) => {
          await loginWithTelegramWidget(widgetData, accepted);
          navigate('/dashboard');
        });
        if (needsConsent) return;
        setError(getApiErrorMessage(err, t('common.error')));
      }
    };

    authenticate();
  }, [searchParams, loginWithTelegramWidget, navigate, isAuthenticated, t, consent.capture]);

  if (consent.pending) {
    return (
      <AuthShell>
        <AuthCard>
          <LegalConsentGate gate={consent} framed={false} />
        </AuthCard>
      </AuthShell>
    );
  }

  if (error) {
    return (
      <AuthShell>
        <AuthCard>
          <AuthStatusScreen state="error" title={t('auth.loginFailed')} subtitle={error}>
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="flex h-[52px] w-full items-center justify-center rounded-full bg-mint text-sm font-bold text-bg transition-transform active:scale-[.98]"
            >
              {t('auth.tryAgain')}
            </button>
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
