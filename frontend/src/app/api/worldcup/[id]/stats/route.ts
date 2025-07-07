
import { createClient } from '@supabase/supabase-js';
import { type NextRequest, NextResponse } from 'next/server';
import { Database } from '@/types/supabase';

// Supabase 클라이언트를 초기화합니다.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: worldcupId } = await params;
  
  try {
    const { matches, winner, sessionToken } = await request.json();

    if (!worldcupId || !matches || !winner) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    console.log('📊 Processing stats for worldcup:', worldcupId);
    console.log('📊 Matches received:', matches?.length);
    console.log('📊 Winner:', winner);

    // Test Supabase connection and permissions
    try {
      const { data: testData, error: testError } = await supabase
        .from('worldcup_items')
        .select('id, title')
        .eq('worldcup_id', worldcupId)
        .limit(1);
      
      if (testError) {
        console.error('❌ Supabase connection test failed:', testError);
      } else {
        console.log('✅ Supabase connection test successful, sample item:', testData?.[0]);
      }
    } catch (testErr) {
      console.error('❌ Supabase connection test error:', testErr);
    }

    // Debug: Log first few matches to see data structure
    console.log('🔍 Debug: First 3 matches data:', matches?.slice(0, 3).map(match => ({
      item1: { id: match.item1?.id, title: match.item1?.title, uuid: match.item1?.uuid },
      item2: { id: match.item2?.id, title: match.item2?.title, uuid: match.item2?.uuid },
      winner: match.winner ? { id: match.winner.id, title: match.winner.title, uuid: match.winner.uuid } : null
    })));

    // Extract item UUIDs from matches (the match data should contain item UUIDs)
    const itemUUIDs = new Set<string>();
    const itemTitles = new Set<string>();
    
    matches.forEach((match: any) => {
      // Skip BYE items
      if (match.item1?.uuid && !match.item1?.is_bye) {
        itemUUIDs.add(match.item1.uuid);
      } else if (match.item1?.id && !match.item1?.is_bye && match.item1.title !== '부전승') {
        itemTitles.add(match.item1.id); // fallback to title
      }
      
      if (match.item2?.uuid && !match.item2?.is_bye) {
        itemUUIDs.add(match.item2.uuid);
      } else if (match.item2?.id && !match.item2?.is_bye && match.item2.title !== '부전승') {
        itemTitles.add(match.item2.id); // fallback to title
      }
    });

    console.log('📊 Item UUIDs to process:', Array.from(itemUUIDs));
    console.log('📊 Item titles to process (fallback):', Array.from(itemTitles));

    // Debug: Let's also check what items actually exist in the database for this worldcup
    const { data: allWorldcupItems, error: debugError } = await supabase
      .from('worldcup_items')
      .select('id, title')
      .eq('worldcup_id', worldcupId);
    
    console.log('📋 All items in database for this worldcup:', allWorldcupItems?.map(item => ({
      uuid: item.id,
      title: item.title
    })) || []);
    
    if (debugError) {
      console.error('❌ Error fetching all items for debug:', debugError);
    }

    // 1. Query worldcup_items by UUID first, then by title as fallback
    let existingItems: any[] = [];
    
    // First try to get items by UUID
    if (itemUUIDs.size > 0) {
      const { data: uuidItems, error: uuidError } = await supabase
        .from('worldcup_items')
        .select('id, title, win_count, loss_count, total_appearances, championship_wins')
        .eq('worldcup_id', worldcupId)
        .in('id', Array.from(itemUUIDs));
      
      if (uuidError) {
        console.error('❌ Error fetching items by UUID:', uuidError);
      } else {
        existingItems = uuidItems || [];
        console.log('📊 Found items by UUID:', existingItems.length);
      }
    }
    
    // Then try to get remaining items by title (for backward compatibility)
    if (itemTitles.size > 0) {
      const { data: titleItems, error: titleError } = await supabase
        .from('worldcup_items')
        .select('id, title, win_count, loss_count, total_appearances, championship_wins')
        .eq('worldcup_id', worldcupId)
        .in('title', Array.from(itemTitles));
      
      if (titleError) {
        console.error('❌ Error fetching items by title:', titleError);
      } else {
        // Merge with existing items, avoiding duplicates
        const existingIds = new Set(existingItems.map(item => item.id));
        const newItems = (titleItems || []).filter(item => !existingIds.has(item.id));
        existingItems = [...existingItems, ...newItems];
        console.log('📊 Found additional items by title:', newItems.length);
      }
    }

    const selectError = existingItems.length === 0 ? new Error('No items found') : null;

    if (selectError) {
      console.error('❌ Error fetching items:', selectError);
      throw selectError;
    }

    if (!existingItems || existingItems.length === 0) {
      console.error('❌ No items found for worldcup:', worldcupId);
      return NextResponse.json({ error: 'No items found for this worldcup' }, { status: 404 });
    }

    console.log('📊 Found items:', existingItems.length);

    // Create mapping from both UUID and title to item data
    const uuidToItemMap = new Map();
    const titleToItemMap = new Map();
    
    existingItems.forEach((item) => {
      const itemData = {
        id: item.id,
        title: item.title,
        win_count: item.win_count || 0, 
        loss_count: item.loss_count || 0,
        total_appearances: item.total_appearances || 0,
        championship_wins: item.championship_wins || 0
      };
      
      // Map by UUID (primary key)
      uuidToItemMap.set(item.id, itemData);
      
      // Map by title (for backward compatibility)
      titleToItemMap.set(item.title, itemData);
    });

    // Helper function to find item by UUID or title
    const findItem = (matchItem: any) => {
      // Skip BYE items
      if (matchItem?.is_bye || matchItem?.title === '부전승') {
        return null;
      }
      
      if (matchItem?.uuid) {
        return uuidToItemMap.get(matchItem.uuid);
      } else if (matchItem?.id) {
        return titleToItemMap.get(matchItem.id);
      }
      return null;
    };

    // 2. Calculate statistics updates
    matches.forEach((match: any) => {
      if (!match.winner) return;

      const winnerItem = findItem(match.winner);
      const loserItem = match.item1?.id === match.winner?.id || match.item1?.uuid === match.winner?.uuid 
        ? findItem(match.item2) 
        : findItem(match.item1);

      if (winnerItem) {
        winnerItem.win_count++;
        winnerItem.total_appearances++;
      }

      if (loserItem) {
        loserItem.loss_count++;
        loserItem.total_appearances++;
      }
    });

    // Handle championship winner (매 API 호출마다 1번만 증가하도록 제한)
    if (winner) {
      console.log(`🏆 Processing championship for winner:`, {
        winnerId: winner.id,
        winnerUuid: winner.uuid,
        winnerTitle: winner.title,
        winnerData: winner
      });
      
      // Try multiple ways to find the champion
      let championItem = null;
      
      // Method 1: By UUID
      if (winner.uuid) {
        championItem = uuidToItemMap.get(winner.uuid);
        console.log(`🔍 Method 1 (UUID): ${winner.uuid} -> ${championItem ? 'FOUND' : 'NOT FOUND'}`);
      }
      
      // Method 2: By title (id field)
      if (!championItem && winner.id) {
        championItem = titleToItemMap.get(winner.id);
        console.log(`🔍 Method 2 (Title): ${winner.id} -> ${championItem ? 'FOUND' : 'NOT FOUND'}`);
      }
      
      // Method 3: By title (title field)
      if (!championItem && winner.title) {
        championItem = titleToItemMap.get(winner.title);
        console.log(`🔍 Method 3 (Title field): ${winner.title} -> ${championItem ? 'FOUND' : 'NOT FOUND'}`);
      }
      
      if (championItem) {
        championItem.championship_wins++;
        console.log(`🏆 Championship win added to ${championItem.title}, total: ${championItem.championship_wins}`);
      } else {
        console.error(`❌ Champion item not found in any map:`, {
          winnerData: winner,
          availableUUIDs: Array.from(uuidToItemMap.keys()),
          availableTitles: Array.from(titleToItemMap.keys()),
          uuidMapSize: uuidToItemMap.size,
          titleMapSize: titleToItemMap.size
        });
      }
    }

    // 3. Update database
    console.log('📊 Preparing updates for items:', Array.from(uuidToItemMap.values()).map(item => ({
      uuid: item.id,
      title: item.title,
      wins: item.win_count,
      losses: item.loss_count,
      championships: item.championship_wins
    })));

    // Test database permissions first
    console.log('🔐 Testing database permissions with service role...');
    try {
      const { data: permissionTest, error: permissionError } = await supabase
        .from('worldcup_items')
        .select('id, title')
        .eq('worldcup_id', worldcupId)
        .limit(1);
      
      if (permissionError) {
        console.error('❌ Permission test failed:', permissionError);
      } else {
        console.log('✅ Permission test passed, found', permissionTest?.length, 'items');
      }
    } catch (permTestErr) {
      console.error('❌ Permission test exception:', permTestErr);
    }

    const updatePromises = Array.from(uuidToItemMap.values()).map(async (item) => {
      const totalGames = item.win_count + item.loss_count;
      const winRate = totalGames > 0 ? (item.win_count / totalGames) * 100 : 0;
      
      // Fix: Ensure win_rate is within numeric(5,2) bounds (max 999.99)
      const clampedWinRate = Math.min(Math.max(0, winRate), 100); // Clamp between 0-100
      const formattedWinRate = Math.round(clampedWinRate * 100) / 100; // Round to 2 decimal places
      
      const updateData = {
        win_count: item.win_count,
        loss_count: item.loss_count,
        win_rate: formattedWinRate,
        total_appearances: item.total_appearances,
        championship_wins: item.championship_wins,
        updated_at: new Date().toISOString()
      };
      
      console.log(`📊 Win rate calculation for ${item.title}:`, {
        wins: item.win_count,
        losses: item.loss_count,
        totalGames,
        rawWinRate: winRate,
        clampedWinRate,
        finalWinRate: formattedWinRate
      });
      
      console.log(`📝 Updating item ${item.title} (${item.id}):`, updateData);
      
      // Force direct update using service role (skip RPC for now)
      console.log(`🔄 Attempting direct update for ${item.title} with service role...`);
      
      const directResult = await supabase
        .from('worldcup_items')
        .update(updateData)
        .eq('id', item.id)
        .eq('worldcup_id', worldcupId) // Extra safety check
        .select();
      
      if (directResult.error) {
        console.error(`❌ Direct update failed for ${item.title}:`, directResult.error);
        console.error(`❌ Error details:`, {
          message: directResult.error.message,
          details: directResult.error.details,
          hint: directResult.error.hint,
          code: directResult.error.code
        });
        
        // Try RPC as fallback
        console.log(`🔄 Trying RPC fallback for ${item.title}...`);
        const rpcResult = await supabase.rpc('update_item_stats', {
          item_uuid: item.id,
          new_win_count: updateData.win_count,
          new_loss_count: updateData.loss_count,
          new_win_rate: updateData.win_rate,
          new_total_appearances: updateData.total_appearances,
          new_championship_wins: updateData.championship_wins
        });
        
        if (rpcResult.error) {
          console.error(`❌ RPC also failed for ${item.title}:`, rpcResult.error);
        } else {
          console.log(`✅ RPC succeeded for ${item.title}:`, rpcResult.data);
        }
        
        return rpcResult;
      } else {
        console.log(`✅ Direct update successful for ${item.title}:`, directResult.data);
        return directResult;
      }
    });

    // Execute updates one by one for better error tracking
    const results = [];
    for (const [index, updatePromise] of updatePromises.entries()) {
      try {
        const result = await updatePromise;
        const item = Array.from(uuidToItemMap.values())[index];
        
        if (result.error) {
          console.error(`❌ Update failed for ${item.title} (${item.id}):`, result.error);
        } else if (result.data && result.data.length > 0) {
          console.log(`✅ Update successful for ${item.title}: affected ${result.data.length} rows`);
        } else {
          console.warn(`⚠️ Update for ${item.title} returned no affected rows:`, result);
        }
        
        results.push(result);
      } catch (error) {
        const item = Array.from(uuidToItemMap.values())[index];
        console.error(`❌ Update exception for ${item.title} (${item.id}):`, error);
        results.push({ error });
      }
    }
    
    // Check for errors
    const errors = results.filter(result => result.error);
    if (errors.length > 0) {
      console.error('❌ Some updates failed:', errors.length, 'out of', results.length);
      // Don't throw error, just log it
    }

    // Log detailed update results
    console.log('📊 Update results summary:');
    results.forEach((result, index) => {
      const item = Array.from(uuidToItemMap.values())[index];
      if (result.error) {
        console.error(`❌ Update failed for ${item?.title}:`, result.error);
      } else {
        console.log(`✅ Update successful for ${item?.title}: ${result.data ? 'data returned' : 'no data'}`);
      }
    });

    console.log('✅ Stats updated successfully for', uuidToItemMap.size, 'items');
    return NextResponse.json({ 
      message: 'Stats updated successfully',
      updatedItems: uuidToItemMap.size
    });
  } catch (error) {
    console.error('❌ Error updating stats:', error);
    return NextResponse.json({ 
      error: 'Internal Server Error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: worldcupId } = await params;
  
  try {
    console.log('📊 Fetching stats for worldcup:', worldcupId);
    
    const { searchParams } = new URL(request.url);
    const isGlobal = searchParams.get('global') === 'true';

    if (isGlobal) {
      // PIKU 스타일 전체 랭킹 (모든 월드컵 통합)
      const { data: globalItems, error: globalError } = await supabase
        .from('worldcup_items')
        .select(`
          title,
          image_url,
          win_count,
          loss_count,
          win_rate,
          total_appearances,
          championship_wins,
          worldcups!inner(participants, is_public)
        `)
        .eq('worldcups.is_public', true);

      if (globalError) throw globalError;

      // 같은 제목끼리 통합
      const aggregated = new Map();
      globalItems?.forEach(item => {
        const key = item.title.toLowerCase();
        if (!aggregated.has(key)) {
          aggregated.set(key, {
            title: item.title,
            image_url: item.image_url,
            total_wins: 0,
            total_losses: 0,
            total_appearances: 0,
            total_championships: 0,
            total_participants: 0
          });
        }
        const agg = aggregated.get(key);
        agg.total_wins += item.win_count || 0;
        agg.total_losses += item.loss_count || 0;
        agg.total_appearances += item.total_appearances || 0;
        agg.total_championships += item.championship_wins || 0;
        agg.total_participants += (item.worldcups as any)?.participants || 0;
      });

      // PIKU 스타일 인기도 계산 및 정렬
      const ranked = Array.from(aggregated.values())
        .map(item => ({
          ...item,
          win_rate: item.total_appearances > 0 ? (item.total_wins / item.total_appearances) * 100 : 0,
          popularity_score: (item.total_participants * 0.3) + (item.total_wins * 2) + (item.total_championships * 100)
        }))
        .sort((a, b) => b.popularity_score - a.popularity_score)
        .map((item, index) => ({
          ...item,
          rank: index + 1,
          id: item.title
        }));

      return NextResponse.json({ 
        items: ranked,
        totalItems: ranked.length,
        isGlobal: true
      });
    }

    // 기존 개별 월드컵 랭킹
    const { data: items, error } = await supabase
      .from('worldcup_items')
      .select(`
        id,
        title,
        image_url,
        win_count,
        loss_count,
        win_rate,
        total_appearances,
        championship_wins
      `)
      .eq('worldcup_id', worldcupId)
      .order('win_rate', { ascending: false });

    if (error) {
      console.error('❌ Error fetching stats:', error);
      throw error;
    }

    if (!items || items.length === 0) {
      console.log('📭 No items found for worldcup:', worldcupId);
      return NextResponse.json({ items: [] });
    }

    console.log(`✅ Found ${items.length} items with stats`);
    
    const rankedItems = items.map((item, index) => ({
      ...item,
      rank: index + 1
    }));

    return NextResponse.json({ 
      items: rankedItems,
      totalItems: items.length
    });
  } catch (error) {
    console.error('❌ Error fetching stats:', error);
    return NextResponse.json({ 
      error: 'Internal Server Error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
