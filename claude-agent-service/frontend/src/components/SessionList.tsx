import { useSessions } from '@/hooks/useSessions';
import { Plus, Trash2, Clock } from 'lucide-react';
import { useState } from 'react';
import clsx from 'clsx';

interface SessionListProps {
  currentSessionId: string | null;
  onSessionSelect: (sessionId: string) => void;
}

export default function SessionList({ currentSessionId, onSessionSelect }: SessionListProps) {
  const { sessions, loading, error, createSession, deleteSession } = useSessions();
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    setIsCreating(true);
    try {
      const session = await createSession();
      onSessionSelect(session.id);
    } catch (err) {
      console.error('Failed to create session:', err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this session?')) return;

    try {
      await deleteSession(sessionId);
      if (currentSessionId === sessionId) {
        onSessionSelect(sessions[0]?.id || '');
      }
    } catch (err) {
      console.error('Failed to delete session:', err);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="p-4 border-b border-anthropic-light-gray">
        <h2 className="text-lg font-poppins font-semibold text-anthropic-dark mb-3">
          Sessions
        </h2>
        <button
          onClick={handleCreate}
          disabled={isCreating}
          className={clsx(
            'w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg',
            'font-poppins font-medium text-sm transition-colors',
            'bg-anthropic-orange text-white hover:opacity-90',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          <Plus size={18} />
          {isCreating ? 'Creating...' : 'New Session'}
        </button>
      </div>

      {/* Session List */}
      <div className="flex-1 overflow-y-auto">
        {loading && (
          <div className="flex items-center justify-center h-32 text-anthropic-mid-gray">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-anthropic-orange"></div>
          </div>
        )}

        {error && (
          <div className="p-4 text-sm text-red-600 bg-red-50 border border-red-200 m-4 rounded-lg">
            {error}
          </div>
        )}

        {!loading && !error && sessions.length === 0 && (
          <div className="flex flex-col items-center justify-center h-32 text-anthropic-mid-gray text-sm">
            <p>No sessions yet</p>
            <p className="text-xs mt-1">Create one to get started</p>
          </div>
        )}

        {!loading && !error && sessions.map((session) => (
          <div
            key={session.id}
            onClick={() => onSessionSelect(session.id)}
            className={clsx(
              'px-4 py-3 border-b border-anthropic-light-gray cursor-pointer',
              'transition-colors hover:bg-anthropic-light',
              currentSessionId === session.id && 'bg-anthropic-light border-l-4 border-l-anthropic-orange'
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-poppins font-medium text-sm text-anthropic-dark truncate">
                  {session.workspace_name || 'Unnamed Session'}
                </h3>
                <div className="flex items-center gap-2 mt-1 text-xs text-anthropic-mid-gray">
                  <Clock size={12} />
                  <span>{formatTime(session.last_activity)}</span>
                  <span>•</span>
                  <span>{session.conversation_count} msgs</span>
                </div>
                <p className="text-xs text-anthropic-mid-gray mt-1 truncate" title={session.workspace_path}>
                  {session.workspace_path.split('/').pop()}
                </p>
              </div>
              <button
                onClick={(e) => handleDelete(session.id, e)}
                className="p-1.5 text-anthropic-mid-gray hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                title="Delete session"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
