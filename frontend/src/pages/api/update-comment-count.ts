import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

// 서버 사이드에서 서비스 키 사용
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // 서비스 키 사용
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Rate limiting 저장소
const requestCounts = new Map<string, { count: number; resetTime: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const key = ip;
  const limit = 20; // 5분간 최대 20회 (댓글은 플레이보다 빈번할 수 있음)
  const windowMs = 5 * 60 * 1000;
  
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
    const { worldcupId } = req.body;

    // 입력 검증 강화
    if (!worldcupId || typeof worldcupId !== 'string') {
      return res.status(400).json({ error: 'worldcupId is required and must be a string' });
    }

    if (!isValidUUID(worldcupId)) {
      return res.status(400).json({ error: 'Invalid worldcupId format' });
    }

    console.log('🔄 API: Updating comment count for worldcup:', worldcupId);

    // 실제 댓글 수 계산
    const { data: comments, error: commentsError } = await supabase
      .from('worldcup_comments')
      .select('id')
      .eq('worldcup_id', worldcupId);

    if (commentsError) {
      console.error('API: Error fetching comments:', commentsError);
      return res.status(500).json({ error: 'Failed to fetch comments', details: commentsError.message });
    }

    const actualCommentCount = comments?.length || 0;
    console.log('🔢 API: Actual comment count:', actualCommentCount);

    // worldcups 테이블 업데이트 (서비스 키로 RLS 우회)
    const { error: updateError } = await supabase
      .from('worldcups')
      .update({ comments: actualCommentCount })
      .eq('id', worldcupId);

    if (updateError) {
      console.error('API: Error updating comment count:', updateError);
      return res.status(500).json({ error: 'Failed to update comment count', details: updateError.message });
    }

    console.log('✅ API: Comment count updated successfully:', actualCommentCount);

    return res.status(200).json({ 
      success: true, 
      commentCount: actualCommentCount,
      worldcupId
    });

  } catch (error) {
    console.error('API: Unexpected error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}