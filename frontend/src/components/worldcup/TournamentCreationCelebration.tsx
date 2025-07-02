'use client';

import { useState, useEffect } from 'react';
import { Trophy, Sparkles, Crown, Zap, Star } from 'lucide-react';

interface WorldCupItem {
  id: string;
  title: string;
  image: string | File;
}

interface WorldCupData {
  title: string;
  items: WorldCupItem[];
}

interface TournamentCreationCelebrationProps {
  isVisible: boolean;
  worldCupData: WorldCupData;
  onComplete: () => void;
}

export default function TournamentCreationCelebration({
  isVisible,
  worldCupData,
  onComplete
}: TournamentCreationCelebrationProps) {
  const [animationStage, setAnimationStage] = useState<'fadeIn' | 'vs' | 'celebration' | 'fadeOut'>('fadeIn');
  const [confettiParticles, setConfettiParticles] = useState<Array<{ id: number; x: number; y: number; rotation: number; color: string }>>([]);

  const getImageUrl = (image: string | File): string => {
    if (typeof image === 'string') {
      return image;
    } else if (image instanceof File) {
      return URL.createObjectURL(image);
    }
    return '';
  };

  // 랜덤 2개 이미지 선택
  const selectedImages = worldCupData.items.length >= 2 
    ? worldCupData.items.sort(() => 0.5 - Math.random()).slice(0, 2)
    : worldCupData.items.slice(0, 2);
  const tournamentSize = Math.pow(2, Math.ceil(Math.log2(worldCupData.items.length)));

  useEffect(() => {
    if (!isVisible) return;

    const timer1 = setTimeout(() => setAnimationStage('vs'), 1000);
    const timer2 = setTimeout(() => setAnimationStage('celebration'), 3000);
    const timer3 = setTimeout(() => setAnimationStage('fadeOut'), 7000);
    const timer4 = setTimeout(() => onComplete(), 8000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, [isVisible, onComplete]);

  // 꽃가루 효과 생성
  useEffect(() => {
    if (animationStage === 'celebration') {
      const particles = Array.from({ length: 80 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        rotation: Math.random() * 360,
        color: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#FF9FF3', '#54C6EB'][Math.floor(Math.random() * 8)]
      }));
      setConfettiParticles(particles);
    }
  }, [animationStage]);

  if (!isVisible) return null;

  return (
    <div className={`fixed inset-0 z-50 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center transition-all duration-1000 ${
      animationStage === 'fadeOut' ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
    }`}>
      
      {/* 화려한 그라디언트 오버레이 */}
      <div className="absolute inset-0 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 opacity-30 animate-pulse"></div>
      <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 via-red-500 to-pink-500 opacity-20 animate-ping"></div>
      
      {/* 배경 별들과 번개 효과 */}
      <div className="absolute inset-0 overflow-hidden">
        {Array.from({ length: 150 }).map((_, i) => (
          <div
            key={i}
            className={`absolute rounded-full animate-pulse ${
              i % 10 === 0 ? 'w-2 h-2 bg-yellow-400' : 
              i % 7 === 0 ? 'w-1.5 h-1.5 bg-pink-400' :
              'w-1 h-1 bg-white'
            }`}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${1 + Math.random() * 3}s`
            }}
          />
        ))}
        
        {/* 번개 효과 */}
        {animationStage === 'celebration' && (
          <>
            <div className="absolute top-10 left-10 w-20 h-20 bg-yellow-400 rounded-full opacity-60 animate-ping"></div>
            <div className="absolute top-20 right-20 w-16 h-16 bg-pink-400 rounded-full opacity-50 animate-ping" style={{animationDelay: '0.5s'}}></div>
            <div className="absolute bottom-20 left-20 w-24 h-24 bg-purple-400 rounded-full opacity-40 animate-ping" style={{animationDelay: '1s'}}></div>
            <div className="absolute bottom-10 right-10 w-18 h-18 bg-blue-400 rounded-full opacity-70 animate-ping" style={{animationDelay: '1.5s'}}></div>
          </>
        )}
      </div>

      {/* 꽃가루 효과 */}
      {confettiParticles.map((particle) => (
        <div
          key={particle.id}
          className={`absolute animate-bounce ${
            particle.id % 4 === 0 ? 'w-3 h-3 rounded-full' :
            particle.id % 4 === 1 ? 'w-2 h-4 rounded-lg' :
            particle.id % 4 === 2 ? 'w-4 h-2 rounded-lg' :
            'w-2 h-2 rounded-full'
          }`}
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            backgroundColor: particle.color,
            transform: `rotate(${particle.rotation}deg)`,
            animationDelay: `${Math.random() * 2}s`,
            animationDuration: `${0.8 + Math.random() * 1.2}s`,
            boxShadow: `0 0 10px ${particle.color}`
          }}
        />
      ))}

      <div className="text-center relative z-10">
        
        {/* 메인 타이틀 */}
        <div className={`transition-all duration-1500 ${animationStage === 'fadeIn' ? 'opacity-0 scale-50 -translate-y-10' : 'opacity-100 scale-100 translate-y-0'}`}>
          <div className="flex items-center justify-center mb-8">
            <Crown className={`w-12 h-12 text-yellow-400 mr-4 ${
              animationStage === 'celebration' ? 'animate-spin' : 'animate-bounce'
            }`} />
            <h1 className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600 drop-shadow-2xl animate-pulse">
              🎉 토너먼트 생성 완료! 🎉
            </h1>
            <Crown className={`w-12 h-12 text-yellow-400 ml-4 ${
              animationStage === 'celebration' ? 'animate-spin' : 'animate-bounce'
            }`} />
          </div>

          <div className="text-xl md:text-2xl text-white mb-12 font-bold bg-black bg-opacity-30 rounded-full px-8 py-3 backdrop-blur-sm border border-white border-opacity-20">
            ✨ {worldCupData.title} ✨
          </div>
        </div>

        {/* VS 애니메이션 */}
        {selectedImages.length >= 2 && (
          <div className={`flex items-center justify-center mb-12 transition-all duration-1000 ${
            animationStage === 'vs' || animationStage === 'celebration' ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
          }`}>
            
            {/* 왼쪽 이미지 */}
            <div className={`relative transition-all duration-1000 ${animationStage === 'vs' ? 'translate-x-0 scale-110' : '-translate-x-20 scale-100'}`}>
              <div className={`w-32 h-32 md:w-48 md:h-48 rounded-full border-4 overflow-hidden shadow-2xl transform transition-all duration-500 ${
                animationStage === 'celebration' ? 'border-rainbow animate-spin-slow shadow-yellow-400/50' : 'border-yellow-400'
              }`} style={{
                boxShadow: animationStage === 'celebration' ? '0 0 30px #FFD700, 0 0 60px #FFD700' : undefined
              }}>
                <img
                  src={getImageUrl(selectedImages[0].image)}
                  alt={selectedImages[0].title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className={`absolute -top-2 -right-2 w-10 h-10 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center ${
                animationStage === 'celebration' ? 'animate-bounce' : ''
              }`}>
                <Star className="w-5 h-5 text-white animate-pulse" />
              </div>
              {animationStage === 'celebration' && (
                <div className="absolute -inset-4 bg-yellow-400 rounded-full opacity-20 animate-ping"></div>
              )}
            </div>

            {/* VS 텍스트 */}
            <div className={`mx-8 md:mx-12 transition-all duration-700 ${animationStage === 'vs' ? 'scale-150 rotate-12 animate-pulse' : 'scale-100'}`}>
              <div className="relative">
                <div className="text-6xl md:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 drop-shadow-2xl animate-bounce">
                  ⚡VS⚡
                </div>
                <div className="absolute inset-0 text-6xl md:text-9xl font-black text-red-500 opacity-30 blur-lg animate-pulse">
                  ⚡VS⚡
                </div>
                {animationStage === 'celebration' && (
                  <>
                    <div className="absolute -inset-8">
                      <Zap className="w-12 h-12 text-yellow-400 absolute -top-4 -left-4 animate-spin" />
                      <Zap className="w-12 h-12 text-pink-400 absolute -top-4 -right-4 animate-spin" style={{animationDirection: 'reverse'}} />
                      <Zap className="w-12 h-12 text-blue-400 absolute -bottom-4 -left-4 animate-spin" style={{animationDirection: 'reverse'}} />
                      <Zap className="w-12 h-12 text-green-400 absolute -bottom-4 -right-4 animate-spin" />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-red-500 opacity-20 rounded-full animate-ping"></div>
                  </>
                )}
              </div>
            </div>

            {/* 오른쪽 이미지 */}
            <div className={`relative transition-all duration-1000 ${animationStage === 'vs' ? 'translate-x-0 scale-110' : 'translate-x-20 scale-100'}`}>
              <div className={`w-32 h-32 md:w-48 md:h-48 rounded-full border-4 overflow-hidden shadow-2xl transform transition-all duration-500 ${
                animationStage === 'celebration' ? 'border-rainbow animate-spin-slow shadow-pink-400/50' : 'border-yellow-400'
              }`} style={{
                boxShadow: animationStage === 'celebration' ? '0 0 30px #FF6B9D, 0 0 60px #FF6B9D' : undefined,
                animationDirection: 'reverse'
              }}>
                <img
                  src={getImageUrl(selectedImages[1].image)}
                  alt={selectedImages[1].title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className={`absolute -top-2 -left-2 w-10 h-10 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full flex items-center justify-center ${
                animationStage === 'celebration' ? 'animate-bounce' : ''
              }`} style={{animationDelay: '0.2s'}}>
                <Star className="w-5 h-5 text-white animate-pulse" />
              </div>
              {animationStage === 'celebration' && (
                <div className="absolute -inset-4 bg-pink-400 rounded-full opacity-20 animate-ping" style={{animationDelay: '0.3s'}}></div>
              )}
            </div>
          </div>
        )}

        {/* 토너먼트 정보 */}
        <div className={`transition-all duration-1000 delay-500 ${
          animationStage === 'celebration' || animationStage === 'fadeOut' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}>
          <div className="bg-black bg-opacity-30 backdrop-blur-sm rounded-2xl p-6 md:p-8 border border-white border-opacity-20">
            <div className="flex items-center justify-center mb-6">
              <Trophy className="w-8 h-8 text-yellow-400 mr-3" />
              <h2 className="text-2xl md:text-3xl font-bold text-white">토너먼트 정보</h2>
              <Trophy className="w-8 h-8 text-yellow-400 ml-3" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl p-4">
                <div className="text-3xl font-bold text-white">{worldCupData.items.length}</div>
                <div className="text-blue-100">참가자</div>
              </div>
              
              <div className="bg-gradient-to-br from-green-500 to-teal-600 rounded-xl p-4">
                <div className="text-3xl font-bold text-white">{tournamentSize}강</div>
                <div className="text-green-100">토너먼트</div>
              </div>
              
              <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-xl p-4">
                <div className="text-3xl font-bold text-white">{Math.ceil(tournamentSize / 4)}분</div>
                <div className="text-orange-100">예상시간</div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-yellow-400 mr-2 animate-spin" />
              <span className="text-lg text-white font-medium">전설의 시작이 될 토너먼트가 준비되었습니다!</span>
              <Sparkles className="w-6 h-6 text-yellow-400 ml-2 animate-spin" />
            </div>
          </div>
        </div>

        {/* 하단 메시지 */}
        <div className={`mt-8 transition-all duration-1000 delay-1000 ${
          animationStage === 'celebration' || animationStage === 'fadeOut' ? 'opacity-100' : 'opacity-0'
        }`}>
          <p className="text-lg text-gray-300">
            홈페이지로 이동하여 다른 유저들과 함께 즐겨보세요!
          </p>
        </div>
      </div>
    </div>
  );
}