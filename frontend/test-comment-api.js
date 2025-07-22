const fetch = require('node-fetch');
require('dotenv').config({ path: '.env.local' });

const testCommentAPI = async () => {
  const testWorldcupId = '3e9f3b80-9702-40a4-8e6b-ae4e02e80ac1';
  const apiUrl = `http://localhost:3001/api/worldcups/${testWorldcupId}/comments`;
  
  console.log('🧪 Testing Comment API...');
  console.log('URL:', apiUrl);
  
  try {
    // Test POST request (create comment)
    console.log('\n📝 Testing POST (create comment)...');
    const postResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: 'Test comment from API test',
        guestName: 'API Test User'
      })
    });
    
    console.log('POST Response status:', postResponse.status);
    console.log('POST Response headers:', Object.fromEntries(postResponse.headers.entries()));
    
    const postResult = await postResponse.text();
    console.log('POST Response body:', postResult);
    
    // Test GET request (fetch comments)
    console.log('\n📖 Testing GET (fetch comments)...');
    const getResponse = await fetch(apiUrl);
    
    console.log('GET Response status:', getResponse.status);
    const getResult = await getResponse.text();
    console.log('GET Response body:', getResult);
    
  } catch (error) {
    console.error('❌ API Test Error:', error);
  }
};

testCommentAPI();