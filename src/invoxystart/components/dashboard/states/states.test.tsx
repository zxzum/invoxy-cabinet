// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { RenewalCard } from '../RenewalCard';
import { StartHero } from './StartHero';
import { AccessEndedCard } from './AccessEndedCard';
import type { RenewalBreakdown } from '@/invoxystart/lib/renewalBreakdown';

const navigate = vi.hoisted(() => vi.fn());

vi.mock('react-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-router')>()),
  useNavigate: () => navigate,
}));
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, unknown>) =>
      params ? `${key}:${JSON.stringify(params)}` : key,
  }),
}));
vi.mock('@/invoxystart/components/layout/ToastProvider', () => ({
  useToast: () => ({ showToast: vi.fn() }),
}));
vi.mock('@/invoxystart/components/ui/RuneIcon', () => {
  const Icon = () => <svg />;
  return { ArrowRight: Icon, ArrowUpRight: Icon, CalendarDays: Icon };
});

function wrap(node: ReactNode) {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter>{node}</MemoryRouter>
    </QueryClientProvider>,
  );
}

afterEach(() => {
  cleanup();
  navigate.mockReset();
});

const terms = [
  { id: '30', label: '30 дней', price: 3040 },
  { id: '90', label: '90 дней', price: 8800, discount: 5 },
];

describe('RenewalCard', () => {
  it('preselects a term when terms arrive after mount', () => {
    const onPay = vi.fn();
    const view = wrap(<RenewalCard terms={[]} onPay={onPay} />);
    expect(screen.getByRole('button', { name: 'invoxy.renewal.noTerms' })).toHaveProperty(
      'disabled',
      true,
    );
    view.rerender(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter>
          <RenewalCard terms={terms} highlightedId="90" onPay={onPay} />
        </MemoryRouter>
      </QueryClientProvider>,
    );
    const pay = screen.getByRole('button', { name: /invoxy\.renewal\.pay/ });
    expect(pay.textContent).toContain('8');
    fireEvent.click(pay);
    expect(onPay).toHaveBeenCalledWith(8800, '90 дней', '90');
  });

  it('explains extra devices in the renewal price', () => {
    const breakdown: RenewalBreakdown = {
      tariffId: 1,
      tariffName: 'Стандарт',
      baseDeviceLimit: 3,
      devicePrice: 30,
      periods: [
        {
          days: 30,
          total: 3040,
          tariffPrice: 200,
          extraDevicesCount: 97,
          extraDevicesCost: 2910,
          discountAmount: 0,
          discountPercent: 0,
        },
      ],
    };
    wrap(<RenewalCard terms={terms} breakdown={breakdown} onPay={vi.fn()} />);
    expect(screen.getByText('invoxy.renewal.tariffLine')).toBeTruthy();
    expect(screen.getByText(/invoxy\.renewal\.extraLine.*"count":97/)).toBeTruthy();
    expect(screen.getByText(/invoxy\.renewal\.extraWarning/)).toBeTruthy();
    expect(screen.getByRole('button', { name: /invoxy\.renewal\.limitReview/ })).toBeTruthy();
  });
});

describe('StartHero', () => {
  it('offers the trial as the single primary action', () => {
    const onActivate = vi.fn();
    wrap(
      <StartHero
        trialInfo={{ is_available: true, duration_days: 3, traffic_limit_gb: 10, device_limit: 3 }}
        activating={false}
        onActivateTrial={onActivate}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /invoxy\.start\.tryFree/ }));
    expect(onActivate).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole('button', { name: 'invoxy.start.orChooseTariff' }));
    expect(navigate).toHaveBeenCalledWith('/tariffs');
  });

  it('sends users without a trial straight to tariffs', () => {
    wrap(<StartHero trialInfo={null} activating={false} onActivateTrial={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /invoxy\.start\.chooseTariff/ }));
    expect(navigate).toHaveBeenCalledWith('/tariffs');
  });
});

describe('AccessEndedCard', () => {
  it('renews an expired paid subscription with its price', () => {
    const onRenew = vi.fn();
    wrap(
      <AccessEndedCard
        state="paid_expired"
        tariffName="Стандарт"
        renewal={{ price: 200, label: '30 дней' }}
        onRenew={onRenew}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /invoxy\.ended\.renew/ }));
    expect(onRenew).toHaveBeenCalledOnce();
  });

  it('routes an ended trial to tariffs', () => {
    wrap(<AccessEndedCard state="trial_expired" onRenew={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /invoxy\.ended\.chooseTariff/ }));
    expect(navigate).toHaveBeenCalledWith('/tariffs');
  });
});
