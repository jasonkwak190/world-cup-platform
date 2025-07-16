'use client';

import { useState, useEffect } from 'react';
import { Heart, Edit3, Trash2, User, Reply, Crown } from 'lucide-react';

// 샘플 댓글 데이터
const sampleComments = [
  {
    id: 1,
    author: {
      name: '김민수',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face',
      isVerified: true,
      level: 'VIP'
    },
    content: 'IU가 우승한 건 당연한 결과죠! 정말 최고의 아티스트입니다 👑',
    timestamp: '2분 전',
    createdAt: new Date(Date.now() - 2 * 60 * 1000), // 2분 전
    likes: 24,
    isLiked: false,
    isOwner: false,
    replies: [
      {
        id: 101,
        author: {
          name: '이지은',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=40&h=40&fit=crop&crop=face',
          isVerified: false,
          level: 'Silver'
        },
        content: '저도 동의해요! IU는 정말 실력파 아티스트죠 ✨',
        timestamp: '1분 전',
        createdAt: new Date(Date.now() - 1 * 60 * 1000), // 1분 전
        likes: 5,
        isLiked: false,
        isOwner: false
      },
      {
        id: 102,
        author: {
          name: '정우성',
          avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=40&h=40&fit=crop&crop=face',
          isVerified: true,
          level: 'Gold'
        },
        content: '음악성과 퍼포먼스 모두 완벽했어요!',
        timestamp: '방금 전',
        createdAt: new Date(Date.now() - 30 * 1000), // 30초 전
        likes: 2,
        isLiked: false,
        isOwner: false
      }
    ]
  },
  {
    id: 2,
    author: {
      name: '박지영',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616c9c0b8d3?w=40&h=40&fit=crop&crop=face',
      isVerified: false,
      level: 'Bronze'
    },
    content: '진짜 치열한 경쟁이었는데 결과가 아쉽네요 ㅠㅠ 그래도 재밌었어요!',
    timestamp: '5분 전',
    createdAt: new Date(Date.now() - 5 * 60 * 1000), // 5분 전
    likes: 12,
    isLiked: true,
    isOwner: true,
    replies: [
      {
        id: 201,
        author: {
          name: '김태희',
          avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=40&h=40&fit=crop&crop=face',
          isVerified: false,
          level: 'Bronze'
        },
        content: '저도 아쉬웠어요. 다음에는 다른 결과가 나왔으면 좋겠네요!',
        timestamp: '3분 전',
        createdAt: new Date(Date.now() - 3 * 60 * 1000), // 3분 전
        likes: 3,
        isLiked: false,
        isOwner: false
      }
    ]
  },
  {
    id: 3,
    author: {
      name: '이준호',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face',
      isVerified: true,
      level: 'Gold'
    },
    content: '다음에는 더 다양한 아티스트들로 토너먼트 해주세요! 기대됩니다 🔥',
    timestamp: '10분 전',
    createdAt: new Date(Date.now() - 10 * 60 * 1000), // 10분 전
    likes: 8,
    isLiked: false,
    isOwner: false,
    replies: []
  }
];

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

  // 정렬된 댓글 가져오기
  const sortedComments = sortComments(comments);
  const totalPages = Math.ceil(sortedComments.length / commentsPerPage);
  const currentComments = sortedComments.slice(
    (currentPage - 1) * commentsPerPage,
    currentPage * commentsPerPage
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">만화책 댓글 시스템</h1>
          <p className="text-gray-600">팝아트 스타일의 강렬한 댓글 UI</p>
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

        {/* 만화책 스타일 */}
        <div className="mb-16">
          <div className="bg-gradient-to-b from-blue-100 to-purple-100 p-8 rounded-3xl border-4 border-black relative overflow-hidden">
            
            <div className="absolute top-4 left-4 text-6xl font-black text-yellow-400 opacity-20 transform -rotate-12">COMMENTS!</div>
            <div className="absolute bottom-4 right-4 text-4xl font-black text-red-400 opacity-20 transform rotate-12">CHAT!</div>

            {/* 헤더 */}
            <div className="text-center mb-8 relative z-10">
              <div className="inline-block bg-yellow-300 p-4 rounded-2xl border-4 border-black shadow-[8px_8px_0px_0px_#000] transform -rotate-1">
                <h3 className="text-2xl font-black text-black mb-1">💬 COMMENT ZONE! 💬</h3>
                <p className="text-black font-bold text-sm">Share your thoughts with POWER!</p>
              </div>
              
              {/* 정렬 옵션 */}
              <div className="mt-6">
                <div className="inline-flex bg-white rounded-xl border-4 border-black shadow-[4px_4px_0px_0px_#000] p-1 transform rotate-1">
                  <button
                    onClick={() => setSortOption('likes')}
                    className={`px-4 py-2 rounded-lg font-black text-sm transition-all ${
                      sortOption === 'likes'
                        ? 'bg-gradient-to-r from-red-400 to-orange-400 text-black border-2 border-black'
                        : 'text-black hover:bg-gray-100'
                    }`}
                  >
                    👍 좋아요순
                  </button>
                  <button
                    onClick={() => setSortOption('recent')}
                    className={`px-4 py-2 rounded-lg font-black text-sm transition-all ${
                      sortOption === 'recent'
                        ? 'bg-gradient-to-r from-blue-400 to-purple-400 text-black border-2 border-black'
                        : 'text-black hover:bg-gray-100'
                    }`}
                  >
                    🕒 최신순
                  </button>
                </div>
              </div>
            </div>

            {/* 댓글 입력창 */}
            <div className="bg-white p-6 rounded-2xl border-4 border-black shadow-[8px_8px_0px_0px_#000] mb-8 relative z-10">
              <div className="absolute -top-8 left-4 bg-white border-2 border-black rounded-lg px-3 py-1">
                <div className="text-xs font-bold text-black">NEW COMMENT!</div>
                <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black"></div>
              </div>

              {!isLoggedIn && (
                <div className="mb-4">
                  <input
                    type="text"
                    placeholder="YOUR HERO NAME..."
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    className="w-full p-3 border-2 border-black rounded-lg focus:outline-none focus:shadow-[4px_4px_0px_0px_#000] font-bold"
                  />
                </div>
              )}
              
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full border-4 border-black flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <textarea
                    placeholder="UNLEASH YOUR THOUGHTS!"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="w-full p-4 border-2 border-black rounded-lg resize-none focus:outline-none focus:shadow-[4px_4px_0px_0px_#000] font-bold"
                    rows={4}
                  />
                  <div className="flex justify-between items-center mt-3">
                    <div className="flex gap-2">
                      <span className="text-black font-bold text-sm">💥 {newComment.length}/500</span>
                    </div>
                    <button
                      onClick={handleSubmitComment}
                      disabled={!newComment.trim() || (!isLoggedIn && !guestName.trim())}
                      className="px-6 py-3 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-2xl border-4 border-black shadow-[4px_4px_0px_0px_#000] hover:shadow-[2px_2px_0px_0px_#000] hover:translate-x-1 hover:translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-black"
                    >
                      🚀 SEND!
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 댓글 목록 */}
            <div className="space-y-6 relative z-10">
              {currentComments.map((comment) => (
                <div key={comment.id} className="bg-white p-6 rounded-2xl border-4 border-black shadow-[8px_8px_0px_0px_#000]">
                  <div className="flex items-start gap-4">
                    <div className="relative">
                      <img
                        src={comment.author.avatar}
                        alt={comment.author.name}
                        className="w-12 h-12 rounded-full border-4 border-black object-cover"
                      />
                      {comment.author.isVerified && (
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full border-2 border-black flex items-center justify-center">
                          <Crown className="w-3 h-3 text-black" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-black text-black">{comment.author.name}</h4>
                        <span className={`px-3 py-1 rounded-full text-xs font-black border-2 border-black ${
                          comment.author.level === 'VIP' ? 'bg-yellow-300 text-black' :
                          comment.author.level === 'Gold' ? 'bg-orange-300 text-black' :
                          comment.author.level === 'Bronze' ? 'bg-amber-300 text-black' :
                          'bg-gray-300 text-black'
                        }`}>
                          {comment.author.level}
                        </span>
                        <span className="text-purple-600 font-bold text-sm">⏰ {comment.timestamp}</span>
                      </div>
                      
                      {editingComment === comment.id ? (
                        <div className="mb-4">
                          <textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="w-full p-3 border-2 border-black rounded-lg resize-none focus:outline-none focus:shadow-[4px_4px_0px_0px_#000] font-bold"
                            rows={3}
                          />
                          <div className="flex gap-2 mt-2">
                            <button
                              onClick={() => handleSaveEdit(comment.id)}
                              className="px-4 py-2 bg-green-400 text-black rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_#000] hover:shadow-[1px_1px_0px_0px_#000] hover:translate-x-0.5 hover:translate-y-0.5 text-sm font-black transition-all"
                            >
                              💾 SAVE!
                            </button>
                            <button
                              onClick={() => setEditingComment(null)}
                              className="px-4 py-2 bg-gray-400 text-black rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_#000] hover:shadow-[1px_1px_0px_0px_#000] hover:translate-x-0.5 hover:translate-y-0.5 text-sm font-black transition-all"
                            >
                              ❌ CANCEL!
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-black font-bold mb-4 leading-relaxed">{comment.content}</p>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <button
                            onClick={() => handleLike(comment.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 border-black font-black transition-all ${
                              comment.isLiked 
                                ? 'bg-red-400 text-black shadow-[4px_4px_0px_0px_#000]' 
                                : 'bg-white text-black hover:bg-red-100 shadow-[2px_2px_0px_0px_#000]'
                            }`}
                          >
                            <Heart className={`w-4 h-4 ${comment.isLiked ? 'fill-current' : ''}`} />
                            <span>{comment.likes}</span>
                          </button>
                          
                          <button 
                            onClick={() => setReplyingTo(comment.id)}
                            className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-400 text-black border-2 border-black shadow-[2px_2px_0px_0px_#000] hover:shadow-[1px_1px_0px_0px_#000] hover:translate-x-0.5 hover:translate-y-0.5 font-black transition-all"
                          >
                            <Reply className="w-4 h-4" />
                            <span>답글 {comment.replies?.length || 0}</span>
                          </button>
                          
                          <button
                            onClick={() => handleReport(comment.id)}
                            className="flex items-center gap-2 px-4 py-2 rounded-full bg-purple-400 text-black border-2 border-black shadow-[2px_2px_0px_0px_#000] hover:shadow-[1px_1px_0px_0px_#000] hover:translate-x-0.5 hover:translate-y-0.5 font-black transition-all"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <span>신고</span>
                          </button>
                        </div>
                        
                        {comment.isOwner && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEditComment(comment.id)}
                              className="p-2 text-black hover:bg-yellow-300 rounded-lg border-2 border-black transition-colors"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteComment(comment.id)}
                              className="p-2 text-black hover:bg-red-300 rounded-lg border-2 border-black transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                      
                      {/* 답글 입력 폼 */}
                      {replyingTo === comment.id && (
                        <div className="mt-4 ml-8 bg-white p-4 rounded-xl border-4 border-black shadow-[4px_4px_0px_0px_#000] transform rotate-1">
                          <div className="absolute -top-6 left-4 bg-white border-2 border-black rounded-lg px-3 py-1">
                            <div className="text-xs font-bold text-black">REPLY!</div>
                            <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black"></div>
                          </div>
                          
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-green-500 rounded-full border-2 border-black flex items-center justify-center">
                              <User className="w-4 h-4 text-white" />
                            </div>
                            <div className="flex-1">
                              {!isLoggedIn && (
                                <input
                                  type="text"
                                  placeholder="YOUR NAME..."
                                  value={guestName}
                                  onChange={(e) => setGuestName(e.target.value)}
                                  className="w-full p-2 mb-2 border-2 border-black rounded-lg focus:outline-none focus:shadow-[2px_2px_0px_0px_#000] font-bold text-sm"
                                />
                              )}
                              <textarea
                                placeholder="YOUR REPLY..."
                                value={replyContent}
                                onChange={(e) => setReplyContent(e.target.value)}
                                className="w-full p-2 border-2 border-black rounded-lg resize-none focus:outline-none focus:shadow-[2px_2px_0px_0px_#000] font-bold text-sm"
                                rows={2}
                              />
                              <div className="flex justify-between items-center mt-2">
                                <button
                                  onClick={() => setReplyingTo(null)}
                                  className="text-black font-bold text-sm hover:text-red-500"
                                >
                                  CANCEL
                                </button>
                                <button
                                  onClick={() => handleSubmitReply(comment.id)}
                                  disabled={!replyContent.trim() || (!isLoggedIn && !guestName.trim())}
                                  className="px-3 py-1 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_#000] hover:shadow-[1px_1px_0px_0px_#000] hover:translate-x-0.5 hover:translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-black"
                                >
                                  SEND REPLY!
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* 답글 목록 */}
                      {comment.replies && comment.replies.length > 0 && (
                        <div className="mt-4 ml-8 space-y-4">
                          {comment.replies.map((reply, replyIndex) => (
                            <div key={reply.id} className={`bg-white p-4 rounded-xl border-4 border-black shadow-[4px_4px_0px_0px_#000] ${
                              replyIndex % 2 === 0 ? 'transform rotate-1' : 'transform -rotate-1'
                            }`}>
                              <div className="flex items-start gap-3">
                                <div className="relative">
                                  <img
                                    src={reply.author.avatar}
                                    alt={reply.author.name}
                                    className="w-8 h-8 rounded-full border-2 border-black object-cover"
                                  />
                                  {reply.author.isVerified && (
                                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full border-2 border-black flex items-center justify-center">
                                      <Crown className="w-2 h-2 text-black" />
                                    </div>
                                  )}
                                </div>
                                
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                                    <h4 className="font-black text-black text-sm">{reply.author.name}</h4>
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-black border-2 border-black ${
                                      reply.author.level === 'VIP' ? 'bg-yellow-300 text-black' :
                                      reply.author.level === 'Gold' ? 'bg-orange-300 text-black' :
                                      reply.author.level === 'Bronze' ? 'bg-amber-300 text-black' :
                                      'bg-gray-300 text-black'
                                    }`}>
                                      {reply.author.level}
                                    </span>
                                    <span className="text-purple-600 font-bold text-xs">⏰ {reply.timestamp}</span>
                                  </div>
                                  
                                  {editingReply && editingReply.commentId === comment.id && editingReply.replyId === reply.id ? (
                                    <div className="mb-2">
                                      <textarea
                                        value={editReplyContent}
                                        onChange={(e) => setEditReplyContent(e.target.value)}
                                        className="w-full p-2 border-2 border-black rounded-lg resize-none focus:outline-none focus:shadow-[2px_2px_0px_0px_#000] font-bold text-sm"
                                        rows={2}
                                      />
                                      <div className="flex gap-2 mt-2">
                                        <button
                                          onClick={() => handleSaveReplyEdit(comment.id, reply.id)}
                                          className="px-3 py-1 bg-green-400 text-black rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_#000] hover:shadow-[1px_1px_0px_0px_#000] hover:translate-x-0.5 hover:translate-y-0.5 text-xs font-black transition-all"
                                        >
                                          💾 SAVE!
                                        </button>
                                        <button
                                          onClick={() => setEditingReply(null)}
                                          className="px-3 py-1 bg-gray-400 text-black rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_#000] hover:shadow-[1px_1px_0px_0px_#000] hover:translate-x-0.5 hover:translate-y-0.5 text-xs font-black transition-all"
                                        >
                                          ❌ CANCEL!
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <p className="text-black font-bold text-sm mb-2">{reply.content}</p>
                                  )}
                                  
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() => handleLike(comment.id, reply.id)}
                                        className={`flex items-center gap-1 px-2 py-1 rounded-full border-2 border-black font-black text-xs transition-all ${
                                          reply.isLiked 
                                            ? 'bg-red-400 text-black shadow-[2px_2px_0px_0px_#000]' 
                                            : 'bg-white text-black hover:bg-red-100 shadow-[1px_1px_0px_0px_#000]'
                                        }`}
                                      >
                                        <Heart className={`w-3 h-3 ${reply.isLiked ? 'fill-current' : ''}`} />
                                        <span>{reply.likes}</span>
                                      </button>
                                      
                                      <button
                                        onClick={() => handleReport(comment.id, reply.id)}
                                        className="flex items-center gap-1 px-2 py-1 rounded-full bg-purple-400 text-black border-2 border-black shadow-[1px_1px_0px_0px_#000] hover:shadow-[0px_0px_0px_0px_#000] hover:translate-x-0.5 hover:translate-y-0.5 font-black text-xs transition-all"
                                      >
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                        <span>신고</span>
                                      </button>
                                    </div>
                                    
                                    {reply.isOwner && (
                                      <div className="flex items-center gap-1">
                                        <button 
                                          onClick={() => handleEditReply(comment.id, reply.id)}
                                          className="p-1 text-black hover:bg-yellow-300 rounded-lg border-2 border-black transition-colors"
                                        >
                                          <Edit3 className="w-3 h-3" />
                                        </button>
                                        <button 
                                          onClick={() => handleDeleteReply(comment.id, reply.id)}
                                          className="p-1 text-black hover:bg-red-300 rounded-lg border-2 border-black transition-colors"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </button>
                                      </div>
                                    )}
                                  </div>
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
            {totalPages > 1 && (
              <div className="flex justify-center mt-8 relative z-10">
                <div className="flex items-center gap-2 bg-white rounded-2xl p-4 border-4 border-black shadow-[8px_8px_0px_0px_#000]">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 text-black hover:bg-blue-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-black"
                  >
                    ← PREV!
                  </button>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-10 h-10 rounded-lg font-black transition-all border-2 border-black ${
                        currentPage === page
                          ? 'bg-yellow-400 text-black shadow-[4px_4px_0px_0px_#000]'
                          : 'text-black hover:bg-gray-200'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 text-black hover:bg-blue-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-black"
                  >
                    NEXT! →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}