import type {
  MetaConfig,
  MetaApiResponse,
  Campaign,
  AdSet,
  Ad,
  AdCreative,
  Insights,
  InsightsSummary,
  AdAccount,
  CreativeScore,
  AudienceAnalysis,
  DatePreset,
  TargetingSpec,
  CampaignMode,
} from './metaTypes';

const BASE_URL = 'https://graph.facebook.com';
const DEFAULT_API_VERSION = 'v21.0';

// ---- Token Exchange ----
export async function exchangeForLongLivedToken(
  shortToken: string,
  appId: string,
  appSecret: string
): Promise<string> {
  const url = new URL(`${BASE_URL}/oauth/access_token`);
  url.searchParams.set('grant_type', 'fb_exchange_token');
  url.searchParams.set('client_id', appId);
  url.searchParams.set('client_secret', appSecret);
  url.searchParams.set('fb_exchange_token', shortToken);
  const res = await fetch(url.toString());
  const json = await res.json();
  if (json.error) throw new Error(`[${json.error.code}] ${json.error.message}`);
  return json.access_token as string;
}

// ---- Utility ----
function parseNumber(val: string | undefined): number {
  return val ? parseFloat(val) : 0;
}

function getActionValue(
  actions: { action_type: string; value: string }[] | undefined,
  ...types: string[]
): number {
  if (!actions) return 0;
  for (const type of types) {
    const action = actions.find((a) => a.action_type === type);
    if (action) return parseFloat(action.value);
  }
  return 0;
}

function getSizeFromImageUrl(url: string | undefined): { width: number; height: number } | undefined {
  if (!url) return undefined;
  try {
    const parsed = new URL(url);
    const stp = parsed.searchParams.get('stp');
    if (stp) {
      const match = stp.match(/p(\d+)x(\d+)/i);
      if (match) {
        const width = Number.parseInt(match[1], 10);
        const height = Number.parseInt(match[2], 10);
        if (Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0) {
          return { width, height };
        }
      }
    }
  } catch {
    // ignore malformed URL
  }
  return undefined;
}

function isLikelyForcedSquareCrop(url: string | undefined): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    const stp = parsed.searchParams.get('stp') || '';
    const hasCenterCrop = stp.includes('c0.5000x0.5000f');
    if (!hasCenterCrop) return false;

    const size = getSizeFromImageUrl(url);
    if (!size) return false;
    return size.width === size.height;
  } catch {
    return false;
  }
}

function isLikelyTinyCreativePreview(url: string | undefined): boolean {
  const size = getSizeFromImageUrl(url);
  if (!size) return false;

  const minSide = Math.min(size.width, size.height);
  const ratio = size.width / size.height;
  return minSide <= 120 || ratio >= 8 || ratio <= 0.125;
}

function scoreAdImageCandidate(image: { width?: number; height?: number }): number {
  const w = image.width || 0;
  const h = image.height || 0;
  if (w <= 0 || h <= 0) return 0;

  const ratio = w / h;
  const area = w * h;
  const minSide = Math.min(w, h);

  let score = Math.log2(area);
  score += Math.log2(minSide);
  score -= Math.abs(Math.log(ratio)) * 2.2;

  if (ratio > 5 || ratio < 0.2) score -= 8;
  else if (ratio > 3 || ratio < 0.333) score -= 3;

  return score;
}

