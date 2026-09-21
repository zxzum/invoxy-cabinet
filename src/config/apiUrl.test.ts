import { describe, expect, it } from 'vitest';
import { resolveApiBaseUrl } from './apiUrl';

describe('resolveApiBaseUrl', () => {
  it('uses the same-origin API path when no URL is configured', () => {
    expect(resolveApiBaseUrl(undefined, { isDev: false })).toBe('/api');
  });

  it('allows HTTPS API URLs in production', () => {
    expect(resolveApiBaseUrl('https://api.example.com/api', { isDev: false })).toBe(
      'https://api.example.com/api',
    );
  });

  it.each(['http://localhost:8000/api', 'http://127.0.0.1:8000/api', 'http://[::1]:8000/api'])(
    'allows loopback HTTP in development: %s',
    (url) => {
      expect(resolveApiBaseUrl(url, { isDev: true })).toBe(url);
    },
  );

  it.each([
    ['http://localhost:8000/api', false],
    ['http://api.example.com/api', true],
    ['ws://localhost:8000/api', true],
    ['wss://api.example.com/api', false],
    ['//api.example.com/api', false],
  ])('rejects insecure or unsupported API URL: %s', (url, isDev) => {
    expect(() => resolveApiBaseUrl(url, { isDev })).toThrow();
  });
});
