// ============================================================
// Multi-Provider AI Client
// Supports: Gemini, OpenRouter (FREE), OpenAI, Anthropic, Demo
// ============================================================

import { metaAdsPersona } from './agentPersona';
import { getDemoResponse } from './demoData';

export type AIProvider = 'gemini' | 'openrouter' | 'openai' | 'anthropic' | 'demo';

export interface AIProviderConfig {
  provider: AIProvider;
  apiKey: string;
  model?: string;
}

export interface ChatMessage {
  role: 'user' | 'agent';
  text: string;
}

// ---- Default models per provider ----
export const DEFAULT_MODELS: Record<AIProvider, string> = {
  gemini: 'gemini-2.0-flash',
  openrouter: 'openrouter/free',
  openai: 'gpt-4o',
  anthropic: 'claude-sonnet-4-5',
  demo: 'demo-mode',
};

export const PROVIDER_LABELS: Record<AIProvider, string> = {
  gemini: 'Google Gemini',
  openrouter: 'OpenRouter',
  openai: 'OpenAI GPT',
  anthropic: 'Anthropic Claude',
  demo: 'Modo Demo',
};

export const MODEL_OPTIONS: Record<AIProvider, { id: string; label: string; free?: boolean }[]> = {
  gemini: [
    { id: 'gemini-2.0-flash',       label: 'Gemini 2.0 Flash — Recomendado ✅', free: true },
    { id: 'gemini-2.0-flash-lite',  label: 'Gemini 2.0 Flash Lite — Mais leve ✅', free: true },
    { id: 'gemini-2.5-flash-preview-04-17', label: 'Gemini 2.5 Flash Preview — Mais potente' },
    { id: 'gemini-2.5-pro-preview-05-06',   label: 'Gemini 2.5 Pro Preview — Máxima qualidade' },
  ],
  openrouter: [
    { id: 'openrouter/free',                          label: '⚡ Auto — Melhor modelo grátis disponível 🆓', free: true },
    { id: 'qwen/qwen3-next-80b-a3b-instruct:free',    label: 'Qwen3 80B (Alibaba) 🆓 GRÁTIS — Recomendado', free: true },
    { id: 'nvidia/nemotron-3-super-120b-a12b:free',   label: 'NVIDIA Nemotron 3 Super 120B 🆓 GRÁTIS', free: true },
    { id: 'openai/gpt-oss-120b:free',                 label: 'OpenAI OSS 120B 🆓 GRÁTIS', free: true },
    { id: 'google/gemma-4-31b-it:free',               label: 'Google Gemma 4 31B 🆓 GRÁTIS', free: true },
    { id: 'google/gemma-3-27b-it:free',               label: 'Google Gemma 3 27B 🆓 GRÁTIS', free: true },
    { id: 'meta-llama/llama-3.3-70b-instruct:free',   label: 'Meta Llama 3.3 70B 🆓 GRÁTIS', free: true },
    { id: 'minimax/minimax-m2.5:free',                label: 'MiniMax M2.5 🆓 GRÁTIS', free: true },
    { id: 'anthropic/claude-3.5-sonnet',              label: 'Claude 3.5 Sonnet (pago)' },
    { id: 'openai/gpt-4o',                            label: 'GPT-4o (pago)' },
  ],
  openai: [
    { id: 'gpt-4o',       label: 'GPT-4o (Recomendado)' },
    { id: 'gpt-4o-mini',  label: 'GPT-4o Mini (Mais rápido)' },
    { id: 'gpt-4-turbo',  label: 'GPT-4 Turbo' },
  ],
  anthropic: [
    { id: 'claude-sonnet-4-5', label: 'Claude Sonnet 4.5 (Recomendado)' },
    { id: 'claude-opus-4-5',   label: 'Claude Opus 4.5 (Mais poderoso)' },
    { id: 'claude-haiku-3-5',  label: 'Claude Haiku 3.5 (Mais rápido)' },
  ],
  demo: [
    { id: 'demo-mode', label: 'Demo Mode — Sem chave de API' },
  ],
};

