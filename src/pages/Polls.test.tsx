// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getPolls: vi.fn(),
  startPoll: vi.fn(),
  answerQuestion: vi.fn(),
}));

vi.mock('../api/polls', () => ({
  pollsApi: {
    getPolls: mocks.getPolls,
    startPoll: mocks.startPoll,
    answerQuestion: mocks.answerQuestion,
  },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'ru' },
  }),
}));

import PollsPage from './Polls';

function renderPolls() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/polls']}>
        <PollsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('polls API flow', () => {
  it('shows an error when starting a poll fails', async () => {
    mocks.getPolls.mockResolvedValue([
      {
        id: 3,
        response_id: 4,
        title: 'Unavailable poll',
        description: null,
        total_questions: 1,
        answered_questions: 0,
        is_completed: false,
        reward_amount: null,
      },
    ]);
    mocks.startPoll.mockRejectedValue(new Error('offline'));

    renderPolls();

    await screen.findByText('Unavailable poll');
    fireEvent.click(screen.getByRole('button', { name: 'polls.start' }));

    expect((await screen.findByRole('alert')).textContent).toContain('polls.error');
  });
});
