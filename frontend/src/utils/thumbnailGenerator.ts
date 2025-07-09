/**
 * 썸네일 자동 생성 유틸리티
 * Canvas를 사용하여 업로드된 이미지 중 랜덤 2개를 조합해 썸네일 생성
 */

interface WorldCupItem {
  id: string;
  title: string;
  image: string | File;
  description?: string;
}

interface ThumbnailSource {
  type: 'image' | 'video';
  source: string | File;
  title: string;
}

/**
 * 업로드된 이미지나 비디오 썸네일 중 랜덤하게 2개를 선택하여 썸네일을 생성합니다.
 * @param items 월드컵 아이템 배열 또는 썸네일 소스 배열
 * @returns Promise<string> Base64 인코딩된 썸네일 이미지
 */
export async function generateAutoThumbnail(items: WorldCupItem[] | ThumbnailSource[]): Promise<string> {
  if (items.length < 2) {
    throw new Error('썸네일 생성을 위해서는 최소 2개의 이미지가 필요합니다.');
  }

  console.log('🎨 Starting auto thumbnail generation with', items.length, 'items');

  // 새로운 ThumbnailSource 구조인지 기존 WorldCupItem 구조인지 확인
  const isThumbnailSourceArray = items.length > 0 && 'type' in items[0];
  let validSources: { source: string | File; title: string }[] = [];

  if (isThumbnailSourceArray) {
    // 새로운 ThumbnailSource 구조
    const thumbnailSources = items as ThumbnailSource[];
    validSources = thumbnailSources
      .filter(item => item.source && (typeof item.source === 'string' || item.source instanceof File))
      .map(item => ({ source: item.source, title: item.title }));
  } else {
    // 기존 WorldCupItem 구조
    const worldCupItems = items as WorldCupItem[];
    validSources = worldCupItems
      .filter(item => {
        const hasImage = item.image && 
          (typeof item.image === 'string' || item.image instanceof File);
        if (!hasImage) {
          console.warn('⚠️ Item without valid image skipped:', item.title);
        }
        return hasImage;
      })
      .map(item => ({ source: item.image, title: item.title }));
  }

  if (validSources.length < 2) {
    throw new Error('유효한 이미지가 있는 아이템이 2개 미만입니다.');
  }

  // 랜덤하게 2개 아이템 선택
  const shuffled = [...validSources].sort(() => 0.5 - Math.random());
  const selectedSources = shuffled.slice(0, 2);
  
  console.log('🎲 Selected sources for thumbnail:', selectedSources.map(source => source.title));

  try {
    // 이미지 로드
    console.log('📥 Loading images for thumbnail generation...');
    const images = await Promise.all(
      selectedSources.map(async (source, index) => {
        try {
          console.log(`📷 Loading image ${index + 1}:`, source.title);
          return await loadImage(source.source);
        } catch (error) {
          console.error(`❌ Failed to load image ${index + 1}:`, error);
          throw error;
        }
      })
    );

    console.log('🖼️ All images loaded, combining...');
    
    // Canvas에서 이미지 합성
    const result = combineImages(images[0], images[1]);
    
    console.log('🎉 Auto thumbnail generated successfully!');
    return result;
    
  } catch (error) {
    console.error('❌ Auto thumbnail generation failed:', error);
    throw new Error(`자동 썸네일 생성 실패: ${error.message}`);
  }
}

/**
 * 이미지를 로드하여 HTMLImageElement로 반환합니다.
 * @param imageSource 이미지 소스 (File 또는 base64 문자열)
 * @returns Promise<HTMLImageElement>
 */
async function loadImage(imageSource: string | File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    // CORS 설정으로 tainted canvas 문제 해결
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      console.log('✅ Image loaded successfully for thumbnail generation');
      resolve(img);
    };
    
    img.onerror = (error) => {
      console.error('❌ Image load failed for thumbnail generation:', error);
      reject(new Error(`이미지 로드 실패: ${error}`));
    };

    if (imageSource instanceof File) {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.onerror = () => {
        reject(new Error('File reader 오류가 발생했습니다.'));
      };
      reader.readAsDataURL(imageSource);
    } else {
      // URL 이미지인 경우
      console.log('🔄 Loading image from URL for thumbnail:', imageSource.substring(0, 100) + '...');
      
      // Supabase URL이고 CORS 문제가 예상되는 경우 fetch로 변환
      if (imageSource.includes('supabase') || imageSource.startsWith('http')) {
        try {
          // fetch로 이미지를 가져와서 blob URL로 변환 (CORS 우회)
          fetch(imageSource)
            .then(response => {
              if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
              }
              return response.blob();
            })
            .then(blob => {
              const blobUrl = URL.createObjectURL(blob);
              img.src = blobUrl;
              
              // 이미지 로드 후 blob URL 정리
              img.onload = () => {
                URL.revokeObjectURL(blobUrl);
                console.log('✅ Image loaded successfully via fetch for thumbnail generation');
                resolve(img);
              };
            })
            .catch(fetchError => {
              console.warn('⚠️ Fetch failed, trying direct URL:', fetchError);
              // fetch 실패시 직접 URL 시도
              img.src = imageSource;
            });
        } catch (error) {
          console.warn('⚠️ Fetch attempt failed, using direct URL:', error);
          img.src = imageSource;
        }
      } else {
        // 일반 URL인 경우 직접 로드
        img.src = imageSource;
      }
    }
  });
}

