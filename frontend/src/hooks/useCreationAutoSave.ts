'use client';

import { useEffect, useCallback } from 'react';
import { useActionAutoSave, useCreateSaveFunction } from './useActionAutoSave';
import { useDraftRestore, isUserAuthenticated } from './useDraftRestore';
import { useAuth } from '@/contexts/AuthContext';

interface WorldCupCreationData {
  title?: string;
  description?: string;
  category?: string;
  items?: Array<{
    id: string;
    name: string;
    image?: string;
  }>;
  settings?: Record<string, any>;
  image_files?: string[];
}

interface UseCreationAutoSaveOptions {
  creationData: WorldCupCreationData | null;
  enabled?: boolean;
  onSaveSuccess?: () => void;
  onSaveError?: (error: Error) => void;
  onRestoreSuccess?: (data: any) => void;
}

export function useCreationAutoSave(options: UseCreationAutoSaveOptions) {
  const { 
    creationData, 
    enabled = true, 
    onSaveSuccess, 
    onSaveError, 
    onRestoreSuccess 
  } = options;
  
  const { user } = useAuth();
  const isAuthenticated = isUserAuthenticated(user);

  // Create save function
  const saveFunction = useCreateSaveFunction('worldcup_creation');

  // Auto-save hook (only for authenticated users)
  const autoSave = useActionAutoSave(
    creationData,
    saveFunction,
    {
      enabled: enabled && isAuthenticated && !!creationData,
      debounceMs: 500, // Moderate debounce for creation actions
      onSaveSuccess: () => {
        console.log('🎨 Creation draft saved successfully');
        onSaveSuccess?.();
      },
      onSaveError: (error) => {
        console.error('🎨 Creation draft save failed:', error);
        onSaveError?.(error);
      }
    }
  );

  // Draft restore hook (only for authenticated users)
  const draftRestore = useDraftRestore({
    type: 'worldcup_creation',
    autoCheck: enabled && isAuthenticated
  });

  // Action-based save triggers
  const saveOnAction = useCallback((action: 'text_updated' | 'item_added' | 'item_removed' | 'image_uploaded' | 'settings_changed' | 'manual_save') => {
    if (!isAuthenticated) {
      console.log('🎨 Creation autosave skipped - user not authenticated');
      return;
    }
    
    console.log(`🎨 Triggering creation autosave on action: ${action}`);
    
    // Immediate save for important actions
    const immediateSaveActions = ['image_uploaded', 'manual_save'];
    autoSave.triggerSave(immediateSaveActions.includes(action));
  }, [autoSave, isAuthenticated]);

  // Manual save function
  const saveCreation = useCallback(() => {
    if (!isAuthenticated) {
      console.log('🎨 Manual creation save skipped - user not authenticated');
      return;
    }
    console.log('🎨 Manual creation save triggered');
    autoSave.manualSave();
  }, [autoSave, isAuthenticated]);

  // Restore draft function
  const restoreDraft = useCallback(async () => {
    console.log('🎨 Attempting to restore creation draft');
    const restored = await draftRestore.restoreDraft();
    if (restored && onRestoreSuccess) {
      onRestoreSuccess(restored);
    }
    return restored;
  }, [draftRestore, onRestoreSuccess]);

  // Delete draft when worldcup is published
  const deleteDraftOnPublish = useCallback(async () => {
    console.log('🎨 WorldCup published, deleting creation draft');
    await draftRestore.deleteDraft();
  }, [draftRestore]);

  // Save on page unload (only for authenticated users)
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (isAuthenticated && creationData) {
        console.log('🎨 Page unload detected, triggering final creation save');
        saveCreation();
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', handleBeforeUnload);
      return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }
  }, [creationData, saveCreation, isAuthenticated]);

  return {
    // Auto-save status
    saveStatus: autoSave.saveStatus,
    lastSaved: autoSave.lastSaved,
    isSaving: autoSave.isSaving,
    hasError: autoSave.hasError,
    
    // Manual controls
    saveCreation,
    saveOnAction,
    
    // Restore functionality
    hasDraft: draftRestore.hasDraft,
    isRestoring: draftRestore.isRestoring,
    restoreDraft,
    draftData: draftRestore.draftData,
    
    // Cleanup
    deleteDraft: draftRestore.deleteDraft,
    deleteDraftOnPublish,
    refreshDraft: draftRestore.refreshDraft,
    
    // Combined status
    isEnabled: autoSave.isEnabled && isAuthenticated,
    isAuthenticated,
    error: draftRestore.error || (autoSave.hasError ? 'Save failed' : null)
  };
}

// Helper function to convert form data to save format
export function convertFormDataToSaveFormat(formData: any): WorldCupCreationData {
  return {
    title: formData.title || '',
    description: formData.description || '',
    category: formData.category || 'entertainment',
    items: formData.items?.map((item: any) => ({
      id: item.id || `item_${Date.now()}_${Math.random()}`,
      name: item.name || item.title || '',
      image: item.image || item.image_url || ''
    })) || [],
    settings: {
      tournament_size: formData.tournament_size || 16,
      is_public: formData.is_public !== false,
      ...formData.settings
    },
    image_files: formData.image_files || []
  };
}

// Helper function to convert save data back to form format
export function convertSaveDataToFormFormat(saveData: any): any {
  return {
    title: saveData.title || '',
    description: saveData.description || '',
    category: saveData.category || 'entertainment',
    items: saveData.items || [],
    tournament_size: saveData.settings?.tournament_size || 16,
    is_public: saveData.settings?.is_public !== false,
    settings: saveData.settings || {},
    image_files: saveData.image_files || []
  };
}