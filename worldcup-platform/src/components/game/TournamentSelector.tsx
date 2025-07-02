'use client';

import { motion } from 'framer-motion';
import { Trophy, Users, Clock, Gamepad2 } from 'lucide-react';

interface TournamentOption {
  size: number;
  label: string;
  description: string;
  duration: string;
  popular?: boolean;
}

interface TournamentSelectorProps {
  worldcupTitle: string;
  totalItems: number;
  onSelect: (size: number) => void;
  onCancel: () => void;
}

const generateTournamentOptions = (totalItems: number): TournamentOption[] => {
  const options: TournamentOption[] = [];
  let size = 4;
  
  while (size <= totalItems) {
    const rounds = Math.log2(size);
    const duration = size <= 8 ? `약 ${rounds}분` : `약 ${Math.ceil(rounds * 1.5)}분`;
    
    options.push({
      size,
      label: `${size}강`,
      description: size === 4 ? '빠르고 간단한 토너먼트' :
                   size === 8 ? '적당한 길이의 토너먼트' :
                   size === 16 ? '다양한 선택지를 경험' :
                   size === 32 ? '완전한 토너먼트 경험' :
                   `${size}개 항목 토너먼트`,
      duration,
      popular: size === 8
    });
    
    size *= 2;
  }
  
  return options;
};


export default function TournamentSelector({ 
  worldcupTitle, 
  totalItems, 
  onSelect, 
  onCancel 
}: TournamentSelectorProps) {
  const availableOptions = generateTournamentOptions(totalItems);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="bg-white rounded-3xl p-8 max-w-4xl w-full shadow-2xl"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-center justify-center mb-4"
          >
            <Trophy className="w-8 h-8 text-yellow-500 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">토너먼트 선택</h1>
          </motion.div>
          
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-gray-600 mb-2"
          >
            {worldcupTitle}
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex items-center justify-center text-sm text-gray-500"
          >
            <Users className="w-4 h-4 mr-1" />
            <span>총 {totalItems}개 항목</span>
          </motion.div>
        </div>

        {/* Tournament Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {availableOptions.map((option, index) => (
            <motion.button
              key={option.size}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * (index + 1) }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelect(option.size)}
              className="relative p-6 border-2 border-gray-200 rounded-2xl hover:border-purple-300 hover:shadow-lg transition-all duration-200 text-left group"
            >
              {option.popular && (
                <div className="absolute -top-3 -right-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                  인기
                </div>
              )}
              
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-blue-100 rounded-xl flex items-center justify-center mr-4 group-hover:from-purple-200 group-hover:to-blue-200 transition-colors">
                    <Gamepad2 className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{option.label}</h3>
                  </div>
                </div>
              </div>
              
              <p className="text-gray-600 mb-3">{option.description}</p>
              
              <div className="flex items-center text-sm text-gray-500">
                <Clock className="w-4 h-4 mr-1" />
                <span>{option.duration}</span>
                <span className="mx-2">•</span>
                <span>{Math.log2(option.size)}라운드</span>
              </div>
            </motion.button>
          ))}
        </div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex justify-center space-x-4"
        >
          <button
            onClick={onCancel}
            className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-colors"
          >
            취소
          </button>
        </motion.div>

      </motion.div>
    </div>
  );
}