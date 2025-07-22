/**
 * API 엔드포인트 상수값 정의
 * 여러 파일에 흩어져 있던 API 경로들을 통합 관리
 */

// ===== Base URLs =====
export const API_BASE_URL = '/api';

// ===== World Cup API Endpoints =====
export const WORLDCUP_ENDPOINTS = {
  // 기본 CRUD
  LIST: `${API_BASE_URL}/worldcups`,
  CREATE: `${API_BASE_URL}/worldcups/create`,
  GET: (id: string) => `${API_BASE_URL}/worldcups/${id}`,
  UPDATE: (id: string) => `${API_BASE_URL}/worldcups/${id}/update`,
  DELETE: (id: string) => `${API_BASE_URL}/worldcups/${id}/delete`,
  
  // 상호작용
  LIKE: (id: string) => `${API_BASE_URL}/worldcups/${id}/like`,
  BOOKMARK: (id: string) => `${API_BASE_URL}/worldcups/${id}/bookmark`,
  REPORT: (id: string) => `${API_BASE_URL}/worldcups/${id}/report`,
  
  // 통계 및 데이터
  STATS: (id: string) => `${API_BASE_URL}/worldcups/${id}/stats`,
  PLAY: (id: string) => `${API_BASE_URL}/worldcups/${id}/play`,
  VOTE: (id: string) => `${API_BASE_URL}/worldcups/${id}/vote`,
  
  // 아이템 관련
  ITEMS: (id: string) => `${API_BASE_URL}/worldcups/${id}/items`,
  GET_ITEM: (worldcupId: string, itemId: string) => 
    `${API_BASE_URL}/worldcups/${worldcupId}/items/${itemId}`,
  
  // 댓글 관련
  COMMENTS: (id: string) => `${API_BASE_URL}/worldcups/${id}/comments`,
  COMMENTS_WITH_SORT: (id: string, sortBy: string) => 
    `${API_BASE_URL}/worldcups/${id}/comments?sortBy=${sortBy}`,
} as const;

// ===== Comment API Endpoints =====
export const COMMENT_ENDPOINTS = {
  // 댓글 좋아요
  LIKE: (commentId: string) => `${API_BASE_URL}/comments/${commentId}/like`,
  REPORT: (commentId: string) => `${API_BASE_URL}/comments/${commentId}/report`,
  
  // 최근 댓글
  RECENT: `${API_BASE_URL}/comments/recent`,
} as const;

// ===== User API Endpoints =====
export const USER_ENDPOINTS = {
  PROFILE: (userId: string) => `${API_BASE_URL}/users/${userId}`,
  BOOKMARKS: (userId: string) => `${API_BASE_URL}/users/${userId}/bookmarks`,
  STATS: (userId: string) => `${API_BASE_URL}/users/${userId}/stats`,
} as const;

// ===== Admin API Endpoints =====
export const ADMIN_ENDPOINTS = {
  SECURITY: {
    BASE: `${API_BASE_URL}/admin/security`,
    METRICS: `${API_BASE_URL}/admin/security/metrics`,
  },
} as const;

// ===== Stats & Analytics API Endpoints =====
export const STATS_ENDPOINTS = {
  OVERVIEW: `${API_BASE_URL}/stats/overview`,
  GLOBAL_RANKINGS: `${API_BASE_URL}/rankings/global`,
  TRENDING: `${API_BASE_URL}/trending`,
} as const;

// ===== Auto Save API Endpoints =====
export const AUTOSAVE_ENDPOINTS = {
  SAVE: `${API_BASE_URL}/autosave/save`,
  RESTORE: `${API_BASE_URL}/autosave/restore`,
  CLEANUP: `${API_BASE_URL}/autosave/cleanup`,
  PLAY: `${API_BASE_URL}/autosave/play`,
} as const;

// ===== Utility API Endpoints =====
export const UTILITY_ENDPOINTS = {
  PROXY_IMAGE: `${API_BASE_URL}/proxy-image`,
  OG_IMAGE: `${API_BASE_URL}/og`,
  MIGRATE: `${API_BASE_URL}/migrate`,
  AUDIT_LOGS: `${API_BASE_URL}/migrate/audit-logs`,
} as const;

// ===== Debug API Endpoints =====
export const DEBUG_ENDPOINTS = {
  RATE_LIMIT: `${API_BASE_URL}/debug/ratelimit`,
} as const;

