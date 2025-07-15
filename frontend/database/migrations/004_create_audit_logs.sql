-- 감사 로그 테이블 생성
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL CHECK (event_type IN ('content_upload', 'content_removal', 'license_change', 'flag_created', 'flag_resolved')),
  target_type TEXT NOT NULL CHECK (target_type IN ('worldcup', 'worldcup_item', 'user', 'system')),
  target_id UUID NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
  details JSONB NOT NULL DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_type ON audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target_type ON audit_logs(target_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target_id ON audit_logs(target_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_admin_id ON audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_ip_address ON audit_logs(ip_address);

-- 콘텐츠 안전성 테이블 생성
CREATE TABLE IF NOT EXISTS content_safety (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL REFERENCES worldcup_items(id) ON DELETE CASCADE,
  safety_status TEXT NOT NULL DEFAULT 'pending' CHECK (safety_status IN ('safe', 'pending', 'flagged', 'removed')),
  copyright_status TEXT NOT NULL DEFAULT 'pending' CHECK (copyright_status IN ('verified', 'pending', 'disputed', 'removed')),
  license_type TEXT NOT NULL DEFAULT 'unknown' CHECK (license_type IN ('CC0', 'CC_BY', 'CC_BY_SA', 'MIT', 'CUSTOM', 'SELF_CREATED', 'STOCK_LICENSED', 'unknown')),
  license_info JSONB NOT NULL DEFAULT '{}',
  verification_info JSONB NOT NULL DEFAULT '{}',
  risk_score INTEGER NOT NULL DEFAULT 50 CHECK (risk_score >= 0 AND risk_score <= 100),
  flags JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 콘텐츠 안전성 인덱스
CREATE INDEX IF NOT EXISTS idx_content_safety_content_id ON content_safety(content_id);
CREATE INDEX IF NOT EXISTS idx_content_safety_safety_status ON content_safety(safety_status);
CREATE INDEX IF NOT EXISTS idx_content_safety_copyright_status ON content_safety(copyright_status);
CREATE INDEX IF NOT EXISTS idx_content_safety_license_type ON content_safety(license_type);
CREATE INDEX IF NOT EXISTS idx_content_safety_risk_score ON content_safety(risk_score);

-- 사용자 업로드 동의 테이블 생성
CREATE TABLE IF NOT EXISTS user_upload_agreements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  agreement_version TEXT NOT NULL DEFAULT '1.0',
  agreed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  ip_address INET NOT NULL,
  user_agent TEXT NOT NULL,
  terms_accepted BOOLEAN NOT NULL DEFAULT FALSE,
  copyright_declaration BOOLEAN NOT NULL DEFAULT FALSE,
  responsibility_accepted BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE(user_id, agreement_version)
);

-- 업로드 동의 인덱스
CREATE INDEX IF NOT EXISTS idx_user_upload_agreements_user_id ON user_upload_agreements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_upload_agreements_version ON user_upload_agreements(agreement_version);
CREATE INDEX IF NOT EXISTS idx_user_upload_agreements_agreed_at ON user_upload_agreements(agreed_at);

-- 안전한 콘텐츠 소스 테이블 생성
CREATE TABLE IF NOT EXISTS safe_content_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_name TEXT NOT NULL UNIQUE,
  source_type TEXT NOT NULL CHECK (source_type IN ('unsplash', 'pixabay', 'pexels', 'freepik', 'ai_generated', 'user_created')),
  api_endpoint TEXT,
  license_default JSONB NOT NULL DEFAULT '{}',
  requires_attribution BOOLEAN NOT NULL DEFAULT FALSE,
  commercial_use_allowed BOOLEAN NOT NULL DEFAULT TRUE,
  rate_limit JSONB DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 안전한 콘텐츠 소스 인덱스
CREATE INDEX IF NOT EXISTS idx_safe_content_sources_source_type ON safe_content_sources(source_type);
CREATE INDEX IF NOT EXISTS idx_safe_content_sources_is_active ON safe_content_sources(is_active);

-- 콘텐츠 필터 규칙 테이블 생성
CREATE TABLE IF NOT EXISTS content_filter_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_type TEXT NOT NULL CHECK (rule_type IN ('keyword', 'hash', 'ai_detection', 'source_url')),
  pattern TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('block', 'flag', 'review')),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high')),
  description TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 콘텐츠 필터 규칙 인덱스
CREATE INDEX IF NOT EXISTS idx_content_filter_rules_rule_type ON content_filter_rules(rule_type);
CREATE INDEX IF NOT EXISTS idx_content_filter_rules_action ON content_filter_rules(action);
CREATE INDEX IF NOT EXISTS idx_content_filter_rules_severity ON content_filter_rules(severity);
CREATE INDEX IF NOT EXISTS idx_content_filter_rules_is_active ON content_filter_rules(is_active);

-- 긴급 대응 로그 테이블 생성
CREATE TABLE IF NOT EXISTS emergency_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('copyright_claim', 'legal_notice', 'high_risk_content', 'system_compromise')),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  description TEXT NOT NULL,
  affected_content_ids UUID[] NOT NULL DEFAULT '{}',
  action_taken TEXT NOT NULL CHECK (action_taken IN ('content_removed', 'user_suspended', 'feature_disabled', 'system_lockdown')),
  response_time INTEGER NOT NULL DEFAULT 0, -- 초 단위
  responsible_admin UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolution_notes TEXT
);

