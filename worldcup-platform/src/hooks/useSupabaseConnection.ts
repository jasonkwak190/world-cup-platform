import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export function useSupabaseConnection() {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const testConnection = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // 간단한 연결 테스트
        const startTime = Date.now();
        const { data, error } = await Promise.race([
          supabase.from('worldcups').select('count').limit(1),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Connection timeout')), 5000)
          )
        ]) as any;
        
        const elapsed = Date.now() - startTime;
        console.log(`🔗 Supabase connection test: ${elapsed}ms`);
        
        if (error) {
          throw error;
        }
        
        setIsConnected(true);
      } catch (err: any) {
        console.error('❌ Supabase connection failed:', err);
        setIsConnected(false);
        setError(err.message || 'Connection failed');
      } finally {
        setIsLoading(false);
      }
    };

    testConnection();
  }, []);

  return { isConnected, isLoading, error };
}