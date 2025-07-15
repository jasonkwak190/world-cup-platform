// Basic API tests to validate the migration structure
import { describe, it, expect, beforeEach } from '@jest/globals';
import * as worldcupsApi from '../worldcups';
import { validateData, schemas } from '../validation';

// Mock fetch globally
global.fetch = jest.fn();

describe('WorldCups API', () => {
  beforeEach(() => {
    // Reset fetch mock before each test
    (global.fetch as jest.Mock).mockClear();
  });

  describe('API Interface', () => {
    it('should export all required functions', () => {
      expect(typeof worldcupsApi.getWorldCups).toBe('function');
      expect(typeof worldcupsApi.getWorldCupById).toBe('function');
      expect(typeof worldcupsApi.createWorldCup).toBe('function');
      expect(typeof worldcupsApi.updateWorldCup).toBe('function');
      expect(typeof worldcupsApi.deleteWorldCup).toBe('function');
      expect(typeof worldcupsApi.submitVote).toBe('function');
      expect(typeof worldcupsApi.getVoteStats).toBe('function');
      expect(typeof worldcupsApi.updateWorldCupStats).toBe('function');
      expect(typeof worldcupsApi.getUserWorldCups).toBe('function');
    });

    it('should have proper TypeScript types', () => {
      // This test ensures our types are properly exported
      expect(worldcupsApi.WorldCupApiError).toBeDefined();
      expect(worldcupsApi.apiCall).toBeDefined();
    });
  });

  describe('API Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      // Mock fetch to reject
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      try {
        await worldcupsApi.getWorldCups();
        fail('Expected error to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(worldcupsApi.WorldCupApiError);
        expect(error.message).toBe('Network error');
      }
    });

    it('should handle HTTP errors with proper status codes', async () => {
      // Mock fetch to return 404
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ error: 'WorldCup not found' })
      });

      try {
        await worldcupsApi.getWorldCupById('non-existent-id');
        fail('Expected error to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(worldcupsApi.WorldCupApiError);
        expect(error.status).toBe(404);
        expect(error.message).toBe('WorldCup not found');
      }
    });

    it('should handle malformed JSON responses', async () => {
      // Mock fetch to return invalid JSON
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => {
          throw new Error('Invalid JSON');
        }
      });

      try {
        await worldcupsApi.getWorldCups();
        fail('Expected error to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(worldcupsApi.WorldCupApiError);
        expect(error.message).toContain('HTTP 500');
      }
    });
  });

  describe('API Request Formatting', () => {
    it('should format list requests correctly', async () => {
      // Mock successful response
      const mockResponse = {
        worldcups: [],
        pagination: { limit: 12, offset: 0, total: 0, hasMore: false }
      };
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const params = {
        limit: 10,
        offset: 20,
        category: 'entertainment',
        search: 'test'
      };

      await worldcupsApi.getWorldCups(params);

      // Verify fetch was called with correct URL
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/worldcups/list?limit=10&offset=20&category=entertainment&search=test')
      );
    });

    it('should format create requests correctly', async () => {
      // Mock successful response
      const mockResponse = {
        worldcup: { id: 'test-id', title: 'Test WorldCup', createdAt: '2023-01-01', itemsCount: 2 }
      };
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const createData = {
        title: 'Test WorldCup',
        category: 'entertainment',
        items: [
          { title: 'Item 1', mediaType: 'image' as const, imageUrl: 'https://example.com/1.jpg' },
          { title: 'Item 2', mediaType: 'image' as const, imageUrl: 'https://example.com/2.jpg' }
        ]
      };

      await worldcupsApi.createWorldCup(createData);

      // Verify fetch was called with correct parameters
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/worldcups/create',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(createData)
        })
      );
    });
  });

  describe('Response Parsing', () => {
    it('should parse list responses correctly', async () => {
      const mockResponse = {
        worldcups: [
          {
            id: 'test-id',
            title: 'Test WorldCup',
            description: 'Test description',
            thumbnail: 'https://example.com/thumb.jpg',
            author: 'Test Author',
            createdAt: '2023-01-01',
            participants: 10,
            comments: 5,
            likes: 20,
            category: 'entertainment',
            isPublic: true
          }
        ],
        pagination: { limit: 12, offset: 0, total: 1, hasMore: false }
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await worldcupsApi.getWorldCups();

      expect(result).toEqual(mockResponse);
      expect(result.worldcups).toHaveLength(1);
      expect(result.worldcups[0]).toMatchObject({
        id: 'test-id',
        title: 'Test WorldCup',
        category: 'entertainment'
      });
    });

    it('should parse individual worldcup responses correctly', async () => {
      const mockResponse = {
        worldcup: {
          id: 'test-id',
          title: 'Test WorldCup',
          items: [
            {
              id: 'item-1',
              title: 'Item 1',
              mediaType: 'image',
              image: 'https://example.com/1.jpg'
            },
            {
              id: 'item-2',
              title: 'Item 2',
              mediaType: 'video',
              videoUrl: 'https://youtube.com/watch?v=123',
              image: 'https://youtube.com/thumb.jpg'
            }
          ]
        }
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await worldcupsApi.getWorldCupById('test-id');

      expect(result).toEqual(mockResponse.worldcup);
      expect(result.items).toHaveLength(2);
      expect(result.items[0].mediaType).toBe('image');
      expect(result.items[1].mediaType).toBe('video');
    });
  });
});

