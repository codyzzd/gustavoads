'use client';

import { useState } from 'react';
import type { Ad, AdAccount } from '@/lib/metaTypes';
import type { CampaignMode } from '@/lib/metaTypes';
import { getCreativeImageUrl, getCreativeBody, getCreativeTitle } from '@/lib/metaTypes';
import {
  TrendingUp, Pause, RefreshCw, Zap, Eye, MousePointer,
  AlertTriangle, ChevronDown, ChevronUp, Lightbulb, Target, Film, Type, Image, Video, Layers,
} from 'lucide-react';

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
}

function fmtCur(v: number, cur = 'BRL') {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: cur }).format(v);
}

type RecommendationType = 'SCALE' | 'KEEP' | 'TEST_VARIATION' | 'PAUSE';

const REC_MAP: Record<RecommendationType, { label: string; color: string; icon: React.ElementType }> = {
  SCALE:         { label: '📈 Escalar',        color: 'var(--success)',         icon: TrendingUp },
  KEEP:          { label: '✅ Manter',          color: 'var(--accent-primary)',  icon: Eye },
  TEST_VARIATION:{ label: '🔄 Testar Variação', color: 'var(--warning)',         icon: RefreshCw },
  PAUSE:         { label: '⏸️ Pausar',          color: 'var(--danger)',          icon: Pause },
};

const FATIGUE_MAP = {
  LOW:      { label: 'Baixa',     color: 'var(--success)' },
  MEDIUM:   { label: 'Moderada',  color: 'var(--warning)' },
  HIGH:     { label: 'Alta',      color: 'var(--danger)' },
  CRITICAL: { label: '🔴 CRÍTICA', color: 'var(--danger)' },
};

// ── Niche-aware creative suggestions ───────────────────────────────────────
function getNicheHooks(niche?: string, product?: string): string[] {
  const n = (niche || '').toLowerCase();
  const p = (product || '').toLowerCase();

  if (n.includes('consórc') || p.includes('consórc')) {
    return [
      '💡 Hook: "Você sabia que a cada 15 anos de aluguel, você perde R$180 mil que nunca voltam?"',
      '💡 Hook: "Quem tem consórcio paga parcela de imóvel SEM pagar juros de banco"',
      '💡 Hook: "Como esse [profissão] comprou o apartamento dele em 18 meses — sem entrada e sem financiamento"',
      '💡 Ângulo: Mostre uma simulação visual comparando consórcio x aluguel x financiamento bancário',
      '💡 CTA: "Simular meu consórcio agora" (evite "Saiba mais" — muito genérico)',
    ];
  }
  if (n.includes('imóvel') || n.includes('imobili') || p.includes('imóvel')) {
    return [
      '💡 Hook: "Renda de R$3.000/mês pode ser suficiente para sair do aluguel — veja como"',
      '💡 Hook: Mostre o imóvel pronto, câmera lenta, por dentro — desperte o sonho',
      '💡 Ângulo: "Qual bairro cabe no seu orçamento?" — ferramenta de quiz no formulário',
      '💡 CTA: "Ver imóveis disponíveis" com foto + preço visível no anúncio',
    ];
  }
  if (n.includes('estétic') || n.includes('clínic') || n.includes('saúde') || p.includes('estétic')) {
    return [
      '💡 Hook: Antes/Depois real (respeitando diretrizes Meta — foco no sorriso, não no procedimento)',
      '💡 Hook: "Você merece se sentir bem — e sem longa lista de espera"',
      '💡 Ângulo: Mostre o ambiente da clínica, a equipe, o processo — gera confiança',
      '💡 CTA: "Agendar avaliação gratuita" — reduz barreira de entrada',
      '📌 2026: Use Reels 9:16 mostrando a experiência do cliente, não o resultado clínico',
    ];
  }
  if (n.includes('educação') || n.includes('curso') || n.includes('infoprod') || p.includes('curso')) {
    return [
      '💡 Hook: "Em 4 semanas, aprendi o que 4 anos de faculdade não me ensinou"',
      '💡 Ângulo: Mostre o resultado do aluno (renda, aprovação, mudança de vida)',
      '💡 Formato: VSL de 60-90s funciona melhor que estático para infoprodutos',
      '💡 CTA: "Garantir minha vaga" ou "Acessar aula grátis" — urgência real',
    ];
  }
  if (n.includes('saas') || n.includes('software') || n.includes('b2b') || p.includes('sistema')) {
    return [
      '💡 Hook: "A maioria das empresas ainda faz isso no papel — e perde X horas por semana"',
      '💡 Ângulo: Demo do produto em 30s mostrando o principal benefício (não a feature)',
      '💡 CTA: "Testar grátis por 14 dias" — eliminação de risco é o gatilho',
      '💡 Público: Decision makers (diretores, gerentes) — use comportamento "Administradores de página"',
    ];
  }
  if (n.includes('e-com') || n.includes('loja') || p.includes('produto')) {
    return [
      '💡 Hook UGC: Pessoa real usando o produto mostrando o resultado em 3s',
      '💡 Hook: Pergunta de dor + produto como solução imediata',
      '💡 Ângulo: "10.847 clientes já compraram" — prova social com número específico',
      '💡 CTA: "Comprar com frete grátis hoje" — oferta com deadline claro',
      '💡 2026: Ative Advantage+ Creative para gerar variações automáticas do estático',
    ];
  }
  // Generic
  return [
    '💡 Hook: Pare o scroll nos primeiros 2s — use dado surpreendente, pergunta ou transformação visual',
    '💡 Ângulo: Dor específica → solução do produto → prova social → CTA com benefício',
    '💡 O criativo MORE que funciona: UGC ou depoimento real, câmera na mão, iluminação natural',
    '💡 2026: Otimize para o "watch" (retenção de vídeo), não apenas para o "click"',
  ];
}

