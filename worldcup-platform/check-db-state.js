require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkData() {
  console.log('🔍 현재 데이터베이스 상태 확인...');
  
  // 월드컵 데이터 확인
  const { data: worldcups } = await supabase
    .from('worldcups')
    .select('id, title, comments')
    .eq('title', '133');
    
  console.log('월드컵 데이터:', worldcups);
  
  if (worldcups && worldcups.length > 0) {
    const worldcup = worldcups[0];
    console.log('🎯 월드컵 133 정보:', {
      id: worldcup.id,
      title: worldcup.title,
      storedComments: worldcup.comments
    });
    
    // 실제 댓글 수 확인
    const { data: actualComments } = await supabase
      .from('worldcup_comments')
      .select('id')
      .eq('worldcup_id', worldcup.id);
      
    console.log('실제 댓글 수:', actualComments?.length || 0);
    console.log('저장된 댓글 수:', worldcup.comments);
    
    const actualCount = actualComments?.length || 0;
    if (actualCount != worldcup.comments) {
      console.log('⚠️ 불일치 발견! 다시 동기화가 필요합니다.');
      
      // 즉시 수정
      const { error } = await supabase
        .from('worldcups')
        .update({ comments: actualCount })
        .eq('id', worldcup.id);
        
      if (!error) {
        console.log('✅ 댓글 수 수정 완료:', actualCount);
      } else {
        console.error('❌ 수정 실패:', error);
      }
    } else {
      console.log('✅ 댓글 수가 일치합니다.');
    }
  }
}

checkData().catch(console.error);