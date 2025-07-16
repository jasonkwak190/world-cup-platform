import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { rateLimiters, checkRateLimit, getUserIdentifier, createRateLimitResponse } from '@/lib/ratelimit';
import { z } from 'zod';

// Validation schemas (authenticated users only)
const playProgressSchema = z.object({
  worldcup_id: z.string().uuid(),
  current_round: z.number().int().min(1),
  total_rounds: z.number().int().min(1),
  bracket_state: z.record(z.any()),
  remaining_items: z.array(z.any()),
  selected_items: z.array(z.any()),
  round_history: z.array(z.any())
});

const draftSaveSchema = z.object({
  title: z.string().max(200).optional(),
  description: z.string().max(1000).optional(),
  category: z.string().max(50).optional(),
  items: z.array(z.object({
    id: z.string(),
    name: z.string().max(100),
    image: z.string().url().optional()
  })).max(64).optional(),
  settings: z.record(z.any()).optional(),
  image_files: z.array(z.string()).optional()
});

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const identifier = getUserIdentifier(request);
    const rateLimitResult = await checkRateLimit(rateLimiters.api, identifier);
    
    if (!rateLimitResult.success) {
      return createRateLimitResponse(rateLimitResult);
    }

    const body = await request.json();
    const { type, data, action } = body;

    console.log(`Action-based save triggered: ${action || 'manual'}`);

    // Require authentication for all autosave features
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required for autosave features' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    const userId = user.id;

    if (type === 'worldcup_play') {
      // Validate play progress data
      const validatedData = playProgressSchema.parse(data);
      
      // Save play progress
      const saveData = {
        user_id: userId,
        worldcup_id: validatedData.worldcup_id,
        current_round: validatedData.current_round,
        total_rounds: validatedData.total_rounds,
        bracket_state: validatedData.bracket_state,
        remaining_items: validatedData.remaining_items,
        selected_items: validatedData.selected_items,
        round_history: validatedData.round_history,
        updated_at: new Date().toISOString()
      };

      // Use upsert to update existing save or create new one (one per user per worldcup)
      const { error } = await supabase
        .from('worldcup_play_saves')
        .upsert(
          saveData,
          {
            onConflict: 'user_id,worldcup_id',
            ignoreDuplicates: false
          }
        );

      if (error) {
        console.error('Play save error:', error);
        return NextResponse.json(
          { error: 'Failed to save play progress', details: error.message },
          { status: 500 }
        );
      }

      console.log('✅ Play progress saved successfully');
      return NextResponse.json({
        success: true,
        timestamp: new Date().toISOString(),
        message: 'Play progress saved'
      });

    } else if (type === 'worldcup_creation') {
      // Validate draft data
      const validatedData = draftSaveSchema.parse(data);

      // Save worldcup creation draft
      const { error } = await supabase
        .from('worldcup_draft_saves')
        .upsert(
          {
            user_id: userId,
            title: validatedData.title,
            description: validatedData.description,
            category: validatedData.category,
            items: validatedData.items || [],
            settings: validatedData.settings || {},
            image_files: validatedData.image_files || [],
            updated_at: new Date().toISOString()
          },
          {
            onConflict: 'user_id',
            ignoreDuplicates: false
          }
        );

      if (error) {
        console.error('Draft save error:', error);
        return NextResponse.json(
          { error: 'Failed to save draft', details: error.message },
          { status: 500 }
        );
      }

      console.log('✅ Draft saved successfully');
      return NextResponse.json({
        success: true,
        timestamp: new Date().toISOString(),
        message: 'Draft saved'
      });

    } else {
      return NextResponse.json(
        { error: 'Invalid save type. Must be "worldcup_play" or "worldcup_creation"' },
        { status: 400 }
      );
    }

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Save API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}