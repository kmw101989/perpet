# 구현 체크리스트

## 현재 단계 (Netlify Functions 없이)

### ✅ 완료된 작업
- [x] Netlify 배포 완료
- [x] Firebase 관련 파일 제거
- [x] 경로 절대 경로로 변경 (메인페이지)

### 🔄 진행 중 / 다음 작업

#### 1. 회원가입 (로컬스토리지)
- [ ] `join_member/index.html` - 회원가입 데이터 로컬스토리지 저장
- [ ] `login/index.html` - 로컬스토리지에서 사용자 정보 확인
- [ ] 사용자 정보 유지 (세션 관리)

#### 2. 반려동물 등록
- [ ] `pet_registration01-03/index.html` - 반려동물 정보 로컬스토리지 저장
- [ ] `pet_registration_complete/index.html` - 저장된 정보 확인

#### 3. 홈 페이지
- [ ] 건강 루틴 체크 (로컬스토리지 또는 Supabase)
- [ ] 제품 맞춤 추천 (Supabase 쿼리 - 나중에 테스트)

#### 4. 자사몰
- [ ] Supabase에서 제품 목록 가져오기
- [ ] 제품 추천 로직 (쿼리 테스트 후 결정)

#### 5. 병원 추천
- [ ] 네이버 지도 API 연동
- [ ] Supabase에서 병원 목록 가져오기
- [ ] 지도에 병원 마커 표시

#### 6. 수의사 탭
- [ ] Supabase에서 수의사 정보 가져오기
- [ ] 수의사 목록 표시

#### 7. 커뮤니티
- [ ] Supabase에서 커뮤니티 목록 가져오기
- [ ] 목록 표시 (상세 기능은 미구현)

---

## 나중에 구현 (Netlify Functions 필요)

### AI 채팅 기능
- [ ] Netlify Function 생성 (`netlify/functions/ai-chat.js`)
- [ ] Firebase AI 또는 외부 AI API 연동
- [ ] 프론트엔드에서 Function 호출
- [ ] 대화 내역 Supabase 저장 (선택사항)

---

## Supabase 설정 필요

### 데이터베이스 테이블
1. **products** (제품)
   - id, name, brand, price, discount, rating, image_url, category, etc.

2. **hospitals** (병원)
   - id, name, address, latitude, longitude, phone, image_url, etc.

3. **vets** (수의사)
   - id, name, hospital_id, specialty, rating, image_url, etc.

4. **posts** (커뮤니티)
   - id, title, content, author, created_at, views, etc.

5. **pets** (반려동물) - 선택사항
   - id, user_id, name, age, breed, etc.

### RLS 정책
- 읽기: 모든 사용자 허용 (anon)
- 쓰기: 인증된 사용자만 (필요시)

---

## 네이버 지도 API 설정

1. 네이버 클라우드 플랫폼 접속
2. Application 등록
3. Client ID 발급
4. HTML에 스크립트 추가:
```html
<script type="text/javascript" src="https://oapi.map.naver.com/openapi/v3/maps.js?ncpClientId=YOUR_CLIENT_ID"></script>
```

---

## 참고사항

- **로컬스토리지**: 데모 배포용이므로 실제 프로덕션에서는 Supabase Auth 사용 권장
- **Supabase**: 클라이언트에서 직접 사용 가능 (RLS로 보안)
- **Netlify Functions**: AI 채팅만 필요 (나중에 구현)

