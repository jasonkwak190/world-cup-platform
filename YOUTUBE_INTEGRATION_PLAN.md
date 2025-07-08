# 🎥 YouTube 동영상 월드컵 통합 계획서

## 📋 프로젝트 개요

### 목표
월드컵 선택지에 YouTube 동영상을 추가하여 이미지와 함께 동영상 배틀을 가능하게 함
- **핵심 원칙**: YouTube 동영상을 로컬 저장하지 않고, 메타데이터만 관리
- **사용자 경험**: PIKU와 유사한 직관적인 동영상 플레이 환경
- **보안**: API 키 및 동영상 콘텐츠 안전성 확보

### 🎯 핵심 설계 원칙: API 효율성

#### YouTube API 사용 시점 분석
- **월드컵 생성 시**: 배치 API 1-2회 호출로 메타데이터 수집
- **사용자 플레이 시**: API 호출 없음 (저장된 데이터 + YouTube IFrame 직접 스트리밍)
- **동영상 재생**: YouTube 서버에서 직접 스트리밍 (우리 API 사용량과 무관)

#### 사용량 계산 예시
```
📊 고양이 64강 월드컵 시나리오:
- 월드컵 생성 시 (제작자): 1-2 units (64개 배치 요청)
- 10명 동시 플레이: 0 units 추가
- 1000명 플레이: 0 units 추가
- 총 비용: 월드컵 1개당 1-2 units

💰 일일 할당량 대비:
- 기본 할당량: 10,000 units
- 예상 월드컵 생성 가능: 5,000-10,000개/일
- 플레이 횟수: 무제한
```

#### 데이터 플로우
1. **제작자가 64개 YouTube URL 입력**
2. **배치 API 호출로 메타데이터 한 번에 수집 (1-2 units)**
3. **DB에 videoId, 썸네일, 시간구간, 메타데이터 저장**
4. **사용자 플레이**: 저장된 데이터로 YouTube IFrame 렌더링 (API 호출 없음)
5. **동영상 스트리밍**: YouTube 서버에서 직접 (우리 서버 부하 없음)

## 🏗 기술 아키텍처

### 1. 데이터베이스 스키마 확장

```sql
-- worldcup_items 테이블에 동영상 지원 컬럼 추가
ALTER TABLE worldcup_items ADD COLUMN 
  media_type VARCHAR(20) DEFAULT 'image' CHECK (media_type IN ('image', 'video'));

ALTER TABLE worldcup_items ADD COLUMN 
  video_url TEXT;

ALTER TABLE worldcup_items ADD COLUMN 
  video_start_time INTEGER DEFAULT 0; -- 초 단위

ALTER TABLE worldcup_items ADD COLUMN 
  video_end_time INTEGER; -- 초 단위 (NULL이면 전체 재생)

ALTER TABLE worldcup_items ADD COLUMN 
  video_thumbnail TEXT; -- YouTube 썸네일 URL

ALTER TABLE worldcup_items ADD COLUMN 
  video_duration INTEGER; -- 총 동영상 길이 (초)

ALTER TABLE worldcup_items ADD COLUMN 
  video_metadata JSONB; -- 제목, 채널명, 설명 등
```

### 2. TypeScript 타입 정의

```typescript
// types/media.ts
export interface VideoMetadata {
  title: string;
  channelTitle: string;
  description?: string;
  duration: number; // 초 단위
  publishedAt: string;
  viewCount?: number;
  likeCount?: number;
}

export interface WorldCupVideoItem {
  id: string;
  title: string;
  mediaType: 'image' | 'video';
  image?: string; // 이미지 URL (기존)
  videoUrl?: string; // YouTube URL
  videoStartTime?: number; // 시작 시간 (초)
  videoEndTime?: number; // 종료 시간 (초)
  videoThumbnail?: string; // YouTube 썸네일
  videoDuration?: number; // 전체 길이
  videoMetadata?: VideoMetadata;
}
```

### 3. YouTube API 통합 (배치 처리 최적화)

