import React from 'react';
import { render, screen } from '@testing-library/react';
import TrendingRanking from '../TrendingRanking';

// Mock the useTrending hook
jest.mock('../../hooks/useTrending', () => ({
  useTrending: () => ({
    data: [
      {
        id: '1',
        title: '테스트 월드컵',
        rank: 1,
        play_count: 1000,
        isHot: true,
        isRising: false,
        isNew: false,
      },
      {
        id: '2',
        title: '두 번째 월드컵',
        rank: 2,
        play_count: 500,
        isHot: false,
        isRising: true,
        isNew: false,
      },
    ],
    loading: false,
    error: null,
    lastUpdated: new Date().toISOString(),
    refetch: jest.fn(),
  }),
}));

describe('TrendingRanking', () => {
  test('renders without crashing', () => {
    render(<TrendingRanking />);
    expect(screen.getByText('인기 월드컵')).toBeInTheDocument();
  });

  test('displays trending items correctly', async () => {
    render(<TrendingRanking />);
    
    // Wait for client-side rendering
    await new Promise(resolve => setTimeout(resolve, 100));
    
    expect(screen.getByText('테스트 월드컵')).toBeInTheDocument();
    expect(screen.getByText('두 번째 월드컵')).toBeInTheDocument();
    expect(screen.getByText('1,000회')).toBeInTheDocument();
    expect(screen.getByText('500회')).toBeInTheDocument();
  });

  test('displays HOT and RISING indicators', async () => {
    render(<TrendingRanking />);
    
    // Wait for client-side rendering
    await new Promise(resolve => setTimeout(resolve, 100));
    
    expect(screen.getByText('HOT')).toBeInTheDocument();
    expect(screen.getByText('↗')).toBeInTheDocument();
  });
});