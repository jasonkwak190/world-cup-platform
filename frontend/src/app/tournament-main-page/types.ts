export interface TournamentCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface Tournament {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  category: string;
  participants: number;
  rounds: number;
  plays: number;
  createdAt: string;
  creator: {
    name: string;
    avatar: string;
  };
  tags: string[];
  featured?: boolean;
  isNew?: boolean;
  isHot?: boolean;
}

export interface User {
  id: string;
  name: string;
  avatar: string;
  level: number;
  createdTournaments: number;
  playedTournaments: number;
}