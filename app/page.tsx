'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  Settings, BarChart2, MessageSquare, Zap, TrendingUp, X, Users,
  RefreshCw, ChevronDown, AlertCircle, Sun, Moon,
} from 'lucide-react';
import { AiAgentChat } from '@/components/AiAgentChat';
import { InsightsDashboard } from '@/components/InsightsDashboard';
import { AudiencePanel } from '@/components/AudiencePanel';
import { MetaAdsClient, exchangeForLongLivedToken } from '@/lib/metaApi';
import type { AdAccount, DatePreset, CampaignMode, TokenType, MetaPermission } from '@/lib/metaTypes';
import { CAMPAIGN_MODE_LABELS, META_PERMISSION_INFO } from '@/lib/metaTypes';
import type { AIProvider, AIProviderConfig } from '@/lib/aiClient';
import { PROVIDER_LABELS, MODEL_OPTIONS, DEFAULT_MODELS } from '@/lib/aiClient';
import { DEMO_ACCOUNT } from '@/lib/demoData';

type Tab = 'dashboard' | 'audiences' | 'chat' | 'settings';
type Theme = 'dark' | 'light';

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
  const [isDateMenuOpen, setIsDateMenuOpen] = useState(false);
  const [isModeMenuOpen, setIsModeMenuOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>(() =>
    typeof window !== 'undefined' ? (localStorage.getItem('theme') as Theme) || 'dark' : 'dark'
  );

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Meta API Keys
  const [metaAccessToken, setMetaAccessToken] = useState(() =>
    typeof window !== 'undefined' ? localStorage.getItem('meta_access_token') || '' : ''
  );
  const [adAccountId, setAdAccountId] = useState(() =>
    typeof window !== 'undefined' ? localStorage.getItem('meta_ad_account_id') || '' : ''
  );
  const [metaPermission, setMetaPermission] = useState<MetaPermission>(() =>
    typeof window !== 'undefined'
      ? (localStorage.getItem('meta_permission') as MetaPermission) || 'readonly'
      : 'readonly'
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

  const saveMetaPermission = (p: MetaPermission) => {
    setMetaPermission(p);
    localStorage.setItem('meta_permission', p);
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
          onClick={() => setActiveTab('settings')}
          style={{
            margin: '12px 0', padding: '10px 12px', cursor: 'pointer',
            background: 'var(--bg-component)',
            borderRadius: 8,
            border: '1px solid var(--border-base)',
            transition: 'border-color 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--border-strong)')}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-base)')}
          title="Clique para trocar o provedor de IA"
        >
          <div style={{ fontSize: '0.7rem', color: 'var(--fg-muted)', marginBottom: 2 }}>IA Ativa <span style={{ opacity: 0.6 }}>(clique p/ trocar)</span></div>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--fg-base)' }}>
            {aiProvider === 'demo'       ? '🎭 Modo Demo' :
             aiProvider === 'openrouter' ? '🆓 OpenRouter' :
             PROVIDER_LABELS[aiProvider]}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--fg-muted)', marginTop: 1 }}>{aiModel}</div>
        </div>

        {/* Sync Status */}
        {account && (
          <div style={{ margin: '8px 0', padding: '10px 12px', background: 'var(--success-bg)', borderRadius: 8, border: '1px solid var(--success-border)' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--success)', fontWeight: 600, marginBottom: 2 }}>✓ Conta Sincronizada</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--fg-muted)' }}>{account.name}</div>
            {lastSynced && <div style={{ fontSize: '0.7rem', color: 'var(--fg-muted)' }}>Às {lastSynced}</div>}
            <div style={{
              marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 4,
              fontSize: '0.65rem', fontWeight: 600, padding: '2px 7px', borderRadius: 10,
              background: metaPermission === 'readwrite' ? 'var(--accent-subtle)' : 'var(--bg-hover)',
              color: metaPermission === 'readwrite' ? 'var(--accent-primary)' : 'var(--fg-muted)',
              border: metaPermission === 'readwrite' ? '1px solid var(--accent-border)' : '1px solid var(--border-base)',
            }}>
              {metaPermission === 'readwrite' ? '✏️ Leitura + Escrita' : '👁️ Somente Leitura'}
            </div>
          </div>
        )}

        <div className="settings-section">
          <div className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
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
               activeTab === 'audiences' ? 'Análise de Públicos' :
               activeTab === 'settings' ? 'Configurações' :
               'Dashboard'}
            </h1>
            <p style={{ color: 'var(--text-secondary)' }}>
              {activeTab === 'chat' ? 'ARIA — Agente especialista em Meta Ads 2024-2025' :
               activeTab === 'audiences' ? 'Diagnóstico de targeting e saturação de público' :
               activeTab === 'settings' ? 'Provedor de IA, conta Meta Ads e perfil do cliente' :
               account ? `${account.name} · ${account.currency} · ${account.timezone_name}` : 'Conecte sua conta Meta Ads'}
            </p>
          </div>
          <div className="header-actions">
            {activeTab !== 'chat' && activeTab !== 'settings' && (
              <>
                {/* Campaign Mode Selector */}
                <div style={{ position: 'relative' }}>
                  <button
                    style={{ background: 'var(--bg-component)', border: '1px solid var(--border-base)', padding: '8px 12px', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8125rem', cursor: 'pointer', color: 'var(--fg-base)' }}
                    onClick={() => { setIsModeMenuOpen((p) => !p); setIsDateMenuOpen(false); }}
                  >
                    {CAMPAIGN_MODE_LABELS[campaignMode]}
                    <ChevronDown size={14} />
                  </button>
                  {isModeMenuOpen && (
                    <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 4, background: 'var(--bg-subtle)', border: '1px solid var(--border-base)', borderRadius: 8, overflow: 'hidden', zIndex: 50, minWidth: 220, boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
                      {(Object.entries(CAMPAIGN_MODE_LABELS) as [CampaignMode, string][]).map(([key, label]) => (
                        <div
                          key={key}
                          onClick={() => { setCampaignMode(key); setIsModeMenuOpen(false); }}
                          style={{ padding: '9px 14px', fontSize: '0.8125rem', cursor: 'pointer', color: campaignMode === key ? 'var(--accent-primary)' : 'var(--fg-subtle)', background: campaignMode === key ? 'var(--accent-subtle)' : 'transparent' }}
                          onMouseEnter={(e) => { if (campaignMode !== key) (e.target as HTMLElement).style.background = 'var(--bg-hover)'; }}
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
                    style={{ background: 'var(--bg-component)', border: '1px solid var(--border-base)', padding: '8px 12px', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8125rem', cursor: 'pointer', color: 'var(--fg-base)' }}
                    onClick={() => { setIsDateMenuOpen((p) => !p); setIsModeMenuOpen(false); }}
                  >
                    {DATE_PRESET_LABELS[datePreset]}
                    <ChevronDown size={14} />
                  </button>
                  {isDateMenuOpen && (
                    <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 4, background: 'var(--bg-subtle)', border: '1px solid var(--border-base)', borderRadius: 8, overflow: 'hidden', zIndex: 50, minWidth: 180, boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
                      {(Object.entries(DATE_PRESET_LABELS) as [DatePreset, string][]).map(([key, label]) => (
                        <div
                          key={key}
                          onClick={() => { setDatePreset(key); setIsDateMenuOpen(false); }}
                          style={{ padding: '9px 14px', fontSize: '0.8125rem', cursor: 'pointer', color: datePreset === key ? 'var(--accent-primary)' : 'var(--fg-subtle)', background: datePreset === key ? 'var(--accent-subtle)' : 'transparent' }}
                          onMouseEnter={(e) => { if (datePreset !== key) (e.target as HTMLElement).style.background = 'var(--bg-hover)'; }}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', marginBottom: 16, background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', borderRadius: 8 }}>
            <AlertCircle size={16} color="var(--danger)" />
            <span style={{ fontSize: '0.8125rem', color: 'var(--danger)' }}>{syncError}</span>
            <button onClick={() => setSyncError(null)} style={{ marginLeft: 'auto', background: 'transparent', border: 'none', padding: 4, cursor: 'pointer', color: 'var(--fg-muted)' }}>
              <X size={14} />
            </button>
          </div>
        )}

        {/* Tab Content */}
        {activeTab === 'dashboard' && (
          <InsightsDashboard account={account} isLoading={isLoading} datePreset={DATE_PRESET_LABELS[datePreset]} campaignMode={campaignMode} metaPermission={metaPermission} />
        )}
{activeTab === 'audiences' && (
          <AudiencePanel account={account} isLoading={isLoading} clientProfile={clientProfile} />
        )}
        {activeTab === 'chat' && (
          <AiAgentChat aiConfig={aiConfig} metaContext={metaContext} hasMetaData={!!account} clientProfile={clientProfile} />
        )}
        {activeTab === 'settings' && (
          <div style={{ maxWidth: 640, display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Tema */}
            <div className="glass-panel">
              <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--fg-subtle)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                {theme === 'dark' ? <Moon size={15} /> : <Sun size={15} />} Aparência
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {(['dark', 'light'] as Theme[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTheme(t)}
                    style={{
                      padding: '10px 12px', borderRadius: 8, fontSize: '0.875rem', fontWeight: 500,
                      border: theme === t ? '1px solid var(--accent-primary)' : '1px solid var(--border-base)',
                      background: theme === t ? 'var(--accent-subtle)' : 'var(--bg-field)',
                      color: theme === t ? 'var(--accent-primary)' : 'var(--fg-subtle)',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      transition: 'all 0.15s',
                    }}
                  >
                    {t === 'dark' ? <><Moon size={15} /> Escuro</> : <><Sun size={15} /> Claro</>}
                  </button>
                ))}
              </div>
            </div>

            {/* Meta Graph API */}
            <div className="glass-panel">
              <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--fg-subtle)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 18, height: 18, borderRadius: '50%', background: 'linear-gradient(135deg, #1877F2, #E4405F)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', color: 'white', fontWeight: 900, flexShrink: 0 }}>f</span>
                Meta Graph API
              </div>

              {/* Permission selector */}
              <div className="form-group">
                <label>Tipo de Permissão do Token</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
                  {(['readonly', 'readwrite'] as MetaPermission[]).map((p) => {
                    const info = META_PERMISSION_INFO[p];
                    const active = metaPermission === p;
                    return (
                      <div
                        key={p}
                        onClick={() => saveMetaPermission(p)}
                        style={{
                          padding: '11px 14px', borderRadius: 8, cursor: 'pointer',
                          border: active ? '1px solid var(--accent-primary)' : '1px solid var(--border-base)',
                          background: active ? 'var(--accent-subtle)' : 'var(--bg-field)',
                          display: 'flex', gap: 12, alignItems: 'flex-start',
                          transition: 'border-color 0.15s, background 0.15s',
                        }}
                      >
                        <div style={{
                          width: 16, height: 16, borderRadius: '50%', flexShrink: 0, marginTop: 2,
                          border: active ? '5px solid var(--accent-primary)' : '2px solid var(--border-strong)',
                          background: active ? 'var(--accent-primary)' : 'transparent',
                          transition: 'all 0.15s',
                        }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: active ? 'var(--accent-primary)' : 'var(--fg-base)', marginBottom: 3 }}>
                            {info.label}
                            {p === 'readwrite' && (
                              <span style={{ marginLeft: 8, fontSize: '0.68rem', background: 'var(--success-bg)', color: 'var(--success)', border: '1px solid var(--success-border)', padding: '1px 6px', borderRadius: 10, fontWeight: 600 }}>
                                RECOMENDADO
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--fg-muted)', marginBottom: 5 }}>{info.description}</div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                            {info.scopes.map((s) => (
                              <code key={s} style={{ fontSize: '0.7rem', background: 'var(--bg-tertiary)', padding: '1px 5px', borderRadius: 4, color: 'var(--fg-subtle)' }}>{s}</code>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {metaPermission === 'readwrite' && (
                  <div style={{ marginTop: 8, padding: '8px 10px', background: 'var(--warning-bg)', borderRadius: 6, fontSize: '0.775rem', color: 'var(--warning)', border: '1px solid var(--warning-border)' }}>
                    ⚠️ Token com <code style={{ background: 'transparent', padding: 0 }}>ads_management</code> permite alterações reais na sua conta Meta. Use com cuidado.
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Access Token</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="EAAG..."
                  value={metaAccessToken}
                  onChange={(e) => saveMetaConfig('meta_access_token', e.target.value, setMetaAccessToken)}
                />
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 6 }}>
                  <a href="https://developers.facebook.com/tools/explorer/" target="_blank" rel="noreferrer">Meta Graph API Explorer</a>
                  {' → permissões: '}
                  {META_PERMISSION_INFO[metaPermission].scopes.map((s, i) => (
                    <span key={s}>{i > 0 && ' + '}<code style={{ background: 'var(--bg-tertiary)', padding: '1px 4px', borderRadius: 4 }}>{s}</code></span>
                  ))}
                </p>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Ad Account ID</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="act_XXXXXXXXXX ou XXXXXXXXXX"
                  value={adAccountId}
                  onChange={(e) => saveMetaConfig('meta_ad_account_id', e.target.value, setAdAccountId)}
                />
              </div>

              {metaAccessToken && adAccountId && (
                <button
                  className="btn-primary"
                  style={{ marginTop: 16, width: '100%', justifyContent: 'center' }}
                  onClick={() => { setActiveTab('dashboard'); syncMetaData(); }}
                >
                  <Zap size={16} /> Conectar e Sincronizar
                </button>
              )}
            </div>

            {/* Provedor de IA */}
            <div className="glass-panel">
              <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--fg-subtle)', marginBottom: 14 }}>
                🤖 Provedor de IA
              </div>

              {/* Demo Mode Banner */}
              <div
                onClick={loadDemoData}
                style={{
                  cursor: 'pointer', marginBottom: 14, padding: '12px 14px',
                  background: 'var(--warning-bg)',
                  border: '1px solid var(--warning-border)', borderRadius: 8,
                  display: 'flex', gap: 12, alignItems: 'center',
                  transition: 'border-color 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--warning)')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--warning-border)')}
              >
                <div style={{ fontSize: 24, flexShrink: 0 }}>🎭</div>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--warning)', marginBottom: 2, fontSize: '0.8125rem' }}>Modo Demo — Sem API Key</div>
                  <div style={{ fontSize: '0.775rem', color: 'var(--fg-subtle)', lineHeight: 1.4 }}>
                    Dados fictícios realistas para explorar todas as funcionalidades. <strong style={{ color: 'var(--warning)' }}>Clique para ativar →</strong>
                  </div>
                </div>
              </div>

              {/* OpenRouter destaque */}
              <div
                onClick={() => switchProvider('openrouter' as AIProvider)}
                style={{
                  background: aiProvider === 'openrouter' ? 'var(--success-bg)' : 'var(--bg-field)',
                  border: aiProvider === 'openrouter' ? '1px solid var(--success-border)' : '1px solid var(--border-base)',
                  borderRadius: 8, padding: '10px 12px', marginBottom: 8, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 10,
                  transition: 'border-color 0.15s',
                }}
              >
                <span style={{ fontSize: '1.1rem' }}>🆓</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--success)' }}>OpenRouter — Modelos GRATUITOS</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--fg-muted)', marginTop: 1 }}>Llama 4, Gemma 3, DeepSeek V3 e mais — sem cartão</div>
                </div>
                {aiProvider === 'openrouter' && <span style={{ fontSize: '0.72rem', color: 'var(--success)', fontWeight: 700 }}>✓ ATIVO</span>}
              </div>

              {/* Outros provedores */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 14 }}>
                {(['gemini', 'openai', 'anthropic'] as AIProvider[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => switchProvider(p)}
                    style={{
                      padding: '9px 8px', borderRadius: 6, fontSize: '0.8rem', fontWeight: 500,
                      border: aiProvider === p ? '1px solid var(--accent-primary)' : '1px solid var(--border-base)',
                      background: aiProvider === p ? 'var(--accent-subtle)' : 'var(--bg-field)',
                      color: aiProvider === p ? 'var(--accent-primary)' : 'var(--fg-subtle)',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    {p === 'gemini' ? '🔵 Gemini' : p === 'openai' ? '🟢 GPT' : '🟣 Claude'}
                  </button>
                ))}
              </div>

              {/* Modelo */}
              <div className="form-group">
                <label>Modelo ({PROVIDER_LABELS[aiProvider]})</label>
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
              </div>

              {/* API Key */}
              {aiProvider !== 'demo' && (
                <div className="form-group" style={{ marginBottom: 0 }}>
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
                  <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginTop: 6 }}>
                    {aiProvider === 'gemini' && (
                      <><a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" style={{ color: 'var(--success)' }}>aistudio.google.com</a> — gratuito, basta logar com Google</>
                    )}
                    {aiProvider === 'openrouter' && (
                      <><a href="https://openrouter.ai/keys" target="_blank" rel="noreferrer" style={{ color: 'var(--success)' }}>openrouter.ai/keys</a> — crie conta grátis → Settings → API Keys</>
                    )}
                    {aiProvider === 'openai' && (
                      <><a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer">platform.openai.com/api-keys</a> — requer billing ativo</>
                    )}
                    {aiProvider === 'anthropic' && (
                      <><a href="https://console.anthropic.com/" target="_blank" rel="noreferrer">console.anthropic.com</a> — requer billing ativo</>
                    )}
                  </p>
                  {aiApiKeys[aiProvider] && (
                    <div style={{ marginTop: 8, padding: '7px 10px', background: 'var(--success-bg)', borderRadius: 6, fontSize: '0.775rem', color: 'var(--success)', border: '1px solid var(--success-border)' }}>
                      ✓ Chave salva automaticamente
                    </div>
                  )}
                </div>
              )}

              {aiProvider === 'demo' && (
                <div style={{ padding: '9px 12px', background: 'var(--warning-bg)', borderRadius: 6, fontSize: '0.8rem', color: 'var(--warning)', border: '1px solid var(--warning-border)' }}>
                  🎭 Modo Demo ativo — nenhuma API Key necessária. Respostas são simuladas.
                </div>
              )}
            </div>

            {/* Perfil do Cliente */}
            <div className="glass-panel">
              <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--fg-subtle)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                🎯 Perfil do Cliente
              </div>
              <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginBottom: 14 }}>
                Informe o que o cliente vende — a ARIA adapta toda a estratégia ao nicho.
              </p>

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

              <div className="form-group" style={{ marginTop: 12, marginBottom: 0 }}>
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
                <div style={{ marginTop: 12, padding: '7px 10px', background: 'var(--accent-subtle)', borderRadius: 6, fontSize: '0.775rem', color: 'var(--accent-primary)', border: '1px solid var(--accent-border)' }}>
                  ✅ Perfil salvo — ARIA usa essas informações em todas as análises.
                </div>
              )}
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
