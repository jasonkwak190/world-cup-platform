import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getCurrentSupabaseUser } from '@/utils/supabaseAuth';
import { rateLimiters, checkRateLimit, getUserIdentifier, createRateLimitResponse } from '@/lib/ratelimit';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Rate limiting - strict for reports
    const identifier = getUserIdentifier(request);
    const rateLimitResult = await checkRateLimit(rateLimiters.comment, identifier);
    
    if (!rateLimitResult.success) {
      return createRateLimitResponse(rateLimitResult);
    }

    const { id: commentId } = await params;
    const body = await request.json();
    const { reason, description } = body;
    
    if (!reason) {
      return NextResponse.json(
        { error: 'Report reason is required' },
        { status: 400 }
      );
    }

    // Get current user (anonymous reports allowed)
    const user = await getCurrentSupabaseUser();
    
    // Check if comment exists
    const { data: comment, error: commentError } = await supabase
      .from('comments')
      .select('id, worldcup_id, author_id, content')
      .eq('id', commentId)
      .eq('is_deleted', false)
      .single();

    if (commentError || !comment) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      );
    }

    // Check if user already reported this comment
    if (user) {
      const { data: existingReport } = await supabase
        .from('reports')
        .select('id')
        .eq('target_type', 'comment')
        .eq('target_id', commentId)
        .eq('reporter_id', user.id)
        .single();

      if (existingReport) {
        return NextResponse.json(
          { error: 'You have already reported this comment' },
          { status: 400 }
        );
      }
    }

    // Create report
    const reportData: any = {
      target_type: 'comment',
      target_id: commentId,
      reason,
      description: description || null,
      status: 'pending',
      created_at: new Date().toISOString(),
      metadata: {
        comment_content: comment.content,
        comment_author_id: comment.author_id,
        worldcup_id: comment.worldcup_id
      }
    };

    if (user) {
      reportData.reporter_id = user.id;
    } else {
      reportData.reporter_ip = request.headers.get('x-forwarded-for') || 
                              request.headers.get('x-real-ip') || 
                              '127.0.0.1';
    }

    const { data: report, error: reportError } = await supabase
      .from('reports')
      .insert(reportData)
      .select('id')
      .single();

    if (reportError) {
      console.error('Failed to create report:', reportError);
      return NextResponse.json(
        { error: 'Failed to submit report' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Report submitted successfully',
      reportId: report.id
    });

  } catch (error) {
    console.error('Comment report API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}