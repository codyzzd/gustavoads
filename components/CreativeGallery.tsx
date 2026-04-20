'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import type { Ad, AdAccount } from '@/lib/metaTypes';
import type { CampaignMode } from '@/lib/metaTypes';
import { getCreativeImageUrl, getCreativeBody, getCreativeTitle, getCreativeCaption } from '@/lib/metaTypes';
import {
  TrendingUp, Pause, RefreshCw, Eye, AlertTriangle,
  Target, Film, Image, Video, Layers, Zap, X,
  ChevronRight, Sparkles, Clock,
} from 'lucide-react';
import type { AIProviderConfig, CopyChangeSuggestion } from '@/lib/aiClient';
import { analyzeCreativeVision, analyzeCreativeCopy, generateCopyChangeSuggestions } from '@/lib/aiClient';

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
  selectedCreativeId?: string;
  renderDetailAsPage?: boolean;
  onBackFromDetail?: () => void;
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
    const body = getCreativeBody(creative);
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
  campaignId: string;
  campaignName: string;
  adsetName: string;
  currency: string;
  rank: number;
  niche?: string;
  mode?: CampaignMode;
  aiConfig?: AIProviderConfig;
}

interface SavedAnalysis {
  text: string;
  analyzedAt: string;
  provider: string;
}

interface SavedCopySuggestions {
  suggestions: CopyChangeSuggestion[];
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
        <div style={{ padding: '0 12px 8px', fontSize: '0.8rem', color: 'var(--fg-subtle)', lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {bodyText}
        </div>
      )}

