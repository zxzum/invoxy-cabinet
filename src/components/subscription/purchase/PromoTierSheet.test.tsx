// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { LoyaltyTiersResponse } from '@/api/promo';
import { PromoTierSheet } from './PromoTierSheet';

const getLoyaltyTiers = vi.hoisted(() => vi.fn<() => Promise<LoyaltyTiersResponse>>());

vi.mock('@/api/promo', () => ({
  promoApi: { getLoyaltyTiers },
}));

vi.mock('@/components/ui/ResponsiveSheet', () => ({
  ResponsiveSheet: ({
    isOpen,
    onClose,
    title,
    children,
  }: {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
  }) =>
    isOpen ? (
      <section aria-label={title} role="dialog">
        <button type="button" aria-label="Закрыть" onClick={onClose} />
        {children}
      </section>
    ) : null,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => {
      const values: Record<string, string> = {
        'subscription.promoGroup.tiersTitle': 'Статусы и скидки',
        'subscription.promoGroup.currentGroup': 'Ваша группа',
        'subscription.promoGroup.yourProgress': 'Ваш прогресс',
        'subscription.promoGroup.totalSpent': 'Потрачено',
        'subscription.promoGroup.currentStatus': 'Текущий статус',
        'subscription.promoGroup.nextStatus': 'Следующий статус',
        'subscription.promoGroup.toNextStatus': 'До следующего статуса',
        'subscription.promoGroup.allStatusesAchieved': 'Максимальный статус достигнут',
        'subscription.promoGroup.statusAchieved': 'Достигнут',
        'subscription.promoGroup.statusCurrent': 'Текущий',
        'subscription.promoGroup.statusLocked': 'Недоступен',
        'subscription.promoGroup.threshold': 'Порог',
        'subscription.promoGroup.discounts': 'Скидки',
        'subscription.promoGroup.serverDiscount': 'Серверы',
        'subscription.promoGroup.trafficDiscount': 'Трафик',
        'subscription.promoGroup.deviceDiscount': 'Устройства',
        'subscription.promoGroup.periodDiscount': `${options?.days} дн.`,
        'subscription.promoGroup.noDiscounts': 'Нет скидок',
        'subscription.promoGroup.basicName': 'Базовый юзер',
        'subscription.promoGroup.error': 'Не удалось загрузить статусы',
        'subscription.promoGroup.empty': 'Программа лояльности пока недоступна',
        'common.loading': 'Загрузка...',
        'common.close': 'Закрыть',
      };
      return values[key] ?? key;
    },
  }),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

beforeEach(() => {
  getLoyaltyTiers.mockResolvedValue({
    tiers: [
      {
        id: 10,
        name: 'Invoxy Friends',
        threshold_rubles: 2500,
        server_discount_percent: 3,
        traffic_discount_percent: 5,
        device_discount_percent: 0,
        period_discounts: { '30': 5 },
        is_current: true,
        is_achieved: true,
      },
      {
        id: 20,
        name: 'Invoxy VIP',
        threshold_rubles: 5000,
        server_discount_percent: 0,
        traffic_discount_percent: 7,
        device_discount_percent: 5,
        period_discounts: { '30': 10 },
        is_current: false,
        is_achieved: false,
      },
    ],
    current_spent_rubles: 3000,
    current_tier_name: 'Invoxy Friends',
    next_tier_name: 'Invoxy VIP',
    next_tier_threshold_rubles: 5000,
    progress_percent: 60,
  });
});

function renderSheet(isOpen = true, onClose = vi.fn()) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <QueryClientProvider client={queryClient}>
      <PromoTierSheet isOpen={isOpen} onClose={onClose} currentGroupName="Invoxy Friends" />
    </QueryClientProvider>,
  );
  return { onClose };
}

describe('PromoTierSheet', () => {
  it('does not request tiers while closed', () => {
    renderSheet(false);
    expect(getLoyaltyTiers).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('shows a loading state while the request is pending', () => {
    getLoyaltyTiers.mockReturnValue(new Promise(() => {}));
    renderSheet();
    expect(screen.getByRole('status', { name: 'Загрузка...' })).toBeTruthy();
  });

  it('renders the local Basic tier, API tiers, discounts, progress, and statuses', async () => {
    renderSheet();

    expect(await screen.findByText('Базовый юзер')).toBeTruthy();
    expect(screen.getAllByText('Invoxy Friends').length).toBeGreaterThan(0);
    expect(screen.getByText('Invoxy VIP')).toBeTruthy();
    expect(screen.getByText(/2[\s\u00a0]500/)).toBeTruthy();
    expect(screen.getByText(/5[\s\u00a0]000/)).toBeTruthy();
    expect(screen.getByText(/3[\s\u00a0]000/)).toBeTruthy();
    expect(screen.getByText('Трафик: -5%')).toBeTruthy();
    expect(screen.getByText('Серверы: -3%')).toBeTruthy();
    expect(screen.getByText('Устройства: -5%')).toBeTruthy();
    expect(screen.getByText('30 дн.: -10%')).toBeTruthy();
    expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('60');
    expect(screen.getByText('Текущий')).toBeTruthy();
    expect(screen.getByText('Достигнут')).toBeTruthy();
    expect(screen.getByText('Недоступен')).toBeTruthy();
    expect(
      screen.getAllByText((_, element) => element?.textContent?.includes('Ваша группа') ?? false)
        .length,
    ).toBeGreaterThan(0);
  });

  it('shows an empty state when the API has no public tiers', async () => {
    getLoyaltyTiers.mockResolvedValue({
      tiers: [],
      current_spent_rubles: 0,
      current_tier_name: null,
      next_tier_name: null,
      next_tier_threshold_rubles: null,
      progress_percent: 0,
    });
    renderSheet();
    expect(await screen.findByText('Программа лояльности пока недоступна')).toBeTruthy();
    expect(screen.getAllByText('Базовый юзер').length).toBeGreaterThan(0);
  });

  it('shows a request error inside the sheet', async () => {
    getLoyaltyTiers.mockRejectedValue(new Error('network'));
    renderSheet();
    expect((await screen.findByRole('alert')).textContent).toContain(
      'Не удалось загрузить статусы',
    );
  });

  it('passes the close action to the accessible sheet', async () => {
    const { onClose } = renderSheet();
    await screen.findByText('Базовый юзер');
    fireEvent.click(screen.getByRole('button', { name: 'Закрыть' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('keeps the query fresh for one minute', async () => {
    renderSheet();
    await screen.findByText('Базовый юзер');
    await waitFor(() => expect(getLoyaltyTiers).toHaveBeenCalledTimes(1));
  });
});
