// 🔒 보안 강화: 입력값 검증 스키마 (Zod)
// Medium 보안 취약점 해결: 입력값 검증 부족

import { z } from 'zod';

// 🔍 공통 검증 규칙
const commonValidation = {
  id: z.string().uuid('올바른 UUID 형식이어야 합니다'),
  email: z.string().email('올바른 이메일 형식이어야 합니다').max(255),
  username: z.string()
    .min(2, '사용자명은 최소 2자 이상이어야 합니다')
    .max(50, '사용자명은 최대 50자까지 가능합니다')
    .regex(/^[a-zA-Z0-9가-힣_-]+$/, '사용자명은 영문, 숫자, 한글, _, - 만 포함할 수 있습니다'),
  title: z.string()
    .min(1, '제목을 입력해주세요')
    .max(100, '제목은 최대 100자까지 가능합니다')
    .trim(),
  description: z.string()
    .max(1000, '설명은 최대 1000자까지 가능합니다')
    .optional(),
  category: z.enum(['entertainment', 'sports', 'food', 'music', 'movie', 'game', 'animal', 'misc'], {
    errorMap: () => ({ message: '유효한 카테고리를 선택해주세요' })
  }),
  url: z.string().url('올바른 URL 형식이어야 합니다').optional().or(z.literal('')),
  imageUrl: z.string()
    .url('올바른 이미지 URL 형식이어야 합니다')
    .regex(/\.(jpg|jpeg|png|gif|webp)$/i, '지원되는 이미지 형식이 아닙니다 (jpg, png, gif, webp)')
    .optional()
};

// 🔒 마이그레이션 API 검증
export const migrationSchema = z.object({
  users: z.array(z.object({
    id: z.string().optional(),
    email: commonValidation.email,
    username: commonValidation.username,
    role: z.enum(['admin', 'user']).default('user')
  })).min(1, '최소 1명의 사용자가 필요합니다').max(1000, '한 번에 최대 1000명까지 마이그레이션 가능합니다'),
  
  worldcups: z.array(z.object({
    title: commonValidation.title,
    description: commonValidation.description,
    category: commonValidation.category,
    author: commonValidation.username, // 작성자 username
    participants: z.number().int().min(0).max(1000000).default(0),
    likes: z.number().int().min(0).max(1000000).default(0),
    comments: z.number().int().min(0).max(1000000).default(0),
    isPublic: z.boolean().default(true),
    items: z.array(z.object({
      title: z.string().min(1, '아이템 제목을 입력해주세요').max(100),
      description: z.string().max(500).optional(),
      imageUrl: commonValidation.imageUrl
    })).min(2, '최소 2개의 아이템이 필요합니다').max(64, '최대 64개의 아이템까지 가능합니다').optional()
  })).optional()
});

// 🔒 월드컵 생성/수정 검증
export const worldcupSchema = z.object({
  title: commonValidation.title,
  description: commonValidation.description,
  category: commonValidation.category,
  is_public: z.boolean().default(true),
  items: z.array(z.object({
    title: z.string().min(1, '아이템 제목을 입력해주세요').max(100),
    description: commonValidation.description,
    image_url: commonValidation.imageUrl,
    order_index: z.number().int().min(0).optional()
  })).min(2, '최소 2개의 아이템이 필요합니다').max(64, '최대 64개의 아이템까지 가능합니다')
});

// 🔒 댓글 생성/수정 검증
export const commentSchema = z.object({
  worldcup_id: commonValidation.id,
  content: z.string()
    .min(1, '댓글 내용을 입력해주세요')
    .max(1000, '댓글은 최대 1000자까지 가능합니다')
    .trim()
    .refine(val => val.length > 0, '공백만 입력할 수 없습니다'),
  parent_id: commonValidation.id.optional(),
  username: commonValidation.username.optional() // 비회원 댓글용
});

