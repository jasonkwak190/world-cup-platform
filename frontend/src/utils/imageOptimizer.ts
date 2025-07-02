// Advanced image optimization and compression utilities

interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'webp';
  enableProgressive?: boolean;
}

export class ImageOptimizer {
  // WebP 지원 확인
  static supportsWebP(): boolean {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  }

  // 고급 이미지 압축
  static async compressImage(
    file: File, 
    options: CompressionOptions = {}
  ): Promise<string> {
    const {
      maxWidth = 800,
      maxHeight = 600,
      quality = 0.8,
      format = this.supportsWebP() ? 'webp' : 'jpeg',
      enableProgressive: _enableProgressive = true
    } = options;

    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // 최적 크기 계산
        const { width, height } = this.calculateOptimalSize(
          img.width, 
          img.height, 
          maxWidth, 
          maxHeight
        );

        canvas.width = width;
        canvas.height = height;

        if (ctx) {
          // 이미지 품질 향상 설정
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          // 이미지 그리기
          ctx.drawImage(img, 0, 0, width, height);

          // 압축된 데이터 URL 생성
          const mimeType = format === 'webp' ? 'image/webp' : 'image/jpeg';
          const compressedDataUrl = canvas.toDataURL(mimeType, quality);
          
          console.log(`Image compressed: ${file.size} bytes -> ${this.getDataUrlSize(compressedDataUrl)} bytes`);
          resolve(compressedDataUrl);
        } else {
          reject(new Error('Canvas context 생성 실패'));
        }
      };

      img.onerror = () => reject(new Error('이미지 로드 실패'));
      img.src = URL.createObjectURL(file);
    });
  }

  // 썸네일 생성 (더 작은 크기)
  static async createThumbnail(file: File): Promise<string> {
    return this.compressImage(file, {
      maxWidth: 300,
      maxHeight: 200,
      quality: 0.7,
      format: this.supportsWebP() ? 'webp' : 'jpeg'
    });
  }

  // 최적 크기 계산
  private static calculateOptimalSize(
    originalWidth: number,
    originalHeight: number,
    maxWidth: number,
    maxHeight: number
  ): { width: number; height: number } {
    let { width, height } = { width: originalWidth, height: originalHeight };

    // 비율 유지하면서 최대 크기 제한
    if (width > maxWidth) {
      height = (height * maxWidth) / width;
      width = maxWidth;
    }

    if (height > maxHeight) {
      width = (width * maxHeight) / height;
      height = maxHeight;
    }

    return { width: Math.round(width), height: Math.round(height) };
  }

  // 데이터 URL 크기 계산
  private static getDataUrlSize(dataUrl: string): number {
    const base64 = dataUrl.split(',')[1];
    return base64 ? (base64.length * 3) / 4 : 0;
  }

  // 이미지 품질 자동 조정
  static async adaptiveCompress(file: File, targetSizeKB: number = 500): Promise<string> {
    let quality = 0.9;
    let result = '';
    
    // 목표 크기에 도달할 때까지 품질 조정
    for (let attempt = 0; attempt < 5; attempt++) {
      result = await this.compressImage(file, { quality });
      const sizeKB = this.getDataUrlSize(result) / 1024;
      
      console.log(`Attempt ${attempt + 1}: Quality ${quality}, Size ${sizeKB.toFixed(1)}KB`);
      
      if (sizeKB <= targetSizeKB || quality <= 0.3) {
        break;
      }
      
      quality -= 0.15;
    }
    
    return result;
  }

  // 배치 압축 (여러 이미지 동시 처리)
  static async compressBatch(
    files: File[], 
    _options: CompressionOptions = {},
    onProgress?: (completed: number, total: number) => void
  ): Promise<string[]> {
    const results: string[] = [];
    
    for (let i = 0; i < files.length; i++) {
      try {
        const compressed = await this.adaptiveCompress(files[i]);
        results.push(compressed);
        onProgress?.(i + 1, files.length);
      } catch (error) {
        console.error(`Failed to compress image ${i}:`, error);
        results.push(''); // 실패 시 빈 문자열
      }
    }
    
    return results;
  }
}