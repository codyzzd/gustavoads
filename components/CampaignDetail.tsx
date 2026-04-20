'use client';

import { useState } from 'react';
import type { Campaign, CampaignMode, MetaPermission } from '@/lib/metaTypes';
import { CreativeGallery } from '@/components/CreativeGallery';
import { useApp } from '@/app/providers';
import {
  CheckCircle, AlertTriangle, DollarSign, TrendingUp, Pause,
  RefreshCw, Lock, ArrowLeft, Image,
} from 'lucide-react';

interface CampaignDetailProps {
  campaign: Campaign;
  currency: string;
  campaignMode: CampaignMode;
  metaPermission: MetaPermission;
  onBack: () => void;
}

function formatCurrency(value: number, currency = 'BRL') {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(value);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('pt-BR').format(Math.round(value));
}

function ActionButton({
  label, icon: Icon, color = 'var(--accent-primary)', canWrite, onClick, danger,
}: {
  label: string; icon: React.ElementType; color?: string;
  canWrite: boolean; onClick?: () => void; danger?: boolean;
}) {
  const locked = !canWrite;
  return (
    <button
      onClick={locked ? undefined : onClick}
      title={locked ? 'Requer token com ads_management (Leitura + Escrita)' : label}
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '8px 14px', borderRadius: 7, fontSize: '0.82rem', fontWeight: 600,
        border: locked ? '1px solid var(--border-base)' : `1px solid ${danger ? 'var(--danger-border)' : color + '55'}`,
        background: locked ? 'var(--bg-field)' : danger ? 'var(--danger-bg)' : `${color}18`,
        color: locked ? 'var(--fg-muted)' : danger ? 'var(--danger)' : color,
        cursor: locked ? 'not-allowed' : 'pointer',
        opacity: locked ? 0.6 : 1,
        transition: 'all 0.15s',
        whiteSpace: 'nowrap',
      }}
    >
      {locked ? <Lock size={13} /> : <Icon size={14} />}
      {label}
    </button>
  );
}

