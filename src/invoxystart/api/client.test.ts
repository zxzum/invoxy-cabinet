// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

const health = vi.hoisted(() => ({
  markBackendReached: vi.fn(),
  reportPossibleBackendDown: vi.fn(),
}));
vi.mock('../../api/health', () => health);

import { useBlockingStore } from '../../store/blocking';
import { apiErrorMessage, request } from './client';

function respond(status: number, body: unknown) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(
      new Response(JSON.stringify(body), {
        status,
        headers: { 'content-type': 'application/json' },
      }),
    ),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
  useBlockingStore.getState().clearBlocking();
});

describe('invoxystart request', () => {
  it('shows the maintenance screen for a coded 503', async () => {
    respond(503, { detail: { code: 'maintenance', message: 'Работы' } });
    await expect(request('/cabinet/x', { cache: 'no-store' })).rejects.toThrow();
    expect(useBlockingStore.getState().blockingType).toBe('maintenance');
    expect(useBlockingStore.getState().maintenanceInfo?.message).toBe('Работы');
  });

  it('shows the ban screen for a blacklisted account', async () => {
    respond(403, { detail: { code: 'blacklisted', message: 'Заблокирован' } });
    await expect(request('/cabinet/x', { cache: 'no-store' })).rejects.toThrow();
    expect(useBlockingStore.getState().blockingType).toBe('blacklisted');
  });

  it('asks for a confirmed outage check instead of blanking on a network error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    await expect(request('/cabinet/x', { cache: 'no-store' })).rejects.toThrow();
    expect(health.reportPossibleBackendDown).toHaveBeenCalledOnce();
    expect(useBlockingStore.getState().blockingType).toBeNull();
  });

  it('marks the backend as reached after any response', async () => {
    respond(200, { ok: true });
    await request('/cabinet/x', { cache: 'no-store' });
    expect(health.markBackendReached).toHaveBeenCalled();
  });
});

describe('apiErrorMessage', () => {
  it.each([
    [400, { detail: 'Недостаточно средств' }, 'Недостаточно средств'],
    [400, { detail: { code: 'x', message: 'Код устарел' } }, 'Код устарел'],
    [422, { detail: [{ msg: 'field required' }] }, 'field required'],
    [400, { detail: { code: 'x' } }, 'Не удалось выполнить запрос. Попробуйте ещё раз.'],
    [500, { detail: 'Traceback…' }, 'Сервис временно недоступен. Попробуйте чуть позже.'],
  ])('%i %j → %s', (status, body, expected) => {
    expect(apiErrorMessage(status, body)).toBe(expected);
  });
});
