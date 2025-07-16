import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { z } from 'zod';

// Validation schema for play save data
const playSaveSchema = z.object({
  worldcupId: z.string().uuid(),
  currentRound: z.number().min(1),
  totalRounds: z.number().min(1),
  bracketState: z.object({
    currentMatch: z.number().min(0),
    currentBracket: z.array(z.any()),
    previousBrackets: z.array(z.array(z.any())).optional(),
  }),
  remainingItems: z.array(z.any()),
  selectedItems: z.array(z.any()),
  roundHistory: z.array(z.object({
    round: z.number(),
    selections: z.array(z.any()),
    timestamp: z.string(),
  })),
  action: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = playSaveSchema.parse(body);

    console.log(`🎮 Play autosave triggered by action: ${validatedData.action || 'unknown'}`);

    // Validate data size (max 5MB)
    const dataSize = JSON.stringify(validatedData).length;
    if (dataSize > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Data size exceeds limit' },
        { status: 413 }
      );
    }

    // Upsert play save data
    const { error: saveError } = await supabase
      .from('worldcup_play_saves')
      .upsert({
        user_id: user.id,
        worldcup_id: validatedData.worldcupId,
        current_round: validatedData.currentRound,
        total_rounds: validatedData.totalRounds,
        bracket_state: validatedData.bracketState,
        remaining_items: validatedData.remainingItems,
        selected_items: validatedData.selectedItems,
        round_history: validatedData.roundHistory,
        updated_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      }, {
        onConflict: 'user_id,worldcup_id'
      });

    if (saveError) {
      console.error('❌ Play save failed:', saveError);
      return NextResponse.json(
        { error: 'Failed to save play progress', details: saveError.message },
        { status: 500 }
      );
    }

    console.log('✅ Play autosave successful');
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      action: validatedData.action,
    });

  } catch (error) {
    console.error('Play autosave error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data format', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const worldcupId = searchParams.get('worldcupId');

    if (!worldcupId) {
      return NextResponse.json(
        { error: 'worldcupId is required' },
        { status: 400 }
      );
    }

    // Get saved play progress
    const { data: playProgress, error: fetchError } = await supabase
      .from('worldcup_play_saves')
      .select('*')
      .eq('user_id', user.id)
      .eq('worldcup_id', worldcupId)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        // No saved progress found
        return NextResponse.json({ progress: null });
      }
      console.error('❌ Failed to fetch play progress:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch play progress' },
        { status: 500 }
      );
    }

    console.log('✅ Play progress retrieved');
    return NextResponse.json({
      progress: {
        worldcupId: playProgress.worldcup_id,
        currentRound: playProgress.current_round,
        totalRounds: playProgress.total_rounds,
        bracketState: playProgress.bracket_state,
        remainingItems: playProgress.remaining_items,
        selectedItems: playProgress.selected_items,
        roundHistory: playProgress.round_history,
        updatedAt: playProgress.updated_at,
      }
    });

  } catch (error) {
    console.error('Play progress fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const worldcupId = searchParams.get('worldcupId');

    if (!worldcupId) {
      return NextResponse.json(
        { error: 'worldcupId is required' },
        { status: 400 }
      );
    }

    // Delete saved play progress
    const { error: deleteError } = await supabase
      .from('worldcup_play_saves')
      .delete()
      .eq('user_id', user.id)
      .eq('worldcup_id', worldcupId);

    if (deleteError) {
      console.error('❌ Failed to delete play progress:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete play progress' },
        { status: 500 }
      );
    }

    console.log('✅ Play progress deleted');
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Play progress delete error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}