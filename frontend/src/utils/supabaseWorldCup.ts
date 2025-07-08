// Supabase 월드컵 생성 유틸리티
import { supabase } from '@/lib/supabase';
import { uploadWorldCupThumbnail, uploadWorldCupItemImage, base64ToFile } from '@/utils/supabaseStorage';
import { generateAutoThumbnail } from '@/utils/thumbnailGenerator';
import { urlToFile, base64ToFile as convertBase64ToFile, isValidImageUrl, testImageLoad } from '@/utils/imageConverter';
import type { SupabaseWorldCupInsert, SupabaseWorldCupItemInsert } from '@/types/supabase';

// 월드컵을 Supabase에 직접 저장
export async function saveWorldCupToSupabase(worldCupData: any, onProgress?: (progress: number, status: string) => void) {
  try {
    console.log('🚀 Saving worldcup to Supabase:', worldCupData.title);
    onProgress?.(5, '사용자 인증을 확인하고 있습니다...');
    
    // 현재 로그인된 사용자 확인
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('로그인이 필요합니다.');
    }

    onProgress?.(10, '월드컵 기본 정보를 생성하고 있습니다...');
    
    // 1. 월드컵 기본 정보 생성
    const worldCupInsert: SupabaseWorldCupInsert = {
      title: worldCupData.title,
      description: worldCupData.description || '',
      category: worldCupData.category || 'entertainment',
      author_id: user.id,
      participants: 0,
      likes: 0,
      comments: 0,
      is_public: worldCupData.isPublic !== false,
      thumbnail_url: null // 썸네일 업로드 후 업데이트
    };

    const { data: worldCup, error: worldCupError } = await supabase
      .from('worldcups')
      .insert(worldCupInsert)
      .select()
      .single();

    if (worldCupError) {
      console.error('WorldCup creation error:', worldCupError);
      throw new Error(`월드컵 생성 실패: ${worldCupError.message}`);
    }

    console.log('✅ WorldCup created:', worldCup.id);
    onProgress?.(20, '썸네일을 처리하고 있습니다...');

    // 2. 썸네일 처리 - 수동 설정 vs 자동 생성 분기
    let thumbnailToUpload = worldCupData.thumbnail;
    
    // 썸네일이 없거나 비어있는 경우 자동 생성
    if (!thumbnailToUpload || 
        (typeof thumbnailToUpload === 'string' && thumbnailToUpload.trim() === '') ||
        (thumbnailToUpload instanceof File && thumbnailToUpload.size === 0)) {
      
      console.log('🎲 썸네일이 없어 자동 생성을 시도합니다...');
      
      // 이미지가 있는 아이템들만 필터링
      const itemsWithImages = worldCupData.items?.filter((item: any) => 
        item.image && (typeof item.image === 'string' || item.image instanceof File)
      ) || [];
      
      if (itemsWithImages.length >= 2) {
        try {
          // 자동 썸네일 생성 (Base64 문자열 반환)
          const autoThumbnail = await generateAutoThumbnail(itemsWithImages);
          if (autoThumbnail) {
            thumbnailToUpload = autoThumbnail;
            console.log('✅ 자동 썸네일 생성 완료');
          }
        } catch (error) {
          console.warn('⚠️ 자동 썸네일 생성 실패:', error);
        }
      } else {
        console.log('ℹ️ 자동 썸네일 생성을 위한 이미지가 부족합니다 (최소 2개 필요)');
      }
    } else {
      console.log('📷 사용자가 설정한 썸네일을 사용합니다');
    }

    // 3. 썸네일 업로드 (있는 경우)
    if (thumbnailToUpload) {
      try {
        let thumbnailFile: File;
        
        // 다양한 썸네일 형태 처리
        if (thumbnailToUpload instanceof File) {
          thumbnailFile = thumbnailToUpload;
          console.log('📁 Using File object for thumbnail');
        } else if (typeof thumbnailToUpload === 'string') {
          if (thumbnailToUpload.startsWith('data:image/')) {
            // Base64 이미지를 File로 변환
            console.log('🔤 Converting base64 thumbnail to file');
            thumbnailFile = convertBase64ToFile(thumbnailToUpload, 'thumbnail.jpg');
          } else if (isValidImageUrl(thumbnailToUpload)) {
            // URL 썸네일인 경우
            console.log('🌐 Converting URL thumbnail to file:', thumbnailToUpload.substring(0, 50) + '...');
            try {
              // 이미지 로드 테스트
              const canLoad = await testImageLoad(thumbnailToUpload);
              if (!canLoad) {
                throw new Error('Cannot load thumbnail image from URL');
              }
              
              thumbnailFile = await urlToFile(thumbnailToUpload, 'thumbnail.jpg');
            } catch (urlError) {
              console.warn('⚠️ Failed to convert URL thumbnail:', urlError);
              
              // CORS 실패 시 원본 URL 그대로 저장 시도
              if (urlError instanceof Error && urlError.message.includes('CORS_BLOCKED')) {
                console.log('💾 Storing original thumbnail URL due to CORS block');
                try {
                  await supabase
                    .from('worldcups')
                    .update({ thumbnail_url: thumbnailToUpload })
                    .eq('id', worldCup.id);
                  console.log('✅ Thumbnail URL stored directly');
                  // 썸네일 처리 완료, continue 대신 return으로 처리를 끝냄
                  thumbnailFile = null; // 업로드 스킵 플래그
                } catch (updateError) {
                  console.error('❌ Failed to store thumbnail URL:', updateError);
                  thumbnailFile = null;
                }
              } else {
                // URL 썸네일 실패 시 자동 생성으로 대체
                if (worldCupData.items && worldCupData.items.length >= 2) {
                  console.log('🎨 Generating auto thumbnail as fallback...');
                  const autoThumbnail = await generateAutoThumbnail(worldCupData.items);
                  if (autoThumbnail) {
                    thumbnailFile = convertBase64ToFile(autoThumbnail, 'auto_thumbnail.jpg');
                  } else {
                    throw new Error('Failed to generate fallback thumbnail');
                  }
                } else {
                  throw new Error('No fallback thumbnail available');
                }
              }
            }
          } else {
            throw new Error('Invalid thumbnail format: not a valid URL or base64');
          }
        } else {
          throw new Error('Unsupported thumbnail type: ' + typeof thumbnailToUpload);
        }
        
        // thumbnailFile이 null이면 이미 URL이 저장된 상태이므로 업로드 스킵
        if (thumbnailFile) {
          console.log('📤 Uploading thumbnail file:', {
            name: thumbnailFile.name,
            size: thumbnailFile.size,
            type: thumbnailFile.type
          });
          
          const thumbnailResult = await uploadWorldCupThumbnail(thumbnailFile, worldCup.id);
          if (thumbnailResult.success) {
            const updateResult = await supabase
              .from('worldcups')
              .update({ thumbnail_url: thumbnailResult.url })
              .eq('id', worldCup.id);
              
            if (updateResult.error) {
              console.error('❌ Failed to update thumbnail_url:', updateResult.error);
            } else {
              console.log('✅ Thumbnail uploaded and URL saved:', thumbnailResult.url);
            }
          } else {
            console.error('❌ Thumbnail upload failed:', thumbnailResult.error);
          }
        } else {
          console.log('ℹ️ Thumbnail upload skipped (URL already stored)');
        }
      } catch (error) {
        console.error('❌ Thumbnail upload error:', error);
      }
    } else {
      console.log('ℹ️ No thumbnail provided for worldcup:', worldCup.id);
    }

    onProgress?.(30, '월드컵 아이템들을 생성하고 있습니다...');
    
    // 4. 혼합 미디어 아이템들 생성 (이미지 + 동영상)
    const allMediaItems = [
      ...(worldCupData.items || []).map(item => ({ ...item, mediaType: 'image' as const })),
      ...(worldCupData.videoItems || [])
    ];
    
    if (allMediaItems.length > 0) {
      // 중복 타이틀 검증 (모든 미디어 타입 포함)
      const titleCounts = new Map<string, number>();
      const duplicateTitles = new Set<string>();
      
      allMediaItems.forEach((item: any) => {
        const title = item.title.trim();
        const count = titleCounts.get(title) || 0;
        titleCounts.set(title, count + 1);
        
        if (count >= 1) {
          duplicateTitles.add(title);
        }
      });
      
      if (duplicateTitles.size > 0) {
        const duplicateList = Array.from(duplicateTitles).join(', ');
        throw new Error(`중복된 아이템 이름이 있습니다: ${duplicateList}\n각 월드컵 내에서 아이템 이름은 고유해야 합니다.`);
      }
      
      const itemInserts: SupabaseWorldCupItemInsert[] = allMediaItems.map((item: any, index: number) => {
        const baseInsert = {
          worldcup_id: worldCup.id,
          title: item.title.trim(),
          description: item.description || '',
          order_index: index,
          media_type: item.mediaType || 'image'
        };

        if (item.mediaType === 'video') {
          // 동영상 아이템
          return {
            ...baseInsert,
            image_url: item.videoThumbnail || '', // 썸네일을 image_url로 저장
            video_url: item.videoUrl,
            video_id: item.videoId,
            video_start_time: item.videoStartTime || 0,
            video_end_time: item.videoEndTime,
            video_thumbnail: item.videoThumbnail,
            video_duration: item.videoDuration,
            video_metadata: item.videoMetadata
          };
        } else {
          // 이미지 아이템
          return {
            ...baseInsert,
            image_url: '' // 이미지 업로드 후 업데이트
          };
        }
      });

      const { data: items, error: itemsError } = await supabase
        .from('worldcup_items')
        .insert(itemInserts)
        .select();

      if (itemsError) {
        console.error('Items creation error:', itemsError);
        throw new Error(`아이템 생성 실패: ${itemsError.message}`);
      }

      console.log(`✅ ${items.length} items created`);

      // 5. 이미지 아이템들만 업로드 처리 (동영상은 이미 썸네일이 설정됨)
      const imageItems = allMediaItems.filter(item => item.mediaType === 'image');
      const imageCount = imageItems.length;
      
      if (imageCount > 0) {
        onProgress?.(40, `이미지를 업로드하고 있습니다... (0/${imageCount})`);
        
        let imageProcessedCount = 0;
        
        for (let i = 0; i < allMediaItems.length; i++) {
          const item = allMediaItems[i];
          const itemRecord = items[i];
          
          // 동영상 아이템은 건너뛰기 (이미 썸네일이 설정됨)
          if (item.mediaType === 'video') {
            console.log(`🎥 Skipping video item ${i + 1}: ${item.title} (thumbnail already set)`);
            continue;
          }
          
          try {
          
            console.log(`🖼️ Processing image item ${i + 1}/${allMediaItems.length}: ${item.title}`);
            
            imageProcessedCount++;
            
            // 진행률 업데이트 (40% ~ 90% 사이에서 이미지 개수에 따라 분배)
            const imageProgress = 40 + Math.floor((imageProcessedCount / imageCount) * 50);
            onProgress?.(imageProgress, `이미지를 업로드하고 있습니다... (${imageProcessedCount}/${imageCount})`);
          
          let imageFile: File | null = null;
          
          if (item.image) {
            // 🚨 DEBUG: Log the image type and value for debugging localhost issue
            console.log(`🔍 DEBUG - Item ${i + 1} image details:`, {
              type: typeof item.image,
              isFile: item.image instanceof File,
              isString: typeof item.image === 'string',
              value: typeof item.image === 'string' ? item.image : 'File object',
              startsWithBlob: typeof item.image === 'string' && item.image.startsWith('blob:'),
              includesLocalhost: typeof item.image === 'string' && item.image.includes('localhost')
            });

            if (item.image instanceof File) {
              // 이미 File 객체인 경우
              imageFile = item.image;
              console.log(`📁 Using File object for item ${i + 1}`);
            } else if (typeof item.image === 'string') {
              // 🚨 CRITICAL: Check for blob URLs that might be causing localhost issues
              if (item.image.startsWith('blob:')) {
                console.error(`❌ FOUND BLOB URL IN SAVE PROCESS for item ${i + 1}: ${item.image}`);
                console.error('❌ This should not happen - blob URLs should not reach the save process');
                console.error('❌ Blob URLs are for display only and should be converted to File objects');
                // Skip this item to prevent storing blob URLs
                console.warn(`⚠️ Skipping item ${i + 1} due to blob URL`);
                continue;
              }

              if (item.image.includes('localhost')) {
                console.error(`❌ FOUND LOCALHOST URL IN SAVE PROCESS for item ${i + 1}: ${item.image}`);
                console.error('❌ This should not happen - localhost URLs should not be in the data');
                // Skip this item to prevent storing localhost URLs
                console.warn(`⚠️ Skipping item ${i + 1} due to localhost URL`);
                continue;
              }

              if (item.image.startsWith('data:image/')) {
                // Base64 이미지인 경우
                console.log(`🔤 Converting base64 to file for item ${i + 1}`);
                imageFile = convertBase64ToFile(item.image, `item_${i + 1}.jpg`);
              } else if (isValidImageUrl(item.image)) {
                // URL 이미지인 경우 - 먼저 Supabase Storage 업로드 시도, 실패하면 URL 그대로 저장
                console.log(`🌐 Processing URL for item ${i + 1}: ${item.image.substring(0, 50)}...`);
                
                try {
                  // 이미지 로드 테스트
                  const canLoad = await testImageLoad(item.image);
                  if (!canLoad) {
                    console.warn(`⚠️ Cannot load image from URL for item ${i + 1}, storing URL directly...`);
                    // URL 그대로 저장
                    await supabase
                      .from('worldcup_items')
                      .update({ image_url: item.image })
                      .eq('id', itemRecord.id);
                    console.log(`💾 Item ${i + 1} URL stored directly`);
                    continue;
                  }
                  
                  imageFile = await urlToFile(item.image, `item_${i + 1}.jpg`);
                } catch (urlError) {
                  console.warn(`⚠️ Failed to convert URL for item ${i + 1}:`, urlError);
                  
                  // CORS 블록되거나 다른 이유로 실패한 경우 URL 그대로 저장
                  console.log(`💾 Storing original URL for item ${i + 1} due to conversion failure`);
                  await supabase
                    .from('worldcup_items')
                    .update({ image_url: item.image })
                    .eq('id', itemRecord.id);
                  console.log(`✅ Item ${i + 1} URL stored directly (fallback)`);
                  continue;
                }
              } else {
                console.warn(`⚠️ Invalid image format for item ${i + 1}: ${typeof item.image}`);
                continue;
              }
            }
            
            if (imageFile) {
              console.log(`📤 Uploading image for item ${i + 1}:`, {
                name: imageFile.name,
                size: imageFile.size,
                type: imageFile.type
              });
              
              const imageResult = await uploadWorldCupItemImage(imageFile, worldCup.id, itemRecord.id);
              if (imageResult.success) {
                await supabase
                  .from('worldcup_items')
                  .update({ image_url: imageResult.url })
                  .eq('id', itemRecord.id);
                console.log(`✅ Item ${i + 1} image uploaded successfully`);
              } else {
                console.error(`❌ Item ${i + 1} image upload failed:`, imageResult.error);
              }
            }
          } else {
            console.log(`ℹ️ No image provided for item ${i + 1}`);
          }
          } catch (error) {
            console.error(`❌ Item ${i + 1} image processing error:`, error);
            // 개별 이미지 실패는 전체 프로세스를 중단하지 않음
          }
        }
      } else {
        console.log('ℹ️ No image items to process, only videos present');
      }
    }

    onProgress?.(95, '월드컵 생성을 완료하고 있습니다...');
    console.log('🎉 WorldCup saved successfully to Supabase!');
    
    return {
      success: true,
      worldCupId: worldCup.id,
      message: '월드컵이 성공적으로 생성되었습니다!'
    };

  } catch (error) {
    console.error('Error saving worldcup to Supabase:', error);
    return {
      success: false,
      error: error.message || '월드컵 저장 중 오류가 발생했습니다.'
    };
  }
}

