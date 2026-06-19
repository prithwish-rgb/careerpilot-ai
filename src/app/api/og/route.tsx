import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
 
export const runtime = 'edge';
 
export async function GET(request: NextRequest) {
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
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          fontSize: 32,
          fontWeight: 600,
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: 24,
            padding: 60,
            margin: 40,
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            textAlign: 'center',
            width: '80%',
            maxWidth: 800,
          }}
        >
          <div
            style={{
              fontSize: 64,
              fontWeight: 700,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              color: 'transparent',
              marginBottom: 20,
            }}
          >
            CareerPilot AI
          </div>
          <div
            style={{
              fontSize: 32,
              color: '#4B5563',
              marginBottom: 30,
              lineHeight: 1.4,
            }}
          >
            Smart Career Management Platform
          </div>
          <div
            style={{
              fontSize: 24,
              color: '#6B7280',
              display: 'flex',
              gap: 20,
            }}
          >
            <span>Resume</span>
            <span>•</span>
            <span>Jobs</span>
            <span>•</span>
            <span>Interview</span>
            <span>•</span>
            <span>Offer</span>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  );
}
