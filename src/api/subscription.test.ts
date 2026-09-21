import { beforeEach, describe, expect, it, vi } from 'vitest';

const post = vi.fn((_url: string, _body?: unknown) => Promise.resolve({ data: {} }));

vi.mock('./client', () => ({
  default: { post, get: vi.fn(), patch: vi.fn(), delete: vi.fn(), put: vi.fn() },
}));

describe('saveTrafficResetCart', () => {
  beforeEach(() => post.mockClear());

  it('sends the selected subscription in the JSON body expected by the bot', async () => {
    const { subscriptionApi } = await import('./subscription');

    await subscriptionApi.saveTrafficResetCart(42);

    expect(post).toHaveBeenCalledWith('/cabinet/subscription/traffic-reset/save-cart', {
      subscription_id: 42,
    });
  });
});
