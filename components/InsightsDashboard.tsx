'use client';

import { useState } from 'react';
import type { AdAccount, Campaign, CampaignMode, MetaPermission } from '@/lib/metaTypes';
import { CreativeGallery } from '@/components/CreativeGallery';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Activity, DollarSign, MousePointer, Eye, Users, ShoppingCart, MessageCircle, Target, Play, X, Lock, ChevronRight, Pause, RefreshCw, Image } from 'lucide-react';

interface InsightsDashboardProps {
  account: AdAccount | null;
  isLoading: boolean;
  datePreset: string;
  campaignMode?: CampaignMode;
  metaPermission?: MetaPermission;
  onSelectCampaign?: (campaign: Campaign) => void;
}

function formatCurrency(value: number, currency = 'BRL'): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(value);
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('pt-BR').format(Math.round(value));
}

function getFrequencyColor(freq: number): string {
  if (freq > 4) return 'var(--danger)';
  if (freq > 2.5) return 'var(--warning)';
  return 'var(--success)';
}

function getRoasColor(roas: number): string {
  if (roas >= 3) return 'var(--success)';
  if (roas >= 1.5) return 'var(--warning)';
  if (roas > 0) return 'var(--danger)';
  return 'var(--text-muted)';
}

function getStatusBadge(status: string) {
  const map: Record<string, { color: string; label: string }> = {
    ACTIVE: { color: 'var(--success)', label: 'Ativo' },
    PAUSED: { color: 'var(--warning)', label: 'Pausado' },
    DELETED: { color: 'var(--danger)', label: 'Deletado' },
    ARCHIVED: { color: 'var(--text-muted)', label: 'Arquivado' },
  };
  const cfg = map[status] || { color: 'var(--text-muted)', label: status };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', fontWeight: 600,
      color: cfg.color, background: `${cfg.color}18`, padding: '2px 10px', borderRadius: 20,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.color }} />
      {cfg.label}
    </span>
  );
}

function MetricCard({
  title, value, sub, icon: Icon, color, trend, trendLabel
}: {
  title: string; value: string; sub?: string; icon: React.ElementType;
  color?: string; trend?: 'up' | 'down' | 'neutral'; trendLabel?: string;
}) {
  return (
    <div className="glass-panel metric-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div className="metric-title">{title}</div>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: `${color || 'var(--accent-primary)'}22`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: color || 'var(--accent-primary)',
        }}>
          <Icon size={18} />
        </div>
      </div>
      <div className="metric-value" style={{ color: color || 'var(--text-primary)', fontSize: '1.7rem' }}>{value}</div>
      {sub && (
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>{sub}</div>
      )}
      {trendLabel && (
        <div className={`metric-trend ${trend === 'up' ? 'trend-up' : trend === 'down' ? 'trend-down' : ''}`} style={{ marginTop: 8 }}>
          {trend === 'up' ? <TrendingUp size={14} /> : trend === 'down' ? <TrendingDown size={14} /> : <Activity size={14} />}
          {trendLabel}
        </div>
      )}
    </div>
  );
}

function FrequencyWarning({ freq }: { freq: number }) {
  if (freq <= 2.5) return null;
  return (
    <div className="alert-banner" style={{ background: freq > 4 ? 'var(--danger-bg)' : 'var(--warning-bg)', border: `1px solid ${freq > 4 ? 'var(--danger-border)' : 'var(--warning-border)'}`, borderRadius: 8, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
      <AlertTriangle size={16} color={freq > 4 ? 'var(--danger)' : 'var(--warning)'} />
      <span style={{ fontSize: '0.88rem', color: freq > 4 ? 'var(--danger)' : 'var(--warning)', fontWeight: 500 }}>
        {freq > 4
          ? `⚠️ Frequência crítica (${freq.toFixed(1)}x) — Público saturado! Troque os criativos imediatamente.`
          : `Frequência moderada (${freq.toFixed(1)}x) — Comece a preparar novos criativos.`
        }
      </span>
    </div>
  );
}

// ── Action button with write-lock awareness ────────────────────────────────
function ActionButton({
  label, icon: Icon, color = 'var(--accent-primary)', canWrite, onClick, danger,
}: {
  label: string;
  icon: React.ElementType;
  color?: string;
  canWrite: boolean;
  onClick?: () => void;
  danger?: boolean;
}) {
  const locked = !canWrite;
  return (
    <button
      onClick={locked ? undefined : onClick}
      title={locked ? 'Requer token com ads_management (Leitura + Escrita)' : label}
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '7px 12px', borderRadius: 6, fontSize: '0.78rem', fontWeight: 600,
        border: locked
          ? '1px solid var(--border-base)'
          : `1px solid ${danger ? 'var(--danger-border)' : color + '55'}`,
        background: locked
          ? 'var(--bg-field)'
          : danger ? 'var(--danger-bg)' : `${color}18`,
        color: locked ? 'var(--fg-muted)' : danger ? 'var(--danger)' : color,
        cursor: locked ? 'not-allowed' : 'pointer',
        opacity: locked ? 0.6 : 1,
        transition: 'all 0.15s',
        whiteSpace: 'nowrap',
      }}
    >
      {locked ? <Lock size={12} /> : <Icon size={13} />}
      {label}
    </button>
  );
}

