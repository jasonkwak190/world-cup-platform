import { Tournament } from '@/types/game';
import { ArrowLeft, RotateCcw, Home, Trophy, List } from 'lucide-react';
import { getRoundName } from '@/utils/tournament';

interface GameProgressProps {
  tournament: Tournament;
  progress: {
    current: number;
    total: number;
    percentage: number;
  };
  onUndo: () => void;
  canUndo: boolean;
  onGoHome: () => void;
  onSelectTournament?: () => void;
}

export default function GameProgress({
  tournament,
  progress,
  onUndo,
  canUndo,
  onGoHome,
  onSelectTournament,
}: GameProgressProps) {
  // 다음 라운드까지 남은 경기 수 계산
  const getMatchesUntilNextRound = () => {
    const currentRoundMatches = tournament.matches.filter(
      match => match.round === tournament.currentRound
    );
    const completedCurrentRound = currentRoundMatches.filter(match => match.isCompleted).length;
    const totalCurrentRound = currentRoundMatches.length;
    return totalCurrentRound - completedCurrentRound;
  };

  const getNextRoundName = () => {
    if (tournament.currentRound === tournament.totalRounds) {
      return '결승 완료';
    }
    return getRoundName(tournament.currentRound + 1, tournament.totalRounds);
  };

  const matchesLeft = getMatchesUntilNextRound();
  const nextRoundName = getNextRoundName();

  return (
    <div className="bg-black/20 backdrop-blur-sm border-b border-white/10">
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Left: Back and Title */}
          <div className="flex items-center space-x-4">
            <button
              onClick={onGoHome}
              className="p-2 text-white hover:text-emerald-400 transition-colors"
              title="홈으로"
            >
              <Home className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-white">
                {tournament.title}
              </h1>
              <div className="flex items-center space-x-4">
                {matchesLeft > 0 && (
                  <div className="flex items-center space-x-1 bg-blue-600/20 backdrop-blur-sm px-2 py-1 rounded-full">
                    <Trophy className="w-3 h-3 text-blue-400" />
                    <span className="text-xs text-blue-300 font-medium">
                      {nextRoundName}까지 {matchesLeft}경기
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Center: Progress Bar */}
          <div className="flex-1 max-w-md mx-8">
            <div className="text-center mb-2">
              <span className="text-white text-sm font-medium">
                진행률 {progress.percentage}%
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-emerald-500 to-blue-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progress.percentage}%` }}
              />
            </div>
            <div className="text-center mt-1">
              <span className="text-gray-300 text-xs">
                {progress.current} / {progress.total} 경기 완료
              </span>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center space-x-2">
            <button
              onClick={onUndo}
              disabled={!canUndo}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                canUndo
                  ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
              }`}
              title="되돌리기"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:inline">선택지 되돌리기</span>
            </button>
            {onSelectTournament && (
              <button
                onClick={onSelectTournament}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                title="다른 토너먼트 선택"
              >
                <List className="w-4 h-4" />
                <span className="hidden sm:inline">다른 토너먼트</span>
              </button>
            )}
          </div>
        </div>

        {/* Tournament Bracket Preview (Mobile Hidden) */}
        <div className="hidden lg:block mt-4">
          <div className="flex items-center justify-center space-x-2">
            {Array.from({ length: tournament.totalRounds }, (_, i) => {
              const round = i + 1;
              const isCurrentRound = round === tournament.currentRound;
              const isCompletedRound = round < tournament.currentRound;
              
              // 라운드별 화려한 스타일 정의
              const getRoundStyle = (round: number, totalRounds: number, isCurrent: boolean, isCompleted: boolean) => {
                const remainingRounds = totalRounds - round + 1;
                
                if (isCurrent) {
                  switch (remainingRounds) {
                    case 1: // 결승
                      return 'px-4 py-2 rounded-full text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-red-500 to-pink-500 border-2 border-yellow-400 shadow-lg drop-shadow-[0_0_20px_rgba(255,215,0,0.8)]';
                    case 2: // 준결승
                      return 'px-4 py-2 rounded-full text-base font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 border-2 border-purple-500 shadow-lg drop-shadow-[0_0_15px_rgba(168,85,247,0.8)]';
                    case 3: // 8강
                      return 'px-3 py-2 rounded-full text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 border-2 border-blue-500 shadow-md drop-shadow-[0_0_10px_rgba(59,130,246,0.8)]';
                    case 4: // 16강
                      return 'px-3 py-1 rounded-full text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-500 via-blue-500 to-purple-500 border-2 border-green-500 shadow-md drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]';
                    default: // 32강 이상
                      return 'px-3 py-1 rounded-full text-xs font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 via-green-500 to-blue-500 border border-emerald-500 shadow-sm drop-shadow-[0_0_5px_rgba(16,185,129,0.6)]';
                  }
                } else if (isCompleted) {
                  return 'px-3 py-1 rounded-full text-xs font-medium bg-green-600 text-white shadow-sm';
                } else {
                  return 'px-3 py-1 rounded-full text-xs font-medium bg-gray-600 text-gray-300';
                }
              };
              
              return (
                <div key={round} className="flex items-center">
                  <div className={getRoundStyle(round, tournament.totalRounds, isCurrentRound, isCompletedRound)}>
                    {getRoundName(round, tournament.totalRounds)}
                  </div>
                  {round < tournament.totalRounds && (
                    <ArrowLeft className={`w-4 h-4 mx-1 rotate-180 ${
                      isCurrentRound || (round < tournament.currentRound) 
                        ? 'text-yellow-400' 
                        : 'text-gray-400'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}