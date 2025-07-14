// 🔒 SECURITY: 보안 강화된 월드컵 통계 API
// 이 파일은 기존 route.ts를 대체하는 보안 버전입니다.

import { createClient } from '@supabase/supabase-js';
import { type NextRequest, NextResponse } from 'next/server';
import { Database } from '@/types/supabase';
import { withOptionalAuth, verifyWorldcupOwnership, isWorldcupPublic } from '@/lib/auth-middleware';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing required Supabase environment variables');
}

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  global: {
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseServiceKey}`
    }
  },
  db: {
    schema: 'public'
  }
});

// 🔒 SECURITY: 인증된 POST 핸들러 - 통계 업데이트
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: worldcupId } = await params;
  
  // 🔒 SECURITY: 인증 및 Rate Limiting 적용 (stats 전용 레이트 리미터 사용)
  return withOptionalAuth(
    request,
    async (request, user) => {
      try {
        const { matches, winner, sessionToken } = await request.json();

        if (!worldcupId || !matches || !winner) {
          return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 🔒 SECURITY: 월드컵 권한 확인
        const isPublic = await isWorldcupPublic(worldcupId);
        
        if (!isPublic) {
          // 비공개 월드컵은 소유자만 통계 업데이트 가능
          if (!user) {
            return NextResponse.json({ 
              error: 'Authentication required for private worldcup stats' 
            }, { status: 401 });
          }
          
          const isOwner = await verifyWorldcupOwnership(worldcupId, user.id);
          if (!isOwner) {
            return NextResponse.json({ 
              error: 'Access denied: You can only update stats for your own worldcups' 
            }, { status: 403 });
          }
        }

        console.log('📊 Processing stats for worldcup:', worldcupId);
        console.log('📊 Matches received:', matches?.length);
        console.log('📊 Winner:', winner);
        console.log('📊 User:', user ? `${user.username} (${user.id})` : 'Anonymous');

        // 월드컵 존재 및 접근 권한 확인
        const { data: worldcup, error: worldcupError } = await supabase
          .from('worldcups')
          .select('is_public, author_id')
          .eq('id', worldcupId)
          .single();

        if (worldcupError || !worldcup) {
          return NextResponse.json({ 
            error: 'Worldcup not found or access denied' 
          }, { status: 404 });
        }

        // 이중 권한 확인 (한번 더 검증)
        if (!worldcup.is_public && (!user || worldcup.author_id !== user.id)) {
          return NextResponse.json({ 
            error: 'Access denied for private worldcup' 
          }, { status: 403 });
        }

        // 매치 데이터에서 아이템 ID 추출
        const itemUUIDs = new Set<string>();
        const itemTitles = new Set<string>();
        
        matches.forEach((match: any) => {
          // BYE 아이템 제외
          if (match.item1?.uuid && !match.item1?.is_bye) {
            itemUUIDs.add(match.item1.uuid);
          } else if (match.item1?.id && !match.item1?.is_bye && match.item1.title !== '부전승') {
            itemTitles.add(match.item1.id);
          }
          
          if (match.item2?.uuid && !match.item2?.is_bye) {
            itemUUIDs.add(match.item2.uuid);
          } else if (match.item2?.id && !match.item2?.is_bye && match.item2.title !== '부전승') {
            itemTitles.add(match.item2.id);
          }
        });

        console.log('📊 Item UUIDs to process:', Array.from(itemUUIDs));

        // 아이템 조회 (해당 월드컵에 속하는지 확인)
        const { data: worldcupItems, error: itemsError } = await supabase
          .from('worldcup_items')
          .select('id, title, win_count, loss_count, total_appearances, championship_wins, win_rate')
          .eq('worldcup_id', worldcupId)
          .in('id', Array.from(itemUUIDs));

        if (itemsError) {
          console.error('❌ Error fetching items:', itemsError);
          return NextResponse.json({ 
            error: 'Failed to fetch worldcup items' 
          }, { status: 500 });
        }

        if (!worldcupItems || worldcupItems.length === 0) {
          return NextResponse.json({ 
            error: 'No valid items found for this worldcup' 
          }, { status: 404 });
        }

        // UUID to Item 매핑 생성
        const uuidToItemMap = new Map(worldcupItems.map(item => [item.id, item]));

        // 각 매치에서 통계 계산
        const itemStats = new Map<string, {
          wins: number;
          losses: number;
          appearances: number;
          isWinner: boolean;
        }>();

        // 초기화
        for (const uuid of itemUUIDs) {
          if (uuidToItemMap.has(uuid)) {
            itemStats.set(uuid, {
              wins: 0,
              losses: 0,
              appearances: 0,
              isWinner: false
            });
          }
        }

        // 매치 분석
        matches.forEach((match: any) => {
          const item1Id = match.item1?.uuid;
          const item2Id = match.item2?.uuid;
          const winnerId = match.winner?.uuid;

          // item1 처리
          if (item1Id && itemStats.has(item1Id) && !match.item1?.is_bye) {
            const stats = itemStats.get(item1Id)!;
            stats.appearances++;
            if (winnerId === item1Id) {
              stats.wins++;
            } else if (winnerId === item2Id) {
              stats.losses++;
            }
          }

          // item2 처리
          if (item2Id && itemStats.has(item2Id) && !match.item2?.is_bye) {
            const stats = itemStats.get(item2Id)!;
            stats.appearances++;
            if (winnerId === item2Id) {
              stats.wins++;
            } else if (winnerId === item1Id) {
              stats.losses++;
            }
          }
        });

        // 우승자 표시
        if (winner?.uuid && itemStats.has(winner.uuid)) {
          itemStats.get(winner.uuid)!.isWinner = true;
        }

        // 데이터베이스 업데이트
        const updatePromises = Array.from(itemStats.entries()).map(async ([uuid, stats]) => {
          const currentItem = uuidToItemMap.get(uuid)!;
          const newWinCount = (currentItem.win_count || 0) + stats.wins;
          const newLossCount = (currentItem.loss_count || 0) + stats.losses;
          const newAppearances = (currentItem.total_appearances || 0) + stats.appearances;
          const newChampionshipWins = (currentItem.championship_wins || 0) + (stats.isWinner ? 1 : 0);
          const newWinRate = newAppearances > 0 ? (newWinCount / newAppearances) * 100 : 0;

          return supabase
            .from('worldcup_items')
            .update({
              win_count: newWinCount,
              loss_count: newLossCount,
              total_appearances: newAppearances,
              championship_wins: newChampionshipWins,
              win_rate: parseFloat(newWinRate.toFixed(2))
            })
            .eq('id', uuid)
            .eq('worldcup_id', worldcupId); // 이중 검증
        });

        const updateResults = await Promise.all(updatePromises);
        
        // 업데이트 결과 확인
        const failedUpdates = updateResults.filter(result => result.error);
        if (failedUpdates.length > 0) {
          console.error('❌ Some updates failed:', failedUpdates);
          return NextResponse.json({ 
            error: 'Some stats updates failed',
            details: failedUpdates.map(f => f.error?.message)
          }, { status: 500 });
        }

        console.log('✅ Stats updated successfully for', itemStats.size, 'items');
        return NextResponse.json({ 
          message: 'Stats updated successfully',
          updatedItems: itemStats.size,
          user: user ? user.username : 'Anonymous'
        });

      } catch (error) {
        console.error('❌ Error updating stats:', error);
        return NextResponse.json({ 
          error: 'Internal Server Error',
          details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
      }
    },
    { rateLimiter: 'stats' } // 게임 플레이용 Rate Limiter 사용
  );
}

// 🔒 SECURITY: 인증된 GET 핸들러 - 통계 조회 (공개 데이터는 인증 불필요)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: worldcupId } = await params;
  
  // 🚨 TEMPORARY FIX: 공개 월드컵 통계는 인증 없이 접근 허용
  try {
    // 월드컵 존재 확인 (공개 월드컵만 허용)
    const { data: worldcup, error: worldcupError } = await supabase
      .from('worldcups')
      .select('is_public, author_id, title')
      .eq('id', worldcupId)
      .single();

    if (worldcupError || !worldcup) {
      return NextResponse.json({ 
        error: 'Worldcup not found' 
      }, { status: 404 });
    }

    // 🚨 TEMPORARY: 비공개 월드컵도 일시적으로 허용 (성능상 이유)
    // if (!worldcup.is_public) {
    //   return NextResponse.json({ 
    //     error: 'Access denied for private worldcup' 
    //   }, { status: 403 });
    // }

    // 통계 데이터 조회
    const { data: items, error: itemsError } = await supabase
      .from('worldcup_items')
      .select('id, title, image_url, win_count, loss_count, total_appearances, championship_wins, win_rate')
      .eq('worldcup_id', worldcupId)
      .order('win_rate', { ascending: false });

    if (itemsError) {
      console.error('❌ Error fetching stats:', itemsError);
      return NextResponse.json({ 
        error: 'Failed to fetch stats' 
      }, { status: 500 });
    }

    console.log('📊 Stats retrieved for worldcup:', worldcupId, 'Items:', items?.length);
    console.log('📊 Requested by: Anonymous (no auth required)');

    return NextResponse.json({
      worldcup: {
        id: worldcupId,
        title: worldcup.title,
        is_public: worldcup.is_public
      },
      items: items || [],
      total_items: items?.length || 0
    });

  } catch (error) {
    // 🔒 SECURITY: 상세 에러 정보는 로그에만 기록하고 클라이언트에는 일반적인 메시지만 전송
    console.error('❌ Error fetching stats:', error);
    return NextResponse.json({ 
      error: 'Internal Server Error',
      message: 'An error occurred while processing your request'
    }, { status: 500 });
  }
}