      {/* ── Image (cover — consistent card height) ── */}
      <div style={{ position: 'relative', background: 'var(--bg-base)', height: 200, overflow: 'hidden', flexShrink: 0 }}>
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={ad.name}
            style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
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
            <div style={{ fontSize: '0.8125rem', fontWeight: 600, lineHeight: 1.3, whiteSpace: 'normal', wordBreak: 'break-word' }}>
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
      <div style={{ padding: '8px 12px 10px', display: 'grid', gap: 8 }}>
        {ins && (
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
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
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={onClick}
            style={{
              flexShrink: 0,
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
    </div>
  );
}

// ── Detail Modal ───────────────────────────────────────────────────────────
function CreativeDetailModal({ item, onClose }: { item: CardItem; onClose: () => void }) {
  const { ad, campaignName, adsetName, currency, rank, niche, mode, aiConfig } = item;
  const score = ad.creativeScore;
  const ins = ad.insightsSummary;
  const imageUrl = getCreativeImageUrl(ad.creative);
  const bodyText = getCreativeBody(ad.creative);
  const titleText = getCreativeTitle(ad.creative);
  const captionText = getCreativeCaption(ad.creative);
  const ctaType = ad.creative?.call_to_action_type;
  const ctaLabel = ctaType ? (CTA_LABELS[ctaType] ?? ctaType.replace(/_/g, ' ').toLowerCase()) : '';
  const rec = score ? (REC_MAP[score.recommendation as RecommendationType] || REC_MAP.KEEP) : null;
  const fatigue = score ? (FATIGUE_MAP[score.fatigueLevel] || FATIGUE_MAP.LOW) : null;
  const { insights, improvements } = getQualitativeAnalysis(ad, niche, mode);
  const hasCopy = Boolean(titleText?.trim() || bodyText?.trim());
  const metricsPayload = ins ? {
    ctr: ins.ctr,
    cpc: ins.cpc,
    spend: ins.spend,
    roas: ins.roas,
    cpl: ins.costPerLead,
    cpm: ins.cpm,
    impressions: ins.impressions,
    frequency: ins.frequency,
    costPerConversation: ins.costPerConversation,
    costPerLandingPageView: ins.costPerLandingPageView,
    messagesStarted: ins.messagesStarted,
    linkClicks: ins.linkClicks,
  } : undefined;

  // ── AI Vision Analysis ──
  const visionStorageKey = `creative_ai_${ad.id}`;
  const copyStorageKey = `creative_copy_ai_${ad.id}`;
  const copySuggestionsStorageKey = `creative_copy_suggestions_ai_${ad.id}`;
  const [savedAnalysis, setSavedAnalysis] = useState<SavedAnalysis | null>(null);
  const [savedCopyAnalysis, setSavedCopyAnalysis] = useState<SavedAnalysis | null>(null);
  const [savedCopySuggestions, setSavedCopySuggestions] = useState<SavedCopySuggestions | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAnalyzingCopy, setIsAnalyzingCopy] = useState(false);
  const [isGeneratingCopySuggestions, setIsGeneratingCopySuggestions] = useState(false);
  const [isCopySuggestionsModalOpen, setIsCopySuggestionsModalOpen] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [copyAnalysisError, setCopyAnalysisError] = useState<string | null>(null);
  const [copySuggestionsError, setCopySuggestionsError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const visionRaw = localStorage.getItem(visionStorageKey);
      if (visionRaw) setSavedAnalysis(JSON.parse(visionRaw));
      const copyRaw = localStorage.getItem(copyStorageKey);
      if (copyRaw) setSavedCopyAnalysis(JSON.parse(copyRaw));
      const suggestionsRaw = localStorage.getItem(copySuggestionsStorageKey);
      if (suggestionsRaw) setSavedCopySuggestions(JSON.parse(suggestionsRaw));
    } catch { /* ignore */ }
  }, [visionStorageKey, copyStorageKey, copySuggestionsStorageKey]);

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
        titleText,
        bodyText,
        captionText,
        ctaLabel,
        metrics: metricsPayload,
        niche,
        currency,
      });
      const result: SavedAnalysis = {
        text,
        analyzedAt: new Date().toISOString(),
        provider: aiConfig.provider,
      };
      setSavedAnalysis(result);
      localStorage.setItem(visionStorageKey, JSON.stringify(result));
    } catch (e) {
      setAnalysisError((e as Error).message || 'Erro ao analisar.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAnalyzeCopy = async () => {
    if (!aiConfig || !hasCopy) return;
    setIsAnalyzingCopy(true);
    setCopyAnalysisError(null);
    try {
      const text = await analyzeCreativeCopy(aiConfig, {
        adName: ad.name,
        campaignName,
        adFormat: ad.adFormat,
        titleText,
        bodyText,
        ctaLabel,
        metrics: metricsPayload,
        niche,
        currency,
      });
      const result: SavedAnalysis = {
        text,
        analyzedAt: new Date().toISOString(),
        provider: aiConfig.provider,
      };
      setSavedCopyAnalysis(result);
      localStorage.setItem(copyStorageKey, JSON.stringify(result));
    } catch (e) {
      setCopyAnalysisError((e as Error).message || 'Erro ao analisar copy.');
    } finally {
      setIsAnalyzingCopy(false);
    }
  };

  const handleGenerateCopySuggestions = async ({ forceRegenerate = false }: { forceRegenerate?: boolean } = {}) => {
    if (!aiConfig || !hasCopy) return;

    if (!forceRegenerate && savedCopySuggestions?.suggestions?.length) {
      setIsCopySuggestionsModalOpen(true);
      return;
    }

    setIsGeneratingCopySuggestions(true);
    setCopySuggestionsError(null);
    try {
      const suggestions = await generateCopyChangeSuggestions(aiConfig, {
        adName: ad.name,
        campaignName,
        adFormat: ad.adFormat,
        titleText,
        bodyText,
        ctaLabel,
        metrics: metricsPayload,
        niche,
        currency,
      });

      const result: SavedCopySuggestions = {
        suggestions,
        analyzedAt: new Date().toISOString(),
        provider: aiConfig.provider,
      };
      setSavedCopySuggestions(result);
      localStorage.setItem(copySuggestionsStorageKey, JSON.stringify(result));
      setIsCopySuggestionsModalOpen(true);
    } catch (e) {
      setCopySuggestionsError((e as Error).message || 'Erro ao gerar mudanças possíveis de copy.');
    } finally {
      setIsGeneratingCopySuggestions(false);
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

  const renderAnalysisText = (text: string) => (
    <div style={{ fontSize: '0.8125rem', color: 'var(--fg-subtle)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
      {text.split('\n').map((line, i) => {
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
  );

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
                  {titleText && <div style={{ fontWeight: 600, marginBottom: 4, lineHeight: 1.3, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{titleText}</div>}
                  {bodyText && <div style={{ color: 'var(--fg-subtle)', lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{bodyText}</div>}
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
                    <div style={{ padding: '10px 14px', background: 'var(--danger-bg)', borderTop: '1px solid var(--danger-border)', fontSize: '0.8rem', color: 'var(--danger)', lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      {analysisError}
                    </div>
                  )}

                  {/* Saved analysis */}
                  {savedAnalysis && !isAnalyzing && (
                    <div style={{ padding: '14px 16px', background: 'var(--bg-subtle)' }}>
                      {renderAnalysisText(savedAnalysis.text)}
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

              {/* ── AI Copy Analysis ── */}
              {aiConfig && (
                <div style={{ border: '1px solid var(--border-base)', borderRadius: 8, overflow: 'hidden' }}>
                  {/* Header */}
                  <div style={{
                    padding: '10px 14px',
                    background: 'var(--bg-base)',
                    borderBottom: savedCopyAnalysis ? '1px solid var(--border-base)' : 'none',
                    display: 'flex', alignItems: 'center', gap: 10,
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', fontWeight: 700, color: 'var(--fg-base)', marginBottom: savedCopyAnalysis ? 2 : 0 }}>
                        <Sparkles size={13} color="var(--accent-primary)" /> ANÁLISE DE COPY COM IA
                      </div>
                      {savedCopyAnalysis && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.7rem', color: 'var(--fg-muted)' }}>
                          <Clock size={10} />
                          {new Date(savedCopyAnalysis.analyzedAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                          {' · '}{savedCopyAnalysis.provider}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                      <button
                        onClick={handleAnalyzeCopy}
                        disabled={isAnalyzingCopy || !hasCopy}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 6,
                          padding: '0 12px', height: 32, borderRadius: 6,
                          background: isAnalyzingCopy || !hasCopy ? 'var(--bg-hover)' : 'var(--accent-primary)',
                          border: 'none', color: 'white', fontSize: '0.8rem', fontWeight: 600,
                          cursor: isAnalyzingCopy || !hasCopy ? 'not-allowed' : 'pointer',
                          opacity: isAnalyzingCopy || !hasCopy ? 0.7 : 1,
                          transition: 'background 0.15s',
                        }}
                      >
                        {isAnalyzingCopy
                          ? <><RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} /> Analisando...</>
                          : <><Sparkles size={13} /> {savedCopyAnalysis ? 'Reanalisar Copy' : 'Analisar Copy'}</>
                        }
                      </button>
                      <button
                        onClick={() => handleGenerateCopySuggestions()}
                        disabled={isGeneratingCopySuggestions || !hasCopy}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '0 12px',
                          height: 32,
                          borderRadius: 6,
                          background: 'transparent',
                          border: '1px solid var(--border-base)',
                          color: isGeneratingCopySuggestions || !hasCopy ? 'var(--fg-muted)' : 'var(--fg-base)',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          cursor: isGeneratingCopySuggestions || !hasCopy ? 'not-allowed' : 'pointer',
                          opacity: isGeneratingCopySuggestions || !hasCopy ? 0.7 : 1,
                        }}
                      >
                        {isGeneratingCopySuggestions
                          ? <><RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} /> Gerando...</>
                          : <><Sparkles size={13} /> Mudanças Possíveis</>
                        }
                      </button>
                    </div>
                  </div>

                  {/* Error */}
                  {copyAnalysisError && (
                    <div style={{ padding: '10px 14px', background: 'var(--danger-bg)', borderTop: '1px solid var(--danger-border)', fontSize: '0.8rem', color: 'var(--danger)', lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      {copyAnalysisError}
                    </div>
                  )}
                  {copySuggestionsError && (
                    <div style={{ padding: '10px 14px', background: 'var(--danger-bg)', borderTop: '1px solid var(--danger-border)', fontSize: '0.8rem', color: 'var(--danger)', lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      {copySuggestionsError}
                    </div>
                  )}

                  {/* Saved analysis */}
                  {savedCopyAnalysis && !isAnalyzingCopy && (
                    <div style={{ padding: '14px 16px', background: 'var(--bg-subtle)' }}>
                      {renderAnalysisText(savedCopyAnalysis.text)}
                    </div>
                  )}

                  {/* Empty state */}
                  {!savedCopyAnalysis && !isAnalyzingCopy && !copyAnalysisError && (
                    <div style={{ padding: '16px', textAlign: 'center', color: 'var(--fg-muted)', fontSize: '0.8rem' }}>
                      {hasCopy
                        ? 'Clique em "Analisar Copy" para gerar uma avaliação textual detalhada deste anúncio.'
                        : 'Sem copy disponível neste anúncio para análise automática.'
                      }
                    </div>
                  )}
                  {savedCopySuggestions && !isGeneratingCopySuggestions && (
                    <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border-base)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, background: 'var(--bg-subtle)' }}>
                      <div style={{ fontSize: '0.74rem', color: 'var(--fg-muted)' }}>
                        {savedCopySuggestions.suggestions.length} mudanças possíveis salvas · {new Date(savedCopySuggestions.analyzedAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                      </div>
                      <button
                        onClick={() => setIsCopySuggestionsModalOpen(true)}
                        style={{
                          border: '1px solid var(--border-base)',
                          background: 'var(--bg-component)',
                          color: 'var(--fg-base)',
                          borderRadius: 6,
                          height: 30,
                          padding: '0 10px',
                          fontSize: '0.74rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        Ver mudanças
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {isCopySuggestionsModalOpen && savedCopySuggestions && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 260,
            background: 'rgba(8,10,15,0.82)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px 14px',
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setIsCopySuggestionsModalOpen(false); }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 900,
              maxHeight: '90vh',
              overflow: 'hidden',
              background: 'var(--bg-component)',
              border: '1px solid var(--border-base)',
              borderRadius: 'var(--radius-lg)',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 30px 70px rgba(0,0,0,0.5)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', borderBottom: '1px solid var(--border-base)' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--fg-base)' }}>Mudanças Possíveis de Copy</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--fg-muted)', marginTop: 3 }}>
                  {savedCopySuggestions.suggestions.length} variações geradas com {savedCopySuggestions.provider} · {new Date(savedCopySuggestions.analyzedAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                </div>
              </div>
              <button
                onClick={() => handleGenerateCopySuggestions({ forceRegenerate: true })}
                disabled={isGeneratingCopySuggestions}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  border: '1px solid var(--border-base)',
                  background: 'transparent',
                  color: 'var(--fg-base)',
                  borderRadius: 6,
                  height: 32,
                  padding: '0 10px',
                  fontSize: '0.74rem',
                  fontWeight: 600,
                  cursor: isGeneratingCopySuggestions ? 'not-allowed' : 'pointer',
                  opacity: isGeneratingCopySuggestions ? 0.7 : 1,
                }}
              >
                {isGeneratingCopySuggestions
                  ? <><RefreshCw size={12} style={{ animation: 'spin 1s linear infinite' }} /> Gerando...</>
                  : <><RefreshCw size={12} /> Gerar novamente</>
                }
              </button>
              <button
                onClick={() => setIsCopySuggestionsModalOpen(false)}
                style={{ background: 'transparent', border: 'none', padding: 6, cursor: 'pointer', color: 'var(--fg-muted)', borderRadius: 6 }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ overflowY: 'auto', padding: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 12 }}>
                {savedCopySuggestions.suggestions.map((suggestion, index) => (
                  <div key={`${suggestion.headline}-${index}`} style={{ border: '1px solid var(--border-base)', background: 'var(--bg-subtle)', borderRadius: 10, padding: '12px 12px 10px' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.65rem', color: 'var(--accent-primary)', fontWeight: 700, marginBottom: 8 }}>
                      <Sparkles size={11} /> Variação {index + 1}
                    </div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--fg-base)', marginBottom: 6, lineHeight: 1.35 }}>
                      {suggestion.headline}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--fg-subtle)', lineHeight: 1.55, whiteSpace: 'pre-wrap', marginBottom: 10 }}>
                      {suggestion.copy}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--fg-muted)', marginBottom: 4 }}>CTA sugerido</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--fg-base)', fontWeight: 600, marginBottom: 8 }}>
                      {suggestion.cta}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--fg-muted)', marginBottom: 4 }}>Por que essa copy</div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--fg-subtle)', lineHeight: 1.45 }}>
                      {suggestion.reason}
                    </div>
                    {suggestion.expectedImpact && (
                      <>
                        <div style={{ fontSize: '0.7rem', color: 'var(--fg-muted)', marginTop: 8, marginBottom: 4 }}>Impacto esperado</div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--accent-primary)', lineHeight: 1.4 }}>
                          {suggestion.expectedImpact}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
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
  const makeItem = (entry: typeof sorted[0], rank: number): CardItem => ({
    ad: entry.ad,
    campaignName: entry.campaignName,
    adsetName: entry.adsetName,
    currency: account.currency,
    rank,
    niche,
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
