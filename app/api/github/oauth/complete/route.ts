import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const success = searchParams.get('success');
  const repo = searchParams.get('repo');
  const user = searchParams.get('user');
  const error = searchParams.get('error');

  const isSuccess = success === 'true' && repo;

  // Escape for safe embedding in script
  const safeRepo = repo?.replace(/'/g, "\\'") || '';
  const safeUser = user?.replace(/'/g, "\\'") || '';
  const safeError = error?.replace(/'/g, "\\'") || 'Unknown error';

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>GitHub Authorization Complete</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #0a0a0a;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      margin: 0;
      text-align: center;
    }
    .container { max-width: 400px; padding: 40px; }
    .icon { font-size: 48px; margin-bottom: 20px; }
    h1 { font-size: 24px; margin-bottom: 10px; }
    p { color: #888; font-size: 14px; line-height: 1.6; }
    .success { color: #10b981; }
    .error { color: #ef4444; }
    a { color: #8b5cf6; text-decoration: none; }
    a:hover { text-decoration: underline; }
    .btn {
      display: inline-block;
      margin-top: 20px;
      padding: 12px 24px;
      background: #8b5cf6;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      cursor: pointer;
      text-decoration: none;
    }
    .btn:hover { background: #7c3aed; }
    .btn-secondary {
      background: transparent;
      border: 1px solid #444;
      color: #888;
      margin-left: 10px;
    }
    .btn-secondary:hover { background: #222; color: white; }
    .status { font-size: 12px; color: #666; margin-top: 15px; }
  </style>
</head>
<body>
  <div class="container">
    ${isSuccess
      ? `<div class="icon">✅</div>
         <h1 class="success">Repo Created!</h1>
         <p>Your mini app repo is ready:</p>
         <p><a href="${safeRepo}" target="_blank">${safeRepo}</a></p>
         <div style="margin-top: 25px;">
           <button class="btn" onclick="closeAndReturn()">Back to Shipyard</button>
         </div>
         <p class="status" id="status">Notifying Shipyard...</p>`
      : `<div class="icon">❌</div>
         <h1 class="error">Something went wrong</h1>
         <p>${safeError}</p>
         <button class="btn btn-secondary" onclick="window.close()">Close</button>`
    }
  </div>
  <script>
    const isSuccess = ${isSuccess ? 'true' : 'false'};
    const repo = '${safeRepo}';
    const user = '${safeUser}';
    const error = '${safeError}';

    // Store result in localStorage as backup communication
    function storeResult() {
      try {
        const result = isSuccess
          ? { success: true, repo: repo, user: user, timestamp: Date.now() }
          : { success: false, error: error, timestamp: Date.now() };
        localStorage.setItem('shipyard-oauth-result', JSON.stringify(result));
        return true;
      } catch (e) {
        console.error('localStorage failed:', e);
        return false;
      }
    }

    function sendMessage() {
      const message = isSuccess
        ? { type: 'oauth-complete', success: true, repo: repo, user: user }
        : { type: 'oauth-complete', success: false, error: error };

      // Try localStorage first (more reliable in iframe context)
      storeResult();

      // Also try postMessage
      if (window.opener && !window.opener.closed) {
        try {
          window.opener.postMessage(message, '*');
          return true;
        } catch (e) {
          console.error('postMessage failed:', e);
        }
      }
      return false;
    }

    function closeAndReturn() {
      sendMessage();
      setTimeout(() => window.close(), 100);
    }

    // Store result and try to send message immediately
    storeResult();
    sendMessage();
    document.getElementById('status').textContent = 'Ready! Click the button to close...';

    // Auto-close after 2 seconds
    setTimeout(() => window.close(), 2000);
  </script>
</body>
</html>`;

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
