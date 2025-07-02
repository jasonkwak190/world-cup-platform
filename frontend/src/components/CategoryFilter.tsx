// 카테고리 정의 (개수는 동적으로 계산)
const categoryDefinitions = [
  { id: 'all', name: '전체' },
  { id: 'celebrity', name: '연예인' },
  { id: 'food', name: '음식' },
  { id: 'travel', name: '여행' },
  { id: 'anime', name: '애니메이션' },
  { id: 'game', name: '게임' },
  { id: 'movie', name: '영화' },
  { id: 'music', name: '음악' },
  { id: 'entertainment', name: '엔터테인먼트' },
  { id: 'sports', name: '스포츠' },
  { id: 'other', name: '기타' },
];

const sortOptions = [
  { id: 'popular', name: '인기순' },
  { id: 'recent', name: '최신순' },
  { id: 'participants', name: '참여많은순' },
  { id: 'comments', name: '댓글많은순' },
];

interface CategoryFilterProps {
  selectedCategory: string;
  selectedSort: string;
  onCategoryChange: (category: string) => void;
  onSortChange: (sort: string) => void;
  categoryCounts?: { [key: string]: number }; // 카테고리별 개수
}

export default function CategoryFilter({
  selectedCategory,
  selectedSort,
  onCategoryChange,
  onSortChange,
  categoryCounts = {},
}: CategoryFilterProps) {
  
  // 카테고리 정의와 실제 개수를 합쳐서 categories 배열 생성
  const categories = categoryDefinitions.map(category => ({
    ...category,
    count: categoryCounts[category.id] || 0
  })).filter(category => 
    // 개수가 0인 카테고리는 숨기지만, '전체'는 항상 표시
    category.id === 'all' || category.count > 0
  );

  return (
    <div className="bg-white border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Categories */}
        <div className="flex space-x-8 overflow-x-auto pb-0">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => onCategoryChange(category.id)}
              className={`flex-shrink-0 py-4 px-1 border-b-2 transition-colors ${
                selectedCategory === category.id
                  ? 'border-emerald-500 text-emerald-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="font-medium">{category.name}</span>
              <span className="ml-2 text-sm bg-gray-100 px-2 py-1 rounded-full">
                {category.count.toLocaleString()}
              </span>
            </button>
          ))}
        </div>

        {/* Sort Options */}
        <div className="flex justify-between items-center py-4">
          <div className="flex space-x-4">
            {sortOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => onSortChange(option.id)}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  selectedSort === option.id
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {option.name}
              </button>
            ))}
          </div>
          
          <div className="text-sm text-gray-500">
            총 {(categories.find(c => c.id === selectedCategory)?.count || 0).toLocaleString()}개
          </div>
        </div>
      </div>
    </div>
  );
}