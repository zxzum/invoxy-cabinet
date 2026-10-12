import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router';
import { animate, useReducedMotion } from 'framer-motion';
import { buyTarget, cabinetTarget, type LandingAuth } from './useLandingAuth';

export const focusRing =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint';

export const primaryButton = `btn-shine inline-flex h-12 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#a5e8c4] to-[#7fe3d6] px-6 text-sm font-semibold text-bg shadow-[0_8px_30px_-8px_rgba(165,232,196,0.6)] transition-[transform,box-shadow] duration-200 hover:shadow-[0_14px_40px_-8px_rgba(127,227,214,0.8)] active:scale-[0.98] ${focusRing}`;

export const quietButton = `inline-flex h-12 items-center justify-center gap-2 rounded-full border border-line bg-surface/70 px-6 text-sm font-semibold text-ink backdrop-blur transition-[transform,border-color,background-color] duration-200 hover:border-mint/60 hover:bg-surface-2 active:scale-[0.98] ${focusRing}`;

export function Arrow({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M3 8h10M9 4l4 4-4 4" />
    </svg>
  );
}

export function Check({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="m3.5 8.5 3 3 6-7" />
    </svg>
  );
}

export function BotLink({
  href,
  children,
  className,
  arrow = false,
}: {
  href: string | null;
  children: ReactNode;
  className: string;
  arrow?: boolean;
}) {
  if (!href) return null;
  return (
    <a href={href} target="_blank" rel="noreferrer noopener" className={className}>
      {children}
      {arrow ? <Arrow /> : null}
    </a>
  );
}

/** Eases a numeric value to its new target; the first render shows the target as is. */
export function useEasedNumber(target: number, duration = 0.45): number {
  const reduce = useReducedMotion();
  const [value, setValue] = useState(target);
  const current = useRef(target);

  useEffect(() => {
    if (reduce || current.current === target || current.current === 0) {
      current.current = target;
      setValue(target);
      return;
    }
    const controls = animate(current.current, target, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (latest) => {
        current.current = latest;
        setValue(latest);
      },
      onComplete: () => {
        current.current = target;
        setValue(target);
      },
    });
    return () => controls.stop();
  }, [target, duration, reduce]);

  return value;
}

/** Link to the purchase flow: tariffs when signed in, registration first for guests. */
export function BuyLink({
  auth,
  className,
  children,
  arrow = false,
}: {
  auth: LandingAuth;
  className: string;
  children: ReactNode;
  arrow?: boolean;
}) {
  const target = buyTarget(auth);
  return (
    <Link to={target.to} state={target.state} className={className}>
      {children}
      {arrow ? <Arrow /> : null}
    </Link>
  );
}

export function CabinetLink({
  auth,
  className,
  children,
  arrow = false,
}: {
  auth: LandingAuth;
  className: string;
  children: ReactNode;
  arrow?: boolean;
}) {
  const target = cabinetTarget(auth);
  return (
    <Link to={target.to} state={target.state} className={className}>
      {children}
      {arrow ? <Arrow /> : null}
    </Link>
  );
}

/** Number that GSAP counts up when it scrolls into view (the final value is already in the markup). */
export function CountUp({
  value,
  prefix = '',
  suffix = '',
  className,
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}) {
  const text = `${prefix}${new Intl.NumberFormat('ru-RU').format(value)}${suffix}`;
  return (
    <span
      data-count
      data-to={value}
      data-prefix={prefix}
      data-suffix={suffix}
      className={`tabular-nums ${className ?? ''}`}
    >
      {text}
    </span>
  );
}

export interface TitlePart {
  text: string;
  aurora?: boolean;
}

/** Headline split into words so GSAP can lift them out of a mask. */
export function SplitTitle({
  parts,
  mode,
  className,
  as: Tag = 'h2',
}: {
  parts: TitlePart[];
  mode: 'hero' | 'scroll';
  className?: string;
  as?: 'h1' | 'h2';
}) {
  return (
    <Tag data-split={mode} className={className}>
      {parts.map((part, partIndex) =>
        part.text
          .split(' ')
          .filter(Boolean)
          .map((word, wordIndex) => (
            <span key={`${partIndex}-${wordIndex}`}>
              <span className="w">
                <span data-w-i className={`w-i ${part.aurora ? 'text-aurora' : ''}`}>
                  {word}
                </span>
              </span>{' '}
            </span>
          )),
      )}
    </Tag>
  );
}
