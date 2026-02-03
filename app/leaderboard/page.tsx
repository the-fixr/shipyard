import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

const APP_URL = 'https://shipyard.fixr.nexus';
const FIXR_API_URL = 'https://agent.fixr.nexus';

interface BuilderIDRecord {
  fid: number;
  username: string;
  imageUrl: string;
  builderScore?: number;
  neynarScore?: number;
}

async function getTopBuilders(): Promise<BuilderIDRecord[]> {
  try {
    const res = await fetch(`${FIXR_API_URL}/api/builder-id/holders?limit=10`, {
      next: { revalidate: 60 }, // Cache for 60 seconds
    });
    const data = await res.json();
    return data.holders || [];
  } catch {
    return [];
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const builders = await getTopBuilders();

  // Format builders for OG image: username,score,pfp;username,score,pfp;...
  const buildersParam = builders
    .slice(0, 10)
    .map((b) => {
      const score = b.builderScore || Math.round((b.neynarScore || 0) * 100);
      const pfp = encodeURIComponent(b.imageUrl || '');
      return `${b.username},${score},${pfp}`;
    })
    .join(';');

  const ogImageUrl = `${APP_URL}/api/og?type=leaderboard&builders=${encodeURIComponent(buildersParam)}`;

  return {
    title: 'Builder Leaderboard | Shipyard',
    description: 'Top builders on Shipyard ranked by reputation score.',
    openGraph: {
      title: 'Builder Leaderboard | Shipyard',
      description: 'Top builders on Shipyard ranked by reputation score.',
      images: [ogImageUrl],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Builder Leaderboard | Shipyard',
      description: 'Top builders on Shipyard ranked by reputation score.',
      images: [ogImageUrl],
    },
  };
}

export default async function LeaderboardPage() {
  // Check if this is a bot/crawler request - serve content for them
  const headersList = await headers();
  const userAgent = headersList.get('user-agent') || '';
  const isCrawler = /bot|crawler|spider|facebookexternalhit|twitterbot|linkedinbot|slackbot|discordbot|telegrambot/i.test(userAgent);

  // For crawlers, return minimal page (metadata is served via generateMetadata)
  // For users, redirect to main app with builders view
  if (!isCrawler) {
    redirect('/?view=builders');
  }

  // Minimal page for crawlers - they just need the OG metadata
  return (
    <div>
      <h1>Builder Leaderboard</h1>
      <p>Top builders on Shipyard ranked by reputation score.</p>
    </div>
  );
}
