# 🔧 코드 수정 가이드

## 1. 댓글 시스템 변경

### Before (기존)
```typescript
// comment_likes 테이블 사용
await supabase.from('comment_likes').insert({
  user_id: userId,
  comment_id: commentId
});
```

### After (개선)
```typescript
// user_interactions 테이블 사용
await supabase.from('user_interactions').insert({
  user_id: userId,
  target_type: 'comment',
  target_id: commentId,
  interaction_type: 'like'
});
```

## 2. 월드컵 좋아요/북마크 변경

### Before (기존)
```typescript
// 좋아요
await supabase.from('worldcup_likes').insert({
  user_id: userId,
  worldcup_id: worldcupId
});

// 북마크
await supabase.from('worldcup_bookmarks').insert({
  user_id: userId,
  worldcup_id: worldcupId
});
```

### After (개선)
```typescript
// 좋아요
await supabase.from('user_interactions').insert({
  user_id: userId,
  target_type: 'worldcup',
  target_id: worldcupId,
  interaction_type: 'like'
});

// 북마크
await supabase.from('user_interactions').insert({
  user_id: userId,
  target_type: 'worldcup',
  target_id: worldcupId,
  interaction_type: 'bookmark'
});
```

## 3. 댓글 테이블 변경

### Before (기존)
```typescript
// worldcup_comments 테이블
const { data } = await supabase
  .from('worldcup_comments')
  .select(`
    *,
    user:user_id(username)
  `);
```

### After (개선)
```typescript
// comments 테이블 (author_id로 변경)
const { data } = await supabase
  .from('comments')
  .select(`
    *,
    author:author_id(username)
  `);
```

## 4. 카테고리 시스템 변경

### Before (기존)
```typescript
// 하드코딩된 카테고리
const category = 'entertainment';
```

### After (개선)
```typescript
// categories 테이블 참조
const { data: categories } = await supabase
  .from('categories')
  .select('*')
  .eq('is_active', true)
  .order('display_order');
```

## 5. 수정해야 할 파일들

### 🔧 Utils 파일들
- `/src/utils/comments.ts` ✅ (이미 수정됨)
- `/src/utils/userInteractions.ts` (새로 생성 필요)
- `/src/utils/worldcups.ts` (수정 필요)
- `/src/utils/categories.ts` (새로 생성 필요)

### 🎨 컴포넌트 파일들
- `/src/components/CommentSystem.tsx` ✅ (이미 수정됨)
- `/src/components/WorldCupCard.tsx` (수정 필요)
- `/src/components/CategoryFilter.tsx` (수정 필요)

### 📊 타입 정의
- `/src/types/database.ts` (수정 필요)
- `/src/types/comment.ts` ✅ (이미 정의됨)
- `/src/types/interaction.ts` (새로 생성 필요)
- `/src/types/category.ts` (새로 생성 필요)

### 🔌 API 라우트
- `/src/app/api/` 하위 모든 API (수정 필요)

## 6. 우선순위별 수정 계획

### Phase 1: 핵심 기능 (고우선순위)
1. `user_interactions` 유틸리티 함수 생성
2. 댓글 좋아요 시스템 수정
3. 월드컵 좋아요/북마크 시스템 수정

### Phase 2: 부가 기능 (중우선순위)
1. 카테고리 시스템 구현
2. 검색 기능 개선
3. 통계 시스템 업데이트

### Phase 3: 새로운 기능 (저우선순위)
1. 팔로우 시스템 구현
2. 알림 시스템 구현
3. 게임 세션 관리 시스템

## 7. 마이그레이션 체크리스트

- [ ] 백업 생성 완료
- [ ] 새 테이블 생성 완료
- [ ] 데이터 마이그레이션 완료
- [ ] 코드 업데이트 완료
- [ ] 테스트 수행 완료
- [ ] 운영 환경 배포
- [ ] 기존 테이블 정리