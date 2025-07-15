'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Eye, 
  Settings,
  FileText,
  Activity,
  Users,
  TrendingUp
} from 'lucide-react';

interface SecurityMetrics {
  totalContent: number;
  safeContent: number;
  flaggedContent: number;
  removedContent: number;
  pendingReview: number;
  riskDistribution: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  complianceRate: number;
}

interface AuditStats {
  total: number;
  byEventType: Record<string, number>;
  byTargetType: Record<string, number>;
  timeline: Array<{ date: string; count: number }>;
}

export default function SecurityDashboard() {
  const [metrics, setMetrics] = useState<SecurityMetrics | null>(null);
  const [auditStats, setAuditStats] = useState<AuditStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month'>('day');

  useEffect(() => {
    fetchSecurityMetrics();
    fetchAuditStats();
  }, [timeRange]);

  const fetchSecurityMetrics = async () => {
    try {
      const response = await fetch('/api/admin/security/metrics');
      if (response.ok) {
        const data = await response.json();
        setMetrics(data);
      }
    } catch (error) {
      console.error('Failed to fetch security metrics:', error);
    }
  };

  const fetchAuditStats = async () => {
    try {
      const response = await fetch(`/api/admin/security/audit-stats?timeRange=${timeRange}`);
      if (response.ok) {
        const data = await response.json();
        setAuditStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch audit stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEmergencyResponse = async (type: string) => {
    try {
      const response = await fetch('/api/admin/security/emergency', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type }),
      });
      
      if (response.ok) {
        alert('긴급 대응이 활성화되었습니다.');
        fetchSecurityMetrics();
      }
    } catch (error) {
      console.error('Emergency response failed:', error);
    }
  };

  const getRiskColor = (risk: keyof SecurityMetrics['riskDistribution']) => {
    switch (risk) {
      case 'low': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      case 'high': return 'bg-orange-500';
      case 'critical': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'safe': return <CheckCircle className=\"h-4 w-4 text-green-500\" />;
      case 'flagged': return <AlertTriangle className=\"h-4 w-4 text-yellow-500\" />;
      case 'removed': return <XCircle className=\"h-4 w-4 text-red-500\" />;
      default: return <Eye className=\"h-4 w-4 text-gray-500\" />;
    }
  };

  if (loading) {
    return (
      <div className=\"flex items-center justify-center min-h-[60vh]\">
        <div className=\"text-center\">
          <div className=\"animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4\"></div>
          <p className=\"text-gray-600\">보안 데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className=\"p-6 max-w-7xl mx-auto\">
      <div className=\"flex items-center justify-between mb-6\">
        <div>
          <h1 className=\"text-3xl font-bold text-gray-900\">보안 대시보드</h1>
          <p className=\"text-gray-600 mt-2\">플랫폼 보안 상태 및 컴플라이언스 모니터링</p>
        </div>
        <div className=\"flex gap-2\">
          <Button
            variant=\"outline\"
            size=\"sm\"
            onClick={() => handleEmergencyResponse('high_risk_content')}
            className=\"text-red-600 hover:text-red-700\"
          >
            <AlertTriangle className=\"h-4 w-4 mr-2\" />
            긴급 대응
          </Button>
          <Button variant=\"outline\" size=\"sm\">
            <Settings className=\"h-4 w-4 mr-2\" />
            설정
          </Button>
        </div>
      </div>

      {/* 전체 보안 상태 */}
      {metrics && (
        <div className=\"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6\">
          <Card>
            <CardHeader className=\"pb-2\">
              <CardTitle className=\"text-sm font-medium text-gray-600\">전체 콘텐츠</CardTitle>
            </CardHeader>
            <CardContent>
              <div className=\"text-2xl font-bold text-gray-900\">{metrics.totalContent.toLocaleString()}</div>
              <div className=\"flex items-center mt-2\">
                <Shield className=\"h-4 w-4 text-blue-500 mr-1\" />
                <span className=\"text-sm text-gray-600\">활성 콘텐츠</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className=\"pb-2\">
              <CardTitle className=\"text-sm font-medium text-gray-600\">안전 콘텐츠</CardTitle>
            </CardHeader>
            <CardContent>
              <div className=\"text-2xl font-bold text-green-600\">{metrics.safeContent.toLocaleString()}</div>
              <div className=\"flex items-center mt-2\">
                <CheckCircle className=\"h-4 w-4 text-green-500 mr-1\" />
                <span className=\"text-sm text-gray-600\">
                  {((metrics.safeContent / metrics.totalContent) * 100).toFixed(1)}%
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className=\"pb-2\">
              <CardTitle className=\"text-sm font-medium text-gray-600\">플래그된 콘텐츠</CardTitle>
            </CardHeader>
            <CardContent>
              <div className=\"text-2xl font-bold text-yellow-600\">{metrics.flaggedContent.toLocaleString()}</div>
              <div className=\"flex items-center mt-2\">
                <AlertTriangle className=\"h-4 w-4 text-yellow-500 mr-1\" />
                <span className=\"text-sm text-gray-600\">검토 필요</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className=\"pb-2\">
              <CardTitle className=\"text-sm font-medium text-gray-600\">컴플라이언스 점수</CardTitle>
            </CardHeader>
            <CardContent>
              <div className=\"text-2xl font-bold text-blue-600\">{metrics.complianceRate.toFixed(1)}%</div>
              <Progress value={metrics.complianceRate} className=\"mt-2\" />
            </CardContent>
          </Card>
        </div>
      )}

      {/* 위험 분포 */}
      {metrics && (
        <Card className=\"mb-6\">
          <CardHeader>
            <CardTitle className=\"flex items-center\">
              <TrendingUp className=\"h-5 w-5 mr-2\" />
              위험도 분포
            </CardTitle>
            <CardDescription>
              콘텐츠 위험도별 분포 현황
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className=\"space-y-4\">
              {Object.entries(metrics.riskDistribution).map(([risk, count]) => (
                <div key={risk} className=\"flex items-center justify-between\">
                  <div className=\"flex items-center\">
                    <div className={`w-3 h-3 rounded-full ${getRiskColor(risk as keyof SecurityMetrics['riskDistribution'])} mr-3`}></div>
                    <span className=\"font-medium capitalize\">{risk}</span>
                  </div>
                  <div className=\"flex items-center space-x-2\">
                    <span className=\"text-sm text-gray-600\">{count.toLocaleString()}</span>
                    <Badge variant=\"secondary\">
                      {((count / metrics.totalContent) * 100).toFixed(1)}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue=\"audit\" className=\"space-y-4\">
        <TabsList>
          <TabsTrigger value=\"audit\">감사 로그</TabsTrigger>
          <TabsTrigger value=\"content\">콘텐츠 관리</TabsTrigger>
          <TabsTrigger value=\"settings\">보안 설정</TabsTrigger>
        </TabsList>

        <TabsContent value=\"audit\" className=\"space-y-4\">
          <Card>
            <CardHeader>
              <CardTitle className=\"flex items-center\">
                <Activity className=\"h-5 w-5 mr-2\" />
                감사 활동 통계
              </CardTitle>
              <CardDescription>
                <div className=\"flex items-center space-x-4\">
                  <span>시간 범위:</span>
                  <select 
                    value={timeRange} 
                    onChange={(e) => setTimeRange(e.target.value as 'day' | 'week' | 'month')}
                    className=\"px-2 py-1 border rounded\"
                  >
                    <option value=\"day\">최근 24시간</option>
                    <option value=\"week\">최근 7일</option>
                    <option value=\"month\">최근 30일</option>
                  </select>
                </div>
              </CardDescription>
            </CardHeader>
            <CardContent>
              {auditStats && (
                <div className=\"grid grid-cols-1 md:grid-cols-2 gap-6\">
                  <div>
                    <h3 className=\"font-semibold mb-3\">이벤트 유형별</h3>
                    <div className=\"space-y-2\">
                      {Object.entries(auditStats.byEventType).map(([type, count]) => (
                        <div key={type} className=\"flex justify-between items-center p-2 bg-gray-50 rounded\">
                          <span className=\"text-sm\">{type}</span>
                          <Badge variant=\"outline\">{count}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className=\"font-semibold mb-3\">대상 유형별</h3>
                    <div className=\"space-y-2\">
                      {Object.entries(auditStats.byTargetType).map(([type, count]) => (
                        <div key={type} className=\"flex justify-between items-center p-2 bg-gray-50 rounded\">
                          <span className=\"text-sm\">{type}</span>
                          <Badge variant=\"outline\">{count}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value=\"content\" className=\"space-y-4\">
          <Card>
            <CardHeader>
              <CardTitle className=\"flex items-center\">
                <FileText className=\"h-5 w-5 mr-2\" />
                콘텐츠 관리
              </CardTitle>
              <CardDescription>
                위험하거나 부적절한 콘텐츠 관리
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className=\"space-y-4\">
                <Alert>
                  <AlertTriangle className=\"h-4 w-4\" />
                  <AlertDescription>
                    현재 {metrics?.pendingReview || 0}개의 콘텐츠가 검토 대기 중입니다.
                  </AlertDescription>
                </Alert>
                
                <div className=\"grid grid-cols-1 md:grid-cols-3 gap-4\">
                  <Button variant=\"outline\" className=\"flex items-center justify-center p-4 h-auto\">
                    <Eye className=\"h-5 w-5 mr-2\" />
                    <div>
                      <div className=\"font-medium\">검토 대기</div>
                      <div className=\"text-sm text-gray-600\">{metrics?.pendingReview || 0}개</div>
                    </div>
                  </Button>
                  
                  <Button variant=\"outline\" className=\"flex items-center justify-center p-4 h-auto\">
                    <AlertTriangle className=\"h-5 w-5 mr-2\" />
                    <div>
                      <div className=\"font-medium\">플래그됨</div>
                      <div className=\"text-sm text-gray-600\">{metrics?.flaggedContent || 0}개</div>
                    </div>
                  </Button>
                  
                  <Button variant=\"outline\" className=\"flex items-center justify-center p-4 h-auto\">
                    <XCircle className=\"h-5 w-5 mr-2\" />
                    <div>
                      <div className=\"font-medium\">제거됨</div>
                      <div className=\"text-sm text-gray-600\">{metrics?.removedContent || 0}개</div>
                    </div>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value=\"settings\" className=\"space-y-4\">
          <Card>
            <CardHeader>
              <CardTitle className=\"flex items-center\">
                <Settings className=\"h-5 w-5 mr-2\" />
                보안 설정
              </CardTitle>
              <CardDescription>
                플랫폼 보안 정책 및 규칙 관리
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className=\"space-y-4\">
                <div className=\"grid grid-cols-1 md:grid-cols-2 gap-4\">
                  <div className=\"p-4 border rounded-lg\">
                    <h3 className=\"font-semibold mb-2\">자동 콘텐츠 스캔</h3>
                    <p className=\"text-sm text-gray-600 mb-3\">업로드된 콘텐츠를 자동으로 검사합니다.</p>
                    <Badge variant=\"outline\" className=\"text-green-600\">활성화</Badge>
                  </div>
                  
                  <div className=\"p-4 border rounded-lg\">
                    <h3 className=\"font-semibold mb-2\">사용자 동의서</h3>
                    <p className=\"text-sm text-gray-600 mb-3\">콘텐츠 업로드 시 법적 동의를 받습니다.</p>
                    <Badge variant=\"outline\" className=\"text-green-600\">활성화</Badge>
                  </div>
                  
                  <div className=\"p-4 border rounded-lg\">
                    <h3 className=\"font-semibold mb-2\">라이선스 검증</h3>
                    <p className=\"text-sm text-gray-600 mb-3\">모든 콘텐츠의 라이선스를 확인합니다.</p>
                    <Badge variant=\"outline\" className=\"text-green-600\">활성화</Badge>
                  </div>
                  
                  <div className=\"p-4 border rounded-lg\">
                    <h3 className=\"font-semibold mb-2\">AI 콘텐츠 감지</h3>
                    <p className=\"text-sm text-gray-600 mb-3\">AI 생성 콘텐츠를 감지하여 표시합니다.</p>
                    <Badge variant=\"outline\" className=\"text-yellow-600\">개발 중</Badge>
                  </div>
                </div>
                
                <div className=\"pt-4 border-t\">
                  <h3 className=\"font-semibold mb-3\">위험 임계값 설정</h3>
                  <div className=\"space-y-2\">
                    <div className=\"flex items-center justify-between\">
                      <span className=\"text-sm\">최대 허용 위험 점수</span>
                      <input 
                        type=\"range\" 
                        min=\"0\" 
                        max=\"100\" 
                        defaultValue=\"70\"
                        className=\"w-32\"
                      />
                      <span className=\"text-sm font-medium\">70</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}