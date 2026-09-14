// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Support from './Support';

const mocks = vi.hoisted(() => ({
  getSupportConfig: vi.fn(),
  getTickets: vi.fn(),
  getTicket: vi.fn(),
  createTicket: vi.fn(),
  addMessage: vi.fn(),
  uploadMedia: vi.fn(),
  getMediaUrl: vi.fn(),
}));

vi.mock('../api/info', () => ({ infoApi: { getSupportConfig: mocks.getSupportConfig } }));
vi.mock('../api/tickets', () => ({
  ticketsApi: {
    getTickets: mocks.getTickets,
    getTicket: mocks.getTicket,
    createTicket: mocks.createTicket,
    addMessage: mocks.addMessage,
    uploadMedia: mocks.uploadMedia,
    getMediaUrl: mocks.getMediaUrl,
  },
}));
vi.mock('../store/auth', () => ({
  useAuthStore: (selector: (state: { isAdmin: boolean }) => unknown) =>
    selector({ isAdmin: false }),
}));
vi.mock('../platform', () => ({
  usePlatform: () => ({
    openTelegramLink: vi.fn(),
    openLink: vi.fn(),
    openInvoice: vi.fn(),
    haptic: { impact: vi.fn() },
    capabilities: { hasInvoice: false },
  }),
}));
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: unknown) => {
      const fallback = typeof options === 'string' ? options : undefined;
      const template =
        key === 'common.error'
          ? 'Unable to load support configuration'
          : key === 'support.contactSupport'
            ? 'Please contact {{username}} for support'
            : (fallback ?? key);
      const username =
        typeof options === 'object' && options !== null && 'username' in options
          ? String((options as { username?: unknown }).username ?? '')
          : '';
      return template.replace('{{username}}', username);
    },
    i18n: { language: 'en' },
  }),
}));

function renderSupport(path = '/support') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <Support />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  mocks.getSupportConfig.mockResolvedValue({ tickets_enabled: true, support_type: 'tickets' });
  mocks.getTickets.mockResolvedValue({ items: [], total: 0, page: 1, per_page: 20, pages: 0 });
  mocks.getTicket.mockResolvedValue(undefined);
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('Support configuration states', () => {
  it('blocks ticket UI and retries the support config query after failure', async () => {
    mocks.getSupportConfig
      .mockRejectedValueOnce(new Error('config failed'))
      .mockResolvedValueOnce({ tickets_enabled: true, support_type: 'tickets' });

    renderSupport();

    expect((await screen.findByRole('alert')).textContent).toContain(
      'Unable to load support configuration',
    );
    expect(screen.queryByRole('button', { name: 'support.newTicket' })).toBeNull();
    expect(mocks.getTickets).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));

    await screen.findByText('support.yourTickets');
    await waitFor(() => expect(mocks.getSupportConfig).toHaveBeenCalledTimes(2));
    expect(mocks.getTickets).toHaveBeenCalledTimes(1);
  });

  it('does not invent a support contact when the disabled config has none', async () => {
    mocks.getSupportConfig.mockResolvedValue({ tickets_enabled: false, support_type: 'profile' });

    renderSupport();

    await screen.findByText('support.title');

    expect(screen.getByText('support.ticketsDisabled')).toBeTruthy();
    expect(screen.queryByText(/@support/)).toBeNull();
    expect(screen.queryByRole('button', { name: 'support.contactUs' })).toBeNull();
  });
});
