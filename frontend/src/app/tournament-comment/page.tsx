'use client';

import Link from 'next/link';
import { MessageCircle, Palette, Zap, FileText, Sparkles, Users } from 'lucide-react';

export default function TournamentCommentIndexPage() {
  const commentStyles = [
    {
      id: 'neon',
      name: '네온 사이버',
      description: '미래적이고 사이버펑크한 댓글 UI',
      icon: Zap,
      color: 'from-blue-600 to-purple-600',
      bgColor: 'bg-gradient-to-br from-blue-50 to-purple-50',
      href: '/tournament-comment-neon'
    },
    {
      id: 'paper',
      name: '종이 찢기',
      description: '아날로그 느낌의 따뜻한 댓글 UI',
      icon: FileText,
      color: 'from-amber-600 to-orange-600',
      bgColor: 'bg-gradient-to-br from-amber-50 to-orange-50',
      href: '/tournament-comment-paper'
    },
    {
      id: 'comic',
      name: '만화책',
      description: '팝아트 스타일의 강렬한 댓글 UI',
      icon: Sparkles,
      color: 'from-purple-600 to-pink-600',
      bgColor: 'bg-gradient-to-br from-purple-50 to-pink-50',
      href: '/tournament-comment-comic'
    },
    {
      id: 'minimal',
      name: '미니멀 엘레강스',
      description: '깔끔하고 세련된 댓글 UI',
      icon: Palette,
      color: 'from-gray-600 to-gray-800',
      bgColor: 'bg-gradient-to-br from-gray-50 to-gray-100',
      href: '/tournament-comment-minimal'
    },
    {
      id: 'chat',
      name: '채팅 스타일',
      description: '실시간 채팅 느낌의 댓글 UI',
      icon: Users,
      color: 'from-orange-600 to-yellow-600',
      bgColor: 'bg-gradient-to-br from-orange-50 to-yellow-50',
      href: '/tournament-comment-chat'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* 헤더 */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 mb-4">
            <MessageCircle className="w-12 h-12 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900">토너먼트 댓글 시스템</h1>
          </div>
          <p className="text-xl text-gray-600 mb-2">5가지 독창적인 댓글 UI 디자인</p>
          <p className="text-gray-500">각각 다른 스타일과 느낌으로 구현된 댓글 시스템을 체험해보세요</p>
        </div>

        {/* 스타일 카드 그리드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {commentStyles.map((style) => {
            const IconComponent = style.icon;
            return (
              <Link
                key={style.id}
                href={style.href}
                className="group block"
              >
                <div className={`${style.bgColor} rounded-2xl p-8 border border-gray-200 hover:shadow-xl transition-all duration-300 group-hover:scale-105`}>
                  <div className="text-center">
                    <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-r ${style.color} text-white mb-4 group-hover:scale-110 transition-transform`}>
                      <IconComponent className="w-8 h-8" />
                    </div>
                    
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{style.name}</h3>
                    <p className="text-gray-600 text-sm leading-relaxed mb-4">{style.description}</p>
                    
                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r ${style.color} text-white text-sm font-medium group-hover:shadow-lg transition-all`}>
                      <span>체험하기</span>
                      <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* 기능 소개 */}
        <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">주요 기능</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <MessageCircle className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">댓글 작성</h3>
              <p className="text-sm text-gray-600">로그인/비로그인 상태별 댓글 작성</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">좋아요 & 답글</h3>
              <p className="text-sm text-gray-600">실시간 좋아요와 답글 기능</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">수정 & 삭제</h3>
              <p className="text-sm text-gray-600">본인 댓글 수정 및 삭제</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2h4a1 1 0 110 2h-1v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6H3a1 1 0 110-2h4zM6 6v12h12V6H6zm3-2V3h6v1H9z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">페이지네이션</h3>
              <p className="text-sm text-gray-600">20개씩 나누어 표시</p>
            </div>
          </div>
        </div>

        {/* 푸터 */}
        <div className="text-center mt-12 text-gray-500">
          <p>각 스타일은 tournament-result와 일관성 있게 디자인되었습니다</p>
        </div>
      </div>
    </div>
  );
}