// ---- Summarize raw insights ----
export function summarizeInsights(data: Insights[]): InsightsSummary {
  if (!data || data.length === 0) {
    return {
      spend: 0, impressions: 0, clicks: 0, reach: 0, frequency: 0,
      ctr: 0, cpc: 0, cpm: 0,
      roas: 0, cpa: 0, purchases: 0, addToCart: 0, viewContent: 0,
      leads: 0, costPerLead: 0,
      messagesStarted: 0, messagingFirstReply: 0, newMessagingConnections: 0,
      costPerConversation: 0, costPerFirstReply: 0,
      linkClicks: 0, landingPageViews: 0, costPerLandingPageView: 0,
      videoThruPlays: 0, videoPlays: 0, costPerThruPlay: 0,
    };
  }

  const d = data[0];
  const spend = parseNumber(d.spend);

  // ---- E-commerce ----
  const purchases = getActionValue(d.actions, 'purchase', 'omni_purchase');
  const purchaseValue = getActionValue(d.action_values, 'purchase', 'omni_purchase');
  const roasArr = d.purchase_roas;
  const roas = roasArr && roasArr.length > 0
    ? parseFloat(roasArr[0].value)
    : (spend > 0 && purchaseValue > 0 ? purchaseValue / spend : 0);
  const addToCart = getActionValue(d.actions, 'add_to_cart', 'omni_add_to_cart');
  const viewContent = getActionValue(d.actions, 'view_content', 'omni_view_content');

  // ---- Leads ----
  const leads = getActionValue(d.actions, 'lead', 'complete_registration', 'submit_application');
  const costPerLead = leads > 0 ? spend / leads : 0;

  // ---- WhatsApp / Messaging ----
  const messagesStarted = getActionValue(
    d.actions,
    'onsite_conversion.total_messaging_connection',
    'onsite_conversion.messaging_conversation_started_7d',
    'messaging_conversation_started_7d'
  );
  const messagingFirstReply = getActionValue(
    d.actions,
    'onsite_conversion.messaging_first_reply',
    'onsite_conversion.messaging_welcome_message_view'
  );
  const newMessagingConnections = getActionValue(
    d.actions,
    'onsite_conversion.messaging_conversation_started_7d',
    'onsite_conversion.total_messaging_connection'
  );
  const costPerConversation = messagesStarted > 0 ? spend / messagesStarted : 0;
  const costPerFirstReply = messagingFirstReply > 0 ? spend / messagingFirstReply : 0;

  // ---- Traffic ----
  const linkClicks = getActionValue(d.actions, 'link_click');
  const landingPageViews = getActionValue(d.actions, 'landing_page_view');
  const costPerLandingPageView = landingPageViews > 0 ? spend / landingPageViews : 0;

  // ---- Video ----
  const videoThruPlays = getActionValue(
    d.video_thruplay_watched_actions,
    'video_view'
  ) || getActionValue(d.actions, 'video_thruplay_watched');
  const videoPlays = getActionValue(d.video_play_actions, 'video_view') || getActionValue(d.actions, 'video_play');
  const costPerThruPlay = videoThruPlays > 0 ? spend / videoThruPlays : 0;

  return {
    spend,
    impressions: parseNumber(d.impressions),
    clicks: parseNumber(d.clicks),
    reach: parseNumber(d.reach),
    frequency: parseNumber(d.frequency),
    ctr: parseNumber(d.ctr),
    cpc: parseNumber(d.cpc),
    cpm: parseNumber(d.cpm),
    roas,
    cpa: purchases > 0 ? spend / purchases : 0,
    purchases,
    addToCart,
    viewContent,
    leads,
    costPerLead,
    messagesStarted,
    messagingFirstReply,
    newMessagingConnections,
    costPerConversation,
    costPerFirstReply,
    linkClicks,
    landingPageViews,
    costPerLandingPageView,
    videoThruPlays,
    videoPlays,
    costPerThruPlay,
  };
}

