// PIKU 스타일 통계 타입 정의

export interface PikuItemStats {
  item_id: string;
  title: string;
  image_url: string;
  selection_rate: number;      // 선택률 (%)
  total_selections: number;    // 총 선택된 횟수
  total_appearances: number;   // 총 등장 횟수
  popularity_rank: number;     // 인기 순위
  versus_win_rate: number;     // 1:1 대결 승률 (기존 방식)
}

export interface WorldcupStatsSummary {
  total_players: number;       // 총 플레이어 수
  total_matches: number;       // 총 매치 수
  total_items: number;         // 총 아이템 수
  avg_selection_rate: number;  // 평균 선택률
  most_popular_item: string;   // 가장 인기 있는 아이템
  most_popular_rate: number;   // 가장 높은 선택률
}

export interface PikuRankingData {
  stats: PikuItemStats[];
  summary: WorldcupStatsSummary;
  last_updated: string;
}