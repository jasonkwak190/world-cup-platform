'use client';

import { useState } from 'react';
import Link from 'next/link';
import { tournamentResult } from './data.tsx';
import { Trophy } from 'lucide-react';

export default function TournamentResultPage() {
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);

  const designStyles = [
    {
      id: 'neon',
      name: '네온 사이버 스타일',
      description: '미래적인 네온 디자인의 토너먼트 결과 UI',
      bgClass: 'bg-gradient-to-br from-purple-900 via-pink-900 to-blue-900',
      textClass: 'text-cyan-400',
      path: '/tournament-result/neon'
    },
    {
      id: 'paper',
      name: '종이 찢기 스타일',
      description: '아날로그 감성의 종이 디자인 토너먼트 결과 UI',
      bgClass: 'bg-amber-50',
      textClass: 'text-amber-800',
      path: '/tournament-result/paper'
    },
    {
      id: 'comic',
      name: '만화책 스타일',
      description: '팝아트 감성의 만화책 디자인 토너먼트 결과 UI',
      bgClass: 'bg-gradient-to-b from-blue-100 to-purple-100',
      textClass: 'text-purple-800',
      path: '/tournament-result/comic'
    },
    {
      id: 'minimal',
      name: '미니멀 엘레강스',
      description: '세련되고 심플한 미니멀 디자인 토너먼트 결과 UI',
      bgClass: 'bg-white',
      textClass: 'text-gray-800',
      path: '/tournament-result/minimal'
    },
    {
      id: 'gaming',
      name: '게이밍 RGB 스타일',
      description: '화려한 게이밍 RGB 디자인의 토너먼트 결과 UI',
      bgClass: 'bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900',
      textClass: 'text-white',
      path: '/tournament-result/gaming'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">토너먼트 결과 디자인</h1>
          <p className="text-gray-600">5가지 독창적인 토너먼트 결과 UI 디자인</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-12">
          {designStyles.map((style) => (
            <div
              key={style.id}
              className={`cursor-pointer transition-all duration-300 rounded-xl overflow-hidden shadow-lg ${
                selectedStyle === style.id ? 'ring-4 ring-blue-500 scale-105' : 'hover:scale-102'
              }`}
              onClick={() => setSelectedStyle(style.id)}
            >
              <div className={`${style.bgClass} p-6 h-48 flex flex-col justify-between`}>
                <div className={`${style.textClass} font-bold text-xl mb-2`}>{style.name}</div>
                <div className="text-white text-sm">{style.description}</div>
              </div>
              <div className="bg-white p-4">
                <Link 
                  href={style.path}
                  className="block w-full py-2 px-4 bg-blue-500 hover:bg-blue-600 text-white text-center rounded-lg transition-colors"
                >
                  디자인 보기
                </Link>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white p-8 rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">토너먼트 결과 정보</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div className="bg-gray-50 p-6 rounded-xl">
              <div className="flex items-center gap-3 mb-4">
                <Trophy className="w-6 h-6 text-yellow-500" />
                <h3 className="text-xl font-bold text-gray-800">우승자 정보</h3>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">이름:</span>
                  <span className="font-medium text-gray-900">{tournamentResult.winner.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">설명:</span>
                  <span className="font-medium text-gray-900">{tournamentResult.winner.subtitle}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">득표수:</span>
                  <span className="font-medium text-gray-900">{tournamentResult.winner.votes}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">승률:</span>
                  <span className="font-medium text-gray-900">{tournamentResult.winner.winRate}%</span>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 p-6 rounded-xl">
              <div className="flex items-center gap-3 mb-4">
                <Trophy className="w-6 h-6 text-blue-500" />
                <h3 className="text-xl font-bold text-gray-800">토너먼트 정보</h3>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">타입:</span>
                  <span className="font-medium text-gray-900">{tournamentResult.tournament.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">참가자 수:</span>
                  <span className="font-medium text-gray-900">{tournamentResult.tournament.totalParticipants}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">플레이 시간:</span>
                  <span className="font-medium text-gray-900">{tournamentResult.tournament.playTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">총 투표수:</span>
                  <span className="font-medium text-gray-900">{tournamentResult.tournament.totalVotes}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">카테고리:</span>
                  <span className="font-medium text-gray-900">{tournamentResult.tournament.category}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center mt-12">
          <p className="text-gray-600 mb-6 text-lg">5가지 독창적인 디자인으로 다양한 사용자 경험을 제공합니다</p>
          <div className="flex flex-wrap justify-center gap-3">
            <span className="px-4 py-2 bg-purple-100 text-purple-800 rounded-lg text-sm font-medium">네온 사이버</span>
            <span className="px-4 py-2 bg-amber-100 text-amber-800 rounded-lg text-sm font-medium">종이 찢기</span>
            <span className="px-4 py-2 bg-blue-100 text-blue-800 rounded-lg text-sm font-medium">만화책</span>
            <span className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg text-sm font-medium">미니멀</span>
            <span className="px-4 py-2 bg-gradient-to-r from-red-100 to-purple-100 text-gray-800 rounded-lg text-sm font-medium">게이밍 RGB</span>
          </div>
        </div>
      </div>
    </div>
  );
}