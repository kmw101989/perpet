# Supabase 테이블 사용 현황 전체 정리

## 📊 테이블 목록 및 사용처

### 1. **users** (사용자 정보)
**위치**: `common/supabase-config.js`, `netlify/functions/chat.js`

**주요 컬럼**:
- `user_id`: 사용자 고유 ID
- `email`: 이메일
- `password`: 비밀번호 (데모용)
- `nickname`: 닉네임
- `user_name`: 이름
- `user_gender`: 성별
- `user_address1`: 주소1 (예: "서울", "경기/인천") ⭐ **병원 추천에 사용**
- `user_address2`: 주소2
- `phone_num`: 전화번호
- `user_age`: 나이

**사용 위치**:
- ✅ `join_member/script.js`: 회원가입 (`createUser`), 이메일 중복 체크 (`checkEmailExists`), 계정 삭제 (`deleteUserByEmail`)
- ✅ `login/script.js`: 로그인 시 사용자 정보 조회
- ✅ `mypage/mypage-script.js`: 마이페이지 사용자 정보 표시 (`getUser`)
- ✅ `website/script.js`: 홈 화면 사용자 정보 표시
- ✅ `netlify/functions/chat.js`: **AI 챗봇에서 사용자 주소 기반 병원 추천** (`user_address1` 조회)
- ✅ `pet_registration01/script.js`: 반려동물 등록 시 사용자 정보 확인

**주요 함수**:
- `SupabaseService.createUser()`: 사용자 등록
- `SupabaseService.getUser(userId)`: 사용자 정보 조회
- `SupabaseService.getUserByEmail(email)`: 이메일로 사용자 조회
- `SupabaseService.checkEmailExists(email)`: 이메일 중복 체크
- `SupabaseService.deleteUserByEmail(email)`: 사용자 삭제 (pets 먼저 삭제 후)
- `SupabaseService.getNextUserId()`: 다음 user_id 생성

---

### 2. **pets** (반려동물 정보)
**위치**: `common/supabase-config.js`, 여러 페이지 스크립트

**주요 컬럼**:
- `pet_id`: 반려동물 고유 ID
- `user_id`: 사용자 ID (FK)
- `pet_name`: 반려동물 이름
- `pet_species`: 종 (강아지/고양이)
- `detailed_species`: 상세 종 (견종/묘종)
- `pet_birth`: 생일 (YYYYMMDD 형식, bigint)
- `pet_gender`: 성별
- `weight`: 체중
- `disease_id`: 질병 ID (FK → diseases) ⭐ **제품 추천에 사용**
- `pet_warning`: 주의사항
- `pet_img`: 이미지 URL (Supabase Storage)

**사용 위치**:
- ✅ `website/script.js`: 홈 화면 반려동물 목록 표시 (`getPetsByUserId`)
- ✅ `mypage/mypage-script.js`: 마이페이지 반려동물 목록/상세/삭제 (`getPetsByUserId`, `getPetById`, `deletePet`)
- ✅ `pet_registration02/script.js`: 반려동물 이미지 업로드 (`uploadPetImage`)
- ✅ `pet_registration03/script.js`: 반려동물 등록/수정 (`createPet`, `updatePet`)
- ✅ `pet_registration_complete/script.js`: 반려동물 등록 완료, 삭제
- ✅ `login/script.js`: 로그인 후 반려동물 목록 확인
- ✅ `common/supabase-config.js`: **제품 추천 알고리즘** (`getRecommendedProducts`)
  - `pets.disease_id` → `diseases.category_id` → `products.category` 매칭
- ✅ `PDP/product-detail-script.js`: 제품 상세 페이지에서 반려동물 정보 확인
- ✅ `mall/shop-script.js`: 쇼핑몰에서 반려동물 기반 제품 추천

