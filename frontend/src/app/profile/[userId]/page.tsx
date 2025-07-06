'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  User, 
  Trophy, 
  Play, 
  Heart, 
  MessageCircle, 
  Calendar,
  // Award,
  TrendingUp,
  // Star,
  Crown,
  Clock,
  BarChart3,
  Users,
  Bookmark,
  Edit3
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface UserProfile {
  id: string;
  username: string;
  email?: string;
  avatar?: string;
  bio?: string;
  joinedAt: string;
  stats: {
    tournamentsCreated: number;
    tournamentsPlayed: number;
    totalLikes: number;
    totalComments: number;
    winRate: number;
    favoriteCategory: string;
  };
}

interface UserTournament {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  category: string;
  participants: number;
  likes: number;
  comments: number;
  createdAt: string;
  isPublic: boolean;
  status: 'active' | 'completed' | 'draft';
}

interface TournamentHistory {
  id: string;
  tournamentId: string;
  tournamentTitle: string;
  result: string; // winner name
  completedAt: string;
  rounds: number;
  totalTime: number; // in seconds
}

export default function ProfilePage() {
  const params = useParams();
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [userTournaments, setUserTournaments] = useState<UserTournament[]>([]);
  const [tournamentHistory, setTournamentHistory] = useState<TournamentHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'created' | 'played' | 'liked'>('created');
  const [isEditing, setIsEditing] = useState(false);

  const userId = params.userId as string;
  const isOwnProfile = user?.id === userId;

  // Mock data - replace with actual API calls
  useEffect(() => {
    const loadProfile = async () => {
      setIsLoading(true);
      
      // Mock profile data
      const mockProfile: UserProfile = {
        id: userId,
        username: isOwnProfile ? (user?.username || 'User') : 'TournamentMaster',
        email: isOwnProfile ? user?.email : undefined,
        bio: '월드컵 게임을 사랑하는 유저입니다. 다양한 주제의 토너먼트를 만들어 공유하고 있어요!',
        joinedAt: '2024-01-15',
        stats: {
          tournamentsCreated: 12,
          tournamentsPlayed: 156,
          totalLikes: 1248,
          totalComments: 89,
          winRate: 68.5,
          favoriteCategory: 'K-POP'
        }
      };

      const mockTournaments: UserTournament[] = [
        {
          id: '1',
          title: 'K-POP 아이돌 이상형 월드컵',
          description: '4세대 K-POP 아이돌들의 대결',
          thumbnail: '',
          category: 'K-POP',
          participants: 2453,
          likes: 189,
          comments: 34,
          createdAt: '2024-12-01',
          isPublic: true,
          status: 'active'
        },
        {
          id: '2',
          title: '한국 음식 월드컵',
          description: '우리나라 대표 음식들의 대결',
          thumbnail: '',
          category: '음식',
          participants: 1876,
          likes: 156,
          comments: 28,
          createdAt: '2024-11-28',
          isPublic: true,
          status: 'active'
        }
      ];

      const mockHistory: TournamentHistory[] = [
        {
          id: '1',
          tournamentId: 'tour1',
          tournamentTitle: '남자 아이돌 월드컵',
          result: 'BTS',
          completedAt: '2024-12-02',
          rounds: 4,
          totalTime: 245
        },
        {
          id: '2',
          tournamentId: 'tour2',
          tournamentTitle: '영화 장르 월드컵',
          result: '액션',
          completedAt: '2024-12-01',
          rounds: 3,
          totalTime: 128
        }
      ];

      setTimeout(() => {
        setProfile(mockProfile);
        setUserTournaments(mockTournaments);
        setTournamentHistory(mockHistory);
        setIsLoading(false);
      }, 1000);
    };

    loadProfile();
  }, [userId, user, isOwnProfile]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}분 ${remainingSeconds}초`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">프로필을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">프로필을 찾을 수 없습니다</h2>
          <p className="text-gray-600">요청하신 사용자 프로필이 존재하지 않습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-sm border p-8 mb-8"
        >
          <div className="flex flex-col md:flex-row items-start gap-6">
            {/* Avatar */}
            <div className="relative">
              <div className="w-24 h-24 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                {profile.username.charAt(0).toUpperCase()}
              </div>
              {isOwnProfile && (
                <button className="absolute -bottom-1 -right-1 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors">
                  <Edit3 className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-900">{profile.username}</h1>
                {profile.stats.tournamentsCreated > 10 && (
                  <div className="flex items-center gap-1 bg-amber-100 text-amber-800 px-2 py-1 rounded-full text-sm">
                    <Crown className="w-4 h-4" />
                    크리에이터
                  </div>
                )}
              </div>
              
              {profile.bio && (
                <p className="text-gray-600 mb-4">{profile.bio}</p>
              )}

              <div className="flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {formatDate(profile.joinedAt)} 가입
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {profile.stats.favoriteCategory} 선호
                </div>
              </div>
            </div>

            {/* Edit Button */}
            {isOwnProfile && (
              <button
                onClick={() => setIsEditing(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Edit3 className="w-4 h-4" />
                프로필 편집
              </button>
            )}
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        >
          <div className="bg-white rounded-lg shadow-sm border p-4 text-center">
            <Trophy className="w-8 h-8 text-amber-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">{profile.stats.tournamentsCreated}</div>
            <div className="text-sm text-gray-600">만든 토너먼트</div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border p-4 text-center">
            <Play className="w-8 h-8 text-blue-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">{profile.stats.tournamentsPlayed}</div>
            <div className="text-sm text-gray-600">참여한 게임</div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border p-4 text-center">
            <Heart className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">{profile.stats.totalLikes.toLocaleString()}</div>
            <div className="text-sm text-gray-600">받은 좋아요</div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border p-4 text-center">
            <TrendingUp className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">{profile.stats.winRate}%</div>
            <div className="text-sm text-gray-600">승률</div>
          </div>
        </motion.div>

        {/* Content Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg shadow-sm border"
        >
          {/* Tab Headers */}
          <div className="border-b border-gray-200">
            <div className="flex">
              <button
                onClick={() => setActiveTab('created')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'created'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                만든 토너먼트 ({userTournaments.length})
              </button>
              <button
                onClick={() => setActiveTab('played')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'played'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                플레이 기록 ({tournamentHistory.length})
              </button>
              {isOwnProfile && (
                <button
                  onClick={() => setActiveTab('liked')}
                  className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'liked'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  좋아요한 토너먼트
                </button>
              )}
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'created' && (
              <div className="space-y-4">
                {userTournaments.map((tournament) => (
                  <div key={tournament.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-gray-900">{tournament.title}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            tournament.status === 'active' ? 'bg-green-100 text-green-800' :
                            tournament.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {tournament.status === 'active' ? '활성' : 
                             tournament.status === 'completed' ? '완료' : '초안'}
                          </span>
                        </div>
                        <p className="text-gray-600 text-sm mb-3">{tournament.description}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Play className="w-4 h-4" />
                            {tournament.participants.toLocaleString()} 플레이
                          </span>
                          <span className="flex items-center gap-1">
                            <Heart className="w-4 h-4" />
                            {tournament.likes}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageCircle className="w-4 h-4" />
                            {tournament.comments}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {formatDate(tournament.createdAt)}
                          </span>
                        </div>
                      </div>
                      <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                        보기
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'played' && (
              <div className="space-y-4">
                {tournamentHistory.map((history) => (
                  <div key={history.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">{history.tournamentTitle}</h3>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Crown className="w-4 h-4 text-amber-500" />
                            우승: {history.result}
                          </span>
                          <span className="flex items-center gap-1">
                            <BarChart3 className="w-4 h-4" />
                            {history.rounds}라운드
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {formatTime(history.totalTime)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {formatDate(history.completedAt)}
                          </span>
                        </div>
                      </div>
                      <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                        다시 플레이
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'liked' && (
              <div className="text-center py-8 text-gray-500">
                <Bookmark className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p>좋아요한 토너먼트가 없습니다.</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}