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
  
  // Comment system (for CommentSystem component)
  comments: Comment[];
  
  // Actions
  onLike: () => void;
  onBookmark: () => void;
  onWorldcupReport: (reason: string, description?: string) => void;
  onShare: () => void;
  onRestart: () => void;
  onGoHome: () => void;
  onShowRanking: () => void;
  onShowImageModal: () => void;
  
  // Setters
  setShowReportModal: (show: boolean) => void;
  
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