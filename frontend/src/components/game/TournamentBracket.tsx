'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Trophy, Medal, Star, Zap } from 'lucide-react';
import { WorldCupItem } from '@/types/game';

interface BracketNode {
  id: string;
  participants: WorldCupItem[];
  winner?: WorldCupItem;
  round: number;
  position: number;
  isActive: boolean;
  isCompleted: boolean;
}

interface TournamentBracketProps {
  items: WorldCupItem[];
  currentRound: number;
  matches: any[];
  winners: WorldCupItem[];
  onMatchClick?: (roundIndex: number, matchIndex: number) => void;
  compact?: boolean;
}

export default function TournamentBracket({
  items,
  currentRound,
  matches = [],
  winners = [],
  onMatchClick,
  compact = false
}: TournamentBracketProps) {
  const [bracketData, setBracketData] = useState<BracketNode[][]>([]);
  const [highlightedPath, setHighlightedPath] = useState<string[]>([]);

  // Calculate tournament structure
  useEffect(() => {
    const totalItems = items.length;
    const rounds = Math.ceil(Math.log2(totalItems));
    const bracketStructure: BracketNode[][] = [];

    // Generate bracket structure
    for (let round = 0; round < rounds; round++) {
      const nodesInRound = Math.pow(2, rounds - round - 1);
      const roundNodes: BracketNode[] = [];

      for (let position = 0; position < nodesInRound; position++) {
        const node: BracketNode = {
          id: `r${round}_p${position}`,
          participants: [],
          round,
          position,
          isActive: round === currentRound,
          isCompleted: round < currentRound,
        };

        // For first round, assign actual participants
        if (round === 0) {
          const startIndex = position * 2;
          node.participants = items.slice(startIndex, startIndex + 2);
        }

        // Set winner if match is completed
        if (round < winners.length && winners[round]) {
          node.winner = winners[round];
        }

        roundNodes.push(node);
      }

      bracketStructure.push(roundNodes);
    }

    setBracketData(bracketStructure);
  }, [items, currentRound, winners]);

  // Get round styling
  const getRoundStyle = (round: number, totalRounds: number) => {
    const styles = {
      0: { color: 'text-gray-600', bg: 'bg-gray-50', icon: Star },
      1: { color: 'text-blue-600', bg: 'bg-blue-50', icon: Zap },
      2: { color: 'text-purple-600', bg: 'bg-purple-50', icon: Medal },
      3: { color: 'text-amber-600', bg: 'bg-amber-50', icon: Trophy },
      4: { color: 'text-emerald-600', bg: 'bg-emerald-50', icon: Crown },
    };
    
    const roundFromEnd = totalRounds - round - 1;
    return styles[Math.min(roundFromEnd, 4)] || styles[0];
  };

  // Handle match click
  const handleMatchClick = (round: number, position: number) => {
    if (onMatchClick) {
      onMatchClick(round, position);
    }
    
    // Highlight path to this match
    const pathIds = [`r${round}_p${position}`];
    setHighlightedPath(pathIds);
  };

  if (compact) {
    return (
      <div className="bg-white rounded-lg p-4 shadow-sm border">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-500" />
          토너먼트 진행상황
        </h3>
        
        <div className="flex justify-between items-center text-xs">
          {bracketData.map((round, roundIndex) => {
            const style = getRoundStyle(roundIndex, bracketData.length);
            const Icon = style.icon;
            const totalMatches = round.length;
            const completedMatches = round.filter(node => node.isCompleted).length;
            
            return (
              <div key={roundIndex} className="text-center">
                <div className={`w-8 h-8 rounded-full ${style.bg} ${style.color} flex items-center justify-center mb-1`}>
                  <Icon className="w-3 h-3" />
                </div>
                <div className="text-xs font-medium">
                  {roundIndex === bracketData.length - 1 ? '결승' : 
                   roundIndex === bracketData.length - 2 ? '준결승' :
                   `${Math.pow(2, bracketData.length - roundIndex)}강`}
                </div>
                <div className="text-xs text-gray-500">
                  {completedMatches}/{totalMatches}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Progress bar */}
        <div className="mt-3 bg-gray-200 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full h-2 transition-all duration-500"
            style={{ 
              width: `${(currentRound / (bracketData.length - 1)) * 100}%`
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border overflow-x-auto">
      <div className="flex items-center gap-3 mb-6">
        <Trophy className="w-6 h-6 text-amber-500" />
        <h2 className="text-xl font-bold">토너먼트 대진표</h2>
        <div className="ml-auto text-sm text-gray-500">
          현재: {currentRound === bracketData.length - 1 ? '결승' : 
                 currentRound === bracketData.length - 2 ? '준결승' :
                 `${Math.pow(2, bracketData.length - currentRound)}강`}
        </div>
      </div>

      <div className="min-w-max">
        <div className="flex gap-8">
          {bracketData.map((round, roundIndex) => {
            const style = getRoundStyle(roundIndex, bracketData.length);
            const Icon = style.icon;
            
            return (
              <div key={roundIndex} className="flex flex-col items-center">
                {/* Round Header */}
                <div className="mb-4 text-center">
                  <div className={`w-12 h-12 rounded-full ${style.bg} ${style.color} flex items-center justify-center mb-2 mx-auto`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold text-sm">
                    {roundIndex === bracketData.length - 1 ? '결승전' : 
                     roundIndex === bracketData.length - 2 ? '준결승' :
                     `${Math.pow(2, bracketData.length - roundIndex)}강전`}
                  </h3>
                </div>

                {/* Matches */}
                <div className="flex flex-col gap-6">
                  {round.map((node, nodeIndex) => (
                    <motion.div
                      key={node.id}
                      className={`
                        relative p-4 rounded-lg border-2 cursor-pointer transition-all duration-200
                        ${node.isActive ? 'border-emerald-500 bg-emerald-50' : 
                          node.isCompleted ? 'border-gray-300 bg-gray-50' : 
                          'border-gray-200 bg-white hover:border-gray-300'}
                        ${highlightedPath.includes(node.id) ? 'ring-2 ring-blue-500' : ''}
                      `}
                      onClick={() => handleMatchClick(roundIndex, nodeIndex)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {/* Match participants */}
                      <div className="space-y-2 min-w-[180px]">
                        {node.participants.map((participant, idx) => (
                          <div 
                            key={participant.id}
                            className={`
                              flex items-center gap-3 p-2 rounded
                              ${node.winner?.id === participant.id ? 
                                'bg-gradient-to-r from-amber-100 to-yellow-100 font-semibold' : 
                                'bg-gray-50'}
                            `}
                          >
                            {participant.image && (
                              <img
                                src={typeof participant.image === 'string' ? participant.image : ''}
                                alt={participant.title}
                                className="w-8 h-8 rounded object-cover"
                              />
                            )}
                            <span className="text-sm truncate">{participant.title}</span>
                            {node.winner?.id === participant.id && (
                              <Crown className="w-4 h-4 text-amber-500 ml-auto" />
                            )}
                          </div>
                        ))}
                        
                        {/* Empty state for future rounds */}
                        {node.participants.length === 0 && (
                          <div className="text-center py-4 text-gray-400 text-sm">
                            대기 중...
                          </div>
                        )}
                      </div>

                      {/* Match status indicator */}
                      <div className="absolute -top-2 -right-2">
                        {node.isCompleted && (
                          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs">✓</span>
                          </div>
                        )}
                        {node.isActive && (
                          <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center animate-pulse">
                            <span className="text-white text-xs">●</span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Connection lines to next round */}
                {roundIndex < bracketData.length - 1 && (
                  <div className="absolute left-full top-1/2 w-8 h-px bg-gray-300 transform -translate-y-1/2 z-0" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Tournament Legend */}
      <div className="mt-6 pt-6 border-t">
        <div className="flex flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-emerald-500 rounded"></div>
            <span>현재 라운드</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-300 rounded"></div>
            <span>완료된 라운드</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-white border-2 border-gray-200 rounded"></div>
            <span>예정된 라운드</span>
          </div>
          <div className="flex items-center gap-2">
            <Crown className="w-3 h-3 text-amber-500" />
            <span>승리자</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Minimal bracket for game progress
export function BracketProgress({ 
  currentRound, 
  totalRounds, 
  roundName 
}: { 
  currentRound: number; 
  totalRounds: number; 
  roundName: string;
}) {
  const progress = ((currentRound + 1) / totalRounds) * 100;
  
  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-gray-700">{roundName}</span>
        <span className="text-xs text-gray-500">{currentRound + 1}/{totalRounds}</span>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-2">
        <motion.div 
          className="bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full h-2"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
      
      <div className="text-xs text-gray-600 mt-1">
        {progress.toFixed(0)}% 완료
      </div>
    </div>
  );
}