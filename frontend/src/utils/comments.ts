import { supabase } from '@/lib/supabase';
import { Comment, /* CommentLike, */ CreateCommentData, UpdateCommentData } from '@/types/comment';
import { getGuestSessionId, registerGuestComment, unregisterGuestComment } from '@/utils/guestSession';
import { updateWorldCupCommentCount } from '@/utils/updateCommentCounts';
import { cache } from './cache';

// 🔧 간단한 테스트 함수
export async function testSupabaseConnection(): Promise<boolean> {
  try {
    console.log('🧪 Testing basic Supabase connection...');
    const { data, error } = await supabase.from('comments').select('count').limit(1);
    console.log('🧪 Basic connection test result:', { data, error });
    return !error;
  } catch (err) {
    console.error('🧪 Connection test failed:', err);
    return false;
  }
}

// 월드컵별 댓글 가져오기
export async function getCommentsByWorldCupId(worldcupId: string): Promise<Comment[]> {
  try {
    console.log('🚀 [ENTRY] getCommentsByWorldCupId called with:', worldcupId);
    
    const cacheKey = `comments_${worldcupId}`;
    
    // 캐시에서 먼저 확인 (1분 캐시)
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      console.log('✅ Using cached comments data for:', worldcupId);
      return cachedData as Comment[];
    }
    
    console.log('🔍 Fetching comments for worldcup:', worldcupId);
    const startTime = Date.now();
    
    // 직접 댓글 쿼리 시도 (디버깅 단계 제거)
    console.log('📝 Attempting direct comments query...');
    
    const { data, error } = await supabase
      .from('comments')
      .select(`
        id,
        worldcup_id,
        author_id,
        guest_name,
        content,
        parent_id,
        like_count,
        created_at,
        updated_at,
        guest_session_id,
        is_deleted
      `)
      .eq('worldcup_id', worldcupId)
      .or('is_deleted.is.null,is_deleted.eq.false')
      .order('created_at', { ascending: true })
      .limit(100);
    
    const elapsed = Date.now() - startTime;
    console.log(`⏱️ Comments query took ${elapsed}ms`);

    if (error) {
      console.error('❌ Error fetching comments:', error);
      console.error('🔍 Query error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      console.error('🔍 Query was for worldcup:', worldcupId);
      return [];
    }

    if (!data || data.length === 0) {
      console.log('📭 No comments found, returning empty array');
      return [];
    }

    console.log('📝 Found', data.length, 'comments, fetching user data...');
    
    // 이미 가져온 데이터 사용 (중복 쿼리 제거)
    const fullData = data;

    // 사용자 정보 가져오기 (author_id가 있는 댓글들만)
    const authorIds = [...new Set(fullData.filter(c => c.author_id).map(c => c.author_id))];
    const usersMap = new Map();
    
    if (authorIds.length > 0) {
      try {
        const { data: users } = await supabase
          .from('users')
          .select('id, username')
          .in('id', authorIds);
        
        users?.forEach(user => {
          usersMap.set(user.id, user.username);
        });
        console.log('👥 Loaded', users?.length || 0, 'user profiles');
      } catch (userError) {
        console.warn('⚠️ Failed to fetch user data:', userError);
      }
    }

    // 댓글을 계층 구조로 변환
    const commentsMap = new Map<string, Comment>();
    const topLevelComments: Comment[] = [];

    // 모든 댓글을 Map에 저장하고 기본 구조 설정
    fullData.forEach(comment => {
      const formattedComment: Comment = {
        id: comment.id,
        worldcup_id: comment.worldcup_id,
        user_id: comment.author_id,
        username: comment.author_id ? (usersMap.get(comment.author_id) || 'Unknown') : comment.guest_name,
        content: comment.content,
        parent_id: comment.parent_id,
        likes: comment.like_count || 0,
        created_at: comment.created_at,
        updated_at: comment.updated_at,
        is_member: !!comment.author_id,
        guest_session_id: comment.guest_session_id,
        replies: []
      };
      
      commentsMap.set(comment.id, formattedComment);
    });

    // 계층 구조 구성
    commentsMap.forEach(comment => {
      if (comment.parent_id) {
        // 대댓글인 경우 부모 댓글의 replies에 추가
        const parentComment = commentsMap.get(comment.parent_id);
        if (parentComment) {
          parentComment.replies = parentComment.replies || [];
          parentComment.replies.push(comment);
        }
      } else {
        // 최상위 댓글인 경우 topLevelComments에 추가
        topLevelComments.push(comment);
      }
    });

    console.log('🏗️ Processed comments:', topLevelComments.length, 'top-level,', 
      fullData.filter(c => c.parent_id).length, 'replies');

    // 결과를 캐시에 저장 (1분 캐시)
    cache.set(cacheKey, topLevelComments, 1 * 60 * 1000);
    
    return topLevelComments;
  } catch (error) {
    console.error('Failed to fetch comments:', error);
    return [];
  }
}

