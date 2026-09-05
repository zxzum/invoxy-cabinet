import type { ComponentType, ReactNode } from 'react';

type FeatureBadgeTone = 'info' | 'success' | 'warning';

const toneClasses: Record<FeatureBadgeTone, string> = {
  info: 'badge-info',
  success: 'badge-success',
  warning: 'badge-warning',
};

export interface FeatureBadgeProps {
  icon: ComponentType<{ className?: string }>;
  children: ReactNode;
  tone?: FeatureBadgeTone;
}

export function FeatureBadge({ icon: Icon, children, tone = 'info' }: FeatureBadgeProps) {
  return (
    <span className={`${toneClasses[tone]} gap-1.5 whitespace-nowrap`}>
      <Icon className="h-3.5 w-3.5" />
      {children}
    </span>
  );
}
