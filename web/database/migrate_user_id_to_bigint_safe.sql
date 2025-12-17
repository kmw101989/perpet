-- 안전한 마이그레이션 스크립트 (단계별 실행)
-- 각 단계를 순서대로 실행하고 결과를 확인한 후 다음 단계로 진행하세요.

-- ============================================
-- STEP 1: 현재 상태 확인
-- ============================================
-- 실행 전에 현재 상태를 확인하세요
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE column_name = 'user_id'
ORDER BY table_name;

-- 외래키 제약조건 확인
SELECT
    tc.table_name,
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND (kcu.column_name = 'user_id' OR ccu.column_name = 'user_id');

-- ============================================
-- STEP 2: 외래키 제약조건 삭제
-- ============================================
-- pets 테이블의 외래키 제약조건 삭제
ALTER TABLE IF EXISTS pets DROP CONSTRAINT IF EXISTS pets_user_id_fkey;

-- 다른 테이블의 외래키도 확인 후 삭제 (필요한 경우)
-- 예시:
-- ALTER TABLE IF EXISTS reservations DROP CONSTRAINT IF EXISTS reservations_user_id_fkey;
-- ALTER TABLE IF EXISTS orders DROP CONSTRAINT IF EXISTS orders_user_id_fkey;

-- ============================================
-- STEP 3: 데이터 검증 (중요!)
-- ============================================
-- user_id가 숫자로 변환 가능한지 확인
-- 변환 불가능한 데이터가 있다면 먼저 수정해야 합니다

-- users 테이블 확인
SELECT user_id, 
       CASE 
           WHEN user_id ~ '^[0-9]+$' THEN 'OK'
           ELSE 'INVALID - Not numeric'
       END AS validation_status
FROM users
WHERE user_id !~ '^[0-9]+$';

-- pets 테이블 확인
SELECT user_id, 
       CASE 
           WHEN user_id ~ '^[0-9]+$' THEN 'OK'
           ELSE 'INVALID - Not numeric'
       END AS validation_status
FROM pets
WHERE user_id !~ '^[0-9]+$';

-- ============================================
-- STEP 4: 컬럼 타입 변경
-- ============================================
-- users 테이블 먼저 변경 (참조되는 테이블)
ALTER TABLE users 
ALTER COLUMN user_id TYPE bigint USING user_id::bigint;

-- pets 테이블 변경 (참조하는 테이블)
ALTER TABLE pets 
ALTER COLUMN user_id TYPE bigint USING user_id::bigint;

-- 다른 테이블도 변경 (필요한 경우)
-- 예시:
-- ALTER TABLE reservations ALTER COLUMN user_id TYPE bigint USING user_id::bigint;

-- ============================================
-- STEP 5: 외래키 제약조건 재생성
-- ============================================
ALTER TABLE pets 
ADD CONSTRAINT pets_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES users(user_id) 
ON DELETE CASCADE;

-- 다른 테이블의 외래키도 재생성 (필요한 경우)
-- 예시:
-- ALTER TABLE reservations 
-- ADD CONSTRAINT reservations_user_id_fkey 
-- FOREIGN KEY (user_id) REFERENCES users(user_id) 
-- ON DELETE CASCADE;

-- ============================================
-- STEP 6: 인덱스 생성 (성능 최적화)
-- ============================================
CREATE INDEX IF NOT EXISTS idx_users_user_id ON users(user_id);
CREATE INDEX IF NOT EXISTS idx_pets_user_id ON pets(user_id);

-- ============================================
-- STEP 7: 최종 확인
-- ============================================
-- 타입 변경 확인
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE column_name = 'user_id'
ORDER BY table_name;

-- 외래키 제약조건 확인
SELECT
    tc.table_name,
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND (kcu.column_name = 'user_id' OR ccu.column_name = 'user_id');

SELECT 'Migration completed successfully!' AS status;

