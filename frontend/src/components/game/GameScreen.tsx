import { useState, useEffect } from 'react';
import { Match, WorldCupItem } from '@/types/game';
import { motion, AnimatePresence } from 'framer-motion';
import { getRoundStyle, getRoundBorderStyle, getRoundCheckmarkStyle } from '@/utils/tournament';
import ParticleEffect from '../ParticleEffect';
import { useTouchGestures, useKeyboardShortcuts } from '@/hooks/useTouchGestures';
import YouTubePlayer from '../YouTubePlayer';
import { Play, Youtube } from 'lucide-react';

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
      image: cleanAndFixImageUrl(match.item1.image || match.item1.image_url || '')
    },
    item2: {
      ...match.item2,
      image: cleanAndFixImageUrl(match.item2.image || match.item2.image_url || '')
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
    
    // VS 이미지는 안전한 정적 파일이므로 제외
    if (src.includes('/vs-cute.png')) {
      return;
    }
    
    // localhost URL이 있으면 완전히 차단 (VS 이미지 제외)
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

  // 미디어 렌더링 함수 (이미지 또는 동영상)
  const renderMediaContent = (item: WorldCupItem, gradientClass: string) => {
    // 🔍 더 강력한 동영상 아이템 감지 로직
    const hasVideoUrl = !!(item.videoUrl && item.videoUrl.trim());
    const hasVideoId = !!(item.videoId && item.videoId.trim());
    const isVideoType = item.mediaType === 'video';
    const hasYouTubeUrl = !!(item.videoUrl && item.videoUrl.includes('youtube.com'));
    
    // 여러 조건 중 하나라도 만족하면 비디오로 판단
    const isVideo = isVideoType || hasVideoId || hasYouTubeUrl;
    
    // 디버깅: 모든 아이템에 대해 상세 로그
    console.log('🔍 Media item analysis:', {
      title: item.title,
      mediaType: item.mediaType,
      checks: {
        hasVideoUrl,
        hasVideoId,
        isVideoType,
        hasYouTubeUrl
      },
      finalIsVideo: isVideo,
      data: {
        videoId: item.videoId,
        videoUrl: item.videoUrl ? item.videoUrl.substring(0, 50) + '...' : null,
        startTime: item.videoStartTime,
        endTime: item.videoEndTime
      }
    });
    
    if (isVideo) {
      console.log('🎥 ✅ CONFIRMED: Rendering as video player');
    } else {
      console.log('🖼️ Rendering as image');
    }
    
    // 🔧 긴급 처리: YouTube URL이 있지만 videoId가 없는 경우 추출 시도
    let finalVideoId = item.videoId;
    if (isVideo && !finalVideoId && item.videoUrl) {
      // 간단한 YouTube ID 추출
      const youtubeRegex = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/;
      const match = item.videoUrl.match(youtubeRegex);
      if (match) {
        finalVideoId = match[1];
        console.log('🔧 Extracted YouTube ID from URL:', finalVideoId);
      }
    }
    
    if (isVideo && finalVideoId) {
      return (
        <div className="relative w-full h-full">
          <YouTubePlayer
            videoId={finalVideoId}
            startTime={item.videoStartTime || 0}
            endTime={item.videoEndTime}
            autoplay={false}
            controls={true}
            playInGame={false}
            className="w-full h-full rounded-xl"
          />
        </div>
      );
    } else if (item.image) {
      // 기존 이미지 렌더링 로직
      return (
        <>
          <img 
            src={cleanAndFixImageUrl(item.image)} 
            alt={item.title}
            className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500"
            style={{ 
              imageRendering: 'auto',
              animationPlayState: 'running',
              willChange: 'auto'
            }}
            loading="eager"
            decoding="async"
            onLoad={(e) => {
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
              
              if (src.includes('localhost')) {
                console.error('🚨 Completely blocking localhost URL');
                e.currentTarget.style.display = 'none';
                const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                if (nextElement) {
                  nextElement.classList.remove('hidden');
                }
                return;
              }
              
              if (src.startsWith('data:image/') && src.length > 1000) {
                e.currentTarget.style.display = 'block';
                e.currentTarget.style.visibility = 'visible';
                e.currentTarget.style.opacity = '1';
                return;
              }
              
              e.currentTarget.style.display = 'none';
              const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
              if (nextElement) {
                nextElement.classList.remove('hidden');
              }
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </>
      );
    } else {
      // 플레이스홀더
      return (
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-center">
            <div className="text-9xl mb-2">{isVideo ? '🎬' : '🎭'}</div>
            <div className="text-gray-600 font-medium text-xl">
              {item.title}
            </div>
          </div>
        </div>
      );
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
    
    // 1단계: 중앙으로 이동 (0.8초)
    setTimeout(() => {
      setAnimationPhase('return');
      
      // 2단계: 원래 자리로 복귀 (0.8초)
      setTimeout(() => {
        setAnimationPhase('showOther');
        
        // 3단계: 다른 옵션 표시 후 전환 (0.5초)
        setTimeout(() => {
          setIsTransitioning(true);
          setTimeout(() => {
            onChoice(item);
            setSelectedItem(null);
            setIsChoosing(false);
            setIsTransitioning(false);
            setAnimationPhase('initial');
          }, 300);
        }, 500);
      }, 800);
    }, 800);
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
      ref={gestureRef as any}
      className="flex flex-col items-center justify-start min-h-screen touch-manipulation"
    >
      {/* Particle Effect */}
      <ParticleEffect count={roundStyle.particleCount} colors={particleColors} />
      
      
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
      <div className="relative flex items-center justify-center w-full max-w-none mx-auto px-4 mt-4 gap-4">
        {/* Item 1 */}
        <motion.div
          initial={{ opacity: 0, x: -100 }}
          animate={{ 
            opacity: selectedItem?.id === match.item1.id ? 1 : (selectedItem && animationPhase !== 'showOther') || isTransitioning ? 0 : 1,
            x: selectedItem?.id === match.item1.id && animationPhase === 'center' ? '50vw' : 0,
            scale: selectedItem?.id === match.item1.id && animationPhase === 'center' ? 1.1 : 1,
            z: selectedItem?.id === match.item1.id && animationPhase === 'center' ? 50 : 0
          }}
          transition={{ 
            duration: 0.8,
            ease: "easeInOut",
            delay: animationPhase === 'initial' ? 0.2 : 0
          }}
          whileHover={!isChoosing ? {} : {}}
          whileTap={!isChoosing ? { scale: 0.95 } : {}}
          className={`flex-1 max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl xl:max-w-3xl cursor-pointer transition-all duration-500 relative focus:outline-none z-10 ${isChoosing ? 'pointer-events-none' : ''}`}
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
          
          <div className={`bg-white rounded-2xl p-1 shadow-2xl hover:shadow-emerald-500/25 transition-all duration-300 focus:outline-none ${
            selectedItem?.id === match.item1.id ? getRoundBorderStyle(round, totalRounds) : ''
          }`}>
            {/* Item Media (Image or Video) */}
            <div className="aspect-[4/3] sm:aspect-[5/4] md:aspect-[6/5] bg-gradient-to-br from-emerald-100 to-blue-100 rounded-xl mb-3 overflow-hidden relative group">
              {renderMediaContent(match.item1, 'from-emerald-100 to-blue-100')}
            </div>
            
            {/* Item Info */}
            <div className="text-center py-3">
              <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 line-clamp-2 leading-tight">
                {match.item1.title}
              </h3>
              {match.item1.description && (
                <p className="text-sm sm:text-base text-gray-600 line-clamp-1 mt-1">
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
            opacity: (selectedItem && animationPhase !== 'showOther') || isTransitioning ? 0 : 1,
            scale: (selectedItem && animationPhase !== 'showOther') || isTransitioning ? 0 : 1
          }}
          transition={{ 
            duration: animationPhase === 'showOther' ? 0.3 : 0.5,
            ease: "easeInOut",
            delay: animationPhase === 'initial' ? 0.6 : (animationPhase === 'showOther' ? 0.2 : 0)
          }}
          className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30"
        >
          <img 
            src="/vs-cute.png" 
            alt="VS" 
            className="w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 lg:w-56 lg:h-56 object-contain drop-shadow-2xl"
          />
        </motion.div>

        {/* Item 2 */}
        <motion.div
          initial={{ opacity: 0, x: 100 }}
          animate={{ 
            opacity: selectedItem?.id === match.item2.id ? 1 : (selectedItem && animationPhase !== 'showOther') || isTransitioning ? 0 : 1,
            x: selectedItem?.id === match.item2.id && animationPhase === 'center' ? '-50vw' : 0,
            scale: selectedItem?.id === match.item2.id && animationPhase === 'center' ? 1.1 : 1,
            z: selectedItem?.id === match.item2.id && animationPhase === 'center' ? 50 : 0
          }}
          transition={{ 
            duration: 0.8,
            ease: "easeInOut",
            delay: animationPhase === 'initial' ? 0.4 : 0
          }}
          whileHover={!isChoosing ? {} : {}}
          whileTap={!isChoosing ? { scale: 0.95 } : {}}
          className={`flex-1 max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl xl:max-w-3xl cursor-pointer transition-all duration-500 relative focus:outline-none z-10 ${isChoosing ? 'pointer-events-none' : ''}`}
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
          
          <div className={`bg-white rounded-2xl p-1 shadow-2xl hover:shadow-emerald-500/25 transition-all duration-300 focus:outline-none ${
            selectedItem?.id === match.item2.id ? getRoundBorderStyle(round, totalRounds) : ''
          }`}>
            {/* Item Media (Image or Video) */}
            <div className="aspect-[4/3] sm:aspect-[5/4] md:aspect-[6/5] bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl mb-3 overflow-hidden relative group">
              {renderMediaContent(match.item2, 'from-purple-100 to-pink-100')}
            </div>
            
            {/* Item Info */}
            <div className="text-center py-3">
              <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 line-clamp-2 leading-tight">
                {match.item2.title}
              </h3>
              {match.item2.description && (
                <p className="text-sm sm:text-base text-gray-600 line-clamp-1 mt-1">
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