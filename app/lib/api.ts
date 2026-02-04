// Fixr API utilities for communicating with the worker

const FIXR_API_URL = process.env.NEXT_PUBLIC_FIXR_API_URL || 'https://agent.fixr.nexus';

export interface TokenAnalysis {
  success: boolean;
  token?: {
    address: string;
    symbol: string;
    name: string;
    network: string;
  };
  score?: number;
  breakdown?: {
    category: string;
    score: number;
    findings: string[];
  }[];
  risks?: string[];
  verdict?: string;
  error?: string;
}

export interface Builder {
  fid: number;
  username: string;
  displayName?: string;
  pfpUrl?: string;
  followerCount: number;
  shippedCount: number;
  totalEngagement: number;
  topTopics: string[];
  lastSeen: string;
}

export interface BuilderCast {
  hash: string;
  text: string;
  authorUsername: string;
  authorDisplayName?: string;
  authorPfpUrl?: string;
  channel: string;
  timestamp: string;
  likes: number;
  recasts: number;
  category: string;
  topics: string[];
  embeds: string[];
}

export interface RugIncident {
  tokenAddress: string;
  tokenSymbol: string;
  tokenName: string;
  rugType: string;
  severity: string;
  priceDropPercent: number;
  detectedAt: string;
  wePredictedIt: boolean;
}

export interface FeaturedProject {
  id: string;
  name: string;
  url: string;
  description: string;
  longDescription?: string;
  logoUrl?: string;
  type: 'miniapp' | 'tool' | 'token' | 'other';
  tokenAddress?: string;
  tokenAnalysis?: TokenAnalysis;
  submitterFid: number;
  submitterUsername: string;
  submitterPfpUrl?: string;
  trendingRank?: number;
  engagementCount?: number;
  submittedAt: string;
  featured: boolean;
}

// Ship Tracker Types
export type ShipCategory = 'miniapp' | 'token' | 'protocol' | 'tool' | 'agent' | 'social' | 'nft' | 'infra' | 'other';
export type ShipSource = 'clawcrunch' | 'clanker_news' | 'farcaster' | 'github' | 'manual';

export interface Ship {
  id: string;
  name: string;
  description: string;
  category: ShipCategory;
  source: ShipSource;
  sourceUrl: string;
  sourceId?: string;
  chain?: 'ethereum' | 'base' | 'monad' | 'solana';
  urls: {
    website?: string;
    github?: string;
    farcaster?: string;
    twitter?: string;
    contract?: string;
  };
  builders: string[];
  tags: string[];
  metrics?: {
    points?: number;
    comments?: number;
    likes?: number;
  };
  publishedAt: string;
  ingestedAt: string;
  featured?: boolean;
}

export interface ShipStats {
  totalShips: number;
  totalBuilders: number;
  byCategory: Record<ShipCategory, number>;
  bySource: Record<ShipSource, number>;
  recentShips: number;
}

