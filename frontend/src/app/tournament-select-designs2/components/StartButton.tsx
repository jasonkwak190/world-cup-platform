'use client';

import { useTheme } from '@/contexts/ThemeContext';

interface StartButtonProps {
  selectedTournament: string | null;
  isLoading: boolean;
  onClick: () => void;
}

export default function StartButton({ selectedTournament, isLoading, onClick }: StartButtonProps) {
  const { currentTheme } = useTheme();

  const getButtonStyle = () => {
    const baseStyle = 'px-10 py-4 font-semibold text-lg transition-all duration-300 transform relative overflow-hidden';
    
    if (isLoading) {
      switch (currentTheme) {
        case 'neon':
          return `${baseStyle} bg-gray-600 text-gray-400 cursor-not-allowed rounded-full font-mono`;
        case 'paper':
          return `${baseStyle} bg-gray-400 text-gray-600 cursor-not-allowed rounded-lg`;
        case 'comic':
          return `${baseStyle} bg-gray-400 text-gray-600 cursor-not-allowed rounded-lg border-4 border-gray-600`;
        case 'gaming':
          return `${baseStyle} bg-gray-600 text-gray-400 cursor-not-allowed rounded-xl`;
        case 'minimal':
        default:
          return `${baseStyle} bg-gray-300 text-gray-500 cursor-not-allowed rounded-lg font-light`;
      }
    }
    
    if (!selectedTournament) {
      switch (currentTheme) {
        case 'neon':
          return `${baseStyle} bg-gray-700 text-gray-500 cursor-not-allowed rounded-full font-mono`;
        case 'paper':
          return `${baseStyle} bg-gray-200 text-gray-500 cursor-not-allowed rounded-lg`;
        case 'comic':
          return `${baseStyle} bg-gray-200 text-gray-500 cursor-not-allowed rounded-lg border-4 border-gray-400`;
        case 'gaming':
          return `${baseStyle} bg-gray-700 text-gray-500 cursor-not-allowed rounded-xl`;
        case 'minimal':
        default:
          return `${baseStyle} bg-gray-100 text-gray-400 cursor-not-allowed rounded-lg font-light`;
      }
    }
    
    // Active state
    switch (currentTheme) {
      case 'neon':
        return `${baseStyle} bg-gradient-to-r from-cyan-400 to-pink-400 text-black hover:scale-105 shadow-lg shadow-cyan-400/25 rounded-full font-mono`;
      case 'paper':
        return `${baseStyle} bg-amber-600 text-white hover:bg-amber-700 hover:scale-105 hover:rotate-1 shadow-lg shadow-amber-200 rounded-lg`;
      case 'comic':
        return `${baseStyle} bg-yellow-400 text-black hover:scale-105 rounded-lg border-4 border-black shadow-[8px_8px_0px_0px_#000] hover:shadow-[12px_12px_0px_0px_#000] font-black`;
      case 'gaming':
        return `${baseStyle} bg-gradient-to-r from-red-500 to-purple-500 text-white hover:scale-105 shadow-lg shadow-purple-500/25 rounded-xl font-bold`;
      case 'minimal':
      default:
        return `${baseStyle} bg-gray-900 text-white hover:bg-gray-800 hover:scale-105 shadow-xl rounded-lg font-light`;
    }
  };

  const getLoadingText = () => {
    switch (currentTheme) {
      case 'neon':
        return 'INITIALIZING...';
      case 'paper':
        return '준비 중...';
      case 'comic':
        return 'LOADING!';
      case 'gaming':
        return 'LOADING...';
      case 'minimal':
      default:
        return '로딩 중...';
    }
  };

  const getDefaultText = () => {
    switch (currentTheme) {
      case 'neon':
        return 'SELECT MODE FIRST';
      case 'paper':
        return '토너먼트를 먼저 선택하세요';
      case 'comic':
        return 'PICK ONE!';
      case 'gaming':
        return 'SELECT TOURNAMENT';
      case 'minimal':
      default:
        return '토너먼트 선택 필요';
    }
  };

  const getActiveText = () => {
    switch (currentTheme) {
      case 'neon':
        return 'INITIALIZE BATTLE';
      case 'paper':
        return '토너먼트 시작하기';
      case 'comic':
        return 'LET\'S GO!';
      case 'gaming':
        return 'START GAME';
      case 'minimal':
      default:
        return '게임 시작';
    }
  };

  const getLoadingIcon = () => {
    switch (currentTheme) {
      case 'neon':
        return (
          <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
        );
      case 'paper':
        return (
          <div className="w-5 h-5 border-2 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
        );
      case 'comic':
        return (
          <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
        );
      case 'gaming':
        return (
          <div className="w-5 h-5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
        );
      case 'minimal':
      default:
        return (
          <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
        );
    }
  };

  return (
    <div className="text-center mt-10">
      <button 
        disabled={!selectedTournament || isLoading}
        onClick={onClick}
        className={getButtonStyle()}
      >
        {currentTheme === 'gaming' && selectedTournament && !isLoading && (
          <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 via-blue-500/20 to-purple-500/20 animate-pulse rounded-xl"></div>
        )}
        
        {isLoading ? (
          <div className="flex items-center gap-3 relative z-10">
            {getLoadingIcon()}
            <span>{getLoadingText()}</span>
          </div>
        ) : selectedTournament ? (
          <span className="relative z-10">{getActiveText()}</span>
        ) : (
          <span className="relative z-10">{getDefaultText()}</span>
        )}
      </button>
    </div>
  );
}