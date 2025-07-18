import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';
import { rateLimiters, checkRateLimit, getUserIdentifier, createRateLimitResponse } from '@/lib/ratelimit';

// Validation schema for voting
const voteSchema = z.object({
  winnerId: z.string().uuid(),
  loserId: z.string().uuid(),
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
    const validatedData = voteSchema.parse(body);

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

    // Verify both items exist and belong to this worldcup
    const { data: items, error: itemsError } = await supabase
      .from('worldcup_items')
      .select('id, title')
      .eq('worldcup_id', worldcupId)
      .in('id', [validatedData.winnerId, validatedData.loserId]);

    if (itemsError || items.length !== 2) {
      return NextResponse.json(
        { error: 'Invalid items for voting' },
        { status: 400 }
      );
    }

    // Check if votes table exists, create if not
    const { error: voteInsertError } = await supabase
      .from('worldcup_votes')
      .insert({
        worldcup_id: worldcupId,
        winner_id: validatedData.winnerId,
        loser_id: validatedData.loserId,
        round_type: validatedData.roundType || '16',
        session_id: validatedData.sessionId || null,
        user_ip: request.ip || 'anonymous',
        voted_at: new Date().toISOString()
      });

    if (voteInsertError) {
      console.error('Vote insert error:', voteInsertError);
      return NextResponse.json(
        { error: 'Failed to record vote' },
        { status: 500 }
      );
    }

    // Update item statistics using correct column names
    try {
      // Get current stats for both items
      const { data: currentStats, error: statsError } = await supabase
        .from('worldcup_items')
        .select('id, win_count, loss_count, total_appearances')
        .in('id', [validatedData.winnerId, validatedData.loserId]);

      if (statsError || !currentStats) {
        console.error('Failed to fetch current item stats:', statsError);
      } else {
        const winnerStats = currentStats.find(s => s.id === validatedData.winnerId);
        const loserStats = currentStats.find(s => s.id === validatedData.loserId);

        const updatePromises = [];

        if (winnerStats) {
          const newWinCount = (winnerStats.win_count || 0) + 1;
          const newTotalAppearances = (winnerStats.total_appearances || 0) + 1;
          const newWinRate = newTotalAppearances > 0 ? (newWinCount / newTotalAppearances) * 100 : 0;

          updatePromises.push(
            supabase
              .from('worldcup_items')
              .update({ 
                win_count: newWinCount,
                total_appearances: newTotalAppearances,
                win_rate: newWinRate,
                updated_at: new Date().toISOString()
              })
              .eq('id', validatedData.winnerId)
          );
        }

        if (loserStats) {
          const newLossCount = (loserStats.loss_count || 0) + 1;
          const newTotalAppearances = (loserStats.total_appearances || 0) + 1;
          const newWinRate = newTotalAppearances > 0 ? ((loserStats.win_count || 0) / newTotalAppearances) * 100 : 0;

          updatePromises.push(
            supabase
              .from('worldcup_items')
              .update({ 
                loss_count: newLossCount,
                total_appearances: newTotalAppearances,
                win_rate: newWinRate,
                updated_at: new Date().toISOString()
              })
              .eq('id', validatedData.loserId)
          );
        }

        if (updatePromises.length > 0) {
          const results = await Promise.allSettled(updatePromises);
          const failed = results.filter(r => r.status === 'rejected').length;
          
          if (failed > 0) {
            console.warn(`${failed} item stat updates failed`);
            // Log the actual errors for debugging
            results.forEach((result, index) => {
              if (result.status === 'rejected') {
                console.error(`Update ${index} failed:`, result.reason);
              }
            });
          }
        }
      }
    } catch (error) {
      console.error('Error updating item statistics:', error);
      // Don't fail the vote if stats update fails
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
    console.error('API error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get voting statistics for a worldcup
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

    // Get vote statistics
    const { data: voteStats, error: voteStatsError } = await supabase
      .from('worldcup_votes')
      .select(`
        winner_id,
        loser_id,
        round_type,
        voted_at,
        worldcup_items!winner_id(id, title),
        worldcup_items!loser_id(id, title)
      `)
      .eq('worldcup_id', worldcupId)
      .order('voted_at', { ascending: false })
      .limit(100);

    if (voteStatsError) {
      console.error('Vote stats fetch error:', voteStatsError);
      return NextResponse.json(
        { error: 'Failed to fetch vote statistics' },
        { status: 500 }
      );
    }

    // Calculate win rates for each item
    const itemStats = new Map();
    
    voteStats.forEach(vote => {
      // Winner stats
      if (!itemStats.has(vote.winner_id)) {
        itemStats.set(vote.winner_id, { wins: 0, losses: 0, title: '' });
      }
      const winnerStat = itemStats.get(vote.winner_id);
      winnerStat.wins += 1;
      winnerStat.title = vote.worldcup_items?.title || '';
      
      // Loser stats
      if (!itemStats.has(vote.loser_id)) {
        itemStats.set(vote.loser_id, { wins: 0, losses: 0, title: '' });
      }
      const loserStat = itemStats.get(vote.loser_id);
      loserStat.losses += 1;
      loserStat.title = vote.worldcup_items?.title || '';
    });

    // Transform to array with win rates
    const itemStatsArray = Array.from(itemStats.entries()).map(([itemId, stats]) => ({
      itemId,
      title: stats.title,
      wins: stats.wins,
      losses: stats.losses,
      totalBattles: stats.wins + stats.losses,
      winRate: stats.wins + stats.losses > 0 ? (stats.wins / (stats.wins + stats.losses)) * 100 : 0
    })).sort((a, b) => b.winRate - a.winRate);

    return NextResponse.json({
      totalVotes: voteStats.length,
      itemStats: itemStatsArray,
      recentVotes: voteStats.slice(0, 10).map(vote => ({
        winnerId: vote.winner_id,
        loserId: vote.loser_id,
        roundType: vote.round_type,
        votedAt: vote.voted_at
      }))
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}