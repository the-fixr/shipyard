'use client';

import { useState, useEffect, useRef } from 'react';

interface ChainStats {
  gasPrice: string;
  txCount24h: string;
  tvl: string;
  blockNumber: string;
}

interface ChainConfig {
  id: string;
  name: string;
  shortName: string;
  color: string;
  bgGradient: string;
  borderColor: string;
  rpcUrl: string;
  explorerApi?: string;
  llamafiName: string;
  gasUnit: string;
  blockLabel: string;
  defaultStats: ChainStats;
}

const CHAINS: ChainConfig[] = [
  {
    id: 'base',
    name: 'Base',
    shortName: 'B',
    color: 'bg-blue-500',
    bgGradient: 'from-blue-500/10 via-blue-600/5 to-blue-500/10',
    borderColor: 'border-blue-500/20',
    rpcUrl: 'https://mainnet.base.org',
    explorerApi: 'https://api.basescan.org/api',
    llamafiName: 'Base',
    gasUnit: 'gwei',
    blockLabel: 'Block',
    defaultStats: { gasPrice: '0.001 gwei', txCount24h: '2.5M+', tvl: '$8.2B', blockNumber: '...' },
  },
  {
    id: 'ethereum',
    name: 'Ethereum',
    shortName: 'E',
    color: 'bg-indigo-500',
    bgGradient: 'from-indigo-500/10 via-indigo-600/5 to-indigo-500/10',
    borderColor: 'border-indigo-500/20',
    rpcUrl: 'https://ethereum-rpc.publicnode.com', // CORS-enabled public RPC
    explorerApi: 'https://api.etherscan.io/api',
    llamafiName: 'Ethereum',
    gasUnit: 'gwei',
    blockLabel: 'Block',
    defaultStats: { gasPrice: '15 gwei', txCount24h: '1.1M+', tvl: '$55B', blockNumber: '...' },
  },
  {
    id: 'solana',
    name: 'Solana',
    shortName: 'S',
    color: 'bg-purple-500',
    bgGradient: 'from-purple-500/10 via-purple-600/5 to-purple-500/10',
    borderColor: 'border-purple-500/20',
    rpcUrl: 'https://solana-rpc.publicnode.com', // CORS-enabled public RPC
    llamafiName: 'Solana',
    gasUnit: 'lamports',
    blockLabel: 'Slot',
    defaultStats: { gasPrice: '5000 lamports', txCount24h: '50M+', tvl: '$8B', blockNumber: '...' },
  },
  {
    id: 'monad',
    name: 'Monad',
    shortName: 'M',
    color: 'bg-violet-500',
    bgGradient: 'from-violet-500/10 via-violet-600/5 to-violet-500/10',
    borderColor: 'border-violet-500/20',
    rpcUrl: 'https://rpc.monad.xyz', // Monad mainnet - 10,000 TPS, 0.4s blocks
    llamafiName: 'Monad',
    gasUnit: 'gwei',
    blockLabel: 'Block',
    defaultStats: { gasPrice: '0.001 gwei', txCount24h: '10M+', tvl: '$394M', blockNumber: '...' },
  },
];

