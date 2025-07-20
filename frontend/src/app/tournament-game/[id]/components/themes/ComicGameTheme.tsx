'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Home, ArrowLeft, RotateCcw, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import YouTubePlayer from '@/components/YouTubePlayer';
import { WorldCupItem } from '@/types/game';
import { GameThemeProps } from './types';

export default function ComicGameTheme({
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
        <div className="flex items-center justify-center h-full text-purple-500/60 font-bold">
          {isVideo ? '🎬 동영상' : 'NO IMAGE!'}
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 relative">
      {/* 만화 도트 패턴 배경 */}
      <div className="absolute inset-0 opacity-20" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%235b21b6' fill-opacity='0.4'%3E%3Ccircle cx='3' cy='3' r='3'/%3E%3Ccircle cx='13' cy='13' r='3'/%3E%3C/g%3E%3C/svg%3E")`
      }}></div>

      {/* 헤더 */}
      <div className="relative z-10 p-4 border-b-4 border-purple-400 bg-white/90 backdrop-blur-sm">
        {/* 상단 버튼들 */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex space-x-2">
            <button
              onClick={onHome}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              <Home className="w-4 h-4" />
              <span>홈으로</span>
            </button>
            <button
              onClick={onUndo}
              disabled={!canUndo}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-bold shadow-lg transition-all duration-300 transform hover:scale-105 ${
                canUndo 
                  ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-white hover:shadow-xl' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>되돌리기</span>
            </button>
          </div>

          <div className="flex space-x-2">
            <button
              onClick={onRestart}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-orange-400 to-red-500 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              <RotateCcw className="w-4 h-4" />
              <span>다시하기</span>
            </button>
            <button
              onClick={onSelectOtherTournament}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-400 to-blue-500 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              <ChevronRight className="w-4 h-4" />
              <span>다른 토너먼트</span>
            </button>
          </div>
        </div>

        {/* 타이틀 - 헤더 중앙에 위치 */}
        <div className="text-center mb-4">
          <h1 className="text-3xl font-black text-purple-800 transform skew-x-6">
            {worldcupData.title}
          </h1>
        </div>

        {/* 프로그레스 바 */}
        <div className="text-center">
          <div className="text-purple-800 font-black text-sm mb-2 transform -skew-x-12">
            {roundName}
          </div>
          <div className="w-full bg-white rounded-full h-6 border-4 border-purple-400 shadow-lg relative overflow-hidden">
            <div 
              className="bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 h-full rounded-full transition-all duration-500 relative"
              style={{ width: `${progress.percentage}%` }}
            >
              {/* 만화 스타일 하이라이트 */}
              <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/40 to-transparent rounded-full"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
            </div>
          </div>
          <div className="text-purple-700 font-bold text-xs mt-1 transform skew-x-12">
            진행률: {progress.percentage.toFixed(1)}%
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
              whileHover={{ scale: 1.05, rotate: index % 2 === 0 ? 2 : -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onChoice(item)}
            >
              <div className={`relative p-4 rounded-2xl border-4 shadow-xl transition-all duration-300 transform ${
                index % 2 === 0 ? 'rotate-1' : '-rotate-1'
              } ${
                selectedItem?.id === item.id
                  ? 'border-yellow-400 bg-gradient-to-br from-yellow-100 to-orange-100 shadow-2xl scale-110'
                  : 'border-purple-400 bg-white hover:shadow-2xl hover:border-pink-400'
              }`}>
                
                {/* 미디어 (이미지 또는 동영상) */}
                <div className="aspect-square mb-4 rounded-xl overflow-hidden bg-purple-50 relative border-4 border-purple-300 shadow-lg">
                  {renderMediaContent(item)}
                  
                  {/* 만화 스타일 하이라이트 */}
                  <div className="absolute top-2 left-2 w-8 h-8 bg-white/60 rounded-full blur-sm"></div>
                  
                  {/* Win Streak Badge */}
                  {getWinStreak(item.id) >= 2 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      className="absolute top-2 right-2 bg-gradient-to-r from-red-500 to-yellow-400 text-white px-3 py-1 rounded-xl font-black text-sm shadow-lg border-4 border-white transform -rotate-12"
                    >
                      {getWinStreak(item.id)}연승
                    </motion.div>
                  )}
                  
                </div>

                {/* 제목 */}
                <h3 className={`text-xl font-black text-center transition-colors duration-300 transform ${
                  selectedItem?.id === item.id ? 'text-orange-800 scale-110' : 'text-purple-800'
                } ${index % 2 === 0 ? 'skew-x-3' : '-skew-x-3'}`}>
                  {item.title}
                </h3>
                {/* 승률 표시 */}
                {getItemPercentage(item.id) !== null && (
                  <div className="text-center mt-2">
                    <div className="text-xs text-purple-600 font-bold">
                      승률: {getItemPercentage(item.id)!.toFixed(1)}%
                    </div>
                  </div>
                )}

                {/* 승리 표시 */}
                {selectedItem?.id === item.id && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5, rotate: -30 }}
                    animate={{ opacity: 1, scale: 1, rotate: 15 }}
                    className="absolute -top-4 -right-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-2 rounded-full font-black text-sm shadow-xl transform rotate-12"
                  >
                    WIN! 🏆
                  </motion.div>
                )}

                {/* 만화 효과음 */}
                {selectedItem?.id === item.id && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-2xl animate-pulse"
                  >
                    💯
                  </motion.div>
                )}

                {/* 만화 스타일 테두리 효과 */}
                <div className="absolute inset-0 rounded-2xl border-2 border-white/50 pointer-events-none"></div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* VS 표시 */}
        <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20 hidden md:block">
          <div className="relative">
            <div className="w-20 h-20 bg-gradient-to-r from-red-500 to-yellow-500 rounded-full flex items-center justify-center text-white text-2xl font-black shadow-xl border-4 border-white transform rotate-12">
              VS
            </div>
            {/* 충격 효과 */}
            <div className="absolute -inset-4 bg-yellow-300 rounded-full opacity-30 animate-ping"></div>
          </div>
        </div>

      </div>

      {/* 키보드 단축키 안내 */}
      <div className="fixed bottom-4 right-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl p-3 border-4 border-white shadow-xl transform rotate-2">
        <div className="font-bold text-xs space-y-1">
          <div>← 왼쪽 화살표: 왼쪽 선택</div>
          <div>→ 오른쪽 화살표: 오른쪽 선택</div>
          <div>Z: 되돌리기</div>
          <div>R: 다시시작</div>
        </div>
      </div>

      {/* Footer instruction text */}
      <div className="fixed bottom-10 left-1/2 transform -translate-x-1/2 z-10">
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl px-6 py-3 border-4 border-white shadow-xl transform -rotate-1">
          <div className="font-black text-sm text-center">
            {isProcessing ? 'PROCESSING BATTLE...' : 'CLICK TO CHOOSE YOUR CHAMPION'}
          </div>
        </div>
      </div>

      {/* 배경 장식 */}
      <div className="absolute top-10 left-10 text-6xl text-purple-300 transform rotate-12 opacity-30 pointer-events-none animate-bounce">
        💫
      </div>
      <div className="absolute bottom-10 right-10 text-4xl text-pink-400 transform -rotate-12 opacity-40 pointer-events-none animate-pulse">
        🎯
      </div>
      <div className="absolute top-1/2 left-4 text-3xl text-blue-400 transform rotate-45 opacity-25 pointer-events-none">
        ⚡
      </div>
    </div>
  );
}