'use client';

import { useState, useEffect } from 'react';
import { Heart, MessageCircle, Edit3, Trash2, Send, User, Reply } from 'lucide-react';

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

export default function TournamentCommentChatPage() {
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
                  <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
                    🔥 Hot Topic
                  </span>
                </div>
              </div>
            </div>

            {/* 채팅 메시지 영역 */}
            <div className="bg-white min-h-96 max-h-96 overflow-y-auto p-4 space-y-3 border-x-2 border-orange-200">
              {currentComments.map((comment, index) => (
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
                          
                          <button className="flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-gray-500 hover:bg-blue-50 hover:text-blue-600 text-xs transition-colors">
                            <Reply className="w-3 h-3" />
                            <span>{comment.replies}</span>
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
                      className="px-4 py-2 bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-full hover:from-orange-600 hover:to-yellow-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
                    >
                      <Send className="w-4 h-4" />
                      Send
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 온라인 사용자 목록 */}
            <div className="bg-white p-4 border-t border-orange-200">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Online Users ({currentComments.length})
              </h4>
              <div className="flex flex-wrap gap-2">
                {currentComments.map((comment) => (
                  <div key={comment.id} className="flex items-center gap-2 bg-orange-50 rounded-full px-3 py-1">
                    <img
                      src={comment.author.avatar}
                      alt={comment.author.name}
                      className="w-5 h-5 rounded-full object-cover"
                    />
                    <span className="text-sm text-gray-700">{comment.author.name}</span>
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  </div>
                ))}
              </div>
            </div>

            {/* 페이지네이션 */}
            {totalPages > 1 && (
              <div className="flex justify-center p-4 bg-white border-t border-orange-200">
                <div className="flex items-center gap-2 bg-orange-50 rounded-full p-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 text-orange-600 hover:bg-orange-100 rounded-full transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ← Load Earlier
                  </button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-8 h-8 rounded-full text-sm transition-all ${
                          currentPage === page
                            ? 'bg-gradient-to-r from-orange-500 to-yellow-500 text-white shadow-md'
                            : 'text-gray-600 hover:bg-orange-100'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 text-orange-600 hover:bg-orange-100 rounded-full transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Load More →
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