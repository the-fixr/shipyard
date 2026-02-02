// Fixr Agent Types

export type TaskStatus = 'pending' | 'planning' | 'awaiting_approval' | 'approved' | 'executing' | 'completed' | 'failed';

export type Chain = 'ethereum' | 'base' | 'monad' | 'solana';

export interface Task {
  id: string;
  title: string;
  description: string;
  chain?: Chain;
  status: TaskStatus;
  plan?: Plan;
  result?: TaskResult;
  createdAt: string;
  updatedAt: string;
}

export interface Plan {
  id: string;
  taskId: string;
  summary: string;
  steps: PlanStep[];
  estimatedTime: string;
  risks: string[];
  createdAt: string;
  approvedAt?: string;
}

export interface PlanStep {
  order: number;
  action: 'code' | 'deploy' | 'contract' | 'post' | 'other';
  description: string;
  details: Record<string, unknown>;
}

export interface TaskResult {
  success: boolean;
  outputs: TaskOutput[];
  error?: string;
  completedAt: string;
  executionProgress?: {
    lastCompletedStep: number;
    totalSteps: number;
    startedAt: string;
  };
}

export interface TaskOutput {
  type: 'repo' | 'deployment' | 'contract' | 'post' | 'file';
  url?: string;
  data?: Record<string, unknown>;
}

export interface AgentMemory {
  identity: {
    name: string;
    tagline: string;
    email: string;
    socials: {
      x: string;
      farcaster: string;
      website: string;
    };
  };
  goals: string[];
  tasks: Task[];
  completedProjects: CompletedProject[];
  wallets: {
    ethereum: string;
    solana: string;
  };
}

export interface CompletedProject {
  id: string;
  name: string;
  description: string;
  chain: Chain;
  urls: {
    repo?: string;
    deployment?: string;
    contract?: string;
    post?: string;
  };
  completedAt: string;
}

export interface ApprovalRequest {
  id: string;
  planId: string;
  taskId: string;
  sentAt: string;
  status: 'pending' | 'approved' | 'rejected' | 'executed';
  respondedAt?: string;
}

export interface PlanEmail {
  to: string;
  subject: string;
  plan: Plan;
  task: Task;
  approvalLink: string;
  rejectLink: string;
}

// Environment bindings for Cloudflare Workers
export interface Env {
  // Database
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;

  // AI
  ANTHROPIC_API_KEY: string;

  // GitHub
  GITHUB_TOKEN: string;

  // Vercel
  VERCEL_TOKEN: string;
  VERCEL_TEAM_ID: string;

  // X (Twitter)
  X_API_KEY: string;
  X_API_SECRET: string;
  X_ACCESS_TOKEN: string;
  X_ACCESS_SECRET: string;

  // Farcaster (Neynar)
  NEYNAR_API_KEY: string;
  FARCASTER_SIGNER_UUID: string;
  FARCASTER_FID: string;
  NEYNAR_WEBHOOK_SECRET: string;

  // x402 Payments (gasless USDC micropayments via Neynar wallet)
  USE_X402_PAYMENTS: string; // 'true' to enable
  NEYNAR_WALLET_ID: string; // Neynar managed wallet ID for x402

  // Email
  RESEND_API_KEY: string;
  FROM_EMAIL: string;
  OWNER_EMAIL: string;

  // Security
  CRON_SECRET: string;

  // App
  APP_URL: string;

  // Moltbook (AI social network)
  MOLTBOOK_API_KEY: string;

  // Gemini (image generation)
  GEMINI_API_KEY: string;

  // On-chain wallet (for Base transactions like Farcaster Pro purchase)
  WALLET_PRIVATE_KEY?: string;
  BASE_RPC_URL?: string; // Optional Base RPC URL (defaults to public RPC)

  // Paragraph (newsletter publishing)
  PARAGRAPH_API_KEY: string;

  // Block explorer API key (Etherscan V2 uses single key for all chains)
  ETHERSCAN_API_KEY?: string;

  // Webacy (wallet risk scoring and threat detection)
  WEBACY_API_KEY?: string;

  // WaveSpeedAI (video generation)
  WAVESPEED_API_KEY?: string;

  // Clanker.world (Farcaster-native token launcher)
  CLANKER_API_KEY?: string;

  // Alchemy (NFT data, token balances, whale tracking)
  ALCHEMY_API_KEY?: string;

  // Talent Protocol (builder reputation and scores)
  TALENT_PROTOCOL_API_KEY?: string;
}
