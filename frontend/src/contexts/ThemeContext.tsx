'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// 테마 타입 정의
export type ThemeType = 'modern' | 'classic' | 'minimal';

interface ThemeConfig {
  id: ThemeType;
  name: string;
  description: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
  };
  components: {
    cardStyle: string;
    buttonStyle: string;
    headerStyle: string;
  };
}

// 테마 설정들
const themes: Record<ThemeType, ThemeConfig> = {
  modern: {
    id: 'modern',
    name: '모던',
    description: '깔끔하고 현대적인 디자인',
    colors: {
      primary: 'from-blue-600 to-indigo-700',
      secondary: 'bg-gray-100',
      accent: 'bg-blue-500',
      background: 'bg-gray-50',
      surface: 'bg-white',
      text: 'text-gray-900',
      textSecondary: 'text-gray-600',
    },
    components: {
      cardStyle: 'rounded-xl shadow-md hover:shadow-lg transition-shadow',
      buttonStyle: 'rounded-lg font-medium transition-colors',
      headerStyle: 'bg-white shadow-sm',
    },
  },
  classic: {
    id: 'classic',
    name: '클래식',
    description: '전통적이고 친숙한 디자인',
    colors: {
      primary: 'from-purple-600 to-purple-700',
      secondary: 'bg-purple-100',
      accent: 'bg-purple-500',
      background: 'bg-purple-50',
      surface: 'bg-white',
      text: 'text-gray-900',
      textSecondary: 'text-gray-600',
    },
    components: {
      cardStyle: 'rounded-lg shadow border hover:shadow-md transition-shadow',
      buttonStyle: 'rounded font-medium transition-colors',
      headerStyle: 'bg-white border-b',
    },
  },
  minimal: {
    id: 'minimal',
    name: '미니멀',
    description: '단순하고 깔끔한 디자인',
    colors: {
      primary: 'from-gray-800 to-gray-900',
      secondary: 'bg-gray-50',
      accent: 'bg-gray-700',
      background: 'bg-white',
      surface: 'bg-gray-50',
      text: 'text-gray-900',
      textSecondary: 'text-gray-500',
    },
    components: {
      cardStyle: 'rounded border border-gray-200 hover:border-gray-300 transition-colors',
      buttonStyle: 'rounded-none font-normal transition-colors',
      headerStyle: 'bg-white border-b border-gray-200',
    },
  },
};

interface ThemeContextType {
  currentTheme: ThemeType;
  themeConfig: ThemeConfig;
  themes: Record<ThemeType, ThemeConfig>;
  setTheme: (theme: ThemeType) => void;
  getThemeClass: (element: string) => string;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [currentTheme, setCurrentTheme] = useState<ThemeType>('modern');

  // 로컬 스토리지에서 테마 불러오기
  useEffect(() => {
    const savedTheme = localStorage.getItem('worldcup-theme') as ThemeType;
    if (savedTheme && themes[savedTheme]) {
      setCurrentTheme(savedTheme);
    }
  }, []);

  // 테마 변경 시 로컬 스토리지에 저장
  const setTheme = (theme: ThemeType) => {
    setCurrentTheme(theme);
    localStorage.setItem('worldcup-theme', theme);
  };

  // 테마별 CSS 클래스 가져오기
  const getThemeClass = (element: string): string => {
    const config = themes[currentTheme];
    switch (element) {
      case 'background':
        return config.colors.background;
      case 'surface':
        return config.colors.surface;
      case 'text':
        return config.colors.text;
      case 'textSecondary':
        return config.colors.textSecondary;
      case 'primary':
        return config.colors.primary;
      case 'secondary':
        return config.colors.secondary;
      case 'accent':
        return config.colors.accent;
      case 'card':
        return config.components.cardStyle;
      case 'button':
        return config.components.buttonStyle;
      case 'header':
        return config.components.headerStyle;
      default:
        return '';
    }
  };

  const themeConfig = themes[currentTheme];

  return (
    <ThemeContext.Provider
      value={{
        currentTheme,
        themeConfig,
        themes,
        setTheme,
        getThemeClass,
      }}
    >
      <div className={getThemeClass('background')}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}