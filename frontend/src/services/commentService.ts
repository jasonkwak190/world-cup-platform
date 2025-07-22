/**
 * 댓글 관련 API 호출을 담당하는 통합 서비스
 * useCommentSystem.ts와 useResultLogic.ts에서 중복되던 API 로직을 통합
 */

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  status?: number;
}

export interface CommentApiData {
  id: string | number;
  content: string;
  author: string;
  authorId?: string;
  guestName?: string;
  likes: number;
  createdAt: string;
  parentId?: string;
  isCreator?: boolean;
}

export interface CreateCommentRequest {
  content: string;
  guestName?: string;
  parentId?: string;
}

export interface UpdateCommentRequest {
  commentId: string;
  content: string;
}

export interface CommentLikeResponse {
  liked: boolean;
  likeCount: number;
}

/**
 * 댓글 목록을 가져오는 API
 */
export async function fetchComments(
  worldcupId: string,
  sortBy: 'likes' | 'recent' = 'recent'
): Promise<ApiResponse<CommentApiData[]>> {
  try {
    const response = await fetch(`/api/worldcups/${worldcupId}/comments?sortBy=${sortBy}`);
    
    if (!response.ok) {
      return {
        success: false,
        error: `댓글을 불러오는데 실패했습니다. (${response.status})`,
        status: response.status
      };
    }

    const data = await response.json();
    const comments = Array.isArray(data) ? data : (data.comments || []);
    
    return {
      success: true,
      data: comments
    };
  } catch (error) {
    console.error('Failed to fetch comments:', error);
    return {
      success: false,
      error: '댓글을 불러오는 중 오류가 발생했습니다.'
    };
  }
}

/**
 * 새 댓글을 생성하는 API
 */
export async function createComment(
  worldcupId: string,
  requestData: CreateCommentRequest,
  isAuthenticated: boolean = false
): Promise<ApiResponse<CommentApiData>> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    // Guest 사용자인 경우 세션 ID를 헤더에 추가
    if (!isAuthenticated) {
      const { getGuestSessionId } = await import('@/utils/guestSession');
      headers['x-guest-session-id'] = getGuestSessionId();
    }

    const response = await fetch(`/api/worldcups/${worldcupId}/comments`, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestData)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.error || `댓글 작성에 실패했습니다. (${response.status})`,
        status: response.status
      };
    }

    const result = await response.json();
    
    // Guest 댓글인 경우 로컬 세션에 소유권 등록
    if (!isAuthenticated && result.comment?.id) {
      const { registerGuestComment } = await import('@/utils/guestSession');
      registerGuestComment(result.comment.id.toString());
    }
    
    return {
      success: true,
      data: result.comment
    };
  } catch (error) {
    console.error('Failed to create comment:', error);
    return {
      success: false,
      error: '댓글 작성 중 오류가 발생했습니다.'
    };
  }
}

/**
 * 댓글을 수정하는 API
 */
export async function updateComment(
  worldcupId: string,
  requestData: UpdateCommentRequest,
  isAuthenticated: boolean = false
): Promise<ApiResponse<void>> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    // Guest 사용자인 경우 세션 ID를 헤더에 추가
    if (!isAuthenticated) {
      const { getGuestSessionId } = await import('@/utils/guestSession');
      headers['x-guest-session-id'] = getGuestSessionId();
    }

    const response = await fetch(`/api/worldcups/${worldcupId}/comments`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(requestData)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.error || '댓글 수정에 실패했습니다.',
        status: response.status
      };
    }

    return {
      success: true
    };
  } catch (error) {
    console.error('Failed to update comment:', error);
    return {
      success: false,
      error: '댓글 수정 중 오류가 발생했습니다.'
    };
  }
}

/**
 * 댓글을 삭제하는 API
 */
export async function deleteComment(
  worldcupId: string,
  commentId: string,
  isAuthenticated: boolean = false
): Promise<ApiResponse<void>> {
  try {
    const headers: Record<string, string> = {};
    
    // Guest 사용자인 경우 세션 ID를 헤더에 추가
    if (!isAuthenticated) {
      const { getGuestSessionId } = await import('@/utils/guestSession');
      headers['x-guest-session-id'] = getGuestSessionId();
    }

    const response = await fetch(`/api/worldcups/${worldcupId}/comments?commentId=${commentId}`, {
      method: 'DELETE',
      headers
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.error || '댓글 삭제에 실패했습니다.',
        status: response.status
      };
    }

    // Guest 댓글인 경우 로컬 세션에서 소유권 해제
    if (!isAuthenticated) {
      const { unregisterGuestComment } = await import('@/utils/guestSession');
      unregisterGuestComment(commentId);
    }

    return {
      success: true
    };
  } catch (error) {
    console.error('Failed to delete comment:', error);
    return {
      success: false,
      error: '댓글 삭제 중 오류가 발생했습니다.'
    };
  }
}

/**
 * 댓글 좋아요 토글 API
 */
export async function toggleCommentLike(
  commentId: string
): Promise<ApiResponse<CommentLikeResponse>> {
  try {
    const response = await fetch(`/api/comments/${commentId}/like`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.error || '좋아요 처리에 실패했습니다.',
        status: response.status
      };
    }

    const result = await response.json();
    
    return {
      success: true,
      data: {
        liked: result.liked,
        likeCount: result.likeCount
      }
    };
  } catch (error) {
    console.error('Failed to toggle comment like:', error);
    return {
      success: false,
      error: '좋아요 처리 중 오류가 발생했습니다.'
    };
  }
}

/**
 * 댓글 좋아요 상태 확인 API
 */
export async function getCommentLikeStatus(
  commentId: string
): Promise<ApiResponse<{ liked: boolean }>> {
  try {
    const response = await fetch(`/api/comments/${commentId}/like`);
    
    if (!response.ok) {
      return {
        success: false,
        error: '좋아요 상태를 확인할 수 없습니다.',
        status: response.status
      };
    }

    const result = await response.json();
    
    return {
      success: true,
      data: { liked: result.liked }
    };
  } catch (error) {
    console.warn('Failed to check comment like status:', error);
    return {
      success: false,
      error: '좋아요 상태 확인 중 오류가 발생했습니다.'
    };
  }
}

/**
 * 여러 댓글의 좋아요 상태를 일괄 확인하는 헬퍼 함수
 */
export async function getMultipleCommentLikeStatus(
  commentIds: string[]
): Promise<Record<string, boolean>> {
  const likeStatuses: Record<string, boolean> = {};
  
  // 병렬로 처리하되 실패한 것은 무시
  const promises = commentIds.map(async (commentId) => {
    const result = await getCommentLikeStatus(commentId);
    if (result.success && result.data) {
      likeStatuses[commentId] = result.data.liked;
    }
  });
  
  await Promise.allSettled(promises);
  
  return likeStatuses;
}