// localStorage 데이터를 Supabase로 백업
export async function backupLocalStorageToSupabase() {
  try {
    const localWorldCups = JSON.parse(localStorage.getItem('worldcups') || '[]');
    
    if (localWorldCups.length === 0) {
      return {
        success: false,
        message: '백업할 월드컵이 없습니다.'
      };
    }

    const results = [];
    for (const worldCup of localWorldCups) {
      const result = await saveWorldCupToSupabase(worldCup);
      results.push({
        title: worldCup.title,
        success: result.success,
        error: result.error
      });
    }

    const successCount = results.filter(r => r.success).length;
    
    return {
      success: true,
      message: `${successCount}/${results.length} 월드컵이 백업되었습니다.`,
      results
    };

  } catch (error) {
    return {
      success: false,
      error: error.message || '백업 중 오류가 발생했습니다.'
    };
  }
}

// 기존 월드컵 업데이트 (이미지 변경 포함)
export async function updateWorldCupInSupabase(worldcupId: string, worldCupData: any) {
  try {
    console.log('🔄 Updating worldcup in Supabase:', worldcupId);
    
    // 현재 로그인된 사용자 확인
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('로그인이 필요합니다.');
    }

    // 1. 월드컵 기본 정보 업데이트
    const { error: worldCupError } = await supabase
      .from('worldcups')
      .update({
        title: worldCupData.title,
        description: worldCupData.description || '',
        category: worldCupData.category || 'entertainment',
        is_public: worldCupData.isPublic !== false,
        updated_at: new Date().toISOString()
      })
      .eq('id', worldcupId);

    if (worldCupError) {
      console.error('WorldCup update error:', worldCupError);
      throw new Error(`월드컵 업데이트 실패: ${worldCupError.message}`);
    }

    console.log('✅ WorldCup basic info updated');

    // 2. 썸네일 업데이트 (변경된 경우)
    if (worldCupData.thumbnail) {
      try {
        let thumbnailFile: File;
        let needsThumbnailUpload = false;
        
        if (worldCupData.thumbnail instanceof File) {
          thumbnailFile = worldCupData.thumbnail;
          needsThumbnailUpload = true;
          console.log('📁 Thumbnail: New File uploaded');
        } else if (typeof worldCupData.thumbnail === 'string' && worldCupData.thumbnail.startsWith('data:image/')) {
          // Base64 이미지를 File로 변환
          const arr = worldCupData.thumbnail.split(',');
          const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
          const bstr = atob(arr[1]);
          let n = bstr.length;
          const u8arr = new Uint8Array(n);
          
          while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
          }
          
          thumbnailFile = new File([u8arr], 'thumbnail.jpg', { type: mime });
          needsThumbnailUpload = true;
          console.log('🖼️ Thumbnail: Base64 image converted to File');
        } else if (typeof worldCupData.thumbnail === 'string' && (worldCupData.thumbnail.startsWith('http') || worldCupData.thumbnail.startsWith('blob:'))) {
          // 기존 URL인 경우 - 이미지를 다시 다운로드해서 업로드
          try {
            console.log('🔄 Thumbnail: Re-uploading existing URL image');
            const response = await fetch(worldCupData.thumbnail);
            const blob = await response.blob();
            thumbnailFile = new File([blob], 'thumbnail.jpg', { type: blob.type || 'image/jpeg' });
            needsThumbnailUpload = true;
          } catch (error) {
            console.warn('⚠️ Thumbnail: Failed to fetch existing image, using existing URL:', error);
            
            // 기존 URL을 그대로 사용
            await supabase
              .from('worldcups')
              .update({ thumbnail_url: worldCupData.thumbnail })
              .eq('id', worldcupId);
            console.log('📎 Thumbnail: Used existing URL');
            needsThumbnailUpload = false;
          }
        } else {
          console.log('ℹ️ Thumbnail: Unknown format, skipping...');
          needsThumbnailUpload = false;
        }
        
        if (needsThumbnailUpload) {
          console.log('📤 Uploading thumbnail...');
          const thumbnailResult = await uploadWorldCupThumbnail(thumbnailFile, worldcupId);
          if (thumbnailResult.success) {
            await supabase
              .from('worldcups')
              .update({ thumbnail_url: thumbnailResult.url })
              .eq('id', worldcupId);
            console.log('✅ Thumbnail uploaded:', thumbnailResult.url);
          } else {
            console.warn('⚠️ Thumbnail upload failed:', thumbnailResult.error);
          }
        }
      } catch (error) {
        console.warn('⚠️ Thumbnail update error:', error);
      }
    } else {
      // 썸네일이 삭제된 경우 (null 또는 undefined)
      console.log('🗑️ Thumbnail deleted, removing from database');
      await supabase
        .from('worldcups')
        .update({ thumbnail_url: null })
        .eq('id', worldcupId);
    }

    // 3. 월드컵 아이템들 업데이트 (기존 삭제 후 새로 생성)
    if (worldCupData.items && worldCupData.items.length > 0) {
      try {
        // 기존 아이템들 삭제
        const { error: deleteError } = await supabase
          .from('worldcup_items')
          .delete()
          .eq('worldcup_id', worldcupId);

        if (deleteError) {
          console.warn('⚠️ Failed to delete old items:', deleteError);
        } else {
          console.log('🗑️ Old items deleted');
        }

        // 새 아이템들 생성
        const itemInserts = worldCupData.items.map((item: any, index: number) => ({
          worldcup_id: worldcupId,
          title: item.title,
          image_url: '', // 이미지 업로드 후 업데이트
          description: item.description || '',
          order_index: index
        }));

        const { data: items, error: itemsError } = await supabase
          .from('worldcup_items')
          .insert(itemInserts)
          .select();

        if (itemsError) {
          console.error('Items creation error:', itemsError);
          throw new Error(`아이템 생성 실패: ${itemsError.message}`);
        }

        console.log(`✅ ${items.length} items created`);

        // 4. 아이템 이미지들 업로드
        for (let i = 0; i < worldCupData.items.length; i++) {
          try {
            const item = worldCupData.items[i];
            const itemRecord = items[i];
            
            if (item.image) {
              let imageFile: File;
              let needsUpload = false;
              
              if (item.image instanceof File) {
                imageFile = item.image;
                needsUpload = true;
                console.log(`📁 Item ${i + 1}: New File uploaded`);
              } else if (typeof item.image === 'string' && item.image.startsWith('data:image/')) {
                // Base64를 File로 변환
                const arr = item.image.split(',');
                const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
                const bstr = atob(arr[1]);
                let n = bstr.length;
                const u8arr = new Uint8Array(n);
                
                while (n--) {
                  u8arr[n] = bstr.charCodeAt(n);
                }
                
                imageFile = new File([u8arr], `item_${i + 1}.jpg`, { type: mime });
                needsUpload = true;
                console.log(`🖼️ Item ${i + 1}: Base64 image converted to File`);
              } else if (typeof item.image === 'string' && (item.image.startsWith('http') || item.image.startsWith('blob:'))) {
                // 기존 URL이나 Blob URL인 경우 - 이미지를 다시 다운로드해서 업로드
                try {
                  console.log(`🔄 Item ${i + 1}: Re-uploading existing URL image`);
                  const response = await fetch(item.image);
                  const blob = await response.blob();
                  imageFile = new File([blob], `item_${i + 1}.jpg`, { type: blob.type || 'image/jpeg' });
                  needsUpload = true;
                } catch (error) {
                  console.warn(`⚠️ Item ${i + 1}: Failed to fetch existing image, skipping:`, error);
                  
                  // 기존 URL을 그대로 사용
                  await supabase
                    .from('worldcup_items')
                    .update({ image_url: item.image })
                    .eq('id', itemRecord.id);
                  console.log(`📎 Item ${i + 1}: Used existing URL`);
                  continue;
                }
              } else {
                console.warn(`❓ Item ${i + 1}: Unknown image format, skipping...`);
                continue;
              }
              
              if (needsUpload) {
                const imageResult = await uploadWorldCupItemImage(imageFile, worldcupId, itemRecord.id);
                if (imageResult.success) {
                  await supabase
                    .from('worldcup_items')
                    .update({ image_url: imageResult.url })
                    .eq('id', itemRecord.id);
                  console.log(`✅ Item ${i + 1} image uploaded: ${imageResult.url}`);
                } else {
                  console.error(`❌ Item ${i + 1} upload failed:`, imageResult.error);
                }
              }
            } else {
              console.warn(`⚠️ Item ${i + 1}: No image provided`);
            }
          } catch (error) {
            console.warn(`⚠️ Item ${i + 1} image update failed:`, error);
          }
        }
      } catch (error) {
        console.error('❌ Items update failed:', error);
        throw error;
      }
    }

    console.log('🎉 WorldCup updated successfully in Supabase!');
    
    return {
      success: true,
      message: '월드컵이 성공적으로 업데이트되었습니다!'
    };

  } catch (error) {
    console.error('❌ Error updating worldcup in Supabase:', error);
    return {
      success: false,
      error: error.message || '월드컵 업데이트 중 오류가 발생했습니다.'
    };
  }
}