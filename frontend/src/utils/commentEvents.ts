// 댓글 수 변경 이벤트 시스템
type CommentCountChangeListener = (worldcupId: string, newCount: number) => void;

class CommentEventManager {
  private listeners: CommentCountChangeListener[] = [];

  // 리스너 추가
  addListener(listener: CommentCountChangeListener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // 댓글 수 변경 알림
  notifyCommentCountChange(worldcupId: string, newCount: number) {
    this.listeners.forEach(listener => {
      try {
        listener(worldcupId, newCount);
      } catch (error) {
        console.error('Error in comment count listener:', error);
      }
    });
  }
}

export const commentEventManager = new CommentEventManager();

// 편의 함수들
export const onCommentCountChange = (listener: CommentCountChangeListener) => {
  return commentEventManager.addListener(listener);
};

export const notifyCommentCountChange = (worldcupId: string, newCount: number) => {
  commentEventManager.notifyCommentCountChange(worldcupId, newCount);
};