**주요 함수**:
- `SupabaseService.createPet(petData)`: 반려동물 등록
- `SupabaseService.updatePet(petId, petData)`: 반려동물 정보 수정
- `SupabaseService.getPets(userId)`: 사용자의 반려동물 목록 조회
- `SupabaseService.getPetById(petId)`: 반려동물 상세 정보 조회
- `SupabaseService.deletePet(petId, userId)`: 반려동물 삭제
- `SupabaseService.uploadPetImage(file, userId, petId)`: 반려동물 이미지 업로드 (Storage: `pics` 버킷)
- `SupabaseService.deletePetImage(imageUrl)`: 반려동물 이미지 삭제

---

### 3. **hospitals** (병원 정보)
**위치**: `common/supabase-config.js`, `netlify/functions/chat.js`

**주요 컬럼**:
- `hospital_id`: 병원 고유 ID
- `hospital_name`: 병원명
- `address`: 주소 (예: "서울 강남구 도산대로 213 1층") ⭐ **지역 필터링에 사용**
- `category_id`: 카테고리 ID (FK → category) ⭐ **질병별 병원 추천에 사용**
- `rating`: 평점
- `review_count`: 리뷰 수
- `hospital_img`: 병원 이미지 URL

**사용 위치**:
- ✅ `netlify/functions/chat.js`: **AI 챗봇 병원 추천** (`getRecommendedHospitals`)
  - `category_id` 기반 필터링
  - `user_address1` → `address` 매칭 (지역 우선 추천)
  - 지역 매칭 실패 시 전국 병원 추천
- ✅ `website/script.js`: 홈 화면 병원 추천 (`getHospitals`)
- ✅ `hospital/hospital-compare-script.js`: 병원 비교 페이지 (`getHospitals`)
- ✅ `consultation_chat/chat-script.js`: 수의사 상담 채팅에서 병원 정보 조회
- ✅ `consultation_main/consultation-script.js`: 수의사 상담 메인 페이지

**주요 함수**:
- `SupabaseService.getHospitals(city, categoryId, limit)`: 병원 목록 조회
- `SupabaseService.getHospitalById(hospitalId)`: 병원 상세 정보 조회
- `getRecommendedHospitals(categoryIds, locationKeywords)` (chat.js): AI 챗봇 병원 추천
  - 지역 매칭 병원 우선 → 없으면 전국 병원 추천

---

### 4. **products** (제품 정보)
**위치**: `common/supabase-config.js`, `netlify/functions/chat.js`

**주요 컬럼**:
- `product_id`: 제품 고유 ID
- `brand`: 브랜드
- `product_name`: 제품명
- `current_price`: 현재 가격
- `original_price`: 원가
- `discount_percent`: 할인율
- `rating`: 평점
- `review_count`: 리뷰 수
- `product_img`: 제품 이미지 URL
- `category`: 카테고리 ID (FK → category) ⭐ **질병별 제품 추천에 사용**
- `product_type`: 제품 타입 (사료/영양제/간식)

**사용 위치**:
- ✅ `common/supabase-config.js`: **제품 추천 알고리즘** (`getRecommendedProducts`)
  - `pets.disease_id` → `diseases.category_id` → `products.category` 매칭
  - 리뷰수, 평점, 할인율 종합 평가하여 상위 3개 추천
- ✅ `netlify/functions/chat.js`: **AI 챗봇 제품 추천** (`getRecommendedProducts`)
  - `category_id` 기반 필터링
- ✅ `mall/shop-script.js`: 쇼핑몰 제품 목록/필터 (`getProducts`)
- ✅ `website/script.js`: 홈 화면 제품 추천 (`getRecommendedProducts`, `getProducts`)
- ✅ `PDP/product-detail-script.js`: 제품 상세 페이지 (`getProductById`)

**주요 함수**:
- `SupabaseService.getProducts(categoryId, productType, limit, orderBy)`: 제품 목록 조회
- `SupabaseService.getProductById(productId)`: 제품 상세 정보 조회
- `SupabaseService.getRecommendedProducts(petId, productType, limit)`: 반려동물 기반 제품 추천
- `getRecommendedProducts(categoryIds)` (chat.js): AI 챗봇 제품 추천

