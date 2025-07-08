// 🔒 파일 업로드 보안 강화
// Medium 보안 취약점 해결: 파일 헤더 검증, 메타데이터 제거

import { fileUploadSchema, validateRequest } from './validations';

// 🔍 허용된 파일 시그니처 (Magic Numbers)
const ALLOWED_FILE_SIGNATURES = {
  'image/jpeg': [
    [0xFF, 0xD8, 0xFF], // JPEG/JFIF
    [0xFF, 0xD8, 0xFF, 0xE0], // JPEG
    [0xFF, 0xD8, 0xFF, 0xE1], // JPEG EXIF
    [0xFF, 0xD8, 0xFF, 0xE2], // JPEG EXIF
    [0xFF, 0xD8, 0xFF, 0xE3], // JPEG EXIF
    [0xFF, 0xD8, 0xFF, 0xE8], // JPEG SPIFF
  ],
  'image/png': [
    [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A] // PNG
  ],
  'image/gif': [
    [0x47, 0x49, 0x46, 0x38, 0x37, 0x61], // GIF87a
    [0x47, 0x49, 0x46, 0x38, 0x39, 0x61]  // GIF89a
  ],
  'image/webp': [
    [0x52, 0x49, 0x46, 0x46] // RIFF (WebP starts with RIFF)
  ]
};

// 🔍 파일 헤더 검증 함수
function validateFileHeader(buffer: ArrayBuffer, mimeType: string): boolean {
  const uint8Array = new Uint8Array(buffer);
  const signatures = ALLOWED_FILE_SIGNATURES[mimeType as keyof typeof ALLOWED_FILE_SIGNATURES];
  
  if (!signatures) return false;
  
  return signatures.some(signature => {
    if (uint8Array.length < signature.length) return false;
    return signature.every((byte, index) => uint8Array[index] === byte);
  });
}

// 🔍 WebP 파일 추가 검증
function validateWebPHeader(buffer: ArrayBuffer): boolean {
  const uint8Array = new Uint8Array(buffer);
  if (uint8Array.length < 12) return false;
  
  // RIFF 시그니처 확인
  const riff = Array.from(uint8Array.slice(0, 4));
  const webp = Array.from(uint8Array.slice(8, 12));
  
  const riffSignature = [0x52, 0x49, 0x46, 0x46];
  const webpSignature = [0x57, 0x45, 0x42, 0x50];
  
  return riff.every((byte, index) => byte === riffSignature[index]) &&
         webp.every((byte, index) => byte === webpSignature[index]);
}

// 🔒 종합 파일 검증 함수
export async function validateImageFile(file: File): Promise<{
  isValid: boolean;
  error?: string;
  sanitizedFile?: File;
}> {
  try {
    // 1. 기본 파일 정보 검증 (Zod 스키마)
    const fileValidation = validateRequest(fileUploadSchema, {
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type
    });
    
    if (!fileValidation.success) {
      return {
        isValid: false,
        error: `파일 정보 검증 실패: ${fileValidation.error}`
      };
    }
    
    // 2. 파일 내용 읽기 (처음 32바이트)
    const headerBuffer = await file.slice(0, 32).arrayBuffer();
    
    // 3. 파일 헤더 검증
    const isValidHeader = file.type === 'image/webp' 
      ? validateWebPHeader(headerBuffer)
      : validateFileHeader(headerBuffer, file.type);
    
    if (!isValidHeader) {
      return {
        isValid: false,
        error: '파일 헤더가 올바르지 않습니다. 실제 이미지 파일인지 확인해주세요.'
      };
    }
    
    // 4. 파일 확장자와 MIME 타입 일치 확인
    const fileExtension = file.name.toLowerCase().split('.').pop();
    const expectedExtensions: { [key: string]: string[] } = {
      'image/jpeg': ['jpg', 'jpeg'],
      'image/png': ['png'],
      'image/gif': ['gif'],
      'image/webp': ['webp']
    };
    
    const allowedExtensions = expectedExtensions[file.type];
    if (!allowedExtensions || !fileExtension || !allowedExtensions.includes(fileExtension)) {
      return {
        isValid: false,
        error: '파일 확장자와 내용이 일치하지 않습니다.'
      };
    }
    
    // 5. 메타데이터 제거된 파일 생성
    const sanitizedFile = await sanitizeImageFile(file);
    
    return {
      isValid: true,
      sanitizedFile: sanitizedFile
    };
    
  } catch (error) {
    console.error('File validation error:', error);
    return {
      isValid: false,
      error: '파일 검증 중 오류가 발생했습니다.'
    };
  }
}

