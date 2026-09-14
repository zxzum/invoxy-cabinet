// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, useLocation } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getUnreadCount: vi.fn(),
  getNotifications: vi.fn(),
  markAsRead: vi.fn(),
}));

vi.mock('../api/ticketNotifications', () => ({
  ticketNotificationsApi: {
    getUnreadCount: mocks.getUnreadCount,
    getNotifications: mocks.getNotifications,
    markAsRead: mocks.markAsRead,
    markAllAsRead: vi.fn(),
  },
}));
vi.mock('../store/auth', () => ({
  useAuthStore: (selector: (state: { isAuthenticated: boolean }) => unknown) =>
    selector({ isAuthenticated: true }),
}));
vi.mock('../components/Toast', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../hooks/useWebSocket', () => ({ useWebSocket: vi.fn() }));
vi.mock('../hooks/useHeaderHeight', () => ({
  useHeaderHeight: () => ({ mobile: 0, isMobileFullscreen: false }),
}));
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'ru' },
  }),
}));

import TicketNotificationBell from './TicketNotificationBell';

function LocationProbe() {
  const location = useLocation();
  return (
    <output data-testid="location">
      {location.pathname}
      {location.search}
    </output>
  );
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('ticket notification bell', () => {
  it('shows unread count, loads notifications, marks one read, and opens its ticket', async () => {
    mocks.getUnreadCount.mockResolvedValue({ unread_count: 2 });
    mocks.getNotifications.mockResolvedValue({
      items: [
        {
          id: 11,
          ticket_id: 42,
          notification_type: 'admin_reply',
          message: 'Support replied',
          is_read: false,
          created_at: '2026-09-14T00:00:00Z',
          read_at: null,
        },
      ],
      unread_count: 1,
    });
    mocks.markAsRead.mockResolvedValue({ success: true });

    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={['/dashboard']}>
          <TicketNotificationBell />
          <LocationProbe />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(await screen.findByText('2')).toBeTruthy();
    fireEvent.click(screen.getByTitle('notifications.ticketNotifications'));
    expect(await screen.findByText('Support replied')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /Support replied/ }));

    await waitFor(() => expect(mocks.markAsRead.mock.calls[0]?.[0]).toBe(11));
    expect(screen.getByTestId('location').textContent).toBe('/support?ticket=42');
  });
});
