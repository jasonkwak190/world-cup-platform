import { WorldCupItem, GameState } from '@/types/game';

export interface VoteStats {
  leftPercentage: number;
  rightPercentage: number;
  totalVotes: number;
}

export interface WorldCupData {
  id: string;
  title: string;
  description: string;
  items: WorldCupItem[];
  creator_name: string;
  created_at: string;
}

export interface GameThemeProps {
  worldcupData: WorldCupData;
  gameState: GameState;
  currentMatch: { 
    left: WorldCupItem; 
    right: WorldCupItem;
    id: string;
    round: number;
    matchNumber: number;
    winner?: WorldCupItem;
    isCompleted: boolean;
  } | null;
  selectedItem: WorldCupItem | null;
  voteStats: VoteStats | null;
  showStats: boolean;
  isProcessing: boolean;
  canUndo: boolean;
  onChoice: (item: WorldCupItem) => void;
  onUndo: () => void;
  onRestart: () => void;
  onHome: () => void;
  onSelectOtherTournament: () => void;
  progress: {
    currentRound: number;
    totalRounds: number;
    currentMatch: number;
    totalMatches: number;
    percentage: number;
  } | null;
  roundName: string;
}