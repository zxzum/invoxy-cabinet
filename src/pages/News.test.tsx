// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, useLocation } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';

const { getNews } = vi.hoisted(() => ({ getNews: vi.fn() }));

vi.mock('../api/news', () => ({ newsApi: { getNews } }));

vi.mock('../platform/hooks/useHaptic', () => ({
  useHapticFeedback: () => ({
    buttonPress: vi.fn(),
    selectionChanged: vi.fn(),
  }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'ru' },
  }),
}));

function LocationProbe() {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}</div>;
}

function renderNews() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/news']}>
        <NewsPage />
        <LocationProbe />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

// The import stays below the mocks so NewsSection and the page share the mocked target API.
import NewsPage from './News';

afterEach(() => {
  cleanup();
  getNews.mockReset();
});

const article = {
  id: 7,
  title: 'API article',
  slug: 'api-article',
  excerpt: 'Returned by the cabinet API',
  category: 'updates',
  category_color: '#a5e8c4',
  category_id: null,
  tag: null,
  tag_id: null,
  featured_image_url: null,
  is_published: true,
  is_featured: false,
  published_at: '2026-09-14T00:00:00Z',
  read_time_minutes: 3,
  views_count: 0,
};

describe('protected news list', () => {
  it('renders returned articles and routes each slug to the canonical detail path', async () => {
    getNews.mockResolvedValue({ items: [article], total: 1, categories: ['updates'] });

    renderNews();

    expect(await screen.findByText('API article')).toBeTruthy();
    expect(getNews).toHaveBeenCalledWith({ limit: 6, offset: 0 });

    fireEvent.click(screen.getByRole('link', { name: /API article/ }));
    await waitFor(() =>
      expect(screen.getByTestId('location').textContent).toBe('/news/api-article'),
    );
  });

  it('shows loading, error, and empty API states without local fixtures', async () => {
    getNews.mockReturnValue(new Promise(() => {}));
    renderNews();
    expect(screen.getByRole('status').getAttribute('aria-busy')).toBe('true');

    cleanup();
    getNews.mockRejectedValue(new Error('offline'));
    renderNews();
    expect(await screen.findByText('common.error')).toBeTruthy();

    cleanup();
    getNews.mockResolvedValue({ items: [], total: 0, categories: [] });
    renderNews();
    expect(await screen.findByText('news.noNews')).toBeTruthy();
  });

  it('shows an explicit loading state while a filter query replaces the list', async () => {
    getNews.mockResolvedValueOnce({ items: [article], total: 1, categories: ['updates'] });
    getNews.mockReturnValueOnce(new Promise(() => {}));

    renderNews();
    await screen.findByText('API article');

    fireEvent.click(screen.getByRole('tab', { name: 'updates' }));

    await waitFor(() =>
      expect(getNews).toHaveBeenCalledWith({ category: 'updates', limit: 6, offset: 0 }),
    );
    expect(screen.getByRole('status').getAttribute('aria-busy')).toBe('true');
  });

  it('shows an explicit empty state when a later filter query has no articles', async () => {
    getNews.mockResolvedValueOnce({ items: [article], total: 1, categories: ['updates'] });
    getNews.mockResolvedValueOnce({ items: [], total: 0, categories: ['updates'] });

    renderNews();
    await screen.findByText('API article');

    fireEvent.click(screen.getByRole('tab', { name: 'updates' }));

    expect(await screen.findByText('news.noNews')).toBeTruthy();
  });

  it('shows an explicit error state when a later load-more query fails', async () => {
    getNews.mockResolvedValueOnce({ items: [article], total: 7, categories: [] });
    getNews.mockRejectedValueOnce(new Error('load more failed'));

    renderNews();
    await screen.findByText('API article');

    fireEvent.click(screen.getByRole('button', { name: 'news.loadMore' }));

    await waitFor(() =>
      expect(getNews).toHaveBeenCalledWith({ category: undefined, limit: 12, offset: 0 }),
    );
    expect(await screen.findByText('common.error')).toBeTruthy();
  });

  it('shows an explicit empty state when a later load-more query has no articles', async () => {
    getNews.mockResolvedValueOnce({ items: [article], total: 7, categories: [] });
    getNews.mockResolvedValueOnce({ items: [], total: 0, categories: [] });

    renderNews();
    await screen.findByText('API article');

    fireEvent.click(screen.getByRole('button', { name: 'news.loadMore' }));

    expect(await screen.findByText('news.noNews')).toBeTruthy();
  });
});
