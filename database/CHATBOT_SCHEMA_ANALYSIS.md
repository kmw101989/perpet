# 챗봇 DB 스키마 분석 및 질문 답변

## 현재 구현 상태 기반 답변

### 1️⃣ 질병(diseases) / 증상(symptoms) 구조 검증

#### Q1. 질병 분류 체계 확인

**답변:**
- `category_id`는 **질병 대분류**입니다.
- 코드에서 확인된 매핑:
  - 종합관리: 1
  - 심장: 2
  - 신장/방광: 3
  - 간: 4
  - 위/장: 5
  - 피부: 6
  - 치아: 7
  - 뼈/관절: 8
  - 눈: 9
  - 면역력: 10
  - 행동: 11

- 프롬프트에서 "뼈" → category_id 8 (뼈/관절) 매칭이 이미 구현되어 있음
- ✅ **현재 구조로 키워드 매칭 가능**

#### Q2. 증상 정규화 가능 여부

**답변:**
- 현재 코드 구조: `symptoms` 테이블은 `symptom_word`와 `disease_id`로 구성
- 코드 확인 결과: `getDiseaseIdsFromSymptoms()` 함수에서 `symptom_word`로 `disease_id`를 수집
- ⚠️ **1증상 = 1질병 구조로 보임** (코드에서 중복 제거만 하고 있음)
- ❌ **하나의 증상이 여러 disease_id에 매핑되는 구조는 확인되지 않음**
- ⚠️ **증상 기반 추론은 질병 힌트 수준**이 맞음

#### Q3. 표준 증상 목록 범위

**답변:**
- 코드에서 `symptoms` 테이블의 `symptom_word`를 모두 가져와서 AI에게 전달
- 프롬프트: `표준 증상 목록: ${JSON.stringify(symptomWords)}`
- ✅ **서버에서 symptom_word 목록을 AI에게 제공**
- ✅ **AI가 사용자 자연어 → symptom_word 매칭을 수행**
- ⚠️ **단어 단위인지 문장도 있는지는 DB 확인 필요**

---

### 2️⃣ condition_level(상태 단계) 구현 가능성

#### Q4. 상태 단계 로직은 어디서 판단하나요?

**답변:**
- ❌ **현재 코드에서 `condition_level` 필드는 사용되지 않음**
- ❌ **프롬프트에 "경과 관찰 가능", "조기 진료 권장", "빠른 병원 방문 권장" 언급이 없음**
- ❌ **응답 JSON 구조에도 `condition_level` 필드 없음**
- ⚠️ **구현 필요: AI가 증상 개수나 특정 disease_id 기준으로 판단하도록 프롬프트 수정 필요**

---

### 3️⃣ 병원 추천 구조 검증

#### Q5. 병원 전문 분야 판단 기준

**답변:**
- ✅ **`hospitals` 테이블의 `category_id`로 필터링**
- 코드: `getRecommendedHospitals(categoryIds)` → `.in("category_id", categoryIds)`
- ✅ **"관절/뼈 특화 병원"은 category_id = 8로 필터링**
- ✅ **현재 구조로 특화 병원 추천 가능**

#### Q6. hospital_services 활용 여부

**답변:**
- ❌ **코드에서 `hospital_services` 테이블 사용 안 함**
- ❌ **질병(disease_id) → 서비스(service_id) 매핑 로직 없음**
- ⚠️ **현재는 category_id 기반 병원 추천만 가능**
- ❌ **특정 질병에 대한 구체적 서비스 추천은 불가능**

---

### 4️⃣ 비용 정보 제공 가능성 (중요)

#### Q7. 평균 비용 데이터 사용 가능 여부

**답변:**
- ❌ **코드에서 `service_avg` 테이블 사용 안 함**
- ❌ **disease_id ↔ service_id 연결 로직 없음**
- ❌ **비용 정보 제공 불가능**
- ⚠️ **구현하려면:**
  1. disease_id → service_id 매핑 테이블 필요
  2. service_avg 테이블 조회 로직 추가
  3. 프롬프트에 비용 안내 규칙 추가

---

### 5️⃣ 제품(products) 추천 가능 범위

#### Q8. 제품과 질병의 연결 방식

**답변:**
- ✅ **`products.category` = `diseases.category_id`로 매칭**
- 코드: `getRecommendedProducts(categoryIds)` → `.in("category", categoryIds)`
- ✅ **"관절에 도움이 될 수 있는 제품" 수준의 추천 가능**
- ❌ **disease_id ↔ product 직접 매핑 테이블 없음**
- ⚠️ **현재는 category_id 기반 추천만 가능**

#### Q9. 반려동물 조건 필터링

