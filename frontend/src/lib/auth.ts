import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export interface AuthUser {
  id: string;
  email: string;
  username?: string;
  display_name?: string;
  role?: string;
}

// Helper function to extract user from Authorization header
export async function getUserFromRequest(request: NextRequest): Promise<AuthUser | null> {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Verify the token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return null;
    }

    // Get additional user data from our users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, username, display_name, role')
      .eq('supabase_auth_id', user.id)
      .single();

    if (userError) {
      // If user doesn't exist in our users table, return basic info
      return {
        id: user.id,
        email: user.email || '',
        username: user.user_metadata?.username,
        display_name: user.user_metadata?.display_name,
        role: 'user'
      };
    }

    return {
      id: userData.id,
      email: user.email || '',
      username: userData.username,
      display_name: userData.display_name,
      role: userData.role || 'user'
    };

  } catch (error) {
    console.error('Error getting user from request:', error);
    return null;
  }
}

// Wrapper for API routes that require authentication
export function withAuth(
  handler: (request: NextRequest, user: AuthUser, ...args: any[]) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: any[]): Promise<NextResponse> => {
    const user = await getUserFromRequest(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    return handler(request, user, ...args);
  };
}

// Wrapper for API routes with optional authentication
export function withOptionalAuth(
  request: NextRequest,
  handler: (user: AuthUser | null) => Promise<NextResponse>
): Promise<NextResponse> {
  return new Promise(async (resolve) => {
    const user = await getUserFromRequest(request);
    resolve(await handler(user));
  });
}

// Check if user has required role
export function hasRole(user: AuthUser, requiredRole: string): boolean {
  const roleHierarchy = ['user', 'moderator', 'admin'];
  const userRoleIndex = roleHierarchy.indexOf(user.role || 'user');
  const requiredRoleIndex = roleHierarchy.indexOf(requiredRole);
  
  return userRoleIndex >= requiredRoleIndex;
}

// Wrapper for API routes that require specific role
export function withRole(
  requiredRole: string,
  handler: (request: NextRequest, user: AuthUser, ...args: any[]) => Promise<NextResponse>
) {
  return withAuth(async (request: NextRequest, user: AuthUser, ...args: any[]) => {
    if (!hasRole(user, requiredRole)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    return handler(request, user, ...args);
  });
}