// Session Debug Component - Display current session information
// Used for testing SessionProvider architecture

import React from 'react';
import { useSessionContext } from '../../contexts/SessionContext';

export const SessionDebug: React.FC = () => {
  const { sessionId, storageKeyPrefix } = useSessionContext();

  return (
    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4">
      <h3 className="text-sm font-bold text-blue-800 mb-2">Session Debug Info</h3>
      <div className="space-y-1 text-xs text-blue-700">
        <div><strong>Session ID:</strong> {sessionId || '(no session)'}</div>
        <div><strong>Storage Prefix:</strong> {storageKeyPrefix}</div>
        <div><strong>Context Available:</strong> ✅</div>
      </div>
    </div>
  );
};