'use client';

import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { MetaAdsClient, exchangeForLongLivedToken } from '@/lib/metaApi';
import type { AdAccount, DatePreset, CampaignMode, TokenType, MetaPermission } from '@/lib/metaTypes';
import { DEMO_ACCOUNT } from '@/lib/demoData';
import type { AIProvider, AIProviderConfig } from '@/lib/aiClient';
import { MODEL_OPTIONS, DEFAULT_MODELS } from '@/lib/aiClient';

export type Theme = 'dark' | 'light';

const DATE_PRESET_LABELS: Record<DatePreset, string> = {
  today: 'Hoje',
  yesterday: 'Ontem',
  last_3d: 'Últimos 3 dias',
  last_7d: 'Últimos 7 dias',
  last_14d: 'Últimos 14 dias',
  last_28d: 'Últimos 28 dias',
  last_30d: 'Últimos 30 dias',
  last_90d: 'Últimos 90 dias',
  this_month: 'Este mês',
  last_month: 'Mês passado',
};
export { DATE_PRESET_LABELS };

interface ClientProfile {
  niche?: string;
  product?: string;
  objective?: string;
  ticket?: string;
  differentials?: string;
}

interface AppContextValue {
  // Theme
  theme: Theme;
  setTheme: (t: Theme) => void;

  // Meta
  account: AdAccount | null;
  isLoading: boolean;
  syncError: string | null;
  setSyncError: (e: string | null) => void;
  lastSynced: string | null;
  datePreset: DatePreset;
  setDatePreset: (d: DatePreset) => void;
  campaignMode: CampaignMode;
  setCampaignMode: (m: CampaignMode) => void;
  metaAccessToken: string;
  setMetaAccessToken: (v: string) => void;
  adAccountId: string;
  setAdAccountId: (v: string) => void;
  metaPermission: MetaPermission;
  saveMetaPermission: (p: MetaPermission) => void;
  tokenType: TokenType;
  setTokenType: (t: TokenType) => void;
  metaAppId: string;
  setMetaAppId: (v: string) => void;
  metaAppSecret: string;
  setMetaAppSecret: (v: string) => void;
  isConvertingToken: boolean;
  convertError: string | null;
  convertSuccess: boolean;
  syncMetaData: () => Promise<void>;
  loadDemoData: () => void;

  // AI
  aiProvider: AIProvider;
  aiApiKeys: Record<AIProvider, string>;
  aiModel: string;
  aiConfig: AIProviderConfig;
  switchProvider: (p: AIProvider) => void;
  switchModel: (m: string) => void;
  saveAiKey: (provider: AIProvider, key: string) => void;
  metaContext: string | undefined;

  // Client profile
  clientNiche: string;
  clientProduct: string;
  clientObjective: string;
  clientTicket: string;
  clientDifferentials: string;
  saveClientField: (key: string, value: string, setter: (v: string) => void) => void;
  setClientNiche: (v: string) => void;
  setClientProduct: (v: string) => void;
  setClientObjective: (v: string) => void;
  setClientTicket: (v: string) => void;
  setClientDifferentials: (v: string) => void;
  clientProfile: ClientProfile | undefined;
}

const AppContext = createContext<AppContextValue | null>(null);

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}