**답변:**
- ❌ **코드에서 반려동물 조건 필터링 없음**
- `getRecommendedProducts()` 함수의 `targetSpecies` 파라미터는 받지만 사용 안 함
- ❌ **소형견/대형견, 강아지/고양이, 연령 필터링 불가능**
- ⚠️ **AI가 말만 하고 실제 필터링은 안 함**

---

### 6️⃣ pets 테이블 활용 범위

#### Q10. pets.disease_id 사용 목적

**답변:**
- ✅ **코드에서 `pets.disease_id` 사용됨**
- `common/supabase-config.js`의 `getRecommendedProducts()`에서:
  - `pets.disease_id` → `diseases.category_id` → `products.category` 매칭
- ⚠️ **확진 질병 기록용으로 보임**
- ❌ **AI 응답의 `suspected_diseases`를 pets 테이블에 반영하는 로직 없음**
- ⚠️ **정책 필요: 상담 중 추정 질병 저장 여부 결정 필요**

---

### 7️⃣ JSON 응답 구조 검증

#### Q11. 프론트에서 필수 필드

**답변:**
- ✅ **현재 응답 구조:**
  ```javascript
  {
    status: "ok" | "uncertain",
    normalized_symptoms: [],
    suspected_diseases: [],
    category_ids: [],
    recommendations: {
      hospitals: [],
      products: []
    },
    message: "..."
  }
  ```
- ✅ **모든 필드가 항상 존재 (빈 배열 허용)**
- ✅ **프론트엔드에서 `response.recommendations.hospitals`, `response.recommendations.products` 사용**

#### Q12. message 외 구조 필드 활용

**답변:**
- ❌ **`care_guidance`, `cost_reference` 필드 없음**
- ✅ **프론트엔드에서 `message` 텍스트만 사용**
- ✅ **추천은 `recommendations` 객체로 별도 렌더링**
- ⚠️ **구조 필드 추가하려면 프롬프트와 응답 구조 수정 필요**

---

### 8️⃣ 가장 중요한 최종 질문

#### Q13. 이 DB 구조 기준에서 챗봇의 현실적인 역할은?

**답변:**

**현재 구현 가능한 역할:**
- ✅ **1️⃣ 병원/제품 데이터 탐색 보조 봇** (부분적)
- ✅ **2️⃣ 증상 → 질병 후보 → 다음 행동 정리 봇** (부분적)
- ❌ **3️⃣ 병원 예약/가격 비교 중심 봇** (불가능)

**구체적 가능 범위:**

✅ **가능한 것:**
1. 키워드(심장, 뼈, 관절 등) → category_id → 병원/제품 추천
2. 증상 → symptom_word 매칭 → disease_id → category_id → 병원/제품 추천
3. 질병명 직접 언급 → disease_id → category_id → 병원/제품 추천
4. 일반 건강 상담 질문 답변

❌ **불가능한 것:**
1. 특정 질병에 대한 구체적 서비스 추천
2. 비용 정보 제공
3. 반려동물 조건(종류, 크기, 연령) 기반 제품 필터링
4. condition_level 판단
5. care_guidance, cost_reference 구조화된 정보 제공

---

## 🔥 결론 및 권장사항

### 현재 프롬프트와 DB 구조의 불일치

**프롬프트는 기대하는 것:**
- 증상 기반 정확한 질병 추론
- 구체적인 병원 서비스 추천
- 비용 정보 제공
- 상태 단계 판단

**실제 DB 구조로 가능한 것:**
- category_id 기반 병원/제품 추천
- 증상 → 질병 힌트 수준
- 일반적인 건강 상담

### 권장 조치

**옵션 1: 프롬프트 현실화 (빠른 수정)**
- category_id 기반 추천만 가능하다고 명시
- 비용 정보, 구체적 서비스 추천 제거
- "관절에 도움이 될 수 있는 제품" 수준으로 표현 제한

**옵션 2: DB 구조 확장 (장기 개선)**
- disease_id ↔ service_id 매핑 테이블 추가
- disease_id ↔ product_id 직접 매핑 테이블 추가
- service_avg 활용 로직 추가
- 반려동물 조건 필터링 컬럼 추가

**옵션 3: 하이브리드 (현실적 타협)**
- 현재 가능한 범위로 프롬프트 수정
- 향후 확장 가능한 구조는 유지
- 단계적 개선 계획 수립

---

## 다음 단계 제안

1. **현실 타협 버전 프롬프트 작성** (현재 DB 구조 기준)
2. **이상적 확장 버전 프롬프트 작성** (DB 확장 후 사용 가능)
3. **DB 스키마 확장 계획 수립** (필요한 매핑 테이블 설계)

