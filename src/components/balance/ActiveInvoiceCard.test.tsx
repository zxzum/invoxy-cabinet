// @vitest-environment jsdom
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ruLocale from '@/locales/ru.json';
import { ActiveInvoiceCard } from './ActiveInvoiceCard';
import type { PendingPayment } from '@/types';
import * as openPaymentUrlModule from '@/utils/openPaymentUrl';
import * as clipboardModule from '@/utils/clipboard';
import { balanceApi } from '@/api/balance';

function resolveRu(key: string): string | undefined {
  const parts = key.split('.');
  let cur: unknown = ruLocale;
  for (const p of parts) {
    if (cur && typeof cur === 'object' && p in cur) {
      cur = (cur as Record<string, unknown>)[p];
    } else {
      return undefined;
    }
  }
  return typeof cur === 'string' ? cur : undefined;
}

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, defaultVal?: unknown) =>
      resolveRu(key) ?? (typeof defaultVal === 'string' ? defaultVal : key),
  }),
}));

vi.mock('@/platform', () => ({
  usePlatform: () => ({
    platform: 'web',
    openLink: vi.fn(),
    haptic: { impact: vi.fn(), notification: vi.fn(), selection: vi.fn() },
  }),
  useHaptic: () => ({
    impact: vi.fn(),
    notification: vi.fn(),
    selection: vi.fn(),
  }),
}));

const mockShowToast = vi.fn();
vi.mock('@/components/Toast', () => ({
  useToast: () => ({
    showToast: mockShowToast,
  }),
}));

vi.mock('@/hooks/useCurrency', () => ({
  useCurrency: () => ({
    formatAmount: (val: number) => `${val}`,
    currencySymbol: '₽',
  }),
}));

vi.mock('@/api/balance', () => ({
  balanceApi: {
    getPendingPayments: vi.fn(),
    checkPaymentStatus: vi.fn(),
    cancelPendingPayment: vi.fn(),
  },
}));

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

const mockInvoice: PendingPayment = {
  id: 42,
  method: 'yookassa',
  method_display: 'ЮKassa',
  identifier: 'inv_42',
  amount_kopeks: 50000,
  amount_rubles: 500,
  status: 'pending',
  status_emoji: '⏳',
  status_text: 'Ожидает оплаты',
  is_paid: false,
  is_checkable: true,
  created_at: new Date().toISOString(),
  expires_at: new Date(Date.now() + 25 * 60 * 1000).toISOString(),
  payment_url: 'https://pay.example.com/inv_42',
  purpose: 'Пополнение баланса',
  purpose_code: 'topup',
  is_active: true,
  can_cancel: true,
};

describe('ActiveInvoiceCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders nothing when invoice is not active or null', () => {
    const expiredInvoice: PendingPayment = {
      ...mockInvoice,
      expires_at: new Date(Date.now() - 10000).toISOString(),
    };
    const { container } = renderWithClient(<ActiveInvoiceCard invoice={expiredInvoice} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders active invoice card with details', () => {
    renderWithClient(<ActiveInvoiceCard invoice={mockInvoice} />);

    expect(screen.getByText('Активный счёт')).toBeDefined();
    expect(screen.getByText('ЮKassa')).toBeDefined();
    expect(screen.getByText('Пополнение баланса')).toBeDefined();
    expect(screen.getByText('500')).toBeDefined();
    expect(screen.getByText('Оплатить')).toBeDefined();
    expect(screen.getByText('Скопировать ссылку')).toBeDefined();
    expect(screen.getByText('Проверить статус')).toBeDefined();
    expect(screen.getByText('Отменить счёт')).toBeDefined();
  });

  it('handles Pay / Open action', () => {
    const spy = vi.spyOn(openPaymentUrlModule, 'openPaymentUrl').mockReturnValue(true);
    renderWithClient(<ActiveInvoiceCard invoice={mockInvoice} />);

    const payButton = screen.getByText('Оплатить');
    fireEvent.click(payButton);

    expect(spy).toHaveBeenCalledWith('https://pay.example.com/inv_42', 'web', expect.any(Function));
  });

  it('displays popup blocked warning when openPaymentUrl returns false', async () => {
    vi.spyOn(openPaymentUrlModule, 'openPaymentUrl').mockReturnValue(false);
    renderWithClient(<ActiveInvoiceCard invoice={mockInvoice} />);

    const payButton = screen.getByText('Оплатить');
    fireEvent.click(payButton);

    await waitFor(() => {
      const msg = resolveRu('balance.pendingPayments.openBlocked');
      expect(screen.getByText(msg || '')).toBeDefined();
    });
  });

  it('handles Copy action with clipboard and toast feedback', async () => {
    const copySpy = vi.spyOn(clipboardModule, 'copyToClipboard').mockResolvedValue();
    renderWithClient(<ActiveInvoiceCard invoice={mockInvoice} />);

    const copyButton = screen.getByTitle('Скопировать ссылку');
    fireEvent.click(copyButton);

    expect(copySpy).toHaveBeenCalledWith('https://pay.example.com/inv_42');
    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith({
        type: 'success',
        message: 'Ссылка скопирована',
      });
    });
  });

  it('handles Check Status action', async () => {
    vi.mocked(balanceApi.checkPaymentStatus).mockResolvedValue({
      success: true,
      message: 'OK',
      payment: { ...mockInvoice, is_paid: true },
      status_changed: true,
      old_status: 'pending',
      new_status: 'succeeded',
    });
    const onPaidMock = vi.fn();
    renderWithClient(<ActiveInvoiceCard invoice={mockInvoice} onPaid={onPaidMock} />);

    const checkButton = screen.getByTitle('Проверить статус');
    fireEvent.click(checkButton);

    await waitFor(() => {
      expect(balanceApi.checkPaymentStatus).toHaveBeenCalledWith('yookassa', 42);
      expect(onPaidMock).toHaveBeenCalled();
      expect(mockShowToast).toHaveBeenCalledWith({
        type: 'success',
        message: 'Платёж подтверждён! Баланс пополнен.',
      });
    });
  });

  it('handles Cancel action with two-click confirmation', async () => {
    vi.mocked(balanceApi.cancelPendingPayment).mockResolvedValue({
      ...mockInvoice,
      status: 'canceled',
    });
    const onCancelledMock = vi.fn();
    renderWithClient(<ActiveInvoiceCard invoice={mockInvoice} onCancelled={onCancelledMock} />);

    // First click: prompts for confirmation
    const cancelTitle = resolveRu('balance.pendingPayments.cancel') || 'Отменить счёт';
    const cancelButton = screen.getByTitle(cancelTitle);
    fireEvent.click(cancelButton);

    const confirmText =
      resolveRu('balance.pendingPayments.confirmCancel') ||
      'Вы уверены? Нажмите ещё раз для отмены';
    expect(screen.getByText(confirmText)).toBeDefined();
    expect(balanceApi.cancelPendingPayment).not.toHaveBeenCalled();

    // Second click: executes cancellation
    const confirmButton = screen.getByText(confirmText);
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(balanceApi.cancelPendingPayment).toHaveBeenCalledWith('yookassa', 42);
      expect(onCancelledMock).toHaveBeenCalled();
      expect(mockShowToast).toHaveBeenCalledWith({
        type: 'info',
        message: 'Счёт отменён',
      });
    });
  });
});
