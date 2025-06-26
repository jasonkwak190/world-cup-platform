'use client';

import { useEffect, useState } from 'react';

export default function SimpleTest() {
  const [status, setStatus] = useState('테스트 중...');
  const [details, setDetails] = useState<any>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    async function test() {
      try {
        // 환경변수 확인
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        
        setDetails({
          url: url || '환경변수 없음',
          hasKey: !!key,
          keyLength: key?.length || 0
        });

        if (!url || !key) {
          setStatus('❌ 환경변수가 설정되지 않았습니다');
          return;
        }

        // 간단한 ping 테스트
        const response = await fetch(`${url}/rest/v1/`, {
          headers: {
            'apikey': key,
            'Authorization': `Bearer ${key}`
          }
        });

        if (response.ok) {
          setStatus('✅ Supabase 연결 성공!');
        } else {
          setStatus(`❌ 연결 실패: ${response.status} ${response.statusText}`);
        }

      } catch (error) {
        setStatus(`❌ 오류: ${error.message}`);
      }
    }

    test();
  }, [mounted]);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <h1 className="text-2xl font-bold mb-4">Supabase 연결 테스트</h1>
          <p className="text-lg mb-4">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <h1 className="text-2xl font-bold mb-4">Supabase 연결 테스트</h1>
        <p className="text-lg mb-4">{status}</p>
        
        {details && (
          <div className="bg-gray-50 p-4 rounded text-sm">
            <h3 className="font-bold mb-2">환경변수 상태:</h3>
            <p><strong>URL:</strong> {details.url}</p>
            <p><strong>API Key:</strong> {details.hasKey ? `있음 (${details.keyLength}자)` : '없음'}</p>
          </div>
        )}
      </div>
    </div>
  );
}