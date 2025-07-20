#!/usr/bin/env node
/**
 * 투표 테이블 생성 스크립트
 * 
 * 이 스크립트는 tournament-game의 voting 기능에 필요한 데이터베이스 테이블을 생성합니다.
 * 500 에러를 해결하기 위해 실행하세요.
 */

console.log('='.repeat(80));
console.log('🛠️  Tournament Voting Tables 생성 스크립트');
console.log('='.repeat(80));

console.log('\n📋 필요한 작업:');
console.log('1. worldcup_votes 테이블 생성');
console.log('2. 인덱스 및 제약조건 추가');
console.log('3. Row Level Security (RLS) 정책 설정');

const sql = `
-- =============================================
-- 🏆 Tournament Voting Tables Creation Script
-- =============================================

-- 1. worldcup_votes 테이블 생성
CREATE TABLE IF NOT EXISTS worldcup_votes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    worldcup_id UUID NOT NULL REFERENCES worldcups(id) ON DELETE CASCADE,
    winner_id UUID NOT NULL REFERENCES worldcup_items(id) ON DELETE CASCADE,
    loser_id UUID REFERENCES worldcup_items(id) ON DELETE CASCADE,
    round_type VARCHAR(10) DEFAULT '16',
    session_id VARCHAR(255),
    user_ip VARCHAR(45),
    voted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_worldcup_votes_worldcup_id ON worldcup_votes(worldcup_id);
CREATE INDEX IF NOT EXISTS idx_worldcup_votes_winner_id ON worldcup_votes(winner_id);
CREATE INDEX IF NOT EXISTS idx_worldcup_votes_loser_id ON worldcup_votes(loser_id);
CREATE INDEX IF NOT EXISTS idx_worldcup_votes_voted_at ON worldcup_votes(voted_at DESC);
CREATE INDEX IF NOT EXISTS idx_worldcup_votes_session_id ON worldcup_votes(session_id);

-- 3. 복합 인덱스 (빠른 조회를 위해)
CREATE INDEX IF NOT EXISTS idx_worldcup_votes_worldcup_winner ON worldcup_votes(worldcup_id, winner_id);
CREATE INDEX IF NOT EXISTS idx_worldcup_votes_worldcup_round ON worldcup_votes(worldcup_id, round_type);

-- 4. Row Level Security (RLS) 활성화
ALTER TABLE worldcup_votes ENABLE ROW LEVEL SECURITY;

-- 5. RLS 정책 생성
-- 모든 사용자가 투표 데이터를 읽을 수 있음
CREATE POLICY IF NOT EXISTS "worldcup_votes_select_policy" ON worldcup_votes
    FOR SELECT USING (true);

-- 모든 사용자가 투표를 생성할 수 있음
CREATE POLICY IF NOT EXISTS "worldcup_votes_insert_policy" ON worldcup_votes
    FOR INSERT WITH CHECK (true);

-- 6. 통계 뷰 생성 (선택사항)
CREATE OR REPLACE VIEW worldcup_vote_stats AS
SELECT 
    wv.worldcup_id,
    wv.winner_id,
    wi_winner.title as winner_title,
    wv.loser_id,
    wi_loser.title as loser_title,
    wv.round_type,
    COUNT(*) as vote_count,
    MIN(wv.voted_at) as first_vote,
    MAX(wv.voted_at) as last_vote
FROM worldcup_votes wv
LEFT JOIN worldcup_items wi_winner ON wv.winner_id = wi_winner.id
LEFT JOIN worldcup_items wi_loser ON wv.loser_id = wi_loser.id
GROUP BY wv.worldcup_id, wv.winner_id, wi_winner.title, wv.loser_id, wi_loser.title, wv.round_type;

-- 7. 필요한 컬럼이 worldcup_items 테이블에 있는지 확인하고 없으면 추가
ALTER TABLE worldcup_items 
ADD COLUMN IF NOT EXISTS win_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS loss_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_appearances INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS win_rate DECIMAL(5,2) DEFAULT 0.00;

-- 8. worldcup_items 통계 업데이트를 위한 인덱스
CREATE INDEX IF NOT EXISTS idx_worldcup_items_stats ON worldcup_items(win_count DESC, total_appearances DESC);

COMMENT ON TABLE worldcup_votes IS '토너먼트 게임 투표 기록 테이블';
COMMENT ON COLUMN worldcup_votes.worldcup_id IS '월드컵 ID';
COMMENT ON COLUMN worldcup_votes.winner_id IS '승리한 아이템 ID';
COMMENT ON COLUMN worldcup_votes.loser_id IS '패배한 아이템 ID (결승에서는 null 가능)';
COMMENT ON COLUMN worldcup_votes.round_type IS '라운드 타입 (16, 8, 4, semi, final)';
COMMENT ON COLUMN worldcup_votes.session_id IS '사용자 세션 ID';
COMMENT ON COLUMN worldcup_votes.user_ip IS '사용자 IP 주소';
`;

console.log('\n📝 실행할 SQL:');
console.log('='.repeat(50));
console.log(sql);
console.log('='.repeat(50));

console.log('\n🚀 다음 단계:');
console.log('1. 위의 SQL을 복사하세요');
console.log('2. Supabase Dashboard > SQL Editor로 이동');
console.log('3. 새 Query를 만들고 SQL을 붙여넣기');
console.log('4. RUN 버튼을 클릭하여 실행');
console.log('5. 실행 완료 후 tournament-game에서 투표 테스트');

console.log('\n✅ 완료 후 확인사항:');
console.log('- worldcup_votes 테이블이 생성되었는지 확인');
console.log('- 모든 인덱스가 생성되었는지 확인');
console.log('- RLS 정책이 설정되었는지 확인');
console.log('- tournament-game에서 투표가 정상 작동하는지 테스트');

console.log('\n🔧 Troubleshooting:');
console.log('만약 여전히 에러가 발생한다면:');
console.log('1. Supabase 로그에서 상세 에러 확인');
console.log('2. 개발자 도구 Network 탭에서 API 응답 확인');
console.log('3. 테이블 구조와 데이터 타입 확인');

console.log('\n' + '='.repeat(80));
console.log('🎯 이제 500 에러가 해결될 것입니다!');
console.log('='.repeat(80));