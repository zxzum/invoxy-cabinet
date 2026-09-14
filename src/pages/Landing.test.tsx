// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Landing from './Landing';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback ?? key,
  }),
}));

beforeEach(() => {
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

function renderLanding() {
  return render(
    <MemoryRouter>
      <Landing />
    </MemoryRouter>,
  );
}

describe('Landing', () => {
  it('uses configured branding and the configured Telegram CTA', () => {
    vi.stubEnv('VITE_APP_NAME', 'Configured Cabinet');
    vi.stubEnv('VITE_TELEGRAM_BOT_USERNAME', 'configured_bot');

    renderLanding();

    expect(screen.getAllByText('Configured Cabinet').length).toBeGreaterThan(0);
    expect(screen.getByRole('img', { name: 'Configured Cabinet' })).toBeTruthy();
    expect(
      screen
        .getAllByRole('link', { name: /telegram/i })
        .some((link) => link.getAttribute('href') === 'https://t.me/configured_bot'),
    ).toBe(true);
  });

  it('omits the direct Telegram CTA when no username is configured', () => {
    vi.stubEnv('VITE_APP_NAME', 'Configured Cabinet');
    vi.stubEnv('VITE_TELEGRAM_BOT_USERNAME', '');

    renderLanding();

    expect(screen.queryAllByRole('link', { name: /telegram/i })).toHaveLength(0);
  });

  it('does not render static business data or a fixed Telegram domain', () => {
    renderLanding();

    expect(screen.queryByText(/120 ₽|200 ₽|400 ₽|350 ГБ|750 ГБ|1000 ГБ/)).toBeNull();
  });
});
