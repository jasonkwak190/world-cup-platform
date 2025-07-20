import { renderHook, act } from '@testing-library/react';
import { useCommentSystem, CurrentUser } from '../useCommentSystem';

describe('useCommentSystem', () => {
  const mockCurrentUser: CurrentUser = {
    id: 'user-123',
    name: 'Test User',
    avatar: 'https://example.com/avatar.jpg',
    level: 'Gold'
  };

  const mockInitialComments = [
    {
      id: '1',
      content: 'Test comment',
      createdAt: '2024-01-01T00:00:00Z',
      likes: 5,
      user: {
        id: 'user-123',
        name: 'Test User',
        image: 'https://example.com/avatar.jpg',
        level: 'gold'
      },
      replies: []
    },
    {
      id: '2', 
      content: 'Guest comment',
      createdAt: '2024-01-01T01:00:00Z',
      likes: 2,
      guestName: 'Guest User',
      replies: []
    }
  ];

  it('should process initial comments correctly with real user data', () => {
    const { result } = renderHook(() =>
      useCommentSystem({
        initialComments: mockInitialComments,
        isAuthenticated: true,
        currentUser: mockCurrentUser,
        worldcupCreatorId: 'user-123'
      })
    );

    const { allComments } = result.current;
    
    expect(allComments).toHaveLength(2);
    
    // Test authenticated user comment
    const userComment = allComments[0];
    expect(userComment.author.name).toBe('Test User');
    expect(userComment.author.avatar).toBe('https://example.com/avatar.jpg');
    expect(userComment.author.isVerified).toBe(true);
    expect(userComment.author.level).toBe('Gold');
    expect(userComment.isOwner).toBe(true);
    expect(userComment.isCreator).toBe(true);
    
    // Test guest comment
    const guestComment = allComments[1];
    expect(guestComment.author.name).toBe('Guest User');
    expect(guestComment.author.avatar).toBe('https://avatar.vercel.sh/Guest User.png');
    expect(guestComment.author.isVerified).toBe(false);
    expect(guestComment.author.level).toBe('Guest');
    expect(guestComment.isOwner).toBe(false);
    expect(guestComment.isCreator).toBe(false);
  });

  it('should create new comments with correct user data', () => {
    const { result } = renderHook(() =>
      useCommentSystem({
        initialComments: [],
        isAuthenticated: true,
        currentUser: mockCurrentUser,
        worldcupCreatorId: 'creator-456'
      })
    );

    act(() => {
      // Set comment content
      result.current.setNewComment('New test comment');
    });
    
    act(() => {
      // Submit comment
      result.current.handleSubmitComment();
    });

    const { allComments } = result.current;
    expect(allComments).toHaveLength(1);

    const newComment = allComments[0];
    expect(newComment.author.name).toBe('Test User');
    expect(newComment.author.avatar).toBe('https://example.com/avatar.jpg');
    expect(newComment.author.isVerified).toBe(true);
    expect(newComment.author.level).toBe('Gold');
    expect(newComment.isOwner).toBe(true);
    expect(newComment.isCreator).toBe(false); // Not the creator since worldcupCreatorId is different
  });

  it('should handle guest comments correctly', () => {
    const { result } = renderHook(() =>
      useCommentSystem({
        initialComments: [],
        isAuthenticated: false,
        currentUser: undefined,
        worldcupCreatorId: 'creator-456'
      })
    );

    act(() => {
      // Set guest name and comment content
      result.current.setGuestName('Test Guest');
      result.current.setNewComment('Guest comment');
    });
    
    act(() => {
      // Submit comment
      result.current.handleSubmitComment();
    });

    const { allComments } = result.current;
    expect(allComments).toHaveLength(1);

    const guestComment = allComments[0];
    expect(guestComment.author.name).toBe('Test Guest');
    expect(guestComment.author.avatar).toBe('https://avatar.vercel.sh/Test Guest.png');
    expect(guestComment.author.isVerified).toBe(false);
    expect(guestComment.author.level).toBe('Guest');
    expect(guestComment.isOwner).toBe(true);
    expect(guestComment.isCreator).toBe(false);
  });
});