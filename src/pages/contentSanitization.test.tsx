// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getPageBySlug: vi.fn(),
  getArticle: vi.fn(),
}));

vi.mock('../api/infoPages', () => ({ infoPagesApi: { getPageBySlug: mocks.getPageBySlug } }));
vi.mock('../api/news', () => ({ newsApi: { getArticle: mocks.getArticle } }));
vi.mock('../platform/hooks/usePlatform', () => ({
  usePlatform: () => ({
    capabilities: { hasBackButton: false },
    backButton: { show: vi.fn(), hide: vi.fn() },
  }),
}));
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'ru' },
  }),
}));

import InfoPageView from './InfoPageView';
import NewsArticlePage from './NewsArticle';

const unsafeContent = `
  <p>Safe content</p>
  <script>alert('xss')</script>
  <a href="https://example.test/docs">Safe link</a>
  <a href="javascript:alert('xss')">Unsafe link</a>
  <iframe src="https://evil.test/embed"></iframe>
  <iframe src="https://www.youtube.com/embed/video-id"></iframe>
`;

function renderRoute(path: string, element: React.ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/info/:slug" element={element} />
          <Route path="/news/:slug" element={element} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('content sanitization', () => {
  it('sanitizes rendered info page HTML and keeps only trusted embeds', async () => {
    mocks.getPageBySlug.mockResolvedValue({
      id: 1,
      slug: 'security',
      title: { ru: 'Security info' },
      content: { ru: unsafeContent },
      page_type: 'page',
      is_active: true,
      sort_order: 1,
      icon: null,
      replaces_tab: null,
      display_mode: 'both',
      created_at: '2026-09-14T00:00:00Z',
      updated_at: null,
    });

    renderRoute('/info/security', <InfoPageView />);

    expect(await screen.findByText('Security info')).toBeTruthy();
    expect(screen.getByText('Safe content')).toBeTruthy();
    expect(document.querySelector('script')).toBeNull();
    expect(document.querySelector('iframe[src="https://evil.test/embed"]')).toBeNull();
    expect(
      document
        .querySelector('iframe[src="https://www.youtube.com/embed/video-id"]')
        ?.getAttribute('sandbox'),
    ).toBe('allow-scripts allow-same-origin allow-presentation');
    expect(document.querySelector('a[href="https://example.test/docs"]')?.getAttribute('rel')).toBe(
      'noopener noreferrer',
    );
  });

  it('sanitizes rendered news article HTML and strips unsafe links and embeds', async () => {
    mocks.getArticle.mockResolvedValue({
      id: 2,
      title: 'Sanitized article',
      slug: 'sanitized-article',
      excerpt: null,
      content: unsafeContent,
      category: 'updates',
      category_color: '#a5e8c4',
      category_id: null,
      tag: null,
      tag_id: null,
      featured_image_url: null,
      is_published: true,
      is_featured: false,
      published_at: '2026-09-14T00:00:00Z',
      read_time_minutes: 2,
      views_count: 0,
    });

    renderRoute('/news/sanitized-article', <NewsArticlePage />);

    expect(await screen.findByText('Sanitized article')).toBeTruthy();
    expect(screen.getByText('Safe content')).toBeTruthy();
    expect(document.querySelector('script')).toBeNull();
    expect(document.querySelector('a[href^="javascript:"]')).toBeNull();
    expect(document.querySelector('iframe[src="https://evil.test/embed"]')).toBeNull();
    expect(
      document
        .querySelector('iframe[src="https://www.youtube.com/embed/video-id"]')
        ?.getAttribute('sandbox'),
    ).toBe('allow-scripts allow-same-origin allow-presentation');
  });
});
