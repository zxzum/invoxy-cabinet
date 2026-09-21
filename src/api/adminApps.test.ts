import { beforeEach, describe, expect, it, vi } from 'vitest';

const post = vi.fn();
const put = vi.fn();

vi.mock('./client', () => ({
  default: { post, put, get: vi.fn(), delete: vi.fn() },
}));

describe('adminAppsApi banners', () => {
  beforeEach(() => {
    post.mockReset().mockResolvedValue({ data: {} });
    put.mockReset().mockResolvedValue({ data: {} });
  });

  it('sends a valid create payload and turns an empty URL into null', async () => {
    const { adminAppsApi } = await import('./adminApps');

    await adminAppsApi.createAppBanner({
      title: '  Promo  ',
      text: '  Details  ',
      action_url: '   ',
      type: 'promo',
      is_active: true,
      sort_order: 0,
    });

    expect(post).toHaveBeenCalledWith('/cabinet/admin/app-banners', {
      title: 'Promo',
      text: 'Details',
      action_url: null,
      type: 'promo',
      is_active: true,
      sort_order: 0,
    });
  });

  it('does not rewrite fields omitted by a partial update', async () => {
    const { adminAppsApi } = await import('./adminApps');

    await adminAppsApi.updateAppBanner('abc123', { is_active: false });

    expect(put).toHaveBeenCalledWith('/cabinet/admin/app-banners/abc123', { is_active: false });
  });
});
