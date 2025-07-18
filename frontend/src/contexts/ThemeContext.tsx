'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// 토너먼트 게임 테마 타입 정의
export type ThemeType = 'neon' | 'paper' | 'comic' | 'minimal' | 'gaming';

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
    border: string;
  };
  components: {
    cardStyle: string;
    buttonStyle: string;
    headerStyle: string;
    containerStyle: string;
  };
  effects: {
    shadow: string;
    transition: string;
    animation: string;
  };
}

// 토너먼트 게임 테마 설정들
const themes: Record<ThemeType, ThemeConfig> = {
  neon: {
    id: 'neon',
    name: '네온 사이버',
    description: '미래적인 네온 디자인',
    colors: {
      primary: 'bg-gradient-to-r from-cyan-400 to-pink-400',
      secondary: 'bg-cyan-400/10',
      accent: 'bg-yellow-400',
      background: 'bg-black',
      surface: 'bg-gray-800/30',
      text: 'text-white',
      textSecondary: 'text-cyan-300',
      border: 'border-cyan-400',
    },
    components: {
      cardStyle: 'rounded-2xl border-2 border-cyan-400/30 bg-cyan-400/5 hover:border-cyan-400 hover:bg-cyan-400/10 backdrop-blur-sm',
      buttonStyle: 'rounded-full font-mono font-semibold transition-all duration-300 transform hover:scale-105',
      headerStyle: 'bg-gray-800/30 backdrop-blur-sm border-b border-gray-700',
      containerStyle: 'bg-gradient-to-br from-purple-900/30 via-pink-900/30 to-blue-900/30 rounded-3xl relative overflow-hidden',
    },
    effects: {
      shadow: 'shadow-lg shadow-cyan-400/25',
      transition: 'transition-all duration-500',
      animation: 'animate-pulse',
    },
  },
  paper: {
    id: 'paper',
    name: '종이 찢기',
    description: '아날로그 감성의 종이 디자인',
    colors: {
      primary: 'bg-amber-600',
      secondary: 'bg-amber-100',
      accent: 'bg-orange-500',
      background: 'bg-amber-50',
      surface: 'bg-white',
      text: 'text-amber-900',
      textSecondary: 'text-amber-700',
      border: 'border-amber-600',
    },
    components: {
      cardStyle: 'rounded-lg border-2 border-dashed border-amber-600 bg-white shadow-md hover:shadow-lg transform hover:-rotate-1',
      buttonStyle: 'rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 hover:rotate-1',
      headerStyle: 'bg-amber-50 border-b-2 border-dashed border-amber-300',
      containerStyle: 'bg-amber-50 rounded-3xl relative overflow-hidden border-2 border-dashed border-amber-200',
    },
    effects: {
      shadow: 'shadow-lg shadow-amber-200',
      transition: 'transition-all duration-300',
      animation: 'animate-bounce',
    },
  },
  comic: {
    id: 'comic',
    name: '만화책',
    description: '팝아트 감성의 만화책 디자인',
    colors: {
      primary: 'bg-yellow-400',
      secondary: 'bg-blue-100',
      accent: 'bg-red-500',
      background: 'bg-gradient-to-b from-blue-100 to-purple-100',
      surface: 'bg-white',
      text: 'text-black',
      textSecondary: 'text-purple-800',
      border: 'border-black',
    },
    components: {
      cardStyle: 'rounded-lg border-4 border-black bg-white shadow-[8px_8px_0px_0px_#000] hover:shadow-[12px_12px_0px_0px_#000] transform hover:-translate-x-1 hover:-translate-y-1',
      buttonStyle: 'rounded-lg border-4 border-black font-black text-lg transition-all duration-200 transform hover:scale-105',
      headerStyle: 'bg-yellow-400 border-b-4 border-black',
      containerStyle: 'bg-gradient-to-b from-blue-100 to-purple-100 rounded-3xl relative overflow-hidden border-4 border-black',
    },
    effects: {
      shadow: 'shadow-[8px_8px_0px_0px_#000]',
      transition: 'transition-all duration-200',
      animation: 'animate-bounce',
    },
  },
  minimal: {
    id: 'minimal',
    name: '미니멀 엘레강스',
    description: '세련되고 심플한 미니멀 디자인',
    colors: {
      primary: 'bg-gray-900',
      secondary: 'bg-gray-50',
      accent: 'bg-gray-700',
      background: 'bg-white',
      surface: 'bg-gray-50',
      text: 'text-gray-900',
      textSecondary: 'text-gray-500',
      border: 'border-gray-200',
    },
    components: {
      cardStyle: 'rounded-lg border border-gray-200 bg-white shadow-xl hover:shadow-2xl hover:border-gray-300',
      buttonStyle: 'rounded-lg font-light transition-all duration-300 hover:bg-gray-100',
      headerStyle: 'bg-white border-b border-gray-200',
      containerStyle: 'bg-white rounded-3xl relative overflow-hidden border border-gray-100',
    },
    effects: {
      shadow: 'shadow-xl',
      transition: 'transition-all duration-300',
      animation: '',
    },
  },
  gaming: {
    id: 'gaming',
    name: '게이밍 RGB',
    description: '화려한 게이밍 RGB 디자인',
    colors: {
      primary: 'bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500',
      secondary: 'bg-gray-800/50',
      accent: 'bg-purple-500',
      background: 'bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900',
      surface: 'bg-gray-800/50',
      text: 'text-white',
      textSecondary: 'text-gray-300',
      border: 'border-purple-500',
    },
    components: {
      cardStyle: 'rounded-xl border-2 border-purple-500 bg-gray-800/50 backdrop-blur-sm hover:border-blue-500 animate-pulse',
      buttonStyle: 'rounded-xl font-bold transition-all duration-300 transform hover:scale-105 bg-gradient-to-r from-red-500 to-purple-500',
      headerStyle: 'bg-gray-800/50 backdrop-blur-sm border-b border-purple-500',
      containerStyle: 'bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 rounded-3xl relative overflow-hidden',
    },
    effects: {
      shadow: 'shadow-lg shadow-purple-500/25',
      transition: 'transition-all duration-300',
      animation: 'animate-pulse',
    },
  },
};

