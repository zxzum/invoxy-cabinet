import type { ReactNode } from 'react';

export interface WelcomeAction {
  label: ReactNode;
  loadingLabel?: ReactNode;
  to?: string;
  onClick?: () => void;
}

export interface WelcomeStat {
  label: ReactNode;
  value: ReactNode;
}
