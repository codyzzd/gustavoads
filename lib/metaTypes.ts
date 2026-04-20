// ============================================================
// Meta Graph API — TypeScript Type Definitions
// ============================================================

export type CampaignStatus = 'ACTIVE' | 'PAUSED' | 'DELETED' | 'ARCHIVED';
export type AdSetStatus = 'ACTIVE' | 'PAUSED' | 'DELETED' | 'ARCHIVED';
export type AdStatus = 'ACTIVE' | 'PAUSED' | 'DELETED' | 'ARCHIVED';
export type CampaignObjective =
  | 'OUTCOME_AWARENESS'
  | 'OUTCOME_TRAFFIC'
  | 'OUTCOME_ENGAGEMENT'
  | 'OUTCOME_LEADS'
  | 'OUTCOME_APP_PROMOTION'
  | 'OUTCOME_SALES'
  | 'LINK_CLICKS'
  | 'CONVERSIONS'
  | 'REACH'
  | 'BRAND_AWARENESS'
  | 'VIDEO_VIEWS'
  | 'MESSAGES';

export type BillingEvent = 'IMPRESSIONS' | 'LINK_CLICKS' | 'THRUPLAY' | 'POST_ENGAGEMENT';
export type OptimizationGoal =
  | 'NONE'
  | 'APP_INSTALLS'
  | 'BRAND_AWARENESS'
  | 'CLICKS'
  | 'ENGAGED_USERS'
  | 'EVENT_RESPONSES'
  | 'IMPRESSIONS'
  | 'LEAD_GENERATION'
  | 'LINK_CLICKS'
  | 'OFFSITE_CONVERSIONS'
  | 'PAGE_LIKES'
  | 'POST_ENGAGEMENT'
  | 'QUALITY_LEAD'
  | 'REACH'
  | 'SOCIAL_IMPRESSIONS'
  | 'THRUPLAY'
  | 'VALUE'
  | 'VISIT_INSTAGRAM_PROFILE'
  | 'CONVERSATIONS'
  | 'MESSAGING_PURCHASE_CONVERSION'
  | 'MESSAGING_APPOINTMENT_CONVERSION';

export type CampaignMode = 'ecommerce' | 'whatsapp' | 'leads' | 'traffic' | 'awareness';

export const CAMPAIGN_MODE_LABELS: Record<CampaignMode, string> = {
  ecommerce: '🛒 E-commerce / Vendas',
  whatsapp: '💬 WhatsApp / Mensagens',
  leads: '🎯 Geração de Leads',
  traffic: '🔗 Tráfego / Cliques',
  awareness: '📣 Awareness / Alcance',
};

export interface ActionValue {
  action_type: string;
  value: string;
}

export interface Insights {
  date_start: string;
  date_stop: string;
  spend: string;
  impressions: string;
  clicks: string;
  reach: string;
  frequency: string;
  ctr: string;
  cpc: string;
  cpm: string;
  cpp: string;
  purchase_roas?: ActionValue[];
  actions?: ActionValue[];
  action_values?: ActionValue[];
  cost_per_action_type?: ActionValue[];
  video_play_actions?: ActionValue[];
  video_thruplay_watched_actions?: ActionValue[];
}

export interface InsightsSummary {
  spend: number;
  impressions: number;
  clicks: number;
  reach: number;
  frequency: number;
  ctr: number;
  cpc: number;
  cpm: number;
  roas: number;
  cpa: number;
  purchases: number;
  addToCart: number;
  viewContent: number;
  leads: number;
  costPerLead: number;
  messagesStarted: number;
  messagingFirstReply: number;
  newMessagingConnections: number;
  costPerConversation: number;
  costPerFirstReply: number;
  linkClicks: number;
  landingPageViews: number;
  costPerLandingPageView: number;
  videoThruPlays: number;
  videoPlays: number;
  costPerThruPlay: number;
}