// ===== Query Parameters =====
export const QUERY_PARAMS = {
  // 정렬
  SORT_BY: 'sortBy',
  ORDER: 'order',
  
  // 페이지네이션
  PAGE: 'page',
  LIMIT: 'limit',
  OFFSET: 'offset',
  
  // 필터
  CATEGORY: 'category',
  STATUS: 'status',
  TYPE: 'type',
  
  // 검색
  SEARCH: 'search',
  QUERY: 'query',
  
  // 댓글
  COMMENT_ID: 'commentId',
  PARENT_ID: 'parentId',
  
  // 게임 관련
  THEME: 'theme',
  PLAY_TIME: 'playTime',
  WINNER: 'winner',
} as const;

// ===== Sort Options =====
export const SORT_OPTIONS = {
  RECENT: 'recent',
  LIKES: 'likes',
  POPULAR: 'popular',
  TRENDING: 'trending',
  OLDEST: 'oldest',
  NAME: 'name',
  CREATED_AT: 'created_at',
  UPDATED_AT: 'updated_at',
} as const;

// ===== Order Options =====
export const ORDER_OPTIONS = {
  ASC: 'asc',
  DESC: 'desc',
} as const;

// ===== HTTP Methods =====
export const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  PATCH: 'PATCH',
  DELETE: 'DELETE',
} as const;

// ===== Content Types =====
export const CONTENT_TYPES = {
  JSON: 'application/json',
  FORM_DATA: 'multipart/form-data',
  URL_ENCODED: 'application/x-www-form-urlencoded',
} as const;

// ===== Custom Headers =====
export const CUSTOM_HEADERS = {
  GUEST_SESSION_ID: 'x-guest-session-id',
  AUTH_TOKEN: 'Authorization',
  CONTENT_TYPE: 'Content-Type',
} as const;

// ===== Default Values =====
export const DEFAULT_VALUES = {
  COMMENTS_PER_PAGE: 5,
  ITEMS_PER_PAGE: 12,
  MAX_RETRIES: 3,
  TIMEOUT: 30000,
  CACHE_TTL: 5 * 60 * 1000, // 5분
} as const;

// ===== Error Messages =====
export const ERROR_MESSAGES = {
  NETWORK_ERROR: '네트워크 오류가 발생했습니다.',
  SERVER_ERROR: '서버 오류가 발생했습니다.',
  UNAUTHORIZED: '로그인이 필요합니다.',
  FORBIDDEN: '접근 권한이 없습니다.',
  NOT_FOUND: '요청한 리소스를 찾을 수 없습니다.',
  RATE_LIMITED: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
  VALIDATION_ERROR: '입력값을 확인해주세요.',
  COMMENT_REQUIRED: '댓글 내용을 입력해주세요.',
  GUEST_NAME_REQUIRED: '닉네임을 입력해주세요.',
  CONTENT_TOO_LONG: '내용이 너무 깁니다.',
} as const;

// ===== Success Messages =====
export const SUCCESS_MESSAGES = {
  COMMENT_CREATED: '댓글이 작성되었습니다.',
  COMMENT_UPDATED: '댓글이 수정되었습니다.',
  COMMENT_DELETED: '댓글이 삭제되었습니다.',
  LIKE_ADDED: '좋아요를 눌렀습니다.',
  LIKE_REMOVED: '좋아요를 취소했습니다.',
  BOOKMARK_ADDED: '북마크에 추가되었습니다.',
  BOOKMARK_REMOVED: '북마크에서 제거되었습니다.',
  REPORT_SUBMITTED: '신고가 접수되었습니다.',
  LINK_COPIED: '링크가 클립보드에 복사되었습니다.',
} as const;

// ===== Status Codes =====
export const STATUS_CODES = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

// ===== Helper Functions =====
/**
 * API URL 생성 헬퍼 함수
 */
export function buildApiUrl(
  endpoint: string, 
  queryParams?: Record<string, string | number | boolean>
): string {
  if (!queryParams || Object.keys(queryParams).length === 0) {
    return endpoint;
  }
  
  const params = new URLSearchParams();
  Object.entries(queryParams).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      params.append(key, String(value));
    }
  });
  
  return `${endpoint}?${params.toString()}`;
}

/**
 * 댓글 API URL 생성 헬퍼
 */
export function buildCommentUrl(
  worldcupId: string,
  options?: {
    sortBy?: string;
    limit?: number;
    offset?: number;
  }
): string {
  const baseUrl = WORLDCUP_ENDPOINTS.COMMENTS(worldcupId);
  return buildApiUrl(baseUrl, options);
}