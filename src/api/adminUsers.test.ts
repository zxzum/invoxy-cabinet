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
