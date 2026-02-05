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

  // Update package.json with app name
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

  // Update README
  const readme = `# ${sanitizedName}

A Farcaster mini app created with [Shipyard](https://shipyard.fixr.nexus).

## Features

${features.length > 0 ? features.map(f => `- ${f}`).join('\n') : '- Farcaster mini app SDK integration\n- Wallet connection\n- User context'}

## Quick Start

\`\`\`bash
npm install
npm run dev
\`\`\`

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
