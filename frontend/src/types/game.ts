// Game types for WorldCup Tournament

export interface WorldCupItem {
  id: string;
  title: string;
  image?: string;
  image_url?: string;
  description?: string;
  is_bye?: boolean; // 부전승 항목 여부
}

export interface Match {
  id: string;
  round: number;
  matchNumber: number;
  item1: WorldCupItem;
  item2: WorldCupItem;
  winner?: WorldCupItem;
  isCompleted: boolean;
}

export interface Tournament {
  id: string;
  title: string;
  description?: string;
  items: WorldCupItem[];
  totalRounds: number;
  currentRound: number;
  currentMatch: number;
  isCompleted: boolean;
  winner?: WorldCupItem;
  matches: Match[];
}

export interface GameState {
  tournament: Tournament;
  history: Match[];
  canUndo: boolean;
  startTime: number;
  endTime?: number;
}

export type TournamentSize = 4 | 8 | 16 | 32 | 64 | 128;

export interface Comment {
  id: string;
  username: string;
  content: string;
  likes: number;
  dislikes: number;
  createdAt: Date;
  isLiked?: boolean;
  isDisliked?: boolean;
}