// ============================================================
// GEMINI
// ============================================================
async function chatWithGemini(
  config: AIProviderConfig,
  history: ChatMessage[],
  message: string
): Promise<string> {
  const { GoogleGenerativeAI } = await import('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(config.apiKey.trim());
  const model = genAI.getGenerativeModel({
    model: config.model || DEFAULT_MODELS.gemini,
    systemInstruction: metaAdsPersona,
    generationConfig: { temperature: 0.15, topP: 0.95, topK: 40, maxOutputTokens: 4096 },
  });

  const geminiHistory = history.slice(1).map((msg) => ({
    role: msg.role === 'agent' ? 'model' : 'user',
    parts: [{ text: msg.text }],
  }));

  const chat = model.startChat({ history: geminiHistory });
  const result = await chat.sendMessage(message);
  const text = result.response.text();
  if (!text) throw new Error('Resposta vazia do modelo.');
  return text;
}

// ============================================================
// OPENROUTER — OpenAI-compatible, many FREE models
// ============================================================
async function chatWithOpenRouter(
  config: AIProviderConfig,
  history: ChatMessage[],
  message: string
): Promise<string> {
  const messages = [
    { role: 'system', content: metaAdsPersona },
    ...history.slice(1).map((msg) => ({
      role: msg.role === 'agent' ? 'assistant' : 'user',
      content: msg.text,
    })),
    { role: 'user', content: message },
  ];

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey.trim()}`,
      'HTTP-Referer': 'https://aria-meta-ads.app',
      'X-Title': 'ARIA Meta Ads Agent',
    },
    body: JSON.stringify({
      model: config.model || DEFAULT_MODELS.openrouter,
      messages,
      temperature: 0.15,
      max_tokens: 4096,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const errMsg = err?.error?.message || `OpenRouter API error: ${response.status}`;
    throw new Error(errMsg);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '';
  if (!content) throw new Error('Resposta vazia do modelo OpenRouter.');
  return content;
}

// ============================================================
// OPENAI
// ============================================================
async function chatWithOpenAI(
  config: AIProviderConfig,
  history: ChatMessage[],
  message: string
): Promise<string> {
  const messages = [
    { role: 'system', content: metaAdsPersona },
    ...history.slice(1).map((msg) => ({
      role: msg.role === 'agent' ? 'assistant' : 'user',
      content: msg.text,
    })),
    { role: 'user', content: message },
  ];

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey.trim()}`,
    },
    body: JSON.stringify({
      model: config.model || DEFAULT_MODELS.openai,
      messages,
      temperature: 0.15,
      max_tokens: 8192,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message || `OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

// ============================================================
// ANTHROPIC (Claude)
// ============================================================
async function chatWithAnthropic(
  config: AIProviderConfig,
  history: ChatMessage[],
  message: string
): Promise<string> {
  const messages = [
    ...history.slice(1).map((msg) => ({
      role: msg.role === 'agent' ? 'assistant' : 'user',
      content: msg.text,
    })),
    { role: 'user', content: message },
  ];

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey.trim(),
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: config.model || DEFAULT_MODELS.anthropic,
      system: metaAdsPersona,
      messages,
      max_tokens: 8192,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Anthropic API error: ${response.status}`);
  }

  const data = await response.json();
  return data.content?.[0]?.text || '';
}

// ============================================================
// DEMO MODE
// ============================================================
async function chatWithDemo(_config: AIProviderConfig, _history: ChatMessage[], message: string): Promise<string> {
  await new Promise((resolve) => setTimeout(resolve, 800 + Math.random() * 1200));
  return getDemoResponse(message);
}

// ============================================================
// VISION: CREATIVE IMAGE ANALYSIS
// ============================================================

export interface CreativeAnalysisInput {
  imageUrl: string;
  adName: string;
  campaignName: string;
  adFormat?: string;
  titleText?: string;
  bodyText?: string;
  captionText?: string;
  ctaLabel?: string;
  metrics?: CreativePerformanceMetrics;
  niche?: string;
  currency?: string;
}

export interface CreativeCopyAnalysisInput {
  adName: string;
  campaignName: string;
  adFormat?: string;
  titleText?: string;
  bodyText?: string;
  ctaLabel?: string;
  metrics?: CreativePerformanceMetrics;
  niche?: string;
  currency?: string;
}

