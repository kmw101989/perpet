// Netlify Function: /.netlify/functions/chat
// AI 챗봇: 증상 정규화 → 질병 후보 선택 → 응답 생성
// 명세서 기반 구현

let createClient;
try {
  const supabaseModule = require("@supabase/supabase-js");
  createClient = supabaseModule.createClient;
} catch (err) {
  console.error("Supabase 모듈 로드 실패:", err);
}

// Supabase 클라이언트 초기화
function getSupabaseClient() {
  if (!createClient) {
    throw new Error(
      "Supabase 클라이언트를 초기화할 수 없습니다. @supabase/supabase-js 패키지가 설치되어 있는지 확인하세요."
    );
  }

  const supabaseUrl =
    process.env.SUPABASE_URL || "https://wdrirrlwmafmrqebpvxb.supabase.co";
  const supabaseKey =
    process.env.SUPABASE_ANON_KEY ||
    "sb_publishable_6TYMynQhG55NJ79kQdzQVA_DH1w8E2K";

  try {
    return createClient(supabaseUrl, supabaseKey);
  } catch (err) {
    console.error("Supabase 클라이언트 생성 오류:", err);
    throw err;
  }
}

// Supabase에서 symptoms와 diseases 데이터 가져오기
async function loadDatabaseData() {
  const supabase = getSupabaseClient();

  try {
    // symptoms 테이블 조회
    const { data: symptoms, error: symptomsError } = await supabase
      .from("symptoms")
      .select("symptom_id, symptom_word, disease_id");

    if (symptomsError) {
      console.error("Symptoms 조회 오류:", symptomsError);
      return { symptoms: [], diseases: [] };
    }

    // diseases 테이블 조회
    const { data: diseases, error: diseasesError } = await supabase
      .from("diseases")
      .select("disease_id, disease_name, category_id");

    if (diseasesError) {
      console.error("Diseases 조회 오류:", diseasesError);
      return { symptoms: symptoms || [], diseases: [] };
    }

    return {
      symptoms: symptoms || [],
      diseases: diseases || [],
    };
  } catch (err) {
    console.error("DB 데이터 로드 오류:", err);
    return { symptoms: [], diseases: [] };
  }
}

// 이 함수들은 더 이상 사용하지 않음 (로컬 데이터 기반 함수로 대체됨)

// category_id로 병원 추천 (명세서 기준)
// 주의: hospitals 테이블은 'category_id' 컬럼을 사용함
async function getRecommendedHospitals(categoryIds) {
  const supabase = getSupabaseClient();

  if (!categoryIds || categoryIds.length === 0) {
    return [];
  }

  try {
    // hospitals 테이블은 'category_id' 컬럼 사용
    // category_id 기준으로 병원 조회
    // rating DESC, review_count DESC 정렬, 최대 3개
    const { data, error } = await supabase
      .from("hospitals")
      .select(
        "hospital_id, hospital_name, address, rating, review_count, hospital_img"
      )
      .in("category_id", categoryIds)
      .order("rating", { ascending: false })
      .order("review_count", { ascending: false })
      .limit(3);

    if (error) {
      console.error("병원 추천 조회 오류:", error);
      return [];
    }

    return (data || []).map((h) => ({
      hospital_id: h.hospital_id,
      hospital_name: h.hospital_name,
      address: h.address || "",
      rating: h.rating || 0,
      hospital_img: h.hospital_img || null,
    }));
  } catch (err) {
    console.error("병원 추천 오류:", err);
    return [];
  }
}

