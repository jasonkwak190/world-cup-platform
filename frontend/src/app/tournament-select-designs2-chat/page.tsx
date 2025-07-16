'use client';

import { useState, useEffect, useRef } from 'react';
import { Flame, Zap, Target, Trophy, Swords, MessageCircle, Send, User, ChevronRight } from 'lucide-react';

const tournamentOptions = [
  { 
    id: '4', 
    name: '4강', 
    choices: 4, 
    rounds: 2, 
    duration: '2분', 
    vibe: '빠른 결정',
    intensity: 1,
    description: '간단명료',
    accentColor: '#10b981',
    icon: <Zap className="w-5 h-5" />
  },
  { 
    id: '8', 
    name: '8강', 
    choices: 8, 
    rounds: 3, 
    duration: '3분', 
    vibe: '적당한 고민',
    intensity: 2,
    description: '밸런스',
    accentColor: '#3b82f6',
    icon: <Target className="w-5 h-5" />
  },
  { 
    id: '16', 
    name: '16강', 
    choices: 16, 
    rounds: 4, 
    duration: '5분', 
    vibe: '진지한 선택',
    intensity: 3,
    description: '클래식',
    accentColor: '#8b5cf6',
    icon: <Trophy className="w-5 h-5" />
  },
  { 
    id: '32', 
    name: '32강', 
    choices: 32, 
    rounds: 5, 
    duration: '8분', 
    vibe: '치열한 경쟁',
    intensity: 4,
    description: '본격파',
    accentColor: '#f59e0b',
    icon: <Flame className="w-5 h-5" />
  },
  { 
    id: '64', 
    name: '64강', 
    choices: 64, 
    rounds: 6, 
    duration: '12분', 
    vibe: '극한의 선택',
    intensity: 5,
    description: '하드코어',
    accentColor: '#ef4444',
    icon: <Swords className="w-5 h-5" />
  }
];

const designStyles = [
  { id: 'neon', name: '네온 사이버', color: 'bg-purple-500', icon: '🌟' },
  { id: 'paper', name: '종이 찢기', color: 'bg-amber-500', icon: '📝' },
  { id: 'comic', name: '만화책', color: 'bg-blue-500', icon: '💥' },
  { id: 'minimal', name: '미니멀', color: 'bg-gray-500', icon: '✨' },
  { id: 'gaming', name: '게이밍 RGB', color: 'bg-red-500', icon: '🎮' }
];