```typescript
// lib/youtube.ts
export class YouTubeService {
  private apiKey: string;
  private cache = new Map<string, VideoMetadata>();
  
  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  // YouTube URL에서 비디오 ID 추출
  extractVideoId(url: string): string | null {
    const patterns = [
      /(?:youtube\.com\/watch\?v=)([^&\n?#]+)/,
      /(?:youtu\.be\/)([^&\n?#]+)/,
      /(?:youtube\.com\/embed\/)([^&\n?#]+)/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  }

  // 🚀 배치 처리: 여러 비디오 메타데이터 한 번에 가져오기 (API 효율성 극대화)
  async getMultipleVideoMetadata(videoIds: string[]): Promise<VideoMetadata[]> {
    // 캐시된 데이터 먼저 확인
    const cachedResults: VideoMetadata[] = [];
    const uncachedIds: string[] = [];
    
    videoIds.forEach(id => {
      if (this.cache.has(id)) {
        cachedResults.push(this.cache.get(id)!);
      } else {
        uncachedIds.push(id);
      }
    });

    if (uncachedIds.length === 0) {
      return cachedResults;
    }

    // YouTube API는 한 번에 최대 50개까지 조회 가능
    const chunks = this.chunkArray(uncachedIds, 50);
    const apiResults: VideoMetadata[] = [];

    for (const chunk of chunks) {
      const idsParam = chunk.join(',');
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?id=${idsParam}&key=${this.apiKey}&part=snippet,contentDetails,statistics`
      );
      
      if (!response.ok) {
        throw new Error('YouTube API 요청 실패');
      }
      
      const data = await response.json();
      
      data.items.forEach((video: any) => {
        const metadata: VideoMetadata = {
          videoId: video.id,
          title: video.snippet.title,
          channelTitle: video.snippet.channelTitle,
          description: video.snippet.description,
          duration: this.parseDuration(video.contentDetails.duration),
          publishedAt: video.snippet.publishedAt,
          viewCount: parseInt(video.statistics.viewCount || '0'),
          likeCount: parseInt(video.statistics.likeCount || '0')
        };
        
        // 캐시에 저장
        this.cache.set(video.id, metadata);
        apiResults.push(metadata);
      });
    }

    return [...cachedResults, ...apiResults];
  }

  // 단일 비디오 메타데이터 가져오기 (캐시 우선)
  async getVideoMetadata(videoId: string): Promise<VideoMetadata> {
    if (this.cache.has(videoId)) {
      return this.cache.get(videoId)!;
    }

    const results = await this.getMultipleVideoMetadata([videoId]);
    return results[0];
  }

  // 배열을 청크로 나누는 헬퍼 함수
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  // ISO 8601 duration을 초로 변환
  private parseDuration(duration: string): number {
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    if (!match) return 0;
    
    const hours = parseInt(match[1]?.replace('H', '') || '0');
    const minutes = parseInt(match[2]?.replace('M', '') || '0');
    const seconds = parseInt(match[3]?.replace('S', '') || '0');
    
    return hours * 3600 + minutes * 60 + seconds;
  }

  // 썸네일 URL 생성 (API 호출 없음)
  getThumbnailUrl(videoId: string, quality: 'default' | 'medium' | 'high' | 'maxres' = 'medium'): string {
    return `https://img.youtube.com/vi/${videoId}/${quality === 'default' ? 'default' : quality + 'default'}.jpg`;
  }
}
```

## 🎨 UI/UX 컴포넌트 설계

### 1. 동영상 추가 인터페이스

```typescript
// components/VideoUploadForm.tsx
export default function VideoUploadForm({ onVideoAdd }: { onVideoAdd: (item: WorldCupVideoItem) => void }) {
  const [videoUrl, setVideoUrl] = useState('');
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState<number | undefined>();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    // YouTube URL 검증 및 메타데이터 가져오기
    // 시간 구간 설정
    // 썸네일 생성
  };

  return (
    <div className="space-y-4">
      <div>
        <label>YouTube URL</label>
        <input 
          type="url" 
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
          placeholder="https://www.youtube.com/watch?v=..."
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label>시작 시간 (초)</label>
          <input 
            type="number" 
            value={startTime}
            onChange={(e) => setStartTime(parseInt(e.target.value))}
          />
        </div>
        <div>
          <label>종료 시간 (초)</label>
          <input 
            type="number" 
            value={endTime || ''}
            onChange={(e) => setEndTime(e.target.value ? parseInt(e.target.value) : undefined)}
          />
        </div>
      </div>
    </div>
  );
}
```

### 2. 동영상 플레이어 컴포넌트

```typescript
// components/YouTubePlayer.tsx
export default function YouTubePlayer({ 
  videoId, 
  startTime = 0, 
  endTime,
  autoplay = false,
  onEnded 
}: {
  videoId: string;
  startTime?: number;
  endTime?: number;
  autoplay?: boolean;
  onEnded?: () => void;
}) {
  const playerRef = useRef<any>(null);

  useEffect(() => {
    // YouTube IFrame API 로드 및 플레이어 초기화
    const initPlayer = () => {
      playerRef.current = new YT.Player('youtube-player', {
        height: '100%',
        width: '100%',
        videoId: videoId,
        playerVars: {
          start: startTime,
          end: endTime,
          autoplay: autoplay ? 1 : 0,
          controls: 1,
          modestbranding: 1,
          rel: 0
        },
        events: {
          onStateChange: handleStateChange
        }
      });
    };

    const handleStateChange = (event: any) => {
      if (event.data === YT.PlayerState.ENDED) {
        onEnded?.();
      }
    };

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      // YouTube API 로드
      const script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      script.onload = () => {
        window.onYouTubeIframeAPIReady = initPlayer;
      };
      document.head.appendChild(script);
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
      }
    };
  }, [videoId, startTime, endTime]);

  return <div id="youtube-player" className="w-full h-full" />;
}
```

### 3. 게임 화면에서 미디어 렌더링

```typescript
// components/MediaDisplay.tsx
export default function MediaDisplay({ item }: { item: WorldCupVideoItem }) {
  if (item.mediaType === 'image') {
    return (
      <img 
        src={item.image} 
        alt={item.title}
        className="w-full h-full object-cover"
      />
    );
  }

  if (item.mediaType === 'video' && item.videoUrl) {
    const videoId = YouTubeService.extractVideoId(item.videoUrl);
    
    return (
      <div className="relative w-full h-full">
        <YouTubePlayer
          videoId={videoId!}
          startTime={item.videoStartTime}
          endTime={item.videoEndTime}
          autoplay={true}
        />
        <div className="absolute top-2 left-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-sm">
          🎥 {item.title}
        </div>
      </div>
    );
  }

  return <div className="w-full h-full bg-gray-200 flex items-center justify-center">미디어 없음</div>;
}
```

## 🔒 보안 고려사항

### 1. API 키 관리
```typescript
// 환경변수로 관리
const YOUTUBE_API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;

