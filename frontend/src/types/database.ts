// Database type definitions for WorldCup Platform

export interface User {
  id: string;
  email: string;
  username: string;
  display_name?: string;
  avatar_url?: string;
  bio?: string;
  is_verified: boolean;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
  last_login_at?: string;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
}

export interface WorldCup {
  id: string;
  title: string;
  description?: string;
  thumbnail_url?: string;
  creator_id: string;
  category_id?: number;
  
  // Tournament settings
  total_items: number;
  tournament_type: 'single_elimination' | 'round_robin';
  rounds: number;
  
  // Status and visibility
  status: 'draft' | 'published' | 'archived' | 'banned';
  is_public: boolean;
  is_featured: boolean;
  allow_comments: boolean;
  
  // Engagement metrics
  view_count: number;
  play_count: number;
  like_count: number;
  comment_count: number;
  bookmark_count: number;
  
  // SEO and search
  slug?: string;
  tags?: string[];
  
  // Timestamps
  created_at: string;
  updated_at: string;
  published_at?: string;
}

export interface WorldCupItem {
  id: string;
  worldcup_id: string;
  title: string;
  description?: string;
  
  // Media content
  image_url?: string;
  video_url?: string;
  video_start_time?: number;
  video_end_time?: number;
  
  // Item metadata
  source_url?: string;
  source_attribution?: string;
  
  // Position in tournament
  position: number;
  seed?: number;
  
  // Statistics
  win_count: number;
  loss_count: number;
  win_rate: number;
  
  created_at: string;
  updated_at: string;
}

export interface GameSession {
  id: string;
  worldcup_id: string;
  user_id?: string;
  session_token?: string;
  current_round: number;
  is_completed: boolean;
  winner_id?: string;
  total_matches?: number;
  completed_matches: number;
  user_agent?: string;
  ip_address?: string;
  created_at: string;
  completed_at?: string;
}

export interface GameMatch {
  id: string;
  session_id: string;
  round_number: number;
  match_number: number;
  item1_id: string;
  item2_id: string;
  winner_id: string;
  decision_time_ms?: number;
  created_at: string;
}

export interface Comment {
  id: string;
  worldcup_id: string;
  user_id: string;
  parent_id?: string;
  content: string;
  is_edited: boolean;
  is_pinned: boolean;
  is_deleted: boolean;
  like_count: number;
  reply_count: number;
  created_at: string;
  updated_at: string;
}

export interface UserInteraction {
  id: string;
  user_id: string;
  target_type: 'worldcup' | 'comment';
  target_id: string;
  interaction_type: 'like' | 'bookmark' | 'follow' | 'report';
  created_at: string;
}

export interface Report {
  id: string;
  reporter_id: string;
  target_type: 'worldcup' | 'comment' | 'user';
  target_id: string;
  reason: string;
  description?: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  moderator_id?: string;
  moderator_notes?: string;
  created_at: string;
  resolved_at?: string;
}

export interface AnalyticsEvent {
  id: string;
  event_type: string;
  user_id?: string;
  session_id?: string;
  properties?: Record<string, unknown>;
  user_agent?: string;
  ip_address?: string;
  referrer?: string;
  created_at: string;
}

// Extended types with joins
export interface WorldCupWithDetails extends WorldCup {
  creator_username?: string;
  creator_display_name?: string;
  category_name?: string;
  category_color?: string;
  items?: WorldCupItem[];
}

export interface CommentWithUser extends Comment {
  user: Pick<User, 'id' | 'username' | 'display_name' | 'avatar_url' | 'is_verified'>;
  replies?: CommentWithUser[];
}

export interface TrendingWorldCup extends WorldCupWithDetails {
  trending_score: number;
}

export interface RecentActivity {
  activity_type: 'comment' | 'worldcup_created';
  activity_id: string;
  activity_content?: string;
  user_id: string;
  username: string;
  display_name?: string;
  target_id: string;
  target_title: string;
  created_at: string;
}

// API Response types
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

export interface WorldCupStats {
  total_worldcups: number;
  total_plays: number;
  total_users: number;
  total_comments: number;
  trending_categories: Array<{
    category_id: number;
    category_name: string;
    worldcup_count: number;
  }>;
}

// Tournament bracket types
export interface TournamentBracket {
  rounds: TournamentRound[];
  winner?: WorldCupItem;
}

export interface TournamentRound {
  round_number: number;
  matches: TournamentMatch[];
}

export interface TournamentMatch {
  match_number: number;
  item1?: WorldCupItem;
  item2?: WorldCupItem;
  winner?: WorldCupItem;
  is_played: boolean;
}

// Search and filter types
export interface SearchFilters {
  query?: string;
  category_id?: number;
  tags?: string[];
  creator_id?: string;
  status?: WorldCup['status'];
  is_featured?: boolean;
  created_after?: string;
  created_before?: string;
  min_play_count?: number;
  sort_by?: 'created_at' | 'play_count' | 'like_count' | 'trending_score';
  sort_order?: 'asc' | 'desc';
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}