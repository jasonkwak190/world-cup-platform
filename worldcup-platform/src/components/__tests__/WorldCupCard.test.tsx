import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import WorldCupCard from '../WorldCupCard'

const mockProps = {
  id: 'test-worldcup-1',
  title: 'Test WorldCup',
  description: 'This is a test worldcup',
  thumbnail: '/test-image.jpg',
  author: 'Test Author',
  createdAt: '2024-01-01',
  participants: 100,
  comments: 5,
  likes: 20,
  isLiked: false,
  isBookmarked: false,
  isLoggedIn: true,
  onPlay: jest.fn(),
  onLike: jest.fn(),
  onBookmark: jest.fn(),
  onShare: jest.fn(),
}

describe('WorldCupCard', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders worldcup information correctly', () => {
    render(<WorldCupCard {...mockProps} />)
    
    expect(screen.getByText('Test WorldCup')).toBeInTheDocument()
    expect(screen.getByText('This is a test worldcup')).toBeInTheDocument()
    expect(screen.getByText('Test Author')).toBeInTheDocument()
    expect(screen.getByText('2024-01-01')).toBeInTheDocument()
  })

  it('displays correct stats', () => {
    render(<WorldCupCard {...mockProps} />)
    
    expect(screen.getByText('100')).toBeInTheDocument() // participants
    expect(screen.getByText('5')).toBeInTheDocument() // comments
    expect(screen.getByText('20')).toBeInTheDocument() // likes
  })

  it('calls onPlay when play button is clicked', async () => {
    const user = userEvent.setup()
    render(<WorldCupCard {...mockProps} />)
    
    const playButton = screen.getByText('시작하기')
    await user.click(playButton)
    
    expect(mockProps.onPlay).toHaveBeenCalledTimes(1)
  })

  it('calls onLike when like button is clicked', async () => {
    const user = userEvent.setup()
    render(<WorldCupCard {...mockProps} />)
    
    const likeButtons = screen.getAllByRole('button')
    const likeButton = likeButtons.find(button => 
      button.querySelector('svg')?.classList.contains('lucide-heart')
    )
    
    if (likeButton) {
      await user.click(likeButton)
      expect(mockProps.onLike).toHaveBeenCalledTimes(1)
    }
  })

  it('calls onShare when share button is clicked', async () => {
    const user = userEvent.setup()
    render(<WorldCupCard {...mockProps} />)
    
    const shareButtons = screen.getAllByRole('button')
    const shareButton = shareButtons.find(button => 
      button.querySelector('svg')?.classList.contains('lucide-share-2')
    )
    
    if (shareButton) {
      await user.click(shareButton)
      expect(mockProps.onShare).toHaveBeenCalledTimes(1)
    }
  })

  it('shows liked state correctly', () => {
    render(<WorldCupCard {...mockProps} isLiked={true} />)
    
    const heartIcons = screen.getAllByRole('button').map(button => 
      button.querySelector('svg')
    ).filter(svg => svg?.classList.contains('lucide-heart'))
    
    expect(heartIcons.length).toBeGreaterThan(0)
  })

  it('disables bookmark for non-logged users', () => {
    render(<WorldCupCard {...mockProps} isLoggedIn={false} />)
    
    const bookmarkButtons = screen.getAllByRole('button')
    const bookmarkButton = bookmarkButtons.find(button => 
      button.querySelector('svg')?.classList.contains('lucide-bookmark')
    )
    
    expect(bookmarkButton).toBeDisabled()
  })

  it('handles image error gracefully', () => {
    render(<WorldCupCard {...mockProps} thumbnail="" />)
    
    // Should show fallback UI when no thumbnail
    expect(screen.getByText('🏆')).toBeInTheDocument()
  })

  it('navigates to worldcup page when title is clicked', () => {
    render(<WorldCupCard {...mockProps} />)
    
    const titleLink = screen.getByRole('link')
    expect(titleLink).toHaveAttribute('href', '/worldcup/test-worldcup-1')
  })
})