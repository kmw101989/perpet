# Supabase RLS 정책 설정 가이드

## 문제
`new row violates row-level security policy for table "users"` 오류가 발생합니다.

## 해결 방법

### 방법 1: Supabase Dashboard에서 RLS 정책 설정 (권장)

1. Supabase Dashboard 접속: https://supabase.com/dashboard
2. 프로젝트 선택
3. 왼쪽 메뉴에서 **Authentication** > **Policies** 클릭
4. `users` 테이블 선택
5. **New Policy** 클릭
6. 다음 설정으로 정책 생성:

**정책 이름**: `Allow public insert`
**정책 타입**: `INSERT`
**정책 정의**: 
```sql
CREATE POLICY "Allow public insert" ON "public"."users"
FOR INSERT
TO public
WITH CHECK (true);
```

또는 더 간단하게:

**정책 이름**: `Enable insert for all users`
**정책 타입**: `INSERT`
**정책 정의**:
```sql
CREATE POLICY "Enable insert for all users" ON "public"."users"
FOR INSERT
WITH CHECK (true);
```

### 방법 2: SQL Editor에서 직접 실행

1. Supabase Dashboard > **SQL Editor** 클릭
2. 다음 SQL 실행:

```sql
-- users 테이블에 INSERT 정책 추가
CREATE POLICY "Allow public insert on users" 
ON "public"."users"
FOR INSERT
TO public
WITH CHECK (true);

-- SELECT 정책도 필요할 수 있음
CREATE POLICY "Allow public select on users" 
ON "public"."users"
FOR SELECT
TO public
USING (true);
```

### 방법 3: RLS 비활성화 (개발 환경만, 권장하지 않음)

⚠️ **주의**: 프로덕션 환경에서는 사용하지 마세요!

```sql
-- RLS 비활성화 (개발/테스트용만)
ALTER TABLE "public"."users" DISABLE ROW LEVEL SECURITY;
```

## 확인 방법

정책이 제대로 설정되었는지 확인:

```sql
-- users 테이블의 정책 확인
SELECT * FROM pg_policies WHERE tablename = 'users';
```

## 추가 참고사항

- `users` 테이블 외에 `pets` 테이블에도 동일한 정책이 필요할 수 있습니다.
- 프로덕션 환경에서는 더 엄격한 정책을 설정하는 것이 좋습니다 (예: 인증된 사용자만 INSERT 허용).


