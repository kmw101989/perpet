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

// normalized_symptoms로 symptoms 테이블 조회하여 disease_id 수집
async function getDiseaseIdsFromSymptoms(normalizedSymptoms) {
  const supabase = getSupabaseClient();

  if (!normalizedSymptoms || normalizedSymptoms.length === 0) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from("symptoms")
      .select("disease_id")
      .in("symptom_word", normalizedSymptoms);

    if (error) {
      console.error("Symptoms 조회 오류:", error);
      return [];
    }

    // disease_id 중복 제거
    const diseaseIds = [
      ...new Set(data.map((s) => s.disease_id).filter(Boolean)),
    ];
    return diseaseIds;
  } catch (err) {
    console.error("Disease ID 수집 오류:", err);
    return [];
  }
}

// disease_id로 diseases 테이블 조회하여 category_id 추출
async function getDiseasesWithCategories(diseaseIds) {
  const supabase = getSupabaseClient();

  if (!diseaseIds || diseaseIds.length === 0) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from("diseases")
      .select("disease_id, disease_name, category_id")
      .in("disease_id", diseaseIds);

    if (error) {
      console.error("Diseases 조회 오류:", error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error("Diseases 조회 오류:", err);
    return [];
  }
}

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

// AI를 사용한 증상 정규화 및 질병 후보 선택
async function analyzeSymptoms(userMessage, dbData, apiKey, history = []) {
  const { symptoms, diseases } = dbData;

  // 증상 키워드 목록 생성 (symptom_word만)
  const symptomWords = [
    ...new Set(symptoms.map((s) => s.symptom_word).filter(Boolean)),
  ];

  // 질병 목록 생성
  const diseaseList = diseases.map((d) => ({
    id: d.disease_id,
    name: d.disease_name,
  }));

  // 사용자 메시지 분석: 추천 요청인지, 증상 질문인지, 일반 질문인지 판단
  const userMessageLower = userMessage.toLowerCase();

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
    hasRecommendationRequest,
    hasCategoryKeyword,
    hasSymptomKeywords,
    userMessage,
  });

  // 사용자 메시지에서 질병 키워드 추출 시도
  const possibleDisease = findDiseaseByKeyword(userMessage, diseases);

  // 명세서에 제공된 SYSTEM PROMPT 사용 (병원·제품 추천 규칙 추가)
  const systemPrompt = `너는 반려동물(강아지, 고양이 등) 건강 상담 보조 AI다.

**중요: 모든 조언은 반려동물에 대한 것이어야 한다. 사람에 대한 조언을 절대 하지 마라.**
- 사용자가 "체중관리", "운동", "식습관" 등을 물어보면 반려동물의 체중관리, 운동, 식습관에 대해 답변하라.
- 사람의 건강 조언(예: "하루 30분 이상의 유산소 운동", "식이섬유가 풍부한 채소와 과일")을 제공하지 마라.
- 반려동물의 나이, 종류, 크기에 맞는 조언을 제공하라.
- 반려동물 사료, 영양제, 운동량, 건강 관리에 대한 정보만 제공하라.

의료 진단을 제공하지 않으며 정보 제공 목적만 가진다.

**대화 맥락 이해:**
- 이전 대화 히스토리를 참고하여 맥락을 이해하라.
- 사용자가 이전에 언급한 질병명, 증상, 요청사항을 기억하고 활용하라.
- 대화가 이어지는 경우 이전 맥락을 고려하여 응답하라.

**질병을 이미 언급한 경우 (예: "감기인데 제품 추천해줘", "심장병 병원 추천", "뼈에 좋은 제품", "심장 특화 병원"):**
- 사용자가 질병명 또는 질병 관련 키워드(심장, 뼈, 관절, 피부 등)를 언급한 경우, 증상 정규화 없이 바로 해당 질병의 추천을 제공하라.
- 질병명은 반드시 데이터베이스에 존재하는 disease_id만 사용하라.
- 질병명이 DB에 있으면 suspected_diseases에 해당 disease_id를 포함하라.
- normalized_symptoms는 빈 배열로 반환해도 된다.
- 사용자가 "제품 추천"을 요청하면 제품 추천을, "병원 추천"을 요청하면 병원 추천을 우선하라.
- 키워드 매칭: "심장" → 심장 관련 질병, "뼈" → 뼈/관절 관련 질병, "관절" → 관절 관련 질병

**일반 질문 처리:**
- "예방접종 안내", "식습관/영양", "건강필수 팁" 등 일반적인 건강 상담 질문에 대해서는
  증상 정규화 없이도 친절하고 유용한 정보를 제공하라.
- 일반 질문의 경우 normalized_symptoms는 빈 배열, suspected_diseases도 빈 배열로 반환하되,
  message에는 질문에 대한 적절한 안내를 제공하라.

**증상 기반 질문 처리 (질병을 모르는 경우):**
- 사용자가 구체적인 증상만 언급하고 질병명을 언급하지 않은 경우에만 증상 정규화를 수행하라.
- 증상이 불충분하거나 모호하면 "판단 불가"로 처리하라.
- 이 경우 병원 방문을 권장하고, 가능하면 병원과 제품을 모두 추천하라.

행동 규칙:
1. 질병을 확정적으로 진단하지 마라.
2. 질병명은 반드시 데이터베이스에 존재하는 disease_id만 사용하라.
3. 증상은 반드시 아래 표준 증상 목록 중에서만 선택하라.
4. 새로운 증상이나 질병명을 생성하지 마라.
5. 항상 병원 방문을 권장하라.

**병원과 제품 추천 규칙 (절대 준수):**
- 병원과 제품의 선정은 서버에서 제공한 데이터만 사용하라.
- AI는 추천 대상을 결정하지 않으며, 추천 사유를 설명하는 역할만 수행하라.
- "이 제품이 질병을 치료한다"는 표현 금지
- "이 병원에서 질병을 치료할 수 있다"는 표현 금지
- 보조적 표현만 사용: "~에 도움이 될 수 있습니다", "~를 참고하실 수 있습니다"

표준 증상 목록: ${JSON.stringify(symptomWords)}
질병 목록: ${JSON.stringify(diseaseList)}

응답은 반드시 JSON 형식으로만 출력하라.

일반 질문 응답 형식 (예: "예방접종 안내"):
{
  "normalized_symptoms": [],
  "suspected_diseases": [],
  "message": "예방접종 일정에 대해 안내해드릴게요. 쿵이의 나이와 최근 접종 이력을 알려주시면 맞춤 일정을 제안해드릴 수 있어요."
}

증상 기반 질문 응답 형식:
{
  "normalized_symptoms": ["증상키워드1", "증상키워드2"],
  "suspected_diseases": [
    {"disease_id": 1, "confidence": "high"}
  ],
  "message": "사용자에게 전달할 친절한 안내 메시지. 병원 방문을 우선 권장하고, 보조 제품은 참고용으로만 언급하라."
}

판단 불가 시:
{
  "normalized_symptoms": [],
  "suspected_diseases": [],
  "message": "현재 정보만으로 특정 질병을 유추하기 어렵습니다. 증상을 조금 더 자세히 알려주시면 도움을 드릴 수 있어요."
}`;

  // 키워드로 category_id 직접 추출 (질병이 없어도 키워드로 추천 가능)
  let directCategoryIds = [];

  console.log("[Chat Function] 키워드 추출 시작:", { userMessage });

  // 단어 경계를 고려한 정확한 키워드 매칭
  // "좋은"에 포함된 "장"은 제외하기 위해 특별 처리
  const messageForMatching = userMessageLower;

  for (const [key, categoryId] of Object.entries(keywordToCategoryId)) {
    let shouldMatch = false;

    // 특수 케이스: "장"은 "위장", "소화", "장기" 등과 함께 나올 때만 매칭
    // "좋은"에 포함된 "장"은 무시
    if (key === "장") {
      // "위장", "소화", "장기", "장애" 등이 포함되어 있는지 확인
      const 장Keywords = ["위장", "소화", "장기", "장애", "장염", "위/장"];
      shouldMatch = 장Keywords.some((kw) => messageForMatching.includes(kw));

      // "좋은"만 있고 위의 키워드가 없으면 무시
      if (messageForMatching.includes("좋은") && !shouldMatch) {
        continue;
      }
    } else {
      // 다른 키워드는 정확한 매칭
      // 단어 경계를 고려 (공백, 구두점, 한글 경계)
      const regex = new RegExp(`(^|[^가-힣])${key}([^가-힣]|$)`, "i");
      shouldMatch =
        regex.test(messageForMatching) || messageForMatching.includes(key);
    }

    if (shouldMatch) {
      if (!directCategoryIds.includes(categoryId)) {
        directCategoryIds.push(categoryId);
        console.log(
          "[Chat Function] 키워드로 category_id 직접 추출:",
          key,
          "→",
          categoryId
        );
      }
    }
  }

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

