import { supabase } from '@/lib/supabase';

// 연결 상태 관리
let isConnected = true;
let reconnectAttempts = 0;
const maxReconnectAttempts = 3;
const reconnectDelay = 2000; // 2초

// 연결 상태 확인 함수
export const checkConnection = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('worldcups')
      .select('id')
      .limit(1);
    
    if (!error) {
      isConnected = true;
      reconnectAttempts = 0;
      return true;
    } else {
      console.warn('Supabase connection check failed:', error);
      isConnected = false;
      return false;
    }
  } catch (error) {
    console.warn('Supabase connection check error:', error);
    isConnected = false;
    return false;
  }
};

// 재연결 시도 함수
export const attemptReconnection = async (): Promise<boolean> => {
  if (reconnectAttempts >= maxReconnectAttempts) {
    console.error('Max reconnection attempts reached');
    return false;
  }

  reconnectAttempts++;
  console.log(`Attempting Supabase reconnection (${reconnectAttempts}/${maxReconnectAttempts})...`);

  // 잠시 대기 후 재연결 시도
  await new Promise(resolve => setTimeout(resolve, reconnectDelay * reconnectAttempts));

  const connected = await checkConnection();
  if (connected) {
    console.log('✅ Supabase reconnection successful');
    return true;
  } else {
    console.warn(`❌ Reconnection attempt ${reconnectAttempts} failed`);
    return false;
  }
};

// 재시도 가능한 Supabase 쿼리 래퍼
export const withRetry = async <T>(
  queryFn: () => Promise<T>,
  operation: string = 'Supabase operation'
): Promise<T> => {
  let lastError: any;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const result = await queryFn();
      
      // 성공 시 연결 상태 업데이트
      if (!isConnected) {
        isConnected = true;
        reconnectAttempts = 0;
        console.log('✅ Supabase connection restored');
      }
      
      return result;
    } catch (error: any) {
      lastError = error;
      console.warn(`${operation} failed (attempt ${attempt}/3):`, error);

      // 연결 문제로 보이는 경우 재연결 시도
      if (error.message?.includes('timeout') || 
          error.message?.includes('network') ||
          error.message?.includes('connection')) {
        
        isConnected = false;
        
        if (attempt < 3) {
          console.log('🔄 Attempting reconnection...');
          await attemptReconnection();
          
          // 재연결 후 잠시 대기
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } else {
        // 연결 문제가 아닌 다른 에러면 즉시 throw
        throw error;
      }
    }
  }

  // 모든 재시도 실패
  throw lastError;
};

// 페이지 포커스/탭 변경 시 연결 확인 및 복구
export const handlePageVisibilityChange = async (): Promise<void> => {
  if (document.hidden) {
    // 페이지가 숨겨질 때
    console.log('📱 Page hidden, pausing connection monitoring');
    return;
  }

  // 페이지가 다시 보일 때
  console.log('👁️ Page visible, checking Supabase connection...');
  
  const connected = await checkConnection();
  if (!connected) {
    console.warn('⚠️ Supabase connection lost, attempting reconnection...');
    const reconnected = await attemptReconnection();
    
    if (!reconnected) {
      console.error('❌ Failed to reconnect to Supabase');
      // 사용자에게 알림 (선택적)
      console.log('🔄 Consider refreshing the page for best experience');
    }
  } else {
    console.log('✅ Supabase connection is healthy');
  }
};


// 현재 연결 상태 가져오기
export const getConnectionStatus = (): boolean => isConnected;