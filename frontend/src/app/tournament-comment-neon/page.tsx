'use client';

import { useState, useEffect } from 'react';
import { Heart, MessageCircle, Edit3, Trash2, Send, User, ChevronLeft, ChevronRight, Reply, Smile, Camera, Crown } from 'lucide-react';

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

  const [editingReply, setEditingReply] = useState<{commentId: number, replyId: number} | null>(null);
  const [editReplyContent, setEditReplyContent] = useState('');

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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">네온 사이버 댓글 시스템</h1>
          <p className="text-gray-600">미래적이고 사이버펑크한 댓글 UI</p>
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

        {/* 네온 사이버 스타일 */}
        <div className="mb-16">
          <div className="bg-black rounded-3xl p-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 via-pink-900/30 to-blue-900/30"></div>
            
            <div className="relative z-10">
              {/* 헤더 */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-4 bg-gray-800/30 backdrop-blur-sm rounded-2xl px-8 py-4 border border-gray-700 mb-4">
                  <MessageCircle className="w-8 h-8 text-cyan-400" />
                  <div className="text-2xl font-bold text-white font-mono">COMMENT ZONE</div>
                  <MessageCircle className="w-8 h-8 text-cyan-400" />
                </div>
                <p className="text-cyan-400 font-mono text-sm">Share your thoughts about the tournament</p>
                
                {/* 정렬 옵션 */}
                <div className="flex justify-center mt-4">
                  <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-1 inline-flex">
                    <button
                      onClick={() => setSortOption('likes')}
                      className={`px-4 py-2 rounded-lg font-mono text-sm transition-all ${
                        sortOption === 'likes'
                          ? 'bg-cyan-400 text-black font-bold'
                          : 'text-gray-300 hover:text-white'
                      }`}
                    >
                      좋아요순
                    </button>
                    <button
                      onClick={() => setSortOption('recent')}
                      className={`px-4 py-2 rounded-lg font-mono text-sm transition-all ${
                        sortOption === 'recent'
                          ? 'bg-cyan-400 text-black font-bold'
                          : 'text-gray-300 hover:text-white'
                      }`}
                    >
                      최신순
                    </button>
                  </div>
                </div>
              </div>

              {/* 댓글 입력창 */}
              <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-6 border border-gray-700 mb-8">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-cyan-400 to-purple-400 flex items-center justify-center">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    {!isLoggedIn && (
                      <input
                        type="text"
                        placeholder="ENTER YOUR NAME..."
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        className="w-full bg-gray-700/50 border border-gray-600 rounded-xl px-4 py-2 text-white font-mono placeholder-gray-400 mb-3 focus:outline-none focus:border-cyan-400"
                      />
                    )}
                    <textarea
                      placeholder="SHARE YOUR THOUGHTS..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="w-full bg-gray-700/50 border border-gray-600 rounded-xl px-4 py-3 text-white font-mono placeholder-gray-400 resize-none focus:outline-none focus:border-cyan-400"
                      rows={3}
                    />
                    <div className="flex justify-between items-center mt-3">
                      <div className="flex gap-2">
                        <button className="p-2 rounded-lg bg-gray-700/50 border border-gray-600 text-gray-400 hover:text-cyan-400 hover:border-cyan-400 transition-colors">
                          <Smile className="w-4 h-4" />
                        </button>
                        <button className="p-2 rounded-lg bg-gray-700/50 border border-gray-600 text-gray-400 hover:text-pink-400 hover:border-pink-400 transition-colors">
                          <Camera className="w-4 h-4" />
                        </button>
                      </div>
                      <button
                        onClick={handleSubmitComment}
                        disabled={!newComment.trim() || (!isLoggedIn && !guestName.trim())}
                        className="px-6 py-2 bg-gradient-to-r from-cyan-400 to-purple-400 text-black font-mono font-bold rounded-xl hover:from-cyan-300 hover:to-purple-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        <Send className="w-4 h-4 inline mr-2" />
                        SEND
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* 댓글 목록 */}
              <div className="space-y-6">
                {currentComments.map((comment) => (
                  <div key={comment.id} className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
                    <div className="flex items-start gap-4">
                      <div className="relative">
                        <img
                          src={comment.author.avatar}
                          alt={comment.author.name}
                          className="w-12 h-12 rounded-full border-2 border-cyan-400"
                        />
                        {comment.author.isVerified && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center">
                            <Crown className="w-3 h-3 text-black" />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-cyan-400 font-mono font-bold">{comment.author.name}</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-mono ${
                            comment.author.level === 'VIP' ? 'bg-yellow-400/20 text-yellow-400 border border-yellow-400' :
                            comment.author.level === 'Gold' ? 'bg-orange-400/20 text-orange-400 border border-orange-400' :
                            comment.author.level === 'Bronze' ? 'bg-amber-600/20 text-amber-400 border border-amber-400' :
                            'bg-gray-600/20 text-gray-400 border border-gray-600'
                          }`}>
                            {comment.author.level}
                          </span>
                          <span className="text-gray-400 font-mono text-sm">{comment.timestamp}</span>
                        </div>
                        
                        {editingComment === comment.id ? (
                          <div className="mb-4">
                            <textarea
                              value={editContent}
                              onChange={(e) => setEditContent(e.target.value)}
                              className="w-full bg-gray-700/50 border border-gray-600 rounded-xl px-4 py-3 text-white font-mono resize-none focus:outline-none focus:border-cyan-400"
                              rows={3}
                            />
                            <div className="flex gap-2 mt-2">
                              <button
                                onClick={() => handleSaveEdit(comment.id)}
                                className="px-4 py-2 bg-cyan-400 text-black font-mono font-bold rounded-lg hover:bg-cyan-300 transition-colors"
                              >
                                SAVE
                              </button>
                              <button
                                onClick={() => setEditingComment(null)}
                                className="px-4 py-2 bg-gray-600 text-white font-mono font-bold rounded-lg hover:bg-gray-500 transition-colors"
                              >
                                CANCEL
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-white font-mono mb-4 leading-relaxed">{comment.content}</p>
                        )}
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <button
                              onClick={() => handleLike(comment.id)}
                              className={`flex items-center gap-2 px-3 py-1 rounded-lg font-mono transition-all ${
                                comment.isLiked 
                                  ? 'bg-pink-400/20 text-pink-400 border border-pink-400' 
                                  : 'bg-gray-700/50 text-gray-400 border border-gray-600 hover:text-pink-400 hover:border-pink-400'
                              }`}
                            >
                              <Heart className={`w-4 h-4 ${comment.isLiked ? 'fill-current' : ''}`} />
                              <span>{comment.likes}</span>
                            </button>
                            
                            <button
                              onClick={() => setReplyingTo(comment.id)}
                              className="flex items-center gap-2 px-3 py-1 rounded-lg bg-gray-700/50 text-gray-400 border border-gray-600 hover:text-cyan-400 hover:border-cyan-400 font-mono transition-all"
                            >
                              <Reply className="w-4 h-4" />
                              <span>REPLY</span>
                            </button>
                            
                            <button
                              onClick={() => handleReport(comment.id)}
                              className="flex items-center gap-2 px-3 py-1 rounded-lg bg-gray-700/50 text-gray-400 border border-gray-600 hover:text-red-400 hover:border-red-400 font-mono transition-all"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                              </svg>
                              <span>REPORT</span>
                            </button>
                          </div>
                          
                          {comment.isOwner && (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleEditComment(comment.id)}
                                className="p-2 rounded-lg bg-gray-700/50 text-gray-400 border border-gray-600 hover:text-yellow-400 hover:border-yellow-400 transition-all"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteComment(comment.id)}
                                className="p-2 rounded-lg bg-gray-700/50 text-gray-400 border border-gray-600 hover:text-red-400 hover:border-red-400 transition-all"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                        
                        {/* 답글 입력 폼 */}
                        {replyingTo === comment.id && (
                          <div className="mt-4 ml-6 bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700">
                            <div className="flex items-start gap-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-cyan-400 to-purple-400 flex items-center justify-center">
                                <User className="w-4 h-4 text-white" />
                              </div>
                              <div className="flex-1">
                                {!isLoggedIn && (
                                  <input
                                    type="text"
                                    placeholder="YOUR NAME..."
                                    value={guestName}
                                    onChange={(e) => setGuestName(e.target.value)}
                                    className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-1 text-white font-mono text-sm placeholder-gray-400 mb-2 focus:outline-none focus:border-cyan-400"
                                  />
                                )}
                                <textarea
                                  placeholder="WRITE A REPLY..."
                                  value={replyContent}
                                  onChange={(e) => setReplyContent(e.target.value)}
                                  className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-white font-mono text-sm placeholder-gray-400 resize-none focus:outline-none focus:border-cyan-400"
                                  rows={2}
                                />
                                <div className="flex justify-between items-center mt-2">
                                  <button
                                    onClick={() => setReplyingTo(null)}
                                    className="px-3 py-1 text-gray-400 font-mono text-sm hover:text-white transition-colors"
                                  >
                                    CANCEL
                                  </button>
                                  <button
                                    onClick={() => handleSubmitReply(comment.id)}
                                    disabled={!replyContent.trim() || (!isLoggedIn && !guestName.trim())}
                                    className="px-4 py-1 bg-gradient-to-r from-cyan-400 to-purple-400 text-black font-mono font-bold text-sm rounded-lg hover:from-cyan-300 hover:to-purple-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                  >
                                    REPLY
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {/* 답글 목록 */}
                        {comment.replies && comment.replies.length > 0 && (
                          <div className="mt-4 ml-6 space-y-4">
                            {comment.replies.map(reply => (
                              <div key={reply.id} className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700">
                                <div className="flex items-start gap-3">
                                  <div className="relative">
                                    <img
                                      src={reply.author.avatar}
                                      alt={reply.author.name}
                                      className="w-8 h-8 rounded-full border-2 border-cyan-400"
                                    />
                                    {reply.author.isVerified && (
                                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center">
                                        <Crown className="w-2 h-2 text-black" />
                                      </div>
                                    )}
                                  </div>
                                  
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                      <span className="text-cyan-400 font-mono font-bold text-sm">{reply.author.name}</span>
                                      <span className={`px-1.5 py-0.5 rounded-full text-xs font-mono ${
                                        reply.author.level === 'VIP' ? 'bg-yellow-400/20 text-yellow-400 border border-yellow-400' :
                                        reply.author.level === 'Gold' ? 'bg-orange-400/20 text-orange-400 border border-orange-400' :
                                        reply.author.level === 'Bronze' ? 'bg-amber-600/20 text-amber-400 border border-amber-400' :
                                        'bg-gray-600/20 text-gray-400 border border-gray-600'
                                      }`}>
                                        {reply.author.level}
                                      </span>
                                      <span className="text-gray-400 font-mono text-xs">{reply.timestamp}</span>
                                    </div>
                                    
                                    {editingReply && editingReply.commentId === comment.id && editingReply.replyId === reply.id ? (
                                      <div className="mb-2">
                                        <textarea
                                          value={editReplyContent}
                                          onChange={(e) => setEditReplyContent(e.target.value)}
                                          className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-white font-mono text-sm resize-none focus:outline-none focus:border-cyan-400"
                                          rows={2}
                                        />
                                        <div className="flex gap-2 mt-2">
                                          <button
                                            onClick={() => handleSaveReplyEdit(comment.id, reply.id)}
                                            className="px-3 py-1 bg-cyan-400 text-black font-mono font-bold text-xs rounded-lg hover:bg-cyan-300 transition-colors"
                                          >
                                            SAVE
                                          </button>
                                          <button
                                            onClick={() => setEditingReply(null)}
                                            className="px-3 py-1 bg-gray-600 text-white font-mono font-bold text-xs rounded-lg hover:bg-gray-500 transition-colors"
                                          >
                                            CANCEL
                                          </button>
                                        </div>
                                      </div>
                                    ) : (
                                      <p className="text-white font-mono text-sm mb-2 leading-relaxed">{reply.content}</p>
                                    )}
                                    
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-3">
                                        <button
                                          onClick={() => handleLike(comment.id, reply.id)}
                                          className={`flex items-center gap-1 px-2 py-1 rounded-lg font-mono text-xs transition-all ${
                                            reply.isLiked 
                                              ? 'bg-pink-400/20 text-pink-400 border border-pink-400' 
                                              : 'bg-gray-700/50 text-gray-400 border border-gray-600 hover:text-pink-400 hover:border-pink-400'
                                          }`}
                                        >
                                          <Heart className={`w-3 h-3 ${reply.isLiked ? 'fill-current' : ''}`} />
                                          <span>{reply.likes}</span>
                                        </button>
                                        
                                        <button
                                          onClick={() => handleReport(comment.id, reply.id)}
                                          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-gray-700/50 text-gray-400 border border-gray-600 hover:text-red-400 hover:border-red-400 font-mono text-xs transition-all"
                                        >
                                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                          </svg>
                                          <span>REPORT</span>
                                        </button>
                                      </div>
                                      
                                      {reply.isOwner && (
                                        <div className="flex items-center gap-1">
                                          <button 
                                            onClick={() => handleEditReply(comment.id, reply.id)}
                                            className="p-1 rounded-lg bg-gray-700/50 text-gray-400 border border-gray-600 hover:text-yellow-400 hover:border-yellow-400 transition-all"
                                          >
                                            <Edit3 className="w-3 h-3" />
                                          </button>
                                          <button 
                                            onClick={() => handleDeleteReply(comment.id, reply.id)}
                                            className="p-1 rounded-lg bg-gray-700/50 text-gray-400 border border-gray-600 hover:text-red-400 hover:border-red-400 transition-all"
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
                <div className="flex justify-center items-center gap-4 mt-8">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="p-3 rounded-xl bg-gray-800/30 border border-gray-700 text-cyan-400 hover:bg-gray-700/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  
                  <div className="flex gap-2">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-10 h-10 rounded-xl font-mono font-bold transition-all ${
                          currentPage === page
                            ? 'bg-cyan-400 text-black'
                            : 'bg-gray-800/30 border border-gray-700 text-cyan-400 hover:bg-gray-700/50'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                  
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="p-3 rounded-xl bg-gray-800/30 border border-gray-700 text-cyan-400 hover:bg-gray-700/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}