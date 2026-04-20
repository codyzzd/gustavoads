'use client';

import type { AdAccount, CampaignMode } from '@/lib/metaTypes';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Activity, DollarSign, MousePointer, Eye, Users, ShoppingCart, MessageCircle, Target, Play } from 'lucide-react';

interface InsightsDashboardProps {
  account: AdAccount | null;
  isLoading: boolean;
  datePreset: string;
  campaignMode?: CampaignMode;
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


export function InsightsDashboard({ account, isLoading, datePreset, campaignMode = 'ecommerce' }: InsightsDashboardProps) {
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
