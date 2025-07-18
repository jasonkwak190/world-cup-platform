'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { WorldCupItem } from '@/types/game';
import { WinnerStats, Comment, WorldCupData } from '../components/themes/types';

interface UseResultLogicProps {
  worldcupId: string;
}

export function useResultLogic({ worldcupId }: UseResultLogicProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated } = useAuth();
  
  // Basic data
  const [theme, setTheme] = useState<string>('minimal');
  const [playTime, setPlayTime] = useState<number>(0);
  const [winnerId, setWinnerId] = useState<string>('');
  const [worldcupData, setWorldcupData] = useState<WorldCupData | null>(null);
  const [winnerData, setWinnerData] = useState<WorldCupItem | null>(null);
  const [winnerStats, setWinnerStats] = useState<WinnerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  
  // User interactions
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [likes, setLikes] = useState(0);
  
  // Modal states
  const [showRanking, setShowRanking] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  
  // Comment system
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [guestName, setGuestName] = useState('');
  const [commentFilter, setCommentFilter] = useState<'likes' | 'recent'>('likes');
  const [showCommentForm, setShowCommentForm] = useState(false);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        // Get URL parameters
        const themeParam = searchParams.get('theme') || 'minimal';
        const playTimeParam = searchParams.get('playTime') || '0';
        const winnerIdParam = searchParams.get('winner') || '';
        
        setTheme(themeParam);
        setPlayTime(parseInt(playTimeParam));
        setWinnerId(winnerIdParam);

        // Load worldcup and winner data
        const [worldcupResponse, winnerResponse] = await Promise.all([
          fetch(`/api/worldcups/${worldcupId}`),
          winnerIdParam ? fetch(`/api/worldcups/${worldcupId}/items/${winnerIdParam}`) : Promise.resolve(null)
        ]);

        if (!worldcupResponse.ok) {
          throw new Error('월드컵 데이터를 불러올 수 없습니다.');
        }

        const worldcupResult = await worldcupResponse.json();
        const worldcup = worldcupResult.worldcup;
        
        setWorldcupData({
          id: worldcup.id,
          title: worldcup.title,
          description: worldcup.description,
          items: worldcup.items,
          creator_name: worldcup.creator_name,
          created_at: worldcup.created_at,
          likes: worldcup.likes || 0
        });
        setLikes(worldcup.likes || 0);

        if (winnerResponse?.ok) {
          const winnerResult = await winnerResponse.json();
          setWinnerData(winnerResult);
          
          // Simulate winner statistics
          setWinnerStats({
            votes: Math.floor(Math.random() * 1000) + 100,
            winRate: Math.floor(Math.random() * 30) + 70,
            totalMatches: Math.floor(Math.random() * 50) + 20
          });
        }

        // Load comments and user states
        await Promise.all([
          loadComments(),
          isAuthenticated ? checkLikeBookmarkStatus() : Promise.resolve()
        ]);

      } catch (err) {
        console.error('Failed to load result data:', err);
        setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    if (worldcupId) {
      loadData();
    }
  }, [worldcupId, searchParams, isAuthenticated]);

  const loadComments = useCallback(async () => {
    try {
      const response = await fetch(`/api/worldcups/${worldcupId}/comments`);
      if (response.ok) {
        const commentsData = await response.json();
        setComments(commentsData);
      }
    } catch (error) {
      console.error('Failed to load comments:', error);
    }
  }, [worldcupId]);

  const checkLikeBookmarkStatus = useCallback(async () => {
    try {
      const [likeResponse, bookmarkResponse] = await Promise.all([
        fetch(`/api/worldcups/${worldcupId}/like`),
        fetch(`/api/worldcups/${worldcupId}/bookmark`)
      ]);
      
      if (likeResponse.ok) {
        const likeData = await likeResponse.json();
        setLiked(likeData.liked);
      }
      
      if (bookmarkResponse.ok) {
        const bookmarkData = await bookmarkResponse.json();
        setBookmarked(bookmarkData.bookmarked);
      }
    } catch (error) {
      console.error('Failed to check like/bookmark status:', error);
    }
  }, [worldcupId]);

  const handleLike = useCallback(async () => {
    if (!isAuthenticated) {
      alert('로그인이 필요합니다.');
      return;
    }

    try {
      const response = await fetch(`/api/worldcups/${worldcupId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        setLiked(!liked);
        setLikes(prev => liked ? prev - 1 : prev + 1);
      }
    } catch (error) {
      console.error('Failed to toggle like:', error);
    }
  }, [isAuthenticated, worldcupId, liked]);

  const handleBookmark = useCallback(async () => {
    if (!isAuthenticated) {
      alert('로그인이 필요합니다.');
      return;
    }

    try {
      const response = await fetch(`/api/worldcups/${worldcupId}/bookmark`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        setBookmarked(!bookmarked);
      }
    } catch (error) {
      console.error('Failed to toggle bookmark:', error);
    }
  }, [isAuthenticated, worldcupId, bookmarked]);

  const handleShare = useCallback(async () => {
    try {
      const shareUrl = `${window.location.origin}/tournament-select/${worldcupId}`;
      await navigator.clipboard.writeText(shareUrl);
      alert('링크가 클립보드에 복사되었습니다!');
    } catch (error) {
      console.error('Failed to share:', error);
      alert('공유 중 오류가 발생했습니다.');
    }
  }, [worldcupId]);

  const handleRestart = useCallback(() => {
    router.push(`/tournament-select/${worldcupId}`);
  }, [router, worldcupId]);

  const handleGoHome = useCallback(() => {
    router.push('/');
  }, [router]);

  const handleShowRanking = useCallback(() => {
    setShowRanking(true);
  }, []);

  const handleShowImageModal = useCallback(() => {
    setShowImageModal(true);
  }, []);

  const handleCommentSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!commentText.trim() || (!isAuthenticated && !guestName.trim())) {
      return;
    }

    try {
      const response = await fetch(`/api/worldcups/${worldcupId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: commentText,
          guestName: !isAuthenticated ? guestName : undefined
        })
      });

      if (response.ok) {
        setCommentText('');
        setGuestName('');
        setShowCommentForm(false);
        loadComments();
      }
    } catch (error) {
      console.error('Failed to submit comment:', error);
    }
  }, [commentText, guestName, isAuthenticated, worldcupId, loadComments]);

  const handleReport = useCallback(async (commentId: string) => {
    try {
      const response = await fetch(`/api/comments/${commentId}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        alert('신고가 접수되었습니다.');
      }
    } catch (error) {
      console.error('Failed to report comment:', error);
    }
  }, []);

  // Sort comments based on filter
  const sortedComments = [...comments].sort((a, b) => {
    if (commentFilter === 'likes') {
      return b.likes - a.likes;
    } else {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  return {
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
    likes,
    
    // Modal states
    showRanking,
    showImageModal,
    setShowRanking,
    setShowImageModal,
    
    // Comments
    comments: sortedComments,
    commentText,
    guestName,
    commentFilter,
    showCommentForm,
    
    // Actions
    handleLike,
    handleBookmark,
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
    
    // Auth
    isAuthenticated
  };
}