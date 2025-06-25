export interface User {
  id: string;
  username: string;
  email: string;
  password: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorldCup {
  id: string;
  title: string;
  description?: string;
  thumbnail?: string;
  category: string;
  authorId: string;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
  views: number;
  participants: number;
  likes: number;
  comments: number;
}

export interface WorldCupItem {
  id: string;
  worldCupId: string;
  title: string;
  description?: string;
  image?: string;
  order: number;
  createdAt: Date;
}

export interface Tournament {
  id: string;
  worldCupId: string;
  userId?: string;
  winnerId?: string;
  startedAt: Date;
  completedAt?: Date;
  currentRound: number;
  totalRounds: number;
}

export interface TournamentMatch {
  id: string;
  tournamentId: string;
  round: number;
  matchNumber: number;
  item1Id: string;
  item2Id: string;
  winnerId?: string;
  completedAt?: Date;
}

export interface Comment {
  id: string;
  worldCupId: string;
  userId: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Like {
  id: string;
  worldCupId: string;
  userId: string;
  createdAt: Date;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  createdAt: Date;
}

export interface AuthRequest extends Request {
  user?: {
    id: string;
    username: string;
    email: string;
  };
}

export interface CreateWorldCupRequest {
  title: string;
  description?: string;
  category: string;
  items: Array<{
    title: string;
    description?: string;
    image?: string;
  }>;
  isPublic?: boolean;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}