위 메시지에서 증상을 분석하고, DB 데이터만 사용하여 응답을 생성하세요. 이전 대화 맥락을 고려하여 응답하세요.

**중요: 모든 조언은 반려동물(강아지, 고양이 등)에 대한 것이어야 합니다. 사람에 대한 건강 조언을 절대 하지 마세요.**
- "체중관리" 질문이면 반려동물의 체중관리 방법(적절한 사료량, 운동 등)을 답변하세요.
- "운동" 질문이면 반려동물의 운동(산책, 놀이 등)에 대해 답변하세요.
- 사람의 운동량이나 식습관 조언을 제공하지 마세요.`;

  try {
    // 히스토리를 메시지에 포함
    const messages = [{ role: "system", content: systemPrompt }];

    // 히스토리 추가 (최근 5개만)
    if (history && history.length > 0) {
      messages.push(...history.slice(-5));
    }

    messages.push({ role: "user", content: userPrompt });

    const completionRes = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: messages,
          temperature: 0.7,
          max_tokens: 500,
          response_format: { type: "json_object" },
        }),
      }
    );

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

    // JSON 파싱
    let analysisResult;
    try {
      analysisResult = JSON.parse(aiResponse);
    } catch (e) {
      console.error("AI 응답 JSON 파싱 실패:", e);
      // 판단 불가로 처리
      analysisResult = {
        normalized_symptoms: [],
        suspected_diseases: [],
        message:
          "증상을 분석하는 중 오류가 발생했습니다. 증상을 다시 설명해주시면 도움을 드릴 수 있어요.",
      };
    }

    // normalized_symptoms 검증 (DB에 있는 symptom_word만 허용)
    const validSymptomWords = new Set(symptomWords);
    const validatedSymptoms = (analysisResult.normalized_symptoms || []).filter(
      (s) => validSymptomWords.has(s)
    );

    // suspected_diseases 검증 및 처리
    let validatedDiseases = [];
    if (
      analysisResult.suspected_diseases &&
      analysisResult.suspected_diseases.length > 0
    ) {
      const validDiseaseIds = new Set(diseases.map((d) => d.disease_id));
      validatedDiseases = analysisResult.suspected_diseases
        .filter((d) => validDiseaseIds.has(d.disease_id))
        .map((d) => ({
          disease_id: d.disease_id,
          confidence: d.confidence || "medium", // confidence 필드 사용
        }));
    }

    // 가능한 질병이 발견되었는데 AI가 포함하지 않은 경우 추가
    if (possibleDisease && validatedDiseases.length === 0) {
      const alreadyIncluded = validatedDiseases.some(
        (d) => d.disease_id === possibleDisease.disease_id
      );
      if (!alreadyIncluded) {
        console.log(
          "[Chat Function] 키워드 매칭으로 질병 발견:",
          possibleDisease.disease_name
        );
        validatedDiseases.push({
          disease_id: possibleDisease.disease_id,
          confidence: "medium",
        });
      }
    }

    // 판단 불가 여부 확인 (질병을 모르는 경우만)
    // 질병을 이미 언급한 경우(validatedDiseases가 있으면)는 추천 가능
    // 또는 키워드로 category_id를 찾은 경우도 추천 가능
    const isUncertain =
      validatedDiseases.length === 0 &&
      validatedSymptoms.length === 0 &&
      directCategoryIds.length === 0;

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

    if (!isUncertain) {
      // 질병 기반 category_id 추출
      if (validatedDiseases.length > 0) {
        // 질병 ID 추출 (증상 기반 또는 직접 언급)
        let diseaseIds = [];

        if (validatedSymptoms.length > 0) {
          // 증상 기반: normalized_symptoms로 disease_id 수집
          diseaseIds = await getDiseaseIdsFromSymptoms(validatedSymptoms);
        }

        // 직접 언급한 질병 ID 추가
        const mentionedDiseaseIds = validatedDiseases.map((d) => d.disease_id);
        diseaseIds = [...new Set([...diseaseIds, ...mentionedDiseaseIds])];

        if (diseaseIds.length > 0) {
          // diseases 테이블 조회하여 category_id 추출
          const diseasesWithCategories = await getDiseasesWithCategories(
            diseaseIds
          );

          // validatedDiseases와 매칭하여 category_id 추가
          finalDiseases = validatedDiseases.map((d) => {
            const diseaseInfo = diseasesWithCategories.find(
              (di) => di.disease_id === d.disease_id
            );
            return {
              disease_id: d.disease_id,
              confidence: d.confidence,
            };
          });

          // category_ids 추출
          const diseaseCategoryIds = [
            ...new Set(
              diseasesWithCategories.map((d) => d.category_id).filter(Boolean)
            ),
          ];

          console.log(
            "[Chat Function] 질병 기반 추출된 category_ids:",
            diseaseCategoryIds
          );
          console.log(
            "[Chat Function] 키워드 기반 directCategoryIds:",
            directCategoryIds
          );

          // 키워드 기반 category_id가 있으면 우선 사용, 없으면 질병 기반 사용
          if (directCategoryIds.length > 0) {
            categoryIds = directCategoryIds;
            console.log(
              "[Chat Function] 키워드 기반 category_id 우선 사용:",
              categoryIds
            );
          } else {
            categoryIds = diseaseCategoryIds;
            console.log(
              "[Chat Function] 질병 기반 category_id 사용:",
              categoryIds
            );
          }

          // 병원·제품 추천 (category_id 기반)
          // 사용자 요청에 따라 필터링
          if (categoryIds.length > 0) {
            const userMessageLower = userMessage.toLowerCase();
            const wantsProducts =
              userMessageLower.includes("제품") ||
              userMessageLower.includes("상품") ||
              userMessageLower.includes("사료") ||
              userMessageLower.includes("영양제") ||
              userMessageLower.includes("추천해줘");
            const wantsHospitals =
              userMessageLower.includes("병원") ||
              userMessageLower.includes("예약") ||
              userMessageLower.includes("진료");

            console.log("[Chat Function] 사용자 요청 분석:", {
              wantsProducts,
              wantsHospitals,
              userMessage,
            });

            // 사용자가 명시적으로 요청한 경우만 해당 추천 제공
            if (wantsProducts && !wantsHospitals) {
              // 제품만 추천
              console.log("[Chat Function] 제품만 추천 시작");
              recommendedProducts = await getRecommendedProducts(categoryIds);
              console.log(
                "[Chat Function] 제품 추천 결과:",
                recommendedProducts.length,
                "개"
              );
            } else if (wantsHospitals && !wantsProducts) {
              // 병원만 추천
              console.log("[Chat Function] 병원만 추천 시작");
              recommendedHospitals = await getRecommendedHospitals(categoryIds);
              console.log(
                "[Chat Function] 병원 추천 결과:",
                recommendedHospitals.length,
                "개"
              );
            } else {
              // 둘 다 요청하거나 명시하지 않은 경우: 제품 우선 (질병을 이미 아는 경우)
              if (
                validatedSymptoms.length === 0 &&
                validatedDiseases.length > 0
              ) {
                // 질병을 이미 언급한 경우 제품 우선
                console.log("[Chat Function] 질병 언급됨 - 제품 우선 추천");
                recommendedProducts = await getRecommendedProducts(categoryIds);
                recommendedHospitals = await getRecommendedHospitals(
                  categoryIds
                );
                console.log("[Chat Function] 추천 결과:", {
                  products: recommendedProducts.length,
                  hospitals: recommendedHospitals.length,
                });
              } else {
                // 증상 기반인 경우 병원 우선
                console.log("[Chat Function] 증상 기반 - 병원 우선 추천");
                recommendedHospitals = await getRecommendedHospitals(
                  categoryIds
                );
                recommendedProducts = await getRecommendedProducts(categoryIds);
                console.log("[Chat Function] 추천 결과:", {
                  products: recommendedProducts.length,
                  hospitals: recommendedHospitals.length,
                });
              }
            }
          } else {
            console.log("[Chat Function] 질병 기반 category_ids가 없음");
          }
        }
      }

      // 키워드 기반 category_id로 직접 추천 (질병이 없어도)
      // 질병 기반 추천이 없거나 실패한 경우 키워드 기반으로 추천
      if (directCategoryIds.length > 0) {
        console.log("[Chat Function] 키워드 기반 추천 시작:", {
          directCategoryIds,
          categoryIds,
          recommendedProducts: recommendedProducts.length,
          recommendedHospitals: recommendedHospitals.length,
        });

        // categoryIds가 없으면 directCategoryIds 사용, 있으면 병합
        if (categoryIds.length === 0) {
          categoryIds = directCategoryIds;
          console.log(
            "[Chat Function] 키워드 기반 category_id로 직접 추천:",
            directCategoryIds
          );
        } else {
          // 병합 (중복 제거)
          categoryIds = [...new Set([...categoryIds, ...directCategoryIds])];
          console.log("[Chat Function] category_ids 병합:", categoryIds);
        }

        // 키워드 기반 추천은 항상 실행 (directCategoryIds가 있으면)
        const userMessageLower = userMessage.toLowerCase();
        const wantsProducts =
          userMessageLower.includes("제품") ||
          userMessageLower.includes("상품") ||
          userMessageLower.includes("사료") ||
          userMessageLower.includes("영양제") ||
          userMessageLower.includes("추천해줘");
        const wantsHospitals =
          userMessageLower.includes("병원") ||
          userMessageLower.includes("예약") ||
          userMessageLower.includes("진료");

        console.log("[Chat Function] 키워드 기반 추천 - 사용자 요청 분석:", {
          userMessage,
          wantsProducts,
          wantsHospitals,
          categoryIds,
          hasRecommendedProducts: recommendedProducts.length > 0,
          hasRecommendedHospitals: recommendedHospitals.length > 0,
        });

        // 제품 추천이 필요하고 아직 없으면 실행
        // 키워드 기반 추천은 directCategoryIds를 사용하여 다시 시도
        const keywordCategoryIds =
          directCategoryIds.length > 0 ? directCategoryIds : categoryIds;

        if (wantsProducts && !wantsHospitals) {
          // 제품만 추천
          if (recommendedProducts.length === 0) {
            console.log(
              "[Chat Function] 키워드 기반 제품 추천 실행 (제품만):",
              keywordCategoryIds
            );
            recommendedProducts = await getRecommendedProducts(
              keywordCategoryIds
            );
            console.log(
              "[Chat Function] 키워드 기반 제품 추천 결과:",
              recommendedProducts.length,
              "개",
              recommendedProducts
            );
          } else {
            console.log(
              "[Chat Function] 이미 제품 추천이 있음, 키워드 기반 재시도:",
              keywordCategoryIds
            );
            // 이미 추천이 있지만 키워드 기반으로 다시 시도
            const keywordProducts = await getRecommendedProducts(
              keywordCategoryIds
            );
            if (keywordProducts.length > 0) {
              recommendedProducts = keywordProducts;
              console.log(
                "[Chat Function] 키워드 기반 제품 추천 성공:",
                recommendedProducts.length,
                "개"
              );
            }
          }
        } else if (wantsHospitals && !wantsProducts) {
          // 병원만 추천
          if (recommendedHospitals.length === 0) {
            console.log(
              "[Chat Function] 키워드 기반 병원 추천 실행 (병원만):",
              keywordCategoryIds
            );
            recommendedHospitals = await getRecommendedHospitals(
              keywordCategoryIds
            );
            console.log(
              "[Chat Function] 키워드 기반 병원 추천 결과:",
              recommendedHospitals.length,
              "개"
            );
          }
        } else {
          // 둘 다 추천 (제품 우선, 없으면 병원)
          // 키워드 기반으로 제품 재시도
          if (
            recommendedProducts.length === 0 ||
            (directCategoryIds.length > 0 && recommendedProducts.length === 0)
          ) {
            console.log(
              "[Chat Function] 키워드 기반 제품 추천 실행 (둘 다):",
              keywordCategoryIds
            );
            const keywordProducts = await getRecommendedProducts(
              keywordCategoryIds
            );
            if (keywordProducts.length > 0) {
              recommendedProducts = keywordProducts;
              console.log(
                "[Chat Function] 키워드 기반 제품 추천 성공:",
                recommendedProducts.length,
                "개"
              );
            } else {
              console.log(
                "[Chat Function] 키워드 기반 제품 추천 실패 (제품 없음)"
              );
            }
          }
          if (recommendedHospitals.length === 0) {
            console.log(
              "[Chat Function] 키워드 기반 병원 추천 실행 (둘 다):",
              keywordCategoryIds
            );
            recommendedHospitals = await getRecommendedHospitals(
              keywordCategoryIds
            );
            console.log(
              "[Chat Function] 키워드 기반 병원 추천 결과:",
              recommendedHospitals.length,
              "개"
            );
          }
        }
      }
    }

    // 응답 생성 (명세서 형식 준수, recommendations 필드 추가)
    if (isUncertain) {
      return {
        status: "uncertain",
        normalized_symptoms: validatedSymptoms,
        suspected_diseases: [],
        category_ids: [],
        recommendations: {
          hospitals: [],
          products: [],
        },
        message:
          analysisResult.message ||
          "현재 정보만으로 특정 질병을 유추하기 어렵습니다. 증상을 조금 더 자세히 알려주시면 도움을 드릴 수 있어요.",
      };
    } else {
      // 추천이 없는 경우 AI 메시지 조정
      let finalMessage =
        analysisResult.message ||
        "증상을 분석했습니다. 정확한 진단을 위해 병원 방문을 권장드립니다.";

      const userMessageLower = userMessage.toLowerCase();
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

      return {
        status: "ok",
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
      normalized_symptoms: [],
      suspected_diseases: [],
      category_ids: [],
      recommendations: {
        hospitals: [],
        products: [],
      },
      message:
        err.message || "증상 분석 중 오류가 발생했습니다. 다시 시도해주세요.",
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
          normalized_symptoms: [],
          suspected_diseases: [],
          category_ids: [],
          recommendations: {
            hospitals: [],
            products: [],
          },
          message: aiErr.message || "AI 분석 중 오류가 발생했습니다.",
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
