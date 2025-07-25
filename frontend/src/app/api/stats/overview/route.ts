import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { OverviewStats, StatsResponse } from '@/types/stats';

// Security: Generic error messages to prevent information disclosure

export async function GET() {
  try {
    // Get overview statistics
    const [
      { count: totalWorldcups, error: worldcupsError },
      { count: totalUsers, error: usersError },
      { count: totalComments, error: commentsError }
    ] = await Promise.all([
      supabase
        .from('worldcups')
        .select('*', { count: 'exact', head: true })
        .eq('is_public', true),
      supabase
        .from('users')
        .select('*', { count: 'exact', head: true }),
      supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .eq('is_deleted', false)
    ]);

    if (worldcupsError || usersError || commentsError) {
      // Security: Log detailed errors for debugging but return generic message
      console.error('Error fetching stats:', {
        worldcupsError: worldcupsError ? {
          message: worldcupsError.message,
          code: worldcupsError.code,
          details: worldcupsError.details
        } : null,
        usersError: usersError ? {
          message: usersError.message,
          code: usersError.code,
          details: usersError.details
        } : null,
        commentsError: commentsError ? {
          message: commentsError.message,
          code: commentsError.code,
          details: commentsError.details
        } : null,
        timestamp: new Date().toISOString()
      });
      return NextResponse.json(
        { error: 'Failed to fetch overview stats' },
        { status: 500 }
      );
    }

    // Get total plays by summing participants
    const { data: playCountData, error: playCountError } = await supabase
      .from('worldcups')
      .select('participants')
      .eq('is_public', true);

    if (playCountError) {
      // Security: Log detailed error for debugging but return generic message
      console.error('Error fetching play count:', {
        message: playCountError.message,
        code: playCountError.code,
        details: playCountError.details,
        hint: playCountError.hint,
        timestamp: new Date().toISOString()
      });
      return NextResponse.json(
        { error: 'Failed to fetch play count' },
        { status: 500 }
      );
    }

    const totalPlays = playCountData.reduce((sum, wc) => sum + (wc.participants || 0), 0);

    // Calculate total pages (assuming 12 items per page)
    const itemsPerPage = 12;
    const totalPages = Math.ceil((totalWorldcups || 0) / itemsPerPage);

    const stats: OverviewStats = {
      totalWorldcups: totalWorldcups || 0,
      totalPlays,
      totalUsers: totalUsers || 0,
      totalComments: totalComments || 0,
      totalPages
    };

    const response: StatsResponse = {
      data: stats,
      lastUpdated: new Date().toISOString()
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, max-age=600, stale-while-revalidate=120', // 10 minutes cache
      },
    });
  } catch (error) {
    // Security: Log detailed error for debugging but return generic message
    console.error('Unexpected error in stats API:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}