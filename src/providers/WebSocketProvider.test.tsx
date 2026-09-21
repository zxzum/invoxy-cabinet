// @vitest-environment jsdom
import { act, cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { WebSocketProvider } from './WebSocketProvider';

const mocks = vi.hoisted(() => ({
  getWebSocketTicket: vi.fn(),
  authState: { accessToken: 'access-jwt', isAuthenticated: true },
}));

vi.mock('../api/auth', () => ({ authApi: { getWebSocketTicket: mocks.getWebSocketTicket } }));
vi.mock('../store/auth', () => ({
  useAuthStore: (selector: (state: typeof mocks.authState) => unknown) => selector(mocks.authState),
}));

class FakeWebSocket {
  static OPEN = 1;

  readonly url: string;
  readyState = 0;
  onopen: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  onclose: ((event: { code: number; reason: string }) => void) | null = null;
  onerror: ((event: unknown) => void) | null = null;

  constructor(url: string) {
    this.url = url;
    instances.push(this);
  }

  close() {
    this.readyState = 3;
    this.onclose?.({ code: 1000, reason: '' });
  }
}

const instances: FakeWebSocket[] = [];

beforeEach(() => {
  instances.length = 0;
  Object.defineProperty(document, 'visibilityState', {
    configurable: true,
    value: 'visible',
  });
  mocks.authState.accessToken = 'access-jwt';
  mocks.authState.isAuthenticated = true;
  mocks.getWebSocketTicket
    .mockReset()
    .mockResolvedValue({ ticket: 'single-use-ticket', expires_in: 45 });
  vi.stubGlobal('WebSocket', FakeWebSocket);
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  Object.defineProperty(document, 'visibilityState', {
    configurable: true,
    value: 'visible',
  });
});

describe('WebSocketProvider', () => {
  it('uses a one-time ticket instead of putting the access JWT in the URL', async () => {
    render(
      <WebSocketProvider>
        <span>child</span>
      </WebSocketProvider>,
    );

    await waitFor(() => expect(instances).toHaveLength(1));

    expect(mocks.getWebSocketTicket).toHaveBeenCalledTimes(1);
    expect(mocks.getWebSocketTicket).toHaveBeenCalledWith(expect.any(AbortSignal));
    expect(instances[0].url).toContain('?ticket=single-use-ticket');
    expect(instances[0].url).not.toContain('access-jwt');
  });

  it('gets a fresh ticket before reconnecting', async () => {
    vi.useFakeTimers();
    mocks.getWebSocketTicket
      .mockReset()
      .mockResolvedValueOnce({ ticket: 'first-ticket', expires_in: 45 })
      .mockResolvedValueOnce({ ticket: 'second-ticket', expires_in: 45 });

    render(
      <WebSocketProvider>
        <span>child</span>
      </WebSocketProvider>,
    );
    await act(async () => {
      await Promise.resolve();
    });
    expect(instances).toHaveLength(1);

    instances[0].onclose?.({ code: 1006, reason: 'network' });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
      await Promise.resolve();
    });

    expect(mocks.getWebSocketTicket).toHaveBeenCalledTimes(2);
    expect(instances[1].url).toContain('?ticket=second-ticket');
  });

  it('retries ticket acquisition after a temporary failure', async () => {
    vi.useFakeTimers();
    mocks.getWebSocketTicket
      .mockReset()
      .mockRejectedValueOnce(new Error('temporary outage'))
      .mockResolvedValueOnce({ ticket: 'recovered-ticket', expires_in: 45 });

    render(
      <WebSocketProvider>
        <span>child</span>
      </WebSocketProvider>,
    );
    await act(async () => {
      await Promise.resolve();
    });
    expect(instances).toHaveLength(0);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
      await Promise.resolve();
    });

    expect(mocks.getWebSocketTicket).toHaveBeenCalledTimes(2);
    expect(instances[0].url).toContain('?ticket=recovered-ticket');
  });

  it('does not create a socket when unmounted while the ticket request is pending', async () => {
    let resolveTicket: (value: { ticket: string; expires_in: number }) => void = () => {};
    mocks.getWebSocketTicket.mockReturnValue(
      new Promise((resolve) => {
        resolveTicket = resolve;
      }),
    );

    const { unmount } = render(
      <WebSocketProvider>
        <span>child</span>
      </WebSocketProvider>,
    );
    await waitFor(() => expect(mocks.getWebSocketTicket).toHaveBeenCalledTimes(1));

    unmount();
    resolveTicket({ ticket: 'late-ticket', expires_in: 45 });
    await Promise.resolve();

    expect(instances).toHaveLength(0);
  });

  it('pauses the socket while the tab is hidden and reconnects on return', async () => {
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'hidden',
    });

    render(
      <WebSocketProvider>
        <span>child</span>
      </WebSocketProvider>,
    );
    await act(async () => {
      await Promise.resolve();
    });
    expect(mocks.getWebSocketTicket).not.toHaveBeenCalled();

    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'visible',
    });
    await act(async () => {
      document.dispatchEvent(new Event('visibilitychange'));
      await Promise.resolve();
    });

    await waitFor(() => expect(instances).toHaveLength(1));
    expect(mocks.getWebSocketTicket).toHaveBeenCalledTimes(1);
  });

  it('closes the active socket when the tab becomes hidden', async () => {
    render(
      <WebSocketProvider>
        <span>child</span>
      </WebSocketProvider>,
    );
    await waitFor(() => expect(instances).toHaveLength(1));

    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'hidden',
    });
    act(() => document.dispatchEvent(new Event('visibilitychange')));

    expect(instances[0].readyState).toBe(3);
  });
});
