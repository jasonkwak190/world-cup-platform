import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const imageUrl = searchParams.get('url');
    
    if (!imageUrl) {
      return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
    }

    // YouTube 썸네일 URL인지 확인
    const isYouTubeThumbnail = imageUrl.includes('i.ytimg.com') || 
                              imageUrl.includes('youtube.com') ||
                              imageUrl.includes('youtu.be');
    
    if (!isYouTubeThumbnail) {
      return NextResponse.json({ error: 'Only YouTube thumbnails are allowed' }, { status: 403 });
    }

    // 이미지 가져오기
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; WorldCup-Platform/1.0)',
      },
    });

    if (!response.ok) {
      console.error('Failed to fetch image:', response.status, response.statusText);
      return NextResponse.json({ error: 'Failed to fetch image' }, { status: response.status });
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.startsWith('image/')) {
      return NextResponse.json({ error: 'Invalid content type' }, { status: 400 });
    }

    const imageBuffer = await response.arrayBuffer();

    // 응답 헤더 설정
    const headers = new Headers({
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=3600', // 1시간 캐시
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Content-Type',
    });

    return new NextResponse(imageBuffer, { headers });

  } catch (error) {
    console.error('Proxy image error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}