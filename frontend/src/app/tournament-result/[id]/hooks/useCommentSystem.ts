'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  EnhancedComment, 
  CommentReply, 
  UseCommentSystemProps, 
  CurrentUser,
  CommentApiData 
} from '@/types/comment';
import { 
  fetchComments, 
  createComment, 
  updateComment, 
  deleteComment, 
  toggleCommentLike,
  getMultipleCommentLikeStatus 
} from '@/services/commentService';
import { 
  transformApiCommentToEnhanced,
  formatRelativeTime,
  checkCommentOwnership,
  sortComments,
  paginateComments,
  validateCommentContent,
  validateGuestName 
} from '@/utils/commentUtils';
import { useApiState } from '@/hooks/useApiState';
import { getGuestSessionId, registerGuestComment, unregisterGuestComment } from '@/utils/guestSession';

export const useCommentSystem = ({
  initialComments = [],
  isAuthenticated = false,
  currentUser,
  worldcupCreatorId,
  worldcupId
}: UseCommentSystemProps = {}) => {
  // API 상태 관리
  const apiState = useApiState<EnhancedComment[]>([]);
  
  // UI 상태 관리
  const [newComment, setNewComment] = useState('');
  const [guestName, setGuestName] = useState('');
  const [editingComment, setEditingComment] = useState<number | null>(null);
  const [editContent, setEditContent] = useState('');
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [editingReply, setEditingReply] = useState<{commentId: number, replyId: number} | null>(null);
  const [editReplyContent, setEditReplyContent] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [commentsPerPage] = useState(5);
  const [sortOption, setSortOption] = useState<'likes' | 'recent'>('likes');
  const [openMenu, setOpenMenu] = useState<number | null>(null);
  const [openReplyMenu, setOpenReplyMenu] = useState<{commentId: number, replyId: number} | null>(null);

  // 댓글 데이터 변환 함수 (공통 모듈 사용)
  const transformComment = useCallback((comment: CommentApiData): EnhancedComment => {
    return transformApiCommentToEnhanced(comment, currentUser, worldcupCreatorId, isAuthenticated);
  }, [currentUser, worldcupCreatorId, isAuthenticated]);

  // 중복 호출 방지를 위한 로딩 상태 ref
  const [isLoading, setIsLoading] = useState(false);
  const [loadedSortOption, setLoadedSortOption] = useState<string | null>(null);

  // 댓글 로딩 함수 (공통 서비스 사용)
  const loadCommentsFromAPI = useCallback(async (forcedSortOption?: 'likes' | 'recent') => {
    if (!worldcupId || isLoading) {
      return;
    }
    
    const currentSort = forcedSortOption || sortOption;
    
    // 이미 같은 정렬 옵션으로 로드된 경우 스킵 (강제 리로드가 아닌 경우)
    if (!forcedSortOption && loadedSortOption === currentSort) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      await apiState.executeAsync(
        async () => {
          const result = await fetchComments(worldcupId, currentSort);
          if (!result.success) {
            throw new Error(result.error || '댓글을 불러오는데 실패했습니다.');
          }
          
          // API 응답을 Enhanced 형식으로 변환
          const enhanced = result.data?.map(transformComment) || [];
          
          // 인증된 사용자인 경우 좋아요 상태를 일괄 확인
          if (isAuthenticated && enhanced.length > 0) {
            const commentIds = enhanced.map(comment => comment.id.toString());
            const likeStatuses = await getMultipleCommentLikeStatus(commentIds);
            
            return enhanced.map(comment => ({
              ...comment,
              isLiked: likeStatuses[comment.id.toString()] || false
            }));
          }
          
          return enhanced;
        },
        {
          onSuccess: (enhancedComments) => {
            setLoadedSortOption(currentSort);
          }
        }
      );
    } finally {
      setIsLoading(false);
    }
  }, [worldcupId, sortOption, transformComment, isAuthenticated, isLoading, loadedSortOption]);

  // 현재 댓글 목록 (API 상태에서 가져오기)
  const comments = apiState.data || [];

  // 초기 로딩 (한 번만 실행)
  useEffect(() => {
    if (worldcupId && !loadedSortOption) {
      // API에서 직접 댓글 로드
      loadCommentsFromAPI();
    } else if (initialComments && initialComments.length > 0 && !loadedSortOption) {
      // fallback: initialComments가 있으면 변환해서 사용
      try {
        const enhanced = initialComments.map((comment: any) => transformComment(comment));
        apiState.setData(enhanced);
        setLoadedSortOption('likes'); // 기본값으로 설정
      } catch (error) {
        console.error('Error transforming initial comments:', error);
        apiState.setError('댓글을 불러오는데 실패했습니다.');
      }
    }
  }, [worldcupId, initialComments, loadedSortOption]); // transformComment와 loadCommentsFromAPI 의존성 제거

  // 정렬 옵션 변경 시 다시 로드 (중복 호출 방지)
  useEffect(() => {
    if (worldcupId && loadedSortOption && loadedSortOption !== sortOption) {
      loadCommentsFromAPI(sortOption);
    }
  }, [sortOption, worldcupId, loadedSortOption]); // loadCommentsFromAPI 의존성 제거

  // 정렬된 댓글 목록
  const sortedComments = sortComments(comments, sortOption);

  // 댓글 좋아요 함수 (공통 서비스 사용)
  const handleLike = useCallback(async (commentId: number, replyId?: number) => {
    if (!isAuthenticated) {
      alert('로그인이 필요합니다.');
      return;
    }

    const result = await toggleCommentLike(commentId.toString());
    
    if (result.success && result.data) {
      if (replyId) {
        // Reply like handling - TODO: API 지원 시 활성화
        apiState.setData(prev => prev ? prev.map(comment => {
          if (comment.id === commentId && comment.replies) {
            return {
              ...comment,
              replies: comment.replies.map(reply => 
                reply.id === replyId
                  ? { 
                      ...reply, 
                      likes: reply.isLiked ? reply.likes - 1 : reply.likes + 1,
                      isLiked: !reply.isLiked 
                    }
                  : reply
              )
            };
          }
          return comment;
        }) : null);
      } else {
        // Comment like handling - API 결과 반영
        apiState.setData(prev => prev ? prev.map(comment => 
          comment.id === commentId 
            ? { 
                ...comment, 
                likes: result.data!.likeCount,
                isLiked: result.data!.liked 
              }
            : comment
        ) : null);
      }
    } else {
      alert(result.error || '좋아요 처리에 실패했습니다.');
    }
  }, [isAuthenticated, apiState]);

  // 댓글 제출 함수 (공통 서비스 사용)
  const handleSubmitComment = useCallback(async () => {
    if (!worldcupId) return;

    // 유효성 검사
    const contentValidation = validateCommentContent(newComment);
    if (!contentValidation.isValid) {
      alert(contentValidation.error);
      return;
    }

    if (!isAuthenticated) {
      const guestNameValidation = validateGuestName(guestName);
      if (!guestNameValidation.isValid) {
        alert(guestNameValidation.error);
        return;
      }
    }

    const result = await createComment(
      worldcupId,
      {
        content: newComment.trim(),
        guestName: isAuthenticated ? undefined : guestName.trim()
      },
      isAuthenticated
    );

    if (result.success) {
      // 성공 시 입력 초기화
      setNewComment('');
      if (!isAuthenticated) setGuestName('');
      
      // 댓글 목록 새로고침
      await loadCommentsFromAPI();
    } else {
      alert(result.error || '댓글 작성에 실패했습니다.');
    }
  }, [newComment, guestName, isAuthenticated, worldcupId, loadCommentsFromAPI]);

  // Comment editing
  const handleEditComment = useCallback((commentId: number) => {
    const comment = comments.find(c => c.id === commentId);
    if (comment) {
      setEditingComment(commentId);
      setEditContent(comment.content);
      setOpenMenu(null);
    }
  }, [comments]);

  const handleSaveEdit = useCallback(async (commentId: number) => {
    if (!worldcupId) return;

    const contentValidation = validateCommentContent(editContent);
    if (!contentValidation.isValid) {
      alert(contentValidation.error);
      return;
    }

    const result = await updateComment(
      worldcupId,
      {
        commentId: commentId.toString(),
        content: editContent.trim()
      },
      isAuthenticated
    );

    if (result.success) {
      // 로컬 상태 업데이트
      apiState.setData(prev => prev ? prev.map(comment => 
        comment.id === commentId 
          ? { ...comment, content: editContent.trim() }
          : comment
      ) : null);
      
      setEditingComment(null);
      setEditContent('');
    } else {
      alert(result.error || '댓글 수정에 실패했습니다.');
    }
  }, [editContent, worldcupId, isAuthenticated, apiState]);

  // 댓글 삭제 함수 (공통 서비스 사용)
  const handleDeleteComment = useCallback(async (commentId: number) => {
    if (!worldcupId) return;
    
    if (confirm('댓글을 삭제하시겠습니까?')) {
      const result = await deleteComment(worldcupId, commentId.toString(), isAuthenticated);

      if (result.success) {
        // 로컬 상태 업데이트
        apiState.setData(prev => prev ? prev.filter(comment => comment.id !== commentId) : null);
        setOpenMenu(null);
      } else {
        alert(result.error || '댓글 삭제에 실패했습니다.');
      }
    }
  }, [worldcupId, isAuthenticated, apiState]);

  // Reply handling - 실제 API 호출
  const handleSubmitReply = useCallback(async (commentId: number) => {
    if (!replyContent.trim() || (!isAuthenticated && !guestName.trim()) || !worldcupId) return;

    try {
      const requestBody: any = {
        content: replyContent.trim(),
        parentId: commentId.toString() // 부모 댓글 ID 설정
      };
      
      if (!isAuthenticated) {
        requestBody.guestName = guestName.trim();
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      
      // Guest 사용자인 경우 세션 ID를 헤더에 추가
      if (!isAuthenticated) {
        headers['x-guest-session-id'] = getGuestSessionId();
      }

      const response = await fetch(`/api/worldcups/${worldcupId}/comments`, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody)
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Reply created successfully:', result);
        
        // Guest 답글인 경우 로컬 세션에 소유권 등록
        if (!isAuthenticated && result.comment?.id) {
          registerGuestComment(result.comment.id.toString());
        }
        
        // 답글 생성 성공 시 임시로 로컬 상태 업데이트 (서버에서 대댓글 지원 완료 전까지)
        const reply: CommentReply = {
          id: result.comment?.id || Date.now(),
          author: {
            name: isAuthenticated && currentUser ? currentUser.name : guestName,
            avatar: isAuthenticated && currentUser 
              ? currentUser.avatar 
              : `https://avatar.vercel.sh/${guestName}.png`,
            isVerified: isAuthenticated,
            level: isAuthenticated && currentUser 
              ? (currentUser.level || 'Bronze') 
              : 'Guest'
          },
          content: replyContent,
          timestamp: '방금 전',
          createdAt: new Date(),
          likes: 0,
          isLiked: false,
          isOwner: true
        };

        apiState.setData(prev => prev ? prev.map(comment => {
          if (comment.id === commentId) {
            return {
              ...comment,
              replies: [...comment.replies, reply]
            };
          }
          return comment;
        }) : null);

        setReplyingTo(null);
        setReplyContent('');
        
        // 전체 댓글 목록 새로고침 (대댓글이 실제로 저장되었는지 확인)
        await loadCommentsFromAPI();
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to create reply:', response.status, errorData);
        alert(`답글 작성에 실패했습니다. (${response.status})`);
      }
    } catch (error) {
      console.error('Failed to submit reply:', error);
      alert('답글 작성 중 오류가 발생했습니다.');
    }
  }, [replyContent, guestName, isAuthenticated, currentUser, worldcupId, loadCommentsFromAPI]);

  // Reply editing
  const handleEditReply = useCallback((commentId: number, replyId: number) => {
    const comment = comments.find(c => c.id === commentId);
    if (comment) {
      const reply = comment.replies?.find(r => r.id === replyId);
      if (reply) {
        setEditingReply({ commentId, replyId });
        setEditReplyContent(reply.content);
        setOpenReplyMenu(null);
      }
    }
  }, [comments]);

  const handleSaveReplyEdit = useCallback(async (commentId: number, replyId: number) => {
    if (!worldcupId || !editReplyContent.trim()) return;

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      
      // Guest 사용자인 경우 세션 ID를 헤더에 추가
      if (!isAuthenticated) {
        headers['x-guest-session-id'] = getGuestSessionId();
      }

      const response = await fetch(`/api/worldcups/${worldcupId}/comments`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          commentId: replyId.toString(),
          content: editReplyContent.trim()
        })
      });

      if (response.ok) {
        // Update the reply in local state
        apiState.setData(prev => prev ? prev.map(comment => {
          if (comment.id === commentId && comment.replies) {
            return {
              ...comment,
              replies: comment.replies.map(reply => 
                reply.id === replyId 
                  ? { ...reply, content: editReplyContent }
                  : reply
              )
            };
          }
          return comment;
        }) : null);
        setEditingReply(null);
        setEditReplyContent('');
      } else {
        const errorData = await response.json();
        alert(errorData.error || '답글 수정에 실패했습니다.');
      }
    } catch (error) {
      console.error('Failed to edit reply:', error);
      alert('답글 수정 중 오류가 발생했습니다.');
    }
  }, [editReplyContent, worldcupId]);

  const handleDeleteReply = useCallback(async (commentId: number, replyId: number) => {
    if (!worldcupId) return;
    
    if (confirm('답글을 삭제하시겠습니까?')) {
      try {
        const headers: Record<string, string> = {};
        
        // Guest 사용자인 경우 세션 ID를 헤더에 추가
        if (!isAuthenticated) {
          headers['x-guest-session-id'] = getGuestSessionId();
        }

        const response = await fetch(`/api/worldcups/${worldcupId}/comments?commentId=${replyId}`, {
          method: 'DELETE',
          headers
        });

        if (response.ok) {
          // Guest 답글인 경우 로컬 세션에서 소유권 해제
          if (!isAuthenticated) {
            unregisterGuestComment(replyId.toString());
          }
          
          // Remove the reply from local state
          apiState.setData(prev => prev ? prev.map(comment => {
            if (comment.id === commentId && comment.replies) {
              return {
                ...comment,
                replies: comment.replies.filter(reply => reply.id !== replyId)
              };
            }
            return comment;
          }) : null);
          setOpenReplyMenu(null);
        } else {
          const errorData = await response.json();
          alert(errorData.error || '답글 삭제에 실패했습니다.');
        }
      } catch (error) {
        console.error('Failed to delete reply:', error);
        alert('답글 삭제 중 오류가 발생했습니다.');
      }
    }
  }, [worldcupId]);

  // Reporting
  const handleReport = useCallback((commentId: number, replyId?: number) => {
    const message = replyId 
      ? '이 답글을 신고하시겠습니까?' 
      : '이 댓글을 신고하시겠습니까?';
      
    if (confirm(message)) {
      alert('신고가 접수되었습니다. 관리자 검토 후 조치하겠습니다.');
      setOpenMenu(null);
      setOpenReplyMenu(null);
    }
  }, []);

  // Menu handling
  const toggleMenu = useCallback((commentId: number) => {
    setOpenMenu(openMenu === commentId ? null : commentId);
    setOpenReplyMenu(null);
  }, [openMenu]);

  const toggleReplyMenu = useCallback((commentId: number, replyId: number) => {
    setOpenReplyMenu(openReplyMenu?.commentId === commentId && openReplyMenu?.replyId === replyId 
      ? null 
      : { commentId, replyId });
    setOpenMenu(null);
  }, [openReplyMenu]);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = () => {
      setOpenMenu(null);
      setOpenReplyMenu(null);
    };
    
    document.addEventListener('click', handleClickOutside);
    
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  // 페이지네이션 (공통 유틸리티 사용)
  const paginationResult = paginateComments(sortedComments, currentPage, commentsPerPage);
  const { currentComments, totalPages } = paginationResult;

  const paginate = useCallback((pageNumber: number) => setCurrentPage(pageNumber), []);

  // Return all state and handlers
  return {
    // State
    comments: currentComments,
    allComments: sortedComments,
    newComment,
    guestName,
    editingComment,
    editContent,
    replyingTo,
    replyContent,
    editingReply,
    editReplyContent,
    currentPage,
    totalPages,
    sortOption,
    openMenu,
    openReplyMenu,
    loading: apiState.loading || isLoading,
    error: apiState.error,
    
    // Setters
    setNewComment,
    setGuestName,
    setEditContent,
    setReplyContent,
    setEditReplyContent,
    setSortOption,
    setReplyingTo,
    setEditingComment,
    setEditingReply,
    
    // Handlers
    handleLike,
    handleSubmitComment,
    handleEditComment,
    handleSaveEdit,
    handleDeleteComment,
    handleSubmitReply,
    handleEditReply,
    handleSaveReplyEdit,
    handleDeleteReply,
    handleReport,
    toggleMenu,
    toggleReplyMenu,
    paginate,
    
    // Utils (공통 모듈에서 import된 함수들)
    formatRelativeTime
  };
};