export interface AdCreative {
  id: string;
  name?: string;
  title?: string;
  body?: string;
  call_to_action_type?: string;
  image_url?: string;
  thumbnail_url?: string;
  picture?: string;          // top-level picture field (returned by /adcreatives/{id})
  image_hash?: string;
  object_type?: string;
  video_id?: string;
  effective_object_story_spec?: {
    link_data?: {
      message?: string;
      name?: string;
      description?: string;
      link?: string;
      picture?: string;
      call_to_action?: { type: string };
      child_attachments?: Array<{
        name?: string;
        description?: string;
        link?: string;
        picture?: string;
        call_to_action?: { type: string };
      }>;
    };
    video_data?: {
      message?: string;
      title?: string;
      link_description?: string;
      image_url?: string;
      video_id?: string;
      call_to_action?: { type: string; value?: { link?: string } };
    };
    photo_data?: {
      url?: string;
      caption?: string;
    };
  };
  object_story_spec?: {
    link_data?: {
      message?: string;
      name?: string;
      description?: string;
      link?: string;
      picture?: string;
      call_to_action?: { type: string };
      child_attachments?: Array<{
        name?: string;
        description?: string;
        link?: string;
        picture?: string;
        call_to_action?: { type: string };
      }>;
    };
    video_data?: {
      message?: string;
      title?: string;
      image_url?: string;
      video_id?: string;
    };
  };
  asset_feed_spec?: {
    images?: Array<{ hash?: string; url?: string }>;
    videos?: Array<{ video_id?: string; thumbnail_url?: string }>;
    bodies?: Array<{ text: string }>;
    titles?: Array<{ text: string }>;
    descriptions?: Array<{ text: string }>;
    call_to_action_types?: string[];
  };
}

type CreativeImageSource =
  | 'image_url'
  | 'feed_image'
  | 'child_attachment'
  | 'video_preview'
  | 'thumbnail_url'
  | 'link_picture'
  | 'picture'
  | 'feed_video_thumb';

type CreativeImageCandidate = {
  url: string;
  source: CreativeImageSource;
};

function parseCandidateSize(url: string): { width: number; height: number } | undefined {
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

    const w = parsed.searchParams.get('w');
    const h = parsed.searchParams.get('h');
    if (w && h) {
      const width = Number.parseInt(w, 10);
      const height = Number.parseInt(h, 10);
      if (Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0) {
        return { width, height };
      }
    }
  } catch {
    // ignore malformed URLs
  }
  return undefined;
}

function getStpParam(url: string): string {
  try {
    return new URL(url).searchParams.get('stp') || '';
  } catch {
    return '';
  }
}

function getCandidateScore(candidate: CreativeImageCandidate, isLikelyVideo: boolean): number {
  const sourceBase: Record<CreativeImageSource, number> = {
    image_url: 100,
    feed_image: 95,
    child_attachment: 92,
    video_preview: 86,
    thumbnail_url: 80,
    link_picture: 72,
    picture: 68,
    feed_video_thumb: 62,
  };

  let score = sourceBase[candidate.source];
  const size = parseCandidateSize(candidate.url);

  if (size) {
    const minSide = Math.min(size.width, size.height);
    const ratio = size.width / size.height;

    score += Math.min(25, Math.log2(Math.max(minSide, 1)) * 4);

    if (minSide < 120) score -= 30;
    else if (minSide < 180) score -= 12;

    if (ratio > 8 || ratio < 0.125) score -= 20;
    else if (ratio > 5 || ratio < 0.2) score -= 10;
  }

  const stp = getStpParam(candidate.url);
  const looksCenterCroppedSquare =
    !!stp &&
    stp.includes('c0.5000x0.5000f') &&
    !!size &&
    size.width === size.height;
  if (looksCenterCroppedSquare && !isLikelyVideo) score -= 16;

  if (isLikelyVideo) {
    if (candidate.source === 'video_preview' || candidate.source === 'thumbnail_url' || candidate.source === 'feed_video_thumb') {
      score += 8;
    }
  } else if (candidate.source === 'feed_video_thumb') {
    score -= 8;
  }

  return score;
}