export default function TournamentSelectDesignsChat() {
  const [selectedTournament, setSelectedTournament] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState([
    { 
      id: 1, 
      sender: 'bot', 
      message: '안녕하세요! 토너먼트 디자인 선택을 도와드릴게요. 먼저 토너먼트 규모를 선택해주세요.',
      time: '10:30'
    }
  ]);
  const [userInput, setUserInput] = useState('');
  const [showTournamentOptions, setShowTournamentOptions] = useState(true);
  const [showStyleOptions, setShowStyleOptions] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const handleTournamentSelect = (tournamentId: string) => {
    setSelectedTournament(tournamentId);
    const tournament = tournamentOptions.find(t => t.id === tournamentId);
    
    setMessages(prev => [
      ...prev,
      { 
        id: prev.length + 1, 
        sender: 'user', 
        message: `${tournament?.name} 토너먼트를 선택할게요.`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    
    setTimeout(() => {
      setMessages(prev => [
        ...prev,
        { 
          id: prev.length + 1, 
          sender: 'bot', 
          message: `${tournament?.name} 토너먼트를 선택하셨네요! ${tournament?.choices}개의 선택지로 ${tournament?.rounds}라운드를 진행하게 됩니다. 예상 소요시간은 ${tournament?.duration}입니다. 이제 디자인 스타일을 선택해주세요.`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      setShowTournamentOptions(false);
      setShowStyleOptions(true);
    }, 500);
  };
  
  const handleStyleSelect = (styleId: string) => {
    setSelectedStyle(styleId);
    const style = designStyles.find(s => s.id === styleId);
    
    setMessages(prev => [
      ...prev,
      { 
        id: prev.length + 1, 
        sender: 'user', 
        message: `${style?.name} 스타일로 진행할게요.`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    
    setTimeout(() => {
      setMessages(prev => [
        ...prev,
        { 
          id: prev.length + 1, 
          sender: 'bot', 
          message: `${style?.name} 스타일을 선택하셨네요! 멋진 선택입니다. 이제 토너먼트를 시작할 준비가 되었습니다. 시작하시겠어요?`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      setShowStyleOptions(false);
    }, 500);
  };
  
  const handleStartTournament = () => {
    if (!selectedTournament || !selectedStyle) return;
    
    setMessages(prev => [
      ...prev,
      { 
        id: prev.length + 1, 
        sender: 'user', 
        message: '네, 토너먼트를 시작해주세요!',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    
    setIsLoading(true);
    
    setTimeout(() => {
      setMessages(prev => [
        ...prev,
        { 
          id: prev.length + 1, 
          sender: 'bot', 
          message: '토너먼트를 준비하고 있습니다. 잠시만 기다려주세요...',
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
            message: `${selectedTournament}강 토너먼트가 ${designStyles.find(s => s.id === selectedStyle)?.name} 스타일로 준비되었습니다! 즐거운 토너먼트 되세요! 🎉`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      }, 2000);
    }, 500);
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
      if (selectedTournament && selectedStyle) {
        setMessages(prev => [
          ...prev,
          { 
            id: prev.length + 1, 
            sender: 'bot', 
            message: '토너먼트를 시작하시려면 아래 시작하기 버튼을 눌러주세요!',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      } else if (selectedTournament) {
        setMessages(prev => [
          ...prev,
          { 
            id: prev.length + 1, 
            sender: 'bot', 
            message: '디자인 스타일을 선택해주세요.',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      } else {
        setMessages(prev => [
          ...prev,
          { 
            id: prev.length + 1, 
            sender: 'bot', 
            message: '먼저 토너먼트 규모를 선택해주세요.',
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
              <h1 className="text-xl font-semibold">토너먼트 디자인 선택</h1>
            </div>
            <div className="text-sm">
              {selectedTournament && <span className="bg-blue-700 px-2 py-1 rounded-full text-xs mr-2">{selectedTournament}강</span>}
              {selectedStyle && <span className="bg-blue-700 px-2 py-1 rounded-full text-xs">{designStyles.find(s => s.id === selectedStyle)?.name}</span>}
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
            
            {/* 토너먼트 선택 옵션 */}
            {showTournamentOptions && (
              <div className="mb-4">
                <p className="text-sm text-gray-500 mb-2">토너먼트 규모 선택:</p>
                <div className="flex flex-wrap gap-2">
                  {tournamentOptions.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => handleTournamentSelect(option.id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-colors ${
                        selectedTournament === option.id
                          ? 'bg-blue-500 text-white'
                          : 'bg-white text-gray-800 hover:bg-gray-100 border border-gray-200'
                      }`}
                    >
                      <span className="text-lg">{option.icon}</span>
                      <span>{option.name}</span>
                      <span className="text-xs opacity-75">({option.choices}명)</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {/* 디자인 스타일 선택 옵션 */}
            {showStyleOptions && (
              <div className="mb-4">
                <p className="text-sm text-gray-500 mb-2">디자인 스타일 선택:</p>
                <div className="flex flex-wrap gap-2">
                  {designStyles.map((style) => (
                    <button
                      key={style.id}
                      onClick={() => handleStyleSelect(style.id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-colors ${
                        selectedStyle === style.id
                          ? 'bg-blue-500 text-white'
                          : 'bg-white text-gray-800 hover:bg-gray-100 border border-gray-200'
                      }`}
                    >
                      <span className="text-lg">{style.icon}</span>
                      <span>{style.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {/* 토너먼트 시작 버튼 */}
            {selectedTournament && selectedStyle && !isLoading && (
              <div className="flex justify-center my-4">
                <button
                  onClick={handleStartTournament}
                  className="bg-green-500 text-white px-6 py-2 rounded-full font-medium hover:bg-green-600 transition-colors flex items-center gap-2"
                >
                  토너먼트 시작하기
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
            
            {isLoading && (
              <div className="flex justify-center my-4">
                <div className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-full">
                  <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm text-gray-600">토너먼트 준비 중...</span>
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
        
        <div className="mt-6 text-center text-gray-500 text-sm">
          <p>채팅 인터페이스를 통해 토너먼트 규모와 디자인 스타일을 선택해보세요!</p>
        </div>
      </div>
    </div>
  );
}