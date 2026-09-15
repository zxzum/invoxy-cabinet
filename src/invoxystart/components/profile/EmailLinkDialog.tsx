import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Check, Mail } from '@/invoxystart/components/ui/RuneIcon';
import { AdaptiveDialog } from '@/invoxystart/components/ui/AdaptiveDialog';
import { ApiError, authApi } from '@/invoxystart/api';

export function EmailLinkDialog({
  open,
  onClose,
  onSent,
}: {
  open: boolean;
  onClose: () => void;
  onSent: () => void;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setEmail('');
    setPassword('');
    setConfirm('');
    setErrors({});
    setSent(false);
    setBusy(false);
  }, [open]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const next: Record<string, string> = {};
    if (!/^\S+@\S+\.\S+$/.test(email)) next.email = 'Введите корректный Email';
    if (password.length < 8) next.password = 'Минимум 8 символов';
    if (confirm !== password) next.confirm = 'Пароли не совпадают';
    setErrors(next);
    if (Object.keys(next).length) return;
    setBusy(true);
    try {
      const result = await authApi.registerEmail(email.trim(), password);
      if (result.merge_required) {
        setErrors({ form: 'Этот Email уже привязан к другому аккаунту.' });
        return;
      }
      setSent(true);
      onSent();
    } catch (error) {
      setErrors({ form: getErrorMessage(error) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <AdaptiveDialog open={open} onClose={onClose} titleId="email-link-title" maxWidth="max-w-xl">
      {sent ? (
        <div className="py-8 text-center">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-mint text-bg">
            <Check size={27} />
          </span>
          <h2 id="email-link-title" className="mt-5 text-2xl font-medium">
            Письмо отправлено
          </h2>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted">
            Перейдите по ссылке в письме, чтобы завершить привязку Email.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="button-lift mt-6 h-12 w-full rounded-full bg-mint text-sm font-bold text-bg"
          >
            Готово
          </button>
        </div>
      ) : (
        <>
          <div className="pr-12">
            <p className="flex items-center gap-2 text-[10px] font-bold tracking-[.15em] text-mint">
              <Mail size={14} /> ДАННЫЕ АККАУНТА
            </p>
            <h2 id="email-link-title" className="mt-2 text-2xl font-medium">
              Привязать Email
            </h2>
            <p className="mt-1 text-sm text-muted">Используйте почту для входа без Telegram.</p>
          </div>
          <form className="mt-6 space-y-4" onSubmit={submit} noValidate>
            <Field
              label="Email"
              type="email"
              value={email}
              onChange={setEmail}
              error={errors.email}
              autoComplete="email"
              placeholder="email@example.com"
            />
            <Field
              label="Пароль"
              type="password"
              value={password}
              onChange={setPassword}
              error={errors.password}
              autoComplete="new-password"
              placeholder="Минимум 8 символов"
            />
            <Field
              label="Подтвердите пароль"
              type="password"
              value={confirm}
              onChange={setConfirm}
              error={errors.confirm}
              autoComplete="new-password"
              placeholder="Повторите пароль"
            />
            {errors.form && (
              <p
                role="alert"
                className="rounded-2xl border border-red-300/20 bg-red-300/8 px-4 py-3 text-sm text-red-200"
              >
                {errors.form}
              </p>
            )}
            <button
              type="submit"
              disabled={busy}
              className="button-lift h-13 w-full rounded-full bg-mint text-sm font-bold text-bg disabled:cursor-wait disabled:opacity-50"
            >
              {busy ? 'Отправка…' : 'Отправить письмо подтверждения'}
            </button>
          </form>
        </>
      )}
    </AdaptiveDialog>
  );
}

function getErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    const detail =
      error.data && typeof error.data === 'object' && 'detail' in error.data
        ? (error.data as { detail?: unknown }).detail
        : null;
    if (typeof detail === 'string' && detail) return detail;
    if (
      detail &&
      typeof detail === 'object' &&
      'message' in detail &&
      typeof detail.message === 'string'
    )
      return detail.message;
  }
  return 'Не удалось отправить письмо. Попробуйте ещё раз.';
}

function Field({
  label,
  type,
  value,
  onChange,
  error,
  autoComplete,
  placeholder,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  autoComplete: string;
  placeholder: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold text-muted">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete={autoComplete}
        placeholder={placeholder}
        aria-invalid={Boolean(error)}
        className={`glass-control h-13 w-full rounded-2xl px-4 text-sm outline-none transition-colors placeholder:text-muted/60 ${error ? 'border-red-300/50' : 'focus:border-mint/60'}`}
      />
      {error && (
        <span role="alert" className="mt-1.5 block text-xs text-red-200">
          {error}
        </span>
      )}
    </label>
  );
}
