/**
 * Blob URL을 File 객체로 변환하는 유틸리티 함수들
 * 클라이언트 측에서 blob URL을 File 객체로 변환하여 서버에 전송
 */

/**
 * Blob URL을 File 객체로 변환합니다.
 * @param blobUrl blob: 프로토콜로 시작하는 URL
 * @param filename 파일 이름
 * @returns Promise<File> 변환된 File 객체
 */
export async function blobUrlToFile(blobUrl: string, filename: string): Promise<File> {
  if (!blobUrl.startsWith('blob:')) {
    throw new Error('Invalid blob URL');
  }

  try {
    const response = await fetch(blobUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch blob: ${response.status}`);
    }

    const blob = await response.blob();
    const file = new File([blob], filename, { type: blob.type });

    console.log('✅ Blob URL converted to File:', {
      originalUrl: blobUrl,
      filename,
      size: file.size,
      type: file.type
    });

    return file;
  } catch (error) {
    console.error('❌ Failed to convert blob URL to file:', error);
    throw new Error(`Blob URL conversion failed: ${error.message}`);
  }
}

/**
 * 월드컵 아이템 배열에서 blob URL을 File 객체로 변환합니다.
 * @param items 월드컵 아이템 배열
 * @returns Promise<Array> 변환된 아이템 배열
 */
export async function convertBlobUrlsInItems(items: any[]): Promise<any[]> {
  const convertedItems = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const convertedItem = { ...item };

    if (item.image && typeof item.image === 'string' && item.image.startsWith('blob:')) {
      console.log(`🔄 Converting blob URL for item ${i + 1}: ${item.title}`);
      
      try {
        // 파일 확장자 추출 (없으면 기본값 사용)
        const extension = item.image.includes('.') ? 
          item.image.split('.').pop()?.split('?')[0] || 'jpg' : 
          'jpg';
        
        const filename = `${item.title.replace(/[^a-zA-Z0-9]/g, '_')}.${extension}`;
        const file = await blobUrlToFile(item.image, filename);
        
        convertedItem.image = file;
        console.log(`✅ Item ${i + 1} blob URL converted to File`);
      } catch (error) {
        console.error(`❌ Failed to convert blob URL for item ${i + 1}:`, error);
        // blob URL 변환 실패 시 해당 아이템을 제외하거나 에러 처리
        throw new Error(`Failed to convert blob URL for item "${item.title}": ${error.message}`);
      }
    }

    convertedItems.push(convertedItem);
  }

  return convertedItems;
}

/**
 * 썸네일 blob URL을 File 객체로 변환합니다.
 * @param thumbnail 썸네일 (string | File)
 * @returns Promise<string | File> 변환된 썸네일
 */
export async function convertThumbnailBlobUrl(thumbnail: string | File): Promise<string | File> {
  if (typeof thumbnail === 'string' && thumbnail.startsWith('blob:')) {
    console.log('🔄 Converting thumbnail blob URL');
    
    try {
      const file = await blobUrlToFile(thumbnail, 'thumbnail.jpg');
      console.log('✅ Thumbnail blob URL converted to File');
      return file;
    } catch (error) {
      console.error('❌ Failed to convert thumbnail blob URL:', error);
      throw new Error(`Failed to convert thumbnail blob URL: ${error.message}`);
    }
  }

  return thumbnail;
}

/**
 * 전체 월드컵 데이터에서 blob URL을 File 객체로 변환합니다.
 * @param worldCupData 월드컵 데이터
 * @returns Promise<any> 변환된 월드컵 데이터
 */
export async function convertAllBlobUrls(worldCupData: any): Promise<any> {
  console.log('🔄 Starting blob URL conversion for world cup data');
  
  const convertedData = { ...worldCupData };

  try {
    // 1. 일반 아이템들의 blob URL 변환
    if (convertedData.items && convertedData.items.length > 0) {
      console.log(`🔄 Converting ${convertedData.items.length} items`);
      convertedData.items = await convertBlobUrlsInItems(convertedData.items);
    }

    // 2. 썸네일 blob URL 변환
    if (convertedData.thumbnail) {
      console.log('🔄 Converting thumbnail');
      convertedData.thumbnail = await convertThumbnailBlobUrl(convertedData.thumbnail);
    }

    // 3. 비디오 아이템들은 일반적으로 blob URL을 사용하지 않으므로 그대로 유지
    // (비디오는 YouTube 썸네일 URL이나 File 객체를 사용)

    console.log('✅ All blob URLs converted successfully');
    return convertedData;
  } catch (error) {
    console.error('❌ Failed to convert blob URLs:', error);
    throw new Error(`Blob URL conversion failed: ${error.message}`);
  }
}

/**
 * 개발 환경에서 blob URL 검증
 */
export function validateNoBlobUrls(data: any, path: string = 'root'): boolean {
  if (typeof data === 'string' && data.startsWith('blob:')) {
    console.error(`❌ Blob URL found at ${path}: ${data}`);
    return false;
  }

  if (Array.isArray(data)) {
    return data.every((item, index) => 
      validateNoBlobUrls(item, `${path}[${index}]`)
    );
  }

  if (data && typeof data === 'object') {
    return Object.keys(data).every(key => 
      validateNoBlobUrls(data[key], `${path}.${key}`)
    );
  }

  return true;
}