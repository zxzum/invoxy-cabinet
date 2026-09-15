// @vitest-environment jsdom
import { render, screen, cleanup } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Info from './Info';

const mocks = vi.hoisted(() => ({
  getFaqPages: vi.fn(),
  getRules: vi.fn(),
  getPrivacyPolicy: vi.fn(),
  getPublicOffer: vi.fn(),
  getRecurrentPayments: vi.fn(),
  getVisibility: vi.fn(),
  getTabReplacements: vi.fn(),
  getPages: vi.fn(),
  getLoyaltyTiers: vi.fn(),
}));

vi.mock('../api/info', () => ({
  infoApi: {
    getFaqPages: mocks.getFaqPages,
    getRules: mocks.getRules,
    getPrivacyPolicy: mocks.getPrivacyPolicy,
    getPublicOffer: mocks.getPublicOffer,
    getRecurrentPayments: mocks.getRecurrentPayments,
    getVisibility: mocks.getVisibility,
  },
}));
vi.mock('../api/infoPages', () => ({
  infoPagesApi: {
    getTabReplacements: mocks.getTabReplacements,
    getPages: mocks.getPages,
    getPageBySlug: vi.fn(),
  },
}));
vi.mock('../api/promo', () => ({ promoApi: { getLoyaltyTiers: mocks.getLoyaltyTiers } }));
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) =>
      ({
        'info.faq': 'FAQ',
        'info.rules': 'Rules',
        'info.privacy': 'Privacy',
        'info.offer': 'Offer',
        'info.loyalty': 'Loyalty',
        'footer.recurrent': 'Recurring payments',
        'info.title': 'Information',
      })[key] ??
      fallback ??
      key,
    i18n: { language: 'ru' },
  }),
}));
vi.mock('@/components/icons', () => {
  const Icon = () => <span aria-hidden="true" />;
  return {
    DocumentIcon: Icon,
    InfoIcon: Icon,
    QuestionIcon: Icon,
    ShieldIcon: Icon,
    StarIcon: Icon,
  };
});
vi.mock('@/components/ui/skeleton', () => ({
  Skeleton: () => <span role="status" />,
  SkeletonGroup: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

function renderInfo(initialEntry: string) {
  return render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/info" element={<Info />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.getFaqPages.mockResolvedValue([
    { id: 1, title: 'FAQ API question', content: '<p>FAQ API answer</p>', order: 1 },
  ]);
  mocks.getRules.mockResolvedValue({ content: '<p>Rules API content</p>', updated_at: null });
  mocks.getPrivacyPolicy.mockResolvedValue({
    content: '<p>Privacy API content</p>',
    updated_at: null,
  });
  mocks.getPublicOffer.mockResolvedValue({ content: '<p>Offer API content</p>', updated_at: null });
  mocks.getRecurrentPayments.mockResolvedValue({
    content: '<p>Recurring API content</p>',
    updated_at: null,
  });
  mocks.getVisibility.mockResolvedValue({
    faq: true,
    rules: true,
    privacy: true,
    offer: true,
    recurrent: true,
  });
  mocks.getTabReplacements.mockResolvedValue({
    faq: null,
    rules: null,
    privacy: null,
    offer: null,
  });
  mocks.getPages.mockResolvedValue([]);
  mocks.getLoyaltyTiers.mockResolvedValue({ tiers: [] });
});

afterEach(() => cleanup());

describe('Info tab query deep links', () => {
  it('opens the rules tab from the public legal navigation target', async () => {
    renderInfo('/info?tab=rules');

    expect(await screen.findByText('Rules API content')).toBeTruthy();
    expect(mocks.getRules).toHaveBeenCalledTimes(1);
    expect(mocks.getFaqPages).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Rules' }).className).toContain('bg-accent-500');
  });

  it('falls back to FAQ for an unsupported tab query', async () => {
    renderInfo('/info?tab=not-a-supported-tab');

    expect(await screen.findByText('FAQ API question')).toBeTruthy();
    expect(mocks.getFaqPages).toHaveBeenCalledTimes(1);
    expect(mocks.getRules).not.toHaveBeenCalled();
  });

  it('opens the recurrent payments tab from its deep link', async () => {
    renderInfo('/info?tab=recurrent');

    expect(await screen.findByText('Recurring API content')).toBeTruthy();
    expect(mocks.getRecurrentPayments).toHaveBeenCalledTimes(1);
    expect(mocks.getFaqPages).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Recurring payments' }).className).toContain(
      'bg-accent-500',
    );
  });
});
