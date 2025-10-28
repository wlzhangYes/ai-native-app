import { useState, useEffect, useCallback } from 'react';
import { Session } from '@/types';
import { sessionApi } from '@/services/api';

export function useSessions() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await sessionApi.list(true);
      setSessions(data.sessions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch sessions');
    } finally {
      setLoading(false);
    }
  }, []);

  const createSession = useCallback(async (workspaceName?: string) => {
    try {
      const newSession = await sessionApi.create({ workspace_name: workspaceName });
      setSessions((prev) => [newSession, ...prev]);
      return newSession;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create session');
      throw err;
    }
  }, []);

  const deleteSession = useCallback(async (sessionId: string) => {
    try {
      await sessionApi.delete(sessionId);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete session');
      throw err;
    }
  }, []);

  const getSession = useCallback(async (sessionId: string) => {
    try {
      const session = await sessionApi.get(sessionId);
      return session;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get session');
      throw err;
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  return {
    sessions,
    loading,
    error,
    fetchSessions,
    createSession,
    deleteSession,
    getSession,
  };
}
