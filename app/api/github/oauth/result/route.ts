import { NextRequest, NextResponse } from 'next/server';

// In-memory store for OAuth results (in production, use Redis/KV)
// Results expire after 5 minutes
const oauthResults = new Map<string, { result: unknown; expires: number }>();

// Clean expired entries periodically
function cleanExpired() {
  const now = Date.now();
  for (const [key, value] of oauthResults.entries()) {
    if (value.expires < now) {
      oauthResults.delete(key);
    }
  }
}

// GET - Check for OAuth result by session ID
export async function GET(request: NextRequest) {
  cleanExpired();

  const sessionId = request.nextUrl.searchParams.get('sessionId');
  if (!sessionId) {
    return NextResponse.json({ error: 'sessionId required' }, { status: 400 });
  }

  const entry = oauthResults.get(sessionId);
  if (!entry) {
    return NextResponse.json({ pending: true });
  }

  // Return and delete (one-time read)
  oauthResults.delete(sessionId);
  return NextResponse.json(entry.result);
}

// POST - Store OAuth result
export async function POST(request: NextRequest) {
  cleanExpired();

  try {
    const { sessionId, success, repo, user, error } = await request.json();

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId required' }, { status: 400 });
    }

    const result = success
      ? { success: true, repo, user }
      : { success: false, error };

    // Store with 5 minute expiry
    oauthResults.set(sessionId, {
      result,
      expires: Date.now() + 5 * 60 * 1000,
    });

    return NextResponse.json({ stored: true });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
