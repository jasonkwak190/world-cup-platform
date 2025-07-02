// 사용자 인증 관련 유틸리티 함수

import type { User, SignupData, LoginData } from '@/types/user';

// 패스워드 해싱 (간단한 방식 - 실제로는 bcrypt 등 사용 권장)
function hashPassword(password: string): string {
  // 간단한 해싱 (실제 운영에서는 bcrypt 사용)
  return btoa(password + 'worldcup_salt_2025');
}

// 패스워드 검증
function verifyPassword(password: string, hashedPassword: string): boolean {
  return hashPassword(password) === hashedPassword;
}

// 이메일 유효성 검사
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// 사용자명 유효성 검사
export function validateUsername(username: string): boolean {
  return username.length >= 2 && username.length <= 20 && /^[a-zA-Z0-9가-힣_]+$/.test(username);
}

// 패스워드 유효성 검사
export function validatePassword(password: string): boolean {
  return password.length >= 6;
}

// LocalStorage에서 사용자 목록 가져오기
export function getStoredUsers(): Array<User & { password: string }> {
  try {
    const users = localStorage.getItem('users');
    return users ? JSON.parse(users) : [];
  } catch (error) {
    console.error('Error loading users:', error);
    return [];
  }
}

// LocalStorage에 사용자 저장
export function saveUser(userData: User & { password: string }): void {
  try {
    const users = getStoredUsers();
    users.push(userData);
    localStorage.setItem('users', JSON.stringify(users));
  } catch (error) {
    console.error('Error saving user:', error);
    throw new Error('사용자 저장 중 오류가 발생했습니다.');
  }
}

// 회원가입
export function signup(signupData: SignupData): { success: boolean; error?: string; user?: User } {
  try {
    // 유효성 검사
    if (!validateEmail(signupData.email)) {
      return { success: false, error: '올바른 이메일 주소를 입력해주세요.' };
    }
    
    if (!validateUsername(signupData.username)) {
      return { success: false, error: '사용자명은 2-20자의 한글, 영문, 숫자, 언더스코어만 가능합니다.' };
    }
    
    if (!validatePassword(signupData.password)) {
      return { success: false, error: '비밀번호는 최소 6자 이상이어야 합니다.' };
    }
    
    if (signupData.password !== signupData.confirmPassword) {
      return { success: false, error: '비밀번호가 일치하지 않습니다.' };
    }

    // 중복 검사
    const existingUsers = getStoredUsers();
    
    if (existingUsers.some(user => user.email === signupData.email)) {
      return { success: false, error: '이미 사용 중인 이메일입니다.' };
    }
    
    if (existingUsers.some(user => user.username === signupData.username)) {
      return { success: false, error: '이미 사용 중인 사용자명입니다.' };
    }

    // 새 사용자 생성
    const newUser: User & { password: string } = {
      id: Date.now().toString(),
      username: signupData.username,
      email: signupData.email,
      password: hashPassword(signupData.password),
      role: existingUsers.length === 0 ? 'admin' : 'user', // 첫 번째 사용자는 관리자
      createdAt: new Date().toISOString(),
    };

    // 저장
    saveUser(newUser);

    // 비밀번호 제외하고 반환
    const { password: _, ...userWithoutPassword } = newUser;
    return { success: true, user: userWithoutPassword };

  } catch (error) {
    console.error('Signup error:', error);
    return { success: false, error: '회원가입 중 오류가 발생했습니다.' };
  }
}

// 로그인
export function login(loginData: LoginData): { success: boolean; error?: string; user?: User } {
  try {
    const users = getStoredUsers();
    const user = users.find(u => u.email === loginData.email);

    if (!user) {
      return { success: false, error: '등록되지 않은 이메일입니다.' };
    }

    if (!verifyPassword(loginData.password, user.password)) {
      return { success: false, error: '비밀번호가 틀렸습니다.' };
    }

    // 현재 사용자 세션 저장
    const { password: _, ...userWithoutPassword } = user;
    localStorage.setItem('currentUser', JSON.stringify(userWithoutPassword));

    return { success: true, user: userWithoutPassword };

  } catch (error) {
    console.error('Login error:', error);
    return { success: false, error: '로그인 중 오류가 발생했습니다.' };
  }
}

// 로그아웃
export function logout(): void {
  localStorage.removeItem('currentUser');
}

// 현재 로그인된 사용자 가져오기
export function getCurrentUser(): User | null {
  try {
    const user = localStorage.getItem('currentUser');
    return user ? JSON.parse(user) : null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

// 사용자 정보 업데이트
export function updateUserProfile(userId: string, updates: Partial<User>): { success: boolean; error?: string; user?: User } {
  try {
    const users = getStoredUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) {
      return { success: false, error: '사용자를 찾을 수 없습니다.' };
    }

    // 사용자 정보 업데이트
    const updatedUser = { ...users[userIndex], ...updates };
    users[userIndex] = updatedUser;
    
    // 저장
    localStorage.setItem('users', JSON.stringify(users));
    
    // 현재 로그인된 사용자가 업데이트된 사용자라면 세션도 업데이트
    const currentUser = getCurrentUser();
    if (currentUser && currentUser.id === userId) {
      const { password: _, ...userWithoutPassword } = updatedUser;
      localStorage.setItem('currentUser', JSON.stringify(userWithoutPassword));
      return { success: true, user: userWithoutPassword };
    }
    
    const { password: __, ...userWithoutPassword } = updatedUser;
    return { success: true, user: userWithoutPassword };
    
  } catch (error) {
    console.error('Update user profile error:', error);
    return { success: false, error: '사용자 정보 업데이트 중 오류가 발생했습니다.' };
  }
}

// 관리자 권한 확인
export function isAdmin(user: User | null): boolean {
  return user?.role === 'admin';
}

// 월드컵 생성 권한 확인
export function canCreateWorldCup(user: User | null): boolean {
  return user !== null; // 로그인된 사용자만 생성 가능
}