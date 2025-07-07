// Types for trending worldcups API
export interface TrendingWorldCup {
  id: string;
  title: string;
  play_count: number;
  view_count: number;
  created_at: string;
  rank: number;
  trending_score: number;
  isHot?: boolean;
  isRising?: boolean;
  isNew?: boolean;
}

export interface TrendingResponse {
  data: TrendingWorldCup[];
  lastUpdated: string;
}