function ls(key: string, fallback = '') {
  if (typeof window === 'undefined') return fallback;
  return localStorage.getItem(key) || fallback;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => (ls('theme', 'dark') as Theme));
  const setTheme = (t: Theme) => {
    setThemeState(t);
    localStorage.setItem('theme', t);
    document.documentElement.setAttribute('data-theme', t);
  };
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Meta
  const [account, setAccount] = useState<AdAccount | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [lastSynced, setLastSynced] = useState<string | null>(null);
  const [metaContext, setMetaContext] = useState<string | undefined>(undefined);
  const [datePreset, setDatePreset] = useState<DatePreset>(() => (ls('date_preset', 'last_30d') as DatePreset));
  const [campaignMode, setCampaignModeState] = useState<CampaignMode>(() => (ls('campaign_mode', 'ecommerce') as CampaignMode));
  const setCampaignMode = (m: CampaignMode) => {
    setCampaignModeState(m);
    localStorage.setItem('campaign_mode', m);
  };

  const [metaAccessToken, setMetaAccessTokenState] = useState(() => ls('meta_access_token'));
  const setMetaAccessToken = (v: string) => { setMetaAccessTokenState(v); localStorage.setItem('meta_access_token', v); };

  const [adAccountId, setAdAccountIdState] = useState(() => ls('meta_ad_account_id'));
  const setAdAccountId = (v: string) => { setAdAccountIdState(v); localStorage.setItem('meta_ad_account_id', v); };

  const [metaPermission, setMetaPermissionState] = useState<MetaPermission>(() => (ls('meta_permission', 'readonly') as MetaPermission));
  const saveMetaPermission = (p: MetaPermission) => { setMetaPermissionState(p); localStorage.setItem('meta_permission', p); };

  const [tokenType, setTokenType] = useState<TokenType>(() => (ls('meta_token_type', 'short') as TokenType));
  const [metaAppId, setMetaAppId] = useState(() => ls('meta_app_id'));
  const [metaAppSecret, setMetaAppSecret] = useState(() => ls('meta_app_secret'));
  const [isConvertingToken, setIsConvertingToken] = useState(false);
  const [convertError, setConvertError] = useState<string | null>(null);
  const [convertSuccess, setConvertSuccess] = useState(false);

  // AI
  const [aiProvider, setAiProviderState] = useState<AIProvider>(() => (ls('ai_provider', 'demo') as AIProvider));
  const [aiApiKeys, setAiApiKeys] = useState<Record<AIProvider, string>>(() => ({
    gemini: ls('gemini_api_key'),
    openrouter: ls('openrouter_api_key'),
    openai: ls('openai_api_key'),
    anthropic: ls('anthropic_api_key'),
    demo: '',
  }));
  const [aiModel, setAiModelState] = useState<string>(() => {
    const provider = ls('ai_provider', 'demo') as AIProvider;
    const saved = ls(`ai_model_${provider}`);
    const validIds = (MODEL_OPTIONS[provider] || []).map((m) => m.id);
    return saved && validIds.includes(saved) ? saved : DEFAULT_MODELS[provider];
  });

  const aiConfig: AIProviderConfig = { provider: aiProvider, apiKey: aiApiKeys[aiProvider] || '', model: aiModel };

  const switchProvider = (p: AIProvider) => {
    setAiProviderState(p);
    localStorage.setItem('ai_provider', p);
    const saved = ls(`ai_model_${p}`);
    const validIds = (MODEL_OPTIONS[p] || []).map((m) => m.id);
    const resolved = saved && validIds.includes(saved) ? saved : DEFAULT_MODELS[p];
    setAiModelState(resolved);
    localStorage.setItem(`ai_model_${p}`, resolved);
  };
  const switchModel = (m: string) => {
    setAiModelState(m);
    localStorage.setItem(`ai_model_${aiProvider}`, m);
  };
  const saveAiKey = (provider: AIProvider, key: string) => {
    setAiApiKeys((prev) => ({ ...prev, [provider]: key }));
    localStorage.setItem(`${provider}_api_key`, key);
  };

  // Client profile
  const [clientNiche, setClientNiche] = useState(() => ls('client_niche'));
  const [clientProduct, setClientProduct] = useState(() => ls('client_product'));
  const [clientObjective, setClientObjective] = useState(() => ls('client_objective', 'leads'));
  const [clientTicket, setClientTicket] = useState(() => ls('client_ticket'));
  const [clientDifferentials, setClientDifferentials] = useState(() => ls('client_differentials'));
  const saveClientField = (key: string, value: string, setter: (v: string) => void) => {
    setter(value);
    localStorage.setItem(key, value);
  };
  const clientProfile = clientNiche || clientProduct ? {
    niche: clientNiche, product: clientProduct, objective: clientObjective,
    ticket: clientTicket, differentials: clientDifferentials,
  } : undefined;

  // Sync
  const syncMetaData = useCallback(async () => {
    if (!metaAccessToken || !adAccountId) {
      setSyncError('Configure o Meta Access Token e o Ad Account ID nas Configurações.');
      return;
    }
    setIsLoading(true);
    setSyncError(null);
    try {
      const client = new MetaAdsClient({
        accessToken: metaAccessToken,
        adAccountId: adAccountId.startsWith('act_') ? adAccountId : `act_${adAccountId}`,
      });
      const data = await client.getFullAccountSnapshot(datePreset, campaignMode);
      setAccount(data);
      const ctx = MetaAdsClient.formatForAgent(data, DATE_PRESET_LABELS[datePreset], campaignMode);
      setMetaContext(ctx);
      setLastSynced(new Date().toLocaleTimeString('pt-BR'));
    } catch (err: unknown) {
      setSyncError((err as Error).message || 'Erro ao conectar com a Meta API.');
    } finally {
      setIsLoading(false);
    }
  }, [metaAccessToken, adAccountId, datePreset, campaignMode]);

  const loadDemoData = useCallback(() => {
    setAccount(DEMO_ACCOUNT);
    const ctx = MetaAdsClient.formatForAgent(DEMO_ACCOUNT, 'Demo — Últimos 30 dias', campaignMode);
    setMetaContext(ctx);
    setLastSynced('Demo');
    setSyncError(null);
    switchProvider('demo');
  }, [campaignMode]);

  // suppress unused
  void tokenType; void setTokenType; void metaAppId; void setMetaAppId;
  void metaAppSecret; void setMetaAppSecret; void isConvertingToken; void setIsConvertingToken;
  void convertError; void setConvertError; void convertSuccess; void setConvertSuccess;
  void exchangeForLongLivedToken;

  return (
    <AppContext.Provider value={{
      theme, setTheme,
      account, isLoading, syncError, setSyncError, lastSynced,
      datePreset, setDatePreset, campaignMode, setCampaignMode,
      metaAccessToken, setMetaAccessToken,
      adAccountId, setAdAccountId,
      metaPermission, saveMetaPermission,
      tokenType, setTokenType, metaAppId, setMetaAppId,
      metaAppSecret, setMetaAppSecret,
      isConvertingToken, convertError, convertSuccess,
      syncMetaData, loadDemoData, metaContext,
      aiProvider, aiApiKeys, aiModel, aiConfig,
      switchProvider, switchModel, saveAiKey,
      clientNiche, clientProduct, clientObjective, clientTicket, clientDifferentials,
      saveClientField, setClientNiche, setClientProduct, setClientObjective, setClientTicket, setClientDifferentials,
      clientProfile,
    }}>
      {children}
    </AppContext.Provider>
  );
}
