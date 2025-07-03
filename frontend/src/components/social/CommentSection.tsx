'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThumbsUp, ThumbsDown, MessageCircle, Clock, TrendingUp } from 'lucide-react';
import { Comment } from '@/types/game';

interface CommentSectionProps {
  winnerName: string;
  worldcupId?: string; // 월드컵 ID 추가
}

// Removed mock comments - using localStorage-based comments instead

type SortType = 'popular' | 'recent';

export default function CommentSection({ winnerName, worldcupId }: CommentSectionProps) {
  // localStorage에서 월드컵별 댓글 로드
  const getCommentsKey = (id: string) => `comments_${id}`;
  
  const loadComments = (): Comment[] => {
    if (!worldcupId) return [];
    
    try {
      const stored = localStorage.getItem(getCommentsKey(worldcupId));
      if (!stored) return [];
      
      const parsed = JSON.parse(stored);
      // localStorage에서 불러온 댓글의 createdAt을 Date 객체로 변환
      return parsed.map((comment: Omit<Comment, 'createdAt'> & { createdAt: string }) => ({
        ...comment,
        createdAt: new Date(comment.createdAt)
      }));
    } catch (error) {
      console.error('Failed to load comments:', error);
      return [];
    }
  };
  
  const saveComments = (comments: Comment[]) => {
    if (!worldcupId) return;
    
    try {
      localStorage.setItem(getCommentsKey(worldcupId), JSON.stringify(comments));
    } catch (error) {
      console.error('Failed to save comments:', error);
    }
  };
  
  const [comments, setComments] = useState<Comment[]>(loadComments());
  const [sortBy, setSortBy] = useState<SortType>('popular');
  const [newComment, setNewComment] = useState('');
  const [username, setUsername] = useState('');

  const handleLike = (commentId: string) => {
    const updatedComments = comments.map(comment =>
      comment.id === commentId
        ? {
            ...comment,
            likes: comment.isLiked ? comment.likes - 1 : comment.likes + 1,
            dislikes: comment.isDisliked ? comment.dislikes - 1 : comment.dislikes,
            isLiked: !comment.isLiked,
            isDisliked: false
          }
        : comment
    );
    setComments(updatedComments);
    saveComments(updatedComments);
  };

  const handleDislike = (commentId: string) => {
    const updatedComments = comments.map(comment =>
      comment.id === commentId
        ? {
            ...comment,
            dislikes: comment.isDisliked ? comment.dislikes - 1 : comment.dislikes + 1,
            likes: comment.isLiked ? comment.likes - 1 : comment.likes,
            isDisliked: !comment.isDisliked,
            isLiked: false
          }
        : comment
    );
    setComments(updatedComments);
    saveComments(updatedComments);
  };

  const handleSubmitComment = () => {
    if (!newComment.trim()) return;

    const comment: Comment = {
      id: Date.now().toString(),
      username: username.trim() || '익명',
      content: newComment,
      likes: 0,
      dislikes: 0,
      createdAt: new Date(),
      isLiked: false,
      isDisliked: false
    };

    const updatedComments = [comment, ...comments];
    setComments(updatedComments);
    saveComments(updatedComments);
    setNewComment('');
  };

  const sortedComments = [...comments].sort((a, b) => {
    if (sortBy === 'popular') {
      const aScore = a.likes - a.dislikes;
      const bScore = b.likes - b.dislikes;
      return bScore - aScore;
    } else {
      // 안전한 날짜 처리
      try {
        const aDate = typeof a.createdAt === 'string' ? new Date(a.createdAt) : a.createdAt;
        const bDate = typeof b.createdAt === 'string' ? new Date(b.createdAt) : b.createdAt;
        return bDate.getTime() - aDate.getTime();
      } catch (error) {
        console.warn('Date sorting error:', error);
        return 0;
      }
    }
  });

  const formatTimeAgo = (date: Date | string) => {
    try {
      const now = new Date();
      const targetDate = typeof date === 'string' ? new Date(date) : date;
      
      // 유효한 날짜인지 확인
      if (isNaN(targetDate.getTime())) {
        return '시간 정보 없음';
      }
      
      const diffInMinutes = Math.floor((now.getTime() - targetDate.getTime()) / (1000 * 60));
      
      if (diffInMinutes < 1) return '방금 전';
      if (diffInMinutes < 60) return `${diffInMinutes}분 전`;
      if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}시간 전`;
      return `${Math.floor(diffInMinutes / 1440)}일 전`;
    } catch (error) {
      console.warn('Date formatting error:', error);
      return '시간 정보 없음';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 2.0 }}
      className="mt-8 bg-white rounded-2xl p-6 shadow-lg"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <MessageCircle className="w-6 h-6 text-blue-600" />
          <h3 className="text-xl font-bold text-gray-900">댓글</h3>
          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm font-medium">
            {comments.length}
          </span>
        </div>
        
        {/* Sort Buttons */}
        <div className="flex space-x-2">
          <button
            onClick={() => setSortBy('popular')}
            className={`flex items-center space-x-1 px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              sortBy === 'popular' 
                ? 'bg-blue-100 text-blue-700' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>인기순</span>
          </button>
          <button
            onClick={() => setSortBy('recent')}
            className={`flex items-center space-x-1 px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              sortBy === 'recent' 
                ? 'bg-blue-100 text-blue-700' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>최신순</span>
          </button>
        </div>
      </div>

      {/* Comment Input */}
      <div className="mb-6 p-4 bg-gray-50 rounded-xl">
        <div className="mb-3">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="닉네임 (선택사항)"
            className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
          />
        </div>
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder={`${winnerName} 우승에 대한 생각을 댓글로 남겨보세요!`}
          className="w-full p-3 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
          rows={3}
        />
        <div className="flex justify-end mt-3">
          <button
            onClick={handleSubmitComment}
            disabled={!newComment.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            댓글 작성
          </button>
        </div>
      </div>

      {/* Comments List */}
      <div className="space-y-4 max-h-96 overflow-y-auto">
        <AnimatePresence>
          {sortedComments.map((comment) => (
            <motion.div
              key={comment.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="border-b border-gray-100 pb-4 last:border-b-0"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    {comment.username[0]}
                  </div>
                  <span className="font-medium text-gray-900">{comment.username}</span>
                  <span className="text-gray-500 text-sm">{formatTimeAgo(comment.createdAt)}</span>
                </div>
              </div>
              
              <p className="text-gray-700 mb-3 ml-10">{comment.content}</p>
              
              <div className="flex items-center space-x-4 ml-10">
                <button
                  onClick={() => handleLike(comment.id)}
                  className={`flex items-center space-x-1 px-2 py-1 rounded-lg transition-colors ${
                    comment.isLiked 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <ThumbsUp className="w-4 h-4" />
                  <span className="text-sm">{comment.likes}</span>
                </button>
                
                <button
                  onClick={() => handleDislike(comment.id)}
                  className={`flex items-center space-x-1 px-2 py-1 rounded-lg transition-colors ${
                    comment.isDisliked 
                      ? 'bg-red-100 text-red-700' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <ThumbsDown className="w-4 h-4" />
                  <span className="text-sm">{comment.dislikes}</span>
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}