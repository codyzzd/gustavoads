'use client';

import type { AdAccount, AdSet, AudienceAnalysis } from '@/lib/metaTypes';
import { Users, Target, AlertTriangle, CheckCircle, Info, TrendingDown } from 'lucide-react';

interface ClientProfile {
  niche?: string;
  product?: string;
  objective?: string;
  ticket?: string;
  differentials?: string;
}

interface AudiencePanelProps {
  account: AdAccount | null;
  isLoading: boolean;
  clientProfile?: ClientProfile;
}

const AUDIENCE_TYPE_LABELS: Record<string, string> = {
  BROAD: '🌐 Amplo (Broad)',
  INTEREST: '🎯 Interesses',
  LOOKALIKE: '👥 Lookalike',
  CUSTOM: '📋 Customizado',
  RETARGETING: '🔁 Retargeting',
  ADVANTAGE_PLUS: '⚡ Advantage+',
};

const QUALITY_MAP = {
  EXCELLENT: { label: 'Excelente', color: 'var(--success)' },
  GOOD: { label: 'Bom', color: 'var(--accent-primary)' },
  FAIR: { label: 'Regular', color: 'var(--warning)' },
  POOR: { label: 'Fraco', color: 'var(--danger)' },
};

const SATURATION_MAP = {
  LOW: { label: 'Baixo', color: 'var(--success)' },
  MEDIUM: { label: 'Moderado', color: 'var(--warning)' },
  HIGH: { label: 'Alto', color: 'var(--danger)' },
};

