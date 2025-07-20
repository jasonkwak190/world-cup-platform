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
  liked?: boolean;
  isCreator: boolean;
  level: 'bronze' | 'silver' | 'gold' | 'vip' | 'user';
  replies?: Comment[];
}

export interface WorldCupData {
  id: string;
  title: string;
  description: string;
  items: any[];
  creator_name: string;
  creator_id?: string;
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
  reported: boolean;
  showReportModal: boolean;
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
  onWorldcupReport: (reason: string, description?: string) => void;
  onShare: () => void;
  onRestart: () => void;
  onGoHome: () => void;
  onShowRanking: () => void;
  onShowImageModal: () => void;
  onCommentSubmit: (e: React.FormEvent) => void;
  onReport: (commentId: string) => void;
  
  // Comment actions
  onCommentLike?: (commentId: string) => void;
  
  // Setters
  setShowReportModal: (show: boolean) => void;
  setCommentText: (text: string) => void;
  setGuestName: (name: string) => void;
  setCommentFilter: (filter: 'likes' | 'recent') => void;
  setShowCommentForm: (show: boolean) => void;
  
  // Authentication state
  isAuthenticated?: boolean;
  currentUser?: {
    id: string;
    name: string;
    avatar: string;
    level: 'Bronze' | 'Silver' | 'Gold' | 'VIP' | 'Guest';
  };
  worldcupCreatorId?: string;
}