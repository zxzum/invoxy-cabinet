// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getContests: vi.fn(),
  getContestGame: vi.fn(),
  submitAnswer: vi.fn(),
}));

vi.mock('../api/contests', () => ({
  contestsApi: {
    getContests: mocks.getContests,
    getContestGame: mocks.getContestGame,
    submitAnswer: mocks.submitAnswer,
  },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'ru' },
  }),
}));

function renderContests() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/contests']}>
        <ContestsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

import ContestsPage from './Contests';

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('contests API flow', () => {
  it('loads a contest, fetches its game, and submits the returned answer', async () => {
    mocks.getContests.mockResolvedValue([
      {
        id: 7,
        slug: 'api-contest',
        name: 'API contest',
        description: 'Returned by the contest API',
        prize_days: 5,
        is_available: true,
        already_played: false,
      },
    ]);
    mocks.getContestGame.mockResolvedValue({
      round_id: 9,
      game_type: 'blitz',
      game_data: { button_text: 'Answer from API' },
      instructions: 'Choose from API',
    });
    mocks.submitAnswer.mockResolvedValue({
      is_winner: true,
      message: 'Contest completed from API',
      prize_days: 5,
    });

    renderContests();

    await screen.findByText('API contest');
    fireEvent.click(screen.getByRole('button', { name: 'contests.play' }));
    expect(await screen.findByText('Choose from API')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Answer from API' }));

    await waitFor(() => expect(mocks.getContestGame.mock.calls[0]?.[0]).toBe(7));
    await waitFor(() =>
      expect(mocks.submitAnswer.mock.calls[0]?.slice(0, 2)).toEqual([9, 'blitz']),
    );
    expect(await screen.findByText('Contest completed from API')).toBeTruthy();
  });
});
