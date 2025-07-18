'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useTheme, ThemeType } from '@/contexts/ThemeContext';

interface ThemeSelectorProps {
  className?: string;
}

export default function ThemeSelector({ className = '' }: ThemeSelectorProps) {
  const { currentTheme, setTheme, themes } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const handleThemeSelect = (themeId: ThemeType) => {
    setTheme(themeId);
    setIsOpen(false);
  };

  const currentThemeConfig = themes[currentTheme];

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between w-full px-4 py-3 rounded-lg border-2 transition-all duration-200 ${
          currentTheme === 'neon' 
            ? 'bg-gray-800/50 border-cyan-400 text-cyan-300 hover:bg-cyan-400/10'
            : currentTheme === 'paper'
            ? 'bg-white border-amber-600 text-amber-800 hover:bg-amber-50'
            : currentTheme === 'comic'
            ? 'bg-white border-black text-black hover:bg-yellow-50'
            : currentTheme === 'gaming'
            ? 'bg-gray-800/50 border-purple-500 text-white hover:bg-purple-500/10'
            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
        }`}
      >
        <div className="flex items-center space-x-3">
          <div 
            className={`w-4 h-4 rounded-full ${
              currentTheme === 'neon' 
                ? 'bg-gradient-to-r from-cyan-400 to-pink-400'
                : currentTheme === 'paper'
                ? 'bg-amber-600'
                : currentTheme === 'comic'
                ? 'bg-yellow-400'
                : currentTheme === 'gaming'
                ? 'bg-gradient-to-r from-red-500 to-purple-500'
                : 'bg-gray-500'
            }`}
          />
          <span className="font-medium">{currentThemeConfig.name}</span>
        </div>
        <ChevronDown 
          className={`w-5 h-5 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className={`absolute top-full left-0 right-0 mt-2 rounded-lg border-2 overflow-hidden z-50 ${
          currentTheme === 'neon' 
            ? 'bg-gray-800/90 border-cyan-400/50 backdrop-blur-md'
            : currentTheme === 'paper'
            ? 'bg-white border-amber-600'
            : currentTheme === 'comic'
            ? 'bg-white border-black shadow-[8px_8px_0px_0px_#000]'
            : currentTheme === 'gaming'
            ? 'bg-gray-800/90 border-purple-500/50 backdrop-blur-md'
            : 'bg-white border-gray-300 shadow-lg'
        }`}>
          {Object.values(themes).map((theme) => (
            <button
              key={theme.id}
              onClick={() => handleThemeSelect(theme.id)}
              className={`w-full px-4 py-3 text-left flex items-center space-x-3 transition-all duration-200 ${
                theme.id === currentTheme
                  ? theme.id === 'neon'
                    ? 'bg-cyan-400/20 text-cyan-300'
                    : theme.id === 'paper'
                    ? 'bg-amber-100 text-amber-800'
                    : theme.id === 'comic'
                    ? 'bg-yellow-100 text-black'
                    : theme.id === 'gaming'
                    ? 'bg-purple-500/20 text-white'
                    : 'bg-gray-100 text-gray-700'
                  : theme.id === 'neon'
                    ? 'text-gray-300 hover:bg-cyan-400/10 hover:text-cyan-300'
                    : theme.id === 'paper'
                    ? 'text-amber-700 hover:bg-amber-50'
                    : theme.id === 'comic'
                    ? 'text-black hover:bg-yellow-50'
                    : theme.id === 'gaming'
                    ? 'text-gray-300 hover:bg-purple-500/10 hover:text-white'
                    : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <div 
                className={`w-4 h-4 rounded-full ${
                  theme.id === 'neon' 
                    ? 'bg-gradient-to-r from-cyan-400 to-pink-400'
                    : theme.id === 'paper'
                    ? 'bg-amber-600'
                    : theme.id === 'comic'
                    ? 'bg-yellow-400'
                    : theme.id === 'gaming'
                    ? 'bg-gradient-to-r from-red-500 to-purple-500'
                    : 'bg-gray-500'
                }`}
              />
              <div>
                <div className="font-medium">{theme.name}</div>
                <div className={`text-xs ${
                  theme.id === 'neon' ? 'text-gray-400'
                  : theme.id === 'paper' ? 'text-amber-600'
                  : theme.id === 'comic' ? 'text-gray-600'
                  : theme.id === 'gaming' ? 'text-gray-400'
                  : 'text-gray-500'
                }`}>
                  {theme.description}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}