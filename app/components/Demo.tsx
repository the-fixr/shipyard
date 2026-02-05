'use client';

import React, { useEffect, useState } from 'react';
import { encodeFunctionData, parseAbi } from 'viem';
import type { FrameContext } from '../types/frame';
import {
  analyzeToken,
  getTrendingBuilders,
  getShippedProjects,
  getRugIncidents,
  submitProject,
  getFeaturedProjects,
  getTrendingHashtags,
  extractMiniAppUrls,
  getScoreColor,
  getScoreBgColor,
  formatRelativeTime,
  checkBuilderID,
  previewBuilderID,
  claimBuilderID,
  getClaimMessage,
  getBuilderIDHolders,
  getBuilderIDInfo,
  getBuilderIDShareUrl,
  getLeaderboardShareUrl,
  getTrackedShips,
  getShipStats,
  SHIP_CATEGORY_LABELS,
  SHIP_SOURCE_LABELS,
  SHIP_CATEGORY_COLORS,
  type TokenAnalysis,
  type Builder,
  type BuilderCast,
  type RugIncident,
  type FeaturedProject,
  type BuilderIDRecord,
  type BuilderIDPreview,
  type AvatarTraits,
  type Ship,
  type ShipCategory,
  type ShipSource,
  type ShipStats,
} from '../lib/api';
import BaseStatsTicker from './BaseStatsTicker';
import {
  MagnifyingGlassIcon,
  UserGroupIcon,
  RocketLaunchIcon,
  ExclamationTriangleIcon,
  BookOpenIcon,
  ChevronLeftIcon,
  ArrowTopRightOnSquareIcon,
  HeartIcon,
  ArrowPathRoundedSquareIcon,
  SparklesIcon,
  PaperAirplaneIcon,
  BuildingLibraryIcon,
  DevicePhoneMobileIcon,
  CpuChipIcon,
  LinkIcon,
  WrenchScrewdriverIcon,
  ChatBubbleLeftRightIcon,
  CircleStackIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  XMarkIcon,
  PhotoIcon,
  HashtagIcon,
  FireIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  IdentificationIcon,
  ShieldCheckIcon,
  StarIcon,
  ShareIcon,
  FunnelIcon,
  GlobeAltIcon,
  CommandLineIcon,
} from '@heroicons/react/24/outline';
import {
  HeartIcon as HeartSolid,
} from '@heroicons/react/24/solid';

type View = 'home' | 'analyze' | 'builders' | 'shipped' | 'rugs' | 'submit' | 'learn' | 'builderid' | 'launch';

// ============================================================================
// TOKEN ANALYSIS CACHE
// ============================================================================
const TOKEN_CACHE_KEY = 'shipyard_token_cache';
const TOKEN_CACHE_TTL = 1000 * 60 * 30; // 30 minutes

interface CachedAnalysis {
  data: import('../lib/api').TokenAnalysis;
  timestamp: number;
}

function getCachedAnalysis(address: string): import('../lib/api').TokenAnalysis | null {
  try {
    const cache = localStorage.getItem(TOKEN_CACHE_KEY);
    if (!cache) return null;
    const parsed: Record<string, CachedAnalysis> = JSON.parse(cache);
    const entry = parsed[address.toLowerCase()];
    if (!entry) return null;
    if (Date.now() - entry.timestamp > TOKEN_CACHE_TTL) {
      delete parsed[address.toLowerCase()];
      localStorage.setItem(TOKEN_CACHE_KEY, JSON.stringify(parsed));
      return null;
    }
    return entry.data;
  } catch {
    return null;
  }
}

function setCachedAnalysis(address: string, data: import('../lib/api').TokenAnalysis): void {
  try {
    const cache = localStorage.getItem(TOKEN_CACHE_KEY);
    const parsed: Record<string, CachedAnalysis> = cache ? JSON.parse(cache) : {};
    parsed[address.toLowerCase()] = { data, timestamp: Date.now() };
    localStorage.setItem(TOKEN_CACHE_KEY, JSON.stringify(parsed));
  } catch {
    // Ignore cache errors
  }
}

// ============================================================================
// SKELETON LOADERS
// ============================================================================
function SkeletonCard() {
  return (
    <div className="animate-pulse p-4 bg-white/5 rounded-xl border border-white/5">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-white/10" />
        <div className="flex-1">
          <div className="h-4 bg-white/10 rounded w-24 mb-1" />
          <div className="h-3 bg-white/5 rounded w-16" />
        </div>
      </div>
      <div className="h-3 bg-white/10 rounded w-full mb-2" />
      <div className="h-3 bg-white/5 rounded w-3/4" />
    </div>
  );
}

function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

function SkeletonBuilderRow() {
  return (
    <div className="animate-pulse flex items-center gap-4 p-4 bg-white/5 rounded-xl">
      <div className="w-8 h-8 rounded-full bg-white/10" />
      <div className="w-12 h-12 rounded-full bg-white/10" />
      <div className="flex-1">
        <div className="h-4 bg-white/10 rounded w-24 mb-1" />
        <div className="h-3 bg-white/5 rounded w-16" />
      </div>
      <div className="text-right">
        <div className="h-5 bg-white/10 rounded w-8 mb-1" />
        <div className="h-2 bg-white/5 rounded w-12" />
      </div>
    </div>
  );
}

// ============================================================================
// HEADER COMPONENT
// ============================================================================
function Header({
  frameData,
  view,
  setView,
}: {
  frameData: FrameContext | null;
  view: View;
  setView: (view: View) => void;
}) {
  return (
    <header className="relative z-10">
      <div className="relative flex items-center justify-between py-2 px-1">
        {/* Left: Back button or Logo */}
        <div className="flex items-center gap-2">
          {view !== 'home' ? (
            <button
              onClick={() => setView('home')}
              aria-label="Go back to home"
              className="flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors group"
            >
              <ChevronLeftIcon className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              <span className="text-xs font-medium">Back</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <div className="relative">
                <div className="absolute inset-0 bg-purple-500 rounded-full blur-md opacity-40" />
                <img
                  src="/images/fixrpfp.png"
                  alt="Shipyard by Fixr - Builder tools for Base"
                  className="relative w-8 h-8 rounded-full border border-purple-500/50"
                />
              </div>
              <div>
                <h1 className="text-lg font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent leading-tight">
                  Shipyard
                </h1>
                <p className="text-[9px] text-gray-500 uppercase tracking-wider">by Fixr</p>
              </div>
            </div>
          )}
        </div>

        {/* Right: User Profile */}
        {frameData?.user ? (
          <div className="flex items-center gap-2 bg-white/5 backdrop-blur-sm rounded-full pl-2.5 pr-1.5 py-1 border border-white/10">
            <div className="text-right">
              <div className="text-xs font-medium text-white truncate max-w-[80px]">
                {frameData.user.displayName || frameData.user.username}
              </div>
              <div className="text-[9px] text-gray-400">@{frameData.user.username}</div>
            </div>
            {frameData.user.pfpUrl && (
              <img
                src={frameData.user.pfpUrl}
                alt={`@${frameData.user.username}'s profile picture`}
                className="w-7 h-7 rounded-full border border-purple-400/30"
              />
            )}
          </div>
        ) : (
          <div className="text-xs text-gray-500 bg-white/5 rounded-full px-4 py-2">
            Not connected
          </div>
        )}
      </div>
    </header>
  );
}

// ============================================================================
// FOOTER COMPONENT
// ============================================================================
function Footer() {
  const openUrl = (url: string) => {
    if (window.frame?.sdk) {
      window.frame.sdk.actions.openUrl(url);
    } else {
      window.open(url, '_blank');
    }
  };

  return (
    <footer className="relative mt-8 pt-6 border-t border-white/5">
      {/* Gradient line */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-px bg-gradient-to-r from-transparent via-purple-500 to-transparent" />

      <div className="flex flex-col items-center gap-4">
        {/* Social Links */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => openUrl('https://farcaster.xyz/fixr')}
            className="group flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-purple-500/20 rounded-full border border-white/10 hover:border-purple-500/50 transition-all"
          >
            <svg className="w-4 h-4 text-purple-400" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.24.24H5.76C2.5789.24 0 2.8188 0 6v12c0 3.1811 2.5789 5.76 5.76 5.76h12.48c3.1812 0 5.76-2.5789 5.76-5.76V6C24 2.8188 21.4212.24 18.24.24m.8155 17.1662v.504c.2868-.0256.5458.1905.5439.479v.5688h-5.1437v-.5688c-.0019-.2885.2576-.5047.5443-.479v-.504c0-.22.1525-.402.358-.458l-.0095-4.3645c-.1589-1.7366-1.6402-3.0979-3.4435-3.0979-1.8038 0-3.2846 1.3613-3.4435 3.0979l-.0096 4.3578c.2276.0424.5318.2083.5395.4648v.504c.2863-.0256.5457.1905.5438.479v.5688H4.3915v-.5688c-.0019-.2885.2575-.5047.5438-.479v-.504c0-.2529.2011-.4548.4536-.4724v-7.895h-.4905L4.2898 7.008l2.6405-.0005V5.0419h9.9495v1.9656h2.8219l-.6091 2.0314h-.4901v7.8949c.2519.0177.453.2195.453.4724"/>
            </svg>
            <span className="text-xs text-gray-300 group-hover:text-white">Farcaster</span>
          </button>

          <button
            onClick={() => openUrl('https://x.com/fixragent')}
            className="group flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-purple-500/20 rounded-full border border-white/10 hover:border-purple-500/50 transition-all"
          >
            <svg className="w-4 h-4 text-purple-400" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
            <span className="text-xs text-gray-300 group-hover:text-white">X / Twitter</span>
          </button>
        </div>

        {/* Credit */}
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <span>Powered by</span>
          <img src="/images/fixrpfp.png" alt="Fixr" className="w-4 h-4 rounded-full" />
          <span className="text-purple-400 font-medium">Fixr</span>
        </div>
      </div>
    </footer>
  );
}

// ============================================================================
// LOADING SPINNER
// ============================================================================
function LoadingSpinner({ text = 'Loading...' }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-4">
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 rounded-full border-2 border-purple-500/20" />
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-purple-500 animate-spin" />
      </div>
      <span className="text-gray-400 text-sm">{text}</span>
    </div>
  );
}

// ============================================================================
// SCORE DISPLAY
// ============================================================================
function ScoreDisplay({ score, size = 'large' }: { score: number; size?: 'large' | 'small' }) {
  const colorClass = getScoreColor(score);
  const bgClass = getScoreBgColor(score);

  if (size === 'small') {
    return (
      <span className={`px-2 py-1 rounded text-sm font-bold ${colorClass} ${bgClass} border`}>
        {score}
      </span>
    );
  }

  return (
    <div className="relative">
      <div className={`absolute inset-0 rounded-full blur-xl opacity-50 ${
        score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-yellow-500' : score >= 40 ? 'bg-orange-500' : 'bg-red-500'
      }`} />
      <div className={`relative w-24 h-24 rounded-full flex items-center justify-center ${bgClass} border-2`}>
        <span className={`text-3xl font-bold ${colorClass}`}>{score}</span>
      </div>
    </div>
  );
}

// ============================================================================
// SECTION HEADER
// ============================================================================
function SectionHeader({ title, subtitle, Icon, iconColor = 'text-purple-400' }: {
  title: string;
  subtitle: string;
  Icon?: React.ComponentType<{ className?: string }>;
  iconColor?: string;
}) {
  return (
    <div className="flex items-center gap-2 mb-3">
      {Icon && <Icon className={`w-5 h-5 ${iconColor}`} />}
      <div>
        <h2 className="text-lg font-bold text-white leading-tight">{title}</h2>
        <p className="text-gray-500 text-[10px]">{subtitle}</p>
      </div>
    </div>
  );
}

