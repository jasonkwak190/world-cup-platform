import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const title = searchParams.get('title') || 'WorldCup Tournament';
    const winner = searchParams.get('winner');
    const participants = searchParams.get('participants') || '0';
    const type = searchParams.get('type') || 'tournament';

    // Create a simple HTML response for OG image generation
    const html = `
      <div style="
        height: 100vh;
        width: 100vw;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        font-family: -apple-system, BlinkMacSystemFont, sans-serif;
        color: white;
        text-align: center;
        position: relative;
      ">
        <div style="font-size: 120px; margin-bottom: 40px;">🏆</div>
        <h1 style="
          font-size: 64px;
          font-weight: bold;
          margin: 0 0 30px 0;
          text-shadow: 0 4px 8px rgba(0,0,0,0.3);
          max-width: 90%;
        ">${title}</h1>
        ${type === 'result' && winner ? 
          `<div style="font-size: 48px; color: #fbbf24; margin-bottom: 20px;">🏆 우승자</div>
           <div style="font-size: 56px; font-weight: bold;">${winner}</div>` :
          `<div style="font-size: 36px; font-weight: 600;">이상형 월드컵에 참여해보세요!</div>`
        }
        <div style="
          font-size: 32px;
          margin-top: 30px;
          opacity: 0.9;
        ">${parseInt(participants).toLocaleString()}명이 참여한 월드컵</div>
        <div style="
          position: absolute;
          bottom: 30px;
          right: 40px;
          font-size: 24px;
          opacity: 0.8;
        ">WorldCup Platform</div>
      </div>
    `;

    return new Response(html, {
      headers: {
        'Content-Type': 'text/html',
      },
    });
  } catch (e: unknown) {
    console.log(`Failed to generate OG image: ${e instanceof Error ? e.message : 'Unknown error'}`);
    return new Response(`Failed to generate the image`, {
      status: 500,
    });
  }
}