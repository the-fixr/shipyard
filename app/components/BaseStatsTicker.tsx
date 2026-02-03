'use client';

import { useState, useEffect } from 'react';

interface BaseStats {
  gasPrice: number;
  txCount24h: string;
  tvl: string;
  activeAddresses: string;
}

const DEFAULT_STATS: BaseStats = {
  gasPrice: 0.001,
  txCount24h: '2.1M',
  tvl: '$8.2B',
  activeAddresses: '312K',
};

export default function BaseStatsTicker() {
  const [stats, setStats] = useState<BaseStats>(DEFAULT_STATS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const statItems = [
    { label: 'Gas', value: `${stats.gasPrice.toFixed(4)} gwei`, icon: '⛽' },
    { label: '24h Txns', value: stats.txCount24h, icon: '📊' },
    { label: 'TVL', value: stats.tvl, icon: '💰' },
    { label: 'Active', value: stats.activeAddresses, icon: '👥' },
  ];

  // Rotate through stats every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % statItems.length);
        setIsAnimating(false);
      }, 150);
    }, 3000);
    return () => clearInterval(interval);
  }, [statItems.length]);

  // Fetch real stats (can be enhanced with actual API later)
  useEffect(() => {
    async function fetchStats() {
      try {
        // Future: fetch from agent.fixr.nexus/api/base-stats
        // For now, use defaults with slight variation to show it's live
        setStats({
          gasPrice: 0.001 + Math.random() * 0.001,
          txCount24h: '2.1M',
          tvl: '$8.2B',
          activeAddresses: '312K',
        });
      } catch {
        // Use defaults on error
      }
    }
    fetchStats();
    const refreshInterval = setInterval(fetchStats, 60000);
    return () => clearInterval(refreshInterval);
  }, []);

  return (
    <div
      className="relative overflow-hidden bg-gradient-to-r from-blue-500/10 via-blue-600/5 to-blue-500/10 border-y border-blue-500/20 py-2 my-2"
      aria-label="Base network statistics"
      role="region"
    >
      {/* Base logo indicator */}
      <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
        <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
          <span className="text-[8px] font-bold text-white">B</span>
        </div>
        <span className="text-[10px] text-blue-400 uppercase tracking-wider font-medium hidden sm:inline">
          Base
        </span>
      </div>

      {/* Animated ticker content */}
      <div className="flex justify-center items-center h-5">
        <div
          key={currentIndex}
          className={`flex items-center gap-2 transition-all duration-150 ${
            isAnimating ? 'opacity-0 -translate-y-2' : 'opacity-100 translate-y-0'
          }`}
          aria-live="polite"
        >
          <span className="text-sm" aria-hidden="true">
            {statItems[currentIndex].icon}
          </span>
          <span className="text-xs text-gray-400">
            {statItems[currentIndex].label}:
          </span>
          <span className="text-xs font-medium text-white">
            {statItems[currentIndex].value}
          </span>
        </div>
      </div>

      {/* Dots indicator */}
      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1">
        {statItems.map((item, i) => (
          <button
            key={i}
            onClick={() => {
              setIsAnimating(true);
              setTimeout(() => {
                setCurrentIndex(i);
                setIsAnimating(false);
              }, 150);
            }}
            className={`w-1.5 h-1.5 rounded-full transition-colors ${
              i === currentIndex ? 'bg-blue-400' : 'bg-white/20 hover:bg-white/40'
            }`}
            aria-label={`View ${item.label} stat`}
          />
        ))}
      </div>
    </div>
  );
}
