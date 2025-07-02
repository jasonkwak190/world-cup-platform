import { supabase } from '@/lib/supabase';
import { Comment, /* CommentLike, */ CreateCommentData, UpdateCommentData } from '@/types/comment';
import { getGuestSessionId, registerGuestComment, unregisterGuestComment } from '@/utils/guestSession';
import { updateWorldCupCommentCount } from '@/utils/updateCommentCounts';

// 월드컵별 댓글 가져오기
export async function getCommentsByWorldCupId(worldcupId: string): Promise<Comment[]> {
  try {
    const { data, error } = await supabase
      .from('comments')
      .select(`
        *,
        user:author_id(username)
      `)
      .eq('worldcup_id', worldcupId)
      .eq('is_deleted', false)
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
        user_id: comment.author_id,
        username: comment.author_id ? (comment.user?.username || 'Unknown') : comment.guest_name,
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
    if (!data.author_id && data.guest_session_id) {
      registerGuestComment(data.id);
    }

    // 댓글 수 자동 업데이트
    incrementWorldCupCommentCount(data.worldcup_id);

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

    return true;
  } catch (error) {
    console.error('Failed to delete comment:', error);
    return false;
  }
}

// 댓글 좋아요 추가
export async function addCommentLike(userId: string, commentId: string): Promise<boolean> {
  try {
    console.log('Adding comment like for userId:', userId, 'commentId:', commentId);
    
    // SELECT 권한 문제로 인해 바로 INSERT 시도 (UNIQUE 제약조건이 중복 방지)
    console.log('⚠️ SELECT 체크 건너뛰고 바로 INSERT 시도');
    const existingLike = null;
    const checkError = null;

    if (checkError && checkError.code !== 'PGRST116') {
      console.warn('Warning: Cannot check existing like due to permissions:', checkError);
      // 406 오류인 경우에도 INSERT를 시도해봄 (UNIQUE 제약조건이 중복을 방지)
      if (checkError.message && checkError.message.includes('406')) {
        console.warn('⚠️ SELECT 권한 없음. INSERT를 시도합니다 (중복은 UNIQUE 제약조건이 방지).');
      } else {
        return false; // 다른 오류는 중단
      }
    }

    if (existingLike && !checkError) {
      console.log('Already liked this comment');
      return false;
    }

    // user_interactions 테이블에 좋아요 추가
    console.log('Inserting new like...');
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
        console.log('Already liked this comment (detected via UNIQUE constraint)');
        return false;
      }
      
      console.error('Error adding comment like:', likeError);
      console.error('Insert data was:', { user_id: userId, target_type: 'comment', target_id: commentId, interaction_type: 'like' });
      
      // 406 오류인 경우 더 구체적인 메시지
      if (likeError.message && (likeError.message.includes('406') || likeError.code === '42P01')) {
        console.error('❌ user_interactions 테이블이 존재하지 않습니다.');
        console.error('📋 해결방법: Supabase SQL Editor에서 create-user-interactions-only.sql을 실행하세요.');
      }
      return false;
    }

    console.log('Like added successfully:', insertData);

    // 좋아요 수는 트리거에서 자동으로 업데이트됨
    return true;
  } catch (error) {
    console.error('Failed to add comment like:', error);
    return false;
  }
}

// 댓글 좋아요 제거
export async function removeCommentLike(userId: string, commentId: string): Promise<boolean> {
  try {
    // user_interactions 테이블에서 좋아요 제거
    const { error: likeError } = await supabase
      .from('user_interactions')
      .delete()
      .eq('user_id', userId)
      .eq('target_type', 'comment')
      .eq('target_id', commentId)
      .eq('interaction_type', 'like');

    if (likeError) {
      console.error('Error removing comment like:', likeError);
      return false;
    }

    // 좋아요 수는 트리거에서 자동으로 업데이트됨
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