export function CampaignDetail({ campaign, currency, campaignMode, metaPermission, onBack }: CampaignDetailProps) {
  const [activeTab, setActiveTab] = useState<'diagnosis' | 'creatives' | 'adsets'>('diagnosis');
  const canWrite = metaPermission === 'readwrite';
  const { aiConfig, clientProfile } = useApp();
  const ins = campaign.insightsSummary;
  const adsets = campaign.adsets || [];
  const allAds = adsets.flatMap((as) => (as.ads || []).map((ad) => ({ ad, adsetName: as.name })));
  const sortedAds = [...allAds].sort((a, b) => (b.ad.creativeScore?.overall || 0) - (a.ad.creativeScore?.overall || 0));
  const pauseableAds = allAds.filter((a) => a.ad.creativeScore?.recommendation === 'PAUSE' && a.ad.status === 'ACTIVE');
  const scaleAds = allAds.filter((a) => a.ad.creativeScore?.recommendation === 'SCALE' && a.ad.status === 'ACTIVE');

  // Auto-diagnosis
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

  const iconFor = (level: 'error' | 'warn' | 'ok') =>
    level === 'ok'
      ? <CheckCircle size={16} color="var(--success)" style={{ flexShrink: 0 }} />
      : <AlertTriangle size={16} color={level === 'warn' ? 'var(--warning)' : 'var(--danger)'} style={{ flexShrink: 0 }} />;

  // Mock account for CreativeGallery
  const mockAccount = {
    id: 'detail', name: campaign.name, currency, timezone_name: '', account_status: 1,
    campaigns: [campaign],
  } as import('@/lib/metaTypes').AdAccount;

  const TABS = [
    { key: 'diagnosis' as const, label: 'Diagnóstico' },
    { key: 'creatives' as const, label: `Criativos${allAds.length > 0 ? ` (${allAds.length})` : ''}` },
    { key: 'adsets' as const, label: `Conjuntos (${adsets.length})` },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, minHeight: '100%' }}>

      {/* Breadcrumb / back header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button
          onClick={onBack}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px',
            borderRadius: 8, background: 'var(--bg-component)', border: '1px solid var(--border-base)',
            color: 'var(--fg-subtle)', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
            transition: 'border-color 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--border-strong)')}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-base)')}
        >
          <ArrowLeft size={15} />
          Campanhas
        </button>
        <span style={{ color: 'var(--fg-muted)', fontSize: '0.82rem' }}>/</span>
        <span
          style={{
            fontSize: '0.82rem', fontWeight: 600, color: 'var(--fg-base)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 500,
          }}
          title={campaign.name}
        >
          {campaign.name}
        </span>
        <span style={{
          fontSize: '0.72rem', fontWeight: 700, padding: '2px 9px', borderRadius: 12, marginLeft: 4,
          background: campaign.status === 'ACTIVE' ? 'var(--success-bg)' : 'var(--bg-hover)',
          color: campaign.status === 'ACTIVE' ? 'var(--success)' : 'var(--fg-muted)',
          border: campaign.status === 'ACTIVE' ? '1px solid var(--success-border)' : '1px solid var(--border-base)',
        }}>
          {campaign.status === 'ACTIVE' ? '● Ativo' : campaign.status}
        </span>
        {!canWrite && (
          <span style={{
            fontSize: '0.7rem', padding: '2px 8px', borderRadius: 10,
            background: 'var(--bg-hover)', color: 'var(--fg-muted)', border: '1px solid var(--border-base)',
            display: 'flex', alignItems: 'center', gap: 4, marginLeft: 4,
          }}>
            <Lock size={10} /> Somente leitura
          </span>
        )}

        {/* Action buttons */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <ActionButton label="Pausar Campanha" icon={Pause} canWrite={canWrite} danger />
          <ActionButton label="Duplicar" icon={RefreshCw} canWrite={canWrite} />
          <ActionButton label="Ajustar Budget" icon={DollarSign} canWrite={canWrite} />
        </div>
      </div>

      {/* Metrics row */}
      {ins && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10, marginBottom: 20 }}>
          {[
            { label: 'Gasto', value: formatCurrency(ins.spend, currency) },
            { label: 'CTR', value: `${ins.ctr.toFixed(2)}%` },
            { label: 'CPM', value: formatCurrency(ins.cpm, currency) },
            { label: 'Frequência', value: `${ins.frequency.toFixed(1)}x` },
            { label: 'Impressões', value: formatNumber(ins.impressions) },
            { label: 'Alcance', value: formatNumber(ins.reach) },
            ...(campaignMode === 'ecommerce' ? [
              { label: 'ROAS', value: ins.roas > 0 ? `${ins.roas.toFixed(2)}x` : 'N/A' },
              { label: 'CPA', value: ins.cpa > 0 ? formatCurrency(ins.cpa, currency) : 'N/A' },
              { label: 'Compras', value: ins.purchases > 0 ? formatNumber(ins.purchases) : 'N/A' },
            ] : []),
            ...(campaignMode === 'leads' ? [
              { label: 'Leads', value: ins.leads > 0 ? formatNumber(ins.leads) : 'N/A' },
              { label: 'CPL', value: ins.costPerLead > 0 ? formatCurrency(ins.costPerLead, currency) : 'N/A' },
            ] : []),
            ...(campaignMode === 'whatsapp' ? [
              { label: 'Conversas', value: ins.messagesStarted > 0 ? formatNumber(ins.messagesStarted) : 'N/A' },
              { label: 'Custo/Conv.', value: ins.costPerConversation > 0 ? formatCurrency(ins.costPerConversation, currency) : 'N/A' },
            ] : []),
          ].map((m) => (
            <div key={m.label} style={{
              background: 'var(--bg-component)', border: '1px solid var(--border-base)',
              borderRadius: 9, padding: '10px 14px',
            }}>
              <div style={{ fontSize: '0.68rem', color: 'var(--fg-muted)', marginBottom: 3 }}>{m.label}</div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--fg-base)' }}>{m.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Tab nav */}
      <div style={{
        display: 'flex', gap: 4, borderBottom: '1px solid var(--border-base)',
        marginBottom: 24, background: 'transparent',
      }}>
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            style={{
              padding: '9px 18px', background: 'transparent', border: 'none',
              borderBottom: activeTab === key ? '2px solid var(--accent-primary)' : '2px solid transparent',
              color: activeTab === key ? 'var(--accent-primary)' : 'var(--fg-muted)',
              fontWeight: activeTab === key ? 700 : 500, fontSize: '0.875rem',
              cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── TAB: DIAGNÓSTICO ── */}
      {activeTab === 'diagnosis' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

          {/* Issues */}
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--fg-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
              Diagnóstico Automático
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {issues.length === 0 ? (
                <p style={{ color: 'var(--fg-muted)', fontSize: '0.85rem' }}>Sem dados de insights para analisar.</p>
              ) : issues.map((issue, i) => (
                <div key={i} style={{
                  display: 'flex', gap: 10, alignItems: 'flex-start', padding: '10px 12px', borderRadius: 8,
                  background: issue.level === 'error' ? 'var(--danger-bg)' : issue.level === 'warn' ? 'var(--warning-bg)' : 'var(--success-bg)',
                  border: `1px solid ${issue.level === 'error' ? 'var(--danger-border)' : issue.level === 'warn' ? 'var(--warning-border)' : 'var(--success-border)'}`,
                }}>
                  {iconFor(issue.level)}
                  <span style={{ fontSize: '0.85rem', lineHeight: 1.5, color: issue.level === 'error' ? 'var(--danger)' : issue.level === 'warn' ? 'var(--warning)' : 'var(--success)' }}>
                    {issue.msg}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Recommended actions */}
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--fg-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
              Ações Recomendadas
            </div>
            {pauseableAds.length === 0 && scaleAds.length === 0 ? (
              <p style={{ color: 'var(--fg-muted)', fontSize: '0.85rem' }}>Nenhuma ação automática identificada.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {pauseableAds.map(({ ad }) => (
                  <div key={ad.id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
                    padding: '10px 14px', borderRadius: 8, background: 'var(--bg-component)', border: '1px solid var(--border-base)',
                  }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '0.82rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ad.name}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--danger)' }}>Score {ad.creativeScore?.overall}/100 · {ad.creativeScore?.fatigueLevel === 'CRITICAL' ? 'Fadiga crítica' : 'Performance baixa'}</div>
                    </div>
                    <ActionButton label="Pausar" icon={Pause} color="var(--danger)" canWrite={canWrite} danger />
                  </div>
                ))}
                {scaleAds.map(({ ad }) => (
                  <div key={ad.id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
                    padding: '10px 14px', borderRadius: 8, background: 'var(--bg-component)', border: '1px solid var(--border-base)',
                  }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '0.82rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ad.name}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--success)' }}>Score {ad.creativeScore?.overall}/100 · Top performer</div>
                    </div>
                    <ActionButton label="+20% Budget" icon={TrendingUp} color="var(--success)" canWrite={canWrite} />
                  </div>
                ))}
                {!canWrite && (
                  <div style={{ marginTop: 4, padding: '8px 10px', background: 'var(--bg-field)', borderRadius: 6, fontSize: '0.75rem', color: 'var(--fg-muted)', border: '1px solid var(--border-base)', display: 'flex', gap: 6, alignItems: 'center' }}>
                    <Lock size={12} />
                    Configure um token com <strong>ads_management</strong> para habilitar ações.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB: CRIATIVOS ── */}
      {activeTab === 'creatives' && (
        allAds.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 300, gap: 12, color: 'var(--fg-muted)' }}>
            <Image size={48} style={{ opacity: 0.25 }} />
            <p style={{ fontSize: '0.9rem' }}>Nenhum criativo encontrado nesta campanha.</p>
          </div>
        ) : (
          <CreativeGallery
            account={mockAccount}
            isLoading={false}
            campaignMode={campaignMode}
            clientProfile={clientProfile}
            aiConfig={aiConfig}
          />
        )
      )}

      {/* ── TAB: CONJUNTOS ── */}
      {activeTab === 'adsets' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {adsets.length === 0 ? (
            <p style={{ color: 'var(--fg-muted)', fontSize: '0.85rem' }}>Nenhum conjunto de anúncios encontrado.</p>
          ) : adsets.map((adset) => {
            const ai = adset.insightsSummary;
            const aud = adset.audienceAnalysis;
            return (
              <div key={adset.id} className="glass-panel" style={{ padding: '16px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap', marginBottom: aud ? 12 : 0 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 4 }}>{adset.name}</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--fg-muted)' }}>
                        {adset.optimization_goal?.replace(/_/g, ' ')}
                      </span>
                      {adset.daily_budget && (
                        <span style={{ fontSize: '0.72rem', color: 'var(--fg-muted)' }}>
                          Budget/dia: {formatCurrency(parseFloat(adset.daily_budget) / 100, currency)}
                        </span>
                      )}
                    </div>
                  </div>
                  {ai && (
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      {[
                        { l: 'Gasto', v: formatCurrency(ai.spend, currency) },
                        { l: 'CTR', v: `${ai.ctr.toFixed(2)}%` },
                        { l: 'CPM', v: formatCurrency(ai.cpm, currency) },
                        { l: 'Freq.', v: `${ai.frequency.toFixed(1)}x` },
                      ].map((m) => (
                        <div key={m.l} style={{ background: 'var(--bg-field)', borderRadius: 7, padding: '5px 10px', textAlign: 'center' }}>
                          <div style={{ fontSize: '0.62rem', color: 'var(--fg-muted)' }}>{m.l}</div>
                          <div style={{ fontSize: '0.82rem', fontWeight: 700 }}>{m.v}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {aud && (
                  <div style={{ borderTop: '1px solid var(--border-base)', paddingTop: 12, display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: 10, background: 'var(--accent-subtle)', color: 'var(--accent-primary)', border: '1px solid var(--accent-border)' }}>
                      {aud.type}
                    </span>
                    <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: 10, background: aud.saturationRisk === 'HIGH' ? 'var(--danger-bg)' : aud.saturationRisk === 'MEDIUM' ? 'var(--warning-bg)' : 'var(--success-bg)', color: aud.saturationRisk === 'HIGH' ? 'var(--danger)' : aud.saturationRisk === 'MEDIUM' ? 'var(--warning)' : 'var(--success)', border: `1px solid ${aud.saturationRisk === 'HIGH' ? 'var(--danger-border)' : aud.saturationRisk === 'MEDIUM' ? 'var(--warning-border)' : 'var(--success-border)'}` }}>
                      Saturação: {aud.saturationRisk}
                    </span>
                    <div style={{ flex: 1, minWidth: 200 }}>
                      {aud.recommendations.slice(0, 2).map((r, i) => (
                        <div key={i} style={{ fontSize: '0.75rem', color: 'var(--fg-subtle)', lineHeight: 1.5 }}>→ {r}</div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
