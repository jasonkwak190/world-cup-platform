'use client';

import { useState } from 'react';
import HeaderExample from '../header-example';

export default function LogoExamplePage() {
  const [selectedLogo, setSelectedLogo] = useState<'modern' | 'sports' | 'retro' | '3d' | 'minimalist' | 'brush'>('modern');
  const [darkMode, setDarkMode] = useState(false);
  
  return (
    <div className="min-h-screen bg-gray-50">
      <HeaderExample logoType={selectedLogo} darkMode={darkMode} />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">로고 헤더 예제</h1>
          <p className="text-gray-600 text-lg">다양한 로고 스타일을 헤더에 적용한 예제입니다.</p>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">로고 스타일 선택</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            <button
              onClick={() => setSelectedLogo('modern')}
              className={`p-4 rounded-lg border-2 transition-all ${
                selectedLogo === 'modern' 
                  ? 'border-blue-600 bg-blue-50' 
                  : 'border-gray-200 hover:border-blue-300'
              }`}
            >
              <div className="text-center">
                <div className="font-semibold mb-1">모던 미니멀</div>
              </div>
            </button>
            
            <button
              onClick={() => setSelectedLogo('sports')}
              className={`p-4 rounded-lg border-2 transition-all ${
                selectedLogo === 'sports' 
                  ? 'border-purple-600 bg-purple-50' 
                  : 'border-gray-200 hover:border-purple-300'
              }`}
            >
              <div className="text-center">
                <div className="font-semibold mb-1">다이나믹 스포츠</div>
              </div>
            </button>
            
            <button
              onClick={() => setSelectedLogo('retro')}
              className={`p-4 rounded-lg border-2 transition-all ${
                selectedLogo === 'retro' 
                  ? 'border-yellow-500 bg-yellow-50' 
                  : 'border-gray-200 hover:border-yellow-300'
              }`}
            >
              <div className="text-center">
                <div className="font-semibold mb-1">레트로 게임</div>
              </div>
            </button>
            
            <button
              onClick={() => setSelectedLogo('3d')}
              className={`p-4 rounded-lg border-2 transition-all ${
                selectedLogo === '3d' 
                  ? 'border-red-500 bg-red-50' 
                  : 'border-gray-200 hover:border-red-300'
              }`}
            >
              <div className="text-center">
                <div className="font-semibold mb-1">3D 입체</div>
              </div>
            </button>
            
            <button
              onClick={() => setSelectedLogo('minimalist')}
              className={`p-4 rounded-lg border-2 transition-all ${
                selectedLogo === 'minimalist' 
                  ? 'border-black bg-gray-50' 
                  : 'border-gray-200 hover:border-gray-500'
              }`}
            >
              <div className="text-center">
                <div className="font-semibold mb-1">미니멀리스트</div>
              </div>
            </button>
            
            <button
              onClick={() => setSelectedLogo('brush')}
              className={`p-4 rounded-lg border-2 transition-all ${
                selectedLogo === 'brush' 
                  ? 'border-indigo-600 bg-indigo-50' 
                  : 'border-gray-200 hover:border-indigo-300'
              }`}
            >
              <div className="text-center">
                <div className="font-semibold mb-1">브러시 아트</div>
              </div>
            </button>
          </div>
          
          <div className="flex justify-center mb-8">
            <label className="inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={darkMode} 
                onChange={() => setDarkMode(!darkMode)} 
                className="sr-only peer"
              />
              <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              <span className="ms-3 text-sm font-medium text-gray-900">다크 모드</span>
            </label>
          </div>
          
          <div className="text-center">
            <p className="text-gray-600 mb-4">현재 선택된 로고: <span className="font-semibold">{
              selectedLogo === 'modern' ? '모던 미니멀' :
              selectedLogo === 'sports' ? '다이나믹 스포츠' :
              selectedLogo === 'retro' ? '레트로 게임' :
              selectedLogo === '3d' ? '3D 입체 디자인' :
              selectedLogo === 'minimalist' ? '미니멀리스트' :
              '브러시 아트'
            }</span></p>
            <p className="text-gray-600">테마: <span className="font-semibold">{darkMode ? '다크 모드' : '라이트 모드'}</span></p>
          </div>
        </div>
        
        <div className="text-center">
          <a href="/tournament-logo" className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            로고 선택 페이지로 돌아가기
          </a>
        </div>
      </div>
    </div>
  );
}