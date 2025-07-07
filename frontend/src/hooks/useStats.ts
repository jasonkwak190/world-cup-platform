import { useState, useEffect } from 'react';
import { OverviewStats, StatsResponse } from '@/types/stats';

interface UseStatsReturn {
  data: OverviewStats | null;
  loading: boolean;
  error: string | null;
  lastUpdated: string | null;
  refetch: () => void;
}

export function useStats(): UseStatsReturn {
  const [data, setData] = useState<OverviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/stats/overview');
      
      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }
      
      const result: StatsResponse = await response.json();
      
      setData(result.data);
      setLastUpdated(result.lastUpdated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return {
    data,
    loading,
    error,
    lastUpdated,
    refetch: fetchStats
  };
}