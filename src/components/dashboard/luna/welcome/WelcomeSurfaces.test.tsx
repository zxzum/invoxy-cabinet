// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ReferralPromo } from './ReferralPromo';
import { StandardOffer } from './StandardOffer';
import { SupportStrip } from './SupportStrip';
import { TrialHero } from './TrialHero';

function CurrentPath() {
  return <output data-testid="current-path">{useLocation().pathname}</output>;
}

function renderSurfaces(children: React.ReactNode) {
  return render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <Routes>
        <Route
          path="*"
          element={
            <>
              {children}
              <CurrentPath />
            </>
          }
        />
      </Routes>
    </MemoryRouter>,
  );
}

afterEach(() => cleanup());

describe('Luna welcome surfaces', () => {
  it('renders caller-provided business values and assigned assets', () => {
    const onActivate = vi.fn();

    const { container } = renderSurfaces(
      <main>
        <TrialHero
          eyebrow="Trial access"
          title="Start safely"
          description="Caller-provided trial copy"
          stats={[
            { label: 'Duration', value: 'TRIAL_DURATION' },
            { label: 'Traffic', value: 'TRIAL_TRAFFIC' },
            { label: 'Devices', value: 'TRIAL_DEVICES' },
          ]}
          priceLabel="Trial price"
          price="TRIAL_PRICE"
          balanceLabel="Current balance"
          balance="BALANCE_VALUE"
          action={{ label: 'Activate trial', onClick: onActivate }}
        />
        <StandardOffer
          title="Standard offer"
          description="Caller-provided offer copy"
          price="OFFER_PRICE"
          priceLabel="per period"
          features={['OFFER_TERM', 'OFFER_TRAFFIC']}
          action={{ label: 'View plans', to: '/subscription/purchase' }}
        />
        <ReferralPromo
          title="Invite friends"
          description="Caller-provided referral copy"
          stats={[{ label: 'Invited', value: 'REFERRAL_COUNT' }]}
          action={{ label: 'Open referrals', to: '/referral' }}
        />
        <SupportStrip
          title="Need help?"
          description="Caller-provided support copy"
          action={{ label: 'Contact support', to: '/support' }}
        />
      </main>,
    );

    for (const value of [
      'TRIAL_DURATION',
      'TRIAL_TRAFFIC',
      'TRIAL_DEVICES',
      'TRIAL_PRICE',
      'BALANCE_VALUE',
      'OFFER_PRICE',
      'OFFER_TERM',
      'OFFER_TRAFFIC',
      'REFERRAL_COUNT',
    ]) {
      expect(screen.getByText(value)).toBeTruthy();
    }

    expect(container.innerHTML).toContain('/images/trial-card-bg.png');
    expect(container.innerHTML).toContain('/images/trial-ribbon.png');
    expect(container.innerHTML).toContain('/images/referral-network-bg.png');

    fireEvent.click(screen.getByRole('button', { name: 'Activate trial' }));
    expect(onActivate).toHaveBeenCalledTimes(1);
  });

  it('uses caller-provided routes for the offer, referral, and support actions', () => {
    renderSurfaces(
      <main>
        <StandardOffer
          title="Offer"
          description="Description"
          price="Price"
          action={{ label: 'View plans', to: '/subscription/purchase' }}
        />
        <ReferralPromo
          title="Referral"
          description="Description"
          stats={[]}
          action={{ label: 'Open referrals', to: '/referral' }}
        />
        <SupportStrip
          title="Support"
          description="Description"
          action={{ label: 'Contact support', to: '/support' }}
        />
      </main>,
    );

    fireEvent.click(screen.getByRole('link', { name: 'View plans' }));
    expect(screen.getByTestId('current-path').textContent).toBe('/subscription/purchase');

    fireEvent.click(screen.getByRole('link', { name: 'Open referrals' }));
    expect(screen.getByTestId('current-path').textContent).toBe('/referral');

    fireEvent.click(screen.getByRole('link', { name: 'Contact support' }));
    expect(screen.getByTestId('current-path').textContent).toBe('/support');
  });

  it('exposes loading, error, and disabled trial state accessibly', () => {
    const onActivate = vi.fn();

    renderSurfaces(
      <TrialHero
        eyebrow="Trial"
        title="Trial title"
        description="Trial description"
        stats={[]}
        action={{ label: 'Activate', loadingLabel: 'Activating', onClick: onActivate }}
        loading
        disabled
        error="Trial could not be activated"
      />,
    );

    const article = screen.getByRole('article', { name: 'Trial title' });
    expect(article.getAttribute('aria-busy')).toBe('true');
    expect(screen.getByRole('alert').textContent).toContain('Trial could not be activated');

    const button = screen.getByRole('button', { name: 'Activating' });
    expect((button as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(button);
    expect(onActivate).not.toHaveBeenCalled();
  });

  it('applies loading, error, and disabled state to routed surfaces', () => {
    const onReferralOpen = vi.fn();

    renderSurfaces(
      <main>
        <StandardOffer
          title="Offer"
          description="Description"
          price="Price"
          action={{ label: 'Open offer', loadingLabel: 'Loading offer', to: '/offer' }}
          loading
          error="Offer unavailable"
        />
        <ReferralPromo
          title="Referral"
          description="Description"
          stats={[]}
          action={{ label: 'Open referral', onClick: onReferralOpen }}
          disabled
          error="Referral unavailable"
        />
        <SupportStrip
          title="Support"
          description="Description"
          action={{ label: 'Open support', loadingLabel: 'Loading support', to: '/support' }}
          loading
          error="Support unavailable"
        />
      </main>,
    );

    expect(screen.getAllByRole('alert')).toHaveLength(3);
    expect(screen.getByRole('link', { name: 'Loading offer' }).getAttribute('aria-disabled')).toBe(
      'true',
    );
    expect(
      (screen.getByRole('button', { name: 'Open referral' }) as HTMLButtonElement).disabled,
    ).toBe(true);
    expect(screen.getByRole('link', { name: 'Loading support' }).getAttribute('aria-busy')).toBe(
      'true',
    );

    fireEvent.click(screen.getByRole('button', { name: 'Open referral' }));
    expect(onReferralOpen).not.toHaveBeenCalled();
  });
});
