// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { ConnectPanel } from './ConnectPanel';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
vi.mock('@/invoxystart/components/ui/LivelyCopyButton', () => ({
  LivelyCopyButton: () => <button type="button">Copy</button>,
}));

afterEach(cleanup);

it('gives a new subscriber one clear setup action', () => {
  const onOpenGuide = vi.fn();
  render(
    <ConnectPanel accessLink="https://example.com/sub" firstConnection onOpenGuide={onOpenGuide} />,
  );

  fireEvent.click(screen.getByRole('button', { name: 'invoxy.connect.setupFirst' }));
  expect(onOpenGuide).toHaveBeenCalledOnce();
  expect(screen.queryByRole('button', { name: 'invoxy.connect.happ' })).toBeNull();
});
