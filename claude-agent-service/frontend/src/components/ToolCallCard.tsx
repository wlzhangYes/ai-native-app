import { ToolCall } from '@/types';
import { ChevronDown, ChevronRight, Wrench, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useState } from 'react';
import clsx from 'clsx';

interface ToolCallCardProps {
  toolCall: ToolCall;
}

export default function ToolCallCard({ toolCall }: ToolCallCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getStatusIcon = () => {
    switch (toolCall.status) {
      case 'building':
        return <Loader2 size={16} className="animate-spin text-anthropic-orange" />;
      case 'executing':
        return <Loader2 size={16} className="animate-spin text-anthropic-blue" />;
      case 'success':
        return <CheckCircle size={16} className="text-anthropic-green" />;
      case 'failed':
        return <XCircle size={16} className="text-red-600" />;
    }
  };

  const getStatusText = () => {
    switch (toolCall.status) {
      case 'building':
        return 'Building parameters...';
      case 'executing':
        return 'Executing...';
      case 'success':
        return 'Completed';
      case 'failed':
        return 'Failed';
    }
  };

  const getStatusColor = () => {
    switch (toolCall.status) {
      case 'building':
        return 'border-anthropic-orange bg-orange-50';
      case 'executing':
        return 'border-anthropic-blue bg-blue-50';
      case 'success':
        return 'border-anthropic-green bg-green-50';
      case 'failed':
        return 'border-red-600 bg-red-50';
    }
  };

  const displayInput = toolCall.status === 'building' && toolCall.inputPartial
    ? toolCall.inputPartial
    : JSON.stringify(toolCall.input, null, 2);

  return (
    <div
      className={clsx(
        'border-l-4 rounded-lg p-4 transition-all',
        getStatusColor()
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 flex-1">
          <Wrench size={18} className="text-anthropic-dark flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <h4 className="font-poppins font-semibold text-sm text-anthropic-dark">
              {toolCall.name}
            </h4>
            <div className="flex items-center gap-2 mt-1">
              {getStatusIcon()}
              <span className="text-xs text-anthropic-mid-gray">{getStatusText()}</span>
            </div>
          </div>
        </div>
        {(toolCall.status === 'success' || toolCall.status === 'failed') && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-white rounded transition-colors"
          >
            {isExpanded ? (
              <ChevronDown size={18} className="text-anthropic-mid-gray" />
            ) : (
              <ChevronRight size={18} className="text-anthropic-mid-gray" />
            )}
          </button>
        )}
      </div>

      {/* Input (always visible when building/executing) */}
      {(toolCall.status === 'building' || toolCall.status === 'executing') && (
        <div className="mt-3">
          <div className="text-xs font-poppins font-medium text-anthropic-dark mb-1">
            Parameters:
          </div>
          <pre className="text-xs bg-white bg-opacity-60 rounded p-2 overflow-x-auto font-mono">
            {displayInput}
          </pre>
        </div>
      )}

      {/* Expanded Details */}
      {isExpanded && (toolCall.status === 'success' || toolCall.status === 'failed') && (
        <div className="mt-3 space-y-3 border-t border-anthropic-light-gray pt-3">
          {/* Input */}
          <div>
            <div className="text-xs font-poppins font-medium text-anthropic-dark mb-1">
              Input:
            </div>
            <pre className="text-xs bg-white bg-opacity-60 rounded p-2 overflow-x-auto font-mono max-h-40 overflow-y-auto">
              {displayInput}
            </pre>
          </div>

          {/* Result */}
          {toolCall.result && (
            <div>
              <div className="text-xs font-poppins font-medium text-anthropic-dark mb-1">
                {toolCall.isError ? 'Error:' : 'Result:'}
              </div>
              <pre className="text-xs bg-white bg-opacity-60 rounded p-2 overflow-x-auto font-mono max-h-60 overflow-y-auto">
                {toolCall.result}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