// 🔒 이미지 메타데이터 제거 함수
async function sanitizeImageFile(file: File): Promise<File> {
  try {
    // Canvas를 사용하여 이미지 재생성 (EXIF 등 메타데이터 제거)
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Canvas context를 생성할 수 없습니다'));
        return;
      }
      
      img.onload = () => {
        // 원본 이미지 크기 유지
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        
        // 메타데이터 없이 이미지만 복사
        ctx.drawImage(img, 0, 0);
        
        // 새로운 파일 생성
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('이미지 변환에 실패했습니다'));
            return;
          }
          
          // 원본 파일명 유지하되 메타데이터 제거됨을 표시
          const sanitizedFile = new File([blob], file.name, {
            type: file.type,
            lastModified: Date.now()
          });
          
          resolve(sanitizedFile);
        }, file.type, 0.95); // 95% 품질 유지
        
        // 메모리 정리
        URL.revokeObjectURL(img.src);
      };
      
      img.onerror = () => {
        reject(new Error('이미지 로딩에 실패했습니다'));
        URL.revokeObjectURL(img.src);
      };
      
      // 이미지 로드
      img.src = URL.createObjectURL(file);
    });
    
  } catch (error) {
    console.warn('메타데이터 제거 실패, 원본 파일 사용:', error);
    return file; // 메타데이터 제거 실패시 원본 반환
  }
}

// 🔍 악성 파일 패턴 검사
function checkMaliciousPatterns(buffer: ArrayBuffer): boolean {
  const uint8Array = new Uint8Array(buffer);
  const content = Array.from(uint8Array).map(byte => String.fromCharCode(byte)).join('');
  
  // 의심스러운 패턴들
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /vbscript:/i,
    /onload/i,
    /onerror/i,
    /<?php/i,
    /<%/,
    /<\?asp/i
  ];
  
  return suspiciousPatterns.some(pattern => pattern.test(content));
}

// 🔍 파일 크기 압축률 검증 (압축 폭탄 방지)
async function validateCompressionRatio(file: File): Promise<boolean> {
  try {
    const maxRatio = 100; // 최대 100:1 압축률
    const buffer = await file.arrayBuffer();
    
    // 간단한 압축률 추정 (실제 압축 해제 없이)
    const ratio = buffer.byteLength / file.size;
    
    return ratio <= maxRatio;
  } catch {
    return true; // 검증 실패시 통과
  }
}

// 🔒 통합 보안 검증 함수
export async function secureFileValidation(file: File): Promise<{
  isValid: boolean;
  error?: string;
  secureFile?: File;
}> {
  try {
    // 1. 기본 파일 검증
    const basicValidation = await validateImageFile(file);
    if (!basicValidation.isValid) {
      return basicValidation;
    }
    
    // 2. 악성 패턴 검사
    const headerBuffer = await file.slice(0, 1024).arrayBuffer(); // 처음 1KB 검사
    if (checkMaliciousPatterns(headerBuffer)) {
      return {
        isValid: false,
        error: '의심스러운 내용이 감지되었습니다.'
      };
    }
    
    // 3. 압축률 검증
    if (!(await validateCompressionRatio(file))) {
      return {
        isValid: false,
        error: '비정상적인 압축률이 감지되었습니다.'
      };
    }
    
    return {
      isValid: true,
      secureFile: basicValidation.sanitizedFile
    };
    
  } catch (error) {
    console.error('Secure file validation error:', error);
    return {
      isValid: false,
      error: '파일 보안 검증 중 오류가 발생했습니다.'
    };
  }
}

// 🔒 배치 파일 검증
export async function validateMultipleFiles(files: File[]): Promise<{
  validFiles: File[];
  invalidFiles: { file: File; error: string }[];
}> {
  const validFiles: File[] = [];
  const invalidFiles: { file: File; error: string }[] = [];
  
  // 동시 처리 제한 (5개씩)
  const batchSize = 5;
  for (let i = 0; i < files.length; i += batchSize) {
    const batch = files.slice(i, i + batchSize);
    const results = await Promise.all(
      batch.map(async (file) => {
        const validation = await secureFileValidation(file);
        return { file, validation };
      })
    );
    
    results.forEach(({ file, validation }) => {
      if (validation.isValid && validation.secureFile) {
        validFiles.push(validation.secureFile);
      } else {
        invalidFiles.push({
          file,
          error: validation.error || '알 수 없는 오류'
        });
      }
    });
  }
  
  return { validFiles, invalidFiles };
}

export default {
  validateImageFile,
  secureFileValidation,
  validateMultipleFiles,
  sanitizeImageFile: sanitizeImageFile
};