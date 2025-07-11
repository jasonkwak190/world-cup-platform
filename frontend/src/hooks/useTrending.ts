'use client';

import { useState, useEffect } from 'react';
import { TrendingWorldCup, TrendingResponse } from '@/types/trending';

interface UseTrendingReturn {
  data: TrendingWorldCup[];
  loading: boolean;
  error: string | null;
  lastUpdated: string | null;
  refetch: () => void;
}

export function useTrending(): UseTrendingReturn {
  const [data, setData] = useState<TrendingWorldCup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const fetchTrending = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/trending');
      
      if (!response.ok) {
        throw new Error('Failed to fetch trending data');
      }
      
      const result: TrendingResponse = await response.json();
      
      setData(result.data);
      setLastUpdated(result.lastUpdated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching trending data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrending();
  }, []);

  return {
    data,
    loading,
    error,
    lastUpdated,
    refetch: fetchTrending
  };
}