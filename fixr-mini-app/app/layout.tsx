// app/layout.tsx
import type { Metadata } from 'next';
import Script from 'next/script';
import { Rajdhani } from 'next/font/google';
import '../app/globals.css';

const rajdhani = Rajdhani({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-rajdhani',
});

// Frame embed metadata - matches /.well-known/farcaster.json manifest
const APP_URL = 'https://shipyard.fixr.nexus';

// Mini app embed for sharing in casts
const miniAppEmbed = {
  version: '1',
  name: 'Shipyard',
  iconUrl: `${APP_URL}/images/shipyardicon.png`,
  homeUrl: APP_URL,
  imageUrl: `${APP_URL}/images/shipyardpreview.png`,
  button: {
    title: 'Launch Shipyard',
    action: {
      type: 'launch_frame',
      name: 'Shipyard',
      url: APP_URL,
      splashImageUrl: `${APP_URL}/images/shipyardlogotransparent.png`,
      splashBackgroundColor: '#1a1a2e',
    },
  },
  splashImageUrl: `${APP_URL}/images/shipyardlogotransparent.png`,
  splashBackgroundColor: '#1a1a2e',
};

export const metadata: Metadata = {
  title: 'Shipyard',
  description: 'Builder\'s command center. Token security analysis, trending builders, shipped projects, and rug alerts.',
  openGraph: {
    title: 'Shipyard',
    description: 'Builder\'s command center. Token security, trending builders, and shipped projects.',
    images: [`${APP_URL}/images/shipyardpreview.png`],
  },
  other: {
    // Use fc:miniapp for new mini apps (fc:frame is legacy)
    'fc:miniapp': JSON.stringify(miniAppEmbed),
    // Keep fc:frame for backward compatibility
    'fc:frame': JSON.stringify(miniAppEmbed),
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${rajdhani.variable} font-sans`}>
      <head>
        <Script
          src="https://cdn.jsdelivr.net/npm/@farcaster/frame-sdk/dist/index.min.js"
          strategy="beforeInteractive"
        />
      </head>
      <body className="font-rajdhani">{children}</body>
    </html>
  );
}
