import { Session } from '@/types';
import { API_BASE_URL } from '@/config/runtime';

// Session APIs
export const sessionApi = {
  list: async (activeOnly: boolean = true): Promise<{ sessions: Session[]; total: number }> => {
    const response = await fetch(
      `${API_BASE_URL}/api/sessions?active_only=${activeOnly}&limit=100`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      }
    );
    if (!response.ok) throw new Error('Failed to fetch sessions');
    return response.json();
  },

  get: async (sessionId: string): Promise<Session> => {
    const response = await fetch(`${API_BASE_URL}/api/sessions/${sessionId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) throw new Error('Failed to fetch session');
    return response.json();
  },

  create: async (data: { session_id?: string; workspace_name?: string }): Promise<Session> => {
    const response = await fetch(`${API_BASE_URL}/api/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create session');
    return response.json();
  },

  delete: async (sessionId: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/api/sessions/${sessionId}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete session');
  },
};

// Chat APIs
export const chatApi = {
  stream: (params: {
    message: string;
    session_id?: string;
    permission_mode?: string;
    resume?: string;
    max_turns?: number;
  }): EventSource => {
    const url = new URL(`${API_BASE_URL}/api/chat/stream`);

    // Create EventSource for SSE
    const eventSource = new EventSource(url.toString());

    // Send the message via POST
    fetch(url.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    return eventSource;
  },

  streamWithFetch: async (params: {
    message: string;
    session_id?: string;
    permission_mode?: string;
    resume?: string;
    max_turns?: number;
  }): Promise<ReadableStream<Uint8Array>> => {
    const response = await fetch(`${API_BASE_URL}/api/chat/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error('Failed to start chat stream');
    }

    if (!response.body) {
      throw new Error('No response body');
    }

    return response.body;
  },
};

// File APIs
export const fileApi = {
  list: async (sessionId: string, path: string = '/'): Promise<any> => {
    const response = await fetch(
      `${API_BASE_URL}/api/sessions/${sessionId}/files?path=${encodeURIComponent(path)}`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      }
    );
    if (!response.ok) throw new Error('Failed to fetch files');
    const data = await response.json();
    return data.files || [];
  },

  getContent: async (sessionId: string, filePath: string): Promise<string> => {
    const response = await fetch(
      `${API_BASE_URL}/api/sessions/${sessionId}/files/content?path=${encodeURIComponent(filePath)}`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      }
    );
    if (!response.ok) throw new Error('Failed to fetch file content');
    const data = await response.json();
    return data.content || '';
  },
};

// Message History APIs
export const messageApi = {
  getHistory: async (sessionId: string): Promise<any> => {
    const response = await fetch(
      `${API_BASE_URL}/api/sessions/${sessionId}/messages`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      }
    );
    if (!response.ok) throw new Error('Failed to fetch message history');
    return response.json();
  },
};
