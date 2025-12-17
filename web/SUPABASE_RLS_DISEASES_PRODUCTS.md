# Supabase RLS 정책 설정 가이드

## 문제
`diseases` 테이블과 `products` 테이블에서 데이터를 조회할 수 없습니다.
콘솔에 `diseases 테이블 전체 데이터: []`가 표시되고 제품도 조회되지 않습니다.

## 해결 방법

Supabase Dashboard > SQL Editor에서 다음 SQL 명령어를 실행하세요:

### 1. diseases 테이블 RLS 정책 설정

```sql
-- diseases 테이블에 대한 SELECT 정책 추가 (모든 사용자가 조회 가능)
CREATE POLICY "Allow public read access on diseases"
ON public.diseases
FOR SELECT
USING (true);
```

### 2. products 테이블 RLS 정책 설정

```sql
-- products 테이블에 대한 SELECT 정책 추가 (모든 사용자가 조회 가능)
CREATE POLICY "Allow public read access on products"
ON public.products
FOR SELECT
USING (true);
```

### 3. RLS 활성화 확인

```sql
-- RLS가 활성화되어 있는지 확인
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('diseases', 'products');
```

`rowsecurity`가 `true`이면 RLS가 활성화되어 있습니다.

### 4. 기존 정책 확인

```sql
-- diseases 테이블의 기존 정책 확인
SELECT * FROM pg_policies WHERE tablename = 'diseases';

-- products 테이블의 기존 정책 확인
SELECT * FROM pg_policies WHERE tablename = 'products';
```

### 5. 정책이 이미 있는 경우

정책이 이미 있다면 삭제 후 다시 생성하세요:

```sql
-- 기존 정책 삭제 (정책 이름은 실제 이름으로 변경)
DROP POLICY IF EXISTS "Allow public read access on diseases" ON public.diseases;
DROP POLICY IF EXISTS "Allow public read access on products" ON public.products;

-- 새 정책 생성
CREATE POLICY "Allow public read access on diseases"
ON public.diseases
FOR SELECT
USING (true);

CREATE POLICY "Allow public read access on products"
ON public.products
FOR SELECT
USING (true);
```

## 참고

- 이 정책은 모든 사용자가 `diseases`와 `products` 테이블을 조회할 수 있도록 합니다.
- 프로덕션 환경에서는 더 엄격한 정책을 설정하는 것을 권장합니다.
- 현재는 데모/테스트 환경이므로 공개 조회가 허용됩니다.




