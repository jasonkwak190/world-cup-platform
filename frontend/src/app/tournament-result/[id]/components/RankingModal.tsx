'use client';

import React, { useState, useEffect } from 'react';
import { Trophy, Crown, Medal, RotateCcw, X } from 'lucide-react';

interface RankingItem {
  id: string;
  name: string;
  image: string;
  rank: number;
  winCount: number;
  winRate: number;
  totalMatches: string;
  appearances: number;
}

interface RankingModalProps {
  isOpen: boolean;
  onClose: () => void;
  worldcupId: string;
}

export default function RankingModal({ isOpen, onClose, worldcupId }: RankingModalProps) {
  const [rankings, setRankings] = useState<RankingItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const fetchRankings = async () => {
    if (!worldcupId) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/worldcups/${worldcupId}/stats`);
      
      if (!response.ok) {
        throw new Error('랭킹 데이터를 불러올 수 없습니다.');
      }

      const data = await response.json();
      
      // Transform API data to match our interface
      const transformedRankings: RankingItem[] = data.items?.map((item: any, index: number) => ({
        id: item.id,
        name: item.name || `아이템 ${index + 1}`,
        image: item.image_url || item.image || '/placeholder-image.jpg',
        rank: index + 1,
        winCount: item.win_count || 0,
        winRate: Math.round(item.win_rate || 0),
        totalMatches: `${item.win_count || 0}승 ${item.loss_count || 0}패`,
        appearances: item.total_appearances || 0
      })) || [];

      setRankings(transformedRankings);
    } catch (err) {
      console.error('Failed to fetch rankings:', err);
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchRankings();
    }
  }, [isOpen, worldcupId]);

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-6 h-6 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-400" />;
    if (rank === 3) return <Medal className="w-6 h-6 text-amber-600" />;
    return null;
  };

  const getRankStyle = (rank: number) => {
    if (rank === 1) return "bg-yellow-50 border-yellow-200";
    if (rank === 2) return "bg-gray-50 border-gray-200";
    if (rank === 3) return "bg-orange-50 border-orange-200";
    return "bg-white border-gray-100";
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-t-lg w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 relative">
          <div className="flex items-center space-x-3">
            <Trophy className="w-8 h-8" />
            <h2 className="text-2xl font-bold">전체 랭킹</h2>
          </div>
          
          <div className="absolute top-4 right-4 flex space-x-2">
            <button
              onClick={fetchRankings}
              disabled={loading}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
              title="새로고침"
            >
              <RotateCcw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <p className="text-blue-100 mt-2">첫번째</p>
        </div>

        {/* Content */}
        <div className="bg-white max-h-[calc(90vh-120px)] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <div className="text-center">
                <RotateCcw className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
                <p className="text-gray-600">랭킹 데이터를 불러오는 중...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center p-12">
              <div className="text-center">
                <p className="text-red-600 mb-4">{error}</p>
                <button
                  onClick={fetchRankings}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  다시 시도
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Table Header */}
              <div className="grid grid-cols-6 gap-4 p-4 bg-gray-50 border-b text-sm font-medium text-gray-700">
                <div className="text-center">순위</div>
                <div>참가자</div>
                <div className="text-center">우승 횟수</div>
                <div className="text-center">승률</div>
                <div className="text-center">전적</div>
                <div className="text-center">등장</div>
              </div>

              {/* Ranking Items */}
              <div className="divide-y divide-gray-100">
                {rankings.map((item) => (
                  <div
                    key={item.id}
                    className={`grid grid-cols-6 gap-4 p-4 items-center transition-colors hover:bg-gray-50 ${getRankStyle(item.rank)} border-l-4`}
                  >
                    {/* Rank */}
                    <div className="text-center">
                      <div className="flex items-center justify-center">
                        {getRankIcon(item.rank) || (
                          <span className="text-lg font-bold text-gray-700">{item.rank}</span>
                        )}
                      </div>
                    </div>

                    {/* Participant */}
                    <div className="flex items-center space-x-3">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-12 h-12 rounded-lg object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder-image.jpg';
                        }}
                      />
                      <span className="font-medium text-gray-900">{item.name}</span>
                    </div>

                    {/* Win Count */}
                    <div className="text-center">
                      <span className="inline-block bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-sm font-medium">
                        {item.winCount}회
                      </span>
                    </div>

                    {/* Win Rate */}
                    <div className="text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <div className="bg-gray-200 rounded-full h-2 w-16">
                          <div
                            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${item.winRate}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-700">{item.winRate}%</span>
                      </div>
                    </div>

                    {/* Match Record */}
                    <div className="text-center text-sm text-gray-600">
                      {item.totalMatches}
                    </div>

                    {/* Appearances */}
                    <div className="text-center text-lg font-bold text-gray-900">
                      {item.appearances}
                    </div>
                  </div>
                ))}
              </div>

              {rankings.length === 0 && !loading && !error && (
                <div className="text-center p-12 text-gray-500">
                  <Trophy className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>아직 랭킹 데이터가 없습니다.</p>
                  <p className="text-sm mt-2">게임을 플레이하면 랭킹이 생성됩니다.</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}