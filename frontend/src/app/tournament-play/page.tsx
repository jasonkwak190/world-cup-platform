'use client';

import { useState } from 'react';
import { Home, Volume2, VolumeX, Flame, Crown, Zap, Heart, Star } from 'lucide-react';

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
            image: 'https://images.unsplash.com/photo-1494790108755-2616c9c0b8d3?w=400&h=400&fit=crop&crop=face',
            votes: 1247,
            winStreak: 3
        },
        {
            id: 'contestant2',
            name: 'NewJeans',
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

                                <button
                                    onClick={() => setSoundEnabled(!soundEnabled)}
                                    className="p-3 bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 hover:border-pink-400 transition-colors"
                                >
                                    {soundEnabled ?
                                        <Volume2 className="w-5 h-5 text-pink-400" /> :
                                        <VolumeX className="w-5 h-5 text-gray-500" />
                                    }
                                </button>
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
                                        className={`cursor-pointer transition-all duration-500 ${selectedChoice === contestant.id ? 'scale-105' : 'hover:scale-102'
                                            }`}
                                        onClick={() => handleVote(contestant.id)}
                                    >
                                        <div className={`relative p-6 rounded-2xl border-2 transition-all duration-300 ${selectedChoice === contestant.id
                                            ? 'border-yellow-400 bg-yellow-400/10 shadow-lg shadow-yellow-400/25'
                                            : index === 0
                                                ? 'border-cyan-400/30 bg-cyan-400/5 hover:border-cyan-400 hover:bg-cyan-400/10'
                                                : 'border-pink-400/30 bg-pink-400/5 hover:border-pink-400 hover:bg-pink-400/10'
                                            }`}>

                                            <div className="relative mb-6">
                                                <div className={`w-full h-64 rounded-xl overflow-hidden border-2 ${index === 0 ? 'border-cyan-400/50' : 'border-pink-400/50'
                                                    }`}>
                                                    <img
                                                        src={contestant.image}
                                                        alt={contestant.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                                                </div>

                                                {contestant.winStreak > 0 && (
                                                    <div className={`absolute -top-2 -right-2 px-3 py-1 rounded-full text-xs font-bold ${index === 0 ? 'bg-cyan-400 text-black' : 'bg-pink-400 text-black'
                                                        }`}>
                                                        {contestant.winStreak} WIN STREAK
                                                    </div>
                                                )}
                                            </div>

                                            <div className="text-center">
                                                <h3 className="text-2xl font-bold text-white mb-2">{contestant.name}</h3>
                                                <div className="flex justify-center items-center gap-2 mb-4">
                                                    <Flame className={`w-4 h-4 ${index === 0 ? 'text-cyan-400' : 'text-pink-400'}`} />
                                                    <span className="text-gray-300 font-mono text-sm">{contestant.votes} VOTES</span>
                                                </div>

                                                {selectedChoice === contestant.id && (
                                                    <div className="text-yellow-400 font-bold text-lg animate-bounce">
                                                        SELECTED!
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

                        <div className="text-center mb-8">
                            <div className="inline-block bg-white p-4 rounded-lg shadow-lg border-2 border-dashed border-amber-400 transform -rotate-1">
                                <h3 className="text-2xl font-bold text-amber-800 mb-1">토너먼트 대결</h3>
                                <p className="text-amber-600 text-sm">찢어서 선택하세요!</p>
                            </div>
                        </div>

                        <div className="text-center mb-8">
                            <div className="inline-block bg-white p-3 rounded-lg shadow-md border border-amber-200 transform rotate-1">
                                <div className="text-amber-700 text-sm mb-1">진행률: {gameData.progress}%</div>
                                <div className="w-48 h-3 bg-amber-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-1000"
                                        style={{ width: `${gameData.progress}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-12">
                            {gameData.contestants.map((contestant, index) => (
                                <div
                                    key={contestant.id}
                                    className={`cursor-pointer transition-all duration-300 ${selectedChoice === contestant.id ? 'scale-110 z-10' : 'hover:scale-105'
                                        }`}
                                    onClick={() => handleVote(contestant.id)}
                                    style={{
                                        transform: `rotate(${index === 0 ? '-2deg' : '2deg'}) ${selectedChoice === contestant.id ? 'scale(1.1)' : ''}`
                                    }}
                                >
                                    <div className="bg-white p-6 rounded-lg shadow-xl border-2 border-dashed border-gray-300 relative">
                                        <div className="absolute -top-2 left-4 w-8 h-4 bg-white transform rotate-12"></div>
                                        <div className="absolute -top-1 right-8 w-6 h-3 bg-white transform -rotate-12"></div>
                                        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-16 h-6 bg-yellow-200 opacity-70 rounded-sm border border-yellow-300"></div>

                                        <div className="relative">
                                            <div className="w-full h-48 rounded-lg overflow-hidden mb-4 border-2 border-gray-200">
                                                <img
                                                    src={contestant.image}
                                                    alt={contestant.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>

                                            <div className="text-center">
                                                <h3 className="text-xl font-bold text-gray-800 mb-2">{contestant.name}</h3>
                                                <div className="text-sm text-gray-600 mb-2">{contestant.votes} 표</div>

                                                {contestant.winStreak > 0 && (
                                                    <div className="inline-block bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-bold">
                                                        🔥 {contestant.winStreak}연승
                                                    </div>
                                                )}
                                            </div>

                                            {selectedChoice === contestant.id && (
                                                <div className="absolute inset-0 bg-red-500/20 rounded-lg flex items-center justify-center">
                                                    <div className="bg-red-500 text-white px-4 py-2 rounded-full font-bold text-lg transform rotate-12">
                                                        선택됨!
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

                        <div className="text-center mb-8">
                            <div className="inline-block bg-yellow-300 p-4 rounded-2xl border-4 border-black shadow-[8px_8px_0px_0px_#000] transform -rotate-1">
                                <h3 className="text-3xl font-black text-black tracking-wider">ULTIMATE SHOWDOWN!</h3>
                                <p className="text-black font-bold">누가 승리할 것인가?!</p>
                            </div>
                        </div>

                        <div className="text-center mb-8">
                            <div className="inline-block bg-red-500 text-white p-6 rounded-full border-4 border-black shadow-[4px_4px_0px_0px_#000]">
                                <div className="text-4xl font-black">VS</div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-8">
                            {gameData.contestants.map((contestant, index) => (
                                <div
                                    key={contestant.id}
                                    className={`cursor-pointer transition-all duration-300 ${selectedChoice === contestant.id ? 'scale-110' : 'hover:scale-105'
                                        }`}
                                    onClick={() => handleVote(contestant.id)}
                                >
                                    <div className={`bg-white p-6 rounded-2xl border-4 border-black shadow-[8px_8px_0px_0px_#000] relative ${selectedChoice === contestant.id ? 'bg-yellow-200' : ''
                                        }`}>

                                        <div className={`absolute -top-8 ${index === 0 ? 'left-4' : 'right-4'} bg-white border-2 border-black rounded-lg px-3 py-1`}>
                                            <div className="text-xs font-bold text-black">CHOOSE ME!</div>
                                            <div className={`absolute top-full ${index === 0 ? 'left-4' : 'right-4'} w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black`}></div>
                                        </div>

                                        <div className="relative">
                                            <div className="w-full h-48 rounded-xl overflow-hidden mb-4 border-4 border-black">
                                                <img
                                                    src={contestant.image}
                                                    alt={contestant.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>

                                            <div className="text-center">
                                                <h3 className="text-2xl font-black text-black mb-2">{contestant.name}</h3>
                                                <div className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-bold mb-2">
                                                    {contestant.votes} VOTES
                                                </div>

                                                {contestant.winStreak > 0 && (
                                                    <div className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                                                        {contestant.winStreak} WIN COMBO!
                                                    </div>
                                                )}
                                            </div>

                                            {selectedChoice === contestant.id && (
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <div className="bg-yellow-400 text-black px-6 py-3 rounded-2xl border-4 border-black font-black text-xl transform rotate-12 shadow-[4px_4px_0px_0px_#000]">
                                                        WINNER!
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

                <div className="text-center">
                    <p className="text-gray-600 mb-6 text-lg">어떤 게임플레이 디자인이 가장 독창적인가요?</p>
                    <div className="flex flex-wrap justify-center gap-3">
                        <span className="px-4 py-2 bg-black text-cyan-400 rounded text-sm font-mono">1. 네온 배틀</span>
                        <span className="px-4 py-2 bg-amber-100 text-amber-800 rounded text-sm">2. 종이 찢기</span>
                        <span className="px-4 py-2 bg-yellow-300 text-black rounded text-sm font-black">3. 만화책</span>
                    </div>
                </div>
            </div>
        </div>
    );
}