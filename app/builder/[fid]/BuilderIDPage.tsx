'use client';

import Link from 'next/link';

interface BuilderIDRecord {
  fid: number;
  username: string;
  imageUrl: string;
  walletAddress: string;
  builderScore?: number;
  neynarScore?: number;
  shippedCount?: number;
  powerBadge?: boolean;
  mintedAt?: string;
}

interface Props {
  fid: string;
  found: boolean;
  record: BuilderIDRecord | null;
}

export default function BuilderIDPage({ fid, found, record }: Props) {
  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/builder/${fid}`
    : `https://shipyard.fixr.nexus/builder/${fid}`;

  const handleShareFarcaster = () => {
    const text = `Check out this Builder ID on @shipabordhq! 🚢\n\nBuilder Score: ${record?.builderScore || 0}\nShipped: ${record?.shippedCount || 0} projects`;
    const warpcastUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(text)}&embeds[]=${encodeURIComponent(shareUrl)}`;
    window.open(warpcastUrl, '_blank');
  };

  const handleShareX = () => {
    const text = `Check out this Builder ID on @shipabordhq! 🚢\n\nBuilder Score: ${record?.builderScore || 0}\nShipped: ${record?.shippedCount || 0} projects\n\nClaim yours:`;
    const xUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(xUrl, '_blank');
  };

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
    alert('Link copied to clipboard!');
  };

  if (!found || !record) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a14] via-[#12121f] to-[#0a0a14] flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-600/20 flex items-center justify-center border border-violet-500/30">
            <svg className="w-10 h-10 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Builder ID #{fid}</h1>
          <p className="text-gray-400 mb-6">This Builder ID hasn&apos;t been claimed yet.</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Claim Your Builder ID
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a14] via-[#12121f] to-[#0a0a14] flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        {/* Header */}
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center gap-2 text-violet-400 hover:text-violet-300 transition-colors mb-4">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Shipyard
          </Link>
        </div>

        {/* Card */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-600/20 to-purple-600/20 rounded-3xl blur-xl" />
          <div className="relative bg-black/60 backdrop-blur-xl rounded-3xl border border-violet-500/30 overflow-hidden">
            {/* NFT Image */}
            <div className="aspect-square w-full max-w-[320px] mx-auto p-6">
              <img
                src={record.imageUrl}
                alt={`Builder ID #${fid}`}
                className="w-full h-full object-cover rounded-2xl border border-white/10 shadow-2xl"
              />
            </div>

            {/* Info */}
            <div className="p-6 border-t border-white/10">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-white">Builder ID #{record.fid}</h1>
                  <p className="text-lg text-violet-400">@{record.username}</p>
                </div>
                <div className="flex items-center gap-1.5 text-green-400 bg-green-500/10 px-3 py-1.5 rounded-full">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm font-medium">Verified</span>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 mb-5">
                {record.builderScore !== undefined && (
                  <div className="bg-white/5 rounded-xl p-3 text-center">
                    <div className="text-2xl font-bold text-purple-400">{record.builderScore}</div>
                    <div className="text-[10px] text-gray-500 uppercase tracking-wide">Builder Score</div>
                  </div>
                )}
                {record.neynarScore !== undefined && (
                  <div className="bg-white/5 rounded-xl p-3 text-center">
                    <div className="text-2xl font-bold text-cyan-400">{Math.round(record.neynarScore * 100)}%</div>
                    <div className="text-[10px] text-gray-500 uppercase tracking-wide">Neynar</div>
                  </div>
                )}
                {record.shippedCount !== undefined && (
                  <div className="bg-white/5 rounded-xl p-3 text-center">
                    <div className="text-2xl font-bold text-orange-400">{record.shippedCount}</div>
                    <div className="text-[10px] text-gray-500 uppercase tracking-wide">Shipped</div>
                  </div>
                )}
              </div>

              {record.powerBadge && (
                <div className="flex items-center gap-2 text-sm text-yellow-400 bg-yellow-500/10 px-3 py-2 rounded-full w-fit mb-5">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                  Power Badge Holder
                </div>
              )}

              <p className="text-sm text-gray-500 mb-5">
                Wallet: {record.walletAddress.slice(0, 6)}...{record.walletAddress.slice(-4)}
              </p>

              {/* Share Buttons */}
              <div className="space-y-3">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Share this Builder ID</p>
                <div className="flex gap-2">
                  {/* Farcaster */}
                  <button
                    onClick={handleShareFarcaster}
                    className="flex-1 py-3 bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.24 3H5.76A2.76 2.76 0 0 0 3 5.76v12.48A2.76 2.76 0 0 0 5.76 21h12.48A2.76 2.76 0 0 0 21 18.24V5.76A2.76 2.76 0 0 0 18.24 3ZM7.5 16.5v-3.9l3.15 3.15a.75.75 0 0 0 1.06-1.06L8.56 11.54l3.15-3.15a.75.75 0 0 0-1.06-1.06L7.5 10.48V7.5a.75.75 0 0 0-1.5 0v9a.75.75 0 0 0 1.5 0Zm10.5 0a.75.75 0 0 1-1.5 0v-3.9l-3.15 3.15a.75.75 0 0 1-1.06-1.06l3.15-3.15-3.15-3.15a.75.75 0 0 1 1.06-1.06l3.15 3.15V7.5a.75.75 0 0 1 1.5 0v9Z"/>
                    </svg>
                    Farcaster
                  </button>

                  {/* X */}
                  <button
                    onClick={handleShareX}
                    className="flex-1 py-3 bg-gray-600/20 hover:bg-gray-600/30 text-gray-300 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                    X
                  </button>

                  {/* Copy Link */}
                  <button
                    onClick={handleCopyLink}
                    className="py-3 px-4 bg-white/5 hover:bg-white/10 text-gray-400 rounded-xl font-medium transition-colors flex items-center justify-center"
                    title="Copy link"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-6 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Claim Your Builder ID
          </Link>
        </div>
      </div>
    </div>
  );
}
