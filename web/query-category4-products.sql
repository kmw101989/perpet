-- category = 4인 제품 조회 쿼리
-- Supabase Dashboard > SQL Editor에서 실행하세요

-- 1. category = 4인 모든 제품 조회
SELECT 
    product_id,
    product_name,
    brand,
    category,
    product_type,
    current_price,
    original_price,
    discount_percent,
    rating,
    review_count,
    product_img,
    target_species
FROM products
WHERE category = 4
ORDER BY product_id;

-- 2. category = 4이고 product_type = '사료'인 제품 조회
SELECT 
    product_id,
    product_name,
    brand,
    category,
    product_type,
    current_price,
    original_price,
    discount_percent,
    rating,
    review_count,
    product_img,
    target_species
FROM products
WHERE category = 4 
    AND product_type = '사료'
ORDER BY product_id;

-- 3. category = 4인 제품 개수 확인
SELECT 
    COUNT(*) as total_count,
    product_type,
    COUNT(*) as count_by_type
FROM products
WHERE category = 4
GROUP BY product_type
ORDER BY product_type;

-- 4. category = 4인 제품 샘플 (최대 10개)
SELECT 
    product_id,
    product_name,
    brand,
    category,
    product_type,
    current_price,
    rating,
    review_count
FROM products
WHERE category = 4
LIMIT 10;