// ============================================================================
// TOKEN ANALYSIS VIEW
// ============================================================================
function TokenAnalyzeView({ frameData }: { frameData: FrameContext | null }) {
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TokenAnalysis | null>(null);
  const [fromCache, setFromCache] = useState(false);

  const handleAnalyze = async () => {
    if (!address.trim()) return;
    const trimmedAddress = address.trim();

    // Check cache first
    const cached = getCachedAnalysis(trimmedAddress);
    if (cached) {
      setResult(cached);
      setFromCache(true);
      return;
    }

    setLoading(true);
    setResult(null);
    setFromCache(false);
    const analysis = await analyzeToken(trimmedAddress);
    setResult(analysis);
    setLoading(false);

    // Cache successful results
    if (analysis.success) {
      setCachedAnalysis(trimmedAddress, analysis);
    }
  };

  return (
    <div className="space-y-3">
      <SectionHeader
        title="Token Scanner"
        subtitle="Security score for any token"
        Icon={MagnifyingGlassIcon}
        iconColor="text-cyan-400"
      />

      <div className="relative">
        <div className="relative flex gap-2 p-1 bg-black/50 backdrop-blur-sm rounded-lg border border-white/10">
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Token address (0x...)"
            className="flex-1 px-3 py-2 bg-transparent text-sm text-white placeholder-gray-500 focus:outline-none"
          />
          <button
            onClick={handleAnalyze}
            disabled={loading || !address.trim()}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-bold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              'Scan'
            )}
          </button>
        </div>
      </div>

      {result && (
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-b from-purple-600/10 to-transparent rounded-2xl blur-xl" />
          <div className="relative bg-black/40 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
            {result.success && result.token ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold text-white">{result.token.symbol}</h3>
                    <p className="text-gray-400">{result.token.name}</p>
                    <p className="text-xs text-purple-400 mt-1">{result.token.network}</p>
                  </div>
                  {result.score !== undefined && <ScoreDisplay score={result.score} />}
                </div>

                {result.verdict && (
                  <p className="text-gray-300 text-sm bg-white/5 rounded-lg p-3">{result.verdict}</p>
                )}

                {result.breakdown && result.breakdown.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Breakdown</h4>
                    {result.breakdown.map((item, i) => (
                      <div key={i} className="flex justify-between items-center p-2 bg-white/5 rounded-lg">
                        <span className="text-gray-300">{item.category}</span>
                        <ScoreDisplay score={item.score} size="small" />
                      </div>
                    ))}
                  </div>
                )}

                {result.risks && result.risks.length > 0 && (
                  <div className="space-y-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <h4 className="text-sm font-medium text-red-400">Risk Factors</h4>
                    {result.risks.map((risk, i) => (
                      <p key={i} className="text-xs text-gray-400 flex items-start gap-2">
                        <span className="text-red-400">!</span> {risk}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6">
                <ExclamationTriangleIcon className="w-10 h-10 text-red-400 mx-auto mb-2" />
                <p className="text-red-400">{result.error || 'Analysis failed'}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// BUILDERS VIEW
// ============================================================================
function BuildersView({ frameData }: { frameData: FrameContext | null }) {
  const [holders, setHolders] = useState<BuilderIDRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRank, setUserRank] = useState<number | null>(null);

  const viewProfile = (fid: number) => {
    if (window.frame?.sdk?.actions?.viewProfile) {
      window.frame.sdk.actions.viewProfile({ fid });
    } else {
      // Fallback: open profile URL without closing mini app
      const profileUrl = `https://farcaster.xyz/~/profiles/${fid}`;
      if (window.frame?.sdk?.actions?.openUrl) {
        window.frame.sdk.actions.openUrl(profileUrl);
      } else {
        window.open(profileUrl, '_blank');
      }
    }
  };

  const shareTop10Farcaster = () => {
    const top10 = holders.slice(0, 10);
    // Use @ mentions for users
    const leaderboardText = top10.map((h, i) =>
      `${i + 1}. @${h.username} - ${Math.round((h.neynarScore || 0) * 100)} pts`
    ).join('\n');

    const text = `Top 10 Builders on Shipyard\n\n${leaderboardText}`;

    // Build OG image URL with builder data: username,score,pfp;username,score,pfp;...
    const buildersParam = top10.map((h) => {
      const score = Math.round((h.neynarScore || 0) * 100);
      const pfp = encodeURIComponent(h.imageUrl || '');
      return `${h.username},${score},${pfp}`;
    }).join(';');
    const ogImageUrl = `https://shipyard.fixr.nexus/api/og?type=leaderboard&builders=${encodeURIComponent(buildersParam)}`;

    // Use URL constructor for proper encoding
    const url = new URL('https://farcaster.xyz/~/compose');
    url.searchParams.set('text', text);
    // Add OG image as first embed, mini app as second
    url.searchParams.append('embeds[]', ogImageUrl);
    url.searchParams.append('embeds[]', 'https://shipyard.fixr.nexus');
    const farcasterUrl = url.toString();

    if (window.frame?.sdk?.actions?.openUrl) {
      window.frame.sdk.actions.openUrl(farcasterUrl);
    } else {
      window.open(farcasterUrl, '_blank');
    }
  };

  const shareTop10X = () => {
    const top10 = holders.slice(0, 3);
    const leaderboardText = top10.map((h, i) =>
      `${i + 1}. ${h.username}`
    ).join(' ');

    const text = `Top builders on @shipaborBase: ${leaderboardText} and more! Check out the full leaderboard:`;
    const shareUrl = getLeaderboardShareUrl();
    const xUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;

    if (window.frame?.sdk?.actions?.openUrl) {
      window.frame.sdk.actions.openUrl(xUrl);
    } else {
      window.open(xUrl, '_blank');
    }
  };

  const shareMyRankFarcaster = (rank: number) => {
    if (!frameData?.user?.fid) return;
    const text = `I'm ranked #${rank} on the Shipyard Builder Leaderboard! Check out the top builders on Base:`;
    const shareUrl = getBuilderIDShareUrl(frameData.user.fid);
    const farcasterUrl = `https://farcaster.xyz/~/compose?text=${encodeURIComponent(text)}&embeds%5B%5D=${encodeURIComponent(shareUrl)}`;

    if (window.frame?.sdk?.actions?.openUrl) {
      window.frame.sdk.actions.openUrl(farcasterUrl);
    } else {
      window.open(farcasterUrl, '_blank');
    }
  };

  const shareMyRankX = (rank: number) => {
    if (!frameData?.user?.fid) return;
    const text = `I'm ranked #${rank} on the @shipaborBase Builder Leaderboard! Check out the top builders on Base:`;
    const shareUrl = getBuilderIDShareUrl(frameData.user.fid);
    const xUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;

    if (window.frame?.sdk?.actions?.openUrl) {
      window.frame.sdk.actions.openUrl(xUrl);
    } else {
      window.open(xUrl, '_blank');
    }
  };

  useEffect(() => {
    async function load() {
      const data = await getBuilderIDHolders(20);
      // Sort by neynarScore descending
      data.sort((a, b) => (b.neynarScore || 0) - (a.neynarScore || 0));
      setHolders(data);
      setLoading(false);

      // Check if connected user is in the leaderboard
      if (frameData?.user?.fid) {
        const userIndex = data.findIndex(h => h.fid === frameData.user?.fid);
        if (userIndex !== -1) {
          setUserRank(userIndex + 1);
        }
      }
    }
    load();
  }, [frameData?.user?.fid]);

  if (loading) {
    return (
      <div className="space-y-3">
        <SectionHeader
          title="Builder ID Leaderboard"
          subtitle="Top verified builders by reputation"
          Icon={UserGroupIcon}
          iconColor="text-purple-400"
        />
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonBuilderRow key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <SectionHeader
          title="Builder ID Leaderboard"
          subtitle="Top verified builders by reputation"
          Icon={UserGroupIcon}
          iconColor="text-purple-400"
        />
        <div className="flex items-center gap-1.5">
          <button
            onClick={shareTop10Farcaster}
            aria-label="Share top 10 builders on Farcaster"
            title="Share on Farcaster"
            className="p-2 bg-white/5 hover:bg-purple-500/20 rounded-lg border border-white/10 hover:border-purple-500/30 transition-all"
          >
            <svg className="w-4 h-4 text-purple-400" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.24.24H5.76C2.5789.24 0 2.8188 0 6v12c0 3.1811 2.5789 5.76 5.76 5.76h12.48c3.1812 0 5.76-2.5789 5.76-5.76V6C24 2.8188 21.4212.24 18.24.24m.8155 17.1662v.504c.2868-.0256.5458.1905.5439.479v.5688h-5.1437v-.5688c-.0019-.2885.2576-.5047.5443-.479v-.504c0-.22.1525-.402.358-.458l-.0095-4.3645c-.1589-1.7366-1.6402-3.0979-3.4435-3.0979-1.8038 0-3.2846 1.3613-3.4435 3.0979l-.0096 4.3578c.2276.0424.5318.2083.5395.4648v.504c.2863-.0256.5457.1905.5438.479v.5688H4.3915v-.5688c-.0019-.2885.2575-.5047.5438-.479v-.504c0-.2529.2011-.4548.4536-.4724v-7.895h-.4905L4.2898 7.008l2.6405-.0005V5.0419h9.9495v1.9656h2.8219l-.6091 2.0314h-.4901v7.8949c.2519.0177.453.2195.453.4724"/>
            </svg>
          </button>
          <button
            onClick={shareTop10X}
            aria-label="Share top 10 builders on X"
            title="Share on X"
            className="p-2 bg-white/5 hover:bg-gray-500/20 rounded-lg border border-white/10 hover:border-gray-500/30 transition-all"
          >
            <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
          </button>
        </div>
      </div>

      {/* User's rank highlight */}
      {userRank && (
        <div className="p-3 bg-purple-500/10 rounded-xl border border-purple-500/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-purple-400">#{userRank}</span>
              <span className="text-white text-sm">Your rank</span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => shareMyRankFarcaster(userRank)}
                aria-label={`Share rank on Farcaster`}
                title="Share on Farcaster"
                className="flex items-center gap-1 px-2.5 py-1.5 bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 rounded-lg text-xs font-medium transition-colors"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.24.24H5.76C2.5789.24 0 2.8188 0 6v12c0 3.1811 2.5789 5.76 5.76 5.76h12.48c3.1812 0 5.76-2.5789 5.76-5.76V6C24 2.8188 21.4212.24 18.24.24m.8155 17.1662v.504c.2868-.0256.5458.1905.5439.479v.5688h-5.1437v-.5688c-.0019-.2885.2576-.5047.5443-.479v-.504c0-.22.1525-.402.358-.458l-.0095-4.3645c-.1589-1.7366-1.6402-3.0979-3.4435-3.0979-1.8038 0-3.2846 1.3613-3.4435 3.0979l-.0096 4.3578c.2276.0424.5318.2083.5395.4648v.504c.2863-.0256.5457.1905.5438.479v.5688H4.3915v-.5688c-.0019-.2885.2575-.5047.5438-.479v-.504c0-.2529.2011-.4548.4536-.4724v-7.895h-.4905L4.2898 7.008l2.6405-.0005V5.0419h9.9495v1.9656h2.8219l-.6091 2.0314h-.4901v7.8949c.2519.0177.453.2195.453.4724"/>
                </svg>
                Share
              </button>
              <button
                onClick={() => shareMyRankX(userRank)}
                aria-label={`Share rank on X`}
                title="Share on X"
                className="flex items-center gap-1 px-2.5 py-1.5 bg-gray-600/20 hover:bg-gray-600/30 text-gray-400 rounded-lg text-xs font-medium transition-colors"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                X
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {holders.map((holder, index) => (
          <button
            key={holder.fid}
            onClick={() => viewProfile(holder.fid)}
            className="group relative w-full text-left"
          >
            {index < 3 && (
              <div className={`absolute inset-0 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity ${
                index === 0 ? 'bg-yellow-500/20' : index === 1 ? 'bg-gray-400/20' : 'bg-orange-500/20'
              }`} />
            )}
            <div className="relative flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 backdrop-blur-sm rounded-xl border border-white/5 hover:border-white/20 transition-all">
              {/* Rank */}
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${
                index === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                index === 1 ? 'bg-gray-400/20 text-gray-300' :
                index === 2 ? 'bg-orange-500/20 text-orange-400' :
                'bg-white/5 text-gray-500'
              }`}>
                {index + 1}
              </div>

              {/* Avatar */}
              <img
                src={holder.imageUrl}
                alt={`@${holder.username}'s Builder ID avatar - Rank #${index + 1}`}
                className="w-11 h-11 rounded-xl border-2 border-purple-500/30"
              />

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="font-medium text-white truncate flex items-center gap-1.5">
                  @{holder.username}
                  {holder.powerBadge && (
                    <span className="text-yellow-400 text-xs">⭐</span>
                  )}
                </div>
                <div className="text-xs text-gray-500">FID: {holder.fid}</div>
              </div>

              {/* Scores */}
              <div className="flex gap-2 items-center">
                {/* Neynar Score */}
                {holder.neynarScore !== undefined && holder.neynarScore !== null && (
                  <div className="text-center px-2">
                    <div className="text-sm font-bold text-cyan-400">
                      {Math.round(holder.neynarScore * 100)}%
                    </div>
                    <div className="text-[9px] text-gray-500 uppercase">Neynar</div>
                  </div>
                )}
                {/* Ethos Score */}
                {holder.ethosScore !== undefined && holder.ethosScore !== null && (
                  <div className="text-center px-2">
                    <div className="text-sm font-bold text-teal-400">
                      {holder.ethosScore}
                    </div>
                    <div className="text-[9px] text-gray-500 uppercase">Ethos</div>
                  </div>
                )}
                {/* Builder Score */}
                {holder.builderScore !== undefined && holder.builderScore > 0 && (
                  <div className="text-center px-2">
                    <div className="text-sm font-bold text-purple-400">
                      {holder.builderScore}
                    </div>
                    <div className="text-[9px] text-gray-500 uppercase">Score</div>
                  </div>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>

      {holders.length === 0 && (
        <div className="text-center py-8 text-gray-500">No Builder ID holders yet</div>
      )}
    </div>
  );
}

// ============================================================================
// SHIPPED PROJECTS VIEW
// ============================================================================
function ShippedView() {
  const [tab, setTab] = useState<'ships' | 'casts'>('ships');
  const [ships, setShips] = useState<Ship[]>([]);
  const [stats, setStats] = useState<ShipStats | null>(null);
  const [projects, setProjects] = useState<BuilderCast[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<ShipCategory | 'all'>('all');
  const [sourceFilter, setSourceFilter] = useState<ShipSource | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      if (tab === 'ships') {
        const [shipsData, statsData] = await Promise.all([
          getTrackedShips({
            category: categoryFilter === 'all' ? undefined : categoryFilter,
            source: sourceFilter === 'all' ? undefined : sourceFilter,
            limit: 50,
          }),
          getShipStats(),
        ]);
        setShips(shipsData);
        setStats(statsData);
      } else {
        const data = await getShippedProjects(20);
        setProjects(data);
      }
      setLoading(false);
    }
    load();
  }, [tab, categoryFilter, sourceFilter]);

  const CATEGORIES: (ShipCategory | 'all')[] = ['all', 'miniapp', 'token', 'agent', 'tool', 'protocol', 'social', 'nft', 'infra', 'other'];
  const SOURCES: (ShipSource | 'all')[] = ['all', 'farcaster', 'clanker_news', 'clawcrunch', 'github', 'manual'];

  return (
    <div className="space-y-3">
      <SectionHeader
        title="Ships"
        subtitle="Ecosystem projects & launches"
        Icon={RocketLaunchIcon}
        iconColor="text-orange-400"
      />

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-white/5 rounded-lg">
        <button
          onClick={() => setTab('ships')}
          className={`flex-1 px-3 py-2 text-xs font-medium rounded-md transition-colors ${
            tab === 'ships' ? 'bg-purple-500/30 text-purple-300' : 'text-gray-400 hover:text-white'
          }`}
        >
          <CircleStackIcon className="w-3.5 h-3.5 inline mr-1.5" />
          Tracked ({stats?.totalShips || '...'})
        </button>
        <button
          onClick={() => setTab('casts')}
          className={`flex-1 px-3 py-2 text-xs font-medium rounded-md transition-colors ${
            tab === 'casts' ? 'bg-purple-500/30 text-purple-300' : 'text-gray-400 hover:text-white'
          }`}
        >
          <ChatBubbleLeftRightIcon className="w-3.5 h-3.5 inline mr-1.5" />
          Casts
        </button>
      </div>

      {/* Filters (Ships tab only) */}
      {tab === 'ships' && (
        <div className="space-y-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 text-xs text-gray-400 hover:text-white transition-colors"
          >
            <FunnelIcon className="w-4 h-4" />
            Filters
            {(categoryFilter !== 'all' || sourceFilter !== 'all') && (
              <span className="px-1.5 py-0.5 bg-purple-500/20 text-purple-300 rounded text-[10px]">
                {[categoryFilter !== 'all' && categoryFilter, sourceFilter !== 'all' && sourceFilter].filter(Boolean).join(', ')}
              </span>
            )}
          </button>

          {showFilters && (
            <div className="p-3 bg-white/5 rounded-lg border border-white/10 space-y-3">
              {/* Category Filter */}
              <div>
                <label className="text-xs text-gray-500 mb-1.5 block">Category</label>
                <div className="flex flex-wrap gap-1.5">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setCategoryFilter(cat)}
                      className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                        categoryFilter === cat
                          ? 'bg-purple-500/30 text-purple-300 border-purple-500/50'
                          : 'bg-white/5 text-gray-400 border-white/10 hover:border-white/30'
                      }`}
                    >
                      {cat === 'all' ? 'All' : SHIP_CATEGORY_LABELS[cat]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Source Filter */}
              <div>
                <label className="text-xs text-gray-500 mb-1.5 block">Source</label>
                <div className="flex flex-wrap gap-1.5">
                  {SOURCES.map((src) => (
                    <button
                      key={src}
                      onClick={() => setSourceFilter(src)}
                      className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                        sourceFilter === src
                          ? 'bg-purple-500/30 text-purple-300 border-purple-500/50'
                          : 'bg-white/5 text-gray-400 border-white/10 hover:border-white/30'
                      }`}
                    >
                      {src === 'all' ? 'All' : SHIP_SOURCE_LABELS[src]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Clear Filters */}
              {(categoryFilter !== 'all' || sourceFilter !== 'all') && (
                <button
                  onClick={() => { setCategoryFilter('all'); setSourceFilter('all'); }}
                  className="text-xs text-gray-500 hover:text-white"
                >
                  Clear filters
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {loading ? (
        <SkeletonList count={4} />
      ) : tab === 'ships' ? (
        /* Ships List */
        <div className="space-y-2">
          {ships.map((ship) => (
            <div key={ship.id} className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/0 via-purple-600/5 to-purple-600/0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative p-4 bg-white/5 hover:bg-white/[0.07] backdrop-blur-sm rounded-xl border border-white/5 hover:border-purple-500/30 transition-all">
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="text-sm font-medium text-white line-clamp-1">{ship.name}</h3>
                  <span className={`shrink-0 px-2 py-0.5 text-[10px] rounded-full border ${SHIP_CATEGORY_COLORS[ship.category]}`}>
                    {SHIP_CATEGORY_LABELS[ship.category]}
                  </span>
                </div>

                {/* Description */}
                <p className="text-gray-400 text-xs leading-relaxed line-clamp-2 mb-3">
                  {ship.description || 'No description'}
                </p>

                {/* Meta & Links */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[10px] text-gray-500">
                    <span>{SHIP_SOURCE_LABELS[ship.source]}</span>
                    {ship.chain && <span className="text-purple-400">· {ship.chain}</span>}
                    <span>· {formatRelativeTime(ship.publishedAt)}</span>
                  </div>

                  <div className="flex gap-1.5">
                    {ship.sourceUrl && (
                      <button
                        onClick={() => window.frame?.sdk?.actions.openUrl(ship.sourceUrl)}
                        className="p-1.5 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
                        title="View source"
                      >
                        <GlobeAltIcon className="w-3 h-3 text-gray-400" />
                      </button>
                    )}
                    {ship.urls?.github && (
                      <button
                        onClick={() => window.frame?.sdk?.actions.openUrl(ship.urls.github!)}
                        className="p-1.5 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
                        title="GitHub"
                      >
                        <LinkIcon className="w-3 h-3 text-gray-400" />
                      </button>
                    )}
                    {ship.urls?.website && (
                      <button
                        onClick={() => window.frame?.sdk?.actions.openUrl(ship.urls.website!)}
                        className="p-1.5 bg-purple-500/20 rounded-full hover:bg-purple-500/30 transition-colors"
                        title="Website"
                      >
                        <ArrowTopRightOnSquareIcon className="w-3 h-3 text-purple-300" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Tags */}
                {ship.tags?.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {ship.tags.slice(0, 4).map((tag, i) => (
                      <span key={i} className="px-1.5 py-0.5 text-[10px] bg-white/5 text-gray-500 rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {ships.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No ships found{categoryFilter !== 'all' || sourceFilter !== 'all' ? ' with current filters' : ''}
            </div>
          )}
        </div>
      ) : (
        /* Casts List */
        <div className="space-y-2">
          {projects.map((cast) => {
            const miniAppUrls = extractMiniAppUrls(cast.text, cast.embeds || []);
            return (
              <div key={cast.hash} className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600/0 via-purple-600/5 to-purple-600/0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative p-4 bg-white/5 hover:bg-white/[0.07] backdrop-blur-sm rounded-xl border border-white/5 hover:border-purple-500/30 transition-all">
                  <div className="flex items-center gap-3 mb-3">
                    {cast.authorPfpUrl && (
                      <img src={cast.authorPfpUrl} alt={cast.authorUsername} className="w-8 h-8 rounded-full border border-white/10" />
                    )}
                    <div className="flex-1">
                      <span className="text-sm font-medium text-white">{cast.authorDisplayName || cast.authorUsername}</span>
                      <span className="text-xs text-gray-500 ml-2">{formatRelativeTime(cast.timestamp)}</span>
                    </div>
                  </div>
                  <p className="text-gray-300 text-sm leading-relaxed line-clamp-3">{cast.text}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      onClick={() => window.frame?.sdk?.actions.viewCast({ hash: cast.hash, authorUsername: cast.authorUsername, close: false })}
                      className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 bg-white/10 text-gray-300 rounded-full border border-white/20 hover:bg-white/20 transition-colors"
                    >
                      <EyeIcon className="w-3 h-3" />
                      View
                    </button>
                    {miniAppUrls.map((url, i) => (
                      <button
                        key={i}
                        onClick={() => window.frame?.sdk?.actions.openUrl(url)}
                        className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 bg-purple-500/20 text-purple-300 rounded-full border border-purple-500/30 hover:bg-purple-500/30 transition-colors"
                      >
                        <ArrowTopRightOnSquareIcon className="w-3 h-3" />
                        Open
                      </button>
                    ))}
                  </div>
                  <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <HeartIcon className="w-3.5 h-3.5" />
                      {cast.likes}
                    </span>
                    <span className="flex items-center gap-1">
                      <ArrowPathRoundedSquareIcon className="w-3.5 h-3.5" />
                      {cast.recasts}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
          {projects.length === 0 && (
            <div className="text-center py-8 text-gray-500">No shipped projects found</div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// RUG ALERTS VIEW
// ============================================================================
function RugsView() {
  const [incidents, setIncidents] = useState<RugIncident[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const data = await getRugIncidents(10);
      setIncidents(data);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="space-y-3">
        <SectionHeader
          title="Rug Alerts"
          subtitle="Incidents detected by Fixr"
          Icon={ExclamationTriangleIcon}
          iconColor="text-red-400"
        />
        <SkeletonList count={3} />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <SectionHeader
        title="Rug Alerts"
        subtitle="Incidents detected by Fixr"
        Icon={ExclamationTriangleIcon}
        iconColor="text-red-400"
      />

      <div className="space-y-2">
        {incidents.map((incident, i) => (
          <div
            key={i}
            className={`relative overflow-hidden rounded-lg border ${
              incident.severity === 'critical'
                ? 'bg-red-950/30 border-red-500/50'
                : incident.severity === 'confirmed'
                ? 'bg-orange-950/30 border-orange-500/50'
                : 'bg-yellow-950/30 border-yellow-500/50'
            }`}
          >
            {/* Severity indicator stripe */}
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${
              incident.severity === 'critical' ? 'bg-red-500' :
              incident.severity === 'confirmed' ? 'bg-orange-500' : 'bg-yellow-500'
            }`} />

            <div className="p-4 pl-5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-white">${incident.tokenSymbol}</span>
                  <span className="text-sm text-gray-400">{incident.tokenName}</span>
                </div>
                <span className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-wider ${
                  incident.severity === 'critical' ? 'bg-red-500 text-white' :
                  incident.severity === 'confirmed' ? 'bg-orange-500 text-white' :
                  'bg-yellow-500 text-black'
                }`}>
                  {incident.severity}
                </span>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <span className="text-gray-400">{incident.rugType.replace('_', ' ')}</span>
                <span className="text-red-400 font-mono">-{incident.priceDropPercent.toFixed(0)}%</span>
              </div>

              {incident.wePredictedIt && (
                <div className="mt-2 inline-flex items-center gap-1.5 text-xs text-green-400 bg-green-500/10 px-2 py-1 rounded-full">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Fixr flagged this
                </div>
              )}

              <p className="text-gray-600 text-xs mt-2">{formatRelativeTime(incident.detectedAt)}</p>
            </div>
          </div>
        ))}
      </div>

      {incidents.length === 0 && (
        <div className="text-center py-6">
          <SparklesIcon className="w-8 h-8 text-green-400 mx-auto mb-2" />
          <p className="text-gray-500 text-sm">No recent rug incidents</p>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// SUBMIT PROJECT VIEW
// ============================================================================
type ProjectType = 'miniapp' | 'tool' | 'token' | 'other';

function SubmitView({ frameData }: { frameData: FrameContext | null }) {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [longDescription, setLongDescription] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [projectType, setProjectType] = useState<ProjectType>('miniapp');
  const [tokenAddress, setTokenAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; error?: string } | null>(null);

  const projectTypes: { type: ProjectType; Icon: React.ComponentType<{ className?: string }>; label: string; color: string }[] = [
    { type: 'miniapp', Icon: DevicePhoneMobileIcon, label: 'Mini App', color: 'border-cyan-500/50 bg-cyan-500/10 text-cyan-400' },
    { type: 'tool', Icon: WrenchScrewdriverIcon, label: 'Tool', color: 'border-orange-500/50 bg-orange-500/10 text-orange-400' },
    { type: 'token', Icon: CurrencyDollarIcon, label: 'Token', color: 'border-green-500/50 bg-green-500/10 text-green-400' },
    { type: 'other', Icon: SparklesIcon, label: 'Other', color: 'border-purple-500/50 bg-purple-500/10 text-purple-400' },
  ];

  const handleSubmit = async () => {
    if (!name.trim() || !url.trim() || !frameData?.user) return;

    setSubmitting(true);
    setResult(null);

    const res = await submitProject({
      name: name.trim(),
      url: url.trim(),
      description: description.trim(),
      longDescription: longDescription.trim() || undefined,
      logoUrl: logoUrl.trim() || undefined,
      type: projectType,
      tokenAddress: tokenAddress.trim() || undefined,
      submitterFid: frameData.user.fid,
      submitterUsername: frameData.user.username,
      submitterPfpUrl: frameData.user.pfpUrl,
    });

    setResult(res);
    setSubmitting(false);

    if (res.success) {
      setName('');
      setUrl('');
      setDescription('');
      setLongDescription('');
      setLogoUrl('');
      setProjectType('miniapp');
      setTokenAddress('');
    }
  };

  return (
    <div className="space-y-3">
      <SectionHeader
        title="Submit Project"
        subtitle="Get featured on the builder feed"
        Icon={SparklesIcon}
        iconColor="text-pink-400"
      />

      {!frameData?.user ? (
        <div className="text-center py-6">
          <LinkIcon className="w-8 h-8 text-gray-500 mx-auto mb-2" />
          <p className="text-gray-400 text-sm">Connect via Farcaster to submit</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {/* Project Type Selection */}
          <div>
            <label className="block text-[11px] text-gray-400 mb-1.5">Project Type</label>
            <div className="grid grid-cols-4 gap-1.5">
              {projectTypes.map(({ type, Icon, label, color }) => (
                <button
                  key={type}
                  onClick={() => setProjectType(type)}
                  className={`p-2 rounded-lg border text-center transition-all ${
                    projectType === type
                      ? color
                      : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/20'
                  }`}
                >
                  <Icon className="w-4 h-4 mx-auto mb-0.5" />
                  <span className="text-[9px]">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Name & URL Row */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] text-gray-400 mb-1">Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My Project"
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 transition-colors"
              />
            </div>
            <div>
              <label className="block text-[11px] text-gray-400 mb-1">URL *</label>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 transition-colors"
              />
            </div>
          </div>

          {/* Logo URL */}
          <div>
            <label className="block text-[11px] text-gray-400 mb-1">
              <span className="flex items-center gap-1">
                <PhotoIcon className="w-3 h-3" />
                Logo URL (optional)
              </span>
            </label>
            <input
              type="text"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://your-logo.png"
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 transition-colors"
            />
          </div>

          {/* Short Description */}
          <div>
            <label className="block text-[11px] text-gray-400 mb-1">Short Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="One line about your project"
              maxLength={100}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 transition-colors"
            />
          </div>

          {/* Long Description */}
          <div>
            <label className="block text-[11px] text-gray-400 mb-1">Full Description (optional)</label>
            <textarea
              value={longDescription}
              onChange={(e) => setLongDescription(e.target.value)}
              placeholder="Tell us more about your project..."
              rows={2}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 transition-colors resize-none"
            />
          </div>

          {/* Token Address (only shown for token type) */}
          {projectType === 'token' && (
            <div>
              <label className="block text-[11px] text-gray-400 mb-1">
                <span className="flex items-center gap-1">
                  <CurrencyDollarIcon className="w-3 h-3" />
                  Token Contract Address
                </span>
              </label>
              <input
                type="text"
                value={tokenAddress}
                onChange={(e) => setTokenAddress(e.target.value)}
                placeholder="0x..."
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 transition-colors font-mono text-xs"
              />
              <p className="text-[9px] text-gray-500 mt-1">Token will be analyzed for safety score</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={submitting || !name.trim() || !url.trim()}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <PaperAirplaneIcon className="w-4 h-4" />
                Submit Project
              </>
            )}
          </button>

          {/* Result */}
          {result && (
            <div className={`p-2.5 rounded-xl flex items-center gap-2 ${
              result.success ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'
            }`}>
              {result.success ? (
                <CheckCircleIcon className="w-4 h-4 text-green-400 flex-shrink-0" />
              ) : (
                <XCircleIcon className="w-4 h-4 text-red-400 flex-shrink-0" />
              )}
              <p className={`text-xs ${result.success ? 'text-green-400' : 'text-red-400'}`}>
                {result.success ? 'Project submitted! Featured daily at 00:00 UTC.' : result.error}
              </p>
            </div>
          )}

          {/* Submitter Info */}
          <div className="flex items-center justify-center gap-2 pt-1">
            {frameData.user.pfpUrl && (
              <img src={frameData.user.pfpUrl} alt="" className="w-4 h-4 rounded-full" />
            )}
            <p className="text-[10px] text-gray-500">
              Submitting as <span className="text-purple-400">@{frameData.user.username}</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// LEARN VIEW - Developer Resources
// ============================================================================
interface DocLink {
  title: string;
  url: string;
  description: string;
}

interface DocCategory {
  name: string;
  Icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  description: string;
  links: DocLink[];
}

function LearnView() {
  const openUrl = (url: string) => {
    if (window.frame?.sdk) {
      window.frame.sdk.actions.openUrl(url);
    } else {
      window.open(url, '_blank');
    }
  };

  const categories: DocCategory[] = [
    {
      name: 'Farcaster Protocol',
      Icon: BuildingLibraryIcon,
      iconColor: 'text-purple-400',
      description: 'Core protocol docs',
      links: [
        { title: 'Farcaster Docs', url: 'https://docs.farcaster.xyz', description: 'Official protocol documentation' },
        { title: 'Protocol Spec', url: 'https://github.com/farcasterxyz/protocol', description: 'Technical specification' },
        { title: 'FIPs (Proposals)', url: 'https://github.com/farcasterxyz/FIPs', description: 'Farcaster Improvement Proposals' },
        { title: 'Hubble', url: 'https://docs.farcaster.xyz/hubble/hubble', description: 'Run your own Farcaster hub' },
      ],
    },
    {
      name: 'Mini Apps',
      Icon: DevicePhoneMobileIcon,
      iconColor: 'text-cyan-400',
      description: 'Build interactive apps',
      links: [
        { title: 'Mini Apps Docs', url: 'https://miniapps.farcaster.xyz', description: 'Official mini apps documentation' },
        { title: 'Mini App SDK', url: 'https://www.npmjs.com/package/@farcaster/frame-sdk', description: 'Official SDK for mini apps' },
        { title: 'Mini App Examples', url: 'https://github.com/farcasterxyz/frames-v2-demo', description: 'Official example projects' },
        { title: 'Manifest Config', url: 'https://miniapps.farcaster.xyz/docs/guides/manifest', description: 'App manifest configuration' },
      ],
    },
    {
      name: 'Neynar',
      Icon: CpuChipIcon,
      iconColor: 'text-pink-400',
      description: 'Infrastructure & APIs',
      links: [
        { title: 'Neynar Docs', url: 'https://docs.neynar.com', description: 'Complete API documentation' },
        { title: 'API Reference', url: 'https://docs.neynar.com/reference', description: 'Full API reference' },
        { title: 'Webhooks', url: 'https://docs.neynar.com/docs/webhooks', description: 'Real-time event notifications' },
        { title: 'Signer Guide', url: 'https://docs.neynar.com/docs/write-to-farcaster-with-neynar-managed-signers', description: 'Managed signers setup' },
        { title: 'Neynar SDK', url: 'https://github.com/neynar/nodejs-sdk', description: 'Node.js SDK' },
      ],
    },
    {
      name: 'Clanker',
      Icon: SparklesIcon,
      iconColor: 'text-yellow-400',
      description: 'Token deployment',
      links: [
        { title: 'Clanker Docs', url: 'https://docs.clanker.world', description: 'Official documentation' },
        { title: 'Clanker API', url: 'https://docs.clanker.world/technical-docs/api', description: 'API reference' },
        { title: 'Smart Contracts', url: 'https://docs.clanker.world/technical-docs/smart-contracts', description: 'Contract addresses & ABIs' },
        { title: 'Token Factory', url: 'https://www.clanker.world', description: 'Deploy tokens via Farcaster' },
      ],
    },
    {
      name: 'OnchainKit',
      Icon: LinkIcon,
      iconColor: 'text-blue-400',
      description: 'React components',
      links: [
        { title: 'OnchainKit Docs', url: 'https://onchainkit.xyz', description: 'Official documentation' },
        { title: 'Components', url: 'https://onchainkit.xyz/components', description: 'UI component library' },
        { title: 'Identity', url: 'https://onchainkit.xyz/identity/introduction', description: 'Identity components' },
        { title: 'Wallet', url: 'https://onchainkit.xyz/wallet/introduction', description: 'Wallet connection' },
        { title: 'Transactions', url: 'https://onchainkit.xyz/transaction/introduction', description: 'Transaction components' },
      ],
    },
    {
      name: 'Base',
      Icon: CircleStackIcon,
      iconColor: 'text-blue-300',
      description: 'Build on Base L2',
      links: [
        { title: 'Base Docs', url: 'https://docs.base.org', description: 'Official Base documentation' },
        { title: 'Base Learn', url: 'https://docs.base.org/base-learn/docs/welcome', description: 'Learn smart contract dev' },
        { title: 'Contracts', url: 'https://docs.base.org/docs/contracts', description: 'Contract addresses' },
        { title: 'Block Explorer', url: 'https://basescan.org', description: 'BaseScan explorer' },
        { title: 'Bridge', url: 'https://bridge.base.org', description: 'Official Base bridge' },
      ],
    },
    {
      name: 'Web3 Essentials',
      Icon: WrenchScrewdriverIcon,
      iconColor: 'text-orange-400',
      description: 'Core dev tools',
      links: [
        { title: 'Viem', url: 'https://viem.sh', description: 'TypeScript Ethereum library' },
        { title: 'Wagmi', url: 'https://wagmi.sh', description: 'React hooks for Ethereum' },
        { title: 'RainbowKit', url: 'https://rainbowkit.com', description: 'Wallet connection UI' },
        { title: 'Foundry', url: 'https://book.getfoundry.sh', description: 'Smart contract toolkit' },
        { title: 'Hardhat', url: 'https://hardhat.org/docs', description: 'Ethereum development environment' },
      ],
    },
    {
      name: 'Farcaster Social',
      Icon: ChatBubbleLeftRightIcon,
      iconColor: 'text-green-400',
      description: 'Client & social features',
      links: [
        { title: 'Farcaster App', url: 'https://farcaster.xyz', description: 'Official Farcaster client' },
        { title: 'Composer Actions', url: 'https://docs.farcaster.xyz/reference/actions/spec', description: 'Cast composer actions' },
        { title: 'Channels', url: 'https://docs.farcaster.xyz/reference/channels', description: 'Channel documentation' },
        { title: 'Direct Casts', url: 'https://docs.farcaster.xyz/reference/direct-casts', description: 'DM specification' },
      ],
    },
  ];

  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      <SectionHeader
        title="Developer Resources"
        subtitle="Build on Farcaster"
        Icon={BookOpenIcon}
        iconColor="text-emerald-400"
      />

      <div className="space-y-1.5">
        {categories.map((category) => {
          const isExpanded = expandedCategory === category.name;
          return (
            <div key={category.name} className="relative">
              <button
                onClick={() => setExpandedCategory(isExpanded ? null : category.name)}
                className="w-full bg-white/5 hover:bg-white/[0.07] backdrop-blur-sm rounded-lg border border-white/5 hover:border-white/10 transition-all"
              >
                <div className="p-2.5 flex items-center gap-2.5">
                  <category.Icon className={`w-4 h-4 ${category.iconColor} flex-shrink-0`} />
                  <div className="flex-1 text-left">
                    <h3 className="text-xs font-medium text-white">{category.name}</h3>
                    <p className="text-[9px] text-gray-500">{category.description}</p>
                  </div>
                  <ChevronLeftIcon className={`w-3.5 h-3.5 text-gray-500 transition-transform ${isExpanded ? '-rotate-90' : 'rotate-180'}`} />
                </div>
              </button>

              {isExpanded && (
                <div className="mt-1 ml-4 bg-white/[0.03] rounded-lg border border-white/5 overflow-hidden">
                  {category.links.map((link) => (
                    <button
                      key={link.url}
                      onClick={() => openUrl(link.url)}
                      className="w-full p-2 flex items-center justify-between hover:bg-white/5 transition-colors text-left border-b border-white/5 last:border-b-0"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] font-medium text-purple-300">{link.title}</div>
                        <div className="text-[9px] text-gray-500 truncate">{link.description}</div>
                      </div>
                      <ArrowTopRightOnSquareIcon className="w-3 h-3 text-gray-600 flex-shrink-0 ml-2" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Quick Links Footer */}
      <div className="p-2.5 bg-gradient-to-r from-purple-900/20 to-pink-900/20 rounded-lg border border-purple-500/20">
        <h4 className="text-[10px] font-medium text-purple-300 mb-2">Quick Start Templates</h4>
        <div className="flex flex-wrap gap-1.5">
          {[
            { name: 'Mini App', url: 'https://github.com/farcasterxyz/frames-v2-demo' },
            { name: 'OnchainKit', url: 'https://github.com/coinbase/onchain-app-template' },
            { name: 'Base App', url: 'https://github.com/base-org/web' },
          ].map((template) => (
            <button
              key={template.url}
              onClick={() => openUrl(template.url)}
              className="text-[10px] px-2 py-1 bg-purple-500/20 text-purple-300 rounded-full border border-purple-500/30 hover:bg-purple-500/30 transition-colors"
            >
              {template.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// LAUNCH VIEW - Mini App Launchpad
// ============================================================================
function LaunchView() {
  const [step, setStep] = useState(0);
  const [appName, setAppName] = useState('');
  const [features, setFeatures] = useState<string[]>([]);
  const [primaryColor, setPrimaryColor] = useState('#8B5CF6'); // Purple default

  const openUrl = (url: string) => {
    if (window.frame?.sdk) {
      window.frame.sdk.actions.openUrl(url);
    } else {
      window.open(url, '_blank');
    }
  };

  const TEMPLATE_URL = 'https://github.com/the-fixr/farcaster-miniapp-template';

  const FEATURE_OPTIONS = [
    { id: 'wallet', name: 'Wallet Connect', desc: 'Native Farcaster wallet integration', icon: '💳' },
    { id: 'auth', name: 'User Auth', desc: 'Farcaster sign-in & context', icon: '🔐' },
    { id: 'nft', name: 'NFT Support', desc: 'Mint and display NFTs', icon: '🖼️' },
    { id: 'token', name: 'Token Gating', desc: 'Token-based access control', icon: '🎟️' },
  ];

  const COLOR_OPTIONS = [
    { name: 'Purple', value: '#8B5CF6' },
    { name: 'Blue', value: '#3B82F6' },
    { name: 'Green', value: '#10B981' },
    { name: 'Pink', value: '#EC4899' },
    { name: 'Orange', value: '#F97316' },
    { name: 'Cyan', value: '#06B6D4' },
  ];

  const steps = [
    { title: 'Name', desc: 'Choose your app name' },
    { title: 'Features', desc: 'Select features to include' },
    { title: 'Style', desc: 'Pick your brand colors' },
    { title: 'Clone', desc: 'Get the template' },
    { title: 'Deploy', desc: 'Ship your mini app' },
  ];

  const toggleFeature = (id: string) => {
    setFeatures(prev =>
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

  const canProceed = () => {
    if (step === 0) return appName.trim().length >= 2;
    return true;
  };

  const renderStepContent = () => {
    switch (step) {
      case 0:
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-400">What will you call your mini app?</p>
            <input
              type="text"
              value={appName}
              onChange={(e) => setAppName(e.target.value)}
              placeholder="My Awesome App"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30"
              autoFocus
            />
            <p className="text-[10px] text-gray-500">
              This will be displayed in Farcaster when users open your app.
            </p>
          </div>
        );

      case 1:
        return (
          <div className="space-y-3">
            <p className="text-sm text-gray-400">Select the features you want to include:</p>
            <div className="grid grid-cols-2 gap-2">
              {FEATURE_OPTIONS.map((feature) => {
                const isSelected = features.includes(feature.id);
                return (
                  <button
                    key={feature.id}
                    onClick={() => toggleFeature(feature.id)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-purple-500/20 border-purple-500/50'
                        : 'bg-white/5 border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="text-lg mb-1">{feature.icon}</div>
                    <div className="text-xs font-medium text-white">{feature.name}</div>
                    <div className="text-[9px] text-gray-500">{feature.desc}</div>
                    {isSelected && (
                      <CheckCircleIcon className="absolute top-2 right-2 w-4 h-4 text-purple-400" />
                    )}
                  </button>
                );
              })}
            </div>
            <p className="text-[10px] text-gray-500">
              The template includes wallet connect by default. Additional features can be enabled.
            </p>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-400">Pick your primary brand color:</p>
            <div className="grid grid-cols-3 gap-2">
              {COLOR_OPTIONS.map((color) => (
                <button
                  key={color.value}
                  onClick={() => setPrimaryColor(color.value)}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    primaryColor === color.value
                      ? 'border-white/50 scale-105'
                      : 'border-white/10 hover:border-white/20'
                  }`}
                >
                  <div
                    className="w-8 h-8 rounded-full mx-auto mb-1.5"
                    style={{ backgroundColor: color.value }}
                  />
                  <div className="text-[10px] text-white">{color.name}</div>
                </button>
              ))}
            </div>
            <div className="p-3 bg-white/5 rounded-xl border border-white/10">
              <div className="text-[10px] text-gray-400 mb-2">Preview:</div>
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: primaryColor }}
                >
                  <RocketLaunchIcon className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="text-sm font-medium text-white">{appName || 'My App'}</div>
                  <div className="text-[9px] text-gray-500">Farcaster Mini App</div>
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-400">Clone the Fixr template to get started:</p>

            <button
              onClick={() => openUrl(TEMPLATE_URL)}
              className="w-full p-4 bg-gradient-to-r from-purple-600/30 to-pink-600/30 hover:from-purple-600/40 hover:to-pink-600/40 rounded-xl border border-purple-500/30 hover:border-purple-500/50 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                  <CommandLineIcon className="w-5 h-5 text-purple-400" />
                </div>
                <div className="flex-1 text-left">
                  <div className="text-sm font-medium text-white">farcaster-miniapp-template</div>
                  <div className="text-[10px] text-purple-300/70">Click to open on GitHub</div>
                </div>
                <ArrowTopRightOnSquareIcon className="w-4 h-4 text-purple-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </div>
            </button>

            <div className="p-3 bg-white/5 rounded-xl border border-white/10">
              <div className="text-[10px] font-medium text-white mb-2">Quick Start:</div>
              <div className="font-mono text-[10px] text-purple-300 bg-black/30 p-2 rounded">
                git clone {TEMPLATE_URL}.git {appName.toLowerCase().replace(/\s+/g, '-') || 'my-app'}
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-[10px] font-medium text-white">Template includes:</div>
              <ul className="text-[10px] text-gray-400 space-y-1">
                <li className="flex items-center gap-2">
                  <CheckCircleIcon className="w-3 h-3 text-green-400" />
                  @farcaster/miniapp-sdk integration
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircleIcon className="w-3 h-3 text-green-400" />
                  Native wallet connector (wagmi)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircleIcon className="w-3 h-3 text-green-400" />
                  Next.js 15 + React 19 + TypeScript
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircleIcon className="w-3 h-3 text-green-400" />
                  Tailwind CSS styling
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircleIcon className="w-3 h-3 text-green-400" />
                  Security best practices
                </li>
              </ul>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-400">Follow these steps to deploy your mini app:</p>

            <div className="space-y-2">
              {[
                { step: 1, title: 'Install dependencies', cmd: 'npm install' },
                { step: 2, title: 'Configure .env', cmd: 'cp .env.example .env.local' },
                { step: 3, title: 'Start development', cmd: 'npm run dev' },
                { step: 4, title: 'Deploy to Vercel', cmd: 'vercel' },
              ].map((item) => (
                <div key={item.step} className="flex items-start gap-3 p-2.5 bg-white/5 rounded-lg border border-white/10">
                  <div className="w-5 h-5 rounded-full bg-purple-500/30 text-purple-300 text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                    {item.step}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-white">{item.title}</div>
                    <code className="text-[9px] text-purple-300">{item.cmd}</code>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 bg-gradient-to-r from-purple-900/20 to-pink-900/20 rounded-xl border border-purple-500/20">
              <div className="flex items-center gap-2 mb-2">
                <BookOpenIcon className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-medium text-purple-300">Need Help?</span>
              </div>
              <p className="text-[10px] text-purple-200/70 mb-2">
                Check out the Learn section in Shipyard for comprehensive developer resources on building Farcaster apps.
              </p>
              <button
                onClick={() => setStep(0)}
                className="text-[10px] text-purple-300 underline"
              >
                ← Back to start
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Mini App Launchpad"
        subtitle="Build your Farcaster app"
        Icon={CommandLineIcon}
        iconColor="text-indigo-400"
      />

      {/* Step Progress */}
      <div className="flex items-center justify-between px-2">
        {steps.map((s, i) => (
          <div key={i} className="flex flex-col items-center">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                i < step
                  ? 'bg-purple-500 text-white'
                  : i === step
                  ? 'bg-purple-500/30 text-purple-300 ring-2 ring-purple-500/50'
                  : 'bg-white/10 text-gray-500'
              }`}
            >
              {i < step ? '✓' : i + 1}
            </div>
            <div className={`text-[8px] mt-1 ${i === step ? 'text-purple-300' : 'text-gray-500'}`}>
              {s.title}
            </div>
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="min-h-[280px]">
        {renderStepContent()}
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-2">
        {step > 0 && (
          <button
            onClick={() => setStep(step - 1)}
            className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-sm text-white transition-all"
          >
            Back
          </button>
        )}
        {step < steps.length - 1 ? (
          <button
            onClick={() => setStep(step + 1)}
            disabled={!canProceed()}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
              canProceed()
                ? 'bg-purple-500 hover:bg-purple-600 text-white'
                : 'bg-white/10 text-gray-500 cursor-not-allowed'
            }`}
          >
            Next
          </button>
        ) : (
          <button
            onClick={() => openUrl(TEMPLATE_URL)}
            className="flex-1 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-xl text-sm font-medium text-white transition-all"
          >
            🚀 Start Building
          </button>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// BUILDER ID VIEW
// ============================================================================
function BuilderIDView({ frameData }: { frameData: FrameContext | null }) {
  const [loading, setLoading] = useState(true);
  const [existingRecord, setExistingRecord] = useState<BuilderIDRecord | null>(null);
  const [minting, setMinting] = useState(false);
  const [mintStatus, setMintStatus] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [holders, setHolders] = useState<BuilderIDRecord[]>([]);
  const [totalMinted, setTotalMinted] = useState(0);
  const [connectedWallet, setConnectedWallet] = useState<string | null>(null);
  const [step, setStep] = useState<'check' | 'minting' | 'done'>('check');

  useEffect(() => {
    async function load() {
      if (!frameData?.user?.fid) {
        setLoading(false);
        return;
      }

      // Check if user already has Builder ID
      const checkResult = await checkBuilderID(frameData.user.fid);
      if (checkResult.hasBuilderId && checkResult.record) {
        setExistingRecord(checkResult.record);
        setStep('done');
      }

      // Get total minted count
      const info = await getBuilderIDInfo();
      if (info) {
        setTotalMinted(info.totalMinted);
      }

      // Get recent holders
      const recentHolders = await getBuilderIDHolders(5);
      setHolders(recentHolders);

      // Try to get connected wallet
      try {
        const provider = window.frame?.sdk?.wallet?.ethProvider || window.ethereum;
        if (provider) {
          const accounts = await provider.request({ method: 'eth_accounts' }) as string[];
          if (accounts && accounts.length > 0) {
            setConnectedWallet(accounts[0]);
          }
        }
      } catch {
        // Wallet not connected yet, that's ok
      }

      setLoading(false);
    }
    load();
  }, [frameData?.user?.fid]);

  const handleMint = async () => {
    if (!frameData?.user?.fid) return;

    setMinting(true);
    setError(null);
    setStep('minting');

    try {
      // Step 1: Connect wallet
      setMintStatus('Connecting wallet...');
      const provider = window.frame?.sdk?.wallet?.ethProvider || window.ethereum;
      if (!provider) {
        throw new Error('No wallet provider available. Please use Warpcast or connect a wallet.');
      }

      const accounts = await provider.request({
        method: 'eth_requestAccounts',
      }) as string[];

      if (!accounts || accounts.length === 0) {
        throw new Error('No wallet connected');
      }

      const walletAddress = accounts[0];
      setConnectedWallet(walletAddress);

      // Step 2: Verify wallet is in Farcaster verified addresses
      setMintStatus('Verifying wallet...');
      const verifyResult = await getClaimMessage(frameData.user.fid, walletAddress);

      if (!verifyResult.success) {
        throw new Error(verifyResult.error || 'Wallet not verified on Farcaster. Please verify this wallet in your Farcaster settings.');
      }

      // Step 3: Ensure we're on Base network
      setMintStatus('Checking network...');
      const chainId = await provider.request({ method: 'eth_chainId' }) as string;
      if (chainId !== '0x2105') {
        setMintStatus('Switching to Base...');
        try {
          await provider.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x2105' }],
          });
        } catch {
          throw new Error('Please switch to Base network to mint your Builder ID');
        }
      }

      // Step 4: Check balance
      setMintStatus('Checking balance...');
      const balance = await provider.request({
        method: 'eth_getBalance',
        params: [walletAddress, 'latest'],
      }) as string;

      const balanceWei = BigInt(balance);
      const mintPriceWei = BigInt('100000000000000'); // 0.0001 ETH
      const gasBuffer = BigInt('50000000000000'); // ~0.00005 ETH for gas

      if (balanceWei < mintPriceWei + gasBuffer) {
        const balanceEth = Number(balanceWei) / 1e18;
        throw new Error(`Insufficient balance. You have ${balanceEth.toFixed(6)} ETH, need at least 0.00015 ETH (0.0001 mint + gas).`);
      }

      // Step 5: Send mint transaction
      setMintStatus('Confirm transaction in wallet...');

      const contractAddress = '0xbe2940989E203FE1cfD75e0bAa1202D58A273956';
      const mintPrice = '0x5AF3107A4000'; // 0.0001 ETH in hex

      const fid = frameData.user.fid;
      const username = frameData.user.username || verifyResult.username || '';

      // ABI encode using viem for reliable encoding
      const builderIdAbi = parseAbi(['function claim(uint256 fid, string username) payable']);
      const data = encodeFunctionData({
        abi: builderIdAbi,
        functionName: 'claim',
        args: [BigInt(fid), username],
      });

      const txHash = await provider.request({
        method: 'eth_sendTransaction',
        params: [{
          from: walletAddress,
          to: contractAddress,
          value: mintPrice,
          data: data,
        }],
      }) as string;

      // Step 6: Wait for transaction and generate image
      setMintStatus('Transaction sent! Generating your Builder ID...');

      // Call the API to record the claim and generate the image
      const result = await claimBuilderID(
        frameData.user.fid,
        walletAddress,
        txHash,
        Date.now()
      );

      if (result.success && result.record) {
        setExistingRecord(result.record);
        setStep('done');
      } else {
        throw new Error(result.error || 'Failed to generate Builder ID');
      }

    } catch (err) {
      console.error('Mint error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Mint failed';

      // Handle user rejection
      if (errorMessage.includes('user rejected') || errorMessage.includes('User denied') || errorMessage.includes('cancelled')) {
        setError('Transaction cancelled.');
      } else {
        setError(errorMessage);
      }

      setStep('check');
    }

    setMinting(false);
  };

  const viewProfile = (fid: number) => {
    if (window.frame?.sdk) {
      window.frame.sdk.actions.viewProfile({ fid });
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <SectionHeader
          title="Builder ID"
          subtitle="Your onchain builder identity"
          Icon={IdentificationIcon}
          iconColor="text-violet-400"
        />
        <LoadingSpinner text="Loading Builder ID..." />
      </div>
    );
  }

  if (!frameData?.user) {
    return (
      <div className="space-y-3">
        <SectionHeader
          title="Builder ID"
          subtitle="Your onchain builder identity"
          Icon={IdentificationIcon}
          iconColor="text-violet-400"
        />
        <div className="text-center py-8">
          <IdentificationIcon className="w-12 h-12 text-gray-500 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Connect via Farcaster to claim your Builder ID</p>
        </div>
      </div>
    );
  }

  // User already has Builder ID
  if (step === 'done' && existingRecord) {
    return (
      <div className="space-y-4">
        <SectionHeader
          title="Builder ID"
          subtitle="Your onchain builder identity"
          Icon={IdentificationIcon}
          iconColor="text-violet-400"
        />

        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-600/20 to-purple-600/20 rounded-2xl blur-xl" />
          <div className="relative bg-black/50 backdrop-blur-sm rounded-2xl border border-violet-500/30 overflow-hidden">
            {/* NFT Image */}
            <div className="aspect-square w-full max-w-[280px] mx-auto p-4">
              <img
                src={existingRecord.imageUrl}
                alt="Builder ID"
                className="w-full h-full object-cover rounded-xl border border-white/10"
              />
            </div>

            {/* Info */}
            <div className="p-4 border-t border-white/10">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-lg font-bold text-white">Builder ID #{existingRecord.fid}</h3>
                  <p className="text-sm text-violet-400">@{existingRecord.username}</p>
                </div>
                <div className="flex items-center gap-1 text-green-400 bg-green-500/10 px-2 py-1 rounded-full">
                  <CheckCircleIcon className="w-4 h-4" />
                  <span className="text-xs font-medium">Claimed</span>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                {existingRecord.builderScore !== undefined && (
                  <div className="bg-white/5 rounded-lg p-2 text-center">
                    <div className="text-lg font-bold text-purple-400">{existingRecord.builderScore}</div>
                    <div className="text-[9px] text-gray-500 uppercase">Builder</div>
                  </div>
                )}
                {existingRecord.ethosScore !== undefined && (
                  <div className="bg-white/5 rounded-lg p-2 text-center">
                    <div className="text-lg font-bold text-teal-400">{existingRecord.ethosScore}</div>
                    <div className="text-[9px] text-gray-500 uppercase">Ethos</div>
                  </div>
                )}
                {existingRecord.neynarScore !== undefined && (
                  <div className="bg-white/5 rounded-lg p-2 text-center">
                    <div className="text-lg font-bold text-cyan-400">{Math.round(existingRecord.neynarScore * 100)}%</div>
                    <div className="text-[9px] text-gray-500 uppercase">Neynar</div>
                  </div>
                )}
                {existingRecord.shippedCount !== undefined && (
                  <div className="bg-white/5 rounded-lg p-2 text-center">
                    <div className="text-lg font-bold text-orange-400">{existingRecord.shippedCount}</div>
                    <div className="text-[9px] text-gray-500 uppercase">Shipped</div>
                  </div>
                )}
              </div>

              {existingRecord.powerBadge && (
                <div className="flex items-center gap-1.5 text-xs text-yellow-400 bg-yellow-500/10 px-2 py-1 rounded-full w-fit mb-3">
                  <StarIcon className="w-3.5 h-3.5" />
                  Power Badge Holder
                </div>
              )}

              <p className="text-xs text-gray-500 mb-3">
                Wallet: {existingRecord.walletAddress.slice(0, 6)}...{existingRecord.walletAddress.slice(-4)}
              </p>

              {/* Share Buttons */}
              <div className="flex gap-2">
                {/* Share to Farcaster */}
                <button
                  onClick={() => {
                    const shareUrl = getBuilderIDShareUrl(existingRecord.fid);
                    const text = `Just minted my Builder ID on Shipyard:`;
                    const farcasterUrl = `https://farcaster.xyz/~/compose?text=${encodeURIComponent(text)}&embeds[]=${encodeURIComponent(shareUrl)}`;
                    if (window.frame?.sdk?.actions?.openUrl) {
                      window.frame.sdk.actions.openUrl(farcasterUrl);
                    } else {
                      window.open(farcasterUrl, '_blank');
                    }
                  }}
                  className="flex-1 py-2.5 bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.24.24H5.76C2.5789.24 0 2.8188 0 6v12c0 3.1811 2.5789 5.76 5.76 5.76h12.48c3.1812 0 5.76-2.5789 5.76-5.76V6C24 2.8188 21.4212.24 18.24.24m.8155 17.1662v.504c.2868-.0256.5458.1905.5439.479v.5688h-5.1437v-.5688c-.0019-.2885.2576-.5047.5443-.479v-.504c0-.22.1525-.402.358-.458l-.0095-4.3645c-.1589-1.7366-1.6402-3.0979-3.4435-3.0979-1.8038 0-3.2846 1.3613-3.4435 3.0979l-.0096 4.3578c.2276.0424.5318.2083.5395.4648v.504c.2863-.0256.5457.1905.5438.479v.5688H4.3915v-.5688c-.0019-.2885.2575-.5047.5438-.479v-.504c0-.2529.2011-.4548.4536-.4724v-7.895h-.4905L4.2898 7.008l2.6405-.0005V5.0419h9.9495v1.9656h2.8219l-.6091 2.0314h-.4901v7.8949c.2519.0177.453.2195.453.4724"/>
                  </svg>
                  Farcaster
                </button>

                {/* Share to X */}
                <button
                  onClick={() => {
                    const shareUrl = getBuilderIDShareUrl(existingRecord.fid);
                    const text = `Just minted my Builder ID on Shipyard:`;
                    const xUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;
                    if (window.frame?.sdk?.actions?.openUrl) {
                      window.frame.sdk.actions.openUrl(xUrl);
                    } else {
                      window.open(xUrl, '_blank');
                    }
                  }}
                  className="flex-1 py-2.5 bg-gray-600/20 hover:bg-gray-600/30 text-gray-300 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                  X
                </button>
              </div>

              {/* View Full Page */}
              <button
                onClick={() => {
                  const pageUrl = getBuilderIDShareUrl(existingRecord.fid);
                  if (window.frame?.sdk?.actions?.openUrl) {
                    window.frame.sdk.actions.openUrl(pageUrl);
                  } else {
                    window.open(pageUrl, '_blank');
                  }
                }}
                className="w-full py-2 mt-2 bg-white/5 hover:bg-white/10 text-gray-400 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                View Full Page
              </button>
            </div>
          </div>
        </div>

        {/* Recent Holders */}
        {holders.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-400 mb-2">Recent Builders</h4>
            <div className="flex -space-x-2">
              {holders.slice(0, 8).map((holder) => (
                <button
                  key={holder.fid}
                  onClick={() => viewProfile(holder.fid)}
                  className="relative group"
                  title={`@${holder.username}`}
                >
                  <img
                    src={holder.imageUrl}
                    alt={holder.username}
                    className="w-8 h-8 rounded-full border-2 border-black hover:border-violet-500 transition-colors"
                  />
                </button>
              ))}
              {totalMinted > 8 && (
                <div className="w-8 h-8 rounded-full bg-white/10 border-2 border-black flex items-center justify-center text-xs text-gray-400">
                  +{totalMinted - 8}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Minting step
  if (step === 'minting') {
    return (
      <div className="space-y-4">
        <SectionHeader
          title="Minting Builder ID"
          subtitle="Please wait..."
          Icon={IdentificationIcon}
          iconColor="text-violet-400"
        />

        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-600/20 to-purple-600/20 rounded-2xl blur-xl" />
          <div className="relative bg-black/50 backdrop-blur-sm rounded-2xl border border-violet-500/30 p-8">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                <div className="w-8 h-8 border-3 border-white/30 border-t-white rounded-full animate-spin" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{mintStatus || 'Processing...'}</h3>
              <p className="text-sm text-gray-400">
                {mintStatus.includes('Generating')
                  ? 'Creating your unique AI-generated avatar...'
                  : 'This may take a moment'}
              </p>

              {connectedWallet && (
                <p className="text-xs text-gray-500 mt-4 font-mono">
                  Wallet: {connectedWallet.slice(0, 6)}...{connectedWallet.slice(-4)}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Initial check step
  return (
    <div className="space-y-4">
      <SectionHeader
        title="Builder ID"
        subtitle="Soulbound NFT for builders"
        Icon={IdentificationIcon}
        iconColor="text-violet-400"
      />

      {/* Hero Card */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600/20 to-purple-600/20 rounded-2xl blur-xl" />
        <div className="relative bg-black/50 backdrop-blur-sm rounded-2xl border border-violet-500/30 p-5">
          <div className="text-center mb-4">
            <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <IdentificationIcon className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-1">Mint Your Builder ID</h3>
            <p className="text-sm text-gray-400">
              A soulbound NFT that proves your builder identity on Farcaster
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Connected Wallet */}
          {connectedWallet && (
            <div className="mb-4 p-3 bg-white/5 rounded-lg border border-white/10">
              <p className="text-xs text-gray-400 mb-1">Connected Wallet</p>
              <p className="text-sm text-white font-mono">{connectedWallet.slice(0, 6)}...{connectedWallet.slice(-4)}</p>
            </div>
          )}

          {/* What's Included */}
          <div className="space-y-2 mb-5">
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <CheckCircleIcon className="w-4 h-4 text-green-400 flex-shrink-0" />
              AI-generated builder portrait
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <CheckCircleIcon className="w-4 h-4 text-green-400 flex-shrink-0" />
              Builder score & shipped projects
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <CheckCircleIcon className="w-4 h-4 text-green-400 flex-shrink-0" />
              Neynar score & verification
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <CheckCircleIcon className="w-4 h-4 text-green-400 flex-shrink-0" />
              Non-transferable (soulbound)
            </div>
          </div>

          {/* Price Info */}
          <div className="mb-4 p-3 bg-violet-500/10 rounded-lg border border-violet-500/20 text-center">
            <p className="text-sm text-violet-300">
              <span className="font-bold">0.0001 ETH</span> on Base
            </p>
            <p className="text-xs text-gray-500 mt-1">+ gas fees (~0.00005 ETH)</p>
          </div>

          <button
            onClick={handleMint}
            disabled={minting}
            className="w-full py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-bold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {minting ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Minting...
              </>
            ) : (
              <>
                <ShieldCheckIcon className="w-5 h-5" />
                Mint Builder ID (0.0001 ETH)
              </>
            )}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center justify-center gap-6 text-center">
        <div>
          <div className="text-2xl font-bold text-violet-400">{totalMinted}</div>
          <div className="text-xs text-gray-500">Builders Claimed</div>
        </div>
      </div>

      {/* Recent Holders */}
      {holders.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-400 mb-2">Recent Claims</h4>
          <div className="space-y-2">
            {holders.slice(0, 3).map((holder) => (
              <button
                key={holder.fid}
                onClick={() => viewProfile(holder.fid)}
                className="w-full flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 transition-colors text-left"
              >
                <img
                  src={holder.imageUrl}
                  alt={holder.username}
                  className="w-10 h-10 rounded-lg border border-white/10"
                />
                <div className="flex-1">
                  <div className="font-medium text-white text-sm">@{holder.username}</div>
                  <div className="text-xs text-gray-500">FID #{holder.fid}</div>
                </div>
                {holder.builderScore && (
                  <div className="text-sm font-bold text-purple-400">{holder.builderScore}</div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// PROJECT MODAL
// ============================================================================
function ProjectModal({
  project,
  onClose,
}: {
  project: FeaturedProject;
  onClose: () => void;
}) {
  const [tokenAnalysis, setTokenAnalysis] = useState<TokenAnalysis | null>(project.tokenAnalysis || null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);

  useEffect(() => {
    // If project has a token but no analysis yet, fetch it
    if (project.tokenAddress && !tokenAnalysis) {
      setLoadingAnalysis(true);
      analyzeToken(project.tokenAddress).then((analysis) => {
        setTokenAnalysis(analysis);
        setLoadingAnalysis(false);
      });
    }
  }, [project.tokenAddress, tokenAnalysis]);

  const openUrl = (url: string) => {
    if (window.frame?.sdk) {
      window.frame.sdk.actions.openUrl(url);
    } else {
      window.open(url, '_blank');
    }
  };

  const getTypeBadge = (type: string) => {
    const badges: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
      miniapp: { icon: <DevicePhoneMobileIcon className="w-3 h-3" />, color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30', label: 'Mini App' },
      tool: { icon: <WrenchScrewdriverIcon className="w-3 h-3" />, color: 'bg-orange-500/20 text-orange-400 border-orange-500/30', label: 'Tool' },
      token: { icon: <CurrencyDollarIcon className="w-3 h-3" />, color: 'bg-green-500/20 text-green-400 border-green-500/30', label: 'Token' },
      other: { icon: <SparklesIcon className="w-3 h-3" />, color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', label: 'Project' },
    };
    return badges[type] || badges.other;
  };

  const badge = getTypeBadge(project.type);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto bg-gray-900 rounded-2xl border border-white/10">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors z-10"
        >
          <XMarkIcon className="w-4 h-4 text-white" />
        </button>

        {/* Header with logo */}
        <div className="p-4 border-b border-white/5">
          <div className="flex items-start gap-3">
            {project.logoUrl ? (
              <img src={project.logoUrl} alt={project.name} className="w-14 h-14 rounded-xl border border-white/10 object-cover" />
            ) : (
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500/30 to-pink-500/30 border border-white/10 flex items-center justify-center">
                <SparklesIcon className="w-6 h-6 text-purple-400" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-white truncate">{project.name}</h2>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border ${badge.color}`}>
                  {badge.icon}
                  {badge.label}
                </span>
                {project.trendingRank && (
                  <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                    <FireIcon className="w-3 h-3" />
                    #{project.trendingRank} Trending
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Description */}
          <div>
            <p className="text-sm text-gray-300 leading-relaxed">
              {project.longDescription || project.description}
            </p>
          </div>

          {/* Stats */}
          {project.engagementCount !== undefined && project.engagementCount > 0 && (
            <div className="flex items-center gap-4 p-3 bg-white/5 rounded-xl">
              <div className="flex items-center gap-1.5 text-sm">
                <ArrowTrendingUpIcon className="w-4 h-4 text-green-400" />
                <span className="text-white font-medium">{project.engagementCount}</span>
                <span className="text-gray-500">engagement</span>
              </div>
            </div>
          )}

          {/* Token Analysis */}
          {project.tokenAddress && (
            <div className="p-3 bg-white/5 rounded-xl border border-white/5">
              <div className="flex items-center gap-2 mb-2">
                <ChartBarIcon className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-medium text-white">Token Analysis</span>
              </div>
              {loadingAnalysis ? (
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <div className="w-4 h-4 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
                  Analyzing token...
                </div>
              ) : tokenAnalysis?.success && tokenAnalysis.token ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-bold text-white">${tokenAnalysis.token.symbol}</span>
                      <span className="text-xs text-gray-500 ml-2">{tokenAnalysis.token.name}</span>
                    </div>
                    {tokenAnalysis.score !== undefined && (
                      <div className={`px-2 py-1 rounded text-sm font-bold ${getScoreBgColor(tokenAnalysis.score)} border ${getScoreColor(tokenAnalysis.score)}`}>
                        {tokenAnalysis.score}
                      </div>
                    )}
                  </div>
                  {tokenAnalysis.verdict && (
                    <p className="text-xs text-gray-400">{tokenAnalysis.verdict}</p>
                  )}
                  {/* Simple chart representation */}
                  {tokenAnalysis.breakdown && tokenAnalysis.breakdown.length > 0 && (
                    <div className="mt-2 space-y-1.5">
                      {tokenAnalysis.breakdown.map((item, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="text-[10px] text-gray-500 w-20 truncate">{item.category}</span>
                          <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                item.score >= 80 ? 'bg-green-500' :
                                item.score >= 60 ? 'bg-yellow-500' :
                                item.score >= 40 ? 'bg-orange-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${item.score}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-gray-400 w-6 text-right">{item.score}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-gray-500">Unable to analyze token</p>
              )}
            </div>
          )}

          {/* Submitter */}
          <div className="flex items-center gap-2 pt-2 border-t border-white/5">
            {project.submitterPfpUrl && (
              <img src={project.submitterPfpUrl} alt={project.submitterUsername} className="w-6 h-6 rounded-full border border-white/10" />
            )}
            <span className="text-xs text-gray-500">
              Submitted by <span className="text-purple-400">@{project.submitterUsername}</span>
            </span>
            <span className="text-xs text-gray-600 ml-auto">{formatRelativeTime(project.submittedAt)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-white/5">
          <button
            onClick={() => openUrl(project.url)}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            <ArrowTopRightOnSquareIcon className="w-4 h-4" />
            Open {project.type === 'miniapp' ? 'Mini App' : 'Project'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// FEATURED SECTION
// ============================================================================
function FeaturedSection({ onProjectClick }: { onProjectClick: (project: FeaturedProject) => void }) {
  const [projects, setProjects] = useState<FeaturedProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    async function load() {
      const data = await getFeaturedProjects(30); // Get more projects for rotation pool
      setProjects(data);
      setLoading(false);
    }
    load();
  }, []);

  // Calculate which project should be featured based on UTC day
  // Rotates to next project at 00:00 UTC each day
  useEffect(() => {
    if (projects.length === 0) return;

    const calculateDailyIndex = () => {
      const now = new Date();
      // Days since epoch (in UTC)
      const daysSinceEpoch = Math.floor(now.getTime() / (1000 * 60 * 60 * 24));
      return daysSinceEpoch % projects.length;
    };

    setCurrentIndex(calculateDailyIndex());

    // Check for day change every minute
    const interval = setInterval(() => {
      setCurrentIndex(calculateDailyIndex());
    }, 60000);

    return () => clearInterval(interval);
  }, [projects.length]);

  const getTypeBadge = (type: string) => {
    const badges: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
      miniapp: { icon: <DevicePhoneMobileIcon className="w-2.5 h-2.5" />, color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30', label: 'Mini App' },
      tool: { icon: <WrenchScrewdriverIcon className="w-2.5 h-2.5" />, color: 'bg-orange-500/20 text-orange-400 border-orange-500/30', label: 'Tool' },
      token: { icon: <CurrencyDollarIcon className="w-2.5 h-2.5" />, color: 'bg-green-500/20 text-green-400 border-green-500/30', label: 'Token' },
      other: { icon: <SparklesIcon className="w-2.5 h-2.5" />, color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', label: 'Project' },
    };
    return badges[type] || badges.other;
  };

  if (loading) {
    return (
      <div className="p-3 bg-white/5 rounded-xl border border-white/5 animate-pulse">
        <div className="h-16 bg-white/5 rounded-lg" />
      </div>
    );
  }

  if (projects.length === 0) return null;

  const currentProject = projects[currentIndex];
  const badge = getTypeBadge(currentProject.type);

  return (
    <div className="relative">
      {/* Featured label */}
      <div className="flex items-center gap-1.5 mb-2">
        <FireIcon className="w-3.5 h-3.5 text-orange-400" />
        <span className="text-[10px] font-medium text-orange-400 uppercase tracking-wider">Featured</span>
        {projects.length > 1 && (
          <div className="flex gap-1 ml-auto">
            {projects.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${i === currentIndex ? 'bg-purple-400' : 'bg-white/20'}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Featured card */}
      <button
        onClick={() => onProjectClick(currentProject)}
        className="w-full text-left group relative overflow-hidden rounded-xl"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 via-pink-600/10 to-purple-600/20 group-hover:from-purple-600/30 group-hover:to-purple-600/30 transition-colors" />
        <div className="relative p-3 bg-white/5 backdrop-blur-sm border border-purple-500/20 group-hover:border-purple-500/40 rounded-xl transition-all">
          <div className="flex items-start gap-3">
            {/* Logo */}
            {currentProject.logoUrl ? (
              <img src={currentProject.logoUrl} alt={currentProject.name} className="w-10 h-10 rounded-lg border border-white/10 object-cover flex-shrink-0" />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/30 to-pink-500/30 border border-white/10 flex items-center justify-center flex-shrink-0">
                <SparklesIcon className="w-5 h-5 text-purple-400" />
              </div>
            )}

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <h3 className="text-sm font-bold text-white truncate">{currentProject.name}</h3>
                <span className={`inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-full border ${badge.color}`}>
                  {badge.icon}
                  {badge.label}
                </span>
              </div>
              <p className="text-[11px] text-gray-400 line-clamp-2">{currentProject.description}</p>
              <div className="flex items-center gap-2 mt-1.5">
                {currentProject.trendingRank && (
                  <span className="inline-flex items-center gap-0.5 text-[9px] text-red-400">
                    <FireIcon className="w-2.5 h-2.5" />
                    #{currentProject.trendingRank}
                  </span>
                )}
                {currentProject.engagementCount !== undefined && currentProject.engagementCount > 0 && (
                  <span className="inline-flex items-center gap-0.5 text-[9px] text-gray-500">
                    <ArrowTrendingUpIcon className="w-2.5 h-2.5" />
                    {currentProject.engagementCount}
                  </span>
                )}
                <span className="text-[9px] text-gray-600 ml-auto">by @{currentProject.submitterUsername}</span>
              </div>
            </div>
          </div>
        </div>
      </button>
    </div>
  );
}

// ============================================================================
// HOME VIEW
// ============================================================================
function HomeView({ setView, onProjectClick }: { setView: (view: View) => void; onProjectClick: (project: FeaturedProject) => void }) {
  const features = [
    { view: 'analyze' as View, Icon: MagnifyingGlassIcon, title: 'Scanner', desc: 'Token security', gradient: 'from-blue-500/20 to-cyan-500/20', iconColor: 'text-cyan-400' },
    { view: 'builderid' as View, Icon: IdentificationIcon, title: 'Builder ID', desc: 'Claim your NFT', gradient: 'from-violet-500/20 to-purple-500/20', iconColor: 'text-violet-400' },
    { view: 'builders' as View, Icon: UserGroupIcon, title: 'Builders', desc: 'Top shippers', gradient: 'from-purple-500/20 to-pink-500/20', iconColor: 'text-purple-400' },
    { view: 'shipped' as View, Icon: RocketLaunchIcon, title: 'Shipped', desc: 'New projects', gradient: 'from-orange-500/20 to-yellow-500/20', iconColor: 'text-orange-400' },
    { view: 'rugs' as View, Icon: ExclamationTriangleIcon, title: 'Alerts', desc: 'Rug detection', gradient: 'from-red-500/20 to-orange-500/20', iconColor: 'text-red-400' },
    { view: 'learn' as View, Icon: BookOpenIcon, title: 'Learn', desc: 'Dev docs', gradient: 'from-green-500/20 to-emerald-500/20', iconColor: 'text-emerald-400' },
    { view: 'launch' as View, Icon: CommandLineIcon, title: 'Launch', desc: 'Build a mini app', gradient: 'from-indigo-500/20 to-blue-500/20', iconColor: 'text-indigo-400' },
  ];

  return (
    <div className="space-y-3">
      {/* Compact Hero */}
      <div className="text-center py-2">
        <div className="flex items-center justify-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 bg-purple-500 rounded-full blur-lg opacity-40" />
            <img
              src="/images/fixrpfp.png"
              alt="Shipyard - Builder's command center for Base"
              className="relative w-10 h-10 rounded-full border-2 border-purple-500/50"
            />
          </div>
          <div className="text-left">
            <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
              Shipyard
            </h1>
            <p className="text-[10px] text-gray-500">Builder's command center</p>
          </div>
        </div>
      </div>

      {/* Featured Section */}
      <FeaturedSection onProjectClick={onProjectClick} />

      {/* Compact Feature Grid */}
      <div className="grid grid-cols-2 gap-2" role="navigation" aria-label="Main features">
        {features.map((feature) => (
          <button
            key={feature.view}
            onClick={() => setView(feature.view)}
            aria-label={`${feature.title} - ${feature.desc}`}
            data-feature={feature.view}
            data-description={feature.desc}
            className="group relative overflow-hidden rounded-xl"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity`} />
            <div className="relative p-3 bg-white/5 hover:bg-white/10 backdrop-blur-sm border border-white/5 hover:border-white/20 rounded-xl transition-all text-left">
              <feature.Icon className={`w-5 h-5 mb-1.5 ${feature.iconColor} group-hover:scale-110 transition-transform`} aria-hidden="true" />
              <div className="text-sm font-medium text-white">{feature.title}</div>
              <div className="text-[10px] text-gray-500">{feature.desc}</div>
            </div>
          </button>
        ))}
      </div>

      {/* Compact Submit CTA */}
      <button
        onClick={() => setView('submit')}
        aria-label="Submit your project to get featured on Shipyard"
        data-feature="submit"
        data-description="Get your project featured in the Shipyard showcase"
        className="group relative w-full overflow-hidden rounded-xl"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/30 to-pink-600/30 group-hover:from-purple-600/40 group-hover:to-pink-600/40 transition-colors" />
        <div className="relative p-3 border border-purple-500/30 group-hover:border-purple-500/50 rounded-xl transition-all flex items-center gap-3">
          <SparklesIcon className="w-5 h-5 text-purple-400" />
          <div className="text-left flex-1">
            <div className="text-sm font-medium text-white">Submit Project</div>
            <div className="text-[10px] text-purple-300/70">Get featured</div>
          </div>
          <ChevronLeftIcon className="w-4 h-4 text-purple-400 rotate-180 group-hover:translate-x-1 transition-transform" />
        </div>
      </button>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function Demo() {
  const [frameData, setFrameData] = useState<FrameContext | null>(null);
  const [view, setView] = useState<View>('home');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<FeaturedProject | null>(null);

  useEffect(() => {
    let mounted = true;

    async function initFrameSDK() {
      try {
        if (typeof window === 'undefined' || !window.frame?.sdk) {
          throw new Error('Frame SDK not found');
        }

        window.frame.sdk.actions.ready();

        // Get context first to check if app is already added
        let retries = 3;
        let context = null;

        while (retries > 0 && mounted) {
          try {
            context = await window.frame.sdk.context;
            break;
          } catch (err) {
            retries--;
            if (retries > 0) {
              await new Promise((resolve) => setTimeout(resolve, 500));
            }
          }
        }

        if (!context && mounted) {
          throw new Error('Failed to get Frame context');
        }

        // If app not yet added, prompt user and send welcome notification on success
        if (context && !context.client?.added) {
          // Capture user data before async operations
          const userFid = context.user?.fid;
          const username = context.user?.username;

          try {
            await window.frame.sdk.actions.addMiniApp();
            // User successfully added the app - wait for Neynar to store token, then send welcome
            if (userFid) {
              console.log('Sending welcome notification to FID:', userFid, 'username:', username);
              // Give Neynar 3 seconds to process the frame_added event and store the token
              setTimeout(() => {
                fetch('https://agent.fixr.nexus/api/notifications/test', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    fid: userFid,
                    username: username,
                  }),
                })
                  .then(res => res.json())
                  .then(data => console.log('Welcome notification result:', data))
                  .catch(err => console.error('Welcome notification error:', err));
              }, 3000);
            }
          } catch {
            // User declined or already added - this is fine
          }
        }

        if (mounted) {
          setFrameData(context);
          setError(null);
        }
      } catch (err) {
        console.error('Frame initialization error:', err);
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to initialize Frame');
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    initFrameSDK();

    return () => {
      mounted = false;
    };
  }, []);

  if (isLoading) {
    return (
      <div className="w-full min-h-screen bg-black flex flex-col items-center justify-center gap-6">
        <div className="relative">
          <div className="absolute inset-0 bg-purple-500 rounded-full blur-2xl opacity-30 animate-pulse" />
          <img src="/images/fixrpfp.png" alt="Fixr" className="relative w-16 h-16 rounded-full" />
        </div>
        <div className="text-purple-400 animate-pulse">Loading Shipyard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-black">
      {/* Background gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-purple-950/20 via-black to-pink-950/10 pointer-events-none" />

      {/* Animated background orbs */}
      <div className="fixed top-20 left-10 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="fixed bottom-20 right-10 w-96 h-96 bg-pink-600/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative min-h-screen flex flex-col px-4 py-4 max-w-lg mx-auto">
        {/* Header */}
        <Header frameData={frameData} view={view} setView={setView} />

        {/* Base Network Stats Ticker - only on home view */}
        {view === 'home' && <BaseStatsTicker />}

        {/* Main Content */}
        <main className="flex-1 py-4">
          <div className="relative">
            {/* Content glow */}
            <div className="absolute inset-0 bg-gradient-to-b from-purple-600/5 to-transparent rounded-3xl blur-2xl pointer-events-none" />

            <div className="relative bg-white/[0.02] backdrop-blur-sm rounded-3xl border border-white/5 p-5">
              {view === 'home' && <HomeView setView={setView} onProjectClick={setSelectedProject} />}
              {view === 'analyze' && <TokenAnalyzeView frameData={frameData} />}
              {view === 'builderid' && <BuilderIDView frameData={frameData} />}
              {view === 'builders' && <BuildersView frameData={frameData} />}
              {view === 'shipped' && <ShippedView />}
              {view === 'rugs' && <RugsView />}
              {view === 'submit' && <SubmitView frameData={frameData} />}
              {view === 'learn' && <LearnView />}
              {view === 'launch' && <LaunchView />}
            </div>

            {/* Project Modal */}
            {selectedProject && (
              <ProjectModal project={selectedProject} onClose={() => setSelectedProject(null)} />
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="mt-4 p-4 bg-red-950/50 border border-red-500/30 rounded-xl">
              <p className="text-red-400 text-sm text-center">{error}</p>
            </div>
          )}
        </main>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
}
