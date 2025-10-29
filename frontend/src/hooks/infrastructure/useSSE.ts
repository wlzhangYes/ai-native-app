// useSSE Hook - Manages SSE connections with auto-reconnect
// Based on research.md SSE implementation

import { useEffect, useRef, useState, useCallback } from 'react';
import { SSEConnection, type SSEConnectionOptions } from '@/services/api/sse';
import type { SSEEvent } from '@/types/api';

// ============================================================================
// Hook Options
// ============================================================================

export interface UseSSEOptions {
  url: string;
  onMessage: (event: SSEEvent) => void;
  onError?: (error: Event) => void;
  onOpen?: () => void;
  enabled?: boolean; // Control whether to connect
  maxRetries?: number;
}

// ============================================================================
// Hook Return Type
// ============================================================================

export interface UseSSEReturn {
  isConnected: boolean;
  error: Event | null;
  connect: () => void;
  disconnect: () => void;
  reconnect: () => void;
}

// ============================================================================
// useSSE Hook
// ============================================================================

export function useSSE(options: UseSSEOptions): UseSSEReturn {
  const {
    url,
    onMessage,
    onError,
    onOpen,
    enabled = true,
    maxRetries = 10,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Event | null>(null);
  const connectionRef = useRef<SSEConnection | null>(null);

  // Handle connection open
  const handleOpen = useCallback(() => {
    setIsConnected(true);
    setError(null);
    onOpen?.();
  }, [onOpen]);

  // Handle connection error
  const handleError = useCallback(
    (event: Event) => {
      setIsConnected(false);
      setError(event);
      onError?.(event);
    },
    [onError]
  );

  // Connect to SSE
  const connect = useCallback(() => {
    if (connectionRef.current) {
      connectionRef.current.close();
    }

    const connectionOptions: SSEConnectionOptions = {
      url,
      onMessage,
      onError: handleError,
      onOpen: handleOpen,
      maxRetries,
    };

    connectionRef.current = new SSEConnection(connectionOptions);
    connectionRef.current.connect();
  }, [url, onMessage, handleError, handleOpen, maxRetries]);

  // Disconnect from SSE
  const disconnect = useCallback(() => {
    if (connectionRef.current) {
      connectionRef.current.close();
      connectionRef.current = null;
      setIsConnected(false);
    }
  }, []);

  // Reconnect to SSE
  const reconnect = useCallback(() => {
    disconnect();
    connect();
  }, [connect, disconnect]);

  // Store callbacks in refs to avoid recreating connection
  const onMessageRef = useRef(onMessage);
  const onErrorRef = useRef(onError);
  const onOpenRef = useRef(onOpen);

  // Update refs when callbacks change
  useEffect(() => {
    onMessageRef.current = onMessage;
    onErrorRef.current = onError;
    onOpenRef.current = onOpen;
  }, [onMessage, onError, onOpen]);

  // Auto-connect on mount if enabled or when URL changes
  useEffect(() => {
    if (!enabled || !url) {
      console.log('[useSSE] Not connecting - enabled:', enabled, 'url:', url);
      return;
    }

    console.log('[useSSE] Effect triggered - Connecting to:', url);

    // Create connection directly here to avoid dependency issues
    if (connectionRef.current) {
      console.log('[useSSE] Closing existing connection before creating new one');
      connectionRef.current.close();
    }

    const connectionOptions: SSEConnectionOptions = {
      url,
      onMessage: (event) => onMessageRef.current(event),
      onError: (error) => onErrorRef.current?.(error),
      onOpen: () => onOpenRef.current?.(),
      maxRetries,
    };

    console.log('[useSSE] Creating new SSE connection with maxRetries:', maxRetries);
    connectionRef.current = new SSEConnection(connectionOptions);
    connectionRef.current.connect();
    setIsConnected(true);

    // Cleanup on unmount or URL change
    return () => {
      console.log('[useSSE] Cleanup function called - closing connection');
      if (connectionRef.current) {
        connectionRef.current.close();
        connectionRef.current = null;
        setIsConnected(false);
      }
    };
  }, [enabled, url, maxRetries]); // Only depend on stable values

  return {
    isConnected,
    error,
    connect,
    disconnect,
    reconnect,
  };
}