function formatNumber(num: number): string {
  if (num >= 1e12) return `$${(num / 1e12).toFixed(1)}T`;
  if (num >= 1e9) return `$${(num / 1e9).toFixed(1)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(1)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
  return num.toFixed(0);
}

export default function ChainStatsTicker() {
  const [selectedChain, setSelectedChain] = useState<ChainConfig>(CHAINS[0]);
  const [stats, setStats] = useState<ChainStats>(CHAINS[0].defaultStats);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const statItems = [
    { label: 'Gas', value: stats.gasPrice, icon: '⛽' },
    { label: 'TVL', value: stats.tvl, icon: '💰' },
    { label: selectedChain.blockLabel, value: stats.blockNumber, icon: '🧱' },
    { label: '24h Txns', value: stats.txCount24h, icon: '📊' },
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  // Fetch stats for selected chain
  useEffect(() => {
    async function fetchStats() {
      const chain = selectedChain;

      try {
        let gasPrice = chain.defaultStats.gasPrice;
        let blockNumber = chain.defaultStats.blockNumber;
        let tvl = chain.defaultStats.tvl;
        let txCount = chain.defaultStats.txCount24h;

        // Fetch based on chain type
        if (chain.id === 'solana') {
          // Solana-specific fetching
          try {
            const slotResponse = await fetch(chain.rpcUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                jsonrpc: '2.0',
                id: 1,
                method: 'getSlot',
              }),
            });
            const slotData = await slotResponse.json();
            if (slotData.result) {
              blockNumber = slotData.result.toLocaleString();
            }
          } catch (e) {
            console.error('Failed to fetch Solana slot:', e);
          }

          // Solana priority fee (simplified)
          gasPrice = '5000 lamports';
        } else {
          // EVM chains (Base, Ethereum)
          try {
            // Fetch gas price via RPC
            const gasResponse = await fetch(chain.rpcUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                jsonrpc: '2.0',
                method: 'eth_gasPrice',
                params: [],
                id: 1,
              }),
            });
            const gasData = await gasResponse.json();
            if (gasData.result) {
              const gasPriceWei = parseInt(gasData.result, 16);
              if (!isNaN(gasPriceWei)) {
                const gasPriceGwei = gasPriceWei / 1e9;
                gasPrice = gasPriceGwei < 0.01
                  ? `${(gasPriceGwei * 1000).toFixed(2)} mwei`
                  : `${gasPriceGwei.toFixed(3)} gwei`;
              }
            }
          } catch (e) {
            console.error(`Failed to fetch ${chain.name} gas price:`, e);
          }

          try {
            // Fetch block number via RPC
            const blockResponse = await fetch(chain.rpcUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                jsonrpc: '2.0',
                method: 'eth_blockNumber',
                params: [],
                id: 1,
              }),
            });
            const blockData = await blockResponse.json();
            if (blockData.result) {
              const parsed = parseInt(blockData.result, 16);
              if (!isNaN(parsed)) {
                blockNumber = parsed.toLocaleString();
              }
            }
          } catch (e) {
            console.error(`Failed to fetch ${chain.name} block:`, e);
          }
        }

        // Fetch TVL from DeFiLlama (works for all chains)
        try {
          const tvlResponse = await fetch('https://api.llama.fi/v2/chains');
          const tvlData = await tvlResponse.json();
          const chainData = tvlData.find((c: { name: string }) => c.name === chain.llamafiName);
          if (chainData?.tvl) {
            tvl = formatNumber(chainData.tvl);
          }
        } catch (e) {
          console.error(`Failed to fetch ${chain.name} TVL:`, e);
        }

        setStats({
          gasPrice,
          tvl,
          blockNumber,
          txCount24h: txCount,
        });
      } catch (error) {
        console.error(`Failed to fetch ${chain.name} stats:`, error);
        setStats(chain.defaultStats);
      }
    }

    // Reset to defaults when chain changes, then fetch
    setStats(selectedChain.defaultStats);
    fetchStats();
    const refreshInterval = setInterval(fetchStats, 30000); // Refresh every 30s
    return () => clearInterval(refreshInterval);
  }, [selectedChain]);

  const handleChainSelect = (chain: ChainConfig) => {
    setSelectedChain(chain);
    setDropdownOpen(false);
    setCurrentIndex(0);
  };

  return (
    <div
      className={`relative bg-gradient-to-r ${selectedChain.bgGradient} border-y ${selectedChain.borderColor} py-2 my-2`}
      aria-label={`${selectedChain.name} network statistics`}
      role="region"
    >
      {/* Chain selector dropdown */}
      <div className="absolute left-3 top-1/2 -translate-y-1/2 z-[100]" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-1.5 hover:opacity-80 transition-opacity cursor-pointer"
          aria-label={`Select chain, currently ${selectedChain.name}`}
          aria-expanded={dropdownOpen}
        >
          <div className={`w-4 h-4 rounded-full ${selectedChain.color} flex items-center justify-center`}>
            <span className="text-[8px] font-bold text-white">{selectedChain.shortName}</span>
          </div>
          <span className={`text-[10px] uppercase tracking-wider font-medium hidden sm:inline`} style={{
            color: selectedChain.color.includes('blue') ? '#60a5fa' :
                   selectedChain.color.includes('indigo') ? '#818cf8' :
                   selectedChain.color.includes('purple') ? '#a78bfa' :
                   selectedChain.color.includes('violet') ? '#8b5cf6' : '#60a5fa'
          }}>
            {selectedChain.name}
          </span>
          <svg
            className={`w-3 h-3 text-gray-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Dropdown menu */}
        {dropdownOpen && (
          <div className="absolute top-full left-0 mt-1 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-50 min-w-[140px] overflow-hidden">
            {CHAINS.map((chain) => (
              <button
                key={chain.id}
                onClick={() => handleChainSelect(chain)}
                className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-800 transition-colors ${
                  chain.id === selectedChain.id ? 'bg-gray-800' : ''
                }`}
              >
                <div className={`w-4 h-4 rounded-full ${chain.color} flex items-center justify-center`}>
                  <span className="text-[8px] font-bold text-white">{chain.shortName}</span>
                </div>
                <span className="text-xs text-white">{chain.name}</span>
                {chain.id === selectedChain.id && (
                  <svg className="w-3 h-3 text-green-400 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Animated ticker content */}
      <div className="flex justify-center items-center h-5">
        <div
          key={`${selectedChain.id}-${currentIndex}`}
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
              i === currentIndex
                ? selectedChain.color.replace('bg-', 'bg-').replace('-500', '-400')
                : 'bg-white/20 hover:bg-white/40'
            }`}
            aria-label={`View ${item.label} stat`}
          />
        ))}
      </div>
    </div>
  );
}
