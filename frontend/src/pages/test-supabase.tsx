'use client';

import { useEffect, useState } from 'react';
import { testConnection } from '@/lib/supabase';

export default function TestSupabase() {
  const [connectionStatus, setConnectionStatus] = useState<string>('테스트 중...');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    async function runTest() {
      try {
        const isConnected = await testConnection();
        if (isConnected) {
          setConnectionStatus('✅ Supabase 연결 성공!');
        } else {
          setConnectionStatus('❌ Supabase 연결 실패');
        }
      } catch (error) {
        setConnectionStatus(`❌ 오류: ${error}`);
      }
    }

    runTest();
  }, [mounted]);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold mb-4">Supabase 연결 테스트</h1>
          <p className="text-lg">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4">Supabase 연결 테스트</h1>
        <p className="text-lg">{connectionStatus}</p>
      </div>
    </div>
  );
}