function pickBestCreativeImage(candidates: CreativeImageCandidate[], isLikelyVideo: boolean): string | undefined {
  if (candidates.length === 0) return undefined;

  const unique: CreativeImageCandidate[] = [];
  const seen = new Set<string>();
  for (const c of candidates) {
    if (!c.url || seen.has(c.url)) continue;
    seen.add(c.url);
    unique.push(c);
  }
  if (unique.length === 0) return undefined;

  let best = unique[0];
  let bestScore = getCandidateScore(best, isLikelyVideo);

  for (let i = 1; i < unique.length; i += 1) {
    const candidate = unique[i];
    const score = getCandidateScore(candidate, isLikelyVideo);
    if (score > bestScore) {
      best = candidate;
      bestScore = score;
    }
  }

  return best.url;
}

export function getCreativeImageUrl(creative: AdCreative | undefined): string | undefined {
  if (!creative) return undefined;
  const candidates: CreativeImageCandidate[] = [];
  const push = (url: string | undefined, source: CreativeImageSource) => {
    if (url) candidates.push({ url, source });
  };

  push(creative.image_url, 'image_url');
  push(creative.thumbnail_url, 'thumbnail_url');
  push(creative.picture, 'picture');

  const effLink = creative.effective_object_story_spec?.link_data;
  for (const child of effLink?.child_attachments || []) push(child.picture, 'child_attachment');
  push(effLink?.picture, 'link_picture');
  push(creative.effective_object_story_spec?.video_data?.image_url, 'video_preview');

  const osLink = creative.object_story_spec?.link_data;
  for (const child of osLink?.child_attachments || []) push(child.picture, 'child_attachment');
  push(osLink?.picture, 'link_picture');
  push(creative.object_story_spec?.video_data?.image_url, 'video_preview');

  for (const image of creative.asset_feed_spec?.images || []) push(image.url, 'feed_image');
  for (const video of creative.asset_feed_spec?.videos || []) push(video.thumbnail_url, 'feed_video_thumb');

  const isLikelyVideo = creative.object_type === 'VIDEO' || !!creative.video_id;
  return pickBestCreativeImage(candidates, isLikelyVideo);
}

export function getCreativeBody(creative: AdCreative | undefined): string {
  if (!creative) return '';
  if (creative.body) return creative.body;
  const linkMsg = creative.effective_object_story_spec?.link_data?.message;
  if (linkMsg) return linkMsg;
  const vidMsg = creative.effective_object_story_spec?.video_data?.message;
  if (vidMsg) return vidMsg;
  const feedBody = creative.asset_feed_spec?.bodies?.[0]?.text;
  if (feedBody) return feedBody;
  return '';
}

export function getCreativeTitle(creative: AdCreative | undefined): string {
  if (!creative) return '';
  if (creative.title) return creative.title;
  const linkName = creative.effective_object_story_spec?.link_data?.name;
  if (linkName) return linkName;
  const vidTitle = creative.effective_object_story_spec?.video_data?.title;
  if (vidTitle) return vidTitle;
  const feedTitle = creative.asset_feed_spec?.titles?.[0]?.text;
  if (feedTitle) return feedTitle;
  return '';
}

export function getCreativeCaption(creative: AdCreative | undefined): string {
  if (!creative) return '';
  const linkDesc = creative.effective_object_story_spec?.link_data?.description;
  if (linkDesc) return linkDesc;
  const videoDesc = creative.effective_object_story_spec?.video_data?.link_description;
  if (videoDesc) return videoDesc;
  const photoCaption = creative.effective_object_story_spec?.photo_data?.caption;
  if (photoCaption) return photoCaption;
  const feedDescription = creative.asset_feed_spec?.descriptions?.[0]?.text;
  if (feedDescription) return feedDescription;
  return '';
}

export interface CreativeScore {
  overall: number;
  hookScore: number;
  copyScore: number;
  performanceScore: number;
  fatigueLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  recommendation: 'SCALE' | 'KEEP' | 'TEST_VARIATION' | 'PAUSE';
  recommendationText: string;
}

