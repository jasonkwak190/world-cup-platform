import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';
import { rateLimiters, checkRateLimit, getUserIdentifier, createRateLimitResponse } from '@/lib/ratelimit';

// Validation schema for voting
const voteSchema = z.object({
  winnerId: z.string().uuid(),
  loserId: z.string().uuid().optional(),
  roundType: z.enum(['16', '8', '4', 'semi', 'final']).optional(),
  sessionId: z.string().optional() // For tracking user sessions
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Rate limiting
    const identifier = getUserIdentifier(request);
    const rateLimitResult = await checkRateLimit(rateLimiters.stats, identifier);
    
    if (!rateLimitResult.success) {
      return createRateLimitResponse(rateLimitResult);
    }

    const resolvedParams = await params;
    const worldcupId = resolvedParams.id;
    const body = await request.json();
    
    console.log('Vote request received:', { worldcupId, body });
    
    const validatedData = voteSchema.parse(body);
    console.log('Vote data validated:', validatedData);

    // Verify worldcup exists
    const { data: worldcup, error: worldcupError } = await supabase
      .from('worldcups')
      .select('id, is_public')
      .eq('id', worldcupId)
      .single();

    if (worldcupError) {
      return NextResponse.json(
        { error: 'WorldCup not found' },
        { status: 404 }
      );
    }

    // Verify items exist and belong to this worldcup
    const itemIds = validatedData.loserId ? [validatedData.winnerId, validatedData.loserId] : [validatedData.winnerId];
    console.log('Verifying items:', { itemIds, worldcupId });
    
    const { data: items, error: itemsError } = await supabase
      .from('worldcup_items')
      .select('id, title')
      .eq('worldcup_id', worldcupId)
      .in('id', itemIds);

    const expectedLength = validatedData.loserId ? 2 : 1;
    if (itemsError) {
      console.error('❌ Items verification error:', itemsError);
      return NextResponse.json(
        { error: 'Failed to verify items', details: itemsError.message },
        { status: 500 }
      );
    }
    
    if (!items || items.length !== expectedLength) {
      console.error(`❌ Item verification failed:`, {
        expected: expectedLength,
        received: items?.length || 0,
        itemIds,
        foundItems: items
      });
      return NextResponse.json(
        { 
          error: 'Invalid items for voting', 
          expected: expectedLength, 
          received: items?.length || 0,
          itemIds,
          message: 'Items not found or do not belong to this worldcup'
        },
        { status: 400 }
      );
    }
    
    console.log('✅ Items verified successfully:', items.map(i => ({ id: i.id, title: i.title })));

    console.log('Processing vote without separate table, updating item statistics directly');

    // Update item statistics directly in worldcup_items table
    try {
      // Get current stats for items (only include loserId if it exists)
      const itemIdsForStats = validatedData.loserId 
        ? [validatedData.winnerId, validatedData.loserId] 
        : [validatedData.winnerId];
        
      const { data: currentStats, error: statsError } = await supabase
        .from('worldcup_items')
        .select('id, win_count, loss_count, total_appearances, win_rate')
        .eq('worldcup_id', worldcupId)  // Ensure items belong to this worldcup
        .in('id', itemIdsForStats);

      if (statsError) {
        console.error('❌ Failed to fetch current item stats:', statsError);
        return NextResponse.json(
          { 
            error: 'Failed to fetch item statistics', 
            details: statsError.message 
          },
          { status: 500 }
        );
      }

      if (!currentStats || currentStats.length !== itemIdsForStats.length) {
        console.error('❌ Item statistics fetch failed:', {
          expected: itemIdsForStats.length,
          received: currentStats?.length || 0,
          itemIds: itemIdsForStats
        });
        return NextResponse.json(
          { 
            error: 'Items not found for statistics update',
            itemIds: itemIdsForStats
          },
          { status: 400 }
        );
      }

      const winnerStats = currentStats.find(s => s.id === validatedData.winnerId);
      const loserStats = validatedData.loserId ? currentStats.find(s => s.id === validatedData.loserId) : null;

      const updatePromises = [];

      // Update winner statistics
      if (winnerStats) {
        const newWinCount = (winnerStats.win_count || 0) + 1;
        const newTotalAppearances = (winnerStats.total_appearances || 0) + 1;
        const newWinRate = newTotalAppearances > 0 ? (newWinCount / newTotalAppearances) * 100 : 0;

        console.log(`📊 Updating winner ${winnerStats.id}: wins ${winnerStats.win_count} → ${newWinCount}, rate ${winnerStats.win_rate} → ${newWinRate.toFixed(2)}`);

        updatePromises.push(
          supabase
            .from('worldcup_items')
            .update({ 
              win_count: newWinCount,
              total_appearances: newTotalAppearances,
              win_rate: parseFloat(newWinRate.toFixed(2)),
              updated_at: new Date().toISOString()
            })
            .eq('id', validatedData.winnerId)
            .eq('worldcup_id', worldcupId)  // Double check
        );
      }

      // Update loser statistics (if exists)
      if (loserStats && validatedData.loserId) {
        const newLossCount = (loserStats.loss_count || 0) + 1;
        const newTotalAppearances = (loserStats.total_appearances || 0) + 1;
        const currentWinCount = loserStats.win_count || 0;
        const newWinRate = newTotalAppearances > 0 ? (currentWinCount / newTotalAppearances) * 100 : 0;

        console.log(`📊 Updating loser ${loserStats.id}: losses ${loserStats.loss_count} → ${newLossCount}, rate ${loserStats.win_rate} → ${newWinRate.toFixed(2)}`);

        updatePromises.push(
          supabase
            .from('worldcup_items')
            .update({ 
              loss_count: newLossCount,
              total_appearances: newTotalAppearances,
              win_rate: parseFloat(newWinRate.toFixed(2)),
              updated_at: new Date().toISOString()
            })
            .eq('id', validatedData.loserId)
            .eq('worldcup_id', worldcupId)  // Double check
        );
      }

      // Execute all updates
      if (updatePromises.length > 0) {
        const results = await Promise.allSettled(updatePromises);
        const failed = results.filter(r => r.status === 'rejected');
        
        if (failed.length > 0) {
          console.error(`❌ ${failed.length} item stat updates failed:`, failed);
          return NextResponse.json(
            { 
              error: 'Statistics update failed',
              details: failed.map(f => (f as PromiseRejectedResult).reason)
            },
            { status: 500 }
          );
        }

        console.log('✅ Statistics updated successfully for', results.length, 'items');
      }

    } catch (error) {
      console.error('❌ Error updating item statistics:', error);
      return NextResponse.json(
        { 
          error: 'Failed to update statistics',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Vote recorded successfully',
      vote: {
        worldcupId,
        winnerId: validatedData.winnerId,
        loserId: validatedData.loserId,
        roundType: validatedData.roundType
      }
    });

  } catch (error) {
    console.error('❌ API error:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    
    if (error instanceof z.ZodError) {
      console.error('❌ Validation error:', error.errors);
      return NextResponse.json(
        { 
          error: 'Validation error', 
          details: error.errors,
          message: 'Invalid request data format'
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// Get voting statistics for a worldcup (from worldcup_items table)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Rate limiting
    const identifier = getUserIdentifier(request);
    const rateLimitResult = await checkRateLimit(rateLimiters.api, identifier);
    
    if (!rateLimitResult.success) {
      return createRateLimitResponse(rateLimitResult);
    }

    const resolvedParams = await params;
    const worldcupId = resolvedParams.id;

    // Verify worldcup exists
    const { data: worldcup, error: worldcupError } = await supabase
      .from('worldcups')
      .select('id, title, is_public')
      .eq('id', worldcupId)
      .single();

    if (worldcupError) {
      return NextResponse.json(
        { error: 'WorldCup not found' },
        { status: 404 }
      );
    }

    // Get statistics directly from worldcup_items table
    const { data: itemStats, error: itemStatsError } = await supabase
      .from('worldcup_items')
      .select('id, title, image_url, win_count, loss_count, total_appearances, win_rate, championship_wins')
      .eq('worldcup_id', worldcupId)
      .order('win_rate', { ascending: false });

    if (itemStatsError) {
      console.error('Item stats fetch error:', itemStatsError);
      return NextResponse.json(
        { error: 'Failed to fetch item statistics' },
        { status: 500 }
      );
    }

    // Transform data to match expected format
    const itemStatsArray = (itemStats || []).map(item => ({
      itemId: item.id,
      title: item.title,
      image_url: item.image_url,
      wins: item.win_count || 0,
      losses: item.loss_count || 0,
      totalBattles: item.total_appearances || 0,
      winRate: item.win_rate || 0,
      championshipWins: item.championship_wins || 0
    }));

    // Calculate total votes across all items
    const totalVotes = itemStatsArray.reduce((sum, item) => sum + item.totalBattles, 0);

    console.log('📊 Vote statistics retrieved for worldcup:', worldcupId, 'Items:', itemStatsArray.length);

    return NextResponse.json({
      worldcup: {
        id: worldcup.id,
        title: worldcup.title,
        is_public: worldcup.is_public
      },
      totalVotes,
      itemStats: itemStatsArray,
      totalItems: itemStatsArray.length
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}