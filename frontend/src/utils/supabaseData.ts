// Supabase에서 데이터를 가져오는 유틸리티 함수들
import { supabase } from '@/lib/supabase';
import type { SupabaseWorldCup, SupabaseWorldCupItem, SupabaseUser } from '@/types/supabase';
import { withRetry } from './supabaseConnection';
import { cache } from './cache';

// 월드컵 목록 가져오기 (RLS 정책 사용) - 성능 최적화 및 재시도 로직
export async function getWorldCups() {
  const cacheKey = 'worldcups_list';
  
  // 캐시에서 먼저 확인 (2분 캐시)
  const cachedData = cache.get(cacheKey);
  if (cachedData) {
    console.log('✅ Using cached worldcups data');
    return cachedData;
  }
  
  const startTime = Date.now();
  
  return withRetry(async () => {
    console.log('🔍 Fetching worldcups from Supabase...');
    
    // 타임아웃 설정 (15초로 증가)
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Supabase request timeout after 15000ms')), 15000);
    });
    
    // 단계별 로딩으로 성능 개선
    const dataPromise = supabase
      .from('worldcups')
      .select(`
        id,
        title,
        description,
        thumbnail_url,
        created_at,
        participants,
        comments,
        likes,
        category,
        is_public,
        author_id
      `)
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(12); // 로딩 시간 단축을 위해 12개로 제한

    const { data, error } = await Promise.race([dataPromise, timeoutPromise]) as any;

    const elapsed = Date.now() - startTime;
    console.log(`⏱️ Supabase query took ${elapsed}ms`);

    if (error) {
      console.error('❌ Error fetching worldcups:', error);
      throw error; // withRetry가 처리하도록 에러를 던짐
    }

    if (!data || data.length === 0) {
      console.log('📭 No worldcups found in Supabase');
      return [];
    }

    console.log(`✅ Found ${data.length} worldcups`);

    // 사용자 정보만 가져오기 (아이템 로딩 제거로 성능 향상)
    const authorIds = [...new Set(data.map(w => w.author_id).filter(Boolean))];

    const authorsData = await supabase
      .from('users')
      .select('id, username')
      .in('id', authorIds);

    // 사용자 맵 생성
    const authorsMap = new Map();
    if (authorsData.data) {
      authorsData.data.forEach(author => {
        authorsMap.set(author.id, author.username);
      });
    }

    // localStorage 형식으로 변환
    const result = data.map(worldcup => {
      // 썸네일 URL 처리 - 이미 완전한 URL인지 확인
      let thumbnailUrl = '/placeholder.svg';
      
      if (worldcup.thumbnail_url) {
        // 이미 완전한 URL인 경우 그대로 사용
        if (worldcup.thumbnail_url.startsWith('http')) {
          thumbnailUrl = worldcup.thumbnail_url;
        } else {
          // 상대 경로인 경우에만 Supabase URL 생성
          thumbnailUrl = getSupabaseImageUrl(worldcup.thumbnail_url, 'worldcup-thumbnails');
        }
      }

      return {
        id: worldcup.id,
        title: worldcup.title,
        description: worldcup.description || '',
        thumbnail: thumbnailUrl,
        author: authorsMap.get(worldcup.author_id) || 'Unknown',
        createdAt: new Date(worldcup.created_at).toISOString().split('T')[0],
        participants: worldcup.participants || 0,
        comments: worldcup.comments || 0,
        likes: worldcup.likes || 0,
        category: worldcup.category || 'entertainment',
        isPublic: worldcup.is_public,
        items: [] // 아이템은 플레이할 때만 로드
      };
    });
    
    // 결과를 캐시에 저장 (2분 캐시)
    cache.set(cacheKey, result, 2 * 60 * 1000);
    
    return result;
  }, 'Load worldcups from Supabase').catch(error => {
    console.error('Error in getWorldCups after retries:', error);
    return [];
  });
}

// Supabase Storage URL 생성 헬퍼 함수
function getSupabaseImageUrl(path: string, bucket: string): string {
  if (!path) return '';
  
  // 이미 전체 URL인 경우 그대로 반환
  if (path.startsWith('http')) {
    return path;
  }
  
  // 경로가 UUID로 시작하는 경우 (폴더 구조)
  if (path.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/)) {
    // 이미 올바른 형태인 경우
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);
    return publicUrl;
  }
  
  // 단순 파일명인 경우 UUID 폴더 경로 생성 시도
  if (path === 'thumbnail.webp' || path === 'thumbnail.jpg') {
    console.warn('⚠️ Path without folder detected:', path);
    return '';
  }
  
  // Storage에서 public URL 생성
  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);
  
  if (process.env.NODE_ENV === 'development') {
    console.log('🔗 Generated Supabase URL:', {
      originalPath: path,
      bucket: bucket,
      publicUrl: publicUrl
    });
  }
  
  return publicUrl;
}

