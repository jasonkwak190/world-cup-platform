'use client';

import { useState, useCallback, useRef } from 'react';
import { Youtube, Upload, X, PlayCircle, Clock, Check, AlertCircle, Copy, FileText, Play, Pause } from 'lucide-react';
import YouTubePlayer from '../YouTubePlayer';
import { getYouTubeService, extractVideoId, isValidYouTubeUrl } from '@/lib/youtube';
import type { WorldCupMediaItem, VideoMetadata } from '@/types/media';

interface BulkYouTubeUploadProps {
  onVideosProcessed: (videos: WorldCupMediaItem[]) => void;
  maxVideos?: number;
}

interface VideoProcessingItem {
  id: string;
  url: string;
  status: 'pending' | 'processing' | 'success' | 'error';
  metadata?: VideoMetadata;
  error?: string;
  startTime?: number;
  endTime?: number;
}

export default function BulkYouTubeUpload({ 
  onVideosProcessed, 
  maxVideos = 64 
}: BulkYouTubeUploadProps) {
  const [urls, setUrls] = useState('');
  const [videoItems, setVideoItems] = useState<VideoProcessingItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);
  const [previewVideoId, setPreviewVideoId] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // URL 텍스트에서 개별 URL 추출
  const extractUrls = useCallback((text: string): string[] => {
    const urlPattern = /(https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)[^\s\n]+)/g;
    const matches = text.match(urlPattern) || [];
    
    // 중복 제거 및 유효성 검사
    const uniqueUrls = [...new Set(matches)].filter(url => isValidYouTubeUrl(url));
    
    return uniqueUrls.slice(0, maxVideos); // 최대 개수 제한
  }, [maxVideos]);

  // URL 텍스트 변경 핸들러
  const handleUrlsChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setUrls(text);

    // 실시간으로 URL 추출 및 표시
    const extractedUrls = extractUrls(text);
    
    // 기존 아이템과 비교하여 새로운 것만 추가
    const newItems: VideoProcessingItem[] = extractedUrls.map(url => {
      const videoId = extractVideoId(url);
      const existingItem = videoItems.find(item => extractVideoId(item.url) === videoId);
      
      return existingItem || {
        id: videoId || Math.random().toString(36),
        url,
        status: 'pending' as const
      };
    });

    setVideoItems(newItems);
  }, [extractUrls, videoItems]);

  // 대량 처리 시작
  const handleBulkProcess = async () => {
    if (videoItems.length === 0) {
      alert('처리할 YouTube URL이 없습니다.');
      return;
    }

    setIsProcessing(true);
    setProcessedCount(0);

    try {
      const youtubeService = getYouTubeService();
      
      // 비디오 ID 추출
      const videoIds = videoItems
        .map(item => extractVideoId(item.url))
        .filter(Boolean) as string[];

      console.log(`🎥 Processing ${videoIds.length} videos in batch...`);

      // 처리 상태를 processing으로 업데이트
      setVideoItems(prev => prev.map(item => ({
        ...item,
        status: 'processing' as const
      })));

      // 배치로 메타데이터 가져오기
      const result = await youtubeService.getMultipleVideoMetadata(videoIds);
      
      console.log('🎥 Batch processing result:', result);

      // 결과를 상태에 반영
      const updatedItems = videoItems.map(item => {
        const videoId = extractVideoId(item.url);
        const successfulVideo = result.successful.find(v => v.videoId === videoId);
        const failedVideo = result.failed.find(f => f.videoId === videoId);

        if (successfulVideo) {
          return {
            ...item,
            status: 'success' as const,
            metadata: successfulVideo,
            startTime: 0,
            endTime: undefined
          };
        } else if (failedVideo) {
          return {
            ...item,
            status: 'error' as const,
            error: failedVideo.error
          };
        } else {
          return {
            ...item,
            status: 'error' as const,
            error: '알 수 없는 오류'
          };
        }
      });

      setVideoItems(updatedItems);
      setProcessedCount(result.successful.length);

      // 성공한 아이템들을 WorldCupMediaItem으로 변환하여 부모에게 전달
      const processedVideos: WorldCupMediaItem[] = updatedItems
        .filter(item => item.status === 'success' && item.metadata)
        .map(item => ({
          id: item.id,
          title: item.metadata!.title,
          mediaType: 'video' as const,
          videoUrl: item.url,
          videoId: item.metadata!.videoId,
          videoStartTime: item.startTime || 0,
          videoEndTime: item.endTime,
          videoThumbnail: youtubeService.getThumbnailUrl(item.metadata!.videoId),
          videoDuration: item.metadata!.duration,
          videoMetadata: item.metadata
        }));

      onVideosProcessed(processedVideos);

    } catch (error) {
      console.error('❌ Bulk processing failed:', error);
      alert('일괄 처리 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsProcessing(false);
    }
  };

  // 시간 구간 설정
  const updateTimeRange = (itemId: string, startTime?: number, endTime?: number) => {
    setVideoItems(prev => prev.map(item => 
      item.id === itemId 
        ? { ...item, startTime, endTime }
        : item
    ));
  };

  // 개별 아이템 삭제
  const removeItem = (itemId: string) => {
    setVideoItems(prev => prev.filter(item => item.id !== itemId));
  };

  // 예시 텍스트 붙여넣기
  const pasteExample = () => {
    const example = `https://www.youtube.com/watch?v=dQw4w9WgXcQ
https://youtu.be/jNQXAC9IVRw
https://www.youtube.com/watch?v=9bZkp7q19f0
https://youtu.be/kffacxfA7G4`;
    
    setUrls(example);
    handleUrlsChange({ target: { value: example } } as any);
  };

  // 시간 포맷 함수 (시:분:초)
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
  };

  // 시:분:초 형식을 초로 변환
  const parseTimeToSeconds = (timeString: string): number => {
    if (!timeString) return 0;
    
    const parts = timeString.split(':').map(part => parseInt(part) || 0);
    
    if (parts.length === 1) {
      // 초만 입력된 경우
      return parts[0];
    } else if (parts.length === 2) {
      // 분:초 형식
      return parts[0] * 60 + parts[1];
    } else if (parts.length === 3) {
      // 시:분:초 형식
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
    
    return 0;
  };

  // 초를 시:분:초 형식으로 변환
  const secondsToTimeString = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="text-center">
        <div className="flex items-center justify-center space-x-2 mb-4">
          <Youtube className="w-8 h-8 text-red-500" />
          <h2 className="text-2xl font-bold text-gray-900">YouTube 동영상 대량 추가</h2>
        </div>
        <p className="text-gray-600">
          YouTube URL을 한 번에 여러 개 입력하고 일괄 처리하세요. 최대 {maxVideos}개까지 지원합니다.
        </p>
      </div>

      {/* URL 입력 영역 */}
      <div className="bg-blue-50 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-blue-900">📝 URL 입력</h3>
          <button
            onClick={pasteExample}
            className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-800"
          >
            <FileText className="w-4 h-4" />
            <span>예시 붙여넣기</span>
          </button>
        </div>
        
        <textarea
          ref={textareaRef}
          value={urls}
          onChange={handleUrlsChange}
          placeholder={`YouTube URL을 한 줄에 하나씩 입력하거나 복사해서 붙여넣으세요...

예시:
https://www.youtube.com/watch?v=dQw4w9WgXcQ
https://youtu.be/jNQXAC9IVRw
https://www.youtube.com/watch?v=9bZkp7q19f0

혹은 여러 URL이 포함된 텍스트를 그대로 붙여넣어도 자동으로 추출됩니다.`}
          className="w-full h-40 p-4 border border-blue-200 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-blue-700">
            감지된 URL: <span className="font-semibold">{videoItems.length}개</span>
            {videoItems.length > maxVideos && (
              <span className="text-red-600 ml-2">
                (최대 {maxVideos}개까지만 처리됩니다)
              </span>
            )}
          </div>
          
          <button
            onClick={handleBulkProcess}
            disabled={videoItems.length === 0 || isProcessing}
            className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>처리 중... ({processedCount}/{videoItems.length})</span>
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                <span>일괄 처리 시작</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 처리된 동영상 목록 */}
      {videoItems.length > 0 && (
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            🎬 동영상 목록 ({videoItems.filter(item => item.status === 'success').length}/{videoItems.length}개 성공)
          </h3>
          
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {videoItems.map((item) => (
              <div
                key={item.id}
                className={`flex items-start space-x-4 p-4 border rounded-lg ${
                  item.status === 'success' ? 'border-green-200 bg-green-50' :
                  item.status === 'error' ? 'border-red-200 bg-red-50' :
                  item.status === 'processing' ? 'border-blue-200 bg-blue-50' :
                  'border-gray-200 bg-gray-50'
                }`}
              >
                {/* 썸네일 */}
                <div className="w-20 h-15 bg-gray-200 rounded overflow-hidden flex-shrink-0 relative group">
                  {item.metadata ? (
                    <>
                      <img
                        src={getYouTubeService().getThumbnailUrl(item.metadata.videoId)}
                        alt={item.metadata.title}
                        className="w-full h-full object-cover"
                      />
                      {/* 플레이 버튼 오버레이 */}
                      <button
                        onClick={() => {
                          const currentVideoId = extractVideoId(item.url);
                          setPreviewVideoId(previewVideoId === currentVideoId ? null : currentVideoId);
                        }}
                        className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                        title="미리보기"
                      >
                        {previewVideoId === extractVideoId(item.url) ? (
                          <Pause className="w-6 h-6 text-white" />
                        ) : (
                          <Play className="w-6 h-6 text-white" />
                        )}
                      </button>
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      {item.status === 'processing' ? (
                        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      ) : item.status === 'error' ? (
                        <AlertCircle className="w-6 h-6 text-red-500" />
                      ) : (
                        <Youtube className="w-6 h-6 text-gray-400" />
                      )}
                    </div>
                  )}
                </div>

                {/* 정보 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 truncate">
                        {item.metadata?.title || extractVideoId(item.url) || 'Unknown'}
                      </h4>
                      {item.metadata && (
                        <p className="text-sm text-gray-600 truncate">
                          {item.metadata.channelTitle} • {formatTime(item.metadata.duration)}
                        </p>
                      )}
                      {item.error && (
                        <p className="text-sm text-red-600">{item.error}</p>
                      )}
                    </div>

                    {/* 상태 아이콘 */}
                    <div className="flex items-center space-x-2 ml-2">
                      {item.status === 'success' && <Check className="w-5 h-5 text-green-500" />}
                      {item.status === 'error' && <AlertCircle className="w-5 h-5 text-red-500" />}
                      {item.status === 'processing' && (
                        <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      )}
                      
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* 시간 구간 설정 (성공한 아이템만) */}
                  {item.status === 'success' && item.metadata && (
                    <div className="mt-3 space-y-3">
                      <div className="text-xs text-gray-600 mb-2">
                        💡 시간 형식: 분:초 (예: 1:30) 또는 시:분:초 (예: 1:23:45)
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            시작 시간
                          </label>
                          <input
                            type="text"
                            value={secondsToTimeString(item.startTime || 0)}
                            onChange={(e) => {
                              const seconds = parseTimeToSeconds(e.target.value);
                              if (seconds <= (item.metadata!.duration || 0)) {
                                updateTimeRange(item.id, seconds, item.endTime);
                              }
                            }}
                            placeholder="0:00"
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            종료 시간 (선택사항)
                          </label>
                          <input
                            type="text"
                            value={item.endTime ? secondsToTimeString(item.endTime) : ''}
                            onChange={(e) => {
                              if (e.target.value.trim() === '') {
                                updateTimeRange(item.id, item.startTime, undefined);
                              } else {
                                const seconds = parseTimeToSeconds(e.target.value);
                                if (seconds > (item.startTime || 0) && seconds <= (item.metadata!.duration || 0)) {
                                  updateTimeRange(item.id, item.startTime, seconds);
                                }
                              }
                            }}
                            placeholder="끝까지 재생"
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        전체 길이: {formatTime(item.metadata.duration)} | 
                        구간: {formatTime(item.startTime || 0)} - {item.endTime ? formatTime(item.endTime) : '끝'}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* 미리보기 플레이어 */}
          {previewVideoId && (
            <div className="mt-6 bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-lg font-semibold text-gray-900">🎬 동영상 미리보기</h4>
                <button
                  onClick={() => setPreviewVideoId(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="aspect-video bg-black rounded-lg overflow-hidden">
                <YouTubePlayer
                  videoId={previewVideoId}
                  startTime={videoItems.find(item => extractVideoId(item.url) === previewVideoId)?.startTime || 0}
                  endTime={videoItems.find(item => extractVideoId(item.url) === previewVideoId)?.endTime}
                  autoplay={true}
                  controls={true}
                  className="w-full h-full"
                />
              </div>
              
              <div className="mt-2 text-sm text-gray-600">
                {(() => {
                  const item = videoItems.find(item => extractVideoId(item.url) === previewVideoId);
                  if (item?.metadata) {
                    return (
                      <div>
                        <strong>{item.metadata.title}</strong> by {item.metadata.channelTitle}
                        {(item.startTime || item.endTime) && (
                          <div className="text-xs text-blue-600 mt-1">
                            구간: {secondsToTimeString(item.startTime || 0)} - {item.endTime ? secondsToTimeString(item.endTime) : '끝'}
                          </div>
                        )}
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
            </div>
          )}

          {/* 성공 요약 */}
          {processedCount > 0 && (
            <div className="mt-4 p-4 bg-green-100 border border-green-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <Check className="w-5 h-5 text-green-600" />
                <span className="text-green-800 font-medium">
                  {processedCount}개의 동영상이 성공적으로 처리되었습니다!
                </span>
              </div>
              <p className="text-sm text-green-700 mt-1">
                시간 구간을 설정한 후 월드컵에 추가하실 수 있습니다.
              </p>
            </div>
          )}
        </div>
      )}

      {/* 도움말 */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-2">💡 사용법 팁</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• 다양한 YouTube URL 형식을 지원합니다 (youtube.com, youtu.be, embed)</li>
          <li>• 플레이리스트 링크를 넣으면 자동으로 개별 영상 URL을 추출합니다</li>
          <li>• <strong>시간 구간 설정</strong>: 분:초 (1:30) 또는 시:분:초 (1:23:45) 형식으로 입력</li>
          <li>• <strong>미리보기</strong>: 썸네일에 마우스를 올리고 플레이 버튼을 눌러 미리보기 가능</li>
          <li>• 최대 {maxVideos}개까지 한 번에 처리할 수 있습니다</li>
          <li>• API 사용량 최적화를 위해 배치 처리됩니다</li>
        </ul>
      </div>
    </div>
  );
}