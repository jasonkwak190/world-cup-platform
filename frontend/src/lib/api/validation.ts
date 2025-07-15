// Enhanced validation and error handling for API routes
import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';

// Enhanced validation schemas
export const schemas = {
  // WorldCup creation and updates
  worldcup: z.object({
    title: z.string()
      .min(1, 'Title is required')
      .max(100, 'Title must be less than 100 characters')
      .regex(/^[^<>]*$/, 'Title cannot contain HTML characters'),
    description: z.string()
      .max(1000, 'Description must be less than 1000 characters')
      .optional(),
    category: z.enum(['entertainment', 'sports', 'food', 'games', 'anime', 'movies', 'music', 'other'], {
      errorMap: () => ({ message: 'Invalid category' })
    }),
    isPublic: z.boolean().default(true),
    thumbnailUrl: z.string().url('Invalid thumbnail URL').optional(),
  }),

  // WorldCup items
  worldcupItem: z.object({
    title: z.string()
      .min(1, 'Item title is required')
      .max(100, 'Item title must be less than 100 characters')
      .regex(/^[^<>]*$/, 'Item title cannot contain HTML characters'),
    description: z.string()
      .max(500, 'Item description must be less than 500 characters')
      .optional(),
    mediaType: z.enum(['image', 'video']).default('image'),
    imageUrl: z.string().url('Invalid image URL').optional(),
    videoUrl: z.string().url('Invalid video URL').optional(),
    videoId: z.string().optional(),
    videoStartTime: z.number().min(0).optional(),
    videoEndTime: z.number().min(0).optional(),
    videoThumbnail: z.string().url('Invalid video thumbnail URL').optional(),
    videoDuration: z.number().min(0).optional(),
    videoMetadata: z.any().optional(),
    orderIndex: z.number().min(0).optional()
  }).refine(
    (data) => {
      if (data.mediaType === 'image' && !data.imageUrl) {
        return false;
      }
      if (data.mediaType === 'video' && !data.videoUrl) {
        return false;
      }
      return true;
    },
    {
      message: 'Image items must have imageUrl, video items must have videoUrl',
      path: ['mediaType']
    }
  ),

  // Create WorldCup request
  createWorldCup: z.object({
    title: z.string().min(1).max(100),
    description: z.string().max(1000).optional(),
    category: z.string().min(1).max(50),
    isPublic: z.boolean().default(true),
    thumbnailUrl: z.string().url().optional(),
    items: z.array(z.object({
      title: z.string().min(1).max(100),
      description: z.string().max(500).optional(),
      mediaType: z.enum(['image', 'video']).default('image'),
      imageUrl: z.string().url().optional(),
      videoUrl: z.string().url().optional(),
      videoId: z.string().optional(),
      videoStartTime: z.number().optional(),
      videoEndTime: z.number().optional(),
      videoThumbnail: z.string().url().optional(),
      videoDuration: z.number().optional(),
      videoMetadata: z.any().optional(),
      orderIndex: z.number().optional()
    })).min(2, 'At least 2 items are required').max(100, 'Maximum 100 items allowed')
  }),

  // Update WorldCup request
  updateWorldCup: z.object({
    title: z.string().min(1).max(100).optional(),
    description: z.string().max(1000).optional(),
    category: z.string().min(1).max(50).optional(),
    isPublic: z.boolean().optional(),
    thumbnailUrl: z.string().url().optional(),
    items: z.array(z.object({
      id: z.string().optional(),
      title: z.string().min(1).max(100),
      description: z.string().max(500).optional(),
      mediaType: z.enum(['image', 'video']).default('image'),
      imageUrl: z.string().url().optional(),
      videoUrl: z.string().url().optional(),
      videoId: z.string().optional(),
      videoStartTime: z.number().optional(),
      videoEndTime: z.number().optional(),
      videoThumbnail: z.string().url().optional(),
      videoDuration: z.number().optional(),
      videoMetadata: z.any().optional(),
      orderIndex: z.number().optional()
    })).min(2).max(100).optional()
  }),

  // List query parameters
  listQuery: z.object({
    limit: z.coerce.number().min(1).max(50).default(12),
    offset: z.coerce.number().min(0).default(0),
    category: z.string().optional(),
    sortBy: z.enum(['created_at', 'participants', 'likes', 'comments']).default('created_at'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
    search: z.string().max(100).optional(),
    authorId: z.string().uuid().optional(),
    isPublic: z.coerce.boolean().default(true)
  }),

  // Vote submission
  vote: z.object({
    winnerId: z.string().uuid('Invalid winner ID'),
    loserId: z.string().uuid('Invalid loser ID'),
    roundType: z.enum(['16', '8', '4', 'semi', 'final']).optional(),
    sessionId: z.string().optional()
  }).refine(
    (data) => data.winnerId !== data.loserId,
    {
      message: 'Winner and loser cannot be the same item',
      path: ['winnerId']
    }
  ),

  // Stats update
  statsUpdate: z.object({
    action: z.enum(['increment_participants', 'increment_likes', 'increment_comments']),
    value: z.number().min(1).max(1000).optional()
  }),

  // UUID validation
  uuid: z.string().uuid('Invalid UUID format'),

  // Pagination
  pagination: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),
    search: z.string().optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).default('desc')
  })
};

