// ===== 기본 댓글 인터페이스 =====
export interface Comment {
  id: string;
  worldcup_id: string;
  user_id?: string; // 회원인 경우에만 존재
  username: string; // 회원은 자동, 비회원은 입력
  content: string;
  parent_id?: string; // 대댓글용 - null이면 최상위 댓글
  likes: number;
  created_at: string;
  updated_at?: string;
  replies?: Comment[]; // 대댓글 배열
  is_member: boolean; // 회원 여부
  guest_session_id?: string; // 비회원 세션 ID (비회원 댓글인 경우)
}

// ===== Enhanced Comment System 인터페이스 =====
// useCommentSystem.ts에서 사용되는 Enhanced 형식
export interface CommentAuthor {
  name: string;
  avatar: string;
  isVerified: boolean;
  level: 'VIP' | 'Gold' | 'Silver' | 'Bronze' | 'Guest';
}

export interface CurrentUser {
  id: string;
  name: string;
  avatar: string;
  level?: 'VIP' | 'Gold' | 'Silver' | 'Bronze';
}

export interface CommentReply {
  id: number;
  author: CommentAuthor;
  content: string;
  timestamp: string;
  createdAt: Date;
  likes: number;
  isLiked: boolean;
  isOwner: boolean;
  isCreator?: boolean;
}

export interface EnhancedComment {
  id: number;
  author: CommentAuthor;
  content: string;
  timestamp: string;
  createdAt: Date;
  likes: number;
  isLiked: boolean;
  isOwner: boolean;
  isCreator?: boolean;
  replies: CommentReply[];
}

// ===== API 관련 인터페이스 =====
export interface CommentLike {
  id: string;
  comment_id: string;
  user_id: string;
  created_at: string;
}

export interface CreateCommentData {
  worldcup_id: string;
  content: string;
  username?: string; // 비회원인 경우 필요
  parent_id?: string;
}

export interface UpdateCommentData {
  content: string;
}

// ===== API 응답 형식 =====
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

// ===== API 요청 형식 =====
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

// ===== 컴포넌트 Props 인터페이스 =====
export interface UseCommentSystemProps {
  initialComments?: any[];
  isAuthenticated?: boolean;
  currentUser?: CurrentUser;
  worldcupCreatorId?: string;
  worldcupId?: string;
}

// ===== 변환 함수 타입 =====
export type CommentTransformer<T, R> = (comment: T) => R;
export type CommentApiToEnhanced = CommentTransformer<CommentApiData, EnhancedComment>;
export type CommentToApi = CommentTransformer<Comment, CommentApiData>;