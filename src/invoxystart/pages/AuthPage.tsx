import { useState, type FormEvent, type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { ArrowRight, LockKeyhole, Mail, UserRound } from '@/invoxystart/components/ui/RuneIcon';
import { BrandLogo } from '../components/layout/BrandLogo';
import { authApi } from '@/invoxystart/api';
import { useAuth } from '@/invoxystart/auth';

type FormValues = Record<'name' | 'email' | 'password' | 'confirm', string>;
type Field = keyof FormValues;
type Errors = Partial<Record<Field, string>>;

export default function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const register = mode === 'register';
  const [forgot, setForgot] = useState(false);
  const [values, setValues] = useState<FormValues>({
    name: '',
    email: '',
    password: '',
    confirm: '',
  });
  const [errors, setErrors] = useState<Errors>({});
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitState, setSubmitState] = useState<'error' | 'success' | null>(null);
  const [notice, setNotice] = useState('');

  function validate(next: FormValues): Errors {
    const nextErrors: Errors = {};
    if (forgot) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(next.email.trim()))
        nextErrors.email = 'Введите корректный email';
      return nextErrors;
    }
    if (register && !next.name.trim()) nextErrors.name = 'Введите имя';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(next.email.trim()))
      nextErrors.email = 'Введите корректный email';
    if (next.password.length < 8)
      nextErrors.password = 'Пароль должен содержать минимум 8 символов';
    if (register && !next.confirm) nextErrors.confirm = 'Подтвердите пароль';
    else if (register && next.password !== next.confirm) nextErrors.confirm = 'Пароли не совпадают';
    return nextErrors;
  }

  function update(field: Field, value: string) {
    const next = { ...values, [field]: value };
    setValues(next);
    setErrors(validate(next));
    setSubmitState(null);
    setNotice('');
  }

  function blur(field: Field) {
    setTouched((current) => ({ ...current, [field]: true }));
    setErrors(validate(values));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validate(values);
    setErrors(nextErrors);
    setTouched({
      name: register && !forgot,
      email: true,
      password: !forgot,
      confirm: register && !forgot,
    });
    setSubmitted(true);
    if (Object.keys(nextErrors).length) {
      setSubmitState('error');
      return;
    }
    try {
      if (forgot) {
        await authApi.forgotPassword(values.email.trim());
        setNotice('Ссылка для восстановления отправлена на указанную почту');
      } else if (register) {
        await auth.registerWithEmail(values.email.trim(), values.password, values.name.trim());
        setNotice('Письмо для подтверждения отправлено');
      } else {
        await auth.loginWithEmail(values.email.trim(), values.password);
        navigate((location.state as { from?: string } | null)?.from || '/dashboard', {
          replace: true,
        });
        return;
      }
      setSubmitState('success');
    } catch (reason) {
      setNotice(reason instanceof Error ? reason.message : 'Не удалось выполнить запрос');
      setSubmitState('error');
    }
  }

  const errorFor = (field: Field) => (touched[field] || submitted ? errors[field] : undefined);

  return (
    <main className="auth-page relative isolate grid min-h-screen place-items-center overflow-hidden px-4 py-10 text-ink">
      <div className="glass-panel motion-card relative z-10 w-full max-w-[440px] rounded-[36px] p-6 sm:p-8">
        <Link to="/" className="inline-flex items-center gap-3 text-lg font-bold">
          <BrandLogo />
        </Link>
        <div className="mt-8">
          <h1 className="text-[34px] font-medium tracking-[-.045em]">
            {forgot ? 'Восстановить пароль' : register ? 'Создать аккаунт' : 'С возвращением'}
          </h1>
          <p className="mt-2 text-sm text-muted">
            {forgot
              ? 'Введите Email — мы отправим ссылку для восстановления'
              : register
                ? 'Один аккаунт для всех сервисов Invoxy'
                : 'Войдите в личный кабинет'}
          </p>
        </div>
        <form className="mt-7 space-y-3" onSubmit={submit} noValidate>
          {register && !forgot && (
            <AuthInput
              icon={<UserRound size={17} />}
              label="Имя"
              name="name"
              autoComplete="name"
              value={values.name}
              onChange={(value) => update('name', value)}
              onBlur={() => blur('name')}
              error={errorFor('name')}
            />
          )}
          <AuthInput
            icon={<Mail size={17} />}
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            value={values.email}
            onChange={(value) => update('email', value)}
            onBlur={() => blur('email')}
            error={errorFor('email')}
          />
          {!forgot && (
            <AuthInput
              icon={<LockKeyhole size={17} />}
              label="Пароль"
              name="password"
              type="password"
              autoComplete={register ? 'new-password' : 'current-password'}
              value={values.password}
              onChange={(value) => update('password', value)}
              onBlur={() => blur('password')}
              error={errorFor('password')}
            />
          )}
          {register && !forgot && (
            <AuthInput
              icon={<LockKeyhole size={17} />}
              label="Подтвердите пароль"
              name="confirm"
              type="password"
              autoComplete="new-password"
              value={values.confirm}
              onChange={(value) => update('confirm', value)}
              onBlur={() => blur('confirm')}
              error={errorFor('confirm')}
            />
          )}
          {submitState === 'error' && (
            <div
              role="alert"
              className="rounded-2xl border border-red-300/20 bg-red-300/8 px-4 py-3 text-sm text-red-200"
            >
              Проверьте данные в выделенных полях.
            </div>
          )}
          {submitState === 'success' && (
            <div
              role="status"
              aria-live="polite"
              className="rounded-2xl border border-mint/20 bg-mint/8 px-4 py-3 text-sm text-mint"
            >
              {notice}
            </div>
          )}
          <button
            type="submit"
            className="mt-2 flex h-13 w-full items-center justify-center gap-2 rounded-full bg-mint text-sm font-bold text-bg active:scale-[.98]"
          >
            {forgot ? 'Отправить ссылку' : register ? 'Регистрация' : 'Вход'}
            <ArrowRight size={17} />
          </button>
        </form>
        {register ? (
          <p className="mt-4 text-center text-xs leading-relaxed text-muted">
            После регистрации на вашу почту будет отправлено письмо для подтверждения
          </p>
        ) : (
          <button
            type="button"
            onClick={() => {
              setForgot((value) => !value);
              setErrors({});
              setTouched({});
              setSubmitted(false);
              setSubmitState(null);
              setNotice('');
            }}
            className="mt-4 w-full text-center text-sm text-muted hover:text-ink"
          >
            {forgot ? 'Вернуться ко входу' : 'Забыли пароль?'}
          </button>
        )}
        {!forgot && (
          <p className="mt-7 text-center text-sm text-muted">
            {register ? 'Уже есть аккаунт?' : 'Нет аккаунта?'}{' '}
            <Link className="font-semibold text-mint" to={register ? '/login' : '/register'}>
              {register ? 'Войти' : 'Регистрация'}
            </Link>
          </p>
        )}
      </div>
    </main>
  );
}

function AuthInput({
  icon,
  label,
  name,
  type = 'text',
  autoComplete,
  value,
  onChange,
  onBlur,
  error,
}: {
  icon: ReactNode;
  label: string;
  name: string;
  type?: string;
  autoComplete: string;
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  error?: string;
}) {
  const errorId = `${name}-error`;
  return (
    <div>
      <label
        className={`glass-control flex h-14 items-center gap-3 rounded-2xl px-4 focus-within:border-mint/55 ${error ? 'border-red-300/50' : ''}`}
      >
        <span className="text-mint">{icon}</span>
        <span className="sr-only">{label}</span>
        <input
          required
          minLength={type === 'password' ? 8 : undefined}
          name={name}
          type={type}
          autoComplete={autoComplete}
          placeholder={label}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted"
        />
      </label>
      {error && (
        <p id={errorId} role="alert" className="px-4 pt-1 text-xs text-red-200">
          {error}
        </p>
      )}
    </div>
  );
}