// ── Campaign Diagnostic Panel ──────────────────────────────────────────────
function CampaignDiagnostic({
  campaign,
  currency,
  campaignMode,
  canWrite,
  onClose,
}: {
  campaign: Campaign;
  currency: string;
  campaignMode: CampaignMode;
  canWrite: boolean;
  onClose: () => void;
}) {
  const [panelTab, setPanelTab] = useState<'diagnosis' | 'creatives'>('diagnosis');
  const ins = campaign.insightsSummary;
  const adsets = campaign.adsets || [];
  const allAds = adsets.flatMap((as) => (as.ads || []).map((ad) => ({ ad, adsetName: as.name })));

  // Diagnóstico automático
  const issues: { level: 'error' | 'warn' | 'ok'; msg: string }[] = [];
  if (ins) {
    if (ins.frequency > 5) issues.push({ level: 'error', msg: `Frequência crítica (${ins.frequency.toFixed(1)}x) — público saturado. Troque os criativos imediatamente.` });
    else if (ins.frequency > 3) issues.push({ level: 'warn', msg: `Frequência moderada (${ins.frequency.toFixed(1)}x) — prepare novos criativos.` });
    else issues.push({ level: 'ok', msg: `Frequência saudável (${ins.frequency.toFixed(1)}x).` });

    if (ins.ctr < 0.5) issues.push({ level: 'error', msg: `CTR crítico (${ins.ctr.toFixed(2)}%) — criativos não param o scroll. Troque os hooks.` });
    else if (ins.ctr < 1) issues.push({ level: 'warn', msg: `CTR abaixo da média (${ins.ctr.toFixed(2)}%) — teste novos ganchos.` });
    else issues.push({ level: 'ok', msg: `CTR bom (${ins.ctr.toFixed(2)}%).` });

    if (campaignMode === 'ecommerce') {
      if (ins.roas > 0 && ins.roas < 1) issues.push({ level: 'error', msg: `ROAS ${ins.roas.toFixed(2)}x — campanha gerando prejuízo. Pause ou revise público/oferta.` });
      else if (ins.roas >= 1 && ins.roas < 2) issues.push({ level: 'warn', msg: `ROAS ${ins.roas.toFixed(2)}x — abaixo do mínimo saudável (2x). Otimize criativos.` });
      else if (ins.roas >= 2) issues.push({ level: 'ok', msg: `ROAS ${ins.roas.toFixed(2)}x — rentável.` });
    }
    if (campaignMode === 'leads') {
      if (ins.costPerLead > 80) issues.push({ level: 'error', msg: `CPL R$${ins.costPerLead.toFixed(2)} — acima do benchmark. Revise público e criativo.` });
      else if (ins.costPerLead > 40) issues.push({ level: 'warn', msg: `CPL R$${ins.costPerLead.toFixed(2)} — moderado. Teste variações de hook.` });
      else if (ins.costPerLead > 0) issues.push({ level: 'ok', msg: `CPL R$${ins.costPerLead.toFixed(2)} — eficiente.` });
    }
    if (campaignMode === 'whatsapp') {
      if (ins.costPerConversation > 60) issues.push({ level: 'error', msg: `Custo/conversa R$${ins.costPerConversation.toFixed(2)} — alto. Revise CTA e criativo.` });
      else if (ins.costPerConversation > 0) issues.push({ level: 'ok', msg: `Custo/conversa R$${ins.costPerConversation.toFixed(2)}.` });
    }
    if (ins.cpm > 35) issues.push({ level: 'warn', msg: `CPM alto (R$${ins.cpm.toFixed(2)}) — considere Reels/Stories para reduzir custo.` });
  }

  // Melhor e pior criativo
  const sortedAds = [...allAds].sort((a, b) => (b.ad.creativeScore?.overall || 0) - (a.ad.creativeScore?.overall || 0));
  const bestAd = sortedAds[0];
  const worstAd = sortedAds[sortedAds.length - 1];
  const pauseableAds = allAds.filter((a) => a.ad.creativeScore?.recommendation === 'PAUSE' && a.ad.status === 'ACTIVE');
  const scaleAds = allAds.filter((a) => a.ad.creativeScore?.recommendation === 'SCALE' && a.ad.status === 'ACTIVE');

  const iconFor = (level: 'error' | 'warn' | 'ok') =>
    level === 'ok' ? <CheckCircle size={15} color="var(--success)" style={{ flexShrink: 0 }} />
    : level === 'warn' ? <AlertTriangle size={15} color="var(--warning)" style={{ flexShrink: 0 }} />
    : <AlertTriangle size={15} color="var(--danger)" style={{ flexShrink: 0 }} />;

  // Build a mock AdAccount for CreativeGallery
  const mockAccount = {
    ...({} as import('@/lib/metaTypes').AdAccount),
    id: 'panel',
    name: campaign.name,
    currency,
    timezone_name: '',
    account_status: 1,
    campaigns: [campaign],
  };

  const allAdsCount = (campaign.adsets || []).flatMap((as) => as.ads || []).length;

  return (
    <div style={{
      position: 'fixed', top: 0, right: 0, bottom: 0,
      width: panelTab === 'creatives' ? 'min(82vw, 1100px)' : 480,
      background: 'var(--bg-subtle)', borderLeft: '1px solid var(--border-base)',
      zIndex: 200, display: 'flex', flexDirection: 'column',
      boxShadow: '-8px 0 32px rgba(0,0,0,0.4)',
      animation: 'slideIn 0.2s ease',
      transition: 'width 0.25s ease',
    }}>
      {/* Header */}
      <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border-base)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexShrink: 0 }}>
        <div style={{ minWidth: 0, paddingRight: 12, flex: 1 }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--fg-muted)', marginBottom: 3 }}>Campanha</div>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', lineHeight: 1.3, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
            {campaign.name}
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 600, padding: '2px 8px', borderRadius: 12, background: campaign.status === 'ACTIVE' ? 'var(--success-bg)' : 'var(--bg-hover)', color: campaign.status === 'ACTIVE' ? 'var(--success)' : 'var(--fg-muted)', border: campaign.status === 'ACTIVE' ? '1px solid var(--success-border)' : '1px solid var(--border-base)' }}>
              {campaign.status === 'ACTIVE' ? '● Ativo' : campaign.status}
            </span>
            {!canWrite && (
              <span style={{ fontSize: '0.68rem', padding: '2px 7px', borderRadius: 10, background: 'var(--bg-hover)', color: 'var(--fg-muted)', border: '1px solid var(--border-base)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Lock size={9} /> Somente leitura
              </span>
            )}
          </div>
        </div>
        <button onClick={onClose} style={{ background: 'transparent', border: 'none', padding: 6, borderRadius: 6, cursor: 'pointer', color: 'var(--fg-muted)', flexShrink: 0 }}>
          <X size={18} />
        </button>
      </div>

      {/* Tab switcher */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-base)', flexShrink: 0, background: 'var(--bg-component)' }}>
        {([
          { key: 'diagnosis', label: 'Diagnóstico' },
          { key: 'creatives', label: `Criativos${allAdsCount > 0 ? ` (${allAdsCount})` : ''}` },
        ] as const).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setPanelTab(key)}
            style={{
              flex: 1, padding: '10px 12px', background: 'transparent', border: 'none',
              borderBottom: panelTab === key ? '2px solid var(--accent-primary)' : '2px solid transparent',
              color: panelTab === key ? 'var(--accent-primary)' : 'var(--fg-muted)',
              fontWeight: panelTab === key ? 700 : 500,
              fontSize: '0.82rem', cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: panelTab === 'creatives' ? '20px 24px' : '16px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* ── TAB: CRIATIVOS ────────────────────────────────────────────── */}
        {panelTab === 'creatives' && (
          allAdsCount === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: 12, color: 'var(--fg-muted)', paddingTop: 60 }}>
              <Image size={40} style={{ opacity: 0.3 }} />
              <p style={{ fontSize: '0.9rem' }}>Nenhum criativo encontrado nesta campanha.</p>
            </div>
          ) : (
            <CreativeGallery account={mockAccount} isLoading={false} campaignMode={campaignMode} />
          )
        )}

        {/* ── TAB: DIAGNÓSTICO ──────────────────────────────────────────── */}
        {panelTab === 'diagnosis' && (
          <>
            {/* Diagnóstico */}
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--fg-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Diagnóstico</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {issues.map((issue, i) => (
                  <div key={i} style={{ display: 'flex', gap: 9, alignItems: 'flex-start', padding: '8px 10px', borderRadius: 7, background: issue.level === 'error' ? 'var(--danger-bg)' : issue.level === 'warn' ? 'var(--warning-bg)' : 'var(--success-bg)', border: `1px solid ${issue.level === 'error' ? 'var(--danger-border)' : issue.level === 'warn' ? 'var(--warning-border)' : 'var(--success-border)'}` }}>
                    {iconFor(issue.level)}
                    <span style={{ fontSize: '0.8rem', lineHeight: 1.45, color: issue.level === 'error' ? 'var(--danger)' : issue.level === 'warn' ? 'var(--warning)' : 'var(--success)' }}>{issue.msg}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Ações recomendadas */}
            {(pauseableAds.length > 0 || scaleAds.length > 0) && (
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--fg-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Ações Recomendadas</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {pauseableAds.map(({ ad }) => (
                    <div key={ad.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '8px 12px', borderRadius: 7, background: 'var(--bg-component)', border: '1px solid var(--border-base)' }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: '0.78rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ad.name}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--danger)' }}>Score {ad.creativeScore?.overall}/100 · {ad.creativeScore?.fatigueLevel === 'CRITICAL' ? 'Fadiga crítica' : 'Performance baixa'}</div>
                      </div>
                      <ActionButton label="Pausar" icon={Pause} color="var(--danger)" canWrite={canWrite} danger />
                    </div>
                  ))}
                  {scaleAds.map(({ ad }) => (
                    <div key={ad.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '8px 12px', borderRadius: 7, background: 'var(--bg-component)', border: '1px solid var(--border-base)' }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: '0.78rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ad.name}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--success)' }}>Score {ad.creativeScore?.overall}/100 · Top performer</div>
                      </div>
                      <ActionButton label="+20% Budget" icon={TrendingUp} color="var(--success)" canWrite={canWrite} />
                    </div>
                  ))}
                </div>
                {!canWrite && (
                  <div style={{ marginTop: 8, padding: '8px 10px', background: 'var(--bg-field)', borderRadius: 6, fontSize: '0.75rem', color: 'var(--fg-muted)', border: '1px solid var(--border-base)', display: 'flex', gap: 6, alignItems: 'center' }}>
                    <Lock size={12} />
                    Configure um token com <strong>ads_management</strong> nas Configurações para habilitar ações.
                  </div>
                )}
              </div>
            )}

            {/* Ações gerais da campanha */}
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--fg-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Ações na Campanha</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                <ActionButton label="Pausar Campanha" icon={Pause} canWrite={canWrite} danger />
                <ActionButton label="Duplicar Campanha" icon={RefreshCw} canWrite={canWrite} />
                <ActionButton label="Ajustar Budget" icon={DollarSign} canWrite={canWrite} />
              </div>
            </div>

            {/* Métricas resumidas */}
            {ins && (
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--fg-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Métricas do Período</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {[
                    { label: 'Gasto', value: formatCurrency(ins.spend, currency) },
                    { label: 'CTR', value: `${ins.ctr.toFixed(2)}%` },
                    { label: 'CPM', value: formatCurrency(ins.cpm, currency) },
                    { label: 'Frequência', value: `${ins.frequency.toFixed(1)}x` },
                    ...(campaignMode === 'ecommerce' ? [
                      { label: 'ROAS', value: ins.roas > 0 ? `${ins.roas.toFixed(2)}x` : 'N/A' },
                      { label: 'CPA', value: ins.cpa > 0 ? formatCurrency(ins.cpa, currency) : 'N/A' },
                    ] : []),
                    ...(campaignMode === 'leads' ? [
                      { label: 'Leads', value: String(ins.leads) },
                      { label: 'CPL', value: ins.costPerLead > 0 ? formatCurrency(ins.costPerLead, currency) : 'N/A' },
                    ] : []),
                    ...(campaignMode === 'whatsapp' ? [
                      { label: 'Conversas', value: String(ins.messagesStarted) },
                      { label: 'Custo/Conv.', value: ins.costPerConversation > 0 ? formatCurrency(ins.costPerConversation, currency) : 'N/A' },
                    ] : []),
                  ].map((m) => (
                    <div key={m.label} style={{ background: 'var(--bg-component)', borderRadius: 7, padding: '8px 12px' }}>
                      <div style={{ fontSize: '0.68rem', color: 'var(--fg-muted)', marginBottom: 2 }}>{m.label}</div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>{m.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Públicos */}
            {adsets.some((as) => as.audienceAnalysis) && (
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--fg-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Diagnóstico de Público</div>
                {adsets.map((as) => {
                  const aud = as.audienceAnalysis;
                  if (!aud) return null;
                  return (
                    <div key={as.id} style={{ padding: '10px 12px', borderRadius: 7, background: 'var(--bg-component)', border: '1px solid var(--border-base)', marginBottom: 8 }}>
                      <div style={{ fontSize: '0.78rem', fontWeight: 600, marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{as.name}</div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
                        <span style={{ fontSize: '0.68rem', padding: '2px 6px', borderRadius: 10, background: 'var(--accent-subtle)', color: 'var(--accent-primary)', border: '1px solid var(--accent-border)' }}>{aud.type}</span>
                        <span style={{ fontSize: '0.68rem', padding: '2px 6px', borderRadius: 10, background: aud.saturationRisk === 'HIGH' ? 'var(--danger-bg)' : aud.saturationRisk === 'MEDIUM' ? 'var(--warning-bg)' : 'var(--success-bg)', color: aud.saturationRisk === 'HIGH' ? 'var(--danger)' : aud.saturationRisk === 'MEDIUM' ? 'var(--warning)' : 'var(--success)', border: `1px solid ${aud.saturationRisk === 'HIGH' ? 'var(--danger-border)' : aud.saturationRisk === 'MEDIUM' ? 'var(--warning-border)' : 'var(--success-border)'}` }}>
                          Saturação: {aud.saturationRisk}
                        </span>
                      </div>
                      {aud.recommendations.slice(0, 2).map((r, i) => (
                        <div key={i} style={{ fontSize: '0.75rem', color: 'var(--fg-subtle)', marginBottom: 3, lineHeight: 1.4 }}>→ {r}</div>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export function InsightsDashboard({ account, isLoading, datePreset, campaignMode = 'ecommerce', metaPermission = 'readonly', onSelectCampaign }: InsightsDashboardProps) {
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const canWrite = metaPermission === 'readwrite';
  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
        <div className="spin-loader" />
        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>Carregando dados da conta Meta Ads...</p>
      </div>
    );
  }

  if (!account) {
    return (
      <div className="glass-panel" style={{ textAlign: 'center', padding: 60 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
        <h3 style={{ marginBottom: 8 }}>Nenhum dado carregado</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
          Configure seu Meta Access Token e Ad Account ID para ver seus dados reais.
        </p>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          Ou use o <strong style={{ color: 'var(--accent-primary)' }}>AI Copilot</strong> e cole os dados manualmente para análise.
        </p>
      </div>
    );
  }

  const o = account.overallInsights;
  const campaigns = account.campaigns || [];
  const activeCampaigns = campaigns.filter((c) => c.status === 'ACTIVE');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* Frequency warning */}
      {o && o.frequency > 2.5 && <FrequencyWarning freq={o.frequency} />}

      {/* KPI Cards — Mode Aware */}
      {o && (
        <div className="dashboard-grid">
          {/* Always shown */}
          <MetricCard
            title="Gasto Total"
            value={formatCurrency(o.spend, account.currency)}
            sub={`Período: ${datePreset}`}
            icon={DollarSign}
            color="var(--accent-primary)"
          />

          {/* E-commerce */}
          {campaignMode === 'ecommerce' && (
            <>
              <MetricCard
                title="ROAS Médio"
                value={o.roas > 0 ? `${o.roas.toFixed(2)}x` : 'N/A'}
                sub={o.roas >= 3 ? 'Acima da meta ✅' : o.roas >= 1 ? 'Abaixo da meta ⚠️' : 'Sem dados de compra'}
                icon={TrendingUp}
                color={getRoasColor(o.roas)}
                trend={o.roas >= 3 ? 'up' : o.roas > 0 ? 'down' : 'neutral'}
                trendLabel={o.roas >= 3 ? 'Excelente' : o.roas >= 1 ? 'Atenção' : ''}
              />
              <MetricCard
                title="CPA (Compra)"
                value={o.cpa > 0 ? formatCurrency(o.cpa, account.currency) : 'N/A'}
                sub={`${formatNumber(o.purchases)} compras`}
                icon={ShoppingCart}
                color={o.cpa > 0 ? 'var(--accent-secondary)' : 'var(--text-muted)'}
              />
            </>
          )}

          {/* WhatsApp / Mensagens */}
          {campaignMode === 'whatsapp' && (
            <>
              <MetricCard
                title="Conversas Iniciadas"
                value={formatNumber(o.messagesStarted)}
                sub={`1º Reply: ${formatNumber(o.messagingFirstReply)}`}
                icon={MessageCircle}
                color="var(--success)"
                trend={o.messagesStarted > 0 ? 'up' : 'neutral'}
                trendLabel={o.messagesStarted > 0 ? 'Mensagens ativas' : 'Sem dados'}
              />
              <MetricCard
                title="Custo/Conversa"
                value={o.costPerConversation > 0 ? formatCurrency(o.costPerConversation, account.currency) : 'N/A'}
                sub={o.costPerFirstReply > 0 ? `Custo/Reply: ${formatCurrency(o.costPerFirstReply, account.currency)}` : 'Sem dados de reply'}
                icon={TrendingUp}
                color={o.costPerConversation > 0 && o.costPerConversation < 20 ? 'var(--success)' : o.costPerConversation < 50 ? 'var(--warning)' : 'var(--danger)'}
                trend={o.costPerConversation > 0 && o.costPerConversation < 20 ? 'up' : 'down'}
                trendLabel={o.costPerConversation > 0 && o.costPerConversation < 20 ? 'Excelente' : o.costPerConversation < 50 ? 'Atenção' : 'Alto'}
              />
            </>
          )}

          {/* Lead Gen */}
          {campaignMode === 'leads' && (
            <>
              <MetricCard
                title="Leads Gerados"
                value={formatNumber(o.leads)}
                sub={o.leads > 0 ? 'Total no período' : 'Sem leads rastreados'}
                icon={Target}
                color="var(--accent-secondary)"
                trend={o.leads > 0 ? 'up' : 'neutral'}
              />
              <MetricCard
                title="CPL (Custo/Lead)"
                value={o.costPerLead > 0 ? formatCurrency(o.costPerLead, account.currency) : 'N/A'}
                sub={`${formatNumber(o.leads)} leads no período`}
                icon={TrendingUp}
                color={o.costPerLead > 0 && o.costPerLead < 30 ? 'var(--success)' : o.costPerLead < 80 ? 'var(--warning)' : 'var(--danger)'}
                trend={o.costPerLead > 0 && o.costPerLead < 30 ? 'up' : 'down'}
                trendLabel={o.costPerLead < 30 ? 'Excelente' : o.costPerLead < 80 ? 'Médio' : 'Alto'}
              />
            </>
          )}

          {/* Traffic */}
          {campaignMode === 'traffic' && (
            <>
              <MetricCard
                title="Landing Page Views"
                value={formatNumber(o.landingPageViews)}
                sub={`Link Clicks: ${formatNumber(o.linkClicks)}`}
                icon={Eye}
                color="var(--accent-primary)"
                trend={o.landingPageViews > 0 ? 'up' : 'neutral'}
              />
              <MetricCard
                title="Custo/LPV"
                value={o.costPerLandingPageView > 0 ? formatCurrency(o.costPerLandingPageView, account.currency) : 'N/A'}
                sub={`CPC: ${formatCurrency(o.cpc, account.currency)}`}
                icon={TrendingUp}
                color={o.costPerLandingPageView < 1 ? 'var(--success)' : o.costPerLandingPageView < 2 ? 'var(--warning)' : 'var(--danger)'}
              />
            </>
          )}

          {/* Awareness */}
          {campaignMode === 'awareness' && (
            <>
              <MetricCard
                title="ThruPlays (Vídeo)"
                value={formatNumber(o.videoThruPlays)}
                sub={`Plays totais: ${formatNumber(o.videoPlays)}`}
                icon={Play}
                color="var(--accent-secondary)"
                trend={o.videoThruPlays > 0 ? 'up' : 'neutral'}
              />
              <MetricCard
                title="Custo/ThruPlay"
                value={o.costPerThruPlay > 0 ? formatCurrency(o.costPerThruPlay, account.currency) : 'N/A'}
                sub={`Alcance: ${formatNumber(o.reach)} pessoas`}
                icon={TrendingUp}
                color={o.costPerThruPlay < 0.05 ? 'var(--success)' : o.costPerThruPlay < 0.15 ? 'var(--warning)' : 'var(--danger)'}
              />
            </>
          )}

          {/* Always shown */}
          <MetricCard
            title="CTR de Link"
            value={`${o.ctr.toFixed(2)}%`}
            sub={`CPC: ${formatCurrency(o.cpc, account.currency)}`}
            icon={MousePointer}
            color={o.ctr >= 1 ? 'var(--success)' : o.ctr >= 0.5 ? 'var(--warning)' : 'var(--danger)'}
            trend={o.ctr >= 1 ? 'up' : 'down'}
            trendLabel={o.ctr >= 2 ? 'Excelente' : o.ctr >= 1 ? 'Bom' : o.ctr >= 0.5 ? 'Abaixo da média' : 'Crítico'}
          />
          <MetricCard
            title="CPM"
            value={formatCurrency(o.cpm, account.currency)}
            sub={`${formatNumber(o.impressions)} impressões`}
            icon={Eye}
            color="var(--text-secondary)"
          />
          <MetricCard
            title="Frequência"
            value={`${o.frequency.toFixed(1)}x`}
            sub={`Alcance: ${formatNumber(o.reach)} pessoas`}
            icon={Users}
            color={getFrequencyColor(o.frequency)}
            trend={o.frequency > 3 ? 'down' : 'neutral'}
            trendLabel={o.frequency > 4 ? '🔴 Crítico' : o.frequency > 2.5 ? '⚠️ Atenção' : '✅ Ok'}
          />
        </div>
      )}

      {/* Funil de Conversão — E-commerce */}
      {campaignMode === 'ecommerce' && o && (o.viewContent > 0 || o.addToCart > 0 || o.purchases > 0) && (
        <div className="glass-panel">
          <h3 style={{ marginBottom: 20, fontSize: '1.1rem' }}>🛒 Funil de Conversão — E-commerce</h3>
          <div className="funnel-row">
            {[
              { label: 'View Content', value: o.viewContent, color: 'var(--accent-primary)' },
              { label: 'Add to Cart', value: o.addToCart, color: 'var(--accent-secondary)' },
              { label: 'Checkout', value: 0, color: 'var(--warning)' },
              { label: 'Compras', value: o.purchases, color: 'var(--success)' },
            ].map((step, i, arr) => {
              const prev = arr[i - 1];
              const rate = prev && prev.value > 0 ? ((step.value / prev.value) * 100).toFixed(1) : null;
              return (
                <div key={step.label} className="funnel-step">
                  <div className="funnel-value" style={{ color: step.color }}>{formatNumber(step.value)}</div>
                  <div className="funnel-label">{step.label}</div>
                  {rate && <div className="funnel-rate" style={{ color: parseFloat(rate) > 20 ? 'var(--success)' : 'var(--warning)' }}>↓ {rate}%</div>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Funil WhatsApp */}
      {campaignMode === 'whatsapp' && o && (o.messagesStarted > 0 || o.messagingFirstReply > 0) && (
        <div className="glass-panel">
          <h3 style={{ marginBottom: 20, fontSize: '1.1rem' }}>💬 Funil de Mensagens — WhatsApp</h3>
          <div className="funnel-row">
            {[
              { label: 'Cliques no Anúncio', value: o.linkClicks, color: 'var(--accent-primary)' },
              { label: 'Conversas Iniciadas', value: o.messagesStarted, color: 'var(--accent-secondary)' },
              { label: '1º Resposta', value: o.messagingFirstReply, color: 'var(--success)' },
            ].map((step, i, arr) => {
              const prev = arr[i - 1];
              const rate = prev && prev.value > 0 ? ((step.value / prev.value) * 100).toFixed(1) : null;
              return (
                <div key={step.label} className="funnel-step">
                  <div className="funnel-value" style={{ color: step.color }}>{formatNumber(step.value)}</div>
                  <div className="funnel-label">{step.label}</div>
                  {rate && <div className="funnel-rate" style={{ color: parseFloat(rate) > 50 ? 'var(--success)' : 'var(--warning)' }}>↓ {rate}%</div>}
                </div>
              );
            })}
          </div>
          {o.costPerConversation > 0 && (
            <div style={{ marginTop: 16, padding: '10px 14px', background: 'var(--bg-field)', border: '1px solid var(--border-base)', borderRadius: 8, fontSize: '0.8125rem', color: 'var(--fg-subtle)' }}>
              💡 <strong style={{ color: 'var(--fg-base)' }}>Custo por conversa:</strong> {formatCurrency(o.costPerConversation, account.currency)} ·{' '}
              <strong style={{ color: 'var(--fg-base)' }}>Custo por 1º reply:</strong> {o.costPerFirstReply > 0 ? formatCurrency(o.costPerFirstReply, account.currency) : 'N/A'}
            </div>
          )}
        </div>
      )}

      {/* Funil Leads */}
      {campaignMode === 'leads' && o && o.leads > 0 && (
        <div className="glass-panel">
          <h3 style={{ marginBottom: 20, fontSize: '1.1rem' }}>🎯 Funil de Geração de Leads</h3>
          <div className="funnel-row">
            {[
              { label: 'Cliques', value: o.linkClicks, color: 'var(--accent-primary)' },
              { label: 'LPV', value: o.landingPageViews, color: 'var(--accent-secondary)' },
              { label: 'Leads', value: o.leads, color: 'var(--success)' },
            ].map((step, i, arr) => {
              const prev = arr[i - 1];
              const rate = prev && prev.value > 0 ? ((step.value / prev.value) * 100).toFixed(1) : null;
              return (
                <div key={step.label} className="funnel-step">
                  <div className="funnel-value" style={{ color: step.color }}>{formatNumber(step.value)}</div>
                  <div className="funnel-label">{step.label}</div>
                  {rate && <div className="funnel-rate" style={{ color: parseFloat(rate) > 10 ? 'var(--success)' : 'var(--warning)' }}>↓ {rate}%</div>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Campaigns Table */}
      <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '1rem' }}>📢 Campanhas</h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {activeCampaigns.length} ativas · {campaigns.length} total
          </span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ tableLayout: 'fixed', width: '100%' }}>
            <colgroup>
              <col style={{ width: '30%' }} />
              <col style={{ width: '90px' }} />
              <col style={{ width: '120px' }} />
              <col style={{ width: '100px' }} />
              <col style={{ width: '80px' }} />
              <col style={{ width: '100px' }} />
              <col style={{ width: '70px' }} />
              <col style={{ width: '70px' }} />
              <col style={{ width: '90px' }} />
            </colgroup>
            <thead>
              <tr>
                <th>Campanha</th>
                <th>Status</th>
                <th>Objetivo</th>
                <th>Gasto</th>
                {campaignMode === 'ecommerce' && <><th>ROAS</th><th>CPA</th></>}
                {campaignMode === 'whatsapp' && <><th>Conversas</th><th>Custo/Conv.</th></>}
                {campaignMode === 'leads' && <><th>Leads</th><th>CPL</th></>}
                {campaignMode === 'traffic' && <><th>LPV</th><th>Custo/LPV</th></>}
                {campaignMode === 'awareness' && <><th>ThruPlays</th><th>Custo/TP</th></>}
                <th>CTR</th>
                <th>Freq.</th>
                <th>CPM</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '32px' }}>
                    Nenhuma campanha encontrada
                  </td>
                </tr>
              ) : (
                campaigns.map((campaign) => {
                  const ins = campaign.insightsSummary;
                  return (
                    <tr
                      key={campaign.id}
                      onClick={() => setSelectedCampaign(campaign)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td style={{ maxWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div
                            title={campaign.name}
                            style={{
                              fontWeight: 600, fontSize: '0.875rem',
                              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                              flex: 1,
                            }}
                          >
                            {campaign.name}
                          </div>
                          <ChevronRight size={14} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>ID: {campaign.id}</div>
                      </td>
                      <td>{getStatusBadge(campaign.status)}</td>
                      <td>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                          {campaign.objective?.replace('OUTCOME_', '').replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600 }}>{ins ? formatCurrency(ins.spend, account.currency) : '-'}</td>
                      {campaignMode === 'ecommerce' && (
                        <>
                          <td style={{ color: ins?.roas ? getRoasColor(ins.roas) : 'var(--text-muted)', fontWeight: 700 }}>
                            {ins?.roas ? `${ins.roas.toFixed(2)}x` : '-'}
                          </td>
                          <td>{ins?.cpa ? formatCurrency(ins.cpa, account.currency) : '-'}</td>
                        </>
                      )}
                      {campaignMode === 'whatsapp' && (
                        <>
                          <td style={{ color: 'var(--success)', fontWeight: 700 }}>{ins?.messagesStarted ? formatNumber(ins.messagesStarted) : '-'}</td>
                          <td style={{ color: ins?.costPerConversation && ins.costPerConversation < 20 ? 'var(--success)' : 'var(--warning)' }}>
                            {ins?.costPerConversation ? formatCurrency(ins.costPerConversation, account.currency) : '-'}
                          </td>
                        </>
                      )}
                      {campaignMode === 'leads' && (
                        <>
                          <td style={{ color: 'var(--accent-secondary)', fontWeight: 700 }}>{ins?.leads ? formatNumber(ins.leads) : '-'}</td>
                          <td style={{ color: ins?.costPerLead && ins.costPerLead < 50 ? 'var(--success)' : 'var(--warning)' }}>
                            {ins?.costPerLead ? formatCurrency(ins.costPerLead, account.currency) : '-'}
                          </td>
                        </>
                      )}
                      {campaignMode === 'traffic' && (
                        <>
                          <td style={{ fontWeight: 700 }}>{ins?.landingPageViews ? formatNumber(ins.landingPageViews) : '-'}</td>
                          <td>{ins?.costPerLandingPageView ? formatCurrency(ins.costPerLandingPageView, account.currency) : '-'}</td>
                        </>
                      )}
                      {campaignMode === 'awareness' && (
                        <>
                          <td style={{ fontWeight: 700 }}>{ins?.videoThruPlays ? formatNumber(ins.videoThruPlays) : '-'}</td>
                          <td>{ins?.costPerThruPlay ? formatCurrency(ins.costPerThruPlay, account.currency) : '-'}</td>
                        </>
                      )}
                      <td style={{ color: ins?.ctr ? (ins.ctr >= 1 ? 'var(--success)' : ins.ctr >= 0.5 ? 'var(--warning)' : 'var(--danger)') : 'var(--text-muted)', fontWeight: 600 }}>
                        {ins?.ctr ? `${ins.ctr.toFixed(2)}%` : '-'}
                      </td>
                      <td style={{ color: ins?.frequency ? getFrequencyColor(ins.frequency) : 'var(--text-muted)', fontWeight: 600 }}>
                        {ins?.frequency ? `${ins.frequency.toFixed(1)}x` : '-'}
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>
                        {ins?.cpm ? formatCurrency(ins.cpm, account.currency) : '-'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Campaign Diagnostic Panel */}
      {selectedCampaign && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 199 }}
            onClick={() => setSelectedCampaign(null)}
          />
          <CampaignDiagnostic
            campaign={selectedCampaign}
            currency={account.currency}
            campaignMode={campaignMode}
            canWrite={canWrite}
            onClose={() => setSelectedCampaign(null)}
          />
        </>
      )}

      {/* Health Score */}
      {o && (
        <div className="glass-panel">
          <h3 style={{ marginBottom: 16, fontSize: '1.1rem' }}>🏥 Diagnóstico Rápido da Conta</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              {
                label: 'ROAS',
                ok: o.roas >= 2,
                warn: o.roas >= 1 && o.roas < 2,
                message: o.roas >= 3 ? `ROAS ${o.roas.toFixed(2)}x — Excelente performance` : o.roas >= 2 ? `ROAS ${o.roas.toFixed(2)}x — Rentável mas com espaço para melhoria` : o.roas >= 1 ? `ROAS ${o.roas.toFixed(2)}x — Atenção: abaixo do mínimo saudável (2x)` : o.roas > 0 ? `ROAS ${o.roas.toFixed(2)}x — Crítico: campanhas dando prejuízo` : 'N/A — Evento de compra não rastreado',
              },
              {
                label: 'CTR',
                ok: o.ctr >= 1,
                warn: o.ctr >= 0.5 && o.ctr < 1,
                message: o.ctr >= 2 ? `CTR ${o.ctr.toFixed(2)}% — Criativos com ótimo engajamento` : o.ctr >= 1 ? `CTR ${o.ctr.toFixed(2)}% — Dentro da média do mercado` : o.ctr >= 0.5 ? `CTR ${o.ctr.toFixed(2)}% — Abaixo da média. Revise os hooks dos criativos` : `CTR ${o.ctr.toFixed(2)}% — Crítico. Criativos não estão gerando cliques`,
              },
              {
                label: 'Frequência',
                ok: o.frequency <= 2.5,
                warn: o.frequency > 2.5 && o.frequency <= 4,
                message: o.frequency <= 2 ? `Freq ${o.frequency.toFixed(1)}x — Público fresco, tudo certo` : o.frequency <= 2.5 ? `Freq ${o.frequency.toFixed(1)}x — Aceitável, mas monitore` : o.frequency <= 4 ? `Freq ${o.frequency.toFixed(1)}x — Atenção: público aquecendo, prepare novos criativos` : `Freq ${o.frequency.toFixed(1)}x — Crítico: público saturado. Troque os criativos AGORA`,
              },
              {
                label: 'CPM',
                ok: o.cpm < 20,
                warn: o.cpm >= 20 && o.cpm < 35,
                message: o.cpm < 12 ? `CPM ${formatCurrency(o.cpm, account.currency)} — Excelente custo por mil` : o.cpm < 20 ? `CPM ${formatCurrency(o.cpm, account.currency)} — Dentro da média` : o.cpm < 35 ? `CPM ${formatCurrency(o.cpm, account.currency)} — Acima da média. Revise placements` : `CPM ${formatCurrency(o.cpm, account.currency)} — Muito alto. Verifique targeting e leilão`,
              },
            ].map((item) => (
              <div key={item.label} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                {item.ok ? (
                  <CheckCircle size={18} color="var(--success)" style={{ flexShrink: 0, marginTop: 1 }} />
                ) : item.warn ? (
                  <AlertTriangle size={18} color="var(--warning)" style={{ flexShrink: 0, marginTop: 1 }} />
                ) : (
                  <AlertTriangle size={18} color="var(--danger)" style={{ flexShrink: 0, marginTop: 1 }} />
                )}
                <div>
                  <span style={{ fontWeight: 600, fontSize: '0.875rem', marginRight: 8, color: 'var(--text-secondary)' }}>{item.label}</span>
                  <span style={{ fontSize: '0.875rem', color: item.ok ? 'var(--text-primary)' : item.warn ? 'var(--warning)' : 'var(--danger)' }}>{item.message}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