export interface CreativePerformanceMetrics {
  ctr?: number;
  cpc?: number;
  spend?: number;
  roas?: number;
  cpl?: number;
  cpm?: number;
  impressions?: number;
  frequency?: number;
  costPerConversation?: number;
  costPerLandingPageView?: number;
  messagesStarted?: number;
  linkClicks?: number;
}

export interface CopyChangeSuggestion {
  headline: string;
  copy: string;
  cta: string;
  reason: string;
  expectedImpact?: string;
}

function hasNumber(value?: number): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function buildMetricsText(metrics: CreativePerformanceMetrics | undefined, currency: string): string {
  if (!metrics) return '';

  const cur = currency || 'BRL';
  const fmt = (v?: number) => hasNumber(v) ? v.toFixed(2) : 'N/A';
  const lines = [
    'Métricas do anúncio:',
    `- CTR: ${fmt(metrics.ctr)}%`,
    `- CPC: ${cur} ${fmt(metrics.cpc)}`,
    `- CPM: ${cur} ${fmt(metrics.cpm)}`,
    `- Gasto: ${cur} ${fmt(metrics.spend)}`,
    `- Frequência: ${fmt(metrics.frequency)}x`,
    `- Impressões: ${hasNumber(metrics.impressions) ? Math.round(metrics.impressions).toLocaleString('pt-BR') : 'N/A'}`,
  ];

  if (hasNumber(metrics.roas)) lines.push(`- ROAS: ${metrics.roas.toFixed(2)}x`);
  if (hasNumber(metrics.cpl)) lines.push(`- CPL: ${cur} ${metrics.cpl.toFixed(2)}`);
  if (hasNumber(metrics.costPerConversation)) lines.push(`- Custo/Conv.: ${cur} ${metrics.costPerConversation.toFixed(2)}`);
  if (hasNumber(metrics.costPerLandingPageView)) lines.push(`- Custo/LPV: ${cur} ${metrics.costPerLandingPageView.toFixed(2)}`);
  if (hasNumber(metrics.messagesStarted)) lines.push(`- Conversas iniciadas: ${Math.round(metrics.messagesStarted).toLocaleString('pt-BR')}`);
  if (hasNumber(metrics.linkClicks)) lines.push(`- Cliques no link: ${Math.round(metrics.linkClicks).toLocaleString('pt-BR')}`);

  return `\n${lines.join('\n')}\n`;
}

function buildVisionPrompt(input: CreativeAnalysisInput): string {
  const { adName, campaignName, adFormat, titleText, bodyText, captionText, ctaLabel, metrics, niche, currency } = input;
  const metricsText = buildMetricsText(metrics, currency || 'BRL');
  const textContext = `
Texto do anúncio (além da arte):
- Headline/Título: ${titleText?.trim() || '[não informado]'}
- Copy principal: ${bodyText?.trim() || '[não informado]'}
- Legenda/Descrição: ${captionText?.trim() || '[não informado]'}
- CTA/Botão: ${ctaLabel?.trim() || '[não informado]'}
`;

  return `Você é um especialista em criativos para Meta Ads (Facebook/Instagram) com foco em performance. Analise o criativo a seguir.

Anúncio: "${adName}"
Campanha: "${campaignName}"
Formato: ${adFormat || 'Desconhecido'}
${niche ? `Nicho: ${niche}` : ''}
${textContext}
${metricsText}

Faça uma análise DETALHADA e ACIONÁVEL do criativo respondendo exatamente nesta estrutura em português:

## 🎯 Hook Visual (primeiros 3 segundos)
O que chama atenção, o que para o scroll, o que poderia ser melhorado.

## 📝 Copy & Headline
Avalie o texto visível na arte e também o texto do anúncio (copy, legenda e headline). Diga se há redundância, conflito de mensagem ou excesso de texto.

## 📣 CTA (Call to Action)
O CTA está claro? É específico ou genérico? Sugestão de melhoria.

## 🎨 Design & Qualidade
Legibilidade, hierarquia visual, qualidade da imagem, profissionalismo.

## ⚡ Pontos Críticos
Liste 2-4 problemas específicos que estão limitando a performance.

## ✅ O que está funcionando
Liste 1-3 pontos positivos do criativo.

## 🚀 3 Sugestões de Melhoria
Sugestões ESPECÍFICAS e implementáveis, não genéricas.

Seja direto, específico e orientado a resultados de negócio. Use os dados de performance para contextualizar.
Se houver copy/legenda/CTA disponíveis, obrigatoriamente considere a consistência entre visual e texto na análise.`;
}

