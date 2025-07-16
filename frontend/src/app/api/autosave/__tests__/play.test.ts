import { NextRequest } from 'next/server'
import { POST, GET, DELETE } from '../play/route'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// Mock dependencies
jest.mock('@supabase/auth-helpers-nextjs')
jest.mock('next/headers')

const mockCreateRouteHandlerClient = createRouteHandlerClient as jest.MockedFunction<typeof createRouteHandlerClient>
const mockCookies = cookies as jest.MockedFunction<typeof cookies>

describe('/api/autosave/play', () => {
  let mockSupabase: any
  let mockUser: any

  beforeEach(() => {
    jest.clearAllMocks()
    
    mockUser = {
      id: 'test-user-id',
      email: 'test@example.com',
    }

    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      upsert: jest.fn().mockReturnThis(),
      single: jest.fn(),
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null
        })
      }
    }

    mockCreateRouteHandlerClient.mockReturnValue(mockSupabase)
    mockCookies.mockReturnValue({} as any)
  })

  describe('POST /api/autosave/play', () => {
    it('should save play progress successfully', async () => {
      const requestData = {
        data: {
          worldcup_id: 'test-worldcup-id',
          remaining_items: [{ id: '1', title: 'Item 1' }],
          current_round: 1,
          total_rounds: 2,
          bracket_state: { currentMatch: 0, isCompleted: false },
          round_history: [],
          game_metadata: { startTime: Date.now(), canUndo: false },
        },
        action: 'match_completed',
        timestamp: Date.now(),
      }

      const request = new NextRequest('http://localhost/api/autosave/play', {
        method: 'POST',
        body: JSON.stringify(requestData),
        headers: { 'Content-Type': 'application/json' },
      })

      mockSupabase.upsert.mockResolvedValue({
        data: [{ id: 'save-id', ...requestData.data }],
        error: null,
      })

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)
      expect(mockSupabase.from).toHaveBeenCalledWith('worldcup_play_saves')
      expect(mockSupabase.upsert).toHaveBeenCalledWith({
        user_id: 'test-user-id',
        worldcup_id: 'test-worldcup-id',
        remaining_items: [{ id: '1', title: 'Item 1' }],
        current_round: 1,
        total_rounds: 2,
        bracket_state: { currentMatch: 0, isCompleted: false },
        round_history: [],
        game_metadata: { startTime: expect.any(Number), canUndo: false },
        action: 'match_completed',
        data_size: expect.any(Number),
      })
    })

    it('should require authentication', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null
      })

      const request = new NextRequest('http://localhost/api/autosave/play', {
        method: 'POST',
        body: JSON.stringify({}),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(401)
      expect(responseData.error).toBe('Unauthorized')
    })

    it('should validate request data', async () => {
      const request = new NextRequest('http://localhost/api/autosave/play', {
        method: 'POST',
        body: JSON.stringify({
          data: {
            worldcup_id: '', // Invalid: empty worldcup_id
            remaining_items: [],
            current_round: 1,
            total_rounds: 2,
          },
          action: 'match_completed',
          timestamp: Date.now(),
        }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.error).toBe('Invalid request data')
    })

    it('should handle data size limits', async () => {
      const largeData = {
        data: {
          worldcup_id: 'test-worldcup-id',
          remaining_items: Array(10000).fill({ id: '1', title: 'Item 1' }),
          current_round: 1,
          total_rounds: 2,
          bracket_state: { currentMatch: 0, isCompleted: false },
          round_history: [],
          game_metadata: { startTime: Date.now(), canUndo: false },
        },
        action: 'match_completed',
        timestamp: Date.now(),
      }

      const request = new NextRequest('http://localhost/api/autosave/play', {
        method: 'POST',
        body: JSON.stringify(largeData),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(413)
      expect(responseData.error).toBe('Data size exceeds limit')
    })

    it('should handle database errors', async () => {
      const requestData = {
        data: {
          worldcup_id: 'test-worldcup-id',
          remaining_items: [{ id: '1', title: 'Item 1' }],
          current_round: 1,
          total_rounds: 2,
          bracket_state: { currentMatch: 0, isCompleted: false },
          round_history: [],
          game_metadata: { startTime: Date.now(), canUndo: false },
        },
        action: 'match_completed',
        timestamp: Date.now(),
      }

      const request = new NextRequest('http://localhost/api/autosave/play', {
        method: 'POST',
        body: JSON.stringify(requestData),
        headers: { 'Content-Type': 'application/json' },
      })

      mockSupabase.upsert.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      })

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(500)
      expect(responseData.error).toBe('Failed to save progress')
    })
  })

  describe('GET /api/autosave/play', () => {
    it('should retrieve play progress successfully', async () => {
      const mockSaveData = {
        id: 'save-id',
        user_id: 'test-user-id',
        worldcup_id: 'test-worldcup-id',
        remaining_items: [{ id: '1', title: 'Item 1' }],
        current_round: 1,
        total_rounds: 2,
        bracket_state: { currentMatch: 0, isCompleted: false },
        round_history: [],
        game_metadata: { startTime: Date.now(), canUndo: false },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const request = new NextRequest('http://localhost/api/autosave/play?worldcup_id=test-worldcup-id')

      mockSupabase.single.mockResolvedValue({
        data: mockSaveData,
        error: null,
      })

      const response = await GET(request)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)
      expect(responseData.data).toEqual(mockSaveData)
      expect(mockSupabase.from).toHaveBeenCalledWith('worldcup_play_saves')
      expect(mockSupabase.eq).toHaveBeenCalledWith('user_id', 'test-user-id')
      expect(mockSupabase.eq).toHaveBeenCalledWith('worldcup_id', 'test-worldcup-id')
    })

    it('should require authentication', async () => {
      mockGetUser.mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/autosave/play?worldcup_id=test-worldcup-id')

      const response = await GET(request)
      const responseData = await response.json()

      expect(response.status).toBe(401)
      expect(responseData.error).toBe('Unauthorized')
    })

    it('should require worldcup_id parameter', async () => {
      const request = new NextRequest('http://localhost/api/autosave/play')

      const response = await GET(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.error).toBe('Missing worldcup_id parameter')
    })

    it('should handle not found case', async () => {
      const request = new NextRequest('http://localhost/api/autosave/play?worldcup_id=nonexistent-id')

      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' }, // PostgREST not found error
      })

      const response = await GET(request)
      const responseData = await response.json()

      expect(response.status).toBe(404)
      expect(responseData.error).toBe('Save not found')
    })
  })

  describe('DELETE /api/autosave/play', () => {
    it('should delete play progress successfully', async () => {
      const request = new NextRequest('http://localhost/api/autosave/play?worldcup_id=test-worldcup-id', {
        method: 'DELETE',
      })

      mockSupabase.delete.mockResolvedValue({
        data: [{ id: 'deleted-save-id' }],
        error: null,
      })

      const response = await DELETE(request)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)
      expect(mockSupabase.from).toHaveBeenCalledWith('worldcup_play_saves')
      expect(mockSupabase.eq).toHaveBeenCalledWith('user_id', 'test-user-id')
      expect(mockSupabase.eq).toHaveBeenCalledWith('worldcup_id', 'test-worldcup-id')
    })

    it('should require authentication', async () => {
      mockGetUser.mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/autosave/play?worldcup_id=test-worldcup-id', {
        method: 'DELETE',
      })

      const response = await DELETE(request)
      const responseData = await response.json()

      expect(response.status).toBe(401)
      expect(responseData.error).toBe('Unauthorized')
    })

    it('should require worldcup_id parameter', async () => {
      const request = new NextRequest('http://localhost/api/autosave/play', {
        method: 'DELETE',
      })

      const response = await DELETE(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.error).toBe('Missing worldcup_id parameter')
    })

    it('should handle database errors', async () => {
      const request = new NextRequest('http://localhost/api/autosave/play?worldcup_id=test-worldcup-id', {
        method: 'DELETE',
      })

      mockSupabase.delete.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      })

      const response = await DELETE(request)
      const responseData = await response.json()

      expect(response.status).toBe(500)
      expect(responseData.error).toBe('Failed to delete save')
    })
  })
})