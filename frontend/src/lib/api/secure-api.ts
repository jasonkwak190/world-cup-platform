// Secure API Helper with Authentication
// 🔒 SECURITY: All API calls include proper authentication headers

import { createClient } from '@supabase/supabase-js';

// Singleton Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Input validation helper
function validateInput(input: any, fieldName: string): void {
  if (!input || (typeof input === 'string' && input.trim() === '')) {
    throw new Error(`${fieldName} is required and cannot be empty`);
  }
  
  // Basic XSS prevention
  if (typeof input === 'string' && /<script|javascript:|data:/i.test(input)) {
    throw new Error(`${fieldName} contains potentially dangerous content`);
  }
}

// Get authentication headers with current user's token
async function getAuthHeaders(): Promise<Record<string, string>> {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Failed to get auth session:', error);
      throw new Error('Authentication failed');
    }
    
    if (!session?.access_token) {
      throw new Error('No valid authentication token found');
    }
    
    return {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    };
  } catch (error) {
    console.error('Failed to get auth headers:', error);
    throw new Error('Authentication failed');
  }
}

// Secure API call wrapper with authentication and error handling
export async function secureApiCall<T>(
  url: string,
  options: RequestInit = {},
  requireAuth: boolean = true
): Promise<T> {
  try {
    // Input validation
    validateInput(url, 'URL');
    
    // Sanitize URL to prevent SSRF
    if (!url.startsWith('/api/') && !url.startsWith('http://localhost') && !url.startsWith('https://')) {
      throw new Error('Invalid API endpoint');
    }
    
    let headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    // Add authentication headers if required
    if (requireAuth) {
      const authHeaders = await getAuthHeaders();
      headers = { ...headers, ...authHeaders };
    }
    
    // Merge with provided headers
    const finalOptions: RequestInit = {
      ...options,
      headers: {
        ...headers,
        ...(options.headers || {}),
      },
    };
    
    console.log(`🔒 Secure API call: ${options.method || 'GET'} ${url}`);
    
    const response = await fetch(url, finalOptions);
    
    // Enhanced error handling
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch {
        // If we can't parse error JSON, use the basic message
      }
      
      // Don't expose sensitive server errors to client
      if (response.status >= 500) {
        console.error('Server error:', errorMessage);
        throw new Error('Internal server error occurred');
      }
      
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    return data;
    
  } catch (error) {
    // Log error for debugging but don't expose sensitive details
    console.error('Secure API call failed:', {
      url,
      method: options.method || 'GET',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    throw error;
  }
}

// Specific secure API functions for common operations

/**
 * Get user's worldcups with authentication
 */
export async function secureGetUserWorldCups(userId: string): Promise<any[]> {
  validateInput(userId, 'User ID');
  
  const data = await secureApiCall<{ worldcups: any[] }>(
    `/api/worldcups?authorId=${encodeURIComponent(userId)}`,
    { method: 'GET' }
  );
  
  return data.worldcups;
}

/**
 * Get worldcup by ID (may not require auth for public worldcups)
 */
export async function secureGetWorldCupById(id: string, requireAuth: boolean = false): Promise<any> {
  validateInput(id, 'Worldcup ID');
  
  const data = await secureApiCall<{ worldcup: any }>(
    `/api/worldcups/${encodeURIComponent(id)}`,
    { method: 'GET' },
    requireAuth
  );
  
  return data.worldcup;
}

/**
 * Delete worldcup with proper authentication and ownership verification
 */
export async function secureDeleteWorldCup(id: string): Promise<{ 
  success: boolean; 
  filesDeleted: number; 
  storageErrors?: string[]; 
}> {
  validateInput(id, 'Worldcup ID');
  
  // This will verify ownership on the server side
  return await secureApiCall<{ 
    success: boolean; 
    filesDeleted: number; 
    storageErrors?: string[]; 
  }>(
    `/api/worldcups/${encodeURIComponent(id)}/delete`,
    { method: 'DELETE' }
  );
}

/**
 * Update worldcup with proper authentication and ownership verification
 */
export async function secureUpdateWorldCup(id: string, data: any): Promise<void> {
  validateInput(id, 'Worldcup ID');
  validateInput(data, 'Update data');
  
  await secureApiCall<void>(
    `/api/worldcups/${encodeURIComponent(id)}/update`,
    {
      method: 'PUT',
      body: JSON.stringify(data),
    }
  );
}

/**
 * Create new worldcup with authentication
 */
export async function secureCreateWorldCup(data: any): Promise<any> {
  validateInput(data, 'Worldcup data');
  
  return await secureApiCall<any>(
    '/api/worldcups/create',
    {
      method: 'POST',
      body: JSON.stringify(data),
    }
  );
}

/**
 * Get user bookmarks with authentication
 */
export async function secureGetUserBookmarks(userId: string): Promise<string[]> {
  validateInput(userId, 'User ID');
  
  // This would need to be implemented in the backend if it doesn't exist
  const data = await secureApiCall<{ bookmarks: string[] }>(
    `/api/users/${encodeURIComponent(userId)}/bookmarks`,
    { method: 'GET' }
  );
  
  return data.bookmarks;
}

/**
 * Submit a vote for worldcup battle (with optional authentication)
 */
export async function secureSubmitVote(
  worldcupId: string, 
  vote: { winnerId: string; loserId?: string; roundType?: string }
): Promise<void> {
  validateInput(worldcupId, 'Worldcup ID');
  validateInput(vote, 'Vote data');
  
  await secureApiCall<void>(
    `/api/worldcups/${encodeURIComponent(worldcupId)}/vote`,
    {
      method: 'POST',
      body: JSON.stringify(vote),
    },
    false // Don't require auth for voting
  );
}

/**
 * Submit multiple votes in bulk for worldcup battle (with optional authentication)
 */
export async function secureSubmitBulkVotes(
  worldcupId: string, 
  votes: Array<{ winnerId: string; loserId?: string; roundType?: string }>
): Promise<{ successfulVotes: number; failedVotes: number }> {
  validateInput(worldcupId, 'Worldcup ID');
  validateInput(votes, 'Votes data');
  
  if (votes.length === 0) {
    return { successfulVotes: 0, failedVotes: 0 };
  }
  
  const result = await secureApiCall<{ successfulVotes: number; failedVotes: number }>(
    `/api/worldcups/${encodeURIComponent(worldcupId)}/vote-bulk`,
    {
      method: 'POST',
      body: JSON.stringify({ votes }),
    },
    false // Don't require auth for voting
  );
  
  return result;
}

/**
 * Get vote statistics (public data, no auth required)
 */
export async function secureGetVoteStats(worldcupId: string): Promise<any> {
  validateInput(worldcupId, 'Worldcup ID');
  
  return await secureApiCall<any>(
    `/api/worldcups/${encodeURIComponent(worldcupId)}/vote`,
    { method: 'GET' },
    false // Public data
  );
}

/**
 * Get worldcup statistics (public data, no auth required)
 */
export async function secureGetWorldcupStats(worldcupId: string): Promise<any> {
  validateInput(worldcupId, 'Worldcup ID');
  
  return await secureApiCall<any>(
    `/api/worldcups/${encodeURIComponent(worldcupId)}/stats`,
    { method: 'GET' },
    false // Public data
  );
}

/**
 * Update worldcup statistics after game completion (with optional authentication)
 */
export async function secureUpdateWorldcupStats(
  worldcupId: string, 
  data: { matches: any[]; winner: any; sessionToken: string }
): Promise<void> {
  validateInput(worldcupId, 'Worldcup ID');
  validateInput(data, 'Stats data');
  
  await secureApiCall<void>(
    `/api/worldcups/${encodeURIComponent(worldcupId)}/stats`,
    {
      method: 'POST',
      body: JSON.stringify(data),
    },
    false // Allow anonymous stats updates for public worldcups
  );
}

/**
 * Check if current user is authenticated
 */
export async function checkAuthStatus(): Promise<{ isAuthenticated: boolean; user?: any }> {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session) {
      return { isAuthenticated: false };
    }
    
    return { 
      isAuthenticated: true, 
      user: {
        id: session.user.id,
        email: session.user.email,
        username: session.user.user_metadata?.username
      }
    };
  } catch (error) {
    console.error('Auth status check failed:', error);
    return { isAuthenticated: false };
  }
}