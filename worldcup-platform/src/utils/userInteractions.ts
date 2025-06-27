// 사용자 인터랙션 (북마크, 좋아요) 관리 유틸리티
import { supabase } from '@/lib/supabase';

// 북마크 관련 함수들
export async function getUserBookmarks(userId: string) {
  try {
    const { data, error } = await supabase
      .from('user_bookmarks')
      .select('worldcup_id')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching bookmarks:', error);
      return [];
    }

    return data.map(item => item.worldcup_id);
  } catch (error) {
    console.error('Error in getUserBookmarks:', error);
    return [];
  }
}

export async function addBookmark(userId: string, worldcupId: string) {
  try {
    const { error } = await supabase
      .from('user_bookmarks')
      .insert({
        user_id: userId,
        worldcup_id: worldcupId
      });

    if (error) {
      console.error('Error adding bookmark:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in addBookmark:', error);
    return false;
  }
}

export async function removeBookmark(userId: string, worldcupId: string) {
  try {
    const { error } = await supabase
      .from('user_bookmarks')
      .delete()
      .eq('user_id', userId)
      .eq('worldcup_id', worldcupId);

    if (error) {
      console.error('Error removing bookmark:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in removeBookmark:', error);
    return false;
  }
}

// 좋아요 관련 함수들 (회원용)
export async function getUserLikes(userId: string) {
  try {
    const { data, error } = await supabase
      .from('user_likes')
      .select('worldcup_id')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching likes:', error);
      return [];
    }

    return data.map(item => item.worldcup_id);
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

    // 테이블 존재 여부 확인
    const { data: tableCheck, error: tableError } = await supabase
      .from('user_likes')
      .select('count', { count: 'exact', head: true });

    if (tableError) {
      console.error('❌ user_likes 테이블이 존재하지 않습니다:', tableError);
      console.log('📋 user-interactions-setup.sql 파일을 Supabase SQL Editor에서 실행해주세요.');
      return false;
    }

    const { data, error } = await supabase
      .from('user_likes')
      .insert({
        user_id: userId,
        worldcup_id: worldcupId
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

    // worldcups 테이블의 likes 수도 증가
    const { error: updateError } = await supabase.rpc('increment_worldcup_likes', {
      worldcup_id: worldcupId
    });

    if (updateError) {
      console.warn('⚠️ Failed to update worldcup likes count:', updateError);
      // 이 에러는 치명적이지 않으므로 계속 진행
    }

    console.log('✅ Like added successfully:', data);
    return true;
  } catch (error) {
    console.error('❌ Unexpected error in addLike:', error);
    return false;
  }
}

export async function removeLike(userId: string, worldcupId: string) {
  try {
    const { error } = await supabase
      .from('user_likes')
      .delete()
      .eq('user_id', userId)
      .eq('worldcup_id', worldcupId);

    if (error) {
      console.error('Error removing like:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in removeLike:', error);
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
      .from('user_likes')
      .select('*', { count: 'exact', head: true })
      .eq('worldcup_id', worldcupId);

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
      .from('user_likes')
      .select('worldcup_id')
      .in('worldcup_id', worldcupIds);

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
      counts[item.worldcup_id] = (counts[item.worldcup_id] || 0) + 1;
    });

    return counts;
  } catch (error) {
    console.error('Error in getMultipleWorldCupLikesCount:', error);
    return {};
  }
}