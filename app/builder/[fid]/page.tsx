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
      // Also fetch heatmap data if we have a wallet address
      let heatmap = null;
      let baseScore: number | undefined;
      try {
        const heatmapRes = await fetch(`${FIXR_API_URL}/api/base-heatmap/${fid}`, {
          cache: 'no-store',
        });
        if (heatmapRes.ok) {
          const heatmapData = await heatmapRes.json();
          heatmap = heatmapData.heatmap || null;
          baseScore = heatmapData.score;
        }
      } catch (heatmapError) {
        console.error('Failed to fetch heatmap data:', heatmapError);
      }

      return {
        found: true,
        record: {
          ...data.record,
          heatmap,
          baseScore,
        },
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
  const ethos = record?.ethosScore !== undefined ? String(record.ethosScore) : '';
  const ethosLevel = record?.ethosLevel || '';
  const powerBadge = record?.powerBadge || false;
  const imageUrl = record?.imageUrl || '';
  const base = record?.baseScore !== undefined ? String(record.baseScore) : '';

  // Generate heatmap string from heatmap data (last 84 days as levels 0-4)
  let heatmapStr = '';
  if (record?.heatmap?.days?.length > 0) {
    const today = new Date();
    const dayMap = new Map<string, number>();
    record.heatmap.days.forEach((d: { date: string; level: number }) => {
      dayMap.set(d.date, d.level);
    });

    // Generate last 84 days
    for (let i = 83; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      heatmapStr += String(dayMap.get(dateStr) || 0);
    }
  }

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
  if (ethos) ogParams.set('ethos', ethos);
  if (ethosLevel) ogParams.set('ethosLevel', ethosLevel);
  if (powerBadge) ogParams.set('power', 'true');
  if (imageUrl) ogParams.set('image', imageUrl);
  if (base) ogParams.set('base', base);
  if (heatmapStr) ogParams.set('heatmap', heatmapStr);

  const ogImageUrl = `${APP_URL}/api/og?${ogParams.toString()}`;

  const title = `Builder ID #${fid} - @${username}`;
  const neynarStr = neynar ? ` Neynar: ${Math.round(parseFloat(neynar) * 100)}%.` : '';
  const ethosStr = ethos ? ` Ethos: ${ethos}.` : '';
  const baseStr = base ? ` Base Activity: ${base}.` : '';
  const description = found
    ? `${username}'s verified builder identity on Farcaster. Builder Score: ${score}, Shipped: ${shipped} projects.${neynarStr}${ethosStr}${baseStr}`
    : `View Builder ID #${fid} on Shipyard`;

  // Mini app embed for frame
  const miniAppEmbed = {
    version: '1',
    name: `Builder ID #${fid}`,
    iconUrl: `${APP_URL}/images/shipyardicon.png`,
    homeUrl: `${APP_URL}/builder/${fid}`,
    imageUrl: ogImageUrl,
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
      images: [ogImageUrl],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImageUrl],
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
