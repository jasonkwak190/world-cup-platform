import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export interface RecentComment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  worldcup_id: string;
  worldcup_title: string;
  author_name: string;
  time_ago: string;
  isRecommended: boolean;
}

export interface RecentCommentsResponse {
  data: RecentComment[];
  lastUpdated: string;
}

function formatTimeAgo(date: string): string {
  const now = new Date();
  const commentDate = new Date(date);
  const diffMs = now.getTime() - commentDate.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  
  if (diffMinutes < 1) return '방금 전';
  if (diffMinutes < 60) return `${diffMinutes}분 전`;
  
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}시간 전`;
  
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}일 전`;
  
  const diffMonths = Math.floor(diffDays / 30);
  return `${diffMonths}개월 전`;
}

export async function GET() {
  try {
    // Get recent comments with worldcup and user information
    const { data: comments, error } = await supabase
      .from('comments')
      .select(`
        id,
        content,
        created_at,
        author_id,
        worldcup_id,
        like_count,
        guest_name,
        worldcups!inner (
          id,
          title,
          is_public
        ),
        users (
          id,
          username
        )
      `)
      .eq('worldcups.is_public', true)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error fetching recent comments:', error);
      return NextResponse.json(
        { error: 'Failed to fetch recent comments' },
        { status: 500 }
      );
    }

    // Format the data for the frontend
    const recentCommentsData: RecentComment[] = comments.map((comment: any) => ({
      id: comment.id,
      content: comment.content,
      created_at: comment.created_at,
      user_id: comment.author_id,
      worldcup_id: comment.worldcup_id,
      worldcup_title: comment.worldcups.title,
      author_name: comment.users?.username || comment.guest_name || '익명',
      time_ago: formatTimeAgo(comment.created_at),
      isRecommended: comment.like_count > 5 // Comments with 5+ likes are considered recommended
    }));

    const response: RecentCommentsResponse = {
      data: recentCommentsData,
      lastUpdated: new Date().toISOString()
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, max-age=120, stale-while-revalidate=30', // 2 minutes cache
      },
    });
  } catch (error) {
    console.error('Unexpected error in recent comments API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}