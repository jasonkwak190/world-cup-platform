'use client';

import React from 'react';

export interface CommentFilterProps {
  sortOption: 'likes' | 'recent';
  setSortOption: (option: 'likes' | 'recent') => void;
  theme: 'minimal' | 'neon' | 'paper' | 'comic' | 'gaming';
}

const CommentFilter: React.FC<CommentFilterProps> = ({
  sortOption,
  setSortOption,
  theme
}) => {
  const getThemeClasses = () => {
    switch (theme) {
      case 'minimal':
        return {
          container: 'flex border border-gray-200 rounded-full overflow-hidden',
          button: (active: boolean) => `px-4 py-2 font-light text-sm transition-colors ${
            active
              ? 'bg-gray-900 text-white'
              : 'bg-white text-gray-600 hover:bg-gray-100'
          }`
        };
      
      case 'neon':
        return {
          container: 'flex border border-cyan-500/30 rounded-full overflow-hidden bg-black/50',
          button: (active: boolean) => `px-4 py-2 font-bold text-sm transition-colors ${
            active
              ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-black'
              : 'text-cyan-300 hover:text-cyan-100'
          }`
        };
      
      case 'paper':
        return {
          container: 'flex border-2 border-amber-300 rounded overflow-hidden bg-amber-50',
          button: (active: boolean) => `px-4 py-2 font-bold text-sm transition-colors border-r-2 border-amber-300 last:border-r-0 ${
            active
              ? 'bg-amber-600 text-amber-50'
              : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
          }`
        };
      
      case 'comic':
        return {
          container: 'flex border-3 border-black rounded overflow-hidden bg-white shadow-[2px_2px_0px_0px_black]',
          button: (active: boolean) => `px-4 py-2 font-bold text-sm transition-colors border-r-3 border-black last:border-r-0 ${
            active
              ? 'bg-blue-500 text-white'
              : 'bg-white text-black hover:bg-yellow-200'
          }`
        };
      
      case 'gaming':
        return {
          container: 'flex border border-purple-500/30 rounded-full overflow-hidden bg-gray-800/50',
          button: (active: boolean) => `px-4 py-2 font-bold text-sm transition-colors ${
            active
              ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white'
              : 'text-gray-300 hover:text-white'
          }`
        };
      
      default:
        return getThemeClasses.call(this);
    }
  };

  const themeClasses = getThemeClasses();

  const getButtonText = (option: 'likes' | 'recent') => {
    if (theme === 'gaming') {
      return option === 'likes' ? '👍 인기순' : '🕒 최신순';
    }
    return option === 'likes' ? '인기순' : '최신순';
  };

  return (
    <div className={themeClasses.container}>
      <button
        onClick={() => setSortOption('likes')}
        className={themeClasses.button(sortOption === 'likes')}
      >
        {getButtonText('likes')}
      </button>
      <button
        onClick={() => setSortOption('recent')}
        className={themeClasses.button(sortOption === 'recent')}
      >
        {getButtonText('recent')}
      </button>
    </div>
  );
};

export default CommentFilter;