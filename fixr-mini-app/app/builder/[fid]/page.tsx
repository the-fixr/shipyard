import { Metadata } from 'next';
import BuilderIDPage from './BuilderIDPage';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://shipyard.fixr.nexus';
const FIXR_API_URL = process.env.NEXT_PUBLIC_FIXR_API_URL || 'https://fixr-agent.see21289.workers.dev';

// Force dynamic rendering so metadata updates on each request
export const dynamic = 'force-dynamic';

// Cache buster - changes every 5 minutes
function getCacheBuster(): string {
  const now = Date.now();
  const fiveMinutes = 5 * 60 * 1000;
  return String(Math.floor(now / fiveMinutes));
}

interface Props {
  params: Promise<{ fid: string }>;
}

async function getBuilderData(fid: string) {
  try {
    // No caching - always fetch fresh data
    const res = await fetch(`${FIXR_API_URL}/api/builder-id/check/${fid}`, {
      cache: 'no-store',
    });
    const data = await res.json();

    // API returns hasMinted, not hasBuilderId
    if (data.hasMinted && data.record) {
      return {
        found: true,
        record: data.record,
      };
    }
  } catch (error) {
    console.error('Failed to fetch builder data:', error);
  }
  return { found: false, record: null };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { fid } = await params;
  const { found, record } = await getBuilderData(fid);

  const username = record?.username || 'Builder';
  const score = String(record?.builderScore || 0);
  const shipped = String(record?.shippedCount || 0);
  const neynar = record?.neynarScore !== undefined ? String(record.neynarScore) : '';
  const powerBadge = record?.powerBadge || false;
  const imageUrl = record?.imageUrl || '';

  // Add cache buster to OG image URL (5 min cache)
  const cacheBuster = getCacheBuster();

  // Build OG image URL with all builder data
  const ogParams = new URLSearchParams({
    type: 'builder-id',
    fid,
    username,
    score,
    shipped,
    v: cacheBuster,
  });
  if (neynar) ogParams.set('neynar', neynar);
  if (powerBadge) ogParams.set('power', 'true');
  if (imageUrl) ogParams.set('image', imageUrl);

  const ogImageUrl = `${APP_URL}/api/og?${ogParams.toString()}`;

  const title = `Builder ID #${fid} - @${username}`;
  const neynarStr = neynar ? ` Neynar: ${Math.round(parseFloat(neynar) * 100)}%.` : '';
  const description = found
    ? `${username}'s verified builder identity on Farcaster. Builder Score: ${score}, Shipped: ${shipped} projects.${neynarStr}`
    : `View Builder ID #${fid} on Shipyard`;

  // Mini app embed for frame
  const miniAppEmbed = {
    version: '1',
    name: `Builder ID #${fid}`,
    iconUrl: `${APP_URL}/images/shipyardicon.png`,
    homeUrl: `${APP_URL}/builder/${fid}`,
    imageUrl: imageUrl || ogImageUrl,
    button: {
      title: 'View Builder ID',
      action: {
        type: 'launch_frame',
        name: 'Shipyard',
        url: APP_URL,
        splashImageUrl: `${APP_URL}/images/shipyardlogotransparent.png`,
        splashBackgroundColor: '#1a1a2e',
      },
    },
  };

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [imageUrl || ogImageUrl],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl || ogImageUrl],
    },
    other: {
      'fc:miniapp': JSON.stringify(miniAppEmbed),
      'fc:frame': JSON.stringify(miniAppEmbed),
    },
  };
}

export default async function BuilderPage({ params }: Props) {
  const { fid } = await params;
  const { found, record } = await getBuilderData(fid);

  return <BuilderIDPage fid={fid} found={found} record={record} />;
}
