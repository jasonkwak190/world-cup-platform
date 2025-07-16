'use client';

import { useState, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { executeWithRetry, RetryConfig } from '@/lib/autosave-retry';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error' | 'retrying';

interface UseActionAutoSaveOptions {
  debounceMs?: number;
  enabled?: boolean;
  onSaveSuccess?: () => void;
  onSaveError?: (error: Error) => void;
  onRetry?: (attempt: number) => void;
  retryConfig?: Partial<RetryConfig>;
}

interface SaveFunction<T> {
  (data: T): Promise<void>;
}

export function useActionAutoSave<T>(
  data: T,
  saveFunction: SaveFunction<T>,
  options: UseActionAutoSaveOptions = {}
) {
  const { user } = useAuth();
  const { 
    debounceMs = 500, 
    enabled = true, 
    onSaveSuccess, 
    onSaveError, 
    onRetry,
    retryConfig = {}
  } = options;
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [retryAttempt, setRetryAttempt] = useState<number>(0);

  const debouncedSave = useMemo(() => {
    let timeout: NodeJS.Timeout | null = null;

    return async (data: T, immediate: boolean = false) => {
      if (!enabled) return;

      // Clear existing timeout
      if (timeout) {
        clearTimeout(timeout);
      }

      const performSave = async () => {
        setSaveStatus('saving');
        setRetryAttempt(0);
        
        try {
          // Execute save with retry logic
          const result = await executeWithRetry(
            () => saveFunction(data),
            'autosave',
            {
              ...retryConfig,
              // Custom retry callback to update UI
              onRetry: (attempt: number) => {
                setSaveStatus('retrying');
                setRetryAttempt(attempt);
                onRetry?.(attempt);
              }
            }
          );

          if (result.success) {
            setSaveStatus('saved');
            setLastSaved(new Date());
            onSaveSuccess?.();
            
            // Reset status to idle after 2 seconds
            setTimeout(() => setSaveStatus('idle'), 2000);
          } else {
            // All retry attempts failed
            setSaveStatus('error');
            const errorObj = result.error || new Error('Save failed after retries');
            console.error(`Auto-save failed after ${result.attempts} attempts:`, errorObj);
            onSaveError?.(errorObj);
            
            // Reset status to idle after 5 seconds on error
            setTimeout(() => setSaveStatus('idle'), 5000);
          }
        } catch (error) {
          // Unexpected error outside retry logic
          const errorObj = error instanceof Error ? error : new Error('Save failed');
          
          // Don't show error status for authentication issues
          if (errorObj.message.includes('not authenticated') || errorObj.message.includes('Authentication required')) {
            console.log('🔒 Auto-save skipped - authentication required');
            setSaveStatus('idle');
          } else {
            setSaveStatus('error');
            console.error('Auto-save failed unexpectedly:', errorObj);
            onSaveError?.(errorObj);
            
            // Reset status to idle after 3 seconds on error
            setTimeout(() => setSaveStatus('idle'), 3000);
          }
        }
      };

      if (immediate) {
        await performSave();
      } else {
        timeout = setTimeout(performSave, debounceMs);
      }
    };
  }, [saveFunction, debounceMs, enabled, onSaveSuccess, onSaveError, onRetry, retryConfig]);

  const triggerSave = useCallback((immediate: boolean = false) => {
    if (data && enabled) {
      debouncedSave(data, immediate);
    }
  }, [data, enabled, debouncedSave]);

  const manualSave = useCallback(() => {
    triggerSave(true); // Force immediate save
  }, [triggerSave]);

  return {
    triggerSave,
    manualSave,
    saveStatus,
    lastSaved,
    retryAttempt,
    isEnabled: enabled,
    isSaving: saveStatus === 'saving',
    isRetrying: saveStatus === 'retrying',
    hasError: saveStatus === 'error',
    user
  };
}

// Helper hook for creating save functions
export function useCreateSaveFunction(type: 'worldcup_play' | 'worldcup_creation') {
  const { user } = useAuth();

  return useCallback(async (data: any) => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    // Add auth header if user is logged in
    if (user?.access_token) {
      headers['Authorization'] = `Bearer ${user.access_token}`;
    }

    const response = await fetch('/api/autosave/save', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        type,
        data,
        action: 'auto_save'
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Save failed: ${response.statusText}${errorData.details ? ` - ${errorData.details}` : ''}`);
    }

    const result = await response.json();
    console.log('✅ Action-based save successful:', result.message);
  }, [type, user]);
}