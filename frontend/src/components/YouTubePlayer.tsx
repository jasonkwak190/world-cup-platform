'use client';

import { useMemo } from 'react';

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

export default function YouTubePlayer({
  videoId,
  startTime = 0,
  endTime,
  autoplay = false,
  controls = true,
  className = ''
}: YouTubePlayerProps) {
  
  // YouTube embed URL 생성
  const embedUrl = useMemo(() => {
    const params = new URLSearchParams();
    
    // 기본 매개변수
    params.set('modestbranding', '1');
    params.set('rel', '0');
    params.set('showinfo', '0');
    params.set('iv_load_policy', '3');
    
    // 컨트롤 설정
    if (controls) {
      params.set('controls', '1');
    } else {
      params.set('controls', '0');
    }
    
    // 자동재생 설정
    if (autoplay) {
      params.set('autoplay', '1');
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
  }, [videoId, startTime, endTime, autoplay, controls]);

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
    </div>
  );
}