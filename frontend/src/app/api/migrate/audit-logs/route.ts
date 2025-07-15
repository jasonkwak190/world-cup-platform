// 감사 로그 관리 API
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { AuditLog } from '@/types/security';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const auditLog: AuditLog = await request.json();

    // 감사 로그 테이블에 저장
    const { data, error } = await supabase
      .from('audit_logs')
      .insert([
        {
          id: auditLog.id,
          event_type: auditLog.event_type,
          target_type: auditLog.target_type,
          target_id: auditLog.target_id,
          user_id: auditLog.user_id,
          admin_id: auditLog.admin_id,
          details: auditLog.details,
          ip_address: auditLog.ip_address,
          user_agent: auditLog.user_agent,
          created_at: auditLog.created_at
        }
      ]);

    if (error) {
      console.error('Failed to save audit log:', error);
      return NextResponse.json({ error: 'Failed to save audit log' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    
    const eventType = searchParams.get('event_type');
    const targetType = searchParams.get('target_type');
    const targetId = searchParams.get('target_id');
    const userId = searchParams.get('user_id');
    const adminId = searchParams.get('admin_id');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '100');

    let query = supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false });

    // 필터 적용
    if (eventType) query = query.eq('event_type', eventType);
    if (targetType) query = query.eq('target_type', targetType);
    if (targetId) query = query.eq('target_id', targetId);
    if (userId) query = query.eq('user_id', userId);
    if (adminId) query = query.eq('admin_id', adminId);
    if (startDate) query = query.gte('created_at', startDate);
    if (endDate) query = query.lte('created_at', endDate);

    // 페이지네이션
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Failed to fetch audit logs:', error);
      return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 });
    }

    return NextResponse.json({
      data,
      pagination: {
        page,
        limit,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / limit),
        has_next: (page * limit) < (count || 0),
        has_prev: page > 1
      }
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');
    
    // 지정된 일수 이전의 로그 삭제
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    const { data, error } = await supabase
      .from('audit_logs')
      .delete()
      .lt('created_at', cutoffDate.toISOString());

    if (error) {
      console.error('Failed to delete old audit logs:', error);
      return NextResponse.json({ error: 'Failed to delete old audit logs' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: `Deleted audit logs older than ${days} days`,
      deleted_count: data?.length || 0
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}