// ---- Audience Analysis ----
export function analyzeAudience(
  targeting: TargetingSpec | undefined,
  insights: InsightsSummary | undefined
): AudienceAnalysis {
  if (!targeting) {
    return {
      type: 'BROAD', quality: 'FAIR', saturationRisk: 'LOW',
      insights: ['Targeting não disponível.'], recommendations: [],
    };
  }

  let type: AudienceAnalysis['type'] = 'BROAD';
  const insights_list: string[] = [];
  const recommendations: string[] = [];

  if (targeting.is_advantage_plus_audience || targeting.advantage_audience) {
    type = 'ADVANTAGE_PLUS';
    insights_list.push('Usando Advantage+ Audience — targeting automático pela Meta.');
    recommendations.push('Monitore o CPM e a métrica principal. Se deteriorar após 2 semanas, teste controle manual.');
  } else if (targeting.custom_audiences && targeting.custom_audiences.length > 0) {
    const names = targeting.custom_audiences.map((a) => a.name).join(', ');
    if (targeting.lookalike_audiences && targeting.lookalike_audiences.length > 0) {
      type = 'LOOKALIKE';
      insights_list.push(`Lookalike baseado em: ${targeting.lookalike_audiences.map((l) => l.name).join(', ')}`);
    } else {
      type = 'RETARGETING';
      insights_list.push(`Público customizado: ${names}`);
    }
  } else if (targeting.interests && targeting.interests.length > 0) {
    type = 'INTEREST';
    insights_list.push(`Interesses: ${targeting.interests.map((i) => i.name).join(', ')}`);
    if (targeting.interests.length > 5) {
      recommendations.push('Muitos interesses empilhados. Teste grupos menores e separados para isolar performance.');
    }
  }

  if (targeting.age_min !== undefined && targeting.age_max !== undefined) {
    insights_list.push(`Faixa etária: ${targeting.age_min}–${targeting.age_max} anos`);
    if ((targeting.age_max - targeting.age_min) < 10) {
      recommendations.push('Faixa etária muito estreita. Considere ampliar e deixar o algoritmo otimizar.');
    }
  }
  if (targeting.genders?.length === 1) {
    insights_list.push(`Gênero: ${targeting.genders[0] === 1 ? 'Masculino' : 'Feminino'}`);
  }
  if (targeting.publisher_platforms) {
    insights_list.push(`Plataformas: ${targeting.publisher_platforms.join(', ')}`);
    if (!targeting.publisher_platforms.includes('instagram')) {
      recommendations.push('Considere incluir Instagram — CPM geralmente menor para públicos visuais.');
    }
  }

  let saturationRisk: AudienceAnalysis['saturationRisk'] = 'LOW';
  if (insights) {
    if (insights.frequency > 4) {
      saturationRisk = 'HIGH';
      recommendations.push(`⚠️ Frequência crítica (${insights.frequency.toFixed(1)}x). Público saturado — troque os criativos imediatamente.`);
    } else if (insights.frequency > 2.5) {
      saturationRisk = 'MEDIUM';
      recommendations.push(`Frequência moderada (${insights.frequency.toFixed(1)}x). Prepare novos criativos.`);
    }
  }

  let quality: AudienceAnalysis['quality'] = 'FAIR';
  if (type === 'RETARGETING') { quality = 'EXCELLENT'; insights_list.push('Retargeting — fundo de funil, alta intent de conversão.'); }
  else if (type === 'LOOKALIKE') { quality = 'GOOD'; insights_list.push('Lookalike — prospecção qualificada.'); }
  else if (type === 'ADVANTAGE_PLUS') { quality = 'GOOD'; }
  else if (type === 'BROAD') { quality = 'FAIR'; insights_list.push('Público amplo — dependente do algoritmo.'); }

  return { type, quality, saturationRisk, insights: insights_list, recommendations };
}