// 🔒 사용자 프로필 검증
export const userProfileSchema = z.object({
  username: commonValidation.username,
  email: commonValidation.email.optional(),
  bio: z.string().max(500, '소개는 최대 500자까지 가능합니다').optional(),
  avatar_url: commonValidation.imageUrl.optional()
});

// 🔒 게임 결과 검증
export const gameResultSchema = z.object({
  worldcup_id: commonValidation.id,
  winner_id: commonValidation.id,
  finalist_id: commonValidation.id,
  total_rounds: z.number().int().min(1).max(10, '최대 10라운드까지 가능합니다'),
  bracket_data: z.array(z.object({
    round: z.number().int().min(1),
    matches: z.array(z.object({
      item1_id: commonValidation.id,
      item2_id: commonValidation.id,
      winner_id: commonValidation.id
    }))
  })).optional()
});

// 🔒 페이지네이션 검증
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).max(1000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.enum(['latest', 'popular', 'trending', 'random']).default('latest'),
  category: commonValidation.category.optional()
});

// 🔒 검색 검증
export const searchSchema = z.object({
  q: z.string()
    .min(1, '검색어를 입력해주세요')
    .max(100, '검색어는 최대 100자까지 가능합니다')
    .trim()
    .refine(val => val.length > 0, '공백만 입력할 수 없습니다'),
  category: commonValidation.category.optional(),
  ...paginationSchema.omit({ page: true, limit: true }).shape
});

// 🔒 파일 업로드 검증
export const fileUploadSchema = z.object({
  fileName: z.string()
    .min(1, '파일명을 입력해주세요')
    .max(255, '파일명은 최대 255자까지 가능합니다')
    .regex(/^[^<>:"/\\|?*]+\.(jpg|jpeg|png|gif|webp)$/i, '올바른 이미지 파일명이 아닙니다'),
  fileSize: z.number()
    .int()
    .min(1, '파일 크기가 0입니다')
    .max(10 * 1024 * 1024, '파일 크기는 최대 10MB까지 가능합니다'), // 10MB
  mimeType: z.enum(['image/jpeg', 'image/png', 'image/gif', 'image/webp'], {
    errorMap: () => ({ message: '지원되지 않는 파일 형식입니다 (JPG, PNG, GIF, WebP만 가능)' })
  })
});

// 🔒 관리자 인증 검증
export const adminAuthSchema = z.object({
  token: z.string().min(32, '올바른 관리자 토큰이 아닙니다'),
  action: z.enum(['migration', 'ranking_update', 'user_management', 'system_maintenance'])
});

// 🔍 유틸리티 함수들
export const validateRequest = <T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: string } => {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
      return { success: false, error: errorMessages };
    }
    return { success: false, error: '유효하지 않은 데이터입니다' };
  }
};

export const createValidationMiddleware = <T>(schema: z.ZodSchema<T>) => {
  return (data: unknown) => {
    return validateRequest(schema, data);
  };
};

// 🔒 SQL Injection 방지를 위한 문자열 검증
export const sanitizeString = (input: string): string => {
  return input
    .replace(/[<>]/g, '') // HTML 태그 방지
    .replace(/['"\\]/g, '') // SQL Injection 기본 방지
    .replace(/\b(DROP|DELETE|INSERT|UPDATE|SELECT|UNION|ALTER|CREATE)\b/gi, '') // SQL 키워드 방지
    .trim();
};

// 🔒 XSS 방지를 위한 HTML 이스케이프
export const escapeHtml = (text: string): string => {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
};

export default {
  migration: migrationSchema,
  worldcup: worldcupSchema,
  comment: commentSchema,
  userProfile: userProfileSchema,
  gameResult: gameResultSchema,
  pagination: paginationSchema,
  search: searchSchema,
  fileUpload: fileUploadSchema,
  adminAuth: adminAuthSchema,
  validateRequest,
  createValidationMiddleware,
  sanitizeString,
  escapeHtml
};