function buildCopyPrompt(input: CreativeCopyAnalysisInput): string {
  const { adName, campaignName, adFormat, titleText, bodyText, ctaLabel, metrics, niche, currency } = input;
  const metricsText = buildMetricsText(metrics, currency || 'BRL');

  return `Você é um especialista em copy para Meta Ads, focado em performance e clareza.

Analise este anúncio:
Anúncio: "${adName}"
Campanha: "${campaignName}"
Formato: ${adFormat || 'Desconhecido'}
${niche ? `Nicho: ${niche}` : ''}
${ctaLabel ? `CTA do anúncio: ${ctaLabel}` : ''}
${metricsText}

Título:
${titleText?.trim() || '[sem título]'}

Copy principal:
${bodyText?.trim() || '[sem copy]'}

Responda EXATAMENTE nesta estrutura:

## 🎯 Diagnóstico do Copy
Avalie clareza, dor, benefício, credibilidade e persuasão. Se houver métricas, conecte explicitamente os números com os pontos da copy.

## ⚠️ Pontos que limitam conversão
Liste de 3 a 5 problemas concretos (sem generalidades).

## ✅ Pontos fortes
Liste 1 a 3 pontos que devem ser mantidos.

## ✍️ Reescrita sugerida
Entregue:
- 1 versão de copy curta (até 300 caracteres)
- 1 versão de copy média (até 600 caracteres)
- 3 opções de headline
- 3 opções de CTA específicos (evite genéricos)

## 🧪 Testes A/B recomendados
Liste 3 testes objetivos de copy para rodar nos próximos 7 dias.

Regra obrigatória: se métricas existirem, cite no mínimo 2 números exatos (ex: CTR, CPC, CPM, Custo/Conv.) e explique como eles mudam o diagnóstico e a reescrita.

Seja específico, direto, sem conselhos genéricos.`;
}

function buildCopySuggestionsPrompt(input: CreativeCopyAnalysisInput): string {
  const { adName, campaignName, adFormat, titleText, bodyText, ctaLabel, metrics, niche, currency } = input;
  const metricsText = buildMetricsText(metrics, currency || 'BRL');

  return `Você é um especialista em copy para Meta Ads.

Gere variações de copy para este anúncio:
Anúncio: "${adName}"
Campanha: "${campaignName}"
Formato: ${adFormat || 'Desconhecido'}
${niche ? `Nicho: ${niche}` : ''}
${ctaLabel ? `CTA atual: ${ctaLabel}` : ''}
${metricsText}

Título atual:
${titleText?.trim() || '[sem título]'}

Copy atual:
${bodyText?.trim() || '[sem copy]'}

Retorne SOMENTE JSON válido (sem markdown) no formato:
{
  "suggestions": [
    {
      "headline": "string",
      "copy": "string",
      "cta": "string",
      "reason": "string",
      "expectedImpact": "string"
    }
  ]
}

Regras:
- Entregue de 3 a 5 sugestões.
- Cada "copy" deve ter no máximo 350 caracteres.
- "reason" deve explicar por que a mudança tende a performar melhor.
- Se houver métricas, use os números para justificar as sugestões (ex: CTR baixo, CPC alto, CPM alto).
- Evite textos genéricos.`;
}

function extractJsonPayload(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) throw new Error('Resposta vazia ao gerar mudanças de copy.');

  if (
    (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
    (trimmed.startsWith('[') && trimmed.endsWith(']'))
  ) {
    return trimmed;
  }

  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) return fenced[1].trim();

  const firstBrace = trimmed.indexOf('{');
  const lastBrace = trimmed.lastIndexOf('}');
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1);
  }

  const firstBracket = trimmed.indexOf('[');
  const lastBracket = trimmed.lastIndexOf(']');
  if (firstBracket >= 0 && lastBracket > firstBracket) {
    return trimmed.slice(firstBracket, lastBracket + 1);
  }

  throw new Error('A IA não retornou JSON válido para mudanças de copy.');
}

