// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ToastProvider } from './Toast';
import { useSuccessNotification } from '../store/successNotification';
import SuccessNotificationModal from './SuccessNotificationModal';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
vi.mock('../hooks/useCurrency', () => ({
  useCurrency: () => ({ formatAmount: String, currencySymbol: '₽' }),
}));
vi.mock('../hooks/useTelegramSDK', () => ({
  useTelegramSDK: () => ({
    safeAreaInset: { bottom: 0 },
    contentSafeAreaInset: { bottom: 0 },
    isTelegramWebApp: false,
  }),
}));
vi.mock('../hooks/useFocusTrap', () => ({ useFocusTrap: () => ({ current: null }) }));
vi.mock('@/platform', () => ({
  useHaptic: () => ({ notification: vi.fn() }),
}));

afterEach(() => {
  cleanup();
  useSuccessNotification.getState().hide();
});

describe('SuccessNotificationModal', () => {
  it('shows a success toast for a completed purchase', async () => {
    render(
      <MemoryRouter>
        <ToastProvider>
          <SuccessNotificationModal />
        </ToastProvider>
      </MemoryRouter>,
    );

    useSuccessNotification.getState().show({ type: 'traffic_purchased', trafficGbAdded: 10 });

    expect((await screen.findByRole('status')).textContent).toContain(
      'successNotification.trafficPurchased.title',
    );
  });
});
