'use client';

import { useTheme } from '@/contexts/ThemeContext';

interface TournamentTitleProps {
  title: string;
  subtitle?: string;
}

export default function TournamentTitle({ title, subtitle }: TournamentTitleProps) {
  const { currentTheme, getThemeClass } = useTheme();

  const getTitleStyle = () => {
    switch (currentTheme) {
      case 'neon':
        return 'text-4xl font-bold font-mono bg-gradient-to-r from-cyan-400 to-pink-400 bg-clip-text text-transparent mb-2';
      case 'paper':
        return 'text-4xl font-bold text-amber-900 mb-2 transform -rotate-1';
      case 'comic':
        return 'text-5xl font-black text-black mb-2';
      case 'gaming':
        return 'text-4xl font-bold bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500 bg-clip-text text-transparent mb-2';
      case 'minimal':
      default:
        return 'text-4xl font-light text-gray-900 mb-2';
    }
  };

  const getSubtitleStyle = () => {
    switch (currentTheme) {
      case 'neon':
        return 'text-cyan-300 font-mono text-sm';
      case 'paper':
        return 'text-amber-700 text-lg';
      case 'comic':
        return 'text-purple-800 font-bold text-lg';
      case 'gaming':
        return 'text-gray-300 font-medium text-lg';
      case 'minimal':
      default:
        return 'text-gray-500 text-lg';
    }
  };

  const getContainerStyle = () => {
    switch (currentTheme) {
      case 'neon':
        return 'text-center mb-8 relative';
      case 'paper':
        return 'text-center mb-8 relative';
      case 'comic':
        return 'text-center mb-8 relative';
      case 'gaming':
        return 'text-center mb-8 relative';
      case 'minimal':
      default:
        return 'text-center mb-8 relative';
    }
  };

  return (
    <div className={getContainerStyle()}>
      {currentTheme === 'neon' && (
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 to-pink-400/20 blur-3xl -z-10"></div>
      )}
      
      {currentTheme === 'comic' && (
        <div className="absolute -top-4 -left-4 text-6xl font-black text-yellow-400 opacity-20 -z-10 transform -rotate-12">
          POW!
        </div>
      )}
      
      <h1 className={getTitleStyle()}>
        {title}
      </h1>
      
      {subtitle && (
        <p className={getSubtitleStyle()}>
          {subtitle}
        </p>
      )}
      
      {currentTheme === 'paper' && (
        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-amber-600 opacity-50 transform rotate-1"></div>
      )}
      
      {currentTheme === 'gaming' && (
        <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 via-blue-500/10 to-purple-500/10 animate-pulse -z-10 rounded-lg"></div>
      )}
    </div>
  );
}