-- Supabase RPC 함수 생성: user_id의 최대값을 반환
-- 이 함수는 text 타입의 user_id를 숫자로 변환하여 최대값을 구합니다.

CREATE OR REPLACE FUNCTION get_max_user_id()
RETURNS bigint
LANGUAGE plpgsql
AS $$
DECLARE
  max_id bigint;
BEGIN
  -- text 타입의 user_id를 bigint로 변환하여 최대값 구하기
  SELECT COALESCE(MAX(user_id::bigint), 0)
  INTO max_id
  FROM users
  WHERE user_id ~ '^[0-9]+$'; -- 숫자로만 구성된 경우만
  
  RETURN max_id;
END;
$$;

-- 함수 테스트
-- SELECT get_max_user_id();