// ---- Creative Score ----
export function scoreCreative(
  ad: Ad,
  insights: InsightsSummary | undefined,
  mode: CampaignMode = 'ecommerce'
): CreativeScore {
  if (!insights || insights.impressions === 0) {
    return {
      overall: 0, hookScore: 0, copyScore: 50, performanceScore: 0,
      fatigueLevel: 'LOW', recommendation: 'KEEP', recommendationText: 'Sem dados suficientes para avaliar.',
    };
  }

  const hookScore = Math.min(100, (insights.ctr / 3) * 100);

  // Performance score varia por modo
  let performanceScore = 50;
  if (mode === 'ecommerce') {
    if (insights.roas > 4) performanceScore = 95;
    else if (insights.roas > 3) performanceScore = 80;
    else if (insights.roas > 2) performanceScore = 65;
    else if (insights.roas > 1) performanceScore = 40;
    else if (insights.roas > 0) performanceScore = 20;
  } else if (mode === 'whatsapp') {
    // Custo por conversa: <R$10 excelente, <R$20 bom, <R$40 médio
    const cpc = insights.costPerConversation;
    if (cpc > 0 && cpc < 10) performanceScore = 95;
    else if (cpc < 20) performanceScore = 80;
    else if (cpc < 40) performanceScore = 60;
    else if (cpc < 80) performanceScore = 35;
    else if (cpc >= 80) performanceScore = 15;
    else performanceScore = Math.min(90, hookScore * 1.1); // fallback por CTR
  } else if (mode === 'leads') {
    const cpl = insights.costPerLead;
    if (cpl > 0 && cpl < 15) performanceScore = 95;
    else if (cpl < 30) performanceScore = 80;
    else if (cpl < 60) performanceScore = 60;
    else if (cpl < 100) performanceScore = 35;
    else if (cpl >= 100) performanceScore = 15;
    else performanceScore = Math.min(90, hookScore);
  } else if (mode === 'traffic') {
    const cplpv = insights.costPerLandingPageView;
    if (cplpv > 0 && cplpv < 0.5) performanceScore = 95;
    else if (cplpv < 1) performanceScore = 80;
    else if (cplpv < 2) performanceScore = 60;
    else if (cplpv < 4) performanceScore = 40;
    else performanceScore = Math.min(90, hookScore);
  } else {
    // awareness: CPM como proxy
    if (insights.cpm < 10) performanceScore = 95;
    else if (insights.cpm < 18) performanceScore = 80;
    else if (insights.cpm < 30) performanceScore = 60;
    else performanceScore = 35;
  }

  // Copy Score
  const creative = ad.creative;
  let copyScore = 50;
  if (creative) {
    const body = creative.body || creative.effective_object_story_spec?.link_data?.message || '';
    const title = creative.title || creative.effective_object_story_spec?.link_data?.name || '';
    if (body.length > 100) copyScore += 15;
    if (title.length > 10) copyScore += 10;
    if (body.includes('!') || body.includes('?')) copyScore += 10;
    copyScore = Math.min(100, copyScore);
  }

  const overall = Math.round(hookScore * 0.4 + performanceScore * 0.45 + copyScore * 0.15);

  let fatigueLevel: CreativeScore['fatigueLevel'] = 'LOW';
  if (insights.frequency > 5) fatigueLevel = 'CRITICAL';
  else if (insights.frequency > 3.5) fatigueLevel = 'HIGH';
  else if (insights.frequency > 2.5) fatigueLevel = 'MEDIUM';

  let recommendation: CreativeScore['recommendation'] = 'KEEP';
  let recommendationText = 'Criativo dentro da média. Continue monitorando.';

  if (fatigueLevel === 'CRITICAL') {
    recommendation = 'PAUSE';
    recommendationText = `Frequência crítica (${insights.frequency.toFixed(1)}x). Pause imediatamente e substitua por novo criativo.`;
  } else if (overall >= 75 && fatigueLevel === 'LOW') {
    recommendation = 'SCALE';
    recommendationText = `Top performer! Score ${overall}/100. Escale o orçamento em 20-30% e duplique em nova campanha CBO.`;
  } else if (overall >= 75 && fatigueLevel === 'MEDIUM') {
    recommendation = 'TEST_VARIATION';
    recommendationText = `Bom desempenho mas com sinais de fadiga. Crie variações do gancho/headline mantendo o ângulo.`;
  } else if (overall < 40) {
    recommendation = 'PAUSE';
    recommendationText = `Score baixo (${overall}/100). Pause e teste novo ângulo criativo.`;
  } else if (insights.ctr < 1 && insights.impressions > 5000) {
    recommendation = 'TEST_VARIATION';
    recommendationText = `CTR abaixo de 1% com boa amostra. Teste novo gancho visual/headline.`;
  }

  return { overall, hookScore: Math.round(hookScore), copyScore: Math.round(copyScore), performanceScore: Math.round(performanceScore), fatigueLevel, recommendation, recommendationText };
}

// ============================================================
// MAIN API CLIENT
// ============================================================
export class MetaAdsClient {
  private config: MetaConfig;
  private baseUrl: string;

  constructor(config: MetaConfig) {
    this.config = config;
    this.baseUrl = `${BASE_URL}/${config.apiVersion || DEFAULT_API_VERSION}`;
  }

  private async fetch<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
    const url = new URL(`${this.baseUrl}/${endpoint}`);
    url.searchParams.set('access_token', this.config.accessToken);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

