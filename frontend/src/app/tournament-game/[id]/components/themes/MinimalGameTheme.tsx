'use client';

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
  showStats,
  isProcessing,
  canUndo,
  onChoice,
  onUndo,
  onRestart,
  onHome,
  onSelectOtherTournament,
  progress,
  roundName
}: GameThemeProps) {
  if (!currentMatch) return null;

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

        {/* 프로그레스 바 */}
        <div className="text-center">
          <div className="text-gray-700 font-medium text-sm mb-3">
            {roundName} • {progress.currentMatch}번째 대결 (총 {progress.totalMatches}개)
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 relative overflow-hidden">
            <div 
              className="bg-gray-900 h-full rounded-full transition-all duration-500"
              style={{ width: `${progress.percentage}%` }}
            ></div>
          </div>
          <div className="text-gray-600 font-medium text-xs mt-2">
            진행률: {progress.percentage.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* 메인 게임 영역 */}
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] p-8">
        {/* 타이틀 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-light text-gray-900 mb-3 tracking-tight">
            {worldcupData.title}
          </h1>
          <p className="text-gray-600 text-lg font-light">
            어느 쪽이 더 마음에 드시나요?
          </p>
        </div>

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
                </div>

                {/* 제목 */}
                <div className="p-6 bg-white">
                  <h3 className={`text-xl font-medium text-center transition-colors duration-300 ${
                    selectedItem?.id === item.id ? 'text-gray-900' : 'text-gray-800'
                  }`}>
                    {item.title}
                  </h3>
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

        {/* 투표 통계 */}
        <AnimatePresence>
          {showStats && voteStats && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mt-12 bg-white rounded-lg p-6 shadow-sm border border-gray-200"
            >
              <div className="text-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">투표 결과</h3>
                <p className="text-gray-600 text-sm">총 투표수: {voteStats.totalVotes}표</p>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-light text-gray-900">
                    {voteStats.leftPercentage.toFixed(1)}%
                  </div>
                  <div className="text-gray-600 text-sm font-medium">{currentMatch.left.title}</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-light text-gray-900">
                    {voteStats.rightPercentage.toFixed(1)}%
                  </div>
                  <div className="text-gray-600 text-sm font-medium">{currentMatch.right.title}</div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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
    </div>
  );
}