-- 긴급 대응 인덱스
CREATE INDEX IF NOT EXISTS idx_emergency_responses_trigger_type ON emergency_responses(trigger_type);
CREATE INDEX IF NOT EXISTS idx_emergency_responses_severity ON emergency_responses(severity);
CREATE INDEX IF NOT EXISTS idx_emergency_responses_responsible_admin ON emergency_responses(responsible_admin);
CREATE INDEX IF NOT EXISTS idx_emergency_responses_created_at ON emergency_responses(created_at);

-- 기존 worldcup_items 테이블에 보안 필드 추가
ALTER TABLE worldcup_items 
ADD COLUMN IF NOT EXISTS upload_agreement_id UUID REFERENCES user_upload_agreements(id);

-- 트리거 함수: content_safety updated_at 자동 업데이트
CREATE OR REPLACE FUNCTION update_content_safety_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
DROP TRIGGER IF EXISTS trigger_content_safety_updated_at ON content_safety;
CREATE TRIGGER trigger_content_safety_updated_at
  BEFORE UPDATE ON content_safety
  FOR EACH ROW EXECUTE FUNCTION update_content_safety_updated_at();

-- 트리거 함수: safe_content_sources updated_at 자동 업데이트
CREATE OR REPLACE FUNCTION update_safe_content_sources_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
DROP TRIGGER IF EXISTS trigger_safe_content_sources_updated_at ON safe_content_sources;
CREATE TRIGGER trigger_safe_content_sources_updated_at
  BEFORE UPDATE ON safe_content_sources
  FOR EACH ROW EXECUTE FUNCTION update_safe_content_sources_updated_at();

-- 트리거 함수: content_filter_rules updated_at 자동 업데이트
CREATE OR REPLACE FUNCTION update_content_filter_rules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
DROP TRIGGER IF EXISTS trigger_content_filter_rules_updated_at ON content_filter_rules;
CREATE TRIGGER trigger_content_filter_rules_updated_at
  BEFORE UPDATE ON content_filter_rules
  FOR EACH ROW EXECUTE FUNCTION update_content_filter_rules_updated_at();

-- 자동 감사 로그 생성 트리거 함수
CREATE OR REPLACE FUNCTION create_audit_log_for_content_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- INSERT 시 감사 로그 생성
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_logs (
      event_type,
      target_type,
      target_id,
      user_id,
      details,
      ip_address,
      user_agent
    ) VALUES (
      'content_upload',
      'worldcup_item',
      NEW.id,
      NEW.creator_id,
      jsonb_build_object(
        'operation', 'INSERT',
        'title', NEW.title,
        'worldcup_id', NEW.worldcup_id,
        'timestamp', CURRENT_TIMESTAMP
      ),
      inet_client_addr(),
      'system'
    );
    RETURN NEW;
  END IF;

  -- DELETE 시 감사 로그 생성
  IF TG_OP = 'DELETE' THEN
    INSERT INTO audit_logs (
      event_type,
      target_type,
      target_id,
      user_id,
      details,
      ip_address,
      user_agent
    ) VALUES (
      'content_removal',
      'worldcup_item',
      OLD.id,
      OLD.creator_id,
      jsonb_build_object(
        'operation', 'DELETE',
        'title', OLD.title,
        'worldcup_id', OLD.worldcup_id,
        'timestamp', CURRENT_TIMESTAMP
      ),
      inet_client_addr(),
      'system'
    );
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 자동 감사 로그 트리거 생성
DROP TRIGGER IF EXISTS trigger_audit_log_content_changes ON worldcup_items;
CREATE TRIGGER trigger_audit_log_content_changes
  AFTER INSERT OR DELETE ON worldcup_items
  FOR EACH ROW EXECUTE FUNCTION create_audit_log_for_content_changes();

