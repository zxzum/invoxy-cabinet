import { describe, expect, it, vi, beforeEach } from 'vitest';

const post = vi.fn((_url: string, _body?: unknown) =>
  Promise.resolve({ data: { success: true, message: 'OK' } }),
);

vi.mock('./client', () => ({
  default: { post, get: vi.fn(), patch: vi.fn(), delete: vi.fn(), put: vi.fn() },
}));

describe('adminUsersApi.sendMessage', () => {
  beforeEach(() => {
    post.mockClear();
  });

  it('sends string message with channel=telegram for backward compatibility', async () => {
    const { adminUsersApi } = await import('./adminUsers');
    await adminUsersApi.sendMessage(42, 'Hello from admin');

    expect(post).toHaveBeenCalledTimes(1);
    const [url, body] = post.mock.calls[0];
    expect(url).toBe('/cabinet/admin/users/42/send-message');
    expect(body).toEqual({ text: 'Hello from admin', channel: 'telegram' });
  });

  it('sends object payload with channel=email and subject', async () => {
    const { adminUsersApi } = await import('./adminUsers');
    await adminUsersApi.sendMessage(42, {
      text: 'Support response',
      channel: 'email',
      subject: 'Ticket Update',
    });

    expect(post).toHaveBeenCalledTimes(1);
    const [url, body] = post.mock.calls[0];
    expect(url).toBe('/cabinet/admin/users/42/send-message');
    expect(body).toEqual({
      text: 'Support response',
      channel: 'email',
      subject: 'Ticket Update',
    });
  });

  it('sends object payload with channel=telegram', async () => {
    const { adminUsersApi } = await import('./adminUsers');
    await adminUsersApi.sendMessage(99, {
      text: 'Notification via bot',
      channel: 'telegram',
    });

    expect(post).toHaveBeenCalledTimes(1);
    const [url, body] = post.mock.calls[0];
    expect(url).toBe('/cabinet/admin/users/99/send-message');
    expect(body).toEqual({
      text: 'Notification via bot',
      channel: 'telegram',
    });
  });
});

describe('adminUsersApi.updateSubscription', () => {
  beforeEach(() => {
    post.mockClear();
  });

  it('sends reset_main_traffic action', async () => {
    const { adminUsersApi } = await import('./adminUsers');
    await adminUsersApi.updateSubscription(42, {
      action: 'reset_main_traffic',
      subscription_id: 10,
    });

    expect(post).toHaveBeenCalledTimes(1);
    const [url, body] = post.mock.calls[0];
    expect(url).toBe('/cabinet/admin/users/42/subscription');
    expect(body).toEqual({
      action: 'reset_main_traffic',
      subscription_id: 10,
    });
  });

  it('sends adjust_whitelist_used action with deltaGb', async () => {
    const { adminUsersApi } = await import('./adminUsers');
    await adminUsersApi.updateSubscription(42, {
      action: 'adjust_whitelist_used',
      whitelist_traffic_delta_gb: 15.5,
      subscription_id: 10,
    });

    expect(post).toHaveBeenCalledTimes(1);
    const [url, body] = post.mock.calls[0];
    expect(url).toBe('/cabinet/admin/users/42/subscription');
    expect(body).toEqual({
      action: 'adjust_whitelist_used',
      whitelist_traffic_delta_gb: 15.5,
      subscription_id: 10,
    });
  });

  it('sends adjust_whitelist_used action with usedGb', async () => {
    const { adminUsersApi } = await import('./adminUsers');
    await adminUsersApi.updateSubscription(42, {
      action: 'adjust_whitelist_used',
      whitelist_traffic_used_gb: 0,
      subscription_id: 10,
    });

    expect(post).toHaveBeenCalledTimes(1);
    const [url, body] = post.mock.calls[0];
    expect(url).toBe('/cabinet/admin/users/42/subscription');
    expect(body).toEqual({
      action: 'adjust_whitelist_used',
      whitelist_traffic_used_gb: 0,
      subscription_id: 10,
    });
  });

  it('sends action with reason and silent flags', async () => {
    const { adminUsersApi } = await import('./adminUsers');
    await adminUsersApi.updateSubscription(42, {
      action: 'extend',
      days: 30,
      reason: 'Compensation for downtime',
      silent: true,
    });

    expect(post).toHaveBeenCalledTimes(1);
    const [url, body] = post.mock.calls[0];
    expect(url).toBe('/cabinet/admin/users/42/subscription');
    expect(body).toEqual({
      action: 'extend',
      days: 30,
      reason: 'Compensation for downtime',
      silent: true,
    });
  });

  it('sends create action with overwrite and device_limit', async () => {
    const { adminUsersApi } = await import('./adminUsers');
    await adminUsersApi.updateSubscription(42, {
      action: 'create',
      tariff_id: 3,
      days: 60,
      device_limit: 5,
      overwrite: true,
      reason: 'Overwrite subscription',
    });

    expect(post).toHaveBeenCalledTimes(1);
    const [url, body] = post.mock.calls[0];
    expect(url).toBe('/cabinet/admin/users/42/subscription');
    expect(body).toEqual({
      action: 'create',
      tariff_id: 3,
      days: 60,
      device_limit: 5,
      overwrite: true,
      reason: 'Overwrite subscription',
    });
  });
});

describe('adminUsersApi.deleteSubscription', () => {
  it('passes force, silent, and reason query parameters', async () => {
    const { default: apiClient } = await import('./client');
    const deleteSpy = vi
      .spyOn(apiClient, 'delete')
      .mockResolvedValueOnce({ data: { status: 'deleted' } });
    const { adminUsersApi } = await import('./adminUsers');

    await adminUsersApi.deleteSubscription(42, 10, true, true, 'Test delete reason');

    expect(deleteSpy).toHaveBeenCalledWith('/cabinet/admin/users/42/subscriptions/10', {
      params: { force: true, silent: true, reason: 'Test delete reason' },
    });
  });
});
