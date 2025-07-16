'use client';

import { useState } from 'react';
import { ModernLogo, SportsLogo, RetroLogo, ThreeDLogo, MinimalistLogo, BrushLogo } from './components';

export default function TournamentLogoPage() {
  const [selectedLogo, setSelectedLogo] = useState<string | null>(null);
  
  const copyLogoCode = (logoType: string) => {
    let codeToImport = '';
    let codeToUse = '';
    
    switch(logoType) {
      case 'modern':
        codeToImport = "import { ModernLogo } from '@/app/tournament-logo/components';";
        codeToUse = '<ModernLogo className="h-10" />';
        break;
      case 'sports':
        codeToImport = "import { SportsLogo } from '@/app/tournament-logo/components';";
        codeToUse = '<SportsLogo className="h-10" />';
        break;
      case 'retro':
        codeToImport = "import { RetroLogo } from '@/app/tournament-logo/components';";
        codeToUse = '<RetroLogo className="h-10" darkMode={true} />';
        break;
      case '3d':
        codeToImport = "import { ThreeDLogo } from '@/app/tournament-logo/components';";
        codeToUse = '<ThreeDLogo className="h-10" />';
        break;
      case 'minimalist':
        codeToImport = "import { MinimalistLogo } from '@/app/tournament-logo/components';";
        codeToUse = '<MinimalistLogo className="h-10" />';
        break;
      case 'brush':
        codeToImport = "import { BrushLogo } from '@/app/tournament-logo/components';";
        codeToUse = '<BrushLogo className="h-10" />';
        break;
    }
    
    const fullCode = `${codeToImport}\n\n// 사용 예시:\n${codeToUse}`;
    navigator.clipboard.writeText(fullCode);
    alert('로고 코드가 클립보드에 복사되었습니다!');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">토너먼트 로고 디자인</h1>
          <p className="text-gray-600 text-lg">웹사이트 왼쪽 상단에 사용할 다양한 로고 디자인</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {/* 로고 1: 모던 미니멀 */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 hover:shadow-xl transition-shadow">
            <div className="p-8 flex items-center justify-center bg-gray-50 h-48">
              <ModernLogo />
            </div>
            <div className="p-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">모던 미니멀</h3>
              <p className="text-gray-600 text-sm mb-4">깔끔하고 현대적인 디자인으로 전문성을 강조합니다.</p>
              <button 
                onClick={() => setSelectedLogo('modern')}
                className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                선택하기
              </button>
            </div>
          </div> 
         {/* 로고 2: 다이나믹 스포츠 */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 hover:shadow-xl transition-shadow">
            <div className="p-8 flex items-center justify-center bg-gradient-to-r from-blue-50 to-purple-50 h-48">
              <SportsLogo />
            </div>
            <div className="p-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">다이나믹 스포츠</h3>
              <p className="text-gray-600 text-sm mb-4">스포티한 느낌의 그라데이션 디자인으로 역동성을 표현합니다.</p>
              <button 
                onClick={() => setSelectedLogo('sports')}
                className="w-full py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-colors"
              >
                선택하기
              </button>
            </div>
          </div>

          {/* 로고 3: 레트로 게임 */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 hover:shadow-xl transition-shadow">
            <div className="p-8 flex items-center justify-center bg-black h-48">
              <RetroLogo />
            </div>
            <div className="p-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">레트로 게임</h3>
              <p className="text-gray-600 text-sm mb-4">80년대 아케이드 게임 감성의 픽셀 아트 스타일 로고입니다.</p>
              <button 
                onClick={() => setSelectedLogo('retro')}
                className="w-full py-2 bg-yellow-400 text-black rounded-lg hover:bg-yellow-500 transition-colors"
              >
                선택하기
              </button>
            </div>
          </div>

          {/* 로고 4: 3D 입체 */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 hover:shadow-xl transition-shadow">
            <div className="p-8 flex items-center justify-center bg-gradient-to-b from-gray-100 to-gray-200 h-48">
              <ThreeDLogo />
            </div>
            <div className="p-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">3D 입체 디자인</h3>
              <p className="text-gray-600 text-sm mb-4">입체감 있는 레이어드 디자인으로 시각적 깊이감을 제공합니다.</p>
              <button 
                onClick={() => setSelectedLogo('3d')}
                className="w-full py-2 bg-gradient-to-r from-red-500 via-blue-600 to-yellow-500 text-white rounded-lg hover:from-red-600 hover:via-blue-700 hover:to-yellow-600 transition-colors"
              >
                선택하기
              </button>
            </div>
          </div>    
      {/* 로고 5: 미니멀리스트 */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 hover:shadow-xl transition-shadow">
            <div className="p-8 flex items-center justify-center bg-white h-48">
              <MinimalistLogo />
            </div>
            <div className="p-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">미니멀리스트</h3>
              <p className="text-gray-600 text-sm mb-4">심플하고 세련된 미니멀 디자인으로 고급스러움을 표현합니다.</p>
              <button 
                onClick={() => setSelectedLogo('minimalist')}
                className="w-full py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                선택하기
              </button>
            </div>
          </div>

          {/* 로고 6: 브러시 아트 */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 hover:shadow-xl transition-shadow">
            <div className="p-8 flex items-center justify-center bg-gray-50 h-48">
              <BrushLogo />
            </div>
            <div className="p-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">브러시 아트</h3>
              <p className="text-gray-600 text-sm mb-4">손으로 그린 듯한 아티스틱한 느낌의 로고 디자인입니다.</p>
              <button 
                onClick={() => setSelectedLogo('brush')}
                className="w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                선택하기
              </button>
            </div>
          </div>
        </div>

        {/* 선택된 로고 코드 표시 */}
        {selectedLogo && (
          <div className="bg-white rounded-xl shadow-lg p-8 mb-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">선택한 로고: {
              selectedLogo === 'modern' ? '모던 미니멀' :
              selectedLogo === 'sports' ? '다이나믹 스포츠' :
              selectedLogo === 'retro' ? '레트로 게임' :
              selectedLogo === '3d' ? '3D 입체 디자인' :
              selectedLogo === 'minimalist' ? '미니멀리스트' :
              '브러시 아트'
            }</h2>
            
            <div className="bg-gray-50 p-6 rounded-lg mb-6 flex justify-center">
              {selectedLogo === 'modern' && <ModernLogo className="scale-150" />}
              {selectedLogo === 'sports' && <SportsLogo className="scale-150" />}
              {selectedLogo === 'retro' && <RetroLogo className="scale-150" />}
              {selectedLogo === '3d' && <ThreeDLogo className="scale-150" />}
              {selectedLogo === 'minimalist' && <MinimalistLogo className="scale-150" />}
              {selectedLogo === 'brush' && <BrushLogo className="scale-150" />}
            </div>
            
            <div className="bg-gray-900 text-gray-100 p-6 rounded-lg mb-6 overflow-auto">
              <pre className="text-sm">
                <code id="logo-code">
                  {selectedLogo === 'modern' && `import { ModernLogo } from '@/app/tournament-logo/components';\n\n// 사용 예시:\n<ModernLogo className="h-10" />`}
                  {selectedLogo === 'sports' && `import { SportsLogo } from '@/app/tournament-logo/components';\n\n// 사용 예시:\n<SportsLogo className="h-10" />`}
                  {selectedLogo === 'retro' && `import { RetroLogo } from '@/app/tournament-logo/components';\n\n// 사용 예시:\n<RetroLogo className="h-10" darkMode={true} />`}
                  {selectedLogo === '3d' && `import { ThreeDLogo } from '@/app/tournament-logo/components';\n\n// 사용 예시:\n<ThreeDLogo className="h-10" />`}
                  {selectedLogo === 'minimalist' && `import { MinimalistLogo } from '@/app/tournament-logo/components';\n\n// 사용 예시:\n<MinimalistLogo className="h-10" />`}
                  {selectedLogo === 'brush' && `import { BrushLogo } from '@/app/tournament-logo/components';\n\n// 사용 예시:\n<BrushLogo className="h-10" />`}
                </code>
              </pre>
            </div>
            
            <div className="flex justify-end">
              <button
                onClick={() => copyLogoCode(selectedLogo)}
                className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                코드 복사하기
              </button>
            </div>
          </div>
        )}
        
        <div className="bg-white rounded-xl shadow-lg p-8 mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">로고 사용 가이드</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">1. 컴포넌트 가져오기</h3>
              <p className="text-gray-600">원하는 로고 컴포넌트를 가져와서 사용하세요.</p>
              <div className="bg-gray-100 p-4 rounded-lg mt-2">
                <code className="text-sm text-gray-800">import {'{'} ModernLogo {'}'} from '@/app/tournament-logo/components';</code>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">2. 레이아웃에 로고 배치</h3>
              <p className="text-gray-600">웹사이트 왼쪽 상단이나 원하는 위치에 로고를 배치하세요.</p>
              <div className="bg-gray-100 p-4 rounded-lg mt-2">
                <code className="text-sm text-gray-800">{'<div className="p-4">'}<br />{'  <ModernLogo className="h-10" />'}<br />{'</div>'}</code>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">3. 크기 조절</h3>
              <p className="text-gray-600">className 속성을 통해 로고의 크기를 조절할 수 있습니다.</p>
              <div className="bg-gray-100 p-4 rounded-lg mt-2">
                <code className="text-sm text-gray-800">{'<ModernLogo className="h-8" /> // 작은 크기'}<br />{'<ModernLogo className="h-12" /> // 큰 크기'}</code>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}