'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Star, 
  Heart, 
  Users, 
  Gamepad2, 
  Music, 
  Camera, 
  Utensils, 
  Plane, 
  Book, 
  Palette,
  Crown,
  Trophy,
  Zap,
  Plus,
  ChevronRight
} from 'lucide-react';

interface TournamentTemplate {
  id: string;
  title: string;
  description: string;
  category: string;
  icon: any;
  color: string;
  bgColor: string;
  items: Array<{
    title: string;
    description?: string;
    image?: string;
  }>;
  isPopular?: boolean;
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedTime: string;
}

interface TournamentTemplatesProps {
  onSelectTemplate: (template: TournamentTemplate) => void;
  onCreateCustom: () => void;
}

const templates: TournamentTemplate[] = [
  {
    id: 'kpop-idols',
    title: 'K-POP 아이돌 월드컵',
    description: '인기 K-POP 아이돌들의 최강자를 가려보세요',
    category: '연예인',
    icon: Music,
    color: 'text-pink-600',
    bgColor: 'bg-pink-50',
    isPopular: true,
    difficulty: 'medium',
    estimatedTime: '5-10분',
    items: [
      { title: 'BTS', description: '방탄소년단' },
      { title: 'BLACKPINK', description: '블랙핑크' },
      { title: 'TWICE', description: '트와이스' },
      { title: 'Red Velvet', description: '레드벨벳' },
      { title: 'ITZY', description: '있지' },
      { title: 'aespa', description: '에스파' },
      { title: 'NewJeans', description: '뉴진스' },
      { title: 'IVE', description: '아이브' },
      { title: 'SEVENTEEN', description: '세븐틴' },
      { title: 'Stray Kids', description: '스트레이 키즈' },
      { title: 'ENHYPEN', description: '엔하이픈' },
      { title: 'TXT', description: '투모로우바이투게더' },
      { title: 'ITZY', description: '있지' },
      { title: 'LE SSERAFIM', description: '르세라핌' },
      { title: 'NMIXX', description: '엔믹스' },
      { title: 'IVE', description: '아이브' }
    ]
  },
  {
    id: 'korean-food',
    title: '한국 음식 월드컵',
    description: '한국의 대표 음식들 중 최고를 선택해보세요',
    category: '음식',
    icon: Utensils,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    isPopular: true,
    difficulty: 'easy',
    estimatedTime: '3-5분',
    items: [
      { title: '김치찌개', description: '매콤한 김치찌개' },
      { title: '불고기', description: '달콤한 불고기' },
      { title: '비빔밥', description: '영양만점 비빔밥' },
      { title: '냉면', description: '시원한 냉면' },
      { title: '치킨', description: '바삭한 치킨' },
      { title: '삼겹살', description: '고소한 삼겹살' },
      { title: '떡볶이', description: '매콤달콤 떡볶이' },
      { title: '김밥', description: '간편한 김밥' }
    ]
  },
  {
    id: 'programming-languages',
    title: '프로그래밍 언어 월드컵',
    description: '개발자들이 선호하는 프로그래밍 언어 대결',
    category: '기술',
    icon: Gamepad2,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    difficulty: 'medium',
    estimatedTime: '5-8분',
    items: [
      { title: 'JavaScript', description: '웹의 언어' },
      { title: 'Python', description: '데이터 과학의 왕' },
      { title: 'Java', description: '엔터프라이즈의 강자' },
      { title: 'TypeScript', description: '타입 안전성' },
      { title: 'Go', description: '구글의 작품' },
      { title: 'Rust', description: '메모리 안전성' },
      { title: 'C++', description: '성능의 왕' },
      { title: 'Swift', description: 'iOS 개발' }
    ]
  },
  {
    id: 'movie-genres',
    title: '영화 장르 월드컵',
    description: '당신이 가장 좋아하는 영화 장르는?',
    category: '영화',
    icon: Camera,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    difficulty: 'easy',
    estimatedTime: '2-4분',
    items: [
      { title: '액션', description: '스릴 넘치는 액션' },
      { title: '로맨스', description: '가슴 뛰는 로맨스' },
      { title: '코미디', description: '웃음 가득한 코미디' },
      { title: '드라마', description: '감동적인 드라마' },
      { title: '공포', description: '소름 끼치는 공포' },
      { title: 'SF', description: '미래 지향적 SF' },
      { title: '스릴러', description: '긴장감 넘치는 스릴러' },
      { title: '판타지', description: '상상력 가득한 판타지' }
    ]
  },
  {
    id: 'travel-destinations',
    title: '여행지 월드컵',
    description: '꿈의 여행지를 선택해보세요',
    category: '여행',
    icon: Plane,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    difficulty: 'medium',
    estimatedTime: '7-10분',
    items: [
      { title: '파리', description: '낭만의 도시' },
      { title: '도쿄', description: '전통과 현대의 조화' },
      { title: '뉴욕', description: '꿈의 도시' },
      { title: '런던', description: '역사와 문화' },
      { title: '로마', description: '영원한 도시' },
      { title: '시드니', description: '남반구의 보석' },
      { title: '바르셀로나', description: '가우디의 도시' },
      { title: '방콕', description: '동남아의 허브' },
      { title: '두바이', description: '사막의 오아시스' },
      { title: '상하이', description: '동서양의 만남' },
      { title: '베를린', description: '역사의 현장' },
      { title: '이스탄불', description: '두 대륙의 다리' }
    ]
  },
  {
    id: 'colors',
    title: '색깔 월드컵',
    description: '가장 아름다운 색깔을 선택해보세요',
    category: '디자인',
    icon: Palette,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    difficulty: 'easy',
    estimatedTime: '2-3분',
    items: [
      { title: '빨강', description: '열정적인 빨강' },
      { title: '파랑', description: '차분한 파랑' },
      { title: '초록', description: '자연스러운 초록' },
      { title: '노랑', description: '밝은 노랑' },
      { title: '보라', description: '신비로운 보라' },
      { title: '주황', description: '따뜻한 주황' },
      { title: '분홍', description: '사랑스러운 분홍' },
      { title: '검정', description: '클래식한 검정' }
    ]
  }
];

