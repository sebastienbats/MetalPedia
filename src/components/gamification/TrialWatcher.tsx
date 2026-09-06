'use client';

import { useGamificationStore } from '@/stores/gamificationStore';
import TrialModal from './TrialModal';

export default function TrialWatcher() {
  const pendingTrial = useGamificationStore((s) => s.pendingTrial);

  if (!pendingTrial) return null;

  return <TrialModal trial={pendingTrial} />;
}