function getQualitativeAnalysis(
  ad: Ad,
  niche?: string,
  mode?: CampaignMode,
): { insights: string[]; improvements: string[]; newCreativeSuggestion?: string } {
  const ins = ad.insightsSummary;
  const sc = ad.creativeScore;
  const creative = ad.creative;
  const insights: string[] = [];
  const improvements: string[] = [];
  let newCreativeSuggestion: string | undefined;

  if (!ins || !sc) return { insights: ['Sem dados suficientes para análise qualitativa.'], improvements: [] };

  // Hook analysis
  if (ins.ctr < 0.5) {
    insights.push('🔴 CTR crítico (<0.5%): o gancho visual/textual não está parando o scroll.');
    improvements.push('Troque os primeiros 2 segundos do vídeo ou o headline da imagem — teste gancho de dor, número chocante ou identidade.');
  } else if (ins.ctr < 1.0) {
    insights.push('⚠️ CTR abaixo do benchmark (1%). O gancho precisa de mais força para o público atual.');
    improvements.push('Teste 2-3 novos hooks mantendo o mesmo corpo de copy e a mesma oferta — o problema provavelmente está no gancho, não na oferta.');
  } else if (ins.ctr >= 2.0) {
    insights.push(`✅ CTR excelente (${ins.ctr.toFixed(2)}%) — o gancho está funcionando muito bem.`);
  }

  // Fatigue
  if (sc.fatigueLevel === 'CRITICAL') {
    insights.push(`🔴 Frequência crítica: o público já viu este anúncio muitas vezes e parou de reagir.`);
    improvements.push('Pause imediatamente e substitua por novo criativo — reutilize o ângulo/oferta com visual completamente diferente.');
    newCreativeSuggestion = generateNewCreativeSuggestion(ad, niche, mode);
  } else if (sc.fatigueLevel === 'HIGH') {
    insights.push('⚠️ Alta fadiga: prepare novos criativos agora (não espere os números piorarem mais).');
    improvements.push('Crie 2-3 variações do gancho mantendo o mesmo corpo e oferta. Priorize formatos Reels 9:16 que tendem a ter menor CPM.');
  }

  // Performance analysis by mode
  if (mode === 'ecommerce' || !mode) {
    if (ins.roas > 0 && ins.roas < 1.5) {
      insights.push(`🔴 ROAS ${ins.roas.toFixed(2)}x: campanha gerando prejuízo. Produto ou oferta não alinha com o público.`);
      improvements.push('Revise o público — pode estar atingindo pessoas sem capacidade/interesse de compra. Teste Advantage+ Audience no lugar de interesses.');
      improvements.push('Verifique se o preço do produto está claro no criativo — CTR alto + conversão baixa = problema de expectativa de preço.');
    } else if (ins.roas >= 4) {
      insights.push(`✅ ROAS ${ins.roas.toFixed(2)}x: excelente. Este criativo está gerando receita significativa.`);
      improvements.push('Escale +20-30% do orçamento agora e duplique em nova CBO para preservar o aprendizado atual.');
    }
  } else if (mode === 'whatsapp') {
    if (ins.costPerConversation > 60) {
      insights.push(`🔴 Custo/conversa R$ ${ins.costPerConversation.toFixed(2)}: acima do benchmark para WhatsApp.`);
      improvements.push('Adicione mais urgência e especificidade ao CTA — "Falar com especialista AGORA" converte mais que "Saiba mais".');
      improvements.push('Verifique se o anúncio deixa claro que a conversa será no WhatsApp — definir expectativa aumenta cliques qualificados.');
    } else if (ins.costPerConversation > 0 && ins.costPerConversation < 20) {
      insights.push(`✅ Custo/conversa R$ ${ins.costPerConversation.toFixed(2)}: ótimo para WhatsApp. Escale.`);
    }
  } else if (mode === 'leads') {
    if (ins.costPerLead > 60) {
      insights.push(`🔴 CPL R$ ${ins.costPerLead.toFixed(2)}: caro para geração de leads.`);
      improvements.push('Adicione um qualificador no hook que atraia o lead certo — um lead qualificado a R$80 vale mais que 5 genéricos a R$15.');
      improvements.push('Revise o formulário: mais de 3 campos = queda brusca na conversão. Use Instant Form com Maior Intenção (não Volume).');
    }
  }

  // Copy analysis (2026 rules)
  if (creative) {
    const body = creative.body || '';
    const title = creative.title || '';
    if (body.length < 50) {
      insights.push('⚠️ Copy muito curta: não aproveita o espaço para qualificar o lead ou apresentar benefícios.');
      improvements.push('Adicione 1-2 linhas com o benefício principal + prova social antes do CTA.');
    }
    if (!body.includes('?') && !body.includes('!')) {
      improvements.push('Adicione emoção ao copy: perguntas engajam o leitor, exclamações criam urgência — use com moderação.');
    }
    if (title && title.length < 10) {
      improvements.push('O headline/título está muito curto. Inclua o principal benefício em ≤6 palavras.');
    }
  }

  // 2026 specific: creative diversity
  if (ins.impressions > 50000 && improvements.length > 0) {
    improvements.push('📌 Regra 2026: Com alto volume de impressões, implemente biblioteca de criativos (15-50 variações distintas) para evitar fadiga de algoritmo.');
  }

  // Vertical format hint
  if (ins.cpm > 25) {
    improvements.push('📌 2026: Teste formato Reels 9:16 vertical — CPM 30-50% menor que Feed horizontal. Essencial com CPM elevado.');
  }

  return { insights, improvements, newCreativeSuggestion };
}

