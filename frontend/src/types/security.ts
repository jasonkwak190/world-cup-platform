// 법적 안전성 및 보안 관련 타입 정의

export interface ContentLicense {
  type: 'CC0' | 'CC_BY' | 'CC_BY_SA' | 'MIT' | 'CUSTOM' | 'SELF_CREATED' | 'STOCK_LICENSED';
  source_url?: string;
  attribution_required: boolean;
  commercial_use_allowed: boolean;
  modification_allowed: boolean;
  license_text: string;
  license_url?: string;
  expiry_date?: string;
}

export interface CopyrightVerification {
  verification_method: 'user_declaration' | 'reverse_image_search' | 'ai_detection' | 'manual_review';
  confidence_score: number; // 0-100
  verification_date: string;
  verified_by?: string; // user_id 또는 admin_id
  verification_notes?: string;
}

export interface ContentSafety {
  content_id: string;
  safety_status: 'safe' | 'pending' | 'flagged' | 'removed';
  copyright_status: 'verified' | 'pending' | 'disputed' | 'removed';
  license_info: ContentLicense;
  verification_info: CopyrightVerification;
  risk_score: number; // 0-100 (0: 안전, 100: 위험)
  flags: ContentFlag[];
  created_at: string;
  updated_at: string;
}

export interface ContentFlag {
  flag_type: 'copyright' | 'inappropriate' | 'spam' | 'misleading' | 'other';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  flagged_by: string; // user_id 또는 system
  flagged_at: string;
  status: 'active' | 'resolved' | 'dismissed';
  resolution_notes?: string;
}

export interface UserUploadAgreement {
  user_id: string;
  agreement_version: string;
  agreed_at: string;
  ip_address: string;
  user_agent: string;
  terms_accepted: boolean;
  copyright_declaration: boolean;
  responsibility_accepted: boolean;
}

export interface SafeContentSource {
  source_id: string;
  source_name: string;
  source_type: 'unsplash' | 'pixabay' | 'pexels' | 'freepik' | 'ai_generated' | 'user_created';
  api_endpoint?: string;
  license_default: ContentLicense;
  requires_attribution: boolean;
  commercial_use_allowed: boolean;
  rate_limit?: {
    requests_per_hour: number;
    requests_per_day: number;
  };
  is_active: boolean;
}

export interface ContentFilterRule {
  rule_id: string;
  rule_type: 'keyword' | 'hash' | 'ai_detection' | 'source_url';
  pattern: string;
  action: 'block' | 'flag' | 'review';
  severity: 'low' | 'medium' | 'high';
  description: string;
  is_active: boolean;
  created_at: string;
}

export interface AuditLog {
  id: string;
  event_type: 'content_upload' | 'content_removal' | 'license_change' | 'flag_created' | 'flag_resolved';
  target_type: 'worldcup' | 'worldcup_item' | 'user' | 'system';
  target_id: string;
  user_id?: string;
  admin_id?: string;
  details: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

// 확장된 WorldCupItem 타입 (기존 타입에 보안 정보 추가)
export interface SecureWorldCupItem {
  id: string;
  worldcup_id: string;
  title: string;
  description?: string;
  
  // 미디어 콘텐츠
  image_url?: string;
  video_url?: string;
  video_start_time?: number;
  video_end_time?: number;
  
  // 보안 및 라이선스 정보
  content_safety: ContentSafety;
  upload_agreement_id: string;
  
  // 기존 필드들
  source_url?: string;
  source_attribution?: string;
  position: number;
  seed?: number;
  win_count: number;
  loss_count: number;
  win_rate: number;
  created_at: string;
  updated_at: string;
}

// API 응답 타입
export interface ContentVerificationResponse {
  content_id: string;
  is_safe: boolean;
  risk_score: number;
  license_valid: boolean;
  copyright_clear: boolean;
  warnings: string[];
  errors: string[];
  recommendations: string[];
}

export interface LicenseComplianceReport {
  total_content: number;
  compliant_content: number;
  non_compliant_content: number;
  pending_review: number;
  compliance_percentage: number;
  risk_distribution: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  license_breakdown: Record<string, number>;
  generated_at: string;
}

// 사용자 입력 검증 타입
export interface ContentUploadValidation {
  title: {
    required: boolean;
    max_length: number;
    profanity_check: boolean;
  };
  description: {
    max_length: number;
    profanity_check: boolean;
  };
  media: {
    max_file_size: number;
    allowed_formats: string[];
    require_license: boolean;
    require_attribution: boolean;
  };
  source: {
    require_source_url: boolean;
    verify_source_accessible: boolean;
  };
}

// 시스템 설정 타입
export interface SecuritySettings {
  auto_content_scanning: boolean;
  require_user_agreement: boolean;
  require_license_for_all_content: boolean;
  enable_reverse_image_search: boolean;
  enable_ai_content_detection: boolean;
  max_risk_score_allowed: number;
  quarantine_flagged_content: boolean;
  notify_admins_on_high_risk: boolean;
}

export interface EmergencyResponse {
  response_id: string;
  trigger_type: 'copyright_claim' | 'legal_notice' | 'high_risk_content' | 'system_compromise';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  affected_content_ids: string[];
  action_taken: 'content_removed' | 'user_suspended' | 'feature_disabled' | 'system_lockdown';
  response_time: number; // 초 단위
  responsible_admin: string;
  created_at: string;
  resolved_at?: string;
  resolution_notes?: string;
}