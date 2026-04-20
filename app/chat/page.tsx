'use client';

import { useApp } from '@/app/providers';
import { AiAgentChat } from '@/components/AiAgentChat';

export default function ChatPage() {
  const { aiConfig, metaContext, account, clientProfile } = useApp();
  return (
    <AiAgentChat
      aiConfig={aiConfig}
      metaContext={metaContext}
      hasMetaData={!!account}
      clientProfile={clientProfile}
    />
  );
}
