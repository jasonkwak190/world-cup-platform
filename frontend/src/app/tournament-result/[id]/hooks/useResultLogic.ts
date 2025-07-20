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
  const [retryCount, setRetryCount] = useState(0);
  
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
        
        console.log('🎯 Tournament Result - Loading data:', {
          worldcupId,
          theme: themeParam,
          playTime: playTimeParam,
          winnerId: winnerIdParam
        });
        
        setTheme(themeParam);
        setPlayTime(parseInt(playTimeParam));
        setWinnerId(winnerIdParam);

        // Load worldcup and winner data
        const [worldcupResponse, winnerResponse] = await Promise.all([
          fetch(`/api/worldcups/${worldcupId}`),
          winnerIdParam ? fetch(`/api/worldcups/${worldcupId}/items/${winnerIdParam}`) : Promise.resolve(null)
        ]);

        console.log('🌐 API Response Status:', {
          worldcup: worldcupResponse.status,
          winner: winnerResponse?.status || 'N/A'
        });
        
        if (!worldcupResponse.ok) {
          const errorText = await worldcupResponse.text().catch(() => 'Unknown error');
          console.error('❌ Worldcup API Error:', errorText);
          throw new Error(`월드컵 데이터를 불러올 수 없습니다. (${worldcupResponse.status})`);
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
          setWinnerData(winnerResult.item || winnerResult);
        } else if (winnerIdParam) {
          // Try to find winner in worldcup items as fallback
          const winnerFromItems = worldcup.items?.find((item: any) => item.id === winnerIdParam);
          if (winnerFromItems) {
            setWinnerData(winnerFromItems);
          }
        }
        
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

        // Update play count when viewing result
        try {
          await fetch(`/api/worldcups/${worldcupId}/play`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              action: 'increment_participants',
              value: 1 
            })
          });
        } catch (error) {
          console.error('Failed to update play count:', error);
          // Non-blocking error - don't affect user experience
        }

        // Load comments and user states
        const loadCommentsInline = async () => {
          try {
            const response = await fetch(`/api/worldcups/${worldcupId}/comments`);
            if (response.ok) {
              const commentsData = await response.json();
              const comments = Array.isArray(commentsData) ? commentsData : (commentsData.comments || []);
              setComments(comments);
            } else {
              console.error('Failed to load comments:', response.status, response.statusText);
              setComments([]);
            }
          } catch (error) {
            console.error('Failed to load comments:', error);
            setComments([]);
          }
        };

        const checkLikeBookmarkStatusInline = async () => {
          if (!isAuthenticated) return;
          
          try {
            const baseHeaders = { 'Content-Type': 'application/json' };
            let headers = baseHeaders;
            
            try {
              headers = await getAuthHeaders();
            } catch (error) {
              console.warn('Failed to get auth headers, using anonymous request:', error);
              headers = baseHeaders;
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
        };

        await Promise.all([
          loadCommentsInline(),
          checkLikeBookmarkStatusInline()
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
  }, [worldcupId, searchParams, isAuthenticated, retryCount]);

  const handleRetry = useCallback(() => {
    setError('');
    setLoading(true);
    setRetryCount(prev => prev + 1);
  }, []);

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
      console.log('❤️ Toggling worldcup like:', { currentLiked: liked });

      const headers = await getAuthHeaders();
      const response = await fetch(`/api/worldcups/${worldcupId}/like`, {
        method: 'POST',
        headers
      });
      
      console.log('💖 Like response:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Like toggle result:', result);
        setLiked(!liked);
        setLikes(prev => liked ? prev - 1 : prev + 1);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Failed to toggle like:', response.status, errorData);
        alert(`좋아요에 실패했습니다. (${response.status})`);
      }
    } catch (error) {
      console.error('❌ Failed to toggle like:', error);
      alert('좋아요 중 오류가 발생했습니다.');
    }
  }, [isAuthenticated, worldcupId, liked]);

  const handleBookmark = useCallback(async () => {
    if (!isAuthenticated) {
      alert('로그인이 필요합니다.');
      return;
    }

    try {
      console.log('🔖 Toggling worldcup bookmark:', { currentBookmarked: bookmarked });

      const headers = await getAuthHeaders();
      const response = await fetch(`/api/worldcups/${worldcupId}/bookmark`, {
        method: 'POST',
        headers
      });
      
      console.log('📌 Bookmark response:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Bookmark toggle result:', result);
        setBookmarked(!bookmarked);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Failed to toggle bookmark:', response.status, errorData);
        alert(`북마크에 실패했습니다. (${response.status})`);
      }
    } catch (error) {
      console.error('❌ Failed to toggle bookmark:', error);
      alert('북마크 중 오류가 발생했습니다.');
    }
  }, [isAuthenticated, worldcupId, bookmarked]);

  const handleWorldcupReport = useCallback(async (reason: string, description?: string) => {
    if (!isAuthenticated) {
      alert('로그인이 필요합니다.');
      return;
    }

    try {
      console.log('🚨 Reporting worldcup:', { reason, description });

      // Get authentication headers
      const headers = await getAuthHeaders();
      
      const response = await fetch(`/api/worldcups/${worldcupId}/report`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ reason, description })
      });
      
      console.log('📋 Worldcup report response:', response.status);
      
      const result = await response.json();
      
      if (response.ok) {
        console.log('✅ Worldcup report submitted successfully');
        setReported(true);
        setShowReportModal(false);
        alert('신고가 접수되었습니다. 검토 후 조치하겠습니다.');
      } else {
        console.error('❌ Worldcup report failed:', result);
        alert(result.error || '신고 접수 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('❌ Failed to submit report:', error);
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
      console.log('💬 Submitting comment:', { 
        isAuthenticated, 
        hasContent: !!commentText.trim(), 
        hasGuestName: !!guestName.trim() 
      });

      // Prepare headers with authentication if user is logged in
      let headers: Record<string, string> = { 'Content-Type': 'application/json' };
      
      if (isAuthenticated) {
        try {
          headers = await getAuthHeaders();
          console.log('✅ Using authenticated headers for comment submission');
        } catch (error) {
          console.warn('❌ Failed to get auth headers, falling back to anonymous submission:', error);
          headers = { 'Content-Type': 'application/json' };
        }
      }

      const response = await fetch(`/api/worldcups/${worldcupId}/comments`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          content: commentText,
          guestName: !isAuthenticated ? guestName : undefined
        })
      });

      console.log('📝 Comment submission response:', response.status);

      if (response.ok) {
        console.log('✅ Comment submitted successfully');
        setCommentText('');
        setGuestName('');
        setShowCommentForm(false);
        await loadComments(); // Wait for reload to complete
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Comment submission failed:', response.status, errorData);
        alert(`댓글 작성에 실패했습니다. (${response.status})`);
      }
    } catch (error) {
      console.error('❌ Failed to submit comment:', error);
      alert('댓글 작성 중 오류가 발생했습니다.');
    }
  }, [commentText, guestName, isAuthenticated, worldcupId, loadComments]);

  const handleReport = useCallback(async (commentId: string) => {
    try {
      const response = await fetch(`/api/comments/${commentId}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: 'inappropriate_content',
          description: '부적절한 내용으로 신고'
        })
      });
      
      if (response.ok) {
        alert('신고가 접수되었습니다.');
      }
    } catch (error) {
      console.error('Failed to report comment:', error);
    }
  }, []);

  const handleCommentLike = useCallback(async (commentId: string) => {
    if (!isAuthenticated) {
      alert('로그인이 필요합니다.');
      return;
    }

    try {
      console.log('👍 Liking comment:', commentId);

      // Get authentication headers
      const headers = await getAuthHeaders();
      
      const response = await fetch(`/api/comments/${commentId}/like`, {
        method: 'POST',
        headers
      });

      console.log('❤️ Comment like response:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Comment like result:', result);
        
        // Update local comment state
        setComments(prevComments => 
          prevComments.map(comment => 
            comment.id === commentId 
              ? { ...comment, likes: result.likeCount, liked: result.liked }
              : comment
          )
        );
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Comment like failed:', response.status, errorData);
        alert(`댓글 좋아요에 실패했습니다. (${response.status})`);
      }
    } catch (error) {
      console.error('❌ Failed to like comment:', error);
      alert('댓글 좋아요 중 오류가 발생했습니다.');
    }
  }, [isAuthenticated]);

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
    handleCommentLike, // comment like
    handleRetry, // retry loading
    
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