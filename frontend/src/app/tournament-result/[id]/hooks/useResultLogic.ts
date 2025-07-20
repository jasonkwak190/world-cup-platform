'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { WorldCupItem } from '@/types/game';
import { WinnerStats, Comment, WorldCupData } from '../components/themes/types';
import { supabase } from '@/lib/supabase';

interface UseResultLogicProps {
  worldcupId: string;
}

// Helper function to get authentication headers
async function getAuthHeaders(): Promise<Record<string, string>> {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Failed to get auth session:', error);
      throw new Error('Authentication failed');
    }
    
    if (!session?.access_token) {
      throw new Error('No valid authentication token found');
    }
    
    return {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    };
  } catch (error) {
    console.error('Failed to get auth headers:', error);
    throw new Error('Authentication failed');
  }
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
  const [reported, setReported] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
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
          creator_name: worldcup.author || worldcup.creator_name || 'Unknown', // Fix: use author field from API
          created_at: worldcup.created_at,
          likes: worldcup.likes || 0
        });
        setLikes(worldcup.likes || 0);

        if (winnerResponse?.ok) {
          const winnerResult = await winnerResponse.json();
          setWinnerData(winnerResult.item); // Extract the item from the response
          
          // Fetch real winner statistics from database
          const winnerId = searchParams.get('winner');
          if (winnerId) {
            try {
              const statsResponse = await fetch(`/api/worldcup/${worldcupId}/stats`);
              if (statsResponse.ok) {
                const statsData = await statsResponse.json();
                const winnerItemStats = statsData.items?.find((item: any) => item.id === winnerId);
                
                if (winnerItemStats) {
                  setWinnerStats({
                    votes: winnerItemStats.total_appearances || 0,
                    winRate: Math.round(winnerItemStats.win_rate || 0),
                    totalMatches: (winnerItemStats.win_count || 0) + (winnerItemStats.loss_count || 0)
                  });
                } else {
                  // Fallback to reasonable defaults if item not found
                  setWinnerStats({
                    votes: 1,
                    winRate: 100, // Winner by definition
                    totalMatches: 1
                  });
                }
              }
            } catch (error) {
              console.error('Failed to fetch winner statistics:', error);
              // Fallback stats for winner
              setWinnerStats({
                votes: 1,
                winRate: 100,
                totalMatches: 1
              });
            }
          }
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
  }, [worldcupId, searchParams]);

  const loadComments = useCallback(async () => {
    try {
      const response = await fetch(`/api/worldcups/${worldcupId}/comments`);
      if (response.ok) {
        const commentsData = await response.json();
        // Handle both array and object response formats
        const comments = Array.isArray(commentsData) ? commentsData : (commentsData.comments || []);
        setComments(comments);
      } else {
        console.error('Failed to load comments:', response.status, response.statusText);
        setComments([]); // Set empty array on error
      }
    } catch (error) {
      console.error('Failed to load comments:', error);
      setComments([]); // Set empty array on error to prevent iteration issues
    }
  }, [worldcupId]);

  const checkLikeBookmarkStatus = useCallback(async () => {
    try {
      // Get headers with authentication if user is authenticated
      const baseHeaders = { 'Content-Type': 'application/json' };
      let headers = baseHeaders;
      
      if (isAuthenticated) {
        try {
          headers = await getAuthHeaders();
        } catch (error) {
          console.warn('Failed to get auth headers, using anonymous request:', error);
          headers = baseHeaders;
        }
      }

      const [likeResponse, bookmarkResponse, reportResponse] = await Promise.all([
        fetch(`/api/worldcups/${worldcupId}/like`, { headers }),
        fetch(`/api/worldcups/${worldcupId}/bookmark`, { headers }),
        fetch(`/api/worldcups/${worldcupId}/report`, { headers })
      ]);
      
      if (likeResponse.ok) {
        const likeData = await likeResponse.json();
        setLiked(likeData.liked);
      }
      
      if (bookmarkResponse.ok) {
        const bookmarkData = await bookmarkResponse.json();
        setBookmarked(bookmarkData.bookmarked);
      }

      if (reportResponse.ok) {
        const reportData = await reportResponse.json();
        setReported(reportData.reported);
      }
    } catch (error) {
      console.error('Failed to check like/bookmark/report status:', error);
    }
  }, [worldcupId, isAuthenticated]);

  const handleLike = useCallback(async () => {
    if (!isAuthenticated) {
      alert('로그인이 필요합니다.');
      return;
    }

    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/worldcups/${worldcupId}/like`, {
        method: 'POST',
        headers
      });
      
      if (response.ok) {
        setLiked(!liked);
        setLikes(prev => liked ? prev - 1 : prev + 1);
      } else {
        console.error('Failed to toggle like:', response.status, response.statusText);
        const errorData = await response.json().catch(() => ({}));
        console.error('Error details:', errorData);
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
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/worldcups/${worldcupId}/bookmark`, {
        method: 'POST',
        headers
      });
      
      if (response.ok) {
        setBookmarked(!bookmarked);
      } else {
        console.error('Failed to toggle bookmark:', response.status, response.statusText);
        const errorData = await response.json().catch(() => ({}));
        console.error('Error details:', errorData);
      }
    } catch (error) {
      console.error('Failed to toggle bookmark:', error);
    }
  }, [isAuthenticated, worldcupId, bookmarked]);

  const handleWorldcupReport = useCallback(async (reason: string, description?: string) => {
    if (!isAuthenticated) {
      alert('로그인이 필요합니다.');
      return;
    }

    try {
      const response = await fetch(`/api/worldcups/${worldcupId}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason, description })
      });
      
      const result = await response.json();
      
      if (response.ok) {
        setReported(true);
        setShowReportModal(false);
        alert('신고가 접수되었습니다. 검토 후 조치하겠습니다.');
      } else {
        alert(result.error || '신고 접수 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('Failed to submit report:', error);
      alert('신고 접수 중 오류가 발생했습니다.');
    }
  }, [isAuthenticated, worldcupId]);

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

  // Sort comments based on filter - ensure comments is an array
  const sortedComments = Array.isArray(comments) ? [...comments].sort((a, b) => {
    if (commentFilter === 'likes') {
      return b.likes - a.likes;
    } else {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  }) : [];

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
    reported,
    showReportModal,
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
    handleWorldcupReport,
    handleShare,
    handleRestart,
    handleGoHome,
    handleShowRanking,
    handleShowImageModal,
    handleCommentSubmit,
    handleReport, // comment report
    
    // Setters
    setCommentText,
    setGuestName,
    setCommentFilter,
    setShowCommentForm,
    setShowReportModal,
    
    // Auth
    isAuthenticated,
    currentUser: user ? {
      id: user.id,
      name: user.user_metadata?.full_name || user.user_metadata?.name || user.identities?.[0]?.identity_data?.full_name || user.identities?.[0]?.identity_data?.name || user.email?.split('@')[0] || 'Unknown User',
      avatar: user.user_metadata?.avatar_url || user.user_metadata?.picture || user.identities?.[0]?.identity_data?.avatar_url || user.identities?.[0]?.identity_data?.picture || `https://avatar.vercel.sh/${user.email}.png`,
      level: 'Bronze' as const // Default level, can be enhanced later
    } : undefined,
    worldcupCreatorId: worldcupData?.creator_id
  };
}