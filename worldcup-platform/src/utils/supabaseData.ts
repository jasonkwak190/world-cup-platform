// Supabase에서 데이터를 가져오는 유틸리티 함수들
import { supabase } from '@/lib/supabase';
import type { SupabaseWorldCup, SupabaseWorldCupItem, SupabaseUser } from '@/types/supabase';

// 월드컵 목록 가져오기
export async function getWorldCups() {
  try {
    const { data, error } = await supabase
      .from('worldcups')
      .select(`
        *,
        author:users(id, username, profile_image_url),
        worldcup_items(id, title, image_url, description, order_index)
      `)
      .eq('is_public', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching worldcups:', error);
      return [];
    }

    // localStorage 형식으로 변환
    return data.map(worldcup => ({
      id: worldcup.id,
      title: worldcup.title,
      description: worldcup.description || '',
      thumbnail: worldcup.thumbnail_url || '/placeholder.svg',
      author: worldcup.author?.username || 'Unknown',
      createdAt: new Date(worldcup.created_at).toISOString().split('T')[0],
      participants: worldcup.participants,
      comments: worldcup.comments,
      likes: worldcup.likes,
      category: worldcup.category,
      isPublic: worldcup.is_public,
      items: worldcup.worldcup_items?.map(item => ({
        id: item.id,
        title: item.title,
        image: item.image_url,
        description: item.description
      })) || []
    }));

  } catch (error) {
    console.error('Error in getWorldCups:', error);
    return [];
  }
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

    // localStorage 형식으로 변환
    return {
      id: data.id,
      title: data.title,
      description: data.description || '',
      thumbnail: data.thumbnail_url || '/placeholder.svg',
      author: data.author?.username || 'Unknown',
      createdAt: new Date(data.created_at).toISOString().split('T')[0],
      participants: data.participants,
      comments: data.comments,
      likes: data.likes,
      category: data.category,
      isPublic: data.is_public,
      items: data.worldcup_items?.map(item => ({
        id: item.id,
        title: item.title,
        image: item.image_url,
        description: item.description
      })) || []
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
    return data.map(worldcup => ({
      id: worldcup.id,
      title: worldcup.title,
      description: worldcup.description || '',
      thumbnail: worldcup.thumbnail_url || '/placeholder.svg',
      author: worldcup.author?.username || 'Unknown',
      createdAt: new Date(worldcup.created_at).toISOString().split('T')[0],
      participants: worldcup.participants,
      comments: worldcup.comments,
      likes: worldcup.likes,
      category: worldcup.category,
      isPublic: worldcup.is_public,
      items: worldcup.worldcup_items?.map(item => ({
        id: item.id,
        title: item.title,
        image: item.image_url,
        description: item.description
      })) || []
    }));

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