
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
      'Content-Type': 'application/json'
    }
  }
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const worldcupId = params.id;
  
  try {
    const { matches, winner } = await request.json();

    if (!worldcupId || !matches || !winner) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    console.log('📊 Processing stats for worldcup:', worldcupId);
    console.log('📊 Matches received:', matches?.length);
    console.log('📊 Winner:', winner);

    // Extract item titles from matches (the match data uses title as id)
    const itemTitles = new Set<string>();
    matches.forEach((match: any) => {
      if (match.item1?.id) itemTitles.add(match.item1.id);
      if (match.item2?.id) itemTitles.add(match.item2.id);
    });

    console.log('📊 Item titles to process:', Array.from(itemTitles));

    // 1. Query worldcup_items by worldcup_id and title to get actual UUIDs
    const { data: existingItems, error: selectError } = await supabase
      .from('worldcup_items')
      .select('id, title, win_count, loss_count, total_appearances, championship_wins')
      .eq('worldcup_id', worldcupId)
      .in('title', Array.from(itemTitles));

    if (selectError) {
      console.error('❌ Error fetching items:', selectError);
      throw selectError;
    }

    if (!existingItems || existingItems.length === 0) {
      console.error('❌ No items found for worldcup:', worldcupId);
      return NextResponse.json({ error: 'No items found for this worldcup' }, { status: 404 });
    }

    console.log('📊 Found items:', existingItems.length);

    // Create mapping from title to item data
    const titleToItemMap = new Map(
      existingItems.map((item) => [
        item.title,
        { 
          id: item.id,
          title: item.title,
          win_count: item.win_count || 0, 
          loss_count: item.loss_count || 0,
          total_appearances: item.total_appearances || 0,
          championship_wins: item.championship_wins || 0
        },
      ])
    );

    // 2. Calculate statistics updates
    matches.forEach((match: any) => {
      if (!match.winner) return;

      const winnerTitle = match.winner.id;
      const loserTitle = match.item1.id === winnerTitle ? match.item2.id : match.item1.id;

      const winnerItem = titleToItemMap.get(winnerTitle);
      const loserItem = titleToItemMap.get(loserTitle);

      if (winnerItem) {
        winnerItem.win_count++;
        winnerItem.total_appearances++;
      }

      if (loserItem) {
        loserItem.loss_count++;
        loserItem.total_appearances++;
      }
    });

    // Handle championship winner
    if (winner?.id) {
      const championItem = titleToItemMap.get(winner.id);
      if (championItem) {
        championItem.championship_wins++;
      }
    }

    // 3. Update database
    const updates = Array.from(titleToItemMap.values()).map((item) => {
      const totalGames = item.win_count + item.loss_count;
      const winRate = totalGames > 0 ? (item.win_count / totalGames) * 100 : 0;
      
      return supabase
        .from('worldcup_items')
        .update({
          win_count: item.win_count,
          loss_count: item.loss_count,
          win_rate: Math.round(winRate * 100) / 100,
          total_appearances: item.total_appearances,
          championship_wins: item.championship_wins,
          updated_at: new Date().toISOString()
        })
        .eq('id', item.id);
    });

    const results = await Promise.all(updates);
    
    // Check for errors
    const errors = results.filter(result => result.error);
    if (errors.length > 0) {
      console.error('❌ Some updates failed:', errors);
      throw new Error('Some statistics updates failed');
    }

    console.log('✅ Stats updated successfully for', titleToItemMap.size, 'items');
    return NextResponse.json({ 
      message: 'Stats updated successfully',
      updatedItems: titleToItemMap.size
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
  { params }: { params: { id: string } }
) {
  const worldcupId = params.id;
  
  try {
    console.log('📊 Fetching stats for worldcup:', worldcupId);

    // Get all worldcup items with their statistics
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
    
    // Calculate ranks
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
