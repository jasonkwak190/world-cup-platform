// Types for stats API
export interface OverviewStats {
  totalWorldcups: number;
  totalPlays: number;
  totalUsers: number;
  totalComments: number;
  totalPages: number;
}

export interface StatsResponse {
  data: OverviewStats;
  lastUpdated: string;
}