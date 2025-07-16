'use client';

import { useState, useEffect } from 'react';
import { Home, Volume2, VolumeX, Flame, Crown, Zap, Heart, Star, RotateCcw, Undo2, Trophy, ChevronDown } from 'lucide-react';

const gameData = {
    tournament: "최고의 K-POP 아이돌 월드컵",
    currentRound: "준결승",
    progress: 75,
    matchNumber: 3,
    totalMatches: 4,
    contestants: [
        {
            id: 'contestant1',
            name: 'IU',
            subtitle: '솔로 아티스트',
            image: 'https://images.unsplash.com/photo-1494790108755-2616c9c0b8d3?w=400&h=400&fit=crop&crop=face',
            votes: 1247,
            winStreak: 3
        },
        {
            id: 'contestant2',
            name: 'NewJeans',
            subtitle: '걸그룹',
            image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop&crop=face',
            votes: 892,
            winStreak: 2
        }
    ]
};

export default function TournamentPlayPage() {
    const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
    const [isVoting, setIsVoting] = useState(false);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    const handleVote = (contestantId: string) => {
        if (isVoting) return;
        setSelectedChoice(contestantId);
        setIsVoting(true);
        setTimeout(() => {
            setIsVoting(false);
            setSelectedChoice(null);
        }, 3000);
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">토너먼트 플레이 디자인</h1>
                    <p className="text-gray-600">독창적인 게임플레이 UI 디자인들</p>
                </div>

                {/* 디자인 1: 네온 배틀 아레나 */}
                <div className="mb-16">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">1. 네온 배틀 아레나</h2>
                    <div className="bg-black rounded-3xl p-8 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 via-pink-900/30 to-blue-900/30"></div>

                        <div className="relative z-10">
                            <div className="flex justify-between items-center mb-8">
                                <div className="flex items-center gap-4">
                                    <button className="p-3 bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 hover:border-cyan-400 transition-colors">
                                        <Home className="w-5 h-5 text-cyan-400" />
                                    </button>
                                    <div className="text-cyan-400 font-mono">
                                        <div className="text-sm opacity-80">BATTLE ARENA</div>
                                        <div className="text-lg font-bold">{gameData.currentRound}</div>
                                    </div>
                                </div>

                                <div className="text-center">
                                    <div className="text-pink-400 font-mono text-sm mb-1">PROGRESS</div>
                                    <div className="w-64 h-2 bg-gray-800 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-cyan-400 to-pink-400 transition-all duration-1000"
                                            style={{ width: `${gameData.progress}%` }}
                                        ></div>
                                    </div>
                                    <div className="text-white font-mono text-sm mt-1">{gameData.progress}%</div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <button className="p-3 bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 hover:border-yellow-400 transition-colors">
                                        <RotateCcw className="w-5 h-5 text-yellow-400" />
                                    </button>
                                    <button className="p-3 bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 hover:border-purple-400 transition-colors">
                                        <Trophy className="w-5 h-5 text-purple-400" />
                                    </button>
                                </div>
                            </div>

                            <div className="text-center mb-8">
                                <div className="inline-flex items-center gap-4 bg-gray-800/30 backdrop-blur-sm rounded-2xl px-8 py-4 border border-gray-700">
                                    <div className="text-cyan-400 font-mono text-sm">MATCH {gameData.matchNumber}</div>
                                    <div className="text-4xl font-bold text-white">VS</div>
                                    <div className="text-pink-400 font-mono text-sm">ROUND {gameData.totalMatches}</div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-8">
                                {gameData.contestants.map((contestant, index) => (
                                    <div
                                        key={contestant.id}
                                        className={`cursor-pointer transition-all duration-500 ${isClient && selectedChoice === contestant.id ? 'scale-105' : 'hover:scale-102'
                                            }`}
                                        onClick={() => handleVote(contestant.id)}
                                    >
                                        <div className={`relative p-4 rounded-2xl border-2 transition-all duration-300 ${isClient && selectedChoice === contestant.id
                                            ? 'border-yellow-400 bg-yellow-400/10 shadow-lg shadow-yellow-400/25'
                                            : index === 0
                                                ? 'border-cyan-400/30 bg-cyan-400/5 hover:border-cyan-400 hover:bg-cyan-400/10'
                                                : 'border-pink-400/30 bg-pink-400/5 hover:border-pink-400 hover:bg-pink-400/10'
                                            }`}>

                                            <div className="relative mb-4">
                                                {/* 이미지 크기 대폭 확대 */}
                                                <div className={`w-full h-96 rounded-xl overflow-hidden border-2 ${index === 0 ? 'border-cyan-400/50' : 'border-pink-400/50'
                                                    }`}>
                                                    <img
                                                        src={contestant.image}
                                                        alt={contestant.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                                                    
                                                    {/* 네온사인 WINNER 표시 */}
                                                    {isClient && selectedChoice === contestant.id && (
                                                        <div className="absolute inset-0 flex items-center justify-center">
                                                            <div className={`px-8 py-4 rounded-2xl font-black text-3xl transform rotate-12 animate-bounce ${
                                                                index === 0 
                                                                    ? 'bg-cyan-400/90 text-black border-2 border-cyan-300 shadow-[0_0_30px_#00ffff]' 
                                                                    : 'bg-pink-400/90 text-black border-2 border-pink-300 shadow-[0_0_30px_#ff69b4]'
                                                            }`}>
                                                                ⚡ WINNER ⚡
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                {contestant.winStreak > 0 && (
                                                    <div className={`absolute -top-2 -right-2 px-3 py-1 rounded-full text-xs font-bold ${index === 0 ? 'bg-cyan-400 text-black' : 'bg-pink-400 text-black'
                                                        }`}>
                                                        {contestant.winStreak} WIN STREAK
                                                    </div>
                                                )}
                                            </div>

                                            <div className="text-center">
                                                <h3 className="text-2xl font-bold text-white mb-1">{contestant.name}</h3>
                                                <p className={`text-sm mb-3 ${index === 0 ? 'text-cyan-300' : 'text-pink-300'}`}>
                                                    {contestant.subtitle}
                                                </p>
                                                
                                                {/* VOTES 숨김/공개 처리 */}
                                                {isClient && selectedChoice ? (
                                                    <div className={`flex justify-center items-center gap-2 mb-4 transition-all duration-700 ${
                                                        selectedChoice === contestant.id ? 'animate-pulse' : ''
                                                    }`}>
                                                        <Flame className={`w-5 h-5 ${index === 0 ? 'text-cyan-400' : 'text-pink-400'}`} />
                                                        <span className={`font-mono text-lg font-bold ${
                                                            selectedChoice === contestant.id 
                                                                ? 'text-yellow-400 text-xl' 
                                                                : 'text-gray-300'
                                                        }`}>
                                                            {contestant.votes} VOTES
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <div className="flex justify-center items-center gap-2 mb-4">
                                                        <div className="w-16 h-6 bg-gray-700/50 rounded animate-pulse"></div>
                                                    </div>
                                                )}


                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="text-center mt-8">
                                {isVoting ? (
                                    <div className="text-white font-mono">
                                        <div className="text-lg mb-2">PROCESSING BATTLE...</div>
                                        <div className="flex justify-center">
                                            <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-gray-400 font-mono text-sm">
                                        CLICK TO CHOOSE YOUR CHAMPION
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 디자인 2: 종이 찢기 스타일 */}
                <div className="mb-16">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">2. 종이 찢기 스타일</h2>
                    <div className="bg-amber-50 p-8 relative">

                        {/* 상단 네비게이션 */}
                        <div className="flex justify-between items-center mb-8">
                            <div className="flex items-center gap-4">
                                <button className="p-3 bg-white rounded-lg shadow-md border border-amber-200 hover:border-amber-400 transition-colors transform -rotate-1">
                                    <Home className="w-5 h-5 text-amber-600" />
                                </button>
                                <div className="bg-white p-3 rounded-lg shadow-md border border-amber-200 transform rotate-1">
                                    <div className="text-amber-600 text-sm font-medium">토너먼트</div>
                                    <div className="text-amber-800 font-bold">{gameData.currentRound}</div>
                                </div>
                            </div>

                            {/* 프로그레스바를 헤더로 이동 */}
                            <div className="text-center">
                                <div className="text-amber-700 text-xs mb-1">진행률: {gameData.progress}%</div>
                                <div className="w-64 h-2 bg-amber-100 rounded-full overflow-hidden border border-amber-300">
                                    <div
                                        className="h-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-1000"
                                        style={{ width: `${gameData.progress}%` }}
                                    ></div>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-3">
                                <button className="p-3 bg-white rounded-lg shadow-md border border-amber-200 hover:border-amber-400 transition-colors transform rotate-1">
                                    <Undo2 className="w-5 h-5 text-amber-600" />
                                </button>
                                <button className="p-3 bg-white rounded-lg shadow-md border border-amber-200 hover:border-orange-400 transition-colors transform -rotate-1">
                                    <Trophy className="w-5 h-5 text-orange-600" />
                                </button>
                            </div>
                        </div>

                        <div className="text-center mb-8">
                            <div className="inline-block bg-white p-4 rounded-lg shadow-lg border-2 border-dashed border-amber-400 transform -rotate-1">
                                <h3 className="text-2xl font-bold text-amber-800 mb-1">토너먼트 대결</h3>
                                <div className="flex items-center justify-center gap-3 text-amber-600 text-sm">
                                    <span>MATCH {gameData.matchNumber}</span>
                                    <span className="text-lg">VS</span>
                                    <span>ROUND {gameData.totalMatches}</span>
                                </div>
                            </div>
                            <div className="mt-2">
                                <span className="text-amber-600 text-xs bg-white px-2 py-1 rounded border border-amber-200 shadow-sm">
                                    찢어서 선택하세요!
                                </span>
                            </div>
                        </div>



                        <div className="grid grid-cols-2 gap-12">
                            {gameData.contestants.map((contestant, index) => (
                                <div
                                    key={contestant.id}
                                    className={`cursor-pointer transition-all duration-300 ${isClient && selectedChoice === contestant.id ? 'scale-110 z-10' : 'hover:scale-105'
                                        }`}
                                    onClick={() => handleVote(contestant.id)}
                                    style={{
                                        transform: `rotate(${index === 0 ? '-2deg' : '2deg'}) ${isClient && selectedChoice === contestant.id ? 'scale(1.1)' : ''}`
                                    }}
                                >
                                    <div className="bg-white p-4 rounded-lg shadow-xl border-2 border-dashed border-gray-300 relative">
                                        <div className="absolute -top-2 left-4 w-8 h-4 bg-white transform rotate-12"></div>
                                        <div className="absolute -top-1 right-8 w-6 h-3 bg-white transform -rotate-12"></div>
                                        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-16 h-6 bg-yellow-200 opacity-70 rounded-sm border border-yellow-300"></div>

                                        <div className="relative">
                                            {/* 이미지 크기 대폭 확대 */}
                                            <div className="w-full h-80 rounded-lg overflow-hidden mb-4 border-2 border-gray-200">
                                                <img
                                                    src={contestant.image}
                                                    alt={contestant.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>

                                            <div className="text-center">
                                                <h3 className="text-xl font-bold text-gray-800 mb-1">{contestant.name}</h3>
                                                <p className="text-sm text-amber-600 mb-3">{contestant.subtitle}</p>
                                                
                                                {/* VOTES 숨김/공개 처리 */}
                                                {isClient && selectedChoice ? (
                                                    <div className={`text-base text-gray-600 mb-3 transition-all duration-700 ${
                                                        selectedChoice === contestant.id ? 'text-red-600 font-bold text-lg animate-pulse' : ''
                                                    }`}>
                                                        🗳️ {contestant.votes} 표
                                                    </div>
                                                ) : (
                                                    <div className="mb-3">
                                                        <div className="w-20 h-5 bg-gray-200 rounded mx-auto animate-pulse"></div>
                                                    </div>
                                                )}

                                                {contestant.winStreak > 0 && (
                                                    <div className="inline-block bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-bold mb-2">
                                                        🔥 {contestant.winStreak}연승
                                                    </div>
                                                )}
                                            </div>

                                            {isClient && selectedChoice === contestant.id && (
                                                <div className="absolute inset-0 bg-red-500/20 rounded-lg flex items-center justify-center">
                                                    <div className="bg-red-500 text-white px-6 py-3 rounded-full font-bold text-xl transform rotate-12 animate-bounce">
                                                        🏆 선택됨!
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="text-center mt-8">
                            <div className="inline-block bg-white p-3 rounded-lg shadow-md border border-amber-200 transform -rotate-1">
                                <p className="text-amber-700 font-medium">
                                    {isVoting ? '투표 처리 중...' : '카드를 클릭해서 선택하세요!'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 디자인 3: 만화책 스타일 */}
                <div className="mb-16">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">3. 만화책 스타일</h2>
                    <div className="bg-gradient-to-b from-blue-100 to-purple-100 p-8 rounded-3xl border-4 border-black relative overflow-hidden">

                        <div className="absolute top-4 left-4 text-6xl font-black text-yellow-400 opacity-20 transform -rotate-12">POW!</div>
                        <div className="absolute bottom-4 right-4 text-4xl font-black text-red-400 opacity-20 transform rotate-12">BAM!</div>

                        {/* 상단 네비게이션 */}
                        <div className="flex justify-between items-center mb-8 relative z-10">
                            <div className="flex items-center gap-4">
                                <button className="p-3 bg-white rounded-2xl border-4 border-black shadow-[4px_4px_0px_0px_#000] hover:shadow-[2px_2px_0px_0px_#000] transition-all transform -rotate-2">
                                    <Home className="w-5 h-5 text-black" />
                                </button>
                                <div className="bg-white p-3 rounded-2xl border-4 border-black shadow-[4px_4px_0px_0px_#000] transform rotate-2">
                                    <div className="text-black text-sm font-black">TOURNAMENT</div>
                                    <div className="text-black font-black text-lg">{gameData.currentRound}</div>
                                </div>
                            </div>

                            {/* 프로그레스바를 헤더로 이동 */}
                            <div className="text-center">
                                <div className="text-black text-xs font-black mb-1">PROGRESS: {gameData.progress}%</div>
                                <div className="w-64 h-3 bg-gray-200 rounded-full overflow-hidden border-2 border-black">
                                    <div
                                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-1000"
                                        style={{ width: `${gameData.progress}%` }}
                                    ></div>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-3">
                                <button className="p-3 bg-white rounded-2xl border-4 border-black shadow-[4px_4px_0px_0px_#000] hover:shadow-[2px_2px_0px_0px_#000] transition-all transform rotate-2">
                                    <Undo2 className="w-5 h-5 text-black" />
                                </button>
                                <button className="p-3 bg-white rounded-2xl border-4 border-black shadow-[4px_4px_0px_0px_#000] hover:shadow-[2px_2px_0px_0px_#000] transition-all transform -rotate-2">
                                    <Trophy className="w-5 h-5 text-black" />
                                </button>
                            </div>
                        </div>

                        <div className="text-center mb-8">
                            <div className="inline-block bg-yellow-300 p-4 rounded-2xl border-4 border-black shadow-[8px_8px_0px_0px_#000] transform -rotate-1">
                                <div className="flex items-center justify-center gap-4 mb-2">
                                    <span className="text-black font-black text-lg">MATCH {gameData.matchNumber}</span>
                                    <div className="text-4xl font-black text-black">VS</div>
                                    <span className="text-black font-black text-lg">ROUND {gameData.totalMatches}</span>
                                </div>
                                <p className="text-black font-bold text-sm">누가 승리할 것인가?!</p>
                            </div>
                            <div className="mt-2">
                                <span className="text-purple-600 text-xs bg-white px-2 py-1 rounded border-2 border-black shadow-sm font-black">
                                    ULTIMATE SHOWDOWN!
                                </span>
                            </div>
                        </div>



                        <div className="grid grid-cols-2 gap-8">
                            {gameData.contestants.map((contestant, index) => (
                                <div
                                    key={contestant.id}
                                    className={`cursor-pointer transition-all duration-300 ${isClient && selectedChoice === contestant.id ? 'scale-110' : 'hover:scale-105'
                                        }`}
                                    onClick={() => handleVote(contestant.id)}
                                >
                                    <div className={`bg-white p-4 rounded-2xl border-4 border-black shadow-[8px_8px_0px_0px_#000] relative ${isClient && selectedChoice === contestant.id ? 'bg-yellow-200' : ''
                                        }`}>

                                        <div className={`absolute -top-8 ${index === 0 ? 'left-4' : 'right-4'} bg-white border-2 border-black rounded-lg px-3 py-1`}>
                                            <div className="text-xs font-bold text-black">CHOOSE ME!</div>
                                            <div className={`absolute top-full ${index === 0 ? 'left-4' : 'right-4'} w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black`}></div>
                                        </div>

                                        <div className="relative">
                                            {/* 이미지 크기 대폭 확대 */}
                                            <div className="w-full h-80 rounded-xl overflow-hidden mb-4 border-4 border-black">
                                                <img
                                                    src={contestant.image}
                                                    alt={contestant.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>

                                            <div className="text-center">
                                                <h3 className="text-2xl font-black text-black mb-1">{contestant.name}</h3>
                                                <p className="text-sm text-purple-600 font-bold mb-3">{contestant.subtitle}</p>
                                                
                                                {/* VOTES 숨김/공개 처리 */}
                                                {isClient && selectedChoice ? (
                                                    <div className={`px-3 py-1 rounded-full text-sm font-bold mb-3 transition-all duration-700 ${
                                                        selectedChoice === contestant.id 
                                                            ? 'bg-yellow-400 text-black text-lg animate-pulse border-2 border-black' 
                                                            : 'bg-blue-500 text-white'
                                                    }`}>
                                                        💥 {contestant.votes} VOTES
                                                    </div>
                                                ) : (
                                                    <div className="mb-3">
                                                        <div className="w-24 h-6 bg-gray-300 rounded-full mx-auto animate-pulse border-2 border-black"></div>
                                                    </div>
                                                )}

                                                {contestant.winStreak > 0 && (
                                                    <div className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                                                        {contestant.winStreak} WIN COMBO!
                                                    </div>
                                                )}
                                            </div>

                                            {isClient && selectedChoice === contestant.id && (
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <div className="bg-yellow-400 text-black px-8 py-4 rounded-2xl border-4 border-black font-black text-2xl transform rotate-12 shadow-[4px_4px_0px_0px_#000] animate-bounce">
                                                        🏆 WINNER!
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="text-center mt-8">
                            {isVoting ? (
                                <div className="inline-block bg-green-400 text-black p-4 rounded-2xl border-4 border-black font-black text-lg">
                                    BATTLE IN PROGRESS...
                                </div>
                            ) : (
                                <div className="inline-block bg-purple-400 text-white p-4 rounded-2xl border-4 border-black font-black text-lg">
                                    PICK YOUR HERO!
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* 디자인 4: 기본 모던 스타일 */}
                <div className="mb-16">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">4. 기본 모던 스타일</h2>
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 relative">

                        {/* 상단 네비게이션 */}
                        <div className="flex justify-between items-center mb-8">
                            <div className="flex items-center gap-4">
                                <button className="p-3 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">
                                    <Home className="w-5 h-5 text-gray-600" />
                                </button>
                                <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
                                    <div className="text-gray-500 text-sm font-medium">토너먼트</div>
                                    <div className="text-gray-800 font-semibold">{gameData.currentRound}</div>
                                </div>
                            </div>

                            {/* 프로그레스바를 헤더로 이동 */}
                            <div className="text-center">
                                <div className="text-gray-600 text-xs font-medium mb-1">진행률: {gameData.progress}%</div>
                                <div className="w-64 h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-1000"
                                        style={{ width: `${gameData.progress}%` }}
                                    ></div>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-3">
                                <button className="p-3 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">
                                    <RotateCcw className="w-5 h-5 text-gray-600" />
                                </button>
                                <button className="p-3 bg-gray-100 rounded-xl hover:bg-blue-100 transition-colors">
                                    <Trophy className="w-5 h-5 text-blue-600" />
                                </button>
                            </div>
                        </div>

                        <div className="text-center mb-8">
                            <div className="inline-block bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-2xl shadow-lg">
                                <div className="flex items-center justify-center gap-4 mb-2">
                                    <span className="font-semibold">MATCH {gameData.matchNumber}</span>
                                    <div className="text-2xl font-bold">VS</div>
                                    <span className="font-semibold">ROUND {gameData.totalMatches}</span>
                                </div>
                                <p className="text-sm opacity-90">최고의 선택을 해보세요</p>
                            </div>
                        </div>



                        <div className="grid grid-cols-2 gap-8">
                            {gameData.contestants.map((contestant, index) => (
                                <div
                                    key={contestant.id}
                                    className={`cursor-pointer transition-all duration-300 ${isClient && selectedChoice === contestant.id ? 'scale-105' : 'hover:scale-102'
                                        }`}
                                    onClick={() => handleVote(contestant.id)}
                                >
                                    <div className={`relative p-6 rounded-2xl border-2 transition-all duration-300 ${isClient && selectedChoice === contestant.id
                                        ? 'border-purple-500 bg-purple-50 shadow-lg shadow-purple-200'
                                        : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                                        }`}>

                                        <div className="relative mb-6">
                                            <div className="w-full h-80 rounded-xl overflow-hidden border border-gray-200">
                                                <img
                                                    src={contestant.image}
                                                    alt={contestant.name}
                                                    className="w-full h-full object-cover"
                                                />
                                                
                                                {/* WINNER 표시 */}
                                                {isClient && selectedChoice === contestant.id && (
                                                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                                        <div className="bg-white px-6 py-3 rounded-xl shadow-lg border-2 border-purple-500 font-bold text-purple-600 text-xl animate-bounce">
                                                            ✨ 선택됨!
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {contestant.winStreak > 0 && (
                                                <div className="absolute -top-2 -right-2 px-3 py-1 bg-blue-500 text-white rounded-full text-xs font-semibold">
                                                    {contestant.winStreak}연승
                                                </div>
                                            )}
                                        </div>

                                        <div className="text-center">
                                            <h3 className="text-xl font-bold text-gray-800 mb-1">{contestant.name}</h3>
                                            <p className="text-sm text-gray-500 mb-4">{contestant.subtitle}</p>
                                            
                                            {/* VOTES 숨김/공개 처리 */}
                                            {isClient && selectedChoice ? (
                                                <div className={`flex justify-center items-center gap-2 mb-4 transition-all duration-700 ${
                                                    selectedChoice === contestant.id ? 'animate-pulse' : ''
                                                }`}>
                                                    <div className={`w-2 h-2 rounded-full ${selectedChoice === contestant.id ? 'bg-purple-500' : 'bg-gray-400'}`}></div>
                                                    <span className={`text-sm font-medium ${
                                                        selectedChoice === contestant.id 
                                                            ? 'text-purple-600 font-semibold' 
                                                            : 'text-gray-600'
                                                    }`}>
                                                        {contestant.votes} 표
                                                    </span>
                                                </div>
                                            ) : (
                                                <div className="flex justify-center items-center gap-2 mb-4">
                                                    <div className="w-16 h-4 bg-gray-200 rounded animate-pulse"></div>
                                                </div>
                                            )}

                                            {contestant.winStreak > 0 && (
                                                <div className="inline-block bg-orange-100 text-orange-600 px-3 py-1 rounded-full text-xs font-medium">
                                                    🔥 {contestant.winStreak}연승 중
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="text-center mt-8">
                            <div className="text-gray-500 text-sm">
                                {isVoting ? '투표 처리 중...' : '카드를 클릭해서 선택하세요'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 디자인 5: 레트로 게임 스타일 */}
                <div className="mb-16">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">5. 레트로 게임 스타일</h2>
                    <div className="bg-gradient-to-b from-indigo-900 via-purple-900 to-pink-900 rounded-3xl p-8 relative overflow-hidden">
                        
                        {/* 픽셀 패턴 배경 */}
                        <div className="absolute inset-0 opacity-10">
                            <div className="w-full h-full" style={{
                                backgroundImage: `
                                    radial-gradient(circle at 25% 25%, #fff 2px, transparent 2px),
                                    radial-gradient(circle at 75% 75%, #fff 2px, transparent 2px)
                                `,
                                backgroundSize: '20px 20px'
                            }}></div>
                        </div>

                        <div className="relative z-10">
                            {/* 상단 네비게이션 */}
                            <div className="flex justify-between items-center mb-8">
                                <div className="flex items-center gap-4">
                                    <button className="p-3 bg-indigo-800 rounded-lg border-2 border-indigo-600 hover:bg-indigo-700 transition-colors shadow-lg">
                                        <Home className="w-5 h-5 text-indigo-200" />
                                    </button>
                                    <div className="bg-indigo-800 p-3 rounded-lg border-2 border-indigo-600 shadow-lg">
                                        <div className="text-indigo-300 text-sm font-mono">STAGE</div>
                                        <div className="text-indigo-100 font-bold font-mono">{gameData.currentRound}</div>
                                    </div>
                                </div>

                                {/* 프로그레스바를 헤더로 이동 */}
                                <div className="text-center">
                                    <div className="text-indigo-200 text-xs font-mono mb-1">PROGRESS: {gameData.progress}%</div>
                                    <div className="w-64 h-3 bg-indigo-900 rounded-lg overflow-hidden border-2 border-indigo-700">
                                        <div
                                            className="h-full bg-gradient-to-r from-green-400 via-yellow-400 to-red-400 transition-all duration-1000"
                                            style={{ width: `${gameData.progress}%` }}
                                        ></div>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-3">
                                    <button className="p-3 bg-pink-800 rounded-lg border-2 border-pink-600 hover:bg-pink-700 transition-colors shadow-lg">
                                        <RotateCcw className="w-5 h-5 text-pink-200" />
                                    </button>
                                    <button className="p-3 bg-purple-800 rounded-lg border-2 border-purple-600 hover:bg-purple-700 transition-colors shadow-lg">
                                        <Trophy className="w-5 h-5 text-purple-200" />
                                    </button>
                                </div>
                            </div>

                            <div className="text-center mb-8">
                                <div className="inline-block bg-gradient-to-r from-yellow-400 to-orange-500 text-black p-4 rounded-2xl shadow-lg border-4 border-yellow-300">
                                    <div className="flex items-center justify-center gap-4 mb-2">
                                        <span className="font-black font-mono">BATTLE {gameData.matchNumber}</span>
                                        <div className="text-3xl font-black">⚔️</div>
                                        <span className="font-black font-mono">STAGE {gameData.totalMatches}</span>
                                    </div>
                                    <p className="text-sm font-bold">CHOOSE YOUR FIGHTER!</p>
                                </div>
                                <div className="mt-2">
                                    <span className="text-yellow-300 text-xs bg-indigo-800 px-3 py-1 rounded-full border border-indigo-600 font-mono">
                                        RETRO BATTLE MODE
                                    </span>
                                </div>
                            </div>



                            <div className="grid grid-cols-2 gap-8">
                                {gameData.contestants.map((contestant, index) => (
                                    <div
                                        key={contestant.id}
                                        className={`cursor-pointer transition-all duration-300 ${isClient && selectedChoice === contestant.id ? 'scale-110' : 'hover:scale-105'
                                            }`}
                                        onClick={() => handleVote(contestant.id)}
                                    >
                                        <div className={`relative p-4 rounded-2xl border-4 transition-all duration-300 shadow-lg ${isClient && selectedChoice === contestant.id
                                            ? 'border-yellow-400 bg-yellow-400/20 shadow-yellow-400/50'
                                            : index === 0
                                                ? 'border-cyan-400 bg-cyan-400/10 hover:bg-cyan-400/20'
                                                : 'border-pink-400 bg-pink-400/10 hover:bg-pink-400/20'
                                            }`}>

                                            <div className="relative mb-4">
                                                <div className={`w-full h-80 rounded-xl overflow-hidden border-4 ${index === 0 ? 'border-cyan-300' : 'border-pink-300'
                                                    }`}>
                                                    <img
                                                        src={contestant.image}
                                                        alt={contestant.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                                                    
                                                    {/* WINNER 표시 */}
                                                    {isClient && selectedChoice === contestant.id && (
                                                        <div className="absolute inset-0 flex items-center justify-center">
                                                            <div className={`px-6 py-3 rounded-2xl font-black text-2xl transform rotate-12 animate-bounce border-4 ${
                                                                index === 0 
                                                                    ? 'bg-cyan-400 text-black border-cyan-300 shadow-lg shadow-cyan-400/50' 
                                                                    : 'bg-pink-400 text-black border-pink-300 shadow-lg shadow-pink-400/50'
                                                            }`}>
                                                                🏆 WINNER!
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                {contestant.winStreak > 0 && (
                                                    <div className={`absolute -top-2 -right-2 px-3 py-1 rounded-lg text-xs font-bold border-2 ${
                                                        index === 0 ? 'bg-cyan-400 text-black border-cyan-300' : 'bg-pink-400 text-black border-pink-300'
                                                    }`}>
                                                        {contestant.winStreak} WIN COMBO
                                                    </div>
                                                )}
                                            </div>

                                            <div className="text-center">
                                                <h3 className="text-2xl font-bold text-white mb-1 font-mono">{contestant.name}</h3>
                                                <p className={`text-sm mb-4 font-mono ${index === 0 ? 'text-cyan-300' : 'text-pink-300'}`}>
                                                    {contestant.subtitle}
                                                </p>
                                                
                                                {/* VOTES 숨김/공개 처리 */}
                                                {isClient && selectedChoice ? (
                                                    <div className={`flex justify-center items-center gap-2 mb-4 transition-all duration-700 ${
                                                        selectedChoice === contestant.id ? 'animate-pulse' : ''
                                                    }`}>
                                                        <div className={`w-3 h-3 ${index === 0 ? 'bg-cyan-400' : 'bg-pink-400'}`} style={{clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)'}}></div>
                                                        <span className={`font-mono text-sm font-bold ${
                                                            selectedChoice === contestant.id 
                                                                ? 'text-yellow-300 text-lg' 
                                                                : 'text-gray-300'
                                                        }`}>
                                                            {contestant.votes} PTS
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <div className="flex justify-center items-center gap-2 mb-4">
                                                        <div className="w-16 h-4 bg-indigo-800 rounded animate-pulse border border-indigo-600"></div>
                                                    </div>
                                                )}

                                                {contestant.winStreak > 0 && (
                                                    <div className={`inline-block px-3 py-1 rounded-lg text-xs font-bold border-2 ${
                                                        index === 0 ? 'bg-cyan-400/20 text-cyan-300 border-cyan-400' : 'bg-pink-400/20 text-pink-300 border-pink-400'
                                                    }`}>
                                                        🔥 {contestant.winStreak} STREAK
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="text-center mt-8">
                                {isVoting ? (
                                    <div className="text-yellow-300 font-mono font-bold">
                                        <div className="text-lg mb-2">PROCESSING...</div>
                                        <div className="flex justify-center">
                                            <div className="w-8 h-8 border-4 border-yellow-300 border-t-transparent rounded-full animate-spin"></div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-indigo-300 font-mono text-sm">
                                        PRESS TO SELECT YOUR CHAMPION
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="text-center">
                    <p className="text-gray-600 mb-6 text-lg">어떤 게임플레이 디자인이 가장 독창적인가요?</p>
                    <div className="flex flex-wrap justify-center gap-3">
                        <span className="px-4 py-2 bg-black text-cyan-400 rounded text-sm font-mono">1. 네온 배틀</span>
                        <span className="px-4 py-2 bg-amber-100 text-amber-800 rounded text-sm">2. 종이 찢기</span>
                        <span className="px-4 py-2 bg-yellow-300 text-black rounded text-sm font-black">3. 만화책</span>
                        <span className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded text-sm">4. 기본 모던</span>
                        <span className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-pink-600 text-white rounded text-sm font-mono">5. 레트로 게임</span>
                    </div>
                </div>
            </div>
        </div>
    );
}