// 댓글 생성
export async function createComment(userId: string | null, commentData: CreateCommentData): Promise<Comment | null> {
  try {
    console.log('🔹 createComment called with:', { userId, commentData });
    
    // 현재 인증 상태 확인
    const { data: { user } } = await supabase.auth.getUser();
    console.log('👤 Auth state during comment creation:', user ? `User: ${user.id}` : 'Not authenticated');
    console.log('🔍 Passed userId:', userId);
    
    const insertData: any = {
      worldcup_id: commentData.worldcup_id,
      content: commentData.content,
      parent_id: commentData.parent_id || null,
      like_count: 0
    };

    if (userId) {
      // 회원인 경우
      insertData.author_id = userId;
      console.log('Member comment data:', insertData);
    } else {
      // 비회원인 경우 - author_id를 null로 명시적으로 설정하고 세션 ID 추가
      insertData.author_id = null;
      insertData.guest_name = commentData.username;
      insertData.guest_session_id = getGuestSessionId();
      console.log('Guest comment data:', insertData);
    }

    // RLS 정책을 우회하기 위해 service role key 사용 시도
    // 또는 anon 정책을 먼저 시도
    const { data, error } = await supabase
      .from('comments')
      .insert(insertData)
      .select(`
        *,
        user:author_id(username)
      `)
      .single();

    if (error) {
      console.error('❌ Error creating comment:', error);
      console.error('📝 Insert data was:', insertData);
      console.error('🔍 Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      
      // 에러가 RLS 관련인 경우 추가 정보 로깅
      if (error.message && (error.message.includes('policy') || error.message.includes('permission'))) {
        console.error('🔒 RLS policy violation detected');
        console.error('🔍 Current user context:', { userId, user });
      }
      
      return null;
    }

    console.log('Comment created successfully:', data);

    // 비회원 댓글인 경우 로컬 스토리지에 소유권 등록
    if (!data.author_id && data.guest_session_id) {
      registerGuestComment(data.id);
    }

    // 댓글 수 자동 업데이트
    incrementWorldCupCommentCount(data.worldcup_id);
    
    // 캐시 무효화
    cache.delete(`comments_${data.worldcup_id}`);

    return {
      id: data.id,
      worldcup_id: data.worldcup_id,
      user_id: data.author_id,
      username: data.author_id ? (data.user?.username || 'Unknown') : data.guest_name,
      content: data.content,
      parent_id: data.parent_id,
      likes: data.like_count || 0,
      created_at: data.created_at,
      updated_at: data.updated_at,
      is_member: !!data.author_id,
      guest_session_id: data.guest_session_id,
      replies: []
    };
  } catch (error) {
    console.error('Failed to create comment:', error);
    return null;
  }
}

// 댓글 수정
export async function updateComment(commentId: string, userId: string, updateData: UpdateCommentData): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('comments')
      .update({
        content: updateData.content,
        is_edited: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', commentId)
      .eq('author_id', userId); // 본인만 수정 가능

    if (error) {
      console.error('Error updating comment:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Failed to update comment:', error);
    return false;
  }
}

// 댓글 삭제 (대댓글도 함께 삭제)
export async function deleteComment(commentId: string, userId: string | null): Promise<boolean> {
  try {
    // 먼저 댓글 정보를 확인해서 권한 체크
    const { data: commentData, error: fetchError } = await supabase
      .from('comments')
      .select('id, author_id, guest_session_id, worldcup_id')
      .eq('id', commentId)
      .single();

    if (fetchError || !commentData) {
      console.error('Error fetching comment:', fetchError);
      return false;
    }

    // 권한 확인
    if (commentData.author_id) {
      // 회원 댓글인 경우: 본인만 삭제 가능
      if (!userId || commentData.author_id !== userId) {
        console.error('Permission denied: Cannot delete other user\'s comment');
        return false;
      }
    } else {
      // 비회원 댓글인 경우: 비로그인 상태에서 같은 세션의 사용자만 삭제 가능
      if (userId) {
        console.error('Permission denied: Logged-in users cannot delete guest comments');
        return false;
      }
      
      const currentSessionId = getGuestSessionId();
      if (!commentData.guest_session_id || commentData.guest_session_id !== currentSessionId) {
        console.error('Permission denied: Cannot delete other guest\'s comment');
        return false;
      }
    }

    // 먼저 대댓글들을 찾아서 삭제
    const { data: replies, error: repliesError } = await supabase
      .from('comments')
      .select('id')
      .eq('parent_id', commentId);

    if (repliesError) {
      console.error('Error fetching replies:', repliesError);
      return false;
    }

    // 대댓글들 삭제
    if (replies && replies.length > 0) {
      const { error: deleteRepliesError } = await supabase
        .from('comments')
        .delete()
        .eq('parent_id', commentId);

      if (deleteRepliesError) {
        console.error('Error deleting replies:', deleteRepliesError);
        return false;
      }
      
      console.log(`🗑️ ${replies.length}개의 대댓글이 함께 삭제되었습니다.`);
    }

    // 원본 댓글 삭제
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId);

    if (error) {
      console.error('Error deleting comment:', error);
      return false;
    }

    // 비회원 댓글 소유권 정리
    if (!commentData.author_id) {
      unregisterGuestComment(commentId);
      
      // 대댓글들의 소유권도 정리
      if (replies && replies.length > 0) {
        replies.forEach(reply => {
          unregisterGuestComment(reply.id);
        });
      }
    }

    // 댓글 수 자동 업데이트
    decrementWorldCupCommentCount(commentData.worldcup_id);
    
    // 캐시 무효화
    cache.delete(`comments_${commentData.worldcup_id}`);

    return true;
  } catch (error) {
    console.error('Failed to delete comment:', error);
    return false;
  }
}

// 댓글 좋아요 추가 (간소화된 버전)
export async function addCommentLike(userId: string, commentId: string): Promise<boolean> {
  try {
    console.log('Adding comment like for userId:', userId, 'commentId:', commentId);

    // 바로 INSERT 시도 (UNIQUE 제약조건이 중복 방지)
    const { data: insertData, error: likeError } = await supabase
      .from('user_interactions')
      .insert({
        user_id: userId,
        target_type: 'comment',
        target_id: commentId,
        interaction_type: 'like'
      })
      .select();

    if (likeError) {
      // UNIQUE 제약조건 위반은 이미 좋아요가 있다는 의미 (정상)
      if (likeError.code === '23505') {
        console.log('Already liked this comment');
        return false;
      }
      
      console.error('Error adding comment like:', likeError);
      return false;
    }

    console.log('Like added successfully:', insertData);
    return true;
  } catch (error) {
    console.error('Failed to add comment like:', error);
    return false;
  }
}

// 댓글 좋아요 제거 (간소화된 버전)
export async function removeCommentLike(userId: string, commentId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('user_interactions')
      .delete()
      .eq('user_id', userId)
      .eq('target_type', 'comment')
      .eq('target_id', commentId)
      .eq('interaction_type', 'like');

    if (error) {
      console.error('Error removing comment like:', error);
      return false;
    }

    console.log('Like removed successfully');
    return true;
  } catch (error) {
    console.error('Failed to remove comment like:', error);
    return false;
  }
}

