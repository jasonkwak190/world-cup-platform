const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testSupabaseConnection() {
  try {
    console.log('🔗 Testing Supabase connection...')
    console.log('URL:', supabaseUrl)
    console.log('Key prefix:', supabaseAnonKey?.substring(0, 20) + '...')
    
    // 1. 기본 연결 테스트
    const { data: authData, error: authError } = await supabase.auth.getUser()
    console.log('👤 Auth status:', {
      hasUser: \!\!authData?.user,
      userId: authData?.user?.id,
      error: authError?.message
    })
    
    // 2. 월드컵 조회 테스트 (로그인 없이)
    console.log('📋 Testing worldcups query...')
    const { data: worldcups, error: worldcupsError } = await supabase
      .from('worldcups')
      .select('id, title, author_id')
      .limit(5)
    
    console.log('📊 Worldcups query result:', {
      hasData: \!\!worldcups,
      count: worldcups?.length || 0,
      error: worldcupsError?.message,
      errorCode: worldcupsError?.code,
      sample: worldcups?.[0] ? {
        id: worldcups[0].id,
        title: worldcups[0].title
      } : null
    })
    
    // 3. 특정 월드컵 조회 테스트
    if (worldcups && worldcups.length > 0) {
      const testId = worldcups[0].id
      console.log('🔍 Testing specific worldcup query:', testId)
      
      const { data: specificWorldcup, error: specificError } = await supabase
        .from('worldcups')
        .select('id, author_id')
        .eq('id', testId)
        .maybeSingle()
      
      console.log('🎯 Specific worldcup result:', {
        hasData: \!\!specificWorldcup,
        error: specificError?.message,
        data: specificWorldcup
      })
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

testSupabaseConnection()
EOF < /dev/null