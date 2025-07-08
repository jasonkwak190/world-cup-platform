import { 
  VideoMetadata, 
  YouTubeAPIResponse, 
  YouTubeVideoItem, 
  YouTubeUrlPatterns,
  YouTubeAPIError,
  BatchProcessResult
} from '@/types/media';

export class YouTubeService {
  private apiKey: string;
  private cache = new Map<string, VideoMetadata>();
  private readonly baseUrl = 'https://www.googleapis.com/youtube/v3';
  
  // YouTube URL 패턴 정의
  private readonly urlPatterns: YouTubeUrlPatterns = {
    watch: /(?:youtube\.com\/watch\?v=)([^&\n?#]+)/,
    shortUrl: /(?:youtu\.be\/)([^&\n?#]+)/,
    embed: /(?:youtube\.com\/embed\/)([^&\n?#]+)/,
    playlist: /(?:youtube\.com\/playlist\?list=)([^&\n?#]+)/
  };

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('YouTube API 키가 필요합니다.');
    }
    this.apiKey = apiKey;
  }

  /**
   * YouTube URL에서 비디오 ID 추출
   * 다양한 YouTube URL 형식을 지원합니다
   */
  extractVideoId(url: string): string | null {
    if (!url || typeof url !== 'string') {
      return null;
    }

    // URL 정리 (앞뒤 공백 제거)
    url = url.trim();

    // 각 패턴에 대해 검사
    for (const pattern of Object.values(this.urlPatterns)) {
      const match = url.match(pattern);
      if (match && match[1]) {
        // 추가 매개변수가 있는 경우 제거 (예: &t=30s)
        return match[1].split('&')[0];
      }
    }

    // 이미 비디오 ID인 경우 (11자리 알파벳과 숫자)
    if (/^[a-zA-Z0-9_-]{11}$/.test(url)) {
      return url;
    }

    return null;
  }

  /**
   * 비디오 ID 유효성 검사
   */
  isValidVideoId(videoId: string): boolean {
    return /^[a-zA-Z0-9_-]{11}$/.test(videoId);
  }

  /**
   * 🚀 배치 처리: 여러 비디오 메타데이터 한 번에 가져오기
   * API 효율성을 극대화하기 위해 최대 50개까지 한 번에 처리
   */
  async getMultipleVideoMetadata(videoIds: string[]): Promise<BatchProcessResult> {
    const result: BatchProcessResult = {
      successful: [],
      failed: [],
      totalProcessed: 0,
      apiCallsUsed: 0
    };

    if (!videoIds.length) {
      return result;
    }

    // 유효하지 않은 비디오 ID 필터링
    const validIds: string[] = [];
    const invalidIds: string[] = [];

    videoIds.forEach(id => {
      if (this.isValidVideoId(id)) {
        validIds.push(id);
      } else {
        invalidIds.push(id);
        result.failed.push({
          videoId: id,
          error: '유효하지 않은 비디오 ID 형식입니다.'
        });
      }
    });

    if (!validIds.length) {
      result.totalProcessed = videoIds.length;
      return result;
    }

    // 캐시에서 먼저 확인
    const cachedResults: VideoMetadata[] = [];
    const uncachedIds: string[] = [];
    
    validIds.forEach(id => {
      if (this.cache.has(id)) {
        cachedResults.push(this.cache.get(id)!);
      } else {
        uncachedIds.push(id);
      }
    });

    result.successful.push(...cachedResults);

    if (uncachedIds.length === 0) {
      result.totalProcessed = videoIds.length;
      return result;
    }

    try {
      // YouTube API는 한 번에 최대 50개까지 조회 가능
      const chunks = this.chunkArray(uncachedIds, 50);
      
      for (const chunk of chunks) {
        const apiResult = await this.fetchVideoMetadataBatch(chunk);
        result.successful.push(...apiResult.successful);
        result.failed.push(...apiResult.failed);
        result.apiCallsUsed += 1;
      }
    } catch (error) {
      console.error('YouTube API 배치 요청 실패:', error);
      
      // 실패한 모든 ID를 failed 목록에 추가
      uncachedIds.forEach(id => {
        result.failed.push({
          videoId: id,
          error: error instanceof Error ? error.message : 'API 요청 실패'
        });
      });
    }

    result.totalProcessed = videoIds.length;
    return result;
  }

  /**
   * 단일 비디오 메타데이터 가져오기 (캐시 우선)
   */
  async getVideoMetadata(videoId: string): Promise<VideoMetadata> {
    const validId = this.extractVideoId(videoId) || videoId;
    
    if (!this.isValidVideoId(validId)) {
      throw new Error('유효하지 않은 YouTube 비디오 ID입니다.');
    }

    if (this.cache.has(validId)) {
      return this.cache.get(validId)!;
    }

    const result = await this.getMultipleVideoMetadata([validId]);
    
    if (result.successful.length > 0) {
      return result.successful[0];
    }
    
    if (result.failed.length > 0) {
      throw new Error(result.failed[0].error);
    }
    
    throw new Error('비디오를 찾을 수 없습니다.');
  }

  /**
   * 실제 YouTube API 호출 (배치)
   */
  private async fetchVideoMetadataBatch(videoIds: string[]): Promise<{
    successful: VideoMetadata[];
    failed: Array<{ videoId: string; error: string }>;
  }> {
    const result = {
      successful: [] as VideoMetadata[],
      failed: [] as Array<{ videoId: string; error: string }>
    };

    const idsParam = videoIds.join(',');
    const url = `${this.baseUrl}/videos?id=${idsParam}&key=${this.apiKey}&part=snippet,contentDetails,statistics`;

    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('YouTube API 응답 에러:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        
        if (response.status === 403) {
          if (errorText.includes('quotaExceeded')) {
            throw new Error('YouTube API 할당량이 초과되었습니다. 내일 다시 시도해주세요.');
          } else if (errorText.includes('keyInvalid')) {
            throw new Error('YouTube API 키가 유효하지 않습니다. API 키를 확인해주세요.');
          } else if (errorText.includes('accessNotConfigured')) {
            throw new Error('YouTube Data API v3가 활성화되지 않았습니다. Google Cloud Console에서 활성화해주세요.');
          } else {
            throw new Error(`YouTube API 접근 거부: ${errorText}`);
          }
        } else if (response.status === 400) {
          throw new Error(`잘못된 YouTube API 요청: ${errorText}`);
        } else {
          throw new Error(`YouTube API 요청 실패 (${response.status}): ${errorText}`);
        }
      }

      const data: YouTubeAPIResponse = await response.json();
      
      if (data.error) {
        const error = data.error as unknown as YouTubeAPIError;
        throw new Error(`YouTube API 오류: ${error.message}`);
      }

      // 성공적으로 가져온 비디오들 처리
      const foundVideoIds = new Set<string>();
      
      data.items.forEach((video: YouTubeVideoItem) => {
        try {
          const metadata = this.parseVideoMetadata(video);
          this.cache.set(video.id, metadata);
          result.successful.push(metadata);
          foundVideoIds.add(video.id);
        } catch (parseError) {
          result.failed.push({
            videoId: video.id,
            error: parseError instanceof Error ? parseError.message : '메타데이터 파싱 실패'
          });
        }
      });

      // 찾지 못한 비디오들을 실패 목록에 추가
      videoIds.forEach(id => {
        if (!foundVideoIds.has(id)) {
          result.failed.push({
            videoId: id,
            error: '비디오를 찾을 수 없습니다. 비공개 또는 삭제된 비디오일 수 있습니다.'
          });
        }
      });

    } catch (error) {
      console.error('YouTube API 요청 중 오류:', error);
      
      // 모든 비디오 ID를 실패로 처리
      videoIds.forEach(id => {
        result.failed.push({
          videoId: id,
          error: error instanceof Error ? error.message : 'API 요청 실패'
        });
      });
    }

    return result;
  }

  /**
   * YouTube API 응답을 VideoMetadata로 변환
   */
  private parseVideoMetadata(video: YouTubeVideoItem): VideoMetadata {
    return {
      videoId: video.id,
      title: video.snippet.title,
      channelTitle: video.snippet.channelTitle,
      description: video.snippet.description,
      duration: this.parseDuration(video.contentDetails.duration),
      publishedAt: video.snippet.publishedAt,
      viewCount: parseInt(video.statistics?.viewCount || '0'),
      likeCount: parseInt(video.statistics?.likeCount || '0'),
      thumbnail: {
        default: video.snippet.thumbnails.default.url,
        medium: video.snippet.thumbnails.medium.url,
        high: video.snippet.thumbnails.high.url,
        maxres: video.snippet.thumbnails.maxres?.url
      }
    };
  }

  /**
   * ISO 8601 duration (PT4M13S)을 초로 변환
   */
  private parseDuration(duration: string): number {
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;
    
    const hours = parseInt(match[1] || '0');
    const minutes = parseInt(match[2] || '0');
    const seconds = parseInt(match[3] || '0');
    
    return hours * 3600 + minutes * 60 + seconds;
  }

  /**
   * 썸네일 URL 생성 (API 호출 없음)
   */
  getThumbnailUrl(videoId: string, quality: 'default' | 'medium' | 'high' | 'maxres' = 'medium'): string {
    const qualityMap = {
      default: 'default',
      medium: 'mqdefault',
      high: 'hqdefault',
      maxres: 'maxresdefault'
    };
    
    return `https://img.youtube.com/vi/${videoId}/${qualityMap[quality]}.jpg`;
  }

  /**
   * 시간을 사람이 읽기 쉬운 형식으로 변환
   */
  formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
  }

  /**
   * 캐시 지우기
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * 캐시 상태 확인
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }

  /**
   * 배열을 지정된 크기의 청크로 나누는 헬퍼 함수
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}

// 싱글톤 인스턴스 생성
let youtubeServiceInstance: YouTubeService | null = null;

export const getYouTubeService = (): YouTubeService => {
  if (!youtubeServiceInstance) {
    const apiKey = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
    
    // 디버깅을 위한 로그 추가
    console.log('🔑 YouTube API Key 상태:', {
      exists: !!apiKey,
      length: apiKey?.length || 0,
      prefix: apiKey?.substring(0, 10) || 'None',
      fullKey: process.env.NODE_ENV === 'development' ? apiKey : '[HIDDEN]'
    });
    
    if (!apiKey) {
      console.error('❌ YouTube API 키가 설정되지 않았습니다!');
      console.error('환경변수 확인:', {
        NODE_ENV: process.env.NODE_ENV,
        allEnvKeys: Object.keys(process.env).filter(key => key.includes('YOUTUBE')),
        NEXT_PUBLIC_YOUTUBE_API_KEY: process.env.NEXT_PUBLIC_YOUTUBE_API_KEY
      });
      throw new Error('NEXT_PUBLIC_YOUTUBE_API_KEY 환경변수가 설정되지 않았습니다.');
    }
    
    youtubeServiceInstance = new YouTubeService(apiKey);
    console.log('✅ YouTube 서비스 초기화 완료');
  }
  
  return youtubeServiceInstance;
};

// 유틸리티 함수들
export const extractVideoId = (url: string): string | null => {
  return getYouTubeService().extractVideoId(url);
};

export const isValidYouTubeUrl = (url: string): boolean => {
  return extractVideoId(url) !== null;
};