/**
 * 두 이미지를 Canvas에서 좌우로 합성합니다.
 * @param leftImage 왼쪽에 배치할 이미지
 * @param rightImage 오른쪽에 배치할 이미지
 * @returns string Base64 인코딩된 합성 이미지
 */
function combineImages(leftImage: HTMLImageElement, rightImage: HTMLImageElement): string {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Canvas context를 가져올 수 없습니다.');
  }

  // 썸네일 크기 설정 (16:9 비율)
  const thumbnailWidth = 640;
  const thumbnailHeight = 360;
  const exactHalfWidth = thumbnailWidth / 2; // 정확히 320px씩

  canvas.width = thumbnailWidth;
  canvas.height = thumbnailHeight;

  // 배경색 설정 (선택사항)
  ctx.fillStyle = '#f8f9fa';
  ctx.fillRect(0, 0, thumbnailWidth, thumbnailHeight);

  // 정확히 반반으로 이미지 그리기
  // 왼쪽: 0부터 320px까지 (320px 너비)
  drawImageFitted(ctx, leftImage, 0, 0, exactHalfWidth, thumbnailHeight);
  // 오른쪽: 320px부터 640px까지 (320px 너비)  
  drawImageFitted(ctx, rightImage, exactHalfWidth, 0, exactHalfWidth, thumbnailHeight);

  // 중앙 구분선 추가 (정확히 320px 위치)
  ctx.strokeStyle = '#e5e7eb';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(exactHalfWidth, 0);
  ctx.lineTo(exactHalfWidth, thumbnailHeight);
  ctx.stroke();

  // Base64로 변환하여 반환
  try {
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    console.log('✅ Thumbnail canvas converted to base64 successfully');
    return dataUrl;
  } catch (error) {
    console.error('❌ Canvas toDataURL failed (tainted canvas):', error);
    throw new Error('썸네일 생성 실패: 이미지 보안 정책으로 인해 Canvas를 내보낼 수 없습니다.');
  }
}

/**
 * 이미지를 지정된 영역에 꽉 차게 맞춰서 그립니다 (크롭 방식).
 * 비율을 유지하면서 영역을 완전히 채우고, 넘치는 부분은 잘립니다.
 * @param ctx Canvas 2D 컨텍스트
 * @param image 그릴 이미지
 * @param x 영역의 x 좌표
 * @param y 영역의 y 좌표
 * @param width 영역의 너비 (정확히 이 크기로 채워집니다)
 * @param height 영역의 높이 (정확히 이 크기로 채워집니다)
 */
function drawImageFitted(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number
): void {
  const imageAspectRatio = image.width / image.height;
  const targetAspectRatio = width / height;

  let sourceX = 0;
  let sourceY = 0;
  let sourceWidth = image.width;
  let sourceHeight = image.height;

  // 이미지를 크롭하여 목표 비율에 맞춤
  if (imageAspectRatio > targetAspectRatio) {
    // 이미지가 더 넓음 - 좌우를 자름
    sourceWidth = image.height * targetAspectRatio;
    sourceX = (image.width - sourceWidth) / 2;
  } else {
    // 이미지가 더 높음 - 위아래를 자름
    sourceHeight = image.width / targetAspectRatio;
    sourceY = (image.height - sourceHeight) / 2;
  }

  // 클리핑 영역 설정하여 정확한 영역에만 그리기
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, width, height);
  ctx.clip();

  // 이미지를 정확한 크기로 그리기
  ctx.drawImage(
    image,
    sourceX, sourceY, sourceWidth, sourceHeight,  // 소스 영역
    x, y, width, height                           // 목표 영역
  );

  ctx.restore();
}