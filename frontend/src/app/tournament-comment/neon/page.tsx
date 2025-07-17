'use client';

import { useState, useEffect } from 'react';
import { Heart, Edit3, Trash2, User, Reply, MessageCircle, Shield } from 'lucide-react';
import { sampleComments } from '../data.tsx';

export default function TournamentCommentNeonPage() {
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

  // 레벨별 색상 매핑
  const getLevelColor = (level: string) => {
    switch(level) {
      case 'VIP': return 'text-purple-400';
      case 'Gold': return 'text-yellow-400';
      case 'Silver': return 'text-gray-400';
      case 'Bronze': return 'text-amber-700';
      default: return 'text-blue-400';
    }
  };

  return (
    <div className="min-h-screen bg-black py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">네온 사이버 스타일 댓글 시스템</h1>
          <p className="text-gray-400">미래적인 네온 디자인의 댓글 UI</p>
        </div>

        {/* 로그인 상태 토글 */}
        <div className="bg-gray-900/80 backdrop-blur-sm border border-cyan-500/30 rounded-xl p-4 mb-8 shadow-lg shadow-cyan-500/10">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={isLoggedIn}
                  onChange={(e) => setIsLoggedIn(e.target.checked)}
                  className="rounded bg-gray-800 border-cyan-500 text-cyan-500 focus:ring-cyan-500"
                />
                <span className="text-sm text-gray-400">로그인 상태로 보기</span>
              </label>
            </div>
          </div>
        </div>

        {/* 네온 사이버 스타일 */}
        <div className="max-w-4xl mx-auto mb-16">
          {/* 헤더 */}
          <div className="bg-black rounded-t-3xl p-6 relative overflow-hidden border-2 border-cyan-500/50">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 via-pink-900/30 to-blue-900/30"></div>
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-purple-500"></div>
            
            <div className="relative z-10">
              <div className="text-center">
                <div className="inline-flex items-center gap-4 bg-gray-800/30 backdrop-blur-sm rounded-2xl px-8 py-4 border border-gray-700 mb-4">
                  <MessageCircle className="w-6 h-6 text-cyan-400" />
                  <div className="text-3xl font-bold text-white font-mono">COMMENTS</div>
                  <MessageCircle className="w-6 h-6 text-pink-400" />
                </div>
                <p className="text-cyan-400 font-mono text-sm">토너먼트 결과에 대한 의견을 남겨주세요</p>
              </div>
              
              {/* 정렬 옵션 */}
              <div className="flex justify-center mt-6">
                <div className="flex border border-cyan-500/30 rounded-full overflow-hidden bg-gray-800/50">
                  <button
                    onClick={() => setSortOption('likes')}
                    className={`px-4 py-2 font-mono font-bold text-sm transition-colors ${
                      sortOption === 'likes'
                        ? 'bg-gradient-to-r from-cyan-500/20 to-cyan-500/10 text-cyan-400 border-r border-cyan-500/30'
                        : 'text-gray-400 hover:text-cyan-400 border-r border-cyan-500/30'
                    }`}
                  >
                    <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                      POPULAR
                    </span>
                  </button>
                  <button
                    onClick={() => setSortOption('recent')}
                    className={`px-4 py-2 font-mono font-bold text-sm transition-colors ${
                      sortOption === 'recent'
                        ? 'bg-gradient-to-r from-pink-500/20 to-pink-500/10 text-pink-400'
                        : 'text-gray-400 hover:text-pink-400'
                    }`}
                  >
                    <span className="bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
                      RECENT
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 댓글 입력 폼 */}
          <div className="bg-gray-900 p-6 border-x-2 border-cyan-500/50">
            <div className="mb-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="font-bold text-lg text-white font-mono">
                    {isLoggedIn ? '현재 사용자' : 'GUEST'}
                  </div>
                  {!isLoggedIn && (
                    <input
                      type="text"
                      placeholder="Enter your handle..."
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      className="p-2 bg-gray-800 border border-cyan-500/30 rounded-lg w-full mt-2 focus:ring-2 focus:ring-cyan-500 text-white placeholder-gray-500 font-mono"
                    />
                  )}
                </div>
              </div>
              <textarea
                placeholder="Write your comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="w-full p-4 bg-gray-800 border border-cyan-500/30 rounded-xl resize-none focus:ring-2 focus:ring-cyan-500 text-white placeholder-gray-500 font-mono"
                rows={3}
              />
              <div className="flex justify-end mt-3">
                <button
                  onClick={handleSubmitComment}
                  disabled={!newComment.trim() || (!isLoggedIn && !guestName.trim())}
                  className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-black rounded-xl font-bold text-lg hover:from-cyan-600 hover:to-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-mono"
                >
                  SUBMIT
                </button>
              </div>
            </div>
          </div>

          {/* 댓글 목록 */}
          <div className="bg-gray-900 border-x-2 border-cyan-500/50 divide-y divide-cyan-500/20">
            {currentComments.map((comment) => (
              <div key={comment.id} className="p-6">
                <div className="flex gap-4">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full p-0.5 bg-gradient-to-r from-cyan-500 to-blue-500">
                      <img
                        src={comment.author.avatar}
                        alt={comment.author.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    </div>
                    {comment.author.isVerified && (
                      <div className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full w-6 h-6 flex items-center justify-center">
                        <Shield className="w-3 h-3 text-black" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-lg text-white font-mono">{comment.author.name}</span>
                      <span className={`text-xs px-2 py-1 rounded-full font-bold bg-gray-800 ${getLevelColor(comment.author.level)} font-mono`}>
                        {comment.author.level}
                      </span>
                      <span className="text-sm text-gray-500 font-mono">{comment.timestamp}</span>
                    </div>
                    
                    {editingComment === comment.id ? (
                      <div className="space-y-2">
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="w-full p-3 bg-gray-800 border border-cyan-500/30 rounded-xl resize-none focus:ring-2 focus:ring-cyan-500 text-white font-mono"
                          rows={3}
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSaveEdit(comment.id)}
                            className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-black rounded-lg font-bold font-mono"
                          >
                            SAVE
                          </button>
                          <button
                            onClick={() => setEditingComment(null)}
                            className="px-4 py-2 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-lg font-bold font-mono"
                          >
                            CANCEL
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="bg-gray-800/50 p-4 rounded-xl border border-cyan-500/30 mb-3">
                          <p className="text-lg leading-relaxed text-gray-100">{comment.content}</p>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleLike(comment.id)}
                            className={`flex items-center gap-1 px-3 py-1 rounded-full font-bold transition-colors border border-pink-500/30 ${
                              comment.isLiked 
                                ? 'bg-pink-500/20 text-pink-400' 
                                : 'bg-gray-800/50 text-gray-400 hover:text-pink-400 hover:bg-pink-500/10'
                            }`}
                          >
                            <Heart className={`w-4 h-4 ${comment.isLiked ? 'fill-current' : ''}`} />
                            <span>{comment.likes}</span>
                          </button>
                          
                          <button 
                            onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                            className="flex items-center gap-1 px-3 py-1 rounded-full bg-gray-800/50 text-gray-400 hover:text-cyan-400 hover:bg-cyan-500/10 font-bold transition-colors border border-cyan-500/30"
                          >
                            <Reply className="w-4 h-4" />
                            <span>REPLY {comment.replies?.length || 0}</span>
                          </button>
                          
                          <button
                            onClick={() => handleReport(comment.id)}
                            className="flex items-center gap-1 px-3 py-1 rounded-full bg-gray-800/50 text-gray-400 hover:text-red-400 hover:bg-red-500/10 font-bold transition-colors border border-red-500/30"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <span>REPORT</span>
                          </button>
                          
                          {comment.isOwner && (
                            <div className="flex items-center gap-2 ml-auto">
                              <button
                                onClick={() => handleEditComment(comment.id)}
                                className="p-2 bg-gray-800/50 text-yellow-400 rounded-full hover:bg-yellow-500/10 transition-colors border border-yellow-500/30"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteComment(comment.id)}
                                className="p-2 bg-gray-800/50 text-red-400 rounded-full hover:bg-red-500/10 transition-colors border border-red-500/30"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                    
                    {/* 답글 입력 폼 */}
                    {replyingTo === comment.id && (
                      <div className="mt-4 ml-6 border-l-2 border-cyan-500/30 pl-4">
                        <div className="space-y-3">
                          {!isLoggedIn && (
                            <input
                              type="text"
                              placeholder="Enter your handle..."
                              value={guestName}
                              onChange={(e) => setGuestName(e.target.value)}
                              className="p-2 bg-gray-800 border border-cyan-500/30 rounded-lg w-full focus:ring-2 focus:ring-cyan-500 text-white placeholder-gray-500 font-mono"
                            />
                          )}
                          <textarea
                            placeholder="Write your reply..."
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            className="w-full p-3 bg-gray-800 border border-cyan-500/30 rounded-xl resize-none focus:ring-2 focus:ring-cyan-500 text-white placeholder-gray-500 font-mono"
                            rows={2}
                          />
                          <div className="flex justify-between">
                            <button
                              onClick={() => setReplyingTo(null)}
                              className="px-4 py-2 bg-gray-800 text-gray-400 rounded-lg font-bold font-mono hover:text-white"
                            >
                              CANCEL
                            </button>
                            <button
                              onClick={() => handleSubmitReply(comment.id)}
                              disabled={!replyContent.trim() || (!isLoggedIn && !guestName.trim())}
                              className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-black rounded-lg font-bold font-mono disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              REPLY
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* 답글 목록 */}
                    {comment.replies && comment.replies.length > 0 && (
                      <div className="mt-4 ml-6 border-l-2 border-cyan-500/30 pl-4 space-y-4">
                        {comment.replies.map(reply => (
                          <div key={reply.id} className="bg-gray-800/30 p-4 rounded-xl border border-cyan-500/20">
                            <div className="flex gap-3">
                              <div className="w-8 h-8 rounded-full p-0.5 bg-gradient-to-r from-cyan-500 to-blue-500">
                                <img
                                  src={reply.author.avatar}
                                  alt={reply.author.name}
                                  className="w-full h-full rounded-full object-cover"
                                />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-bold text-white font-mono">{reply.author.name}</span>
                                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold bg-gray-800 ${getLevelColor(reply.author.level)} font-mono`}>
                                    {reply.author.level}
                                  </span>
                                  <span className="text-xs text-gray-500 font-mono">{reply.timestamp}</span>
                                </div>
                                
                                {editingReply && editingReply.commentId === comment.id && editingReply.replyId === reply.id ? (
                                  <div className="space-y-2">
                                    <textarea
                                      value={editReplyContent}
                                      onChange={(e) => setEditReplyContent(e.target.value)}
                                      className="w-full p-2 bg-gray-800 border border-cyan-500/30 rounded-lg resize-none focus:ring-2 focus:ring-cyan-500 text-white font-mono"
                                      rows={2}
                                    />
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => handleSaveReplyEdit(comment.id, reply.id)}
                                        className="px-3 py-1 bg-gradient-to-r from-green-500 to-emerald-500 text-black rounded-lg font-bold text-sm font-mono"
                                      >
                                        SAVE
                                      </button>
                                      <button
                                        onClick={() => setEditingReply(null)}
                                        className="px-3 py-1 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-lg font-bold text-sm font-mono"
                                      >
                                        CANCEL
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    <p className="mb-2 text-gray-300">{reply.content}</p>
                                    
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() => handleLike(comment.id, reply.id)}
                                        className={`flex items-center gap-1 px-2 py-1 rounded-full text-sm font-bold transition-colors border border-pink-500/30 ${
                                          reply.isLiked 
                                            ? 'bg-pink-500/20 text-pink-400' 
                                            : 'bg-gray-800/50 text-gray-400 hover:text-pink-400 hover:bg-pink-500/10'
                                        }`}
                                      >
                                        <Heart className={`w-3 h-3 ${reply.isLiked ? 'fill-current' : ''}`} />
                                        <span>{reply.likes}</span>
                                      </button>
                                      
                                      <button
                                        onClick={() => handleReport(comment.id, reply.id)}
                                        className="flex items-center gap-1 px-2 py-1 rounded-full bg-gray-800/50 text-gray-400 hover:text-red-400 hover:bg-red-500/10 text-sm font-bold transition-colors border border-red-500/30"
                                      >
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                        <span>REPORT</span>
                                      </button>
                                      
                                      {reply.isOwner && (
                                        <div className="flex items-center gap-1 ml-auto">
                                          <button 
                                            onClick={() => handleEditReply(comment.id, reply.id)}
                                            className="p-1 bg-gray-800/50 text-yellow-400 rounded-full hover:bg-yellow-500/10 transition-colors border border-yellow-500/30"
                                          >
                                            <Edit3 className="w-3 h-3" />
                                          </button>
                                          <button 
                                            onClick={() => handleDeleteReply(comment.id, reply.id)}
                                            className="p-1 bg-gray-800/50 text-red-400 rounded-full hover:bg-red-500/10 transition-colors border border-red-500/30"
                                          >
                                            <Trash2 className="w-3 h-3" />
                                          </button>
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
          <div className="bg-black p-6 rounded-b-3xl border-x-2 border-b-2 border-cyan-500/50">
            <div className="flex justify-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i + 1}
                  onClick={() => paginate(i + 1)}
                  className={`w-10 h-10 flex items-center justify-center rounded-full font-bold transition-all font-mono ${
                    currentPage === i + 1
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-black'
                      : 'bg-gray-800/50 text-gray-400 hover:text-cyan-400 border border-cyan-500/30'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}