// 특정 월드컵 가져오기
export async function getWorldCupById(id: string) {
  return withRetry(async () => {
    console.log('🔍 getWorldCupById called with ID:', id);
    
    const { data, error } = await supabase
      .from('worldcups')
      .select(`
        *,
        author:users(id, username, profile_image_url),
        worldcup_items(id, title, image_url, description, order_index)
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('❌ Error fetching worldcup:', error);
      throw error; // withRetry가 처리하도록 에러를 던짐
    }

    console.log('📊 Raw worldcup data from Supabase:', {
      id: data.id,
      title: data.title,
      hasItems: !!data.worldcup_items,
      itemsCount: data.worldcup_items?.length || 0,
      firstItemSample: data.worldcup_items?.[0] ? {
        id: data.worldcup_items[0].id,
        title: data.worldcup_items[0].title,
        hasImage: !!data.worldcup_items[0].image_url
      } : null
    });

    // 썸네일 URL 처리 - 이미 완전한 URL인지 확인
    let thumbnailUrl = '/placeholder.svg';
    
    if (data.thumbnail_url) {
      // 이미 완전한 URL인 경우 그대로 사용
      if (data.thumbnail_url.startsWith('http')) {
        thumbnailUrl = data.thumbnail_url;
      } else {
        // 상대 경로인 경우에만 Supabase URL 생성
        thumbnailUrl = getSupabaseImageUrl(data.thumbnail_url, 'worldcup-thumbnails');
      }
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('🖼️ Processing single worldcup:', {
        id: data.id,
        title: data.title,
        originalUrl: data.thumbnail_url,
        processedUrl: thumbnailUrl.substring(0, 100) + (thumbnailUrl.length > 100 ? '...' : ''),
        thumbnailValid: !!thumbnailUrl && thumbnailUrl !== '/placeholder.svg',
        itemsCount: data.worldcup_items?.length || 0
      });
    }

    // localStorage 형식으로 변환
    const processedItems = data.worldcup_items?.map((item: any) => {
      let imageUrl = item.image_url ? 
        getSupabaseImageUrl(item.image_url, 'worldcup-images') : 
        null;

      // 🚨 FIX: Clean up any corrupted localhost URLs that might be in the database
      if (imageUrl && typeof imageUrl === 'string' && imageUrl.includes('localhost:3000')) {
        console.error('❌ Found corrupted localhost URL in database:', imageUrl);
        
        // Try to extract the actual path and reconstruct proper Supabase URL
        const pathMatch = imageUrl.match(/([0-9a-f-]+\/items\/[^\/]+\.(gif|jpg|jpeg|png|webp))$/i);
        if (pathMatch) {
          const path = pathMatch[1];
          imageUrl = `https://rctoxfcyzz5iikopbsne.supabase.co/storage/v1/object/public/worldcup-images/${path}`;
          console.log('✅ Fixed corrupted URL to:', imageUrl);
        } else {
          console.warn('⚠️ Could not fix corrupted localhost URL, setting to null');
          imageUrl = null;
        }
      }

      return {
        id: item.id,
        title: item.title,
        image: imageUrl,
        description: item.description || ''
      };
    }) || [];

    console.log('🔄 Processed worldcup items:', {
      originalCount: data.worldcup_items?.length || 0,
      processedCount: processedItems.length,
      firstProcessedItem: processedItems[0] ? {
        id: processedItems[0].id,
        title: processedItems[0].title,
        hasImage: !!processedItems[0].image
      } : null
    });

    const result = {
      id: data.id,
      title: data.title,
      description: data.description || '',
      thumbnail: thumbnailUrl,
      author: data.author?.username || 'Unknown',
      createdAt: new Date(data.created_at).toISOString().split('T')[0],
      participants: data.participants,
      comments: data.comments,
      likes: data.likes,
      category: data.category,
      isPublic: data.is_public,
      items: processedItems
    };

    console.log('✅ Final worldcup result:', {
      id: result.id,
      title: result.title,
      itemsCount: result.items.length
    });

    return result;
  }, `Get worldcup by ID: ${id}`).catch(error => {
    console.error('Error in getWorldCupById after retries:', error);
    return null;
  });
}

