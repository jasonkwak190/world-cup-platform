-- PIKU 스타일 전체 랭킹 시스템을 위한 테이블 생성

-- 전체 아이템 랭킹 테이블 (1시간마다 갱신)
CREATE TABLE IF NOT EXISTS public.global_item_rankings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  rank integer NOT NULL,
  item_title character varying NOT NULL,
  item_image_url text,
  total_participants integer DEFAULT 0,
  total_matches integer DEFAULT 0,
  win_rate numeric(5,2) DEFAULT 0.00,
  popularity_score numeric(10,2) DEFAULT 0.00, -- PIKU 스타일 인기도 점수
  total_championships integer DEFAULT 0,
  worldcup_count integer DEFAULT 0, -- 출현한 월드컵 수
  worldcup_categories text[] DEFAULT '{}', -- 출현한 카테고리들
  last_updated timestamp with time zone DEFAULT now(),
  
  CONSTRAINT global_item_rankings_pkey PRIMARY KEY (id),
  CONSTRAINT global_item_rankings_rank_unique UNIQUE (rank)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_global_rankings_rank ON public.global_item_rankings(rank);
CREATE INDEX IF NOT EXISTS idx_global_rankings_popularity ON public.global_item_rankings(popularity_score DESC);
CREATE INDEX IF NOT EXISTS idx_global_rankings_title ON public.global_item_rankings(item_title);
CREATE INDEX IF NOT EXISTS idx_global_rankings_updated ON public.global_item_rankings(last_updated DESC);

-- RLS 정책 (읽기 전용 - 모든 사용자)
ALTER TABLE public.global_item_rankings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "global_rankings_select_policy" ON public.global_item_rankings
    FOR SELECT 
    USING (true); -- 모든 사용자가 읽기 가능

CREATE POLICY "global_rankings_modify_policy" ON public.global_item_rankings
    FOR ALL 
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role'); -- service_role만 수정 가능

-- 랭킹 업데이트 히스토리 테이블 (선택사항)
CREATE TABLE IF NOT EXISTS public.ranking_update_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  update_type character varying DEFAULT 'scheduled', -- 'scheduled', 'manual', 'error'
  items_processed integer DEFAULT 0,
  execution_time_ms integer DEFAULT 0,
  status character varying DEFAULT 'success', -- 'success', 'error', 'partial'
  error_message text,
  created_at timestamp with time zone DEFAULT now(),
  
  CONSTRAINT ranking_update_logs_pkey PRIMARY KEY (id)
);

-- 로그 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_ranking_logs_created ON public.ranking_update_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ranking_logs_status ON public.ranking_update_logs(status);

-- 로그 테이블 RLS (읽기 전용)
ALTER TABLE public.ranking_update_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ranking_logs_select_policy" ON public.ranking_update_logs
    FOR SELECT 
    USING (true);

CREATE POLICY "ranking_logs_modify_policy" ON public.ranking_update_logs
    FOR ALL 
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- 1시간마다 자동 업데이트를 위한 함수 (PostgreSQL cron extension 필요)
CREATE OR REPLACE FUNCTION update_global_rankings_job()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  -- 이 함수는 cron job에서 호출되어 글로벌 랭킹을 업데이트합니다
  -- 실제 구현은 API 호출 또는 저장 프로시저로 대체 가능
  INSERT INTO public.ranking_update_logs (update_type, status, error_message)
  VALUES ('scheduled', 'pending', 'Cron job triggered - actual update via API call needed');
$$;

-- 권한 부여
GRANT EXECUTE ON FUNCTION update_global_rankings_job TO service_role;

-- 초기 데이터 확인 쿼리
SELECT 
  'Current global rankings count' as info,
  COUNT(*) as count 
FROM public.global_item_rankings;

-- 테이블 구조 확인
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'global_item_rankings' 
  AND table_schema = 'public'
ORDER BY ordinal_position;