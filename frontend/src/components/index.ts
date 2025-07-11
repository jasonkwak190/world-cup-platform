// Organized Component Exports
// This provides a clean API for importing components throughout the app

// UI Components
export * from './ui';

// Form Components  
export * from './forms';

// Game Components
export * from './game';

// WorldCup Components
export * from './worldcup';

// Social Components
export * from './social';

// Layout Components
export * from './layout';

// Shared Components
export * from './shared';

// Backward compatibility exports (temporary during migration)
// Remove these after all imports are updated

// UI Components
export { showToast as Toast } from './Toast';
export { default as AuthModal } from './AuthModal';

// Game Components - Additional direct exports
export { default as GameScreen } from './GameScreen';
export { default as GameProgress } from './GameProgress';
export { default as GameResult } from './GameResult';

// WorldCup Components - Additional direct exports
export { default as WorldCupCard } from './WorldCupCard';
export { default as WorldCupGrid } from './WorldCupGrid';
export { default as WorldCupPreview } from './WorldCupPreview';
export { default as VirtualizedWorldCupGrid } from './VirtualizedWorldCupGrid';
export { default as TournamentCreationCelebration } from './TournamentCreationCelebration';
export { default as TournamentTemplates } from './TournamentTemplates';

// Social Components - Additional direct exports
export { default as CommentSection } from './CommentSection';
export { default as CommentSystem } from './CommentSystem';
export { default as SocialShare } from './SocialShare';
export { default as RecentComments } from './RecentComments';

// Core Components
export { default as ClientProviders } from './ClientProviders';
export { default as ErrorBoundary } from './ErrorBoundary';