function generateNewCreativeSuggestion(ad: Ad, niche?: string, mode?: CampaignMode): string {
  const n = (niche || '').toLowerCase();
  const ins = ad.insightsSummary;
  const modeLabel = mode === 'whatsapp' ? 'conversa no WhatsApp' : mode === 'leads' ? 'geração de leads' : 'compra';

  if (n.includes('consórc')) {
    return `🎬 SUGESTÃO DE CRIATIVO NOVO (substituto para ${ad.name}):

**Formato:** Reels 9:16 — 30 a 45 segundos
**Hook (0-3s):** Texto na tela: "O aluguel te custou R$${ins ? Math.round(ins.spend * 12 / (ins.impressions / 1000)).toLocaleString('pt-BR') : '___'} nos últimos 12 meses. E nenhum centavo voltou."
**Corpo (3-20s):** Pessoa real (não ator) explicando como descobriu o consórcio — câmera na mão, ambiente real.
**Prova (20-35s):** Depoimento rápido de cliente que foi contemplado + dado: "aprovação em 24h, sem entrada".
**CTA (35-45s):** "Clique e simule o seu agora — sem compromisso" com link para formulário com ≤3 campos.
**Copy do anúncio:** "Você sabia que pagar aluguel é diferente de investir? [Nome do produto] sem juros, sem entrada. Simule agora 👇"`;
  }
  if (n.includes('estétic') || n.includes('clínic')) {
    return `🎬 SUGESTÃO DE CRIATIVO NOVO (substituto para ${ad.name}):

**Formato:** Reels 9:16 — 20 a 30 segundos
**Hook (0-2s):** Close no rosto sorrindo + texto: "Agendei. Fiz. Adorei." — sem explicação, deixa a curiosidade trabalhar.
**Corpo (2-15s):** Tour rápido pela clínica + equipe sorrindo + procedimento sendo realizado (visão externa, não clínica).
**Social proof (15-25s):** "Mais de [X] pacientes atendidas" + estrelas de avaliação.
**CTA:** "Toque para agendar sua avaliação gratuita →"
**Observação:** Evite imagens de before/after explícitas — violam diretrizes Meta 2026. Foque na experiência.`;
  }
  return `🎬 SUGESTÃO DE CRIATIVO NOVO (substituto para ${ad.name}):

**Formato:** Reels 9:16 – 20 a 40 segundos
**Hook (0-3s):** Pergunta ou dado chocante relacionado à dor principal do público. Texto na tela grande, cor contrastante.
**Corpo (3-20s):** Demonstração rápida do produto/serviço em uso real. Câmera natural, não estúdio.
**Prova (20-30s):** Número específico de clientes, avaliação em estrelas ou depoimento de 10 segundos.
**CTA (30-40s):** Ação específica para ${modeLabel}. Evite "Saiba mais" — use verbos de ação diretos.
**Copy:** 1ª linha = gancho de dor. 2ª linha = solução + diferencial. 3ª linha = CTA urgência.`;
}

