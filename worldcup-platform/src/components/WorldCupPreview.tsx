'use client';

import { useState } from 'react';
import { Play, Eye, Share2, Settings, Users, MessageCircle, Heart, Trophy } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface WorldCupItem {
  id: string;
  title: string;
  image: string | File;
  description?: string;
}

interface WorldCupData {
  title: string;
  description: string;
  category: string;
  items: WorldCupItem[];
  isPublic: boolean;
}

interface WorldCupPreviewProps {
  data: WorldCupData;
}

export default function WorldCupPreview({ data }: WorldCupPreviewProps) {
  const router = useRouter();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentMatchItems, setCurrentMatchItems] = useState<[WorldCupItem, WorldCupItem] | null>(null);
  const [round, setRound] = useState(1);

  const getImageUrl = (image: string | File): string => {
    try {
      if (typeof image === 'string') {
        // Validate URL
        if (image.startsWith('http') || image.startsWith('data:')) {
          return image;
        }
        // If it's not a valid URL, return empty string to trigger error handling
        return '';
      }
      return URL.createObjectURL(image);
    } catch (error) {
      console.error('Error creating image URL:', error);
      return '';
    }
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    img.style.display = 'none';
    
    // Create a fallback div if it doesn't exist
    const parent = img.parentElement;
    if (parent && !parent.querySelector('.fallback-placeholder')) {
      const fallback = document.createElement('div');
      fallback.className = 'fallback-placeholder w-full h-full flex items-center justify-center bg-gray-200 text-gray-500';
      fallback.innerHTML = `
        <div class="text-center p-4">
          <div class="text-2xl mb-2">🖼️</div>
          <div class="text-xs">이미지 로딩 실패</div>
        </div>
      `;
      parent.appendChild(fallback);
    }
  };

  const getTournamentSize = () => {
    const itemCount = data.items.length;
    // Find next power of 2
    return Math.pow(2, Math.ceil(Math.log2(itemCount)));
  };

  const getRoundName = (roundNum: number, totalRounds: number) => {
    const remaining = Math.pow(2, totalRounds - roundNum + 1);
    if (remaining === 2) return '결승';
    if (remaining === 4) return '준결승';
    if (remaining === 8) return '8강';
    if (remaining === 16) return '16강';
    if (remaining === 32) return '32강';
    if (remaining === 64) return '64강';
    return `${remaining}강`;
  };

  const startPreview = () => {
    if (data.items.length >= 2) {
      const shuffled = [...data.items].sort(() => Math.random() - 0.5);
      setCurrentMatchItems([shuffled[0], shuffled[1]]);
      setIsPlaying(true);
    }
  };

  const handleChoice = (chosen: WorldCupItem) => {
    // Simulate next match
    const remaining = data.items.filter(item => item.id !== currentMatchItems![0].id && item.id !== currentMatchItems![1].id);
    if (remaining.length >= 2) {
      setCurrentMatchItems([chosen, remaining[0]]);
    } else {
      setIsPlaying(false);
      setCurrentMatchItems(null);
    }
  };

  const handleCreateWorldCup = () => {
    // TODO: Actually create the worldcup
    console.log('Creating worldcup:', data);
    // For now, just navigate to a mock play page
    router.push('/play/new-worldcup');
  };

  const tournamentSize = getTournamentSize();
  const totalRounds = Math.log2(tournamentSize);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <Eye className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          미리보기
        </h2>
        <p className="text-gray-600">
          만든 월드컵을 미리 체험해보고 최종 확인하세요.
        </p>
      </div>

      {/* Preview or Game */}
      {!isPlaying ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Preview */}
          <div className="lg:col-span-2">
            <div className="bg-white border rounded-lg overflow-hidden">
              {/* Card Header */}
              <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-emerald-100 to-blue-100 flex items-center justify-center">
                <div className="text-center p-6">
                  <div className="text-4xl mb-4">🏆</div>
                  <div className="text-gray-800 text-xl font-bold mb-2">
                    {data.title}
                  </div>
                  {data.description && (
                    <div className="text-gray-600 text-sm">
                      {data.description}
                    </div>
                  )}
                </div>
                <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
                  <button
                    onClick={startPreview}
                    className="opacity-0 hover:opacity-100 transition-opacity duration-200 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full p-4"
                  >
                    <Play className="w-8 h-8 ml-1" />
                  </button>
                </div>
              </div>

              {/* Card Content */}
              <div className="p-6">
                <h3 className="font-semibold text-gray-900 mb-2 text-lg">
                  {data.title}
                </h3>
                {data.description && (
                  <p className="text-gray-600 mb-4 line-clamp-2">
                    {data.description}
                  </p>
                )}

                {/* Meta Info */}
                <div className="flex items-center text-sm text-gray-500 mb-4">
                  <span>내가 만든 월드컵</span>
                  <span className="mx-2">·</span>
                  <span>방금 전</span>
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                  <div className="flex items-center space-x-4">
                    <span className="flex items-center">
                      <Play className="w-4 h-4 mr-1" />
                      0
                    </span>
                    <span className="flex items-center">
                      <MessageCircle className="w-4 h-4 mr-1" />
                      0
                    </span>
                  </div>
                  <div className="flex items-center">
                    <Heart className="w-4 h-4 mr-1" />
                    0
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={startPreview}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 px-4 rounded-lg transition-colors font-medium flex items-center justify-center min-h-[40px]"
                  >
                    미리보기
                  </button>
                  <button className="p-2.5 rounded-lg transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50">
                    <Heart className="w-4 h-4" />
                  </button>
                  <button className="p-2.5 rounded-lg transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center text-gray-400 hover:text-blue-500 hover:bg-blue-50">
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Info Panel */}
          <div className="space-y-6">
            {/* Tournament Info */}
            <div className="bg-white border rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                <Settings className="w-5 h-5 mr-2" />
                토너먼트 정보
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">참가 항목</span>
                  <span className="font-medium">{data.items.length}개</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">토너먼트 크기</span>
                  <span className="font-medium">{tournamentSize}강</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">총 라운드</span>
                  <span className="font-medium">{totalRounds}라운드</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">예상 소요시간</span>
                  <span className="font-medium">{Math.ceil(tournamentSize / 4)}분</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">공개 설정</span>
                  <span className="font-medium">{data.isPublic ? '공개' : '비공개'}</span>
                </div>
              </div>
            </div>

            {/* Tournament Bracket */}
            <div className="bg-white border rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                <Trophy className="w-5 h-5 mr-2" />
                토너먼트 진행
              </h3>
              <div className="space-y-2">
                {Array.from({ length: totalRounds }, (_, i) => {
                  const roundNum = i + 1;
                  const roundName = getRoundName(roundNum, totalRounds);
                  const matches = Math.pow(2, totalRounds - roundNum);
                  
                  return (
                    <div key={roundNum} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium">{roundName}</span>
                      <span className="text-xs text-gray-500">{matches}경기</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Game Preview */
        currentMatchItems && (
          <div className="max-w-4xl mx-auto bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 rounded-lg p-8">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-white mb-2">미리보기 모드</h3>
              <p className="text-gray-300">실제 게임과 동일한 방식으로 작동합니다</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {currentMatchItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleChoice(item)}
                  className="group relative aspect-square bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  <img
                    src={getImageUrl(item.image)}
                    alt={item.title}
                    className="w-full h-full object-cover"
                    onError={handleImageError}
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                    <h3 className="text-xl font-bold text-center">{item.title}</h3>
                  </div>
                  <div className="absolute inset-0 border-4 border-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg" />
                </button>
              ))}
            </div>

            <div className="text-center mt-8">
              <button
                onClick={() => setIsPlaying(false)}
                className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                미리보기 종료
              </button>
            </div>
          </div>
        )
      )}

      {/* Items Preview */}
      {!isPlaying && data.items.length > 0 && (
        <div className="bg-white border rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
            <Users className="w-5 h-5 mr-2" />
            등록된 항목 ({data.items.length}개)
          </h3>
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
            {data.items.slice(0, 20).map((item) => (
              <div key={item.id} className="aspect-square group">
                <img
                  src={getImageUrl(item.image)}
                  alt={item.title}
                  className="w-full h-full object-cover rounded-lg"
                  onError={handleImageError}
                  loading="lazy"
                />
              </div>
            ))}
            {data.items.length > 20 && (
              <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                <span className="text-xs text-gray-500 text-center">
                  +{data.items.length - 20}개
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Final Action */}
      {!isPlaying && (
        <div className="text-center">
          <button
            onClick={handleCreateWorldCup}
            className="px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-lg transition-colors"
          >
            🎉 월드컵 만들기 완료
          </button>
          <p className="text-sm text-gray-500 mt-2">
            월드컵이 생성되고 다른 사용자들과 공유할 수 있습니다
          </p>
        </div>
      )}
    </div>
  );
}