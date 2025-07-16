import React from 'react';

// 모던 미니멀 로고
export const ModernLogo: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`flex items-center ${className}`}>
      <div className="relative">
        <div className="w-10 h-10 bg-blue-600 rounded-lg transform rotate-45"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white font-bold">T</div>
      </div>
      <div className="ml-2 font-bold text-2xl text-gray-800">
        <span>World</span>
        <span className="text-blue-600">Cup</span>
      </div>
    </div>
  );
};

// 플레이풀 로고
export const PlayfulLogo: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`flex items-center ${className}`}>
      <div className="relative">
        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
            <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-xs">W</span>
            </div>
          </div>
        </div>
        <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center text-xs font-bold">✨</div>
      </div>
      <div className="ml-3">
        <div className="font-bold text-2xl">
          <span className="text-purple-600">World</span>
          <span className="text-pink-500">Cup</span>
        </div>
        <div className="text-xs text-purple-400 tracking-wider">즐거운 토너먼트</div>
      </div>
    </div>
  );
};

// 다이나믹 스포츠 로고
export const SportsLogo: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`flex items-center ${className}`}>
      <div className="relative">
        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
            <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-600"></div>
          </div>
        </div>
        <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center text-xs font-bold text-white">W</div>
      </div>
      <div className="ml-3">
        <div className="font-extrabold text-transparent text-2xl bg-clip-text bg-gradient-to-r from-blue-500 to-purple-600">WORLDCUP</div>
        <div className="text-xs text-gray-500 -mt-1 tracking-widest">TOURNAMENT</div>
      </div>
    </div>
  );
};

// 레트로 게임 로고
export const RetroLogo: React.FC<{ className?: string, darkMode?: boolean }> = ({ className = '', darkMode = true }) => {
  return (
    <div className={`flex items-center ${className}`}>
      <div className="relative">
        <div className="w-12 h-12 border-4 border-yellow-400 flex items-center justify-center">
          <div className="w-4 h-4 bg-yellow-400"></div>
        </div>
      </div>
      <div className="ml-3 font-mono">
        <div className="text-2xl font-bold text-yellow-400">WORLD<span className={darkMode ? "text-white" : "text-black"}>CUP</span></div>
        <div className="text-xs text-yellow-400 flex items-center">
          <span className="inline-block w-2 h-2 bg-yellow-400 mr-1"></span>
          <span>PRESS START</span>
          <span className="inline-block w-2 h-2 bg-yellow-400 ml-1"></span>
        </div>
      </div>
    </div>
  );
};

// 3D 입체 로고
export const ThreeDLogo: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`flex items-center ${className}`}>
      <div className="relative">
        <div className="w-12 h-12 bg-red-500 rounded-lg transform rotate-12 shadow-lg"></div>
        <div className="absolute top-0 left-0 w-12 h-12 bg-blue-600 rounded-lg transform rotate-6 opacity-90 shadow-lg"></div>
        <div className="absolute top-0 left-0 w-12 h-12 bg-yellow-500 rounded-lg transform rotate-0 opacity-80 shadow-lg"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white font-bold text-xl">W</div>
      </div>
      <div className="ml-3">
        <div className="font-bold text-2xl">
          <span className="text-red-500">W</span>
          <span className="text-blue-600">O</span>
          <span className="text-yellow-500">R</span>
          <span className="text-green-500">L</span>
          <span className="text-purple-500">D</span>
          <span className="text-red-500">C</span>
          <span className="text-blue-600">U</span>
          <span className="text-yellow-500">P</span>
        </div>
        <div className="text-xs text-gray-500 tracking-wider">TOURNAMENT EDITION</div>
      </div>
    </div>
  );
};

// 미니멀리스트 로고
export const MinimalistLogo: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="w-16 h-16 relative">
        <div className="absolute inset-0 border-4 border-black rounded-full"></div>
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-black"></div>
        <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-black"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-black rounded-full"></div>
      </div>
      <div className="mt-3 text-center">
        <div className="font-light text-2xl tracking-widest text-black">WORLDCUP</div>
        <div className="text-xs text-gray-400 tracking-wider">SINCE 2023</div>
      </div>
    </div>
  );
};

// 브러시 아트 로고
export const BrushLogo: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`flex items-center ${className}`}>
      <div className="relative">
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M10 10C20 2 30 2 38 10C46 18 46 30 38 38C30 46 18 46 10 38C2 30 2 20 10 10Z" fill="#4F46E5" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M24 12L28 24L40 28L28 32L24 44L20 32L8 28L20 24L24 12Z" fill="white" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div className="ml-3">
        <div className="font-bold text-2xl" style={{ fontFamily: 'cursive' }}>WorldCup</div>
        <div className="text-xs text-gray-500 italic">토너먼트 시스템</div>
      </div>
    </div>
  );
};