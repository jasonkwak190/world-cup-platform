#!/usr/bin/env node
/**
 * Vote API 테스트 스크립트
 * 
 * 이 스크립트는 tournament-game의 voting API가 제대로 작동하는지 테스트합니다.
 */

const worldcupId = '7523a34a-0f7e-4447-89c1-8ea03b6c9fe3'; // 실제 월드컵 ID로 변경

console.log('🧪 Vote API 테스트 시작');
console.log('='.repeat(50));

async function testVoteAPI() {
  const baseUrl = 'http://localhost:3000'; // Dev server default port
  
  try {
    console.log('\n1️⃣ 월드컵 정보 확인...');
    const worldcupResponse = await fetch(`${baseUrl}/api/worldcups/${worldcupId}`);
    
    if (!worldcupResponse.ok) {
      console.error('❌ 월드컵 정보 가져오기 실패:', worldcupResponse.status);
      return;
    }
    
    const worldcupData = await worldcupResponse.json();
    console.log('✅ 월드컵 정보 확인됨:', worldcupData.worldcup?.title);
    
    if (!worldcupData.worldcup?.items || worldcupData.worldcup.items.length < 2) {
      console.error('❌ 월드컵에 아이템이 부족합니다. 최소 2개 필요');
      return;
    }
    
    const items = worldcupData.worldcup.items;
    console.log(`✅ 아이템 개수: ${items.length}개`);
    
    console.log('\n2️⃣ 투표 API 테스트...');
    
    // 테스트 케이스 1: 정상적인 투표 (winner와 loser 모두)
    const testVote1 = {
      winnerId: items[0].id,
      loserId: items[1].id,
      roundType: '16'
    };
    
    console.log('테스트 1: 정상 투표 (winner + loser)');
    console.log('데이터:', testVote1);
    
    const voteResponse1 = await fetch(`${baseUrl}/api/worldcups/${worldcupId}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testVote1)
    });
    
    const voteResult1 = await voteResponse1.json();
    
    if (voteResponse1.ok) {
      console.log('✅ 테스트 1 성공:', voteResult1);
    } else {
      console.log('❌ 테스트 1 실패:', voteResponse1.status, voteResult1);
    }
    
    // 테스트 케이스 2: 결승전 투표 (winner만)
    if (items.length >= 3) {
      console.log('\n테스트 2: 결승전 투표 (winner만)');
      const testVote2 = {
        winnerId: items[2].id,
        roundType: 'final'
      };
      
      console.log('데이터:', testVote2);
      
      const voteResponse2 = await fetch(`${baseUrl}/api/worldcups/${worldcupId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testVote2)
      });
      
      const voteResult2 = await voteResponse2.json();
      
      if (voteResponse2.ok) {
        console.log('✅ 테스트 2 성공:', voteResult2);
      } else {
        console.log('❌ 테스트 2 실패:', voteResponse2.status, voteResult2);
      }
    }
    
    // 테스트 케이스 3: 잘못된 아이템 ID
    console.log('\n테스트 3: 잘못된 아이템 ID');
    const testVote3 = {
      winnerId: '00000000-0000-0000-0000-000000000000',
      loserId: items[0].id,
      roundType: '8'
    };
    
    console.log('데이터:', testVote3);
    
    const voteResponse3 = await fetch(`${baseUrl}/api/worldcups/${worldcupId}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testVote3)
    });
    
    const voteResult3 = await voteResponse3.json();
    
    if (voteResponse3.ok) {
      console.log('⚠️ 테스트 3: 예상과 다름 (성공해서는 안됨):', voteResult3);
    } else {
      console.log('✅ 테스트 3 성공 (에러 예상됨):', voteResponse3.status, voteResult3);
    }
    
    console.log('\n3️⃣ 투표 통계 확인...');
    const statsResponse = await fetch(`${baseUrl}/api/worldcups/${worldcupId}/vote`);
    
    if (statsResponse.ok) {
      const statsData = await statsResponse.json();
      console.log('✅ 투표 통계 확인:', {
        totalVotes: statsData.totalVotes,
        itemStatsCount: statsData.itemStats?.length || 0
      });
    } else {
      const statsError = await statsResponse.json();
      console.log('❌ 투표 통계 실패:', statsResponse.status, statsError);
    }
    
  } catch (error) {
    console.error('❌ 테스트 중 오류:', error.message);
  }
}

console.log(`🎯 월드컵 ID: ${worldcupId}`);
console.log('💡 테스트 전에 다음을 확인하세요:');
console.log('1. 개발 서버가 실행 중인지 (npm run dev)');
console.log('2. worldcup_votes 테이블이 생성되었는지');
console.log('3. 해당 월드컵 ID가 존재하는지');

// 실행
testVoteAPI().then(() => {
  console.log('\n🏁 테스트 완료');
}).catch(error => {
  console.error('\n💥 테스트 실행 실패:', error);
});