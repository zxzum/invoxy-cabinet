import { useEffect, useState, type ReactNode } from 'react';
import BlockingPage, {
  type BlockingInfo,
  type BlockingType,
} from '@/invoxystart/pages/BlockingPage';

export interface BlockingEventDetail {
  type: BlockingType;
  info?: BlockingInfo;
}

export function BlockingGate({ children }: { children: ReactNode }) {
  const [blocked, setBlocked] = useState<BlockingEventDetail | null>(null);

  useEffect(() => {
    const show = (event: Event) => setBlocked((event as CustomEvent<BlockingEventDetail>).detail);
    const clear = () => setBlocked(null);
    window.addEventListener('invoxy:block', show);
    window.addEventListener('invoxy:unblock', clear);
    return () => {
      window.removeEventListener('invoxy:block', show);
      window.removeEventListener('invoxy:unblock', clear);
    };
  }, []);

  if (blocked)
    return (
      <BlockingPage
        type={blocked.type}
        info={blocked.info}
        onRetry={() => window.location.reload()}
      />
    );
  return children;
}
