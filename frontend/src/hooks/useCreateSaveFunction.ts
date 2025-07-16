'use client';

import { useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export type SaveType = 'worldcup_play' | 'worldcup_create';

export function useCreateSaveFunction(type: SaveType) {
  const { user } = useAuth();

  const saveFunction = useCallback(async (data: any) => {
    if (!user) {
      console.log('🔒 Skipping save - user not authenticated');
      return { success: false, reason: 'not_authenticated' };
    }

    const endpoint = type === 'worldcup_play' ? '/api/autosave/play' : '/api/autosave/create';
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: user.id,
        data,
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to save: ${response.statusText}`);
    }

    return response.json();
  }, [user, type]);

  return saveFunction;
}