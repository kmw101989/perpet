-- 제품 테이블(products) 컬럼 조회 쿼리
-- Supabase Dashboard > SQL Editor에서 실행하세요

-- 제품 테이블의 모든 컬럼 정보 조회
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default,
    ordinal_position
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'products'
ORDER BY ordinal_position;

-- 제품 테이블의 샘플 데이터 조회 (모든 컬럼)
SELECT * FROM products LIMIT 5;

