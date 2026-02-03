import { Metadata } from 'next';

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

export default function LeaderboardPage() {
  // Redirect to main page with builders view
  return (
    <meta httpEquiv="refresh" content="0;url=/?view=builders" />
  );
}
