'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { FixedSizeGrid as Grid } from 'react-window';
import WorldCupCard from './WorldCupCard';
import { getStoredWorldCups, type StoredWorldCup } from '@/utils/storage';
import { getWorldCups as getSupabaseWorldCups } from '@/utils/supabaseData';

interface VirtualizedWorldCupGridProps {
  category: string;
  sortBy: string;
  searchQuery?: string;
  items: StoredWorldCup[];
  likedItems: Set<string>;
  bookmarkedItems: Set<string>;
  isLoggedIn: boolean;
  onPlay: (id: string) => void;
  onLike: (id: string) => void;
  onBookmark: (id: string) => void;
  onShare: (id: string) => void;
}

interface GridItemProps {
  columnIndex: number;
  rowIndex: number;
  style: React.CSSProperties;
  data: {
    items: StoredWorldCup[];
    columnsPerRow: number;
    likedItems: Set<string>;
    bookmarkedItems: Set<string>;
    isLoggedIn: boolean;
    onPlay: (id: string) => void;
    onLike: (id: string) => void;
    onBookmark: (id: string) => void;
    onShare: (id: string) => void;
  };
}

// Grid item renderer
const GridItem: React.FC<GridItemProps> = ({ columnIndex, rowIndex, style, data }) => {
  const {
    items,
    columnsPerRow,
    likedItems,
    bookmarkedItems,
    isLoggedIn,
    onPlay,
    onLike,
    onBookmark,
    onShare,
  } = data;

  const itemIndex = rowIndex * columnsPerRow + columnIndex;
  const worldcup = items[itemIndex];

  if (!worldcup) {
    return <div style={style} />;
  }

  return (
    <div style={{ ...style, padding: '12px' }}>
      <WorldCupCard
        key={worldcup.id}
        {...worldcup}
        isLiked={likedItems.has(worldcup.id)}
        isBookmarked={bookmarkedItems.has(worldcup.id)}
        isLoggedIn={isLoggedIn}
        onPlay={() => onPlay(worldcup.id)}
        onLike={() => onLike(worldcup.id)}
        onBookmark={() => onBookmark(worldcup.id)}
        onShare={() => onShare(worldcup.id)}
      />
    </div>
  );
};

export default function VirtualizedWorldCupGrid({
  category,
  sortBy,
  searchQuery = '',
  items,
  likedItems,
  bookmarkedItems,
  isLoggedIn,
  onPlay,
  onLike,
  onBookmark,
  onShare,
}: VirtualizedWorldCupGridProps) {
  const [containerWidth, setContainerWidth] = useState(1200);
  const [containerHeight, setContainerHeight] = useState(600);

  // Calculate responsive columns based on screen width
  const columnsPerRow = useMemo(() => {
    if (containerWidth < 640) return 1; // mobile: 1 column
    if (containerWidth < 1024) return 2; // tablet: 2 columns
    if (containerWidth < 1280) return 2; // small desktop: 2 columns
    return 3; // large desktop: 3 columns
  }, [containerWidth]);

  const cardWidth = Math.floor(containerWidth / columnsPerRow);
  const cardHeight = 420; // Approximate height of WorldCupCard
  const rowCount = Math.ceil(items.length / columnsPerRow);

  // Handle window resize
  useEffect(() => {
    const updateDimensions = () => {
      const container = document.getElementById('virtualized-grid-container');
      if (container) {
        const rect = container.getBoundingClientRect();
        setContainerWidth(rect.width);
        setContainerHeight(Math.min(window.innerHeight - 200, 800)); // Max height with some padding
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Memoize grid data to prevent unnecessary re-renders
  const gridData = useMemo(() => ({
    items,
    columnsPerRow,
    likedItems,
    bookmarkedItems,
    isLoggedIn,
    onPlay,
    onLike,
    onBookmark,
    onShare,
  }), [
    items,
    columnsPerRow,
    likedItems,
    bookmarkedItems,
    isLoggedIn,
    onPlay,
    onLike,
    onBookmark,
    onShare,
  ]);

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg mb-4">아직 생성된 월드컵이 없습니다.</p>
        <a 
          href="/create" 
          className="inline-block px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
        >
          첫 번째 월드컵 만들기
        </a>
      </div>
    );
  }

  return (
    <div id="virtualized-grid-container" className="w-full">
      <div className="mb-4 text-sm text-gray-600">
        총 {items.length}개의 월드컵 (가상화된 스크롤 - 성능 최적화)
      </div>
      
      <Grid
        columnCount={columnsPerRow}
        columnWidth={cardWidth}
        height={containerHeight}
        rowCount={rowCount}
        rowHeight={cardHeight}
        width={containerWidth}
        itemData={gridData}
        overscanRowCount={2} // Pre-render 2 extra rows for smoother scrolling
        overscanColumnCount={1}
      >
        {GridItem}
      </Grid>
    </div>
  );
}