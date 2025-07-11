'use client';

import { useState, useCallback, useRef } from 'react';
import { Upload, X, Check, AlertCircle, FileText, Play, Pause } from 'lucide-react';
import YouTubePlayer from '../YouTubePlayer';
import { getYouTubeService, extractVideoId, isValidYouTubeUrl } from '@/lib/youtube';
import type { WorldCupMediaItem, VideoMetadata } from '@/types/media';

interface BulkYouTubeUploadProps {
  onVideosProcessed: (videos: WorldCupMediaItem[]) => void;
  maxVideos?: number;
  existingVideoIds?: string[]; // 이미 등록된 비디오 ID 목록
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
  maxVideos = 64,
  existingVideoIds = [] 
}: BulkYouTubeUploadProps) {
  const [urls, setUrls] = useState('');
  const [videoItems, setVideoItems] = useState<VideoProcessingItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);
  const [previewVideoId, setPreviewVideoId] = useState<string | null>(null);
  const [isTimeSettingPhase, setIsTimeSettingPhase] = useState(false); // 시간 설정 단계 여부
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
      
      // 중복 검사: 이미 등록된 비디오인지 확인
      const isDuplicate = existingVideoIds.includes(videoId || '');
      
      return existingItem || {
        id: videoId || Math.random().toString(36),
        url,
        status: isDuplicate ? 'error' as const : 'pending' as const,
        error: isDuplicate ? '이미 등록된 동영상입니다.' : undefined
      };
    });

    setVideoItems(newItems);
  }, [extractUrls, videoItems, existingVideoIds]);

  // 대량 처리 시작
  const handleBulkProcess = async () => {
    if (videoItems.length === 0) {
      alert('처리할 YouTube URL이 없습니다.');
      return;
    }
    
    // 중복이 아닌 아이템만 처리
    const validItems = videoItems.filter(item => item.status !== 'error');
    
    if (validItems.length === 0) {
      alert('처리할 수 있는 유효한 URL이 없습니다. 중복된 동영상이 있는지 확인해주세요.');
      return;
    }

    // 🔑 YouTube API 키 확인
    const apiKey = typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_YOUTUBE_API_KEY : undefined;
    console.log('🔑 API Key check:', apiKey ? `${apiKey.slice(0, 10)}...${apiKey.slice(-5)}` : 'NOT FOUND');
    
    if (!apiKey) {
      alert('YouTube API 키가 설정되지 않았습니다. 개발자에게 문의하세요.');
      return;
    }

    setIsProcessing(true);
    setProcessedCount(0);

    try {
      const youtubeService = getYouTubeService();
      console.log('🔧 YouTube Service created successfully');
      
      // 유효한 비디오 ID만 추출
      const videoIds = validItems
        .map(item => extractVideoId(item.url))
        .filter(Boolean) as string[];

      console.log(`🎥 Processing ${videoIds.length} valid videos in batch...`);

      // 유효한 아이템만 처리 상태로 업데이트 (중복 아이템은 그대로 유지)
      setVideoItems(prev => prev.map(item => ({
        ...item,
        status: item.status === 'error' ? 'error' : 'processing' as const
      })));

      // 배치로 메타데이터 가져오기 (개선된 에러 처리)
      console.log('🎥 Starting batch processing for video IDs:', videoIds);
      
      const result = await youtubeService.getMultipleVideoMetadata(videoIds);
      
      console.log('🎥 Batch processing result:', {
        successful: result.successful.length,
        failed: result.failed.length,
        totalProcessed: result.totalProcessed,
        apiCallsUsed: result.apiCallsUsed,
        successfulItems: result.successful.map(item => ({
          videoId: item.videoId,
          title: item.title.substring(0, 50) + '...'
        })),
        failedItems: result.failed.map(item => ({
          videoId: item.videoId,
          error: item.error.substring(0, 100) + '...'
        }))
      });

      // 결과를 상태에 반영 (중복 아이템은 그대로 유지)
      const updatedItems = videoItems.map(item => {
        // 이미 에러 상태인 아이템(중복)은 그대로 유지
        if (item.status === 'error' && item.error === '이미 등록된 동영상입니다.') {
          return item;
        }
        
        const videoId = extractVideoId(item.url);
        const successfulVideo = result.successful.find(v => v.videoId === videoId);
        const failedVideo = result.failed.find(f => f.videoId === videoId);

        if (successfulVideo) {
          return {
            ...item,
            status: 'success' as const,
            metadata: successfulVideo,
            startTime: item.startTime || 0,
            endTime: item.endTime
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

      // 🔄 시간 설정 단계로 전환 (바로 전달하지 않음)
      setIsTimeSettingPhase(true);

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

  // 🎯 최종 등록 함수
  const handleFinalSubmit = () => {
    const youtubeService = getYouTubeService();
    
    // 성공한 아이템들을 WorldCupMediaItem으로 변환하여 부모에게 전달
    const processedVideos: WorldCupMediaItem[] = videoItems
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

    console.log('🎯 Final submission:', {
      totalItemsProcessed: videoItems.length,
      successfulItems: processedVideos.length,
      failedItems: videoItems.filter(item => item.status === 'error').length,
      processedVideos: processedVideos.map(video => ({
        id: video.id,
        title: video.title,
        videoId: video.videoId,
        duration: video.videoDuration,
        startTime: video.videoStartTime,
        endTime: video.videoEndTime,
        thumbnailUrl: video.videoThumbnail
      }))
    });
    
    onVideosProcessed(processedVideos);
    
    // 상태 초기화
    setIsTimeSettingPhase(false);
    setVideoItems([]);
    setUrls('');
    setProcessedCount(0);
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

  // 초를 시:분:초 형식으로 변환 (간단한 버전)
  const secondsToTimeString = (seconds: number): string => {
    if (!seconds || seconds === 0) return '';
    
    const totalSeconds = Math.floor(Math.max(0, seconds));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const remainingSeconds = totalSeconds % 60;
    
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
          <Play className="w-8 h-8 text-red-500 bg-red-100 rounded-full p-1" />
          <h2 className="text-2xl font-bold text-gray-900">YouTube 동영상 대량 추가</h2>
        </div>
        <p className="text-gray-600">
          YouTube URL을 한 번에 여러 개 입력하고 일괄 처리하세요. 최대 {maxVideos}개까지 지원합니다.
        </p>
      </div>

      {/* URL 입력 영역 */}
      <div className={`rounded-lg p-6 text-black ${isTimeSettingPhase ? 'bg-gray-100' : 'bg-blue-50'}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-lg font-semibold ${isTimeSettingPhase ? 'text-gray-700' : 'text-blue-900'}`}>
            {isTimeSettingPhase ? '📝 URL 입력 (완료)' : '📝 URL 입력'}
          </h3>
          <button
            onClick={pasteExample}
            disabled={isTimeSettingPhase}
            className={`flex items-center space-x-1 text-sm ${
              isTimeSettingPhase 
                ? 'text-gray-400 cursor-not-allowed' 
                : 'text-blue-600 hover:text-blue-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>예시 붙여넣기</span>
          </button>
        </div>
        
        <textarea
          ref={textareaRef}
          value={urls}
          onChange={handleUrlsChange}
          disabled={isTimeSettingPhase}
          placeholder={`YouTube URL을 한 줄에 하나씩 입력하거나 복사해서 붙여넣으세요...

예시:
https://www.youtube.com/watch?v=dQw4w9WgXcQ
https://youtu.be/jNQXAC9IVRw
https://www.youtube.com/watch?v=9bZkp7q19f0

혹은 여러 URL이 포함된 텍스트를 그대로 붙여넣어도 자동으로 추출됩니다.`}
          className={`w-full h-40 p-4 border rounded-lg resize-none ${
            isTimeSettingPhase 
              ? 'border-gray-300 bg-gray-50 text-gray-500 cursor-not-allowed' 
              : 'border-blue-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
          }`}
        />
        
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-blue-700">
            감지된 URL: <span className="font-semibold">{videoItems.length}개</span>
            {videoItems.filter(item => item.status === 'error' && item.error === '이미 등록된 동영상입니다.').length > 0 && (
              <span className="text-red-600 ml-2">
                (중복 {videoItems.filter(item => item.status === 'error' && item.error === '이미 등록된 동영상입니다.').length}개 발견)
              </span>
            )}
            {videoItems.length > maxVideos && (
              <span className="text-red-600 ml-2">
                (최대 {maxVideos}개까지만 처리됩니다)
              </span>
            )}
          </div>
          
          <button
            onClick={handleBulkProcess}
            disabled={videoItems.length === 0 || isProcessing || isTimeSettingPhase}
            className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>처리 중... ({processedCount}/{videoItems.length})</span>
              </>
            ) : isTimeSettingPhase ? (
              <>
                <Check className="w-4 h-4" />
                <span>처리 완료</span>
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
            {isTimeSettingPhase ? (
              <>⏰ 시간 구간 설정 ({videoItems.filter(item => item.status === 'success').length}/{videoItems.length}개 성공)</>
            ) : (
              <>🎬 동영상 목록 ({videoItems.filter(item => item.status === 'success').length}/{videoItems.length}개 성공)</>
            )}
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
                        <Play className="w-6 h-6 text-gray-400" />
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
                      <div className="text-xs text-gray-600 mb-2 flex items-center space-x-1">
                        <span>💡</span>
                        <span>시간 형식: {item.metadata.duration >= 3600 ? '시:분:초 (예: 1:23:45)' : '분:초 (예: 1:30)'}</span>
                        <span className="text-blue-600">• 전체 길이: {formatTime(item.metadata.duration)}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-black">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            시작 시간 *
                          </label>
                          <div className="flex items-center space-x-1">
                            {/* 시간 입력 (1시간 이상인 경우만 표시) */}
                            {item.metadata.duration >= 3600 && (
                              <>
                                <input
                                  type="number"
                                  min="0"
                                  max="23"
                                  value={Math.floor((item.startTime || 0) / 3600)}
                                  onChange={(e) => {
                                    const hours = parseInt(e.target.value) || 0;
                                    const minutes = Math.floor(((item.startTime || 0) % 3600) / 60);
                                    const seconds = (item.startTime || 0) % 60;
                                    updateTimeRange(item.id, hours * 3600 + minutes * 60 + seconds, item.endTime);
                                  }}
                                  className="w-12 px-1 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-center"
                                  placeholder="0"
                                />
                                <span className="text-sm text-gray-500">시</span>
                              </>
                            )}
                            <input
                              type="number"
                              min="0"
                              max="59"
                              value={Math.floor(((item.startTime || 0) % 3600) / 60)}
                              onChange={(e) => {
                                const hours = Math.floor((item.startTime || 0) / 3600);
                                const minutes = parseInt(e.target.value) || 0;
                                const seconds = (item.startTime || 0) % 60;
                                updateTimeRange(item.id, hours * 3600 + minutes * 60 + seconds, item.endTime);
                              }}
                              className="w-12 px-1 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-center"
                              placeholder="0"
                            />
                            <span className="text-sm text-gray-500">분</span>
                            <input
                              type="number"
                              min="0"
                              max="59"
                              value={(item.startTime || 0) % 60}
                              onChange={(e) => {
                                const hours = Math.floor((item.startTime || 0) / 3600);
                                const minutes = Math.floor(((item.startTime || 0) % 3600) / 60);
                                const seconds = parseInt(e.target.value) || 0;
                                updateTimeRange(item.id, hours * 3600 + minutes * 60 + seconds, item.endTime);
                              }}
                              className="w-12 px-1 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-center"
                              placeholder="0"
                            />
                            <span className="text-sm text-gray-500">초</span>
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            종료 시간 (선택사항)
                          </label>
                          {item.endTime ? (
                            <div className="flex items-center space-x-1">
                              {/* 시간 입력 (1시간 이상인 경우만 표시) */}
                              {item.metadata.duration >= 3600 && (
                                <>
                                  <input
                                    type="number"
                                    min="0"
                                    max="23"
                                    value={Math.floor(item.endTime / 3600)}
                                    onChange={(e) => {
                                      const hours = parseInt(e.target.value) || 0;
                                      const minutes = Math.floor((item.endTime! % 3600) / 60);
                                      const seconds = item.endTime! % 60;
                                      const newEndTime = hours * 3600 + minutes * 60 + seconds;
                                      if (newEndTime > (item.startTime || 0)) {
                                        updateTimeRange(item.id, item.startTime, newEndTime);
                                      }
                                    }}
                                    className="w-12 px-1 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-center"
                                    placeholder="0"
                                  />
                                  <span className="text-sm text-gray-500">시</span>
                                </>
                              )}
                              <input
                                type="number"
                                min="0"
                                max="59"
                                value={Math.floor((item.endTime % 3600) / 60)}
                                onChange={(e) => {
                                  const hours = Math.floor(item.endTime! / 3600);
                                  const minutes = parseInt(e.target.value) || 0;
                                  const seconds = item.endTime! % 60;
                                  const newEndTime = hours * 3600 + minutes * 60 + seconds;
                                  if (newEndTime > (item.startTime || 0)) {
                                    updateTimeRange(item.id, item.startTime, newEndTime);
                                  }
                                }}
                                className="w-12 px-1 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-center"
                                placeholder="0"
                              />
                              <span className="text-sm text-gray-500">분</span>
                              <input
                                type="number"
                                min="0"
                                max="59"
                                value={item.endTime % 60}
                                onChange={(e) => {
                                  const hours = Math.floor(item.endTime! / 3600);
                                  const minutes = Math.floor((item.endTime! % 3600) / 60);
                                  const seconds = parseInt(e.target.value) || 0;
                                  const newEndTime = hours * 3600 + minutes * 60 + seconds;
                                  if (newEndTime > (item.startTime || 0)) {
                                    updateTimeRange(item.id, item.startTime, newEndTime);
                                  }
                                }}
                                className="w-12 px-1 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-center"
                                placeholder="0"
                              />
                              <span className="text-sm text-gray-500">초</span>
                              <button
                                onClick={() => updateTimeRange(item.id, item.startTime, undefined)}
                                className="text-xs text-red-600 hover:text-red-800 px-2 py-1 border border-red-200 rounded"
                              >
                                해제
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                const endTime = Math.min((item.startTime || 0) + 30, item.metadata!.duration);
                                updateTimeRange(item.id, item.startTime, endTime);
                              }}
                              className="text-sm text-blue-600 hover:text-blue-800 px-3 py-1 border border-blue-200 rounded hover:bg-blue-50"
                            >
                              + 종료 시간 설정
                            </button>
                          )}
                        </div>
                      </div>
                      
                      {/* 시간 구간 정보 표시 */}
                      <div className="bg-gray-50 rounded p-2">
                        <div className="text-xs text-gray-600 space-y-1">
                          <div className="flex justify-between">
                            <span>전체 길이:</span>
                            <span className="font-medium">{formatTime(item.metadata.duration)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>재생 구간:</span>
                            <span className="font-medium text-blue-600">
                              {formatTime(item.startTime || 0)} - {item.endTime ? formatTime(item.endTime) : '끝'}
                            </span>
                          </div>
                          {item.endTime && (
                            <div className="flex justify-between">
                              <span>구간 길이:</span>
                              <span className="font-medium text-green-600">
                                {formatTime(item.endTime - (item.startTime || 0))}
                              </span>
                            </div>
                          )}
                        </div>
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

          {/* 성공 요약 및 최종 등록 버튼 */}
          {processedCount > 0 && (
            <div className="mt-4 p-4 bg-green-100 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <Check className="w-5 h-5 text-green-600" />
                    <span className="text-green-800 font-medium">
                      {processedCount}개의 동영상이 성공적으로 처리되었습니다!
                    </span>
                  </div>
                  <p className="text-sm text-green-700 mt-1">
                    {isTimeSettingPhase ? 
                      '시간 구간을 조정한 후 최종 등록을 눌러주세요.' : 
                      '시간 구간을 설정한 후 월드컵에 추가하실 수 있습니다.'
                    }
                  </p>
                </div>
                
                {isTimeSettingPhase && (
                  <button
                    onClick={handleFinalSubmit}
                    className="flex items-center space-x-2 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Check className="w-4 h-4" />
                    <span>최종 등록</span>
                  </button>
                )}
              </div>
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
          <li>• <strong>시간 구간 설정</strong>: 1시간 미만은 분:초 (1:30), 1시간 이상은 시:분:초 (1:23:45) 형식으로 입력</li>
          <li>• <strong>미리보기</strong>: 썸네일에 마우스를 올리고 플레이 버튼을 눌러 미리보기 가능</li>
          <li>• 최대 {maxVideos}개까지 한 번에 처리할 수 있습니다</li>
          <li>• API 사용량 최적화를 위해 배치 처리됩니다</li>
        </ul>
      </div>
    </div>
  );
}