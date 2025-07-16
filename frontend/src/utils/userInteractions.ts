// 사용자 인터랙션 (북마크, 좋아요) 관리 유틸리티
import { supabase } from '@/lib/supabase';

// 북마크 관련 함수들
export async function getUserBookmarks(userId: string) {
  try {
    if (!userId) {
      console.log('👤 No userId provided for getUserBookmarks');
      return [];
    }

    const { data, error } = await supabase
      .from('user_interactions')
      .select('target_id')
      .eq('user_id', userId)
      .eq('target_type', 'worldcup')
      .eq('interaction_type', 'bookmark');

    if (error) {
      console.error('Error fetching bookmarks:', error);
      return [];
    }

    return data.map(item => item.target_id);
  } catch (error) {
    console.error('Error in getUserBookmarks:', error);
    return [];
  }
}

export async function addBookmark(userId: string, worldcupId: string) {
  try {
    console.log('🔖 addBookmark called with:', { userId, worldcupId });
    
    // Check if bookmark already exists
    const { data: existingBookmarks, error: checkError } = await supabase
      .from('user_interactions')
      .select('id')
      .eq('user_id', userId)
      .eq('target_type', 'worldcup')
      .eq('target_id', worldcupId)
      .eq('interaction_type', 'bookmark')
      .limit(1);

    if (checkError) {
      console.error('❌ Error checking existing bookmark:', checkError);
      return false;
    }

    if (existingBookmarks && existingBookmarks.length > 0) {
      console.warn('⚠️ Bookmark already exists');
      return false; // Already bookmarked
    }

    const { data, error } = await supabase
      .from('user_interactions')
      .insert({
        user_id: userId,
        target_type: 'worldcup',
        target_id: worldcupId,
        interaction_type: 'bookmark'
      })
      .select(); // Add select to see what was inserted

    if (error) {
      console.error('❌ Error adding bookmark:', {
        error,
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      return false;
    }

    console.log('✅ Bookmark added successfully:', data);
    return true;
  } catch (error) {
    console.error('❌ Error in addBookmark:', error);
    return false;
  }
}

export async function removeBookmark(userId: string, worldcupId: string) {
  try {
    console.log('🔖 removeBookmark called with:', { userId, worldcupId });
    
    // First check if bookmark exists
    const { data: existingBookmarks, error: checkError } = await supabase
      .from('user_interactions')
      .select('id')
      .eq('user_id', userId)
      .eq('target_type', 'worldcup')
      .eq('target_id', worldcupId)
      .eq('interaction_type', 'bookmark');

    if (checkError) {
      console.error('❌ Error checking existing bookmark:', checkError);
      return false;
    }

    console.log('🔖 Existing bookmarks found:', existingBookmarks?.length || 0);

    if (!existingBookmarks || existingBookmarks.length === 0) {
      console.warn('⚠️ No bookmark found to remove');
      return false; // No bookmark to remove
    }

    const { data, error } = await supabase
      .from('user_interactions')
      .delete()
      .eq('user_id', userId)
      .eq('target_type', 'worldcup')
      .eq('target_id', worldcupId)
      .eq('interaction_type', 'bookmark')
      .select(); // Add select to see what was deleted

    if (error) {
      console.error('❌ Error removing bookmark:', {
        error,
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      return false;
    }

    console.log('✅ Bookmark removed successfully:', data);
    return true;
  } catch (error) {
    console.error('❌ Error in removeBookmark:', error);
    return false;
  }
}

// 좋아요 관련 함수들 (회원용)
export async function getUserLikes(userId: string) {
  try {
    if (!userId) {
      console.log('👤 No userId provided for getUserLikes');
      return [];
    }

    const { data, error } = await supabase
      .from('user_interactions')
      .select('target_id')
      .eq('user_id', userId)
      .eq('target_type', 'worldcup')
      .eq('interaction_type', 'like');

    if (error) {
      console.error('Error fetching likes:', error);
      return [];
    }

    return data.map(item => item.target_id);
  } catch (error) {
    console.error('Error in getUserLikes:', error);
    return [];
  }
}

export async function addLike(userId: string, worldcupId: string) {
  try {
    console.log('🔄 Adding like:', { userId, worldcupId });
    
    if (!userId || !worldcupId) {
      console.error('❌ Missing required parameters:', { userId, worldcupId });
      return false;
    }

    // 중복 좋아요 확인 - .single() 대신 배열로 받아서 처리
    const { data: existingLikes, error: checkError } = await supabase
      .from('user_interactions')
      .select('id')
      .eq('user_id', userId)
      .eq('target_type', 'worldcup')
      .eq('target_id', worldcupId)
      .eq('interaction_type', 'like')
      .limit(1);

    if (checkError) {
      console.error('❌ Error checking existing like:', checkError);
      return false;
    }

    if (existingLikes && existingLikes.length > 0) {
      console.log('⚠️ User has already liked this worldcup');
      return false; // 이미 좋아요 했음
    }

    // 좋아요 추가 (트리거가 자동으로 worldcups.likes 증가)
    const { data, error } = await supabase
      .from('user_interactions')
      .insert({
        user_id: userId,
        target_type: 'worldcup',
        target_id: worldcupId,
        interaction_type: 'like'
      })
      .select();

    if (error) {
      console.error('❌ Supabase error adding like:', {
        error,
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      return false;
    }

    console.log('✅ Like added successfully (trigger will update worldcup likes):', data);
    return true;
  } catch (error) {
    console.error('❌ Unexpected error in addLike:', error);
    return false;
  }
}

export async function removeLike(userId: string, worldcupId: string) {
  try {
    console.log('🔄 Removing like:', { userId, worldcupId });
    
    if (!userId || !worldcupId) {
      console.error('❌ Missing required parameters:', { userId, worldcupId });
      return false;
    }

    // 좋아요 삭제 (트리거가 자동으로 worldcups.likes 감소)
    const { error } = await supabase
      .from('user_interactions')
      .delete()
      .eq('user_id', userId)
      .eq('target_type', 'worldcup')
      .eq('target_id', worldcupId)
      .eq('interaction_type', 'like');

    if (error) {
      console.error('❌ Error removing like:', error);
      return false;
    }

    console.log('✅ Like removed successfully (trigger will update worldcup likes)');
    return true;
  } catch (error) {
    console.error('❌ Error in removeLike:', error);
    return false;
  }
}

// 비회원 좋아요 관리 (localStorage 기반)
const GUEST_LIKES_KEY = 'guest_likes';

export function getGuestLikes(): string[] {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return [];
    }
    const stored = localStorage.getItem(GUEST_LIKES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error getting guest likes:', error);
    return [];
  }
}

export function addGuestLike(worldcupId: string): boolean {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return false;
    }
    const currentLikes = getGuestLikes();
    if (currentLikes.includes(worldcupId)) {
      return false; // 이미 좋아요한 경우
    }
    
    const newLikes = [...currentLikes, worldcupId];
    localStorage.setItem(GUEST_LIKES_KEY, JSON.stringify(newLikes));
    
    // 비회원 좋아요는 로컬스토리지에만 저장 (데이터베이스 트리거가 좋아요 수 관리)
    
    return true;
  } catch (error) {
    console.error('Error adding guest like:', error);
    return false;
  }
}

export function removeGuestLike(worldcupId: string): boolean {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return false;
    }
    const currentLikes = getGuestLikes();
    const newLikes = currentLikes.filter(id => id !== worldcupId);
    localStorage.setItem(GUEST_LIKES_KEY, JSON.stringify(newLikes));
    
    // 비회원 좋아요 취소는 로컬스토리지에서만 제거 (데이터베이스 트리거가 좋아요 수 관리)
    
    return true;
  } catch (error) {
    console.error('Error removing guest like:', error);
    return false;
  }
}

export function hasGuestLiked(worldcupId: string): boolean {
  return getGuestLikes().includes(worldcupId);
}

// 월드컵별 좋아요 수 가져오기
export async function getWorldCupLikesCount(worldcupId: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('user_interactions')
      .select('*', { count: 'exact', head: true })
      .eq('target_type', 'worldcup')
      .eq('target_id', worldcupId)
      .eq('interaction_type', 'like');

    if (error) {
      console.error('Error getting likes count:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('Error in getWorldCupLikesCount:', error);
    return 0;
  }
}

// 여러 월드컵의 좋아요 수를 한번에 가져오기
export async function getMultipleWorldCupLikesCount(worldcupIds: string[]): Promise<{ [key: string]: number }> {
  try {
    const { data, error } = await supabase
      .from('user_interactions')
      .select('target_id')
      .eq('target_type', 'worldcup')
      .eq('interaction_type', 'like')
      .in('target_id', worldcupIds);

    if (error) {
      console.error('Error getting multiple likes count:', error);
      return {};
    }

    // 월드컵별 좋아요 수 계산
    const counts: { [key: string]: number } = {};
    worldcupIds.forEach(id => {
      counts[id] = 0;
    });

    data.forEach(item => {
      counts[item.target_id] = (counts[item.target_id] || 0) + 1;
    });

    return counts;
  } catch (error) {
    console.error('Error in getMultipleWorldCupLikesCount:', error);
    return {};
  }
}