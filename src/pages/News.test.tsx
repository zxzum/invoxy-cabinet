// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, useLocation } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';

const { getNews } = vi.hoisted(() => ({ getNews: vi.fn() }));

vi.mock('../api/news', () => ({ newsApi: { getNews } }));
vi.mock('../components/TicketNotificationBell', () => ({
  default: () => <button aria-label="notifications" type="button" />,
}));
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: unknown) => (typeof fallback === 'string' ? fallback : key),
    i18n: { language: 'ru-RU' },
  }),
}));

import News from './News';

const article = {
  id: 7,
  title: 'API article',
  slug: 'api-article',
  excerpt: '<p>Returned by the <strong>cabinet API</strong></p>',
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

function LocationProbe() {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}</div>;
}

function renderNews() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/news']}>
        <News />
        <LocationProbe />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

afterEach(() => {
  cleanup();
  getNews.mockReset();
});

describe('modern protected news page', () => {
  it('renders the source-like header, search, category selector, and API cards', async () => {
    getNews.mockResolvedValue({ items: [article], total: 1, categories: ['updates'] });

    renderNews();

    expect(await screen.findByRole('heading', { name: 'Новости' })).toBeTruthy();
    expect(screen.getByPlaceholderText('Найти новость')).toBeTruthy();
    expect(screen.getByRole('combobox')).toBeTruthy();
    expect(await screen.findByText('API article')).toBeTruthy();
    expect(screen.getByText('Returned by the cabinet API')).toBeTruthy();
    expect(getNews).toHaveBeenCalledWith({ category: undefined, limit: 50, offset: 0 });

    fireEvent.change(screen.getByPlaceholderText('Найти новость'), {
      target: { value: 'cabinet api' },
    });
    expect(screen.getByText('API article')).toBeTruthy();

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'updates' } });
    await waitFor(() =>
      expect(getNews).toHaveBeenCalledWith({ category: 'updates', limit: 50, offset: 0 }),
    );
    expect(await screen.findByText('API article')).toBeTruthy();

    fireEvent.click(screen.getByRole('link', { name: 'Читать статью' }));
    expect(screen.getByTestId('location').textContent).toBe('/news/api-article');
  });

  it('shows API loading, error, and empty states', async () => {
    getNews.mockReturnValue(new Promise(() => {}));
    renderNews();
    expect(screen.getByRole('status').getAttribute('aria-busy')).toBe('true');

    cleanup();
    getNews.mockRejectedValue(new Error('offline'));
    renderNews();
    expect(await screen.findByText('Новости временно недоступны')).toBeTruthy();

    cleanup();
    getNews.mockResolvedValue({ items: [], total: 0, categories: [] });
    renderNews();
    expect(await screen.findByText('Пока нет публикаций')).toBeTruthy();
  });
});
