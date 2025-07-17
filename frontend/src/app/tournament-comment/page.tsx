'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function TournamentCommentPage() {
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);

  const commentStyles = [
    {
      id: 'chat',
      name: '채팅 스타일',
      description: '실시간 채팅 느낌의 댓글 UI',
      bgClass: 'bg-gradient-to-b from-orange-50 to-yellow-50',
      textClass: 'text-orange-800',
      path: '/tournament-comment/chat'
    },
    {
      id: 'comic',
      name: '만화책 스타일',
      description: '팝아트 감성의 만화책 디자인 댓글 UI',
      bgClass: 'bg-gradient-to-b from-blue-100 to-purple-100',
      textClass: 'text-purple-800',
      path: '/tournament-comment/comic'
    },
    {
      id: 'gaming',
      name: '게이밍 RGB 스타일',
      description: '화려한 게이밍 RGB 디자인의 댓글 UI',
      bgClass: 'bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900',
      textClass: 'text-white',
      path: '/tournament-comment/gaming'
    },
    {
      id: 'minimal',
      name: '미니멀 엘레강스',
      description: '세련되고 심플한 미니멀 디자인의 댓글 UI',
      bgClass: 'bg-white',
      textClass: 'text-gray-800',
      path: '/tournament-comment/minimal'
    },
    {
      id: 'neon',
      name: '네온 사이버 스타일',
      description: '미래적인 네온 디자인의 댓글 UI',
      bgClass: 'bg-black',
      textClass: 'text-cyan-400',
      path: '/tournament-comment/neon'
    },
    {
      id: 'paper',
      name: '종이 찢기 스타일',
      description: '아날로그 감성의 종이 디자인 댓글 UI',
      bgClass: 'bg-amber-50',
      textClass: 'text-amber-800',
      path: '/tournament-comment/paper'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">토너먼트 댓글 디자인</h1>
          <p className="text-gray-600">6가지 독창적인 댓글 UI 디자인</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {commentStyles.map((style) => (
            <div
              key={style.id}
              className={`cursor-pointer transition-all duration-300 rounded-xl overflow-hidden shadow-lg ${
                selectedStyle === style.id ? 'ring-4 ring-blue-500 scale-105' : 'hover:scale-102'
              }`}
              onClick={() => setSelectedStyle(style.id)}
            >
              <div className={`${style.bgClass} p-6 h-48 flex flex-col justify-between`}>
                <div className={`${style.textClass} font-bold text-xl mb-2`}>{style.name}</div>
                <div className={`${style.id === 'gaming' || style.id === 'neon' ? 'text-gray-300' : 'text-gray-700'} text-sm`}>
                  {style.description}
                </div>
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
          <h2 className="text-2xl font-bold text-gray-800 mb-4">댓글 시스템 특징</h2>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 p-6 rounded-xl">
                <h3 className="text-lg font-bold text-gray-800 mb-2">기능적 특징</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  <li>댓글 작성 및 수정/삭제</li>
                  <li>답글 기능</li>
                  <li>좋아요 기능</li>
                  <li>신고하기 기능</li>
                  <li>정렬 옵션 (인기순/최신순)</li>
                  <li>페이지네이션</li>
                </ul>
              </div>
              
              <div className="bg-gray-50 p-6 rounded-xl">
                <h3 className="text-lg font-bold text-gray-800 mb-2">디자인 스타일</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  <li>채팅 스타일 - 메신저 앱 느낌의 UI</li>
                  <li>만화책 스타일 - 팝아트 감성의 디자인</li>
                  <li>게이밍 RGB 스타일 - 화려한 게이밍 디자인</li>
                  <li>미니멀 엘레강스 - 세련되고 심플한 디자인</li>
                  <li>네온 사이버 스타일 - 미래적인 네온 디자인</li>
                  <li>종이 찢기 스타일 - 아날로그 감성의 디자인</li>
                </ul>
              </div>
            </div>
            
            <div className="bg-gray-50 p-6 rounded-xl">
              <h3 className="text-lg font-bold text-gray-800 mb-2">사용자 경험</h3>
              <p className="text-gray-700 mb-4">
                각 스타일은 동일한 기능을 제공하면서도 완전히 다른 사용자 경험을 제공합니다. 
                사용자의 취향과 서비스의 성격에 맞는 디자인을 선택할 수 있습니다.
              </p>
              <p className="text-gray-700">
                모든 디자인은 반응형으로 구현되어 모바일과 데스크톱 환경 모두에서 최적의 경험을 제공합니다.
              </p>
            </div>
          </div>
        </div>

        <div className="text-center mt-12">
          <p className="text-gray-600 mb-6 text-lg">6가지 독창적인 디자인으로 다양한 사용자 경험을 제공합니다</p>
          <div className="flex flex-wrap justify-center gap-3">
            <span className="px-4 py-2 bg-orange-100 text-orange-800 rounded-lg text-sm font-medium">채팅 스타일</span>
            <span className="px-4 py-2 bg-blue-100 text-blue-800 rounded-lg text-sm font-medium">만화책 스타일</span>
            <span className="px-4 py-2 bg-purple-100 text-purple-800 rounded-lg text-sm font-medium">게이밍 RGB</span>
            <span className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg text-sm font-medium">미니멀 엘레강스</span>
            <span className="px-4 py-2 bg-cyan-100 text-cyan-800 rounded-lg text-sm font-medium">네온 사이버</span>
            <span className="px-4 py-2 bg-amber-100 text-amber-800 rounded-lg text-sm font-medium">종이 찢기</span>
          </div>
        </div>
      </div>
    </div>
  );
}