interface ThemeContextType {
  currentTheme: ThemeType;
  themeConfig: ThemeConfig;
  themes: Record<ThemeType, ThemeConfig>;
  themeOptions: ThemeConfig[];
  setTheme: (theme: ThemeType) => void;
  getThemeClass: (element: string) => string;
  getThemeOption: (theme: ThemeType) => ThemeConfig;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [currentTheme, setCurrentTheme] = useState<ThemeType>('minimal');

  // 로컬 스토리지에서 테마 불러오기
  useEffect(() => {
    const savedTheme = localStorage.getItem('tournament-theme') as ThemeType;
    if (savedTheme && themes[savedTheme]) {
      setCurrentTheme(savedTheme);
    }
  }, []);

  // 테마 변경 시 로컬 스토리지에 저장
  const setTheme = (theme: ThemeType) => {
    setCurrentTheme(theme);
    localStorage.setItem('tournament-theme', theme);
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
      case 'border':
        return config.colors.border;
      case 'card':
        return config.components.cardStyle;
      case 'button':
        return config.components.buttonStyle;
      case 'header':
        return config.components.headerStyle;
      case 'container':
        return config.components.containerStyle;
      case 'shadow':
        return config.effects.shadow;
      case 'transition':
        return config.effects.transition;
      case 'animation':
        return config.effects.animation;
      default:
        return '';
    }
  };

  // 특정 테마 옵션 가져오기
  const getThemeOption = (theme: ThemeType): ThemeConfig => {
    return themes[theme] || themes['minimal'];
  };

  const themeConfig = themes[currentTheme];
  const themeOptions = Object.values(themes);

  return (
    <ThemeContext.Provider
      value={{
        currentTheme,
        themeConfig,
        themes,
        themeOptions,
        setTheme,
        getThemeClass,
        getThemeOption,
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