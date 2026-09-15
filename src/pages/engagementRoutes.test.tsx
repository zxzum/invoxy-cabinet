// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, useLocation, useSearchParams } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Profiler, StrictMode, type ReactNode } from 'react';

const mocks = vi.hoisted(() => ({
  getSupportConfig: vi.fn(),
  getTickets: vi.fn(),
  getTicket: vi.fn(),
  uploadMedia: vi.fn(),
  getMediaUrl: vi.fn(),
  getPolls: vi.fn(),
  startPoll: vi.fn(),
  answerQuestion: vi.fn(),
  getWheelConfig: vi.fn(),
  getWheelHistory: vi.fn(),
  getGiftStatus: vi.fn(),
  getTelegramWidgetConfig: vi.fn(),
}));

vi.mock('../api/info', () => ({ infoApi: { getSupportConfig: mocks.getSupportConfig } }));
vi.mock('../api/tickets', () => ({
  ticketsApi: {
    getTickets: mocks.getTickets,
    getTicket: mocks.getTicket,
    uploadMedia: mocks.uploadMedia,
    getMediaUrl: mocks.getMediaUrl,
  },
}));
vi.mock('../components/TicketNotificationBell', () => ({
  default: () => null,
}));
vi.mock('../api/polls', () => ({
  pollsApi: {
    getPolls: mocks.getPolls,
    startPoll: mocks.startPoll,
    answerQuestion: mocks.answerQuestion,
  },
}));
vi.mock('../api/wheel', () => ({
  wheelApi: {
    getConfig: mocks.getWheelConfig,
    getHistory: mocks.getWheelHistory,
    spin: vi.fn(),
    createStarsInvoice: vi.fn(),
  },
}));
vi.mock('../api/gift', () => ({ giftApi: { getPurchaseStatus: mocks.getGiftStatus } }));
vi.mock('../api/branding', () => ({
  brandingApi: { getTelegramWidgetConfig: mocks.getTelegramWidgetConfig },
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
  useHaptic: () => ({ impact: vi.fn(), notification: vi.fn(), selectionChanged: vi.fn() }),
  useNotify: () => ({ success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() }),
}));
vi.mock('../platform/hooks/usePlatform', () => ({
  usePlatform: () => ({
    capabilities: { hasBackButton: false },
    backButton: { show: vi.fn(), hide: vi.fn() },
  }),
}));
vi.mock('../platform/hooks/useNotify', () => ({
  useNotify: () => ({ success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() }),
}));
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { defaultValue?: string }) => options?.defaultValue ?? key,
    i18n: { language: 'ru' },
  }),
}));

function renderPage(page: ReactNode, path: string) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>{page}</MemoryRouter>
    </QueryClientProvider>,
  );
}

function TicketQueryNavigator() {
  const [, setSearchParams] = useSearchParams();
  return (
    <button type="button" onClick={() => setSearchParams({ ticket: '99' })}>
      navigate-to-missing-ticket
    </button>
  );
}

function SupportLocationProbe() {
  const location = useLocation();
  return <output data-testid="support-location">{location.search}</output>;
}

beforeEach(() => {
  mocks.getSupportConfig.mockResolvedValue({ tickets_enabled: true, support_type: 'tickets' });
  mocks.getTickets.mockResolvedValue({
    items: [
      {
        id: 42,
        title: 'Ticket 42',
        status: 'open',
        priority: 'normal',
        created_at: '2026-09-14T00:00:00Z',
        updated_at: '2026-09-14T00:00:00Z',
        closed_at: null,
        messages_count: 1,
        last_message: null,
      },
    ],
    total: 1,
    page: 1,
    per_page: 20,
    pages: 1,
  });
  mocks.getTicket.mockImplementation((id: number) =>
    Promise.resolve({
      id,
      title: `Ticket ${id}`,
      status: 'open',
      priority: 'normal',
      created_at: '2026-09-14T00:00:00Z',
      updated_at: '2026-09-14T00:00:00Z',
      closed_at: null,
      is_reply_blocked: false,
      messages: [],
    }),
  );
  mocks.getPolls.mockResolvedValue([
    {
      id: 1,
      response_id: 10,
      title: 'API poll',
      description: null,
      total_questions: 1,
      answered_questions: 0,
      is_completed: false,
      reward_amount: null,
    },
  ]);
  mocks.startPoll.mockResolvedValue({
    response_id: 10,
    current_question_index: 0,
    total_questions: 1,
    question: { id: 2, text: 'Choose', order: 0, options: [{ id: 3, text: 'Answer', order: 0 }] },
  });
  mocks.answerQuestion.mockResolvedValue({
    success: true,
    is_completed: true,
    next_question: null,
    current_question_index: null,
    total_questions: 1,
    reward_granted: 5,
    message: 'Completed from API',
  });
  mocks.getWheelConfig.mockReturnValue(new Promise(() => {}));
  mocks.getWheelHistory.mockResolvedValue({ items: [], total: 0, page: 1, per_page: 20, pages: 1 });
  mocks.getGiftStatus.mockResolvedValue({
    status: 'delivered',
    is_gift: true,
    is_code_only: false,
    is_claimable: false,
    purchase_token: null,
    recipient_contact_value: null,
    gift_message: null,
    tariff_name: 'API tariff',
    period_days: 30,
    warning: null,
  });
  mocks.getTelegramWidgetConfig.mockResolvedValue({ bot_username: '' });
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.restoreAllMocks();
  mocks.getWheelConfig.mockReset();
});

