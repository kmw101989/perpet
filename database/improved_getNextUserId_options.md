# user_id 최대값 구하기 개선 방안

## 현재 상황
- `user_id`가 **text 타입**
- 값은 숫자 형태 (1, 2, 3, ..., 10)
- 순서가 정렬되어 있지 않음 (text 정렬: 1, 10, 2, 3...)

## 추천 방법 (우선순위 순)

### 방법 1: SQL MAX 함수 직접 사용 (⭐ 가장 권장)

**장점:**
- 가장 효율적 (인덱스 활용 가능)
- text 타입이어도 숫자로 변환하여 정확한 최대값 구함
- 코드가 간단함

**구현:**
```javascript
async getNextUserId() {
  const client = await getSupabaseClient();
  
  // RPC 함수 사용 (get_max_user_id_rpc.sql 실행 필요)
  const { data, error } = await client.rpc('get_max_user_id');
  
  if (error) {
    console.error('Error fetching max user_id:', error);
    return '1';
  }
  
  const maxId = data || 0;
  return String(maxId + 1);
}
```

**또는 직접 쿼리:**
```javascript
async getNextUserId() {
  const client = await getSupabaseClient();
  
  // 모든 user_id를 가져와서 JavaScript에서 최대값 계산
  const { data, error } = await client
    .from('users')
    .select('user_id');
  
  if (error || !data || data.length === 0) {
    return '1';
  }
  
  // 숫자로 변환 가능한 것만 필터링하고 최대값 구하기
  const numericIds = data
    .map(u => parseInt(u.user_id))
    .filter(id => !isNaN(id) && id > 0);
  
  const maxId = numericIds.length > 0 ? Math.max(...numericIds) : 0;
  return String(maxId + 1);
}
```

---

### 방법 2: 현재 방식 개선 (text 정렬 문제 해결)

**장점:**
- 기존 코드 구조 유지
- 숫자로 변환하여 정확한 정렬

**구현:**
```javascript
async getNextUserId() {
  const client = await getSupabaseClient();
  
  // 모든 user_id를 가져와서 JavaScript에서 정렬
  const { data, error } = await client
    .from('users')
    .select('user_id');
  
  if (error || !data || data.length === 0) {
    return '1';
  }
  
  // 숫자로 변환하여 정렬 (text 정렬 문제 해결)
  const sortedIds = data
    .map(u => parseInt(u.user_id))
    .filter(id => !isNaN(id) && id > 0)
    .sort((a, b) => b - a); // 내림차순
  
  const maxId = sortedIds.length > 0 ? sortedIds[0] : 0;
  return String(maxId + 1);
}
```

---

### 방법 3: 데이터베이스 마이그레이션 후 개선 (장기적 해결)

**장점:**
- 근본적인 해결 (타입 문제 해결)
- 성능 최적화 가능
- 외래키 제약조건 정상 작동

**단점:**
- 마이그레이션 작업 필요
- 기존 데이터 변환 필요

**절차:**
1. `migrate_user_id_to_bigint_safe.sql` 실행
2. 이후 방법 1 또는 간단한 MAX 쿼리 사용

```javascript
// bigint로 변경 후
async getNextUserId() {
  const client = await getSupabaseClient();
  
  const { data, error } = await client
    .from('users')
    .select('user_id')
    .order('user_id', { ascending: false })
    .limit(1)
    .single();
  
  if (error || !data) {
    return 1; // 숫자로 반환
  }
  
  return data.user_id + 1; // bigint이므로 직접 +1
}
```

---

## 비교표

| 방법 | 효율성 | 구현 난이도 | 타입 문제 해결 | 추천도 |
|------|--------|------------|---------------|--------|
| 방법 1 (SQL MAX) | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| 방법 2 (JS 정렬) | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| 방법 3 (마이그레이션) | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |

## 최종 추천

**단기적 (즉시 적용 가능):**
→ **방법 1 (SQL MAX 함수 직접 사용)** - RPC 함수 또는 JavaScript에서 모든 데이터 가져와서 최대값 계산

**장기적 (근본적 해결):**
→ **방법 3 (데이터베이스 마이그레이션)** - text → bigint 변경 후 간단한 MAX 쿼리 사용

