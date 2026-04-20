'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/app/providers';
import { CampaignDetail } from '@/components/CampaignDetail';

export default function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { account, campaignMode, metaPermission } = useApp();
  const router = useRouter();

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

  return (
    <CampaignDetail
      campaign={campaign}
      currency={account?.currency || 'BRL'}
      campaignMode={campaignMode}
      metaPermission={metaPermission}
      onBack={() => router.push('/campanhas')}
    />
  );
}