// ── Score bar ──────────────────────────────────────────────────────────────
function ScoreBar({ score, color }: { score: number; color: string }) {
  return (
    <div style={{ background: 'var(--bg-primary)', borderRadius: 4, height: 6, overflow: 'hidden', flex: 1 }}>
      <div
        style={{
          height: '100%', borderRadius: 4,
          width: `${score}%`,
          background: `linear-gradient(90deg, ${color}88, ${color})`,
          transition: 'width 0.8s ease',
        }}
      />
    </div>
  );
}

// ── Creative Card ──────────────────────────────────────────────────────────
function CreativeCard({
  ad,
  currency,
  rank,
  campaignName,
  adsetName,
  niche,
  product,
  mode,
}: {
  ad: Ad;
  currency: string;
  rank: number;
  campaignName: string;
  adsetName: string;
  niche?: string;
  product?: string;
  mode?: CampaignMode;
}) {
  const [expanded, setExpanded] = useState(false);
  const score = ad.creativeScore;
  const ins = ad.insightsSummary;
  if (!score) return null;

  const rec = REC_MAP[score.recommendation as RecommendationType] || REC_MAP.KEEP;
  const fatigue = FATIGUE_MAP[score.fatigueLevel] || FATIGUE_MAP.LOW;
  const creative = ad.creative;

  // Resolve image URL from any creative source
  const imageUrl = getCreativeImageUrl(creative);
  const bodyText = getCreativeBody(creative);
  const titleText = getCreativeTitle(creative);

  const overallColor =
    score.overall >= 75 ? 'var(--success)' :
    score.overall >= 50 ? 'var(--warning)' :
    'var(--danger)';

  const { insights, improvements, newCreativeSuggestion } = getQualitativeAnalysis(ad, niche, mode);
  const nicheHooks = getNicheHooks(niche, product);

  // Primary metric by mode
  let primaryMetric = { label: 'ROAS', value: ins?.roas ? `${ins.roas.toFixed(2)}x` : 'N/A' };
  if (mode === 'whatsapp') primaryMetric = { label: 'Custo/Conv.', value: ins?.costPerConversation ? fmtCur(ins.costPerConversation, currency) : 'N/A' };
  if (mode === 'leads') primaryMetric = { label: 'CPL', value: ins?.costPerLead ? fmtCur(ins.costPerLead, currency) : 'N/A' };
  if (mode === 'traffic') primaryMetric = { label: 'Custo/LPV', value: ins?.costPerLandingPageView ? fmtCur(ins.costPerLandingPageView, currency) : 'N/A' };
  if (mode === 'awareness') primaryMetric = { label: 'CPM', value: ins?.cpm ? fmtCur(ins.cpm, currency) : 'N/A' };

  return (
    <div
      className="creative-card glass-panel"
      style={{
        position: 'relative',
        border: score.recommendation === 'PAUSE'
          ? '1px solid var(--danger-border)'
          : score.recommendation === 'SCALE'
          ? '1px solid var(--success-border)'
          : undefined,
        padding: 0,
        overflow: 'hidden',
      }}
    >
      {/* ── Top row: image + main info ── */}
      <div style={{ display: 'flex', gap: 0 }}>

        {/* Thumbnail */}
        <div style={{ width: 200, flexShrink: 0, position: 'relative', background: 'var(--bg-tertiary)', minHeight: 160 }}>
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={ad.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', minHeight: 160 }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          ) : (
            <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 4 }}>
              <Image size={24} color="var(--text-muted)" />
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Sem prévia</span>
            </div>
          )}
          {ad.adFormat === 'VIDEO' && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.3)' }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Video size={18} color="#000" />
              </div>
            </div>
          )}
          {/* Rank + format badges */}
          <div style={{ position: 'absolute', top: 8, left: 8, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            <span style={{ background: 'rgba(0,0,0,0.7)', color: '#fff', fontSize: '0.65rem', fontWeight: 700, padding: '2px 6px', borderRadius: 4 }}>#{rank}</span>
            {ad.adFormat && ad.adFormat !== 'UNKNOWN' && (
              <span style={{ background: 'rgba(0,0,0,0.7)', color: '#fff', fontSize: '0.62rem', fontWeight: 600, padding: '2px 6px', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 3 }}>
                {ad.adFormat === 'VIDEO' && <><Film size={9} />VID</>}
                {ad.adFormat === 'IMAGE' && <><Image size={9} />IMG</>}
                {ad.adFormat === 'CAROUSEL' && <><Layers size={9} />CAR</>}
                {ad.adFormat === 'DYNAMIC' && <><Zap size={9} />DIN</>}
              </span>
            )}
          </div>
        </div>

        {/* Main content */}
        <div style={{ flex: 1, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0 }}>

          {/* Header row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', lineHeight: 1.3, marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ad.name}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{campaignName} · {adsetName}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
              <span style={{
                fontSize: '0.7rem', fontWeight: 600,
                color: ad.status === 'ACTIVE' ? 'var(--success)' : 'var(--text-muted)',
                background: ad.status === 'ACTIVE' ? 'var(--success-bg)' : 'rgba(98,103,133,0.15)',
                padding: '3px 8px', borderRadius: 20, border: ad.status === 'ACTIVE' ? '1px solid var(--success-border)' : 'none',
              }}>
                {ad.status === 'ACTIVE' ? '● Ativo' : ad.status}
              </span>
              {/* Score ring */}
              <div style={{
                width: 52, height: 52, borderRadius: '50%', flexShrink: 0,
                background: `conic-gradient(${overallColor} ${score.overall * 3.6}deg, var(--bg-tertiary) 0deg)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <div style={{
                  width: 38, height: 38, borderRadius: '50%',
                  background: 'var(--bg-secondary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.85rem', fontWeight: 700, color: overallColor,
                }}>
                  {score.overall}
                </div>
              </div>
            </div>
          </div>

          {/* Copy preview */}
          {(titleText || bodyText) && (
            <div style={{ background: 'var(--bg-primary)', borderRadius: 7, padding: '7px 10px', fontSize: '0.78rem', flexShrink: 0 }}>
              {titleText && <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2, lineHeight: 1.3 }}>{titleText.slice(0, 100)}{titleText.length > 100 ? '…' : ''}</div>}
              {bodyText && <div style={{ color: 'var(--text-muted)', lineHeight: 1.4 }}>{bodyText.slice(0, 140)}{bodyText.length > 140 ? '…' : ''}</div>}
            </div>
          )}

          {/* Metrics + score bars side by side */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {/* Metrics */}
            {ins && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                {[
                  { label: 'CTR', value: `${ins.ctr.toFixed(2)}%` },
                  { label: 'CPC', value: fmtCur(ins.cpc, currency) },
                  { label: primaryMetric.label, value: primaryMetric.value },
                  { label: 'Gasto', value: fmtCur(ins.spend, currency) },
                ].map((m) => (
                  <div key={m.label} style={{ background: 'var(--bg-primary)', borderRadius: 7, padding: '6px 10px' }}>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: 2 }}>{m.label}</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{m.value}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Score bars + fatigue */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                { label: 'Hook/CTR', score: score.hookScore, color: 'var(--accent-primary)' },
                { label: 'Perf.', score: score.performanceScore, color: 'var(--accent-secondary)' },
                { label: 'Copy', score: score.copyScore, color: 'var(--warning)' },
              ].map((bar) => (
                <div key={bar.label} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', width: 56, flexShrink: 0 }}>{bar.label}</span>
                  <ScoreBar score={bar.score} color={bar.color} />
                  <span style={{ fontSize: '0.68rem', color: bar.color, width: 22, textAlign: 'right', flexShrink: 0 }}>{bar.score}</span>
                </div>
              ))}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', width: 56, flexShrink: 0 }}>Fadiga</span>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: fatigue.color }}>{fatigue.label}</span>
              </div>
            </div>
          </div>

          {/* Recommendation + expand button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              flex: 1,
              background: `${rec.color}15`, border: `1px solid ${rec.color}30`,
              borderRadius: 7, padding: '7px 12px',
              display: 'flex', alignItems: 'flex-start', gap: 8,
            }}>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: rec.color }}>{rec.label}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.4, marginTop: 2 }}>{score.recommendationText}</div>
              </div>
            </div>
            <button
              onClick={() => setExpanded(!expanded)}
              style={{
                flexShrink: 0, display: 'flex', alignItems: 'center', gap: 5,
                background: 'var(--accent-subtle)', border: '1px solid var(--accent-border)', borderRadius: 7,
                padding: '7px 12px', cursor: 'pointer', fontSize: '0.75rem', color: 'var(--accent-primary)',
                fontWeight: 600, transition: 'background 0.15s', whiteSpace: 'nowrap',
              }}
            >
              <Lightbulb size={13} />
              {expanded ? 'Ocultar' : 'Ver análise'}
              {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
          </div>
        </div>
      </div>

      {/* ── Expanded AI Analysis (full width below) ── */}
      {expanded && (
        <div style={{ borderTop: '1px solid var(--glass-border)', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12, background: 'var(--bg-primary)' }}>
          {insights.length > 0 && (
            <div style={{ background: 'var(--bg-secondary)', borderRadius: 10, padding: '12px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                <Eye size={13} /> DIAGNÓSTICO DO CRIATIVO
              </div>
              {insights.map((item, i) => (
                <div key={i} style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 5, lineHeight: 1.5 }}>{item}</div>
              ))}
            </div>
          )}

          {improvements.length > 0 && (
            <div style={{ background: 'var(--warning-bg)', border: '1px solid var(--warning-border)', borderRadius: 10, padding: '12px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, fontSize: '0.78rem', fontWeight: 700, color: 'var(--warning)' }}>
                <RefreshCw size={13} /> MELHORIAS RECOMENDADAS
              </div>
              {improvements.map((imp, i) => (
                <div key={i} style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 6, lineHeight: 1.5, display: 'flex', gap: 6 }}>
                  <span style={{ color: 'var(--warning)', flexShrink: 0 }}>→</span> {imp}
                </div>
              ))}
            </div>
          )}

          {newCreativeSuggestion && (
            <div style={{ background: 'var(--accent-subtle)', border: '1px solid var(--accent-border)', borderRadius: 10, padding: '12px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent-primary)' }}>
                <Film size={13} /> CRIATIVO DE SUBSTITUIÇÃO
              </div>
              <pre style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-wrap', margin: 0, fontFamily: 'inherit' }}>
                {newCreativeSuggestion}
              </pre>
            </div>
          )}

          {nicheHooks.length > 0 && (
            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-base)', borderRadius: 10, padding: '12px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent-primary)' }}>
                <Type size={13} /> HOOKS & ÂNGULOS PARA {(niche || 'SEU NICHO').toUpperCase()}
              </div>
              {nicheHooks.map((h, i) => (
                <div key={i} style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 6, lineHeight: 1.5 }}>{h}</div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Gallery summary header ─────────────────────────────────────────────────
function GallerySummary({ ads, niche, mode }: { ads: Array<{ ad: Ad }>; niche?: string; mode?: CampaignMode }) {
  const toScale = ads.filter((a) => a.ad.creativeScore?.recommendation === 'SCALE').length;
  const toPause = ads.filter((a) => a.ad.creativeScore?.recommendation === 'PAUSE').length;
  const critFatigue = ads.filter((a) => a.ad.creativeScore?.fatigueLevel === 'CRITICAL').length;
  const avgScore = Math.round(ads.reduce((sum, a) => sum + (a.ad.creativeScore?.overall || 0), 0) / (ads.length || 1));

  return (
    <div className="glass-panel" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
      {[
        { label: 'Score Médio', value: `${avgScore}/100`, color: avgScore >= 65 ? 'var(--success)' : avgScore >= 45 ? 'var(--warning)' : 'var(--danger)', icon: Target },
        { label: 'Prontos p/ Escalar', value: toScale, color: 'var(--success)', icon: TrendingUp },
        { label: 'Pausar Imediato', value: toPause, color: toPause > 0 ? 'var(--danger)' : 'var(--text-muted)', icon: Pause },
        { label: 'Fadiga Crítica', value: critFatigue, color: critFatigue > 0 ? 'var(--danger)' : 'var(--text-muted)', icon: AlertTriangle },
      ].map((s) => (
        <div key={s.label} style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: s.color }}>{s.value}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{s.label}</div>
        </div>
      ))}
      {niche && (
        <div style={{ gridColumn: '1/-1', paddingTop: 12, borderTop: '1px solid var(--glass-border)', fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Target size={13} style={{ color: 'var(--accent-primary)' }} />
          Análise calibrada para o nicho <strong style={{ color: 'var(--accent-primary)' }}>{niche}</strong>
          {mode && <> · Modo <strong>{mode}</strong></>}
          {' '} · Clique em "Ver análise + sugestões" em cada card para insights específicos.
        </div>
      )}
    </div>
  );
}

// ── Main export ────────────────────────────────────────────────────────────
export function CreativeGallery({ account, isLoading, campaignMode, clientProfile }: CreativeGalleryProps) {
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
        <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
          Sincronize sua conta Meta Ads ou ative o Modo Demo para ver criativos com análise de performance e sugestões de melhoria.
        </p>
        {clientProfile?.niche && (
          <div style={{ display: 'inline-block', padding: '8px 16px', background: 'rgba(0,240,255,0.08)', border: '1px solid rgba(0,240,255,0.2)', borderRadius: 8, fontSize: '0.83rem', color: 'var(--accent-primary)' }}>
            🎯 Nicho configurado: <strong>{clientProfile.niche}</strong> — os insights já estão prontos para quando os criativos chegarem.
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
        <p style={{ color: 'var(--text-secondary)' }}>Não há anúncios nas campanhas carregadas. Verifique se a conta tem campanhas ativas com anúncios associados.</p>
      </div>
    );
  }

  const sorted = [...allAds].sort((a, b) => (b.ad.creativeScore?.overall || 0) - (a.ad.creativeScore?.overall || 0));
  const toScale = sorted.filter((a) => a.ad.creativeScore?.recommendation === 'SCALE');
  const toPause = sorted.filter((a) => a.ad.creativeScore?.recommendation === 'PAUSE');
  const rest = sorted.filter((a) => !['SCALE', 'PAUSE'].includes(a.ad.creativeScore?.recommendation || ''));

  const niche = clientProfile?.niche;
  const product = clientProfile?.product;

  const renderGrid = (items: typeof sorted, startRank: number) => (
    <div className="creatives-grid">
      {items.map(({ ad, campaignName, adsetName }, i) => (
        <CreativeCard
          key={ad.id}
          ad={ad}
          currency={account.currency}
          rank={startRank + i}
          campaignName={campaignName}
          adsetName={adsetName}
          niche={niche}
          product={product}
          mode={campaignMode}
        />
      ))}
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      <GallerySummary ads={sorted} niche={niche} mode={campaignMode} />

      {toScale.length > 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <TrendingUp size={20} color="var(--success)" />
            <h3 style={{ color: 'var(--success)', margin: 0 }}>🚀 Prontos para Escalar ({toScale.length})</h3>
          </div>
          {renderGrid(toScale, 1)}
        </div>
      )}

      {rest.length > 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <Eye size={20} color="var(--accent-primary)" />
            <h3 style={{ color: 'var(--text-primary)', margin: 0 }}>📊 Em Monitoramento ({rest.length})</h3>
          </div>
          {renderGrid(rest, toScale.length + 1)}
        </div>
      )}

      {toPause.length > 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <Pause size={20} color="var(--danger)" />
            <h3 style={{ color: 'var(--danger)', margin: 0 }}>⏸️ Pausar Imediatamente ({toPause.length})</h3>
          </div>
          {renderGrid(toPause, toScale.length + rest.length + 1)}
        </div>
      )}
    </div>
  );
}
