'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import { useUIStore } from '@/stores/uiStore';
import { useGamificationStore } from '@/stores/gamificationStore';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: { refetchOnWindowFocus: false, staleTime: 5 * 60 * 1000, retry: 2 },
    },
  }));

  const { theme } = useUIStore();
  const claimDailyBonus = useGamificationStore((s) => s.claimDailyBonus);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    claimDailyBonus();
  }, [claimDailyBonus]);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