// Analyze a token by address
export async function analyzeToken(address: string): Promise<TokenAnalysis> {
  try {
    const res = await fetch(`${FIXR_API_URL}/api/token/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address, network: 'base' }),
    });
    const data = await res.json();

    // Transform API response to match frontend interface
    if (data.success && data.report) {
      const r = data.report;
      return {
        success: true,
        token: r.tokenInfo ? {
          address: r.tokenInfo.address || address,
          symbol: r.tokenInfo.symbol || 'Unknown',
          name: r.tokenInfo.name || 'Unknown Token',
          network: r.network || 'base',
        } : undefined,
        score: r.overallScore,
        breakdown: r.securityAnalysis?.breakdown?.map((b: { category: string; score: number; findings?: string[] }) => ({
          category: b.category,
          score: b.score,
          findings: b.findings || [],
        })) || [],
        risks: r.warnings || [],
        verdict: r.summary || (r.riskLevel ? `Risk level: ${r.riskLevel}` : undefined),
      };
    }

    return { success: false, error: data.error || 'Analysis failed' };
  } catch (error) {
    return { success: false, error: 'Failed to connect to Fixr API' };
  }
}

// Get trending builders
export async function getTrendingBuilders(limit: number = 10): Promise<Builder[]> {
  try {
    const res = await fetch(`${FIXR_API_URL}/api/builders/top?limit=${limit}&order=shipped_count`);
    const data = await res.json();
    return (data.builders || []).map((b: Record<string, unknown>) => ({
      fid: b.fid,
      username: b.username,
      displayName: b.display_name,
      pfpUrl: b.pfp_url,
      followerCount: b.follower_count || 0,
      shippedCount: b.shipped_count || 0,
      totalEngagement: b.total_engagement || 0,
      topTopics: b.top_topics || [],
      lastSeen: b.last_seen,
    }));
  } catch (error) {
    console.error('Failed to fetch builders:', error);
    return [];
  }
}

// Get recent shipped projects
export async function getShippedProjects(limit: number = 20): Promise<BuilderCast[]> {
  try {
    const res = await fetch(`${FIXR_API_URL}/api/builders/casts?limit=${limit}&category=shipped`);
    const data = await res.json();
    return (data.casts || []).map((c: Record<string, unknown>) => ({
      hash: c.hash,
      text: c.text,
      authorUsername: c.author_username,
      authorDisplayName: c.author_display_name,
      authorPfpUrl: c.author_pfp_url,
      channel: c.channel,
      timestamp: c.timestamp,
      likes: c.likes || 0,
      recasts: c.recasts || 0,
      category: c.category,
      topics: c.topics || [],
      embeds: c.embeds || [],
    }));
  } catch (error) {
    console.error('Failed to fetch shipped projects:', error);
    return [];
  }
}

// Get recent rug incidents
export async function getRugIncidents(limit: number = 10): Promise<RugIncident[]> {
  try {
    const res = await fetch(`${FIXR_API_URL}/api/rugs/incidents?limit=${limit}`);
    const data = await res.json();
    return (data.incidents || []).map((i: Record<string, unknown>) => ({
      tokenAddress: i.token_address,
      tokenSymbol: i.token_symbol,
      tokenName: i.token_name,
      rugType: i.rug_type,
      severity: i.severity,
      priceDropPercent: i.price_drop_percent || 0,
      detectedAt: i.detected_at,
      wePredictedIt: i.we_predicted_it || false,
    }));
  } catch (error) {
    console.error('Failed to fetch rug incidents:', error);
    return [];
  }
}

// Submit a project for showcase
export async function submitProject(data: {
  name: string;
  url: string;
  description: string;
  longDescription?: string;
  logoUrl?: string;
  type: 'miniapp' | 'tool' | 'token' | 'other';
  tokenAddress?: string;
  submitterFid: number;
  submitterUsername: string;
  submitterPfpUrl?: string;
}): Promise<{ success: boolean; project?: FeaturedProject; error?: string }> {
  try {
    const res = await fetch(`${FIXR_API_URL}/api/projects/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return await res.json();
  } catch (error) {
    return { success: false, error: 'Failed to submit project' };
  }
}

// Get featured projects
export async function getFeaturedProjects(limit: number = 5): Promise<FeaturedProject[]> {
  try {
    const res = await fetch(`${FIXR_API_URL}/api/projects/featured?limit=${limit}`);
    const data = await res.json();
    return (data.projects || []).map((p: Record<string, unknown>) => ({
      id: p.id,
      name: p.name,
      url: p.url,
      description: p.description,
      longDescription: p.long_description,
      logoUrl: p.logo_url,
      type: p.type || 'other',
      tokenAddress: p.token_address,
      tokenAnalysis: p.token_analysis,
      submitterFid: p.submitter_fid,
      submitterUsername: p.submitter_username,
      submitterPfpUrl: p.submitter_pfp_url,
      trendingRank: p.trending_rank,
      engagementCount: p.engagement_count,
      submittedAt: p.submitted_at,
      featured: p.featured || false,
    }));
  } catch (error) {
    console.error('Failed to fetch featured projects:', error);
    return [];
  }
}

// Get trending hashtags from Farcaster
export async function getTrendingHashtags(limit: number = 5): Promise<{ tag: string; count: number }[]> {
  try {
    const res = await fetch(`${FIXR_API_URL}/api/trending/hashtags?limit=${limit}`);
    const data = await res.json();
    return data.hashtags || [];
  } catch (error) {
    console.error('Failed to fetch trending hashtags:', error);
    return [];
  }
}

// Extract URLs from text that might be mini apps
export function extractMiniAppUrls(text: string, embeds: string[]): string[] {
  const urls: string[] = [];

  // Check embeds first
  for (const embed of embeds) {
    if (isMiniAppUrl(embed)) {
      urls.push(embed);
    }
  }

  // Extract URLs from text
  const urlRegex = /https?:\/\/[^\s]+/g;
  const textUrls = text.match(urlRegex) || [];
  for (const url of textUrls) {
    if (isMiniAppUrl(url) && !urls.includes(url)) {
      urls.push(url);
    }
  }

  return urls;
}

// Check if a URL is likely a mini app
function isMiniAppUrl(url: string): boolean {
  const miniAppIndicators = [
    'vercel.app',
    'netlify.app',
    'railway.app',
    'render.com',
    '.xyz',
    'mini',
    'app',
    'farcaster.xyz',
  ];

  const lowUrl = url.toLowerCase();
  return miniAppIndicators.some(indicator => lowUrl.includes(indicator));
}

// Get score color based on value
export function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-400';
  if (score >= 60) return 'text-yellow-400';
  if (score >= 40) return 'text-orange-400';
  return 'text-red-400';
}

