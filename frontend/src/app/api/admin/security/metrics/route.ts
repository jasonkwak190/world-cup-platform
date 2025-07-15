// 보안 메트릭 API
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();

    // 전체 콘텐츠 수 조회
    const { data: totalContentData, error: totalError } = await supabase
      .from('worldcup_items')
      .select('id', { count: 'exact' });

    if (totalError) {
      console.error('Failed to fetch total content:', totalError);
      return NextResponse.json({ error: 'Failed to fetch total content' }, { status: 500 });
    }

    const totalContent = totalContentData?.length || 0;

    // 콘텐츠 안전성 통계 조회
    const { data: safetyData, error: safetyError } = await supabase
      .from('content_safety')
      .select('safety_status, copyright_status, risk_score');

    if (safetyError) {
      console.error('Failed to fetch safety data:', safetyError);
      return NextResponse.json({ error: 'Failed to fetch safety data' }, { status: 500 });
    }

    // 상태별 카운트 계산
    let safeContent = 0;
    let flaggedContent = 0;
    let removedContent = 0;
    let pendingReview = 0;

    const riskDistribution = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0
    };

    safetyData?.forEach(item => {
      // 안전 상태별 카운트
      switch (item.safety_status) {
        case 'safe':
          safeContent++;
          break;
        case 'flagged':
          flaggedContent++;
          break;
        case 'removed':
          removedContent++;
          break;
        case 'pending':
          pendingReview++;
          break;
      }

      // 위험도별 카운트
      const riskScore = item.risk_score || 50;
      if (riskScore <= 25) {
        riskDistribution.low++;
      } else if (riskScore <= 50) {
        riskDistribution.medium++;
      } else if (riskScore <= 75) {
        riskDistribution.high++;
      } else {
        riskDistribution.critical++;
      }
    });

    // 컴플라이언스 비율 계산
    const complianceRate = totalContent > 0 ? (safeContent / totalContent) * 100 : 0;

    // 응답 데이터 구성
    const metrics = {
      totalContent,
      safeContent,
      flaggedContent,
      removedContent,
      pendingReview,
      riskDistribution,
      complianceRate
    };

    return NextResponse.json(metrics);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const body = await request.json();
    const { action, contentIds } = body;

    switch (action) {
      case 'bulk_approve':
        // 대량 승인
        const { error: approveError } = await supabase
          .from('content_safety')
          .update({ 
            safety_status: 'safe',
            copyright_status: 'verified',
            risk_score: 10
          })
          .in('content_id', contentIds);

        if (approveError) {
          return NextResponse.json({ error: 'Failed to approve content' }, { status: 500 });
        }
        break;

      case 'bulk_remove':
        // 대량 제거
        const { error: removeError } = await supabase
          .from('content_safety')
          .update({ 
            safety_status: 'removed',
            risk_score: 100
          })
          .in('content_id', contentIds);

        if (removeError) {
          return NextResponse.json({ error: 'Failed to remove content' }, { status: 500 });
        }
        break;

      case 'recalculate_risk':
        // 위험도 재계산
        for (const contentId of contentIds) {
          // 간단한 위험도 계산 로직 (실제로는 더 복잡한 알고리즘 사용)
          const { data: contentData, error: contentError } = await supabase
            .from('worldcup_items')
            .select('title, description, source_url')
            .eq('id', contentId)
            .single();

          if (contentError) continue;

          let riskScore = 0;
          
          // 제목/설명에서 위험 키워드 체크
          const riskKeywords = ['저작권', 'copyright', '무단', '불법', '해적'];
          const text = `${contentData.title || ''} ${contentData.description || ''}`.toLowerCase();
          
          riskKeywords.forEach(keyword => {
            if (text.includes(keyword.toLowerCase())) {
              riskScore += 20;
            }
          });

          // 소스 URL 체크
          if (contentData.source_url) {
            const riskyDomains = ['pinterest.com', 'tumblr.com', 'instagram.com'];
            if (riskyDomains.some(domain => contentData.source_url.includes(domain))) {
              riskScore += 30;
            }
          } else {
            riskScore += 15; // 소스가 없으면 위험도 증가
          }

          // 위험도 업데이트
          await supabase
            .from('content_safety')
            .upsert({
              content_id: contentId,
              risk_score: Math.min(riskScore, 100),
              safety_status: riskScore > 70 ? 'flagged' : 'safe'
            });
        }
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}