// 사용자가 좋아요한 댓글 ID 목록 가져오기
export async function getUserCommentLikes(userId: string, commentIds: string[]): Promise<string[]> {
  try {
    if (commentIds.length === 0) return [];

    const { data, error } = await supabase
      .from('user_interactions')
      .select('target_id')
      .eq('user_id', userId)
      .eq('target_type', 'comment')
      .eq('interaction_type', 'like')
      .in('target_id', commentIds);

    if (error) {
      console.error('Error fetching user comment likes:', error);
      return [];
    }

    return data?.map(like => like.target_id) || [];
  } catch (error) {
    console.error('Failed to fetch user comment likes:', error);
    return [];
  }
}

// 댓글 수 증가 (월드컵 생성 시) - 실제 댓글 수로 동기화
export async function incrementWorldCupCommentCount(worldcupId: string): Promise<number> {
  try {
    await updateWorldCupCommentCount(worldcupId);
    
    const { data, error } = await supabase
      .from('worldcups')
      .select('comments')
      .eq('id', worldcupId)
      .single();

    if (error) {
      console.error('Error fetching updated comment count:', error);
      return 0;
    }

    return data?.comments || 0;
  } catch (error) {
    console.error('Error in incrementWorldCupCommentCount:', error);
    return 0;
  }
}

// 댓글 수 감소 (댓글 삭제 시) - 실제 댓글 수로 동기화
export async function decrementWorldCupCommentCount(worldcupId: string): Promise<number> {
  try {
    await updateWorldCupCommentCount(worldcupId);
    
    const { data, error } = await supabase
      .from('worldcups')
      .select('comments')
      .eq('id', worldcupId)
      .single();

    if (error) {
      console.error('Error fetching updated comment count:', error);
      return 0;
    }

    return data?.comments || 0;
  } catch (error) {
    console.error('Error in decrementWorldCupCommentCount:', error);
    return 0;
  }
}