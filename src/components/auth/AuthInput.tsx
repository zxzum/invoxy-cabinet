import { useState, type InputHTMLAttributes, type ReactNode, type Ref } from 'react';
import { AnimatePresence, m } from 'framer-motion';
import { PiEye, PiEyeSlash } from 'react-icons/pi';

interface AuthInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'children'> {
  icon: ReactNode;
  /** Текст для sr-only label и placeholder по умолчанию. */
  label: string;
  onChange: (value: string) => void;
  /** Дополнение справа перед глазком: например, индикатор совпадения паролей. */
  right?: ReactNode;
}

/**
 * Поле формы авторизации: «стеклянный» контейнер, иконка слева, глазок для
 * пароля. Текст 16px на телефоне — iOS не приближает страницу при фокусе.
 * Структура label+sr-only сохраняет связь getByLabelText с точным названием.
 */
export function AuthInput({
  icon,
  label,
  type = 'text',
  placeholder,
  onChange,
  right,
  inputRef,
  ...inputProps
}: AuthInputProps & { inputRef?: Ref<HTMLInputElement> }) {
  const [showPassword, setShowPassword] = useState(false);
  const isPasswordField = type === 'password';
  const effectiveType = isPasswordField ? (showPassword ? 'text' : 'password') : type;

  return (
    <label
      htmlFor={inputProps.id}
      className="glass-control flex h-14 items-center gap-3 rounded-2xl px-4 transition-all duration-200 focus-within:border-mint/55 focus-within:shadow-[0_0_16px_rgba(6,214,160,0.12)]"
    >
      <span className="shrink-0 text-mint transition-transform duration-200" aria-hidden="true">
        {icon}
      </span>
      <span className="sr-only">{label}</span>
      <input
        {...inputProps}
        ref={inputRef}
        type={effectiveType}
        placeholder={placeholder ?? label}
        onChange={(event) => onChange(event.target.value)}
        className="h-full min-w-0 flex-1 bg-transparent text-[16px] text-ink outline-none placeholder:text-muted sm:text-sm"
      />
      {right}
      {isPasswordField && (
        <button
          type="button"
          tabIndex={-1}
          onClick={(e) => {
            e.preventDefault();
            setShowPassword((prev) => !prev);
          }}
          className="shrink-0 p-1 text-muted/60 transition-colors hover:text-mint focus:outline-none"
          title={showPassword ? 'Hide password' : 'Show password'}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          <AnimatePresence initial={false} mode="wait">
            <m.span
              key={showPassword ? 'eye' : 'eye-slash'}
              initial={{ opacity: 0, rotate: -30, scale: 0.6 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              exit={{ opacity: 0, rotate: 30, scale: 0.6 }}
              transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
              className="block"
            >
              {showPassword ? <PiEyeSlash className="h-5 w-5" /> : <PiEye className="h-5 w-5" />}
            </m.span>
          </AnimatePresence>
        </button>
      )}
    </label>
  );
}