function parseCopySuggestions(raw: string): CopyChangeSuggestion[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(extractJsonPayload(raw));
  } catch {
    throw new Error('Não foi possível interpretar as mudanças de copy retornadas pela IA.');
  }

  const sourceList: unknown[] =
    Array.isArray(parsed) ? parsed :
    (parsed && typeof parsed === 'object' && Array.isArray((parsed as { suggestions?: unknown[] }).suggestions))
      ? (parsed as { suggestions: unknown[] }).suggestions
      : [];

  const suggestions: CopyChangeSuggestion[] = [];

  for (const item of sourceList) {
    if (!item || typeof item !== 'object') continue;
    const row = item as Record<string, unknown>;
    const headline = typeof row.headline === 'string' ? row.headline.trim() : '';
    const copy = typeof row.copy === 'string' ? row.copy.trim() : '';
    const cta = typeof row.cta === 'string' ? row.cta.trim() : '';
    const reason = typeof row.reason === 'string' ? row.reason.trim() : '';
    const expectedImpact = typeof row.expectedImpact === 'string' ? row.expectedImpact.trim() : '';

    if (!copy || !reason) continue;
    suggestions.push({
      headline: headline || 'Nova variação',
      copy,
      cta: cta || 'Saiba mais',
      reason,
      ...(expectedImpact ? { expectedImpact } : {}),
    });
  }

  if (!suggestions.length) {
    throw new Error('A IA não retornou sugestões utilizáveis de mudança de copy.');
  }

  return suggestions.slice(0, 5);
}

async function analyzeWithGeminiVision(config: AIProviderConfig, input: CreativeAnalysisInput): Promise<string> {
  const { GoogleGenerativeAI } = await import('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(config.apiKey.trim());
  const modelId = ['gemini-2.0-flash-lite', 'openrouter/free'].includes(config.model || '')
    ? 'gemini-2.0-flash'
    : (config.model || DEFAULT_MODELS.gemini);
  const model = genAI.getGenerativeModel({ model: modelId });
  const prompt = buildVisionPrompt(input);

  // Try to fetch image as base64 for inline data (most reliable with Gemini)
  let imagePart: any;
  try {
    const resp = await fetch(input.imageUrl);
    if (!resp.ok) throw new Error('fetch failed');
    const buffer = await resp.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
    const mimeType = resp.headers.get('content-type') || 'image/jpeg';
    imagePart = { inlineData: { mimeType, data: base64 } };
  } catch {
    // Fallback: ask Gemini to fetch via fileData URL
    imagePart = { fileData: { mimeType: 'image/jpeg', fileUri: input.imageUrl } };
  }

  const result = await model.generateContent([prompt, imagePart]);
  const text = result.response.text();
  if (!text) throw new Error('Resposta vazia do Gemini.');
  return text;
}

async function analyzeWithOpenAIVision(config: AIProviderConfig, input: CreativeAnalysisInput, baseUrl = 'https://api.openai.com/v1'): Promise<string> {
  const prompt = buildVisionPrompt(input);
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey.trim()}`,
      ...(baseUrl.includes('openrouter') ? {
        'HTTP-Referer': 'https://aria-meta-ads.app',
        'X-Title': 'ARIA Meta Ads Agent',
      } : {}),
    },
    body: JSON.stringify({
      model: config.model || DEFAULT_MODELS.openai,
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: input.imageUrl, detail: 'high' } },
        ],
      }],
      temperature: 0.2,
      max_tokens: 4096,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message || `API error: ${response.status}`);
  }
  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

async function analyzeWithAnthropicVision(config: AIProviderConfig, input: CreativeAnalysisInput): Promise<string> {
  const prompt = buildVisionPrompt(input);
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey.trim(),
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: config.model || DEFAULT_MODELS.anthropic,
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'url', url: input.imageUrl } },
          { type: 'text', text: prompt },
        ],
      }],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Anthropic error: ${response.status}`);
  }
  const data = await response.json();
  return data.content?.[0]?.text || '';
}

