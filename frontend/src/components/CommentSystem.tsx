'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Comment, CreateCommentData } from '@/types/comment';
import { 
  getCommentsByWorldCupId, 
  createComment, 
  updateComment, 
  deleteComment,
  addCommentLike,
  removeCommentLike,
  getUserCommentLikes,
  incrementWorldCupCommentCount,
  decrementWorldCupCommentCount
} from '@/utils/comments';
import { Heart, MessageCircle, Edit3, Trash2, Reply, Send, BarChart3 } from 'lucide-react';
import { showToast } from './Toast';
import { isGuestCommentOwner, cleanupOldGuestSessions } from '@/utils/guestSession';
import { cache } from '@/utils/cache';

interface CommentSystemProps {
  worldcupId: string;
  initialCommentCount?: number;
  onCommentCountChange?: (count: number) => void;
  onShowRanking?: () => void;
}

interface CommentItemProps {
  comment: Comment;
  isReply?: boolean;
  likedComments: Set<string>;
  onLike: (commentId: string) => void;
  onReply: (comment: Comment) => void;
  onEdit: (comment: Comment) => void;
  onDelete: (commentId: string) => void;
  currentUserId?: string;
  editingCommentId?: string;
  onSaveEdit: (commentId: string, newContent: string) => void;
  onCancelEdit: () => void;
}

