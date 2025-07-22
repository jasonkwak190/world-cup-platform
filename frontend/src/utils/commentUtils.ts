/**
 * 댓글 관련 유틸리티 함수들
 * useCommentSystem.ts와 기타 파일들에서 중복되던 유틸리티 로직을 통합
 */

import { 
  Comment, 
  CommentApiData, 
  EnhancedComment, 
  CommentAuthor, 
  CurrentUser,
  CommentReply 
} from '@/types/comment';
import { isGuestCommentOwner } from '@/utils/guestSession';

/**
 * 상대 시간 포맷팅 함수
 * "방금 전", "3분 전", "2시간 전", "5일 전" 형식으로 변환
 */
export function formatRelativeTime(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return '방금 전';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}분 전`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}시간 전`;
  return `${Math.floor(diffInSeconds / 86400)}일 전`;
}

/**
 * 댓글 소유권 확인 함수
 */
export function checkCommentOwnership(
  commentId: number | string,
  authorId: string | undefined,
  authorName: string,
  isAuthorAuthenticated: boolean,
  isAuthenticated: boolean,
  currentUser?: CurrentUser
): boolean {
  if (isAuthenticated && isAuthorAuthenticated && currentUser) {
    return currentUser.id === authorId;
  }
  if (!isAuthenticated && !isAuthorAuthenticated) {
    // Guest 댓글의 경우 세션 기반으로 소유권 확인
    return isGuestCommentOwner(commentId.toString());
  }
  return false;
}

/**
 * 사용자 레벨 결정 함수
 */
export function getUserLevel(user?: CurrentUser, isGuest: boolean = false): CommentAuthor['level'] {
  if (isGuest) return 'Guest';
  return user?.level || 'Bronze';
}

/**
 * 아바타 URL 생성 함수
 */
export function generateAvatarUrl(
  user?: CurrentUser,
  guestName?: string,
  isAuthenticated: boolean = false
): string {
  if (isAuthenticated && user) {
    return user.avatar;
  }
  
  const name = guestName || 'guest';
  return `https://avatar.vercel.sh/${name}.png`;
}

/**
 * API 댓글 데이터를 Enhanced 댓글 형식으로 변환
 */
export function transformApiCommentToEnhanced(
  comment: CommentApiData,
  currentUser?: CurrentUser,
  worldcupCreatorId?: string,
  isAuthenticated: boolean = false
): EnhancedComment {
  const commentId = typeof comment.id === 'string' ? parseInt(comment.id) : comment.id;
  const isCommentOwner = checkCommentOwnership(
    commentId,
    comment.authorId,
    comment.author,
    !!comment.authorId,
    isAuthenticated,
    currentUser
  );
  const isCommentCreator = comment.authorId === worldcupCreatorId;
  
  return {
    id: commentId,
    author: {
      name: comment.author || comment.guestName || 'Unknown',
      avatar: generateAvatarUrl(currentUser, comment.guestName, isAuthenticated && !!comment.authorId),
      isVerified: !!comment.authorId,
      level: getUserLevel(currentUser, !comment.authorId)
    },
    content: comment.content,
    timestamp: formatRelativeTime(comment.createdAt),
    createdAt: new Date(comment.createdAt),
    likes: comment.likes || 0,
    isLiked: false, // 별도로 로드됨
    isOwner: isCommentOwner,
    isCreator: isCommentCreator || false,
    replies: [] // 대댓글은 별도 처리
  };
}

/**
 * 기본 Comment를 EnhancedComment로 변환
 */
export function transformCommentToEnhanced(
  comment: Comment,
  currentUser?: CurrentUser,
  worldcupCreatorId?: string,
  isAuthenticated: boolean = false
): EnhancedComment {
  const commentId = typeof comment.id === 'string' ? parseInt(comment.id) : parseInt(comment.id);
  const isCommentOwner = checkCommentOwnership(
    commentId,
    comment.user_id,
    comment.username,
    comment.is_member,
    isAuthenticated,
    currentUser
  );
  const isCommentCreator = comment.user_id === worldcupCreatorId;
  
  return {
    id: commentId,
    author: {
      name: comment.username,
      avatar: generateAvatarUrl(currentUser, comment.username, comment.is_member),
      isVerified: comment.is_member,
      level: getUserLevel(currentUser, !comment.is_member)
    },
    content: comment.content,
    timestamp: formatRelativeTime(comment.created_at),
    createdAt: new Date(comment.created_at),
    likes: comment.likes || 0,
    isLiked: false,
    isOwner: isCommentOwner,
    isCreator: isCommentCreator || false,
    replies: comment.replies ? comment.replies.map(reply => 
      transformCommentToEnhancedReply(reply, currentUser, worldcupCreatorId, isAuthenticated)
    ) : []
  };
}

/**
 * Comment를 CommentReply로 변환 (대댓글용)
 */
