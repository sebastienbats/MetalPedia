'use client';

import { useEffect, useState } from 'react';
import { offlineSync } from '@/lib/offline-sync';

export default function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    setIsOnline(offlineSync.isCurrentlyOnline());

    const unsubscribe = offlineSync.onStatusChange((online) => {
      setIsOnline(online);
    });

    const interval = setInterval(async () => {
      const ops = await offlineSync.getPendingOperations();
      setPendingCount(ops.length);
    }, 5000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  if (isOnline && pendingCount === 0) return null;

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 px-4 py-3 rounded-lg shadow-xl transition-all ${
        isOnline ? 'bg-green-600' : 'bg-metal-blood'
      }`}
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl">{isOnline ? '🔄' : '📡'}</span>
        <div>
          <p className="font-semibold text-sm">
            {isOnline
              ? `Synchronisation... (${pendingCount} opérations)`
              : 'Mode hors ligne'}
          </p>
        </div>
      </div>
    </div>
  );
}
