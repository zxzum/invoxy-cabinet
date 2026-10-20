// @vitest-environment jsdom
import { cleanup, fireEvent, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { analyticsPage, trackCabinetEvent, useUmamiAnalytics } from './useUmamiAnalytics';

const ID = '450b174a-0684-4631-9edf-6b5aca91db04';
const track = vi.fn().mockResolvedValue(undefined);

function Counter({ id = ID }: { id?: string }) {
  useUmamiAnalytics(id);
  return (
    <>
      <a href="/tariffs">Tariffs</a>
      <a href="https://pay.example.test/?token=secret">Pay</a>
    </>
  );
}

beforeEach(() => {
  track.mockClear();
  vi.stubGlobal('umami', { track });
  Object.defineProperty(navigator, 'doNotTrack', { value: '0', configurable: true });
  window.history.replaceState({}, '', '/tariffs?token=secret#telegram-data');
  document.title = 'alice@example.test';
});
afterEach(() => {
  cleanup();
  document.getElementById('invoxy-umami')?.remove();
  vi.unstubAllGlobals();
});

describe('Umami privacy boundary', () => {
  it('only tracks known customer routes and removes subscription IDs', () => {
    expect(analyticsPage('/subscriptions/1234')).toBe('/subscriptions/:id');
    expect(analyticsPage('/admin/users/1234')).toBeNull();
    expect(analyticsPage('/auth/callback/secret')).toBeNull();
    expect(analyticsPage('/merge/secret')).toBeNull();
  });

  it('sends pageviews and named actions without URL secrets or page content', () => {
    const view = render(
      <MemoryRouter initialEntries={['/tariffs']}>
        <Counter />
      </MemoryRouter>,
    );
    const script = document.getElementById('invoxy-umami');
    if (!script) throw new Error('Tracker script was not loaded');
    expect(script.getAttribute('src')).toBe('https://cloud.umami.is/script.js');
    expect(script.getAttribute('data-auto-track')).toBe('false');
    fireEvent.load(script);
    trackCabinetEvent('checkout_opened');
    fireEvent.click(view.getByText('Tariffs'));
    expect(track).toHaveBeenCalledTimes(3);
    expect(track.mock.calls[0][0]).toMatchObject({ website: ID, url: '/tariffs', referrer: '' });
    expect(track.mock.calls[1][0].name).toBe('checkout_opened');
    const payloads = JSON.stringify(track.mock.calls);
    expect(payloads).not.toContain('secret');
    expect(payloads).not.toContain('alice');
    expect(payloads).not.toContain('telegram-data');
  });

  it('does not load for Do Not Track or an invalid website ID', () => {
    Object.defineProperty(navigator, 'doNotTrack', { value: '1', configurable: true });
    const view = render(
      <MemoryRouter>
        <Counter />
      </MemoryRouter>,
    );
    expect(document.getElementById('invoxy-umami')).toBeNull();
    view.unmount();
    Object.defineProperty(navigator, 'doNotTrack', { value: '0', configurable: true });
    render(
      <MemoryRouter>
        <Counter id="https://evil.test" />
      </MemoryRouter>,
    );
    expect(document.getElementById('invoxy-umami')).toBeNull();
    expect(track).not.toHaveBeenCalled();
  });

  it('does not collect admin pageviews and tolerates a blocked tracker', () => {
    render(
      <MemoryRouter initialEntries={['/admin/users']}>
        <Counter />
      </MemoryRouter>,
    );
    const script = document.getElementById('invoxy-umami');
    if (!script) throw new Error('Tracker script was not loaded');
    fireEvent.load(script);
    expect(track).not.toHaveBeenCalled();
    track.mockImplementationOnce(() => {
      throw new Error('blocked');
    });
    expect(() => trackCabinetEvent('checkout_opened')).not.toThrow();
  });
});
