import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getUser } from '@/utils/supabase/auth';

// User-specific cleanup for auto-save data
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient();
    const user = await getUser(supabase);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all';
    const dryRun = searchParams.get('dry_run') === 'true';

    let deletedCount = 0;
    const results = [];

    // Clean expired play saves (7 days old)
    if (type === 'expired' || type === 'all') {
      const expiredPlayQuery = supabase
        .from('worldcup_play_saves')
        .select('id, worldcup_id, updated_at')
        .eq('user_id', user.id)
        .lt('updated_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      const { data: expiredPlays, error: expiredError } = await expiredPlayQuery;
      
      if (expiredError) {
        console.error('Error fetching expired play saves:', expiredError);
      } else if (expiredPlays && expiredPlays.length > 0) {
        if (!dryRun) {
          const { error: deleteError } = await supabase
            .from('worldcup_play_saves')
            .delete()
            .eq('user_id', user.id)
            .lt('updated_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

          if (deleteError) {
            console.error('Error deleting expired play saves:', deleteError);
          } else {
            deletedCount += expiredPlays.length;
          }
        }
        
        results.push({
          type: 'expired_play_saves',
          count: expiredPlays.length,
          items: expiredPlays.map(item => ({
            id: item.id,
            worldcup_id: item.worldcup_id,
            updated_at: item.updated_at
          }))
        });
      }
    }

    // Clean old draft saves (30 days old)
    if (type === 'old' || type === 'all') {
      const oldDraftQuery = supabase
        .from('worldcup_draft_saves')
        .select('id, worldcup_id, updated_at')
        .eq('user_id', user.id)
        .lt('updated_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      const { data: oldDrafts, error: oldError } = await oldDraftQuery;
      
      if (oldError) {
        console.error('Error fetching old draft saves:', oldError);
      } else if (oldDrafts && oldDrafts.length > 0) {
        if (!dryRun) {
          const { error: deleteError } = await supabase
            .from('worldcup_draft_saves')
            .delete()
            .eq('user_id', user.id)
            .lt('updated_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

          if (deleteError) {
            console.error('Error deleting old draft saves:', deleteError);
          } else {
            deletedCount += oldDrafts.length;
          }
        }
        
        results.push({
          type: 'old_draft_saves',
          count: oldDrafts.length,
          items: oldDrafts.map(item => ({
            id: item.id,
            worldcup_id: item.worldcup_id,
            updated_at: item.updated_at
          }))
        });
      }
    }

    // Get user's current save statistics
    const { data: userPlaySaves, error: userPlayError } = await supabase
      .from('worldcup_play_saves')
      .select('id, data_size, updated_at')
      .eq('user_id', user.id);

    const { data: userDraftSaves, error: userDraftError } = await supabase
      .from('worldcup_draft_saves')
      .select('id, data_size, updated_at')
      .eq('user_id', user.id);

    const playStats = {
      count: userPlaySaves?.length || 0,
      totalSize: userPlaySaves?.reduce((sum, save) => sum + (save.data_size || 0), 0) || 0,
      newestSave: userPlaySaves?.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())[0]?.updated_at
    };

    const draftStats = {
      count: userDraftSaves?.length || 0,
      totalSize: userDraftSaves?.reduce((sum, save) => sum + (save.data_size || 0), 0) || 0,
      newestSave: userDraftSaves?.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())[0]?.updated_at
    };

    return NextResponse.json({
      success: true,
      dry_run: dryRun,
      deleted_count: deletedCount,
      results,
      user_stats: {
        play_saves: playStats,
        draft_saves: draftStats,
        total_saves: playStats.count + draftStats.count,
        total_size: playStats.totalSize + draftStats.totalSize
      }
    });
  } catch (error) {
    console.error('Cleanup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Admin-only cron job endpoint
export async function POST(request: NextRequest) {
  try {
    // Check for admin authentication or cron secret
    const authHeader = request.headers.get('authorization');
    const cronSecret = request.headers.get('x-cron-secret');
    
    // Allow either admin auth or correct cron secret
    if (!cronSecret || cronSecret !== process.env.CRON_SECRET) {
      // Try admin auth as fallback
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }

      const supabase = createClient();
      const token = authHeader.substring(7);
      const { data: { user }, error } = await supabase.auth.getUser(token);
      
      if (error || !user) {
        return NextResponse.json(
          { error: 'Invalid authentication' },
          { status: 401 }
        );
      }

      // Check if user is admin (you may need to adjust this check)
      const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile?.role !== 'admin') {
        return NextResponse.json(
          { error: 'Admin access required' },
          { status: 403 }
        );
      }
    }

    console.log('🧹 Starting autosave cleanup job...');

    const supabase = createClient();
    
    // Execute the cleanup function
    const { error: cleanupError } = await supabase.rpc('cleanup_expired_saves');

    if (cleanupError) {
      console.error('Cleanup function error:', cleanupError);
      return NextResponse.json(
        { error: 'Cleanup function failed', details: cleanupError.message },
        { status: 500 }
      );
    }

    // Additional cleanup: Delete expired play saves manually if RPC function doesn't work
    const expiredPlaysResult = await supabase
      .from('worldcup_play_saves')
      .delete()
      .lt('expires_at', new Date().toISOString());

    // Delete old draft saves (30 days)
    const expiredDate = new Date();
    expiredDate.setDate(expiredDate.getDate() - 30);

    const expiredDraftsResult = await supabase
      .from('worldcup_draft_saves')
      .delete()
      .lt('updated_at', expiredDate.toISOString());

    console.log('✅ Cleanup completed successfully', {
      expiredPlays: expiredPlaysResult.error ? 'error' : 'success',
      expiredDrafts: expiredDraftsResult.error ? 'error' : 'success'
    });

    return NextResponse.json({
      success: true,
      message: 'Cleanup completed successfully',
      details: {
        expiredPlaysDeleted: expiredPlaysResult.error ? 0 : 'unknown',
        expiredDraftsDeleted: expiredDraftsResult.error ? 0 : 'unknown',
        errors: [
          expiredPlaysResult.error?.message,
          expiredDraftsResult.error?.message
        ].filter(Boolean)
      }
    });

  } catch (error) {
    console.error('Cleanup API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// GET endpoint for user cleanup statistics
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const user = await getUser(supabase);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's current save statistics
    const { data: userPlaySaves, error: userPlayError } = await supabase
      .from('worldcup_play_saves')
      .select('id, data_size, updated_at')
      .eq('user_id', user.id);

    const { data: userDraftSaves, error: userDraftError } = await supabase
      .from('worldcup_draft_saves')
      .select('id, data_size, updated_at')
      .eq('user_id', user.id);

    if (userPlayError || userDraftError) {
      return NextResponse.json(
        { error: 'Failed to fetch save statistics' },
        { status: 500 }
      );
    }

    const playStats = {
      count: userPlaySaves?.length || 0,
      totalSize: userPlaySaves?.reduce((sum, save) => sum + (save.data_size || 0), 0) || 0,
      newestSave: userPlaySaves?.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())[0]?.updated_at
    };

    const draftStats = {
      count: userDraftSaves?.length || 0,
      totalSize: userDraftSaves?.reduce((sum, save) => sum + (save.data_size || 0), 0) || 0,
      newestSave: userDraftSaves?.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())[0]?.updated_at
    };

    return NextResponse.json({
      success: true,
      user_stats: {
        play_saves: playStats,
        draft_saves: draftStats,
        total_saves: playStats.count + draftStats.count,
        total_size: playStats.totalSize + draftStats.totalSize
      }
    });
  } catch (error) {
    console.error('Cleanup stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}