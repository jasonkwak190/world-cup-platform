import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// This endpoint should be called by a cron job or scheduled task
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

// Allow GET for manual testing (admin only)
export async function GET(request: NextRequest) {
  console.log('📋 Cleanup status check requested');
  
  try {
    // Check current save counts
    const [playsResult, draftsResult] = await Promise.all([
      supabase
        .from('worldcup_play_saves')
        .select('id, expires_at, created_at', { count: 'exact' }),
      supabase
        .from('worldcup_draft_saves')
        .select('id, updated_at, created_at', { count: 'exact' })
    ]);

    const now = new Date();
    const expiredDate = new Date();
    expiredDate.setDate(expiredDate.getDate() - 30);

    // Count expired items
    const expiredPlays = playsResult.data?.filter(
      item => new Date(item.expires_at) < now
    ).length || 0;

    const expiredDrafts = draftsResult.data?.filter(
      item => new Date(item.updated_at) < expiredDate
    ).length || 0;

    return NextResponse.json({
      status: 'healthy',
      counts: {
        totalPlaySaves: playsResult.count || 0,
        totalDraftSaves: draftsResult.count || 0,
        expiredPlaySaves: expiredPlays,
        expiredDraftSaves: expiredDrafts
      },
      lastChecked: now.toISOString(),
      nextCleanupRecommended: expiredPlays > 0 || expiredDrafts > 0
    });

  } catch (error) {
    console.error('Cleanup status error:', error);
    return NextResponse.json(
      { error: 'Failed to check cleanup status', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}