async function analyzeWithGeminiText(config: AIProviderConfig, prompt: string): Promise<string> {
  const { GoogleGenerativeAI } = await import('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(config.apiKey.trim());
  const modelId = ['gemini-2.0-flash-lite', 'openrouter/free'].includes(config.model || '')
    ? 'gemini-2.0-flash'
    : (config.model || DEFAULT_MODELS.gemini);
  const model = genAI.getGenerativeModel({ model: modelId });
  const result = await model.generateContent(prompt);
  const text = result.response.text();
  if (!text) throw new Error('Resposta vazia do Gemini.');
  return text;
}

async function analyzeWithOpenAIText(config: AIProviderConfig, prompt: string, baseUrl = 'https://api.openai.com/v1'): Promise<string> {
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey.trim()}`,
      ...(baseUrl.includes('openrouter') ? {
        'HTTP-Referer': 'https://aria-meta-ads.app',
        'X-Title': 'ARIA Meta Ads Agent',
      } : {}),
    },
    body: JSON.stringify({
      model: config.model || DEFAULT_MODELS.openai,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      max_tokens: 4096,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message || `API error: ${response.status}`);
  }
  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

async function analyzeWithAnthropicText(config: AIProviderConfig, prompt: string): Promise<string> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey.trim(),
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: config.model || DEFAULT_MODELS.anthropic,
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Anthropic error: ${response.status}`);
  }
  const data = await response.json();
  return data.content?.[0]?.text || '';
}

const QUOTA_ERROR_MARKERS = [
  '429',
  'quota',
  'rate limit',
  'resource_exhausted',
  'rate_limit',
  'insufficient_quota',
  'generate_content_free_tier_requests',
  'generate_content_free_tier_input_token_count',
];

function isQuotaError(message: string): boolean {
  const normalized = message.toLowerCase();
  return QUOTA_ERROR_MARKERS.some((marker) => normalized.includes(marker));
}

function hasGeminiFreeTierZeroQuota(message: string): boolean {
  const normalized = message.toLowerCase();
  return normalized.includes('generate_content_free_tier') && normalized.includes('limit: 0');
}

function formatFriendlyProviderError(config: AIProviderConfig, error: unknown): Error {
  const err = error instanceof Error ? error : new Error(String(error || 'Erro desconhecido'));
  const msg = err.message || '';

  if (!isQuotaError(msg)) {
    console.error(`Error with ${config.provider}:`, error);
    return err;
  }

  const geminiHasNoQuota = config.provider === 'gemini' && hasGeminiFreeTierZeroQuota(msg);

  const tips: Record<AIProvider, string> = {
    gemini: geminiHasNoQuota
      ? [
          'Detectamos que sua chave está sem cota no plano gratuito (`limit: 0`).',
          '1. Ative billing/plano no Google AI Studio/Google Cloud para liberar quota',
          '2. Em Configurações, troque para **OpenRouter/free** temporariamente',
          '3. Se já ativou o plano, aguarde alguns minutos e tente novamente',
        ].join('\n')
      : [
          '1. Aguarde ~1 minuto e tente novamente',
          '2. Em Configurações, troque para **Gemini 2.0 Flash Lite**',
          '3. Se persistir, use **OpenRouter/free** temporariamente',
        ].join('\n'),
    openrouter: [
      '1. Aguarde ~1 minuto e tente novamente',
      '2. Troque para outro modelo grátis nas Configurações',
      '3. Verifique seus créditos em openrouter.ai',
    ].join('\n'),
    openai: 'Verifique seu billing em platform.openai.com',
    anthropic: 'Verifique seu billing em console.anthropic.com',
    demo: '',
  };

  return new Error(
    `⏳ Limite de requisições/cota atingido no ${PROVIDER_LABELS[config.provider]}.\n\n${tips[config.provider]}`
  );
}

