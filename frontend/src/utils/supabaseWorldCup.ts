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
      
      // 이미지가 있는 아이템들과 유튜브 썸네일이 있는 아이템들 수집
      const itemsWithImages = worldCupData.items?.filter((item: any) => 
        item.image && (typeof item.image === 'string' || item.image instanceof File)
      ) || [];
      
      const videoItemsWithThumbnails = worldCupData.videoItems?.filter((item: any) => 
        item.videoThumbnail && typeof item.videoThumbnail === 'string'
      ) || [];
      
      // 이미지와 유튜브 썸네일을 통합하여 자동 썸네일 생성용 아이템 생성
      const allThumbnailSources = [
        ...itemsWithImages.map((item: any) => ({
          type: 'image',
          source: item.image,
          title: item.title
        })),
        ...videoItemsWithThumbnails.map((item: any) => ({
          type: 'video',
          source: item.videoThumbnail,
          title: item.title
        }))
      ];
      
      if (allThumbnailSources.length >= 2) {
        try {
          // 자동 썸네일 생성 (Base64 문자열 반환)
          const autoThumbnail = await generateAutoThumbnail(allThumbnailSources);
          if (autoThumbnail) {
            thumbnailToUpload = autoThumbnail;
            console.log('✅ 자동 썸네일 생성 완료 (이미지+비디오 통합)');
          }
        } catch (error) {
          console.warn('⚠️ 자동 썸네일 생성 실패:', error);
        }
      } else {
        console.log(`ℹ️ 자동 썸네일 생성을 위한 미디어가 부족합니다 (현재 ${allThumbnailSources.length}개, 최소 2개 필요)`);
      }
    } else {
      console.log('📷 사용자가 설정한 썸네일을 사용합니다');
    }

    // 3. 썸네일 업로드 (있는 경우)
    if (thumbnailToUpload) {
      try {
        let thumbnailFile: File | null = null;
        
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
      ...(worldCupData.items || []).map((item: any) => ({ ...item, mediaType: 'image' as const })),
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

      // 5. 이미지 아이템들을 병렬로 처리 (동영상은 이미 썸네일이 설정됨)
      const imageItems = allMediaItems.filter(item => item.mediaType === 'image');
      const imageCount = imageItems.length;
      
      if (imageCount > 0) {
        onProgress?.(40, `이미지를 병렬로 업로드하고 있습니다... (0/${imageCount})`);
        
        // 이미지 아이템들만 추출하여 병렬 처리
        const imageItemsWithRecords = allMediaItems
          .map((item, index) => ({ item, record: items[index], index }))
          .filter(({ item }) => item.mediaType === 'image');
        
        
        // 병렬 처리 함수 정의
        const processImageItem = async ({ item, record, index }: { item: any; record: any; index: number }) => {
          try {
            console.log(`🖼️ Processing image item ${index + 1}/${allMediaItems.length}: ${item.title}`);
            
            let imageFile: File | null = null;
            
            if (item.image) {
              // 🚨 DEBUG: Log the image type and value for debugging localhost issue
              console.log(`🔍 DEBUG - Item ${index + 1} image details:`, {
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
                console.log(`📁 Using File object for item ${index + 1}`);
              } else if (typeof item.image === 'string') {
                // 🚨 CRITICAL: Check for blob URLs that might be causing localhost issues
                if (item.image.startsWith('blob:')) {
                  console.error(`❌ FOUND BLOB URL IN SAVE PROCESS for item ${index + 1}: ${item.image}`);
                  console.error('❌ This should not happen - blob URLs should not reach the save process');
                  console.error('❌ Blob URLs are for display only and should be converted to File objects');
                  // Skip this item to prevent storing blob URLs
                  console.warn(`⚠️ Skipping item ${index + 1} due to blob URL`);
                  throw new Error(`Blob URL detected for item ${index + 1}: ${item.title}`);
                }

                if (item.image.includes('localhost')) {
                  console.error(`❌ FOUND LOCALHOST URL IN SAVE PROCESS for item ${index + 1}: ${item.image}`);
                  console.error('❌ This should not happen - localhost URLs should not be in the data');
                  // Skip this item to prevent storing localhost URLs
                  console.warn(`⚠️ Skipping item ${index + 1} due to localhost URL`);
                  throw new Error(`Localhost URL detected for item ${index + 1}: ${item.title}`);
                }

                if (item.image.startsWith('data:image/')) {
                  // Base64 이미지인 경우
                  console.log(`🔤 Converting base64 to file for item ${index + 1}`);
                  imageFile = convertBase64ToFile(item.image, `item_${index + 1}.jpg`);
                } else if (isValidImageUrl(item.image)) {
                  // URL 이미지인 경우 - 먼저 Supabase Storage 업로드 시도, 실패하면 URL 그대로 저장
                  console.log(`🌐 Processing URL for item ${index + 1}: ${item.image.substring(0, 50)}...`);
                  
                  try {
                    // 이미지 로드 테스트
                    const canLoad = await testImageLoad(item.image);
                    if (!canLoad) {
                      console.warn(`⚠️ Cannot load image from URL for item ${index + 1}, storing URL directly...`);
                      // URL 그대로 저장
                      await supabase
                        .from('worldcup_items')
                        .update({ image_url: item.image })
                        .eq('id', record.id);
                      console.log(`💾 Item ${index + 1} URL stored directly`);
                      return { success: true, itemId: record.id };
                    }
                    
                    imageFile = await urlToFile(item.image, `item_${index + 1}.jpg`);
                  } catch (urlError) {
                    console.warn(`⚠️ Failed to convert URL for item ${index + 1}:`, urlError);
                    
                    // CORS 블록되거나 다른 이유로 실패한 경우 URL 그대로 저장
                    console.log(`💾 Storing original URL for item ${index + 1} due to conversion failure`);
                    await supabase
                      .from('worldcup_items')
                      .update({ image_url: item.image })
                      .eq('id', record.id);
                    console.log(`✅ Item ${index + 1} URL stored directly (fallback)`);
                    return { success: true, itemId: record.id };
                  }
                } else {
                  console.warn(`⚠️ Invalid image format for item ${index + 1}: ${typeof item.image}`);
                  throw new Error(`Invalid image format for item ${index + 1}: ${item.title}`);
                }
              }
            }
            
            if (imageFile) {
              console.log(`📤 Uploading image for item ${index + 1}:`, {
                name: imageFile.name,
                size: imageFile.size,
                type: imageFile.type
              });
              
              const imageResult = await uploadWorldCupItemImage(imageFile, worldCup.id, record.id);
              if (imageResult.success) {
                await supabase
                  .from('worldcup_items')
                  .update({ image_url: imageResult.url })
                  .eq('id', record.id);
                console.log(`✅ Item ${index + 1} image uploaded successfully`);
                return { success: true, itemId: record.id };
              } else {
                console.error(`❌ Item ${index + 1} image upload failed:`, imageResult.error);
                throw new Error(`Image upload failed for item ${index + 1}: ${imageResult.error}`);
              }
            } else {
              console.log(`ℹ️ No image provided for item ${index + 1}`);
              return { success: true, itemId: record.id };
            }
          } catch (error) {
            console.error(`❌ Item ${index + 1} image processing error:`, error);
            throw error;
          }
        };
        
        // 병렬 처리 실행 (최대 5개씩 동시 처리)
        const batchSize = 5;
        const results = [];
        
        for (let i = 0; i < imageItemsWithRecords.length; i += batchSize) {
          const batch = imageItemsWithRecords.slice(i, i + batchSize);
          
          try {
            const batchResults = await Promise.allSettled(
              batch.map(processImageItem)
            );
            
            results.push(...batchResults);
            
            // 진행률 업데이트
            const completedBatches = Math.min(i + batchSize, imageItemsWithRecords.length);
            const progress = 40 + Math.floor((completedBatches / imageItemsWithRecords.length) * 50);
            onProgress?.(progress, `이미지 업로드 중... (${completedBatches}/${imageItemsWithRecords.length})`);
            
          } catch (batchError) {
            console.error(`❌ Batch ${i / batchSize + 1} processing error:`, batchError);
            // 개별 배치 실패는 전체 프로세스를 중단하지 않음
          }
        }
        
        // 결과 로깅
        const successCount = results.filter(r => r.status === 'fulfilled').length;
        const failedCount = results.filter(r => r.status === 'rejected').length;
        
        console.log(`✅ Image processing completed: ${successCount} successful, ${failedCount} failed`);
        
        if (failedCount > 0) {
          console.warn(`⚠️ ${failedCount} images failed to process, but continuing with successful ones`);
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
      error: (error as Error).message || '월드컵 저장 중 오류가 발생했습니다.'
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
      error: (error as Error).message || '백업 중 오류가 발생했습니다.'
    };
  }
}

// 기존 월드컵 업데이트 (이미지 변경 포함)
export async function updateWorldCupInSupabase(worldcupId: string, worldCupData: any, user?: any) {
  try {
    console.log('🔄 Starting updateWorldCupInSupabase:', {
      worldcupId,
      hasUser: !!user,
      userId: user?.id,
      totalItems: (worldCupData.items?.length || 0) + (worldCupData.videoItems?.length || 0),
      imageItems: worldCupData.items?.length || 0,
      videoItems: worldCupData.videoItems?.length || 0,
      title: worldCupData.title
    });
    
    // 사용자 확인 - 파라미터로 전달받거나 새로 가져오기
    let currentUser = user;
    if (!currentUser) {
      console.log('👤 Getting user authentication...');
      const { data: { user: authUser }, error: userError } = await supabase.auth.getUser();
      if (userError || !authUser) {
        console.error('❌ User authentication failed:', userError);
        throw new Error('로그인이 필요합니다.');
      }
      currentUser = authUser;
    }
    console.log('✅ User authenticated:', currentUser.id);

    // 1. 월드컵 기본 정보 업데이트
    console.log('📝 Updating worldcup basic info...');
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
      console.error('❌ WorldCup update error:', worldCupError);
      throw new Error(`월드컵 업데이트 실패: ${worldCupError.message}`);
    }

    console.log('✅ WorldCup basic info updated');

    // 2. 썸네일 업데이트 (변경된 경우)
    console.log('🖼️ Processing thumbnail...', {
      hasThumbnail: !!worldCupData.thumbnail,
      thumbnailType: typeof worldCupData.thumbnail
    });
    
    if (worldCupData.thumbnail) {
      try {
        let thumbnailFile: File | null = null;
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
        } else if (typeof worldCupData.thumbnail === 'string' && worldCupData.thumbnail.startsWith('http')) {
          // 기존 Supabase URL인 경우 - 변경되지 않았으면 재업로드 하지 않음
          if (worldCupData.thumbnail.includes('supabase.co/storage')) {
            console.log('📎 Thumbnail: Using existing Supabase URL (no re-upload needed)');
            await supabase
              .from('worldcups')
              .update({ thumbnail_url: worldCupData.thumbnail })
              .eq('id', worldcupId);
            needsThumbnailUpload = false;
          } else {
            // 외부 URL인 경우만 다시 업로드
            try {
              console.log('🔄 Thumbnail: Re-uploading external URL image');
              const response = await fetch(worldCupData.thumbnail);
              const blob = await response.blob();
              thumbnailFile = new File([blob], 'thumbnail.jpg', { type: blob.type || 'image/jpeg' });
              needsThumbnailUpload = true;
            } catch (error) {
              console.warn('⚠️ Thumbnail: Failed to fetch external image, using existing URL:', error);
              await supabase
                .from('worldcups')
                .update({ thumbnail_url: worldCupData.thumbnail })
                .eq('id', worldcupId);
              needsThumbnailUpload = false;
            }
          }
        } else if (typeof worldCupData.thumbnail === 'string' && worldCupData.thumbnail.startsWith('blob:')) {
          // Blob URL인 경우만 업로드
          try {
            console.log('🔄 Thumbnail: Converting blob URL to file');
            const response = await fetch(worldCupData.thumbnail);
            const blob = await response.blob();
            thumbnailFile = new File([blob], 'thumbnail.jpg', { type: blob.type || 'image/jpeg' });
            needsThumbnailUpload = true;
          } catch (error) {
            console.warn('⚠️ Thumbnail: Failed to fetch blob URL:', error);
            needsThumbnailUpload = false;
          }
        } else {
          console.log('ℹ️ Thumbnail: Unknown format, skipping...');
          needsThumbnailUpload = false;
        }
        
        if (needsThumbnailUpload && thumbnailFile) {
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

    // 3. 월드컵 아이템들 스마트 업데이트 (비디오 메타데이터만 수정하는 경우 최적화)
    console.log('📋 Processing media items...');
    const allMediaItems = [
      ...(worldCupData.items || []).map((item: any) => ({ ...item, mediaType: 'image' })),
      ...(worldCupData.videoItems || []).map((item: any) => ({ ...item, mediaType: 'video' }))
    ];

    console.log('📊 Media items prepared:', {
      totalItems: allMediaItems.length,
      imageItems: (worldCupData.items || []).length,
      videoItems: (worldCupData.videoItems || []).length,
      firstItemSample: allMediaItems[0] ? {
        title: allMediaItems[0].title,
        mediaType: allMediaItems[0].mediaType
      } : null
    });

    if (allMediaItems.length > 0) {
      try {
        console.log('🔄 STEP 3: Processing media items...');
        
        // 기존 아이템들 가져오기 (스마트 업데이트를 위해)
        console.log('📋 STEP 3a: Getting existing items...');
        const { data: existingItems, error: fetchError } = await supabase
          .from('worldcup_items')
          .select('*')
          .eq('worldcup_id', worldcupId)
          .order('order_index');

        if (fetchError) {
          console.error('❌ STEP 3a FAILED: Fetch existing items error:', fetchError);
          throw new Error(`기존 아이템 조회 실패: ${fetchError.message}`);
        }

        console.log('✅ STEP 3a SUCCESS: Got existing items:', existingItems?.length || 0);

        // 비디오 메타데이터만 업데이트하는 경우 최적화
        const videoOnlyUpdate = allMediaItems.length === existingItems?.length && 
          allMediaItems.every((item, index) => {
            const existing = existingItems?.[index];
            const titleMatch = existing?.title === item.title;
            const mediaTypeMatch = existing?.media_type === item.mediaType;
            const imageMatch = item.mediaType === 'image' ? existing?.image_url === (item.image || item.src) : true;
            
            return existing && titleMatch && mediaTypeMatch && imageMatch;
          });

        if (videoOnlyUpdate) {
          console.log('⚡ STEP 3b: Optimized video metadata update with batching...');
          
          // 비디오 아이템들만 배치 업데이트
          const videoItemsToUpdate = allMediaItems
            .filter(item => item.mediaType === 'video')
            .map((item: any) => {
              const existingItem = existingItems?.find(existing => existing.title === item.title);
              if (existingItem) {
                return {
                  id: existingItem.id,
                  title: item.title,
                  data: {
                    video_url: item.videoUrl,
                    video_start_time: item.videoStartTime || 0,
                    video_end_time: item.videoEndTime || null,
                    video_metadata: item.videoMetadata ? JSON.stringify(item.videoMetadata) : null
                  }
                };
              }
              return null;
            })
            .filter(Boolean);

          console.log(`📊 Found ${videoItemsToUpdate.length} video items to update`);
          
          // 배치 처리로 타임아웃 방지
          const batchSize = 5; // 한 번에 5개씩 처리
          for (let i = 0; i < videoItemsToUpdate.length; i += batchSize) {
            const batch = videoItemsToUpdate.slice(i, i + batchSize);
            console.log(`🔄 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(videoItemsToUpdate.length / batchSize)}`);
            
            const updatePromises = batch.map(item => 
              supabase.from('worldcup_items').update(item!.data).eq('id', item!.id)
            );
            
            await Promise.all(updatePromises);
            console.log(`✅ Batch ${Math.floor(i / batchSize) + 1} completed`);
          }
          
          console.log('✅ STEP 3b SUCCESS: Video metadata updated quickly with batching');
          
          // 최적화된 업데이트 완료 - 더 이상 진행하지 않음
          console.log('🎉 Update completed successfully with optimization!');
          return {
            success: true,
            message: '월드컵이 성공적으로 업데이트되었습니다!'
          };
        } else {
          // 전체 재생성 (기존 로직)
          console.log('🗑️ STEP 3b: Full recreation - Deleting old items...');
          const { error: deleteError } = await supabase
            .from('worldcup_items')
            .delete()
            .eq('worldcup_id', worldcupId);

          if (deleteError) {
            console.error('❌ STEP 3b FAILED: Delete old items error:', deleteError);
            throw new Error(`기존 아이템 삭제 실패: ${deleteError.message}`);
          } else {
            console.log('✅ STEP 3b SUCCESS: Old items deleted successfully');
          }

          // 새 아이템들 생성 (이미지 + 동영상) - 전체 재생성 경로에서만 실행
          console.log('🔄 STEP 3c: Creating new items...', { count: allMediaItems.length });
          const itemInserts = allMediaItems.map((item: any, index: number) => {
            const baseInsert = {
              worldcup_id: worldcupId,
              title: item.title,
              description: item.description || '',
              order_index: index,
              media_type: item.mediaType || 'image'
            };

            if (item.mediaType === 'video') {
              // 동영상 아이템 - 필수 필드 검증
              console.log(`📹 Processing video item ${index + 1}:`, {
                title: item.title,
                videoId: item.videoId,
                videoUrl: item.videoUrl,
                hasThumbnail: !!item.videoThumbnail
              });
              
              // JSON 직렬화 안전성 확보 - 더 robust한 처리
              let safeMetadata = null;
              try {
                if (item.videoMetadata) {
                  if (typeof item.videoMetadata === 'object') {
                    // 객체인 경우 JSON 문자열로 변환
                    safeMetadata = JSON.stringify(item.videoMetadata);
                  } else if (typeof item.videoMetadata === 'string') {
                    // 이미 문자열인 경우 그대로 사용 (JSON 파싱 체크)
                    try {
                      JSON.parse(item.videoMetadata); // 유효한 JSON인지 확인
                      safeMetadata = item.videoMetadata;
                    } catch {
                      // 유효하지 않은 JSON이면 그냥 문자열로 처리
                      safeMetadata = JSON.stringify({ raw: item.videoMetadata });
                    }
                  } else {
                    // 다른 타입이면 문자열로 변환
                    safeMetadata = JSON.stringify({ value: item.videoMetadata });
                  }
                }
              } catch (error) {
                console.warn('⚠️ Video metadata serialization failed:', error);
                safeMetadata = null;
              }

              const videoInsert = {
                ...baseInsert,
                image_url: item.videoThumbnail || '', // 썸네일을 image_url로 저장
                video_url: item.videoUrl || '',
                video_id: item.videoId || '',
                video_start_time: item.videoStartTime || 0,
                video_end_time: item.videoEndTime || null,
                video_thumbnail: item.videoThumbnail || '',
                video_duration: item.videoDuration || null,
                video_metadata: safeMetadata
              };

              console.log(`📹 Video item ${index + 1} insert data:`, videoInsert);
              return videoInsert;
            } else {
              // 이미지 아이템
              return {
                ...baseInsert,
                image_url: '' // 이미지 업로드 후 업데이트
              };
            }
          });

          console.log('🔄 STEP 3c: Inserting items to database...', { 
            itemsToInsert: itemInserts.length,
            sampleInsert: itemInserts[0],
            allInserts: itemInserts.map((insert, idx) => ({
              index: idx,
              mediaType: insert.media_type,
              title: insert.title,
              hasVideoId: !!insert.video_id,
              hasVideoUrl: !!insert.video_url,
              hasImageUrl: !!insert.image_url,
              videoMetadataType: typeof insert.video_metadata
            }))
          });
          
          const { data: items, error: itemsError } = await supabase
            .from('worldcup_items')
            .insert(itemInserts)
            .select();

          if (itemsError) {
            console.error('❌ Items creation error:', {
              error: itemsError,
              message: itemsError.message,
              details: itemsError.details,
              hint: itemsError.hint,
              code: itemsError.code,
              insertsData: itemInserts
            });
            throw new Error(`아이템 생성 실패: ${itemsError.message} (Code: ${itemsError.code})`);
          }

          console.log(`✅ STEP 3c SUCCESS: ${items.length} items created successfully`);

          // 4. 이미지 아이템들만 업로드 (동영상은 이미 썸네일이 설정됨)
          const imageItems = allMediaItems.filter(item => item.mediaType === 'image');
          
          console.log(`🖼️ Processing images for upload: ${imageItems.length} image items found`);
          
          if (imageItems.length > 0) {
            console.log('📤 Starting parallel image upload process...');
            
            // 이미지 아이템들만 추출하여 병렬 처리
            const imageItemsWithRecords = allMediaItems
              .map((item, index) => ({ item, record: items[index], index }))
              .filter(({ item }) => item.mediaType === 'image');
          
          // 병렬 처리 함수
          const processImageItem = async ({ item, record, index }: { item: any; record: any; index: number }) => {
            try {
              console.log(`🖼️ Processing image item ${index + 1}/${allMediaItems.length}: ${item.title}`);
              
              if (!item.image) {
                console.warn(`⚠️ Item ${index + 1}: No image provided`);
                return { success: true, itemId: record.id };
              }

              let imageFile: File | null = null;
              let needsUpload = false;
              
              if (item.image instanceof File) {
                imageFile = item.image;
                needsUpload = true;
                console.log(`📁 Item ${index + 1}: New File uploaded`);
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
                
                imageFile = new File([u8arr], `item_${index + 1}.jpg`, { type: mime });
                needsUpload = true;
                console.log(`🖼️ Item ${index + 1}: Base64 image converted to File`);
              } else if (typeof item.image === 'string' && item.image.startsWith('http')) {
                // 기존 Supabase URL인 경우 - 변경되지 않았으면 재업로드 하지 않음
                if (item.image.includes('supabase.co/storage')) {
                  console.log(`📎 Item ${index + 1}: Using existing Supabase URL (no re-upload needed)`);
                  await supabase
                    .from('worldcup_items')
                    .update({ image_url: item.image })
                    .eq('id', record.id);
                  return { success: true, itemId: record.id };
                } else {
                  // 외부 URL인 경우만 다시 업로드
                  try {
                    console.log(`🔄 Item ${index + 1}: Re-uploading external URL image`);
                    const response = await fetch(item.image);
                    const blob = await response.blob();
                    imageFile = new File([blob], `item_${index + 1}.jpg`, { type: blob.type || 'image/jpeg' });
                    needsUpload = true;
                  } catch (error) {
                    console.warn(`⚠️ Item ${index + 1}: Failed to fetch external image, using original URL:`, error);
                    await supabase
                      .from('worldcup_items')
                      .update({ image_url: item.image })
                      .eq('id', record.id);
                    return { success: true, itemId: record.id };
                  }
                }
              } else if (typeof item.image === 'string' && item.image.startsWith('blob:')) {
                // Blob URL인 경우만 업로드
                try {
                  console.log(`🔄 Item ${index + 1}: Converting blob URL to file`);
                  const response = await fetch(item.image);
                  const blob = await response.blob();
                  imageFile = new File([blob], `item_${index + 1}.jpg`, { type: blob.type || 'image/jpeg' });
                  needsUpload = true;
                } catch (error) {
                  console.warn(`⚠️ Item ${index + 1}: Failed to fetch blob URL:`, error);
                  return { success: false, itemId: record.id, error: (error as Error).message };
                }
              } else {
                console.warn(`❓ Item ${index + 1}: Unknown image format, skipping...`);
                return { success: false, itemId: record.id, error: 'Unknown image format' };
              }
              
              if (needsUpload && imageFile) {
                const imageResult = await uploadWorldCupItemImage(imageFile, worldcupId, record.id);
                if (imageResult.success) {
                  await supabase
                    .from('worldcup_items')
                    .update({ image_url: imageResult.url })
                    .eq('id', record.id);
                  console.log(`✅ Item ${index + 1} image uploaded: ${imageResult.url}`);
                  return { success: true, itemId: record.id };
                } else {
                  console.error(`❌ Item ${index + 1} upload failed:`, imageResult.error);
                  return { success: false, itemId: record.id, error: imageResult.error };
                }
              }
              
              return { success: true, itemId: record.id };
            } catch (error) {
              console.error(`❌ Item ${index + 1} processing failed:`, error);
              return { success: false, itemId: record.id, error: (error as Error).message };
            }
          };
          
          // 병렬 처리 실행 (최대 3개씩 동시 처리로 제한)
          const batchSize = 3;
          const results = [];
          
          for (let i = 0; i < imageItemsWithRecords.length; i += batchSize) {
            const batch = imageItemsWithRecords.slice(i, i + batchSize);
            
            try {
              const batchResults = await Promise.allSettled(
                batch.map(processImageItem)
              );
              
              results.push(...batchResults);
              
              console.log(`🔄 Batch ${Math.floor(i / batchSize) + 1} completed (${Math.min(i + batchSize, imageItemsWithRecords.length)}/${imageItemsWithRecords.length})`);
              
            } catch (batchError) {
              console.error(`❌ Batch ${Math.floor(i / batchSize) + 1} processing error:`, batchError);
            }
          }
          
          // 결과 로깅
          const successCount = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
          const failedCount = results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success)).length;
          
          console.log(`✅ Image processing completed: ${successCount} successful, ${failedCount} failed`);
          
          if (failedCount > 0) {
            console.warn(`⚠️ ${failedCount} images failed to process, but continuing with successful ones`);
          }
          } else {
            console.log('🎬 No image items to upload - all items are videos with metadata only');
          }
        }
        
        } catch (error) {
          console.error('❌ Items update failed:', error);
          throw error;
        }
    } else {
      console.log('📭 No media items to process');
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
      error: (error as Error).message || '월드컵 업데이트 중 오류가 발생했습니다.'
    };
  }
}