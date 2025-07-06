tems 테이블에 승률 통계 관련 컬럼들을 추가합니다

-- 통계 컬럼들 추가
ALTER TABLE worldcup_items 
ADD COLUMN IF NOT EXISTS win_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS loss_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS win_rate DECIMAL(5,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS total_appearances INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS championship_wins INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 기존 데이터의 updated_at 초기화
UPDATE worldcup_items 
SET updated_at = created_at 
WHERE updated_at IS NULL;

-- 통계 컬럼들에 NOT NULL 제약조건 추가
ALTER TABLE worldcup_items 
ALTER COLUMN win_count SET NOT NULL,
ALTER COLUMN loss_count SET NOT NULL,
ALTER COLUMN win_rate SET NOT NULL,
ALTER COLUMN total_appearances SET NOT NULL,
ALTER COLUMN championship_wins SET NOT NULL,
ALTER COLUMN updated_at SET NOT NULL;

-- 인덱스 추가 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_worldcup_items_win_rate ON worldcup_items(win_rate DESC);
CREATE INDEX IF NOT EXISTS idx_worldcup_items_total_appearances ON worldcup_items(total_appearances DESC);
CREATE INDEX IF NOT EXISTS idx_worldcup_items_championship_wins ON worldcup_items(championship_wins DESC);

-- updated_at 자동 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
        RETURN NEW;
        END;
        $$ language 'plpgsql';
        
        -- updated_at 자동 업데이트 트리거 생성
        DROP TRIGGER IF EXISTS update_worldcup_items_updated_at ON worldcup_items;
        CREATE TRIGGER update_worldcup_items_updated_at
            BEFORE UPDATE ON worldcup_items
                FOR EACH ROW
                    EXECUTE FUNCTION update_updated_at_column();
                    
                    -- RLS (Row Level Security) 정책 업데이트 (필요한 경우)
                    -- 기존 정책을 유지하면서 새로운 컬럼들에 대한-- 아이템별 통계 컬럼 추가 마이그레이션NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY

-- worldcup_items 테이블에 승률 통계 관련 컬럼들을 추가합니다

-- 통계 컬럼들 추가
ALTER TABLE worldcup_items 
ADD COLUMN IF NOT EXISTS win_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS loss_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS win_rate DECIMAL(5,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS total_appearances INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS championship_wins INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 기존 데이터의 updated_at 초기화
UPDATE worldcup_items 
SET updated_at = created_at 
WHERE updated_at IS NULL;

-- 통계 컬럼들에 NOT NULL 제약조건 추가
ALTER TABLE worldcup_items 
ALTER COLUMN win_count SET NOT NULL,
ALTER COLUMN loss_count SET NOT NULL,
ALTER COLUMN win_rate SET NOT NULL,
ALTER COLUMN total_appearances SET NOT NULL,
ALTER COLUMN championship_wins SET NOT NULL,
ALTER COLUMN updated_at SET NOT NULL;

-- 인덱스 추가 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_worldcup_items_win_rate ON worldcup_items(win_rate DESC);
CREATE INDEX IF NOT EXISTS idx_worldcup_items_total_appearances ON worldcup_items(total_appearances DESC);
CREATE INDEX IF NOT EXISTS idx_worldcup_items_championship_wins ON worldcup_items(championship_wins DESC);

-- updated_at 자동 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- updated_at 자동 업데이트 트리거 생성
DROP TRIGGER IF EXISTS update_worldcup_items_updated_at ON worldcup_items;
CREATE TRIGGER update_worldcup_items_updated_at
    BEFORE UPDATE ON worldcup_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) 정책 업데이트 (필요한 경우)
-- 기존 정책을 유지하면서 새로운 컬럼들에 대한 접근 허용