export async function analyzeCreativeVision(
  config: AIProviderConfig,
  input: CreativeAnalysisInput
): Promise<string> {
  if (config.provider === 'demo') {
    await new Promise((r) => setTimeout(r, 1200));
    return `## 🎯 Hook Visual (primeiros 3 segundos)
O criativo usa um design de alto contraste com texto grande e colorido, o que tem bom potencial de parar o scroll. A foto do imóvel cria apelo aspiracional imediato.

## 📝 Copy & Headline
O headline "CAMPANHA COMBO" é direto, mas pode ser mais específico sobre o benefício. Os valores estão em destaque — bom. A copy precisa de um verbo de ação mais forte.

## 📣 CTA (Call to Action)
O CTA "APENAS 2 VAGAS" usa urgência com escassez — eficaz. Porém falta um botão/instrução de próximo passo claro no criativo.

## 🎨 Design & Qualidade
Qualidade visual razoável. A hierarquia poderia ser melhorada — muitos elementos competindo atenção. A fonte da oferta principal poderia ser maior.

## ⚡ Pontos Críticos
- Texto pequeno dificulta leitura no mobile
- Muita informação de uma vez (fadiga cognitiva)
- Falta foto de pessoa real para criar conexão emocional

## ✅ O que está funcionando
- Urgência com escassez ("APENAS 2 VAGAS") bem posicionada
- Valores específicos geram credibilidade
- Imagem do imóvel alinha com o produto

## 🚀 3 Sugestões de Melhoria
1. **Simplificar**: Uma oferta principal em vez de combo — teste versões separadas
2. **Humanizar**: Adicionar foto de pessoa comemorando a conquista do imóvel
3. **CTA específico**: Substituir "Saiba mais" por "Simular meu consórcio agora"`;
  }

  if (!config.apiKey) {
    throw new Error('API Key não configurada. Adicione em Configurações → Provedor de IA.');
  }

  try {
    switch (config.provider) {
      case 'gemini':
        return await analyzeWithGeminiVision(config, input);
      case 'openai':
        return await analyzeWithOpenAIVision(config, input);
      case 'anthropic':
        return await analyzeWithAnthropicVision(config, input);
      case 'openrouter':
        // Use a vision-capable model for OpenRouter
        return await analyzeWithOpenAIVision(
          { ...config, model: config.model?.includes(':free') ? 'google/gemini-2.0-flash-001' : config.model },
          input,
          'https://openrouter.ai/api/v1'
        );
      default:
        throw new Error(`Provider ${config.provider} não suportado para análise visual.`);
    }
  } catch (error) {
    throw formatFriendlyProviderError(config, error);
  }
}

export async function analyzeCreativeCopy(
  config: AIProviderConfig,
  input: CreativeCopyAnalysisInput
): Promise<string> {
  const hasCopy = Boolean(input.titleText?.trim() || input.bodyText?.trim());
  if (!hasCopy) {
    throw new Error('Sem copy disponível para análise.');
  }

  if (config.provider === 'demo') {
    await new Promise((r) => setTimeout(r, 1200));
    return `## 🎯 Diagnóstico do Copy
A copy comunica a oferta, mas ainda está genérica em benefício e urgência. Falta deixar mais claro "o que a pessoa ganha agora" e por que agir hoje.

## ⚠️ Pontos que limitam conversão
- Abertura pouco específica para dor principal
- Benefício central diluído no texto
- CTA amplo demais (baixa intenção)

## ✅ Pontos fortes
- Linguagem simples e direta
- Oferta principal está presente
- Fácil adaptação para teste A/B

## ✍️ Reescrita sugerida
- **Copy curta:** Cansado de adiar seu imóvel? Simule agora seu consórcio e veja uma parcela que cabe no bolso, sem juros de financiamento.
- **Copy média:** Se você quer sair do aluguel sem depender de financiamento caro, essa pode ser a sua chance. Simule seu consórcio agora, veja parcelas possíveis para seu perfil e entenda como acelerar sua compra com segurança.
- **Headlines:**
  - Simule seu imóvel sem juros bancários
  - Descubra a parcela ideal para seu consórcio
  - Saia do aluguel com planejamento
- **CTAs:**
  - Simular minha parcela agora
  - Falar com especialista em consórcio
  - Ver opções para meu perfil

## 🧪 Testes A/B recomendados
1. Testar abertura por dor ("cansado de pagar aluguel?") vs abertura por benefício ("simule seu imóvel hoje")
2. Testar prova social (resultado de cliente) vs oferta direta
3. Testar CTA de ação imediata vs CTA consultivo`;
  }

  if (!config.apiKey) {
    throw new Error('API Key não configurada. Adicione em Configurações → Provedor de IA.');
  }

  const prompt = buildCopyPrompt(input);
  try {
    switch (config.provider) {
      case 'gemini':
        return await analyzeWithGeminiText(config, prompt);
      case 'openai':
        return await analyzeWithOpenAIText(config, prompt);
      case 'anthropic':
        return await analyzeWithAnthropicText(config, prompt);
      case 'openrouter':
        return await analyzeWithOpenAIText(
          { ...config, model: config.model?.includes(':free') ? 'google/gemini-2.0-flash-001' : config.model },
          prompt,
          'https://openrouter.ai/api/v1'
        );
      default:
        throw new Error(`Provider ${config.provider} não suportado para análise de copy.`);
    }
  } catch (error) {
    throw formatFriendlyProviderError(config, error);
  }
}

