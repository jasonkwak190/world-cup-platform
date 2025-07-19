'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, ArrowLeft, RotateCcw, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { GameThemeProps } from './types';

export default function MinimalGameTheme({
  worldcupData,
  gameState,
  currentMatch,
  selectedItem,
  voteStats,
  itemPercentages,
  showStats,
  isProcessing,
  canUndo,
  winStreaks,
  onChoice,
  onUndo,
  onRestart,
  onHome,
  onSelectOtherTournament,
  progress,
  roundName
}: GameThemeProps) {
  if (!currentMatch) return null;

  // Function to get percentage for an item
  const getItemPercentage = (itemId: string): number | null => {
    if (!selectedItem || itemPercentages.length === 0) return null;
    const itemPercentage = itemPercentages.find(p => p.itemId === itemId);
    return itemPercentage ? itemPercentage.percentage : null;
  };

  // Function to get win streak for an item
  const getWinStreak = (itemId: string): number => {
    return winStreaks.get(itemId) || 0;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* 헤더 */}
      <div className="p-6 border-b border-gray-200 bg-white/80 backdrop-blur-sm">
        {/* 상단 버튼들 */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex space-x-3">
            <button
              onClick={onHome}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-all duration-200 font-medium"
            >
              <Home className="w-4 h-4" />
              <span>홈으로</span>
            </button>
            <button
              onClick={onUndo}
              disabled={!canUndo}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 font-medium ${
                canUndo 
                  ? 'bg-gray-100 text-gray-900 hover:bg-gray-200 border border-gray-300' 
                  : 'bg-gray-50 text-gray-400 cursor-not-allowed border border-gray-200'
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>되돌리기</span>
            </button>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={onRestart}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 transition-all duration-200 font-medium border border-gray-300"
            >
              <RotateCcw className="w-4 h-4" />
              <span>다시하기</span>
            </button>
            <button
              onClick={onSelectOtherTournament}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 transition-all duration-200 font-medium border border-gray-300"
            >
              <ChevronRight className="w-4 h-4" />
              <span>다른 토너먼트</span>
            </button>
          </div>
        </div>

        {/* 타이틀 - 헤더 중앙에 위치 */}
        <div className="text-center mb-4">
          <h1 className="text-2xl font-light text-gray-900 tracking-tight">
            {worldcupData.title}
          </h1>
        </div>

        {/* 프로그레스 바 */}
        <div className="text-center">
          <div className="text-gray-700 font-medium text-sm mb-3">
            {roundName}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 relative overflow-hidden">
            <div 
              className="bg-gray-900 h-full rounded-full transition-all duration-500"
              style={{ width: `${progress?.percentage || 0}%` }}
            ></div>
          </div>
          <div className="text-gray-600 font-medium text-xs mt-2">
            진행률: {progress?.percentage?.toFixed(1) || 0}%
          </div>
        </div>
      </div>

      {/* 메인 게임 영역 - 헤더와 가깝게 */}
      <div className="flex flex-col items-center justify-start pt-6 min-h-[calc(100vh-200px)] p-8">
        {/* 게임 카드들 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 w-full max-w-6xl">
          {[currentMatch.left, currentMatch.right].map((item, index) => (
            <motion.div
              key={item.id}
              className={`relative cursor-pointer transition-all duration-300 ${
                isProcessing ? 'pointer-events-none' : ''
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onChoice(item)}
            >
              <div className={`relative rounded-lg overflow-hidden shadow-sm transition-all duration-300 ${
                selectedItem?.id === item.id
                  ? 'ring-2 ring-gray-900 shadow-lg'
                  : 'hover:shadow-md'
              }`}>
                
                {/* 이미지 */}
                <div className="aspect-square relative bg-gray-100">
                  {item.image_url ? (
                    <Image
                      src={item.image_url}
                      alt={item.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400 font-light">
                      이미지 없음
                    </div>
                  )}
                  
                  {/* Win Streak Badge */}
                  {getWinStreak(item.id) >= 2 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      className="absolute top-3 right-3 bg-gray-900 text-white px-3 py-1 rounded-full font-medium text-sm shadow-lg"
                    >
                      {getWinStreak(item.id)}연승
                    </motion.div>
                  )}
                  
                  {/* WINNER floating rectangle overlay */}
                  {selectedItem?.id === item.id && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30"
                    >
                      <div className="bg-white border-2 border-gray-900 text-gray-900 px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 font-bold text-lg">
                        WINNER
                      </div>
                    </motion.div>
                  )}

                  
                </div>

                {/* 제목 */}
                <div className="p-6 bg-white">
                  <h3 className={`text-xl font-medium text-center transition-colors duration-300 ${
                    selectedItem?.id === item.id ? 'text-gray-900' : 'text-gray-800'
                  }`}>
                    {item.title}
                  </h3>
                  {/* 승률 표시 */}
                  {getItemPercentage(item.id) !== null && (
                    <div className="text-center mt-2">
                      <div className="text-xs text-gray-500">
                        승률: {getItemPercentage(item.id)!.toFixed(1)}%
                      </div>
                    </div>
                  )}
                </div>

                {/* 승리 표시 */}
                {selectedItem?.id === item.id && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute top-4 right-4 bg-gray-900 text-white px-3 py-1 rounded text-sm font-medium"
                  >
                    선택됨
                  </motion.div>
                )}
              </div>
            </motion.div>
          ))}
        </div>

      </div>

      {/* 키보드 단축키 안내 */}
      <div className="fixed bottom-6 right-6 bg-white rounded-lg p-3 shadow-sm border border-gray-200">
        <div className="text-gray-700 text-xs space-y-1">
          <div>← 왼쪽 화살표: 왼쪽 선택</div>
          <div>→ 오른쪽 화살표: 오른쪽 선택</div>
          <div>Z: 되돌리기</div>
          <div>R: 다시시작</div>
        </div>
      </div>

      {/* Footer instruction text */}
      <div className="fixed bottom-10 left-1/2 transform -translate-x-1/2 z-10">
        <div className="bg-white rounded-lg px-6 py-3 border border-gray-200 shadow-sm">
          <div className="text-gray-700 text-sm font-medium text-center">
            {isProcessing ? 'PROCESSING BATTLE...' : 'CLICK TO CHOOSE YOUR CHAMPION'}
          </div>
        </div>
      </div>
    </div>
  );
}