export interface Ad {
  id: string;
  name: string;
  status: AdStatus;
  creative?: AdCreative;
  insights?: { data: Insights[] };
  insightsSummary?: InsightsSummary;
  creativeScore?: CreativeScore;
  adFormat?: 'IMAGE' | 'VIDEO' | 'CAROUSEL' | 'DYNAMIC' | 'UNKNOWN';
}

export interface TargetingSpec {
  age_min?: number;
  age_max?: number;
  genders?: number[];
  geo_locations?: {
    countries?: string[];
    cities?: { key: string; name: string; region?: string }[];
    regions?: { key: string; name: string }[];
  };
  interests?: { id: string; name: string }[];
  behaviors?: { id: string; name: string }[];
  custom_audiences?: { id: string; name: string }[];
  excluded_custom_audiences?: { id: string; name: string }[];
  lookalike_audiences?: { id: string; name: string }[];
  publisher_platforms?: string[];
  facebook_positions?: string[];
  instagram_positions?: string[];
  device_platforms?: string[];
  flexible_spec?: { interests?: { id: string; name: string }[] }[];
  is_advantage_plus_audience?: boolean;
  advantage_audience?: boolean;
}

export interface AdSet {
  id: string;
  name: string;
  status: AdSetStatus;
  campaign_id: string;
  daily_budget?: string;
  lifetime_budget?: string;
  budget_remaining?: string;
  billing_event: BillingEvent;
  optimization_goal: OptimizationGoal;
  bid_strategy?: string;
  bid_amount?: string;
  start_time?: string;
  end_time?: string;
  targeting?: TargetingSpec;
  insights?: { data: Insights[] };
  insightsSummary?: InsightsSummary;
  ads?: Ad[];
  audienceAnalysis?: AudienceAnalysis;
}

export interface AudienceAnalysis {
  estimatedSize?: number;
  type: 'BROAD' | 'INTEREST' | 'LOOKALIKE' | 'CUSTOM' | 'RETARGETING' | 'ADVANTAGE_PLUS';
  quality: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
  saturationRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  insights: string[];
  recommendations: string[];
}

export interface Campaign {
  id: string;
  name: string;
  status: CampaignStatus;
  objective: CampaignObjective;
  daily_budget?: string;
  lifetime_budget?: string;
  budget_remaining?: string;
  start_time?: string;
  stop_time?: string;
  special_ad_categories?: string[];
  is_advantage_plus_shopping?: boolean;
  insights?: { data: Insights[] };
  insightsSummary?: InsightsSummary;
  adsets?: AdSet[];
}

export interface AdAccount {
  id: string;
  name: string;
  currency: string;
  timezone_name: string;
  account_status: number;
  campaigns?: Campaign[];
  overallInsights?: InsightsSummary;
}

export interface MetaApiResponse<T> {
  data: T[];
  paging?: {
    cursors?: { before: string; after: string };
    next?: string;
  };
  error?: {
    message: string;
    type: string;
    code: number;
  };
}

export type TokenType = 'short' | 'long_lived' | 'system_user';

/** Permissão efetiva do token Meta configurado */
export type MetaPermission = 'readonly' | 'readwrite';

export const META_PERMISSION_INFO: Record<MetaPermission, {
  label: string;
  description: string;
  scopes: string[];
  canWrite: boolean;
}> = {
  readonly: {
    label: 'Somente Leitura',
    description: 'Sincroniza e exibe dados. Não pode fazer alterações.',
    scopes: ['ads_read', 'read_insights'],
    canWrite: false,
  },
  readwrite: {
    label: 'Leitura + Escrita',
    description: 'Sincroniza dados e pode pausar anúncios, ajustar orçamentos e mais.',
    scopes: ['ads_read', 'read_insights', 'ads_management'],
    canWrite: true,
  },
};

export interface MetaConfig {
  accessToken: string;
  adAccountId: string;
  apiVersion?: string;
}

export type DatePreset =
  | 'today'
  | 'yesterday'
  | 'last_3d'
  | 'last_7d'
  | 'last_14d'
  | 'last_28d'
  | 'last_30d'
  | 'last_90d'
  | 'this_month'
  | 'last_month';
