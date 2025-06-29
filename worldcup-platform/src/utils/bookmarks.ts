// 북마크 관련 유틸리티 함수들
import { supabase } from '@/lib/supabase';

// 사용자 북마크 가져오기
export async function getUserBookmarks(userId: string): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('user_bookmarks')
      .select('worldcup_id')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching bookmarks:', error);
      return [];
    }

    return data.map(bookmark => bookmark.worldcup_id);
  } catch (error) {
    console.error('Error in getUserBookmarks:', error);
    return [];
  }
}

// 북마크 추가
export async function addBookmark(userId: string, worldcupId: string): Promise<boolean> {
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

// 북마크 제거
export async function removeBookmark(userId: string, worldcupId: string): Promise<boolean> {
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