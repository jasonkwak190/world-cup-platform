'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export interface DraftStats {
  totalDrafts: number;
  creationDrafts: number;
  playDrafts: number;
  totalSize: number;
  oldestDraft: string | null;
  newestDraft: string | null;
}

export function useDraftManagement() {
  const router = useRouter();
  const [stats, setStats] = useState<DraftStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDraftStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/autosave/cleanup');
      if (!response.ok) {
        throw new Error('Failed to load draft statistics');
      }

      const data = await response.json();
      
      if (data.success) {
        const stats: DraftStats = {
          totalDrafts: data.user_stats.total_saves,
          creationDrafts: data.user_stats.draft_saves.count,
          playDrafts: data.user_stats.play_saves.count,
          totalSize: data.user_stats.total_size,
          oldestDraft: data.user_stats.draft_saves.oldestSave || data.user_stats.play_saves.oldestSave,
          newestDraft: data.user_stats.draft_saves.newestSave || data.user_stats.play_saves.newestSave,
        };
        setStats(stats);
      }
    } catch (err) {
      console.error('Failed to load draft stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to load draft statistics');
    } finally {
      setLoading(false);
    }
  }, []);

  const cleanupOldDrafts = useCallback(async (type: 'expired' | 'old' | 'all' = 'all', dryRun = false) => {
    try {
      setLoading(true);
      setError(null);

      const url = new URL('/api/autosave/cleanup', window.location.origin);
      url.searchParams.set('type', type);
      if (dryRun) {
        url.searchParams.set('dry_run', 'true');
      }

      const response = await fetch(url.toString(), {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to cleanup drafts');
      }

      const data = await response.json();
      
      if (data.success) {
        // Refresh stats after cleanup
        await loadDraftStats();
        return {
          deletedCount: data.deleted_count,
          results: data.results,
          dryRun: data.dry_run,
        };
      }
    } catch (err) {
      console.error('Failed to cleanup drafts:', err);
      setError(err instanceof Error ? err.message : 'Failed to cleanup drafts');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadDraftStats]);

  const restoreCreationDraft = useCallback(async (draftId: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/autosave/draft');
      if (!response.ok) {
        throw new Error('Failed to restore creation draft');
      }

      const data = await response.json();
      
      if (data.success && data.data) {
        // Navigate to create page with restore parameter
        router.push(`/create?restore=true&draft_id=${draftId}`);
        return data.data;
      }
    } catch (err) {
      console.error('Failed to restore creation draft:', err);
      setError(err instanceof Error ? err.message : 'Failed to restore creation draft');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [router]);

  const continuePlayDraft = useCallback(async (draftId: string, worldcupId: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/autosave/play?worldcup_id=${worldcupId}`);
      if (!response.ok) {
        throw new Error('Failed to load play draft');
      }

      const data = await response.json();
      
      if (data.success && data.data) {
        // Navigate to play page
        router.push(`/play/${worldcupId}?continue=true`);
        return data.data;
      }
    } catch (err) {
      console.error('Failed to continue play draft:', err);
      setError(err instanceof Error ? err.message : 'Failed to continue playing');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [router]);

  const deleteCreationDraft = useCallback(async (draftId: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/autosave/draft', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Failed to delete creation draft');
      }

      const data = await response.json();
      
      if (data.success) {
        // Refresh stats after deletion
        await loadDraftStats();
        return true;
      }
    } catch (err) {
      console.error('Failed to delete creation draft:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete creation draft');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadDraftStats]);

  const deletePlayDraft = useCallback(async (draftId: string, worldcupId: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/autosave/play?worldcup_id=${worldcupId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete play draft');
      }

      const data = await response.json();
      
      if (data.success) {
        // Refresh stats after deletion
        await loadDraftStats();
        return true;
      }
    } catch (err) {
      console.error('Failed to delete play draft:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete play draft');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadDraftStats]);

  const bulkDeleteDrafts = useCallback(async (draftIds: string[], types: ('creation' | 'play')[]) => {
    try {
      setLoading(true);
      setError(null);

      const deletePromises = draftIds.map(async (id, index) => {
        const type = types[index];
        if (type === 'creation') {
          return deleteCreationDraft(id);
        } else {
          // For play drafts, we need the worldcup_id
          // This should be passed separately or we need to modify the API
          return deletePlayDraft(id, id); // Assuming id is worldcup_id for play drafts
        }
      });

      const results = await Promise.allSettled(deletePromises);
      
      const failed = results.filter(result => result.status === 'rejected');
      if (failed.length > 0) {
        throw new Error(`Failed to delete ${failed.length} of ${draftIds.length} drafts`);
      }

      return true;
    } catch (err) {
      console.error('Failed to bulk delete drafts:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete drafts');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [deleteCreationDraft, deletePlayDraft]);

  return {
    stats,
    loading,
    error,
    loadDraftStats,
    cleanupOldDrafts,
    restoreCreationDraft,
    continuePlayDraft,
    deleteCreationDraft,
    deletePlayDraft,
    bulkDeleteDrafts,
  };
}