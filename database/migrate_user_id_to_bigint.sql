-- user_id 컬럼 타입을 text에서 bigint로 변경하는 마이그레이션 스크립트
-- 주의: 이 스크립트를 실행하기 전에 데이터베이스 백업을 권장합니다.

-- 1. 외래키 제약조건 삭제
-- pets 테이블의 외래키 제약조건 삭제
ALTER TABLE IF EXISTS pets DROP CONSTRAINT IF EXISTS pets_user_id_fkey;

-- 다른 테이블에 user_id 외래키가 있다면 여기에 추가
-- 예: ALTER TABLE IF EXISTS reservations DROP CONSTRAINT IF EXISTS reservations_user_id_fkey;
-- 예: ALTER TABLE IF EXISTS orders DROP CONSTRAINT IF EXISTS orders_user_id_fkey;

-- 2. users 테이블의 user_id 컬럼 타입 변경
-- 먼저 기존 데이터를 정리 (text 타입의 숫자가 아닌 값이 있다면 제거하거나 변환)
-- 주의: user_id가 숫자로 변환 가능한 문자열인지 확인 필요

-- users 테이블의 user_id를 bigint로 변경
ALTER TABLE users 
ALTER COLUMN user_id TYPE bigint USING user_id::bigint;

-- 3. pets 테이블의 user_id 컬럼 타입 변경
ALTER TABLE pets 
ALTER COLUMN user_id TYPE bigint USING user_id::bigint;

-- 다른 테이블의 user_id도 변경 (필요한 경우)
-- 예: ALTER TABLE reservations ALTER COLUMN user_id TYPE bigint USING user_id::bigint;
-- 예: ALTER TABLE orders ALTER COLUMN user_id TYPE bigint USING user_id::bigint;

-- 4. 외래키 제약조건 다시 생성
ALTER TABLE pets 
ADD CONSTRAINT pets_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES users(user_id) 
ON DELETE CASCADE;

-- 다른 테이블의 외래키도 다시 생성 (필요한 경우)
-- 예: ALTER TABLE reservations ADD CONSTRAINT reservations_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE;

-- 5. 인덱스 확인 및 재생성 (성능 최적화)
-- user_id에 인덱스가 없다면 생성
CREATE INDEX IF NOT EXISTS idx_pets_user_id ON pets(user_id);
CREATE INDEX IF NOT EXISTS idx_users_user_id ON users(user_id);

-- 완료 메시지
SELECT 'Migration completed successfully!' AS status;

