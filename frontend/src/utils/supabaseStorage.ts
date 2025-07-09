// Supabase Storage 관련 유틸리티 함수
import { supabase } from '@/lib/supabase';

// 이미지 압축 함수 (GIF, PNG는 압축하지 않음)
async function compressImage(file: File, maxWidth = 800, maxHeight = 600, quality = 0.7): Promise<File> {
  // GIF 파일은 압축하지 않고 원본 그대로 반환
  if (file.type === 'image/gif') {
    console.log('🎬 GIF detected, skipping compression:', file.name);
    return file;
  }
  
  // 자동 생성된 썸네일은 이미 최적화되어 있으므로 압축하지 않음
  if (file.name.includes('auto-thumbnail')) {
    console.log('🖼️ Auto-generated thumbnail detected, skipping compression:', {
      name: file.name,
      type: file.type,
      size: file.size,
      sizeKB: Math.round(file.size / 1024)
    });
    
    // PNG 타입 강제 설정 (혹시 모를 타입 변질 방지)
    if (file.type !== 'image/png' && file.name.endsWith('.png')) {
      console.log('🔧 Forcing PNG type for auto-thumbnail');
      return new File([file], file.name, { 
        type: 'image/png',
        lastModified: file.lastModified
      });
    }
    
    return file;
  }

  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // 비율 유지하면서 크기 조정
      const ratio = Math.min(maxWidth / img.width, maxHeight / img.height);
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;

      ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);

      // 원본 형식 유지 (JPEG, PNG 등) - PNG는 투명도 보존을 위해 그대로 유지
      const outputType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
      // PNG의 경우 품질 매개변수가 무시되므로 무손실 압축
      
      canvas.toBlob((blob) => {
        if (blob && blob.size > 0) {
          // 원본 확장자 유지
          const originalExt = file.name.split('.').pop()?.toLowerCase();
          const newExt = outputType === 'image/png' ? 'png' : 'jpg';
          const newName = file.name.replace(/\.[^/.]+$/, `.${originalExt || newExt}`);
          
          console.log('🔧 Compression toBlob result:', {
            originalFile: file.name,
            newName,
            outputType,
            blobSize: blob.size,
            originalSize: file.size
          });
          
          const compressedFile = new File([blob], newName, {
            type: outputType,
            lastModified: Date.now(),
          });
          resolve(compressedFile);
        } else {
          console.warn('⚠️ Compression toBlob failed, returning original file');
          resolve(file);
        }
      }, outputType, outputType === 'image/png' ? undefined : quality); // PNG는 품질 매개변수 사용 안함
    };

    img.src = URL.createObjectURL(file);
  });
}

// 프로필 이미지 업로드
export async function uploadProfileImage(file: File, userId: string) {
  try {
    // 이미지 압축
    const compressedFile = await compressImage(file, 400, 400, 0.8);
    
    const fileExt = 'webp';
    const fileName = `${userId}/profile.${fileExt}`;

    // 기존 프로필 이미지 삭제 (있는 경우)
    await supabase.storage
      .from('profile-images')
      .remove([fileName]);

    // 새 이미지 업로드
    const { data, error } = await supabase.storage
      .from('profile-images')
      .upload(fileName, compressedFile, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) {
      throw error;
    }

    // 공개 URL 가져오기
    const { data: { publicUrl } } = supabase.storage
      .from('profile-images')
      .getPublicUrl(fileName);

    return { success: true, url: publicUrl };
  } catch (error) {
    console.error('Profile image upload error:', error);
    return { success: false, error: '이미지 업로드에 실패했습니다.' };
  }
}

// 월드컵 썸네일 업로드
export async function uploadWorldCupThumbnail(file: File, worldcupId: string) {
  try {
    console.log('📤 Uploading thumbnail:', {
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      sizeKB: Math.round(file.size / 1024)
    });
    
    // File 객체 유효성 검증
    if (!file || file.size === 0) {
      throw new Error('Invalid file: file is empty or null');
    }
    
    if (!file.type.startsWith('image/')) {
      throw new Error(`Invalid file type: ${file.type}. Expected image file.`);
    }
    
    console.log('🔍 File validation passed, proceeding with compression...');
    const compressedFile = await compressImage(file, 600, 400, 0.8);
    
    console.log('📊 Compression result:', {
      originalSize: file.size,
      compressedSize: compressedFile.size,
      originalType: file.type,
      compressedType: compressedFile.type,
      compressionRatio: ((file.size - compressedFile.size) / file.size * 100).toFixed(1) + '%'
    });
    
    // 파일 타입에 따라 적절한 확장자 사용
    let fileExt = 'jpg'; // 기본값
    if (file.type === 'image/png' || file.name.toLowerCase().endsWith('.png')) {
      fileExt = 'png';
    } else if (file.type === 'image/webp' || file.name.toLowerCase().endsWith('.webp')) {
      fileExt = 'webp';
    } else if (file.type === 'image/gif' || file.name.toLowerCase().endsWith('.gif')) {
      fileExt = 'gif';
    }
    
    const fileName = `${worldcupId}/thumbnail.${fileExt}`;
    console.log('📁 Thumbnail storage path:', fileName);
    
    // 최종 파일 검증
    console.log('🔍 Final file validation before upload:', {
      fileName,
      fileType: compressedFile.type,
      fileSize: compressedFile.size,
      hasValidSize: compressedFile.size > 0,
      isImageType: compressedFile.type.startsWith('image/')
    });
    
    // Content-Type 헤더 문제가 해결되었으므로 File 객체를 직접 업로드
    const { data, error } = await supabase.storage
      .from('worldcup-thumbnails')
      .upload(fileName, compressedFile, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) {
      console.error('❌ Supabase upload error:', error);
      throw error;
    }
    
    console.log('✅ Supabase upload successful:', {
      path: data.path,
      id: data.id,
      fullPath: data.fullPath
    });

    const { data: { publicUrl } } = supabase.storage
      .from('worldcup-thumbnails')
      .getPublicUrl(fileName);
      
    console.log('🌐 Generated public URL:', publicUrl);

    return { success: true, url: publicUrl };
  } catch (error) {
    console.error('Thumbnail upload error:', error);
    return { success: false, error: '썸네일 업로드에 실패했습니다.' };
  }
}

