import { useState, useEffect } from 'react';
import { Match, WorldCupItem } from '@/types/game';
import { motion, AnimatePresence } from 'framer-motion';
import { getRoundStyle, getRoundBorderStyle, getRoundCheckmarkStyle } from '@/utils/tournament';
import ParticleEffect from './ParticleEffect';
import { useTouchGestures, useKeyboardShortcuts } from '@/hooks/useTouchGestures';
// import { LiveActivityIndicator } from './RealtimeStats'; // Disabled

interface GameScreenProps {
  match: Match;
  roundName: string;
  round: number;
  totalRounds: number;
  worldcupId?: string;
  onChoice: (winner: WorldCupItem) => void;
}

export default function GameScreen({ match, round, totalRounds, worldcupId, onChoice }: GameScreenProps) {
  const [selectedItem, setSelectedItem] = useState<WorldCupItem | null>(null);
  const [isChoosing, setIsChoosing] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [animationPhase, setAnimationPhase] = useState<'initial' | 'center' | 'return' | 'showOther'>('initial');


  // 🚨 강력한 URL 정리 및 수정 함수
  const cleanAndFixImageUrl = (imageUrl: string | File): string => {
    if (typeof imageUrl !== 'string') return '';
    if (!imageUrl || imageUrl.trim() === '') return '';
    
    // 1. localhost URL 완전 차단 및 수정
    if (imageUrl.includes('localhost')) {
      console.error('🚨 BLOCKING localhost URL:', imageUrl);
      
      // UUID 패턴과 파일명 추출 시도
      const patterns = [
        /([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/items\/[^\/\?]+\.(gif|jpg|jpeg|png|webp))/i,
        /([0-9a-f-]+\/items\/[^\/\?]+\.(gif|jpg|jpeg|png|webp))/i,
        /(items\/[^\/\?]+\.(gif|jpg|jpeg|png|webp))/i
      ];
      
      for (const pattern of patterns) {
        const match = imageUrl.match(pattern);
        if (match) {
          const path = match[1];
          const cleanUrl = `https://rctoxfcyzz5iikopbsne.supabase.co/storage/v1/object/public/worldcup-images/${path}`;
          console.log('🔧 Fixed localhost URL to:', cleanUrl);
          return cleanUrl;
        }
      }
      
      console.error('❌ Cannot fix localhost URL, blocking:', imageUrl);
      return ''; // 완전히 차단
    }
    
    // 2. blob URL 차단
    if (imageUrl.startsWith('blob:')) {
      console.error('🚨 BLOCKING blob URL:', imageUrl);
      return '';
    }
    
    // 3. 정상 Supabase URL인지 확인
    if (imageUrl.includes('rctoxfcyzz5iikopbsne.supabase.co')) {
      return imageUrl;
    }
    
    // 4. 기타 http URL 허용
    if (imageUrl.startsWith('http')) {
      return imageUrl;
    }
    
    // 5. base64 이미지 허용
    if (imageUrl.startsWith('data:image/')) {
      return imageUrl;
    }
    
    console.warn('⚠️ Unknown URL format:', imageUrl.substring(0, 100));
    return imageUrl;
  };

  // 매치 데이터를 강력하게 정리
  const cleanedMatch = {
    ...match,
    item1: {
      ...match.item1,
      image: cleanAndFixImageUrl(match.item1.image)
    },
    item2: {
      ...match.item2,
      image: cleanAndFixImageUrl(match.item2.image)
    }
  };

  // 🚨 DEBUG: 정리된 매치 데이터 로깅
  console.log('🔍 Cleaned match data:', {
    item1: {
      title: cleanedMatch.item1.title,
      originalImage: match.item1.image,
      cleanedImage: cleanedMatch.item1.image,
      isBlocked: cleanedMatch.item1.image === ''
    },
    item2: {
      title: cleanedMatch.item2.title,
      originalImage: match.item2.image,
      cleanedImage: cleanedMatch.item2.image,
      isBlocked: cleanedMatch.item2.image === ''
    }
  });

  // 🎬 GIF 안정화 함수 - 깜빡임 방지
  const stabilizeGifAnimation = (imgElement: HTMLImageElement) => {
    const src = imgElement.src;
    
    // localhost URL이 있으면 완전히 차단
    if (src.includes('localhost')) {
      console.error('🚨 Blocking GIF with localhost URL:', src);
      imgElement.style.display = 'none';
      return;
    }
    
    // GIF 파일인지 확인
    const isGif = src.toLowerCase().includes('.gif') || src.startsWith('data:image/gif');
    
    if (isGif) {
      console.log('🎬 Stabilizing GIF animation:', src.substring(0, 50));
      
      // GIF 안정화 CSS 적용
      imgElement.style.imageRendering = 'auto';
      imgElement.style.animationPlayState = 'running';
      imgElement.style.webkitAnimationPlayState = 'running';
      imgElement.style.animationIterationCount = 'infinite';
      imgElement.style.webkitAnimationIterationCount = 'infinite';
      
      // 깜빡임 방지를 위한 안정화
      imgElement.style.opacity = '1';
      imgElement.style.visibility = 'visible';
      
      // 한 번만 재시작 (무한 루프 방지)
      if (!imgElement.dataset.stabilized) {
        imgElement.dataset.stabilized = 'true';
        
        // 짧은 지연 후 한 번만 재로드
        setTimeout(() => {
          if (imgElement.src === src) { // 동일한 이미지인 경우에만
            const newSrc = src.includes('?') ? src.split('?')[0] + '?t=' + Date.now() : src + '?t=' + Date.now();
            imgElement.src = newSrc;
            console.log('🔄 GIF stabilized with timestamp:', newSrc.substring(0, 50));
          }
        }, 100);
      }
    } else {
      // 일반 이미지 안정화
      imgElement.style.opacity = '1';
      imgElement.style.visibility = 'visible';
    }
  };

  // 컴포넌트가 마운트되거나 매치가 변경될 때 이미지 안정화
  useEffect(() => {
    const timer = setTimeout(() => {
      const images = document.querySelectorAll('img');
      images.forEach(img => {
        if (img instanceof HTMLImageElement) {
          stabilizeGifAnimation(img);
        }
      });
    }, 200); // 더 긴 지연으로 안정성 향상

    return () => clearTimeout(timer);
  }, [match.item1.id, match.item2.id]);
  
  const roundStyle = getRoundStyle(round, totalRounds);
  
  const particleColors = {
    1: ['#fbbf24', '#f59e0b', '#d97706'], // 결승 - 골드
    2: ['#a855f7', '#9333ea', '#7c3aed'], // 준결승 - 퍼플
    3: ['#3b82f6', '#2563eb', '#1d4ed8'], // 8강 - 블루
    4: ['#10b981', '#059669', '#047857'], // 16강 - 그린
    5: ['#6366f1', '#4f46e5', '#4338ca'], // 32강 - 인디고
  }[totalRounds - round + 1] || ['#6366f1', '#4f46e5', '#4338ca'];

  const handleChoice = (item: WorldCupItem) => {
    if (isChoosing) return;
    
    setSelectedItem(item);
    setIsChoosing(true);
    setAnimationPhase('center');
    
    // PIKU 스타일: 선택된 아이템만 확대, 1.5초 정지
    setTimeout(() => {
      // 다음 매치로 전환
      onChoice(item);
      setSelectedItem(null);
      setIsChoosing(false);
      setIsTransitioning(false);
      setAnimationPhase('initial');
    }, 1500); // 1.5초 정지
  };

  // Touch gestures and keyboard shortcuts
  const gestureRef = useTouchGestures({
    onSwipeLeft: () => {
      if (!isChoosing) {
        handleChoice(cleanedMatch.item2); // Right item wins on swipe left
      }
    },
    onSwipeRight: () => {
      if (!isChoosing) {
        handleChoice(cleanedMatch.item1); // Left item wins on swipe right
      }
    },
  });

  useKeyboardShortcuts({
    onLeftArrow: () => {
      if (!isChoosing) {
        handleChoice(cleanedMatch.item1); // Left arrow selects left item
      }
    },
    onRightArrow: () => {
      if (!isChoosing) {
        handleChoice(cleanedMatch.item2); // Right arrow selects right item
      }
    },
  });

  return (
    <div 
      ref={gestureRef}
      className="flex flex-col items-center justify-start min-h-screen touch-manipulation w-full"
    >
      {/* Particle Effect */}
      <ParticleEffect count={roundStyle.particleCount} colors={particleColors} />
      
      {/* Live Activity Indicator */}
      {/* {worldcupId && <LiveActivityIndicator worldcupId={worldcupId} />} */}
      
      {/* Controls Hint */}
      <div className="fixed top-4 right-4 bg-black/50 text-white text-xs px-3 py-2 rounded-lg backdrop-blur-sm z-50">
        <div className="hidden sm:block">
          ← → 키보드로 선택
        </div>
        <div className="block sm:hidden">
          👆 탭하거나 스와이프하세요
        </div>
      </div>

      {/* VS Section - PIKU style with overlapping VS */}
      <div className="relative flex items-center justify-center w-full">
        {/* Item 1 */}
        <motion.div
          initial={{ opacity: 0, x: -100 }}
          animate={{ 
            opacity: selectedItem && selectedItem.id !== match.item1.id ? 0 : 1,
            x: selectedItem?.id === match.item1.id ? '50%' : 0,
            scale: selectedItem?.id === match.item1.id ? 1.2 : 1,
            zIndex: selectedItem?.id === match.item1.id ? 50 : 0
          }}
          transition={{ 
            duration: 0.4,
            ease: "easeInOut",
            delay: animationPhase === 'initial' ? 0.2 : 0
          }}
          whileHover={!isChoosing ? {} : {}}
          whileTap={!isChoosing ? { scale: 0.95 } : {}}
          className={`flex-1 cursor-pointer transition-all duration-500 relative focus:outline-none z-10 ${isChoosing ? 'pointer-events-none' : ''} ${selectedItem?.id === match.item1.id ? '!opacity-100 !block' : ''}`}
          onClick={() => handleChoice(cleanedMatch.item1)}
        >
          <AnimatePresence>
            {selectedItem?.id === match.item1.id && (
              <>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className={`absolute -top-6 -right-6 z-10 ${getRoundCheckmarkStyle(round, totalRounds)} text-white rounded-full w-16 h-16 flex items-center justify-center text-3xl font-bold shadow-lg`}
                >
                  ✓
                </motion.div>
                
              </>
            )}
          </AnimatePresence>
          
          <div className={`bg-white rounded-2xl shadow-2xl hover:shadow-emerald-500/25 transition-all duration-300 focus:outline-none ${
            selectedItem?.id === match.item1.id ? getRoundBorderStyle(round, totalRounds) : ''
          }`}>
            {/* Item Image */}
            <div className="h-[28rem] sm:h-[32rem] md:h-[36rem] lg:h-[40rem] xl:h-[44rem] bg-gradient-to-br from-emerald-100 to-blue-100 rounded-t-2xl mb-3 overflow-hidden relative group">
              {match.item1.image ? (
                <>
                  <img 
                    src={cleanedMatch.item1.image} 
                    alt={match.item1.title}
                    className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500"
                    style={{ 
                      imageRendering: 'auto',
                      animationPlayState: 'running',
                      willChange: 'auto'
                    }}
                    loading="eager"
                    decoding="async"
                    onLoad={(e) => {
                      // 이미지 안정화
                      stabilizeGifAnimation(e.currentTarget);
                    }}
                    onError={(e) => {
                      const src = e.currentTarget.src;
                      console.error('❌ Image failed to load:', {
                        src: src.substring(0, 100) + '...',
                        isLocalhost: src.includes('localhost'),
                        isSupabase: src.includes('supabase'),
                        isBlob: src.startsWith('blob:')
                      });
                      
                      // localhost URL이면 완전히 차단
                      if (src.includes('localhost')) {
                        console.error('🚨 Completely blocking localhost URL');
                        e.currentTarget.style.display = 'none';
                        const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                        if (nextElement) {
                          nextElement.classList.remove('hidden');
                        }
                        return;
                      }
                      
                      // Base64 이미지는 표시 유지
                      if (src.startsWith('data:image/') && src.length > 1000) {
                        e.currentTarget.style.display = 'block';
                        e.currentTarget.style.visibility = 'visible';
                        e.currentTarget.style.opacity = '1';
                        return;
                      }
                      
                      // 기타 에러의 경우 플레이스홀더 표시
                      e.currentTarget.style.display = 'none';
                      const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                      if (nextElement) {
                        nextElement.classList.remove('hidden');
                      }
                    }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </>
              ) : null}
              <div className={`w-full h-full flex items-center justify-center ${match.item1.image ? 'hidden' : ''}`}>
                <div className="text-center">
                  <div className="text-9xl mb-2">🎭</div>
                  <div className="text-gray-600 font-medium text-xl">
                    {match.item1.title}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Item Info */}
            <div className="text-center py-2 sm:py-3 px-2 sm:px-4">
              <h3 className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold text-gray-900 line-clamp-2 leading-tight">
                {match.item1.title}
              </h3>
              {match.item1.description && (
                <p className="text-xs sm:text-sm md:text-base text-gray-600 line-clamp-1 mt-1">
                  {match.item1.description}
                </p>
              )}
            </div>
          </div>
        </motion.div>

        {/* VS Divider - PIKU style overlapping */}
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ 
            opacity: selectedItem ? 0 : 1,
            scale: selectedItem ? 0 : 1
          }}
          transition={{ 
            duration: 0.3,
            ease: "easeInOut",
            delay: animationPhase === 'initial' ? 0.6 : 0
          }}
          className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30"
        >
          <div className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 xl:w-28 xl:h-28 2xl:w-32 2xl:h-32 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center shadow-2xl border-2 sm:border-4 border-white">
            <span className="text-sm sm:text-lg md:text-xl lg:text-2xl xl:text-3xl 2xl:text-4xl font-bold text-white">VS</span>
          </div>
        </motion.div>

        {/* Item 2 */}
        <motion.div
          initial={{ opacity: 0, x: 100 }}
          animate={{ 
            opacity: selectedItem && selectedItem.id !== match.item2.id ? 0 : 1,
            x: selectedItem?.id === match.item2.id ? '-50%' : 0,
            scale: selectedItem?.id === match.item2.id ? 1.2 : 1,
            zIndex: selectedItem?.id === match.item2.id ? 50 : 0
          }}
          transition={{ 
            duration: 0.4,
            ease: "easeInOut",
            delay: animationPhase === 'initial' ? 0.4 : 0
          }}
          whileHover={!isChoosing ? {} : {}}
          whileTap={!isChoosing ? { scale: 0.95 } : {}}
          className={`flex-1 cursor-pointer transition-all duration-500 relative focus:outline-none z-10 ${isChoosing ? 'pointer-events-none' : ''} ${selectedItem?.id === match.item2.id ? '!opacity-100 !block' : ''}`}
          onClick={() => handleChoice(cleanedMatch.item2)}
        >
          <AnimatePresence>
            {selectedItem?.id === match.item2.id && (
              <>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className={`absolute -top-6 -right-6 z-10 ${getRoundCheckmarkStyle(round, totalRounds)} text-white rounded-full w-16 h-16 flex items-center justify-center text-3xl font-bold shadow-lg`}
                >
                  ✓
                </motion.div>
                
              </>
            )}
          </AnimatePresence>
          
          <div className={`bg-white rounded-2xl shadow-2xl hover:shadow-emerald-500/25 transition-all duration-300 focus:outline-none ${
            selectedItem?.id === match.item2.id ? getRoundBorderStyle(round, totalRounds) : ''
          }`}>
            {/* Item Image */}
            <div className="h-[28rem] sm:h-[32rem] md:h-[36rem] lg:h-[40rem] xl:h-[44rem] bg-gradient-to-br from-purple-100 to-pink-100 rounded-t-2xl mb-3 overflow-hidden relative group">
              {match.item2.image ? (
                <>
                <img 
                  src={cleanedMatch.item2.image} 
                  alt={match.item2.title}
                  className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500"
                  style={{ 
                    imageRendering: 'auto',
                    animationPlayState: 'running',
                    willChange: 'auto'
                  }}
                  loading="eager"
                  decoding="async"
                  onLoad={(e) => {
                    // 이미지 안정화
                    stabilizeGifAnimation(e.currentTarget);
                  }}
                  onError={(e) => {
                    const src = e.currentTarget.src;
                    console.error('❌ Image failed to load:', {
                      src: src.substring(0, 100) + '...',
                      isLocalhost: src.includes('localhost'),
                      isSupabase: src.includes('supabase'),
                      isBlob: src.startsWith('blob:')
                    });
                    
                    // localhost URL이면 완전히 차단
                    if (src.includes('localhost')) {
                      console.error('🚨 Completely blocking localhost URL');
                      e.currentTarget.style.display = 'none';
                      const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                      if (nextElement) {
                        nextElement.classList.remove('hidden');
                      }
                      return;
                    }
                    
                    // Base64 이미지는 표시 유지
                    if (src.startsWith('data:image/') && src.length > 1000) {
                      e.currentTarget.style.display = 'block';
                      e.currentTarget.style.visibility = 'visible';
                      e.currentTarget.style.opacity = '1';
                      return;
                    }
                    
                    // 기타 에러의 경우 플레이스홀더 표시
                    e.currentTarget.style.display = 'none';
                    const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                    if (nextElement) {
                      nextElement.classList.remove('hidden');
                    }
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </>
              ) : null}
              <div className={`w-full h-full flex items-center justify-center ${match.item2.image ? 'hidden' : ''}`}>
                <div className="text-center">
                  <div className="text-9xl mb-2">🎨</div>
                  <div className="text-gray-600 font-medium text-xl">
                    {match.item2.title}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Item Info */}
            <div className="text-center py-2 sm:py-3 px-2 sm:px-4">
              <h3 className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold text-gray-900 line-clamp-2 leading-tight">
                {match.item2.title}
              </h3>
              {match.item2.description && (
                <p className="text-xs sm:text-sm md:text-base text-gray-600 line-clamp-1 mt-1">
                  {match.item2.description}
                </p>
              )}
            </div>
          </div>
        </motion.div>
      </div>

    </div>
  );
}