function formatNumber(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

// suppress unused warning
void formatNumber;

function AudienceCard({ adset, analysis }: { adset: AdSet; analysis: AudienceAnalysis }) {
  const quality = QUALITY_MAP[analysis.quality];
  const saturation = SATURATION_MAP[analysis.saturationRisk];
  const typeLabel = AUDIENCE_TYPE_LABELS[analysis.type] || analysis.type;

  return (
    <div className="glass-panel" style={{ borderLeft: `3px solid ${quality.color}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 4 }}>{adset.name}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>ID: {adset.id}</div>
        </div>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          fontSize: '0.8rem', fontWeight: 600, color: quality.color,
          background: `${quality.color}18`, padding: '4px 12px', borderRadius: 20,
        }}>
          {quality.label}
        </span>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        <span style={{ fontSize: '0.8rem', background: 'var(--bg-primary)', padding: '4px 12px', borderRadius: 20, color: 'var(--text-secondary)' }}>
          {typeLabel}
        </span>
        <span style={{ fontSize: '0.8rem', background: `${saturation.color}15`, padding: '4px 12px', borderRadius: 20, color: saturation.color, fontWeight: 600 }}>
          Saturação: {saturation.label}
        </span>
        {adset.insightsSummary && (
          <span style={{ fontSize: '0.8rem', background: 'var(--bg-primary)', padding: '4px 12px', borderRadius: 20, color: 'var(--text-muted)' }}>
            Freq: {adset.insightsSummary.frequency.toFixed(1)}x
          </span>
        )}
      </div>

      {adset.insightsSummary && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
          {[
            { label: 'Gasto', value: `R$ ${adset.insightsSummary.spend.toFixed(0)}` },
            { label: 'ROAS', value: adset.insightsSummary.roas > 0 ? `${adset.insightsSummary.roas.toFixed(2)}x` : 'N/A' },
            { label: 'CTR', value: `${adset.insightsSummary.ctr.toFixed(2)}%` },
          ].map((m) => (
            <div key={m.label} style={{ background: 'var(--bg-primary)', borderRadius: 8, padding: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 2 }}>{m.label}</div>
              <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>{m.value}</div>
            </div>
          ))}
        </div>
      )}

      {analysis.insights.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8, display: 'flex', gap: 6, alignItems: 'center' }}>
            <Info size={14} /> Informações do Público
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {analysis.insights.map((insight, i) => (
              <div key={i} style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', paddingLeft: 8, borderLeft: '2px solid var(--bg-tertiary)' }}>
                {insight}
              </div>
            ))}
          </div>
        </div>
      )}

      {analysis.recommendations.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--warning)', display: 'flex', gap: 6, alignItems: 'center' }}>
            <AlertTriangle size={14} /> Recomendações
          </div>
          {analysis.recommendations.map((rec, i) => (
            <div key={i} style={{
              fontSize: '0.82rem', color: 'var(--text-primary)',
              background: 'rgba(255,184,0,0.08)', border: '1px solid rgba(255,184,0,0.2)',
              borderRadius: 8, padding: '8px 12px', lineHeight: 1.4,
            }}>
              {rec}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function AudiencePanel({ account, isLoading }: AudiencePanelProps) {
  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <div className="spin-loader" />
      </div>
    );
  }

  if (!account) {
    return (
      <div className="glass-panel" style={{ textAlign: 'center', padding: 60 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>👥</div>
        <h3>Nenhum dado de público carregado</h3>
        <p style={{ color: 'var(--text-secondary)' }}>Configure a Meta API para ver análise detalhada dos seus públicos.</p>
      </div>
    );
  }

  const allAdsets: AdSet[] = [];
  for (const campaign of account.campaigns || []) {
    for (const adset of campaign.adsets || []) {
      allAdsets.push(adset);
    }
  }

  if (allAdsets.length === 0) {
    return (
      <div className="glass-panel" style={{ textAlign: 'center', padding: 60 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>👥</div>
        <h3>Nenhum conjunto de anúncios encontrado</h3>
      </div>
    );
  }

  const retargeting = allAdsets.filter((a) => a.audienceAnalysis?.type === 'RETARGETING');
  const lookalike = allAdsets.filter((a) => a.audienceAnalysis?.type === 'LOOKALIKE');
  const interest = allAdsets.filter((a) => a.audienceAnalysis?.type === 'INTEREST');
  const broad = allAdsets.filter((a) => a.audienceAnalysis?.type === 'BROAD');
  const advantagePlus = allAdsets.filter((a) => a.audienceAnalysis?.type === 'ADVANTAGE_PLUS');
  const other = allAdsets.filter((a) => !['RETARGETING', 'LOOKALIKE', 'INTEREST', 'BROAD', 'ADVANTAGE_PLUS'].includes(a.audienceAnalysis?.type || ''));
  const highSaturation = allAdsets.filter((a) => a.audienceAnalysis?.saturationRisk === 'HIGH');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      <div className="dashboard-grid">
        {[
          { label: 'Total de Conjuntos', value: allAdsets.length, icon: Users, color: 'var(--accent-primary)' },
          { label: 'Retargeting', value: retargeting.length, icon: Target, color: 'var(--success)' },
          { label: 'Lookalike', value: lookalike.length, icon: Users, color: 'var(--accent-secondary)' },
          { label: 'Saturação Alta', value: highSaturation.length, icon: TrendingDown, color: highSaturation.length > 0 ? 'var(--danger)' : 'var(--text-muted)' },
        ].map((item) => (
          <div key={item.label} className="glass-panel metric-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="metric-title">{item.label}</div>
              <item.icon size={18} color={item.color} />
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: item.color }}>{item.value}</div>
          </div>
        ))}
      </div>

      {highSaturation.length > 0 && (
        <div style={{ background: 'rgba(255,51,102,0.1)', border: '1px solid rgba(255,51,102,0.3)', borderRadius: 12, padding: '16px 20px' }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8 }}>
            <AlertTriangle size={18} color="var(--danger)" />
            <strong style={{ color: 'var(--danger)' }}>{highSaturation.length} público(s) com saturação crítica</strong>
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>
            Estes conjuntos estão com frequência alta e precisam de novos criativos ou expansão de público:
            <strong style={{ color: 'var(--text-primary)' }}> {highSaturation.map((a) => a.name).join(', ')}</strong>
          </p>
        </div>
      )}

      {retargeting.length > 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <CheckCircle size={20} color="var(--success)" />
            <h3 style={{ margin: 0, color: 'var(--success)' }}>🔁 Retargeting — Fundo de Funil ({retargeting.length})</h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: 20 }}>
            {retargeting.map((adset) => (
              <AudienceCard key={adset.id} adset={adset} analysis={adset.audienceAnalysis!} />
            ))}
          </div>
        </div>
      )}

      {advantagePlus.length > 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <Target size={20} color="var(--accent-primary)" />
            <h3 style={{ margin: 0 }}>⚡ Advantage+ ({advantagePlus.length})</h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: 20 }}>
            {advantagePlus.map((adset) => (
              <AudienceCard key={adset.id} adset={adset} analysis={adset.audienceAnalysis!} />
            ))}
          </div>
        </div>
      )}

      {lookalike.length > 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <Users size={20} color="var(--accent-secondary)" />
            <h3 style={{ margin: 0 }}>👥 Lookalike — Prospecção Qualificada ({lookalike.length})</h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: 20 }}>
            {lookalike.map((adset) => (
              <AudienceCard key={adset.id} adset={adset} analysis={adset.audienceAnalysis!} />
            ))}
          </div>
        </div>
      )}

      {interest.length > 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <Target size={20} color="var(--warning)" />
            <h3 style={{ margin: 0 }}>🎯 Por Interesses ({interest.length})</h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: 20 }}>
            {interest.map((adset) => (
              <AudienceCard key={adset.id} adset={adset} analysis={adset.audienceAnalysis!} />
            ))}
          </div>
        </div>
      )}

      {broad.length > 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <Users size={20} color="var(--text-secondary)" />
            <h3 style={{ margin: 0 }}>🌐 Público Amplo (Broad) ({broad.length})</h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: 20 }}>
            {broad.map((adset) => (
              <AudienceCard key={adset.id} adset={adset} analysis={adset.audienceAnalysis!} />
            ))}
          </div>
        </div>
      )}

      {other.length > 0 && (
        <div>
          <h3 style={{ marginBottom: 16 }}>Outros ({other.length})</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: 20 }}>
            {other.map((adset) => adset.audienceAnalysis && (
              <AudienceCard key={adset.id} adset={adset} analysis={adset.audienceAnalysis} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
