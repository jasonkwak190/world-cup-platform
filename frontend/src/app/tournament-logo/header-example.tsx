'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X, ChevronDown } from 'lucide-react';
import { ModernLogo, SportsLogo, RetroLogo, ThreeDLogo, MinimalistLogo, BrushLogo } from './components';

type LogoType = 'modern' | 'sports' | 'retro' | '3d' | 'minimalist' | 'brush';

interface HeaderProps {
  logoType?: LogoType;
  darkMode?: boolean;
}

export default function HeaderExample({ logoType = 'modern', darkMode = false }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const renderLogo = () => {
    switch(logoType) {
      case 'modern':
        return <ModernLogo className="h-10" />;
      case 'sports':
        return <SportsLogo className="h-10" />;
      case 'retro':
        return <RetroLogo className="h-10" darkMode={darkMode} />;
      case '3d':
        return <ThreeDLogo className="h-10" />;
      case 'minimalist':
        return <MinimalistLogo className="h-10" />;
      case 'brush':
        return <BrushLogo className="h-10" />;
      default:
        return <ModernLogo className="h-10" />;
    }
  };
  
  return (
    <header className={`${darkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-800'} shadow-md`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center">
              {renderLogo()}
            </Link>
            
            <nav className="hidden md:ml-10 md:flex md:space-x-8">
              <Link href="#" className={`${darkMode ? 'text-white hover:text-gray-300' : 'text-gray-900 hover:text-gray-700'} px-3 py-2 text-sm font-medium`}>
                홈
              </Link>
              <Link href="#" className={`${darkMode ? 'text-white hover:text-gray-300' : 'text-gray-900 hover:text-gray-700'} px-3 py-2 text-sm font-medium`}>
                토너먼트
              </Link>
              <div className="relative group">
                <button className={`${darkMode ? 'text-white hover:text-gray-300' : 'text-gray-900 hover:text-gray-700'} group px-3 py-2 text-sm font-medium inline-flex items-center`}>
                  <span>카테고리</span>
                  <ChevronDown className="ml-1 w-4 h-4" />
                </button>
                <div className={`absolute z-10 left-0 mt-2 w-48 rounded-md shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} ring-1 ring-black ring-opacity-5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300`}>
                  <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                    <Link href="#" className={`block px-4 py-2 text-sm ${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}`}>
                      인물
                    </Link>
                    <Link href="#" className={`block px-4 py-2 text-sm ${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}`}>
                      음식
                    </Link>
                    <Link href="#" className={`block px-4 py-2 text-sm ${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}`}>
                      장소
                    </Link>
                  </div>
                </div>
              </div>
              <Link href="#" className={`${darkMode ? 'text-white hover:text-gray-300' : 'text-gray-900 hover:text-gray-700'} px-3 py-2 text-sm font-medium`}>
                랭킹
              </Link>
            </nav>
          </div>
          
          <div className="hidden md:flex items-center">
            <Link href="#" className={`${darkMode ? 'bg-white text-gray-900' : 'bg-blue-600 text-white'} px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 transition-opacity`}>
              로그인
            </Link>
          </div>
          
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`${darkMode ? 'text-white' : 'text-gray-800'} p-2`}
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>
      
      {/* 모바일 메뉴 */}
      {isMenuOpen && (
        <div className={`md:hidden ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link href="#" className={`block px-3 py-2 rounded-md text-base font-medium ${darkMode ? 'text-white hover:bg-gray-800' : 'text-gray-900 hover:bg-gray-100'}`}>
              홈
            </Link>
            <Link href="#" className={`block px-3 py-2 rounded-md text-base font-medium ${darkMode ? 'text-white hover:bg-gray-800' : 'text-gray-900 hover:bg-gray-100'}`}>
              토너먼트
            </Link>
            <Link href="#" className={`block px-3 py-2 rounded-md text-base font-medium ${darkMode ? 'text-white hover:bg-gray-800' : 'text-gray-900 hover:bg-gray-100'}`}>
              카테고리
            </Link>
            <Link href="#" className={`block px-3 py-2 rounded-md text-base font-medium ${darkMode ? 'text-white hover:bg-gray-800' : 'text-gray-900 hover:bg-gray-100'}`}>
              랭킹
            </Link>
          </div>
          <div className="pt-4 pb-3 border-t border-gray-700">
            <div className="px-2">
              <Link href="#" className={`block px-3 py-2 rounded-md text-base font-medium text-center ${darkMode ? 'bg-white text-gray-900' : 'bg-blue-600 text-white'}`}>
                로그인
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}