// 사용자별 월드컵 가져오기
export async function getUserWorldCups(userId: string) {
  try {
    console.log('🔍 getUserWorldCups called for user:', userId);
    
    if (!userId) {
      console.log('❌ No userId provided');
      return [];
    }

    // 먼저 월드컵 기본 정보만 가져오기 (성능 최적화)
    const { data, error } = await supabase
      .from('worldcups')
      .select(`
        id,
        title,
        description,
        thumbnail_url,
        created_at,
        participants,
        comments,
        likes,
        category,
        is_public
      `)
      .eq('author_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching user worldcups:', error);
      return [];
    }

    if (!data || data.length === 0) {
      console.log('📭 No worldcups found for user');
      return [];
    }

    console.log(`✅ Found ${data.length} worldcups for user`);

    // 각 월드컵에 대해 아이템 개수만 가져오기 (빠른 로딩을 위해)
    const worldcupIds = data.map(w => w.id);
    const { data: itemCounts } = await supabase
      .from('worldcup_items')
      .select('worldcup_id')
      .in('worldcup_id', worldcupIds);

    // 아이템 개수 맵 생성
    const itemCountMap = new Map();
    itemCounts?.forEach(item => {
      const current = itemCountMap.get(item.worldcup_id) || 0;
      itemCountMap.set(item.worldcup_id, current + 1);
    });

    // localStorage 형식으로 변환
    return data.map(worldcup => {
      // 썸네일 URL 처리 - 이미 완전한 URL인지 확인
      let thumbnailUrl = '/placeholder.svg';
      
      if (worldcup.thumbnail_url) {
        // 이미 완전한 URL인 경우 그대로 사용
        if (worldcup.thumbnail_url.startsWith('http')) {
          thumbnailUrl = worldcup.thumbnail_url;
        } else {
          // 상대 경로인 경우에만 Supabase URL 생성
          thumbnailUrl = getSupabaseImageUrl(worldcup.thumbnail_url, 'worldcup-thumbnails');
        }
      }

      return {
        id: worldcup.id,
        title: worldcup.title,
        description: worldcup.description || '',
        thumbnail: thumbnailUrl,
        author: 'You', // 사용자 자신의 월드컵이므로 'You'로 표시
        createdAt: new Date(worldcup.created_at).toISOString().split('T')[0],
        participants: worldcup.participants,
        comments: worldcup.comments,
        likes: worldcup.likes,
        category: worldcup.category,
        isPublic: worldcup.is_public,
        items: Array(itemCountMap.get(worldcup.id) || 0).fill(null).map((_, index) => ({
          id: `placeholder-${index}`,
          title: `Item ${index + 1}`,
          image: null,
          description: ''
        })) // 실제 아이템은 필요할 때만 로드
      };
    });

  } catch (error) {
    console.error('❌ Error in getUserWorldCups:', error);
    return [];
  }
}

