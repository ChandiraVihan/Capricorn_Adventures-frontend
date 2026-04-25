import { useEffect, useRef } from 'react';
import { EventSourcePolyfill } from 'event-source-polyfill';
import { BACKEND_BASE_URL } from '../api/config';
import { authService } from '../api/authService';

/**
 * Native EventSource does not support custom auth headers.
 * We still establish EventSource first for live updates; when backend rejects,
 * caller should keep polling fallback active.
 */
export function useSSE({ path, enabled, onMessage, onError }) {
  const onMessageRef = useRef(onMessage);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onMessageRef.current = onMessage;
    onErrorRef.current = onError;
  }, [onMessage, onError]);

  useEffect(() => {
    if (!enabled) return undefined;

    let retryTimer = null;
    let source = null;
    let closed = false;
    let retryDelay = 3000;

    const connect = () => {
      if (closed) return;
      source = new EventSourcePolyfill(`${BACKEND_BASE_URL}${path}`, {
        headers: {
          Authorization: `Bearer ${authService.getToken() || ''}`,
        },
      });

      source.onmessage = (event) => {
        retryDelay = 3000;
        try {
          const payload = JSON.parse(event.data);
          onMessageRef.current?.(payload);
        } catch {
          onMessageRef.current?.(event.data);
        }
      };

      source.onerror = (event) => {
        onErrorRef.current?.(event);
        if (source) {
          source.close();
        }
        retryTimer = window.setTimeout(connect, retryDelay);
        retryDelay = Math.min(retryDelay * 2, 30000);
      };
    };

    connect();

    return () => {
      closed = true;
      if (retryTimer) {
        clearTimeout(retryTimer);
      }
      if (source) {
        source.close();
      }
    };
  }, [enabled, path]);
}
