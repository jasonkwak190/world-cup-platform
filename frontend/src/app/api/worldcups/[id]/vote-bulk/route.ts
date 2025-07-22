import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';
import { rateLimiters, checkRateLimit, getUserIdentifier, createRateLimitResponse } from '@/lib/ratelimit';
import { getCurrentSupabaseUser } from '@/utils/supabaseAuth';

// Validation schema for individual vote
const singleVoteSchema = z.object({
  winnerId: z.string().uuid(),
  loserId: z.string().uuid().optional().nullable(),
  roundType: z.enum(['16', '8', '4', 'semi', 'final']).optional(),
  sessionId: z.string().optional() // For tracking user sessions
});

// Validation schema for bulk voting
const bulkVoteSchema = z.object({
  votes: z.array(singleVoteSchema).min(1).max(100), // Limit to prevent abuse
  worldcupId: z.string().uuid().optional(), // Optional for backwards compatibility
  timestamp: z.number().optional()
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Rate limiting for bulk operations (more restrictive)
    const identifier = getUserIdentifier(request);
    const rateLimitResult = await checkRateLimit(rateLimiters.upload, identifier); // Use upload limit for bulk operations
    
    if (!rateLimitResult.success) {
      return createRateLimitResponse(rateLimitResult);
    }

    const resolvedParams = await params;
    const worldcupId = resolvedParams.id;
    const body = await request.json();
    
    console.log('📋 Bulk vote request received:', { worldcupId, votesCount: body.votes?.length });
    
    // Check current user (optional - for analytics)
    const currentUser = await getCurrentSupabaseUser();
    console.log('👤 User context:', currentUser ? `${currentUser.username} (${currentUser.id})` : 'Anonymous');
    
    const validatedData = bulkVoteSchema.parse(body);
    console.log('Bulk vote data validated:', { votesCount: validatedData.votes.length });

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

    // Collect all unique item IDs for verification
    const allItemIds = new Set<string>();
    validatedData.votes.forEach(vote => {
      allItemIds.add(vote.winnerId);
      if (vote.loserId) {
        allItemIds.add(vote.loserId);
      }
    });

    console.log('Verifying items:', { itemIds: Array.from(allItemIds), worldcupId });
    
    // Verify all items exist and belong to this worldcup
    const { data: items, error: itemsError } = await supabase
      .from('worldcup_items')
      .select('id, title')
      .eq('worldcup_id', worldcupId)
      .in('id', Array.from(allItemIds));

    if (itemsError) {
      console.error('❌ Items verification error:', itemsError);
      return NextResponse.json(
        { error: 'Failed to verify items', details: itemsError.message },
        { status: 500 }
      );
    }
    
    if (!items || items.length !== allItemIds.size) {
      const foundIds = new Set(items?.map(i => i.id) || []);
      const missingIds = Array.from(allItemIds).filter(id => !foundIds.has(id));
      
      console.error(`❌ Item verification failed:`, {
        expected: allItemIds.size,
        received: items?.length || 0,
        missingIds
      });
      return NextResponse.json(
        { 
          error: 'Invalid items for voting', 
          expected: allItemIds.size, 
          received: items?.length || 0,
          missingIds,
          message: 'Some items not found or do not belong to this worldcup'
        },
        { status: 400 }
      );
    }
    
    console.log('✅ All items verified successfully:', items.map(i => ({ id: i.id, title: i.title })));

    // Process bulk votes with error tracking
    const results = {
      successCount: 0,
      failCount: 0,
      errors: [] as any[]
    };

    try {
      // Get current stats for all affected items
      const { data: currentStats, error: statsError } = await supabase
        .from('worldcup_items')
        .select('id, win_count, loss_count, total_appearances, win_rate')
        .eq('worldcup_id', worldcupId)
        .in('id', Array.from(allItemIds));

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

      // Create stats lookup map
      const statsMap = new Map(currentStats?.map(stat => [stat.id, stat]) || []);

      // Aggregate vote changes for each item
      const itemUpdates = new Map<string, {
        winIncrement: number;
        lossIncrement: number;
        totalIncrement: number;
      }>();

      // Process each vote to calculate aggregated changes
      for (const vote of validatedData.votes) {
        try {
          // Update winner stats
          if (!itemUpdates.has(vote.winnerId)) {
            itemUpdates.set(vote.winnerId, { winIncrement: 0, lossIncrement: 0, totalIncrement: 0 });
          }
          const winnerUpdate = itemUpdates.get(vote.winnerId)!;
          winnerUpdate.winIncrement += 1;
          winnerUpdate.totalIncrement += 1;

          // Update loser stats (if exists)
          if (vote.loserId) {
            if (!itemUpdates.has(vote.loserId)) {
              itemUpdates.set(vote.loserId, { winIncrement: 0, lossIncrement: 0, totalIncrement: 0 });
            }
            const loserUpdate = itemUpdates.get(vote.loserId)!;
            loserUpdate.lossIncrement += 1;
            loserUpdate.totalIncrement += 1;
          }

          results.successCount++;
        } catch (error) {
          console.error('❌ Error processing individual vote:', error);
          results.failCount++;
          results.errors.push({
            vote,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      // Apply aggregated updates to database
      const updatePromises = [];
      
      for (const [itemId, updates] of itemUpdates.entries()) {
        const currentItemStats = statsMap.get(itemId);
        if (!currentItemStats) {
          console.error(`❌ No stats found for item ${itemId}`);
          continue;
        }

        const newWinCount = (currentItemStats.win_count || 0) + updates.winIncrement;
        const newLossCount = (currentItemStats.loss_count || 0) + updates.lossIncrement;
        const newTotalAppearances = (currentItemStats.total_appearances || 0) + updates.totalIncrement;
        const newWinRate = newTotalAppearances > 0 ? (newWinCount / newTotalAppearances) * 100 : 0;

        console.log(`📊 Bulk updating item ${itemId}: wins +${updates.winIncrement}, losses +${updates.lossIncrement}, total +${updates.totalIncrement}`);

        updatePromises.push(
          supabase
            .from('worldcup_items')
            .update({ 
              win_count: newWinCount,
              loss_count: newLossCount,
              total_appearances: newTotalAppearances,
              win_rate: parseFloat(newWinRate.toFixed(2)),
              updated_at: new Date().toISOString()
            })
            .eq('id', itemId)
            .eq('worldcup_id', worldcupId)
        );
      }

      // Execute all updates
      if (updatePromises.length > 0) {
        const updateResults = await Promise.allSettled(updatePromises);
        const failedUpdates = updateResults.filter(r => r.status === 'rejected');
        
        if (failedUpdates.length > 0) {
          console.error(`❌ ${failedUpdates.length} item stat updates failed:`, failedUpdates);
          
          // Add database update failures to results
          failedUpdates.forEach(failure => {
            results.errors.push({
              type: 'database_update',
              error: (failure as PromiseRejectedResult).reason
            });
          });
        }

        console.log(`✅ Bulk statistics updated successfully for ${updateResults.length - failedUpdates.length}/${updateResults.length} items`);
      }

    } catch (error) {
      console.error('❌ Error during bulk vote processing:', error);
      return NextResponse.json(
        { 
          error: 'Failed to process bulk votes',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Bulk votes processed',
      successfulVotes: results.successCount, // Match expected field name
      failedVotes: results.failCount, // Match expected field name
      successCount: results.successCount,
      failCount: results.failCount,
      totalVotes: validatedData.votes.length,
      ...(results.errors.length > 0 && { errors: results.errors })
    });

  } catch (error) {
    console.error('❌ Bulk vote API error:', {
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
          message: 'Invalid bulk vote request data format'
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