// Get score background color
export function getScoreBgColor(score: number): string {
  if (score >= 80) return 'bg-green-500/20 border-green-500/50';
  if (score >= 60) return 'bg-yellow-500/20 border-yellow-500/50';
  if (score >= 40) return 'bg-orange-500/20 border-orange-500/50';
  return 'bg-red-500/20 border-red-500/50';
}

// Format relative time
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

// ============================================================================
// BUILDER ID API
// ============================================================================

export type EthosLevel =
  | 'untrusted'
  | 'questionable'
  | 'neutral'
  | 'known'
  | 'established'
  | 'reputable'
  | 'exemplary'
  | 'distinguished'
  | 'revered'
  | 'renowned';

export interface BuilderIDRecord {
  fid: number;
  username: string;
  tokenId?: number;
  imageUrl: string;
  metadataUrl: string;
  walletAddress: string;
  builderScore?: number;
  neynarScore?: number;
  talentScore?: number;
  ethosScore?: number;
  ethosLevel?: EthosLevel;
  shippedCount?: number;
  powerBadge?: boolean;
  mintedAt?: string;
  txHash?: string;
}

export interface AvatarTraits {
  skinTone: string;
  hairColor: string;
  hairStyle: string;
  facialHair: string;
  glasses: string;
  headwear: string;
  expression: string;
  distinctiveFeature: string;
  vibe: string;
}

export interface BuilderIDPreview {
  success: boolean;
  profile?: {
    fid: number;
    username: string;
    displayName?: string;
    pfpUrl?: string;
    followerCount: number;
    neynarScore?: number;
    powerBadge?: boolean;
  };
  stats?: {
    shippedCount: number;
    totalEngagement: number;
    topTopics: string[];
    builderScore?: number;
    talentScore?: number;
    ethosScore?: number;
    ethosLevel?: EthosLevel;
  };
  imageUrl?: string;
  traits?: AvatarTraits;
  error?: string;
}

export interface BuilderIDInfo {
  contract: string;
  name: string;
  symbol: string;
  totalMinted: number;
}

// Check if user has Builder ID
export async function checkBuilderID(fid: number): Promise<{ hasBuilderId: boolean; record?: BuilderIDRecord }> {
  try {
    const res = await fetch(`${FIXR_API_URL}/api/builder-id/check/${fid}`);
    const data = await res.json();
    // API returns hasMinted, map to hasBuilderId
    return {
      hasBuilderId: data.hasMinted || false,
      record: data.record,
    };
  } catch (error) {
    return { hasBuilderId: false };
  }
}

// Get Builder ID info
export async function getBuilderIDInfo(): Promise<BuilderIDInfo | null> {
  try {
    const res = await fetch(`${FIXR_API_URL}/api/builder-id/info`);
    const data = await res.json();
    return data.success ? data : null;
  } catch (error) {
    return null;
  }
}

// Preview Builder ID (generate image without claiming)
export async function previewBuilderID(fid: number): Promise<BuilderIDPreview> {
  try {
    const res = await fetch(`${FIXR_API_URL}/api/builder-id/preview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fid }),
    });
    return await res.json();
  } catch (error) {
    return { success: false, error: 'Failed to generate preview' };
  }
}

// Get claim message for signing
export async function getClaimMessage(fid: number, walletAddress: string): Promise<{
  success: boolean;
  message?: string;
  timestamp?: number;
  username?: string;
  error?: string;
  verifiedAddresses?: string[];
}> {
  try {
    const res = await fetch(`${FIXR_API_URL}/api/builder-id/claim-message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fid, walletAddress }),
    });
    return await res.json();
  } catch (error) {
    return { success: false, error: 'Failed to get claim message' };
  }
}

// Claim Builder ID (record after on-chain mint)
export async function claimBuilderID(
  fid: number,
  walletAddress: string,
  txHash: string,
  timestamp: number
): Promise<{
  success: boolean;
  record?: BuilderIDRecord;
  error?: string;
}> {
  try {
    const res = await fetch(`${FIXR_API_URL}/api/builder-id/claim`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fid: fid.toString(), walletAddress, txHash, timestamp }),
    });
    return await res.json();
  } catch (error) {
    return { success: false, error: 'Failed to claim Builder ID' };
  }
}

