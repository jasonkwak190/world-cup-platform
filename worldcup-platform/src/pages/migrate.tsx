'use client';

import { useState, useEffect } from 'react';
import { migrateAllData, backupLocalStorageData } from '@/utils/dataMigration';
import { ArrowLeft, Download, Upload, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

export default function MigratePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [migrationResults, setMigrationResults] = useState<any>(null);
  const [showLog, setShowLog] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleBackup = () => {
    try {
      backupLocalStorageData();
      alert('✅ 백업이 완료되었습니다!');
    } catch (error) {
      alert('❌ 백업 중 오류가 발생했습니다: ' + error.message);
    }
  };

  const handleMigration = async () => {
    if (!confirm('⚠️ 마이그레이션을 시작하시겠습니까?\n\n이 작업은 되돌릴 수 없으며, 모든 localStorage 데이터를 Supabase로 이전합니다.')) {
      return;
    }

    setIsLoading(true);
    setMigrationResults(null);

    try {
      const results = await migrateAllData();
      setMigrationResults(results);
      setShowLog(true);
    } catch (error) {
      setMigrationResults({
        success: false,
        message: '마이그레이션 중 오류가 발생했습니다.',
        log: [`❌ 오류: ${error.message}`]
      });
    } finally {
      setIsLoading(false);
    }
  };

  const [stats, setStats] = useState({ users: 0, worldcups: 0 });

  useEffect(() => {
    if (!mounted) return;
    
    // 클라이언트에서만 localStorage 읽기
    const getLocalStorageStats = () => {
      try {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const worldcups = JSON.parse(localStorage.getItem('worldcups') || '[]');
        return { users: users.length, worldcups: worldcups.length };
      } catch {
        return { users: 0, worldcups: 0 };
      }
    };

    setStats(getLocalStorageStats());
  }, [mounted]);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold mb-4">데이터 마이그레이션</h1>
          <p className="text-lg">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => window.history.back()}
              className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">데이터 마이그레이션</h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-8">
          
          {/* 안내 메시지 */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                  중요: 마이그레이션 전 주의사항
                </h3>
                <ul className="text-yellow-700 space-y-1 text-sm">
                  <li>• 마이그레이션은 한 번만 실행하세요</li>
                  <li>• 기존 localStorage 데이터는 백업해주세요</li>
                  <li>• 마이그레이션된 사용자의 임시 비밀번호는 "temp123456"입니다</li>
                  <li>• 사용자들에게 비밀번호 변경을 안내해주세요</li>
                  <li>• 이미지 업로드에는 시간이 소요될 수 있습니다</li>
                </ul>
              </div>
            </div>
          </div>

          {/* 현재 데이터 상태 */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">현재 localStorage 데이터</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{stats.users}</div>
                <div className="text-sm text-blue-600">사용자</div>
              </div>
              <div className="text-center p-4 bg-emerald-50 rounded-lg">
                <div className="text-2xl font-bold text-emerald-600">{stats.worldcups}</div>
                <div className="text-sm text-emerald-600">월드컵</div>
              </div>
            </div>
          </div>

          {/* 액션 버튼들 */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">마이그레이션 도구</h2>
            
            <div className="space-y-4">
              {/* 백업 버튼 */}
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900">1. 데이터 백업</h3>
                  <p className="text-sm text-gray-500">마이그레이션 전 기존 데이터를 JSON 파일로 백업합니다</p>
                </div>
                <button
                  onClick={handleBackup}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>백업 다운로드</span>
                </button>
              </div>

              {/* 마이그레이션 버튼 */}
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900">2. Supabase로 마이그레이션</h3>
                  <p className="text-sm text-gray-500">localStorage 데이터를 Supabase 데이터베이스로 이전합니다</p>
                </div>
                <button
                  onClick={handleMigration}
                  disabled={isLoading || stats.users === 0}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    isLoading || stats.users === 0
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  }`}
                >
                  <Upload className="w-4 h-4" />
                  <span>
                    {isLoading ? '마이그레이션 중...' : '마이그레이션 시작'}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* 마이그레이션 결과 */}
          {migrationResults && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center space-x-3 mb-4">
                {migrationResults.success ? (
                  <CheckCircle className="w-6 h-6 text-green-600" />
                ) : (
                  <XCircle className="w-6 h-6 text-red-600" />
                )}
                <h2 className="text-xl font-semibold text-gray-900">마이그레이션 결과</h2>
              </div>

              <div className={`p-4 rounded-lg mb-4 ${
                migrationResults.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
              }`}>
                {migrationResults.message}
              </div>

              {/* 로그 표시 */}
              {showLog && migrationResults.log && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-2">마이그레이션 로그</h3>
                  <div className="space-y-1 text-sm font-mono">
                    {migrationResults.log.map((line: string, index: number) => (
                      <div key={index} className="text-gray-700">
                        {line}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 성공 후 안내 */}
              {migrationResults.success && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-medium text-blue-900 mb-2">다음 단계</h3>
                  <ul className="text-blue-800 text-sm space-y-1">
                    <li>1. 애플리케이션을 재시작하여 Supabase 연결을 확인하세요</li>
                    <li>2. 모든 사용자에게 로그인 정보와 비밀번호 변경을 안내하세요</li>
                    <li>3. 기존 localStorage 데이터는 브라우저에서 정리할 수 있습니다</li>
                    <li>4. 이미지가 제대로 표시되는지 확인하세요</li>
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}