'use client';

import React, { useEffect, useState } from 'react';
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
  type TokenAnalysis,
  type Builder,
  type BuilderCast,
  type RugIncident,
  type FeaturedProject,
} from '../lib/api';
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
} from '@heroicons/react/24/outline';
import {
  HeartIcon as HeartSolid,
} from '@heroicons/react/24/solid';

type View = 'home' | 'analyze' | 'builders' | 'shipped' | 'rugs' | 'submit' | 'learn';

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
                  alt="Fixr"
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
                alt="Profile"
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
              <path d="M18.24 3.62H5.76C4.51 3.62 3.5 4.63 3.5 5.88v12.24c0 1.25 1.01 2.26 2.26 2.26h12.48c1.25 0 2.26-1.01 2.26-2.26V5.88c0-1.25-1.01-2.26-2.26-2.26zM12 17.35c-2.96 0-5.35-2.4-5.35-5.35S9.04 6.65 12 6.65s5.35 2.4 5.35 5.35-2.39 5.35-5.35 5.35z"/>
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

  const handleAnalyze = async () => {
    if (!address.trim()) return;
    setLoading(true);
    setResult(null);
    const analysis = await analyzeToken(address.trim());
    setResult(analysis);
    setLoading(false);
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
function BuildersView() {
  const [builders, setBuilders] = useState<Builder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const data = await getTrendingBuilders(15);
      setBuilders(data);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <LoadingSpinner text="Loading builders..." />;

  return (
    <div className="space-y-3">
      <SectionHeader
        title="Builders"
        subtitle="Top shippers on Farcaster"
        Icon={UserGroupIcon}
        iconColor="text-purple-400"
      />

      <div className="space-y-2">
        {builders.map((builder, index) => (
          <div
            key={builder.fid}
            className="group relative"
          >
            {index < 3 && (
              <div className={`absolute inset-0 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity ${
                index === 0 ? 'bg-yellow-500/20' : index === 1 ? 'bg-gray-400/20' : 'bg-orange-500/20'
              }`} />
            )}
            <div className="relative flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 backdrop-blur-sm rounded-xl border border-white/5 hover:border-white/20 transition-all">
              {/* Rank */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                index === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                index === 1 ? 'bg-gray-400/20 text-gray-300' :
                index === 2 ? 'bg-orange-500/20 text-orange-400' :
                'bg-white/5 text-gray-500'
              }`}>
                {index + 1}
              </div>

              {/* Avatar */}
              {builder.pfpUrl && (
                <img
                  src={builder.pfpUrl}
                  alt={builder.username}
                  className="w-12 h-12 rounded-full border-2 border-white/10"
                />
              )}

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="font-medium text-white truncate">
                  {builder.displayName || builder.username}
                </div>
                <div className="text-sm text-gray-500">@{builder.username}</div>
              </div>

              {/* Stats */}
              <div className="text-right">
                <div className="text-lg font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  {builder.shippedCount}
                </div>
                <div className="text-[10px] text-gray-500 uppercase tracking-wider">shipped</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {builders.length === 0 && (
        <div className="text-center py-8 text-gray-500">No builders found</div>
      )}
    </div>
  );
}

// ============================================================================
// SHIPPED PROJECTS VIEW
// ============================================================================
function ShippedView() {
  const [projects, setProjects] = useState<BuilderCast[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const data = await getShippedProjects(20);
      setProjects(data);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <LoadingSpinner text="Loading projects..." />;

  return (
    <div className="space-y-3">
      <SectionHeader
        title="Shipped"
        subtitle="Fresh projects from builders"
        Icon={RocketLaunchIcon}
        iconColor="text-orange-400"
      />

      <div className="space-y-2">
        {projects.map((cast) => {
          const miniAppUrls = extractMiniAppUrls(cast.text, cast.embeds || []);
          return (
            <div
              key={cast.hash}
              className="relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/0 via-purple-600/5 to-purple-600/0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative p-4 bg-white/5 hover:bg-white/[0.07] backdrop-blur-sm rounded-xl border border-white/5 hover:border-purple-500/30 transition-all">
                {/* Author */}
                <div className="flex items-center gap-3 mb-3">
                  {cast.authorPfpUrl && (
                    <img
                      src={cast.authorPfpUrl}
                      alt={cast.authorUsername}
                      className="w-8 h-8 rounded-full border border-white/10"
                    />
                  )}
                  <div className="flex-1">
                    <span className="text-sm font-medium text-white">
                      {cast.authorDisplayName || cast.authorUsername}
                    </span>
                    <span className="text-xs text-gray-500 ml-2">
                      {formatRelativeTime(cast.timestamp)}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <p className="text-gray-300 text-sm leading-relaxed line-clamp-3">{cast.text}</p>

                {/* Action Buttons */}
                <div className="mt-3 flex flex-wrap gap-2">
                  {/* View Cast - keeps mini app open */}
                  <button
                    onClick={() => {
                      if (window.frame?.sdk) {
                        window.frame.sdk.actions.viewCast({
                          hash: cast.hash,
                          authorUsername: cast.authorUsername,
                          close: false,
                        });
                      }
                    }}
                    className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 bg-white/10 text-gray-300 rounded-full border border-white/20 hover:bg-white/20 transition-colors"
                  >
                    <EyeIcon className="w-3 h-3" />
                    View Cast
                  </button>

                  {/* Mini App Links */}
                  {miniAppUrls.map((url, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        if (window.frame?.sdk) {
                          window.frame.sdk.actions.openUrl(url);
                        }
                      }}
                      className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 bg-purple-500/20 text-purple-300 rounded-full border border-purple-500/30 hover:bg-purple-500/30 transition-colors"
                    >
                      <ArrowTopRightOnSquareIcon className="w-3 h-3" />
                      Open App
                    </button>
                  ))}
                </div>

                {/* Engagement */}
                <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                    </svg>
                    {cast.likes}
                  </span>
                  <span className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/>
                    </svg>
                    {cast.recasts}
                  </span>
                  {cast.topics?.length > 0 && (
                    <span className="text-purple-400/60">{cast.topics.slice(0, 2).join(' · ')}</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {projects.length === 0 && (
        <div className="text-center py-8 text-gray-500">No shipped projects found</div>
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

  if (loading) return <LoadingSpinner text="Loading alerts..." />;

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
    { view: 'builders' as View, Icon: UserGroupIcon, title: 'Builders', desc: 'Top shippers', gradient: 'from-purple-500/20 to-pink-500/20', iconColor: 'text-purple-400' },
    { view: 'shipped' as View, Icon: RocketLaunchIcon, title: 'Shipped', desc: 'New projects', gradient: 'from-orange-500/20 to-yellow-500/20', iconColor: 'text-orange-400' },
    { view: 'rugs' as View, Icon: ExclamationTriangleIcon, title: 'Alerts', desc: 'Rug detection', gradient: 'from-red-500/20 to-orange-500/20', iconColor: 'text-red-400' },
    { view: 'learn' as View, Icon: BookOpenIcon, title: 'Learn', desc: 'Dev docs', gradient: 'from-green-500/20 to-emerald-500/20', iconColor: 'text-emerald-400' },
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
              alt="Fixr"
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
      <div className="grid grid-cols-2 gap-2">
        {features.map((feature) => (
          <button
            key={feature.view}
            onClick={() => setView(feature.view)}
            className="group relative overflow-hidden rounded-xl"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity`} />
            <div className="relative p-3 bg-white/5 hover:bg-white/10 backdrop-blur-sm border border-white/5 hover:border-white/20 rounded-xl transition-all text-left">
              <feature.Icon className={`w-5 h-5 mb-1.5 ${feature.iconColor} group-hover:scale-110 transition-transform`} />
              <div className="text-sm font-medium text-white">{feature.title}</div>
              <div className="text-[10px] text-gray-500">{feature.desc}</div>
            </div>
          </button>
        ))}
      </div>

      {/* Compact Submit CTA */}
      <button
        onClick={() => setView('submit')}
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

        {/* Main Content */}
        <main className="flex-1 py-4">
          <div className="relative">
            {/* Content glow */}
            <div className="absolute inset-0 bg-gradient-to-b from-purple-600/5 to-transparent rounded-3xl blur-2xl pointer-events-none" />

            <div className="relative bg-white/[0.02] backdrop-blur-sm rounded-3xl border border-white/5 p-5">
              {view === 'home' && <HomeView setView={setView} onProjectClick={setSelectedProject} />}
              {view === 'analyze' && <TokenAnalyzeView frameData={frameData} />}
              {view === 'builders' && <BuildersView />}
              {view === 'shipped' && <ShippedView />}
              {view === 'rugs' && <RugsView />}
              {view === 'submit' && <SubmitView frameData={frameData} />}
              {view === 'learn' && <LearnView />}
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
