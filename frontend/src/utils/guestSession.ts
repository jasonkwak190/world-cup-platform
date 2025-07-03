// 비회원 세션 관리 유틸리티

// 비회원 세션 ID 생성
export function generateGuestSessionId(): string {
  // 현재 시간 + 랜덤 문자열로 고유 ID 생성
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2);
  return `guest_${timestamp}_${random}`;
}

// 현재 비회원 세션 ID 가져오기 (없으면 생성)
export function getGuestSessionId(): string {
  // 서버사이드에서는 임시 ID 반환
  if (typeof window === 'undefined') {
    return 'temp_session_id';
  }
  
  const storageKey = 'guest_session_id';
  
  // localStorage에서 기존 세션 ID 확인
  let sessionId = localStorage.getItem(storageKey);
  
  if (!sessionId) {
    // 새 세션 ID 생성
    sessionId = generateGuestSessionId();
    localStorage.setItem(storageKey, sessionId);
  }
  
  return sessionId;
}

// 비회원 댓글 소유권 확인
export function isGuestCommentOwner(commentId: string): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  
  const storageKey = `guest_comment_${commentId}`;
  const sessionId = getGuestSessionId();
  const storedSessionId = localStorage.getItem(storageKey);
  
  return storedSessionId === sessionId;
}

// 비회원 댓글 소유권 등록
export function registerGuestComment(commentId: string): void {
  if (typeof window === 'undefined') {
    return;
  }
  
  const storageKey = `guest_comment_${commentId}`;
  const sessionId = getGuestSessionId();
  localStorage.setItem(storageKey, sessionId);
}

// 비회원 댓글 소유권 해제 (삭제 시)
export function unregisterGuestComment(commentId: string): void {
  if (typeof window === 'undefined') {
    return;
  }
  
  const storageKey = `guest_comment_${commentId}`;
  localStorage.removeItem(storageKey);
}

// 세션 정리 (선택적)
export function clearGuestSession(): void {
  const _sessionId = getGuestSessionId();
  
  // 관련된 모든 localStorage 항목 찾아서 제거
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.startsWith('guest_comment_') || key === 'guest_session_id')) {
      keysToRemove.push(key);
    }
  }
  
  keysToRemove.forEach(key => localStorage.removeItem(key));
}

// 페이지 로드 시 오래된 세션 정리 (30일 이상)
export function cleanupOldGuestSessions(): void {
  try {
    const sessionId = localStorage.getItem('guest_session_id');
    if (!sessionId) return;
    
    // 세션 ID에서 타임스탬프 추출
    const timestampPart = sessionId.split('_')[1];
    if (!timestampPart) return;
    
    const sessionTime = parseInt(timestampPart, 36);
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    
    // 30일 이상 된 세션이면 정리
    if (sessionTime < thirtyDaysAgo) {
      clearGuestSession();
    }
  } catch (error) {
    console.warn('Failed to cleanup old guest sessions:', error);
  }
}