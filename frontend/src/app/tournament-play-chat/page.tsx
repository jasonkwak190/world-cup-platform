'use client';

import { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, User, ChevronRight, Heart, Star, Trophy, Home } from 'lucide-react';

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

export default function TournamentPlayChat() {
    const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
    const [isVoting, setIsVoting] = useState(false);
    const [messages, setMessages] = useState([
        { 
            id: 1, 
            sender: 'bot', 
            message: `안녕하세요! ${gameData.tournament} ${gameData.currentRound}에 오신 것을 환영합니다!`,
            time: '10:30'
        },
        { 
            id: 2, 
            sender: 'bot', 
            message: `이번 대결은 ${gameData.contestants[0].name}와(과) ${gameData.contestants[1].name} 사이의 매치입니다. 누구를 선택하시겠어요?`,
            time: '10:30'
        }
    ]);
    const [userInput, setUserInput] = useState('');
    const [showContestants, setShowContestants] = useState(true);
    const [showNextRound, setShowNextRound] = useState(false);
    
    const messagesEndRef = useRef<HTMLDivElement>(null);
    
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };
    
    useEffect(() => {
        scrollToBottom();
    }, [messages]);
    
    const handleVote = (contestantId: string) => {
        if (isVoting) return;
        
        setSelectedChoice(contestantId);
        setIsVoting(true);
        
        const contestant = gameData.contestants.find(c => c.id === contestantId);
        
        setMessages(prev => [
            ...prev,
            { 
                id: prev.length + 1, 
                sender: 'user', 
                message: `저는 ${contestant?.name}을(를) 선택합니다!`,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
        ]);
        
        setTimeout(() => {
            setMessages(prev => [
                ...prev,
                { 
                    id: prev.length + 1, 
                    sender: 'bot', 
                    message: `${contestant?.name}을(를) 선택하셨군요! 투표를 처리하고 있습니다...`,
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }
            ]);
            
            setTimeout(() => {
                setMessages(prev => [
                    ...prev,
                    { 
                        id: prev.length + 1, 
                        sender: 'bot', 
                        message: `투표가 완료되었습니다! ${contestant?.name}은(는) 현재 ${contestant?.votes}표를 받았습니다.`,
                        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    }
                ]);
                
                setShowContestants(false);
                setShowNextRound(true);
                setIsVoting(false);
            }, 2000);
        }, 1000);
    };
    
    const handleNextRound = () => {
        setMessages(prev => [
            ...prev,
            { 
                id: prev.length + 1, 
                sender: 'user', 
                message: '다음 라운드로 진행할게요!',
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
        ]);
        
        setTimeout(() => {
            setMessages(prev => [
                ...prev,
                { 
                    id: prev.length + 1, 
                    sender: 'bot', 
                    message: '다음 라운드를 준비하고 있습니다. 잠시만 기다려주세요...',
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }
            ]);
            
            setTimeout(() => {
                setMessages(prev => [
                    ...prev,
                    { 
                        id: prev.length + 1, 
                        sender: 'bot', 
                        message: '결승전이 준비되었습니다! 새로운 대결을 시작하세요.',
                        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    }
                ]);
                
                setShowNextRound(false);
                setSelectedChoice(null);
                setShowContestants(true);
            }, 2000);
        }, 1000);
    };
    
    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!userInput.trim()) return;
        
        setMessages(prev => [
            ...prev,
            { 
                id: prev.length + 1, 
                sender: 'user', 
                message: userInput,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
        ]);
        
        setUserInput('');
        
        setTimeout(() => {
            if (selectedChoice) {
                setMessages(prev => [
                    ...prev,
                    { 
                        id: prev.length + 1, 
                        sender: 'bot', 
                        message: '다음 라운드로 진행하시려면 아래 버튼을 눌러주세요!',
                        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    }
                ]);
            } else {
                setMessages(prev => [
                    ...prev,
                    { 
                        id: prev.length + 1, 
                        sender: 'bot', 
                        message: '원하는 후보를 선택해주세요!',
                        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    }
                ]);
            }
        }, 500);
    };

    return (
        <div className="min-h-screen bg-gray-100 py-8">
            <div className="max-w-3xl mx-auto">
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                    {/* 헤더 */}
                    <div className="bg-blue-500 text-white p-4 flex items-center justify-between">
                        <div className="flex items-center">
                            <MessageCircle className="h-6 w-6 mr-2" />
                            <h1 className="text-xl font-semibold">{gameData.tournament}</h1>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="bg-blue-700 px-2 py-1 rounded-full text-xs">{gameData.currentRound}</span>
                            <span className="bg-blue-700 px-2 py-1 rounded-full text-xs">진행률: {gameData.progress}%</span>
                        </div>
                    </div>
                    
                    {/* 채팅 영역 */}
                    <div className="h-[500px] overflow-y-auto p-4 bg-gray-50">
                        {messages.map((msg) => (
                            <div key={msg.id} className={`flex mb-4 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                {msg.sender === 'bot' && (
                                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white mr-2 flex-shrink-0">
                                        <User className="w-5 h-5" />
                                    </div>
                                )}
                                <div className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                                    msg.sender === 'user' 
                                        ? 'bg-blue-500 text-white rounded-tr-none' 
                                        : 'bg-white text-gray-800 shadow-sm rounded-tl-none'
                                }`}>
                                    <p className="text-sm">{msg.message}</p>
                                    <p className={`text-xs mt-1 text-right ${msg.sender === 'user' ? 'text-blue-100' : 'text-gray-500'}`}>
                                        {msg.time}
                                    </p>
                                </div>
                                {msg.sender === 'user' && (
                                    <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-700 ml-2 flex-shrink-0">
                                        <User className="w-5 h-5" />
                                    </div>
                                )}
                            </div>
                        ))}
                        
                        {/* 후보자 선택 옵션 */}
                        {showContestants && (
                            <div className="mb-4">
                                <p className="text-sm text-gray-500 mb-2">후보 선택:</p>
                                <div className="grid grid-cols-2 gap-4">
                                    {gameData.contestants.map((contestant) => (
                                        <button
                                            key={contestant.id}
                                            onClick={() => handleVote(contestant.id)}
                                            disabled={isVoting}
                                            className={`flex flex-col items-center p-3 rounded-xl border transition-colors ${
                                                selectedChoice === contestant.id
                                                    ? 'bg-blue-100 border-blue-500'
                                                    : 'bg-white border-gray-200 hover:border-blue-300'
                                            } ${isVoting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                        >
                                            <div className="relative w-full mb-2">
                                                <div className="aspect-square rounded-lg overflow-hidden">
                                                    <img
                                                        src={contestant.image}
                                                        alt={contestant.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                                {contestant.winStreak > 0 && (
                                                    <div className="absolute top-1 right-1 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                                                        {contestant.winStreak}연승
                                                    </div>
                                                )}
                                            </div>
                                            <h3 className="font-medium text-gray-900">{contestant.name}</h3>
                                            <p className="text-xs text-gray-500">{contestant.subtitle}</p>
                                            
                                            {selectedChoice === contestant.id && (
                                                <div className="mt-2 flex items-center text-blue-500 text-sm">
                                                    <Heart className="w-4 h-4 mr-1" />
                                                    <span>선택됨</span>
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        {/* 다음 라운드 버튼 */}
                        {showNextRound && (
                            <div className="flex justify-center my-4">
                                <button
                                    onClick={handleNextRound}
                                    className="bg-green-500 text-white px-6 py-2 rounded-full font-medium hover:bg-green-600 transition-colors flex items-center gap-2"
                                >
                                    다음 라운드로
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                        
                        {isVoting && (
                            <div className="flex justify-center my-4">
                                <div className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-full">
                                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                    <span className="text-sm text-gray-600">투표 처리 중...</span>
                                </div>
                            </div>
                        )}
                        
                        <div ref={messagesEndRef} />
                    </div>
                    
                    {/* 입력 영역 */}
                    <div className="border-t border-gray-200 p-4 bg-white">
                        <form onSubmit={handleSendMessage} className="flex gap-2">
                            <input
                                type="text"
                                value={userInput}
                                onChange={(e) => setUserInput(e.target.value)}
                                placeholder="메시지를 입력하세요..."
                                className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button
                                type="submit"
                                className="bg-blue-500 text-white rounded-full p-2 hover:bg-blue-600 transition-colors"
                            >
                                <Send className="w-5 h-5" />
                            </button>
                        </form>
                    </div>
                </div>
                
                {/* 하단 네비게이션 */}
                <div className="mt-6 flex justify-center gap-4">
                    <button className="p-3 bg-white rounded-full shadow-md text-gray-600 hover:text-blue-500 transition-colors">
                        <Home className="w-5 h-5" />
                    </button>
                    <button className="p-3 bg-white rounded-full shadow-md text-gray-600 hover:text-blue-500 transition-colors">
                        <Star className="w-5 h-5" />
                    </button>
                    <button className="p-3 bg-white rounded-full shadow-md text-gray-600 hover:text-blue-500 transition-colors">
                        <Trophy className="w-5 h-5" />
                    </button>
                </div>
                
                <div className="mt-4 text-center text-gray-500 text-sm">
                    <p>채팅 인터페이스를 통해 토너먼트를 즐겨보세요!</p>
                </div>
            </div>
        </div>
    );
}