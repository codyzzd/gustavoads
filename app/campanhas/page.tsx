'use client';

import { useRouter } from 'next/navigation';
import { useApp } from '@/app/providers';
import { CampaignsPage } from '@/components/CampaignsPage';
import type { Campaign } from '@/lib/metaTypes';

export default function CampanhasPage() {
  const { account, isLoading, campaignMode } = useApp();
  const router = useRouter();

  const handleSelect = (campaign: Campaign) => {
    router.push(`/campanhas/${campaign.id}`);
  };

  return (
    <CampaignsPage
      account={account}
      isLoading={isLoading}
      campaignMode={campaignMode}
      onSelectCampaign={handleSelect}
    />
  );
}
