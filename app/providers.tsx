'use client';

import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { MetaAdsClient, exchangeForLongLivedToken } from '@/lib/metaApi';
import type { AdAccount, DatePreset, CampaignMode, TokenType, MetaPermission } from '@/lib/metaTypes';
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
const NON_DEMO_PROVIDERS: AIProvider[] = ['gemini', 'openrouter', 'openai', 'anthropic'];

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}

function ls(key: string, fallback = '') {
  if (typeof window === 'undefined') return fallback;
  return localStorage.getItem(key) || fallback;
}

function setLs(key: string, value: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, value);
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('dark');
  const setTheme = (t: Theme) => {
    setThemeState(t);
    setLs('theme', t);
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', t);
    }
  };
  useEffect(() => {
    const storedTheme = ls('theme', 'dark');
    setThemeState(storedTheme === 'light' ? 'light' : 'dark');
    setDatePreset((ls('date_preset', 'last_30d') as DatePreset));
    setCampaignModeState((ls('campaign_mode', 'ecommerce') as CampaignMode));
    setMetaAccessTokenState(ls('meta_access_token'));
    setAdAccountIdState(ls('meta_ad_account_id'));
    setMetaPermissionState((ls('meta_permission', 'readonly') as MetaPermission));
    setTokenType((ls('meta_token_type', 'short') as TokenType));
    setMetaAppId(ls('meta_app_id'));
    setMetaAppSecret(ls('meta_app_secret'));

    const rawProvider = ls('ai_provider', 'openrouter') as AIProvider;
    const provider = NON_DEMO_PROVIDERS.includes(rawProvider) ? rawProvider : 'openrouter';
    setAiProviderState(provider);
    setAiApiKeys({
      gemini: ls('gemini_api_key'),
      openrouter: ls('openrouter_api_key'),
      openai: ls('openai_api_key'),
      anthropic: ls('anthropic_api_key'),
      demo: '',
    });
    const savedModel = ls(`ai_model_${provider}`);
    const validIds = (MODEL_OPTIONS[provider] || []).map((m) => m.id);
    setAiModelState(savedModel && validIds.includes(savedModel) ? savedModel : DEFAULT_MODELS[provider]);

    setClientNiche(ls('client_niche'));
    setClientProduct(ls('client_product'));
    setClientObjective(ls('client_objective', 'leads'));
    setClientTicket(ls('client_ticket'));
    setClientDifferentials(ls('client_differentials'));
  }, []);
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme);
    }
  }, [theme]);

  // Meta
  const [account, setAccount] = useState<AdAccount | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [lastSynced, setLastSynced] = useState<string | null>(null);
  const [metaContext, setMetaContext] = useState<string | undefined>(undefined);
  const [datePreset, setDatePreset] = useState<DatePreset>('last_30d');
  const [campaignMode, setCampaignModeState] = useState<CampaignMode>('ecommerce');
  const setCampaignMode = (m: CampaignMode) => {
    setCampaignModeState(m);
    setLs('campaign_mode', m);
  };

  const [metaAccessToken, setMetaAccessTokenState] = useState('');
  const setMetaAccessToken = (v: string) => { setMetaAccessTokenState(v); setLs('meta_access_token', v); };

  const [adAccountId, setAdAccountIdState] = useState('');
  const setAdAccountId = (v: string) => { setAdAccountIdState(v); setLs('meta_ad_account_id', v); };

  const [metaPermission, setMetaPermissionState] = useState<MetaPermission>('readonly');
  const saveMetaPermission = (p: MetaPermission) => { setMetaPermissionState(p); setLs('meta_permission', p); };

  const [tokenType, setTokenType] = useState<TokenType>('short');
  const [metaAppId, setMetaAppId] = useState('');
  const [metaAppSecret, setMetaAppSecret] = useState('');
  const [isConvertingToken, setIsConvertingToken] = useState(false);
  const [convertError, setConvertError] = useState<string | null>(null);
  const [convertSuccess, setConvertSuccess] = useState(false);

  // AI
  const [aiProvider, setAiProviderState] = useState<AIProvider>('openrouter');
  const [aiApiKeys, setAiApiKeys] = useState<Record<AIProvider, string>>({
    gemini: '',
    openrouter: '',
    openai: '',
    anthropic: '',
    demo: '',
  });
  const [aiModel, setAiModelState] = useState<string>(DEFAULT_MODELS.openrouter);

  const aiConfig: AIProviderConfig = { provider: aiProvider, apiKey: aiApiKeys[aiProvider] || '', model: aiModel };

  const switchProvider = (p: AIProvider) => {
    const provider = p === 'demo' ? 'openrouter' : p;
    setAiProviderState(provider);
    setLs('ai_provider', provider);
    const saved = ls(`ai_model_${provider}`);
    const validIds = (MODEL_OPTIONS[provider] || []).map((m) => m.id);
    const resolved = saved && validIds.includes(saved) ? saved : DEFAULT_MODELS[provider];
    setAiModelState(resolved);
    setLs(`ai_model_${provider}`, resolved);
  };
  const switchModel = (m: string) => {
    setAiModelState(m);
    setLs(`ai_model_${aiProvider}`, m);
  };
  const saveAiKey = (provider: AIProvider, key: string) => {
    setAiApiKeys((prev) => ({ ...prev, [provider]: key }));
    setLs(`${provider}_api_key`, key);
  };

  // Client profile
  const [clientNiche, setClientNiche] = useState('');
  const [clientProduct, setClientProduct] = useState('');
  const [clientObjective, setClientObjective] = useState('leads');
  const [clientTicket, setClientTicket] = useState('');
  const [clientDifferentials, setClientDifferentials] = useState('');
  const saveClientField = (key: string, value: string, setter: (v: string) => void) => {
    setter(value);
    setLs(key, value);
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
      syncMetaData, metaContext,
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
