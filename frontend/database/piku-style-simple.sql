-- 기존 worldcup_items 테이블 활용한 PIKU 스타일 랭킹
-- 새 테이블 생성 없이 View로 구현

-- 1. PIKU 스타일 전체 랭킹 뷰 생성
CREATE OR REPLACE VIEW public.global_item_rankings AS
WITH item_aggregated AS (
  -- 같은 title의 아이템들을 모든 월드컵에서 집계
  SELECT 
    wi.title,
    wi.image_url,
    -- 통계 합계
    SUM(wi.win_count) as total_wins,
    SUM(wi.loss_count) as total_losses,
    SUM(wi.total_appearances) as total_appearances,
    SUM(wi.championship_wins) as total_championships,
    -- 참여한 월드컵 정보
    COUNT(DISTINCT wi.worldcup_id) as worldcup_count,
    SUM(COALESCE(w.participants, 0)) as total_participants,
    ARRAY_AGG(DISTINCT w.category) as categories,
    -- 평균 승률 계산
    CASE 
      WHEN SUM(wi.total_appearances) > 0 
      THEN (SUM(wi.win_count)::numeric / SUM(wi.total_appearances)) * 100
      ELSE 0 
    END as overall_win_rate
  FROM public.worldcup_items wi
  INNER JOIN public.worldcups w ON wi.worldcup_id = w.id
  WHERE w.is_public = true  -- 공개 월드컵만
  GROUP BY wi.title, wi.image_url
  HAVING SUM(wi.total_appearances) > 0  -- 실제 경기 참여한 아이템만
),
popularity_calculated AS (
  -- PIKU 스타일 인기도 점수 계산
  SELECT 
    *,
    (
      (total_participants * 0.3) +                    -- 참여자 수 가중치
      (overall_win_rate * total_appearances * 0.4) +  -- 승률 × 경기수 가중치  
      (worldcup_count * 50) +                         -- 월드컵 출현 횟수 가중치
      (total_championships * 100)                     -- 우승 횟수 가중치
    ) as popularity_score
  FROM item_aggregated
)
SELECT 
  ROW_NUMBER() OVER (ORDER BY popularity_score DESC) as rank,
  title,
  image_url,
  total_wins,
  total_losses, 
  total_appearances,
  total_championships,
  total_participants,
  worldcup_count,
  categories,
  ROUND(overall_win_rate, 2) as win_rate,
  ROUND(popularity_score, 2) as popularity_score,
  NOW() as last_updated
FROM popularity_calculated
ORDER BY popularity_score DESC;

-- 2. 뷰에 대한 권한 설정
GRANT SELECT ON public.global_item_rankings TO authenticated;
GRANT SELECT ON public.global_item_rankings TO anon;

-- 3. 성능을 위한 인덱스 (기존 테이블에)
CREATE INDEX IF NOT EXISTS idx_worldcup_items_title_stats 
ON public.worldcup_items(title, win_count DESC, championship_wins DESC);

CREATE INDEX IF NOT EXISTS idx_worldcup_items_worldcup_id 
ON public.worldcup_items(worldcup_id);

-- worldcups 테이블에도 인덱스 추가 (조인 성능 향상)
CREATE INDEX IF NOT EXISTS idx_worldcups_public 
ON public.worldcups(is_public, category) WHERE is_public = true;

-- 4. 뷰 테스트 쿼리
SELECT 
  rank,
  title,
  total_championships,
  win_rate,
  popularity_score,
  worldcup_count
FROM public.global_item_rankings 
LIMIT 10;

-- 5. 특정 카테고리 랭킹 조회 예시
SELECT 
  rank,
  title,
  win_rate,
  popularity_score
FROM public.global_item_rankings 
WHERE 'entertainment' = ANY(categories)
LIMIT 10;