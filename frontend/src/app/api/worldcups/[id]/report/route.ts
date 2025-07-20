import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';
import { rateLimiters, checkRateLimit, getUserIdentifier, createRateLimitResponse } from '@/lib/ratelimit';
import { getCurrentSupabaseUser } from '@/utils/supabaseAuth';

// Validation schema
const worldcupIdSchema = z.string().uuid();
const reportSchema = z.object({
  reason: z.enum(['inappropriate_content', 'spam', 'copyright', 'harassment', 'other']),
  description: z.string().min(1).max(500).optional()
});

// Check if user has reported this worldcup
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

    const { id: worldcupId } = await params;
    
    // Validate UUID
    const validationResult = worldcupIdSchema.safeParse(worldcupId);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid worldcup ID format' },
        { status: 400 }
      );
    }

    // Get current user
    const user = await getCurrentSupabaseUser();
    
    if (!user) {
      return NextResponse.json({
        reported: false,
        requiresAuth: true
      });
    }

    // Check if user has already reported this worldcup
    const { data: existingReport } = await supabase
      .from('user_interactions')
      .select('id')
      .eq('user_id', user.id)
      .eq('target_type', 'worldcup')
      .eq('target_id', worldcupId)
      .eq('interaction_type', 'report')
      .single();

    return NextResponse.json({
      reported: !!existingReport,
      requiresAuth: false
    });

  } catch (error) {
    console.error('Report check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Submit a report for a worldcup
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Rate limiting for report submissions (stricter)
    const identifier = getUserIdentifier(request);
    const rateLimitResult = await checkRateLimit(rateLimiters.strict, identifier);
    
    if (!rateLimitResult.success) {
      return createRateLimitResponse(rateLimitResult);
    }

    const { id: worldcupId } = await params;
    
    // Validate UUID
    const validationResult = worldcupIdSchema.safeParse(worldcupId);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid worldcup ID format' },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();
    const reportData = reportSchema.parse(body);

    // Get current user
    const user = await getCurrentSupabaseUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required to report content' },
        { status: 401 }
      );
    }

    // Verify worldcup exists
    const { data: worldcup, error: worldcupError } = await supabase
      .from('worldcups')
      .select('id, title')
      .eq('id', worldcupId)
      .single();

    if (worldcupError || !worldcup) {
      return NextResponse.json(
        { error: 'Worldcup not found' },
        { status: 404 }
      );
    }

    // Check if user has already reported this worldcup
    const { data: existingReport } = await supabase
      .from('user_interactions')
      .select('id')
      .eq('user_id', user.id)
      .eq('target_type', 'worldcup')
      .eq('target_id', worldcupId)
      .eq('interaction_type', 'report')
      .single();

    if (existingReport) {
      return NextResponse.json(
        { error: 'You have already reported this worldcup' },
        { status: 400 }
      );
    }

    // Create report record
    const { error: reportError } = await supabase
      .from('user_interactions')
      .insert({
        user_id: user.id,
        target_type: 'worldcup',
        target_id: worldcupId,
        interaction_type: 'report',
        metadata: {
          reason: reportData.reason,
          description: reportData.description,
          reported_at: new Date().toISOString(),
          worldcup_title: worldcup.title
        }
      });

    if (reportError) {
      console.error('Failed to create report:', reportError);
      return NextResponse.json(
        { error: 'Failed to submit report' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Report submitted successfully. Thank you for helping keep our community safe.',
      reported: true
    });

  } catch (error) {
    console.error('Report submission error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid report data',
          details: error.errors
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}