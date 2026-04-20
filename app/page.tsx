'use client';

import { useState, useCallback } from 'react';
import {
  Settings, BarChart2, MessageSquare, Zap, TrendingUp, X, Image, Users,
  RefreshCw, ChevronDown, AlertCircle,
} from 'lucide-react';
import { AiAgentChat } from '@/components/AiAgentChat';
import { InsightsDashboard } from '@/components/InsightsDashboard';
import { CreativeGallery } from '@/components/CreativeGallery';
import { AudiencePanel } from '@/components/AudiencePanel';
import { MetaAdsClient, exchangeForLongLivedToken } from '@/lib/metaApi';
import type { AdAccount, DatePreset, CampaignMode, TokenType } from '@/lib/metaTypes';
import { CAMPAIGN_MODE_LABELS } from '@/lib/metaTypes';
import type { AIProvider, AIProviderConfig } from '@/lib/aiClient';
import { PROVIDER_LABELS, MODEL_OPTIONS, DEFAULT_MODELS } from '@/lib/aiClient';
import { DEMO_ACCOUNT } from '@/lib/demoData';

type Tab = 'dashboard' | 'creatives' | 'audiences' | 'chat';

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

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDateMenuOpen, setIsDateMenuOpen] = useState(false);
  const [isModeMenuOpen, setIsModeMenuOpen] = useState(false);

  // Meta API Keys
  const [metaAccessToken, setMetaAccessToken] = useState(() =>
    typeof window !== 'undefined' ? localStorage.getItem('meta_access_token') || '' : ''
  );
  const [adAccountId, setAdAccountId] = useState(() =>
    typeof window !== 'undefined' ? localStorage.getItem('meta_ad_account_id') || '' : ''
  );
  const [tokenType, setTokenType] = useState<TokenType>(() =>
    typeof window !== 'undefined'
      ? (localStorage.getItem('meta_token_type') as TokenType) || 'short'
      : 'short'
  );
  const [metaAppId, setMetaAppId] = useState(() =>
    typeof window !== 'undefined' ? localStorage.getItem('meta_app_id') || '' : ''
  );
  const [metaAppSecret, setMetaAppSecret] = useState(() =>
    typeof window !== 'undefined' ? localStorage.getItem('meta_app_secret') || '' : ''
  );
  const [isConvertingToken, setIsConvertingToken] = useState(false);
  const [convertError, setConvertError] = useState<string | null>(null);
  const [convertSuccess, setConvertSuccess] = useState(false);

  // AI Provider Config
  const [aiProvider, setAiProvider] = useState<AIProvider>(() =>
    typeof window !== 'undefined'
      ? (localStorage.getItem('ai_provider') as AIProvider) || 'demo'
      : 'demo'
  );
  const [aiApiKeys, setAiApiKeys] = useState<Record<AIProvider, string>>(() => ({
    gemini: typeof window !== 'undefined' ? localStorage.getItem('gemini_api_key') || '' : '',
    openrouter: typeof window !== 'undefined' ? localStorage.getItem('openrouter_api_key') || '' : '',
    openai: typeof window !== 'undefined' ? localStorage.getItem('openai_api_key') || '' : '',
    anthropic: typeof window !== 'undefined' ? localStorage.getItem('anthropic_api_key') || '' : '',
    demo: '',
  }));
  const [aiModel, setAiModel] = useState(() => {
    if (typeof window === 'undefined') return DEFAULT_MODELS['demo'];
    const provider = (localStorage.getItem('ai_provider') as AIProvider) || 'demo';
    const saved = localStorage.getItem(`ai_model_${provider}`);
    const validIds = (MODEL_OPTIONS[provider] || []).map((m) => m.id);
    return saved && validIds.includes(saved) ? saved : DEFAULT_MODELS[provider];
  });

  const aiConfig: AIProviderConfig = {
    provider: aiProvider,
    apiKey: aiApiKeys[aiProvider] || '',
    model: aiModel,
  };

  const saveAiKey = (provider: AIProvider, key: string) => {
    setAiApiKeys((prev) => ({ ...prev, [provider]: key }));
    localStorage.setItem(`${provider}_api_key`, key);
  };

  const switchProvider = (provider: AIProvider) => {
    setAiProvider(provider);
    localStorage.setItem('ai_provider', provider);
    const savedModel = localStorage.getItem(`ai_model_${provider}`);
    const validIds = (MODEL_OPTIONS[provider] || []).map((m) => m.id);
    const resolved = savedModel && validIds.includes(savedModel) ? savedModel : DEFAULT_MODELS[provider];
    setAiModel(resolved);
    localStorage.setItem(`ai_model_${provider}`, resolved);
  };

  const switchModel = (model: string) => {
    setAiModel(model);
    localStorage.setItem(`ai_model_${aiProvider}`, model);
  };

  // Meta data
  const [account, setAccount] = useState<AdAccount | null>(null);
  const [metaContext, setMetaContext] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [lastSynced, setLastSynced] = useState<string | null>(null);
  const [datePreset, setDatePreset] = useState<DatePreset>('last_30d');
  const [campaignMode, setCampaignMode] = useState<CampaignMode>('ecommerce');

  // Client profile
  const [clientNiche, setClientNiche] = useState(() =>
    typeof window !== 'undefined' ? localStorage.getItem('client_niche') || '' : ''
  );
  const [clientProduct, setClientProduct] = useState(() =>
    typeof window !== 'undefined' ? localStorage.getItem('client_product') || '' : ''
  );
  const [clientObjective, setClientObjective] = useState(() =>
    typeof window !== 'undefined' ? localStorage.getItem('client_objective') || 'leads' : 'leads'
  );
  const [clientTicket, setClientTicket] = useState(() =>
    typeof window !== 'undefined' ? localStorage.getItem('client_ticket') || '' : ''
  );
  const [clientDifferentials, setClientDifferentials] = useState(() =>
    typeof window !== 'undefined' ? localStorage.getItem('client_differentials') || '' : ''
  );

  const saveClientField = (key: string, value: string, setter: (v: string) => void) => {
    setter(value);
    localStorage.setItem(key, value);
  };

  const clientProfile = clientNiche || clientProduct ? {
    niche: clientNiche,
    product: clientProduct,
    objective: clientObjective,
    ticket: clientTicket,
    differentials: clientDifferentials,
  } : undefined;

  const saveMetaConfig = (key: string, value: string, setter: (v: string) => void) => {
    setter(value);
    localStorage.setItem(key, value);
  };

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
      const context = MetaAdsClient.formatForAgent(data, DATE_PRESET_LABELS[datePreset], campaignMode);
      setMetaContext(context);
      setLastSynced(new Date().toLocaleTimeString('pt-BR'));
    } catch (err: unknown) {
      const error = err as Error;
      setSyncError(error.message || 'Erro ao conectar com a Meta API.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [metaAccessToken, adAccountId, datePreset, campaignMode]);

  const loadDemoData = useCallback(() => {
    setAccount(DEMO_ACCOUNT);
    const context = MetaAdsClient.formatForAgent(DEMO_ACCOUNT, 'Demo — Últimos 30 dias', campaignMode);
    setMetaContext(context);
    setLastSynced('Demo');
    setSyncError(null);
    switchProvider('demo');
  }, [campaignMode]);

  // suppress unused warning for token conversion state
  void tokenType; void setTokenType; void metaAppId; void setMetaAppId;
  void metaAppSecret; void setMetaAppSecret; void isConvertingToken; void setIsConvertingToken;
  void convertError; void setConvertError; void convertSuccess; void setConvertSuccess;
  void exchangeForLongLivedToken;

  const NAV_ITEMS = [
    { id: 'dashboard' as Tab, icon: BarChart2, label: 'Dashboard' },
    { id: 'creatives' as Tab, icon: Image, label: 'Criativos' },
    { id: 'audiences' as Tab, icon: Users, label: 'Públicos' },
    { id: 'chat' as Tab, icon: MessageSquare, label: 'AI Copilot' },
  ];

  return (
    <div className="app-container">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="logo-container">
          <div className="logo-icon">
            <TrendingUp size={22} />
          </div>
          <div>
            <div className="logo-text">ARIA</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: -4 }}>Meta Ads Agent</div>
          </div>
        </div>

        <div className="nav-menu">
          {NAV_ITEMS.map(({ id, icon: Icon, label }) => (
            <div
              key={id}
              className={`nav-item ${activeTab === id ? 'active' : ''}`}
              onClick={() => setActiveTab(id)}
            >
              <Icon size={20} />
              <span>{label}</span>
              {id === 'chat' && account && (
                <span style={{ marginLeft: 'auto', width: 8, height: 8, borderRadius: '50%', background: 'var(--success)', boxShadow: '0 0 6px var(--success)' }} />
              )}
            </div>
          ))}
        </div>

        {/* AI Provider badge */}
        <div
          onClick={() => setIsSettingsOpen(true)}
          style={{
            margin: '12px 0', padding: '10px 14px', cursor: 'pointer',
            background:
              aiProvider === 'demo'       ? 'rgba(255,184,0,0.1)' :
              aiProvider === 'openrouter' ? 'rgba(0,255,157,0.08)' :
              'rgba(112,0,255,0.08)',
            borderRadius: 10,
            border: `1px solid ${
              aiProvider === 'demo'       ? 'rgba(255,184,0,0.3)' :
              aiProvider === 'openrouter' ? 'rgba(0,255,157,0.25)' :
              'rgba(112,0,255,0.2)'
            }`,
            transition: 'opacity 0.15s',
          }}
          title="Clique para trocar o provedor de IA"
        >
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 2 }}>IA Ativa <span style={{ opacity: 0.6 }}>(clique p/ trocar)</span></div>
          <div style={{
            fontSize: '0.8rem', fontWeight: 600,
            color:
              aiProvider === 'demo'       ? 'var(--warning)' :
              aiProvider === 'openrouter' ? 'var(--success)' :
              'var(--accent-secondary)',
          }}>
            {aiProvider === 'demo'       ? '🎭 Modo Demo' :
             aiProvider === 'openrouter' ? '🆓 OpenRouter' :
             PROVIDER_LABELS[aiProvider]}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 1 }}>{aiModel}</div>
        </div>

        {/* Sync Status */}
        {account && (
          <div style={{ margin: '8px 0', padding: '10px 14px', background: 'rgba(0,255,157,0.07)', borderRadius: 10, border: '1px solid rgba(0,255,157,0.15)' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--success)', fontWeight: 600, marginBottom: 2 }}>✓ Conta Sincronizada</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{account.name}</div>
            {lastSynced && <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Às {lastSynced}</div>}
          </div>
        )}

        <div className="settings-section">
          <div className="nav-item" onClick={() => setIsSettingsOpen(true)}>
            <Settings size={20} />
            <span>Configurações</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Header */}
        <div className="header">
          <div className="header-title">
            <h1>
              {activeTab === 'chat' ? 'AI Copilot' :
               activeTab === 'creatives' ? 'Análise de Criativos' :
               activeTab === 'audiences' ? 'Análise de Públicos' :
               'Dashboard'}
            </h1>
            <p style={{ color: 'var(--text-secondary)' }}>
              {activeTab === 'chat' ? 'ARIA — Agente especialista em Meta Ads 2024-2025' :
               activeTab === 'creatives' ? 'Score e recomendações para cada anúncio ativo' :
               activeTab === 'audiences' ? 'Diagnóstico de targeting e saturação de público' :
               account ? `${account.name} · ${account.currency} · ${account.timezone_name}` : 'Conecte sua conta Meta Ads'}
            </p>
          </div>
          <div className="header-actions">
            {activeTab !== 'chat' && (
              <>
                {/* Campaign Mode Selector */}
                <div style={{ position: 'relative' }}>
                  <button
                    style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', padding: '10px 14px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.875rem', cursor: 'pointer' }}
                    onClick={() => { setIsModeMenuOpen((p) => !p); setIsDateMenuOpen(false); }}
                  >
                    {CAMPAIGN_MODE_LABELS[campaignMode]}
                    <ChevronDown size={16} />
                  </button>
                  {isModeMenuOpen && (
                    <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 4, background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: 10, overflow: 'hidden', zIndex: 50, minWidth: 220, boxShadow: '0 12px 40px rgba(0,0,0,0.4)' }}>
                      {(Object.entries(CAMPAIGN_MODE_LABELS) as [CampaignMode, string][]).map(([key, label]) => (
                        <div
                          key={key}
                          onClick={() => { setCampaignMode(key); setIsModeMenuOpen(false); }}
                          style={{ padding: '10px 16px', fontSize: '0.875rem', cursor: 'pointer', color: campaignMode === key ? 'var(--accent-primary)' : 'var(--text-secondary)', background: campaignMode === key ? 'rgba(0,240,255,0.07)' : 'transparent' }}
                          onMouseEnter={(e) => { if (campaignMode !== key) (e.target as HTMLElement).style.background = 'rgba(255,255,255,0.05)'; }}
                          onMouseLeave={(e) => { if (campaignMode !== key) (e.target as HTMLElement).style.background = 'transparent'; }}
                        >
                          {label}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Date Preset Selector */}
                <div style={{ position: 'relative' }}>
                  <button
                    style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', padding: '10px 14px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.875rem', cursor: 'pointer' }}
                    onClick={() => { setIsDateMenuOpen((p) => !p); setIsModeMenuOpen(false); }}
                  >
                    {DATE_PRESET_LABELS[datePreset]}
                    <ChevronDown size={16} />
                  </button>
                  {isDateMenuOpen && (
                    <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 4, background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: 10, overflow: 'hidden', zIndex: 50, minWidth: 180, boxShadow: '0 12px 40px rgba(0,0,0,0.4)' }}>
                      {(Object.entries(DATE_PRESET_LABELS) as [DatePreset, string][]).map(([key, label]) => (
                        <div
                          key={key}
                          onClick={() => { setDatePreset(key); setIsDateMenuOpen(false); }}
                          style={{ padding: '10px 16px', fontSize: '0.875rem', cursor: 'pointer', color: datePreset === key ? 'var(--accent-primary)' : 'var(--text-secondary)', background: datePreset === key ? 'rgba(0,240,255,0.07)' : 'transparent' }}
                          onMouseEnter={(e) => { if (datePreset !== key) (e.target as HTMLElement).style.background = 'rgba(255,255,255,0.05)'; }}
                          onMouseLeave={(e) => { if (datePreset !== key) (e.target as HTMLElement).style.background = 'transparent'; }}
                        >
                          {label}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  className="btn-primary"
                  onClick={syncMetaData}
                  disabled={isLoading}
                >
                  {isLoading ? <RefreshCw size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <Zap size={18} />}
                  {isLoading ? 'Sincronizando...' : 'Sincronizar Meta Ads'}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Error Banner */}
        {syncError && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', marginBottom: 16, background: 'rgba(255,51,102,0.1)', border: '1px solid rgba(255,51,102,0.3)', borderRadius: 10 }}>
            <AlertCircle size={18} color="var(--danger)" />
            <span style={{ fontSize: '0.875rem', color: 'var(--danger)' }}>{syncError}</span>
            <button onClick={() => setSyncError(null)} style={{ marginLeft: 'auto', background: 'transparent', border: 'none', padding: 4, cursor: 'pointer' }}>
              <X size={16} color="var(--text-muted)" />
            </button>
          </div>
        )}

        {/* Tab Content */}
        {activeTab === 'dashboard' && (
          <InsightsDashboard account={account} isLoading={isLoading} datePreset={DATE_PRESET_LABELS[datePreset]} campaignMode={campaignMode} />
        )}
        {activeTab === 'creatives' && (
          <CreativeGallery account={account} isLoading={isLoading} campaignMode={campaignMode} clientProfile={clientProfile} />
        )}
        {activeTab === 'audiences' && (
          <AudiencePanel account={account} isLoading={isLoading} clientProfile={clientProfile} />
        )}
        {activeTab === 'chat' && (
          <AiAgentChat aiConfig={aiConfig} metaContext={metaContext} hasMetaData={!!account} clientProfile={clientProfile} />
        )}
      </div>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="modal-overlay" onClick={() => setIsSettingsOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setIsSettingsOpen(false)}><X size={20} /></button>
            <div className="modal-header">
              <h2>⚙️ Configurações</h2>
              <p style={{ color: 'var(--text-secondary)' }}>Configure o provedor de IA e a conta Meta Ads.</p>
            </div>

            {/* Demo Mode Banner */}
            <div
              onClick={loadDemoData}
              style={{
                cursor: 'pointer', marginBottom: 20, padding: '16px 20px',
                background: 'linear-gradient(135deg, rgba(255,184,0,0.15), rgba(255,184,0,0.05))',
                border: '1px solid rgba(255,184,0,0.4)', borderRadius: 14,
                display: 'flex', gap: 14, alignItems: 'center',
                transition: 'border-color 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(255,184,0,0.8)')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(255,184,0,0.4)')}
            >
              <div style={{ fontSize: 32, flexShrink: 0 }}>🎭</div>
              <div>
                <div style={{ fontWeight: 700, color: 'var(--warning)', marginBottom: 4 }}>Modo Demo — Sem API Key</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  Teste todas as funcionalidades com uma conta fictícia realista. <strong style={{ color: 'var(--warning)' }}>Clique para ativar →</strong>
                </div>
              </div>
            </div>

            {/* AI Provider Selector */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', marginBottom: 10, fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                🤖 Provedor de IA
              </label>

              <div
                onClick={() => switchProvider('openrouter' as AIProvider)}
                style={{
                  background: aiProvider === 'openrouter' ? 'rgba(0,255,157,0.12)' : 'rgba(0,255,157,0.06)',
                  border: aiProvider === 'openrouter' ? '2px solid var(--success)' : '1px solid rgba(0,255,157,0.3)',
                  borderRadius: 10, padding: '10px 14px', marginBottom: 10, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 10,
                }}
              >
                <span style={{ fontSize: '1.4rem' }}>🆓</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--success)' }}>OpenRouter — Modelos GRATUITOS</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>Llama 4, Gemma 3, DeepSeek V3 e mais — sem cartão, conta grátis em openrouter.ai</div>
                </div>
                {aiProvider === 'openrouter' && <span style={{ fontSize: '0.75rem', color: 'var(--success)', fontWeight: 700 }}>✓ ATIVO</span>}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 12 }}>
                {(['demo', 'gemini', 'openai', 'anthropic'] as AIProvider[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => switchProvider(p)}
                    style={{
                      padding: '10px 8px', borderRadius: 10, fontSize: '0.8rem', fontWeight: 600,
                      border: aiProvider === p ? '2px solid var(--accent-primary)' : '1px solid var(--glass-border)',
                      background: aiProvider === p ? 'rgba(0,240,255,0.1)' : 'var(--bg-primary)',
                      color: aiProvider === p ? 'var(--accent-primary)' : 'var(--text-secondary)',
                      cursor: 'pointer',
                    }}
                  >
                    {p === 'demo' ? '🎭 Demo' : p === 'gemini' ? '🔵 Gemini' : p === 'openai' ? '🟢 GPT' : '🟣 Claude'}
                  </button>
                ))}
              </div>

              <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                Modelo ({PROVIDER_LABELS[aiProvider]})
              </label>
              <select
                value={aiModel}
                onChange={(e) => switchModel(e.target.value)}
                className="form-input"
                style={{ cursor: 'pointer' }}
              >
                {(MODEL_OPTIONS[aiProvider] || []).map((m) => (
                  <option key={m.id} value={m.id}>{m.label}</option>
                ))}
              </select>

              {aiProvider !== 'demo' && (
                <div className="form-group" style={{ marginTop: 16, marginBottom: 0 }}>
                  <label>
                    API Key — {PROVIDER_LABELS[aiProvider]} <span style={{ color: 'var(--danger)' }}>*</span>
                  </label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder={
                      aiProvider === 'gemini'     ? 'AIzaSy...' :
                      aiProvider === 'openrouter' ? 'sk-or-v1-...' :
                      aiProvider === 'openai'     ? 'sk-...' :
                                                   'sk-ant-...'
                    }
                    value={aiApiKeys[aiProvider] || ''}
                    onChange={(e) => saveAiKey(aiProvider, e.target.value)}
                  />
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 6 }}>
                    {aiProvider === 'gemini' && (
                      <><a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" style={{ color: 'var(--success)' }}>✅ aistudio.google.com</a> — GRATUITO, usa sua conta Google, sem cartão</>)}
                    {aiProvider === 'openrouter' && (
                      <><a href="https://openrouter.ai/keys" target="_blank" rel="noreferrer" style={{ color: 'var(--success)' }}>✅ openrouter.ai/keys</a> — Crie conta grátis → Settings → API Keys → Create Key</>
                    )}
                    {aiProvider === 'openai' && <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer">platform.openai.com/api-keys — requer billing</a>}
                    {aiProvider === 'anthropic' && <a href="https://console.anthropic.com/" target="_blank" rel="noreferrer">console.anthropic.com — requer billing</a>}
                  </p>
                </div>
              )}

              {aiProvider === 'demo' && (
                <div style={{ padding: '10px 14px', background: 'rgba(255,184,0,0.08)', borderRadius: 8, fontSize: '0.82rem', color: 'var(--warning)', marginTop: 8 }}>
                  🎭 Modo Demo ativo — nenhuma API Key necessária. Os dados e respostas são simulados.
                </div>
              )}
            </div>

            {/* Client Profile */}
            <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: 20, marginBottom: 20 }}>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                🎯 Perfil do Cliente
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 16 }}>Informe o que o cliente vende — a ARIA vai adaptar toda a estratégia para o nicho.</p>

              <div className="form-group">
                <label>Nicho / Segmento ✦</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ex: Consórcios, Imóveis, Clínica Estética, SaaS B2B..."
                  value={clientNiche}
                  onChange={(e) => saveClientField('client_niche', e.target.value, setClientNiche)}
                />
              </div>

              <div className="form-group">
                <label>Produto / Serviço Principal</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ex: Consórcio de imóvel de até R$500k, Procedimento lip filler..."
                  value={clientProduct}
                  onChange={(e) => saveClientField('client_product', e.target.value, setClientProduct)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Objetivo Principal</label>
                  <select
                    className="form-input"
                    value={clientObjective}
                    onChange={(e) => saveClientField('client_objective', e.target.value, setClientObjective)}
                    style={{ cursor: 'pointer' }}
                  >
                    <option value="leads">🎯 Geração de Leads</option>
                    <option value="whatsapp">💬 Mensagens WhatsApp</option>
                    <option value="sales">🛒 Vendas Diretas</option>
                    <option value="awareness">📣 Reconhecimento de Marca</option>
                    <option value="traffic">🔗 Tráfego para Site</option>
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Ticket Médio (R$)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ex: 350 ou 50000"
                    value={clientTicket}
                    onChange={(e) => saveClientField('client_ticket', e.target.value, setClientTicket)}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginTop: 12 }}>
                <label>Diferenciais / Objeções a Superar</label>
                <textarea
                  className="form-input"
                  placeholder="Ex: Sem entrada, sem juros, aprovação em 24h..."
                  value={clientDifferentials}
                  onChange={(e) => saveClientField('client_differentials', e.target.value, setClientDifferentials)}
                  style={{ resize: 'vertical', minHeight: 72 }}
                />
              </div>

              {clientNiche && (
                <div style={{ padding: '10px 14px', background: 'rgba(0,240,255,0.07)', borderRadius: 8, fontSize: '0.82rem', color: 'var(--accent-primary)', marginTop: 4 }}>
                  ✅ Perfil salvo — ARIA vai usar essas informações em todas as análises.
                </div>
              )}
            </div>

            {/* Meta API */}
            <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: 20, marginBottom: 20 }}>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 20, height: 20, borderRadius: '50%', background: 'linear-gradient(135deg, #1877F2, #E4405F)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', color: 'white', fontWeight: 900 }}>f</span>
                Meta Graph API
              </div>

              <div className="form-group">
                <label>Meta Access Token</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="EAAG..."
                  value={metaAccessToken}
                  onChange={(e) => saveMetaConfig('meta_access_token', e.target.value, setMetaAccessToken)}
                />
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 6 }}>
                  <a href="https://developers.facebook.com/tools/explorer/" target="_blank" rel="noreferrer">Meta Graph API Explorer</a> → permissões <code style={{ background: 'var(--bg-tertiary)', padding: '1px 4px', borderRadius: 4 }}>ads_read</code> + <code style={{ background: 'var(--bg-tertiary)', padding: '1px 4px', borderRadius: 4 }}>read_insights</code>
                </p>
              </div>

              <div className="form-group">
                <label>Ad Account ID</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="act_XXXXXXXXXX ou XXXXXXXXXX"
                  value={adAccountId}
                  onChange={(e) => saveMetaConfig('meta_ad_account_id', e.target.value, setAdAccountId)}
                />
              </div>
            </div>

            {metaAccessToken && adAccountId && (
              <button
                className="btn-primary"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => { setIsSettingsOpen(false); syncMetaData(); }}
              >
                <Zap size={18} /> Salvar e Sincronizar Agora
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
