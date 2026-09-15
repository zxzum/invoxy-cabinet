import * as React from 'react';
import { cn } from '@/invoxystart/lib/utils';

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('glass-panel rounded-[24px]', className)} {...props} />
  ),
);
Card.displayName = 'Card';

export { Card };
