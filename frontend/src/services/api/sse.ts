// SSE (Server-Sent Events) Connection Manager
// 适配 Claude Agent Service 的流式响应

import type { ChatStreamEvent } from './chat';

// ============================================================================
// SSE Connection Manager
// ============================================================================

export interface SSEConnectionOptions {
  url: string;
  method?: 'GET' | 'POST'; // 支持 POST 请求
  body?: Record<string, unknown>; // POST 请求体
  onMessage: (event: ChatStreamEvent) => void;
  onError?: (error: Event | Error) => void;
  onOpen?: () => void;
  maxRetries?: number;
  initialRetryDelay?: number; // milliseconds
  maxRetryDelay?: number; // milliseconds
}

export class SSEConnection {
  private abortController: AbortController | null = null;
  private url: string;
  private method: 'GET' | 'POST';
  private body?: Record<string, unknown>;
  private options: Required<Omit<SSEConnectionOptions, 'method' | 'body'>>;
  private retryCount = 0;
  private retryTimeout: number | null = null;
  private isManualClose = false;
  private isConnected = false;

  constructor(options: SSEConnectionOptions) {
    this.url = options.url;
    this.method = options.method || 'GET';
    this.body = options.body;
    this.options = {
      url: options.url,
      onMessage: options.onMessage,
      onError: options.onError || (() => {}),
      onOpen: options.onOpen || (() => {}),
      maxRetries: options.maxRetries ?? 10,
      initialRetryDelay: options.initialRetryDelay ?? 1000, // 1 second
      maxRetryDelay: options.maxRetryDelay ?? 30000, // 30 seconds
    };
  }

  /**
   * Open SSE connection using fetch API (supports both GET and POST)
   */
  public async connect(): Promise<void> {
    if (this.abortController) {
      this.abortController.abort();
    }

    this.isManualClose = false;
    this.abortController = new AbortController();

    try {
      const fetchOptions: RequestInit = {
        method: this.method,
        headers: {
          'Accept': 'text/event-stream',
          'Content-Type': 'application/json',
        },
        signal: this.abortController.signal,
      };

      if (this.method === 'POST' && this.body) {
        fetchOptions.body = JSON.stringify(this.body);
      }

      console.log('[SSE] Connecting to:', this.url, 'method:', this.method);
      const response = await fetch(this.url, fetchOptions);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (!response.body) {
        throw new Error('Response body is null');
      }

      // Connection opened successfully
      console.log('[SSE] Connection opened:', this.url);
      this.isConnected = true;
      this.retryCount = 0;
      this.options.onOpen();

      // Process the stream
      await this.processStream(response.body);
    } catch (error) {
      if (this.isManualClose) {
        console.log('[SSE] Connection was manually closed');
        return;
      }

      console.error('[SSE] Connection error:', error);
      this.isConnected = false;
      this.options.onError(error instanceof Error ? error : new Error('Unknown error'));

      // Attempt to reconnect with exponential backoff
      if (this.retryCount < this.options.maxRetries) {
        this.scheduleReconnect();
      } else {
        console.error('[SSE] Max retries reached. Giving up.');
      }
    }
  }

  /**
   * Process SSE stream from ReadableStream
   */
  private async processStream(body: ReadableStream<Uint8Array>): Promise<void> {
    const reader = body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          console.log('[SSE] Stream ended normally');
          this.isConnected = false;
          break;
        }

        // Decode chunk and add to buffer
        buffer += decoder.decode(value, { stream: true });

        // Process complete SSE messages (separated by double newlines)
        const messages = buffer.split('\n\n');
        buffer = messages.pop() || ''; // Keep incomplete message in buffer

        for (const message of messages) {
          if (!message.trim()) continue;

          // Parse SSE format: "data: {...}\n"
          const lines = message.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6); // Remove "data: " prefix

              try {
                const eventData = JSON.parse(data) as ChatStreamEvent;
                this.options.onMessage(eventData);

                // 自动关闭连接在收到 'done' 事件后
                if (eventData.type === 'done') {
                  console.log('[SSE] Received done event, closing connection');
                  this.close();
                  return;
                }
              } catch (error) {
                console.error('[SSE] Failed to parse message:', error, 'data:', data);
              }
            } else if (line.startsWith('event: ping')) {
              console.log('[SSE] Received ping (heartbeat)');
            }
          }
        }
      }
    } catch (error) {
      if (!this.isManualClose) {
        console.error('[SSE] Stream processing error:', error);
        throw error;
      }
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * Close SSE connection
   */
  public close(): void {
    this.isManualClose = true;
    this.isConnected = false;

    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
      this.retryTimeout = null;
    }

    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
      console.log('[SSE] Connection closed');
    }
  }

  /**
   * Check if connection is active
   */
  public isActive(): boolean {
    return this.isConnected && !this.isManualClose;
  }

  /**
   * Get connection state (mimics EventSource states)
   */
  public getReadyState(): number {
    if (this.isConnected) return 1; // OPEN
    if (this.abortController && !this.isManualClose) return 0; // CONNECTING
    return 2; // CLOSED
  }

  /**
   * Schedule reconnection with exponential backoff
   */
  private scheduleReconnect(): void {
    const delay = Math.min(
      this.options.initialRetryDelay * Math.pow(2, this.retryCount),
      this.options.maxRetryDelay
    );

    console.log(`[SSE] Reconnecting in ${delay}ms (attempt ${this.retryCount + 1}/${this.options.maxRetries})`);

    this.retryTimeout = setTimeout(() => {
      this.retryCount++;
      this.connect();
    }, delay);
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Create and connect to SSE endpoint
 */
export function createSSEConnection(options: SSEConnectionOptions): SSEConnection {
  const connection = new SSEConnection(options);
  connection.connect();
  return connection;
}
