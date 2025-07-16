'use client';

import { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, User, ChevronRight, Share2, Home, RotateCcw, Trophy, Heart } from 'lucide-react';

// 샘플 결과 데이터
const tournamentResult = {
  winner: {
    id: 'winner1',
    name: 'IU',
    subtitle: '솔로 아티스트',
    image: 'https://images.unsplash.com/photo-1494790108755-2616c9c0b8d3?w=600&h=600&fit=crop&crop=face',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // 샘플 유튜브 URL
    votes: 2847,
    winRate: 89.2
  },
  tournament: {
    type: '16강',
    totalParticipants: 16,
    playTime: '7분 32초',
    totalVotes: 3194,
    category: '최고의 K-POP 아이돌 월드컵'
  },
  stats: {
    totalMatches: 15,
    averageVoteTime: '2.3초',
    mostVotedMatch: 'IU vs NewJeans',
    closestMatch: 'BLACKPINK vs TWICE (52% vs 48%)'
  }
};

export default function TournamentResultChat() {
    const [messages, setMessages] = useState([
        { 
            id: 1, 
            sender: 'bot', 
            message: `축하합니다! ${tournamentResult.tournament.category} 토너먼트가 완료되었습니다!`,
            time: '10:30'
        },
        { 
            id: 2, 
            sender: 'bot', 
            message: `${tournamentResult.winner.name}님이 우승자로 선정되었습니다! 🏆`,
            time: '10:30'
        }
    ]);
    const [userInput, setUserInput] = useState('');
    const [showWinner, setShowWinner] = useState(true);
    const [showStats, setShowStats] = useState(false);
    const [showActions, setShowActions] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    
    const messagesEndRef = useRef<HTMLDivElement>(null);
    
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };
    
    useEffect(() => {
        scrollToBottom();
        
        // 자동으로 통계 정보 표시
        const timer = setTimeout(() => {
            setMessages(prev => [
                ...prev,
                { 
                    id: prev.length + 1, 
                    sender: 'bot', 
                    message: '토너먼트 결과에 대한 통계 정보를 확인하시겠어요?',
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }
            ]);
            setShowStats(true);
        }, 2000);
        
        return () => clearTimeout(timer);
    }, [messages]);
    
    const handleShowStats = () => {
        setMessages(prev => [
            ...prev,
            { 
                id: prev.length + 1, 
                sender: 'user', 
                message: '네, 통계 정보를 보여주세요!',
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
        ]);
        
        setTimeout(() => {
            setMessages(prev => [
                ...prev,
                { 
                    id: prev.length + 1, 
                    sender: 'bot', 
                    message: `토너먼트 통계 정보입니다:
                    - 토너먼트 유형: ${tournamentResult.tournament.type}
                    - 총 참가자: ${tournamentResult.tournament.totalParticipants}명
                    - 플레이 시간: ${tournamentResult.tournament.playTime}
                    - 총 투표 수: ${tournamentResult.tournament.totalVotes}표
                    - 우승자 득표 수: ${tournamentResult.winner.votes}표
                    - 우승자 승률: ${tournamentResult.winner.winRate}%`,
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }
            ]);
            
            setShowStats(false);
            setShowActions(true);
        }, 1000);
    };
    
    const handleAction = (action: string) => {
        setIsLoading(true);
        
        let message = '';
        switch(action) {
            case 'restart':
                message = '토너먼트를 다시 시작할게요!';
                break;
            case 'home':
                message = '홈으로 돌아갈게요!';
                break;
            case 'ranking':
                message = '랭킹을 확인할게요!';
                break;
            case 'share':
                message = '결과를 공유할게요!';
                break;
        }
        
        setMessages(prev => [
            ...prev,
            { 
                id: prev.length + 1, 
                sender: 'user', 
                message,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
        ]);
        
        setTimeout(() => {
            setMessages(prev => [
                ...prev,
                { 
                    id: prev.length + 1, 
                    sender: 'bot', 
                    message: `${action === 'restart' ? '새로운 토너먼트를' : action === 'home' ? '홈 화면을' : action === 'ranking' ? '랭킹 페이지를' : '공유 옵션을'} 준비하고 있습니다. 잠시만 기다려주세요...`,
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }
            ]);
            
            setTimeout(() => {
                setIsLoading(false);
                setMessages(prev => [
                    ...prev,
                    { 
                        id: prev.length + 1, 
                        sender: 'bot', 
                        message: `${action === 'restart' ? '새로운 토너먼트가' : action === 'home' ? '홈 화면이' : action === 'ranking' ? '랭킹 페이지가' : '공유 링크가'} 준비되었습니다!`,
                        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    }
                ]);
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
            setMessages(prev => [
                ...prev,
                { 
                    id: prev.length + 1, 
                    sender: 'bot', 
                    message: '무엇을 도와드릴까요? 아래 버튼을 통해 다양한 옵션을 선택하실 수 있습니다.',
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }
            ]);
            
            if (!showActions) {
                setShowActions(true);
            }
        }, 1000);
    };

    return (
        <div className="min-h-screen bg-gray-100 py-8">
            <div className="max-w-3xl mx-auto">
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                    {/* 헤더 */}
                    <div className="bg-blue-500 text-white p-4 flex items-center justify-between">
                        <div className="flex items-center">
                            <MessageCircle className="h-6 w-6 mr-2" />
                            <h1 className="text-xl font-semibold">토너먼트 결과</h1>
                        </div>
                        <div className="text-sm">
                            <span className="bg-blue-700 px-2 py-1 rounded-full text-xs">{tournamentResult.tournament.category}</span>
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
                                    <p className="text-sm whitespace-pre-line">{msg.message}</p>
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
                        
                        {/* 우승자 정보 */}
                        {showWinner && (
                            <div className="mb-4 bg-white rounded-xl shadow-md p-4 border border-blue-100">
                                <div className="flex items-center">
                                    <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-blue-500 mr-4">
                                        <img
                                            src={tournamentResult.winner.image}
                                            alt={tournamentResult.winner.name}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900">{tournamentResult.winner.name}</h3>
                                        <p className="text-sm text-gray-600">{tournamentResult.winner.subtitle}</p>
                                        <div className="mt-2 flex items-center text-blue-500 text-sm">
                                            <Trophy className="w-4 h-4 mr-1" />
                                            <span>우승자</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        {/* 통계 정보 버튼 */}
                        {showStats && (
                            <div className="flex justify-center my-4">
                                <button
                                    onClick={handleShowStats}
                                    className="bg-blue-500 text-white px-6 py-2 rounded-full font-medium hover:bg-blue-600 transition-colors flex items-center gap-2"
                                >
                                    통계 정보 보기
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                        
                        {/* 액션 버튼들 */}
                        {showActions && (
                            <div className="grid grid-cols-2 gap-3 my-4">
                                <button
                                    onClick={() => handleAction('restart')}
                                    disabled={isLoading}
                                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-colors ${
                                        isLoading
                                            ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                                            : 'bg-white text-blue-500 border-blue-200 hover:bg-blue-50 hover:border-blue-300'
                                    }`}
                                >
                                    <RotateCcw className="w-5 h-5" />
                                    <span>다시 시작하기</span>
                                </button>
                                
                                <button
                                    onClick={() => handleAction('home')}
                                    disabled={isLoading}
                                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-colors ${
                                        isLoading
                                            ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                                            : 'bg-white text-green-500 border-green-200 hover:bg-green-50 hover:border-green-300'
                                    }`}
                                >
                                    <Home className="w-5 h-5" />
                                    <span>홈으로</span>
                                </button>
                                
                                <button
                                    onClick={() => handleAction('ranking')}
                                    disabled={isLoading}
                                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-colors ${
                                        isLoading
                                            ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                                            : 'bg-white text-yellow-500 border-yellow-200 hover:bg-yellow-50 hover:border-yellow-300'
                                    }`}
                                >
                                    <Trophy className="w-5 h-5" />
                                    <span>랭킹 보기</span>
                                </button>
                                
                                <button
                                    onClick={() => handleAction('share')}
                                    disabled={isLoading}
                                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-colors ${
                                        isLoading
                                            ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                                            : 'bg-white text-purple-500 border-purple-200 hover:bg-purple-50 hover:border-purple-300'
                                    }`}
                                >
                                    <Share2 className="w-5 h-5" />
                                    <span>결과 공유</span>
                                </button>
                            </div>
                        )}
                        
                        {isLoading && (
                            <div className="flex justify-center my-4">
                                <div className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-full">
                                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                    <span className="text-sm text-gray-600">처리 중...</span>
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
                
                {/* 하단 정보 */}
                <div className="mt-6 text-center text-gray-500 text-sm">
                    <p>채팅 인터페이스를 통해 토너먼트 결과를 확인하고 다양한 옵션을 선택해보세요!</p>
                    <div className="mt-2 flex justify-center items-center">
                        <Heart className="w-4 h-4 text-red-400 mr-1" />
                        <span>{tournamentResult.winner.name}님의 우승을 축하합니다!</span>
                    </div>
                </div>
            </div>
        </div>
    );
}