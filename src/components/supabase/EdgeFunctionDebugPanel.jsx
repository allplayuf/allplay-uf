/**
 * Edge Function Debug Panel
 * 
 * Shows the last N edge function calls with full header/response details.
 * USE THIS ON iOS where console.log is invisible.
 * 
 * Usage: Add <EdgeFunctionDebugPanel /> anywhere in your page/layout.
 * Activated by tapping the AllPlay logo 5 times quickly (hidden trigger).
 */

import React, { useState, useEffect } from 'react';
import { getEdgeFunctionDebugLog } from './callEdgeFunction';
import { SUPABASE_ANON_KEY } from './config';
import { X, Bug, RefreshCw } from 'lucide-react';

export default function EdgeFunctionDebugPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [logs, setLogs] = useState([]);

  const refreshLogs = () => {
    setLogs(getEdgeFunctionDebugLog());
  };

  useEffect(() => {
    if (isOpen) {
      refreshLogs();
      const interval = setInterval(refreshLogs, 2000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const anonKeyInfo = {
    type: typeof SUPABASE_ANON_KEY,
    length: SUPABASE_ANON_KEY ? SUPABASE_ANON_KEY.length : 0,
    prefix: SUPABASE_ANON_KEY ? SUPABASE_ANON_KEY.slice(0, 12) : 'NULL',
    valid: typeof SUPABASE_ANON_KEY === 'string' && SUPABASE_ANON_KEY.length >= 50,
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/95 overflow-y-auto text-white font-mono text-xs">
      <div className="sticky top-0 bg-black border-b border-gray-700 p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bug className="w-4 h-4 text-yellow-400" />
          <span className="font-bold text-yellow-400">Edge Function Debug</span>
        </div>
        <div className="flex gap-2">
          <button onClick={refreshLogs} className="p-1.5 bg-gray-800 rounded">
            <RefreshCw className="w-3 h-3" />
          </button>
          <button onClick={() => setIsOpen(false)} className="p-1.5 bg-gray-800 rounded">
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>

      <div className="p-3 space-y-3">
        {/* ANON KEY STATUS */}
        <div className={`p-3 rounded border ${anonKeyInfo.valid ? 'border-green-600 bg-green-900/30' : 'border-red-600 bg-red-900/30'}`}>
          <div className="font-bold mb-1">{anonKeyInfo.valid ? '✅ ANON KEY OK' : '❌ ANON KEY MISSING/INVALID'}</div>
          <div>Type: {anonKeyInfo.type}</div>
          <div>Length: {anonKeyInfo.length}</div>
          <div>Prefix: {anonKeyInfo.prefix}...</div>
        </div>

        {/* LOG ENTRIES */}
        <div className="font-bold text-gray-400">Last {logs.length} calls:</div>
        {logs.length === 0 && (
          <div className="text-gray-500">No edge function calls yet. Create a match to test.</div>
        )}
        {logs.map((entry, i) => (
          <div
            key={i}
            className={`p-2 rounded border text-[10px] leading-relaxed ${
              entry.phase === 'HARD_FAIL' || entry.phase === 'NETWORK_ERROR' || entry.phase === 'MODULE_LOAD_FAIL'
                ? 'border-red-600 bg-red-900/20'
                : entry.phase === 'POST' && entry.status !== 200
                ? 'border-yellow-600 bg-yellow-900/20'
                : 'border-gray-700 bg-gray-900/50'
            }`}
          >
            <div className="flex justify-between mb-1">
              <span className="font-bold text-yellow-300">{entry.phase}</span>
              <span className="text-gray-500">{entry.ts?.slice(11, 19)}</span>
            </div>
            {entry.fn && <div>fn: <span className="text-cyan-300">{entry.fn}</span></div>}
            {entry.anonLen !== undefined && <div>anonLen: <span className={entry.anonLen >= 50 ? 'text-green-400' : 'text-red-400'}>{entry.anonLen}</span></div>}
            {entry.anonPrefix && <div>anonPrefix: {entry.anonPrefix}</div>}
            {entry.headerApikeySet !== undefined && <div>headerApikeySet: {String(entry.headerApikeySet)}</div>}
            {entry.headerApikeyLen !== undefined && <div>headerApikeyLen: {entry.headerApikeyLen}</div>}
            {entry.tokenPresent !== undefined && <div>tokenPresent: {String(entry.tokenPresent)}</div>}
            {entry.status !== undefined && <div>status: <span className={entry.status === 200 ? 'text-green-400' : 'text-red-400'}>{entry.status}</span></div>}
            {entry.bodyPreview && <div className="mt-1 text-gray-400 break-all">body: {entry.bodyPreview}</div>}
            {entry.error && <div className="text-red-400">error: {entry.error}</div>}
            {entry.message && <div className="text-red-400">msg: {entry.message}</div>}
            {entry.anonKeyLength !== undefined && entry.phase?.includes('MODULE') && <div>anonKeyLength: {entry.anonKeyLength}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}