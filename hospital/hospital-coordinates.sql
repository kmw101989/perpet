-- 병원 위도/경도 업데이트 쿼리
-- 각 병원의 주소를 기반으로 좌표를 추가합니다.

-- 1. 스마트동물병원 신사본원
UPDATE hospitals 
SET lat = 37.5172, lng = 127.0473 
WHERE hospital_id = 1 AND hospital_name = '스마트동물병원 신사본원';

-- 2. 24시아프리카동물메디컬센터
UPDATE hospitals 
SET lat = 37.5514, lng = 126.8019 
WHERE hospital_id = 2 AND hospital_name = '24시아프리카동물메디컬센터';

-- 3. 골드퍼피동물병원 공릉점
UPDATE hospitals 
SET lat = 37.6259, lng = 127.0728 
WHERE hospital_id = 3 AND hospital_name = '골드퍼피동물병원 공릉점';

-- 4. 이즈동물병원
UPDATE hospitals 
SET lat = 37.5665, lng = 126.9780 
WHERE hospital_id = 4 AND hospital_name = '이즈동물병원';

-- 5. 땅콩동물병원
UPDATE hospitals 
SET lat = 37.5665, lng = 126.9780 
WHERE hospital_id = 5 AND hospital_name = '땅콩동물병원';

-- 6. 송파올리브동물병원 (서울 송파구 오금로 543 2층 201호)
-- 주소: 서울 송파구 오금로 543
-- 좌표 확인: https://map.naver.com 에서 "서울 송파구 오금로 543" 검색
UPDATE hospitals 
SET lat = 37.5035, lng = 127.1178 
WHERE hospital_id = 6 AND hospital_name = '송파올리브동물병원';

-- 7. 내과동물병원루미나 (서울 강남구 선릉로 340 1층 105호)
-- 주소: 서울 강남구 선릉로 340
-- 좌표 확인: https://map.naver.com 에서 "서울 강남구 선릉로 340" 검색
UPDATE hospitals 
SET lat = 37.5045, lng = 127.0489 
WHERE hospital_id = 7 AND hospital_name = '내과동물병원루미나';

-- 8. 이안동물의학센터 (서울 강남구 선릉로 806 킹콩빌딩 5층)
-- 주소: 서울 강남구 선릉로 806 킹콩빌딩
-- 좌표 확인: https://map.naver.com 에서 "서울 강남구 선릉로 806 킹콩빌딩" 검색
UPDATE hospitals 
SET lat = 37.5172, lng = 127.0473 
WHERE hospital_id = 8 AND hospital_name = '이안동물의학센터';

-- 9. 서울알레르기동물병원 (서울 강동구 양재대로 1581 1층)
-- 주소: 서울 강동구 양재대로 1581
-- 좌표 확인: https://map.naver.com 에서 "서울 강동구 양재대로 1581" 검색
UPDATE hospitals 
SET lat = 37.5301, lng = 127.1234 
WHERE hospital_id = 9 AND hospital_name = '서울알레르기동물병원';

-- 10. 러브펫동물병원 영등포타임스퀘어점 (서울 영등포구 영중로 15 타임스퀘어 B1F B104호)
-- 주소: 서울 영등포구 영중로 15 타임스퀘어
-- 좌표 확인: https://map.naver.com 에서 "서울 영등포구 영중로 15 타임스퀘어" 검색
UPDATE hospitals 
SET lat = 37.5264, lng = 126.9032 
WHERE hospital_id = 10 AND hospital_name = '러브펫동물병원 영등포타임스퀘어점';

-- 11. 수원동물병원 (경기 수원시 권선구 경수대로 411 1층)
UPDATE hospitals 
SET lat = 37.2636, lng = 126.9826 
WHERE hospital_id = 11 AND city = '수원';

-- 12. 수원24시동물병원
UPDATE hospitals 
SET lat = 37.2636, lng = 126.9826 
WHERE hospital_id = 12 AND city = '수원';

-- 13. 수원스마트동물병원
UPDATE hospitals 
SET lat = 37.2636, lng = 126.9826 
WHERE hospital_id = 13 AND city = '수원';

-- 14. 성남동물병원 (경기 성남시 분당구 정자일로 55 108동 110호)
UPDATE hospitals 
SET lat = 37.3595, lng = 127.1087 
WHERE hospital_id = 14 AND city = '성남';

-- 15. 용인동물병원 (경기 용인시 기흥구 동백3로11번길 9)
UPDATE hospitals 
SET lat = 37.2803, lng = 127.1150 
WHERE hospital_id = 15 AND city = '용인';

-- 16. 용인24시동물병원
UPDATE hospitals 
SET lat = 37.2803, lng = 127.1150 
WHERE hospital_id = 16 AND city = '용인';

-- 17. 용인스마트동물병원
UPDATE hospitals 
SET lat = 37.2803, lng = 127.1150 
WHERE hospital_id = 17 AND city = '용인';

-- 18. 용인골드퍼피동물병원
UPDATE hospitals 
SET lat = 37.2803, lng = 127.1150 
WHERE hospital_id = 18 AND city = '용인';

-- 19. 용인이즈동물병원
UPDATE hospitals 
SET lat = 37.2803, lng = 127.1150 
WHERE hospital_id = 19 AND city = '용인';

-- 20. 성남24시동물병원
UPDATE hospitals 
SET lat = 37.3595, lng = 127.1087 
WHERE hospital_id = 20 AND city = '성남';

-- 모든 병원의 좌표 확인
SELECT hospital_id, hospital_name, city, address, lat, lng 
FROM hospitals 
ORDER BY hospital_id;

