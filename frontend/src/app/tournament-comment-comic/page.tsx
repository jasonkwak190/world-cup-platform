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
    likes: 24,
    replies: 3,
    isLiked: false,
    isOwner: false
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
    likes: 12,
    replies: 1,
    isLiked: true,
    isOwner: true
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
    likes: 8,
    replies: 0,
    isLiked: false,
    isOwner: false
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
  const [currentPage, setCurrentPage] = useState(1);
  const [commentsPerPage] = useState(20);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleLike = (commentId: number) => {
    setComments(prev => prev.map(comment => 
      comment.id === commentId 
        ? { 
            ...comment, 
            likes: comment.isLiked ? comment.likes - 1 : comment.likes + 1,
            isLiked: !comment.isLiked 
          }
        : comment
    ));
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
      likes: 0,
      replies: 0,
      isLiked: false,
      isOwner: true
    };

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

  const totalPages = Math.ceil(comments.length / commentsPerPage);
  const currentComments = comments.slice(
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
                          
                          <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-400 text-black border-2 border-black shadow-[2px_2px_0px_0px_#000] hover:shadow-[1px_1px_0px_0px_#000] hover:translate-x-0.5 hover:translate-y-0.5 font-black transition-all">
                            <Reply className="w-4 h-4" />
                            <span>{comment.replies}</span>
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