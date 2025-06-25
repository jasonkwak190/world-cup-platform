const categories = [
  { id: 'all', name: '전체', count: 1284 },
  { id: 'celebrity', name: '연예인', count: 342 },
  { id: 'food', name: '음식', count: 156 },
  { id: 'travel', name: '여행', count: 89 },
  { id: 'anime', name: '애니메이션', count: 234 },
  { id: 'game', name: '게임', count: 167 },
  { id: 'movie', name: '영화', count: 98 },
  { id: 'music', name: '음악', count: 76 },
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
}

export default function CategoryFilter({
  selectedCategory,
  selectedSort,
  onCategoryChange,
  onSortChange,
}: CategoryFilterProps) {
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
                {category.count}
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
            총 {categories.find(c => c.id === selectedCategory)?.count || 0}개
          </div>
        </div>
      </div>
    </div>
  );
}