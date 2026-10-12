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

it.each([true, false])(
  'shows the manual link without expanding anything (first=%s)',
  (firstConnection) => {
    render(
      <ConnectPanel
        accessLink="https://example.com/sub"
        firstConnection={firstConnection}
        onOpenGuide={vi.fn()}
      />,
    );
    const input = screen.getByRole('textbox', {
      name: 'invoxy.connect.manualKey',
    }) as HTMLInputElement;
    expect(input.value).toBe('https://example.com/sub');
    expect(input.readOnly).toBe(true);
    expect(screen.getByRole('button', { name: 'Copy' })).toBeTruthy();
  },
);
