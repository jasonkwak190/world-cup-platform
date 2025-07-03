// Supabase 연결 테스트 스크립트
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://rctoxfcyzzsiikopbsne.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjdG94ZmN5enpzaWlrb3Bic25lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5NTAwMDksImV4cCI6MjA2NjUyNjAwOX0.moYSDe7kRAkbnhPr_9V5nE_t_TvGAtBy6Uk3O7aXep4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log('🔍 Testing Supabase connection...');
  
  try {
    // 1. 기본 연결 테스트
    console.log('Step 1: Basic connection test');
    const { data: testData, error: testError } = await supabase
      .from('comments')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.error('❌ Basic connection failed:', testError);
      return;
    }
    console.log('✅ Basic connection successful');
    
    // 2. 댓글 테이블 존재 확인
    console.log('Step 2: Check comments table');
    const { data: commentsData, error: commentsError } = await supabase
      .from('comments')
      .select('id')
      .limit(1);
    
    if (commentsError) {
      console.error('❌ Comments table access failed:', commentsError);
      return;
    }
    console.log('✅ Comments table accessible');
    
    // 3. 특정 worldcup_id로 댓글 조회
    console.log('Step 3: Query specific worldcup comments');
    const worldcupId = '144ff57a-d910-4292-98c2-45ba8e6434f4';
    const { data: worldcupComments, error: worldcupError } = await supabase
      .from('comments')
      .select('*')
      .eq('worldcup_id', worldcupId);
    
    if (worldcupError) {
      console.error('❌ Worldcup comments query failed:', worldcupError);
      return;
    }
    
    console.log('✅ Worldcup comments query successful');
    console.log(`📊 Found ${worldcupComments.length} comments for worldcup ${worldcupId}`);
    
    if (worldcupComments.length > 0) {
      console.log('Sample comment:', worldcupComments[0]);
    }
    
    // 4. RLS 상태 확인
    console.log('Step 4: Check RLS status');
    const { data: rlsData, error: rlsError } = await supabase
      .rpc('check_table_rls', { table_name: 'comments' });
    
    console.log('RLS status check result:', { rlsData, rlsError });
    
  } catch (error) {
    console.error('❌ Connection test failed with exception:', error);
  }
}

testConnection();