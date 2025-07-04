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
export { default as Toast } from './Toast';
export { default as AuthModal } from './AuthModal';
export { default as DeleteConfirmModal } from './DeleteConfirmModal';
export { default as LoginPromptModal } from './LoginPromptModal';
export { default as ParticleEffect } from './ParticleEffect';

// Form Components
export { default as DragDropUpload } from './DragDropUpload';
export { default as BulkImageUpload } from './BulkImageUpload';
export { default as ImageCropper } from './ImageCropper';
export { default as ImageUploadGuide } from './ImageUploadGuide';
export { default as ProfileImageUpload } from './ProfileImageUpload';

// Game Components
export { default as GameScreen } from './GameScreen';
export { default as GameProgress } from './GameProgress';
export { default as GameResult } from './GameResult';
export { default as TournamentBracket } from './TournamentBracket';
export { default as TournamentControls } from './TournamentControls';
export { default as TournamentSettings } from './TournamentSettings';
export { default as TournamentSelector } from './TournamentSelector';

// WorldCup Components
export { default as WorldCupCard } from './WorldCupCard';
export { default as WorldCupGrid } from './WorldCupGrid';
export { default as WorldCupPreview } from './WorldCupPreview';
export { default as VirtualizedWorldCupGrid } from './VirtualizedWorldCupGrid';
export { default as TournamentCreationCelebration } from './TournamentCreationCelebration';
export { default as TournamentTemplates } from './TournamentTemplates';

// Social Components
export { default as CommentSection } from './CommentSection';
export { default as CommentSystem } from './CommentSystem';
export { default as SocialShare } from './SocialShare';
export { default as RecentComments } from './RecentComments';

// Layout Components
export { default as Header } from './Header';
export { default as CategoryFilter } from './CategoryFilter';
export { default as Pagination } from './Pagination';

// Shared Components
export { default as ProtectedRoute } from './ProtectedRoute';
export { default as StorageMonitor } from './StorageMonitor';
export { default as TrendingRanking } from './TrendingRanking';
export { default as TournamentRanking } from './TournamentRanking';