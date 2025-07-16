'use client';

import { useState, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface UseActionAutoSaveOptions {
  debounceMs?: number;
  enabled?: boolean;
  onSaveSuccess?: () => void;
  onSaveError?: (error: Error) => void;
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
  const { debounceMs = 500, enabled = true, onSaveSuccess, onSaveError } = options;
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

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
        try {
          await saveFunction(data);
          setSaveStatus('saved');
          setLastSaved(new Date());
          onSaveSuccess?.();
          
          // Reset status to idle after 2 seconds
          setTimeout(() => setSaveStatus('idle'), 2000);
        } catch (error) {
          setSaveStatus('error');
          const errorObj = error instanceof Error ? error : new Error('Save failed');
          console.error('Auto-save failed:', errorObj);
          onSaveError?.(errorObj);
          
          // Reset status to idle after 3 seconds on error
          setTimeout(() => setSaveStatus('idle'), 3000);
        }
      };

      if (immediate) {
        await performSave();
      } else {
        timeout = setTimeout(performSave, debounceMs);
      }
    };
  }, [saveFunction, debounceMs, enabled, onSaveSuccess, onSaveError]);

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
    isEnabled: enabled,
    isSaving: saveStatus === 'saving',
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