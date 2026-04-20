'use client';

import { useApp } from '@/app/providers';
import { InsightsDashboard } from '@/components/InsightsDashboard';
import { DATE_PRESET_LABELS } from '@/app/providers';

export default function DashboardPage() {
  const { account, isLoading, datePreset, campaignMode } = useApp();
  return (
    <InsightsDashboard
      account={account}
      isLoading={isLoading}
      datePreset={DATE_PRESET_LABELS[datePreset]}
      campaignMode={campaignMode}
    />
  );
}
