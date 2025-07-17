'use client';

import { useState } from 'react';
import { Palette, Check } from 'lucide-react';
import { useTheme, ThemeType } from '@/contexts/ThemeContext';

export default function ThemeSelector() {
  const { currentTheme, themes, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
      >
        <Palette className="w-4 h-4" />
        <span>테마</span>
      </button>

      {isOpen && (
        <>
          {/* 오버레이 */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* 드롭다운 메뉴 */}
          <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
            <div className="p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">테마 선택</h3>
              <div className="space-y-2">
                {Object.values(themes).map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => {
                      setTheme(theme.id);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-lg border-2 transition-colors ${
                      currentTheme === theme.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex-1 text-left">
                      <div className="font-medium text-gray-900">{theme.name}</div>
                      <div className="text-xs text-gray-500 mt-1">{theme.description}</div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {/* 테마 색상 미리보기 */}
                      <div className="flex space-x-1">
                        <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600"></div>
                        <div className={`w-3 h-3 rounded-full ${theme.colors.accent}`}></div>
                      </div>
                      {currentTheme === theme.id && (
                        <Check className="w-4 h-4 text-blue-500" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}