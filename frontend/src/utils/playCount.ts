// 플레이 횟수 업데이트 유틸리티

// 세션 ID 생성 (중복 방지용)
function getSessionId(): string {
  let sessionId = sessionStorage.getItem('user_session_id');
  if (!sessionId) {
    sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    sessionStorage.setItem('user_session_id', sessionId);
  }
  return sessionId;
}

// 플레이 횟수 증가 함수
export async function incrementPlayCount(worldcupId: string): Promise<{ success: boolean; playCount?: number; error?: string }> {
  try {
    console.log('🎮 Updating play count via API for worldcup:', worldcupId);

    const sessionId = getSessionId();

    const response = await fetch('/api/update-play-count', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        worldcupId,
        userSessionId: sessionId
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Play count API Error:', result);
      return { 
        success: false, 
        error: result.message || result.error || 'Failed to update play count' 
      };
    }

    console.log(`✅ Play count updated for worldcup ${worldcupId}: ${result.playCount}`);
    
    return {
      success: true,
      playCount: result.playCount
    };

  } catch (error) {
    console.error('Failed to update play count:', error);
    return { 
      success: false, 
      error: 'Network error' 
    };
  }
}

// 플레이 횟수 이벤트 시스템
type PlayCountChangeListener = (worldcupId: string, newCount: number) => void;

class PlayCountEventManager {
  private listeners: PlayCountChangeListener[] = [];

  addListener(listener: PlayCountChangeListener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notifyPlayCountChange(worldcupId: string, newCount: number) {
    this.listeners.forEach(listener => {
      try {
        listener(worldcupId, newCount);
      } catch (error) {
        console.error('Error in play count listener:', error);
      }
    });
  }
}

export const playCountEventManager = new PlayCountEventManager();

export const onPlayCountChange = (listener: PlayCountChangeListener) => {
  return playCountEventManager.addListener(listener);
};

export const notifyPlayCountChange = (worldcupId: string, newCount: number) => {
  playCountEventManager.notifyPlayCountChange(worldcupId, newCount);
};