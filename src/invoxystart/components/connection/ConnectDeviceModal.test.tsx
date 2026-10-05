// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { ConnectDeviceModal } from './ConnectDeviceModal';

vi.mock('@/invoxystart/components/ui/AdaptiveDialog', () => ({
  AdaptiveDialog: ({ open, children }: { open: boolean; children: React.ReactNode }) =>
    open ? <div role="dialog">{children}</div> : null,
}));
vi.mock('@/invoxystart/components/ui/LivelyCopyButton', () => ({
  LivelyCopyButton: ({ label }: { label: string }) => <button type="button">{label}</button>,
}));
vi.mock('@/utils/openDeepLink', () => ({ openDeepLink: vi.fn() }));
vi.mock('./invoxyDownloads', () => ({
  findInvoxyAsset: vi.fn(),
  useLatestInvoxyRelease: () => ({ release: null, status: 'idle', retry: vi.fn() }),
}));

afterEach(cleanup);

it('leads with one recommended app and keeps alternatives and manual setup optional', () => {
  render(
    <ConnectDeviceModal
      open
      onClose={vi.fn()}
      initialPlatform="ios"
      accessLink="https://example.com/sub"
    />,
  );

  expect(screen.getByRole('heading', { name: 'HAPP' })).toBeTruthy();
  expect(screen.queryByRole('heading', { name: 'INCY' })).toBeNull();
  expect(screen.getByRole('button', { name: /Подключить в HAPP/ })).toBeTruthy();
  expect(screen.queryByText('https://example.com/sub')).toBeNull();

  fireEvent.click(screen.getByText('Другие приложения'));
  expect(screen.getByRole('heading', { name: 'INCY' })).toBeTruthy();
  fireEvent.click(screen.getByText('Подключить вручную'));
  expect(screen.getByText('https://example.com/sub')).toBeTruthy();
});
