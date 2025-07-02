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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🔄 API: Starting full comment count synchronization...');

    // 모든 월드컵 가져오기
    const { data: worldcups, error: worldcupsError } = await supabase
      .from('worldcups')
      .select('id, title, comments');

    if (worldcupsError) {
      console.error('API: Error fetching worldcups:', worldcupsError);
      return res.status(500).json({ error: 'Failed to fetch worldcups' });
    }

    if (!worldcups || worldcups.length === 0) {
      return res.status(200).json({ message: 'No worldcups found', updatedCount: 0 });
    }

    let updatedCount = 0;
    const updates = [];

    // 각 월드컵의 실제 댓글 수 계산
    for (const worldcup of worldcups) {
      try {
        // 실제 댓글 수 계산
        const { data: comments, error: commentsError } = await supabase
          .from('comments')
          .select('id')
          .eq('worldcup_id', worldcup.id)
          .eq('is_deleted', false);

        if (commentsError) {
          console.error(`API: Error fetching comments for ${worldcup.title}:`, commentsError);
          continue;
        }

        const actualCount = comments?.length || 0;
        const storedCount = worldcup.comments || 0;

        if (actualCount !== storedCount) {
          // 댓글 수 업데이트
          const { error: updateError } = await supabase
            .from('worldcups')
            .update({ comments: actualCount })
            .eq('id', worldcup.id);

          if (updateError) {
            console.error(`API: Error updating ${worldcup.title}:`, updateError);
          } else {
            updates.push({
              title: worldcup.title,
              from: storedCount,
              to: actualCount
            });
            updatedCount++;
            console.log(`✅ API: ${worldcup.title}: ${storedCount} → ${actualCount}`);
          }
        }

        // 너무 빠른 요청 방지
        await new Promise(resolve => setTimeout(resolve, 50));

      } catch (error) {
        console.error(`API: Error processing ${worldcup.title}:`, error);
      }
    }

    console.log(`🎉 API: Synchronization complete. Updated ${updatedCount} worldcups.`);

    return res.status(200).json({
      success: true,
      updatedCount,
      totalWorldcups: worldcups.length,
      updates
    });

  } catch (error) {
    console.error('API: Unexpected error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}