// 월드컵 통계 업데이트
export async function updateWorldCupStats(id: string, stats: { participants?: number; likes?: number; comments?: number }) {
  try {
    const { error } = await supabase
      .from('worldcups')
      .update(stats)
      .eq('id', id);

    if (error) {
      console.error('Error updating worldcup stats:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in updateWorldCupStats:', error);
    return false;
  }
}

// 🗑️ 강화된 월드컵 완전 삭제 함수
export async function deleteWorldCup(id: string) {
  try {
    console.log('🗑️ Starting complete worldcup deletion:', id);
    
    // 1. 먼저 월드컵 데이터 조회하여 존재 여부 확인
    const { data: worldcup, error: fetchError } = await supabase
      .from('worldcups')
      .select('id, title, thumbnail_url')
      .eq('id', id)
      .single();

    if (fetchError || !worldcup) {
      console.error('❌ Worldcup not found:', fetchError);
      return false;
    }

    console.log('📋 Found worldcup to delete:', {
      id: worldcup.id,
      title: worldcup.title,
      hasThumbnail: !!worldcup.thumbnail_url
    });

    // 2. 아이템들과 연결된 이미지 URL들 조회
    const { data: items, error: itemsError } = await supabase
      .from('worldcup_items')
      .select('id, title, image_url')
      .eq('worldcup_id', id);

    if (itemsError) {
      console.warn('⚠️ Error fetching items for deletion:', itemsError);
    } else {
      console.log(`📊 Found ${items?.length || 0} items to delete`);
    }

    // 3. Storage에서 관련 파일들 완전 삭제
    let storageDeleteCount = 0;
    
    try {
      // 썸네일 삭제 (모든 가능한 확장자 시도)
      const thumbnailExtensions = ['webp', 'jpg', 'jpeg', 'png', 'gif'];
      console.log('🖼️ Deleting thumbnails...');
      
      for (const ext of thumbnailExtensions) {
        const { error } = await supabase.storage
          .from('worldcup-thumbnails')
          .remove([`${id}/thumbnail.${ext}`]);
        
        if (!error) {
          storageDeleteCount++;
          console.log(`✅ Deleted thumbnail: ${id}/thumbnail.${ext}`);
        }
      }
      
      // 아이템 이미지들 삭제 - 더 철저한 방식
      console.log('🗂️ Deleting item images...');
      
      // 1) Storage에서 파일 목록 가져오기
      const { data: files, error: listError } = await supabase.storage
        .from('worldcup-images')
        .list(`${id}/items`);

      if (listError) {
        console.warn('⚠️ Error listing files:', listError);
      } else if (files && files.length > 0) {
        console.log(`📁 Found ${files.length} files in storage`);
        
        const filePaths = files.map(file => `${id}/items/${file.name}`);
        const { data: deleteResult, error: deleteError } = await supabase.storage
          .from('worldcup-images')
          .remove(filePaths);
        
        if (deleteError) {
          console.error('❌ Storage deletion error:', deleteError);
        } else {
          storageDeleteCount += filePaths.length;
          console.log(`✅ Deleted ${filePaths.length} item images from storage`);
        }
      }
      
      // 2) DB에서 참조하는 이미지들도 개별적으로 삭제 시도
      if (items && items.length > 0) {
        for (const item of items) {
          if (item.image_url && item.image_url.includes('supabase')) {
            // Supabase URL에서 파일 경로 추출
            const pathMatch = item.image_url.match(/\/storage\/v1\/object\/public\/worldcup-images\/(.+)/);
            if (pathMatch) {
              const filePath = pathMatch[1];
              const { error } = await supabase.storage
                .from('worldcup-images')
                .remove([filePath]);
              
              if (!error) {
                console.log(`✅ Deleted individual file: ${filePath}`);
                storageDeleteCount++;
              }
            }
          }
        }
      }
      
      console.log(`✅ Storage cleanup completed. Total files deleted: ${storageDeleteCount}`);
    } catch (storageError) {
      console.error('❌ Storage cleanup failed:', storageError);
    }
    
    // 4. 데이터베이스에서 완전 삭제
    console.log('🗄️ Deleting from database...');
    
    // 먼저 월드컵 아이템들 삭제
    const { error: itemDeleteError } = await supabase
      .from('worldcup_items')
      .delete()
      .eq('worldcup_id', id);

    if (itemDeleteError) {
      console.error('❌ Error deleting worldcup items:', itemDeleteError);
    } else {
      console.log('✅ Worldcup items deleted from database');
    }

    // 월드컵 자체 삭제
    const { error: worldcupDeleteError } = await supabase
      .from('worldcups')
      .delete()
      .eq('id', id);

    if (worldcupDeleteError) {
      console.error('❌ Error deleting worldcup from database:', worldcupDeleteError);
      return false;
    }

    // 5. 삭제 검증
    console.log('🔍 Verifying deletion...');
    
    const { data: verifyWorldcup } = await supabase
      .from('worldcups')
      .select('id')
      .eq('id', id)
      .single();

    const { data: verifyItems } = await supabase
      .from('worldcup_items')
      .select('id')
      .eq('worldcup_id', id);

    if (verifyWorldcup) {
      console.error('❌ Worldcup still exists in database!');
      return false;
    }

    if (verifyItems && verifyItems.length > 0) {
      console.error('❌ Some items still exist in database!');
      return false;
    }

    console.log('🎉 Worldcup completely deleted and verified');
    console.log(`📊 Deletion summary: ${storageDeleteCount} storage files deleted`);
    
    return true;
  } catch (error) {
    console.error('❌ Critical error in deleteWorldCup:', error);
    return false;
  }
}