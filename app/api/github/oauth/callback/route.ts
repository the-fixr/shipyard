import { NextRequest, NextResponse } from 'next/server';

const GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token';
const GITHUB_API_URL = 'https://api.github.com';
const TEMPLATE_OWNER = 'the-fixr';
const TEMPLATE_REPO = 'farcaster-miniapp-template';

function utf8ToBase64(str: string): string {
  return Buffer.from(str, 'utf-8').toString('base64');
}

interface GitHubUser {
  login: string;
  id: number;
}

interface OAuthState {
  appName: string;
  primaryColor: string;
  features: string[];
  sessionId?: string;
}

async function exchangeCodeForToken(code: string): Promise<string | null> {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return null;
  }

  const response = await fetch(GITHUB_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
    }),
  });

  if (!response.ok) return null;

  const data = await response.json();
  return data.access_token || null;
}

async function getGitHubUser(accessToken: string): Promise<GitHubUser | null> {
  const response = await fetch(`${GITHUB_API_URL}/user`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/vnd.github+json',
    },
  });

  if (!response.ok) return null;
  return response.json();
}

async function createRepoFromTemplate(
  accessToken: string,
  repoName: string,
  description: string
): Promise<{ success: boolean; repoUrl?: string; owner?: string; error?: string }> {
  try {
    // Use GitHub's template repository API
    const response = await fetch(
      `${GITHUB_API_URL}/repos/${TEMPLATE_OWNER}/${TEMPLATE_REPO}/generate`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/vnd.github+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: repoName,
          description,
          private: false,
          include_all_branches: false,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.message || 'Failed to create repo from template' };
    }

    const repo = await response.json();
    return { success: true, repoUrl: repo.html_url, owner: repo.owner.login };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

async function updateRepoFile(
  accessToken: string,
  owner: string,
  repo: string,
  path: string,
  content: string,
  message: string
): Promise<boolean> {
  try {
    // Get current file to get its SHA
    const getResponse = await fetch(
      `${GITHUB_API_URL}/repos/${owner}/${repo}/contents/${path}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/vnd.github+json',
        },
      }
    );

    let sha: string | undefined;
    if (getResponse.ok) {
      const fileData = await getResponse.json();
      sha = fileData.sha;
    }

    // Update or create file
    const updateResponse = await fetch(
      `${GITHUB_API_URL}/repos/${owner}/${repo}/contents/${path}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/vnd.github+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          content: utf8ToBase64(content),
          sha,
        }),
      }
    );

    return updateResponse.ok;
  } catch {
    return false;
  }
}

// Feature-specific dependencies
const FEATURE_DEPS: Record<string, Record<string, string>> = {
  wallet: {},  // Already included in base template
  auth: {},    // Already included in base template
  nft: {
    '@zoralabs/coins-sdk': '^0.0.1',
  },
  token: {
    '@zoralabs/coins-sdk': '^0.0.1',
  },
};

