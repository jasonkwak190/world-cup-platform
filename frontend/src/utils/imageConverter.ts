// URL 이미지를 File 객체로 변환하는 유틸리티 (CORS 우회 포함)
export async function urlToFile(url: string, filename?: string): Promise<File> {
  // Google 이미지 URL인지 확인
  const isGoogleImage = url.includes('googleusercontent.com') || 
                       url.includes('gstatic.com') || 
                       url.includes('encrypted-tbn');
  
  if (isGoogleImage) {
    console.warn('⚠️ Google image URL detected, CORS will likely fail:', url.substring(0, 50) + '...');
    throw new Error('CORS_BLOCKED: Google images cannot be converted due to CORS policies');
  }
  
  try {
    // 타임아웃 설정 (5초)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    // no-cors 모드로 시도 (제한적이지만 CORS 우회)
    const response = await fetch(url, {
      mode: 'no-cors',
      cache: 'no-cache',
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    // no-cors 모드에서는 response.ok를 확인할 수 없음
    const blob = await response.blob();
    
    // Blob이 비어있으면 CORS 차단된 것으로 간주
    if (blob.size === 0) {
      throw new Error('CORS_BLOCKED: Empty response, likely blocked by CORS');
    }
    
    // 파일 확장자 추출
    const urlParts = url.split('.');
    const extension = urlParts[urlParts.length - 1].split('?')[0] || 'jpg';
    const finalFilename = filename || `image_${Date.now()}.${extension}`;
    
    return new File([blob], finalFilename, { type: blob.type || 'image/jpeg' });
  } catch (error) {
    console.error('Failed to convert URL to file:', error);
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('TIMEOUT: Image fetch timed out after 5 seconds');
      }
      if (error.message.includes('CORS') || error.message.includes('network')) {
        throw new Error('CORS_BLOCKED: Cannot fetch image due to CORS policies');
      }
    }
    
    throw error;
  }
}

// Base64 문자열을 File 객체로 변환
export function base64ToFile(base64String: string, filename?: string): File {
  try {
    const arr = base64String.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    
    const finalFilename = filename || `image_${Date.now()}.jpg`;
    return new File([u8arr], finalFilename, { type: mime });
  } catch (error) {
    console.error('Failed to convert base64 to file:', error);
    throw error;
  }
}

// 이미지 타입 검증
export function isValidImageUrl(url: string): boolean {
  const imageExtensions = /\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?.*)?$/i;
  return imageExtensions.test(url);
}

// 이미지 로드 테스트 (CORS 및 유효성 확인)
export async function testImageLoad(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    
    img.src = url;
    
    // 5초 타임아웃
    setTimeout(() => resolve(false), 5000);
  });
}