---

### 5. **symptoms** (증상 정보)
**위치**: `netlify/functions/chat.js`

**주요 컬럼**:
- `symptom_id`: 증상 고유 ID
- `symptom_word`: 증상 키워드 (예: "기침", "콧물")
- `disease_id`: 질병 ID (FK → diseases) ⭐ **증상 → 질병 매핑에 사용**

**사용 위치**:
- ✅ `netlify/functions/chat.js`: **AI 챗봇 증상 분석**
  - `loadDatabaseData()`: 증상 데이터 로드
  - 사용자 메시지에서 증상 키워드 추출
  - `symptom_word` → `disease_id` → `category_id` 매핑
  - AI 프롬프트에 증상 키워드 전달

**주요 함수**:
- `loadDatabaseData()`: symptoms 테이블 전체 조회
- `getDiseaseIdsFromSymptoms(symptomWords, symptoms)`: 증상 키워드로 질병 ID 추출

---

### 6. **diseases** (질병 정보)
**위치**: `common/supabase-config.js`, `netlify/functions/chat.js`

**주요 컬럼**:
- `disease_id`: 질병 고유 ID
- `disease_name`: 질병명
- `category_id`: 카테고리 ID (FK → category) ⭐ **병원/제품 추천의 핵심**

**사용 위치**:
- ✅ `netlify/functions/chat.js`: **AI 챗봇 질병 분석**
  - `loadDatabaseData()`: 질병 데이터 로드
  - 증상 → 질병 → 카테고리 매핑
  - AI가 추론한 질병 검증
- ✅ `common/supabase-config.js`: **제품 추천 알고리즘**
  - `pets.disease_id` → `diseases.category_id` → `products.category` 매칭
- ✅ `website/script.js`: 홈 화면 질병 정보 표시 (`getDiseaseById`)
- ✅ `mypage/mypage-script.js`: 마이페이지 질병 정보 표시 (`getDiseaseById`)

**주요 함수**:
- `SupabaseService.getDiseases(categoryId)`: 질병 목록 조회
- `SupabaseService.getDiseaseById(diseaseId)`: 질병 상세 정보 조회
- `getDiseasesWithCategories(diseaseIds, diseases)` (chat.js): 질병 ID로 카테고리 추출

---

### 7. **category** (카테고리 정보)
**위치**: `common/supabase-config.js`

**주요 컬럼**:
- `category_id`: 카테고리 고유 ID
- `category_name`: 카테고리명 (예: "심장", "피부", "뼈/관절")

**사용 위치**:
- ✅ `common/supabase-config.js`: 카테고리 목록 조회 (`getCategories`)

**주요 함수**:
- `SupabaseService.getCategories()`: 카테고리 목록 조회

**카테고리 ID 매핑** (chat.js의 `keywordToCategoryId`):
- 1: 비염
- 2: 심장
- 3: 소화
- 4: 간
- 5: 위
- 6: 피부
- 7: 치아
- 8: 뼈/관절
- 9: 눈
- 10: 알레르기
- 11: 행동
- 12: 치매

---

### 8. **hospital_services** (병원 서비스 정보)
**위치**: `common/supabase-config.js`

**주요 컬럼**:
- `hospital_name`: 병원명 (hospital_id와 매칭)
- 서비스 관련 컬럼들

**사용 위치**:
- ✅ `common/supabase-config.js`: 병원 서비스 조회 (`getHospitalServices`)

**주요 함수**:
- `SupabaseService.getHospitalServices(hospitalId)`: 병원별 서비스 목록 조회

---

### 9. **service_avg** (서비스 평균 가격)
**위치**: `common/supabase-config.js`

**주요 컬럼**:
- `region`: 지역
- `service_id`: 서비스 ID
- 평균 가격 관련 컬럼들

**사용 위치**:
- ✅ `common/supabase-config.js`: 서비스 평균 가격 조회 (`getServiceAvg`)