    const response = await fetch(url.toString());
    const json = await response.json();
    if (json.error) throw new Error(`Meta API Error [${json.error.code}]: ${json.error.message}`);
    return json;
  }

  async getAccountInfo(): Promise<AdAccount> {
    const accountId = this.config.adAccountId.replace('act_', '');
    return this.fetch<AdAccount>(`act_${accountId}`, {
      fields: 'id,name,currency,timezone_name,account_status',
    });
  }

  async getCampaigns(datePreset: DatePreset = 'last_30d'): Promise<Campaign[]> {
    const accountId = this.config.adAccountId.replace('act_', '');
    const insightFields = [
      'spend', 'impressions', 'clicks', 'reach', 'frequency', 'ctr', 'cpc', 'cpm', 'cpp',
      'purchase_roas', 'actions', 'action_values', 'cost_per_action_type',
      'video_play_actions', 'video_thruplay_watched_actions',
    ].join(',');

    const response = await this.fetch<MetaApiResponse<Campaign>>(`act_${accountId}/campaigns`, {
      fields: `id,name,status,objective,daily_budget,lifetime_budget,budget_remaining,start_time,stop_time,special_ad_categories,is_advantage_plus_shopping_campaign,insights.date_preset(${datePreset}){${insightFields}}`,
      limit: '50',
    });

    return (response.data || []).map((campaign) => ({
      ...campaign,
      insightsSummary: campaign.insights?.data ? summarizeInsights(campaign.insights.data) : undefined,
    }));
  }

  async getAdSets(campaignId: string, datePreset: DatePreset = 'last_30d', mode: CampaignMode = 'ecommerce'): Promise<AdSet[]> {
    const insightFields = [
      'spend', 'impressions', 'clicks', 'reach', 'frequency', 'ctr', 'cpc', 'cpm', 'cpp',
      'purchase_roas', 'actions', 'action_values', 'cost_per_action_type',
      'video_play_actions', 'video_thruplay_watched_actions',
    ].join(',');

    const response = await this.fetch<MetaApiResponse<AdSet>>(`${campaignId}/adsets`, {
      fields: `id,name,status,campaign_id,daily_budget,lifetime_budget,budget_remaining,billing_event,optimization_goal,bid_strategy,bid_amount,start_time,end_time,targeting,insights.date_preset(${datePreset}){${insightFields}}`,
      limit: '50',
    });

    return (response.data || []).map((adset) => {
      const insightsSummary = adset.insights?.data ? summarizeInsights(adset.insights.data) : undefined;
      return {
        ...adset,
        insightsSummary,
        audienceAnalysis: analyzeAudience(adset.targeting, insightsSummary),
      };
    });
  }

  async getAds(adsetId: string, datePreset: DatePreset = 'last_30d', mode: CampaignMode = 'ecommerce'): Promise<Ad[]> {
    const insightFields = [
      'spend', 'impressions', 'clicks', 'reach', 'frequency', 'ctr', 'cpc', 'cpm', 'cpp',
      'purchase_roas', 'actions', 'action_values', 'cost_per_action_type',
      'video_play_actions', 'video_thruplay_watched_actions',
    ].join(',');

    // NOTE: Fields like `picture`, `effective_object_story_spec`, `object_story_spec`,
    // and `asset_feed_spec` cause the Meta API to silently return an empty response when
    // used as creative subfields on the /ads edge. Only use fields confirmed to be safe.
    // NOTE: `image_url` and `thumbnail_url` from inline creative{} expansion are ALWAYS
    // low-resolution — thumbnail_width/thumbnail_height params don't propagate into
    // nested field expansions. We intentionally omit them here and fetch all images via
    // getCreativeThumbnail() which hits /{creative_id} directly where the params work.
    const creativeFields = [
      'id', 'name', 'title', 'body',
      'call_to_action_type',
      'object_type',
      'image_hash',
      'video_id',
    ].join(',');

    const response = await this.fetch<MetaApiResponse<Ad>>(`${adsetId}/ads`, {
      fields: `id,name,status,creative{${creativeFields}},insights.date_preset(${datePreset}){${insightFields}}`,
      limit: '50',
    });

    const ads: Ad[] = (response.data || []).map((ad) => {
      const insightsSummary = ad.insights?.data ? summarizeInsights(ad.insights.data) : undefined;

      let adFormat: Ad['adFormat'] = 'UNKNOWN';
      const c = ad.creative;
      if (c) {
        if (c.object_type === 'SHARE') adFormat = 'DYNAMIC'; // catalog / DPA ads
        else if (c.video_id || c.object_type === 'VIDEO') adFormat = 'VIDEO';
        else if (c.image_url || c.image_hash || c.object_type === 'IMAGE' || c.thumbnail_url) adFormat = 'IMAGE';
      }

      return { ...ad, adFormat, insightsSummary, creativeScore: scoreCreative(ad, insightsSummary, mode) };
    });

    // Second pass: fetch image + copy text for ALL creatives via the direct /{creative_id}
    // endpoint. Reasons:
    // 1. image_url/thumbnail_url from inline expansion are low-res — direct endpoint
    //    respects thumbnail_width.
    // 2. body/title often return empty from inline expansion for modern ads. The actual
    //    copy lives in object_story_spec.link_data.{message,name} — this field silently
    //    breaks inline creative{} expansion but works fine on the direct endpoint.
    const adsWithCreative = ads.filter((ad) => !!ad.creative?.id);

    if (adsWithCreative.length > 0) {
      await Promise.all(
        adsWithCreative.map(async (ad) => {
          const data = await this.getCreativeDetails(ad.creative!.id);
          if (!ad.creative) return;
          if (data.image_url || data.thumbnail_url) {
            ad.creative.image_url     = data.image_url     || ad.creative.image_url;
            ad.creative.thumbnail_url = data.thumbnail_url || ad.creative.thumbnail_url;
          }
          if (data.body)  ad.creative.body  = data.body;
          if (data.title) ad.creative.title = data.title;
          if (data.object_story_spec) ad.creative.object_story_spec = data.object_story_spec;
          if (data.asset_feed_spec) ad.creative.asset_feed_spec = data.asset_feed_spec;

          const currentPreview =
            ad.creative.image_url ||
            ad.creative.thumbnail_url ||
            ad.creative.picture ||
            ad.creative.object_story_spec?.link_data?.picture;

          const candidateHashes = [
            ad.creative.image_hash,
            ...(ad.creative.asset_feed_spec?.images || []).map((image) => image.hash),
          ].filter((hash): hash is string => !!hash);

          if (
            candidateHashes.length > 0 &&
            (
              !currentPreview ||
              isLikelyTinyCreativePreview(currentPreview) ||
              isLikelyForcedSquareCrop(currentPreview)
            )
          ) {
            const hashUrl = await this.getBestAdImageUrlByHashes(candidateHashes);
            if (hashUrl) ad.creative.image_url = hashUrl;
          }
        })
      );
    }

    return ads;
  }

  // Fetch image + copy from the direct /adcreatives/{id} endpoint.
  // object_story_spec is safe here (direct endpoint) even though it breaks inline expansion.
  async getCreativeDetails(creativeId: string): Promise<{
    image_url?: string;
    thumbnail_url?: string;
    body?: string;
    title?: string;
    object_story_spec?: AdCreative['object_story_spec'];
    asset_feed_spec?: AdCreative['asset_feed_spec'];
  }> {
    try {
      return await this.fetch<{
        image_url?: string;
        thumbnail_url?: string;
        body?: string;
        title?: string;
        object_story_spec?: AdCreative['object_story_spec'];
        asset_feed_spec?: AdCreative['asset_feed_spec'];
      }>(`${creativeId}`, {
        fields: 'image_url,thumbnail_url,body,title,object_story_spec,asset_feed_spec',
        thumbnail_width: '1080',
      });
    } catch {
      // Some ad accounts reject optional story/feed fields for specific creative types.
      // Fallback to the minimal, widely supported image/copy fields instead of dropping preview entirely.
      try {
        return await this.fetch<{
          image_url?: string;
          thumbnail_url?: string;
          body?: string;
          title?: string;
        }>(`${creativeId}`, {
          fields: 'image_url,thumbnail_url,body,title',
          thumbnail_width: '1080',
        });
      } catch {
        return {};
      }
    }
  }

  async getBestAdImageUrlByHashes(imageHashes: string[]): Promise<string | undefined> {
    const accountId = this.config.adAccountId.replace('act_', '');
    const uniqueHashes = [...new Set(imageHashes.filter(Boolean))];
    if (uniqueHashes.length === 0) return undefined;

    try {
      const response = await this.fetch<MetaApiResponse<{ hash?: string; url?: string; width?: number; height?: number }>>(`act_${accountId}/adimages`, {
        fields: 'hash,url,width,height',
        hashes: JSON.stringify(uniqueHashes.slice(0, 100)),
        limit: '100',
      });

      const images = (response.data || []).filter((image) => !!image.url);
      if (images.length === 0) return undefined;

      let best = images[0];
      let bestScore = scoreAdImageCandidate(best);

      for (let i = 1; i < images.length; i += 1) {
        const image = images[i];
        const score = scoreAdImageCandidate(image);
        if (score > bestScore) {
          best = image;
          bestScore = score;
        }
      }

      return best.url;
    } catch {
      return undefined;
    }
  }

  async getAdImageUrlByHash(imageHash: string): Promise<string | undefined> {
    return this.getBestAdImageUrlByHashes([imageHash]);
  }

  /** @deprecated use getCreativeDetails */
  async getCreativeThumbnail(creativeId: string): Promise<string | undefined> {
    const d = await this.getCreativeDetails(creativeId);
    return d.image_url || d.thumbnail_url;
  }

  async getFullAccountSnapshot(datePreset: DatePreset = 'last_30d', mode: CampaignMode = 'ecommerce'): Promise<AdAccount> {
    const [accountInfo, campaigns] = await Promise.all([
      this.getAccountInfo(),
      this.getCampaigns(datePreset),
    ]);

    const activeCampaigns = campaigns.filter((c) => c.status === 'ACTIVE' || c.status === 'PAUSED');
    const campaignsWithAdsets = await Promise.all(
      activeCampaigns.map(async (campaign) => {
        try {
          const adsets = await this.getAdSets(campaign.id, datePreset, mode);
          const adsetsWithAds = await Promise.all(
            adsets.map(async (adset) => {
              try {
                const ads = await this.getAds(adset.id, datePreset, mode);
                return { ...adset, ads };
              } catch { return adset; }
            })
          );
          return { ...campaign, adsets: adsetsWithAds };
        } catch { return campaign; }
      })
    );

    // Compute overall totals
    const allInsights = campaignsWithAdsets
      .map((c) => c.insightsSummary)
      .filter(Boolean) as InsightsSummary[];

    const sum = (key: keyof InsightsSummary) =>
      allInsights.reduce((acc, cur) => acc + (cur[key] as number), 0);

    const totalSpend = sum('spend');
    const totalImpressions = sum('impressions');
    const totalClicks = sum('clicks');
    const totalReach = sum('reach');
    const totalPurchases = sum('purchases');
    const totalLeads = sum('leads');
    const totalMessages = sum('messagesStarted');
    const totalFirstReply = sum('messagingFirstReply');
    const totalLinkClicks = sum('linkClicks');
    const totalLPV = sum('landingPageViews');
    const totalThruPlays = sum('videoThruPlays');
    const totalPurchaseValue = allInsights.reduce((acc, cur) => acc + cur.roas * cur.spend, 0);

    const overallInsights: InsightsSummary = {
      spend: totalSpend,
      impressions: totalImpressions,
      clicks: totalClicks,
      reach: totalReach,
      frequency: totalReach > 0 ? totalImpressions / totalReach : 0,
      ctr: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0,
      cpc: totalClicks > 0 ? totalSpend / totalClicks : 0,
      cpm: totalImpressions > 0 ? (totalSpend / totalImpressions) * 1000 : 0,
      roas: totalSpend > 0 && totalPurchaseValue > 0 ? totalPurchaseValue / totalSpend : 0,
      cpa: totalPurchases > 0 ? totalSpend / totalPurchases : 0,
      purchases: totalPurchases,
      addToCart: sum('addToCart'),
      viewContent: sum('viewContent'),
      leads: totalLeads,
      costPerLead: totalLeads > 0 ? totalSpend / totalLeads : 0,
      messagesStarted: totalMessages,
      messagingFirstReply: totalFirstReply,
      newMessagingConnections: sum('newMessagingConnections'),
      costPerConversation: totalMessages > 0 ? totalSpend / totalMessages : 0,
      costPerFirstReply: totalFirstReply > 0 ? totalSpend / totalFirstReply : 0,
      linkClicks: totalLinkClicks,
      landingPageViews: totalLPV,
      costPerLandingPageView: totalLPV > 0 ? totalSpend / totalLPV : 0,
      videoThruPlays: totalThruPlays,
      videoPlays: sum('videoPlays'),
      costPerThruPlay: totalThruPlays > 0 ? totalSpend / totalThruPlays : 0,
    };

    const otherCampaigns = campaigns.filter((c) => c.status !== 'ACTIVE' && c.status !== 'PAUSED');

    return {
      ...accountInfo,
      campaigns: [...campaignsWithAdsets, ...otherCampaigns],
      overallInsights,
    };
  }

  // ---- Format context for AI agent (compact — token-efficient) ----
  static formatForAgent(account: AdAccount, datePreset: string, mode: CampaignMode = 'ecommerce'): string {
    const cur = account.currency;
    const fmt = (n: number) => n > 0 ? `${cur} ${n.toFixed(2)}` : 'N/A';
    const fmtN = (n: number) => n.toLocaleString('pt-BR');

    const lines: string[] = [];
    lines.push(`CONTA: ${account.name} | Moeda: ${cur} | Período: ${datePreset} | Modo: ${mode.toUpperCase()}`);

    if (account.overallInsights) {
      const o = account.overallInsights;
      lines.push(`\nRESUMO GERAL: Gasto=${fmt(o.spend)} | CTR=${o.ctr.toFixed(2)}% | CPM=${fmt(o.cpm)} | Freq=${o.frequency.toFixed(1)}x | Alcance=${fmtN(o.reach)}`);
      if (mode === 'ecommerce') lines.push(`E-COM: ROAS=${o.roas > 0 ? o.roas.toFixed(2) + 'x' : 'N/A'} | CPA=${fmt(o.cpa)} | Compras=${o.purchases} | ATC=${o.addToCart} | VC=${o.viewContent}`);
      if (mode === 'whatsapp') lines.push(`WA: Conversas=${fmtN(o.messagesStarted)} | CustConv=${fmt(o.costPerConversation)} | 1ºReply=${fmtN(o.messagingFirstReply)} | CustReply=${fmt(o.costPerFirstReply)}`);
      if (mode === 'leads') lines.push(`LEADS: Total=${fmtN(o.leads)} | CPL=${fmt(o.costPerLead)}`);
      if (mode === 'traffic') lines.push(`TRÁFEGO: LPV=${fmtN(o.landingPageViews)} | CustoLPV=${fmt(o.costPerLandingPageView)} | Cliques=${fmtN(o.linkClicks)}`);
      if (mode === 'awareness') lines.push(`VÍDEO: ThruPlays=${fmtN(o.videoThruPlays)} | CustoTP=${fmt(o.costPerThruPlay)}`);
    }

    if (account.campaigns?.length) {
      lines.push(`\nCAMPANHAS (${account.campaigns.length} total):`);
      for (const c of account.campaigns) {
        const i = c.insightsSummary;
        let cLine = `[${c.status}] ${c.name} | Obj:${c.objective?.replace('OUTCOME_', '')}`;
        if (i) {
          cLine += ` | Gasto:${fmt(i.spend)} | CTR:${i.ctr.toFixed(2)}% | Freq:${i.frequency.toFixed(1)}x`;
          if (mode === 'ecommerce') cLine += ` | ROAS:${i.roas > 0 ? i.roas.toFixed(2) + 'x' : 'N/A'} | CPA:${fmt(i.cpa)}`;
          if (mode === 'whatsapp') cLine += ` | Conv:${i.messagesStarted} | CPC(WA):${fmt(i.costPerConversation)}`;
          if (mode === 'leads') cLine += ` | Leads:${i.leads} | CPL:${fmt(i.costPerLead)}`;
        }
        lines.push(`  ${cLine}`);

        if (c.adsets) {
          for (const as of c.adsets) {
            const ai = as.insightsSummary;
            let asLine = `  ↳ [${as.status}] ${as.name}`;
            if (ai) {
              asLine += ` | Gasto:${fmt(ai.spend)} | CTR:${ai.ctr.toFixed(2)}% | CPM:${fmt(ai.cpm)} | Freq:${ai.frequency.toFixed(1)}x`;
              if (mode === 'ecommerce') asLine += ` | ROAS:${ai.roas > 0 ? ai.roas.toFixed(2) + 'x' : 'N/A'} | CPA:${fmt(ai.cpa)}`;
              if (mode === 'whatsapp') asLine += ` | Conv:${ai.messagesStarted} | CPC(WA):${fmt(ai.costPerConversation)} | Reply:${ai.messagingFirstReply}`;
              if (mode === 'leads') asLine += ` | Leads:${ai.leads} | CPL:${fmt(ai.costPerLead)}`;
            }
            if (as.audienceAnalysis) {
              asLine += ` | Pub:${as.audienceAnalysis.type}(${as.audienceAnalysis.quality},Sat:${as.audienceAnalysis.saturationRisk})`;
            }
            lines.push(`    ${asLine}`);

            if (as.ads) {
              for (const ad of as.ads) {
                const si = ad.insightsSummary;
                const sc = ad.creativeScore;
                let adLine = `      ↳ [${ad.status}] ${ad.name}`;
                if (sc) adLine += ` | Score:${sc.overall}/100 Fadiga:${sc.fatigueLevel} Ação:${sc.recommendation}`;
                if (si) adLine += ` | Gasto:${fmt(si.spend)} CTR:${si.ctr.toFixed(2)}% Freq:${si.frequency.toFixed(1)}x`;
                lines.push(adLine);
              }
            }
          }
        }
      }
    }
    return lines.join('\n');
  }
}