describe('support and activity flows', () => {
  it('opens the ticket addressed by ?ticket=id and keeps the target detail query', async () => {
    const { default: Support } = await import('./Support');
    renderPage(<Support />, '/support?ticket=42');

    expect((await screen.findAllByText('Ticket 42')).length).toBeGreaterThan(0);
    await waitFor(() => expect(mocks.getTicket).toHaveBeenCalledWith(42));
  });

  it('renders ticket media through the signed media URL API seam', async () => {
    mocks.getMediaUrl.mockReturnValue('/cabinet/media/photo-1?token=signed-token');
    mocks.getTicket.mockResolvedValue({
      id: 42,
      title: 'Ticket 42',
      status: 'open',
      priority: 'normal',
      created_at: '2026-09-14T00:00:00Z',
      updated_at: '2026-09-14T00:00:00Z',
      closed_at: null,
      is_reply_blocked: false,
      messages: [
        {
          id: 5,
          message_text: 'Attached photo',
          is_from_admin: true,
          has_media: true,
          media_type: 'photo',
          media_file_id: null,
          media_token: null,
          media_caption: null,
          media_items: [
            { type: 'photo', file_id: 'photo-1', token: 'signed-token', caption: 'Support photo' },
          ],
          created_at: '2026-09-14T00:00:00Z',
        },
      ],
    });
    const { default: Support } = await import('./Support');
    renderPage(<Support />, '/support?ticket=42');

    const image = await screen.findByAltText('Support photo');
    expect(image.getAttribute('src')).toBe('/cabinet/media/photo-1?token=signed-token');
    expect(mocks.getMediaUrl).toHaveBeenCalledWith('photo-1', 'signed-token');
  });

  it('lets a later query ticket replace stale selection even when it is absent from the first page', async () => {
    const { default: Support } = await import('./Support');
    renderPage(
      <>
        <Support />
        <TicketQueryNavigator />
      </>,
      '/support?ticket=42',
    );

    expect((await screen.findAllByText('Ticket 42')).length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole('button', { name: 'navigate-to-missing-ticket' }));

    await waitFor(() => expect(mocks.getTicket).toHaveBeenCalledWith(99));
    expect((await screen.findAllByText('Ticket 99')).length).toBeGreaterThan(0);
  });

  it('stably selects a deep-linked ticket outside the first page without a render loop', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const commitSpy = vi.fn();
    const { default: Support } = await import('./Support');
    renderPage(
      <StrictMode>
        <Profiler id="support-deep-link" onRender={commitSpy}>
          <Support />
        </Profiler>
      </StrictMode>,
      '/support?ticket=99',
    );

    await screen.findAllByText('Ticket 42');
    expect(await screen.findAllByText('Ticket 99')).toHaveLength(1);
    expect(mocks.getTicket).toHaveBeenCalledTimes(1);
    expect(
      errorSpy.mock.calls.some(([message]) => String(message).includes('Maximum update depth')),
    ).toBe(false);
    expect(commitSpy.mock.calls.length).toBeLessThan(5);
  });

  it('clears the ticket query when opening a new ticket form', async () => {
    const { default: Support } = await import('./Support');
    renderPage(
      <>
        <Support />
        <SupportLocationProbe />
      </>,
      '/support?ticket=42',
    );

    await screen.findAllByText('Ticket 42');
    fireEvent.click(screen.getByRole('button', { name: 'support.newTicket' }));

    await waitFor(() => expect(screen.getByTestId('support-location').textContent).toBe(''));
    expect(screen.getByText('support.createTicket')).toBeTruthy();
  });

  it('closes the new ticket form when in-place navigation targets a ticket', async () => {
    const { default: Support } = await import('./Support');
    renderPage(
      <>
        <Support />
        <TicketQueryNavigator />
      </>,
      '/support',
    );

    await screen.findAllByText('Ticket 42');
    fireEvent.click(screen.getByRole('button', { name: 'support.newTicket' }));
    expect(await screen.findByText('support.createTicket')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'navigate-to-missing-ticket' }));

    await waitFor(() => expect(mocks.getTicket).toHaveBeenCalledWith(99));
    expect(await screen.findAllByText('Ticket 99')).toHaveLength(1);
    expect(screen.queryByText('support.createTicket')).toBeNull();
  });

  it('shows a ticket list error instead of treating it as empty', async () => {
    mocks.getTickets.mockRejectedValue(new Error('ticket list failed'));
    const { default: Support } = await import('./Support');
    renderPage(<Support />, '/support');

    expect(await screen.findByText('common.error')).toBeTruthy();
  });

  it('preserves the poll completion message returned by the API', async () => {
    const { default: Polls } = await import('./Polls');
    renderPage(<Polls />, '/polls');

    await screen.findByText('API poll');
    fireEvent.click(screen.getByRole('button', { name: 'polls.start' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Answer' }));

    expect(await screen.findByText('Completed from API')).toBeTruthy();
  });
});

describe('wheel and gift status states', () => {
  it('keeps the wheel loading state while target config is pending', async () => {
    const { default: Wheel } = await import('./Wheel');
    renderPage(<Wheel />, '/wheel');

    expect(screen.getByRole('status').getAttribute('aria-busy')).toBe('true');
  });

  it.each([
    ['pending_activation', 'gift.pendingActivationTitle'],
    ['failed', 'gift.failedTitle'],
    ['delivered', 'gift.successTitle'],
  ])('renders the target gift %s state', async (status, heading) => {
    mocks.getGiftStatus.mockResolvedValue({
      status,
      is_gift: true,
      is_code_only: false,
      is_claimable: false,
      purchase_token: null,
      recipient_contact_value: null,
      gift_message: null,
      tariff_name: null,
      period_days: null,
      warning: null,
    });
    const { default: GiftResult } = await import('./GiftResult');
    renderPage(<GiftResult />, `/gift/result?token=${status}`);

    expect(await screen.findByText(heading)).toBeTruthy();
  });
});
