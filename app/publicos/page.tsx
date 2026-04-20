'use client';

import { useApp } from '@/app/providers';
import { AudiencePanel } from '@/components/AudiencePanel';

export default function PublicosPage() {
  const { account, isLoading, clientProfile } = useApp();
  return <AudiencePanel account={account} isLoading={isLoading} clientProfile={clientProfile} />;
}
