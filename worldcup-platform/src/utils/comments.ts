import { supabase } from '@/lib/supabase';
import { Comment, CommentLike, CreateCommentData, UpdateCommentData } from '@/types/comment';
import { getGuestSessionId, registerGuestComment, unregisterGuestComment } from '@/utils/guestSession';
import { updateWorldCupCommentCount } from '@/utils/updateCommentCounts';

// 월드컵별 댓글 가져오기
export async function getCommentsByWorldCupId(worldcupId: string): Promise<Comment[]> {
  try {
    const { data, error } = await supabase
      .from('worldcup_comments')
      .select(`
        *,
        user:user_id(username)
      `)
      .eq('worldcup_id', worldcupId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching comments:', error);
      return [];
    }

    // 댓글을 계층 구조로 변환
    const commentsMap = new Map<string, Comment>();
    const topLevelComments: Comment[] = [];

    // 모든 댓글을 Map에 저장하고 기본 구조 설정
    data?.forEach(comment => {
      const formattedComment: Comment = {
        id: comment.id,
        worldcup_id: comment.worldcup_id,
        user_id: comment.user_id,
        username: comment.user_id ? (comment.user?.username || 'Unknown') : comment.username,
        content: comment.content,
        parent_id: comment.parent_id,
        likes: comment.likes || 0,
        created_at: comment.created_at,
        updated_at: comment.updated_at,
        is_member: !!comment.user_id,
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
        // 최상위 댓글인 경우
        topLevelComments.push(comment);
      }
    });

    return topLevelComments;
  } catch (error) {
    console.error('Failed to fetch comments:', error);
    return [];
  }
}

