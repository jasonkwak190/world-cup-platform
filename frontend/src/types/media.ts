// YouTube 동영상 메타데이터 타입
export interface VideoMetadata {
  videoId: string;
  title: string;
  channelTitle: string;
  description?: string;
  duration: number; // 초 단위
  publishedAt: string;
  viewCount?: number;
  likeCount?: number;
  thumbnail?: {
    default: string;
    medium: string;
    high: string;
    maxres?: string;
  };
}

// 월드컵 아이템 확장 타입 (기존 + 동영상)
export interface WorldCupMediaItem {
  id: string;
  title: string;
  mediaType: 'image' | 'video';
  
  // 이미지용 필드 (기존)
  image?: string | File;
  description?: string;
  
  // 동영상용 필드 (새로 추가)
  videoUrl?: string; // YouTube URL
  videoId?: string; // YouTube Video ID
  videoStartTime?: number; // 시작 시간 (초)
  videoEndTime?: number; // 종료 시간 (초)
  videoThumbnail?: string; // YouTube 썸네일 URL
  videoDuration?: number; // 전체 길이 (초)
  videoMetadata?: VideoMetadata; // 상세 메타데이터
}

// YouTube API 응답 타입
export interface YouTubeAPIResponse {
  kind: string;
  etag: string;
  items: YouTubeVideoItem[];
  pageInfo: {
    totalResults: number;
    resultsPerPage: number;
  };
}

export interface YouTubeVideoItem {
  kind: string;
  etag: string;
  id: string;
  snippet: {
    publishedAt: string;
    channelId: string;
    title: string;
    description: string;
    thumbnails: {
      default: YouTubeThumbnail;
      medium: YouTubeThumbnail;
      high: YouTubeThumbnail;
      standard?: YouTubeThumbnail;
      maxres?: YouTubeThumbnail;
    };
    channelTitle: string;
    tags?: string[];
    categoryId: string;
    liveBroadcastContent: string;
    localized: {
      title: string;
      description: string;
    };
  };
  contentDetails: {
    duration: string; // ISO 8601 형식 (PT4M13S)
    dimension: string;
    definition: string;
    caption: string;
    licensedContent: boolean;
    projection: string;
  };
  statistics: {
    viewCount: string;
    likeCount: string;
    favoriteCount: string;
    commentCount: string;
  };
}

export interface YouTubeThumbnail {
  url: string;
  width: number;
  height: number;
}

// YouTube URL 패턴 타입
export interface YouTubeUrlPatterns {
  watch: RegExp;
  shortUrl: RegExp;
  embed: RegExp;
  playlist: RegExp;
}

// API 오류 타입
export interface YouTubeAPIError {
  code: number;
  message: string;
  errors: Array<{
    domain: string;
    reason: string;
    message: string;
  }>;
}

// 배치 처리 결과 타입
export interface BatchProcessResult {
  successful: VideoMetadata[];
  failed: Array<{
    videoId: string;
    error: string;
  }>;
  totalProcessed: number;
  apiCallsUsed: number;
}