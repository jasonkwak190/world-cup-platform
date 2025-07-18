import { WorldCupItem } from '@/types/game';

export interface WinnerStats {
  votes: number;
  winRate: number;
  totalMatches: number;
}

export interface Comment {
  id: string;
  content: string;
  author: string;
  createdAt: string;
  likes: number;
  isCreator: boolean;
  level: 'bronze' | 'silver' | 'gold' | 'vip';
  replies?: Comment[];
}

export interface WorldCupData {
  id: string;
  title: string;
  description: string;
  items: any[];
  creator_name: string;
  created_at: string;
  likes: number;
}

export interface ResultThemeProps {
  worldcupData: WorldCupData;
  winnerData: WorldCupItem | null;
  winnerStats: WinnerStats | null;
  playTime: number;
  
  // User interaction states
  liked: boolean;
  bookmarked: boolean;
  likes: number;
  
  // Comment system
  comments: Comment[];
  commentText: string;
  guestName: string;
  commentFilter: 'likes' | 'recent';
  showCommentForm: boolean;
  
  // Actions
  onLike: () => void;
  onBookmark: () => void;
  onShare: () => void;
  onRestart: () => void;
  onGoHome: () => void;
  onShowRanking: () => void;
  onShowImageModal: () => void;
  onCommentSubmit: (e: React.FormEvent) => void;
  onReport: (commentId: string) => void;
  
  // Setters
  setCommentText: (text: string) => void;
  setGuestName: (name: string) => void;
  setCommentFilter: (filter: 'likes' | 'recent') => void;
  setShowCommentForm: (show: boolean) => void;
}