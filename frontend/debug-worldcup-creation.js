// Debug script to check worldcup creation process
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://rctoxfcyzzsiikopbsne.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjdG94ZmN5enpzaWlrb3Bic25lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5NTAwMDksImV4cCI6MjA2NjUyNjAwOX0.moYSDe7kRAkbnhPr_9V5nE_t_TvGAtBy6Uk3O7aXep4'

const supabase = createClient(supabaseUrl, supabaseKey)

async function debugWorldCupCreation() {
  console.log('🔍 Debugging WorldCup Creation Process...')
  
  try {
    // 1. Check authentication
    console.log('\n1. 🔐 Checking Authentication...')
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError) {
      console.log('❌ Auth Error:', authError)
      console.log('🔑 Need to authenticate - this is expected if not logged in')
      return
    }
    
    if (user) {
      console.log('✅ User authenticated:', user.id)
      console.log('   Email:', user.email)
    } else {
      console.log('❌ No user found - need to login first')
      return
    }

    // 2. Check recent worldcups
    console.log('\n2. 📋 Checking Recent WorldCups...')
    const { data: worldcups, error: worldcupsError } = await supabase
      .from('worldcups')
      .select('id, title, author_id, created_at, participants, likes, comments')
      .order('created_at', { ascending: false })
      .limit(10)

    if (worldcupsError) {
      console.log('❌ WorldCups Query Error:', worldcupsError)
    } else {
      console.log(`✅ Found ${worldcups.length} recent worldcups:`)
      worldcups.forEach((wc, index) => {
        console.log(`   ${index + 1}. "${wc.title}" (ID: ${wc.id})`)
        console.log(`      Author: ${wc.author_id}`)
        console.log(`      Created: ${wc.created_at}`)
        console.log(`      Stats: ${wc.participants} plays, ${wc.likes} likes, ${wc.comments} comments`)
      })
    }

    // 3. Check user's worldcups
    console.log('\n3. 👤 Checking User\'s WorldCups...')
    const { data: userWorldcups, error: userWorldcupsError } = await supabase
      .from('worldcups')
      .select('id, title, created_at, participants, likes, comments')
      .eq('author_id', user.id)
      .order('created_at', { ascending: false })

    if (userWorldcupsError) {
      console.log('❌ User WorldCups Query Error:', userWorldcupsError)
    } else {
      console.log(`✅ User has ${userWorldcups.length} worldcups:`)
      if (userWorldcups.length === 0) {
        console.log('   🚨 USER HAS NO WORLDCUPS - This might be the issue!')
      } else {
        userWorldcups.forEach((wc, index) => {
          console.log(`   ${index + 1}. "${wc.title}" (ID: ${wc.id})`)
          console.log(`      Created: ${wc.created_at}`)
          console.log(`      Stats: ${wc.participants} plays, ${wc.likes} likes, ${wc.comments} comments`)
        })
      }
    }

    // 4. Test worldcup creation API endpoint
    console.log('\n4. 🧪 Testing WorldCup Creation API...')
    
    const testData = {
      title: "테스트 월드컵 " + new Date().toLocaleTimeString(),
      description: "디버깅용 테스트 월드컵입니다",
      category: "test",
      isPublic: true,
      items: [
        {
          title: "아이템 1",
          description: "첫 번째 테스트 아이템",
          imageUrl: "https://via.placeholder.com/300x300/ff0000/ffffff?text=Item+1",
          mediaType: "image",
          orderIndex: 0
        },
        {
          title: "아이템 2", 
          description: "두 번째 테스트 아이템",
          imageUrl: "https://via.placeholder.com/300x300/00ff00/ffffff?text=Item+2",
          mediaType: "image",
          orderIndex: 1
        },
        {
          title: "아이템 3",
          description: "세 번째 테스트 아이템", 
          imageUrl: "https://via.placeholder.com/300x300/0000ff/ffffff?text=Item+3",
          mediaType: "image",
          orderIndex: 2
        },
        {
          title: "아이템 4",
          description: "네 번째 테스트 아이템",
          imageUrl: "https://via.placeholder.com/300x300/ffff00/000000?text=Item+4", 
          mediaType: "image",
          orderIndex: 3
        }
      ]
    }

    console.log('📤 Attempting to create test worldcup...')
    
    // Get session for auth header
    const { data: { session } } = await supabase.auth.getSession()
    
    const response = await fetch('http://localhost:3000/api/worldcups/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`
      },
      body: JSON.stringify(testData)
    })

    const result = await response.json()
    
    if (response.ok) {
      console.log('✅ Test WorldCup created successfully!')
      console.log('   Result:', result)
    } else {
      console.log('❌ Test WorldCup creation failed!')
      console.log('   Status:', response.status)
      console.log('   Error:', result)
    }

    // 5. Check worldcup items
    console.log('\n5. 📝 Checking WorldCup Items...')
    if (userWorldcups.length > 0) {
      const firstWorldcup = userWorldcups[0]
      const { data: items, error: itemsError } = await supabase
        .from('worldcup_items')
        .select('id, title, media_type, image_url, video_url')
        .eq('worldcup_id', firstWorldcup.id)
        .order('order_index')

      if (itemsError) {
        console.log('❌ Items Query Error:', itemsError)
      } else {
        console.log(`✅ WorldCup "${firstWorldcup.title}" has ${items.length} items:`)
        items.forEach((item, index) => {
          console.log(`   ${index + 1}. "${item.title}" (${item.media_type})`)
          console.log(`      Image: ${item.image_url || 'None'}`)
          console.log(`      Video: ${item.video_url || 'None'}`)
        })
      }
    }

    // 6. Check database schema
    console.log('\n6. 🗄️  Checking Database Schema...')
    
    // Check worldcups table structure
    const { data: worldcupsSchema, error: worldcupsSchemaError } = await supabase
      .from('worldcups')
      .select('*')
      .limit(1)

    if (worldcupsSchemaError) {
      console.log('❌ WorldCups Schema Error:', worldcupsSchemaError)
    } else {
      console.log('✅ WorldCups table accessible')
      if (worldcupsSchema.length > 0) {
        console.log('   Columns:', Object.keys(worldcupsSchema[0]).join(', '))
      }
    }

    // Check worldcup_items table structure  
    const { data: itemsSchema, error: itemsSchemaError } = await supabase
      .from('worldcup_items')
      .select('*')
      .limit(1)

    if (itemsSchemaError) {
      console.log('❌ WorldCup Items Schema Error:', itemsSchemaError)
    } else {
      console.log('✅ WorldCup Items table accessible')
      if (itemsSchema.length > 0) {
        console.log('   Columns:', Object.keys(itemsSchema[0]).join(', '))
      }
    }

  } catch (error) {
    console.error('🚨 Debug script error:', error)
  }
}

// Run the debug function
debugWorldCupCreation()