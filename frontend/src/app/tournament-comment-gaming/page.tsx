'use client';

import { useState } from 'react';
import { User, MessageCircle, ThumbsUp, Send, ChevronDown, ChevronUp } from 'lucide-react';

export default function TournamentCommentGaming() {
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState([
    {
      id: 1,
      user: '게이머1337',
      avatar: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=60&h=60&fit=crop&crop=face',
      content: '이 토너먼트 진짜 재밌네요! 다음 라운드가 기대됩니다.',
      timestamp: '방금 전',
      likes: 42,
      replies: [
        {
          id: 11,
          user: 'RGB마스터',
          avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=60&h=60&fit=crop&crop=face',
          content: '동의합니다! 특히 결승전이 정말 기대되네요.',
          timestamp: '2분 전',
          likes: 8
        }
      ]
    },
    {
      id: 2,
      user: '프로게이머',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=60&h=60&fit=crop&crop=face',
      content: '저는 개인적으로 아이돌 월드컵이 제일 재밌었어요. 다들 어떤 토너먼트가 좋았나요?',
      timestamp: '5분 전',
      likes: 17,
      replies: []
    },
    {
      id: 3,
      user: '게임스트리머',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=60&h=60&fit=crop&crop=face',
      content: '이번에 새로 나온 게임 캐릭터 월드컵도 한번 해보세요! 정말 재밌어요~',
      timestamp: '15분 전',
      likes: 23,
      replies: []
    }
  ]);
  
  const [expandedComments, setExpandedComments] = useState<number[]>([1]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (comment.trim()) {
      const newComment = {
        id: comments.length + 1,
        user: '나',
        avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=60&h=60&fit=crop&crop=face',
        content: comment,
        timestamp: '방금 전',
        likes: 0,
        replies: []
      };
      setComments([newComment, ...comments]);
      setComment('');
    }
  };
  
  const toggleReplies = (commentId: number) => {
    if (expandedComments.includes(commentId)) {
      setExpandedComments(expandedComments.filter(id => id !== commentId));
    } else {
      setExpandedComments([...expandedComments, commentId]);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center relative">
          <span className="inline-block relative">
            <span className="animate-pulse bg-clip-text text-transparent bg-gradient-to-r from-purple-500 via-blue-500 to-green-500">
              게이밍 RGB 댓글
            </span>
            <span className="absolute -inset-1 bg-gradient-to-r from-purple-500 via-blue-500 to-green-500 opacity-50 blur-lg"></span>
          </span>
        </h1>
        
        {/* 댓글 입력 폼 */}
        <div className="mb-8">
          <form onSubmit={handleSubmit} className="relative">
            <div className="relative">
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="댓글을 입력하세요..."
                className="w-full p-4 pr-16 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white resize-none h-24"
              />
              <div className="absolute bottom-3 right-3">
                <button
                  type="submit"
                  className="p-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full hover:from-purple-700 hover:to-blue-700 transition-all duration-300 shadow-lg shadow-blue-500/30"
                >
                  <Send className="h-5 w-5 text-white" />
                </button>
              </div>
            </div>
            <div className="absolute -bottom-1 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-blue-500 to-green-500 rounded-full animate-pulse"></div>
          </form>
        </div>
        
        {/* 댓글 목록 */}
        <div className="space-y-6">
          {comments.map((comment) => (
            <div key={comment.id} className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 via-blue-500 to-green-500 opacity-0 group-hover:opacity-30 rounded-lg blur-sm transition-opacity duration-300"></div>
              <div className="relative bg-gray-800 p-4 rounded-lg border border-gray-700 shadow-lg">
                <div className="flex items-start space-x-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-gray-700">
                      <img src={comment.avatar} alt={comment.user} className="w-full h-full object-cover" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-gray-800"></div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center">
                        <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">{comment.user}</span>
                        <span className="ml-2 text-xs text-gray-400">{comment.timestamp}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button className="flex items-center space-x-1 text-gray-400 hover:text-blue-400 transition-colors">
                          <ThumbsUp className="h-4 w-4" />
                          <span className="text-xs">{comment.likes}</span>
                        </button>
                      </div>
                    </div>
                    <p className="text-gray-200 mb-2">{comment.content}</p>
                    <div className="flex items-center space-x-4">
                      <button className="text-xs text-blue-400 hover:text-blue-300 transition-colors">답글 달기</button>
                      {comment.replies.length > 0 && (
                        <button 
                          onClick={() => toggleReplies(comment.id)}
                          className="flex items-center text-xs text-gray-400 hover:text-gray-300 transition-colors"
                        >
                          <span>답글 {comment.replies.length}개</span>
                          {expandedComments.includes(comment.id) ? (
                            <ChevronUp className="h-3 w-3 ml-1" />
                          ) : (
                            <ChevronDown className="h-3 w-3 ml-1" />
                          )}
                        </button>
                      )}
                    </div>
                    
                    {/* 답글 목록 */}
                    {expandedComments.includes(comment.id) && comment.replies.length > 0 && (
                      <div className="mt-4 space-y-4 pl-4 border-l-2 border-gray-700">
                        {comment.replies.map((reply) => (
                          <div key={reply.id} className="relative group">
                            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-500 opacity-0 group-hover:opacity-20 rounded-lg blur-sm transition-opacity duration-300"></div>
                            <div className="relative bg-gray-800 p-3 rounded-lg border border-gray-700">
                              <div className="flex items-start space-x-3">
                                <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-gray-700">
                                  <img src={reply.avatar} alt={reply.user} className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center">
                                      <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">{reply.user}</span>
                                      <span className="ml-2 text-xs text-gray-400">{reply.timestamp}</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <button className="flex items-center space-x-1 text-gray-400 hover:text-blue-400 transition-colors">
                                        <ThumbsUp className="h-3 w-3" />
                                        <span className="text-xs">{reply.likes}</span>
                                      </button>
                                    </div>
                                  </div>
                                  <p className="text-gray-300 text-sm">{reply.content}</p>
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
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 via-blue-500 to-green-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
          ))}
        </div>
        
        {/* 더 보기 버튼 */}
        <div className="mt-8 text-center">
          <button className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full hover:from-purple-700 hover:to-blue-700 transition-all duration-300 shadow-lg shadow-blue-500/30 relative group">
            <span className="relative z-10">더 보기</span>
            <span className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full opacity-0 group-hover:opacity-100 blur-md transition-opacity duration-300"></span>
          </button>
        </div>
      </div>
    </div>
  );
}