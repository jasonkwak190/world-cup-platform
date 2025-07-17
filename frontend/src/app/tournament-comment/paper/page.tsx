'use client';

import { useState, useEffect } from 'react';
import { Heart, Edit3, Trash2, User, Reply } from 'lucide-react';
import { sampleComments } from '../data.tsx';

export default function TournamentCommentPaperPage() {
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
  const [commentsPerPage] = useState(5);
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

    // 새 댓글을 맨 위에 추가
    setComments(prev => [comment, ...prev]);
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

  // 페이지네이션 처리
  const indexOfLastComment = currentPage * commentsPerPage;
  const indexOfFirstComment = indexOfLastComment - commentsPerPage;
  const currentComments = sortComments(comments).slice(indexOfFirstComment, indexOfLastComment);
  const totalPages = Math.ceil(comments.length / commentsPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  // 랜덤 회전 각도 생성
  const getRandomRotation = () => {
    const angles = [-2, -1, 0, 1, 2];
    return angles[Math.floor(Math.random() * angles.length)];
  };

  return (
    <div className="min-h-screen bg-amber-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-amber-800 mb-2">종이 찢기 스타일 댓글 시스템</h1>
          <p className="text-amber-600">아날로그 감성의 종이 디자인 댓글 UI</p>
        </div>

        {/* 로그인 상태 토글 */}
        <div className="bg-white p-4 rounded-lg shadow-lg border-2 border-dashed border-amber-300 transform -rotate-1 mb-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={isLoggedIn}
                  onChange={(e) => setIsLoggedIn(e.target.checked)}
                  className="rounded border-amber-300"
                />
                <span className="text-sm text-amber-800">로그인 상태로 보기</span>
              </label>
            </div>
          </div>
        </div>

        {/* 종이 찢기 스타일 */}
        <div className="max-w-4xl mx-auto mb-16">
          {/* 헤더 */}
          <div className="bg-white p-6 rounded-t-lg shadow-lg border-2 border-dashed border-amber-300 transform rotate-1 relative">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-20 h-6 bg-yellow-200 opacity-70 rounded-sm border border-yellow-300"></div>
            <div className="absolute -top-2 left-10 w-8 h-4 bg-white transform rotate-12"></div>
            <div className="absolute -top-1 right-10 w-6 h-3 bg-white transform -rotate-12"></div>
            
            <div className="text-center">
              <h3 className="text-2xl font-bold text-amber-800 mb-2">📝 댓글 남기기</h3>
              <p className="text-amber-600 text-sm">토너먼트 결과에 대한 의견을 남겨주세요!</p>
            </div>
            
            {/* 정렬 옵션 */}
            <div className="flex justify-center mt-4">
              <div className="inline-block bg-amber-50 rounded-lg overflow-hidden border-2 border-dashed border-amber-300">
                <button
                  onClick={() => setSortOption('likes')}
                  className={`px-4 py-2 font-medium text-sm transition-colors ${
                    sortOption === 'likes'
                      ? 'bg-amber-200 text-amber-800'
                      : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                  }`}
                >
                  👍 인기순
                </button>
                <button
                  onClick={() => setSortOption('recent')}
                  className={`px-4 py-2 font-medium text-sm transition-colors ${
                    sortOption === 'recent'
                      ? 'bg-amber-200 text-amber-800'
                      : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                  }`}
                >
                  🕒 최신순
                </button>
              </div>
            </div>
          </div>

          {/* 댓글 입력 폼 */}
          <div className="bg-white p-6 shadow-lg border-x-2 border-dashed border-amber-300">
            <div className="mb-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-amber-100 rounded-full border-2 border-dashed border-amber-300 flex items-center justify-center">
                  <User className="w-6 h-6 text-amber-700" />
                </div>
                <div>
                  <div className="font-bold text-lg text-amber-800">
                    {isLoggedIn ? '현재 사용자' : '게스트'}
                  </div>
                  {!isLoggedIn && (
                    <input
                      type="text"
                      placeholder="닉네임을 입력하세요..."
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      className="p-2 border-2 border-dashed border-amber-300 rounded-lg w-full mt-2 focus:ring-2 focus:ring-amber-300 text-amber-800 placeholder-amber-400"
                    />
                  )}
                </div>
              </div>
              <textarea
                placeholder="댓글을 입력하세요..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="w-full p-4 border-2 border-dashed border-amber-300 rounded-lg resize-none focus:ring-2 focus:ring-amber-300 text-amber-800 placeholder-amber-400"
                rows={3}
              />
              <div className="flex justify-end mt-3">
                <div className="bg-white p-2 rounded-lg shadow-md border-2 border-dashed border-amber-300 transform -rotate-1">
                  <button
                    onClick={handleSubmitComment}
                    disabled={!newComment.trim() || (!isLoggedIn && !guestName.trim())}
                    className="px-6 py-2 bg-amber-500 text-white rounded-lg font-semibold hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    댓글 작성
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 댓글 목록 */}
          <div className="bg-white border-x-2 border-dashed border-amber-300 divide-y divide-amber-200">
            {currentComments.map((comment, index) => (
              <div key={comment.id} className="p-6">
                <div className="flex gap-4">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-dashed border-amber-300">
                      <img
                        src={comment.author.avatar}
                        alt={comment.author.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {comment.author.isVerified && (
                      <div className="absolute -top-2 -right-2 bg-amber-100 rounded-full w-6 h-6 flex items-center justify-center border-2 border-dashed border-amber-300">
                        <span className="text-amber-800 text-xs font-bold">✓</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-amber-800">{comment.author.name}</span>
                      <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full border border-dashed border-amber-300">
                        {comment.author.level}
                      </span>
                      <span className="text-sm text-amber-600">{comment.timestamp}</span>
                    </div>
                    
                    {editingComment === comment.id ? (
                      <div className="space-y-2">
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="w-full p-3 border-2 border-dashed border-amber-300 rounded-lg resize-none focus:ring-2 focus:ring-amber-300 text-amber-800"
                          rows={3}
                        />
                        <div className="flex gap-2">
                          <div className="bg-white p-1 rounded-lg shadow-sm border border-dashed border-amber-300 transform rotate-1">
                            <button
                              onClick={() => handleSaveEdit(comment.id)}
                              className="px-3 py-1 bg-green-500 text-white rounded-lg font-medium"
                            >
                              저장
                            </button>
                          </div>
                          <div className="bg-white p-1 rounded-lg shadow-sm border border-dashed border-amber-300 transform -rotate-1">
                            <button
                              onClick={() => setEditingComment(null)}
                              className="px-3 py-1 bg-gray-300 text-gray-700 rounded-lg font-medium"
                            >
                              취소
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div 
                          className="bg-amber-50 p-4 rounded-lg border-2 border-dashed border-amber-300 mb-3"
                          style={{ transform: `rotate(${getRandomRotation()}deg)` }}
                        >
                          <p className="text-amber-800 leading-relaxed">{comment.content}</p>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <div className="bg-white p-1 rounded-lg shadow-sm border border-dashed border-amber-300 transform rotate-1">
                            <button
                              onClick={() => handleLike(comment.id)}
                              className={`flex items-center gap-1 px-3 py-1 rounded-lg font-medium transition-colors ${
                                comment.isLiked 
                                  ? 'bg-red-100 text-red-600 border border-dashed border-red-300' 
                                  : 'bg-amber-50 text-amber-700 hover:bg-red-50 border border-dashed border-amber-200'
                              }`}
                            >
                              <Heart className={`w-4 h-4 ${comment.isLiked ? 'fill-current' : ''}`} />
                              <span>{comment.likes}</span>
                            </button>
                          </div>
                          
                          <div className="bg-white p-1 rounded-lg shadow-sm border border-dashed border-amber-300 transform -rotate-1">
                            <button 
                              onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                              className="flex items-center gap-1 px-3 py-1 rounded-lg bg-amber-50 text-amber-700 hover:bg-blue-50 hover:text-blue-600 font-medium transition-colors border border-dashed border-amber-200"
                            >
                              <Reply className="w-4 h-4" />
                              <span>답글 {comment.replies?.length || 0}</span>
                            </button>
                          </div>
                          
                          <div className="bg-white p-1 rounded-lg shadow-sm border border-dashed border-amber-300 transform rotate-1">
                            <button
                              onClick={() => handleReport(comment.id)}
                              className="flex items-center gap-1 px-3 py-1 rounded-lg bg-amber-50 text-amber-700 hover:bg-red-50 hover:text-red-600 font-medium transition-colors border border-dashed border-amber-200"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                              </svg>
                              <span>신고</span>
                            </button>
                          </div>
                          
                          {comment.isOwner && (
                            <div className="flex items-center gap-2 ml-auto">
                              <div className="bg-white p-1 rounded-lg shadow-sm border border-dashed border-amber-300 transform -rotate-1">
                                <button
                                  onClick={() => handleEditComment(comment.id)}
                                  className="p-1 bg-amber-50 text-amber-700 rounded-lg hover:bg-yellow-100 transition-colors border border-dashed border-amber-200"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                              </div>
                              <div className="bg-white p-1 rounded-lg shadow-sm border border-dashed border-amber-300 transform rotate-1">
                                <button
                                  onClick={() => handleDeleteComment(comment.id)}
                                  className="p-1 bg-amber-50 text-amber-700 rounded-lg hover:bg-red-100 hover:text-red-600 transition-colors border border-dashed border-amber-200"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                    
                    {/* 답글 입력 폼 */}
                    {replyingTo === comment.id && (
                      <div className="mt-4 ml-6 border-l-2 border-dashed border-amber-300 pl-4">
                        <div className="space-y-3">
                          {!isLoggedIn && (
                            <input
                              type="text"
                              placeholder="닉네임을 입력하세요..."
                              value={guestName}
                              onChange={(e) => setGuestName(e.target.value)}
                              className="p-2 border-2 border-dashed border-amber-300 rounded-lg w-full focus:ring-2 focus:ring-amber-300 text-amber-800 placeholder-amber-400"
                            />
                          )}
                          <textarea
                            placeholder="답글을 입력하세요..."
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            className="w-full p-3 border-2 border-dashed border-amber-300 rounded-lg resize-none focus:ring-2 focus:ring-amber-300 text-amber-800 placeholder-amber-400"
                            rows={2}
                          />
                          <div className="flex justify-between">
                            <div className="bg-white p-1 rounded-lg shadow-sm border border-dashed border-amber-300 transform rotate-1">
                              <button
                                onClick={() => setReplyingTo(null)}
                                className="px-3 py-1 bg-gray-200 text-gray-700 rounded-lg font-medium"
                              >
                                취소
                              </button>
                            </div>
                            <div className="bg-white p-1 rounded-lg shadow-sm border border-dashed border-amber-300 transform -rotate-1">
                              <button
                                onClick={() => handleSubmitReply(comment.id)}
                                disabled={!replyContent.trim() || (!isLoggedIn && !guestName.trim())}
                                className="px-3 py-1 bg-blue-500 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                답글 작성
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* 답글 목록 */}
                    {comment.replies && comment.replies.length > 0 && (
                      <div className="mt-4 ml-6 border-l-2 border-dashed border-amber-300 pl-4 space-y-4">
                        {comment.replies.map((reply, replyIndex) => (
                          <div 
                            key={reply.id} 
                            className="bg-amber-50 p-4 rounded-lg border-2 border-dashed border-amber-300"
                            style={{ transform: `rotate(${getRandomRotation()}deg)` }}
                          >
                            <div className="flex gap-3">
                              <div className="w-8 h-8 rounded-full overflow-hidden border border-dashed border-amber-300">
                                <img
                                  src={reply.author.avatar}
                                  alt={reply.author.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-bold text-amber-800">{reply.author.name}</span>
                                  <span className="text-xs bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full border border-dashed border-amber-300">
                                    {reply.author.level}
                                  </span>
                                  <span className="text-xs text-amber-600">{reply.timestamp}</span>
                                </div>
                                
                                {editingReply && editingReply.commentId === comment.id && editingReply.replyId === reply.id ? (
                                  <div className="space-y-2">
                                    <textarea
                                      value={editReplyContent}
                                      onChange={(e) => setEditReplyContent(e.target.value)}
                                      className="w-full p-2 border-2 border-dashed border-amber-300 rounded-lg resize-none focus:ring-2 focus:ring-amber-300 text-amber-800"
                                      rows={2}
                                    />
                                    <div className="flex gap-2">
                                      <div className="bg-white p-1 rounded-lg shadow-sm border border-dashed border-amber-300 transform rotate-1">
                                        <button
                                          onClick={() => handleSaveReplyEdit(comment.id, reply.id)}
                                          className="px-2 py-1 bg-green-500 text-white rounded-lg font-medium text-sm"
                                        >
                                          저장
                                        </button>
                                      </div>
                                      <div className="bg-white p-1 rounded-lg shadow-sm border border-dashed border-amber-300 transform -rotate-1">
                                        <button
                                          onClick={() => setEditingReply(null)}
                                          className="px-2 py-1 bg-gray-300 text-gray-700 rounded-lg font-medium text-sm"
                                        >
                                          취소
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    <p className="mb-2 text-amber-800">{reply.content}</p>
                                    
                                    <div className="flex items-center gap-2">
                                      <div className="bg-white p-1 rounded-lg shadow-sm border border-dashed border-amber-300 transform rotate-1">
                                        <button
                                          onClick={() => handleLike(comment.id, reply.id)}
                                          className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-sm font-medium transition-colors ${
                                            reply.isLiked 
                                              ? 'bg-red-100 text-red-600 border border-dashed border-red-300' 
                                              : 'bg-amber-50 text-amber-700 hover:bg-red-50 border border-dashed border-amber-200'
                                          }`}
                                        >
                                          <Heart className={`w-3 h-3 ${reply.isLiked ? 'fill-current' : ''}`} />
                                          <span>{reply.likes}</span>
                                        </button>
                                      </div>
                                      
                                      <div className="bg-white p-1 rounded-lg shadow-sm border border-dashed border-amber-300 transform -rotate-1">
                                        <button
                                          onClick={() => handleReport(comment.id, reply.id)}
                                          className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-50 text-amber-700 hover:bg-red-50 hover:text-red-600 text-sm font-medium transition-colors border border-dashed border-amber-200"
                                        >
                                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                          </svg>
                                          <span>신고</span>
                                        </button>
                                      </div>
                                      
                                      {reply.isOwner && (
                                        <div className="flex items-center gap-1 ml-auto">
                                          <div className="bg-white p-0.5 rounded-lg shadow-sm border border-dashed border-amber-300 transform -rotate-1">
                                            <button 
                                              onClick={() => handleEditReply(comment.id, reply.id)}
                                              className="p-1 bg-amber-50 text-amber-700 rounded-lg hover:bg-yellow-100 transition-colors border border-dashed border-amber-200"
                                            >
                                              <Edit3 className="w-3 h-3" />
                                            </button>
                                          </div>
                                          <div className="bg-white p-0.5 rounded-lg shadow-sm border border-dashed border-amber-300 transform rotate-1">
                                            <button 
                                              onClick={() => handleDeleteReply(comment.id, reply.id)}
                                              className="p-1 bg-amber-50 text-amber-700 rounded-lg hover:bg-red-100 hover:text-red-600 transition-colors border border-dashed border-amber-200"
                                            >
                                              <Trash2 className="w-3 h-3" />
                                            </button>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 페이지네이션 */}
          <div className="bg-white p-6 rounded-b-lg border-x-2 border-b-2 border-dashed border-amber-300 shadow-lg transform -rotate-1">
            <div className="flex justify-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => (
                <div 
                  key={i + 1}
                  className="bg-white p-1 rounded-lg shadow-sm border border-dashed border-amber-300"
                  style={{ transform: `rotate(${getRandomRotation()}deg)` }}
                >
                  <button
                    onClick={() => paginate(i + 1)}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg font-medium transition-colors ${
                      currentPage === i + 1
                        ? 'bg-amber-500 text-white'
                        : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                    }`}
                  >
                    {i + 1}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}