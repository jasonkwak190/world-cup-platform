import { Flame, Zap, Skull, Crown, Sparkles, Rocket, Swords, Trophy, Target, Home, Volume2, VolumeX, RotateCcw, Undo2, ChevronDown, Star, Heart } from 'lucide-react';
import { ReactNode } from 'react';

export interface TournamentOption {
  id: string;
  name: string;
  choices: number;
  rounds: number;
  duration: string;
  vibe: string;
  intensity: number;
  description: string;
  accentColor: string;
  icon: ReactNode;
}

export const tournamentOptions: TournamentOption[] = [
  { 
    id: '4', 
    name: '4강', 
    choices: 4, 
    rounds: 2, 
    duration: '2분', 
    vibe: '빠른 결정',
    intensity: 1,
    description: '간단명료',
    accentColor: '#10b981',
    icon: <Zap className="w-6 h-6" />
  },
  { 
    id: '8', 
    name: '8강', 
    choices: 8, 
    rounds: 3, 
    duration: '3분', 
    vibe: '적당한 고민',
    intensity: 2,
    description: '밸런스',
    accentColor: '#3b82f6',
    icon: <Target className="w-6 h-6" />
  },
  { 
    id: '16', 
    name: '16강', 
    choices: 16, 
    rounds: 4, 
    duration: '5분', 
    vibe: '진지한 선택',
    intensity: 3,
    description: '클래식',
    accentColor: '#8b5cf6',
    icon: <Trophy className="w-6 h-6" />
  },
  { 
    id: '32', 
    name: '32강', 
    choices: 32, 
    rounds: 5, 
    duration: '8분', 
    vibe: '치열한 경쟁',
    intensity: 4,
    description: '본격파',
    accentColor: '#f59e0b',
    icon: <Flame className="w-6 h-6" />
  },
  { 
    id: '64', 
    name: '64강', 
    choices: 64, 
    rounds: 6, 
    duration: '12분', 
    vibe: '극한의 선택',
    intensity: 5,
    description: '하드코어',
    accentColor: '#ef4444',
    icon: <Swords className="w-6 h-6" />
  }
];