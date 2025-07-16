import React from 'react'
import { render, screen } from '@testing-library/react'
import AutoSaveIndicator, { CompactAutoSaveIndicator } from '../AutoSaveIndicator'

describe('AutoSaveIndicator', () => {
  const mockDate = new Date('2023-01-01T12:00:00Z')

  beforeEach(() => {
    jest.useFakeTimers()
    jest.setSystemTime(mockDate)
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('saving status', () => {
    it('should display saving status correctly', () => {
      render(<AutoSaveIndicator status="saving" />)

      expect(screen.getByText('저장 중...')).toBeInTheDocument()
      expect(screen.getByRole('progressbar')).toBeInTheDocument() // Loading spinner
      expect(screen.getByText('저장 중...')).toHaveClass('text-blue-600')
    })

    it('should show animated spinner when saving', () => {
      render(<AutoSaveIndicator status="saving" />)

      const spinner = screen.getByRole('progressbar')
      expect(spinner).toHaveClass('animate-spin')
    })
  })

  describe('saved status', () => {
    it('should display saved status correctly', () => {
      const lastSaved = new Date('2023-01-01T11:59:30Z') // 30 seconds ago
      
      render(<AutoSaveIndicator status="saved" lastSaved={lastSaved} />)

      expect(screen.getByText('저장됨')).toBeInTheDocument()
      expect(screen.getByText('30초 전')).toBeInTheDocument()
      expect(screen.getByText('저장됨')).toHaveClass('text-green-600')
    })

    it('should show check icon when saved', () => {
      render(<AutoSaveIndicator status="saved" />)

      expect(screen.getByText('저장됨')).toBeInTheDocument()
      // Check icon should be present (as part of the indicator)
      const container = screen.getByText('저장됨').closest('div')
      expect(container).toHaveClass('text-green-600')
    })

    it('should format time correctly for recent saves', () => {
      const testCases = [
        { secondsAgo: 15, expected: '방금 전' },
        { secondsAgo: 45, expected: '45초 전' },
        { secondsAgo: 90, expected: '1분 전' },
        { secondsAgo: 300, expected: '5분 전' },
        { secondsAgo: 3900, expected: '1시간 전' },
      ]

      testCases.forEach(({ secondsAgo, expected }) => {
        const lastSaved = new Date(mockDate.getTime() - secondsAgo * 1000)
        
        render(<AutoSaveIndicator status="saved" lastSaved={lastSaved} />)
        
        expect(screen.getByText(expected)).toBeInTheDocument()
        
        // Clean up for next test
        screen.getByText(expected).closest('div')?.remove()
      })
    })

    it('should format time correctly for older saves', () => {
      const lastSaved = new Date('2023-01-01T08:30:00Z') // 3.5 hours ago
      
      render(<AutoSaveIndicator status="saved" lastSaved={lastSaved} />)
      
      expect(screen.getByText('08:30')).toBeInTheDocument()
    })
  })

  describe('error status', () => {
    it('should display error status correctly', () => {
      render(<AutoSaveIndicator status="error" />)

      expect(screen.getByText('저장 실패')).toBeInTheDocument()
      expect(screen.getByText('저장 실패')).toHaveClass('text-red-600')
    })

    it('should show error icon when error', () => {
      render(<AutoSaveIndicator status="error" />)

      expect(screen.getByText('저장 실패')).toBeInTheDocument()
      const container = screen.getByText('저장 실패').closest('div')
      expect(container).toHaveClass('text-red-600')
    })
  })

  describe('idle status', () => {
    it('should not render when status is idle', () => {
      const { container } = render(<AutoSaveIndicator status="idle" />)

      expect(container.firstChild).toBeNull()
    })
  })

  describe('showText prop', () => {
    it('should hide text when showText is false', () => {
      render(<AutoSaveIndicator status="saved" showText={false} />)

      expect(screen.queryByText('저장됨')).not.toBeInTheDocument()
      // Icon should still be present
      const container = screen.getByRole('generic')
      expect(container).toHaveClass('text-green-600')
    })

    it('should show text when showText is true (default)', () => {
      render(<AutoSaveIndicator status="saved" />)

      expect(screen.getByText('저장됨')).toBeInTheDocument()
    })
  })

  describe('custom className', () => {
    it('should apply custom className', () => {
      render(<AutoSaveIndicator status="saved" className="custom-class" />)

      const container = screen.getByText('저장됨').closest('div')
      expect(container).toHaveClass('custom-class')
    })
  })

  describe('lastSaved without saved status', () => {
    it('should not show lastSaved time when status is not saved', () => {
      const lastSaved = new Date('2023-01-01T11:59:30Z')
      
      render(<AutoSaveIndicator status="saving" lastSaved={lastSaved} />)

      expect(screen.queryByText('30초 전')).not.toBeInTheDocument()
    })
  })
})

describe('CompactAutoSaveIndicator', () => {
  it('should render AutoSaveIndicator with correct props', () => {
    render(<CompactAutoSaveIndicator status="saved" className="custom-compact" />)

    // Should not show text
    expect(screen.queryByText('저장됨')).not.toBeInTheDocument()
    
    // Should have correct styling
    const container = screen.getByRole('generic')
    expect(container).toHaveClass('text-green-600')
    expect(container).toHaveClass('custom-compact')
    expect(container).toHaveClass('p-1.5')
  })

  it('should pass through status prop correctly', () => {
    render(<CompactAutoSaveIndicator status="saving" />)

    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })
})

describe('AutoSaveIndicator time formatting edge cases', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2023-01-01T12:00:00Z'))
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('should handle null lastSaved gracefully', () => {
    render(<AutoSaveIndicator status="saved" lastSaved={null} />)

    expect(screen.getByText('저장됨')).toBeInTheDocument()
    expect(screen.queryByText(/전$/)).not.toBeInTheDocument()
  })

  it('should handle future dates gracefully', () => {
    const futureDate = new Date('2023-01-01T12:01:00Z') // 1 minute in the future
    
    render(<AutoSaveIndicator status="saved" lastSaved={futureDate} />)

    expect(screen.getByText('저장됨')).toBeInTheDocument()
    // Should show "방금 전" for future dates (edge case handling)
    expect(screen.getByText('방금 전')).toBeInTheDocument()
  })
})