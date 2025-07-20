'use client';

import React, { Suspense } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useResultLogic } from './hooks/useResultLogic';
import {
  NeonResultTheme,
  PaperResultTheme,
  ComicResultTheme,
  MinimalResultTheme,
  GamingResultTheme
} from './components/themes';
import { motion, AnimatePresence } from 'framer-motion';
import EnhancedRankingModal from '@/components/shared/EnhancedRankingModal';
import Image from 'next/image';

interface TournamentResultProps {
  params: Promise<{
    id: string;
  }>;
}

function TournamentResultContent({ worldcupId }: { worldcupId: string }) {
  const { currentTheme } = useTheme();
  
  const {
    // Data
    theme,
    worldcupData,
    winnerData,
    winnerStats,
    playTime,
    loading,
    error,
    
    // User interactions
    liked,
    bookmarked,
    reported,
    showReportModal,
    likes,
    
    // Modal states
    showRanking,
    showImageModal,
    setShowRanking,
    setShowImageModal,
    
    // Comments
    comments,
    commentText,
    guestName,
    commentFilter,
    showCommentForm,
    
    // Actions
    handleLike,
    handleBookmark,
    handleWorldcupReport,
    handleShare,
    handleRestart,
    handleGoHome,
    handleShowRanking,
    handleShowImageModal,
    handleCommentSubmit,
    handleReport,
    
    // Setters
    setCommentText,
    setGuestName,
    setCommentFilter,
    setShowCommentForm,
    setShowReportModal,
    
    // Auth
    isAuthenticated,
    currentUser,
    worldcupCreatorId
  } = useResultLogic({ worldcupId });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">결과를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white max-w-md mx-auto p-6">
          <div className="text-6xl mb-6">⚠️</div>
          <h1 className="text-2xl font-bold mb-4">오류가 발생했습니다</h1>
          <p className="text-gray-300 mb-6">{error}</p>
          <button
            onClick={handleGoHome}
            className="bg-emerald-600 hover:bg-emerald-700 px-6 py-3 rounded-lg transition-colors"
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  if (!worldcupData) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-2xl font-bold mb-4">결과 데이터를 불러올 수 없습니다</h1>
          <button
            onClick={handleGoHome}
            className="bg-emerald-600 hover:bg-emerald-700 px-6 py-3 rounded-lg transition-colors"
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  // Common props for all theme components
  const themeProps = {
    worldcupData,
    winnerData,
    winnerStats,
    playTime,
    liked,
    bookmarked,
    reported,
    showReportModal,
    likes,
    comments,
    commentText,
    guestName,
    commentFilter,
    showCommentForm,
    onLike: handleLike,
    onBookmark: handleBookmark,
    onWorldcupReport: handleWorldcupReport,
    onShare: handleShare,
    onRestart: handleRestart,
    onGoHome: handleGoHome,
    onShowRanking: handleShowRanking,
    onShowImageModal: handleShowImageModal,
    onCommentSubmit: handleCommentSubmit,
    onReport: handleReport,
    setCommentText,
    setGuestName,
    setCommentFilter,
    setShowCommentForm,
    setShowReportModal,
    isAuthenticated,
    currentUser,
    worldcupCreatorId
  };

  // Render appropriate theme component
  const renderThemeComponent = () => {
    switch (currentTheme) {
      case 'neon':
        return <NeonResultTheme {...themeProps} />;
      case 'paper':
        return <PaperResultTheme {...themeProps} />;
      case 'comic':
        return <ComicResultTheme {...themeProps} />;
      case 'minimal':
        return <MinimalResultTheme {...themeProps} />;
      case 'gaming':
        return <GamingResultTheme {...themeProps} />;
      default:
        return <MinimalResultTheme {...themeProps} />;
    }
  };

  return (
    <>
      {renderThemeComponent()}
      
      {/* 이미지 확대 모달 */}
      <AnimatePresence>
        {showImageModal && winnerData && winnerData.image_url && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            onClick={() => setShowImageModal(false)}
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              className="relative max-w-4xl max-h-[90vh] w-full h-full"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={winnerData.image_url}
                alt={winnerData.title}
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
              />
              <button
                onClick={() => setShowImageModal(false)}
                className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors text-2xl w-10 h-10 flex items-center justify-center"
              >
                ×
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 랭킹 모달 */}
      <EnhancedRankingModal
        isOpen={showRanking}
        onClose={() => setShowRanking(false)}
        worldcupId={worldcupId}
        worldcupTitle={worldcupData?.title || ''}
        theme={theme}
      />
    </>
  );
}

function TournamentResultWrapper({ params }: TournamentResultProps) {
  const [worldcupId, setWorldcupId] = React.useState<string>('');
  const [isParamsLoaded, setIsParamsLoaded] = React.useState(false);

  React.useEffect(() => {
    const loadParams = async () => {
      try {
        const resolvedParams = await params;
        setWorldcupId(resolvedParams.id);
        setIsParamsLoaded(true);
      } catch (error) {
        console.error('Failed to resolve params:', error);
        setIsParamsLoaded(true); // Still set to true to avoid infinite loading
      }
    };
    loadParams();
  }, [params]);

  if (!isParamsLoaded) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">페이지를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!worldcupId) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white max-w-md mx-auto p-6">
          <div className="text-6xl mb-6">⚠️</div>
          <h1 className="text-2xl font-bold mb-4">잘못된 URL입니다</h1>
          <p className="text-gray-300 mb-6">올바른 토너먼트 결과 페이지로 이동해주세요.</p>
          <button
            onClick={() => window.location.href = '/'}
            className="bg-emerald-600 hover:bg-emerald-700 px-6 py-3 rounded-lg transition-colors"
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return <TournamentResultContent worldcupId={worldcupId} />;
}

export default function TournamentResultPage({ params }: TournamentResultProps) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">로딩 중...</p>
        </div>
      </div>
    }>
      <TournamentResultWrapper params={params} />
    </Suspense>
  );
}