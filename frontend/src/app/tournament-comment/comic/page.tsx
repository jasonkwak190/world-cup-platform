'use client';

import { useState, useEffect } from 'react';
import { Heart, Edit3, Trash2, User, Reply, Crown } from 'lucide-react';
import { sampleComments } from '../data.tsx';

export default function TournamentCommentComicPage() {
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 to-purple-100 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">만화책 스타일 댓글 시스템</h1>
          <p className="text-gray-600">팝아트 감성의 만화책 디자인 댓글 UI</p>
        </div>

        {/* 로그인 상태 토글 */}
        <div className="bg-white border-4 border-black rounded-2xl p-4 mb-8 shadow-[8px_8px_0px_0px_#000]">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={isLoggedIn}
                  onChange={(e) => setIsLoggedIn(e.target.checked)}
                  className="rounded border-2 border-black"
                />
                <span className="text-sm font-bold text-gray-800">로그인 상태로 보기</span>
              </label>
            </div>
          </div>
        </div>

        {/* 만화책 스타일 */}
        <div className="max-w-4xl mx-auto mb-16">
          {/* 헤더 */}
          <div className="bg-yellow-300 p-6 rounded-t-3xl border-4 border-black shadow-[8px_8px_0px_0px_#000] relative">
            <div className="absolute -top-6 left-8 bg-red-500 text-white px-4 py-2 rounded-lg border-4 border-black transform -rotate-6 font-black text-lg shadow-[4px_4px_0px_0px_#000]">
              HOT! 🔥
            </div>
            <div className="text-center">
              <h3 className="text-3xl font-black text-black mb-2">COMMENTS!</h3>
              <p className="text-black font-bold">토너먼트 결과에 대한 의견을 남겨주세요!</p>
            </div>
            
            {/* 정렬 옵션 */}
            <div className="flex justify-center mt-4">
              <div className="flex border-4 border-black rounded-full overflow-hidden">
                <button
                  onClick={() => setSortOption('likes')}
                  className={`px-4 py-2 font-black text-sm transition-colors ${
                    sortOption === 'likes'
                      ? 'bg-red-500 text-white'
                      : 'bg-white text-black hover:bg-red-100'
                  }`}
                >
                  👍 인기순
                </button>
                <button
                  onClick={() => setSortOption('recent')}
                  className={`px-4 py-2 font-black text-sm transition-colors ${
                    sortOption === 'recent'
                      ? 'bg-blue-500 text-white'
                      : 'bg-white text-black hover:bg-blue-100'
                  }`}
                >
                  🕒 최신순
                </button>
              </div>
            </div>
          </div>

          {/* 댓글 입력 폼 */}
          <div className="bg-white p-6 border-x-4 border-black">
            <div className="mb-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-blue-500 rounded-full border-4 border-black flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="font-black text-lg">
                    {isLoggedIn ? '현재 사용자' : '게스트'}
                  </div>
                  {!isLoggedIn && (
                    <input
                      type="text"
                      placeholder="닉네임을 입력하세요..."
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      className="p-2 border-2 border-black rounded-lg w-full mt-2 focus:ring-2 focus:ring-blue-500"
                    />
                  )}
                </div>
              </div>
              <textarea
                placeholder="댓글을 입력하세요... 💬"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="w-full p-4 border-4 border-black rounded-xl resize-none focus:ring-2 focus:ring-blue-500 text-lg"
                rows={3}
              />
              <div className="flex justify-end mt-3">
                <button
                  onClick={handleSubmitComment}
                  disabled={!newComment.trim() || (!isLoggedIn && !guestName.trim())}
                  className="px-6 py-3 bg-green-500 text-white rounded-xl border-4 border-black font-black text-lg shadow-[4px_4px_0px_0px_#000] hover:shadow-[2px_2px_0px_0px_#000] hover:translate-x-1 hover:translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  댓글 작성! 💥
                </button>
              </div>
            </div>
          </div>

          {/* 댓글 목록 */}
          <div className="bg-white border-x-4 border-black divide-y-4 divide-black">
            {currentComments.map((comment) => (
              <div key={comment.id} className="p-6">
                <div className="flex gap-4">
                  <div className="relative">
                    <img
                      src={comment.author.avatar}
                      alt={comment.author.name}
                      className="w-14 h-14 rounded-full object-cover border-4 border-black"
                    />
                    {comment.author.isVerified && (
                      <div className="absolute -top-2 -right-2 bg-yellow-400 rounded-full w-6 h-6 flex items-center justify-center border-2 border-black">
                        <Crown className="w-3 h-3 text-black" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-black text-lg">{comment.author.name}</span>
                      <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full font-bold">
                        {comment.author.level}
                      </span>
                      <span className="text-sm text-gray-500">{comment.timestamp}</span>
                    </div>
                    
                    {editingComment === comment.id ? (
                      <div className="space-y-2">
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="w-full p-3 border-4 border-black rounded-xl resize-none focus:ring-2 focus:ring-blue-500"
                          rows={3}
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSaveEdit(comment.id)}
                            className="px-4 py-2 bg-green-500 text-white rounded-lg border-4 border-black font-bold shadow-[4px_4px_0px_0px_#000] hover:shadow-[2px_2px_0px_0px_#000] hover:translate-x-1 hover:translate-y-1 transition-all"
                          >
                            저장
                          </button>
                          <button
                            onClick={() => setEditingComment(null)}
                            className="px-4 py-2 bg-gray-300 text-black rounded-lg border-4 border-black font-bold shadow-[4px_4px_0px_0px_#000] hover:shadow-[2px_2px_0px_0px_#000] hover:translate-x-1 hover:translate-y-1 transition-all"
                          >
                            취소
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="bg-yellow-100 p-4 rounded-2xl border-4 border-black mb-3 relative">
                          <div className="absolute -top-3 -left-3 w-6 h-6 bg-yellow-100 border-4 border-black rounded-full"></div>
                          <div className="absolute -bottom-3 -right-3 w-6 h-6 bg-yellow-100 border-4 border-black rounded-full"></div>
                          <p className="text-lg leading-relaxed">{comment.content}</p>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleLike(comment.id)}
                            className={`flex items-center gap-1 px-3 py-1 rounded-full font-bold transition-colors border-2 border-black ${
                              comment.isLiked 
                                ? 'bg-red-500 text-white' 
                                : 'bg-white text-black hover:bg-red-100'
                            }`}
                          >
                            <Heart className={`w-4 h-4 ${comment.isLiked ? 'fill-current' : ''}`} />
                            <span>{comment.likes}</span>
                          </button>
                          
                          <button 
                            onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                            className="flex items-center gap-1 px-3 py-1 rounded-full bg-blue-100 text-blue-800 hover:bg-blue-200 font-bold transition-colors border-2 border-black"
                          >
                            <Reply className="w-4 h-4" />
                            <span>답글 {comment.replies?.length || 0}</span>
                          </button>
                          
                          <button
                            onClick={() => handleReport(comment.id)}
                            className="flex items-center gap-1 px-3 py-1 rounded-full bg-gray-100 text-gray-800 hover:bg-gray-200 font-bold transition-colors border-2 border-black"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <span>신고</span>
                          </button>
                          
                          {comment.isOwner && (
                            <div className="flex items-center gap-2 ml-auto">
                              <button
                                onClick={() => handleEditComment(comment.id)}
                                className="p-2 bg-yellow-100 text-yellow-800 rounded-full hover:bg-yellow-200 transition-colors border-2 border-black"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteComment(comment.id)}
                                className="p-2 bg-red-100 text-red-800 rounded-full hover:bg-red-200 transition-colors border-2 border-black"
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
                      <div className="mt-4 ml-6 border-l-4 border-blue-500 pl-4">
                        <div className="space-y-3">
                          {!isLoggedIn && (
                            <input
                              type="text"
                              placeholder="닉네임을 입력하세요..."
                              value={guestName}
                              onChange={(e) => setGuestName(e.target.value)}
                              className="p-2 border-2 border-black rounded-lg w-full focus:ring-2 focus:ring-blue-500"
                            />
                          )}
                          <textarea
                            placeholder="답글을 입력하세요..."
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            className="w-full p-3 border-2 border-black rounded-xl resize-none focus:ring-2 focus:ring-blue-500"
                            rows={2}
                          />
                          <div className="flex justify-between">
                            <button
                              onClick={() => setReplyingTo(null)}
                              className="px-4 py-2 bg-gray-300 text-black rounded-lg border-2 border-black font-bold"
                            >
                              취소
                            </button>
                            <button
                              onClick={() => handleSubmitReply(comment.id)}
                              disabled={!replyContent.trim() || (!isLoggedIn && !guestName.trim())}
                              className="px-4 py-2 bg-blue-500 text-white rounded-lg border-2 border-black font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              답글 작성
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* 답글 목록 */}
                    {comment.replies && comment.replies.length > 0 && (
                      <div className="mt-4 ml-6 border-l-4 border-blue-500 pl-4 space-y-4">
                        {comment.replies.map(reply => (
                          <div key={reply.id} className="bg-blue-50 p-4 rounded-xl border-2 border-black">
                            <div className="flex gap-3">
                              <img
                                src={reply.author.avatar}
                                alt={reply.author.name}
                                className="w-10 h-10 rounded-full object-cover border-2 border-black"
                              />
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-bold">{reply.author.name}</span>
                                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-bold">
                                    {reply.author.level}
                                  </span>
                                  <span className="text-xs text-gray-500">{reply.timestamp}</span>
                                </div>
                                
                                {editingReply && editingReply.commentId === comment.id && editingReply.replyId === reply.id ? (
                                  <div className="space-y-2">
                                    <textarea
                                      value={editReplyContent}
                                      onChange={(e) => setEditReplyContent(e.target.value)}
                                      className="w-full p-2 border-2 border-black rounded-lg resize-none focus:ring-2 focus:ring-blue-500"
                                      rows={2}
                                    />
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => handleSaveReplyEdit(comment.id, reply.id)}
                                        className="px-3 py-1 bg-green-500 text-white rounded-lg border-2 border-black font-bold text-sm"
                                      >
                                        저장
                                      </button>
                                      <button
                                        onClick={() => setEditingReply(null)}
                                        className="px-3 py-1 bg-gray-300 text-black rounded-lg border-2 border-black font-bold text-sm"
                                      >
                                        취소
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    <p className="mb-2">{reply.content}</p>
                                    
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() => handleLike(comment.id, reply.id)}
                                        className={`flex items-center gap-1 px-2 py-1 rounded-full text-sm font-bold transition-colors border-2 border-black ${
                                          reply.isLiked 
                                            ? 'bg-red-500 text-white' 
                                            : 'bg-white text-black hover:bg-red-100'
                                        }`}
                                      >
                                        <Heart className={`w-3 h-3 ${reply.isLiked ? 'fill-current' : ''}`} />
                                        <span>{reply.likes}</span>
                                      </button>
                                      
                                      <button
                                        onClick={() => handleReport(comment.id, reply.id)}
                                        className="flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-gray-800 hover:bg-gray-200 text-sm font-bold transition-colors border-2 border-black"
                                      >
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                        <span>신고</span>
                                      </button>
                                      
                                      {reply.isOwner && (
                                        <div className="flex items-center gap-1 ml-auto">
                                          <button 
                                            onClick={() => handleEditReply(comment.id, reply.id)}
                                            className="p-1 bg-yellow-100 text-yellow-800 rounded-full hover:bg-yellow-200 transition-colors border-2 border-black"
                                          >
                                            <Edit3 className="w-3 h-3" />
                                          </button>
                                          <button 
                                            onClick={() => handleDeleteReply(comment.id, reply.id)}
                                            className="p-1 bg-red-100 text-red-800 rounded-full hover:bg-red-200 transition-colors border-2 border-black"
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
          <div className="bg-white p-6 rounded-b-3xl border-4 border-t-0 border-black shadow-[8px_8px_0px_0px_#000]">
            <div className="flex justify-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i + 1}
                  onClick={() => paginate(i + 1)}
                  className={`w-10 h-10 flex items-center justify-center rounded-full font-black border-2 border-black transition-all ${
                    currentPage === i + 1
                      ? 'bg-blue-500 text-white'
                      : 'bg-white text-black hover:bg-blue-100'
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