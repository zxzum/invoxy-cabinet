// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ruLocale from '@/locales/ru.json';
import { PlatformProvider } from '@/platform/PlatformProvider';
import { TariffPaymentSheet } from './TariffPaymentSheet';

/**
 * Платёжный шит тарифа: показывает недостающую сумму (цена − баланс),
 * скрывает недоступные методы, по клику создаёт invoice через
 * subscriptionApi.createTariffInvoice и открывает платёжный URL.
 *
 * Провайдеры: usePlatform (внутри шита и ResponsiveSheet) требует
 * PlatformProvider; useCurrency — QueryClientProvider (useQuery курсов).
 * i18n замокан на ru.json — глобальная инициализация src/i18n.ts в граф
 * теста не попадает. jsdom не умеет matchMedia, его спрашивает
 * ResponsiveSheet, выбирая мобильную/десктопную ветку.
 */

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: unknown) =>
      resolveRu(key) ?? (typeof fallback === 'string' ? fallback : key),
    i18n: { language: 'ru', changeLanguage: () => Promise.resolve() },
  }),
  Trans: ({ children }: { children?: unknown }) => children ?? null,
  initReactI18next: { type: '3rdParty', init: () => {} },
}));

function resolveRu(key: string): string | undefined {
  const value = key
    .split('.')
    .reduce<unknown>((node, part) => (node as Record<string, unknown>)?.[part], ruLocale);
  return typeof value === 'string' ? value : undefined;
}

vi.mock('@/api/balance', () => ({
  balanceApi: {
    getPaymentMethods: vi.fn().mockResolvedValue([
      {
        id: 'yookassa',
        name: 'Банковская карта',
        description: null,
        min_amount_kopeks: 10000,
        max_amount_kopeks: 50000000,
        is_available: true,
      },
      {
        id: 'platega',
        name: 'Platega',
        description: null,
        min_amount_kopeks: 10000,
        max_amount_kopeks: 50000000,
        is_available: true,
        options: [
          { id: 'card', name: 'Карта', description: 'RUB · любой банк' },
          { id: 'sbp', name: 'СБП', description: 'По QR-коду' },
        ],
      },
      {
        id: 'cryptobot',
        name: 'CryptoBot',
        description: null,
        min_amount_kopeks: 10000,
        max_amount_kopeks: 50000000,
        is_available: false,
      },
    ]),
    getLatestPayment: vi.fn().mockResolvedValue(null),
    getBalance: vi.fn().mockResolvedValue({ balance_kopeks: 4000, balance_rubles: 40 }),
  },
}));

vi.mock('@/api/subscription', () => ({
  subscriptionApi: {
    createTariffInvoice: vi.fn().mockResolvedValue({
      payment_id: 'local-1',
      payment_url: 'https://pay.example/x',
      amount_kopeks: 5900,
      amount_rubles: 59,
      price_kopeks: 9900,
      balance_kopeks: 4000,
      method: 'yookassa',
    }),
  },
}));

vi.mock('@/utils/openPaymentUrl', () => ({
  openPaymentUrl: vi.fn(),
}));

// jsdom не реализует matchMedia; false → мобильная ветка ResponsiveSheet (Sheet).
if (!window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

afterEach(cleanup);

function renderSheet(props?: Partial<Parameters<typeof TariffPaymentSheet>[0]>) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const onPaid = vi.fn();
  render(
    <QueryClientProvider client={queryClient}>
      <PlatformProvider>
        <TariffPaymentSheet
          open
          onOpenChange={() => {}}
          tariffId={5}
          tariffName="Базовый"
          periodDays={30}
          priceKopeks={9900}
          balanceKopeks={4000}
          onPaid={onPaid}
          {...props}
        />
      </PlatformProvider>
    </QueryClientProvider>,
  );
  return { onPaid };
}

describe('TariffPaymentSheet', () => {
  it('shows the due amount and creates an invoice for the picked method', async () => {
    renderSheet();

    // Нехватка 59 ₽ видна в сводке
    await screen.findByText('Банковская карта');
    expect(screen.getAllByText(/59/).length).toBeGreaterThan(0);
    expect(screen.getByText('Стоимость тарифа')).toBeTruthy();
    expect(screen.getByText('Используем баланс')).toBeTruthy();
    // Недоступный метод не показан
    expect(screen.queryByText('CryptoBot')).toBeNull();

    fireEvent.click(screen.getByText('Банковская карта'));

    const { subscriptionApi } = await import('@/api/subscription');
    await waitFor(() =>
      expect(subscriptionApi.createTariffInvoice).toHaveBeenCalledWith(
        expect.objectContaining({ tariff_id: 5, period_days: 30, payment_method: 'yookassa' }),
      ),
    );

    // После создания invoice открывается платёжный URL
    const { openPaymentUrl } = await import('@/utils/openPaymentUrl');
    await waitFor(() => expect(openPaymentUrl).toHaveBeenCalled());
  });

  it('does not show a zero balance deduction', async () => {
    renderSheet({ balanceKopeks: 0 });

    await screen.findByText('Банковская карта');
    expect(screen.queryByText('Используем баланс')).toBeNull();
    expect(screen.getByText('К оплате')).toBeTruthy();
  });

  it('passes the selected provider option to the tariff invoice', async () => {
    const { subscriptionApi } = await import('@/api/subscription');
    vi.mocked(subscriptionApi.createTariffInvoice).mockClear();

    renderSheet();
    fireEvent.click(await screen.findByText('Platega'));
    fireEvent.click(await screen.findByText('СБП'));

    await waitFor(() =>
      expect(subscriptionApi.createTariffInvoice).toHaveBeenCalledWith(
        expect.objectContaining({ payment_method: 'platega', payment_option: 'sbp' }),
      ),
    );
  });

  it('renders inline without creating a second dialog', async () => {
    const onOpenChange = vi.fn();
    renderSheet({ embedded: true, onOpenChange });

    await screen.findByText('Банковская карта');
    expect(screen.queryByRole('dialog')).toBeNull();
    fireEvent.click(screen.getByText('Назад'));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('closes immediately on backdrop press; the sheet plays the exit itself', async () => {
    const onOpenChange = vi.fn();
    renderSheet({ onOpenChange });

    await screen.findByText('Банковская карта');
    fireEvent.click(document.querySelector('[data-sheet-backdrop]')!);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
