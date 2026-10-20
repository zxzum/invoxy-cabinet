// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { AccountAccessReminder } from './AccountAccessReminder';

const api = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }));
vi.mock('@/api/client', () => ({ default: api }));
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback || key,
    i18n: { language: 'ru' },
  }),
}));

function page(userId: number | undefined) {
  return render(
    <MemoryRouter>
      <QueryClientProvider
        client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
      >
        <AccountAccessReminder userId={userId} />
      </QueryClientProvider>
    </MemoryRouter>,
  );
}

beforeEach(() => vi.resetAllMocks());
afterEach(cleanup);

it('shows a quiet card and dismisses it through the existing API', async () => {
  api.get
    .mockResolvedValueOnce({
      data: [
        {
          id: 3,
          title: 'Сохраните доступ',
          body: 'Добавьте почту',
          button: { kind: 'cabinet', target: '/profile/accounts', text: 'Добавить' },
        },
      ],
    })
    .mockResolvedValue({ data: [] });
  api.post.mockResolvedValue({});
  page(7);
  expect(await screen.findByRole('link', { name: 'Добавить' })).toHaveProperty(
    'pathname',
    '/profile/accounts',
  );
  fireEvent.click(screen.getByRole('button', { name: 'Больше не показывать' }));
  await waitFor(() => expect(screen.queryByText('Сохраните доступ')).toBeNull());
  expect(api.post).toHaveBeenCalledWith('/cabinet/reminders/3/dismiss');
});

it('does not fetch a reminder for a signed-out user', () => {
  page(undefined);
  expect(api.get).not.toHaveBeenCalled();
});

it('does not clutter the dashboard when the endpoint is unavailable', async () => {
  api.get.mockRejectedValue(new Error('offline'));
  const view = page(7);
  await waitFor(() => expect(api.get).toHaveBeenCalledTimes(1));
  expect(view.container.textContent).toBe('');
});