export async function generateCopyChangeSuggestions(
  config: AIProviderConfig,
  input: CreativeCopyAnalysisInput
): Promise<CopyChangeSuggestion[]> {
  const hasCopy = Boolean(input.titleText?.trim() || input.bodyText?.trim());
  if (!hasCopy) {
    throw new Error('Sem copy disponível para gerar mudanças.');
  }

  if (config.provider === 'demo') {
    await new Promise((r) => setTimeout(r, 1000));
    return [
      {
        headline: 'Simule seu imóvel hoje',
        copy: 'Ainda pagando aluguel? Faça uma simulação em 1 minuto e veja como conquistar seu imóvel com parcelas planejadas para o seu bolso.',
        cta: 'Simular minha parcela',
        reason: 'Abre com dor clara e traz benefício imediato com promessa de rapidez, aumentando a chance de clique qualificado.',
        expectedImpact: 'Tende a melhorar CTR em públicos frios com baixa intenção inicial.',
      },
      {
        headline: 'Sem juros abusivos',
        copy: 'Troque o financiamento caro por uma estratégia mais inteligente. Descubra uma alternativa para comprar seu imóvel com mais controle financeiro.',
        cta: 'Ver alternativa agora',
        reason: 'Reposiciona a oferta por contraste com o principal concorrente (financiamento), aumentando percepção de valor.',
        expectedImpact: 'Pode reduzir CPC ao aumentar relevância percebida do anúncio.',
      },
      {
        headline: 'Plano para sair do aluguel',
        copy: 'Receba um plano simples para sair do aluguel sem apertar seu orçamento. Fale com um especialista e veja opções para o seu perfil.',
        cta: 'Falar com especialista',
        reason: 'Inclui apoio humano e personalização, o que costuma elevar conversão em etapas de consideração.',
        expectedImpact: 'Pode aumentar a taxa de conversão após o clique em campanhas de mensagem/lead.',
      },
    ];
  }

  if (!config.apiKey) {
    throw new Error('API Key não configurada. Adicione em Configurações → Provedor de IA.');
  }

  const prompt = buildCopySuggestionsPrompt(input);
  try {
    let raw = '';
    switch (config.provider) {
      case 'gemini':
        raw = await analyzeWithGeminiText(config, prompt);
        break;
      case 'openai':
        raw = await analyzeWithOpenAIText(config, prompt);
        break;
      case 'anthropic':
        raw = await analyzeWithAnthropicText(config, prompt);
        break;
      case 'openrouter':
        raw = await analyzeWithOpenAIText(
          { ...config, model: config.model?.includes(':free') ? 'google/gemini-2.0-flash-001' : config.model },
          prompt,
          'https://openrouter.ai/api/v1'
        );
        break;
      default:
        throw new Error(`Provider ${config.provider} não suportado para geração de mudanças de copy.`);
    }

    return parseCopySuggestions(raw);
  } catch (error) {
    throw formatFriendlyProviderError(config, error);
  }
}

// ============================================================
// UNIVERSAL CHAT FUNCTION
// ============================================================
export const chatWithAgent = async (
  config: AIProviderConfig,
  history: ChatMessage[],
  message: string,
  _metaContext?: string
): Promise<string> => {
  if (config.provider === 'demo') {
    return chatWithDemo(config, history, message);
  }

  if (!config.apiKey) {
    throw new Error('API Key não configurada. Adicione em Configurações.');
  }

  try {
    switch (config.provider) {
      case 'gemini':
        return await chatWithGemini(config, history, message);
      case 'openrouter':
        return await chatWithOpenRouter(config, history, message);
      case 'openai':
        return await chatWithOpenAI(config, history, message);
      case 'anthropic':
        return await chatWithAnthropic(config, history, message);
      default:
        throw new Error(`Provider desconhecido: ${config.provider}`);
    }
  } catch (error) {
    throw formatFriendlyProviderError(config, error);
  }
};