// category_id로 제품 추천 (명세서 기준)
// 주의: products 테이블은 'category' 컬럼을 사용하며, 이 값은 category_id와 동일함
// 예: category_id = 2 (심장) → products.category = 2
async function getRecommendedProducts(
  categoryIds,
  targetSpecies = "강아지",
  productType = null
) {
  const supabase = getSupabaseClient();

  if (!categoryIds || categoryIds.length === 0) {
    console.log("[Chat Function] categoryIds가 없어 제품 추천 불가");
    return [];
  }

  try {
    console.log("========================================");
    console.log("[Chat Function] ===== 제품 추천 조회 시작 =====");
    console.log("[Chat Function] 입력 파라미터:", {
      categoryIds: categoryIds,
      categoryIdsType: Array.isArray(categoryIds)
        ? "array"
        : typeof categoryIds,
      categoryIdsLength: Array.isArray(categoryIds)
        ? categoryIds.length
        : "N/A",
      targetSpecies: targetSpecies,
      productType: productType,
    });

    if (!Array.isArray(categoryIds) || categoryIds.length === 0) {
      console.error(
        "[Chat Function] ❌ categoryIds가 유효하지 않음:",
        categoryIds
      );
      console.log("========================================");
      return [];
    }

    // products 테이블은 'category' 컬럼 사용 (category_id 값과 동일)
    // 예: category_id = 2 → products.category = 2로 조회
    // product_type 필터링도 지원
    console.log("[Chat Function] 📋 쿼리 구성 시작");
    console.log("[Chat Function] - 테이블: products");
    console.log("[Chat Function] - 필터: category IN", categoryIds);

    let query = supabase
      .from("products")
      .select(
        "product_id, product_name, product_img, category, product_type, current_price, original_price, discount_percent"
      )
      .in("category", categoryIds)
      .limit(10); // 먼저 더 많이 가져온 후 필터링

    // product_type 필터링 추가
    if (productType) {
      query = query.eq("product_type", productType);
      console.log("[Chat Function] - 추가 필터: product_type =", productType);
    } else {
      console.log("[Chat Function] - product_type 필터 없음 (모든 타입 포함)");
    }

    console.log("[Chat Function] 🔍 쿼리 실행 중...");
    const queryStartTime = Date.now();
    const { data, error } = await query;
    const queryEndTime = Date.now();
    console.log(
      "[Chat Function] ⏱️ 쿼리 실행 시간:",
      queryEndTime - queryStartTime,
      "ms"
    );

    if (error) {
      console.error("[Chat Function] ❌ 제품 추천 조회 오류 발생");
      console.error("[Chat Function] 오류 코드:", error.code);
      console.error("[Chat Function] 오류 메시지:", error.message);
      console.error(
        "[Chat Function] 오류 상세:",
        JSON.stringify(error, null, 2)
      );
      console.log("========================================");
      return [];
    }

    console.log("[Chat Function] ✅ 쿼리 실행 성공");
    console.log(
      "[Chat Function] 📊 조회된 제품 개수:",
      data?.length || 0,
      "개"
    );

    if (data && data.length > 0) {
      console.log("[Chat Function] 📦 조회된 제품 상세 정보:");
      data.slice(0, 5).forEach((p, idx) => {
        console.log(
          `[Chat Function]   [${idx + 1}] product_id: ${p.product_id}, name: ${
            p.product_name
          }, category: ${p.category}, product_type: ${p.product_type}`
        );
      });

      // category 분포 확인
      const categoryCount = {};
      const productTypeCount = {};
      data.forEach((p) => {
        categoryCount[p.category] = (categoryCount[p.category] || 0) + 1;
        productTypeCount[p.product_type] =
          (productTypeCount[p.product_type] || 0) + 1;
      });
      console.log("[Chat Function] 📈 category 분포:", categoryCount);
      console.log("[Chat Function] 📈 product_type 분포:", productTypeCount);
    } else {
      console.warn("[Chat Function] ⚠️ 조회된 제품이 없습니다.");
      console.warn("[Chat Function] 조회 조건:", {
        category: categoryIds,
        product_type: productType || "모든 타입",
      });

      // product_type 필터가 있고 제품이 없으면, product_type 필터 없이 다시 시도
      // products 테이블은 'category' 컬럼 사용 (category_id 값과 동일)
      if (productType && categoryIds.length > 0) {
        console.log("[Chat Function] 🔄 product_type 필터 제거 후 재시도 시작");
        console.log(
          "[Chat Function] 재시도 조건: category IN",
          categoryIds,
          "(product_type 필터 제거)"
        );

        const retryQuery = supabase
          .from("products")
          .select(
            "product_id, product_name, product_img, category, product_type, current_price, original_price, discount_percent"
          )
          .in("category", categoryIds)
          .limit(10);

        const retryStartTime = Date.now();
        const { data: retryData, error: retryError } = await retryQuery;
        const retryEndTime = Date.now();
        console.log(
          "[Chat Function] ⏱️ 재시도 쿼리 실행 시간:",
          retryEndTime - retryStartTime,
          "ms"
        );

        if (retryError) {
          console.error("[Chat Function] ❌ 재시도 쿼리 오류 발생");
          console.error("[Chat Function] 재시도 오류 코드:", retryError.code);
          console.error(
            "[Chat Function] 재시도 오류 메시지:",
            retryError.message
          );
          console.error(
            "[Chat Function] 재시도 오류 상세:",
            JSON.stringify(retryError, null, 2)
          );
        } else {
          console.log("[Chat Function] ✅ 재시도 쿼리 실행 성공");
          console.log(
            "[Chat Function] 📊 재시도 조회된 제품 개수:",
            retryData?.length || 0,
            "개"
          );

          if (retryData && retryData.length > 0) {
            console.log(
              "[Chat Function] 🎉 product_type 필터 제거 후 조회 성공!"
            );
            console.log("[Chat Function] 📦 재시도 조회된 제품 상세 정보:");
            retryData.slice(0, 5).forEach((p, idx) => {
              console.log(
                `[Chat Function]   [${idx + 1}] product_id: ${
                  p.product_id
                }, name: ${p.product_name}, category: ${
                  p.category
                }, product_type: ${p.product_type}`
              );
            });

            // category 분포 확인
            const retryCategoryCount = {};
            const retryProductTypeCount = {};
            retryData.forEach((p) => {
              retryCategoryCount[p.category] =
                (retryCategoryCount[p.category] || 0) + 1;
              retryProductTypeCount[p.product_type] =
                (retryProductTypeCount[p.product_type] || 0) + 1;
            });
            console.log(
              "[Chat Function] 📈 재시도 category 분포:",
              retryCategoryCount
            );
            console.log(
              "[Chat Function] 📈 재시도 product_type 분포:",
              retryProductTypeCount
            );

            // retryData를 사용하도록 data 업데이트
            data = retryData;
          } else {
            console.warn("[Chat Function] ⚠️ 재시도 후에도 제품이 없습니다.");
            console.warn("[Chat Function] 재시도 조건:", {
              category: categoryIds,
              product_type: "모든 타입 (필터 제거)",
            });

            // DB에 해당 category의 제품이 있는지 확인
            console.log(
              "[Chat Function] 🔍 DB에 해당 category의 제품 존재 여부 확인 중..."
            );
            const checkQuery = supabase
              .from("products")
              .select("category, product_type")
              .in("category", categoryIds)
              .limit(1);

            const { data: checkData, error: checkError } = await checkQuery;
            if (checkError) {
              console.error("[Chat Function] ❌ 확인 쿼리 오류:", checkError);
            } else {
              console.log(
                "[Chat Function] 📊 확인 결과: category",
                categoryIds,
                "에 해당하는 제품",
                checkData?.length || 0,
                "개 존재"
              );
            }
          }
        }
      } else {
        console.warn(
          "[Chat Function] ⚠️ product_type 필터가 없어 재시도하지 않음"
        );
      }
    }

    // 제품 정렬 및 제한 (target_species 컬럼이 없으므로 단순 정렬)
    console.log("[Chat Function] 🔄 정렬 및 제한 시작");
    console.log(
      "[Chat Function] 정렬 전 제품 개수:",
      (data || []).length,
      "개"
    );

    // 단순히 상위 3개만 선택 (target_species 필터링 제거)
    const filtered = (data || []).slice(0, 3);

    console.log("[Chat Function] ✅ 필터링 및 정렬 완료");
    console.log(
      "[Chat Function] 📊 필터링 후 제품 개수:",
      filtered.length,
      "개"
    );

    if (filtered.length > 0) {
      console.log("[Chat Function] 📦 최종 추천 제품 목록:");
      filtered.forEach((p, idx) => {
        console.log(
          `[Chat Function]   [${idx + 1}] product_id: ${p.product_id}, name: ${
            p.product_name
          }`
        );
      });
    }

    // 제품이 조회되지 않았거나 필터링 후 0개인 경우
    if (filtered.length === 0) {
      if (data && data.length > 0) {
        console.warn(
          "[Chat Function] ⚠️ 제품이 조회되었지만 필터링 후 0개 - 모든 제품 포함하도록 수정"
        );
        console.log("[Chat Function] 📦 필터링 없이 상위 3개 제품 반환");
        const fallbackProducts = data.slice(0, 3).map((p) => ({
          product_id: p.product_id,
          product_name: p.product_name,
        }));
        console.log(
          "[Chat Function] ✅ 최종 반환 제품 개수:",
          fallbackProducts.length,
          "개"
        );
        console.log("========================================");
        return fallbackProducts;
      } else {
        console.warn("[Chat Function] ❌ 제품 조회 실패");
        console.warn("[Chat Function] 실패 원인: DB에 해당 조건의 제품이 없음");
        console.warn("[Chat Function] 조회 조건:", {
          category: categoryIds,
          product_type: productType || "모든 타입",
          target_species: targetSpecies,
        });
        console.log("========================================");
        // 제품이 없으면 빈 배열 반환
        return [];
      }
    }

    const finalProducts = filtered.map((p) => ({
      product_id: p.product_id,
      product_name: p.product_name,
      product_img: p.product_img || null,
      current_price: p.current_price || null,
      original_price: p.original_price || null,
      discount_percent: p.discount_percent || null,
    }));

    console.log(
      "[Chat Function] ✅ 최종 반환 제품 개수:",
      finalProducts.length,
      "개"
    );
    console.log("========================================");
    return finalProducts;
  } catch (err) {
    console.error("[Chat Function] 제품 추천 오류:", err);
    return [];
  }
}

// 키워드 → category_id 매핑 (mall/shop-script.js의 categoryMap과 일치)
// 종합관리: 1, 심장: 2, 신장/방광: 3, 간: 4, 위/장: 5, 피부: 6, 치아: 7, 뼈/관절: 8, 눈: 9, 면역력: 10, 행동: 11
const keywordToCategoryId = {
  심장: 2,
  간: 4,
  위: 5,
  장: 5,
  위장: 5,
  소화: 5,
  피부: 6,
  치아: 7,
  치: 7,
  구강: 7,
  뼈: 8,
  골: 8,
  관절: 8,
  골절: 8,
  눈: 9,
  안과: 9,
  면역: 10,
  면역력: 10,
  행동: 11,
  신장: 3,
  방광: 3,
  요로: 3,
  콩팥: 3,
};

