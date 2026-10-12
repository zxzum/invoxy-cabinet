import { beforeEach, describe, expect, it, vi } from 'vitest';
import { balanceApi } from './balance';
import apiClient from './client';

vi.mock('./client', () => ({ default: { get: vi.fn() } }));

beforeEach(() => vi.resetAllMocks());

describe('active invoices', () => {
  it('loads older active invoices past the server page boundary', async () => {
    const get = vi.mocked(apiClient.get);
    const first = Array.from({ length: 50 }, (_, id) => ({ id, method: 'rollypay' }));
    get.mockResolvedValueOnce({ items: first, total: 51, pages: 2, page: 1, per_page: 50 });
    get.mockResolvedValueOnce({
      items: [{ id: 50, method: 'platega' }],
      total: 51,
      pages: 2,
      page: 2,
      per_page: 50,
    });
    const result = await balanceApi.getActivePayments();
    expect(result.items).toHaveLength(51);
    expect(result.items[50].method).toBe('platega');
    expect(get).toHaveBeenLastCalledWith('/cabinet/balance/pending-payments', {
      params: { page: 2, per_page: 50, active_only: true },
      cache: 'no-store',
    });
  });

  it('does not request another page when no active invoices remain', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ items: [], total: 0, pages: 1 });
    expect((await balanceApi.getActivePayments()).items).toEqual([]);
    expect(apiClient.get).toHaveBeenCalledTimes(1);
  });
});