// Get all Builder ID holders
export async function getBuilderIDHolders(limit: number = 20): Promise<BuilderIDRecord[]> {
  try {
    const res = await fetch(`${FIXR_API_URL}/api/builder-id/holders?limit=${limit}`);
    const data = await res.json();
    return data.holders || [];
  } catch (error) {
    return [];
  }
}

// Get Builder ID share URL
export function getBuilderIDShareUrl(fid: number): string {
  const APP_URL = typeof window !== 'undefined'
    ? window.location.origin
    : 'https://shipyard.fixr.nexus';
  return `${APP_URL}/builder/${fid}`;
}

// Get Leaderboard share URL
export function getLeaderboardShareUrl(): string {
  const APP_URL = typeof window !== 'undefined'
    ? window.location.origin
    : 'https://shipyard.fixr.nexus';
  return `${APP_URL}/leaderboard`;
}

// ============================================================================
// SHIP TRACKER API
// ============================================================================

// Get ships with optional filters
export async function getTrackedShips(options: {
  category?: ShipCategory;
  source?: ShipSource;
  limit?: number;
  offset?: number;
  featured?: boolean;
} = {}): Promise<Ship[]> {
  try {
    const params = new URLSearchParams();
    if (options.category) params.append('category', options.category);
    if (options.source) params.append('source', options.source);
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.offset) params.append('offset', options.offset.toString());
    if (options.featured !== undefined) params.append('featured', options.featured.toString());

    const res = await fetch(`${FIXR_API_URL}/api/ships?${params}`);
    const data = await res.json();

    if (!data.success) return [];

    return (data.ships || []).map((s: Record<string, unknown>) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      category: s.category,
      source: s.source,
      sourceUrl: s.source_url || s.sourceUrl,
      sourceId: s.source_id || s.sourceId,
      chain: s.chain,
      urls: s.urls || {},
      builders: s.builders || [],
      tags: s.tags || [],
      metrics: s.metrics,
      publishedAt: s.published_at || s.publishedAt,
      ingestedAt: s.ingested_at || s.ingestedAt,
      featured: s.featured,
    }));
  } catch (error) {
    console.error('Failed to fetch ships:', error);
    return [];
  }
}

// Get ship statistics
export async function getShipStats(): Promise<ShipStats | null> {
  try {
    const res = await fetch(`${FIXR_API_URL}/api/ships/stats`);
    const data = await res.json();

    if (!data.success) return null;

    return {
      totalShips: data.totalShips,
      totalBuilders: data.totalBuilders,
      byCategory: data.byCategory || {},
      bySource: data.bySource || {},
      recentShips: data.recentShips,
    };
  } catch (error) {
    console.error('Failed to fetch ship stats:', error);
    return null;
  }
}

// Category display names
export const SHIP_CATEGORY_LABELS: Record<ShipCategory, string> = {
  miniapp: 'Mini Apps',
  token: 'Tokens',
  protocol: 'Protocols',
  tool: 'Tools',
  agent: 'AI Agents',
  social: 'Social',
  nft: 'NFTs',
  infra: 'Infra',
  other: 'Other',
};

// Source display names
export const SHIP_SOURCE_LABELS: Record<ShipSource, string> = {
  clawcrunch: 'ClawCrunch',
  clanker_news: 'Clanker News',
  farcaster: 'Farcaster',
  github: 'GitHub',
  manual: 'Manual',
};

// Category colors
export const SHIP_CATEGORY_COLORS: Record<ShipCategory, string> = {
  miniapp: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  token: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  protocol: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  tool: 'bg-green-500/20 text-green-300 border-green-500/30',
  agent: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
  social: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  nft: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  infra: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
  other: 'bg-white/10 text-gray-300 border-white/20',
};

// ============================================================================
// ETHOS HELPERS
// ============================================================================

// Convert Ethos score (0-2800) to percentage (0-100)
export function ethosScoreToPercent(score: number): number {
  return Math.round((score / 2800) * 100);
}

// Get color for Ethos level
export function getEthosLevelColor(level: EthosLevel): string {
  const colors: Record<EthosLevel, string> = {
    untrusted: '#ef4444', // red
    questionable: '#f97316', // orange
    neutral: '#6b7280', // gray
    known: '#84cc16', // lime
    established: '#22c55e', // green
    reputable: '#14b8a6', // teal
    exemplary: '#06b6d4', // cyan
    distinguished: '#3b82f6', // blue
    revered: '#8b5cf6', // violet
    renowned: '#d946ef', // fuchsia
  };
  return colors[level] || '#6b7280';
}

// Get Ethos level display name (capitalize)
export function getEthosLevelDisplay(level: EthosLevel): string {
  return level.charAt(0).toUpperCase() + level.slice(1);
}