// 질병명 키워드 매칭 (부분 매칭 지원)
function findDiseaseByKeyword(keyword, diseases) {
  const keywordLower = keyword.toLowerCase();
  const keywordNormalized = keywordLower.replace(/[^가-힣a-z0-9]/g, "");

  // 정확한 매칭
  let match = diseases.find(
    (d) =>
      d.disease_name.toLowerCase() === keywordLower ||
      d.disease_name.toLowerCase().includes(keywordLower) ||
      keywordLower.includes(d.disease_name.toLowerCase())
  );

  if (match) {
    console.log(
      "[Chat Function] 정확한 매칭으로 질병 발견:",
      match.disease_name
    );
    return match;
  }

  // 키워드 → category_id 매핑으로 질병 찾기
  for (const [key, categoryId] of Object.entries(keywordToCategoryId)) {
    if (keywordNormalized.includes(key) || key.includes(keywordNormalized)) {
      // 해당 category_id를 가진 질병 찾기
      match = diseases.find((d) => d.category_id === categoryId);
      if (match) {
        console.log(
          "[Chat Function] 키워드 매핑으로 질병 발견:",
          key,
          "→",
          match.disease_name,
          "(category_id:",
          categoryId,
          ")"
        );
        return match;
      }
    }
  }

  // 키워드 기반 매칭 (심장, 뼈, 관절 등)
  const keywordMap = {
    심장: ["심장", "심장병", "심장질환"],
    뼈: ["뼈", "골", "관절", "골절"],
    관절: ["관절", "뼈", "골"],
    피부: ["피부", "알레르기", "아토피"],
    간: ["간", "간질환"],
    위: ["위", "위장", "소화"],
    장: ["장", "위장", "소화"],
    치아: ["치아", "치", "구강"],
    눈: ["눈", "안과"],
    신장: ["신장", "콩팥", "신장질환"],
    방광: ["방광", "요로"],
    면역: ["면역", "면역력"],
  };

  for (const [key, values] of Object.entries(keywordMap)) {
    if (
      values.some(
        (v) => keywordNormalized.includes(v) || v.includes(keywordNormalized)
      )
    ) {
      // 해당 키워드와 관련된 질병 찾기
      match = diseases.find(
        (d) =>
          d.disease_name.toLowerCase().includes(key) ||
          values.some((v) => d.disease_name.toLowerCase().includes(v))
      );
      if (match) {
        console.log(
          "[Chat Function] 키워드 맵으로 질병 발견:",
          match.disease_name
        );
        return match;
      }
    }
  }

  console.log("[Chat Function] 질병 매칭 실패:", keyword);
  return null;
}

// 헬퍼 함수: 증상에서 disease_id 추출
function getDiseaseIdsFromSymptoms(symptomWords, symptoms) {
  const diseaseIds = new Set();
  symptomWords.forEach((word) => {
    symptoms
      .filter((s) => s.symptom_word === word)
      .forEach((s) => {
        if (s.disease_id) diseaseIds.add(s.disease_id);
      });
  });
  return Array.from(diseaseIds);
}

// 헬퍼 함수: disease_id에서 category_id 추출
function getDiseasesWithCategories(diseaseIds, diseases) {
  return diseases.filter((d) => diseaseIds.includes(d.disease_id));
}

// ✅ category 결정 로직 단일화 (Single Source of Truth)
// 우선순위: 키워드 기반 > 질병 기반 > 증상 기반
function resolveCategoryIds({
  directCategoryIds,      // 키워드 기반 category_id
  validatedDiseases,      // AI가 추론한 질병들
  validatedSymptoms,      // 정규화된 증상들
  symptoms,               // 전체 증상 데이터
  diseases,               // 전체 질병 데이터
}) {
  // 1순위: 키워드 기반 category_id (사용자가 직접 언급)
  if (directCategoryIds.length > 0) {
    console.log(
      "[Chat Function] category 결정: 키워드 기반",
      directCategoryIds
    );
    return directCategoryIds;
  }

  // 2순위: 질병 기반 category_id
  if (validatedDiseases.length > 0) {
    // 질병 ID 추출 (증상 기반 또는 직접 언급)
    let diseaseIds = [];

    if (validatedSymptoms.length > 0) {
      // 증상 기반: normalized_symptoms로 disease_id 수집
      diseaseIds = getDiseaseIdsFromSymptoms(validatedSymptoms, symptoms);
    }

    // 직접 언급한 질병 ID 추가
    const mentionedDiseaseIds = validatedDiseases.map((d) => d.disease_id);
    diseaseIds = [...new Set([...diseaseIds, ...mentionedDiseaseIds])];

    if (diseaseIds.length > 0) {
      // diseases 테이블 조회하여 category_id 추출
      const diseasesWithCategories = getDiseasesWithCategories(
        diseaseIds,
        diseases
      );

      const categoryIds = [
        ...new Set(
          diseasesWithCategories.map((d) => d.category_id).filter(Boolean)
        ),
      ];

      if (categoryIds.length > 0) {
        console.log(
          "[Chat Function] category 결정: 질병 기반",
          categoryIds
        );
        return categoryIds;
      }
    }
  }

  // 3순위: 증상 기반 category_id (질병이 없을 때만)
  if (validatedSymptoms.length > 0 && validatedDiseases.length === 0) {
    const diseaseIds = getDiseaseIdsFromSymptoms(validatedSymptoms, symptoms);
    if (diseaseIds.length > 0) {
      const diseasesWithCategories = getDiseasesWithCategories(
        diseaseIds,
        diseases
      );
      const categoryIds = [
        ...new Set(
          diseasesWithCategories.map((d) => d.category_id).filter(Boolean)
        ),
      ];
      if (categoryIds.length > 0) {
        console.log(
          "[Chat Function] category 결정: 증상 기반",
          categoryIds
        );
        return categoryIds;
      }
    }
  }

  // category를 결정할 수 없음
  console.log("[Chat Function] category 결정: 실패 (정보 부족)");
  return [];
}

