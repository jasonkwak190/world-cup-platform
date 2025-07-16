import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { rateLimiters, checkRateLimit, getUserIdentifier, createRateLimitResponse } from '@/lib/ratelimit';

export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const identifier = getUserIdentifier(request);
    const rateLimitResult = await checkRateLimit(rateLimiters.api, identifier);
    
    if (!rateLimitResult.success) {
      return createRateLimitResponse(rateLimitResult);
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const worldcupId = searchParams.get('worldcupId');

    if (!type || !['worldcup_play', 'worldcup_creation'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid type parameter. Must be "worldcup_play" or "worldcup_creation"' },
        { status: 400 }
      );
    }

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

    let result = null;

    if (type === 'worldcup_play') {
      if (!worldcupId) {
        return NextResponse.json(
          { error: 'worldcupId parameter required for play progress restore' },
          { status: 400 }
        );
      }

      // Get user's save for this worldcup
      const { data, error } = await supabase
        .from('worldcup_play_saves')
        .select('*')
        .eq('worldcup_id', worldcupId)
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Play restore error:', error);
        return NextResponse.json(
          { error: 'Failed to restore play progress', details: error.message },
          { status: 500 }
        );
      }

      result = data;
      
    } else if (type === 'worldcup_creation') {
      const { data, error } = await supabase
        .from('worldcup_draft_saves')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Draft restore error:', error);
        return NextResponse.json(
          { error: 'Failed to restore draft', details: error.message },
          { status: 500 }
        );
      }

      result = data;
    }

    return NextResponse.json({
      success: true,
      data: result,
      message: result ? 'Save data restored' : 'No save data found'
    });

  } catch (error) {
    console.error('Restore API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Delete save data
export async function DELETE(request: NextRequest) {
  try {
    // Rate limiting
    const identifier = getUserIdentifier(request);
    const rateLimitResult = await checkRateLimit(rateLimiters.api, identifier);
    
    if (!rateLimitResult.success) {
      return createRateLimitResponse(rateLimitResult);
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const worldcupId = searchParams.get('worldcupId');

    if (!type || !['worldcup_play', 'worldcup_creation'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid type parameter' },
        { status: 400 }
      );
    }

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
      if (!worldcupId) {
        return NextResponse.json(
          { error: 'worldcupId parameter required' },
          { status: 400 }
        );
      }

      const { error } = await supabase
        .from('worldcup_play_saves')
        .delete()
        .eq('worldcup_id', worldcupId)
        .eq('user_id', userId);

      if (error) {
        console.error('Play save delete error:', error);
        return NextResponse.json(
          { error: 'Failed to delete play save', details: error.message },
          { status: 500 }
        );
      }

    } else if (type === 'worldcup_creation') {
      const { error } = await supabase
        .from('worldcup_draft_saves')
        .delete()
        .eq('user_id', userId);

      if (error) {
        console.error('Draft delete error:', error);
        return NextResponse.json(
          { error: 'Failed to delete draft', details: error.message },
          { status: 500 }
        );
      }
    }

    console.log(`✅ ${type} save deleted successfully`);
    return NextResponse.json({
      success: true,
      message: 'Save data deleted successfully'
    });

  } catch (error) {
    console.error('Delete API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}