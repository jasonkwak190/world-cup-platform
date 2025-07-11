'use client';

import { useState, useEffect } from 'react';
import { RecentComment, RecentCommentsResponse } from '@/app/api/comments/recent/route';

interface UseRecentCommentsReturn {
  data: RecentComment[];
  loading: boolean;
  error: string | null;
  lastUpdated: string | null;
  refetch: () => void;
}

export function useRecentComments(): UseRecentCommentsReturn {
  const [data, setData] = useState<RecentComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const fetchRecentComments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/comments/recent');
      
      if (!response.ok) {
        throw new Error('Failed to fetch recent comments');
      }
      
      const result: RecentCommentsResponse = await response.json();
      
      setData(result.data);
      setLastUpdated(result.lastUpdated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching recent comments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecentComments();
  }, []);

  return {
    data,
    loading,
    error,
    lastUpdated,
    refetch: fetchRecentComments
  };
}