// AI를 사용한 증상 정규화 및 질병 후보 선택
async function analyzeSymptoms(userMessage, dbData, apiKey, history = []) {
  const { symptoms, diseases } = dbData;

  // 증상 키워드 목록 생성 (symptom_word만)
  const allSymptomWords = [
    ...new Set(symptoms.map((s) => s.symptom_word).filter(Boolean)),
  ];
  
  // 사용자 메시지 분석: 추천 요청인지, 증상 질문인지, 일반 질문인지 판단
  // 키워드 → category_id 매핑은 전역 keywordToCategoryId 사용 (435줄)
  const userMessageLower = userMessage.toLowerCase();
  
  // 키워드 기반 category_id 추출
  let directCategoryIds = [];
  const messageForMatching = userMessageLower;
  for (const [key, categoryId] of Object.entries(keywordToCategoryId)) {
    let shouldMatch = false;
    if (key === "장") {
      const 장Keywords = ["위장", "소화", "장기", "장애", "장염", "위/장"];
      shouldMatch = 장Keywords.some((kw) => messageForMatching.includes(kw));
      if (messageForMatching.includes("좋은") && !shouldMatch) {
        continue;
      }
    } else {
      const regex = new RegExp(`(^|[^가-힣])${key}([^가-힣]|$)`, "i");
      shouldMatch =
        regex.test(messageForMatching) || messageForMatching.includes(key);
    }
    if (shouldMatch && !directCategoryIds.includes(categoryId)) {
      directCategoryIds.push(categoryId);
    }
  }
  
  // 🔥 관리 질문 체크 (AI 호출 전에 최우선 처리)
  const isCareGuidanceQuestion =
    userMessageLower.includes("지켜") ||
    userMessageLower.includes("관찰") ||
    userMessageLower.includes("바로") ||
    userMessageLower.includes("며칠") ||
    userMessageLower.includes("산책") ||
    userMessageLower.includes("점프") ||
    userMessageLower.includes("계단") ||
    userMessageLower.includes("관리") ||
    userMessageLower.includes("조심") ||
    userMessageLower.includes("해야") ||
    userMessageLower.includes("해야하") ||
    userMessageLower.includes("가야") ||
    userMessageLower.includes("가야하") ||
    userMessageLower.includes("급한") ||
    userMessageLower.includes("긴급");

  // 관리 질문이면 AI 호출 없이 즉시 반환
  if (isCareGuidanceQuestion) {
    console.log("[Chat Function] 관리 질문 감지 - AI 호출 스킵");

    // ✅ category 결정 (단일 함수 사용)
    let categoryIds = resolveCategoryIds({
      directCategoryIds,
      validatedDiseases: [],
      validatedSymptoms: [],
      symptoms,
      diseases,
    });

    // category가 없으면 키워드 기반 보정 (관절/산책/다리 → 뼈/관절)
    if (categoryIds.length === 0) {
      if (/다리|산책|뒷다리|절뚝|걷|관절|뼈|보행/.test(userMessageLower)) {
        categoryIds = [8]; // 뼈/관절
        console.log(
          "[Chat Function] 관리 질문 category 보정: 뼈/관절 (8)"
        );
      }
    }

    // 간단한 관리 가이드 메시지 생성
    let careMessage = "말씀해주신 내용을 바탕으로 관리 방법을 안내드리겠습니다. ";
    if (categoryIds.length > 0) {
      const categoryNames = {
        2: "심장",
        3: "신장/방광",
        4: "간",
        5: "위/장",
        6: "피부",
        7: "치아",
        8: "뼈/관절",
        9: "눈",
        10: "면역력",
        11: "행동",
      };
      const categoryName =
        categoryNames[categoryIds[0]] || "관련 분야";
      careMessage += `${categoryName} 관련 주의사항을 참고하시되, `;
    }
    careMessage +=
      "정확한 상태 확인을 위해 병원 진료를 받아보시는 것을 권장드립니다.";

    return {
      status: "ok",
      intent: "care_guidance", // ✅ 관리 질문 의도 명시
      normalized_symptoms: [],
      suspected_diseases: [], // 관리 질문은 disease 언급 완전 차단
      category_ids: categoryIds,
      recommendations: {
        hospitals: [], // 관리 질문은 추천 없음
        products: [], // 관리 질문은 추천 없음
      },
      message: careMessage,
    };
  }

  // category_id별 symptom 필터링 (프롬프트 길이 줄이기)
  let symptomWords = allSymptomWords;
  if (directCategoryIds.length > 0) {
    const categoryDiseaseIds = new Set(
      diseases
        .filter((d) => directCategoryIds.includes(d.category_id))
        .map((d) => d.disease_id)
    );
    const categorySymptomWords = new Set(
      symptoms
        .filter((s) => categoryDiseaseIds.has(s.disease_id))
        .map((s) => s.symptom_word)
        .filter(Boolean)
    );
    
    // category_id별 symptom이 있으면 그것만 사용, 없으면 전체 사용
    if (categorySymptomWords.size > 0 && categorySymptomWords.size < allSymptomWords.length) {
      symptomWords = Array.from(categorySymptomWords);
      console.log(
        "[Chat Function] category_id별 symptom 필터링:",
        directCategoryIds,
        "→",
        symptomWords.length,
        "개 symptom (전체:",
        allSymptomWords.length,
        "개)"
      );
    }
  }

  // 질병 목록 생성
  const diseaseList = diseases.map((d) => ({
    id: d.disease_id,
    name: d.disease_name,
  }));

  // 추천 요청 키워드 확인
  const hasRecommendationRequest =
    userMessageLower.includes("추천") ||
    userMessageLower.includes("제품") ||
    userMessageLower.includes("상품") ||
    userMessageLower.includes("사료") ||
    userMessageLower.includes("영양제") ||
    userMessageLower.includes("병원") ||
    userMessageLower.includes("예약") ||
    userMessageLower.includes("진료");

  // 카테고리 키워드 확인
  const hasCategoryKeyword = Object.keys(keywordToCategoryId).some((key) =>
    userMessageLower.includes(key)
  );

  // 증상 관련 키워드 확인
  const hasSymptomKeywords =
    symptomWords.some((symptom) =>
      userMessageLower.includes(symptom.toLowerCase())
    ) ||
    userMessageLower.includes("증상") ||
    userMessageLower.includes("아파") ||
    userMessageLower.includes("아픈") ||
    userMessageLower.includes("불편") ||
    userMessageLower.includes("문제");

  console.log("[Chat Function] 메시지 분석:", {
    isCareGuidanceQuestion,
    hasRecommendationRequest,
    hasCategoryKeyword,
    hasSymptomKeywords,
    userMessage,
  });

  // 사용자 메시지에서 질병 키워드 추출 시도
  const possibleDisease = findDiseaseByKeyword(userMessage, diseases);

  // A안(현실 타협) SYSTEM PROMPT - 탐색 가이드 AI 역할
  const systemPrompt = `너는 반려동물(강아지, 고양이 등) 건강 상담 보조 AI다.

❗ 모든 답변은 반려동물에 대한 정보 제공 목적이다.
❗ 사람에 대한 건강 조언은 절대 하지 않는다.
❗ 의료 진단, 치료 확정, 비용 안내는 하지 않는다.

---

[챗봇 역할]

이 챗봇은 의료 판단 AI가 아니라
증상·키워드를 질병 카테고리(category_id) 수준으로 정규화하여
병원·제품 정보를 "탐색"할 수 있도록 돕는 가이드 AI다.

❌ 하지 않는 것:
- 질병 확정 진단
- 치료 단계/수술 여부 판단
- 비용 범위, 검사비 안내
- 특정 병원·제품이 치료 효과가 있다고 단정

✅ 하는 것:
- 증상/키워드 → disease_id → category_id 정규화
- category_id 기반 병원/제품 추천
- "왜 이 추천이 나왔는지" 설명
- 일반적인 반려동물 건강 정보 제공

---

[대화 맥락]

- 이전 대화에서 언급된 반려동물 정보(종, 나이, 증상, 질병 키워드)를 기억하고 활용한다.
- 사용자가 질병명 또는 질병 관련 키워드(심장, 뼈, 관절, 피부 등)를 언급한 경우,
  추가 증상 정규화 없이 해당 disease_id를 suspected_diseases에 포함한다.
- 대화가 이어지는 경우 이전 맥락을 고려하여 응답하라.

---

[증상 처리 규칙]

- 질병명을 모른 채 증상만 언급한 경우에만 증상 정규화를 시도한다.
- 증상은 서버에서 전달된 symptom_word 목록 중에서만 선택한다.
- 증상이 모호하거나 부족하면 status를 "uncertain"으로 설정한다.
- 새로운 증상이나 질병명을 생성하지 마라.

[disease_id 자동 감지 제한 규칙 - 매우 중요]

disease_id는 아래 경우에만 suspected_diseases에 포함한다:

1) 사용자가 질병명을 직접 언급한 경우
2) symptom_word 매칭 결과가 동일 category_id 내에서만 발생한 경우

❌ 절대 금지:
- 서로 다른 category_id의 disease_id를 동시에 포함하지 않는다.
- 예: 관절/뼈(category_id=8) 증상 → 장염(category_id=5) ❌ 차단

✅ 올바른 예:
- 관절/뼈 증상 → 슬개골탈구(category_id=8) ✅ 허용
- 위/장 증상 → 장염(category_id=5) ✅ 허용

[disease_id 언급 수 제한]

- 하나의 응답에서 disease_id는 최대 1개만 언급한다.
- 확신도 낮을 경우 disease_id 언급 없이 category 설명만 제공한다.
- status: "uncertain"인 경우 disease_id를 언급하지 않는다.

---

[추천 규칙]

- 병원과 제품은 서버에서 제공된 데이터만 사용한다.
- 추천 대상은 AI가 선택하지 않으며, 제공된 결과를 설명하는 역할만 한다.
- "치료", "완치", "수술 필요", "수술", "검사비", "비용" 같은 표현은 사용하지 않는다.
- 반드시 아래와 같은 보조 표현만 사용한다:
  - "~에 도움이 될 수 있습니다"
  - "~를 참고하실 수 있습니다"
  - "~를 확인해보실 수 있습니다"

[category_id 우선 규칙 - 핵심]

우선순위:
1. 사용자 질병 키워드 → category_id (최우선)
2. 증상 → disease_id → category_id (category_id 일치 확인 필수)
3. 추천은 항상 category_id 기준으로만 수행

disease_id는 설명 보조용이며, message에서도 category 기준 설명을 우선한다.

---

[message 작성 규칙 - 매우 중요]

message에는 반드시 포함해야 한다:

1. 왜 이 카테고리(category_id)로 분류됐는지 설명
   예: "말씀해주신 증상은 반려견의 움직임이나 관절 사용과 관련해 자주 언급되는 경우와 유사해 보여요."

2. 이 추천이 참고용임을 명확히 표시
   예: "그래서 뼈·관절 분야를 중심으로 진료하는 병원과, 일상적인 관절 관리에 참고할 수 있는 정보들을 함께 안내드렸어요."

3. 병원 방문 권장 (완곡하게, 강요 톤 금지)
   예: "정확한 상태 확인은 병원 진료를 통해 이루어지는 것이 좋아요."

❌ 금지 표현:
- "~질병이 감지되었습니다" (확정 뉘앙스)
- 질병명 다중 언급
- "~질병일 수 있습니다" (여러 질병 나열)

✅ 올바른 예시 (슬개골/관절 케이스):
"말씀해주신 증상은 반려견의 움직임이나 관절 사용과 관련해 자주 언급되는 경우와 유사해 보여요. 그래서 뼈·관절 분야를 중심으로 진료하는 병원과, 일상적인 관절 관리에 참고할 수 있는 정보들을 함께 안내드렸어요. 정확한 상태 확인은 병원 진료를 통해 이루어지는 것이 좋아요."

---

표준 증상 목록: ${JSON.stringify(symptomWords)}
질병 목록: ${JSON.stringify(diseaseList)}

응답은 반드시 JSON 형식으로만 출력하라.

일반 질문 응답 형식 (예: "예방접종 안내"):
{
  "status": "ok",
  "normalized_symptoms": [],
  "suspected_diseases": [],
  "category_ids": [],
  "message": "예방접종 일정에 대해 안내해드릴게요. 쿵이의 나이와 최근 접종 이력을 알려주시면 맞춤 일정을 제안해드릴 수 있어요.",
  "recommendations": {
    "hospitals": [],
    "products": []
  }
}

증상 기반 질문 응답 형식:
{
  "status": "ok",
  "normalized_symptoms": ["증상키워드1", "증상키워드2"],
  "suspected_diseases": [
    {"disease_id": 1, "confidence": "high"}
  ],
  "category_ids": [8],
  "message": "왜 이 카테고리로 분류됐는지 설명 + 참고용임을 명확히 + 병원 방문 권장 (완곡하게)",
  "recommendations": {
    "hospitals": [...],
    "products": [...]
  }
}

판단 불가 시 (status: "uncertain"):
{
  "status": "uncertain",
  "normalized_symptoms": [],
  "suspected_diseases": [],  // ❌ disease_id 언급 금지
  "category_ids": [],
  "message": "현재 정보만으로 특정 질병 카테고리를 유추하기 어렵습니다. 증상을 조금 더 자세히 알려주시면 도움을 드릴 수 있어요.",
  "recommendations": {
    "hospitals": [],
    "products": []
  }
}

**중요: status가 "uncertain"인 경우 disease_id를 절대 언급하지 않는다.

[관리 질문 처리 규칙 - 매우 중요]

사용자가 아래와 같은 질문을 할 때는 병원/제품 추천이 아니라 "관리 가이드"를 제공해야 합니다:

- "지금 바로 병원에 가야 하나요?"
- "며칠 지켜봐도 되나요?"
- "산책/점프/계단을 어떻게 해야 하나요?"
- "관리 방법을 알려주세요"
- "조심해야 할 점이 있나요?"

관리 질문 응답 형식:
{
  "status": "ok",
  "normalized_symptoms": [],
  "suspected_diseases": [],
  "category_ids": [8],  // category_id는 유지
  "message": "관리 가이드 중심의 답변 (병원 방문 시점, 일상 관리 방법, 주의사항 등)",
  "recommendations": {
    "hospitals": [],  // 추천 없음
    "products": []    // 추천 없음
  }
}

**중요: 관리 질문일 때는 추천을 제공하지 않고, 관리 기준과 주의사항만 안내합니다.**`;

  // directCategoryIds는 이미 위에서 추출됨 (symptom 필터링을 위해)
  console.log("[Chat Function] 추출된 directCategoryIds:", directCategoryIds);

  // product_type 추출 (사료, 영양제, 간식 등)
  let detectedProductType = null;
  if (userMessageLower.includes("사료")) {
    detectedProductType = "사료";
  } else if (userMessageLower.includes("영양제")) {
    detectedProductType = "영양제";
  } else if (userMessageLower.includes("간식")) {
    detectedProductType = "간식";
  }

  console.log("[Chat Function] 추출된 product_type:", detectedProductType);

  // 로직 분기: 추천 요청 + 카테고리 키워드가 있으면 AI 호출 없이 바로 추천
  if (
    hasRecommendationRequest &&
    hasCategoryKeyword &&
    directCategoryIds.length > 0 &&
    !hasSymptomKeywords
  ) {
    console.log("[Chat Function] 추천 요청 감지 - 질병 감지 없이 바로 추천");

    // 사용자 요청 분석
    const wantsProducts =
      userMessageLower.includes("제품") ||
      userMessageLower.includes("상품") ||
      userMessageLower.includes("사료") ||
      userMessageLower.includes("영양제") ||
      userMessageLower.includes("간식");
    const wantsHospitals =
      userMessageLower.includes("병원") ||
      userMessageLower.includes("예약") ||
      userMessageLower.includes("진료");

    let recommendedHospitals = [];
    let recommendedProducts = [];

    if (wantsProducts && !wantsHospitals) {
      // 제품만 추천 (product_type 필터링 포함)
      recommendedProducts = await getRecommendedProducts(
        directCategoryIds,
        "강아지",
        detectedProductType
      );
      console.log(
        "[Chat Function] 직접 제품 추천 결과:",
        recommendedProducts.length,
        "개",
        { categoryIds: directCategoryIds, productType: detectedProductType }
      );
    } else if (wantsHospitals && !wantsProducts) {
      // 병원만 추천
      recommendedHospitals = await getRecommendedHospitals(directCategoryIds);
      console.log(
        "[Chat Function] 직접 병원 추천 결과:",
        recommendedHospitals.length,
        "개"
      );
    } else {
      // 둘 다 추천 (제품 우선)
      recommendedProducts = await getRecommendedProducts(
        directCategoryIds,
        "강아지",
        detectedProductType
      );
      recommendedHospitals = await getRecommendedHospitals(directCategoryIds);
      console.log("[Chat Function] 직접 추천 결과:", {
        products: recommendedProducts.length,
        hospitals: recommendedHospitals.length,
        productType: detectedProductType,
      });
    }

    // 메시지 생성
    let message = "";
    if (recommendedProducts.length > 0) {
      const categoryName =
        Object.entries(keywordToCategoryId).find(([k, v]) =>
          directCategoryIds.includes(v)
        )?.[0] || "관련";
      message = `${categoryName} 관련 ${
        detectedProductType || "제품"
      } 추천입니다. 아래 정보를 참고하세요.`;
    } else if (recommendedHospitals.length > 0) {
      const categoryName =
        Object.entries(keywordToCategoryId).find(([k, v]) =>
          directCategoryIds.includes(v)
        )?.[0] || "관련";
      message = `${categoryName} 관련 병원 추천입니다. 아래 정보를 참고하세요.`;
    } else {
      // 제품과 병원 모두 없을 때
      const categoryName =
        Object.entries(keywordToCategoryId).find(([k, v]) =>
          directCategoryIds.includes(v)
        )?.[0] || "관련";
      const productTypeText = detectedProductType
        ? `${detectedProductType} `
        : "";
      message = `${categoryName} 관련 ${productTypeText}제품 정보가 현재 등록되어 있지 않습니다. 자사몰에서 다른 ${productTypeText}제품을 확인해보시거나 가까운 동물병원에 상담을 받아보시기 바랍니다.`;
    }

    return {
      status: "ok",
      intent: "recommendation", // ✅ 직접 추천 요청
      normalized_symptoms: [],
      suspected_diseases: [],
      category_ids: directCategoryIds,
      recommendations: {
        hospitals: recommendedHospitals,
        products: recommendedProducts,
      },
      message: message,
    };
  }

  // 증상 질문이거나 일반 질문인 경우 AI 호출
  // 히스토리 컨텍스트 구성
  let historyContext = "";
  if (history && history.length > 0) {
    historyContext =
      "\n\n이전 대화:\n" +
      history
        .slice(-5)
        .map((h, idx) => {
          const role = h.role === "user" ? "사용자" : "AI";
          return `${role}: ${h.content}`;
        })
        .join("\n");
  }

  // 가능한 질병 정보 추가
  let diseaseHint = "";
  if (possibleDisease) {
    diseaseHint = `\n\n참고: 사용자 메시지에서 "${possibleDisease.disease_name}" (disease_id: ${possibleDisease.disease_id}) 질병이 감지되었습니다. 이 질병을 suspected_diseases에 포함하세요.`;
  }

  const userPrompt = `사용자 메시지: "${userMessage}"${historyContext}${diseaseHint}

위 메시지에서 증상 또는 키워드를 분석하고, DB 데이터만 사용하여 응답을 생성하세요. 이전 대화 맥락을 고려하여 응답하세요.

**중요 규칙:**
- 모든 조언은 반려동물(강아지, 고양이 등)에 대한 것이어야 합니다. 사람에 대한 건강 조언을 절대 하지 마세요.
- "체중관리" 질문이면 반려동물의 체중관리 방법(적절한 사료량, 운동 등)을 답변하세요.
- "운동" 질문이면 반려동물의 운동(산책, 놀이 등)에 대해 답변하세요.
- 사람의 운동량이나 식습관 조언을 제공하지 마세요.

**관리 질문 처리 (매우 중요):**
사용자가 "지금 바로 병원에 가야 하나요?", "며칠 지켜봐도 되나요?", "산책/점프/계단을 어떻게 해야 하나요?" 같은 질문을 할 때는:
- 병원/제품 추천을 제공하지 않습니다 (recommendations는 빈 배열)
- category_id는 유지하되, 관리 가이드 중심의 message를 생성합니다
- 병원 방문 시점, 일상 관리 방법, 주의사항 등을 안내합니다

**message 작성 시 반드시 포함:**
1. 왜 이 카테고리(category_id)로 분류됐는지 설명
2. 이 추천이 참고용임을 명확히 표시 (관리 질문이 아닐 때만)
3. 병원 방문 권장 (완곡하게, 강요 톤 금지)

**금지 표현:**
- "치료", "완치", "수술 필요", "수술", "검사비", "비용", "가격"
- "이 제품이 질병을 치료한다", "이 병원에서 질병을 치료할 수 있다"

**필수 표현:**
- "~에 도움이 될 수 있습니다"
- "~를 참고하실 수 있습니다"
- "~를 확인해보실 수 있습니다"`;

  try {
    // 히스토리를 메시지에 포함
    const messages = [{ role: "system", content: systemPrompt }];

    // 히스토리 추가 (최근 5개만)
    if (history && history.length > 0) {
      messages.push(...history.slice(-5));
    }

    messages.push({ role: "user", content: userPrompt });

    // 타임아웃 방지를 위한 AbortController
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000); // 12초 타임아웃

    let completionRes;
    try {
      completionRes = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-4o-mini", // gpt-3.5-turbo에서 변경 (JSON 안정성 및 규칙 준수 향상)
            messages: messages,
            temperature: 0.7,
            max_tokens: 500,
            response_format: { type: "json_object" },
          }),
          signal: controller.signal,
        }
      );
      clearTimeout(timeoutId);
    } catch (fetchErr) {
      clearTimeout(timeoutId);
      if (fetchErr.name === "AbortError") {
        throw new Error("요청 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.");
      }
      throw fetchErr;
    }

    const raw = await completionRes.text();

    if (!completionRes.ok) {
      try {
        const errJson = JSON.parse(raw);
        const code = errJson?.error?.code || "";
        const msg = errJson?.error?.message || raw || "OpenAI error";

        const friendly =
          code === "insufficient_quota"
            ? "OpenAI 크레딧이 부족합니다. 결제/충전 후 다시 시도해주세요."
            : code === "invalid_api_key"
            ? "OpenAI API 키가 유효하지 않습니다. 환경변수를 확인하세요."
            : msg;

        throw new Error(friendly);
      } catch (e) {
        throw new Error(e.message || "OpenAI API 오류");
      }
    }

    const json = JSON.parse(raw);
    const aiResponse = json.choices?.[0]?.message?.content || "";

    // JSON 파싱 (이중 파싱 방지 및 안정화)
    let analysisResult;
    try {
      // content가 이미 object인 경우와 string인 경우 모두 처리
      if (typeof aiResponse === "string") {
        analysisResult = JSON.parse(aiResponse);
      } else if (typeof aiResponse === "object" && aiResponse !== null) {
        analysisResult = aiResponse;
      } else {
        throw new Error("Unexpected response format");
      }
    } catch (e) {
      console.error("AI 응답 JSON 파싱 실패:", e);
      console.error("원본 응답:", aiResponse);
      // 판단 불가로 처리
      analysisResult = {
        status: "uncertain",
        normalized_symptoms: [],
        suspected_diseases: [],
        category_ids: [],
        message:
          "응답을 해석하는 중 문제가 발생했습니다. 증상을 다시 설명해주시면 도움을 드릴 수 있어요.",
        recommendations: {
          hospitals: [],
          products: [],
        },
      };
    }

    // normalized_symptoms 검증 (DB에 있는 symptom_word만 허용)
    const validSymptomWords = new Set(symptomWords);
    const validatedSymptoms = (analysisResult.normalized_symptoms || []).filter(
      (s) => validSymptomWords.has(s)
    );

    // suspected_diseases 검증 및 처리 (category_id 일치 확인 필수)
    let validatedDiseases = [];
    if (
      analysisResult.suspected_diseases &&
      analysisResult.suspected_diseases.length > 0
    ) {
      const validDiseaseIds = new Set(diseases.map((d) => d.disease_id));
      const diseaseMap = new Map(
        diseases.map((d) => [d.disease_id, d.category_id])
      );

      // 1차 필터링: 유효한 disease_id만
      let candidateDiseases = analysisResult.suspected_diseases
        .filter((d) => validDiseaseIds.has(d.disease_id))
        .map((d) => ({
          disease_id: d.disease_id,
          confidence: d.confidence || "medium",
          category_id: diseaseMap.get(d.disease_id),
        }));

      // 2차 필터링: category_id 일치 확인
      // 증상 기반으로 추출된 category_id가 있으면 그것과 일치하는 것만 허용
      let targetCategoryIds = [];
      
      // 증상 기반 category_id 추출
      if (validatedSymptoms.length > 0) {
        const symptomDiseaseIds = getDiseaseIdsFromSymptoms(
          validatedSymptoms,
          symptoms
        );
        if (symptomDiseaseIds.length > 0) {
          const diseasesWithCategories = getDiseasesWithCategories(
            symptomDiseaseIds,
            diseases
          );
          targetCategoryIds = [
            ...new Set(
              diseasesWithCategories
                .map((d) => d.category_id)
                .filter(Boolean)
            ),
          ];
        }
      }

      // 키워드 기반 category_id 추가
      if (directCategoryIds.length > 0) {
        targetCategoryIds = [
          ...new Set([...targetCategoryIds, ...directCategoryIds]),
        ];
      }

      // category_id 필터링: targetCategoryIds가 있으면 일치하는 것만 허용
      if (targetCategoryIds.length > 0) {
        candidateDiseases = candidateDiseases.filter((d) =>
          targetCategoryIds.includes(d.category_id)
        );
        console.log(
          "[Chat Function] category_id 필터링 적용:",
          targetCategoryIds,
          "→",
          candidateDiseases.length,
          "개 disease_id 통과"
        );
      }

      // 3차 필터링: 동일 category_id 내에서만 허용
      if (candidateDiseases.length > 0) {
        const categoryGroups = {};
        candidateDiseases.forEach((d) => {
          if (!categoryGroups[d.category_id]) {
            categoryGroups[d.category_id] = [];
          }
          categoryGroups[d.category_id].push(d);
        });

        // 가장 많은 disease_id를 가진 category_id 선택
        const dominantCategory = Object.keys(categoryGroups).reduce((a, b) =>
          categoryGroups[a].length > categoryGroups[b].length ? a : b
        );

        validatedDiseases = categoryGroups[dominantCategory];
        console.log(
          "[Chat Function] 동일 category_id 필터링:",
          dominantCategory,
          "→",
          validatedDiseases.length,
          "개 disease_id"
        );
      }

      // 4차 필터링: 최대 1개만 허용
      if (validatedDiseases.length > 1) {
        // confidence가 높은 것 우선, 같으면 첫 번째 것
        validatedDiseases.sort((a, b) => {
          const confidenceOrder = { high: 3, medium: 2, low: 1 };
          return (
            (confidenceOrder[b.confidence] || 0) -
            (confidenceOrder[a.confidence] || 0)
          );
        });
        validatedDiseases = [validatedDiseases[0]];
        console.log(
          "[Chat Function] disease_id 최대 1개 제한:",
          validatedDiseases[0].disease_id
        );
      }
    }

    // 사용자가 직접 질병명을 언급한 경우 (category_id 검증 필수)
    if (possibleDisease && validatedDiseases.length === 0) {
      // category 충돌 방지: directCategoryIds가 있고, possibleDisease의 category_id와 다르면 무시
      if (
        directCategoryIds.length > 0 &&
        !directCategoryIds.includes(possibleDisease.category_id)
      ) {
        console.log(
          "[Chat Function] category 충돌 감지 - 질병 무시:",
          possibleDisease.disease_name,
          "category_id:",
          possibleDisease.category_id,
          "vs directCategoryIds:",
          directCategoryIds
        );
        // category 충돌 → disease 무시
      } else {
        const alreadyIncluded = validatedDiseases.some(
          (d) => d.disease_id === possibleDisease.disease_id
        );
        if (!alreadyIncluded) {
          console.log(
            "[Chat Function] 사용자 직접 언급 질병 추가:",
            possibleDisease.disease_name
          );
          validatedDiseases.push({
            disease_id: possibleDisease.disease_id,
            confidence: "medium",
            category_id: possibleDisease.category_id,
          });
        }
      }
    }

    // status: "uncertain"인 경우 disease_id 제거
    const isUncertain =
      validatedDiseases.length === 0 &&
      validatedSymptoms.length === 0 &&
      directCategoryIds.length === 0;

    if (analysisResult.status === "uncertain" || isUncertain) {
      validatedDiseases = []; // disease_id 언급 금지
      console.log(
        "[Chat Function] status: uncertain → disease_id 제거"
      );
    }

    console.log("[Chat Function] 판단 불가 여부:", {
      isUncertain,
      validatedDiseases: validatedDiseases.length,
      validatedSymptoms: validatedSymptoms.length,
      directCategoryIds: directCategoryIds.length,
    });

    // 명세서에 따른 처리 순서:
    // 1. normalized_symptoms로 symptoms 테이블 조회 (증상 기반)
    // 2. disease_id 수집
    // 3. diseases 테이블 조회 → category_id
    // 4. category_id로 병원/제품 추천
    // 또는 질병을 이미 언급한 경우: suspected_diseases에서 직접 category_id 추출
    // 또는 키워드로 직접 category_id 추출
    let categoryIds = [];
    let finalDiseases = [];
    let recommendedHospitals = [];
    let recommendedProducts = [];

    // 관리 질문은 이미 함수 상단에서 처리되어 return됨 (여기서는 도달하지 않음)
    if (!isUncertain) {
      // ✅ categoryIds 결정 (단일 함수 사용)
      categoryIds = resolveCategoryIds({
        directCategoryIds,
        validatedDiseases,
        validatedSymptoms,
        symptoms,
        diseases,
      });

      // validatedDiseases와 매칭 (finalDiseases 구성)
      if (validatedDiseases.length > 0) {
        finalDiseases = validatedDiseases.map((d) => {
          return {
            disease_id: d.disease_id,
            confidence: d.confidence,
          };
        });
      }

      // ✅ 추천 실행 (한 번만, 재시도 없음)
      if (categoryIds.length > 0) {
        const userMessageLowerForRecommendation = userMessage.toLowerCase();
        const wantsProducts =
          userMessageLowerForRecommendation.includes("제품") ||
          userMessageLowerForRecommendation.includes("상품") ||
          userMessageLowerForRecommendation.includes("사료") ||
          userMessageLowerForRecommendation.includes("영양제") ||
          userMessageLowerForRecommendation.includes("추천해줘");
        const wantsHospitals =
          userMessageLowerForRecommendation.includes("병원") ||
          userMessageLowerForRecommendation.includes("예약") ||
          userMessageLowerForRecommendation.includes("진료");

        console.log("[Chat Function] 추천 요청 분석:", {
          wantsProducts,
          wantsHospitals,
          categoryIds,
        });

        // 사용자가 명시적으로 요청한 경우만 해당 추천 제공
        if (wantsProducts && !wantsHospitals) {
          // 제품만 추천
          recommendedProducts = await getRecommendedProducts(categoryIds);
          console.log(
            "[Chat Function] 제품 추천 결과:",
            recommendedProducts.length,
            "개"
          );
        } else if (wantsHospitals && !wantsProducts) {
          // 병원만 추천
          recommendedHospitals = await getRecommendedHospitals(categoryIds);
          console.log(
            "[Chat Function] 병원 추천 결과:",
            recommendedHospitals.length,
            "개"
          );
        } else {
          // 둘 다 요청하거나 명시하지 않은 경우: 둘 다 추천 (순차 실행)
          recommendedHospitals = await getRecommendedHospitals(categoryIds);
          recommendedProducts = await getRecommendedProducts(categoryIds);
          console.log("[Chat Function] 추천 결과:", {
            products: recommendedProducts.length,
            hospitals: recommendedHospitals.length,
          });
        }
      }
    }

    // 응답 생성 (명세서 형식 준수, recommendations 필드 추가)
    if (isUncertain) {
      return {
        status: "uncertain",
        intent: "question", // ✅ 일반 질문 (판단 불가)
        normalized_symptoms: validatedSymptoms,
        suspected_diseases: [],
        category_ids: [],
        recommendations: {
          hospitals: [],
          products: [],
        },
        message:
          analysisResult.message ||
          "현재 정보만으로 특정 질병 카테고리를 유추하기 어렵습니다. 증상을 조금 더 자세히 알려주시면 도움을 드릴 수 있어요.",
      };
    } else {
      // 추천이 없는 경우 AI 메시지 조정
      // (관리 질문은 이미 상단에서 return되므로 여기까지 오는 경우는 관리 질문이 아님)
      let finalMessage =
        analysisResult.message ||
        "말씀해주신 내용을 바탕으로 관련 정보를 찾아보았습니다. 정확한 상태 확인을 위해 병원 진료를 받아보시는 것을 권장드립니다.";

      const wantsProducts =
        userMessageLower.includes("제품") ||
        userMessageLower.includes("상품") ||
        userMessageLower.includes("사료") ||
        userMessageLower.includes("영양제");

      if (
        recommendedHospitals.length === 0 &&
        recommendedProducts.length === 0
      ) {
        if (wantsProducts) {
          finalMessage =
            "현재 등록된 제품 정보가 제한적이므로, 자사몰에서 관련 제품을 확인해보시거나 가까운 동물병원에 상담을 받아보시기 바랍니다.";
        } else {
          finalMessage =
            "현재 등록된 병원 정보가 제한적이므로, 가까운 동물병원 방문을 우선 권장드립니다.";
        }
      }

      console.log("[Chat Function] 최종 응답:", {
        status: "ok",
        categoryIds: categoryIds.length,
        hospitals: recommendedHospitals.length,
        products: recommendedProducts.length,
      });

      // ✅ intent 결정: 추천이 있으면 "recommendation", 없으면 "question"
      const hasRecommendations = 
        (recommendedHospitals.length > 0) || (recommendedProducts.length > 0);
      const intent = hasRecommendations ? "recommendation" : "question";

      return {
        status: "ok",
        intent: intent, // ✅ 추천 여부에 따라 intent 설정
        normalized_symptoms: validatedSymptoms,
        suspected_diseases: finalDiseases,
        category_ids: categoryIds,
        recommendations: {
          hospitals: recommendedHospitals,
          products: recommendedProducts,
        },
        message: finalMessage,
      };
    }
  } catch (err) {
    console.error("AI 분석 오류:", err);
    return {
      status: "uncertain",
      intent: "question", // ✅ 에러 시 일반 질문으로 처리
      normalized_symptoms: [],
      suspected_diseases: [],
      category_ids: [],
      recommendations: {
        hospitals: [],
        products: [],
      },
      message:
        err.message || "정보를 처리하는 중 오류가 발생했습니다. 다시 시도해주세요.",
    };
  }
}

