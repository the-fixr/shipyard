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

// Frame embed metadata - Customize these for your app
// TODO: Update URLs after deployment
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://fixr-mini-app.vercel.app';

const frameMetadata = {
  version: 'next',
  imageUrl: `${APP_URL}/images/frame-preview.png`,
  button: {
    title: 'Launch Shipyard',
    action: {
      type: 'launch_frame',
      name: 'Shipyard by Fixr',
      url: APP_URL,
      splashImageUrl: `${APP_URL}/images/fixrpfp.png`,
      splashBackgroundColor: '#0a0a0a'
    }
  }
};

export const metadata: Metadata = {
  title: 'Shipyard by Fixr',
  description: 'Builder\'s command center. Token security analysis, trending builders, shipped projects, and rug alerts.',
  other: {
    'fc:frame': JSON.stringify(frameMetadata),
    'og:image': frameMetadata.imageUrl,
    'fc:frame:image': frameMetadata.imageUrl,
    'fc:frame:button:1': frameMetadata.button.title,
    'fc:frame:post_url': frameMetadata.button.action.url,
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
