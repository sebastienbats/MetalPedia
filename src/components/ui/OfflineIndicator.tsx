'use client';

import { useEffect, useState } from 'react';
import { offlineSync } from '@/lib/offline-sync';

export default function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(offlineSync.isCurrentlyOnline());
    const unsubscribe = offlineSync.onStatusChange(setIsOnline);
    return () => { unsubscribe(); };
  }, []);

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 right-4 z-offline-indicator px-4 py-3 rounded-lg bg-metal-blood shadow-xl">
      <p className="font-semibold text-sm">📡 Mode hors ligne</p>
    </div>
  );
}
