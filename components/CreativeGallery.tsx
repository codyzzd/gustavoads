'use client';

import { useState, useEffect } from 'react';
import type { Ad, AdAccount } from '@/lib/metaTypes';
import type { CampaignMode } from '@/lib/metaTypes';
import { getCreativeImageUrl, getCreativeBody, getCreativeTitle } from '@/lib/metaTypes';
import {
  TrendingUp, Pause, RefreshCw, Eye, AlertTriangle,
  Lightbulb, Target, Film, Image, Video, Layers, Zap, X,
  ChevronRight, Sparkles, Clock,
} from 'lucide-react';
import type { AIProviderConfig } from '@/lib/aiClient';
import { analyzeCreativeVision } from '@/lib/aiClient';

interface ClientProfile {
  niche?: string;
  product?: string;
  objective?: string;
  ticket?: string;
  differentials?: string;
}

interface CreativeGalleryProps {
  account: AdAccount | null;
  isLoading: boolean;
  campaignMode?: CampaignMode;
  clientProfile?: ClientProfile;
  aiConfig?: AIProviderConfig;
}

function fmtCur(v: number, cur = 'BRL') {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: cur }).format(v);
}

type RecommendationType = 'SCALE' | 'KEEP' | 'TEST_VARIATION' | 'PAUSE';

const REC_MAP: Record<RecommendationType, { label: string; color: string }> = {
  SCALE:          { label: '📈 Escalar',        color: 'var(--success)' },
  KEEP:           { label: '✅ Manter',          color: 'var(--accent-primary)' },
  TEST_VARIATION: { label: '🔄 Testar Variação', color: 'var(--warning)' },
  PAUSE:          { label: '⏸️ Pausar',          color: 'var(--danger)' },
};

const FATIGUE_MAP = {
  LOW:      { label: 'Baixa',      color: 'var(--success)' },
  MEDIUM:   { label: 'Moderada',   color: 'var(--warning)' },
  HIGH:     { label: 'Alta',       color: 'var(--danger)' },
  CRITICAL: { label: '🔴 Crítica', color: 'var(--danger)' },
};

function getNicheHooks(niche?: string, product?: string): string[] {
  const n = (niche || '').toLowerCase();
  const p = (product || '').toLowerCase();

  if (n.includes('consórc') || p.includes('consórc')) {
    return [
      '💡 Hook: "O aluguel te custou mais de R$50k nos últimos 5 anos — e nenhum centavo voltou."',
      '💡 Hook: "Quem tem consórcio paga parcela de imóvel SEM pagar juros de banco"',
      '💡 Hook: "Como esse [profissão] comprou o apartamento em 18 meses — sem entrada"',
      '💡 Ângulo: Simulação visual comparando consórcio x aluguel x financiamento bancário',
      '💡 CTA: "Simular meu consórcio agora" — evite "Saiba mais" (muito genérico)',
    ];
  }
  if (n.includes('imóvel') || n.includes('imobili') || p.includes('imóvel')) {
    return [
      '💡 Hook: "Renda de R$3.000/mês pode ser suficiente para sair do aluguel — veja como"',
      '💡 Hook: Mostre o imóvel pronto por dentro, câmera lenta — desperte o sonho',
      '💡 Ângulo: "Qual bairro cabe no seu orçamento?" — quiz no formulário',
      '💡 CTA: "Ver imóveis disponíveis" com foto + preço visível no anúncio',
    ];
  }
  if (n.includes('estétic') || n.includes('clínic') || n.includes('saúde')) {
    return [
      '💡 Hook: Antes/Depois real (foco no sorriso, não no procedimento)',
      '💡 Hook: "Você merece se sentir bem — e sem longa lista de espera"',
      '💡 Ângulo: Mostre o ambiente da clínica, a equipe, o processo — gera confiança',
      '💡 CTA: "Agendar avaliação gratuita" — reduz barreira de entrada',
      '📌 2026: Use Reels 9:16 mostrando a experiência do cliente',
    ];
  }
  if (n.includes('educação') || n.includes('curso') || n.includes('infoprod')) {
    return [
      '💡 Hook: "Em 4 semanas, aprendi o que 4 anos de faculdade não me ensinou"',
      '💡 Ângulo: Mostre o resultado do aluno (renda, aprovação, mudança de vida)',
      '💡 Formato: VSL de 60-90s funciona melhor que estático para infoprodutos',
      '💡 CTA: "Garantir minha vaga" ou "Acessar aula grátis"',
    ];
  }
  return [
    '💡 Hook: Pare o scroll nos primeiros 2s — dado surpreendente, pergunta ou transformação visual',
    '💡 Ângulo: Dor específica → solução do produto → prova social → CTA com benefício',
    '💡 O criativo que mais converte: UGC ou depoimento real, câmera na mão',
    '💡 2026: Otimize para retenção de vídeo, não apenas para o click',
  ];
}

