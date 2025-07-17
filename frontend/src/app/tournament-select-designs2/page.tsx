'use client';

import { useState } from 'react';
import Link from 'next/link';
import { tournamentOptions } from './data.tsx';

export default function TournamentSelectDesigns2Page() {
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);

  const designStyles = [
    {
      id: 'neon',
      name: '네온 사이버 스타일',
      description: '미래적인 네온 디자인의 토너먼트 선택 UI',
      bgClass: 'bg-gradient-to-br from-purple-900 via-pink-900 to-blue-900',
      textClass: 'text-cyan-400',
      path: '/tournament-select-designs2/neon'
    },
    {
      id: 'paper',
      name: '종이 찢기 스타일',
      description: '아날로그 감성의 종이 디자인 토너먼트 선택 UI',
      bgClass: 'bg-amber-50',
      textClass: 'text-amber-800',
      path: '/tournament-select-designs2/paper'
    },
    {
      id: 'comic',
      name: '만화책 스타일',
      description: '팝아트 감성의 만화책 디자인 토너먼트 선택 UI',
      bgClass: 'bg-gradient-to-b from-blue-100 to-purple-100',
      textClass: 'text-purple-800',
      path: '/tournament-select-designs2/comic'
    },
    {
      id: 'minimal',
      name: '미니멀 엘레강스',
      description: '세련되고 심플한 미니멀 디자인 토너먼트 선택 UI',
      bgClass: 'bg-white',
      textClass: 'text-gray-800',
      path: '/tournament-select-designs2/minimal'
    },
    {
      id: 'gaming',
      name: '게이밍 RGB 스타일',
      description: '화려한 게이밍 RGB 디자인의 토너먼트 선택 UI',
      bgClass: 'bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900',
      textClass: 'text-white',
      path: '/tournament-select-designs2/gaming'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">토너먼트 선택 디자인</h1>
          <p className="text-gray-600">5가지 독창적인 토너먼트 선택 UI 디자인</p>
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
          <h2 className="text-2xl font-bold text-gray-800 mb-4">토너먼트 옵션 정보</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead>
                <tr>
                  <th className="py-3 px-4 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    토너먼트
                  </th>
                  <th className="py-3 px-4 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    선택지 수
                  </th>
                  <th className="py-3 px-4 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    라운드 수
                  </th>
                  <th className="py-3 px-4 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    소요 시간
                  </th>
                  <th className="py-3 px-4 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    분위기
                  </th>
                  <th className="py-3 px-4 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    설명
                  </th>
                </tr>
              </thead>
              <tbody>
                {tournamentOptions.map((option) => (
                  <tr key={option.id}>
                    <td className="py-4 px-4 border-b border-gray-200">
                      <div className="flex items-center">
                        <div className="mr-3">{option.icon}</div>
                        <div className="font-medium text-gray-900">{option.name}</div>
                      </div>
                    </td>
                    <td className="py-4 px-4 border-b border-gray-200 text-gray-700">
                      {option.choices}
                    </td>
                    <td className="py-4 px-4 border-b border-gray-200 text-gray-700">
                      {option.rounds}
                    </td>
                    <td className="py-4 px-4 border-b border-gray-200 text-gray-700">
                      {option.duration}
                    </td>
                    <td className="py-4 px-4 border-b border-gray-200 text-gray-700">
                      {option.vibe}
                    </td>
                    <td className="py-4 px-4 border-b border-gray-200 text-gray-700">
                      {option.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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