function CommentItem({ 
  comment, 
  isReply = false, 
  likedComments, 
  onLike, 
  onReply, 
  onEdit, 
  onDelete, 
  currentUserId,
  editingCommentId,
  onSaveEdit,
  onCancelEdit
}: CommentItemProps) {
  const isLiked = likedComments.has(comment.id);
  const isOwner = currentUserId && comment.user_id && currentUserId === comment.user_id;
  const isGuestOwner = !comment.is_member && !currentUserId && isGuestCommentOwner(comment.id); // 비로그인 상태에서만
  const canEdit = isOwner && comment.is_member; // 회원만 수정 가능
  const canDelete = isOwner || isGuestOwner; // 회원은 본인 댓글만, 비회원은 비로그인 상태에서 같은 세션만
  const isDeleted = false; // 삭제 기능을 hard delete로 변경했으므로 항상 false
  const isEditing = editingCommentId === comment.id;
  const [editContent, setEditContent] = useState(comment.content);
  
  // Sync editContent when comment content changes or editing starts
  useEffect(() => {
    if (isEditing) {
      setEditContent(comment.content);
    }
  }, [isEditing, comment.content]);
  

  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);

  const formatDate = (dateString: string) => {
    if (!isClient) {
      // 서버 사이드에서는 고정된 형태로 렌더링
      return new Date(dateString).toLocaleDateString();
    }
    
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return '방금 전';
    if (diffInMinutes < 60) return `${diffInMinutes}분 전`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}시간 전`;
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}일 전`;
    
    return date.toLocaleDateString();
  };

  return (
    <div className={`${isReply ? 'ml-8 pl-4 border-l-2 border-gray-200' : ''}`}>
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        {/* 댓글 헤더 */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-emerald-600">
                {comment.username.charAt(0).toUpperCase()}
              </span>
            </div>
            <span className="font-medium text-gray-900">
              {comment.username}
              {!comment.is_member && (
                <span className="ml-1 text-xs text-gray-400">
                  (게스트{isGuestOwner ? ' - 내 댓글' : ''})
                </span>
              )}
            </span>
            <span className="text-sm text-gray-500">{formatDate(comment.created_at)}</span>
            {comment.updated_at !== comment.created_at && (
              <span className="text-xs text-gray-400">(수정됨)</span>
            )}
          </div>
          
          {!isDeleted && (canEdit || canDelete) && (
            <div className="flex items-center space-x-1">
              {canEdit && (
                <button
                  onClick={() => onEdit(comment)}
                  className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                  title="수정"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              )}
              {canDelete && (
                <button
                  onClick={() => onDelete(comment.id)}
                  className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                  title="삭제"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* 댓글 내용 */}
        <div className="mb-3">
          {isEditing ? (
            <div className="space-y-3">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                rows={3}
                placeholder="수정할 내용을 입력해주세요..."
              />
              <div className="flex justify-end space-x-2">
                <button
                  onClick={onCancelEdit}
                  className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={() => onSaveEdit(comment.id, editContent)}
                  disabled={!editContent.trim()}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  저장
                </button>
              </div>
            </div>
          ) : (
            <p className={`text-gray-800 whitespace-pre-wrap ${isDeleted ? 'italic text-gray-500' : ''}`}>
              {comment.content}
            </p>
          )}
        </div>

        {/* 댓글 액션 */}
        {!isDeleted && (
          <div className="flex items-center space-x-4">
            <button
              onClick={() => onLike(comment.id)}
              className={`flex items-center space-x-1 text-sm transition-colors ${
                isLiked ? 'text-red-600' : 'text-gray-500 hover:text-red-600'
              }`}
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
              <span>{comment.likes}</span>
            </button>
            
            {!isReply && (
              <button
                onClick={() => onReply(comment)}
                className="flex items-center space-x-1 text-sm text-gray-500 hover:text-blue-600 transition-colors"
              >
                <Reply className="w-4 h-4" />
                <span>답글</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* 대댓글 */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-3 space-y-3">
          {comment.replies.map(reply => (
            <CommentItem
              key={reply.id}
              comment={reply}
              isReply={true}
              likedComments={likedComments}
              onLike={onLike}
              onReply={onReply}
              onEdit={onEdit}
              onDelete={onDelete}
              currentUserId={currentUserId}
              editingCommentId={editingCommentId}
              onSaveEdit={onSaveEdit}
              onCancelEdit={onCancelEdit}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function CommentSystem({ worldcupId, initialCommentCount: _initialCommentCount = 0, onCommentCountChange, onShowRanking }: CommentSystemProps) {
  const { user, isLoading: authLoading } = useAuth();
  
  // All hooks must be called before any conditional returns
  const [comments, setComments] = useState<Comment[]>([]);
  const [likedComments, setLikedComments] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [guestUsername, setGuestUsername] = useState('');
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [replyGuestUsername, setReplyGuestUsername] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Define functions before hooks
  const loadComments = async (showLoadingUI = true) => {
    try {
      if (showLoadingUI) {
        setIsLoading(true);
      }
      console.log('🔄 Starting to load comments for worldcup:', worldcupId);
      
      // 타임아웃 설정 (10초)
      const timeout = setTimeout(() => {
        console.warn('⚠️ Comments loading timeout - showing empty state');
        if (showLoadingUI) {
          setComments([]);
          setIsLoading(false);
          showToast('댓글 로딩이 지연되고 있습니다. 새로고침해보세요.', 'warning');
        }
      }, 10000);
      
      const fetchedComments = await getCommentsByWorldCupId(worldcupId);
      clearTimeout(timeout);
      
      console.log('✅ Comments loaded successfully:', fetchedComments.length);
      setComments(fetchedComments);
    } catch (error) {
      console.error('❌ Failed to load comments:', error);
      setComments([]); // 빈 배열로 설정하여 UI가 멈추지 않도록
      if (showLoadingUI) {
        showToast('댓글을 불러올 수 없습니다.', 'error');
      }
    } finally {
      if (showLoadingUI) {
        setIsLoading(false);
      }
    }
  };

  const loadUserLikes = async () => {
    if (!user) return;
    
    try {
      const commentIds = comments.map(c => c.id);
      if (commentIds.length === 0) return;
      
      const likedIds = await getUserCommentLikes(user.id, commentIds);
      setLikedComments(new Set(likedIds));
    } catch (error) {
      console.error('Failed to load user likes:', error);
    }
  };

  // user 상태 변화 감지하여 상태 초기화
  useEffect(() => {
    // 로그아웃 시 모든 입력 상태 초기화
    if (!user) {
      setNewComment('');
      setGuestUsername('');
      setReplyContent('');
      setReplyGuestUsername('');
      setReplyingTo(null);
      setEditingCommentId(null);
    }
  }, [user]);

  // 댓글 로드 및 세션 정리
  useEffect(() => {
    if (!worldcupId) {
      console.warn('⚠️ No worldcupId provided, skipping comment loading');
      return;
    }

    console.log('🔄 useEffect triggered for worldcupId:', worldcupId);
    
    // 환경변수 확인
    console.log('🔍 Environment check:', {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing',
      supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing'
    });
    
    cleanupOldGuestSessions(); // 오래된 게스트 세션 정리
    
    // 빈 상태로 즉시 표시
    setIsLoading(true); // 로딩 상태 표시
    setComments([]);
    
    // 댓글 로딩
    loadComments(true).then(() => {
      console.log('🔄 Comment loading completed');
    }).catch((error) => {
      console.error('🔄 Comment loading failed:', error);
    });
  }, [worldcupId]);

  // 사용자 좋아요 목록 로드
  useEffect(() => {
    if (user && comments.length > 0) {
      loadUserLikes();
    }
  }, [user, comments]);

  // 총 댓글 수 계산
  const totalComments = comments.reduce((total, comment) => {
    return total + 1 + (comment.replies ? comment.replies.length : 0);
  }, 0);

  // 댓글 수 변경을 상위 컴포넌트에 알림
  useEffect(() => {
    if (onCommentCountChange) {
      onCommentCountChange(totalComments);
    }
  }, [totalComments, onCommentCountChange]);

  // 로딩 중이면 대기
  if (authLoading) {
    return (
      <div className="bg-gray-50 rounded-lg p-6">
        <div className="text-center py-8">
          <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">로딩 중...</p>
        </div>
      </div>
    );
  }

  const handleSubmitComment = async () => {
    if (!newComment.trim()) {
      showToast('댓글 내용을 입력해주세요.', 'error');
      return;
    }

    if (!user && !guestUsername.trim()) {
      showToast('닉네임을 입력해주세요.', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      
      const commentData: CreateCommentData = {
        worldcup_id: worldcupId,
        content: newComment.trim()
      };

      // 비회원인 경우 닉네임 추가
      if (!user) {
        commentData.username = guestUsername.trim();
      }

      const createdComment = await createComment(user?.id || null, commentData);
      
      if (createdComment) {
        setComments(prev => [...prev, createdComment]);
        setNewComment('');
        setGuestUsername('');
        
        // 댓글 수 업데이트 (실제 DB 댓글 수로 동기화)
        try {
          const newCommentCount = await incrementWorldCupCommentCount(worldcupId);
          console.log('✅ Comment count updated:', newCommentCount);
          
          // 부모 컴포넌트에 변경사항 알림
          if (onCommentCountChange) {
            onCommentCountChange(newCommentCount);
          }
        } catch (error) {
          console.error('Failed to update comment count:', error);
        }
        
        showToast('댓글이 작성되었습니다.', 'success');
      } else {
        showToast('댓글 작성에 실패했습니다. 관리자에게 문의해주세요.', 'error');
      }
    } catch (error) {
      console.error('Failed to submit comment:', error);
      showToast('댓글 작성에 실패했습니다.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitReply = async () => {
    if (!replyingTo) return;

    if (!replyContent.trim()) {
      showToast('답글 내용을 입력해주세요.', 'error');
      return;
    }

    if (!user && !replyGuestUsername.trim()) {
      showToast('닉네임을 입력해주세요.', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      
      const replyData: CreateCommentData = {
        worldcup_id: worldcupId,
        content: replyContent.trim(),
        parent_id: replyingTo.id
      };

      // 비회원인 경우 닉네임 추가
      if (!user) {
        replyData.username = replyGuestUsername.trim();
      }

      const createdReply = await createComment(user?.id || null, replyData);
      
      if (createdReply) {
        // 댓글 목록 새로고침
        await loadComments();
        setReplyingTo(null);
        setReplyContent('');
        setReplyGuestUsername('');
        
        // 댓글 수 업데이트 (실제 DB 댓글 수로 동기화)
        try {
          const newCommentCount = await incrementWorldCupCommentCount(worldcupId);
          console.log('✅ Comment count after reply:', newCommentCount);
          
          // 부모 컴포넌트에 변경사항 알림
          if (onCommentCountChange) {
            onCommentCountChange(newCommentCount);
          }
        } catch (error) {
          console.error('Failed to update comment count after reply:', error);
        }
        
        showToast('답글이 작성되었습니다.', 'success');
      } else {
        showToast('답글 작성에 실패했습니다.', 'error');
      }
    } catch (error) {
      console.error('Failed to submit reply:', error);
      showToast('답글 작성에 실패했습니다.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLike = async (commentId: string) => {
    if (!user) {
      showToast('로그인이 필요합니다.', 'error');
      return;
    }

    const isCurrentlyLiked = likedComments.has(commentId);
    
    try {
      if (isCurrentlyLiked) {
        const success = await removeCommentLike(user.id, commentId);
        if (success) {
          setLikedComments(prev => {
            const newSet = new Set(prev);
            newSet.delete(commentId);
            return newSet;
          });
          // 댓글 목록에서 좋아요 수 감소
          updateCommentLikes(commentId, -1);
        }
      } else {
        const success = await addCommentLike(user.id, commentId);
        if (success) {
          setLikedComments(prev => new Set([...prev, commentId]));
          // 댓글 목록에서 좋아요 수 증가
          updateCommentLikes(commentId, 1);
        }
      }
    } catch (error) {
      console.error('Failed to handle like:', error);
      showToast('좋아요 처리에 실패했습니다.', 'error');
    }
  };

  const updateCommentLikes = (commentId: string, change: number) => {
    const updateCommentsRecursively = (commentList: Comment[]): Comment[] => {
      return commentList.map(comment => {
        if (comment.id === commentId) {
          return { ...comment, likes: Math.max(0, comment.likes + change) };
        }
        if (comment.replies) {
          return { ...comment, replies: updateCommentsRecursively(comment.replies) };
        }
        return comment;
      });
    };

    setComments(prev => updateCommentsRecursively(prev));
  };

  const handleReply = (comment: Comment) => {
    setReplyingTo(comment);
    setReplyContent('');
    setEditingCommentId(null);
  };

  const handleEdit = (comment: Comment) => {
    setEditingCommentId(comment.id);
    setReplyingTo(null);
  };

  const handleSaveEdit = async (commentId: string, newContent: string) => {
    if (!user) return;

    if (!newContent.trim()) {
      showToast('댓글 내용을 입력해주세요.', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      
      const success = await updateComment(commentId, user.id, {
        content: newContent.trim()
      });
      
      if (success) {
        // 로컬 상태 즉시 업데이트
        const updateCommentsRecursively = (commentList: Comment[]): Comment[] => {
          return commentList.map(comment => {
            if (comment.id === commentId) {
              return { ...comment, content: newContent.trim(), updated_at: new Date().toISOString() };
            }
            if (comment.replies) {
              return { ...comment, replies: updateCommentsRecursively(comment.replies) };
            }
            return comment;
          });
        };

        setComments(prev => updateCommentsRecursively(prev));
        setEditingCommentId(null);
        
        // 캐시 무효화
        cache.delete(`comments_${worldcupId}`);
        
        showToast('댓글이 수정되었습니다.', 'success');
      } else {
        showToast('댓글 수정에 실패했습니다.', 'error');
      }
    } catch (error) {
      console.error('Failed to update comment:', error);
      showToast('댓글 수정에 실패했습니다.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
  };

  const handleDelete = async (commentId: string) => {
    // 삭제할 댓글을 찾아서 대댓글 수 확인
    const findComment = (comments: Comment[], id: string): Comment | null => {
      for (const comment of comments) {
        if (comment.id === id) return comment;
        if (comment.replies) {
          const found = findComment(comment.replies, id);
          if (found) return found;
        }
      }
      return null;
    };

    const commentToDelete = findComment(comments, commentId);
    if (!commentToDelete) return;

    // 권한 확인 (UI 레벨에서 미리 체크, 서버에서도 재확인됨)
    const isOwner = user && commentToDelete.user_id && user.id === commentToDelete.user_id;
    const isGuestOwner = !commentToDelete.is_member && !user && isGuestCommentOwner(commentToDelete.id);
    
    if (!isOwner && !isGuestOwner) {
      showToast('삭제 권한이 없습니다.', 'error');
      return;
    }

    const replyCount = commentToDelete?.replies?.length || 0;
    const totalDeleteCount = 1 + replyCount; // 원본 댓글 + 대댓글들
    
    const confirmMessage = replyCount > 0 
      ? `댓글과 ${replyCount}개의 답글이 모두 삭제됩니다. 계속하시겠습니까?`
      : '댓글을 삭제하시겠습니까?';

    if (!confirm(confirmMessage)) return;

    try {
      const success = await deleteComment(commentId, user?.id || null);
      
      if (success) {
        await loadComments();
        
        // 댓글 수 업데이트 (실제 DB 댓글 수로 동기화)
        try {
          const newCommentCount = await decrementWorldCupCommentCount(worldcupId);
          console.log('✅ Comment count after deletion:', newCommentCount);
          
          // 부모 컴포넌트에 변경사항 알림
          if (onCommentCountChange) {
            onCommentCountChange(newCommentCount);
          }
        } catch (error) {
          console.error('Failed to update comment count after deletion:', error);
        }
        
        showToast('댓글이 삭제되었습니다.', 'success');
      } else {
        showToast('댓글 삭제에 실패했습니다.', 'error');
      }
    } catch (error) {
      console.error('Failed to delete comment:', error);
      showToast('댓글 삭제에 실패했습니다.', 'error');
    }
  };

  return (
    <div className="bg-gray-50 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <MessageCircle className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            댓글 {totalComments}개
          </h3>
        </div>
        {onShowRanking && (
          <button
            onClick={onShowRanking}
            className="flex items-center space-x-2 bg-green-100 hover:bg-green-200 text-green-700 px-4 py-2 rounded-lg font-medium transition-colors text-sm"
          >
            <BarChart3 className="w-4 h-4" />
            <span>게임 랭킹</span>
          </button>
        )}
      </div>

      {/* 댓글 작성 */}
      <div className="mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          {/* 비회원 전용 닉네임 입력 */}
          {!user && !authLoading && (
            <div className="mb-3">
              <input
                type="text"
                value={guestUsername}
                onChange={(e) => setGuestUsername(e.target.value)}
                placeholder="닉네임을 입력해주세요"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900 placeholder-gray-500"
                maxLength={20}
              />
            </div>
          )}
          {/* 회원 전용 닉네임 표시 */}
          {user && !authLoading && (
            <div className="mb-3 text-sm text-gray-600">
              <span className="font-medium">{user.username}</span>님으로 댓글을 작성합니다.
            </div>
          )}
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="댓글을 작성해주세요..."
            className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900 placeholder-gray-500"
            rows={3}
          />
          <div className="flex justify-end mt-3">
            <button
              onClick={handleSubmitComment}
              disabled={isSubmitting || !newComment.trim() || (!user && !guestUsername.trim())}
              className="flex items-center space-x-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? '작성 중...' : '댓글 작성'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 답글 작성 */}
      {replyingTo && (
        <div className="mb-6 ml-8 pl-4 border-l-2 border-emerald-200">
          <div className="bg-emerald-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-emerald-700">
                @{replyingTo.username}님에게 답글
              </span>
              <button
                onClick={() => {
                  setReplyingTo(null);
                  setReplyGuestUsername('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            {!user && (
              <div className="mb-3">
                <input
                  type="text"
                  value={replyGuestUsername}
                  onChange={(e) => setReplyGuestUsername(e.target.value)}
                  placeholder="닉네임을 입력해주세요"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900 placeholder-gray-500"
                  maxLength={20}
                />
              </div>
            )}
            {user && !authLoading && (
              <div className="mb-3 text-sm text-emerald-700">
                <span className="font-medium">{user.username}</span>님으로 답글을 작성합니다.
              </div>
            )}
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="답글을 작성해주세요..."
              className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900 placeholder-gray-500"
              rows={2}
            />
            <div className="flex justify-end mt-3 space-x-2">
              <button
                onClick={() => {
                  setReplyingTo(null);
                  setReplyGuestUsername('');
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleSubmitReply}
                disabled={isSubmitting || !replyContent.trim() || (!user && !replyGuestUsername.trim())}
                className="flex items-center space-x-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-4 h-4" />
                <span>{isSubmitting ? '작성 중...' : '답글 작성'}</span>
              </button>
            </div>
          </div>
        </div>
      )}


      {/* 댓글 목록 */}
      {isLoading ? (
        <div className="text-center py-8">
          <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">댓글을 불러오는 중...</p>
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-8">
          <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">댓글이 없습니다. 첫 번째 댓글을 작성해보세요!</p>
          <button
            onClick={() => loadComments(true)}
            className="text-emerald-600 hover:text-emerald-700 text-sm font-medium"
          >
            댓글 다시 불러오기
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map(comment => (
            <CommentItem
              key={comment.id}
              comment={comment}
              likedComments={likedComments}
              onLike={handleLike}
              onReply={handleReply}
              onEdit={handleEdit}
              onDelete={handleDelete}
              currentUserId={user?.id}
              editingCommentId={editingCommentId}
              onSaveEdit={handleSaveEdit}
              onCancelEdit={handleCancelEdit}
            />
          ))}
        </div>
      )}
    </div>
  );
}