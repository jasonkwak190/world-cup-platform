'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Home, ArrowLeft, RotateCcw, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import YouTubePlayer from '@/components/YouTubePlayer';
import { WorldCupItem } from '@/types/game';
import { GameThemeProps } from './types';

export default function GamingGameTheme({
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

  // Function to render media content (image or video)
  const renderMediaContent = (item: WorldCupItem) => {
    // Check if this item should be rendered as video
    const hasVideoUrl = !!(item.videoUrl && item.videoUrl.trim());
    const hasVideoId = !!(item.videoId && item.videoId.trim());
    const isVideoType = item.mediaType === 'video';
    const hasYouTubeUrl = !!(item.videoUrl && item.videoUrl.includes('youtube.com'));
    
    // Any of these conditions means it's a video
    const isVideo = isVideoType || hasVideoId || hasYouTubeUrl;
    
    // Extract video ID if needed
    let finalVideoId = item.videoId;
    if (isVideo && !finalVideoId && item.videoUrl) {
      const youtubeRegex = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/;
      const match = item.videoUrl.match(youtubeRegex);
      if (match) {
        finalVideoId = match[1];
      }
    }
    
    if (isVideo && finalVideoId) {
      return (
        <YouTubePlayer
          videoId={finalVideoId}
          startTime={item.videoStartTime || 0}
          endTime={item.videoEndTime}
          autoplay={false}
          controls={true}
          playInGame={false}
          className="w-full h-full rounded-xl"
        />
      );
    } else if (item.image_url) {
      return (
        <Image
          src={item.image_url}
          alt={item.title}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
      );
    } else {
      return (
        <div className="flex items-center justify-center h-full text-purple-400/60 font-semibold">
          {isVideo ? '🎬 VIDEO' : 'NO_IMAGE'}
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 relative overflow-hidden">
      {/* 게이밍 배경 효과 */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(147,51,234,0.1),transparent_70%)]"></div>
      <div className="absolute inset-0" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23a855f7' fill-opacity='0.05'%3E%3Cpath d='M20 20l10-10v20l-10-10z'/%3E%3Cpath d='M20 20l-10-10v20l10-10z'/%3E%3C/g%3E%3C/svg%3E")`
      }}></div>

      {/* 헤더 */}
      <div className="relative z-10 p-4 border-b border-purple-500/30 bg-gray-900/80 backdrop-blur-md">
        {/* 상단 버튼들 */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex space-x-2">
            <button
              onClick={onHome}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-purple-500/25"
            >
              <Home className="w-4 h-4" />
              <span>HOME</span>
            </button>
            <button
              onClick={onUndo}
              disabled={!canUndo}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-300 font-semibold ${
                canUndo 
                  ? 'bg-gray-700/80 border border-purple-500/50 text-white hover:bg-gray-600/80 shadow-lg' 
                  : 'bg-gray-800/50 border border-gray-600/50 text-gray-500 cursor-not-allowed'
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>UNDO</span>
            </button>
          </div>

          <div className="flex space-x-2">
            <button
              onClick={onRestart}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-lg hover:from-red-700 hover:to-orange-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-red-500/25"
            >
              <RotateCcw className="w-4 h-4" />
              <span>RESTART</span>
            </button>
            <button
              onClick={onSelectOtherTournament}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg hover:from-green-700 hover:to-teal-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-green-500/25"
            >
              <ChevronRight className="w-4 h-4" />
              <span>OTHER</span>
            </button>
          </div>
        </div>

        {/* 타이틀 - 헤더 중앙에 위치 */}
        <div className="text-center mb-4">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-500 bg-clip-text text-transparent tracking-wider">
            {worldcupData.title}
          </h1>
        </div>

        {/* 프로그레스 바 */}
        <div className="text-center">
          <div className="text-purple-300 font-semibold text-sm mb-2 tracking-wider">
            [{roundName}]
          </div>
          <div className="w-full bg-gray-800/60 rounded-lg h-4 border border-purple-500/30 shadow-inner relative overflow-hidden">
            <div 
              className="bg-gradient-to-r from-purple-500 via-pink-500 to-purple-600 h-full rounded-lg transition-all duration-500 relative"
              style={{ width: `${progress.percentage}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
              {/* 게이밍 스타일 글리치 효과 */}
              <div className="absolute top-0 right-0 w-1 h-full bg-white/60 animate-pulse"></div>
            </div>
          </div>
          <div className="text-purple-400 font-mono text-xs mt-1 tracking-widest">
            PROGRESS: {progress.percentage.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* 메인 게임 영역 - 헤더와 가깝게 */}
      <div className="relative z-10 flex flex-col items-center justify-start pt-6 min-h-[calc(100vh-200px)] p-8">

        {/* 게임 카드들 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-6xl">
          {[currentMatch.left, currentMatch.right].map((item, index) => (
            <motion.div
              key={item.id}
              className={`relative cursor-pointer transition-all duration-300 ${
                isProcessing ? 'pointer-events-none' : ''
              }`}
              whileHover={{ scale: 1.02, y: -5 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onChoice(item)}
            >
              <div className={`relative p-6 rounded-2xl border-2 bg-gray-800/60 backdrop-blur-sm transition-all duration-300 ${
                selectedItem?.id === item.id
                  ? 'border-yellow-400 bg-yellow-400/10 shadow-[0_0_30px_rgba(251,191,36,0.4)] transform scale-105'
                  : 'border-purple-500/40 hover:border-purple-400 hover:bg-purple-500/10 hover:shadow-[0_0_20px_rgba(147,51,234,0.3)]'
              }`}>
                
                {/* 미디어 (이미지 또는 동영상) */}
                <div className="aspect-square mb-4 rounded-xl overflow-hidden bg-gray-900/50 relative border border-purple-500/30">
                  {renderMediaContent(item)}
                  
                  {/* 게이밍 스타일 오버레이 */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                  <div className="absolute top-2 left-2 w-3 h-3 bg-purple-400 rounded-full animate-pulse"></div>
                  
                  {/* Win Streak Badge */}
                  {getWinStreak(item.id) >= 2 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      className="absolute top-2 right-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-3 py-1 rounded-lg font-black text-sm shadow-lg transform rotate-6 border-2 border-yellow-300"
                    >
                      {getWinStreak(item.id)}연승
                    </motion.div>
                  )}
                  
                  {/* WINNER floating rectangle overlay */}
                  {selectedItem?.id === item.id && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
                      animate={{ opacity: 1, scale: 1, rotate: 0 }}
                      className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30"
                    >
                      <div className="bg-gradient-to-r from-cyan-400 to-blue-500 text-black px-6 py-3 rounded-lg border-4 border-yellow-400 shadow-lg shadow-yellow-400/50 flex items-center gap-2 font-bold text-lg">
                        <span className="text-yellow-300">⚡</span>
                        WINNER
                        <span className="text-yellow-300">⚡</span>
                      </div>
                    </motion.div>
                  )}

                </div>

                {/* 제목 */}
                <h3 className={`text-xl font-bold text-center transition-colors duration-300 tracking-wide ${
                  selectedItem?.id === item.id ? 'text-yellow-400' : 'text-white'
                }`}>
                  {item.title}
                </h3>
                {/* 승률 표시 */}
                {getItemPercentage(item.id) !== null && (
                  <div className="text-center mt-2">
                    <div className="text-xs text-purple-400 font-mono tracking-wider">
                      WIN_RATE: {getItemPercentage(item.id)!.toFixed(1)}%
                    </div>
                  </div>
                )}

                {/* 승리 표시 */}
                {selectedItem?.id === item.id && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    className="absolute -top-4 -right-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-4 py-2 rounded-lg font-black text-sm shadow-lg transform rotate-12"
                  >
                    VICTORY!
                  </motion.div>
                )}

                {/* 글로우 효과 */}
                {selectedItem?.id === item.id && (
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-yellow-400/10 via-orange-400/10 to-yellow-400/10 animate-pulse pointer-events-none"></div>
                )}

                {/* 게이밍 코너 장식 */}
                <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-purple-400/50"></div>
                <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-purple-400/50"></div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* VS 표시 */}
        <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20 hidden md:block">
          <div className="relative">
            <div className="w-20 h-20 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center text-white text-2xl font-black shadow-lg border-2 border-purple-400 transform rotate-45">
              <span className="transform -rotate-45">VS</span>
            </div>
            {/* 펄스 효과 */}
            <div className="absolute -inset-2 bg-purple-500/30 rounded-lg animate-ping"></div>
          </div>
        </div>

      </div>

      {/* 키보드 단축키 안내 */}
      <div className="fixed bottom-4 right-4 bg-gray-900/90 backdrop-blur-md rounded-lg p-3 border border-purple-500/30 shadow-lg">
        <div className="text-purple-400 font-mono text-xs space-y-1">
          <div>← LEFT_ARROW: LEFT_CHOICE</div>
          <div>→ RIGHT_ARROW: RIGHT_CHOICE</div>
          <div>Z: UNDO_LAST</div>
          <div>R: RESTART_GAME</div>
        </div>
      </div>

      {/* Footer instruction text */}
      <div className="fixed bottom-10 left-1/2 transform -translate-x-1/2 z-10">
        <div className="bg-gray-900/90 backdrop-blur-md rounded-lg px-6 py-3 border border-purple-500/30 shadow-lg">
          <div className="text-purple-400 font-mono text-sm font-bold tracking-wider text-center">
            {isProcessing ? 'PROCESSING BATTLE...' : 'CLICK TO CHOOSE YOUR CHAMPION'}
          </div>
        </div>
      </div>

      {/* 배경 장식 효과 */}
      <div className="fixed top-20 left-20 text-8xl text-purple-400/5 animate-pulse pointer-events-none">
        ⚔️
      </div>
      <div className="fixed bottom-20 right-20 text-6xl text-pink-400/5 animate-bounce pointer-events-none">
        🎮
      </div>
      <div className="fixed top-1/3 right-10 text-4xl text-purple-500/10 animate-pulse pointer-events-none">
        ⭐
      </div>
    </div>
  );
}