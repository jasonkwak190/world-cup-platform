'use client';

import { useState, useEffect } from 'react';
import { Heart, Edit3, Trash2, User, Reply, MoreHorizontal } from 'lucide-react';
import { sampleComments } from '../data.tsx';

export default function TournamentCommentMinimalPage() {
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
  const [openMenu, setOpenMenu] = useState<number | null>(null);
  const [openReplyMenu, setOpenReplyMenu] = useState<{commentId: number, replyId: number} | null>(null);

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
      setOpenMenu(null);
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
      setOpenMenu(null);
    }
  };
  
  const handleEditReply = (commentId: number, replyId: number) => {
    const comment = comments.find(c => c.id === commentId);
    if (comment) {
      const reply = comment.replies?.find(r => r.id === replyId);
      if (reply) {
        setEditingReply({ commentId, replyId });
        setEditReplyContent(reply.content);
        setOpenReplyMenu(null);
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
      setOpenReplyMenu(null);
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
      setOpenMenu(null);
      setOpenReplyMenu(null);
    }
  };

  // 페이지네이션 처리
  const indexOfLastComment = currentPage * commentsPerPage;
  const indexOfFirstComment = indexOfLastComment - commentsPerPage;
  const currentComments = sortComments(comments).slice(indexOfFirstComment, indexOfLastComment);
  const totalPages = Math.ceil(comments.length / commentsPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  // 메뉴 토글
  const toggleMenu = (commentId: number) => {
    setOpenMenu(openMenu === commentId ? null : commentId);
    setOpenReplyMenu(null);
  };

  const toggleReplyMenu = (commentId: number, replyId: number) => {
    setOpenReplyMenu(openReplyMenu?.commentId === commentId && openReplyMenu?.replyId === replyId 
      ? null 
      : { commentId, replyId });
    setOpenMenu(null);
  };

  // 외부 클릭 시 메뉴 닫기
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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">미니멀 엘레강스 댓글 시스템</h1>
          <p className="text-gray-600">세련되고 심플한 미니멀 디자인의 댓글 UI</p>
        </div>

        {/* 로그인 상태 토글 */}
        <div className="bg-white rounded-xl p-4 mb-8 shadow-sm">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={isLoggedIn}
                  onChange={(e) => setIsLoggedIn(e.target.checked)}
                  className="rounded border-gray-300 text-gray-900 focus:ring-gray-500"
                />
                <span className="text-sm text-gray-600">로그인 상태로 보기</span>
              </label>
            </div>
          </div>
        </div>

        {/* 미니멀 스타일 */}
        <div className="max-w-4xl mx-auto mb-16">
          {/* 헤더 */}
          <div className="bg-white p-6 rounded-t-xl shadow-sm">
            <div className="text-center">
              <h3 className="text-2xl font-light text-gray-800 mb-2">Comments</h3>
              <div className="w-16 h-0.5 bg-gray-200 mx-auto mb-4"></div>
              <p className="text-gray-500 font-light">토너먼트 결과에 대한 의견을 남겨주세요</p>
            </div>
            
            {/* 정렬 옵션 */}
            <div className="flex justify-center mt-6">
              <div className="flex border border-gray-200 rounded-full overflow-hidden">
                <button
                  onClick={() => setSortOption('likes')}
                  className={`px-4 py-2 font-light text-sm transition-colors ${
                    sortOption === 'likes'
                      ? 'bg-gray-900 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  인기순
                </button>
                <button
                  onClick={() => setSortOption('recent')}
                  className={`px-4 py-2 font-light text-sm transition-colors ${
                    sortOption === 'recent'
                      ? 'bg-gray-900 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  최신순
                </button>
              </div>
            </div>
          </div>

          {/* 댓글 입력 폼 */}
          <div className="bg-white p-6 border-t border-gray-100 shadow-sm">
            <div className="mb-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-gray-500" />
                </div>
                <div className="flex-1">
                  <div className="font-light text-lg text-gray-800">
                    {isLoggedIn ? '현재 사용자' : '게스트'}
                  </div>
                  {!isLoggedIn && (
                    <input
                      type="text"
                      placeholder="닉네임을 입력하세요..."
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      className="p-2 border border-gray-200 rounded-lg w-full mt-2 focus:ring-2 focus:ring-gray-200 focus:border-transparent text-gray-700 placeholder-gray-400"
                    />
                  )}
                </div>
              </div>
              <textarea
                placeholder="댓글을 입력하세요..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="w-full p-4 border border-gray-200 rounded-xl resize-none focus:ring-2 focus:ring-gray-200 focus:border-transparent text-gray-700 placeholder-gray-400"
                rows={3}
              />
              <div className="flex justify-end mt-3">
                <button
                  onClick={handleSubmitComment}
                  disabled={!newComment.trim() || (!isLoggedIn && !guestName.trim())}
                  className="px-6 py-2 bg-gray-900 text-white rounded-full font-light hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  댓글 작성
                </button>
              </div>
            </div>
          </div>

          {/* 댓글 목록 */}
          <div className="bg-white border-t border-gray-100 divide-y divide-gray-100 shadow-sm">
            {currentComments.map((comment) => (
              <div key={comment.id} className="p-6">
                <div className="flex gap-4">
                  <img
                    src={comment.author.avatar}
                    alt={comment.author.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{comment.author.name}</span>
                        {comment.author.isVerified && (
                          <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                            인증됨
                          </span>
                        )}
                        <span className="text-xs text-gray-500">{comment.timestamp}</span>
                      </div>
                      
                      {/* 더보기 메뉴 */}
                      <div className="relative">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleMenu(comment.id);
                          }}
                          className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          <MoreHorizontal className="w-5 h-5" />
                        </button>
                        
                        {openMenu === comment.id && (
                          <div className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-100 z-10 overflow-hidden">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleReport(comment.id);
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                            >
                              신고하기
                            </button>
                            {comment.isOwner && (
                              <>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditComment(comment.id);
                                  }}
                                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                                >
                                  수정하기
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteComment(comment.id);
                                  }}
                                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 transition-colors"
                                >
                                  삭제하기
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {editingComment === comment.id ? (
                      <div className="space-y-2">
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="w-full p-3 border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-gray-200 focus:border-transparent text-gray-700"
                          rows={3}
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSaveEdit(comment.id)}
                            className="px-4 py-1 bg-gray-900 text-white rounded-full font-light text-sm"
                          >
                            저장
                          </button>
                          <button
                            onClick={() => setEditingComment(null)}
                            className="px-4 py-1 bg-gray-200 text-gray-700 rounded-full font-light text-sm"
                          >
                            취소
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="text-gray-700 mb-3 leading-relaxed">{comment.content}</p>
                        
                        <div className="flex items-center gap-4">
                          <button
                            onClick={() => handleLike(comment.id)}
                            className={`flex items-center gap-1 text-sm transition-colors ${
                              comment.isLiked 
                                ? 'text-red-500' 
                                : 'text-gray-500 hover:text-red-500'
                            }`}
                          >
                            <Heart className={`w-4 h-4 ${comment.isLiked ? 'fill-current' : ''}`} />
                            <span>{comment.likes}</span>
                          </button>
                          
                          <button 
                            onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                            className="flex items-center gap-1 text-sm text-gray-500 hover:text-blue-500 transition-colors"
                          >
                            <Reply className="w-4 h-4" />
                            <span>답글 {comment.replies?.length || 0}</span>
                          </button>
                        </div>
                      </>
                    )}
                    
                    {/* 답글 입력 폼 */}
                    {replyingTo === comment.id && (
                      <div className="mt-4 ml-6 pl-4 border-l-2 border-gray-100">
                        <div className="space-y-3">
                          {!isLoggedIn && (
                            <input
                              type="text"
                              placeholder="닉네임을 입력하세요..."
                              value={guestName}
                              onChange={(e) => setGuestName(e.target.value)}
                              className="p-2 border border-gray-200 rounded-lg w-full focus:ring-2 focus:ring-gray-200 focus:border-transparent text-gray-700 placeholder-gray-400"
                            />
                          )}
                          <textarea
                            placeholder="답글을 입력하세요..."
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            className="w-full p-3 border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-gray-200 focus:border-transparent text-gray-700 placeholder-gray-400"
                            rows={2}
                          />
                          <div className="flex justify-between">
                            <button
                              onClick={() => setReplyingTo(null)}
                              className="px-4 py-1 text-sm text-gray-500 hover:text-gray-700"
                            >
                              취소
                            </button>
                            <button
                              onClick={() => handleSubmitReply(comment.id)}
                              disabled={!replyContent.trim() || (!isLoggedIn && !guestName.trim())}
                              className="px-4 py-1 bg-gray-900 text-white rounded-full font-light text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              답글 작성
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* 답글 목록 */}
                    {comment.replies && comment.replies.length > 0 && (
                      <div className="mt-4 ml-6 pl-4 border-l-2 border-gray-100 space-y-4">
                        {comment.replies.map(reply => (
                          <div key={reply.id} className="relative">
                            <div className="flex gap-3">
                              <img
                                src={reply.author.avatar}
                                alt={reply.author.name}
                                className="w-8 h-8 rounded-full object-cover"
                              />
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-gray-900">{reply.author.name}</span>
                                    {reply.author.isVerified && (
                                      <span className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full">
                                        인증됨
                                      </span>
                                    )}
                                    <span className="text-xs text-gray-500">{reply.timestamp}</span>
                                  </div>
                                  
                                  {/* 답글 더보기 메뉴 */}
                                  <div className="relative">
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleReplyMenu(comment.id, reply.id);
                                      }}
                                      className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                      <MoreHorizontal className="w-4 h-4" />
                                    </button>
                                    
                                    {openReplyMenu?.commentId === comment.id && openReplyMenu?.replyId === reply.id && (
                                      <div className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-100 z-10 overflow-hidden">
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleReport(comment.id, reply.id);
                                          }}
                                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                                        >
                                          신고하기
                                        </button>
                                        {reply.isOwner && (
                                          <>
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleEditReply(comment.id, reply.id);
                                              }}
                                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                                            >
                                              수정하기
                                            </button>
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteReply(comment.id, reply.id);
                                              }}
                                              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 transition-colors"
                                            >
                                              삭제하기
                                            </button>
                                          </>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                
                                {editingReply && editingReply.commentId === comment.id && editingReply.replyId === reply.id ? (
                                  <div className="space-y-2">
                                    <textarea
                                      value={editReplyContent}
                                      onChange={(e) => setEditReplyContent(e.target.value)}
                                      className="w-full p-2 border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-gray-200 focus:border-transparent text-gray-700"
                                      rows={2}
                                    />
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => handleSaveReplyEdit(comment.id, reply.id)}
                                        className="px-3 py-1 bg-gray-900 text-white rounded-full font-light text-xs"
                                      >
                                        저장
                                      </button>
                                      <button
                                        onClick={() => setEditingReply(null)}
                                        className="px-3 py-1 bg-gray-200 text-gray-700 rounded-full font-light text-xs"
                                      >
                                        취소
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    <p className="text-gray-700 mb-2 text-sm">{reply.content}</p>
                                    
                                    <button
                                      onClick={() => handleLike(comment.id, reply.id)}
                                      className={`flex items-center gap-1 text-xs transition-colors ${
                                        reply.isLiked 
                                          ? 'text-red-500' 
                                          : 'text-gray-500 hover:text-red-500'
                                      }`}
                                    >
                                      <Heart className={`w-3 h-3 ${reply.isLiked ? 'fill-current' : ''}`} />
                                      <span>{reply.likes}</span>
                                    </button>
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
          <div className="bg-white p-6 rounded-b-xl border-t border-gray-100 shadow-sm">
            <div className="flex justify-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i + 1}
                  onClick={() => paginate(i + 1)}
                  className={`w-8 h-8 flex items-center justify-center rounded-full font-light text-sm transition-colors ${
                    currentPage === i + 1
                      ? 'bg-gray-900 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
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