// Feature-specific code files
function getFeatureFiles(features: string[], primaryColor: string): Array<{ path: string; content: string }> {
  const files: Array<{ path: string; content: string }> = [];

  if (features.includes('nft')) {
    files.push({
      path: 'lib/nft.ts',
      content: `// NFT utilities for minting and displaying NFTs
import { createPublicClient, http } from 'viem';
import { base } from 'viem/chains';

export const publicClient = createPublicClient({
  chain: base,
  transport: http(),
});

// Example: Check if user owns a specific NFT
export async function checkNFTOwnership(
  contractAddress: \`0x\${string}\`,
  ownerAddress: \`0x\${string}\`,
  tokenId?: bigint
): Promise<boolean> {
  try {
    const balance = await publicClient.readContract({
      address: contractAddress,
      abi: [{
        name: 'balanceOf',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'owner', type: 'address' }],
        outputs: [{ name: '', type: 'uint256' }],
      }],
      functionName: 'balanceOf',
      args: [ownerAddress],
    });
    return balance > 0n;
  } catch (error) {
    console.error('Error checking NFT ownership:', error);
    return false;
  }
}

// Example: Get NFT metadata URI
export async function getNFTMetadata(
  contractAddress: \`0x\${string}\`,
  tokenId: bigint
): Promise<string | null> {
  try {
    const uri = await publicClient.readContract({
      address: contractAddress,
      abi: [{
        name: 'tokenURI',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'tokenId', type: 'uint256' }],
        outputs: [{ name: '', type: 'string' }],
      }],
      functionName: 'tokenURI',
      args: [tokenId],
    });
    return uri;
  } catch (error) {
    console.error('Error getting NFT metadata:', error);
    return null;
  }
}
`,
    });
  }

  if (features.includes('token')) {
    files.push({
      path: 'lib/token-gate.ts',
      content: `// Token gating utilities
import { createPublicClient, http, formatUnits } from 'viem';
import { base } from 'viem/chains';

export const publicClient = createPublicClient({
  chain: base,
  transport: http(),
});

// ERC20 ABI for balance checking
const ERC20_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'decimals',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }],
  },
] as const;

// Check if user holds minimum token balance
export async function checkTokenBalance(
  tokenAddress: \`0x\${string}\`,
  userAddress: \`0x\${string}\`,
  minBalance: number = 0
): Promise<{ hasAccess: boolean; balance: string }> {
  try {
    const [balance, decimals] = await Promise.all([
      publicClient.readContract({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [userAddress],
      }),
      publicClient.readContract({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: 'decimals',
      }),
    ]);

    const formattedBalance = formatUnits(balance, decimals);
    const hasAccess = Number(formattedBalance) >= minBalance;

    return { hasAccess, balance: formattedBalance };
  } catch (error) {
    console.error('Error checking token balance:', error);
    return { hasAccess: false, balance: '0' };
  }
}

// Token gate wrapper component example
export function createTokenGate(tokenAddress: \`0x\${string}\`, minBalance: number = 1) {
  return {
    tokenAddress,
    minBalance,
    check: (userAddress: \`0x\${string}\`) => checkTokenBalance(tokenAddress, userAddress, minBalance),
  };
}
`,
    });
  }

  // Always add a config file with the primary color
  files.push({
    path: 'lib/config.ts',
    content: `// App configuration
export const config = {
  primaryColor: '${primaryColor}',
  features: ${JSON.stringify(features)},
} as const;
`,
  });

  return files;
}

async function customizeRepo(
  accessToken: string,
  owner: string,
  repoName: string,
  appName: string,
  primaryColor: string,
  features: string[]
): Promise<void> {
  const sanitizedName = appName.replace(/[^a-zA-Z0-9\s-]/g, '');
  const slugName = appName.toLowerCase().replace(/[^a-z0-9-]/g, '-');

  // Wait for GitHub to fully initialize the repo
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Update manifest.json with app name and color
  const manifest = {
    version: '1',
    name: sanitizedName,
    homeUrl: 'https://your-app.vercel.app',
    imageUrl: 'https://your-app.vercel.app/og-image.png',
    iconUrl: 'https://your-app.vercel.app/icon.png',
    button: {
      title: `Launch ${sanitizedName}`,
      action: {
        type: 'launch_frame',
        name: sanitizedName,
        url: 'https://your-app.vercel.app',
        splashImageUrl: 'https://your-app.vercel.app/splash.png',
        splashBackgroundColor: primaryColor,
      },
    },
  };

  await updateRepoFile(
    accessToken,
    owner,
    repoName,
    'public/manifest.json',
    JSON.stringify(manifest, null, 2),
    `Customize manifest for ${sanitizedName}`
  );

  // Update package.json with app name and feature dependencies
  try {
    const pkgResponse = await fetch(
      `${GITHUB_API_URL}/repos/${owner}/${repoName}/contents/package.json`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/vnd.github+json',
        },
      }
    );

    if (pkgResponse.ok) {
      const pkgFile = await pkgResponse.json();
      const pkgContent = Buffer.from(pkgFile.content, 'base64').toString('utf-8');
      const pkg = JSON.parse(pkgContent);
      pkg.name = slugName;
      pkg.description = `${sanitizedName} - A Farcaster mini app`;

      // Add feature-specific dependencies
      for (const feature of features) {
        const deps = FEATURE_DEPS[feature];
        if (deps) {
          pkg.dependencies = { ...pkg.dependencies, ...deps };
        }
      }

      await updateRepoFile(
        accessToken,
        owner,
        repoName,
        'package.json',
        JSON.stringify(pkg, null, 2),
        `Update package.json for ${sanitizedName}`
      );
    }
  } catch {
    // Non-critical, continue
  }

  // Add feature-specific files
  const featureFiles = getFeatureFiles(features, primaryColor);
  for (const file of featureFiles) {
    await updateRepoFile(
      accessToken,
      owner,
      repoName,
      file.path,
      file.content,
      `Add ${file.path}`
    );
  }

  // Feature descriptions for README
  const featureDescriptions: Record<string, string> = {
    wallet: 'Native Farcaster wallet integration via frame SDK',
    auth: 'Farcaster user authentication and context',
    nft: 'NFT minting and display utilities (see `lib/nft.ts`)',
    token: 'Token-gated access control (see `lib/token-gate.ts`)',
  };

  // Update README
  const featureList = features.length > 0
    ? features.map(f => `- **${f.charAt(0).toUpperCase() + f.slice(1)}**: ${featureDescriptions[f] || f}`).join('\n')
    : '- Farcaster mini app SDK integration\n- Wallet connection\n- User context';

  const readme = `# ${sanitizedName}

A Farcaster mini app created with [Shipyard](https://shipyard.fixr.nexus).

## Features

${featureList}

## Quick Start

\`\`\`bash
npm install
npm run dev
\`\`\`

## Configuration

Your app config is in \`lib/config.ts\`:

\`\`\`typescript
export const config = {
  primaryColor: '${primaryColor}',
  features: ${JSON.stringify(features)},
};
\`\`\`

${features.includes('token') ? `
## Token Gating