// 월드컵 아이템 이미지 업로드
export async function uploadWorldCupItemImage(file: File, worldcupId: string, itemId: string) {
  try {
    const compressedFile = await compressImage(file, 800, 600, 0.7);
    
    // 원본 확장자 유지 (GIF 등을 위해)
    const originalExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const fileExt = file.type === 'image/gif' ? 'gif' : 
                   file.type === 'image/png' ? 'png' : 
                   file.type === 'image/webp' ? 'webp' : 'jpg';
    const fileName = `${worldcupId}/items/${itemId}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('worldcup-images')
      .upload(fileName, compressedFile, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) {
      throw error;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('worldcup-images')
      .getPublicUrl(fileName);

    return { success: true, url: publicUrl };
  } catch (error) {
    console.error('Item image upload error:', error);
    return { success: false, error: '이미지 업로드에 실패했습니다.' };
  }
}

// Base64 이미지를 File 객체로 변환
export function base64ToFile(base64: string, filename: string): File {
  const arr = base64.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  
  return new File([u8arr], filename, { type: mime });
}

// 여러 이미지 업로드 (월드컵 아이템들)
export async function uploadMultipleItemImages(
  images: Array<{ file: File | string; itemId: string }>,
  worldcupId: string
) {
  const results = [];
  
  for (const { file, itemId } of images) {
    try {
      let fileToUpload: File;
      
      if (typeof file === 'string') {
        // Base64 문자열인 경우
        fileToUpload = base64ToFile(file, `item_${itemId}.jpg`);
      } else {
        fileToUpload = file;
      }
      
      const result = await uploadWorldCupItemImage(fileToUpload, worldcupId, itemId);
      results.push({ itemId, ...result });
    } catch (error) {
      console.error(`Error uploading image for item ${itemId}:`, error);
      results.push({ 
        itemId, 
        success: false, 
        error: '이미지 업로드 실패' 
      });
    }
  }
  
  return results;
}

// 이미지 삭제
export async function deleteImage(bucket: string, path: string) {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) {
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error('Image delete error:', error);
    return { success: false, error: '이미지 삭제에 실패했습니다.' };
  }
}

// 월드컵 관련 모든 이미지 삭제 - 더 이상 사용되지 않음 (supabaseData.ts의 deleteWorldCup에 통합됨)
// export async function deleteWorldCupImages(worldcupId: string) {
//   try {
//     console.log('🗑️ Deleting worldcup images for:', worldcupId);
//     
//     // 썸네일 삭제 (다양한 확장자 시도)
//     const thumbnailExtensions = ['webp', 'jpg', 'jpeg', 'png', 'gif'];
//     for (const ext of thumbnailExtensions) {
//       try {
//         await deleteImage('worldcup-thumbnails', `${worldcupId}/thumbnail.${ext}`);
//       } catch (error) {
//         // 파일이 없는 경우 무시
//       }
//     }
//     
//     // 아이템 이미지들 삭제
//     const { data: files } = await supabase.storage
//       .from('worldcup-images')
//       .list(`${worldcupId}/items`);

//     if (files && files.length > 0) {
//       const filePaths = files.map(file => `${worldcupId}/items/${file.name}`);
//       const { error: deleteError } = await supabase.storage
//         .from('worldcup-images')
//         .remove(filePaths);
//       
//       if (deleteError) {
//         console.warn('⚠️ Some item images could not be deleted:', deleteError);
//       } else {
//         console.log(`✅ Deleted ${filePaths.length} item images`);
//       }
//     }

//     return { success: true };
//   } catch (error) {
//     console.error('Error deleting worldcup images:', error);
//     return { success: false, error: '이미지 삭제 중 오류가 발생했습니다.' };
//   }
// }