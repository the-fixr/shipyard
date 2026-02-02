// Fixr API utilities for communicating with the worker

const FIXR_API_URL = process.env.NEXT_PUBLIC_FIXR_API_URL || 'https://fixr-agent.see21289.workers.dev';

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

// Analyze a token by address
export async function analyzeToken(address: string): Promise<TokenAnalysis> {
  try {
    const res = await fetch(`${FIXR_API_URL}/api/token/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address }),
    });
    return await res.json();
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
