'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface UseDraftRestoreOptions {
  type: 'worldcup_play' | 'worldcup_creation';
  worldcupId?: string;
  autoCheck?: boolean;
}

interface RestoreData {
  id: string;
  created_at: string;
  updated_at: string;
  [key: string]: any;
}

export function useDraftRestore(options: UseDraftRestoreOptions) {
  const { user } = useAuth();
  const { type, worldcupId, autoCheck = true } = options;
  
  const [hasDraft, setHasDraft] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [draftData, setDraftData] = useState<RestoreData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const restoreFunction = useCallback(async (): Promise<RestoreData | null> => {
    // Require authentication for autosave features
    if (!user?.access_token) {
      throw new Error('Authentication required for autosave features');
    }

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${user.access_token}`
    };

    // Build query parameters
    const params = new URLSearchParams({
      type
    });

    if (worldcupId) {
      params.append('worldcupId', worldcupId);
    }

    const response = await fetch(`/api/autosave/restore?${params}`, {
      method: 'GET',
      headers
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Restore failed: ${response.statusText}${errorData.details ? ` - ${errorData.details}` : ''}`);
    }

    const result = await response.json();
    return result.data;
  }, [type, worldcupId, user]);

  const checkForDraft = useCallback(async () => {
    if (isChecking) return;
    
    setIsChecking(true);
    setError(null);
    
    try {
      const draft = await restoreFunction();
      setDraftData(draft);
      setHasDraft(!!draft);
      console.log(draft ? '✅ Draft found' : '📝 No draft found', { type, worldcupId });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Draft check failed';
      setError(errorMessage);
      console.error('Draft check failed:', error);
      setHasDraft(false);
      setDraftData(null);
    } finally {
      setIsChecking(false);
    }
  }, [restoreFunction, type, worldcupId, isChecking]);

  const restoreDraft = useCallback(async (): Promise<RestoreData | null> => {
    setIsRestoring(true);
    setError(null);
    
    try {
      const draft = await restoreFunction();
      setDraftData(draft);
      console.log('✅ Draft restored successfully', { type, draftId: draft?.id });
      return draft;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Draft restore failed';
      setError(errorMessage);
      console.error('Draft restore failed:', error);
      return null;
    } finally {
      setIsRestoring(false);
    }
  }, [restoreFunction, type]);

  const deleteDraft = useCallback(async (): Promise<boolean> => {
    try {
      // Require authentication for autosave features
      if (!user?.access_token) {
        throw new Error('Authentication required for autosave features');
      }

      const headers: Record<string, string> = {
        'Authorization': `Bearer ${user.access_token}`
      };

      const params = new URLSearchParams({ type });
      
      if (worldcupId) {
        params.append('worldcupId', worldcupId);
      }

      const response = await fetch(`/api/autosave/restore?${params}`, {
        method: 'DELETE',
        headers
      });

      if (!response.ok) {
        throw new Error(`Delete failed: ${response.statusText}`);
      }

      setHasDraft(false);
      setDraftData(null);
      console.log('✅ Draft deleted successfully', { type, worldcupId });
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Draft deletion failed';
      setError(errorMessage);
      console.error('Draft deletion failed:', error);
      return false;
    }
  }, [type, worldcupId, user]);

  const refreshDraft = useCallback(() => {
    checkForDraft();
  }, [checkForDraft]);

  // Auto-check for drafts on mount and when dependencies change (only for authenticated users)
  useEffect(() => {
    if (autoCheck && user?.access_token) {
      // Small delay to ensure auth context is ready
      const timer = setTimeout(checkForDraft, 100);
      return () => clearTimeout(timer);
    } else if (autoCheck && user === null) {
      // User is confirmed to be not logged in, reset state
      setHasDraft(false);
      setDraftData(null);
      setError(null);
    }
  }, [autoCheck, checkForDraft, user?.id, user?.access_token, worldcupId]);

  return {
    hasDraft,
    isRestoring,
    isChecking,
    draftData,
    error,
    restoreDraft,
    deleteDraft,
    refreshDraft,
    checkForDraft
  };
}

// Helper to check if user is authenticated
export function isUserAuthenticated(user: any): boolean {
  return !!(user && user.access_token);
}

// Helper to get auth headers
export function getAuthHeaders(user: any): Record<string, string> {
  if (!isUserAuthenticated(user)) {
    throw new Error('Authentication required for autosave features');
  }
  
  return {
    'Authorization': `Bearer ${user.access_token}`,
    'Content-Type': 'application/json'
  };
}