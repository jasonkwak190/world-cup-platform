import { notifyCommentCountChange } from '@/utils/commentEvents';

// 특정 월드컵의 실제 댓글 수를 계산하고 업데이트하는 함수
export async function updateWorldCupCommentCount(worldcupId: string): Promise<number> {
  try {
    console.log('🔄 Updating comment count via API for worldcup:', worldcupId);

    // 서버 API를 통해 댓글 수 업데이트 (서비스 키 권한 사용)
    const response = await fetch('/api/update-comment-count', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ worldcupId }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('API Error:', errorData);
      return 0;
    }

    const result = await response.json();
    const actualCommentCount = result.commentCount;

    console.log(`✅ Updated comment count for worldcup ${worldcupId}: ${actualCommentCount}`);
    
    // 전역 이벤트 발생으로 UI 업데이트 알림
    notifyCommentCountChange(worldcupId, actualCommentCount);
    
    return actualCommentCount;

  } catch (error) {
    console.error('Failed to update comment count:', error);
    return 0;
  }
}

// 모든 월드컵의 댓글 수를 실제 값으로 동기화하는 함수
export async function syncAllCommentCounts(): Promise<void> {
  try {
    console.log('🔄 Starting comment count synchronization...');

    // 서버 API를 통해 모든 월드컵 동기화
    const response = await fetch('/api/sync-all-comment-counts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Sync API Error:', errorData);
      return;
    }

    const result = await response.json();
    console.log(`✅ Synchronized comment counts for ${result.updatedCount} worldcups`);

  } catch (error) {
    console.error('Failed to sync comment counts:', error);
  }
}

// 개발자용: 브라우저 콘솔에서 호출할 수 있는 함수
if (typeof window !== 'undefined') {
  (window as any).syncCommentCounts = syncAllCommentCounts;
}