import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ContinuePlayModal from '../ContinuePlayModal'

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}))

describe('ContinuePlayModal', () => {
  const defaultProps = {
    isOpen: true,
    onContinue: jest.fn(),
    onStartNew: jest.fn(),
    onClose: jest.fn(),
    worldcupTitle: 'Test World Cup',
    progress: {
      currentRound: 2,
      totalRounds: 4,
      lastSaved: '2023-01-01T12:00:00Z',
    },
  }

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2023-01-01T12:30:00Z')) // 30 minutes after save
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('rendering', () => {
    it('should render modal when isOpen is true', () => {
      render(<ContinuePlayModal {...defaultProps} />)

      expect(screen.getByText('진행 중인 게임 발견')).toBeInTheDocument()
      expect(screen.getByText('이어서 플레이하시겠습니까?')).toBeInTheDocument()
      expect(screen.getByText('Test World Cup')).toBeInTheDocument()
    })

    it('should not render modal when isOpen is false', () => {
      render(<ContinuePlayModal {...defaultProps} isOpen={false} />)

      expect(screen.queryByText('진행 중인 게임 발견')).not.toBeInTheDocument()
    })

    it('should render without progress data', () => {
      render(<ContinuePlayModal {...defaultProps} progress={undefined} />)

      expect(screen.getByText('진행 중인 게임 발견')).toBeInTheDocument()
      expect(screen.getByText('Test World Cup')).toBeInTheDocument()
      expect(screen.queryByText('라운드 진행 중')).not.toBeInTheDocument()
    })
  })

  describe('progress display', () => {
    it('should display progress information correctly', () => {
      render(<ContinuePlayModal {...defaultProps} />)

      expect(screen.getByText('2라운드 진행 중')).toBeInTheDocument()
      expect(screen.getByText('50%')).toBeInTheDocument() // 2/4 rounds = 50%
      expect(screen.getByText('30분 전 저장됨')).toBeInTheDocument()
    })

    it('should calculate progress percentage correctly', () => {
      const progressData = {
        currentRound: 3,
        totalRounds: 5,
        lastSaved: '2023-01-01T12:00:00Z',
      }

      render(<ContinuePlayModal {...defaultProps} progress={progressData} />)

      expect(screen.getByText('60%')).toBeInTheDocument() // 3/5 rounds = 60%
    })

    it('should display progress bar with correct width', () => {
      render(<ContinuePlayModal {...defaultProps} />)

      const progressBar = screen.getByRole('progressbar')
      expect(progressBar).toHaveStyle('width: 50%') // 2/4 rounds = 50%
    })

    it('should handle edge case of 0 total rounds', () => {
      const progressData = {
        currentRound: 0,
        totalRounds: 0,
        lastSaved: '2023-01-01T12:00:00Z',
      }

      render(<ContinuePlayModal {...defaultProps} progress={progressData} />)

      expect(screen.getByText('0%')).toBeInTheDocument()
    })
  })

  describe('time formatting', () => {
    const testCases = [
      { minutesAgo: 0, expected: '방금 전' },
      { minutesAgo: 5, expected: '5분 전' },
      { minutesAgo: 30, expected: '30분 전' },
      { minutesAgo: 90, expected: '1시간 전' },
      { minutesAgo: 120, expected: '2시간 전' },
      { minutesAgo: 1440, expected: '1일 전' },
      { minutesAgo: 2880, expected: '2일 전' },
    ]

    testCases.forEach(({ minutesAgo, expected }) => {
      it(`should format ${minutesAgo} minutes ago as "${expected}"`, () => {
        const lastSaved = new Date(Date.now() - minutesAgo * 60 * 1000).toISOString()
        const progressData = {
          currentRound: 2,
          totalRounds: 4,
          lastSaved,
        }

        render(<ContinuePlayModal {...defaultProps} progress={progressData} />)

        expect(screen.getByText(`${expected} 저장됨`)).toBeInTheDocument()
      })
    })
  })

  describe('user interactions', () => {
    it('should call onContinue when continue button is clicked', async () => {
      render(<ContinuePlayModal {...defaultProps} />)

      const continueButton = screen.getByText('이어서 하기')
      fireEvent.click(continueButton)

      await waitFor(() => {
        expect(defaultProps.onContinue).toHaveBeenCalledTimes(1)
      })
    })

    it('should call onStartNew when start new button is clicked', async () => {
      render(<ContinuePlayModal {...defaultProps} />)

      const startNewButton = screen.getByText('새로 시작하기')
      fireEvent.click(startNewButton)

      await waitFor(() => {
        expect(defaultProps.onStartNew).toHaveBeenCalledTimes(1)
      })
    })

    it('should call onClose when close button is clicked', async () => {
      render(<ContinuePlayModal {...defaultProps} />)

      const closeButton = screen.getByRole('button', { name: /close/i })
      fireEvent.click(closeButton)

      await waitFor(() => {
        expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('button styles', () => {
    it('should have correct styling for continue button', () => {
      render(<ContinuePlayModal {...defaultProps} />)

      const continueButton = screen.getByText('이어서 하기')
      expect(continueButton).toHaveClass('bg-gradient-to-r', 'from-purple-600', 'to-pink-600')
    })

    it('should have correct styling for start new button', () => {
      render(<ContinuePlayModal {...defaultProps} />)

      const startNewButton = screen.getByText('새로 시작하기')
      expect(startNewButton).toHaveClass('bg-gray-100', 'text-gray-700')
    })
  })

  describe('accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<ContinuePlayModal {...defaultProps} />)

      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /이어서 하기/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /새로 시작하기/i })).toBeInTheDocument()
    })

    it('should handle keyboard navigation', () => {
      render(<ContinuePlayModal {...defaultProps} />)

      const continueButton = screen.getByText('이어서 하기')
      const startNewButton = screen.getByText('새로 시작하기')

      // Tab navigation should work
      continueButton.focus()
      expect(continueButton).toHaveFocus()

      fireEvent.keyDown(continueButton, { key: 'Tab' })
      expect(startNewButton).toHaveFocus()
    })
  })

  describe('modal overlay', () => {
    it('should render modal overlay with correct styling', () => {
      render(<ContinuePlayModal {...defaultProps} />)

      const overlay = screen.getByText('진행 중인 게임 발견').closest('.fixed')
      expect(overlay).toHaveClass('inset-0', 'bg-black/50', 'z-50')
    })

    it('should center modal content', () => {
      render(<ContinuePlayModal {...defaultProps} />)

      const modalContent = screen.getByText('진행 중인 게임 발견').closest('.bg-white')
      expect(modalContent).toHaveClass('rounded-2xl', 'max-w-md', 'shadow-2xl')
    })
  })

  describe('worldcup title truncation', () => {
    it('should truncate long worldcup titles', () => {
      const longTitle = 'This is a very long worldcup title that should be truncated'
      
      render(<ContinuePlayModal {...defaultProps} worldcupTitle={longTitle} />)

      const titleElement = screen.getByText(longTitle)
      expect(titleElement).toHaveClass('line-clamp-1')
    })
  })

  describe('trophy icon', () => {
    it('should display trophy icon with gradient background', () => {
      render(<ContinuePlayModal {...defaultProps} />)

      const trophyContainer = screen.getByRole('img', { hidden: true })?.parentElement
      expect(trophyContainer).toHaveClass('bg-gradient-to-br', 'from-purple-500', 'to-pink-500')
    })
  })
})