// 클라이언트 사이드에서 API 키 노출 최소화
// 서버 사이드에서 메타데이터 처리 후 전송
```

### 2. 콘텐츠 검증
```typescript
// lib/contentValidation.ts
export async function validateYouTubeContent(videoId: string): Promise<boolean> {
  try {
    const metadata = await youtubeService.getVideoMetadata(videoId);
    
    // 연령 제한 콘텐츠 필터링
    // 저작권 문제 있는 콘텐츠 체크
    // 부적절한 콘텐츠 필터링
    
    return true;
  } catch (error) {
    console.error('Content validation failed:', error);
    return false;
  }
}
```

### 3. 사용량 제한
```typescript
// 사용자당 동영상 추가 제한
const MAX_VIDEOS_PER_WORLDCUP = 32;
const MAX_VIDEOS_PER_USER_DAILY = 50;

// YouTube API 호출 제한
const YOUTUBE_API_RATE_LIMIT = 10000; // per day
```

## 📱 사용자 워크플로우

### 1. 월드컵 생성 시 동영상 추가 (개선된 탭 인터페이스)
1. **탭 기반 분리**: 이미지 업로드와 YouTube 동영상 완전 분리
2. **YouTube URL 입력**: 다양한 YouTube URL 형식 지원
3. **자동 메타데이터 수집**: 제목, 채널, 썸네일, 길이 자동 추출
4. **시간 구간 설정**: 시작/종료 시간 정밀 설정 (초 단위)
5. **실시간 미리보기**: 설정된 구간을 즉시 확인 가능
6. **검증 후 추가**: 미리보기 확인 후에만 월드컵 항목으로 추가
7. **혼합 미리보기**: 이미지와 동영상이 함께 표시되는 최종 확인

### 2. 게임 플레이 시 동영상 재생 (효율적 구조)
1. **썸네일 표시**: 저장된 YouTube 썸네일 즉시 로드 (API 호출 없음)
2. **자동 재생**: 사용자 선택 시 설정된 구간부터 즉시 시작
3. **YouTube IFrame 플레이어**: YouTube 서버에서 직접 스트리밍
4. **플레이어 컨트롤**: 사용자가 원하는 구간 자유 탐색 가능
5. **구간 제어**: 설정된 종료 시간 도달 시 알림 또는 자동 정지

### 3. 결과 화면에서 동영상 정보 표시
1. **우승 동영상 정보**: 썸네일, 제목, 채널명 표시
2. **원본 링크**: YouTube 원본 페이지로 이동 버튼
3. **통계 정보**: 조회수, 좋아요 수 등 메타데이터 표시
4. **재생 구간 정보**: 설정된 시작/종료 시간 표시

## 🛠 개발 단계별 계획 (6주)

### Phase 1: 기반 구조 (2주) ⭐ 현재 시작
- [ ] **YouTube API 서비스 클래스 구현** (배치 처리 + 캐싱)
- [ ] **데이터베이스 스키마 확장** (video 관련 컬럼 추가)
- [ ] **TypeScript 타입 정의** (VideoMetadata, WorldCupVideoItem)
- [ ] **환경 변수 설정** (YouTube API 키 관리)
- [ ] **URL 검증 로직** (다양한 YouTube URL 형식 지원)

### Phase 2: UI 컴포넌트 (2주)
- [ ] **탭 기반 업로드 인터페이스** (이미지/동영상 분리)
- [ ] **YouTube URL 입력 폼** (실시간 검증)
- [ ] **시간 구간 설정 UI** (시작/종료 시간 정밀 제어)
- [ ] **실시간 미리보기 플레이어** (설정 구간 즉시 확인)
- [ ] **동영상 항목 카드** (썸네일, 메타데이터 표시)
- [ ] **혼합 미디어 미리보기** (이미지+동영상 통합 표시)

### Phase 3: 게임 통합 (1주)
- [ ] **미디어 타입별 렌더링** (이미지/동영상 분기 처리)
- [ ] **YouTube IFrame 플레이어 통합** (게임 화면에 삽입)
- [ ] **기존 게임 로직 확장** (충돌 없는 연동)
- [ ] **결과 화면 동영상 지원** (우승 동영상 정보 표시)

### Phase 4: 최적화 및 테스트 (1주)
- [ ] **성능 최적화** (지연 로딩, API 캐싱 강화)
- [ ] **모바일 호환성** (자동재생 정책 대응)
- [ ] **반응형 디자인** (다양한 화면 크기 지원)
- [ ] **에러 처리** (네트워크 오류, API 제한 대응)
- [ ] **통합 테스트** (전체 워크플로우 검증)

## 📊 성능 고려사항

### 1. 지연 로딩
```typescript
// 동영상은 사용자가 클릭할 때까지 로딩하지 않음
const [isPlayerReady, setIsPlayerReady] = useState(false);

