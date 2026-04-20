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
  metrics?: {
    ctr?: number;
    cpc?: number;
    spend?: number;
    roas?: number;
    cpl?: number;
    cpm?: number;
    impressions?: number;
    frequency?: number;
  };
  niche?: string;
  currency?: string;
}

function buildVisionPrompt(input: CreativeAnalysisInput): string {
  const { adName, campaignName, adFormat, metrics, niche, currency } = input;
  const cur = currency || 'BRL';
  const fmt = (v?: number) => v !== undefined && v > 0 ? v.toFixed(2) : 'N/A';

  let metricsText = '';
  if (metrics) {
    metricsText = `
Métricas do anúncio:
- CTR: ${fmt(metrics.ctr)}%
- CPC: ${cur} ${fmt(metrics.cpc)}
- CPM: ${cur} ${fmt(metrics.cpm)}
- Gasto: ${cur} ${fmt(metrics.spend)}
- Frequência: ${fmt(metrics.frequency)}x
- Impressões: ${metrics.impressions?.toLocaleString('pt-BR') ?? 'N/A'}
${metrics.roas ? `- ROAS: ${metrics.roas.toFixed(2)}x` : ''}
${metrics.cpl ? `- CPL: ${cur} ${metrics.cpl.toFixed(2)}` : ''}
`;
  }

  return `Você é um especialista em criativos para Meta Ads (Facebook/Instagram) com foco em performance. Analise o criativo a seguir.

Anúncio: "${adName}"
Campanha: "${campaignName}"
Formato: ${adFormat || 'Desconhecido'}
${niche ? `Nicho: ${niche}` : ''}
${metricsText}

Faça uma análise DETALHADA e ACIONÁVEL do criativo respondendo exatamente nesta estrutura em português:

## 🎯 Hook Visual (primeiros 3 segundos)
O que chama atenção, o que para o scroll, o que poderia ser melhorado.

## 📝 Copy & Headline
Avalie o texto visível, a força do headline, clareza da proposta de valor.

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

Seja direto, específico e orientado a resultados de negócio. Use os dados de performance para contextualizar.`;
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
  let imagePart: object;
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

  switch (config.provider) {
    case 'gemini':
      return analyzeWithGeminiVision(config, input);
    case 'openai':
      return analyzeWithOpenAIVision(config, input);
    case 'anthropic':
      return analyzeWithAnthropicVision(config, input);
    case 'openrouter':
      // Use a vision-capable model for OpenRouter
      return analyzeWithOpenAIVision(
        { ...config, model: config.model?.includes(':free') ? 'google/gemini-2.0-flash-001' : config.model },
        input,
        'https://openrouter.ai/api/v1'
      );
    default:
      throw new Error(`Provider ${config.provider} não suportado para análise visual.`);
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
    const err = error as Error;
    const msg = err.message || '';

    // Friendly 429 / quota message
    if (
      msg.includes('429') || msg.includes('quota') || msg.includes('Quota') ||
      msg.includes('rate limit') || msg.includes('RESOURCE_EXHAUSTED') ||
      msg.includes('rate_limit') || msg.includes('insufficient_quota')
    ) {
      const tips: Record<AIProvider, string> = {
        gemini: `**Soluções:**\n1. Aguarde ~1 minuto e tente de novo\n2. Troque para "Gemini 1.5 Flash 8B" nas Configurações\n3. Use **OpenRouter** com modelos grátis (Llama 4, Gemma 3)`,
        openrouter: `**Soluções:**\n1. Aguarde ~1 minuto e tente de novo\n2. Troque para outro modelo grátis (ex: Gemma 3)\n3. Verifique seus créditos em openrouter.ai`,
        openai: `Verifique seu billing em platform.openai.com`,
        anthropic: `Verifique seu billing em console.anthropic.com`,
        demo: '',
      };
      throw new Error(
        `⏳ Limite de requisições atingido no ${PROVIDER_LABELS[config.provider]}.\n\n${tips[config.provider]}`
      );
    }

    console.error(`Error with ${config.provider}:`, error);
    throw error;
  }
};
