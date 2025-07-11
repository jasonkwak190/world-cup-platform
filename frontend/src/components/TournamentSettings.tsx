'use client';

import { Settings, Globe, Lock } from 'lucide-react';

interface WorldCupData {
  title: string;
  description: string;
  category: string;
  items: any[];
  videoItems?: any[];
  isPublic: boolean;
}

interface TournamentSettingsProps {
  data: WorldCupData;
  onChange: (data: WorldCupData) => void;
}

const categories = [
  { id: 'entertainment', name: '엔터테인먼트', emoji: '🎭' },
  { id: 'sports', name: '스포츠', emoji: '⚽' },
  { id: 'food', name: '음식', emoji: '🍕' },
  { id: 'game', name: '게임', emoji: '🎮' },
  { id: 'anime', name: '애니메이션', emoji: '🎨' },
  { id: 'movie', name: '영화/드라마', emoji: '🎬' },
  { id: 'music', name: '음악', emoji: '🎵' },
  { id: 'travel', name: '여행', emoji: '✈️' },
  { id: 'fashion', name: '패션', emoji: '👗' },
  { id: 'technology', name: '기술', emoji: '💻' },
  { id: 'other', name: '기타', emoji: '🔖' },
];

export default function TournamentSettings({ data, onChange }: TournamentSettingsProps) {
  const handleChange = (field: keyof WorldCupData, value: any) => {
    onChange({
      ...data,
      [field]: value,
    });
  };


  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
            <Settings className="w-8 h-8 text-emerald-600" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          기본 정보 설정
        </h2>
        <p className="text-gray-600">
          월드컵의 제목, 설명, 카테고리를 설정해주세요.
        </p>
      </div>

      <div className="max-w-2xl mx-auto space-y-6">
        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            월드컵 제목 *
          </label>
          <input
            type="text"
            id="title"
            value={data.title}
            onChange={(e) => handleChange('title', e.target.value)}
            placeholder="예: K-POP 아이돌 이상형 월드컵"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-lg text-gray-900"
            maxLength={100}
          />
          <div className="flex justify-between mt-1">
            <p className="text-sm text-gray-500">
              검색하기 쉬운 명확한 제목을 작성해주세요
            </p>
            <span className="text-xs text-gray-400">
              {data.title.length}/100
            </span>
          </div>
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            월드컵 설명
          </label>
          <textarea
            id="description"
            value={data.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="월드컵에 대한 간단한 설명을 입력해주세요..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none text-gray-900"
            rows={4}
            maxLength={500}
          />
          <div className="flex justify-between mt-1">
            <p className="text-sm text-gray-500">
              사용자들이 이해하기 쉽도록 설명해주세요
            </p>
            <span className="text-xs text-gray-400">
              {data.description.length}/500
            </span>
          </div>
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            카테고리 *
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => handleChange('category', category.id)}
                className={`p-3 rounded-lg border text-left transition-colors ${
                  data.category === category.id
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700'
                }`}
              >
                <div className="text-lg mb-1">{category.emoji}</div>
                <div className="text-sm font-medium">{category.name}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Privacy Settings */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            공개 설정
          </label>
          <div className="space-y-3">
            <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="privacy"
                checked={data.isPublic}
                onChange={() => handleChange('isPublic', true)}
                className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
              />
              <div className="ml-3 flex items-center">
                <Globe className="w-5 h-5 text-emerald-600 mr-2" />
                <div>
                  <div className="text-sm font-medium text-gray-900">공개</div>
                  <div className="text-xs text-gray-500">
                    모든 사용자가 볼 수 있고 검색됩니다
                  </div>
                </div>
              </div>
            </label>
            
            <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="privacy"
                checked={!data.isPublic}
                onChange={() => handleChange('isPublic', false)}
                className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
              />
              <div className="ml-3 flex items-center">
                <Lock className="w-5 h-5 text-gray-600 mr-2" />
                <div>
                  <div className="text-sm font-medium text-gray-900">비공개</div>
                  <div className="text-xs text-gray-500">
                    링크를 아는 사용자만 볼 수 있습니다
                  </div>
                </div>
              </div>
            </label>
          </div>
        </div>


        {/* Guidelines */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-amber-800 mb-2">
            📋 월드컵 제작 가이드라인
          </h4>
          <ul className="text-sm text-amber-700 space-y-1">
            <li>• 타인에게 불쾌감을 줄 수 있는 내용은 피해주세요</li>
            <li>• 저작권이 있는 이미지 사용 시 출처를 명시해주세요</li>
            <li>• 명확하고 이해하기 쉬운 제목을 작성해주세요</li>
            <li>• 카테고리를 정확히 선택하여 사용자가 찾기 쉽도록 해주세요</li>
          </ul>
        </div>
      </div>
    </div>
  );
}