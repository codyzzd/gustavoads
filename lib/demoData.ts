import type { AdAccount } from './metaTypes';

// ============================================================
// DEMO DATA — Conta fictícia realista para testes
// ============================================================
export const DEMO_ACCOUNT: AdAccount = {
  id: 'act_demo123456',
  name: 'Loja Demo — ARIA Agent',
  currency: 'BRL',
  timezone_name: 'America/Sao_Paulo',
  account_status: 1,
  overallInsights: {
    spend: 12450.80,
    impressions: 841200,
    clicks: 9253,
    reach: 280400,
    frequency: 3.0,
    ctr: 1.10,
    cpc: 1.35,
    cpm: 14.80,
    roas: 3.4,
    cpa: 41.50,
    purchases: 300,
    addToCart: 1840,
    viewContent: 6100,
    leads: 0,
    costPerLead: 0,
    messagesStarted: 0,
    messagingFirstReply: 0,
    newMessagingConnections: 0,
    costPerConversation: 0,
    costPerFirstReply: 0,
    linkClicks: 9253,
    landingPageViews: 7820,
    costPerLandingPageView: 1.59,
    videoThruPlays: 0,
    videoPlays: 0,
    costPerThruPlay: 0,
  },
  campaigns: [
    {
      id: 'camp_001',
      name: '🚀 [CBO] Prospecção Broad — TOF',
      status: 'ACTIVE',
      objective: 'OUTCOME_SALES',
      daily_budget: '50000',
      insightsSummary: {
        spend: 4800,
        impressions: 324000,
        clicks: 3564,
        reach: 108000,
        frequency: 3.0,
        ctr: 1.10,
        cpc: 1.35,
        cpm: 14.80,
        roas: 4.2,
        cpa: 34.28,
        purchases: 140,
        addToCart: 840,
        viewContent: 2800,
        leads: 0, costPerLead: 0,
        messagesStarted: 0, messagingFirstReply: 0, newMessagingConnections: 0,
        costPerConversation: 0, costPerFirstReply: 0,
        linkClicks: 3564, landingPageViews: 3010, costPerLandingPageView: 1.59,
        videoThruPlays: 0, videoPlays: 0, costPerThruPlay: 0,
      },
      adsets: [
        {
          id: 'adset_001',
          name: 'Broad 18-55 | Mix Placement',
          campaign_id: 'camp_001',
          status: 'ACTIVE',
          billing_event: 'IMPRESSIONS',
          optimization_goal: 'OFFSITE_CONVERSIONS',
          bid_strategy: 'LOWEST_COST_WITHOUT_CAP',
          targeting: {
            age_min: 18, age_max: 55,
            genders: [],
            publisher_platforms: ['facebook', 'instagram', 'audience_network'],
            advantage_audience: true,
          },
          insightsSummary: {
            spend: 2400, impressions: 162000, clicks: 1782, reach: 54000,
            frequency: 3.0, ctr: 1.10, cpc: 1.35, cpm: 14.82,
            roas: 4.5, cpa: 30.00, purchases: 80,
            addToCart: 480, viewContent: 1600, leads: 0, costPerLead: 0,
            messagesStarted: 0, messagingFirstReply: 0, newMessagingConnections: 0,
            costPerConversation: 0, costPerFirstReply: 0,
            linkClicks: 1782, landingPageViews: 1500, costPerLandingPageView: 1.60,
            videoThruPlays: 0, videoPlays: 0, costPerThruPlay: 0,
          },
          audienceAnalysis: {
            type: 'ADVANTAGE_PLUS',
            quality: 'GOOD',
            saturationRisk: 'MEDIUM',
            insights: ['Usando Advantage+ Audience — targeting automático.', 'Faixa etária: 18–55 anos', 'Plataformas: facebook, instagram, audience_network'],
            recommendations: ['Frequência moderada (3.0x). Prepare novos criativos.', 'Considere incluir Reels como placement prioritário para menor CPM.'],
          },
          ads: [
            {
              id: 'ad_001',
              name: 'UGC Produto — Gancho Dor/Solução',
              status: 'ACTIVE',
              adFormat: 'VIDEO' as const,
              creative: {
                id: 'cr_001', name: 'UGC_v1',
                title: 'Você ainda sofre com isso?',
                body: 'Conheça a solução que mais de 10.000 clientes escolheram. Frete grátis hoje.',
                object_type: 'VIDEO',
                thumbnail_url: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80',
                effective_object_story_spec: {
                  video_data: {
                    message: 'Conheça a solução que mais de 10.000 clientes escolheram. Frete grátis hoje.',
                    title: 'Você ainda sofre com isso?',
                    image_url: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80',
                  },
                },
              },
              insightsSummary: {
                spend: 1400, impressions: 94500, clicks: 1134, reach: 31500,
                frequency: 3.0, ctr: 1.20, cpc: 1.24, cpm: 14.81,
                roas: 5.2, cpa: 23.33, purchases: 60,
                addToCart: 360, viewContent: 1200, leads: 0, costPerLead: 0,
                messagesStarted: 0, messagingFirstReply: 0, newMessagingConnections: 0,
                costPerConversation: 0, costPerFirstReply: 0,
                linkClicks: 1134, landingPageViews: 980, costPerLandingPageView: 1.43,
                videoThruPlays: 0, videoPlays: 0, costPerThruPlay: 0,
              },
              creativeScore: { overall: 82, hookScore: 80, copyScore: 70, performanceScore: 90, fatigueLevel: 'MEDIUM', recommendation: 'SCALE', recommendationText: 'Top performer! Score 82/100. Escale o orçamento em 20-30% e duplique em nova campanha CBO.' },
            },
            {
              id: 'ad_002',
              name: 'Estático — Oferta Relâmpago',
              status: 'ACTIVE',
              adFormat: 'IMAGE' as const,
              creative: {
                id: 'cr_002', name: 'Static_v2',
                title: '⚡ Oferta Relâmpago — Só Hoje',
                body: '50% OFF em todos os produtos. Aproveite!',
                object_type: 'IMAGE',
                image_url: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&q=80',
                effective_object_story_spec: {
                  link_data: {
                    message: '50% OFF em todos os produtos. Aproveite!',
                    name: '⚡ Oferta Relâmpago — Só Hoje',
                    picture: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&q=80',
                  },
                },
              },
              insightsSummary: {
                spend: 1000, impressions: 67500, clicks: 648, reach: 22500,
                frequency: 3.0, ctr: 0.96, cpc: 1.54, cpm: 14.81,
                roas: 3.1, cpa: 41.67, purchases: 24,
                addToCart: 144, viewContent: 480, leads: 0, costPerLead: 0,
                messagesStarted: 0, messagingFirstReply: 0, newMessagingConnections: 0,
                costPerConversation: 0, costPerFirstReply: 0,
                linkClicks: 648, landingPageViews: 540, costPerLandingPageView: 1.85,
                videoThruPlays: 0, videoPlays: 0, costPerThruPlay: 0,
              },
              creativeScore: { overall: 58, hookScore: 64, copyScore: 55, performanceScore: 55, fatigueLevel: 'MEDIUM', recommendation: 'TEST_VARIATION', recommendationText: 'CTR abaixo de 1% com boa amostra. Teste novo gancho visual/headline mantendo o produto.' },
            },
          ],
        },
        {
          id: 'adset_002',
          name: 'LAL 1% Compradores | Feed',
          campaign_id: 'camp_001',
          status: 'ACTIVE',
          billing_event: 'IMPRESSIONS',
          optimization_goal: 'OFFSITE_CONVERSIONS',
          bid_strategy: 'LOWEST_COST_WITHOUT_CAP',
          targeting: {
            age_min: 25, age_max: 55,
            lookalike_audiences: [{ id: 'la_001', name: 'LAL 1% Compradores 180d' }],
            publisher_platforms: ['facebook', 'instagram'],
          },
          insightsSummary: {
            spend: 2400, impressions: 162000, clicks: 1782, reach: 54000,
            frequency: 3.0, ctr: 1.10, cpc: 1.35, cpm: 14.81,
            roas: 3.8, cpa: 40.00, purchases: 60,
            addToCart: 360, viewContent: 1200, leads: 0, costPerLead: 0,
            messagesStarted: 0, messagingFirstReply: 0, newMessagingConnections: 0,
            costPerConversation: 0, costPerFirstReply: 0,
            linkClicks: 1782, landingPageViews: 1510, costPerLandingPageView: 1.59,
            videoThruPlays: 0, videoPlays: 0, costPerThruPlay: 0,
          },
          audienceAnalysis: {
            type: 'LOOKALIKE',
            quality: 'GOOD',
            saturationRisk: 'MEDIUM',
            insights: ['Lookalike baseado em: LAL 1% Compradores 180d', 'Faixa etária: 25–55 anos'],
            recommendations: ['Frequência moderada (3.0x). Prepare novos criativos.'],
          },
          ads: [
            {
              id: 'ad_003',
              name: 'Carrossel Produtos — LAL',
              status: 'ACTIVE',
              adFormat: 'CAROUSEL' as const,
              creative: {
                id: 'cr_003', name: 'Carousel_LAL',
                title: 'Os mais vendidos',
                body: 'Descubra os produtos mais amados pelos nossos clientes.',
                object_type: 'IMAGE',
                effective_object_story_spec: {
                  link_data: {
                    message: 'Descubra os produtos mais amados pelos nossos clientes.',
                    name: 'Os mais vendidos',
                    picture: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80',
                    child_attachments: [
                      { name: 'Produto 1', picture: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80' },
                      { name: 'Produto 2', picture: 'https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=400&q=80' },
                      { name: 'Produto 3', picture: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80' },
                    ],
                  },
                },
              },
              insightsSummary: {
                spend: 2400, impressions: 162000, clicks: 1782, reach: 54000,
                frequency: 3.0, ctr: 1.10, cpc: 1.35, cpm: 14.81,
                roas: 3.8, cpa: 40.00, purchases: 60,
                addToCart: 360, viewContent: 1200, leads: 0, costPerLead: 0,
                messagesStarted: 0, messagingFirstReply: 0, newMessagingConnections: 0,
                costPerConversation: 0, costPerFirstReply: 0,
                linkClicks: 1782, landingPageViews: 1510, costPerLandingPageView: 1.59,
                videoThruPlays: 0, videoPlays: 0, costPerThruPlay: 0,
              },
              creativeScore: { overall: 67, hookScore: 73, copyScore: 58, performanceScore: 67, fatigueLevel: 'MEDIUM', recommendation: 'KEEP', recommendationText: 'Criativo dentro da média. Continue monitorando.' },
            },
          ],
        },
      ],
    },
    {
      id: 'camp_002',
      name: '🔁 [ABO] Retargeting Abandono Carrinho',
      status: 'ACTIVE',
      objective: 'OUTCOME_SALES',
      daily_budget: '20000',
      insightsSummary: {
        spend: 3200,
        impressions: 215000,
        clicks: 2365,
        reach: 71666,
        frequency: 3.0,
        ctr: 1.10,
        cpc: 1.35,
        cpm: 14.88,
        roas: 6.2,
        cpa: 22.86,
        purchases: 140,
        addToCart: 0, viewContent: 0, leads: 0, costPerLead: 0,
        messagesStarted: 0, messagingFirstReply: 0, newMessagingConnections: 0,
        costPerConversation: 0, costPerFirstReply: 0,
        linkClicks: 2365, landingPageViews: 1890, costPerLandingPageView: 1.69,
        videoThruPlays: 0, videoPlays: 0, costPerThruPlay: 0,
      },
      adsets: [
        {
          id: 'adset_003',
          name: 'ATC + Checkout Abandonado — 7d',
          campaign_id: 'camp_002',
          status: 'ACTIVE',
          billing_event: 'IMPRESSIONS',
          optimization_goal: 'OFFSITE_CONVERSIONS',
          targeting: {
            custom_audiences: [{ id: 'ca_001', name: 'Abandono Checkout 7d' }, { id: 'ca_002', name: 'ATC sem Purchase 7d' }],
            age_min: 18, age_max: 65,
          },
          insightsSummary: {
            spend: 3200, impressions: 215000, clicks: 2365, reach: 71666,
            frequency: 3.0, ctr: 1.10, cpc: 1.35, cpm: 14.88,
            roas: 6.2, cpa: 22.86, purchases: 140,
            addToCart: 0, viewContent: 0, leads: 0, costPerLead: 0,
            messagesStarted: 0, messagingFirstReply: 0, newMessagingConnections: 0,
            costPerConversation: 0, costPerFirstReply: 0,
            linkClicks: 2365, landingPageViews: 1890, costPerLandingPageView: 1.69,
            videoThruPlays: 0, videoPlays: 0, costPerThruPlay: 0,
          },
          audienceAnalysis: {
            type: 'RETARGETING',
            quality: 'EXCELLENT',
            saturationRisk: 'MEDIUM',
            insights: ['Público customizado: Abandono Checkout 7d, ATC sem Purchase 7d', 'Retargeting — fundo de funil, alta intent de conversão.'],
            recommendations: ['Frequência moderada (3.0x). Prepare novos criativos.'],
          },
          ads: [
            {
              id: 'ad_004',
              name: 'Urgência — Recuperação Carrinho',
              status: 'ACTIVE',
              adFormat: 'IMAGE' as const,
              creative: {
                id: 'cr_004', name: 'Retargeting_v1',
                title: 'Seu carrinho está esperando',
                body: 'Não perca. Os itens que você escolheu estão quase esgotando. Finalize agora com frete grátis!',
                object_type: 'IMAGE',
                image_url: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=800&q=80',
                effective_object_story_spec: {
                  link_data: {
                    message: 'Não perca. Os itens que você escolheu estão quase esgotando. Finalize agora com frete grátis!',
                    name: 'Seu carrinho está esperando',
                    picture: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=800&q=80',
                  },
                },
              },
              insightsSummary: {
                spend: 3200, impressions: 215000, clicks: 2365, reach: 71666,
                frequency: 3.0, ctr: 1.10, cpc: 1.35, cpm: 14.88,
                roas: 6.2, cpa: 22.86, purchases: 140,
                addToCart: 0, viewContent: 0, leads: 0, costPerLead: 0,
                messagesStarted: 0, messagingFirstReply: 0, newMessagingConnections: 0,
                costPerConversation: 0, costPerFirstReply: 0,
                linkClicks: 2365, landingPageViews: 1890, costPerLandingPageView: 1.69,
                videoThruPlays: 0, videoPlays: 0, costPerThruPlay: 0,
              },
              creativeScore: { overall: 78, hookScore: 73, copyScore: 80, performanceScore: 82, fatigueLevel: 'MEDIUM', recommendation: 'SCALE', recommendationText: 'Bom desempenho mas com sinais de fadiga. Crie variações do gancho/headline mantendo o ângulo.' },
            },
          ],
        },
      ],
    },
    {
      id: 'camp_003',
      name: '⚠️ [ABO] Interesses — Saturada',
      status: 'ACTIVE',
      objective: 'OUTCOME_SALES',
      daily_budget: '30000',
      insightsSummary: {
        spend: 4450,
        impressions: 302000,
        clicks: 1510,
        reach: 60400,
        frequency: 5.0,
        ctr: 0.50,
        cpc: 2.95,
        cpm: 14.73,
        roas: 0.8,
        cpa: 148.33,
        purchases: 30,
        addToCart: 180, viewContent: 600, leads: 0, costPerLead: 0,
        messagesStarted: 0, messagingFirstReply: 0, newMessagingConnections: 0,
        costPerConversation: 0, costPerFirstReply: 0,
        linkClicks: 1510, landingPageViews: 1280, costPerLandingPageView: 3.48,
        videoThruPlays: 0, videoPlays: 0, costPerThruPlay: 0,
      },
      adsets: [
        {
          id: 'adset_004',
          name: 'Interesses Fitness + Saúde | Feed',
          campaign_id: 'camp_003',
          status: 'ACTIVE',
          billing_event: 'IMPRESSIONS',
          optimization_goal: 'OFFSITE_CONVERSIONS',
          targeting: {
            age_min: 18, age_max: 45,
            interests: [
              { id: 'int_001', name: 'Fitness' },
              { id: 'int_002', name: 'Musculação' },
              { id: 'int_003', name: 'Dieta' },
              { id: 'int_004', name: 'Bem-estar' },
              { id: 'int_005', name: 'Suplementos alimentares' },
              { id: 'int_006', name: 'Vida saudável' },
              { id: 'int_007', name: 'Perda de peso' },
            ],
            publisher_platforms: ['facebook'],
          },
          insightsSummary: {
            spend: 4450, impressions: 302000, clicks: 1510, reach: 60400,
            frequency: 5.0, ctr: 0.50, cpc: 2.95, cpm: 14.73,
            roas: 0.8, cpa: 148.33, purchases: 30,
            addToCart: 180, viewContent: 600, leads: 0, costPerLead: 0,
            messagesStarted: 0, messagingFirstReply: 0, newMessagingConnections: 0,
            costPerConversation: 0, costPerFirstReply: 0,
            linkClicks: 1510, landingPageViews: 1280, costPerLandingPageView: 3.48,
            videoThruPlays: 0, videoPlays: 0, costPerThruPlay: 0,
          },
          audienceAnalysis: {
            type: 'INTEREST',
            quality: 'FAIR',
            saturationRisk: 'HIGH',
            insights: ['Interesses: Fitness, Musculação, Dieta, Bem-estar, Suplementos alimentares, Vida saudável, Perda de peso', 'Plataformas: facebook'],
            recommendations: [
              '⚠️ Frequência crítica (5.0x). Público saturado — troque os criativos imediatamente.',
              'Muitos interesses empilhados. Teste grupos menores e separados para isolar performance.',
              'Considere incluir Instagram — CPM geralmente menor para públicos visuais.',
            ],
          },
          ads: [
            {
              id: 'ad_005',
              name: 'Estático Antigo v1 — 45 dias rodando',
              status: 'ACTIVE',
              adFormat: 'IMAGE' as const,
              creative: {
                id: 'cr_005', name: 'Static_Old',
                title: 'Produto X em Oferta',
                body: 'Compre agora.',
                object_type: 'IMAGE',
                image_url: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800&q=80',
                effective_object_story_spec: {
                  link_data: {
                    message: 'Compre agora.',
                    name: 'Produto X em Oferta',
                    picture: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800&q=80',
                  },
                },
              },
              insightsSummary: {
                spend: 4450, impressions: 302000, clicks: 1510, reach: 60400,
                frequency: 5.0, ctr: 0.50, cpc: 2.95, cpm: 14.73,
                roas: 0.8, cpa: 148.33, purchases: 30,
                addToCart: 180, viewContent: 600, leads: 0, costPerLead: 0,
                messagesStarted: 0, messagingFirstReply: 0, newMessagingConnections: 0,
                costPerConversation: 0, costPerFirstReply: 0,
                linkClicks: 1510, landingPageViews: 1280, costPerLandingPageView: 3.48,
                videoThruPlays: 0, videoPlays: 0, costPerThruPlay: 0,
              },
              creativeScore: { overall: 18, hookScore: 33, copyScore: 20, performanceScore: 8, fatigueLevel: 'CRITICAL', recommendation: 'PAUSE', recommendationText: 'Frequência crítica (5.0x). Pause imediatamente e substitua por novo criativo. ROAS abaixo de 1x — campanha gerando prejuízo.' },
            },
          ],
        },
      ],
    },
  ],
};

// ============================================================
// DEMO RESPONSES — Respostas simuladas do agente
// ============================================================

function getCurrentContextSummary(): string {
  return `
**Conta:** Loja Demo | **Período:** Últimos 30 dias | **Modo:** E-commerce
**Gasto Total:** R$ 12.450,80 | **ROAS Global:** 3.4x | **CPA:** R$ 41,50
**CTR:** 1.10% | **Frequência:** 3.0x | **Campanhas Ativas:** 3
  `;
}

const DEMO_RESPONSES: Record<string, string> = {
  '/fullaudit': `## 📊 AUDITORIA COMPLETA — Loja Demo
${getCurrentContextSummary()}

---

### 🏆 RESUMO EXECUTIVO

A conta apresenta performance **heterogênea**: uma campanha de retargeting excelente (ROAS 6.2x), uma campanha de prospecção saudável (4.2x) e uma campanha de interesses em colapso total (ROAS 0.8x) consumindo R$ 4.450 em prejuízo.

**A prioridade #1 é parar o bleeding da campanha de interesses AGORA.**

---

### 📢 ANÁLISE POR CAMPANHA

| Campanha | Gasto | ROAS | CPA | CTR | Freq. | Status |
|---|---|---|---|---|---|---|
| 🚀 CBO Prospecção Broad | R$ 4.800 | **4.2x** ✅ | R$ 34,28 | 1.10% | 3.0x | Saudável |
| 🔁 ABO Retargeting Carrinho | R$ 3.200 | **6.2x** 🚀 | R$ 22,86 | 1.10% | 3.0x | Top Performer |
| ⚠️ ABO Interesses Fitness | R$ 4.450 | **0.8x** 🔴 | R$ 148,33 | 0.50% | 5.0x | CRÍTICO |

---

### 🔴 P1 — URGENTE (Fazer Hoje)

1. **PAUSAR** imediatamente o AdSet "Interesses Fitness + Saúde"
   - ROAS de **0.8x = prejuízo de R$ 890** no período
   - Frequência **5.0x** = público completamente saturado
   - CTR **0.50%** = criativo morto
   - **Ação**: Pause a campanha e redirecione o orçamento para o CBO de Prospecção

2. **ESCALAR** o anúncio "UGC Produto — Gancho Dor/Solução" (Score 82/100)
   - ROAS **5.2x**, CPA **R$ 23,33** — melhor performer da conta
   - Aumente o orçamento do AdSet Broad em +25% hoje
   - Duplique este anúncio em uma nova campanha CBO dedicada

---

### 🟡 P2 — Esta Semana

3. **Criar novos criativos** para o AdSet LAL 1% Compradores
   - ROAS 3.8x é bom, mas frequência 3.0x indica necessidade de rotação
   - Teste 3 novos hooks baseados no winning UGC: ângulo "depoimento", ângulo "antes/depois", ângulo "urgência"

4. **Expandir retargeting** — a campanha está performando 6.2x mas com apenas R$ 3.200 gastos
   - Amplie a janela de retargeting de 7d para 14d/30d
   - Adicione público de "Visualizadores de vídeo 75%" para expandir o BOF

---

### 🟢 P3 — Este Mês

5. **Testar Advantage+ Shopping Campaign (ASC)**
   - Com histórico de 300 compras/mês, a conta está elegível para ASC
   - Teste com 20% do orçamento total durante 2 semanas

6. **Implementar segmentação por gênero e ticket** no retargeting
   - Clientes com carrinho > R$ 200 merecem oferta mais agressiva (cupom exclusivo)

---

### 🎯 PRÓXIMOS PASSOS:
1. ⏸️ **Pausar** camp "Interesses Fitness" → **Economiza R$ 148/dia**
2. 📈 **Escalar** UGC winner +25% orçamento → **Potencial +R$ 5.000 em receita**
3. 🔄 **Criar 3 variações** do criativo winner esta semana
4. 📊 Revisar em 72h após as mudanças`,

  '/bleeding': `## 🩸 DIAGNÓSTICO DE BLEEDING — Onde Está Indo Seu Dinheiro

### Resumo dos Vazamentos Identificados

| AdSet / Anúncio | Gasto | ROAS | Perda Estimada | Ação |
|---|---|---|---|---|
| Interesses Fitness — Estático v1 | **R$ 4.450** | 0.8x | **~R$ 890** | ⏸️ PAUSAR JÁ |
| Estático "Oferta Relâmpago" | R$ 1.000 | 3.1x | Marginal | 🔄 Testar variação |

---

### 🔴 BLEEDING CRÍTICO: Campanha de Interesses (R$ 4.450)

**Por que está sangrando:**
- **ROAS 0.8x**: Para cada R$ 1,00 investido, retorna R$ 0,80 → **prejuízo real**
- **Frequência 5.0x**: Cada pessoa viu o mesmo anúncio 5 vezes e não comprou
- **CTR 0.50%**: Benchmark mínimo é 1% — este criativo não atrai cliques
- **CPC R$ 2,95**: Quase o dobro das campanhas saudáveis da conta (R$ 1,35)
- **45+ dias rodando** sem otimização: a Meta já explorou todo o potencial deste público

**Impacto:** R$ 4.450 gastos com ROAS 0.8x = **R$ 890 de prejuízo líquido**

**Ação imediata:** Pause **agora**. Não amanhã.

---

### 🟡 BLEEDING MODERADO: Estático "Oferta Relâmpago"

- CTR **0.96%** — abaixo de 1%, não está performando bem o suficiente
- ROAS **3.1x** — rentável mas bem abaixo do UGC winner (5.2x) do mesmo AdSet
- Recomendação: teste uma variação com novo headline antes de pausar

---

### 💰 Orçamento Recuperável

Se pausar o bleeding hoje: **+R$ 148/dia** disponível para realocar para o que já funciona.

### 🎯 PRÓXIMOS PASSOS:
1. ⏸️ Pause "Interesses Fitness" → R$ 148/dia economizados
2. 📈 Redirecione para CBO Broad (ROAS 4.2x) → Escale em +30%
3. 🔄 Crie 2 novos criativos para substituir os pausados`,

  '/criativos': `## 🖼️ RANKING DE CRIATIVOS — Análise Completa

### Scorecard de Todos os Anúncios

| # | Anúncio | Score | Hook | Perf. | Fadiga | Recomendação |
|---|---|---|---|---|---|---|
| 🥇 | UGC Produto — Dor/Solução | **82/100** | 80 | 90 | Média | 📈 ESCALAR |
| 🥈 | Urgência — Recuperação Carrinho | **78/100** | 73 | 82 | Média | 📈 ESCALAR |
| 🥉 | Carrossel Produtos — LAL | **67/100** | 73 | 67 | Média | ✅ MANTER |
| 4 | Estático — Oferta Relâmpago | **58/100** | 64 | 55 | Média | 🔄 VARIAÇÃO |
| 5 | Estático Antigo v1 | **18/100** | 33 | 8 | 🔴 CRÍTICA | ⏸️ PAUSAR |

---

### 🚀 TOP 1: UGC "Gancho Dor/Solução" — Score 82/100

**Por que está ganhando:**
- CTR **1.20%** → melhor hook da conta
- ROAS **5.2x** → o mais lucrativo de todos
- CPA **R$ 23,33** → 44% abaixo da média da conta
- Copy eficiente: pergunta de dor + prova social + urgência no frete

**Ação:** Aumente o orçamento do AdSet em +25% (sem reiniciar aprendizado). Duplique em nova campanha CBO.

---

### 🔴 BOTTOM 1: Estático Antigo v1 — Score 18/100

**Por que está morrendo:**
- CTR **0.50%** → 2.4x abaixo do benchmark
- Frequência **5.0x** → cada pessoa já ignorou 5 vezes
- ROAS **0.8x** → prejuízo
- Copy genérico: "Produto X em Oferta. Compre agora." — sem gancho, sem benefício, sem urgência

**Ação:** Pause imediatamente. Substitua por variações do criativo UGC vencedor.

---

### 💡 Recomendações de Novos Criativos

Baseado no winner (UGC Dor/Solução), teste estas variações:

1. **Hook Curiosidade**: *"O que aconteceu com meu [problema] depois de 30 dias usando..."*
2. **Hook Prova Social**: *"10.847 clientes não podem estar errados. Veja o que dizem:"*
3. **Hook Antes/Depois**: Mostre a transformação visual em 3 segundos
4. **Hook Urgência Real**: *"Só restam X unidades. Frete grátis até meia-noite."*

### 🎯 PRÓXIMOS PASSOS:
1. ⏸️ Pausar Estático Antigo v1
2. 📈 Escalar UGC winner +25% orçamento
3. 🎨 Produzir 3 variações de hook para próxima semana`,

  '/publicos': `## 👥 ANÁLISE DE PÚBLICOS — Todos os Conjuntos de Anúncios

### Visão Geral

| Tipo | Qtd | ROAS Médio | Frequência Média | Saturação |
|---|---|---|---|---|
| Retargeting | 1 | **6.2x** | 3.0x | Médio |
| Advantage+ | 1 | 4.5x | 3.0x | Médio |
| Lookalike | 1 | 3.8x | 3.0x | Médio |
| Interesses | 1 | **0.8x** | **5.0x** | 🔴 Alto |

---

### 🏆 Melhor Público: Retargeting (ATC + Checkout Abandonado 7d)

- **ROAS 6.2x** — o melhor da conta
- Fundo de funil puro: estas pessoas já demonstraram intenção de compra
- **Oportunidade:** Amplie para janela de 14d e 30d para capturar mais volume

---

### ⚡ Advantage+ Audience (Broad)

- ROAS 4.5x — sólido
- A Meta está otimizando automaticamente — não retire as restrições
- Frequência 3.0x — monitore de perto esta semana
- **Oportunidade:** Adicione exclusão dos compradores dos últimos 30 dias para evitar desperdício

---

### 👥 Lookalike 1% Compradores

- ROAS 3.8x — bom, mas pode melhorar
- **Dica:** Tente criar LAL baseado nos compradores de **alto valor** (acima do ticket médio) — a qualidade da seed list impacta diretamente o ROAS
- Frequência 3.0x — prepare novos criativos

---

### 🔴 CRÍTICO: Público de Interesses (Fitness/Saúde)

**Problema:** Frequência **5.0x** com 7 interesses empilhados é uma combinação destruidora:
- 7 interesses = público fragmentado, difícil para o algoritmo otimizar
- Frequência alta = as pessoas cansaram do anúncio
- ROAS 0.8x = estas pessoas nunca vão comprar neste formato

**Solução se quiser testar interesses futuramente:**
- Separe os 7 interesses em 3-4 AdSets diferentes
- Máximo 3 interesses por AdSet
- Use exclusão de visitantes do site para não mostrar para quem já conhece

### 🎯 PRÓXIMOS PASSOS:
1. ⏸️ Pause o AdSet de Interesses Fitness
2. 📬 Crie novo LAL baseado em compradores de high-value
3. ➕ Expanda retargeting para 14d/30d para capturar mais volume`,

  '/escala': `## 📈 PLANO DE ESCALA — Oportunidades Identificadas

### Potencial de Escala Disponível

| Oportunidade | Orçamento Atual | Escala Sugerida | ROAS Esperado | Receita Adicional Est. |
|---|---|---|---|---|
| UGC Winner → Nova CBO | R$ 1.400 | +R$ 2.000/mês | ~5.0x | **+R$ 10.000** |
| CBO Broad → Escala Vertical | R$ 4.800 | +30% | ~4.0x | **+R$ 5.760** |
| Expand Retargeting 14d/30d | R$ 3.200 | +50% | ~5.5x | **+R$ 8.800** |

---

### 🚀 ESCALA 1: Duplicar o UGC Winner em Nova Campanha CBO

**Por que funciona:**
- Anúncio com ROAS 5.2x e Score 82/100 tem headroom para escalar
- Criar nova campanha CBO isolada protege o aprendizado do AdSet atual
- A nova campanha começa com o criativo já validado

**Como fazer (passo a passo):**
1. Crie nova campanha CBO com objetivo de Compras
2. Crie 3 AdSets: Broad, LAL 1%, LAL 2-5%
3. Adicione **apenas** o anúncio UGC winner nos 3 AdSets
4. Budget inicial: R$ 150/dia na nova CBO
5. Não edite por 7 dias — deixe o aprendizado acontecer
6. Após 7 dias: se ROAS > 3x, escale +20%/semana

---

### 📈 ESCALA 2: Vertical na CBO Broad Existente

**Regra de ouro:** Máximo +20-30% a cada 3-4 dias

- Hoje: R$ 4.800/mês → Aumente para R$ 6.240/mês
- Em 4 dias: se ROAS mantiver > 3x, aumente mais +20%
- **NUNCA** aumente mais de 30% de uma vez — reinicia o aprendizado

---

### 💰 ESCALA 3: Expandir Janela de Retargeting

- Atual: só retargeting 7 dias (R$ 3.200/mês, ROAS 6.2x)
- Adicione: retargeting 14 dias e 30 dias em AdSets separados (ABO)
- Estimativa: 2-3x mais volume com ROAS similar

---

### ⚠️ Regras de Escala que Você NÃO Deve Quebrar

- ❌ Não edite targeting, bid ou criativo durante escalada
- ❌ Não aumente mais de 30% de uma vez
- ❌ Não pause e reative AdSets que estão escalando
- ✅ Escale apenas o que está com ROAS > meta há +7 dias

### 🎯 PRÓXIMOS PASSOS:
1. 📋 Crie nova CBO com UGC winner (hoje)
2. 💰 Aumente CBO Broad em +30% (amanhã)
3. ➕ Crie 2 novos AdSets de retargeting 14d/30d (esta semana)
4. 📊 Revise tudo em 7 dias antes de escalar mais`,

  '/funil': `## 🔽 ANÁLISE DO FUNIL DE CONVERSÃO

### Funil Completo da Conta (Últimos 30 dias)

| Etapa | Volume | Taxa de Conversão | Benchmark | Status |
|---|---|---|---|---|
| Impressões | 841.200 | — | — | — |
| Cliques (Link) | 9.253 | **1.10% CTR** | >1% | ✅ OK |
| Landing Page Views | 7.820 | **84.5% do clique** | >80% | ✅ OK |
| View Content | 6.100 | **78% do LPV** | >60% | ✅ OK |
| Add to Cart | 1.840 | **30.2% do VC** | 5-15% | ✅ Acima da média |
| Purchase | 300 | **16.3% do ATC** | 15-25% | ✅ OK |

---

### ✅ Ponto Positivo: Funil Saudável no Geral

A taxa ATC→Purchase (16.3%) está dentro do benchmark. O maior volume de perda está no topo do funil, que é normal.

---

### 🔴 Gargalo Identificado: Frequência Alta = Saturação de Topo

O funil parece saudável porque as campanhas de sucesso (CBO Broad + Retargeting) sustentam os números. Porém a campanha de Interesses está **destruindo** o funil com CTR 0.50%:

- Se remover a campanha de Interesses, o CTR global sobe de 1.10% para **~1.40%**
- Isso representa ~2.500 cliques extras/mês sem gastar mais

---

### 📊 Análise por Segmento de Funil

**TOF (Topo) - Prospecção CBO:**
- CTR 1.10% → normal para cold traffic
- LPV/Clique: 84.5% → página de destino carregando rápido ✅
- **Oportunidade**: Melhorar hook dos criativos para chegar a 1.5%+ de CTR

**BOF (Fundo) - Retargeting:**
- ROAS 6.2x → funil de fechamento muito eficiente
- Significa que sua página de vendas converte bem quando há intenção
- **Oportunidade**: Aumentar o volume de pessoas chegando ao BOF (escalar TOF)

---

### 💡 Onde Estão as Maiores Oportunidades

1. **Aumentar CTR de 1.10% para 1.5%** → +3.700 cliques/mês sem gastar mais
2. **Melhorar taxa VC→ATC de 30% para 40%** → +600 carrinhos/mês
3. **Ampliar janela de retargeting** → mais volume chegando ao BOF

### 🎯 PRÓXIMOS PASSOS:
1. 🎨 Novo hook mais forte → meta: CTR 1.5%
2. 🛒 Revise a experiência de adicionar ao carrinho → taxa ATC pode melhorar
3. ↔️ Teste novos ângulos criativos no LPV para aumentar a profundidade de intenção`,
};

function matchDemoResponse(message: string): string | null {
  const msg = message.toLowerCase().trim();

  // Exact command matches
  if (msg === '/fullaudit' || msg.includes('audit') || msg.includes('auditoria completa')) return DEMO_RESPONSES['/fullaudit'];
  if (msg === '/bleeding' || msg.includes('bleeding') || msg.includes('vazando') || msg.includes('desperdiç')) return DEMO_RESPONSES['/bleeding'];
  if (msg === '/criativos' || msg.includes('criativ') || msg.includes('anúncio') || msg.includes('ranking')) return DEMO_RESPONSES['/criativos'];
  if (msg === '/publicos' || msg.includes('público') || msg.includes('audiênci') || msg.includes('targeting')) return DEMO_RESPONSES['/publicos'];
  if (msg === '/escala' || msg.includes('escal') || msg.includes('scale')) return DEMO_RESPONSES['/escala'];
  if (msg === '/funil' || msg.includes('funil') || msg.includes('conversão') || msg.includes('atc') || msg.includes('checkout')) return DEMO_RESPONSES['/funil'];

  return null;
}

const GENERIC_DEMO_RESPONSES = [
  `Com base nos dados da conta demo, posso ver que você tem **3 campanhas ativas** com performance bem diferente:

- 🚀 **CBO Prospecção Broad**: ROAS 4.2x — saudável ✅
- 🔁 **Retargeting Carrinho**: ROAS 6.2x — top performer 🚀
- ⚠️ **Interesses Fitness**: ROAS 0.8x — em prejuízo 🔴

**Minha recomendação principal:** Pause imediatamente a campanha de Interesses (R$ 148/dia desperdiçados) e redirecione para o que já funciona.

Quer uma análise mais específica? Use **/fullaudit** para o relatório completo ou **/bleeding** para ver exatamente onde o dinheiro está vazando.`,

  `Boa pergunta. Analisando os dados disponíveis:

**CTR global de 1.10%** está na média, mas a frequência de **3.0x** está subindo — você precisará de novos criativos nas próximas 2 semanas.

O criativo que mais se destaca é o **UGC "Gancho Dor/Solução"** com Score 82/100 e ROAS 5.2x. É o único que deve ser escalado agora.

Use **/criativos** para ver o ranking completo de todos os anúncios com scorecard detalhado.`,

  `Para otimizar essa campanha especificamente, precisaria examinar as métricas em detalhes.

Com o que vejo nos dados:
- **ROAS global 3.4x** — a conta é rentável, mas tem uma campanha puxando para baixo
- **CPA R$ 41,50** — aceitável dependendo do seu ticket médio
- **Frequência 3.0x** — no limite aceitável, ação preventiva necessária

Qual é o ticket médio do seu produto? Isso me ajuda a avaliar se o CPA está dentro do que é saudável para o seu negócio.`,
];

let genericResponseIndex = 0;

export function getDemoResponse(message: string): string {
  const matched = matchDemoResponse(message);
  if (matched) return matched;

  // Rotate through generic responses
  const response = GENERIC_DEMO_RESPONSES[genericResponseIndex % GENERIC_DEMO_RESPONSES.length];
  genericResponseIndex++;
  return response;
}
