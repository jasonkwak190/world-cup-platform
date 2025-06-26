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

/**
 * 업로드된 이미지 중 랜덤하게 2개를 선택하여 썸네일을 생성합니다.
 * @param items 월드컵 아이템 배열
 * @returns Promise<string> Base64 인코딩된 썸네일 이미지
 */
export async function generateAutoThumbnail(items: WorldCupItem[]): Promise<string> {
  if (items.length < 2) {
    throw new Error('썸네일 생성을 위해서는 최소 2개의 이미지가 필요합니다.');
  }

  // 랜덤하게 2개 아이템 선택
  const shuffled = [...items].sort(() => 0.5 - Math.random());
  const selectedItems = shuffled.slice(0, 2);

  // 이미지 로드
  const images = await Promise.all(
    selectedItems.map(item => loadImage(item.image))
  );

  // Canvas에서 이미지 합성
  return combineImages(images[0], images[1]);
}

/**
 * 이미지를 로드하여 HTMLImageElement로 반환합니다.
 * @param imageSource 이미지 소스 (File 또는 base64 문자열)
 * @returns Promise<HTMLImageElement>
 */
async function loadImage(imageSource: string | File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => resolve(img);
    img.onerror = reject;

    if (imageSource instanceof File) {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(imageSource);
    } else {
      img.src = imageSource;
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
  const halfWidth = thumbnailWidth / 2;

  canvas.width = thumbnailWidth;
  canvas.height = thumbnailHeight;

  // 배경색 설정 (선택사항)
  ctx.fillStyle = '#f8f9fa';
  ctx.fillRect(0, 0, thumbnailWidth, thumbnailHeight);

  // 이미지 크기 계산 및 그리기
  drawImageCentered(ctx, leftImage, 0, 0, halfWidth, thumbnailHeight);
  drawImageCentered(ctx, rightImage, halfWidth, 0, halfWidth, thumbnailHeight);

  // 중앙 구분선 추가 (선택사항)
  ctx.strokeStyle = '#e5e7eb';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(halfWidth, 0);
  ctx.lineTo(halfWidth, thumbnailHeight);
  ctx.stroke();

  // Base64로 변환하여 반환
  return canvas.toDataURL('image/jpeg', 0.8);
}

/**
 * 이미지를 지정된 영역에 가운데 정렬하여 그립니다.
 * @param ctx Canvas 2D 컨텍스트
 * @param image 그릴 이미지
 * @param x 영역의 x 좌표
 * @param y 영역의 y 좌표
 * @param width 영역의 너비
 * @param height 영역의 높이
 */
function drawImageCentered(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number
): void {
  const imageAspectRatio = image.width / image.height;
  const areaAspectRatio = width / height;

  let drawWidth: number;
  let drawHeight: number;
  let drawX: number;
  let drawY: number;

  if (imageAspectRatio > areaAspectRatio) {
    // 이미지가 더 넓음 - 높이에 맞춤
    drawHeight = height;
    drawWidth = height * imageAspectRatio;
    drawX = x + (width - drawWidth) / 2;
    drawY = y;
  } else {
    // 이미지가 더 높음 - 너비에 맞춤
    drawWidth = width;
    drawHeight = width / imageAspectRatio;
    drawX = x;
    drawY = y + (height - drawHeight) / 2;
  }

  ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight);
}