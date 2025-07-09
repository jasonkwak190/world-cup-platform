'use client';

import { useMemo, useEffect, useRef, useState } from 'react';

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
  playInGame?: boolean; // 게임 중 자동 재생 여부
}

export default function YouTubePlayer({
  videoId,
  startTime = 0,
  endTime,
  autoplay = false,
  controls = true,
  className = '',
  playInGame = false
}: YouTubePlayerProps) {
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const playerRef = useRef<any>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // YouTube embed URL 생성
  const embedUrl = useMemo(() => {
    const params = new URLSearchParams();
    
    // 기본 매개변수
    params.set('modestbranding', '1');
    params.set('rel', '0');
    params.set('showinfo', '0');
    params.set('iv_load_policy', '3');
    params.set('enablejsapi', '1'); // JavaScript API 활성화
    params.set('origin', window.location.origin); // CORS 이슈 방지
    
    // 컨트롤 설정
    if (controls) {
      params.set('controls', '1');
    } else {
      params.set('controls', '0');
    }
    
    // 자동재생 설정 (명시적으로 autoplay가 true이고 게임 중일 때만)
    if (autoplay && playInGame) {
      params.set('autoplay', '1');
    } else {
      // 자동재생 비활성화
      params.set('autoplay', '0');
    }
    
    // 시작 시간 설정
    if (startTime > 0) {
      params.set('start', startTime.toString());
    }
    
    // 종료 시간 설정
    if (endTime) {
      params.set('end', endTime.toString());
    }
    
    return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
  }, [videoId, startTime, endTime, autoplay, controls, playInGame]);

  // 게임 중 비디오 시간 체크 및 자동 재생/정지
  useEffect(() => {
    if (playInGame) {
      // 게임 중일 때 비디오 자동 재생 시작
      const timer = setTimeout(() => {
        setIsPlaying(true);
        
        // 종료 시간이 있을 때 시간 체크
        if (endTime && startTime !== undefined) {
          const duration = endTime - startTime;
          const endTimer = setTimeout(() => {
            setIsPlaying(false);
          }, duration * 1000);
          
          return () => clearTimeout(endTimer);
        }
      }, 100); // iframe 로딩 후 재생 시작
      
      return () => clearTimeout(timer);
    }
  }, [playInGame, startTime, endTime]);

  // 시간 포맷 함수
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
  };

  return (
    <div className={`relative bg-black rounded-lg overflow-hidden ${className}`}>
      {/* YouTube iframe */}
      <iframe
        src={embedUrl}
        title="YouTube video player"
        className="w-full h-full min-h-[200px]"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
      />
      
      {/* 시간 구간 정보 표시 */}
      {(startTime > 0 || endTime) && (
        <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
          구간: {formatTime(startTime)} - {endTime ? formatTime(endTime) : '끝'}
        </div>
      )}
      
      {/* 게임 중 플레이 상태 표시 */}
      {playInGame && (
        <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
          {isPlaying ? (
            <>
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              재생 중
            </>
          ) : (
            <>
              <div className="w-2 h-2 bg-white rounded-full"></div>
              일시정지
            </>
          )}
        </div>
      )}
    </div>
  );
}