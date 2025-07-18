'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme, ThemeType } from '@/contexts/ThemeContext';

interface WorldCupData {
  id: string;
  title: string;
  description: string;
  items: Array<{
    id: string;
    title: string;
    image_url?: string;
  }>;
  creator_name: string;
  created_at: string;
}

interface TournamentOption {
  id: string;
  name: string;
  choices: number;
  rounds: number;
  duration: string;
  description: string;
}

interface UseThemeSelectionReturn {
  worldcupData: WorldCupData | null;
  loading: boolean;
  error: string;
  selectedTournament: string;
  setSelectedTournament: (tournament: string) => void;
  isStarting: boolean;
  handleStartTournament: () => void;
  handleGoHome: () => void;
  getAvailableTournamentOptions: (baseOptions: TournamentOption[]) => TournamentOption[];
}

export function useThemeSelection(worldcupId: string): UseThemeSelectionReturn {
  const router = useRouter();
  const { currentTheme } = useTheme();
  
  const [worldcupData, setWorldcupData] = useState<WorldCupData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [selectedTournament, setSelectedTournament] = useState<string>('16');
  const [isStarting, setIsStarting] = useState(false);

  // 월드컵 데이터 로드
  useEffect(() => {
    const loadWorldcupData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/worldcups/${worldcupId}`);
        
        if (!response.ok) {
          throw new Error('월드컵 데이터를 불러올 수 없습니다.');
        }
        
        const data = await response.json();
        setWorldcupData(data.worldcup);
        
        // 아이템 수에 따라 기본 토너먼트 타입 설정
        const itemCount = data.worldcup.items?.length || 0;
        if (itemCount >= 64) setSelectedTournament('64');
        else if (itemCount >= 32) setSelectedTournament('32');
        else if (itemCount >= 16) setSelectedTournament('16');
        else if (itemCount >= 8) setSelectedTournament('8');
        else setSelectedTournament('4');
        
      } catch (err) {
        console.error('Failed to load worldcup data:', err);
        setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    if (worldcupId) {
      loadWorldcupData();
    }
  }, [worldcupId]);

  // 토너먼트 시작
  const handleStartTournament = async () => {
    if (!selectedTournament || !worldcupData) return;
    
    setIsStarting(true);
    
    try {
      // 선택된 테마와 토너먼트 정보를 URL에 포함하여 게임 시작
      const gameUrl = `/tournament-game/${worldcupId}?theme=${currentTheme}&tournament=${selectedTournament}`;
      
      // 테마별 로딩 시간 설정
      const loadingTime = currentTheme === 'neon' ? 2000 : 
                         currentTheme === 'gaming' ? 2500 : 
                         currentTheme === 'comic' ? 1500 : 1500;
      
      await new Promise(resolve => setTimeout(resolve, loadingTime));
      
      router.push(gameUrl);
    } catch (err) {
      console.error('Failed to start tournament:', err);
      setIsStarting(false);
    }
  };

  // 홈으로 이동
  const handleGoHome = () => {
    router.push('/');
  };

  // 사용 가능한 토너먼트 옵션 필터링
  const getAvailableTournamentOptions = (baseOptions: TournamentOption[]) => {
    if (!baseOptions || !Array.isArray(baseOptions)) return [];
    if (!worldcupData) return baseOptions;
    
    const itemCount = worldcupData.items?.length || 0;
    return baseOptions.filter(option => {
      const choices = parseInt(option.id);
      return choices <= itemCount;
    });
  };

  return {
    worldcupData,
    loading,
    error,
    selectedTournament,
    setSelectedTournament,
    isStarting,
    handleStartTournament,
    handleGoHome,
    getAvailableTournamentOptions
  };
}