'use client';

import React from 'react';

export interface CommentPaginationProps {
  currentPage: number;
  totalPages: number;
  theme: 'minimal' | 'neon' | 'paper' | 'comic' | 'gaming';
  onPageChange: (page: number) => void;
}

const CommentPagination: React.FC<CommentPaginationProps> = ({
  currentPage,
  totalPages,
  theme,
  onPageChange
}) => {
  const getThemeClasses = () => {
    switch (theme) {
      case 'minimal':
        return {
          container: 'bg-white p-6 rounded-b-xl border-t border-gray-100 shadow-sm',
          button: (isActive: boolean) => `w-8 h-8 flex items-center justify-center rounded-full font-light text-sm transition-colors ${
            isActive
              ? 'bg-gray-900 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`
        };
      
      case 'neon':
        return {
          container: 'bg-black/80 backdrop-blur-sm border-x border-b border-cyan-500/30 p-6 rounded-b-xl',
          button: (isActive: boolean) => `w-10 h-10 flex items-center justify-center rounded-full font-bold transition-all ${
            isActive
              ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-black'
              : 'bg-gray-700 text-cyan-300 hover:text-white'
          }`
        };
      
      case 'paper':
        return {
          container: 'bg-amber-50 border-x-2 border-b-2 border-amber-200 p-6 rounded-b',
          button: (isActive: boolean) => `w-10 h-10 flex items-center justify-center rounded font-bold transition-all border-2 ${
            isActive
              ? 'bg-amber-600 text-amber-50 border-amber-700'
              : 'bg-amber-100 text-amber-800 border-amber-400 hover:bg-amber-200'
          }`
        };
      
      case 'comic':
        return {
          container: 'bg-white border-x-4 border-b-4 border-black p-6 rounded-b',
          button: (isActive: boolean) => `w-10 h-10 flex items-center justify-center rounded font-bold transition-all border-3 border-black shadow-[2px_2px_0px_0px_black] ${
            isActive
              ? 'bg-blue-500 text-white'
              : 'bg-white text-black hover:bg-yellow-200'
          }`
        };
      
      case 'gaming':
        return {
          container: 'bg-gray-800/80 backdrop-blur-sm border-x border-b border-purple-500/30 p-6 rounded-b-xl',
          button: (isActive: boolean) => `w-10 h-10 flex items-center justify-center rounded-full font-bold transition-all ${
            isActive
              ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white'
              : 'bg-gray-700 text-gray-300 hover:text-white'
          }`
        };
      
      default:
        return getThemeClasses.call(this);
    }
  };

  const themeClasses = getThemeClasses();

  return (
    <div className={themeClasses.container}>
      <div className="flex justify-center gap-2">
        {Array.from({ length: totalPages }, (_, i) => (
          <button
            key={i + 1}
            onClick={() => onPageChange(i + 1)}
            className={themeClasses.button(currentPage === i + 1)}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
};

export default CommentPagination;