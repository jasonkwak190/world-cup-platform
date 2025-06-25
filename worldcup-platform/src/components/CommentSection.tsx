'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThumbsUp, ThumbsDown, MessageCircle, Clock, TrendingUp } from 'lucide-react';
import { Comment } from '@/types/game';

interface CommentSectionProps {
  worldcupTitle: string;
  winnerName: string;
}

// Mock comments data
const mockComments: Comment[] = [
  {
    id: '1',
    username: '케이팝러버',
    content: '태민이 우승이라니! 역시 춤신춤왕 👑 완전 예상했어요',
    likes: 142,
    dislikes: 3,
    createdAt: new Date('2024-06-24T10:30:00'),
    isLiked: false,
    isDisliked: false
  },
  {
    id: '2',
    username: '아이돌마니아',
    content: '이번 토너먼트 진짜 치열했다... 마지막에 태민 vs 백현 진짜 고민많이 했는데',
    likes: 89,
    dislikes: 1,
    createdAt: new Date('2024-06-24T10:25:00'),
    isLiked: true,
    isDisliked: false
  },
  {
    id: '3',
    username: '샤이니월드',
    content: '우리 태민이 ㅠㅠ 진짜 자랑스럽다 💎✨',
    likes: 67,
    dislikes: 0,
    createdAt: new Date('2024-06-24T10:20:00'),
    isLiked: false,
    isDisliked: false
  },
  {
    id: '4',
    username: '무명소녀',
    content: '32강부터 봤는데 태민이 계속 이기더라 ㅋㅋ 역시 실력파',
    likes: 45,
    dislikes: 2,
    createdAt: new Date('2024-06-24T10:15:00'),
    isLiked: false,
    isDisliked: false
  },
  {
    id: '5',
    username: '댄스킹',
    content: '춤으로는 태민이 최고지... 인정한다',
    likes: 34,
    dislikes: 8,
    createdAt: new Date('2024-06-24T10:10:00'),
    isLiked: false,
    isDisliked: false
  },
  {
    id: '6',
    username: '올라운더',
    content: '솔직히 백현이 이길줄 알았는데 ㅋㅋ',
    likes: 23,
    dislikes: 15,
    createdAt: new Date('2024-06-24T10:05:00'),
    isLiked: false,
    isDisliked: false
  }
];

type SortType = 'popular' | 'recent';

export default function CommentSection({ worldcupTitle, winnerName }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>(mockComments);
  const [sortBy, setSortBy] = useState<SortType>('popular');
  const [newComment, setNewComment] = useState('');
  const [username, setUsername] = useState('');

  const handleLike = (commentId: string) => {
    setComments(prevComments =>
      prevComments.map(comment =>
        comment.id === commentId
          ? {
              ...comment,
              likes: comment.isLiked ? comment.likes - 1 : comment.likes + 1,
              dislikes: comment.isDisliked ? comment.dislikes - 1 : comment.dislikes,
              isLiked: !comment.isLiked,
              isDisliked: false
            }
          : comment
      )
    );
  };

  const handleDislike = (commentId: string) => {
    setComments(prevComments =>
      prevComments.map(comment =>
        comment.id === commentId
          ? {
              ...comment,
              dislikes: comment.isDisliked ? comment.dislikes - 1 : comment.dislikes + 1,
              likes: comment.isLiked ? comment.likes - 1 : comment.likes,
              isDisliked: !comment.isDisliked,
              isLiked: false
            }
          : comment
      )
    );
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

    setComments(prev => [comment, ...prev]);
    setNewComment('');
  };

  const sortedComments = [...comments].sort((a, b) => {
    if (sortBy === 'popular') {
      const aScore = a.likes - a.dislikes;
      const bScore = b.likes - b.dislikes;
      return bScore - aScore;
    } else {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return '방금 전';
    if (diffInMinutes < 60) return `${diffInMinutes}분 전`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}시간 전`;
    return `${Math.floor(diffInMinutes / 1440)}일 전`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.5 }}
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