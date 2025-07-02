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