'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Home, ArrowLeft, RotateCcw, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { GameThemeProps } from './types';

export default function NeonGameTheme({
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
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* 네온 배경 효과 */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 via-pink-900/30 to-blue-900/30"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(34,211,238,0.1),transparent_70%)]"></div>

      {/* 헤더 */}
      <div className="relative z-10 p-4 border-b border-cyan-400/30 bg-gray-900/50 backdrop-blur-sm">
        {/* 상단 버튼들 */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex space-x-2">
            <button
              onClick={onHome}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-800/50 border border-cyan-400/50 rounded-lg text-cyan-400 hover:bg-cyan-400/10 transition-all duration-300 font-mono"
            >
              <Home className="w-4 h-4" />
              <span>HOME</span>
            </button>
            <button
              onClick={onUndo}
              disabled={!canUndo}
              className={`flex items-center space-x-2 px-4 py-2 border rounded-lg transition-all duration-300 font-mono ${
                canUndo 
                  ? 'bg-gray-800/50 border-cyan-400/50 text-cyan-400 hover:bg-cyan-400/10' 
                  : 'bg-gray-800/20 border-gray-600/50 text-gray-600 cursor-not-allowed'
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>UNDO</span>
            </button>
          </div>

          <div className="flex space-x-2">
            <button
              onClick={onRestart}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-800/50 border border-pink-400/50 rounded-lg text-pink-400 hover:bg-pink-400/10 transition-all duration-300 font-mono"
            >
              <RotateCcw className="w-4 h-4" />
              <span>RESTART</span>
            </button>
            <button
              onClick={onSelectOtherTournament}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-800/50 border border-yellow-400/50 rounded-lg text-yellow-400 hover:bg-yellow-400/10 transition-all duration-300 font-mono"
            >
              <ChevronRight className="w-4 h-4" />
              <span>SELECT_OTHER</span>
            </button>
          </div>
        </div>

        {/* 프로그레스 바 */}
        <div className="text-center">
          <div className="text-cyan-400 font-mono text-sm mb-2">
            {roundName} • MATCH {progress.currentMatch}/{progress.totalMatches}
          </div>
          <div className="w-full bg-gray-800/50 rounded-full h-3 border border-cyan-400/30">
            <div 
              className="bg-gradient-to-r from-cyan-400 to-pink-400 h-full rounded-full transition-all duration-500 relative overflow-hidden"
              style={{ width: `${progress.percentage}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
            </div>
          </div>
          <div className="text-cyan-300 font-mono text-xs mt-1">
            PROGRESS: {progress.percentage.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* 메인 게임 영역 */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-200px)] p-8">
        {/* 타이틀 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold font-mono bg-gradient-to-r from-cyan-400 to-pink-400 bg-clip-text text-transparent mb-2">
            {worldcupData.title}
          </h1>
          <p className="text-cyan-300 font-mono text-lg">
            &gt;&gt; SELECT_YOUR_CHOICE &lt;&lt;
          </p>
        </div>

        {/* 게임 카드들 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-6xl">
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
              <div className={`relative p-6 rounded-2xl border-2 bg-gray-900/50 backdrop-blur-sm transition-all duration-300 ${
                selectedItem?.id === item.id
                  ? 'border-yellow-400 bg-yellow-400/10 shadow-[0_0_30px_rgba(251,191,36,0.3)]'
                  : 'border-cyan-400/30 hover:border-cyan-400 hover:bg-cyan-400/5'
              }`}>
                
                {/* 이미지 */}
                <div className="aspect-square mb-4 rounded-xl overflow-hidden bg-gray-800/50 relative">
                  {item.image_url ? (
                    <Image
                      src={item.image_url}
                      alt={item.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-cyan-400/50 font-mono">
                      NO_IMAGE
                    </div>
                  )}
                </div>

                {/* 제목 */}
                <h3 className={`text-xl font-bold text-center font-mono transition-colors duration-300 ${
                  selectedItem?.id === item.id ? 'text-yellow-400' : 'text-white'
                }`}>
                  {item.title}
                </h3>

                {/* 승리 표시 */}
                {selectedItem?.id === item.id && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute -top-4 -right-4 bg-yellow-400 text-black px-4 py-2 rounded-full font-black font-mono text-sm shadow-[0_0_20px_rgba(251,191,36,0.5)]"
                  >
                    WINNER!
                  </motion.div>
                )}

                {/* 네온 글로우 효과 */}
                {selectedItem?.id === item.id && (
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-400/20 to-pink-400/20 animate-pulse -z-10"></div>
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
              className="mt-8 bg-gray-900/80 backdrop-blur-sm rounded-xl p-6 border border-cyan-400/30"
            >
              <div className="text-center mb-4">
                <h3 className="text-lg font-bold text-cyan-400 font-mono">BATTLE_STATS</h3>
                <p className="text-gray-400 font-mono text-sm">TOTAL_VOTES: {voteStats.totalVotes}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-cyan-400 font-mono">
                    {voteStats.leftPercentage.toFixed(1)}%
                  </div>
                  <div className="text-gray-400 font-mono text-sm">{currentMatch.left.title}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-pink-400 font-mono">
                    {voteStats.rightPercentage.toFixed(1)}%
                  </div>
                  <div className="text-gray-400 font-mono text-sm">{currentMatch.right.title}</div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 키보드 단축키 안내 */}
      <div className="fixed bottom-4 right-4 bg-gray-900/80 backdrop-blur-sm rounded-lg p-3 border border-cyan-400/30">
        <div className="text-cyan-400 font-mono text-xs space-y-1">
          <div>← LEFT_ARROW: LEFT_CHOICE</div>
          <div>→ RIGHT_ARROW: RIGHT_CHOICE</div>
          <div>Z: UNDO_LAST</div>
          <div>R: RESTART_GAME</div>
        </div>
      </div>

      {/* 배경 장식 효과 */}
      <div className="fixed top-20 left-20 text-8xl text-cyan-400/5 font-mono animate-pulse pointer-events-none">
        &lt;/&gt;
      </div>
      <div className="fixed bottom-20 right-20 text-6xl text-pink-400/5 font-mono animate-pulse pointer-events-none">
        [GAME]
      </div>
    </div>
  );
}