const categories = [
  { id: 'all', name: '전체', icon: Star },
  { id: '연예인', name: '연예인', icon: Heart },
  { id: '음식', name: '음식', icon: Utensils },
  { id: '기술', name: '기술', icon: Gamepad2 },
  { id: '영화', name: '영화', icon: Camera },
  { id: '여행', name: '여행', icon: Plane },
  { id: '디자인', name: '디자인', icon: Palette },
];

export default function TournamentTemplates({ 
  onSelectTemplate, 
  onCreateCustom 
}: TournamentTemplatesProps) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [hoveredTemplate, setHoveredTemplate] = useState<string | null>(null);

  const filteredTemplates = templates.filter(template => 
    selectedCategory === 'all' || template.category === selectedCategory
  );

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-600 bg-green-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'hard': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '쉬움';
      case 'medium': return '보통';
      case 'hard': return '어려움';
      default: return '보통';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          템플릿으로 빠르게 시작하기
        </h2>
        <p className="text-gray-600">
          미리 준비된 템플릿으로 쉽고 빠르게 월드컵을 만들어보세요
        </p>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2 justify-center">
        {categories.map((category) => {
          const Icon = category.icon;
          return (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selectedCategory === category.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              {category.name}
            </button>
          );
        })}
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Custom Template Card */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onCreateCustom}
          className="relative bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-6 cursor-pointer hover:border-gray-400 transition-all"
        >
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="w-8 h-8 text-gray-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              직접 만들기
            </h3>
            <p className="text-gray-600 text-sm">
              원하는 주제로 처음부터 월드컵을 만들어보세요
            </p>
          </div>
        </motion.div>

        {/* Template Cards */}
        {filteredTemplates.map((template) => {
          const Icon = template.icon;
          return (
            <motion.div
              key={template.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onHoverStart={() => setHoveredTemplate(template.id)}
              onHoverEnd={() => setHoveredTemplate(null)}
              onClick={() => onSelectTemplate(template)}
              className="relative bg-white border rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden"
            >
              {/* Popular Badge */}
              {template.isPopular && (
                <div className="absolute top-3 right-3 z-10">
                  <div className="bg-red-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                    <Crown className="w-3 h-3" />
                    인기
                  </div>
                </div>
              )}

              {/* Header */}
              <div className={`${template.bgColor} p-4`}>
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 ${template.bgColor} rounded-lg flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 ${template.color}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">
                      {template.title}
                    </h3>
                    <div className="flex items-center gap-2 text-xs">
                      <span className={`px-2 py-1 rounded-full ${getDifficultyColor(template.difficulty)}`}>
                        {getDifficultyText(template.difficulty)}
                      </span>
                      <span className="text-gray-500">
                        {template.estimatedTime}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <p className="text-gray-600 text-sm mb-4">
                  {template.description}
                </p>

                {/* Preview Items */}
                <div className="space-y-2 mb-4">
                  <div className="text-xs font-medium text-gray-700 mb-2">
                    포함된 항목 ({template.items.length}개)
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-xs">
                    {template.items.slice(0, 6).map((item, index) => (
                      <div key={index} className="text-gray-600 truncate">
                        • {item.title}
                      </div>
                    ))}
                    {template.items.length > 6 && (
                      <div className="text-gray-500 col-span-2">
                        +{template.items.length - 6}개 더...
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Button */}
                <motion.button
                  whileHover={{ x: 4 }}
                  className={`w-full ${template.color === 'text-pink-600' ? 'bg-pink-600 hover:bg-pink-700' :
                    template.color === 'text-orange-600' ? 'bg-orange-600 hover:bg-orange-700' :
                    template.color === 'text-blue-600' ? 'bg-blue-600 hover:bg-blue-700' :
                    template.color === 'text-purple-600' ? 'bg-purple-600 hover:bg-purple-700' :
                    template.color === 'text-green-600' ? 'bg-green-600 hover:bg-green-700' :
                    'bg-indigo-600 hover:bg-indigo-700'
                  } text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-between`}
                >
                  <span className="font-medium">이 템플릿 사용하기</span>
                  <ChevronRight className="w-4 h-4" />
                </motion.button>
              </div>

              {/* Hover Effect */}
              {hoveredTemplate === template.id && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 pointer-events-none"
                />
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Bottom CTA */}
      <div className="text-center">
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            원하는 템플릿이 없나요?
          </h3>
          <p className="text-gray-600 mb-4">
            직접 만들어서 다른 사용자들과 공유해보세요!
          </p>
          <button
            onClick={onCreateCustom}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all"
          >
            나만의 월드컵 만들기
          </button>
        </div>
      </div>
    </div>
  );
}