import { NextRequest, NextResponse } from 'next/server';

const GITHUB_AUTHORIZE_URL = 'https://github.com/login/oauth/authorize';

// UTF-8 safe base64 encoder
function utf8ToBase64(str: string): string {
  return Buffer.from(str, 'utf-8').toString('base64');
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const appName = searchParams.get('appName') || 'my-miniapp';
  const primaryColor = searchParams.get('primaryColor') || '#8B5CF6';
  const features = searchParams.get('features') || '';
  const sessionId = searchParams.get('sessionId') || '';

  const clientId = process.env.GITHUB_CLIENT_ID;

  if (!clientId) {
    return NextResponse.json({ error: 'GitHub OAuth not configured' }, { status: 500 });
  }

  // Build callback URL on the same domain
  const callbackUrl = new URL('/api/github/oauth/callback', request.url);

  // Encode state with app settings and session ID for server-side result polling
  const state = utf8ToBase64(JSON.stringify({
    appName,
    primaryColor,
    features: features.split(',').filter(Boolean),
    sessionId,
  }));

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: callbackUrl.toString(),
    scope: 'repo',
    state,
  });

  return NextResponse.redirect(`${GITHUB_AUTHORIZE_URL}?${params.toString()}`);
}
