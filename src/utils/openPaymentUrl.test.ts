// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { openPaymentUrl } from './openPaymentUrl';

describe('openPaymentUrl', () => {
  const originalOpen = window.open;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    window.open = originalOpen;
  });

  it('calls openLink in Telegram environment and returns true', () => {
    const openLink = vi.fn();
    const result = openPaymentUrl('https://pay.example.com', 'telegram', openLink);
    expect(openLink).toHaveBeenCalledWith('https://pay.example.com');
    expect(result).toBe(true);
  });

  it('opens new tab via window.open on web and returns true when not blocked', () => {
    const openLink = vi.fn();
    const fakeWindow = { closed: false } as Window;
    window.open = vi.fn().mockReturnValue(fakeWindow);

    const result = openPaymentUrl('https://pay.example.com', 'web', openLink);
    expect(window.open).toHaveBeenCalledWith(
      'https://pay.example.com',
      '_blank',
      'noopener,noreferrer',
    );
    expect(openLink).not.toHaveBeenCalled();
    expect(result).toBe(true);
  });

  it('returns false when window.open is blocked by browser popup blocker', () => {
    const openLink = vi.fn();
    window.open = vi.fn().mockReturnValue(null);

    const result = openPaymentUrl('https://pay.example.com', 'web', openLink);
    expect(result).toBe(false);
  });

  it('rejects unsafe provider URLs before handing them to the platform', () => {
    const openLink = vi.fn();
    window.open = vi.fn();

    const result = openPaymentUrl('javascript:alert(1)', 'telegram', openLink);

    expect(result).toBe(false);
    expect(openLink).not.toHaveBeenCalled();
    expect(window.open).not.toHaveBeenCalled();
  });

  it.each(['ftp://pay.example.com/invoice', 'custom://pay.example.com/invoice'])(
    'rejects non-HTTP payment URLs: %s',
    (url) => {
      const openLink = vi.fn();
      window.open = vi.fn();

      const result = openPaymentUrl(url, 'telegram', openLink);

      expect(result).toBe(false);
      expect(openLink).not.toHaveBeenCalled();
      expect(window.open).not.toHaveBeenCalled();
    },
  );
});