**주요 함수**:
- `SupabaseService.getServiceAvg(region, serviceId)`: 지역/서비스별 평균 가격 조회

---

### 10. **services** (서비스 목록)
**위치**: `common/supabase-config.js`

**주요 컬럼**:
- `service_id`: 서비스 고유 ID
- 서비스명 등

**사용 위치**:
- ✅ `common/supabase-config.js`: 서비스 목록 조회 (`getServices`)

**주요 함수**:
- `SupabaseService.getServices()`: 서비스 목록 조회

---

## 🔄 데이터 흐름 요약

### 1. **사용자 등록 → 반려동물 등록 → 제품 추천**
```
users (회원가입)
  ↓
pets (반려동물 등록, disease_id 포함)
  ↓
diseases (disease_id → category_id)
  ↓
products (category 매칭)
  → 추천 제품 반환
```

### 2. **AI 챗봇 증상 분석 → 병원/제품 추천**
```
사용자 메시지 (증상 키워드)
  ↓
symptoms (symptom_word → disease_id)
  ↓
diseases (disease_id → category_id)
  ↓
hospitals (category_id 매칭, user_address1 → address 필터링)
  → 지역 우선 추천, 없으면 전국 추천
  ↓
products (category 매칭)
  → 카테고리 기반 추천
```

### 3. **사용자 주소 기반 병원 추천**
```
users.user_address1 (예: "서울")
  ↓
extractLocationKeywords() → ["서울"]
  ↓
hospitals.address (예: "서울 강남구...")
  → 지역 매칭 병원 우선 추천
  → 매칭 실패 시 전국 병원 추천
```

---

## 📁 주요 파일별 테이블 사용 현황

### `common/supabase-config.js`
- ✅ **SupabaseService**: 모든 테이블 접근의 중앙 집중식 인터페이스
- 사용되는 테이블: `users`, `pets`, `products`, `hospitals`, `diseases`, `category`, `hospital_services`, `service_avg`, `services`
- Storage: `pics` 버킷 (반려동물 이미지)

### `netlify/functions/chat.js`
- ✅ **AI 챗봇 핵심 로직**
- 사용되는 테이블: `symptoms`, `diseases`, `hospitals`, `products`, `users`
- 주요 기능:
  - 증상 분석 → 질병 추론 → 카테고리 결정
  - 카테고리 기반 병원/제품 추천
  - 사용자 주소 기반 지역 필터링

### 프론트엔드 페이지별 사용
- `join_member/script.js`: `users` (회원가입)
- `login/script.js`: `users`, `pets` (로그인)
- `website/script.js`: `users`, `pets`, `diseases`, `products`, `hospitals` (홈 화면)
- `mypage/mypage-script.js`: `users`, `pets`, `diseases` (마이페이지)
- `mall/shop-script.js`: `products` (쇼핑몰)
- `PDP/product-detail-script.js`: `products`, `pets` (제품 상세)
- `pet_registration*/script.js`: `pets` (반려동물 등록)
- `hospital/hospital-compare-script.js`: `hospitals` (병원 비교)
- `chatbot/chat-script.js`: AI 챗봇 (간접적으로 모든 테이블 사용)

---

## 🔑 핵심 데이터 관계

```
users (1) ──< (N) pets
  │              │
  │              └──> disease_id ──> diseases ──> category_id
  │                                           │
  │                                           ├──> hospitals (category_id)
  │                                           │
  │                                           └──> products (category)
  │
  └──> user_address1 ──> hospitals.address (지역 필터링)
```

---

## 📝 주의사항

1. **RLS (Row Level Security) 정책**: 모든 테이블에 SELECT 정책이 필요합니다.
2. **외래키 제약조건**: `pets.user_id` → `users.user_id` (CASCADE DELETE 권장)
3. **Storage 버킷**: `pics` 버킷에 반려동물 이미지 저장
4. **데이터 타입**: `pet_birth`는 bigint (YYYYMMDD 형식), `disease_id`는 bigint