export function transformCommentToEnhancedReply(
  comment: Comment,
  currentUser?: CurrentUser,
  worldcupCreatorId?: string,
  isAuthenticated: boolean = false
): CommentReply {
  const commentId = typeof comment.id === 'string' ? parseInt(comment.id) : parseInt(comment.id);
  const isCommentOwner = checkCommentOwnership(
    commentId,
    comment.user_id,
    comment.username,
    comment.is_member,
    isAuthenticated,
    currentUser
  );
  const isCommentCreator = comment.user_id === worldcupCreatorId;
  
  return {
    id: commentId,
    author: {
      name: comment.username,
      avatar: generateAvatarUrl(currentUser, comment.username, comment.is_member),
      isVerified: comment.is_member,
      level: getUserLevel(currentUser, !comment.is_member)
    },
    content: comment.content,
    timestamp: formatRelativeTime(comment.created_at),
    createdAt: new Date(comment.created_at),
    likes: comment.likes || 0,
    isLiked: false,
    isOwner: isCommentOwner,
    isCreator: isCommentCreator || false
  };
}

/**
 * 댓글 정렬 함수
 */
export function sortComments(
  comments: EnhancedComment[], 
  sortOption: 'likes' | 'recent'
): EnhancedComment[] {
  if (sortOption === 'likes') {
    return [...comments].sort((a, b) => b.likes - a.likes);
  } else {
    return [...comments].sort((a, b) => {
      if (a.createdAt && b.createdAt) {
        return b.createdAt.getTime() - a.createdAt.getTime();
      }
      return 0;
    });
  }
}

/**
 * 댓글 페이지네이션 함수
 */
export function paginateComments(
  comments: EnhancedComment[],
  currentPage: number,
  commentsPerPage: number
): {
  currentComments: EnhancedComment[];
  totalPages: number;
  indexOfFirstComment: number;
  indexOfLastComment: number;
} {
  const indexOfLastComment = currentPage * commentsPerPage;
  const indexOfFirstComment = indexOfLastComment - commentsPerPage;
  const currentComments = comments.slice(indexOfFirstComment, indexOfLastComment);
  const totalPages = Math.ceil(comments.length / commentsPerPage);

  return {
    currentComments,
    totalPages,
    indexOfFirstComment,
    indexOfLastComment
  };
}

/**
 * 댓글 내용 검증 함수
 */
export function validateCommentContent(content: string): {
  isValid: boolean;
  error?: string;
} {
  const trimmedContent = content.trim();
  
  if (!trimmedContent) {
    return {
      isValid: false,
      error: '댓글 내용을 입력해주세요.'
    };
  }
  
  if (trimmedContent.length > 2000) {
    return {
      isValid: false,
      error: '댓글은 2000자 이하로 작성해주세요.'
    };
  }
  
  return {
    isValid: true
  };
}

/**
 * 게스트 이름 검증 함수
 */
export function validateGuestName(guestName: string): {
  isValid: boolean;
  error?: string;
} {
  const trimmedName = guestName.trim();
  
  if (!trimmedName) {
    return {
      isValid: false,
      error: '닉네임을 입력해주세요.'
    };
  }
  
  if (trimmedName.length > 20) {
    return {
      isValid: false,
      error: '닉네임은 20자 이하로 입력해주세요.'
    };
  }
  
  return {
    isValid: true
  };
}

/**
 * 댓글 수 포맷팅 함수
 * 1234 -> "1.2k", 1000000 -> "1M" 등
 */
export function formatCommentCount(count: number): string {
  if (count < 1000) return count.toString();
  if (count < 1000000) return `${(count / 1000).toFixed(1)}k`;
  return `${(count / 1000000).toFixed(1)}M`;
}

/**
 * 댓글 트리 구조를 플랫 구조로 변환
 */
export function flattenCommentTree(comments: EnhancedComment[]): EnhancedComment[] {
  const flattened: EnhancedComment[] = [];
  
  comments.forEach(comment => {
    flattened.push(comment);
    if (comment.replies && comment.replies.length > 0) {
      comment.replies.forEach(reply => {
        // Reply를 EnhancedComment 형식으로 변환해서 추가
        flattened.push({
          ...reply,
          replies: [] // 대댓글의 대댓글은 현재 지원하지 않음
        });
      });
    }
  });
  
  return flattened;
}

/**
 * 댓글 ID로 댓글 찾기 (중첩된 replies 포함)
 */
export function findCommentById(
  comments: EnhancedComment[], 
  commentId: number
): EnhancedComment | CommentReply | null {
  for (const comment of comments) {
    if (comment.id === commentId) {
      return comment;
    }
    
    if (comment.replies) {
      for (const reply of comment.replies) {
        if (reply.id === commentId) {
          return reply;
        }
      }
    }
  }
  
  return null;
}