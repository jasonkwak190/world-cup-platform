'use client';

import { useState, useEffect, useCallback } from 'react';

// Enhanced comment interface matching tournament-comment structure
export interface CommentAuthor {
  name: string;
  avatar: string;
  isVerified: boolean;
  level: 'VIP' | 'Gold' | 'Silver' | 'Bronze' | 'Guest';
}

// Current user interface for complete user data
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

export interface UseCommentSystemProps {
  initialComments?: any[];
  isAuthenticated?: boolean;
  currentUser?: CurrentUser;
  worldcupCreatorId?: string;
  worldcupId?: string;
}

export const useCommentSystem = ({
  initialComments = [],
  isAuthenticated = false,
  currentUser,
  worldcupCreatorId,
  worldcupId
}: UseCommentSystemProps = {}) => {
  const currentUserId = currentUser?.id;
  
  // State management - ALL state declarations come first
  const [comments, setComments] = useState<EnhancedComment[]>([]);
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

  // Helper function to check ownership - comes after all state declarations
  const checkOwnership = useCallback((authorId: string | undefined, authorName: string, isAuthorAuthenticated: boolean) => {
    if (isAuthenticated && isAuthorAuthenticated && currentUser) {
      return currentUser.id === authorId;
    }
    if (!isAuthenticated && !isAuthorAuthenticated) {
      return guestName === authorName && guestName.trim() !== '';
    }
    return false;
  }, [isAuthenticated, currentUser, guestName]);

  // Convert initial comments to enhanced format
  useEffect(() => {
    if (initialComments && initialComments.length > 0) {
      const enhanced = initialComments.map(comment => ({
        id: typeof comment.id === 'string' ? parseInt(comment.id) : comment.id,
        author: {
          // Use current user name if it's the current user's comment, otherwise use comment user name or guest name
          name: (currentUser && comment.user && currentUser.id === comment.user.id) 
            ? currentUser.name 
            : (comment.user?.name || comment.guestName || comment.author || 'Unknown'),
          // Use current user avatar if it's the current user's comment, otherwise use comment user avatar or guest avatar
          avatar: (currentUser && comment.user && currentUser.id === comment.user.id) 
            ? currentUser.avatar 
            : (comment.user?.image || `https://avatar.vercel.sh/${comment.guestName || 'guest'}.png`),
          // Verified only if there is an actual user account
          isVerified: !!comment.user,
          // Proper level handling for both users and guests
          level: comment.user 
            ? (comment.user.level === 'vip' ? 'VIP' as const : 
               comment.user.level === 'gold' ? 'Gold' as const :
               comment.user.level === 'silver' ? 'Silver' as const : 'Bronze' as const) 
            : 'Guest' as const
        },
        content: comment.content,
        timestamp: formatRelativeTime(comment.createdAt),
        createdAt: new Date(comment.createdAt),
        likes: comment.likes || 0,
        isLiked: false,
        // Calculate ownership properly by comparing user IDs
        isOwner: !!(currentUser && comment.user && currentUser.id === comment.user.id),
        // Calculate creator status by comparing with worldcup creator ID
        isCreator: !!(comment.user && comment.user.id === worldcupCreatorId),
        replies: comment.replies ? comment.replies.map(reply => ({
          id: typeof reply.id === 'string' ? parseInt(reply.id) : reply.id,
          author: {
            // Use current user name if it's the current user's reply, otherwise use reply user name or guest name
            name: (currentUser && reply.user && currentUser.id === reply.user.id) 
              ? currentUser.name 
              : (reply.user?.name || reply.guestName || reply.author || 'Unknown'),
            // Use current user avatar if it's the current user's reply, otherwise use reply user avatar or guest avatar
            avatar: (currentUser && reply.user && currentUser.id === reply.user.id) 
              ? currentUser.avatar 
              : (reply.user?.image || `https://avatar.vercel.sh/${reply.guestName || 'guest'}.png`),
            // Verified only if there is an actual user account for replies
            isVerified: !!reply.user,
            // Proper level handling for reply authors
            level: reply.user 
              ? (reply.user.level === 'vip' ? 'VIP' as const : 
                 reply.user.level === 'gold' ? 'Gold' as const :
                 reply.user.level === 'silver' ? 'Silver' as const : 'Bronze' as const) 
              : 'Guest' as const
          },
          content: reply.content,
          timestamp: formatRelativeTime(reply.createdAt),
          createdAt: new Date(reply.createdAt),
          likes: reply.likes || 0,
          isLiked: false,
          // Calculate ownership properly for replies by comparing user IDs
          isOwner: !!(currentUser && reply.user && currentUser.id === reply.user.id),
          // Calculate creator status for replies by comparing with worldcup creator ID
          isCreator: !!(reply.user && reply.user.id === worldcupCreatorId)
        })) : []
      }));
      setComments(enhanced);
    }
  }, [initialComments, currentUser, worldcupCreatorId]);

  // Utility functions
  const formatRelativeTime = useCallback((dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return '방금 전';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}분 전`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}시간 전`;
    return `${Math.floor(diffInSeconds / 86400)}일 전`;
  }, []);

  // Comment sorting
  const sortComments = useCallback((commentsToSort: EnhancedComment[]) => {
    if (sortOption === 'likes') {
      return [...commentsToSort].sort((a, b) => b.likes - a.likes);
    } else {
      return [...commentsToSort].sort((a, b) => {
        if (a.createdAt && b.createdAt) {
          return b.createdAt.getTime() - a.createdAt.getTime();
        }
        return 0;
      });
    }
  }, [sortOption]);

  // Like handling
  const handleLike = useCallback((commentId: number, replyId?: number) => {
    if (replyId) {
      // Reply like handling
      setComments(prev => prev.map(comment => {
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
      }));
    } else {
      // Comment like handling
      setComments(prev => prev.map(comment => 
        comment.id === commentId 
          ? { 
              ...comment, 
              likes: comment.isLiked ? comment.likes - 1 : comment.likes + 1,
              isLiked: !comment.isLiked 
            }
          : comment
      ));
    }
  }, []);

  // Comment submission
  const handleSubmitComment = useCallback(() => {
    if (!newComment.trim() || (!isAuthenticated && !guestName.trim())) return;

    const comment: EnhancedComment = {
      id: Date.now(),
      author: {
        // Use actual user name from currentUser or guest name
        name: isAuthenticated && currentUser ? currentUser.name : guestName,
        // Use actual user avatar from currentUser or guest avatar
        avatar: isAuthenticated && currentUser 
          ? currentUser.avatar 
          : `https://avatar.vercel.sh/${guestName}.png`,
        isVerified: isAuthenticated,
        // Use actual user level or Guest
        level: isAuthenticated && currentUser 
          ? (currentUser.level || 'Bronze') 
          : 'Guest'
      },
      content: newComment,
      timestamp: '방금 전',
      createdAt: new Date(),
      likes: 0,
      isLiked: false,
      isOwner: true, // Always true for newly created comments by current user
      isCreator: isAuthenticated && currentUser && currentUser.id === worldcupCreatorId,
      replies: []
    };

    setComments(prev => [comment, ...prev]);
    setNewComment('');
    if (!isAuthenticated) setGuestName('');
  }, [newComment, guestName, isAuthenticated, currentUser, worldcupCreatorId]);

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
    if (!worldcupId || !editContent.trim()) return;

    try {
      const response = await fetch(`/api/worldcups/${worldcupId}/comments`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          commentId: commentId.toString(),
          content: editContent.trim()
        })
      });

      if (response.ok) {
        // Update the comment in local state
        setComments(prev => prev.map(comment => 
          comment.id === commentId 
            ? { ...comment, content: editContent }
            : comment
        ));
        setEditingComment(null);
        setEditContent('');
      } else {
        const errorData = await response.json();
        alert(errorData.error || '댓글 수정에 실패했습니다.');
      }
    } catch (error) {
      console.error('Failed to edit comment:', error);
      alert('댓글 수정 중 오류가 발생했습니다.');
    }
  }, [editContent, worldcupId]);

  // Comment deletion
  const handleDeleteComment = useCallback(async (commentId: number) => {
    if (!worldcupId) return;
    
    if (confirm('댓글을 삭제하시겠습니까?')) {
      try {
        const response = await fetch(`/api/worldcups/${worldcupId}/comments?commentId=${commentId}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          // Remove the comment from local state
          setComments(prev => prev.filter(comment => comment.id !== commentId));
          setOpenMenu(null);
        } else {
          const errorData = await response.json();
          alert(errorData.error || '댓글 삭제에 실패했습니다.');
        }
      } catch (error) {
        console.error('Failed to delete comment:', error);
        alert('댓글 삭제 중 오류가 발생했습니다.');
      }
    }
  }, [worldcupId]);

  // Reply handling
  const handleSubmitReply = useCallback((commentId: number) => {
    if (!replyContent.trim() || (!isAuthenticated && !guestName.trim())) return;

    const reply: CommentReply = {
      id: Date.now(),
      author: {
        // Use actual user name from currentUser or guest name for replies
        name: isAuthenticated && currentUser ? currentUser.name : guestName,
        // Use actual user avatar from currentUser or guest avatar for replies
        avatar: isAuthenticated && currentUser 
          ? currentUser.avatar 
          : `https://avatar.vercel.sh/${guestName}.png`,
        isVerified: isAuthenticated,
        // Use actual user level or Guest for replies
        level: isAuthenticated && currentUser 
          ? (currentUser.level || 'Bronze') 
          : 'Guest'
      },
      content: replyContent,
      timestamp: '방금 전',
      createdAt: new Date(),
      likes: 0,
      isLiked: false,
      isOwner: true // Always true for newly created replies by current user
    };

    setComments(prev => prev.map(comment => {
      if (comment.id === commentId) {
        return {
          ...comment,
          replies: [...comment.replies, reply]
        };
      }
      return comment;
    }));

    setReplyingTo(null);
    setReplyContent('');
  }, [replyContent, guestName, isAuthenticated, currentUser]);

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

  const handleSaveReplyEdit = useCallback((commentId: number, replyId: number) => {
    setComments(prev => prev.map(comment => {
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
    }));
    setEditingReply(null);
    setEditReplyContent('');
  }, [editReplyContent]);

  const handleDeleteReply = useCallback((commentId: number, replyId: number) => {
    if (confirm('답글을 삭제하시겠습니까?')) {
      setComments(prev => prev.map(comment => {
        if (comment.id === commentId && comment.replies) {
          return {
            ...comment,
            replies: comment.replies.filter(reply => reply.id !== replyId)
          };
        }
        return comment;
      }));
      setOpenReplyMenu(null);
    }
  }, []);

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

  // Pagination
  const indexOfLastComment = currentPage * commentsPerPage;
  const indexOfFirstComment = indexOfLastComment - commentsPerPage;
  const currentComments = sortComments(comments).slice(indexOfFirstComment, indexOfLastComment);
  const totalPages = Math.ceil(comments.length / commentsPerPage);

  const paginate = useCallback((pageNumber: number) => setCurrentPage(pageNumber), []);

  // Return all state and handlers
  return {
    // State
    comments: currentComments,
    allComments: comments,
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
    
    // Utils
    formatRelativeTime
  };
};