// Enhanced error types
export class ValidationError extends Error {
  constructor(
    message: string,
    public field?: string,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends Error {
  constructor(message: string = 'Authentication required') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends Error {
  constructor(message: string = 'Access denied') {
    super(message);
    this.name = 'AuthorizationError';
  }
}

export class RateLimitError extends Error {
  constructor(
    message: string = 'Rate limit exceeded',
    public retryAfter?: number
  ) {
    super(message);
    this.name = 'RateLimitError';
  }
}

export class DatabaseError extends Error {
  constructor(
    message: string,
    public originalError?: any,
    public query?: string
  ) {
    super(message);
    this.name = 'DatabaseError';
  }
}

// Enhanced validation function
export function validateData<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  context?: string
): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      const field = firstError.path.join('.');
      const message = context 
        ? `${context}: ${firstError.message}`
        : firstError.message;
      
      throw new ValidationError(message, field, firstError.code, error.errors);
    }
    throw error;
  }
}

// Enhanced error response creator
export function createErrorResponse(
  error: Error,
  context?: string
): NextResponse {
  // Log error for debugging
  console.error(`API Error${context ? ` (${context})` : ''}:`, {
    name: error.name,
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString()
  });

  // Determine response based on error type
  if (error instanceof ValidationError) {
    return NextResponse.json({
      error: 'Validation Error',
      message: error.message,
      field: error.field,
      code: error.code,
      details: error.details
    }, { status: 400 });
  }

  if (error instanceof AuthenticationError) {
    return NextResponse.json({
      error: 'Authentication Error',
      message: error.message
    }, { status: 401 });
  }

  if (error instanceof AuthorizationError) {
    return NextResponse.json({
      error: 'Authorization Error',
      message: error.message
    }, { status: 403 });
  }

  if (error instanceof RateLimitError) {
    const headers = new Headers({
      'Content-Type': 'application/json'
    });
    
    if (error.retryAfter) {
      headers.set('Retry-After', error.retryAfter.toString());
    }

    return NextResponse.json({
      error: 'Rate Limit Error',
      message: error.message,
      retryAfter: error.retryAfter
    }, { status: 429, headers });
  }

  if (error instanceof DatabaseError) {
    return NextResponse.json({
      error: 'Database Error',
      message: 'A database error occurred',
      // Don't expose internal database details in production
      details: process.env.NODE_ENV === 'development' ? error.originalError : undefined
    }, { status: 500 });
  }

  // Generic error handling
  return NextResponse.json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' 
      ? error.message 
      : 'An internal server error occurred'
  }, { status: 500 });
}

// API route wrapper with error handling
export function withErrorHandling(
  handler: (request: NextRequest, context?: any) => Promise<NextResponse>
) {
  return async (request: NextRequest, context?: any): Promise<NextResponse> => {
    try {
      return await handler(request, context);
    } catch (error) {
      return createErrorResponse(error instanceof Error ? error : new Error('Unknown error'));
    }
  };
}

// Request validation middleware
export function validateRequest<T>(
  schema: z.ZodSchema<T>,
  getDataFromRequest: (request: NextRequest) => Promise<unknown> | unknown
) {
  return async (request: NextRequest): Promise<T> => {
    try {
      const data = await getDataFromRequest(request);
      return validateData(schema, data, 'Request validation');
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new ValidationError('Invalid request format');
    }
  };
}

// Query parameter validation
export function validateQuery<T>(
  schema: z.ZodSchema<T>,
  request: NextRequest
): T {
  const { searchParams } = new URL(request.url);
  const params = Object.fromEntries(searchParams.entries());
  
  return validateData(schema, params, 'Query parameters');
}

// Path parameter validation
export function validatePathParam(
  param: string,
  schema: z.ZodSchema<any> = schemas.uuid
): any {
  return validateData(schema, param, 'Path parameter');
}

// Sanitization helpers
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove HTML characters
    .replace(/['"]/g, '') // Remove quotes
    .trim();
}

export function sanitizeHtml(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

// Rate limiting helpers
export function extractClientId(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfIp = request.headers.get('cf-connecting-ip');
  
  return cfIp || realIp || forwarded?.split(',')[0] || 'unknown';
}

// Security headers
export function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  return response;
}

// Success response creator
export function createSuccessResponse<T>(
  data: T,
  message?: string,
  status: number = 200
): NextResponse {
  const response = NextResponse.json({
    success: true,
    data,
    message,
    timestamp: new Date().toISOString()
  }, { status });

  return addSecurityHeaders(response);
}

// Comprehensive validation for complete API routes
export function validateCompleteRequest<TBody, TQuery, TParams>(
  bodySchema?: z.ZodSchema<TBody>,
  querySchema?: z.ZodSchema<TQuery>,
  paramsSchema?: z.ZodSchema<TParams>
) {
  return async (
    request: NextRequest,
    params?: any
  ): Promise<{
    body?: TBody;
    query?: TQuery;
    params?: TParams;
  }> => {
    const result: any = {};

    // Validate body
    if (bodySchema) {
      try {
        const body = await request.json();
        result.body = validateData(bodySchema, body, 'Request body');
      } catch (error) {
        throw new ValidationError('Invalid request body format');
      }
    }

    // Validate query
    if (querySchema) {
      result.query = validateQuery(querySchema, request);
    }

    // Validate params
    if (paramsSchema && params) {
      result.params = validateData(paramsSchema, params, 'URL parameters');
    }

    return result;
  };
}