'use client';

import type { AdAccount, Campaign, CampaignMode } from '@/lib/metaTypes';
import { ChevronRight, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';

interface CampaignsPageProps {
  account: AdAccount | null;
  isLoading: boolean;
  campaignMode: CampaignMode;
  onSelectCampaign: (campaign: Campaign) => void;
}

function formatCurrency(value: number, currency = 'BRL'): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(value);
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('pt-BR').format(Math.round(value));
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
      display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '0.78rem', fontWeight: 600,
      color: cfg.color, background: `${cfg.color}18`, padding: '3px 10px', borderRadius: 20,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.color }} />
      {cfg.label}
    </span>
  );
}

function getRoasColor(roas: number) {
  if (roas >= 3) return 'var(--success)';
  if (roas >= 1.5) return 'var(--warning)';
  if (roas > 0) return 'var(--danger)';
  return 'var(--text-muted)';
}

function getFrequencyColor(freq: number) {
  if (freq > 4) return 'var(--danger)';
  if (freq > 2.5) return 'var(--warning)';
  return 'var(--success)';
}

export function CampaignsPage({ account, isLoading, campaignMode, onSelectCampaign }: CampaignsPageProps) {
  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400, flexDirection: 'column', gap: 16 }}>
        <div className="spin-loader" />
        <p style={{ color: 'var(--text-secondary)' }}>Carregando campanhas...</p>
      </div>
    );
  }

  if (!account) {
    return (
      <div className="glass-panel" style={{ textAlign: 'center', padding: 60 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📢</div>
        <h3 style={{ marginBottom: 8 }}>Nenhuma conta conectada</h3>
        <p style={{ color: 'var(--text-secondary)' }}>
          Configure seu Meta Access Token nas Configurações e clique em Sincronizar.
        </p>
      </div>
    );
  }

  const campaigns = account.campaigns || [];
  const activeCampaigns = campaigns.filter((c) => c.status === 'ACTIVE');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Summary bar */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {[
          { label: 'Total', value: campaigns.length, color: 'var(--fg-base)' },
          { label: 'Ativas', value: activeCampaigns.length, color: 'var(--success)' },
          { label: 'Pausadas', value: campaigns.filter((c) => c.status === 'PAUSED').length, color: 'var(--warning)' },
        ].map((s) => (
          <div key={s.label} style={{
            padding: '10px 18px', borderRadius: 10,
            background: 'var(--bg-component)', border: '1px solid var(--border-base)',
            display: 'flex', gap: 8, alignItems: 'center',
          }}>
            <span style={{ fontSize: '1.2rem', fontWeight: 800, color: s.color }}>{s.value}</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--fg-muted)' }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ tableLayout: 'fixed', width: '100%' }}>
            <colgroup>
              <col style={{ width: '28%' }} />
              <col style={{ width: '90px' }} />
              <col style={{ width: '110px' }} />
              <col style={{ width: '110px' }} />
              <col style={{ width: '90px' }} />
              <col style={{ width: '90px' }} />
              <col style={{ width: '80px' }} />
              <col style={{ width: '80px' }} />
              <col style={{ width: '90px' }} />
              <col style={{ width: '44px' }} />
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
                <th></th>
              </tr>
            </thead>
            <tbody>
              {campaigns.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>
                    Nenhuma campanha encontrada
                  </td>
                </tr>
              ) : (
                campaigns.map((campaign) => {
                  const ins = campaign.insightsSummary;
                  return (
                    <tr
                      key={campaign.id}
                      onClick={() => onSelectCampaign(campaign)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td style={{ maxWidth: 0 }}>
                        <div
                          title={campaign.name}
                          style={{ fontWeight: 600, fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                        >
                          {campaign.name}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>
                          {(campaign.adsets?.length ?? 0)} conjuntos
                        </div>
                      </td>
                      <td>{getStatusBadge(campaign.status)}</td>
                      <td>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                          {campaign.objective?.replace('OUTCOME_', '').replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td style={{ fontWeight: 700 }}>
                        {ins ? formatCurrency(ins.spend, account.currency) : '-'}
                      </td>
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
                          <td style={{ color: 'var(--success)', fontWeight: 700 }}>
                            {ins?.messagesStarted ? formatNumber(ins.messagesStarted) : '-'}
                          </td>
                          <td style={{ color: ins?.costPerConversation && ins.costPerConversation < 20 ? 'var(--success)' : 'var(--warning)' }}>
                            {ins?.costPerConversation ? formatCurrency(ins.costPerConversation, account.currency) : '-'}
                          </td>
                        </>
                      )}
                      {campaignMode === 'leads' && (
                        <>
                          <td style={{ color: 'var(--accent-secondary)', fontWeight: 700 }}>
                            {ins?.leads ? formatNumber(ins.leads) : '-'}
                          </td>
                          <td style={{ color: ins?.costPerLead && ins.costPerLead < 50 ? 'var(--success)' : 'var(--warning)' }}>
                            {ins?.costPerLead ? formatCurrency(ins.costPerLead, account.currency) : '-'}
                          </td>
                        </>
                      )}
                      {campaignMode === 'traffic' && (
                        <>
                          <td style={{ fontWeight: 700 }}>
                            {ins?.landingPageViews ? formatNumber(ins.landingPageViews) : '-'}
                          </td>
                          <td>{ins?.costPerLandingPageView ? formatCurrency(ins.costPerLandingPageView, account.currency) : '-'}</td>
                        </>
                      )}
                      {campaignMode === 'awareness' && (
                        <>
                          <td style={{ fontWeight: 700 }}>
                            {ins?.videoThruPlays ? formatNumber(ins.videoThruPlays) : '-'}
                          </td>
                          <td>{ins?.costPerThruPlay ? formatCurrency(ins.costPerThruPlay, account.currency) : '-'}</td>
                        </>
                      )}
                      <td style={{
                        color: ins?.ctr ? (ins.ctr >= 1 ? 'var(--success)' : ins.ctr >= 0.5 ? 'var(--warning)' : 'var(--danger)') : 'var(--text-muted)',
                        fontWeight: 600,
                      }}>
                        {ins?.ctr ? `${ins.ctr.toFixed(2)}%` : '-'}
                      </td>
                      <td style={{ color: ins?.frequency ? getFrequencyColor(ins.frequency) : 'var(--text-muted)', fontWeight: 600 }}>
                        {ins?.frequency ? `${ins.frequency.toFixed(1)}x` : '-'}
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>
                        {ins?.cpm ? formatCurrency(ins.cpm, account.currency) : '-'}
                      </td>
                      <td>
                        <ChevronRight size={16} color="var(--text-muted)" />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
