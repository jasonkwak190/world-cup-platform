'use client';

import React from 'react';
import { User, Zap } from 'lucide-react';

export interface CommentFormProps {
  newComment: string;
  guestName: string;
  isAuthenticated: boolean;
  theme: 'minimal' | 'neon' | 'paper' | 'comic' | 'gaming';
  onCommentChange: (value: string) => void;
  onGuestNameChange: (value: string) => void;
  onSubmit: () => void;
}

const CommentForm: React.FC<CommentFormProps> = ({
  newComment,
  guestName,
  isAuthenticated,
  theme,
  onCommentChange,
  onGuestNameChange,
  onSubmit
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  const getThemeClasses = () => {
    switch (theme) {
      case 'minimal':
        return {
          container: 'bg-white border border-gray-100 shadow-sm',
          avatar: 'w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center',
          avatarIcon: 'w-5 h-5 text-gray-500',
          nameInput: 'p-2 border border-gray-200 rounded-lg w-full mt-2 focus:ring-2 focus:ring-gray-200 focus:border-transparent text-gray-700 placeholder-gray-400',
          textarea: 'w-full p-4 border border-gray-200 rounded-xl resize-none focus:ring-2 focus:ring-gray-200 focus:border-transparent text-gray-700 placeholder-gray-400',
          submitButton: 'px-6 py-2 bg-gray-900 text-white rounded-full font-light hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
          userName: 'font-light text-lg text-gray-800'
        };
      
      case 'neon':
        return {
          container: 'bg-black/80 backdrop-blur-sm border border-cyan-500/30 shadow-lg shadow-cyan-500/10',
          avatar: 'w-12 h-12 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center',
          avatarIcon: 'w-6 h-6 text-black',
          nameInput: 'p-3 bg-gray-900 border border-cyan-500/30 rounded-lg w-full mt-2 focus:ring-2 focus:ring-cyan-500 text-cyan-100 placeholder-cyan-400',
          textarea: 'w-full p-4 bg-gray-900 border border-cyan-500/30 rounded-xl resize-none focus:ring-2 focus:ring-cyan-500 text-cyan-100 placeholder-cyan-400',
          submitButton: 'px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-black rounded-xl font-bold hover:from-cyan-400 hover:to-blue-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed',
          userName: 'font-bold text-lg text-cyan-100'
        };
      
      case 'paper':
        return {
          container: 'bg-amber-50 border-2 border-amber-200 shadow-sm relative',
          avatar: 'w-12 h-12 bg-amber-200 rounded-full flex items-center justify-center border-2 border-amber-300',
          avatarIcon: 'w-6 h-6 text-amber-700',
          nameInput: 'p-3 bg-amber-25 border-2 border-amber-300 rounded w-full mt-2 focus:ring-2 focus:ring-amber-400 text-amber-900 placeholder-amber-600',
          textarea: 'w-full p-4 bg-amber-25 border-2 border-amber-300 rounded resize-none focus:ring-2 focus:ring-amber-400 text-amber-900 placeholder-amber-600',
          submitButton: 'px-6 py-3 bg-amber-600 text-amber-50 rounded font-bold hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed border-2 border-amber-700',
          userName: 'font-bold text-lg text-amber-900'
        };
      
      case 'comic':
        return {
          container: 'bg-white border-4 border-black shadow-[4px_4px_0px_0px_black] relative',
          avatar: 'w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center border-3 border-black',
          avatarIcon: 'w-6 h-6 text-black',
          nameInput: 'p-3 bg-white border-3 border-black rounded w-full mt-2 focus:ring-0 focus:border-blue-500 text-black placeholder-gray-600',
          textarea: 'w-full p-4 bg-white border-3 border-black rounded resize-none focus:ring-0 focus:border-blue-500 text-black placeholder-gray-600',
          submitButton: 'px-6 py-3 bg-red-500 text-white rounded border-3 border-black font-bold hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-[2px_2px_0px_0px_black]',
          userName: 'font-bold text-lg text-black'
        };
      
      case 'gaming':
        return {
          container: 'bg-gray-800/80 backdrop-blur-sm border border-purple-500/30',
          avatar: 'w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center',
          avatarIcon: 'w-6 h-6 text-white',
          nameInput: 'p-2 bg-gray-700 border border-purple-500/30 rounded-lg w-full mt-2 focus:ring-2 focus:ring-purple-500 text-white placeholder-gray-400',
          textarea: 'w-full p-4 bg-gray-700 border border-purple-500/30 rounded-xl resize-none focus:ring-2 focus:ring-purple-500 text-white placeholder-gray-400',
          submitButton: 'px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl font-bold text-lg hover:from-purple-600 hover:to-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed',
          userName: 'font-bold text-lg text-white'
        };
      
      default:
        return getThemeClasses.call(this);
    }
  };

  const themeClasses = getThemeClasses();

  return (
    <div className={`p-6 mb-6 ${themeClasses.container}`}>
      <form onSubmit={handleSubmit}>
        <div className="flex items-center gap-3 mb-3">
          <div className={themeClasses.avatar}>
            <User className={themeClasses.avatarIcon} />
          </div>
          <div className="flex-1">
            <div className={themeClasses.userName}>
              {isAuthenticated ? '현재 사용자' : '게스트'}
            </div>
            {!isAuthenticated && (
              <input
                type="text"
                placeholder="닉네임을 입력하세요..."
                value={guestName}
                onChange={(e) => onGuestNameChange(e.target.value)}
                className={themeClasses.nameInput}
                required
              />
            )}
          </div>
        </div>
        
        <textarea
          placeholder={theme === 'gaming' ? '댓글을 입력하세요... 💬' : '댓글을 입력하세요...'}
          value={newComment}
          onChange={(e) => onCommentChange(e.target.value)}
          className={themeClasses.textarea}
          rows={3}
          required
        />
        
        <div className="flex justify-end mt-3">
          <button
            type="submit"
            disabled={!newComment.trim() || (!isAuthenticated && !guestName.trim())}
            className={themeClasses.submitButton}
          >
            댓글 작성
            {theme === 'gaming' && <Zap className="w-4 h-4 inline ml-1" />}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CommentForm;