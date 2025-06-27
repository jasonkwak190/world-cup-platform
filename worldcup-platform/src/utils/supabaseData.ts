// Supabase에서 데이터를 가져오는 유틸리티 함수들
import { supabase } from '@/lib/supabase';
import type { SupabaseWorldCup, SupabaseWorldCupItem, SupabaseUser } from '@/types/supabase';

// 월드컵 목록 가져오기 (RLS 정책 사용) - 성능 최적화
export async function getWorldCups() {
  try {
    console.log('🔍 Fetching worldcups from Supabase...');
    
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
        is_public,
        author:users(username),
        worldcup_items(id, title, image_url, description)
      `)
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(50); // 한 번에 최대 50개만 로드

    if (error) {
      console.error('Error fetching worldcups:', error);
      return [];
    }

    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ Found ${data.length} worldcups:`, data.map(w => w.title));
    }

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

      if (process.env.NODE_ENV === 'development') {
        console.log('🖼️ Processing thumbnail:', {
          id: worldcup.id,
          title: worldcup.title,
          originalUrl: worldcup.thumbnail_url,
          processedUrl: thumbnailUrl.substring(0, 100) + (thumbnailUrl.length > 100 ? '...' : ''),
          thumbnailValid: !!thumbnailUrl && thumbnailUrl !== '/placeholder.svg'
        });
      }

      return {
        id: worldcup.id,
        title: worldcup.title,
        description: worldcup.description || '',
        thumbnail: thumbnailUrl,
        author: worldcup.author?.username || 'Unknown',
        createdAt: new Date(worldcup.created_at).toISOString().split('T')[0],
        participants: worldcup.participants,
        comments: worldcup.comments,
        likes: worldcup.likes,
        category: worldcup.category,
        isPublic: worldcup.is_public,
        items: worldcup.worldcup_items?.map((item: any) => {
          let imageUrl = null;
          
          if (item.image_url) {
            // 이미 완전한 URL인 경우 그대로 사용
            if (item.image_url.startsWith('http')) {
              imageUrl = item.image_url;
            } else {
              // 상대 경로인 경우에만 Supabase URL 생성
              imageUrl = getSupabaseImageUrl(item.image_url, 'worldcup-images');
            }
          }

          return {
            id: item.id,
            title: item.title,
            image: imageUrl,
            description: item.description
          };
        }) || []
      };
    });

  } catch (error) {
    console.error('Error in getWorldCups:', error);
    return [];
  }
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
  try {
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
      console.error('Error fetching worldcup:', error);
      return null;
    }

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
    return {
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
      items: data.worldcup_items?.map((item: any) => {
        const imageUrl = item.image_url ? 
          getSupabaseImageUrl(item.image_url, 'worldcup-images') : 
          null;

        return {
          id: item.id,
          title: item.title,
          image: imageUrl,
          description: item.description
        };
      }) || []
    };

  } catch (error) {
    console.error('Error in getWorldCupById:', error);
    return null;
  }
}

// 사용자별 월드컵 가져오기
export async function getUserWorldCups(userId: string) {
  try {
    const { data, error } = await supabase
      .from('worldcups')
      .select(`
        *,
        author:users(id, username, profile_image_url),
        worldcup_items(id, title, image_url, description, order_index)
      `)
      .eq('author_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user worldcups:', error);
      return [];
    }

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
        author: worldcup.author?.username || 'Unknown',
        createdAt: new Date(worldcup.created_at).toISOString().split('T')[0],
        participants: worldcup.participants,
        comments: worldcup.comments,
        likes: worldcup.likes,
        category: worldcup.category,
        isPublic: worldcup.is_public,
        items: worldcup.worldcup_items?.map((item: any) => {
          let imageUrl = null;
          
          if (item.image_url) {
            // 이미 완전한 URL인 경우 그대로 사용
            if (item.image_url.startsWith('http')) {
              imageUrl = item.image_url;
            } else {
              // 상대 경로인 경우에만 Supabase URL 생성
              imageUrl = getSupabaseImageUrl(item.image_url, 'worldcup-images');
            }
          }

          return {
            id: item.id,
            title: item.title,
            image: imageUrl,
            description: item.description
          };
        }) || []
      };
    });

  } catch (error) {
    console.error('Error in getUserWorldCups:', error);
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

// 월드컵 삭제
export async function deleteWorldCup(id: string) {
  try {
    const { error } = await supabase
      .from('worldcups')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting worldcup:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteWorldCup:', error);
    return false;
  }
}