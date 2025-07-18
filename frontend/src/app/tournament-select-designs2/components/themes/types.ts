export interface WorldCupData {
  id: string;
  title: string;
  description: string;
  items: Array<{
    id: string;
    title: string;
    image_url?: string;
  }>;
  creator_name: string;
  created_at: string;
}

export interface TournamentOption {
  id: string;
  name: string;
  choices: number;
  rounds: number;
  duration: string;
  description: string;
}

export interface ThemeWrapperProps {
  worldcupData: WorldCupData;
  tournamentOptions: TournamentOption[];
  selectedTournament: string;
  setSelectedTournament: (tournament: string) => void;
  onStartTournament: () => void;
  isStarting: boolean;
  onGoHome: () => void;
}