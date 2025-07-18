'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface PlayPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function PlayPage({ params }: PlayPageProps) {
  const router = useRouter();

  useEffect(() => {
    // 토너먼트 선택 화면으로 리다이렉트
    const loadParams = async () => {
      const resolvedParams = await params;
      router.replace(`/tournament-select/${resolvedParams.id}`);
    };
    loadParams();
  }, [params, router]);

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
        <p className="text-white">토너먼트 선택 화면으로 이동 중...</p>
      </div>
    </div>
  );
}