describe('API Validation', () => {
  describe('Schema Validation', () => {
    it('should validate worldcup creation data', () => {
      const validData = {
        title: 'Test WorldCup',
        description: 'Test description',
        category: 'entertainment',
        isPublic: true,
        items: [
          { title: 'Item 1', mediaType: 'image', imageUrl: 'https://example.com/1.jpg' },
          { title: 'Item 2', mediaType: 'image', imageUrl: 'https://example.com/2.jpg' }
        ]
      };

      expect(() => validateData(schemas.createWorldCup, validData)).not.toThrow();
    });

    it('should reject invalid worldcup data', () => {
      const invalidData = {
        title: '', // Empty title
        category: 'invalid_category',
        items: [
          { title: 'Item 1' } // Missing mediaType and imageUrl
        ]
      };

      expect(() => validateData(schemas.createWorldCup, invalidData)).toThrow();
    });

    it('should validate vote data', () => {
      const validVote = {
        winnerId: '123e4567-e89b-12d3-a456-426614174000',
        loserId: '123e4567-e89b-12d3-a456-426614174001',
        roundType: 'semi'
      };

      expect(() => validateData(schemas.vote, validVote)).not.toThrow();
    });

    it('should reject invalid vote data', () => {
      const invalidVote = {
        winnerId: '123e4567-e89b-12d3-a456-426614174000',
        loserId: '123e4567-e89b-12d3-a456-426614174000', // Same as winner
        roundType: 'invalid_round'
      };

      expect(() => validateData(schemas.vote, invalidVote)).toThrow();
    });
  });

  describe('Data Sanitization', () => {
    it('should handle special characters in titles', () => {
      const dataWithSpecialChars = {
        title: 'Test <script>alert("xss")</script> WorldCup',
        category: 'entertainment',
        items: [
          { title: 'Item 1', mediaType: 'image', imageUrl: 'https://example.com/1.jpg' },
          { title: 'Item 2', mediaType: 'image', imageUrl: 'https://example.com/2.jpg' }
        ]
      };

      // This should throw because of HTML characters in title
      expect(() => validateData(schemas.createWorldCup, dataWithSpecialChars)).toThrow();
    });

    it('should validate URL formats', () => {
      const dataWithInvalidUrl = {
        title: 'Test WorldCup',
        category: 'entertainment',
        thumbnailUrl: 'not-a-valid-url',
        items: [
          { title: 'Item 1', mediaType: 'image', imageUrl: 'https://example.com/1.jpg' },
          { title: 'Item 2', mediaType: 'image', imageUrl: 'https://example.com/2.jpg' }
        ]
      };

      expect(() => validateData(schemas.createWorldCup, dataWithInvalidUrl)).toThrow();
    });
  });
});

describe('Legacy Compatibility', () => {
  it('should export legacy compatibility functions', () => {
    expect(typeof worldcupsApi.getWorldCups_Legacy).toBe('function');
    expect(typeof worldcupsApi.getWorldCupById_Legacy).toBe('function');
    expect(typeof worldcupsApi.updateWorldCupStats_Legacy).toBe('function');
    expect(typeof worldcupsApi.deleteWorldCup_Legacy).toBe('function');
  });

  it('should maintain backward compatibility with legacy function signatures', async () => {
    // Mock response for legacy compatibility test
    const mockResponse = {
      worldcups: [],
      pagination: { limit: 12, offset: 0, total: 0, hasMore: false }
    };
    
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });

    // Should work with legacy function call
    const result = await worldcupsApi.getWorldCups_Legacy();
    expect(result).toEqual(mockResponse);
  });
});