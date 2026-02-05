import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const success = searchParams.get('success');
  const repo = searchParams.get('repo');
  const user = searchParams.get('user');
  const error = searchParams.get('error');

  const isSuccess = success === 'true' && repo;

  const message = isSuccess
    ? { type: 'oauth-complete', success: true, repo, user }
    : { type: 'oauth-complete', success: false, error: error || 'Unknown error' };

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
    p { color: #888; font-size: 14px; }
    .success { color: #10b981; }
    .error { color: #ef4444; }
    a { color: #8b5cf6; text-decoration: none; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div class="container">
    ${isSuccess
      ? `<div class="icon">✅</div>
         <h1 class="success">Repo Created!</h1>
         <p>Your repo is ready at:<br><a href="${repo}" target="_blank">${repo}</a></p>
         <p style="margin-top: 20px; font-size: 12px;">This window will close automatically...</p>`
      : `<div class="icon">❌</div>
         <h1 class="error">Something went wrong</h1>
         <p>${error || 'Unknown error'}</p>`
    }
  </div>
  <script>
    // Send message to opener (parent window)
    if (window.opener) {
      window.opener.postMessage(${JSON.stringify(message)}, '*');
      setTimeout(() => window.close(), 2000);
    }
  </script>
</body>
</html>`;

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
