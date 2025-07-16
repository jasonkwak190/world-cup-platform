// Client-side API functions for worldcups
// Replaces direct Supabase calls with Next.js API routes

export interface WorldCup {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  author: string;
  createdAt: string;
  participants: number;
  comments: number;
  likes: number;
  category: string;
  isPublic: boolean;
  items?: WorldCupItem[];
}

export interface WorldCupItem {
  id: string;
  title: string;
  description: string;
  mediaType: 'image' | 'video';
  image?: string;
  videoUrl?: string;
  videoId?: string;
  videoStartTime?: number;
  videoEndTime?: number;
  videoThumbnail?: string;
  videoDuration?: number;
  videoMetadata?: any;
}

export interface CreateWorldCupData {
  title: string;
  description?: string;
  category: string;
  isPublic?: boolean;
  thumbnailUrl?: string;
  items: Omit<WorldCupItem, 'id'>[];
}

export interface UpdateWorldCupData {
  title?: string;
  description?: string;
  category?: string;
  isPublic?: boolean;
  thumbnailUrl?: string;
  items?: Omit<WorldCupItem, 'id'>[];
}

export interface ListWorldCupsParams {
  limit?: number;
  offset?: number;
  category?: string;
  sortBy?: 'created_at' | 'participants' | 'likes' | 'comments';
  sortOrder?: 'asc' | 'desc';
  search?: string;
  authorId?: string;
  isPublic?: boolean;
}

export interface WorldCupVote {
  winnerId: string;
  loserId: string;
  roundType?: '16' | '8' | '4' | 'semi' | 'final';
  sessionId?: string;
}

// API response types
export interface ApiResponse<T> {
  success?: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ListWorldCupsResponse {
  worldcups: WorldCup[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
    hasMore: boolean;
  };
}

export interface VoteStatsResponse {
  totalVotes: number;
  itemStats: {
    itemId: string;
    title: string;
    wins: number;
    losses: number;
    totalBattles: number;
    winRate: number;
  }[];
  recentVotes: {
    winnerId: string;
    loserId: string;
    roundType: string;
    votedAt: string;
  }[];
}

// API functions

/**
 * Get list of worldcups with pagination and filters
 */
export async function getWorldCups(params: ListWorldCupsParams = {}): Promise<ListWorldCupsResponse> {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      searchParams.append(key, value.toString());
    }
  });

  const response = await fetch(`/api/worldcups?${searchParams}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch worldcups: ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Get a specific worldcup by ID for playing
 */
export async function getWorldCupById(id: string): Promise<WorldCup> {
  const response = await fetch(`/api/worldcups/${id}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch worldcup: ${response.statusText}`);
  }
  
  const data = await response.json();
  return data.worldcup;
}

/**
 * Create a new worldcup
 */
export async function createWorldCup(data: CreateWorldCupData): Promise<{ id: string; title: string; createdAt: string; itemsCount: number }> {
  const response = await fetch('/api/worldcups/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create worldcup');
  }
  
  const result = await response.json();
  return result.worldcup;
}

/**
 * Update an existing worldcup
 */
export async function updateWorldCup(id: string, data: UpdateWorldCupData): Promise<void> {
  const response = await fetch(`/api/worldcups/${id}/update`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update worldcup');
  }
}

/**
 * Delete a worldcup
 */
export async function deleteWorldCup(id: string): Promise<{ 
  success: boolean; 
  filesDeleted: number; 
  storageErrors?: string[]; 
}> {
  const response = await fetch(`/api/worldcups/${id}/delete`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete worldcup');
  }
  
  const result = await response.json();
  return {
    success: result.success,
    filesDeleted: result.filesDeleted,
    storageErrors: result.storageErrors
  };
}

/**
 * Submit a vote for worldcup battle
 */
export async function submitVote(worldcupId: string, vote: WorldCupVote): Promise<void> {
  const response = await fetch(`/api/worldcups/${worldcupId}/vote`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(vote),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to submit vote');
  }
}

/**
 * Get voting statistics for a worldcup
 */
export async function getVoteStats(worldcupId: string): Promise<VoteStatsResponse> {
  const response = await fetch(`/api/worldcups/${worldcupId}/vote`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch vote stats: ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Update worldcup statistics (participants, likes, etc.)
 */
export async function updateWorldCupStats(
  worldcupId: string, 
  action: 'increment_participants' | 'increment_likes' | 'increment_comments',
  value?: number
): Promise<void> {
  const response = await fetch(`/api/worldcups/${worldcupId}/play`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action, value }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update statistics');
  }
}

/**
 * Get user's worldcups
 */
export async function getUserWorldCups(userId: string): Promise<WorldCup[]> {
  const response = await getWorldCups({ authorId: userId });
  return response.worldcups;
}

/**
 * Error handler for API calls
 */
export class WorldCupApiError extends Error {
  constructor(message: string, public status?: number, public details?: any) {
    super(message);
    this.name = 'WorldCupApiError';
  }
}

/**
 * Generic API call wrapper with error handling
 */
export async function apiCall<T>(
  url: string, 
  options?: RequestInit
): Promise<T> {
  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new WorldCupApiError(
        error.error || `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        error.details
      );
    }
    
    return response.json();
  } catch (error) {
    if (error instanceof WorldCupApiError) {
      throw error;
    }
    
    throw new WorldCupApiError(
      error instanceof Error ? error.message : 'Network error occurred'
    );
  }
}

/**
 * Create a single video worldcup item
 */
export async function createVideoWorldCupItem(
  worldcupId: string,
  videoItem: Omit<WorldCupItem, 'id'> & { mediaType: 'video' },
  orderIndex: number
): Promise<string> {
  const response = await fetch('/api/worldcups/video?action=create-single', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      worldcupId,
      videoItem,
      orderIndex
    }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create video item');
  }
  
  const result = await response.json();
  return result.itemId;
}

/**
 * Create multiple video items in batch
 */
export async function createMultipleVideoItems(
  worldcupId: string,
  videoItems: (Omit<WorldCupItem, 'id'> & { mediaType: 'video' })[]
): Promise<{ 
  successful: string[], 
  failed: Array<{ item: Omit<WorldCupItem, 'id'>, error: string }> 
}> {
  const response = await fetch('/api/worldcups/video?action=create-multiple', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      worldcupId,
      videoItems
    }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create video items');
  }
  
  const result = await response.json();
  return result.result;
}

/**
 * Create mixed media worldcup (images + videos)
 */
export async function createMixedMediaWorldCup(
  title: string,
  description: string,
  category: string,
  authorId: string,
  mediaItems: Omit<WorldCupItem, 'id'>[],
  isPublic: boolean = true
): Promise<{
  worldcupId: string;
  totalItems: number;
  successful: number;
  failed: number;
  errors?: string[];
}> {
  const response = await fetch('/api/worldcups/mixed-media', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title,
      description,
      category,
      authorId,
      mediaItems,
      isPublic
    }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create mixed media worldcup');
  }
  
  const result = await response.json();
  return result.worldcup;
}

/**
 * Update video metadata
 */
export async function updateVideoMetadata(
  itemId: string,
  metadata: Record<string, any>
): Promise<void> {
  const response = await fetch('/api/worldcups/video', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      itemId,
      metadata
    }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update video metadata');
  }
}

// Legacy compatibility functions (to be removed after migration)
export const getWorldCups_Legacy = getWorldCups;
export const getWorldCupById_Legacy = getWorldCupById;
export const updateWorldCupStats_Legacy = updateWorldCupStats;
export const deleteWorldCup_Legacy = deleteWorldCup;