function getQualitativeAnalysis(ad: Ad, niche?: string, mode?: CampaignMode) {
  const ins = ad.insightsSummary;
  const sc = ad.creativeScore;
  const creative = ad.creative;
  const insights: string[] = [];
  const improvements: string[] = [];

  if (!ins || !sc) return { insights: ['Sem dados suficientes para análise.'], improvements: [] };

  if (ins.ctr < 0.5) {
    insights.push('🔴 CTR crítico (<0.5%): o gancho visual não está parando o scroll.');
    improvements.push('Troque os primeiros 2s do vídeo ou o headline da imagem — teste gancho de dor ou número chocante.');
  } else if (ins.ctr < 1.0) {
    insights.push('⚠️ CTR abaixo do benchmark (1%). O gancho precisa de mais força.');
    improvements.push('Teste 2-3 novos hooks mantendo o mesmo corpo de copy e a mesma oferta.');
  } else if (ins.ctr >= 2.0) {
    insights.push(`✅ CTR excelente (${ins.ctr.toFixed(2)}%) — o gancho está funcionando.`);
  }

  if (sc.fatigueLevel === 'CRITICAL') {
    insights.push('🔴 Frequência crítica: o público já viu este anúncio muitas vezes.');
    improvements.push('Pause e substitua por novo criativo com visual completamente diferente.');
  } else if (sc.fatigueLevel === 'HIGH') {
    insights.push('⚠️ Alta fadiga: prepare novos criativos agora.');
    improvements.push('Crie 2-3 variações do gancho. Priorize Reels 9:16 com menor CPM.');
  }

  if (mode === 'leads' && ins.costPerLead > 60) {
    insights.push(`🔴 CPL R$ ${ins.costPerLead.toFixed(2)}: caro para geração de leads.`);
    improvements.push('Revise o formulário: mais de 3 campos = queda brusca na conversão.');
  }
  if (mode === 'whatsapp' && ins.costPerConversation > 60) {
    insights.push(`🔴 Custo/conversa R$ ${ins.costPerConversation.toFixed(2)}: acima do benchmark.`);
    improvements.push('Adicione mais urgência ao CTA — "Falar com especialista AGORA" converte mais.');
  }
  if ((mode === 'ecommerce' || !mode) && ins.roas > 0 && ins.roas < 1.5) {
    insights.push(`🔴 ROAS ${ins.roas.toFixed(2)}x: campanha gerando prejuízo.`);
    improvements.push('Teste Advantage+ Audience — pode estar atingindo pessoas sem interesse de compra.');
  }

  if (creative) {
    const body = creative.body || '';
    if (body.length < 50) improvements.push('Copy curta: adicione 1-2 linhas com benefício principal + prova social.');
    if (!body.includes('?') && !body.includes('!')) improvements.push('Adicione emoção ao copy: perguntas engajam, exclamações criam urgência.');
  }

  if (ins.cpm > 25) improvements.push('📌 2026: Teste Reels 9:16 — CPM 30-50% menor que Feed horizontal.');

  return { insights, improvements };
}

// ── Score bar ──────────────────────────────────────────────────────────────
function ScoreBar({ score, color }: { score: number; color: string }) {
  return (
    <div style={{ background: 'var(--bg-hover)', borderRadius: 3, height: 4, overflow: 'hidden', flex: 1 }}>
      <div style={{ height: '100%', borderRadius: 3, width: `${score}%`, background: color, transition: 'width 0.8s ease' }} />
    </div>
  );
}

// ── Format badge ───────────────────────────────────────────────────────────
function FormatBadge({ format }: { format?: string }) {
  if (!format || format === 'UNKNOWN') return null;
  const map: Record<string, { icon: React.ElementType; label: string }> = {
    VIDEO:    { icon: Film,   label: 'Vídeo' },
    IMAGE:    { icon: Image,  label: 'Imagem' },
    CAROUSEL: { icon: Layers, label: 'Carrossel' },
    DYNAMIC:  { icon: Zap,    label: 'Dinâmico' },
  };
  const item = map[format];
  if (!item) return null;
  const Icon = item.icon;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 3,
      fontSize: '0.6875rem', fontWeight: 500,
      background: 'var(--bg-hover)', color: 'var(--fg-muted)',
      border: '1px solid var(--border-base)',
      padding: '2px 6px', borderRadius: 4,
    }}>
      <Icon size={10} /> {item.label}
    </span>
  );
}

// ── Compact gallery card ───────────────────────────────────────────────────
interface CardItem {
  ad: Ad;
  campaignName: string;
  adsetName: string;
  currency: string;
  rank: number;
  niche?: string;
  product?: string;
  mode?: CampaignMode;
  aiConfig?: AIProviderConfig;
}

