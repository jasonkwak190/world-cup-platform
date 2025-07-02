// Supabase Storage 관련 유틸리티 함수
import { supabase } from '@/lib/supabase';

// 이미지 압축 함수 (GIF는 압축하지 않음)
async function compressImage(file: File, maxWidth = 800, maxHeight = 600, quality = 0.7): Promise<File> {
  // GIF 파일은 압축하지 않고 원본 그대로 반환
  if (file.type === 'image/gif') {
    console.log('🎬 GIF detected, skipping compression:', file.name);
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

      // 원본 형식 유지 (JPEG, PNG 등)
      const outputType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
      
      canvas.toBlob((blob) => {
        if (blob) {
          // 원본 확장자 유지
          const originalExt = file.name.split('.').pop()?.toLowerCase();
          const newExt = outputType === 'image/png' ? 'png' : 'jpg';
          const newName = file.name.replace(/\.[^/.]+$/, `.${originalExt || newExt}`);
          
          const compressedFile = new File([blob], newName, {
            type: outputType,
            lastModified: Date.now(),
          });
          resolve(compressedFile);
        } else {
          resolve(file);
        }
      }, outputType, quality);
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
    const compressedFile = await compressImage(file, 600, 400, 0.8);
    
    const fileExt = 'webp';
    const fileName = `${worldcupId}/thumbnail.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('worldcup-thumbnails')
      .upload(fileName, compressedFile, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) {
      throw error;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('worldcup-thumbnails')
      .getPublicUrl(fileName);

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

// 월드컵 관련 모든 이미지 삭제
export async function deleteWorldCupImages(worldcupId: string) {
  try {
    console.log('🗑️ Deleting worldcup images for:', worldcupId);
    
    // 썸네일 삭제 (다양한 확장자 시도)
    const thumbnailExtensions = ['webp', 'jpg', 'jpeg', 'png', 'gif'];
    for (const ext of thumbnailExtensions) {
      try {
        await deleteImage('worldcup-thumbnails', `${worldcupId}/thumbnail.${ext}`);
      } catch (error) {
        // 파일이 없는 경우 무시
      }
    }
    
    // 아이템 이미지들 삭제
    const { data: files } = await supabase.storage
      .from('worldcup-images')
      .list(`${worldcupId}/items`);

    if (files && files.length > 0) {
      const filePaths = files.map(file => `${worldcupId}/items/${file.name}`);
      const { error: deleteError } = await supabase.storage
        .from('worldcup-images')
        .remove(filePaths);
      
      if (deleteError) {
        console.warn('⚠️ Some item images could not be deleted:', deleteError);
      } else {
        console.log(`✅ Deleted ${filePaths.length} item images`);
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Error deleting worldcup images:', error);
    return { success: false, error: '이미지 삭제 중 오류가 발생했습니다.' };
  }
}