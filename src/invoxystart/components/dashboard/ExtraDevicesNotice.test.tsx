// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, expect, it, vi } from 'vitest';
import { ExtraDevicesNotice } from './ExtraDevicesNotice';

const getDeviceReductionInfo = vi.hoisted(() => vi.fn());
const reduceDevices = vi.hoisted(() => vi.fn());

vi.mock('@/invoxystart/api', () => ({
  subscriptionApi: { getDeviceReductionInfo, reduceDevices },
}));
vi.mock('@/invoxystart/components/layout/ToastProvider', () => ({
  useToast: () => ({ showToast: vi.fn() }),
}));
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, unknown>) =>
      params ? `${key}:${JSON.stringify(params)}` : key,
  }),
}));
vi.mock('@/invoxystart/components/ui/AdaptiveDialog', () => ({
  AdaptiveDialog: ({ open, children }: { open: boolean; children: React.ReactNode }) =>
    open ? <div role="dialog">{children}</div> : null,
}));

afterEach(() => {
  cleanup();
  getDeviceReductionInfo.mockReset();
  reduceDevices.mockReset();
});

it('explains disconnections and requires explicit confirmation before reducing the limit', async () => {
  getDeviceReductionInfo.mockResolvedValue({
    available: true,
    current_device_limit: 105,
    min_device_limit: 100,
    can_reduce: 5,
    connected_devices_count: 105,
  });
  reduceDevices.mockResolvedValue({ success: true, new_device_limit: 100 });

  render(
    <QueryClientProvider client={new QueryClient()}>
      <ExtraDevicesNotice extraCount={5} monthlyCost={150} baseLimit={100} subscriptionId={7} />
    </QueryClientProvider>,
  );

  fireEvent.click(screen.getByRole('button', { name: /limitReview/ }));
  expect(reduceDevices).not.toHaveBeenCalled();
  expect(await screen.findByText(/limitDisconnect.*"count":5/)).toBeTruthy();
  expect(screen.getByText('invoxy.renewal.limitNoRefund')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: /limitConfirmAction/ }));
  await waitFor(() => expect(reduceDevices).toHaveBeenCalledWith(100, 7));
});
