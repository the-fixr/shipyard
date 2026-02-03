import { Metadata } from 'next';

// Override root layout metadata to remove frame tags
// This prevents Farcaster from rendering the leaderboard as a frame
export const metadata: Metadata = {
  other: {
    // Set to empty strings to override root layout's fc:frame and fc:miniapp
    // This ensures the leaderboard page renders as a regular OG embed
    'fc:frame': '{}',
    'fc:miniapp': '{}',
  },
};

export default function LeaderboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
