// 샘플 댓글 데이터
export const sampleComments = [
  {
    id: 1,
    author: {
      name: '김민수',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face',
      isVerified: true,
      level: 'VIP'
    },
    content: 'IU가 우승한 건 당연한 결과죠! 정말 최고의 아티스트입니다 👑',
    timestamp: '2분 전',
    createdAt: new Date(Date.now() - 2 * 60 * 1000), // 2분 전
    likes: 24,
    isLiked: false,
    isOwner: false,
    replies: [
      {
        id: 101,
        author: {
          name: '이지은',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=40&h=40&fit=crop&crop=face',
          isVerified: false,
          level: 'Silver'
        },
        content: '저도 동의해요! IU는 정말 실력파 아티스트죠 ✨',
        timestamp: '1분 전',
        createdAt: new Date(Date.now() - 1 * 60 * 1000), // 1분 전
        likes: 5,
        isLiked: false,
        isOwner: false
      },
      {
        id: 102,
        author: {
          name: '정우성',
          avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=40&h=40&fit=crop&crop=face',
          isVerified: true,
          level: 'Gold'
        },
        content: '음악성과 퍼포먼스 모두 완벽했어요!',
        timestamp: '방금 전',
        createdAt: new Date(Date.now() - 30 * 1000), // 30초 전
        likes: 2,
        isLiked: false,
        isOwner: false
      }
    ]
  },
  {
    id: 2,
    author: {
      name: '박지영',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616c9c0b8d3?w=40&h=40&fit=crop&crop=face',
      isVerified: false,
      level: 'Bronze'
    },
    content: '진짜 치열한 경쟁이었는데 결과가 아쉽네요 ㅠㅠ 그래도 재밌었어요!',
    timestamp: '5분 전',
    createdAt: new Date(Date.now() - 5 * 60 * 1000), // 5분 전
    likes: 12,
    isLiked: true,
    isOwner: true,
    replies: [
      {
        id: 201,
        author: {
          name: '김태희',
          avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=40&h=40&fit=crop&crop=face',
          isVerified: false,
          level: 'Bronze'
        },
        content: '저도 아쉬웠어요. 다음에는 다른 결과가 나왔으면 좋겠네요!',
        timestamp: '3분 전',
        createdAt: new Date(Date.now() - 3 * 60 * 1000), // 3분 전
        likes: 3,
        isLiked: false,
        isOwner: false
      }
    ]
  },
  {
    id: 3,
    author: {
      name: '이준호',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face',
      isVerified: true,
      level: 'Gold'
    },
    content: '다음에는 더 다양한 아티스트들로 토너먼트 해주세요! 기대됩니다 🔥',
    timestamp: '10분 전',
    createdAt: new Date(Date.now() - 10 * 60 * 1000), // 10분 전
    likes: 8,
    isLiked: false,
    isOwner: false,
    replies: []
  }
];