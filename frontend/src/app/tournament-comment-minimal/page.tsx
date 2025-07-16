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

export default function TournamentCommentMinimalPage() {
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">미니멀 엘레강스 댓글 시스템</h1>
          <p className="text-gray-600">깔끔하고 세련된 댓글 UI</p>
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

        {/* 미니멀 엘레강스 스타일 */}
        <div className="mb-16">
          <div className="bg-white p-12 rounded-3xl shadow-2xl border border-gray-100">
            
            {/* 헤더 */}
            <div className="text-center mb-12">
              <div className="w-16 h-1 bg-gray-900 mx-auto mb-6"></div>
              <h3 className="text-3xl font-light text-gray-900 mb-2">Comments</h3>
              <p className="text-gray-500 font-light">Share your perspective</p>
              <div className="w-16 h-1 bg-gray-900 mx-auto mt-6"></div>
            </div>

            {/* 댓글 입력창 */}
            <div className="border-t border-gray-200 pt-8 mb-12">
              {!isLoggedIn && (
                <div className="mb-6">
                  <input
                    type="text"
                    placeholder="Name"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    className="w-full p-4 border-b border-gray-200 focus:border-gray-900 focus:outline-none bg-transparent text-gray-900 placeholder-gray-400 font-light"
                  />
                </div>
              )}
              
              <div className="flex gap-6">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-gray-400" />
                </div>
                <div className="flex-1">
                  <textarea
                    placeholder="Write your comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="w-full p-0 border-none resize-none focus:outline-none bg-transparent text-gray-900 placeholder-gray-400 font-light text-lg leading-relaxed"
                    rows={4}
                  />
                  <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-100">
                    <span className="text-gray-400 text-sm font-light">{newComment.length} characters</span>
                    <button
                      onClick={handleSubmitComment}
                      disabled={!newComment.trim() || (!isLoggedIn && !guestName.trim())}
                      className="px-8 py-3 bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-light tracking-wide"
                    >
                      Publish
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 댓글 목록 */}
            <div className="space-y-12">
              {currentComments.map((comment, index) => (
                <div key={comment.id} className="border-t border-gray-100 pt-8">
                  <div className="flex gap-6">
                    <div className="relative">
                      <img
                        src={comment.author.avatar}
                        alt={comment.author.name}
                        className="w-12 h-12 rounded-full object-cover grayscale hover:grayscale-0 transition-all duration-300"
                      />
                      {comment.author.isVerified && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-gray-900 rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-4">
                        <h4 className="font-medium text-gray-900">{comment.author.name}</h4>
                        <span className="text-xs text-gray-400 uppercase tracking-wider font-light">
                          {comment.author.level}
                        </span>
                        <span className="text-gray-400 text-sm font-light">{comment.timestamp}</span>
                      </div>
                      
                      {editingComment === comment.id ? (
                        <div className="mb-6">
                          <textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="w-full p-0 border-none resize-none focus:outline-none bg-transparent text-gray-900 font-light text-lg leading-relaxed"
                            rows={3}
                          />
                          <div className="flex gap-4 mt-4 pt-4 border-t border-gray-100">
                            <button
                              onClick={() => handleSaveEdit(comment.id)}
                              className="px-6 py-2 bg-gray-900 text-white hover:bg-gray-800 text-sm font-light tracking-wide transition-colors"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingComment(null)}
                              className="px-6 py-2 border border-gray-300 text-gray-600 hover:bg-gray-50 text-sm font-light tracking-wide transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-gray-700 mb-6 leading-relaxed font-light text-lg">{comment.content}</p>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-6">
                          <button
                            onClick={() => handleLike(comment.id)}
                            className={`flex items-center gap-2 text-sm font-light transition-colors ${
                              comment.isLiked 
                                ? 'text-gray-900' 
                                : 'text-gray-400 hover:text-gray-600'
                            }`}
                          >
                            <Heart className={`w-4 h-4 ${comment.isLiked ? 'fill-current' : ''}`} />
                            <span>{comment.likes}</span>
                          </button>
                          
                          <button className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600 font-light transition-colors">
                            <Reply className="w-4 h-4" />
                            <span>Reply</span>
                          </button>
                          
                          {comment.replies > 0 && (
                            <span className="text-gray-400 text-sm font-light">{comment.replies} replies</span>
                          )}
                        </div>
                        
                        {comment.isOwner && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEditComment(comment.id)}
                              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteComment(comment.id)}
                              className="p-2 text-gray-400 hover:text-red-500 transition-colors"
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
              <div className="flex justify-center mt-16 pt-8 border-t border-gray-100">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-light"
                  >
                    Previous
                  </button>
                  
                  <div className="flex items-center gap-1 mx-8">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-10 h-10 text-sm font-light transition-colors ${
                          currentPage === page
                            ? 'text-gray-900 border-b-2 border-gray-900'
                            : 'text-gray-400 hover:text-gray-600'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                  
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-light"
                  >
                    Next
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