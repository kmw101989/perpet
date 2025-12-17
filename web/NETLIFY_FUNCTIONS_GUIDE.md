# Netlify Functions 구현 가이드

## 전체 기능 흐름 분석

### 1. 회원가입
- **구현 방식**: 로컬스토리지 (LocalStorage) - 데모 배포용
- **Netlify Functions 필요**: ❌ 불필요
- **이유**: 로컬스토리지에 사용자 정보 저장 (데모 목적)

### 2. 반려동물 등록
- **구현 방식**: Supabase Database (클라이언트 직접 사용)
- **Netlify Functions 필요**: ❌ 불필요
- **이유**: Supabase 클라이언트 라이브러리로 직접 CRUD 가능

### 3. 홈 페이지 기능들
#### 3-1. 일정 관리
- **구현 방식**: 미구현 예정
- **Netlify Functions 필요**: ❌ 불필요

#### 3-2. 건강 루틴 체크
- **구현 방식**: Supabase Database (클라이언트 직접 사용)
- **Netlify Functions 필요**: ❌ 불필요

#### 3-3. 제품 맞춤 추천
- **구현 방식**: Supabase 쿼리 (클라이언트 직접 사용)
- **Netlify Functions 필요**: ⚠️ 쿼리 테스트 후 결정
- **상태**: 쿼리 돌려보고 복잡도 확인 필요

### 4. 자사몰
#### 4-1. 제품 정보 가져오기
- **구현 방식**: Supabase Database (클라이언트 직접 사용)
- **Netlify Functions 필요**: ❌ 불필요

#### 4-2. 제품 추천 로직
- **구현 방식**: Supabase 쿼리 (클라이언트 직접 사용)
- **Netlify Functions 필요**: ⚠️ 쿼리 테스트 후 결정
- **상태**: 쿼리 돌려보고 복잡도 확인 필요

### 5. 병원 추천
#### 5-1. 지도 API
- **구현 방식**: 네이버 지도 API (클라이언트에서 직접 호출)
- **Netlify Functions 필요**: ❌ 불필요
- **참고**: 네이버 지도 API는 클라이언트에서 직접 사용 가능

#### 5-2. 병원 정보 가져오기
- **구현 방식**: Supabase Database (클라이언트 직접 사용)
- **Netlify Functions 필요**: ❌ 불필요

### 6. 수의사 탭
- **구현 방식**: Supabase Database에서 수의사 정보 가져오기 (클라이언트 직접 사용)
- **Netlify Functions 필요**: ❌ 불필요

### 7. 커뮤니티
- **구현 방식**: Supabase Database (클라이언트 직접 사용)
- **Netlify Functions 필요**: ❌ 불필요

---

## Netlify Functions가 필요한 경우

### ✅ 필수: AI 채팅 기능 (Firebase) - 나중에 구현
- **이유**: API 키 보호 필요
- **구현 위치**: `netlify/functions/ai-chat.js`
- **기능**:
  - 사용자 메시지 받기
  - Firebase AI 또는 외부 AI API 호출 (서버에서만 API 키 사용)
  - AI 응답 반환
  - 대화 내역 Supabase에 저장 (선택사항)
- **상태**: ⏸️ 나중에 작업 예정

### ⚠️ 선택사항: 복잡한 추천 알고리즘
- **이유**: 복잡한 계산이나 외부 API 연동이 필요한 경우
- **구현 위치**: `netlify/functions/product-recommendation.js`
- **기능**:
  - 사용자 정보 + 반려동물 정보 분석
  - 복잡한 추천 알고리즘 실행
  - 결과 반환

### ⚠️ 선택사항: 서버 사이드 관리 작업
- **이유**: Supabase 서비스 키 보호가 필요한 관리 작업
- **구현 위치**: `netlify/functions/admin.js`
- **기능**:
  - 관리자 전용 쿼리
  - 통계 데이터 생성
  - 배치 작업

---

## 권장 아키텍처

### 클라이언트에서 직접 처리 (대부분의 기능)
```
프론트엔드 (JavaScript)
  ↓
Supabase Client Library
  ↓
Supabase Database (RLS 정책으로 보안)
```

**장점**:
- 빠른 응답 속도
- 서버 비용 절감
- 구현 간단

**보안**:
- Supabase RLS (Row Level Security) 정책으로 데이터 접근 제어
- Supabase Anon Key는 공개해도 됨 (RLS로 보호됨)

### 서버 사이드 처리 (AI 채팅만)
```
프론트엔드 (JavaScript)
  ↓
Netlify Function
  ↓
Firebase AI / OpenAI API (API 키 보호)
  ↓
Supabase (대화 내역 저장)
```

---

## 구현 우선순위

### Phase 1: 현재 단계 (Netlify Functions 없이)
1. ✅ 회원가입 (로컬스토리지) - 데모용
2. ✅ 반려동물 등록 (로컬스토리지 또는 Supabase DB)
3. ⏸️ 일정 관리 - 미구현 예정
4. ✅ 건강 루틴 체크 (로컬스토리지 또는 Supabase DB)
5. ✅ 제품 정보 가져오기 (Supabase DB)
6. ✅ 병원 정보 가져오기 (Supabase DB) + 네이버 지도 API
7. ✅ 수의사 정보 가져오기 (Supabase DB)
8. ✅ 커뮤니티 목록 (Supabase DB)

### Phase 2: 추천 로직 (쿼리 테스트 후 결정)
1. ⚠️ 제품 맞춤 추천 쿼리 테스트
2. ⚠️ 자사몰 제품 추천 쿼리 테스트
3. ⚠️ 필요시 Netlify Function으로 전환

### Phase 3: AI 채팅 (나중에 구현)
1. ⏸️ AI 채팅 Function 구현
2. ⏸️ 프론트엔드에서 Function 호출
3. ⏸️ 대화 내역 Supabase에 저장

---

## 현재 단계에서 필요한 작업

### 1. Supabase 프로젝트 설정
- [ ] Supabase 프로젝트 생성
- [ ] 데이터베이스 스키마 설계
  - 제품 테이블 (products)
  - 병원 테이블 (hospitals)
  - 수의사 테이블 (vets)
  - 커뮤니티 테이블 (posts)
  - 반려동물 테이블 (pets) - 선택사항
- [ ] RLS 정책 설정 (보안)
- [ ] 클라이언트 라이브러리 설치 및 초기화

### 2. 네이버 지도 API 설정
- [ ] 네이버 클라우드 플랫폼에서 API 키 발급
- [ ] 지도 API 스크립트 추가
- [ ] 병원 위치 마커 표시

### 3. 로컬스토리지 회원가입 구현
- [ ] 회원가입 폼 데이터 로컬스토리지 저장
- [ ] 로그인 시 로컬스토리지에서 사용자 정보 확인
- [ ] 세션 관리 (페이지 이동 시 사용자 정보 유지)

### 4. 제품/병원/수의사 데이터 연동
- [ ] Supabase에서 제품 목록 가져오기
- [ ] Supabase에서 병원 목록 가져오기
- [ ] Supabase에서 수의사 목록 가져오기
- [ ] 커뮤니티 목록 가져오기

### 5. 추천 로직 테스트 (나중에)
- [ ] 제품 추천 쿼리 작성 및 테스트
- [ ] 복잡도 확인 후 Netlify Function 필요 여부 결정

---

## Netlify Functions는 나중에

현재는 **AI 채팅 기능만** Netlify Functions가 필요하며, 이는 나중에 구현할 예정입니다.

**지금은 Netlify Functions 구현 불필요** ✅

