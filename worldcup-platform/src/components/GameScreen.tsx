import { useState, useEffect } from 'react';
import { Match, WorldCupItem } from '@/types/game';
import { motion, AnimatePresence } from 'framer-motion';
import { getRoundStyle, getRoundBorderStyle, getRoundCheckmarkStyle } from '@/utils/tournament';
import ParticleEffect from './ParticleEffect';

interface GameScreenProps {
  match: Match;
  roundName: string;
  round: number;
  totalRounds: number;
  onChoice: (winner: WorldCupItem) => void;
}

export default function GameScreen({ match, roundName, round, totalRounds, onChoice }: GameScreenProps) {
  const [selectedItem, setSelectedItem] = useState<WorldCupItem | null>(null);
  const [isChoosing, setIsChoosing] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [animationPhase, setAnimationPhase] = useState<'initial' | 'center' | 'return' | 'showOther'>('initial');
  
  const roundStyle = getRoundStyle(round, totalRounds);
  
  const particleColors = {
    1: ['#fbbf24', '#f59e0b', '#d97706'], // 결승 - 골드
    2: ['#a855f7', '#9333ea', '#7c3aed'], // 준결승 - 퍼플
    3: ['#3b82f6', '#2563eb', '#1d4ed8'], // 8강 - 블루
    4: ['#10b981', '#059669', '#047857'], // 16강 - 그린
    5: ['#6366f1', '#4f46e5', '#4338ca'], // 32강 - 인디고
  }[totalRounds - round + 1] || ['#6366f1', '#4f46e5', '#4338ca'];

  const handleChoice = (item: WorldCupItem) => {
    if (isChoosing) return;
    
    setSelectedItem(item);
    setIsChoosing(true);
    setAnimationPhase('center');
    
    // 1단계: 중앙으로 이동 (0.8초)
    setTimeout(() => {
      setAnimationPhase('return');
      
      // 2단계: 원래 자리로 복귀 (0.8초)
      setTimeout(() => {
        setAnimationPhase('showOther');
        
        // 3단계: 다른 옵션 표시 후 전환 (0.5초)
        setTimeout(() => {
          setIsTransitioning(true);
          setTimeout(() => {
            onChoice(item);
            setSelectedItem(null);
            setIsChoosing(false);
            setIsTransitioning(false);
            setAnimationPhase('initial');
          }, 300);
        }, 500);
      }, 800);
    }, 800);
  };

  return (
    <div className="flex flex-col items-center justify-start min-h-screen p-4 pt-8 pb-2">
      {/* Particle Effect */}
      <ParticleEffect count={roundStyle.particleCount} colors={particleColors} />
      

      {/* VS Section */}
      <div className="flex items-center justify-center w-full max-w-6xl mt-8">
        {/* Item 1 */}
        <motion.div
          initial={{ opacity: 0, x: -100 }}
          animate={{ 
            opacity: selectedItem?.id === match.item1.id ? 1 : (selectedItem && animationPhase !== 'showOther') || isTransitioning ? 0 : 1,
            x: selectedItem?.id === match.item1.id && animationPhase === 'center' ? '50vw' : 0,
            scale: selectedItem?.id === match.item1.id && animationPhase === 'center' ? 1.1 : 1,
            z: selectedItem?.id === match.item1.id && animationPhase === 'center' ? 50 : 0
          }}
          transition={{ 
            duration: 0.8,
            ease: "easeInOut",
            delay: animationPhase === 'initial' ? 0.2 : 0
          }}
          whileHover={!isChoosing ? { scale: 1.05 } : {}}
          whileTap={!isChoosing ? { scale: 0.95 } : {}}
          className={`flex-1 max-w-xl mx-4 cursor-pointer transition-all duration-500 relative focus:outline-none ${isChoosing ? 'pointer-events-none' : ''}`}
          onClick={() => handleChoice(match.item1)}
        >
          <AnimatePresence>
            {selectedItem?.id === match.item1.id && (
              <>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className={`absolute -top-6 -right-6 z-10 ${getRoundCheckmarkStyle(round, totalRounds)} text-white rounded-full w-16 h-16 flex items-center justify-center text-3xl font-bold shadow-lg`}
                >
                  ✓
                </motion.div>
                
              </>
            )}
          </AnimatePresence>
          
          <div className={`bg-white rounded-3xl p-8 shadow-2xl hover:shadow-emerald-500/25 transition-all duration-300 focus:outline-none ${
            selectedItem?.id === match.item1.id ? getRoundBorderStyle(round, totalRounds) : ''
          }`}>
            {/* Item Image Placeholder */}
            <div className="aspect-square bg-gradient-to-br from-emerald-100 to-blue-100 rounded-2xl mb-4 flex items-center justify-center">
              <div className="text-center">
                <div className="text-9xl mb-2">🎭</div>
                <div className="text-gray-600 font-medium text-xl">
                  {match.item1.title}
                </div>
              </div>
            </div>
            
            {/* Item Info */}
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {match.item1.title}
              </h3>
              {match.item1.description && (
                <p className="text-base text-gray-600">
                  {match.item1.description}
                </p>
              )}
            </div>
          </div>
        </motion.div>

        {/* VS Divider */}
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ 
            opacity: (selectedItem && animationPhase !== 'showOther') || isTransitioning ? 0 : 1,
            scale: (selectedItem && animationPhase !== 'showOther') || isTransitioning ? 0 : 1
          }}
          transition={{ 
            duration: animationPhase === 'showOther' ? 0.3 : 0.5,
            ease: "easeInOut",
            delay: animationPhase === 'initial' ? 0.6 : (animationPhase === 'showOther' ? 0.2 : 0)
          }}
          className="flex-shrink-0 mx-4"
        >
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-2xl">
            <span className="text-2xl font-bold text-gray-900">VS</span>
          </div>
        </motion.div>

        {/* Item 2 */}
        <motion.div
          initial={{ opacity: 0, x: 100 }}
          animate={{ 
            opacity: selectedItem?.id === match.item2.id ? 1 : (selectedItem && animationPhase !== 'showOther') || isTransitioning ? 0 : 1,
            x: selectedItem?.id === match.item2.id && animationPhase === 'center' ? '-50vw' : 0,
            scale: selectedItem?.id === match.item2.id && animationPhase === 'center' ? 1.1 : 1,
            z: selectedItem?.id === match.item2.id && animationPhase === 'center' ? 50 : 0
          }}
          transition={{ 
            duration: 0.8,
            ease: "easeInOut",
            delay: animationPhase === 'initial' ? 0.4 : 0
          }}
          whileHover={!isChoosing ? { scale: 1.05 } : {}}
          whileTap={!isChoosing ? { scale: 0.95 } : {}}
          className={`flex-1 max-w-xl mx-4 cursor-pointer transition-all duration-500 relative focus:outline-none ${isChoosing ? 'pointer-events-none' : ''}`}
          onClick={() => handleChoice(match.item2)}
        >
          <AnimatePresence>
            {selectedItem?.id === match.item2.id && (
              <>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className={`absolute -top-6 -right-6 z-10 ${getRoundCheckmarkStyle(round, totalRounds)} text-white rounded-full w-16 h-16 flex items-center justify-center text-3xl font-bold shadow-lg`}
                >
                  ✓
                </motion.div>
                
              </>
            )}
          </AnimatePresence>
          
          <div className={`bg-white rounded-3xl p-8 shadow-2xl hover:shadow-emerald-500/25 transition-all duration-300 focus:outline-none ${
            selectedItem?.id === match.item2.id ? getRoundBorderStyle(round, totalRounds) : ''
          }`}>
            {/* Item Image Placeholder */}
            <div className="aspect-square bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl mb-4 flex items-center justify-center">
              <div className="text-center">
                <div className="text-9xl mb-2">🎨</div>
                <div className="text-gray-600 font-medium text-xl">
                  {match.item2.title}
                </div>
              </div>
            </div>
            
            {/* Item Info */}
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {match.item2.title}
              </h3>
              {match.item2.description && (
                <p className="text-base text-gray-600">
                  {match.item2.description}
                </p>
              )}
            </div>
          </div>
        </motion.div>
      </div>

    </div>
  );
}