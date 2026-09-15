// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import SavedCards from './SavedCards';

const mocks = vi.hoisted(() => ({
  getSavedCards: vi.fn(),
  deleteSavedCard: vi.fn(),
  getSubscriptions: vi.fn(),
  confirmDelete: vi.fn(),
  showToast: vi.fn(),
}));

vi.mock('../api/balance', () => ({
  balanceApi: {
    getSavedCards: mocks.getSavedCards,
    deleteSavedCard: mocks.deleteSavedCard,
  },
}));
vi.mock('../api/subscription', () => ({
  subscriptionApi: {
    getSubscriptions: mocks.getSubscriptions,
    getSbpRecurring: vi.fn(),
    cancelSbpRecurring: vi.fn(),
  },
}));
vi.mock('../components/Toast', () => ({
  useToast: () => ({ showToast: mocks.showToast }),
}));
vi.mock('../platform/hooks/useNativeDialog', () => ({
  useDestructiveConfirm: () => mocks.confirmDelete,
}));
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: unknown) => (typeof fallback === 'string' ? fallback : key),
  }),
}));
vi.mock('@/platform', () => ({
  usePlatform: () => ({ haptic: { impact: vi.fn() } }),
}));

function renderSavedCards() {
  return render(
    <MemoryRouter initialEntries={['/balance/saved-cards']}>
      <QueryClientProvider
        client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
      >
        <SavedCards />
      </QueryClientProvider>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.getSavedCards.mockResolvedValue({
    cards: [
      {
        id: 42,
        method_type: 'card',
        card_last4: '4242',
        card_type: 'Visa',
        title: null,
        created_at: '2026-09-10T12:00:00Z',
      },
    ],
    recurrent_enabled: true,
  });
  mocks.deleteSavedCard.mockResolvedValue(undefined);
  mocks.getSubscriptions.mockResolvedValue({ subscriptions: [] });
  mocks.confirmDelete.mockResolvedValue(true);
});

afterEach(cleanup);

describe('SavedCards target data presentation', () => {
  it('renders API cards in a glass panel and deletes by server id', async () => {
    renderSavedCards();

    const card = await screen.findByText('Visa *4242');
    expect(card.closest('.glass-panel')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'balance.savedCards.unlink' }));
    await waitFor(() => expect(mocks.deleteSavedCard).toHaveBeenCalledWith(42));
  });

  it('keeps an API empty response empty', async () => {
    mocks.getSavedCards.mockResolvedValue({ cards: [], recurrent_enabled: false });

    renderSavedCards();

    expect(await screen.findByText('balance.savedCards.empty')).toBeTruthy();
    expect(screen.queryByText(/4242|Visa/)).toBeNull();
  });

  it('shows the target error state when cards cannot be loaded', async () => {
    mocks.getSavedCards.mockRejectedValue(new Error('network'));

    renderSavedCards();

    expect(await screen.findByText('balance.savedCards.loadError')).toBeTruthy();
  });
});
