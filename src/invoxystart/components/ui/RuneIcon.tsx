import type { CSSProperties } from 'react';

const normalPaths = {
  ArrowRight: '/icons/runeicons/normal/arrows/arrow-right.svg',
  ArrowUpRight: '/icons/runeicons/normal/arrows/arrow-up-right.svg',
  ChevronLeft: '/icons/runeicons/normal/arrows/chevron-left.svg',
  ChevronRight: '/icons/runeicons/normal/arrows/chevron-right.svg',
  ChevronUp: '/icons/runeicons/normal/arrows/chevron-up.svg',
  Copy: '/icons/runeicons/normal/code/copy.svg',
  Link2: '/icons/runeicons/normal/code/link-2.svg',
  Paperclip: '/icons/runeicons/normal/documents/paperclip.svg',
  Laptop: '/icons/runeicons/normal/gadgets/laptop.svg',
  Smartphone: '/icons/runeicons/normal/gadgets/tablet.svg',
  LockKeyhole: '/icons/runeicons/normal/identity/lock.svg',
  LogOut: '/icons/runeicons/normal/identity/log-out.svg',
  ShieldCheck: '/icons/runeicons/normal/identity/shield-check.svg',
  Users: '/icons/runeicons/normal/identity/users.svg',
  Check: '/icons/runeicons/normal/indicators/check.svg',
  CheckCircle2: '/icons/runeicons/normal/indicators/circle-check.svg',
  UserRound: '/icons/runeicons/normal/indicators/circle-user.svg',
  Info: '/icons/runeicons/normal/indicators/info.svg',
  Minus: '/icons/runeicons/normal/indicators/minus.svg',
  Plus: '/icons/runeicons/normal/indicators/plus.svg',
  CirclePlus: '/icons/runeicons/normal/indicators/plus.svg',
  X: '/icons/runeicons/normal/indicators/x.svg',
  Layers: '/icons/runeicons/normal/layouts/layers-2.svg',
  Mail: '/icons/runeicons/normal/messaging/mail.svg',
  MessageCircle: '/icons/runeicons/normal/messaging/message-circle.svg',
  Send: '/icons/runeicons/normal/messaging/send.svg',
  Gauge: '/icons/runeicons/normal/metrics/activity.svg',
  SlidersHorizontal: '/icons/runeicons/normal/metrics/sliders-horizontal.svg',
  CreditCard: '/icons/runeicons/normal/money/credit-card.svg',
  Landmark: '/icons/runeicons/normal/money/credit-card.svg',
  Wallet: '/icons/runeicons/normal/money/wallet.svg',
  Globe2: '/icons/runeicons/normal/other/globe.svg',
  WifiOff: '/icons/runeicons/normal/other/wifi-low.svg',
  Zap: '/icons/runeicons/normal/other/zap.svg',
  Image: '/icons/runeicons/normal/playback/image.svg',
  CalendarDays: '/icons/runeicons/normal/schedule/calendar.svg',
  Headphones: '/icons/runeicons/normal/senses/ear.svg',
  House: '/icons/runeicons/normal/tools/house.svg',
  Share2: '/icons/runeicons/normal/tools/share-2.svg',
  Sparkles: '/icons/runeicons/normal/tools/sparkles.svg',
  Bot: '/icons/runeicons/normal/tools/sparkles.svg',
  Bell: '/icons/runeicons/normal/bell.svg',
} as const;

const fillPaths: Partial<Record<keyof typeof normalPaths, string>> = {
  House: '/icons/runeicons/fill/house.svg',
  Layers: '/icons/runeicons/fill/layers-2.svg',
  UserRound: '/icons/runeicons/fill/circle-user.svg',
  CheckCircle2: '/icons/runeicons/fill/circle-check.svg',
};

export type RuneIconVariant = 'normal' | 'fill';
export type RuneIconName = keyof typeof normalPaths;
export type RuneIconProps = {
  name: RuneIconName;
  size?: number | string;
  variant?: RuneIconVariant;
  className?: string;
  strokeWidth?: number;
};

export function RuneIcon({ name, size = 24, variant = 'normal', className = '' }: RuneIconProps) {
  const path = variant === 'fill' ? (fillPaths[name] ?? normalPaths[name]) : normalPaths[name];
  const mask = `url("${path}") center / contain no-repeat`;
  const style: CSSProperties = {
    width: size,
    height: size,
    mask,
    WebkitMask: mask,
  };

  return (
    <span
      aria-hidden="true"
      className={`inline-block shrink-0 bg-current align-middle ${className}`}
      style={style}
    />
  );
}

function createRuneIcon(name: RuneIconName) {
  return (props: Omit<RuneIconProps, 'name'>) => <RuneIcon name={name} {...props} />;
}

export const ArrowRight = createRuneIcon('ArrowRight');
export const ArrowUpRight = createRuneIcon('ArrowUpRight');
export const ChevronLeft = createRuneIcon('ChevronLeft');
export const ChevronRight = createRuneIcon('ChevronRight');
export const ChevronUp = createRuneIcon('ChevronUp');
export const Copy = createRuneIcon('Copy');
export const Link2 = createRuneIcon('Link2');
export const Paperclip = createRuneIcon('Paperclip');
export const Laptop = createRuneIcon('Laptop');
export const Smartphone = createRuneIcon('Smartphone');
export const LockKeyhole = createRuneIcon('LockKeyhole');
export const LogOut = createRuneIcon('LogOut');
export const ShieldCheck = createRuneIcon('ShieldCheck');
export const Users = createRuneIcon('Users');
export const Check = createRuneIcon('Check');
export const CheckCircle2 = createRuneIcon('CheckCircle2');
export const UserRound = createRuneIcon('UserRound');
export const Info = createRuneIcon('Info');
export const Minus = createRuneIcon('Minus');
export const Plus = createRuneIcon('Plus');
export const CirclePlus = createRuneIcon('CirclePlus');
export const X = createRuneIcon('X');
export const Layers = createRuneIcon('Layers');
export const Mail = createRuneIcon('Mail');
export const MessageCircle = createRuneIcon('MessageCircle');
export const Send = createRuneIcon('Send');
export const Gauge = createRuneIcon('Gauge');
export const SlidersHorizontal = createRuneIcon('SlidersHorizontal');
export const CreditCard = createRuneIcon('CreditCard');
export const Landmark = createRuneIcon('Landmark');
export const Wallet = createRuneIcon('Wallet');
export const Globe2 = createRuneIcon('Globe2');
export const WifiOff = createRuneIcon('WifiOff');
export const Zap = createRuneIcon('Zap');
export const Image = createRuneIcon('Image');
export const CalendarDays = createRuneIcon('CalendarDays');
export const Headphones = createRuneIcon('Headphones');
export const House = createRuneIcon('House');
export const Share2 = createRuneIcon('Share2');
export const Sparkles = createRuneIcon('Sparkles');
export const Bot = createRuneIcon('Bot');
export const Bell = createRuneIcon('Bell');
