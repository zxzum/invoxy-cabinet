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

it('does not show a reduction action when the server says it is unavailable', async () => {
  getDeviceReductionInfo.mockResolvedValue({
    available: false,
    reason_code: 'at_minimum',
    current_device_limit: 15,
    min_device_limit: 15,
    can_reduce: 0,
    connected_devices_count: 0,
  });

  render(
    <QueryClientProvider client={new QueryClient()}>
      <ExtraDevicesNotice extraCount={10} monthlyCost={300} baseLimit={15} subscriptionId={7} />
    </QueryClientProvider>,
  );

  fireEvent.click(screen.getByRole('button', { name: /limitReview/ }));

  expect(await screen.findByRole('alert')).toBeTruthy();
  expect(screen.queryByRole('button', { name: /limitConfirmAction/ })).toBeNull();
});

it('prevents overlapping reduction availability checks', async () => {
  getDeviceReductionInfo.mockReturnValue(new Promise(() => {}));

  render(
    <QueryClientProvider client={new QueryClient()}>
      <ExtraDevicesNotice extraCount={10} monthlyCost={300} baseLimit={15} subscriptionId={7} />
    </QueryClientProvider>,
  );

  const reviewButton = screen.getByRole('button', { name: /limitReview/ });
  fireEvent.click(reviewButton);

  expect(reviewButton.hasAttribute('disabled')).toBe(true);
  fireEvent.click(reviewButton);
  expect(getDeviceReductionInfo).toHaveBeenCalledTimes(1);
});
