import { describe, it, expect, vi, afterEach } from 'vitest';
import { ticketsApi } from './tickets';

describe('ticketsApi.getMediaUrl', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('constructs correct media url with default API base /api and token', () => {
    vi.stubEnv('VITE_API_URL', '');
    const url = ticketsApi.getMediaUrl('file_abc_123', 'exp.token_sig');
    expect(url).toBe('/api/cabinet/media/file_abc_123?token=exp.token_sig');
  });

  it('constructs correct media url without token', () => {
    vi.stubEnv('VITE_API_URL', '');
    const url = ticketsApi.getMediaUrl('file_abc_123');
    expect(url).toBe('/api/cabinet/media/file_abc_123');
  });

  it('encodes file_id and token properly', () => {
    vi.stubEnv('VITE_API_URL', '');
    const url = ticketsApi.getMediaUrl('file+test/1', 'token with spaces');
    expect(url).toBe('/api/cabinet/media/file%2Btest%2F1?token=token%20with%20spaces');
  });

  it('respects configured custom VITE_API_URL', () => {
    vi.stubEnv('VITE_API_URL', 'https://api.example.com');
    const url = ticketsApi.getMediaUrl('file_abc_123', 'tok');
    expect(url).toBe('https://api.example.com/cabinet/media/file_abc_123?token=tok');
  });
});
