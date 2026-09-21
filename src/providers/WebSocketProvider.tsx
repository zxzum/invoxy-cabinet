import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuthStore } from '../store/auth';
import { authApi } from '../api/auth';
import { WebSocketContext, type MessageHandler, type WSMessage } from './WebSocketContext';
import { WS } from '../config/constants';
import { resolveApiBaseUrl } from '../config/apiUrl';

// Re-export for backward compatibility
export type { WSMessage } from './WebSocketContext';

const isDev = import.meta.env.DEV;

function buildWebSocketUrl(ticket: string): string {
  const apiUrl = resolveApiBaseUrl(import.meta.env.VITE_API_URL);
  const windowWsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';

  const withTicket = (base: string) => `${base}?ticket=${encodeURIComponent(ticket)}`;

  if (apiUrl.startsWith('http://') || apiUrl.startsWith('https://')) {
    try {
      const api = new URL(apiUrl);
      const wsProtocol = api.protocol === 'https:' ? 'wss:' : 'ws:';
      const basePath = api.pathname.replace(/\/+$/, '');
      const wsPath = basePath.endsWith('/cabinet') ? `${basePath}/ws` : `${basePath}/cabinet/ws`;
      return withTicket(`${wsProtocol}//${api.host}${wsPath}`);
    } catch {
      // fall through to relative-path handling
    }
  }

  const normalizedBasePath = `/${apiUrl}`.replace(/\/{2,}/g, '/').replace(/\/+$/, '');
  const wsPath = normalizedBasePath.endsWith('/cabinet')
    ? `${normalizedBasePath}/ws`
    : `${normalizedBasePath}/cabinet/ws`;
  return withTicket(`${windowWsProtocol}//${window.location.host}${wsPath}`);
}

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const connectionGenerationRef = useRef(0);
  const ticketRequestRef = useRef<AbortController | null>(null);
  const isConnectingRef = useRef(false);
  const [isConnected, setIsConnected] = useState(false);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = WS.MAX_RECONNECT_ATTEMPTS;

  // Store message handlers
  const handlersRef = useRef<Set<MessageHandler>>(new Set());

  const cleanup = useCallback(() => {
    connectionGenerationRef.current += 1;
    ticketRequestRef.current?.abort();
    ticketRequestRef.current = null;
    isConnectingRef.current = false;

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  const connect = useCallback(async () => {
    if (!accessToken || !isAuthenticated) {
      return;
    }

    // Don't reconnect if already connected
    if (wsRef.current?.readyState === WebSocket.OPEN || isConnectingRef.current) {
      return;
    }

    cleanup();

    const generation = connectionGenerationRef.current;
    const controller = new AbortController();
    ticketRequestRef.current = controller;
    isConnectingRef.current = true;

    const scheduleReconnect = () => {
      if (
        generation !== connectionGenerationRef.current ||
        !accessToken ||
        !isAuthenticated ||
        reconnectTimeoutRef.current ||
        reconnectAttemptsRef.current >= maxReconnectAttempts
      ) {
        return;
      }

      const delay = Math.min(1000 * 2 ** reconnectAttemptsRef.current, WS.MAX_RECONNECT_DELAY_MS);
      if (isDev)
        console.log(`[WS] Retrying in ${delay}ms (attempt ${reconnectAttemptsRef.current + 1})`);

      reconnectTimeoutRef.current = setTimeout(() => {
        reconnectTimeoutRef.current = null;
        if (generation !== connectionGenerationRef.current) return;
        reconnectAttemptsRef.current++;
        void connect();
      }, delay);
    };

    let ticket: string;
    try {
      const response = await authApi.getWebSocketTicket(controller.signal);
      if (typeof response.ticket !== 'string' || response.ticket.length === 0) {
        throw new Error('WebSocket ticket response is invalid');
      }
      ticket = response.ticket;
    } catch (error) {
      if (generation !== connectionGenerationRef.current || controller.signal.aborted) {
        return;
      }
      isConnectingRef.current = false;
      ticketRequestRef.current = null;
      if (isDev) console.error('[WS] Failed to obtain ticket:', error);
      scheduleReconnect();
      return;
    }

    if (
      generation !== connectionGenerationRef.current ||
      controller.signal.aborted ||
      !accessToken ||
      !isAuthenticated
    ) {
      return;
    }

    isConnectingRef.current = false;
    ticketRequestRef.current = null;

    try {
      const wsUrl = buildWebSocketUrl(ticket);
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        if (generation !== connectionGenerationRef.current) return;
        if (isDev) console.log('[WS] Connected');
        setIsConnected(true);
        reconnectAttemptsRef.current = 0;

        // Setup ping interval (every 25 seconds)
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, WS.PING_INTERVAL_MS);
      };

      ws.onmessage = (event) => {
        if (generation !== connectionGenerationRef.current) return;
        try {
          const parsed = JSON.parse(event.data);
          if (!parsed || typeof parsed !== 'object' || typeof parsed.type !== 'string') {
            if (isDev) console.warn('[WS] Invalid message format:', parsed);
            return;
          }
          const message = parsed as WSMessage;

          // Ignore pong messages
          if (message.type === 'pong' || message.type === 'connected') {
            return;
          }

          // Notify all subscribers
          handlersRef.current.forEach((handler) => {
            try {
              handler(message);
            } catch (e) {
              if (isDev) console.error('[WS] Handler error:', e);
            }
          });
        } catch (e) {
          if (isDev) console.error('[WS] Failed to parse message:', e);
        }
      };

      ws.onclose = (event) => {
        if (generation !== connectionGenerationRef.current) return;
        if (isDev) console.log('[WS] Disconnected:', event.code, event.reason);
        if (wsRef.current === ws) wsRef.current = null;
        setIsConnected(false);

        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = null;
        }

        // Don't reconnect on auth failures (1008 = Policy Violation / invalid token)
        if (event.code === 1008) {
          if (isDev) console.log('[WS] Auth rejected, not reconnecting');
          return;
        }

        // Attempt to reconnect if not closed intentionally
        if (event.code !== 1000) scheduleReconnect();
      };

      ws.onerror = (error) => {
        if (generation !== connectionGenerationRef.current) return;
        if (isDev) console.error('[WS] Error:', error);
      };
    } catch (e) {
      if (isDev) console.error('[WS] Failed to connect:', e);
    }
  }, [accessToken, isAuthenticated, cleanup]);

  // Connect when authenticated
  useEffect(() => {
    if (isAuthenticated && accessToken) {
      connect();
    } else {
      cleanup();
      setIsConnected(false);
    }

    return cleanup;
  }, [isAuthenticated, accessToken, connect, cleanup]);

  // Subscribe function for components
  const subscribe = useCallback((handler: MessageHandler) => {
    handlersRef.current.add(handler);

    // Return unsubscribe function
    return () => {
      handlersRef.current.delete(handler);
    };
  }, []);

  return (
    <WebSocketContext.Provider value={{ isConnected, subscribe }}>
      {children}
    </WebSocketContext.Provider>
  );
}
