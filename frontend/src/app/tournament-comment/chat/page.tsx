'use client';

import { useState, useEffect } from 'react';
import { Heart, MessageCircle, Edit3, Trash2, User, Reply } from 'lucide-react';
import { sampleComments } from '../data.tsx';

export default function TournamentCommentChatPage() {
  const [isClient, setIsClient] = useState(false);
  const [comments, setComments] = useState(sampleComments);
  const [newComment, setNewComment] = useState('');
  const [guestName, setGuestName] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [editingComment, setEditingComment] = useState<number | null>(null);
  const [editContent, setEditContent] = useState('');
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [editingReply, setEditingReply] = useState<{commentId: number, replyId: number} | null>(null);
  const [editReplyContent, setEditReplyContent] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [commentsPerPage] = useState(20);
  const [sortOption, setSortOption] = useState('likes'); // 'likes' or 'recent'

  useEffect(() => {
    setIsClient(true);
  }, []);

  // 댓글 정렬 함수
  const sortComments = (commentsToSort) => {
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
  };

  const handleLike = (commentId: number, replyId?: number) => {
    if (replyId) {
      // 답글 좋아요 처리
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
      // 댓글 좋아요 처리
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
  };

  const handleSubmitComment = () => {
    if (!newComment.trim() || (!isLoggedIn && !guestName.trim())) return;

    const comment = {
      id: Date.now(),
      author: {
        name: isLoggedIn ? '현재 사용자' : guestName,
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=40&h=40&fit=crop&crop=face',
        isVerified: isLoggedIn,
        level: isLoggedIn ? 'Gold' : 'Guest'
      },
      content: newComment,
      timestamp: '방금 전',
      createdAt: new Date(),
      likes: 0,
      isLiked: false,
      isOwner: true,
      replies: []
    };

    // 새 댓글을 맨 아래에 추가
    setComments(prev => [...prev, comment]);
    setNewComment('');
    if (!isLoggedIn) setGuestName('');
  };

  const handleEditComment = (commentId: number) => {
    const comment = comments.find(c => c.id === commentId);
    if (comment) {
      setEditingComment(commentId);
      setEditContent(comment.content);
    }
  };

  const handleSaveEdit = (commentId: number) => {
    setComments(prev => prev.map(comment => 
      comment.id === commentId 
        ? { ...comment, content: editContent }
        : comment
    ));
    setEditingComment(null);
    setEditContent('');
  };

  const handleDeleteComment = (commentId: number) => {
    if (confirm('댓글을 삭제하시겠습니까?')) {
      setComments(prev => prev.filter(comment => comment.id !== commentId));
    }
  };
  
  const handleEditReply = (commentId: number, replyId: number) => {
    const comment = comments.find(c => c.id === commentId);
    if (comment) {
      const reply = comment.replies?.find(r => r.id === replyId);
      if (reply) {
        setEditingReply({ commentId, replyId });
        setEditReplyContent(reply.content);
      }
    }
  };
  
  const handleSaveReplyEdit = (commentId: number, replyId: number) => {
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
  };
  
  const handleDeleteReply = (commentId: number, replyId: number) => {
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
    }
  };
  
  const handleSubmitReply = (commentId: number) => {
    if (!replyContent.trim() || (!isLoggedIn && !guestName.trim())) return;

    const reply = {
      id: Date.now(),
      author: {
        name: isLoggedIn ? '현재 사용자' : guestName,
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=40&h=40&fit=crop&crop=face',
        isVerified: isLoggedIn,
        level: isLoggedIn ? 'Gold' : 'Guest'
      },
      content: replyContent,
      timestamp: '방금 전',
      createdAt: new Date(),
      likes: 0,
      isLiked: false,
      isOwner: true
    };

    setComments(prev => prev.map(comment => {
      if (comment.id === commentId) {
        return {
          ...comment,
          replies: [...(comment.replies || []), reply]
        };
      }
      return comment;
    }));

    setReplyingTo(null);
    setReplyContent('');
  };
  
  const handleReport = (commentId: number, replyId?: number) => {
    const message = replyId 
      ? '이 답글을 신고하시겠습니까?' 
      : '이 댓글을 신고하시겠습니까?';
      
    if (confirm(message)) {
      alert('신고가 접수되었습니다. 관리자 검토 후 조치하겠습니다.');
    }
  };

  const totalPages = Math.ceil(comments.length / commentsPerPage);
  const currentComments = sortComments(comments).slice(
    (currentPage - 1) * commentsPerPage,
    currentPage * commentsPerPage
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">채팅 스타일 댓글 시스템</h1>
          <p className="text-gray-600">실시간 채팅 느낌의 댓글 UI</p>
        </div>

        {/* 로그인 상태 토글 */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={isLoggedIn}
                  onChange={(e) => setIsLoggedIn(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm text-gray-600">로그인 상태로 보기</span>
              </label>
            </div>
          </div>
        </div>

        {/* 채팅 스타일 */}
        <div className="mb-16">
          <div className="max-w-4xl mx-auto bg-gradient-to-b from-orange-50 to-yellow-50 rounded-3xl overflow-hidden shadow-2xl">
            
            {/* 채팅 헤더 */}
            <div className="bg-white border-b-2 border-orange-200 p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full flex items-center justify-center">
                    <MessageCircle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Tournament Chat</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span>{currentComments.length} active users</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* 정렬 옵션 */}
                  <div className="flex border border-orange-200 rounded-full overflow-hidden">
                    <button
                      onClick={() => setSortOption('likes')}
                      className={`px-3 py-1 text-xs transition-colors ${
                        sortOption === 'likes'
                          ? 'bg-gradient-to-r from-orange-500 to-yellow-500 text-white'
                          : 'bg-white text-gray-600 hover:bg-orange-50'
                      }`}
                    >
                      👍 좋아요순
                    </button>
                    <button
                      onClick={() => setSortOption('recent')}
                      className={`px-3 py-1 text-xs transition-colors ${
                        sortOption === 'recent'
                          ? 'bg-gradient-to-r from-orange-500 to-yellow-500 text-white'
                          : 'bg-white text-gray-600 hover:bg-orange-50'
                      }`}
                    >
                      🕒 최신순
                    </button>
                  </div>
                  <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
                    🔥 Hot Topic
                  </span>
                </div>
              </div>
            </div>

            {/* 채팅 메시지 영역 */}
            <div className="bg-white min-h-96 max-h-96 overflow-y-auto p-4 space-y-3 border-x-2 border-orange-200">
              {currentComments.map((comment) => (
                <div key={comment.id} className={`flex gap-3 ${comment.isOwner ? 'flex-row-reverse' : ''}`}>
                  <img
                    src={comment.author.avatar}
                    alt={comment.author.name}
                    className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                  />
                  <div className={`max-w-xs lg:max-w-md ${comment.isOwner ? 'items-end' : 'items-start'} flex flex-col`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-gray-600">{comment.author.name}</span>
                      <span className="text-xs text-gray-400">{comment.timestamp}</span>
                    </div>
                    
                    {editingComment === comment.id ? (
                      <div className="w-full space-y-2">
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="w-full p-3 border border-orange-200 rounded-2xl resize-none focus:ring-2 focus:ring-orange-500"
                          rows={2}
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSaveEdit(comment.id)}
                            className="px-3 py-1 bg-orange-500 text-white rounded-full hover:bg-orange-600 text-xs"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingComment(null)}
                            className="px-3 py-1 bg-gray-300 text-gray-700 rounded-full hover:bg-gray-400 text-xs"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className={`p-3 rounded-2xl max-w-full break-words ${
                          comment.isOwner 
                            ? 'bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-br-md' 
                            : 'bg-gray-100 text-gray-800 rounded-bl-md'
                        }`}>
                          <p className="text-sm leading-relaxed">{comment.content}</p>
                        </div>
                        
                        <div className="flex items-center gap-2 mt-1">
                          <button
                            onClick={() => handleLike(comment.id)}
                            className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-colors ${
                              comment.isLiked 
                                ? 'bg-red-100 text-red-600' 
                                : 'bg-gray-100 text-gray-500 hover:bg-red-50'
                            }`}
                          >
                            <Heart className={`w-3 h-3 ${comment.isLiked ? 'fill-current' : ''}`} />
                            <span>{comment.likes}</span>
                          </button>
                          
                          <button 
                            onClick={() => setReplyingTo(comment.id)}
                            className="flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-gray-500 hover:bg-blue-50 hover:text-blue-600 text-xs transition-colors"
                          >
                            <Reply className="w-3 h-3" />
                            <span>답글 {comment.replies?.length || 0}</span>
                          </button>
                          
                          <button
                            onClick={() => handleReport(comment.id)}
                            className="flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-600 text-xs transition-colors"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <span>신고</span>
                          </button>
                          
                          {comment.isOwner && (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleEditComment(comment.id)}
                                className="p-1 text-gray-400 hover:text-orange-600 transition-colors"
                              >
                                <Edit3 className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleDeleteComment(comment.id)}
                                className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                    
                    {/* 답글 입력 폼 */}
                    {replyingTo === comment.id && (
                      <div className={`mt-2 ${comment.isOwner ? 'items-end' : 'items-start'} flex flex-col`}>
                        <div className="w-full space-y-2">
                          {!isLoggedIn && (
                            <input
                              type="text"
                              placeholder="Your name..."
                              value={guestName}
                              onChange={(e) => setGuestName(e.target.value)}
                              className="w-full p-2 text-xs border border-orange-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            />
                          )}
                          <textarea
                            placeholder="Write a reply..."
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            className="w-full p-2 text-xs border border-orange-200 rounded-xl resize-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            rows={2}
                          />
                          <div className="flex justify-between">
                            <button
                              onClick={() => setReplyingTo(null)}
                              className="px-3 py-1 text-xs text-gray-500 hover:text-gray-700"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleSubmitReply(comment.id)}
                              disabled={!replyContent.trim() || (!isLoggedIn && !guestName.trim())}
                              className="px-3 py-1 bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-full hover:from-orange-600 hover:to-yellow-600 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Reply
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* 답글 목록 */}
                    {comment.replies && comment.replies.length > 0 && (
                      <div className="mt-2 ml-4 space-y-2">
                        {comment.replies.map(reply => (
                          <div key={reply.id} className={`flex gap-2 ${comment.isOwner ? 'flex-row-reverse' : ''}`}>
                            <img
                              src={reply.author.avatar}
                              alt={reply.author.name}
                              className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                            />
                            <div className={`${comment.isOwner ? 'items-end' : 'items-start'} flex flex-col`}>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-medium text-gray-600">{reply.author.name}</span>
                                <span className="text-xs text-gray-400">{reply.timestamp}</span>
                              </div>
                              
                              {editingReply && editingReply.commentId === comment.id && editingReply.replyId === reply.id ? (
                                <div className="w-full space-y-2">
                                  <textarea
                                    value={editReplyContent}
                                    onChange={(e) => setEditReplyContent(e.target.value)}
                                    className="w-full p-2 text-xs border border-orange-200 rounded-xl resize-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                    rows={2}
                                  />
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => handleSaveReplyEdit(comment.id, reply.id)}
                                      className="px-2 py-1 bg-orange-500 text-white rounded-full hover:bg-orange-600 text-xs"
                                    >
                                      Save
                                    </button>
                                    <button
                                      onClick={() => setEditingReply(null)}
                                      className="px-2 py-1 bg-gray-300 text-gray-700 rounded-full hover:bg-gray-400 text-xs"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className={`p-2 rounded-xl max-w-full break-words text-xs ${
                                  comment.isOwner 
                                    ? 'bg-gradient-to-r from-orange-400 to-yellow-400 text-white rounded-br-md' 
                                    : 'bg-gray-100 text-gray-800 rounded-bl-md'
                                }`}>
                                  <p className="leading-relaxed">{reply.content}</p>
                                </div>
                              )}
                              
                              <div className="flex items-center gap-2 mt-1">
                                <button
                                  onClick={() => handleLike(comment.id, reply.id)}
                                  className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs transition-colors ${
                                    reply.isLiked 
                                      ? 'bg-red-100 text-red-600' 
                                      : 'bg-gray-100 text-gray-500 hover:bg-red-50'
                                  }`}
                                >
                                  <Heart className={`w-2 h-2 ${reply.isLiked ? 'fill-current' : ''}`} />
                                  <span className="text-xs">{reply.likes}</span>
                                </button>
                                
                                <button
                                  onClick={() => handleReport(comment.id, reply.id)}
                                  className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-600 text-xs transition-colors"
                                >
                                  <svg className="w-2 h-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                  </svg>
                                  <span className="text-xs">신고</span>
                                </button>
                                
                                {reply.isOwner && (
                                  <div className="flex items-center gap-1">
                                    <button 
                                      onClick={() => handleEditReply(comment.id, reply.id)}
                                      className="p-0.5 text-gray-400 hover:text-orange-600 transition-colors"
                                    >
                                      <Edit3 className="w-2 h-2" />
                                    </button>
                                    <button 
                                      onClick={() => handleDeleteReply(comment.id, reply.id)}
                                      className="p-0.5 text-gray-400 hover:text-red-600 transition-colors"
                                    >
                                      <Trash2 className="w-2 h-2" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {/* 타이핑 인디케이터 */}
              <div className="flex gap-3 opacity-60">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div className="bg-gray-100 rounded-2xl rounded-bl-md p-3">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* 메시지 입력창 */}
            <div className="bg-white border-t border-orange-200 p-4 shadow-lg">
              {!isLoggedIn && (
                <div className="flex items-center gap-3 mb-3 p-3 bg-orange-50 rounded-xl">
                  <div className="w-6 h-6 bg-orange-200 rounded-full flex items-center justify-center">
                    <User className="w-3 h-3 text-orange-700" />
                  </div>
                  <input
                    type="text"
                    placeholder="Enter your nickname to join chat..."
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    className="flex-1 p-2 border border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                  />
                </div>
              )}
              
              <div className="flex items-end gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <textarea
                    placeholder="Type a message... 💬"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="w-full p-3 border border-orange-200 rounded-2xl resize-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                    rows={2}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmitComment();
                      }
                    }}
                  />
                  <div className="flex justify-between items-center mt-2">
                    <div className="flex items-center gap-3">
                      <button className="text-gray-400 hover:text-orange-500 transition-colors">
                        <span className="text-lg">😊</span>
                      </button>
                      <button className="text-gray-400 hover:text-orange-500 transition-colors">
                        <span className="text-lg">📎</span>
                      </button>
                      <span className="text-xs text-gray-400">{newComment.length}/500</span>
                    </div>
                    <button
                      onClick={handleSubmitComment}
                      disabled={!newComment.trim() || (!isLoggedIn && !guestName.trim())}
                      className="px-4 py-2 bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-full hover:from-orange-600 hover:to-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <span>Send</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}