// 댓글 작성
export async function createComment(userId: string | null, commentData: CreateCommentData): Promise<Comment | null> {
  try {
    console.log('🔹 createComment called with:', { userId, commentData });
    
    const insertData: any = {
      worldcup_id: commentData.worldcup_id,
      content: commentData.content,
      parent_id: commentData.parent_id || null,
      likes: 0
    };

    if (userId) {
      // 회원인 경우
      insertData.user_id = userId;
      console.log('Member comment data:', insertData);
    } else {
      // 비회원인 경우 - user_id를 null로 명시적으로 설정하고 세션 ID 추가
      insertData.user_id = null;
      insertData.username = commentData.username;
      insertData.guest_session_id = getGuestSessionId();
      console.log('Guest comment data:', insertData);
    }

    // RLS 정책을 우회하기 위해 service role key 사용 시도
    // 또는 anon 정책을 먼저 시도
    const { data, error } = await supabase
      .from('worldcup_comments')
      .insert(insertData)
      .select(`
        *,
        user:user_id(username)
      `)
      .single();

    if (error) {
      console.error('Error creating comment:', error);
      console.error('Insert data was:', insertData);
      
      // 에러가 RLS 관련인 경우 추가 정보 로깅
      if (error.message && error.message.includes('policy')) {
        console.error('RLS Policy error detected. Need to update Supabase policies.');
        // 사용자에게 더 명확한 에러 메시지 제공
        throw new Error('댓글 작성 권한이 없습니다. 관리자에게 문의해주세요.');
      }
      
      return null;
    }

    console.log('Comment created successfully:', data);

    // 비회원 댓글인 경우 로컬 스토리지에 소유권 등록
    if (!data.user_id && data.guest_session_id) {
      registerGuestComment(data.id);
    }

    // 댓글 수 자동 업데이트
    incrementWorldCupCommentCount(data.worldcup_id);

    return {
      id: data.id,
      worldcup_id: data.worldcup_id,
      user_id: data.user_id,
      username: data.user_id ? (data.user?.username || 'Unknown') : data.username,
      content: data.content,
      parent_id: data.parent_id,
      likes: data.likes || 0,
      created_at: data.created_at,
      updated_at: data.updated_at,
      is_member: !!data.user_id,
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
      .from('worldcup_comments')
      .update({
        content: updateData.content,
        updated_at: new Date().toISOString()
      })
      .eq('id', commentId)
      .eq('user_id', userId); // 본인만 수정 가능

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
      .from('worldcup_comments')
      .select('id, user_id, guest_session_id, worldcup_id')
      .eq('id', commentId)
      .single();

    if (fetchError || !commentData) {
      console.error('Error fetching comment:', fetchError);
      return false;
    }

    // 권한 확인
    if (commentData.user_id) {
      // 회원 댓글인 경우: 본인만 삭제 가능
      if (!userId || commentData.user_id !== userId) {
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
      .from('worldcup_comments')
      .select('id')
      .eq('parent_id', commentId);

    if (repliesError) {
      console.error('Error fetching replies:', repliesError);
      return false;
    }

    // 대댓글들 삭제
    if (replies && replies.length > 0) {
      const { error: deleteRepliesError } = await supabase
        .from('worldcup_comments')
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
      .from('worldcup_comments')
      .delete()
      .eq('id', commentId);

    if (error) {
      console.error('Error deleting comment:', error);
      return false;
    }

    // 비회원 댓글 소유권 정리
    if (!commentData.user_id) {
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

    return true;
  } catch (error) {
    console.error('Failed to delete comment:', error);
    return false;
  }
}

// 댓글 좋아요 추가
export async function addCommentLike(userId: string, commentId: string): Promise<boolean> {
  try {
    // 이미 좋아요가 있는지 확인
    const { data: existingLike } = await supabase
      .from('comment_likes')
      .select('id')
      .eq('user_id', userId)
      .eq('comment_id', commentId)
      .single();

    if (existingLike) {
      console.log('Already liked this comment');
      return false;
    }

    // 좋아요 추가
    const { error: likeError } = await supabase
      .from('comment_likes')
      .insert({
        user_id: userId,
        comment_id: commentId
      });

    if (likeError) {
      console.error('Error adding comment like:', likeError);
      return false;
    }

    // 댓글의 좋아요 수 증가
    const { data: currentComment, error: fetchError } = await supabase
      .from('worldcup_comments')
      .select('likes')
      .eq('id', commentId)
      .single();

    if (fetchError) {
      console.error('Error fetching current likes:', fetchError);
      return false;
    }

    const currentLikes = currentComment?.likes || 0;
    
    const { error: updateError } = await supabase
      .from('worldcup_comments')
      .update({
        likes: currentLikes + 1
      })
      .eq('id', commentId);

    if (updateError) {
      console.error('Error incrementing comment likes:', updateError);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Failed to add comment like:', error);
    return false;
  }
}

// 댓글 좋아요 제거
export async function removeCommentLike(userId: string, commentId: string): Promise<boolean> {
  try {
    // 좋아요 제거
    const { error: likeError } = await supabase
      .from('comment_likes')
      .delete()
      .eq('user_id', userId)
      .eq('comment_id', commentId);

    if (likeError) {
      console.error('Error removing comment like:', likeError);
      return false;
    }

    // 댓글의 좋아요 수 감소
    const { data: currentComment, error: fetchError } = await supabase
      .from('worldcup_comments')
      .select('likes')
      .eq('id', commentId)
      .single();

    if (fetchError) {
      console.error('Error fetching current likes:', fetchError);
      return false;
    }

    const currentLikes = currentComment?.likes || 0;
    
    const { error: updateError } = await supabase
      .from('worldcup_comments')
      .update({
        likes: Math.max(0, currentLikes - 1) // 0 이하로 내려가지 않도록
      })
      .eq('id', commentId);

    if (updateError) {
      console.error('Error decrementing comment likes:', updateError);
      return false;
    }

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
      .from('comment_likes')
      .select('comment_id')
      .eq('user_id', userId)
      .in('comment_id', commentIds);

    if (error) {
      console.error('Error fetching user comment likes:', error);
      return [];
    }

    return data?.map(like => like.comment_id) || [];
  } catch (error) {
    console.error('Failed to fetch user comment likes:', error);
    return [];
  }
}

// 댓글 수 증가 (월드컵 생성 시) - 실제 댓글 수로 동기화
export async function incrementWorldCupCommentCount(worldcupId: string): Promise<number> {
  try {
    // 실제 댓글 수를 계산해서 업데이트
    const newCount = await updateWorldCupCommentCount(worldcupId);
    return newCount;
  } catch (error) {
    console.error('Failed to increment worldcup comment count:', error);
    return 0;
  }
}

// 댓글 수 감소 (댓글 삭제 시) - 실제 댓글 수로 동기화
export async function decrementWorldCupCommentCount(worldcupId: string): Promise<number> {
  try {
    // 실제 댓글 수를 계산해서 업데이트
    const newCount = await updateWorldCupCommentCount(worldcupId);
    return newCount;
  } catch (error) {
    console.error('Failed to decrement worldcup comment count:', error);
    return 0;
  }
}