'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize2, RotateCcw } from 'lucide-react';

interface YouTubePlayerProps {
  videoId: string;
  startTime?: number;
  endTime?: number;
  autoplay?: boolean;
  controls?: boolean;
  onReady?: () => void;
  onPlay?: () => void;
  onPause?: () => void;
  onEnd?: () => void;
  className?: string;
}

interface YouTubePlayerAPI {
  playVideo(): void;
  pauseVideo(): void;
  seekTo(seconds: number, allowSeekAhead?: boolean): void;
  getCurrentTime(): number;
  getDuration(): number;
  getVolume(): number;
  setVolume(volume: number): void;
  mute(): void;
  unMute(): void;
  isMuted(): boolean;
  getPlayerState(): number;
  destroy(): void;
}

// YouTube Player State 상수
const YT_PLAYER_STATE = {
  UNSTARTED: -1,
  ENDED: 0,
  PLAYING: 1,
  PAUSED: 2,
  BUFFERING: 3,
  CUED: 5
};

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export default function YouTubePlayer({
  videoId,
  startTime = 0,
  endTime,
  autoplay = false,
  controls = true,
  onReady,
  onPlay,
  onPause,
  onEnd,
  className = ''
}: YouTubePlayerProps) {
  const playerRef = useRef<HTMLDivElement>(null);
  const ytPlayerRef = useRef<YouTubePlayerAPI | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // YouTube API 로드
  const loadYouTubeAPI = useCallback(() => {
    if (window.YT && window.YT.Player) {
      setIsLoaded(true);
      return;
    }

    // 스크립트가 이미 있는지 확인
    if (document.querySelector('script[src*="youtube.com/iframe_api"]')) {
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    script.async = true;
    document.body.appendChild(script);

    window.onYouTubeIframeAPIReady = () => {
      setIsLoaded(true);
    };
  }, []);

  // 플레이어 초기화
  const initializePlayer = useCallback(() => {
    if (!isLoaded || !playerRef.current || !window.YT) {
      return;
    }

    // 기존 플레이어 정리
    if (ytPlayerRef.current) {
      try {
        ytPlayerRef.current.destroy();
      } catch (error) {
        console.warn('Error destroying previous player:', error);
      }
    }

    // 새 플레이어 생성
    ytPlayerRef.current = new window.YT.Player(playerRef.current, {
      height: '100%',
      width: '100%',
      videoId: videoId,
      playerVars: {
        autoplay: autoplay ? 1 : 0,
        controls: controls ? 1 : 0,
        start: startTime,
        end: endTime,
        modestbranding: 1,
        rel: 0,
        showinfo: 0,
        iv_load_policy: 3,
        enablejsapi: 1,
        origin: window.location.origin
      },
      events: {
        onReady: (event: any) => {
          console.log('🎥 YouTube player ready');
          setDuration(event.target.getDuration());
          onReady?.();
        },
        onStateChange: (event: any) => {
          const state = event.data;
          console.log('🎥 Player state changed:', state);
          
          switch (state) {
            case YT_PLAYER_STATE.PLAYING:
              setIsPlaying(true);
              onPlay?.();
              startTimeTracking();
              break;
            case YT_PLAYER_STATE.PAUSED:
              setIsPlaying(false);
              onPause?.();
              stopTimeTracking();
              break;
            case YT_PLAYER_STATE.ENDED:
              setIsPlaying(false);
              onEnd?.();
              stopTimeTracking();
              // 종료 시간이 설정되어 있으면 시작 시간으로 되돌리기
              if (endTime && ytPlayerRef.current) {
                ytPlayerRef.current.seekTo(startTime);
              }
              break;
          }
        },
        onError: (event: any) => {
          console.error('🎥 YouTube player error:', event.data);
        }
      }
    });
  }, [isLoaded, videoId, startTime, endTime, autoplay, controls, onReady, onPlay, onPause, onEnd]);

  // 시간 추적 시작
  const startTimeTracking = () => {
    if (intervalRef.current) return;
    
    intervalRef.current = setInterval(() => {
      if (ytPlayerRef.current) {
        const time = ytPlayerRef.current.getCurrentTime();
        setCurrentTime(time);
        
        // 종료 시간 체크
        if (endTime && time >= endTime) {
          ytPlayerRef.current.pauseVideo();
          ytPlayerRef.current.seekTo(startTime);
        }
      }
    }, 100);
  };

  // 시간 추적 중지
  const stopTimeTracking = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // 플레이어 컨트롤 함수들
  const togglePlay = () => {
    if (!ytPlayerRef.current) return;
    
    if (isPlaying) {
      ytPlayerRef.current.pauseVideo();
    } else {
      ytPlayerRef.current.playVideo();
    }
  };

  const toggleMute = () => {
    if (!ytPlayerRef.current) return;
    
    if (isMuted) {
      ytPlayerRef.current.unMute();
      setIsMuted(false);
    } else {
      ytPlayerRef.current.mute();
      setIsMuted(true);
    }
  };

  const restart = () => {
    if (!ytPlayerRef.current) return;
    ytPlayerRef.current.seekTo(startTime);
    ytPlayerRef.current.playVideo();
  };

  const seekTo = (time: number) => {
    if (!ytPlayerRef.current) return;
    ytPlayerRef.current.seekTo(time);
  };

  // 시간 포맷
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // 컴포넌트 마운트/언마운트
  useEffect(() => {
    loadYouTubeAPI();
    
    return () => {
      stopTimeTracking();
      if (ytPlayerRef.current) {
        try {
          ytPlayerRef.current.destroy();
        } catch (error) {
          console.warn('Error destroying player on unmount:', error);
        }
      }
    };
  }, [loadYouTubeAPI]);

  // 플레이어 초기화
  useEffect(() => {
    if (isLoaded && videoId) {
      initializePlayer();
    }
  }, [isLoaded, initializePlayer, videoId]);

  // 음소거 상태 추적
  useEffect(() => {
    const checkMuteStatus = setInterval(() => {
      if (ytPlayerRef.current) {
        setIsMuted(ytPlayerRef.current.isMuted());
      }
    }, 1000);

    return () => clearInterval(checkMuteStatus);
  }, []);

  return (
    <div className={`relative bg-black rounded-lg overflow-hidden ${className}`}>
      {/* YouTube 플레이어 */}
      <div 
        ref={playerRef}
        className="w-full h-full min-h-[200px]"
      />
      
      {/* 로딩 상태 */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
          <div className="text-center text-white">
            <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-sm">YouTube 플레이어 로딩 중...</p>
          </div>
        </div>
      )}

      {/* 커스텀 컨트롤 (controls가 false일 때만 표시) */}
      {!controls && isLoaded && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          <div className="flex items-center space-x-4">
            {/* 재생/일시정지 버튼 */}
            <button
              onClick={togglePlay}
              className="text-white hover:text-red-500 transition-colors"
            >
              {isPlaying ? (
                <Pause className="w-6 h-6" />
              ) : (
                <Play className="w-6 h-6" />
              )}
            </button>

            {/* 되돌리기 버튼 */}
            <button
              onClick={restart}
              className="text-white hover:text-red-500 transition-colors"
              title="처음부터 재생"
            >
              <RotateCcw className="w-5 h-5" />
            </button>

            {/* 진행 바 */}
            <div className="flex-1">
              <div className="flex items-center space-x-2 text-xs text-white">
                <span>{formatTime(currentTime)}</span>
                <div className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-red-500 transition-all duration-100"
                    style={{ 
                      width: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%' 
                    }}
                  />
                </div>
                <span>{formatTime(duration)}</span>
              </div>
              
              {/* 시간 구간 표시 */}
              {(startTime > 0 || endTime) && (
                <div className="text-xs text-yellow-300 mt-1">
                  구간: {formatTime(startTime)} - {endTime ? formatTime(endTime) : '끝'}
                </div>
              )}
            </div>

            {/* 음소거 버튼 */}
            <button
              onClick={toggleMute}
              className="text-white hover:text-red-500 transition-colors"
            >
              {isMuted ? (
                <VolumeX className="w-5 h-5" />
              ) : (
                <Volume2 className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}