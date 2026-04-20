'use client';

import { useApp } from '@/app/providers';
import { useRouter } from 'next/navigation';
import { META_PERMISSION_INFO, CAMPAIGN_MODE_LABELS } from '@/lib/metaTypes';
import type { MetaPermission } from '@/lib/metaTypes';
import type { AIProvider } from '@/lib/aiClient';
import { PROVIDER_LABELS, MODEL_OPTIONS } from '@/lib/aiClient';
import { useState } from 'react';
import { Sun, Moon, Zap, Eye, EyeOff } from 'lucide-react';
import type { Theme } from '@/app/providers';

export default function ConfiguracoesPage() {
  const {
    theme, setTheme,
    metaAccessToken, setMetaAccessToken,
    adAccountId, setAdAccountId,
    metaPermission, saveMetaPermission,
    aiProvider, aiApiKeys, aiModel,
    switchProvider, switchModel, saveAiKey,
    clientNiche, setClientNiche,
    clientProduct, setClientProduct,
    clientObjective, setClientObjective,
    clientTicket, setClientTicket,
    clientDifferentials, setClientDifferentials,
    saveClientField,
    syncMetaData, loadDemoData,
    isLoading,
  } = useApp();
  const router = useRouter();
  const [showMetaToken, setShowMetaToken] = useState(false);
  const [showAiApiKey, setShowAiApiKey] = useState(false);

  return (
    <div style={{ maxWidth: 640, display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Aparência */}
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
                        <span style={{ marginLeft: 8, fontSize: '0.68rem', background: 'var(--success-bg)', color: 'var(--success)', border: '1px solid var(--success-border)', padding: '1px 6px', borderRadius: 10, fontWeight: 600 }}>RECOMENDADO</span>
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
          <div style={{ position: 'relative' }}>
            <input
              type={showMetaToken ? 'text' : 'password'}
              className="form-input"
              placeholder="EAAG..."
              value={metaAccessToken}
              onChange={(e) => setMetaAccessToken(e.target.value)}
              style={{ paddingRight: 40 }}
            />
            <button
              type="button"
              aria-label={showMetaToken ? 'Ocultar access token' : 'Mostrar access token'}
              title={showMetaToken ? 'Ocultar' : 'Mostrar'}
              onClick={() => setShowMetaToken((v) => !v)}
              style={{
                position: 'absolute',
                right: 6,
                top: '50%',
                transform: 'translateY(-50%)',
                width: 28,
                height: 28,
                padding: 0,
                border: 'none',
                background: 'transparent',
                color: 'var(--fg-muted)',
                borderRadius: 6,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {showMetaToken ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
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
            onChange={(e) => setAdAccountId(e.target.value)}
          />
        </div>

        {metaAccessToken && adAccountId && (
          <button
            className="btn-primary"
            style={{ marginTop: 16, width: '100%', justifyContent: 'center' }}
            onClick={() => { router.push('/dashboard'); syncMetaData(); }}
            disabled={isLoading}
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

        <div
          onClick={loadDemoData}
          style={{ cursor: 'pointer', marginBottom: 14, padding: '12px 14px', background: 'var(--warning-bg)', border: '1px solid var(--warning-border)', borderRadius: 8, display: 'flex', gap: 12, alignItems: 'center', transition: 'border-color 0.15s' }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--warning)')}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--warning-border)')}
        >
          <div style={{ fontSize: 24, flexShrink: 0 }}>🎭</div>
          <div>
            <div style={{ fontWeight: 600, color: 'var(--warning)', marginBottom: 2, fontSize: '0.8125rem' }}>Modo Demo — Sem API Key</div>
            <div style={{ fontSize: '0.775rem', color: 'var(--fg-subtle)', lineHeight: 1.4 }}>
              Dados fictícios realistas. <strong style={{ color: 'var(--warning)' }}>Clique para ativar →</strong>
            </div>
          </div>
        </div>

        <div
          onClick={() => switchProvider('openrouter' as AIProvider)}
          style={{ background: aiProvider === 'openrouter' ? 'var(--success-bg)' : 'var(--bg-field)', border: aiProvider === 'openrouter' ? '1px solid var(--success-border)' : '1px solid var(--border-base)', borderRadius: 8, padding: '10px 12px', marginBottom: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, transition: 'border-color 0.15s' }}
        >
          <span style={{ fontSize: '1.1rem' }}>🆓</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--success)' }}>OpenRouter — Modelos GRATUITOS</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--fg-muted)', marginTop: 1 }}>Llama 4, Gemma 3, DeepSeek V3 e mais — sem cartão</div>
          </div>
          {aiProvider === 'openrouter' && <span style={{ fontSize: '0.72rem', color: 'var(--success)', fontWeight: 700 }}>✓ ATIVO</span>}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 14 }}>
          {(['gemini', 'openai', 'anthropic'] as AIProvider[]).map((p) => (
            <button
              key={p}
              onClick={() => switchProvider(p)}
              style={{ padding: '9px 8px', borderRadius: 6, fontSize: '0.8rem', fontWeight: 500, border: aiProvider === p ? '1px solid var(--accent-primary)' : '1px solid var(--border-base)', background: aiProvider === p ? 'var(--accent-subtle)' : 'var(--bg-field)', color: aiProvider === p ? 'var(--accent-primary)' : 'var(--fg-subtle)', cursor: 'pointer', transition: 'all 0.15s' }}
            >
              {p === 'gemini' ? '🔵 Gemini' : p === 'openai' ? '🟢 GPT' : '🟣 Claude'}
            </button>
          ))}
        </div>

        <div className="form-group">
          <label>Modelo ({PROVIDER_LABELS[aiProvider]})</label>
          <select value={aiModel} onChange={(e) => switchModel(e.target.value)} className="form-input" style={{ cursor: 'pointer' }}>
            {(MODEL_OPTIONS[aiProvider] || []).map((m) => (
              <option key={m.id} value={m.id}>{m.label}</option>
            ))}
          </select>
        </div>

        {aiProvider !== 'demo' && (
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>API Key — {PROVIDER_LABELS[aiProvider]} <span style={{ color: 'var(--danger)' }}>*</span></label>
            <div style={{ position: 'relative' }}>
              <input
                type={showAiApiKey ? 'text' : 'password'}
                className="form-input"
                placeholder={aiProvider === 'gemini' ? 'AIzaSy...' : aiProvider === 'openrouter' ? 'sk-or-v1-...' : aiProvider === 'openai' ? 'sk-...' : 'sk-ant-...'}
                value={aiApiKeys[aiProvider] || ''}
                onChange={(e) => saveAiKey(aiProvider, e.target.value)}
                style={{ paddingRight: 40 }}
              />
              <button
                type="button"
                aria-label={showAiApiKey ? 'Ocultar API key' : 'Mostrar API key'}
                title={showAiApiKey ? 'Ocultar' : 'Mostrar'}
                onClick={() => setShowAiApiKey((v) => !v)}
                style={{
                  position: 'absolute',
                  right: 6,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: 28,
                  height: 28,
                  padding: 0,
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--fg-muted)',
                  borderRadius: 6,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {showAiApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {aiApiKeys[aiProvider] && (
              <div style={{ marginTop: 8, padding: '7px 10px', background: 'var(--success-bg)', borderRadius: 6, fontSize: '0.775rem', color: 'var(--success)', border: '1px solid var(--success-border)' }}>
                ✓ Chave salva automaticamente
              </div>
            )}
          </div>
        )}

        {aiProvider === 'demo' && (
          <div style={{ padding: '9px 12px', background: 'var(--warning-bg)', borderRadius: 6, fontSize: '0.8rem', color: 'var(--warning)', border: '1px solid var(--warning-border)' }}>
            🎭 Modo Demo ativo — nenhuma API Key necessária.
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
          <input type="text" className="form-input" placeholder="Ex: Consórcios, Imóveis, Clínica Estética, SaaS B2B..." value={clientNiche} onChange={(e) => saveClientField('client_niche', e.target.value, setClientNiche)} />
        </div>

        <div className="form-group">
          <label>Produto / Serviço Principal</label>
          <input type="text" className="form-input" placeholder="Ex: Consórcio de imóvel de até R$500k..." value={clientProduct} onChange={(e) => saveClientField('client_product', e.target.value, setClientProduct)} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Objetivo Principal</label>
            <select className="form-input" value={clientObjective} onChange={(e) => saveClientField('client_objective', e.target.value, setClientObjective)} style={{ cursor: 'pointer' }}>
              <option value="leads">🎯 Geração de Leads</option>
              <option value="whatsapp">💬 Mensagens WhatsApp</option>
              <option value="sales">🛒 Vendas Diretas</option>
              <option value="awareness">📣 Reconhecimento de Marca</option>
              <option value="traffic">🔗 Tráfego para Site</option>
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Ticket Médio (R$)</label>
            <input type="text" className="form-input" placeholder="Ex: 350 ou 50000" value={clientTicket} onChange={(e) => saveClientField('client_ticket', e.target.value, setClientTicket)} />
          </div>
        </div>

        <div className="form-group" style={{ marginTop: 12, marginBottom: 0 }}>
          <label>Diferenciais / Objeções a Superar</label>
          <textarea className="form-input" placeholder="Ex: Sem entrada, sem juros, aprovação em 24h..." value={clientDifferentials} onChange={(e) => saveClientField('client_differentials', e.target.value, setClientDifferentials)} style={{ resize: 'vertical', minHeight: 72 }} />
        </div>

        {clientNiche && (
          <div style={{ marginTop: 12, padding: '7px 10px', background: 'var(--accent-subtle)', borderRadius: 6, fontSize: '0.775rem', color: 'var(--accent-primary)', border: '1px solid var(--accent-border)' }}>
            ✅ Perfil salvo — ARIA usa essas informações em todas as análises.
          </div>
        )}
      </div>

    </div>
  );
}
