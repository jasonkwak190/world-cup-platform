import { useState, useEffect } from 'react';
import { Tournament, WorldCupItem } from '@/types/game';
import { motion } from 'framer-motion';
import { Trophy, RotateCcw, Home, Share2, Download, BarChart3, List } from 'lucide-react';
import CommentSystem from '../CommentSystem';
import RankingModal from '../shared/RankingModal';
import { saveGameResult, type GameResult } from '@/utils/gameStats';

interface GameResultProps {
  tournament: Tournament;
  onRestart: () => void;
  onGoHome: () => void;
  playTime: number;
  worldcupId?: string;
}

export default function GameResult({
  tournament,
  onRestart,
  onGoHome,
  playTime,
  worldcupId,
}: GameResultProps) {
  const [showRanking, setShowRanking] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [commentCount, setCommentCount] = useState(0);
  const [statsSaved, setStatsSaved] = useState(false);
  const [statsReady, setStatsReady] = useState(false);

  // 게임 결과를 통계에 저장
  useEffect(() => {
    if (!statsSaved && tournament.winner && worldcupId) {
      const saveStats = async () => {
        try {
          const gameResult: GameResult = {
            worldcupId: worldcupId,
            sessionId: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: Date.now(),
            winner: tournament.winner,
            matches: tournament.matches.filter(match => match.isCompleted),
            totalRounds: tournament.totalRounds,
            playTime: playTime
          };

          console.log('📊 Starting to save game stats...', gameResult.sessionId);
          await saveGameResult(gameResult);
          
          // 통계 저장 완료 - 하지만 자동으로 refresh하지 않음
          // 사용자가 랭킹 버튼을 클릭했을 때만 refresh 하도록 변경
          setStatsReady(true);
          console.log('✅ Game stats saved successfully, ready for ranking view');
          
        } catch (error) {
          console.error('❌ Failed to save game stats:', error);
        }
      };

      saveStats();
      setStatsSaved(true);
    }
  }, [tournament.winner, worldcupId, playTime, tournament.matches, tournament.totalRounds, statsSaved]);
  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleShare = async () => {
    const shareData = {
      title: `${tournament.title} 결과`,
      text: `${tournament.winner?.title}이(가) 우승했습니다!`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        console.log('공유 취소됨');
      }
    } else {
      // Fallback: Copy to clipboard
      navigator.clipboard.writeText(
        `${shareData.title} - ${shareData.text} ${shareData.url}`
      );
      alert('링크가 클립보드에 복사되었습니다!');
    }
  };

  const handleDownloadResult = () => {
    // 결과 이미지 생성 및 다운로드 (간단한 구현)
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 800;
    canvas.height = 600;

    // 배경
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 제목
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(tournament.title, canvas.width / 2, 100);

    // 우승자
    ctx.font = 'bold 48px Arial';
    ctx.fillStyle = '#10b981';
    ctx.fillText('🏆', canvas.width / 2, 200);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px Arial';
    ctx.fillText(tournament.winner?.title || '', canvas.width / 2, 280);

    // 다운로드
    const link = document.createElement('a');
    link.download = `${tournament.title}_결과.png`;
    link.href = canvas.toDataURL();
    link.click();
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 p-4">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-3xl p-8 w-full text-center shadow-2xl mb-6"
        >
        {/* Trophy Animation */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
          className="mb-6"
        >
          <Trophy className="w-24 h-24 text-yellow-500 mx-auto mb-4" />
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-4xl font-bold text-gray-900 mb-2"
          >
            우승!
          </motion.h1>
        </motion.div>

        {/* Winner */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mb-8"
        >
          <div className="bg-gradient-to-br from-emerald-100 to-blue-100 rounded-2xl p-8 mb-6">
            {/* Winner Image */}
            <div 
              className="w-48 h-48 mx-auto mb-6 rounded-2xl overflow-hidden shadow-lg cursor-pointer hover:scale-105 transition-transform"
              onClick={() => tournament.winner?.image && setShowImageModal(true)}
            >
              {tournament.winner?.image ? (
                <img 
                  src={tournament.winner.image} 
                  alt={tournament.winner.title}
                  className="w-full h-full object-contain bg-gray-50"
                  onError={(e) => {
                    // 이미지 로딩 실패 시 플레이스홀더 표시
                    e.currentTarget.style.display = 'none';
                    const parent = e.currentTarget.parentElement;
                    if (parent) {
                      const fallback = parent.querySelector('.winner-fallback');
                      if (fallback) {
                        fallback.classList.remove('hidden');
                      }
                    }
                  }}
                />
              ) : null}
              <div className={`winner-fallback ${tournament.winner?.image ? 'hidden' : ''} w-full h-full bg-gradient-to-br from-yellow-100 to-orange-100 flex items-center justify-center`}>
                <div className="text-8xl">🎭</div>
              </div>
            </div>
            <div className="text-6xl mb-4">👑</div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {tournament.winner?.title}
            </h2>
            {tournament.winner?.description && (
              <p className="text-gray-600 text-lg">
                {tournament.winner.description}
              </p>
            )}
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="grid grid-cols-2 gap-4 mb-8"
        >
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-emerald-600">
              {formatTime(playTime)}
            </div>
            <div className="text-sm text-gray-600">플레이 시간</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-emerald-600">
              {tournament.items.length}강
            </div>
            <div className="text-sm text-gray-600">토너먼트</div>
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
          className="space-y-4"
        >
          {/* Primary Actions */}
          <div className="flex space-x-4">
            <button
              onClick={onRestart}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 px-6 rounded-xl font-semibold transition-colors flex items-center justify-center space-x-2"
            >
              <RotateCcw className="w-5 h-5" />
              <span>다시 하기</span>
            </button>
            <button
              onClick={onGoHome}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 px-6 rounded-xl font-semibold transition-colors flex items-center justify-center space-x-2"
            >
              <Home className="w-5 h-5" />
              <span>홈으로</span>
            </button>
          </div>

          {/* Secondary Actions */}
          <div className="flex space-x-4">
            <button
              onClick={() => {
                setShowRanking(true);
              }}
              className={`flex-1 ${
                statsReady 
                  ? 'bg-green-100 hover:bg-green-200 text-green-700' 
                  : 'bg-gray-100 text-gray-500'
              } py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>게임 랭킹 보기</span>
              {statsReady && (
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              )}
            </button>
            <button
              onClick={handleShare}
              className="flex-1 bg-blue-100 hover:bg-blue-200 text-blue-700 py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
            >
              <Share2 className="w-4 h-4" />
              <span>결과 공유</span>
            </button>
            <button
              onClick={handleDownloadResult}
              className="flex-1 bg-purple-100 hover:bg-purple-200 text-purple-700 py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>이미지 저장</span>
            </button>
          </div>
        </motion.div>

        {/* Tournament Title */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.3 }}
          className="mt-6 pt-6 border-t border-gray-200"
        >
          <p className="text-gray-500 text-sm">
            {tournament.title}
          </p>
        </motion.div>
        </motion.div>
        
        {/* Comment System */}
        {worldcupId && (
          <CommentSystem 
            worldcupId={worldcupId}
            initialCommentCount={0}
            onCommentCountChange={setCommentCount}
          />
        )}
      </div>

      {/* Ranking Modal */}
      {worldcupId && (
        <RankingModal
          isOpen={showRanking}
          onClose={() => setShowRanking(false)}
          worldcupId={worldcupId}
          worldcupTitle={tournament.title}
        />
      )}

      {/* Image Modal */}
      {showImageModal && tournament.winner?.image && (
        <div 
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setShowImageModal(false)}
        >
          <div className="relative max-w-4xl max-h-full">
            <img 
              src={tournament.winner.image} 
              alt={tournament.winner.title}
              className="max-w-full max-h-full object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={() => setShowImageModal(false)}
              className="absolute top-4 right-4 w-10 h-10 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70 transition-colors"
            >
              ×
            </button>
            <div className="absolute bottom-4 left-4 right-4 text-center">
              <h3 className="text-white text-xl font-bold bg-black/50 rounded-lg px-4 py-2">
                {tournament.winner.title}
              </h3>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}