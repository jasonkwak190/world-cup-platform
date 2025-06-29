import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

// 서버 사이드에서 서비스 키 사용
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Rate limiting 저장소 (간단한 메모리 캐시)
const requestCounts = new Map<string, { count: number; resetTime: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const key = ip;
  const limit = 10; // 5분간 최대 10회
  const windowMs = 5 * 60 * 1000; // 5분
  
  const record = requestCounts.get(key);
  
  if (!record || now > record.resetTime) {
    requestCounts.set(key, { count: 1, resetTime: now + windowMs });
    return false;
  }
  
  if (record.count >= limit) {
    return true;
  }
  
  record.count++;
  return false;
}

function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Rate limiting 검사
  const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';
  const ip = Array.isArray(clientIP) ? clientIP[0] : clientIP;
  
  if (isRateLimited(ip)) {
    console.log(`🚫 Rate limit exceeded for IP: ${ip}`);
    return res.status(429).json({ 
      error: 'Too many requests', 
      message: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' 
    });
  }

  try {
    const { worldcupId, userSessionId } = req.body;

    // 입력 검증 강화
    if (!worldcupId || typeof worldcupId !== 'string') {
      return res.status(400).json({ error: 'worldcupId is required and must be a string' });
    }

    if (!isValidUUID(worldcupId)) {
      return res.status(400).json({ error: 'Invalid worldcupId format' });
    }

    if (userSessionId && typeof userSessionId !== 'string') {
      return res.status(400).json({ error: 'userSessionId must be a string' });
    }

    console.log('🎮 API: Updating play count for worldcup:', worldcupId);

    // 중복 플레이 방지는 나중에 구현 (현재는 테이블 없음)
    // TODO: worldcup_plays 테이블 생성 후 중복 방지 로직 추가

    // 현재 플레이 횟수 가져오기
    const { data: worldcup, error: fetchError } = await supabase
      .from('worldcups')
      .select('participants')
      .eq('id', worldcupId)
      .single();

    if (fetchError) {
      console.error('API: Error fetching worldcup:', fetchError);
      return res.status(500).json({ error: 'Failed to fetch worldcup' });
    }

    const newPlayCount = (worldcup.participants || 0) + 1;

    // 플레이 횟수 증가
    const { error: updateError } = await supabase
      .from('worldcups')
      .update({ participants: newPlayCount })
      .eq('id', worldcupId);

    if (updateError) {
      console.error('API: Error updating play count:', updateError);
      return res.status(500).json({ error: 'Failed to update play count' });
    }

    // 플레이 기록 로그는 나중에 구현
    // TODO: worldcup_plays 테이블 생성 후 로그 기능 추가

    console.log(`✅ API: Play count updated for worldcup ${worldcupId}: ${newPlayCount}`);

    return res.status(200).json({
      success: true,
      playCount: newPlayCount,
      worldcupId
    });

  } catch (error) {
    console.error('API: Unexpected error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}