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

export function getCreativeImageUrl(creative: AdCreative | undefined): string | undefined {
  if (!creative) return undefined;
  if (creative.image_url) return creative.image_url;
  if (creative.thumbnail_url) return creative.thumbnail_url;
  if (creative.picture) return creative.picture;
  const linkPic = creative.effective_object_story_spec?.link_data?.picture;
  if (linkPic) return linkPic;
  const vidThumb = creative.effective_object_story_spec?.video_data?.image_url;
  if (vidThumb) return vidThumb;
  const osPic = creative.object_story_spec?.link_data?.picture;
  if (osPic) return osPic;
  const osVidThumb = creative.object_story_spec?.video_data?.image_url;
  if (osVidThumb) return osVidThumb;
  const feedImg = creative.asset_feed_spec?.images?.[0]?.url;
  if (feedImg) return feedImg;
  const feedVidThumb = creative.asset_feed_spec?.videos?.[0]?.thumbnail_url;
  if (feedVidThumb) return feedVidThumb;
  return undefined;
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
