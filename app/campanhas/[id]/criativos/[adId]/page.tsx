'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/app/providers';
import { CreativeGallery } from '@/components/CreativeGallery';

export default function CreativeDetailPage({ params }: { params: Promise<{ id: string; adId: string }> }) {
  const { id, adId } = use(params);
  const router = useRouter();
  const { account, campaignMode, aiConfig, clientProfile } = useApp();

  const campaign = account?.campaigns?.find((c) => c.id === id);

  if (!campaign) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, gap: 16, color: 'var(--fg-muted)' }}>
        <div style={{ fontSize: 48 }}>📭</div>
        <p style={{ fontSize: '1rem' }}>Campanha não encontrada.</p>
        <button
          onClick={() => router.push('/campanhas')}
          style={{ padding: '8px 16px', borderRadius: 7, background: 'var(--bg-component)', border: '1px solid var(--border-base)', cursor: 'pointer', color: 'var(--fg-base)', fontSize: '0.875rem' }}
        >
          ← Voltar para Campanhas
        </button>
      </div>
    );
  }

  const mockAccount = {
    id: 'detail-creative',
    name: campaign.name,
    currency: account?.currency || 'BRL',
    timezone_name: '',
    account_status: 1,
    campaigns: [campaign],
  } as import('@/lib/metaTypes').AdAccount;

  return (
    <CreativeGallery
      account={mockAccount}
      isLoading={false}
      campaignMode={campaignMode}
      clientProfile={clientProfile}
      aiConfig={aiConfig}
      selectedCreativeId={adId}
      renderDetailAsPage
      onBackFromDetail={() => router.push(`/campanhas/${id}`)}
    />
  );
}