exports.handler = async (event) => {
  console.log("[Chat Function] 요청 시작:", event.httpMethod);

  // 메서드 체크
  if (event.httpMethod !== "POST" && event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Method Not Allowed" }),
    };
  }

  // 헬스체크
  if (event.httpMethod === "GET") {
    console.log("[Chat Function] 헬스체크 성공");
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "OK",
        message: "AI Chat Function is alive",
      }),
    };
  }

  try {
    console.log("[Chat Function] POST 요청 처리 시작");

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error("[Chat Function] OPENAI_API_KEY 누락");
      return {
        statusCode: 500,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "OPENAI_API_KEY is missing" }),
      };
    }

    let requestBody;
    try {
      requestBody = JSON.parse(event.body || "{}");
    } catch (parseErr) {
      console.error("[Chat Function] 요청 본문 파싱 오류:", parseErr);
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Invalid JSON in request body" }),
      };
    }

    const { message, history = [] } = requestBody;
    if (!message) {
      console.error("[Chat Function] message 필드 누락");
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "message is required" }),
      };
    }

    console.log("[Chat Function] 메시지:", message.substring(0, 50) + "...");
    console.log("[Chat Function] 히스토리 길이:", history.length);

    // DB 데이터 로드
    console.log("[Chat Function] DB 데이터 로드 시작");
    let dbData;
    try {
      dbData = await loadDatabaseData();
      console.log("[Chat Function] DB 데이터 로드 완료:", {
        symptomsCount: dbData.symptoms?.length || 0,
        diseasesCount: dbData.diseases?.length || 0,
      });
    } catch (dbErr) {
      console.error("[Chat Function] DB 데이터 로드 실패:", dbErr);
      return {
        statusCode: 500,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "uncertain",
          intent: "question", // ✅ DB 오류 시 일반 질문으로 처리
          normalized_symptoms: [],
          suspected_diseases: [],
          category_ids: [],
          recommendations: {
            hospitals: [],
            products: [],
          },
          message: "데이터베이스 조회 중 오류가 발생했습니다.",
        }),
      };
    }

    // 증상 분석 및 질병 후보 선택
    console.log("[Chat Function] AI 분석 시작");
    let analysisResult;
    try {
      analysisResult = await analyzeSymptoms(message, dbData, apiKey, history);
      console.log("[Chat Function] AI 분석 완료:", analysisResult.status);
    } catch (aiErr) {
      console.error("[Chat Function] AI 분석 실패:", aiErr);
      return {
        statusCode: 500,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "uncertain",
          intent: "question", // ✅ AI 분석 실패 시 일반 질문으로 처리
          normalized_symptoms: [],
          suspected_diseases: [],
          category_ids: [],
          recommendations: {
            hospitals: [],
            products: [],
          },
          message: aiErr.message || "정보를 처리하는 중 오류가 발생했습니다.",
        }),
      };
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(analysisResult),
    };
  } catch (err) {
    console.error("[Chat Function] 예상치 못한 오류:", err);
    console.error("[Chat Function] 스택 트레이스:", err.stack);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "uncertain",
        intent: "question", // ✅ 서버 오류 시 일반 질문으로 처리
        normalized_symptoms: [],
        suspected_diseases: [],
        category_ids: [],
        recommendations: {
          hospitals: [],
          products: [],
        },
        message: err.message || "서버 오류가 발생했습니다.",
        stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
      }),
    };
  }
};
