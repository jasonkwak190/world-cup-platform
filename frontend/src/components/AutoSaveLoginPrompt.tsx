'use client';

import React from 'react';
import { X, Save, User, ArrowRight } from 'lucide-react';

interface AutoSaveLoginPromptProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: () => void;
  feature?: 'save_progress' | 'continue_playing' | 'draft_save';
}

export default function AutoSaveLoginPrompt({
  isOpen,
  onClose,
  onLogin,
  feature = 'save_progress'
}: AutoSaveLoginPromptProps) {
  if (!isOpen) return null;

  const getFeatureContent = () => {
    switch (feature) {
      case 'save_progress':
        return {
          title: '진행 상황을 저장하시겠어요?',
          description: '로그인하면 게임 진행 상황이 자동으로 저장되어, 언제든지 이어서 플레이할 수 있습니다.',
          benefits: [
            '🎮 게임 진행 상황 자동 저장',
            '📱 다른 기기에서도 이어서 플레이',
            '🔄 실수로 페이지를 닫아도 안전',
            '⏰ 7일간 저장된 진행 상황 유지'
          ]
        };
      case 'continue_playing':
        return {
          title: '이어서 플레이하려면 로그인하세요',
          description: '저장된 게임 진행 상황을 불러오려면 로그인이 필요합니다.',
          benefits: [
            '💾 저장된 게임 진행 상황 복원',
            '🎯 중단했던 라운드부터 계속',
            '📊 개인 플레이 기록 관리',
            '🏆 완료한 게임 결과 저장'
          ]
        };
      case 'draft_save':
        return {
          title: '월드컵 제작 내용을 저장하시겠어요?',
          description: '로그인하면 제작 중인 월드컵이 자동으로 저장되어, 나중에 이어서 만들 수 있습니다.',
          benefits: [
            '✏️ 제작 중인 월드컵 자동 저장',
            '📝 텍스트와 이미지 모두 보존',
            '🔒 안전한 개인 작업 공간',
            '⭐ 완성된 월드컵 공개 및 관리'
          ]
        };
    }
  };

  const content = getFeatureContent();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-900">{content.title}</h3>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-6 h-6 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Save className="w-8 h-8 text-white" />
            </div>
            <p className="text-gray-600 text-sm leading-relaxed">
              {content.description}
            </p>
          </div>

          {/* Benefits */}
          <div className="space-y-3 mb-6">
            <h4 className="font-semibold text-gray-900 text-sm">로그인하면 이런 것들이 가능해요:</h4>
            <div className="space-y-2">
              {content.benefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-3 text-sm text-gray-600">
                  <div className="w-1 h-1 bg-blue-500 rounded-full flex-shrink-0"></div>
                  <span>{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={onLogin}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
            >
              <User className="w-5 h-5" />
              <span>로그인하고 저장하기</span>
              <ArrowRight className="w-5 h-5" />
            </button>
            
            <button
              onClick={onClose}
              className="w-full border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 text-gray-700 font-semibold py-3 px-4 rounded-lg transition-all duration-200"
            >
              나중에 하기
            </button>
          </div>

          <p className="text-xs text-gray-500 text-center mt-4">
            로그인 없이도 게임을 즐길 수 있지만, 진행 상황은 저장되지 않습니다
          </p>
        </div>
      </div>
    </div>
  );
}