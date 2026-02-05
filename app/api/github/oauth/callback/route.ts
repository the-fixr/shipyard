import { NextRequest, NextResponse } from 'next/server';

const GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token';
const GITHUB_API_URL = 'https://api.github.com';

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

async function createUserRepo(
  accessToken: string,
  repoName: string,
  description: string,
  files: Array<{ path: string; content: string }>
): Promise<{ success: boolean; repoUrl?: string; error?: string }> {
  try {
    // Create repository
    const createResponse = await fetch(`${GITHUB_API_URL}/user/repos`, {
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
        auto_init: true,
      }),
    });

    if (!createResponse.ok) {
      const error = await createResponse.json();
      return { success: false, error: error.message || 'Failed to create repo' };
    }

    const repo = await createResponse.json();
    const [owner, repoNameActual] = repo.full_name.split('/');

    // Wait for GitHub to initialize
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Get default branch ref
    const refResponse = await fetch(
      `${GITHUB_API_URL}/repos/${owner}/${repoNameActual}/git/ref/heads/main`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/vnd.github+json',
        },
      }
    );

    if (!refResponse.ok) {
      return { success: true, repoUrl: repo.html_url };
    }

    const refData = await refResponse.json();
    const currentCommitSha = refData.object.sha;

    // Get tree
    const commitResponse = await fetch(
      `${GITHUB_API_URL}/repos/${owner}/${repoNameActual}/git/commits/${currentCommitSha}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/vnd.github+json',
        },
      }
    );
    const commitData = await commitResponse.json();
    const treeSha = commitData.tree.sha;

    // Create blobs
    const blobs = await Promise.all(
      files.map(async (file) => {
        const blobResponse = await fetch(
          `${GITHUB_API_URL}/repos/${owner}/${repoNameActual}/git/blobs`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Accept': 'application/vnd.github+json',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              content: utf8ToBase64(file.content),
              encoding: 'base64',
            }),
          }
        );
        const blobData = await blobResponse.json();
        return {
          path: file.path,
          mode: '100644' as const,
          type: 'blob' as const,
          sha: blobData.sha,
        };
      })
    );

    // Create tree
    const treeResponse = await fetch(
      `${GITHUB_API_URL}/repos/${owner}/${repoNameActual}/git/trees`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/vnd.github+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          base_tree: treeSha,
          tree: blobs,
        }),
      }
    );
    const treeData = await treeResponse.json();

    // Create commit
    const newCommitResponse = await fetch(
      `${GITHUB_API_URL}/repos/${owner}/${repoNameActual}/git/commits`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/vnd.github+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: 'Initialize Farcaster mini app from Fixr template',
          tree: treeData.sha,
          parents: [currentCommitSha],
        }),
      }
    );
    const newCommitData = await newCommitResponse.json();

    // Update ref
    await fetch(
      `${GITHUB_API_URL}/repos/${owner}/${repoNameActual}/git/refs/heads/main`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/vnd.github+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sha: newCommitData.sha }),
      }
    );

    return { success: true, repoUrl: repo.html_url };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

function generateTemplateFiles(appName: string, primaryColor: string, features: string[]): Array<{ path: string; content: string }> {
  const sanitizedName = appName.replace(/[^a-zA-Z0-9\s-]/g, '');
  const repoName = appName.toLowerCase().replace(/[^a-z0-9-]/g, '-');

  return [
    {
      path: 'package.json',
      content: JSON.stringify({
        name: repoName,
        version: '1.0.0',
        description: `${sanitizedName} - A Farcaster mini app`,
        private: true,
        scripts: { dev: 'next dev', build: 'next build', start: 'next start', lint: 'next lint' },
        dependencies: {
          '@farcaster/miniapp-sdk': '^0.2.3',
          '@farcaster/miniapp-wagmi-connector': '^1.1.1',
          '@tanstack/react-query': '^5.62.7',
          next: '^15.1.0',
          react: '^19.0.0',
          'react-dom': '^19.0.0',
          viem: '^2.21.0',
          wagmi: '^2.14.0',
        },
        devDependencies: {
          '@types/node': '^20',
          '@types/react': '^19',
          typescript: '^5',
          tailwindcss: '^3.4.1',
          postcss: '^8',
        },
      }, null, 2),
    },
    {
      path: 'README.md',
      content: `# ${sanitizedName}\n\nA Farcaster mini app created with [Shipyard](https://shipyard.fixr.nexus).\n\n## Quick Start\n\n\`\`\`bash\nnpm install\nnpm run dev\n\`\`\`\n\nBuilt with 💜 by [Fixr](https://fixr.nexus)`,
    },
    {
      path: 'public/manifest.json',
      content: JSON.stringify({
        version: '1',
        name: sanitizedName,
        homeUrl: 'https://your-app.vercel.app',
        button: { title: `Launch ${sanitizedName}`, action: { type: 'launch_frame', name: sanitizedName, url: 'https://your-app.vercel.app', splashBackgroundColor: primaryColor } },
      }, null, 2),
    },
    {
      path: '.gitignore',
      content: 'node_modules/\n.next/\n.env\n.env.local\n',
    },
  ];
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

  // Create repo
  const repoName = state.appName.toLowerCase().replace(/[^a-z0-9-]/g, '-');
  const files = generateTemplateFiles(state.appName, state.primaryColor, state.features);
  const result = await createUserRepo(accessToken, repoName, `${state.appName} - A Farcaster mini app`, files);

  if (result.success && result.repoUrl) {
    completeUrl.searchParams.set('success', 'true');
    completeUrl.searchParams.set('repo', result.repoUrl);
    completeUrl.searchParams.set('user', user.login);
  } else {
    completeUrl.searchParams.set('error', result.error || 'unknown');
  }

  return NextResponse.redirect(completeUrl);
}
