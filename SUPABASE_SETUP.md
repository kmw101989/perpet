# Supabase 설정 가이드

## 1. Supabase Anon Key 가져오기

1. [Supabase Dashboard](https://supabase.com/dashboard)에 접속
2. 프로젝트 선택: `wdrirrlwmafmrqebpvxb`
3. Settings > API 메뉴로 이동
4. **Project API keys** 섹션에서 **`anon` `public`** 키 복사
5. `common/supabase-config.js` 파일에서 `SUPABASE_ANON_KEY` 변수에 붙여넣기

```javascript
const SUPABASE_ANON_KEY = '여기에_anon_key_붙여넣기';
```

## 2. HTML 파일에 Supabase 스크립트 추가

각 페이지의 `</body>` 태그 앞에 다음 스크립트를 추가하세요:

```html
<script src="../common/supabase-config.js"></script>
```

또는 절대 경로 사용:

```html
<script src="/common/supabase-config.js"></script>
```

## 3. 데이터베이스 테이블 구조 확인

다음 테이블들이 필요합니다:

### products (제품)
- id (uuid, primary key)
- name (text)
- brand (text)
- price (numeric)
- discount (numeric, nullable)
- rating (numeric, nullable)
- image_url (text, nullable)
- category (text)
- created_at (timestamp)

### hospitals (병원)
- id (uuid, primary key)
- name (text)
- address (text)
- latitude (numeric, nullable)
- longitude (numeric, nullable)
- phone (text, nullable)
- image_url (text, nullable)
- rating (numeric, nullable)
- created_at (timestamp)

### vets (수의사)
- id (uuid, primary key)
- name (text)
- hospital_id (uuid, foreign key to hospitals)
- specialty (text)
- rating (numeric, nullable)
- image_url (text, nullable)
- consultations (integer, nullable)
- satisfaction (text, nullable)
- created_at (timestamp)

### posts (커뮤니티 게시글)
- id (uuid, primary key)
- title (text)
- content (text)
- author (text)
- views (integer, default 0)
- created_at (timestamp)

## 4. 사용 예시

### 제품 목록 가져오기
```javascript
// 모든 제품
const products = await SupabaseService.getProducts();

// 특정 카테고리 제품
const foodProducts = await SupabaseService.getProducts('사료');
```

### 병원 목록 가져오기
```javascript
const hospitals = await SupabaseService.getHospitals();
```

### 수의사 목록 가져오기
```javascript
// 모든 수의사
const vets = await SupabaseService.getVets();

// 특정 전문 분야
const heartVets = await SupabaseService.getVets('심장');
```

### 커뮤니티 게시글 가져오기
```javascript
const posts = await SupabaseService.getPosts();
```

## 5. RLS (Row Level Security) 설정

Supabase Dashboard > Authentication > Policies에서:

- **읽기 (SELECT)**: 모든 사용자 허용 (anon)
- **쓰기 (INSERT/UPDATE/DELETE)**: 필요시 인증된 사용자만 허용

RLS가 활성화되어 있으면 각 테이블에 정책을 추가해야 합니다.

## 6. 문제 해결

### 데이터가 안 나올 때
1. RLS 정책 확인
2. 테이블 이름 확인 (대소문자 구분)
3. 컬럼 이름 확인
4. 브라우저 콘솔에서 에러 확인

### CORS 에러
- Supabase는 기본적으로 CORS를 허용하므로 문제없어야 합니다.
- 문제가 있다면 Supabase Dashboard > Settings > API에서 확인

