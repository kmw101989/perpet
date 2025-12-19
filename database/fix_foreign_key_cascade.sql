-- Supabase에서 외래키 제약조건을 CASCADE DELETE로 변경하는 SQL 스크립트
-- 
-- 사용 방법:
-- 1. Supabase Dashboard > SQL Editor로 이동
-- 2. 아래 SQL을 실행
-- 3. 기존 외래키 제약조건을 삭제하고 CASCADE DELETE로 재생성

-- 1. 기존 외래키 제약조건 확인
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.delete_rule
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints AS rc
  ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'pets'
  AND kcu.column_name = 'user_id';

-- 2. 기존 외래키 제약조건 삭제 (제약조건 이름을 위 쿼리 결과에서 확인 후 변경)
-- 예시: ALTER TABLE pets DROP CONSTRAINT IF EXISTS pets_user_id_fkey;

-- 3. CASCADE DELETE로 외래키 제약조건 재생성
ALTER TABLE pets
DROP CONSTRAINT IF EXISTS pets_user_id_fkey;

ALTER TABLE pets
ADD CONSTRAINT pets_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES users(user_id)
ON DELETE CASCADE;

-- 4. 확인: 제약조건이 CASCADE로 설정되었는지 확인
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.delete_rule
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints AS rc
  ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'pets'
  AND kcu.column_name = 'user_id';

-- delete_rule이 'CASCADE'로 표시되면 성공!


