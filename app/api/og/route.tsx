import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get('type') || 'default';

  // Builder ID OG image
  if (type === 'builder-id') {
    const fid = searchParams.get('fid') || '0';
    const username = searchParams.get('username') || 'Builder';
    const score = searchParams.get('score') || '0';
    const shipped = searchParams.get('shipped') || '0';

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
              flexDirection: 'column',
              alignItems: 'center',
              padding: '40px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                marginBottom: '24px',
              }}
            >
              <div
                style={{
                  background: 'linear-gradient(135deg, #8b5cf6, #a855f7)',
                  padding: '12px 24px',
                  borderRadius: '12px',
                  color: 'white',
                  fontSize: '32px',
                  fontWeight: 'bold',
                }}
              >
                Builder ID
              </div>
              <span style={{ color: '#6b7280', fontSize: '32px' }}>#{fid}</span>
            </div>

            <div
              style={{
                color: 'white',
                fontSize: '64px',
                fontWeight: 'bold',
                marginBottom: '32px',
              }}
            >
              @{username}
            </div>

            <div
              style={{
                display: 'flex',
                gap: '32px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  background: 'rgba(255, 255, 255, 0.1)',
                  padding: '24px 40px',
                  borderRadius: '16px',
                }}
              >
                <span style={{ color: '#a855f7', fontSize: '48px', fontWeight: 'bold' }}>{score}</span>
                <span style={{ color: '#9ca3af', fontSize: '18px' }}>Builder Score</span>
              </div>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  background: 'rgba(255, 255, 255, 0.1)',
                  padding: '24px 40px',
                  borderRadius: '16px',
                }}
              >
                <span style={{ color: '#f97316', fontSize: '48px', fontWeight: 'bold' }}>{shipped}</span>
                <span style={{ color: '#9ca3af', fontSize: '18px' }}>Shipped</span>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginTop: '40px',
              }}
            >
              <span style={{ color: '#6b7280', fontSize: '20px' }}>Verified on</span>
              <span style={{ color: '#8b5cf6', fontSize: '24px', fontWeight: 'bold' }}>Shipyard</span>
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
