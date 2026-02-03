import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

// 5 minute cache for OG images
const OG_CACHE_SECONDS = 300;

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get('type') || 'default';

  // Builder ID OG image
  if (type === 'builder-id') {
    const fid = searchParams.get('fid') || '0';
    const username = searchParams.get('username') || 'Builder';
    const score = searchParams.get('score') || '0';
    const shipped = searchParams.get('shipped') || '0';
    const neynar = searchParams.get('neynar') || '';
    const ethos = searchParams.get('ethos') || '';
    const ethosLevel = searchParams.get('ethosLevel') || '';
    const base = searchParams.get('base') || '';
    const powerBadge = searchParams.get('power') === 'true';
    const imageUrl = searchParams.get('image') || '';

    // Calculate neynar percentage if provided (comes as 0-1)
    const neynarPercent = neynar && !isNaN(parseFloat(neynar)) ? Math.round(parseFloat(neynar) * 100) : null;
    // Ethos score is 0-2800
    const parsedEthos = ethos ? parseInt(ethos) : NaN;
    const ethosScore = !isNaN(parsedEthos) ? parsedEthos : null;
    // Base activity score is 0-100
    const parsedBase = base ? parseInt(base) : NaN;
    const baseScore = !isNaN(parsedBase) ? parsedBase : null;

    // Heatmap data: string of levels "01234012..." for last 84 days (12 weeks)
    const heatmapData = searchParams.get('heatmap') || '';
    const heatmapLevels = heatmapData.split('').map(c => parseInt(c) || 0).slice(-84);
    const hasHeatmap = heatmapLevels.length > 0 && heatmapLevels.some(l => l > 0);

    // Heatmap colors (Base blue theme)
    const heatmapColors = [
      'rgba(30, 41, 59, 0.5)',    // 0 - no activity
      'rgba(59, 130, 246, 0.3)',  // 1 - low
      'rgba(59, 130, 246, 0.5)',  // 2 - medium-low
      'rgba(59, 130, 246, 0.7)',  // 3 - medium-high
      'rgba(59, 130, 246, 1)',    // 4 - high
    ];

    // Pad to 84 days if needed
    while (heatmapLevels.length < 84) {
      heatmapLevels.unshift(0);
    }

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#0f0f1a',
            backgroundImage: 'radial-gradient(circle at 20% 20%, #8b5cf640 0%, transparent 50%), radial-gradient(circle at 80% 80%, #a855f730 0%, transparent 50%)',
          }}
        >
          {/* Centered content wrapper */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '48px',
            }}
          >
            {/* Left side - Avatar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {imageUrl ? (
                <img
                  src={imageUrl}
                  width={280}
                  height={280}
                  style={{
                    borderRadius: '20px',
                    border: '4px solid rgba(139, 92, 246, 0.5)',
                    boxShadow: '0 0 40px rgba(139, 92, 246, 0.3)',
                  }}
                />
              ) : (
                <div
                  style={{
                    display: 'flex',
                    width: '280px',
                    height: '280px',
                    background: 'linear-gradient(135deg, #8b5cf6, #a855f7)',
                    borderRadius: '20px',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <span style={{ fontSize: '90px', color: 'white' }}>#{fid}</span>
                </div>
              )}
            </div>

            {/* Right side - Info */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
              }}
            >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                marginBottom: '16px',
              }}
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="#855DCD">
                <path d="M18.24.24H5.76C2.5789.24 0 2.8188 0 6v12c0 3.1811 2.5789 5.76 5.76 5.76h12.48c3.1812 0 5.76-2.5789 5.76-5.76V6C24 2.8188 21.4212.24 18.24.24m.8155 17.1662v.504c.2868-.0256.5458.1905.5439.479v.5688h-5.1437v-.5688c-.0019-.2885.2576-.5047.5443-.479v-.504c0-.22.1525-.402.358-.458l-.0095-4.3645c-.1589-1.7366-1.6402-3.0979-3.4435-3.0979-1.8038 0-3.2846 1.3613-3.4435 3.0979l-.0096 4.3578c.2276.0424.5318.2083.5395.4648v.504c.2863-.0256.5457.1905.5438.479v.5688H4.3915v-.5688c-.0019-.2885.2575-.5047.5438-.479v-.504c0-.2529.2011-.4548.4536-.4724v-7.895h-.4905L4.2898 7.008l2.6405-.0005V5.0419h9.9495v1.9656h2.8219l-.6091 2.0314h-.4901v7.8949c.2519.0177.453.2195.453.4724"/>
              </svg>
              <div
                style={{
                  display: 'flex',
                  background: 'linear-gradient(135deg, #8b5cf6, #a855f7)',
                  padding: '8px 20px',
                  borderRadius: '10px',
                  color: 'white',
                  fontSize: '24px',
                  fontWeight: 'bold',
                }}
              >
                Builder ID
              </div>
              <span style={{ color: '#6b7280', fontSize: '24px' }}>#{fid}</span>
              {powerBadge && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'rgba(234, 179, 8, 0.2)',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    color: '#facc15',
                    fontSize: '16px',
                  }}
                >
                  <span>⭐</span>
                  <span>Power</span>
                </div>
              )}
            </div>

            {/* Username */}
            <div
              style={{
                display: 'flex',
                color: 'white',
                fontSize: '56px',
                fontWeight: 'bold',
                marginBottom: '28px',
              }}
            >
              @{username}
            </div>

            {/* Stats Row - Builder Score and Shipped */}
            <div
              style={{
                display: 'flex',
                gap: '16px',
                marginBottom: '20px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  background: 'rgba(255, 255, 255, 0.08)',
                  padding: '14px 22px',
                  borderRadius: '14px',
                  minWidth: '100px',
                }}
              >
                <span style={{ color: '#a855f7', fontSize: '32px', fontWeight: 'bold' }}>{score}</span>
                <span style={{ color: '#9ca3af', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Builder</span>
              </div>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  background: 'rgba(255, 255, 255, 0.08)',
                  padding: '14px 22px',
                  borderRadius: '14px',
                  minWidth: '100px',
                }}
              >
                <span style={{ color: '#f97316', fontSize: '32px', fontWeight: 'bold' }}>{shipped}</span>
                <span style={{ color: '#9ca3af', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Shipped</span>
              </div>
              {neynarPercent !== null && (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    background: 'rgba(255, 255, 255, 0.08)',
                    padding: '14px 22px',
                    borderRadius: '14px',
                    minWidth: '100px',
                  }}
                >
                  <span style={{ color: '#06b6d4', fontSize: '32px', fontWeight: 'bold' }}>{neynarPercent}%</span>
                  <span style={{ color: '#9ca3af', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Neynar</span>
                </div>
              )}
            </div>

            {/* Base Activity Heatmap */}
            {hasHeatmap && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  background: 'rgba(255, 255, 255, 0.05)',
                  padding: '14px 20px',
                  borderRadius: '12px',
                  marginBottom: '16px',
                  width: '100%',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '12px', width: '100%' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="#3b82f6">
                    <circle cx="12" cy="12" r="10" />
                  </svg>
                  <span style={{ color: '#9ca3af', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Base Activity (12 weeks)</span>
                </div>
                <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                  {/* Render 12 columns (weeks) x 7 rows (days) */}
                  {Array.from({ length: 12 }).map((_, weekIdx) => (
                    <div key={weekIdx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {Array.from({ length: 7 }).map((_, dayIdx) => {
                        const idx = weekIdx * 7 + dayIdx;
                        const level = heatmapLevels[idx] || 0;
                        return (
                          <div
                            key={dayIdx}
                            style={{
                              width: '18px',
                              height: '18px',
                              borderRadius: '4px',
                              background: heatmapColors[Math.min(level, 4)],
                            }}
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Footer */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="#855DCD">
                <path d="M18.24.24H5.76C2.5789.24 0 2.8188 0 6v12c0 3.1811 2.5789 5.76 5.76 5.76h12.48c3.1812 0 5.76-2.5789 5.76-5.76V6C24 2.8188 21.4212.24 18.24.24m.8155 17.1662v.504c.2868-.0256.5458.1905.5439.479v.5688h-5.1437v-.5688c-.0019-.2885.2576-.5047.5443-.479v-.504c0-.22.1525-.402.358-.458l-.0095-4.3645c-.1589-1.7366-1.6402-3.0979-3.4435-3.0979-1.8038 0-3.2846 1.3613-3.4435 3.0979l-.0096 4.3578c.2276.0424.5318.2083.5395.4648v.504c.2863-.0256.5457.1905.5438.479v.5688H4.3915v-.5688c-.0019-.2885.2575-.5047.5438-.479v-.504c0-.2529.2011-.4548.4536-.4724v-7.895h-.4905L4.2898 7.008l2.6405-.0005V5.0419h9.9495v1.9656h2.8219l-.6091 2.0314h-.4901v7.8949c.2519.0177.453.2195.453.4724"/>
              </svg>
              <span style={{ color: '#6b7280', fontSize: '16px' }}>Verified builder on</span>
              <span style={{ color: '#8b5cf6', fontSize: '22px', fontWeight: 'bold' }}>Shipyard</span>
            </div>
          </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  }

  // Default Shipyard OG image
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0f0f1a',
          backgroundImage: 'radial-gradient(circle at 25% 25%, #8b5cf640 0%, transparent 50%), radial-gradient(circle at 75% 75%, #a855f730 0%, transparent 50%)',
        }}
      >
        <div
          style={{
            display: 'flex',
            background: 'linear-gradient(135deg, #8b5cf6, #a855f7)',
            width: '120px',
            height: '120px',
            borderRadius: '24px',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '32px',
          }}
        >
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
        </div>

        <div
          style={{
            color: 'white',
            fontSize: '72px',
            fontWeight: 'bold',
            marginBottom: '16px',
          }}
        >
          Shipyard
        </div>

        <div
          style={{
            color: '#9ca3af',
            fontSize: '28px',
          }}
        >
          Builder&apos;s Command Center
        </div>

        <div
          style={{
            display: 'flex',
            gap: '16px',
            marginTop: '48px',
          }}
        >
          <div style={{ background: 'rgba(255,255,255,0.1)', padding: '12px 24px', borderRadius: '999px', color: '#d1d5db', fontSize: '18px' }}>
            Token Analysis
          </div>
          <div style={{ background: 'rgba(255,255,255,0.1)', padding: '12px 24px', borderRadius: '999px', color: '#d1d5db', fontSize: '18px' }}>
            Builder IDs
          </div>
          <div style={{ background: 'rgba(255,255,255,0.1)', padding: '12px 24px', borderRadius: '999px', color: '#d1d5db', fontSize: '18px' }}>
            Shipped Projects
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
