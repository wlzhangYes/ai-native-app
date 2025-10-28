import { CheckSquare, Folder } from 'lucide-react';
import TodoList from './TodoList';
import FileExplorer from './FileExplorer';
import clsx from 'clsx';

interface SidebarProps {
  sessionId: string | null;
  view: 'todos' | 'files';
  onViewChange: (view: 'todos' | 'files') => void;
}

export default function Sidebar({ sessionId, view, onViewChange }: SidebarProps) {
  return (
    <div className="flex flex-col h-full bg-white">
      {/* Tab Navigation */}
      <div className="flex border-b border-anthropic-light-gray">
        <button
          onClick={() => onViewChange('todos')}
          className={clsx(
            'flex-1 flex items-center justify-center gap-2 py-3 px-4',
            'font-poppins font-medium text-sm transition-colors',
            view === 'todos'
              ? 'text-anthropic-orange border-b-2 border-anthropic-orange'
              : 'text-anthropic-mid-gray hover:text-anthropic-dark hover:bg-anthropic-light'
          )}
        >
          <CheckSquare size={18} />
          Todos
        </button>
        <button
          onClick={() => onViewChange('files')}
          className={clsx(
            'flex-1 flex items-center justify-center gap-2 py-3 px-4',
            'font-poppins font-medium text-sm transition-colors',
            view === 'files'
              ? 'text-anthropic-orange border-b-2 border-anthropic-orange'
              : 'text-anthropic-mid-gray hover:text-anthropic-dark hover:bg-anthropic-light'
          )}
        >
          <Folder size={18} />
          Files
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {view === 'todos' ? (
          <TodoList sessionId={sessionId} />
        ) : (
          <FileExplorer sessionId={sessionId} />
        )}
      </div>
    </div>
  );
}
