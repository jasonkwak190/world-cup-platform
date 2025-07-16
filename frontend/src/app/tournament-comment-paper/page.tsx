'use client';

import { useState, useEffect } from 'react';
import { Heart, Edit3, Trash2, User, Reply } from 'lucide-react';

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

export default function TournamentCommentPaperPage() {
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">종이 찢기 댓글 시스템</h1>
          <p className="text-gray-600">아날로그 느낌의 따뜻한 댓글 UI</p>
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

        {/* 종이 찢기 스타일 */}
        <div className="mb-16">
          <div className="bg-amber-50 p-8 relative">
            
            {/* 헤더 */}
            <div className="text-center mb-8">
              <div className="inline-block bg-white p-4 rounded-lg shadow-lg border-2 border-dashed border-amber-400 transform -rotate-1">
                <h3 className="text-2xl font-bold text-amber-800 mb-1">💬 토너먼트 댓글 💬</h3>
                <p className="text-amber-600 text-sm">여러분의 소중한 의견을 들려주세요</p>
              </div>
            </div>

            {/* 댓글 입력창 */}
            <div className="bg-white p-6 rounded-lg shadow-xl border-2 border-dashed border-gray-300 relative transform rotate-1 mb-8">
              <div className="absolute -top-2 left-4 w-8 h-4 bg-white transform rotate-12"></div>
              <div className="absolute -top-1 right-8 w-6 h-3 bg-white transform -rotate-12"></div>
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-16 h-6 bg-yellow-200 opacity-70 rounded-sm border border-yellow-300"></div>

              <div className="relative">
                {!isLoggedIn && (
                  <div className="mb-4">
                    <label className="block text-amber-800 font-semibold mb-2">닉네임</label>
                    <input
                      type="text"
                      placeholder="닉네임을 입력하세요"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      className="w-full p-3 border-2 border-dashed border-amber-300 rounded-lg focus:border-amber-500 focus:outline-none bg-amber-50"
                    />
                  </div>
                )}
                
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-amber-200 rounded-full flex items-center justify-center border-2 border-dashed border-amber-400">
                    <User className="w-6 h-6 text-amber-700" />
                  </div>
                  <div className="flex-1">
                    <textarea
                      placeholder="댓글을 작성해주세요..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="w-full p-4 border-2 border-dashed border-amber-300 rounded-lg resize-none focus:border-amber-500 focus:outline-none bg-amber-50"
                      rows={4}
                    />
                    <div className="flex justify-between items-center mt-3">
                      <div className="flex gap-2">
                        <span className="text-amber-600 text-sm">📝 {newComment.length}/500자</span>
                      </div>
                      <button
                        onClick={handleSubmitComment}
                        disabled={!newComment.trim() || (!isLoggedIn && !guestName.trim())}
                        className="px-6 py-3 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold shadow-md"
                      >
                        ✍️ 댓글 작성
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 댓글 목록 */}
            <div className="space-y-6">
              {currentComments.map((comment, index) => (
                <div key={comment.id} className={`bg-white p-6 rounded-lg shadow-md border-2 border-dashed border-gray-300 relative ${
                  index % 2 === 0 ? 'transform rotate-1' : 'transform -rotate-1'
                }`}>
                  {/* 테이프 효과 */}
                  <div className={`absolute -top-3 ${index % 2 === 0 ? 'left-8' : 'right-8'} w-16 h-6 bg-yellow-200 opacity-70 rounded-sm border border-yellow-300 transform ${index % 2 === 0 ? 'rotate-12' : '-rotate-12'}`}></div>
                  
                  <div className="flex items-start gap-4">
                    <div className="relative">
                      <img
                        src={comment.author.avatar}
                        alt={comment.author.name}
                        className="w-12 h-12 rounded-full border-2 border-amber-300 object-cover"
                      />
                      {comment.author.isVerified && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">✓</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-bold text-gray-800">{comment.author.name}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          comment.author.level === 'VIP' ? 'bg-yellow-200 text-yellow-800' :
                          comment.author.level === 'Gold' ? 'bg-orange-200 text-orange-800' :
                          comment.author.level === 'Bronze' ? 'bg-amber-200 text-amber-800' :
                          'bg-gray-200 text-gray-800'
                        }`}>
                          {comment.author.level}
                        </span>
                        <span className="text-amber-600 text-sm">📅 {comment.timestamp}</span>
                      </div>
                      
                      {editingComment === comment.id ? (
                        <div className="mb-4">
                          <textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="w-full p-3 border-2 border-dashed border-amber-300 rounded-lg resize-none focus:border-amber-500 focus:outline-none bg-amber-50"
                            rows={3}
                          />
                          <div className="flex gap-2 mt-2">
                            <button
                              onClick={() => handleSaveEdit(comment.id)}
                              className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 text-sm font-semibold"
                            >
                              💾 저장
                            </button>
                            <button
                              onClick={() => setEditingComment(null)}
                              className="px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 text-sm font-semibold"
                            >
                              ❌ 취소
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-gray-700 mb-4 leading-relaxed">{comment.content}</p>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <button
                            onClick={() => handleLike(comment.id)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-full transition-all ${
                              comment.isLiked 
                                ? 'bg-red-100 text-red-600 border-2 border-dashed border-red-300' 
                                : 'bg-gray-100 text-gray-600 border-2 border-dashed border-gray-300 hover:bg-red-50'
                            }`}
                          >
                            <Heart className={`w-4 h-4 ${comment.isLiked ? 'fill-current' : ''}`} />
                            <span className="font-semibold">{comment.likes}</span>
                          </button>
                          
                          <button className="flex items-center gap-2 px-3 py-2 rounded-full bg-blue-100 text-blue-600 border-2 border-dashed border-blue-300 hover:bg-blue-200 transition-all">
                            <Reply className="w-4 h-4" />
                            <span className="font-semibold">답글 {comment.replies}</span>
                          </button>
                        </div>
                        
                        {comment.isOwner && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEditComment(comment.id)}
                              className="p-2 text-amber-600 hover:text-amber-800 hover:bg-amber-100 rounded-lg transition-colors"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteComment(comment.id)}
                              className="p-2 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-lg transition-colors"
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
              <div className="flex justify-center mt-8">
                <div className="bg-white p-4 rounded-lg shadow-lg border-2 border-dashed border-amber-400 transform rotate-1">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 text-amber-600 hover:bg-amber-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
                    >
                      ← 이전
                    </button>
                    
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-10 h-10 rounded-lg font-bold transition-all ${
                          currentPage === page
                            ? 'bg-amber-500 text-white shadow-md'
                            : 'text-amber-600 hover:bg-amber-100'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                    
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 text-amber-600 hover:bg-amber-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
                    >
                      다음 →
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}