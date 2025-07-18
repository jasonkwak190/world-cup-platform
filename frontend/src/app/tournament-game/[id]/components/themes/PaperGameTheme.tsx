'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Home, ArrowLeft, RotateCcw, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { GameThemeProps } from './types';

export default function PaperGameTheme({
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
    <div className="min-h-screen bg-amber-50 relative">
      {/* 종이 텍스처 배경 */}
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d97706' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }}></div>

      {/* 헤더 */}
      <div className="relative z-10 p-4 border-b-2 border-dashed border-amber-300 bg-white/80">
        {/* 상단 버튼들 */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex space-x-2">
            <button
              onClick={onHome}
              className="flex items-center space-x-2 px-4 py-2 bg-white border-2 border-dashed border-amber-600 rounded-lg text-amber-800 hover:bg-amber-50 transition-all duration-300 font-semibold transform hover:-rotate-1"
            >
              <Home className="w-4 h-4" />
              <span>홈으로</span>
            </button>
            <button
              onClick={onUndo}
              disabled={!canUndo}
              className={`flex items-center space-x-2 px-4 py-2 border-2 border-dashed rounded-lg transition-all duration-300 font-semibold transform hover:rotate-1 ${
                canUndo 
                  ? 'bg-white border-amber-600 text-amber-800 hover:bg-amber-50' 
                  : 'bg-gray-100 border-gray-400 text-gray-500 cursor-not-allowed'
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>되돌리기</span>
            </button>
          </div>

          <div className="flex space-x-2">
            <button
              onClick={onRestart}
              className="flex items-center space-x-2 px-4 py-2 bg-white border-2 border-dashed border-orange-500 rounded-lg text-orange-700 hover:bg-orange-50 transition-all duration-300 font-semibold transform hover:-rotate-1"
            >
              <RotateCcw className="w-4 h-4" />
              <span>다시하기</span>
            </button>
            <button
              onClick={onSelectOtherTournament}
              className="flex items-center space-x-2 px-4 py-2 bg-white border-2 border-dashed border-amber-600 rounded-lg text-amber-800 hover:bg-amber-50 transition-all duration-300 font-semibold transform hover:rotate-1"
            >
              <ChevronRight className="w-4 h-4" />
              <span>다른 토너먼트</span>
            </button>
          </div>
        </div>

        {/* 프로그레스 바 */}
        <div className="text-center">
          <div className="text-amber-800 font-bold text-sm mb-2 transform -rotate-1">
            {roundName} • {progress.currentMatch}번째 대결 (총 {progress.totalMatches}개)
          </div>
          <div className="w-full bg-amber-100 rounded-lg h-4 border-2 border-dashed border-amber-300 relative">
            <div 
              className="bg-gradient-to-r from-amber-500 to-orange-500 h-full rounded-lg transition-all duration-500 relative overflow-hidden"
              style={{ width: `${progress.percentage}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
            </div>
          </div>
          <div className="text-amber-700 font-medium text-xs mt-1 transform rotate-1">
            진행률: {progress.percentage.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* 메인 게임 영역 */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-200px)] p-8">
        {/* 타이틀 */}
        <div className="text-center mb-8">
          <div className="inline-block bg-white rounded-lg p-6 border-2 border-dashed border-amber-600 transform -rotate-1 shadow-lg shadow-amber-200 mb-4">
            <h1 className="text-4xl font-bold text-amber-900 mb-2">
              {worldcupData.title}
            </h1>
            <p className="text-amber-700 text-lg font-medium">
              어느 쪽이 더 마음에 드시나요?
            </p>
          </div>
          
          {/* 종이 테이프 효과 */}
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-20 h-6 bg-amber-300 opacity-60 transform rotate-12"></div>
        </div>

        {/* 게임 카드들 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-6xl">
          {[currentMatch.left, currentMatch.right].map((item, index) => (
            <motion.div
              key={item.id}
              className={`relative cursor-pointer transition-all duration-300 ${
                isProcessing ? 'pointer-events-none' : ''
              }`}
              whileHover={{ scale: 1.02, rotate: index % 2 === 0 ? 1 : -1 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onChoice(item)}
            >
              <div className={`relative p-6 rounded-lg border-2 border-dashed bg-white shadow-lg transition-all duration-300 transform ${
                index % 2 === 0 ? 'rotate-1' : '-rotate-1'
              } ${
                selectedItem?.id === item.id
                  ? 'border-orange-500 bg-orange-50 shadow-xl shadow-orange-200 scale-105'
                  : 'border-amber-600 hover:shadow-xl hover:border-orange-500'
              }`}>
                
                {/* 이미지 */}
                <div className="aspect-square mb-4 rounded-lg overflow-hidden bg-amber-50 relative border-2 border-dashed border-amber-300">
                  {item.image_url ? (
                    <Image
                      src={item.image_url}
                      alt={item.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-amber-500/50 font-medium">
                      이미지 없음
                    </div>
                  )}
                </div>

                {/* 제목 */}
                <h3 className={`text-xl font-bold text-center transition-colors duration-300 ${
                  selectedItem?.id === item.id ? 'text-orange-800' : 'text-amber-900'
                }`}>
                  {item.title}
                </h3>

                {/* 승리 표시 */}
                {selectedItem?.id === item.id && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
                    animate={{ opacity: 1, scale: 1, rotate: 5 }}
                    className="absolute -top-3 -right-3 bg-orange-500 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-lg transform rotate-12"
                  >
                    선택됨! ✓
                  </motion.div>
                )}

                {/* 스테이플 효과 */}
                <div className="absolute -top-1 left-4 w-1 h-4 bg-gray-400 transform rotate-45"></div>
                <div className="absolute -top-1 right-4 w-1 h-4 bg-gray-400 transform -rotate-45"></div>
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
              className="mt-8 bg-white rounded-lg p-6 border-2 border-dashed border-amber-600 shadow-lg transform rotate-1"
            >
              <div className="text-center mb-4">
                <h3 className="text-lg font-bold text-amber-800">투표 결과</h3>
                <p className="text-amber-600 text-sm">총 투표수: {voteStats.totalVotes}표</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-amber-800">
                    {voteStats.leftPercentage.toFixed(1)}%
                  </div>
                  <div className="text-amber-600 text-sm">{currentMatch.left.title}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-700">
                    {voteStats.rightPercentage.toFixed(1)}%
                  </div>
                  <div className="text-amber-600 text-sm">{currentMatch.right.title}</div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 키보드 단축키 안내 */}
      <div className="fixed bottom-4 right-4 bg-white rounded-lg p-3 border-2 border-dashed border-amber-600 shadow-lg transform rotate-2">
        <div className="text-amber-800 font-medium text-xs space-y-1">
          <div>← 왼쪽 화살표: 왼쪽 선택</div>
          <div>→ 오른쪽 화살표: 오른쪽 선택</div>
          <div>Z: 되돌리기</div>
          <div>R: 다시시작</div>
        </div>
      </div>

      {/* 배경 장식 */}
      <div className="absolute top-10 left-10 text-6xl text-amber-200 transform rotate-12 opacity-30 pointer-events-none">
        📝
      </div>
      <div className="absolute bottom-10 right-10 text-4xl text-amber-300 transform -rotate-12 opacity-40 pointer-events-none">
        ✂️
      </div>
      
      {/* 종이 찢어진 효과 */}
      <div className="absolute bottom-0 left-0 w-full h-8 bg-amber-100 opacity-50" style={{
        clipPath: 'polygon(0% 50%, 5% 0%, 10% 100%, 15% 30%, 20% 80%, 25% 20%, 30% 90%, 35% 40%, 40% 70%, 45% 10%, 50% 60%, 55% 30%, 60% 90%, 65% 20%, 70% 80%, 75% 40%, 80% 70%, 85% 10%, 90% 90%, 95% 30%, 100% 80%, 100% 100%, 0% 100%)'
      }}></div>
    </div>
  );
}