interface SavedAnalysis {
  text: string;
  analyzedAt: string;
  provider: string;
}

const CTA_LABELS: Record<string, string> = {
  LEARN_MORE: 'Saiba mais', SHOP_NOW: 'Comprar agora', SIGN_UP: 'Cadastre-se',
  CONTACT_US: 'Fale conosco', SEND_MESSAGE: 'Enviar mensagem', GET_QUOTE: 'Solicitar orçamento',
  DOWNLOAD: 'Baixar', SUBSCRIBE: 'Inscrever-se', WATCH_MORE: 'Ver mais',
  APPLY_NOW: 'Candidatar-se', GET_OFFER: 'Ver oferta', BOOK_TRAVEL: 'Reservar',
  CALL_NOW: 'Ligar agora', DIRECTIONS: 'Como chegar', OPEN_LINK: 'Abrir link',
  LIKE_PAGE: 'Curtir página', NO_BUTTON: '',
};

function CreativeCard({ item, onClick }: { item: CardItem; onClick: () => void }) {
  const { ad, campaignName, currency, mode, rank } = item;
  const score = ad.creativeScore;
  const ins = ad.insightsSummary;
  const imageUrl = getCreativeImageUrl(ad.creative);
  const bodyText = getCreativeBody(ad.creative);
  const titleText = getCreativeTitle(ad.creative);
  const ctaType = ad.creative?.call_to_action_type;
  const ctaLabel = ctaType ? (CTA_LABELS[ctaType] ?? ctaType.replace(/_/g, ' ').toLowerCase()) : 'Saiba mais';

  const overallColor =
    !score ? 'var(--fg-muted)' :
    score.overall >= 75 ? 'var(--success)' :
    score.overall >= 50 ? 'var(--warning)' : 'var(--danger)';

  const rec = score ? (REC_MAP[score.recommendation as RecommendationType] || REC_MAP.KEEP) : null;

  let primaryMetric = ins?.roas ? `${ins.roas.toFixed(2)}x ROAS` : null;
  if (mode === 'whatsapp' && ins?.costPerConversation) primaryMetric = `${fmtCur(ins.costPerConversation, currency)} /conv`;
  if (mode === 'leads' && ins?.costPerLead) primaryMetric = `${fmtCur(ins.costPerLead, currency)} CPL`;

  return (
    <div
      style={{
        background: 'var(--bg-component)',
        border: '1px solid var(--border-base)',
        borderRadius: 'var(--radius)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        transition: 'border-color 0.15s',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--border-strong)')}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-base)')}
    >
      {/* ── Ad header (mimics FB/IG) ── */}
      <div style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--accent-subtle)', border: '1px solid var(--accent-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--accent-primary)' }}>#{rank}</span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {ad.name}
          </div>
          <div style={{ fontSize: '0.68rem', color: 'var(--fg-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
            Patrocinado <FormatBadge format={ad.adFormat} />
          </div>
        </div>
        {score && (
          <div style={{
            width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
            background: `conic-gradient(${overallColor} ${score.overall * 3.6}deg, var(--bg-hover) 0deg)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--bg-component)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.58rem', fontWeight: 700, color: overallColor }}>
              {score.overall}
            </div>
          </div>
        )}
      </div>

      {/* ── Ad body text ── */}
      {bodyText && (
        <div style={{ padding: '0 12px 8px', fontSize: '0.8rem', color: 'var(--fg-subtle)', lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
          {bodyText}
        </div>
      )}

      {/* ── Image (cover — consistent card height) ── */}
      <div style={{ position: 'relative', background: 'var(--bg-base)', height: 200, overflow: 'hidden', flexShrink: 0 }}>
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={ad.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 6 }}>
            <Image size={28} color="var(--fg-muted)" />
            <span style={{ fontSize: '0.7rem', color: 'var(--fg-muted)' }}>Sem prévia</span>
          </div>
        )}
        {ad.adFormat === 'VIDEO' && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.25)' }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Video size={18} color="#000" />
            </div>
          </div>
        )}
        {/* Status pill */}
        <div style={{ position: 'absolute', bottom: 8, left: 8 }}>
          <span style={{
            fontSize: '0.6rem', fontWeight: 600,
            color: ad.status === 'ACTIVE' ? 'var(--success)' : 'var(--fg-muted)',
            background: 'var(--bg-component)',
            border: `1px solid ${ad.status === 'ACTIVE' ? 'var(--success-border)' : 'var(--border-base)'}`,
            padding: '2px 6px', borderRadius: 20,
          }}>
            {ad.status === 'ACTIVE' ? '● Ativo' : ad.status}
          </span>
        </div>
        {/* Rec pill */}
        {rec && (
          <div style={{ position: 'absolute', bottom: 8, right: 8 }}>
            <span style={{ fontSize: '0.6rem', fontWeight: 600, color: rec.color, background: 'var(--bg-component)', border: `1px solid ${rec.color}40`, padding: '2px 6px', borderRadius: 20 }}>
              {rec.label}
            </span>
          </div>
        )}
      </div>

      {/* ── Ad footer (headline + CTA) ── */}
      <div style={{ padding: '10px 12px', borderTop: '1px solid var(--border-base)', display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-subtle)' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {titleText && (
            <div style={{ fontSize: '0.8125rem', fontWeight: 600, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {titleText}
            </div>
          )}
          <div style={{ fontSize: '0.68rem', color: 'var(--fg-muted)', marginTop: 1 }}>{campaignName.slice(0, 40)}{campaignName.length > 40 ? '…' : ''}</div>
        </div>
        {ctaLabel && (
          <div style={{ flexShrink: 0, padding: '5px 10px', background: 'var(--bg-hover)', border: '1px solid var(--border-strong)', borderRadius: 5, fontSize: '0.72rem', fontWeight: 600, color: 'var(--fg-subtle)', whiteSpace: 'nowrap' }}>
            {ctaLabel}
          </div>
        )}
      </div>

      {/* ── Metrics + button ── */}
      <div style={{ padding: '8px 12px 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
        {ins && (
          <>
            <div style={{ background: 'var(--bg-base)', borderRadius: 5, padding: '4px 8px', fontSize: '0.72rem' }}>
              <span style={{ color: 'var(--fg-muted)' }}>CTR </span>
              <span style={{ fontWeight: 600 }}>{ins.ctr.toFixed(2)}%</span>
            </div>
            <div style={{ background: 'var(--bg-base)', borderRadius: 5, padding: '4px 8px', fontSize: '0.72rem' }}>
              <span style={{ color: 'var(--fg-muted)' }}>Gasto </span>
              <span style={{ fontWeight: 600 }}>{fmtCur(ins.spend, currency)}</span>
            </div>
            {primaryMetric && (
              <div style={{ background: 'var(--bg-base)', borderRadius: 5, padding: '4px 8px', fontSize: '0.72rem', fontWeight: 600, color: 'var(--fg-subtle)' }}>{primaryMetric}</div>
            )}
          </>
        )}
        <button
          onClick={onClick}
          style={{
            marginLeft: 'auto', flexShrink: 0,
            display: 'flex', alignItems: 'center', gap: 4,
            background: 'transparent', border: '1px solid var(--border-base)',
            borderRadius: 5, height: 28, padding: '0 10px',
            color: 'var(--fg-subtle)', fontSize: '0.75rem', cursor: 'pointer',
            transition: 'background 0.15s, color 0.15s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--fg-base)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--fg-subtle)'; }}
        >
          Ver detalhes <ChevronRight size={12} />
        </button>
      </div>
    </div>
  );
}

// ── Detail Modal ───────────────────────────────────────────────────────────
function CreativeDetailModal({ item, onClose }: { item: CardItem; onClose: () => void }) {
  const { ad, campaignName, adsetName, currency, rank, niche, product, mode, aiConfig } = item;
  const score = ad.creativeScore;
  const ins = ad.insightsSummary;
  const imageUrl = getCreativeImageUrl(ad.creative);
  const bodyText = getCreativeBody(ad.creative);
  const titleText = getCreativeTitle(ad.creative);
  const rec = score ? (REC_MAP[score.recommendation as RecommendationType] || REC_MAP.KEEP) : null;
  const fatigue = score ? (FATIGUE_MAP[score.fatigueLevel] || FATIGUE_MAP.LOW) : null;
  const { insights, improvements } = getQualitativeAnalysis(ad, niche, mode);
  const nicheHooks = getNicheHooks(niche, product);

  // ── AI Vision Analysis ──
  const storageKey = `creative_ai_${ad.id}`;
  const [savedAnalysis, setSavedAnalysis] = useState<SavedAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) setSavedAnalysis(JSON.parse(raw));
    } catch { /* ignore */ }
  }, [storageKey]);

  const handleAnalyze = async () => {
    if (!aiConfig || !imageUrl) return;
    setIsAnalyzing(true);
    setAnalysisError(null);
    try {
      const text = await analyzeCreativeVision(aiConfig, {
        imageUrl,
        adName: ad.name,
        campaignName,
        adFormat: ad.adFormat,
        metrics: ins ? {
          ctr: ins.ctr, cpc: ins.cpc, spend: ins.spend,
          roas: ins.roas, cpl: ins.costPerLead, cpm: ins.cpm,
          impressions: ins.impressions, frequency: ins.frequency,
        } : undefined,
        niche,
        currency,
      });
      const result: SavedAnalysis = {
        text,
        analyzedAt: new Date().toISOString(),
        provider: aiConfig.provider,
      };
      setSavedAnalysis(result);
      localStorage.setItem(storageKey, JSON.stringify(result));
    } catch (e) {
      setAnalysisError((e as Error).message || 'Erro ao analisar.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const overallColor =
    !score ? 'var(--fg-muted)' :
    score.overall >= 75 ? 'var(--success)' :
    score.overall >= 50 ? 'var(--warning)' : 'var(--danger)';

  let primaryMetric = { label: 'ROAS', value: ins?.roas ? `${ins.roas.toFixed(2)}x` : 'N/A' };
  if (mode === 'whatsapp') primaryMetric = { label: 'Custo/Conv.', value: ins?.costPerConversation ? fmtCur(ins.costPerConversation, currency) : 'N/A' };
  if (mode === 'leads') primaryMetric = { label: 'CPL', value: ins?.costPerLead ? fmtCur(ins.costPerLead, currency) : 'N/A' };
  if (mode === 'traffic') primaryMetric = { label: 'Custo/LPV', value: ins?.costPerLandingPageView ? fmtCur(ins.costPerLandingPageView, currency) : 'N/A' };
  if (mode === 'awareness') primaryMetric = { label: 'CPM', value: ins?.cpm ? fmtCur(ins.cpm, currency) : 'N/A' };

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 200, padding: '24px 16px',
        animation: 'fadeIn 0.15s ease',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: 'var(--bg-component)',
        border: '1px solid var(--border-base)',
        borderRadius: 'var(--radius-lg)',
        width: '100%', maxWidth: 860,
        maxHeight: '90vh', overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
      }}>
        {/* Modal header */}
        <div style={{
          padding: '14px 20px',
          borderBottom: '1px solid var(--border-base)',
          display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0,
        }}>
          <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--fg-muted)', background: 'var(--bg-hover)', padding: '2px 7px', borderRadius: 4 }}>#{rank}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: '0.9375rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ad.name}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--fg-muted)' }}>{campaignName} · {adsetName}</div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', padding: 6, cursor: 'pointer', color: 'var(--fg-muted)', borderRadius: 6, height: 'auto' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal body */}
        <div style={{ overflow: 'y', overflowY: 'auto', flex: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', minHeight: 0 }}>

            {/* Left: image + score */}
            <div style={{ borderRight: '1px solid var(--border-base)', padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Image — natural proportions, no cropping */}
              <div style={{ background: 'var(--bg-base)', borderRadius: 8, overflow: 'hidden', position: 'relative', height: 280 }}>
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={ad.name}
                    style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                ) : (
                  <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8 }}>
                    <Image size={32} color="var(--fg-muted)" />
                    <span style={{ fontSize: '0.75rem', color: 'var(--fg-muted)' }}>Sem prévia</span>
                  </div>
                )}
                {ad.adFormat === 'VIDEO' && (
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.25)' }}>
                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Video size={20} color="#000" />
                    </div>
                  </div>
                )}
              </div>

              {/* Copy preview */}
              {(titleText || bodyText) && (
                <div style={{ background: 'var(--bg-base)', borderRadius: 7, padding: '10px 12px', fontSize: '0.78rem' }}>
                  {titleText && <div style={{ fontWeight: 600, marginBottom: 4, lineHeight: 1.3 }}>{titleText.slice(0, 120)}{titleText.length > 120 ? '…' : ''}</div>}
                  {bodyText && <div style={{ color: 'var(--fg-subtle)', lineHeight: 1.5 }}>{bodyText.slice(0, 200)}{bodyText.length > 200 ? '…' : ''}</div>}
                </div>
              )}

              {/* Status + format */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <span style={{
                  fontSize: '0.6875rem', fontWeight: 600,
                  color: ad.status === 'ACTIVE' ? 'var(--success)' : 'var(--fg-muted)',
                  background: ad.status === 'ACTIVE' ? 'var(--success-bg)' : 'var(--bg-hover)',
                  border: `1px solid ${ad.status === 'ACTIVE' ? 'var(--success-border)' : 'var(--border-base)'}`,
                  padding: '3px 8px', borderRadius: 20,
                }}>
                  {ad.status === 'ACTIVE' ? '● Ativo' : ad.status}
                </span>
                <FormatBadge format={ad.adFormat} />
              </div>

              {/* Score ring */}
              {score && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{
                    width: 64, height: 64, borderRadius: '50%', flexShrink: 0,
                    background: `conic-gradient(${overallColor} ${score.overall * 3.6}deg, var(--bg-hover) 0deg)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <div style={{
                      width: 46, height: 46, borderRadius: '50%', background: 'var(--bg-component)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1rem', fontWeight: 700, color: overallColor,
                    }}>
                      {score.overall}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: overallColor, marginBottom: 2 }}>Score Global</div>
                    {rec && <div style={{ fontSize: '0.75rem', color: rec.color, fontWeight: 600 }}>{rec.label}</div>}
                    {fatigue && <div style={{ fontSize: '0.72rem', color: 'var(--fg-muted)', marginTop: 2 }}>Fadiga: <span style={{ color: fatigue.color }}>{fatigue.label}</span></div>}
                  </div>
                </div>
              )}

              {/* Score bars */}
              {score && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {[
                    { label: 'Hook/CTR', score: score.hookScore, color: 'var(--accent-primary)' },
                    { label: 'Performance', score: score.performanceScore, color: 'var(--success)' },
                    { label: 'Copy', score: score.copyScore, color: 'var(--warning)' },
                  ].map((bar) => (
                    <div key={bar.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: '0.6875rem', color: 'var(--fg-muted)', width: 72, flexShrink: 0 }}>{bar.label}</span>
                      <ScoreBar score={bar.score} color={bar.color} />
                      <span style={{ fontSize: '0.6875rem', color: bar.color, width: 22, textAlign: 'right', flexShrink: 0 }}>{bar.score}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right: metrics + analysis */}
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* Metrics grid */}
              {ins && (
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--fg-muted)', marginBottom: 10 }}>MÉTRICAS</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                    {[
                      { label: 'CTR', value: `${ins.ctr.toFixed(2)}%` },
                      { label: 'CPC', value: fmtCur(ins.cpc, currency) },
                      { label: primaryMetric.label, value: primaryMetric.value },
                      { label: 'Gasto Total', value: fmtCur(ins.spend, currency) },
                      { label: 'CPM', value: fmtCur(ins.cpm, currency) },
                      { label: 'Impressões', value: ins.impressions?.toLocaleString('pt-BR') ?? 'N/A' },
                    ].map((m) => (
                      <div key={m.label} style={{ background: 'var(--bg-base)', borderRadius: 7, padding: '8px 10px' }}>
                        <div style={{ fontSize: '0.65rem', color: 'var(--fg-muted)', marginBottom: 3 }}>{m.label}</div>
                        <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{m.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendation */}
              {score && rec && (
                <div style={{ background: `${rec.color}10`, border: `1px solid ${rec.color}25`, borderRadius: 8, padding: '12px 14px' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: rec.color, marginBottom: 4 }}>{rec.label}</div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--fg-subtle)', lineHeight: 1.5 }}>{score.recommendationText}</div>
                </div>
              )}

              {/* Diagnosis */}
              {insights.length > 0 && (
                <div style={{ background: 'var(--bg-base)', border: '1px solid var(--border-base)', borderRadius: 8, padding: '12px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, fontSize: '0.75rem', fontWeight: 700, color: 'var(--fg-muted)' }}>
                    <Eye size={13} /> DIAGNÓSTICO
                  </div>
                  {insights.map((item, i) => (
                    <div key={i} style={{ fontSize: '0.8125rem', color: 'var(--fg-subtle)', marginBottom: 6, lineHeight: 1.5 }}>{item}</div>
                  ))}
                </div>
              )}

              {/* Improvements */}
              {improvements.length > 0 && (
                <div style={{ background: 'var(--warning-bg)', border: '1px solid var(--warning-border)', borderRadius: 8, padding: '12px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, fontSize: '0.75rem', fontWeight: 700, color: 'var(--warning)' }}>
                    <RefreshCw size={13} /> MELHORIAS
                  </div>
                  {improvements.map((imp, i) => (
                    <div key={i} style={{ fontSize: '0.8125rem', color: 'var(--fg-subtle)', marginBottom: 6, lineHeight: 1.5, display: 'flex', gap: 8 }}>
                      <span style={{ color: 'var(--warning)', flexShrink: 0 }}>→</span> {imp}
                    </div>
                  ))}
                </div>
              )}

              {/* Niche hooks */}
              {nicheHooks.length > 0 && (
                <div style={{ background: 'var(--accent-subtle)', border: '1px solid var(--accent-border)', borderRadius: 8, padding: '12px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-primary)' }}>
                    <Lightbulb size={13} /> HOOKS & ÂNGULOS — {(niche || 'SEU NICHO').toUpperCase()}
                  </div>
                  {nicheHooks.map((h, i) => (
                    <div key={i} style={{ fontSize: '0.8125rem', color: 'var(--fg-subtle)', marginBottom: 6, lineHeight: 1.5 }}>{h}</div>
                  ))}
                </div>
              )}

              {/* ── AI Vision Analysis ── */}
              {aiConfig && imageUrl && (
                <div style={{ border: '1px solid var(--border-base)', borderRadius: 8, overflow: 'hidden' }}>
                  {/* Header */}
                  <div style={{
                    padding: '10px 14px',
                    background: 'var(--bg-base)',
                    borderBottom: savedAnalysis ? '1px solid var(--border-base)' : 'none',
                    display: 'flex', alignItems: 'center', gap: 10,
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', fontWeight: 700, color: 'var(--fg-base)', marginBottom: savedAnalysis ? 2 : 0 }}>
                        <Sparkles size={13} color="var(--accent-primary)" /> ANÁLISE VISUAL COM IA
                      </div>
                      {savedAnalysis && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.7rem', color: 'var(--fg-muted)' }}>
                          <Clock size={10} />
                          {new Date(savedAnalysis.analyzedAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                          {' · '}{savedAnalysis.provider}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={handleAnalyze}
                      disabled={isAnalyzing}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '0 12px', height: 32, borderRadius: 6,
                        background: isAnalyzing ? 'var(--bg-hover)' : 'var(--accent-primary)',
                        border: 'none', color: 'white', fontSize: '0.8rem', fontWeight: 600,
                        cursor: isAnalyzing ? 'not-allowed' : 'pointer',
                        opacity: isAnalyzing ? 0.7 : 1,
                        flexShrink: 0,
                        transition: 'background 0.15s',
                      }}
                    >
                      {isAnalyzing
                        ? <><RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} /> Analisando...</>
                        : <><Sparkles size={13} /> {savedAnalysis ? 'Reanalisar' : 'Analisar Imagem'}</>
                      }
                    </button>
                  </div>

                  {/* Error */}
                  {analysisError && (
                    <div style={{ padding: '10px 14px', background: 'var(--danger-bg)', borderTop: '1px solid var(--danger-border)', fontSize: '0.8rem', color: 'var(--danger)', lineHeight: 1.5 }}>
                      {analysisError}
                    </div>
                  )}

                  {/* Saved analysis */}
                  {savedAnalysis && !isAnalyzing && (
                    <div style={{ padding: '14px 16px', background: 'var(--bg-subtle)' }}>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--fg-subtle)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                        {savedAnalysis.text.split('\n').map((line, i) => {
                          if (line.startsWith('## ')) {
                            return (
                              <div key={i} style={{ fontWeight: 700, color: 'var(--fg-base)', fontSize: '0.8125rem', marginTop: i > 0 ? 14 : 0, marginBottom: 4 }}>
                                {line.replace('## ', '')}
                              </div>
                            );
                          }
                          if (line.startsWith('- ') || line.startsWith('→ ')) {
                            return (
                              <div key={i} style={{ paddingLeft: 10, marginBottom: 3 }}>
                                <span style={{ color: 'var(--accent-primary)', marginRight: 6 }}>→</span>
                                {line.replace(/^[-→] /, '')}
                              </div>
                            );
                          }
                          if (line.trim() === '') return <div key={i} style={{ height: 4 }} />;
                          return <div key={i} style={{ marginBottom: 2 }}>{line}</div>;
                        })}
                      </div>
                    </div>
                  )}

                  {/* Empty state */}
                  {!savedAnalysis && !isAnalyzing && !analysisError && (
                    <div style={{ padding: '16px', textAlign: 'center', color: 'var(--fg-muted)', fontSize: '0.8rem' }}>
                      Clique em "Analisar Imagem" para gerar insights detalhados com IA sobre este criativo.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Gallery summary ────────────────────────────────────────────────────────
function GallerySummary({ ads, niche, mode }: { ads: Array<{ ad: Ad }>; niche?: string; mode?: CampaignMode }) {
  const toScale = ads.filter((a) => a.ad.creativeScore?.recommendation === 'SCALE').length;
  const toPause = ads.filter((a) => a.ad.creativeScore?.recommendation === 'PAUSE').length;
  const critFatigue = ads.filter((a) => a.ad.creativeScore?.fatigueLevel === 'CRITICAL').length;
  const avgScore = Math.round(ads.reduce((sum, a) => sum + (a.ad.creativeScore?.overall || 0), 0) / (ads.length || 1));
  const scoreColor = avgScore >= 65 ? 'var(--success)' : avgScore >= 45 ? 'var(--warning)' : 'var(--danger)';

  return (
    <div className="glass-panel" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
      {[
        { label: 'Score Médio', value: `${avgScore}/100`, color: scoreColor, icon: Target },
        { label: 'Para Escalar', value: toScale, color: toScale > 0 ? 'var(--success)' : 'var(--fg-muted)', icon: TrendingUp },
        { label: 'Pausar Agora', value: toPause, color: toPause > 0 ? 'var(--danger)' : 'var(--fg-muted)', icon: Pause },
        { label: 'Fadiga Crítica', value: critFatigue, color: critFatigue > 0 ? 'var(--danger)' : 'var(--fg-muted)', icon: AlertTriangle },
      ].map((s) => (
        <div key={s.label} style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: s.color }}>{s.value}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--fg-muted)', marginTop: 2 }}>{s.label}</div>
        </div>
      ))}
      {niche && (
        <div style={{ gridColumn: '1/-1', paddingTop: 12, borderTop: '1px solid var(--border-base)', fontSize: '0.8rem', color: 'var(--fg-subtle)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Target size={12} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
          Análise calibrada para <strong style={{ color: 'var(--fg-base)' }}>{niche}</strong>
          {mode && <> · modo <strong>{mode}</strong></>}
          {' '} · Clique em "Ver detalhes" em qualquer card para a análise completa.
        </div>
      )}
    </div>
  );
}

// ── Main export ────────────────────────────────────────────────────────────
export function CreativeGallery({ account, isLoading, campaignMode, clientProfile, aiConfig }: CreativeGalleryProps) {
  const [selectedItem, setSelectedItem] = useState<CardItem | null>(null);

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
        <div style={{ fontSize: 48, marginBottom: 16 }}>🖼️</div>
        <h3>Nenhum criativo carregado</h3>
        <p style={{ color: 'var(--fg-subtle)', marginBottom: 16 }}>
          Sincronize sua conta Meta Ads ou ative o Modo Demo.
        </p>
        {clientProfile?.niche && (
          <div style={{ display: 'inline-block', padding: '8px 16px', background: 'var(--accent-subtle)', border: '1px solid var(--accent-border)', borderRadius: 8, fontSize: '0.83rem', color: 'var(--accent-primary)' }}>
            🎯 Nicho configurado: <strong>{clientProfile.niche}</strong>
          </div>
        )}
      </div>
    );
  }

  // Collect all ads
  const allAds: Array<{ ad: Ad; campaignName: string; adsetName: string }> = [];
  for (const campaign of account.campaigns || []) {
    for (const adset of campaign.adsets || []) {
      for (const ad of adset.ads || []) {
        allAds.push({ ad, campaignName: campaign.name, adsetName: adset.name });
      }
    }
  }

  if (allAds.length === 0) {
    return (
      <div className="glass-panel" style={{ textAlign: 'center', padding: 60 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🖼️</div>
        <h3>Nenhum anúncio encontrado</h3>
        <p style={{ color: 'var(--fg-subtle)' }}>Não há anúncios nas campanhas carregadas.</p>
      </div>
    );
  }

  const sorted = [...allAds].sort((a, b) => (b.ad.creativeScore?.overall || 0) - (a.ad.creativeScore?.overall || 0));

  const toScale = sorted.filter((a) => a.ad.creativeScore?.recommendation === 'SCALE');
  const toPause = sorted.filter((a) => a.ad.creativeScore?.recommendation === 'PAUSE');
  const rest = sorted.filter((a) => !['SCALE', 'PAUSE'].includes(a.ad.creativeScore?.recommendation || ''));

  const niche = clientProfile?.niche;
  const product = clientProfile?.product;

  const makeItem = (entry: typeof sorted[0], rank: number): CardItem => ({
    ad: entry.ad,
    campaignName: entry.campaignName,
    adsetName: entry.adsetName,
    currency: account.currency,
    rank,
    niche,
    product,
    aiConfig,
    mode: campaignMode,
  });

  const renderGroup = (
    items: typeof sorted,
    startRank: number,
    label: string,
    color: string,
    icon: React.ReactNode,
  ) => {
    if (items.length === 0) return null;
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          {icon}
          <span style={{ fontSize: '0.875rem', fontWeight: 600, color }}>{label} ({items.length})</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
          {items.map((entry, i) => {
            const item = makeItem(entry, startRank + i);
            return (
              <CreativeCard key={entry.ad.id} item={item} onClick={() => setSelectedItem(item)} />
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
        <GallerySummary ads={sorted} niche={niche} mode={campaignMode} />

        {renderGroup(toScale, 1, '🚀 Prontos para Escalar', 'var(--success)',
          <TrendingUp size={16} color="var(--success)" />
        )}
        {renderGroup(rest, toScale.length + 1, '📊 Em Monitoramento', 'var(--fg-base)',
          <Eye size={16} color="var(--fg-subtle)" />
        )}
        {renderGroup(toPause, toScale.length + rest.length + 1, '⏸️ Pausar Imediatamente', 'var(--danger)',
          <Pause size={16} color="var(--danger)" />
        )}
      </div>

      {selectedItem && (
        <CreativeDetailModal item={selectedItem} onClose={() => setSelectedItem(null)} />
      )}
    </>
  );
}