Use the token gate utility in \`lib/token-gate.ts\`:

\`\`\`typescript
import { checkTokenBalance } from '@/lib/token-gate';

const { hasAccess, balance } = await checkTokenBalance(
  '0xYourTokenAddress',
  userWalletAddress,
  100 // minimum balance required
);
\`\`\`
` : ''}
${features.includes('nft') ? `
## NFT Support

Use the NFT utilities in \`lib/nft.ts\`:

\`\`\`typescript
import { checkNFTOwnership, getNFTMetadata } from '@/lib/nft';

const ownsNFT = await checkNFTOwnership(
  '0xYourNFTContract',
  userWalletAddress
);
\`\`\`
` : ''}
## Deploy

Deploy to Vercel:

\`\`\`bash
vercel
\`\`\`

Then update the URLs in \`public/manifest.json\` with your deployed URL.

---

Built with 💜 by [Fixr](https://fixr.nexus)
`;

  await updateRepoFile(
    accessToken,
    owner,
    repoName,
    'README.md',
    readme,
    `Update README for ${sanitizedName}`
  );
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const stateParam = searchParams.get('state');
  const error = searchParams.get('error');

  const completeUrl = new URL('/api/github/oauth/complete', request.url);

  if (error) {
    completeUrl.searchParams.set('error', error);
    return NextResponse.redirect(completeUrl);
  }

  if (!code || !stateParam) {
    completeUrl.searchParams.set('error', 'missing_params');
    return NextResponse.redirect(completeUrl);
  }

  // Decode state
  let state: OAuthState;
  try {
    state = JSON.parse(Buffer.from(stateParam, 'base64').toString('utf-8'));
  } catch {
    completeUrl.searchParams.set('error', 'invalid_state');
    return NextResponse.redirect(completeUrl);
  }

  // Exchange code for token
  const accessToken = await exchangeCodeForToken(code);
  if (!accessToken) {
    completeUrl.searchParams.set('error', 'token_failed');
    return NextResponse.redirect(completeUrl);
  }

  // Get user
  const user = await getGitHubUser(accessToken);
  if (!user) {
    completeUrl.searchParams.set('error', 'user_failed');
    return NextResponse.redirect(completeUrl);
  }

  // Create repo from template
  const repoName = state.appName.toLowerCase().replace(/[^a-z0-9-]/g, '-');
  const result = await createRepoFromTemplate(
    accessToken,
    repoName,
    `${state.appName} - A Farcaster mini app`
  );

  // Always pass sessionId for server-side polling
  if (state.sessionId) {
    completeUrl.searchParams.set('sessionId', state.sessionId);
  }

  if (result.success && result.repoUrl && result.owner) {
    // Customize the repo with user's settings
    await customizeRepo(
      accessToken,
      result.owner,
      repoName,
      state.appName,
      state.primaryColor,
      state.features
    );

    completeUrl.searchParams.set('success', 'true');
    completeUrl.searchParams.set('repo', result.repoUrl);
    completeUrl.searchParams.set('user', user.login);
  } else {
    completeUrl.searchParams.set('error', result.error || 'unknown');
  }

  return NextResponse.redirect(completeUrl);
}