-- 초기 안전한 콘텐츠 소스 데이터 입력
INSERT INTO safe_content_sources (source_name, source_type, api_endpoint, license_default, requires_attribution, commercial_use_allowed, rate_limit) VALUES
  ('Unsplash', 'unsplash', 'https://api.unsplash.com', 
   '{"type": "CC0", "commercial_use_allowed": true, "modification_allowed": true, "attribution_required": false}', 
   FALSE, TRUE, '{"requests_per_hour": 50, "requests_per_day": 5000}'),
  ('Pixabay', 'pixabay', 'https://pixabay.com/api', 
   '{"type": "CC0", "commercial_use_allowed": true, "modification_allowed": true, "attribution_required": false}', 
   FALSE, TRUE, '{"requests_per_hour": 100, "requests_per_day": 5000}'),
  ('Pexels', 'pexels', 'https://api.pexels.com', 
   '{"type": "CC0", "commercial_use_allowed": true, "modification_allowed": true, "attribution_required": false}', 
   FALSE, TRUE, '{"requests_per_hour": 200, "requests_per_day": 20000}'),
  ('AI Generated', 'ai_generated', NULL, 
   '{"type": "SELF_CREATED", "commercial_use_allowed": true, "modification_allowed": true, "attribution_required": false}', 
   FALSE, TRUE, '{}'),
  ('User Created', 'user_created', NULL, 
   '{"type": "SELF_CREATED", "commercial_use_allowed": true, "modification_allowed": true, "attribution_required": false}', 
   FALSE, TRUE, '{}')
ON CONFLICT (source_name) DO NOTHING;

-- 초기 콘텐츠 필터 규칙 데이터 입력
INSERT INTO content_filter_rules (rule_type, pattern, action, severity, description) VALUES
  ('keyword', '저작권|copyright|copyrighted|©|®|™', 'flag', 'medium', '저작권 관련 키워드 감지'),
  ('keyword', '무단복제|무단전재|불법복제|piracy|stolen', 'block', 'high', '불법 복제 관련 키워드 감지'),
  ('source_url', 'pinterest\.com|tumblr\.com|instagram\.com', 'flag', 'medium', '저작권 위험 소스 URL 감지'),
  ('source_url', '\.torrent|torrent\.|illegal|crack|pirate', 'block', 'high', '불법 소스 URL 감지'),
  ('ai_detection', 'deepfake|fake_person|generated_face', 'flag', 'medium', 'AI 생성 콘텐츠 감지'),
  ('keyword', '성인|adult|porn|xxx|sex|nude', 'block', 'high', '성인 콘텐츠 키워드 감지'),
  ('keyword', '폭력|violence|blood|gore|death', 'flag', 'medium', '폭력적 콘텐츠 키워드 감지'),
  ('keyword', '혐오|hate|racist|discrimination', 'block', 'high', '혐오 콘텐츠 키워드 감지')
ON CONFLICT DO NOTHING;

-- 보안 설정 테이블 생성
CREATE TABLE IF NOT EXISTS security_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT NOT NULL UNIQUE,
  setting_value JSONB NOT NULL DEFAULT '{}',
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 초기 보안 설정 데이터 입력
INSERT INTO security_settings (setting_key, setting_value, description) VALUES
  ('auto_content_scanning', '{"enabled": true}', '자동 콘텐츠 스캔 활성화'),
  ('require_user_agreement', '{"enabled": true}', '사용자 동의서 필수'),
  ('require_license_for_all_content', '{"enabled": true}', '모든 콘텐츠 라이선스 필수'),
  ('enable_reverse_image_search', '{"enabled": false}', '역방향 이미지 검색 활성화'),
  ('enable_ai_content_detection', '{"enabled": false}', 'AI 콘텐츠 감지 활성화'),
  ('max_risk_score_allowed', '{"value": 70}', '허용 최대 위험 점수'),
  ('quarantine_flagged_content', '{"enabled": true}', '플래그된 콘텐츠 격리'),
  ('notify_admins_on_high_risk', '{"enabled": true}', '고위험 콘텐츠 관리자 알림')
ON CONFLICT (setting_key) DO NOTHING;