const handleVideoClick = () => {
  setIsPlayerReady(true);
};
```

### 2. 썸네일 캐싱
```typescript
// YouTube 썸네일을 CDN으로 캐싱
const getCachedThumbnail = (videoId: string) => {
  return `https://img.youtube.com/vi/${videoId}/medium.jpg`;
};
```

### 3. API 호출 최적화
```typescript
// 동일한 비디오 메타데이터 중복 요청 방지
const metadataCache = new Map<string, VideoMetadata>();

export const getCachedMetadata = async (videoId: string) => {
  if (metadataCache.has(videoId)) {
    return metadataCache.get(videoId);
  }
  
  const metadata = await youtubeService.getVideoMetadata(videoId);
  metadataCache.set(videoId, metadata);
  return metadata;
};
```

## 🔧 기술적 도전과제 및 해결방안

### 1. YouTube IFrame API 로딩 관리
**문제**: 여러 플레이어 인스턴스 간 충돌
**해결**: 전역 API 로더와 플레이어 풀 관리

### 2. 모바일 환경에서 자동재생 제한
**문제**: iOS/Android에서 자동재생 정책
**해결**: 사용자 인터랙션 후 재생, 대체 UI 제공

### 3. 동영상 시간 동기화
**문제**: 설정된 구간과 실제 재생 시간 차이
**해결**: 정확한 타이밍 제어와 오차 보정 로직

### 4. 저작권 및 지역 제한
**문제**: 일부 동영상의 접근 제한
**해결**: 사전 검증 및 대체 콘텐츠 안내

## 🎯 성공 지표

### 1. 기능적 지표
- 동영상 추가 성공률 > 95%
- 플레이어 로딩 시간 < 3초
- 시간 구간 정확도 > 98%

### 2. 사용자 경험 지표
- 동영상 월드컵 생성률 > 20%
- 동영상 포함 게임 완료율 > 80%
- 사용자 만족도 > 4.5/5

### 3. 기술적 지표
- API 오류율 < 1%
- 페이지 로딩 속도 < 2초
- 모바일 호환성 > 95%

---

> 본 계획서는 YouTube 동영상 월드컵 기능 통합을 위한 전체적인 로드맵을 제시합니다.
> 각 단계별 구현 과정에서 필요에 따라 수정 및 보완될 수 있습니다.