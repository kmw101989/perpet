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

// 위치 키워드 추출 함수
function extractLocationKeywords(userMessage) {
  const locationKeywords = [];
  const messageLower = userMessage.toLowerCase();
  
  // 주요 시/도 및 지역 키워드
  const locationMap = {
    // 시/도
    "서울": ["서울", "서울시", "서울특별시"],
    "부산": ["부산", "부산시", "부산광역시"],
    "대구": ["대구", "대구시", "대구광역시"],
    "인천": ["인천", "인천시", "인천광역시"],
    "광주": ["광주", "광주시", "광주광역시"],
    "대전": ["대전", "대전시", "대전광역시"],
    "울산": ["울산", "울산시", "울산광역시"],
    "세종": ["세종", "세종시", "세종특별자치시"],
    "경기": ["경기", "경기도"],
    "강원": ["강원", "강원도"],
    "충북": ["충북", "충청북도"],
    "충남": ["충남", "충청남도"],
    "전북": ["전북", "전라북도"],
    "전남": ["전남", "전라남도"],
    "경북": ["경북", "경상북도"],
    "경남": ["경남", "경상남도"],
    "제주": ["제주", "제주도", "제주특별자치도"],
    // 서울 주요 구
    "강남": ["강남", "강남구"],
    "서초": ["서초", "서초구"],
    "송파": ["송파", "송파구"],
    "강동": ["강동", "강동구"],
    "강서": ["강서", "강서구"],
    "양천": ["양천", "양천구"],
    "영등포": ["영등포", "영등포구"],
    "구로": ["구로", "구로구"],
    "금천": ["금천", "금천구"],
    "관악": ["관악", "관악구"],
    "동작": ["동작", "동작구"],
    "은평": ["은평", "은평구"],
    "마포": ["마포", "마포구"],
    "서대문": ["서대문", "서대문구"],
    "종로": ["종로", "종로구"],
    "중구": ["중구"],
    "용산": ["용산", "용산구"],
    "성동": ["성동", "성동구"],
    "광진": ["광진", "광진구"],
    "강북": ["강북", "강북구"],
    "도봉": ["도봉", "도봉구"],
    "노원": ["노원", "노원구"],
    "중랑": ["중랑", "중랑구"],
    "성북": ["성북", "성북구"],
    // 경기도 주요 도시
    "수원": ["수원", "수원시"],
    "성남": ["성남", "성남시"],
    "고양": ["고양", "고양시"],
    "용인": ["용인", "용인시"],
    "부천": ["부천", "부천시"],
    "안산": ["안산", "안산시"],
    "안양": ["안양", "안양시"],
    "평택": ["평택", "평택시"],
    "시흥": ["시흥", "시흥시"],
    "김포": ["김포", "김포시"],
    "화성": ["화성", "화성시"],
    "광명": ["광명", "광명시"],
    "군포": ["군포", "군포시"],
    "의왕": ["의왕", "의왕시"],
    "이천": ["이천", "이천시"],
    "오산": ["오산", "오산시"],
    "의정부": ["의정부", "의정부시"],
    "구리": ["구리", "구리시"],
    "남양주": ["남양주", "남양주시"],
    "파주": ["파주", "파주시"],
    "양주": ["양주", "양주시"],
    "동두천": ["동두천", "동두천시"],
    "안성": ["안성", "안성시"],
    "포천": ["포천", "포천시"],
    "양평": ["양평", "양평군"],
    "여주": ["여주", "여주시"],
    "연천": ["연천", "연천군"],
    "가평": ["가평", "가평군"],
    "과천": ["과천", "과천시"],
    "하남": ["하남", "하남시"],
  };

  // 메시지에서 위치 키워드 찾기
  for (const [location, keywords] of Object.entries(locationMap)) {
    for (const keyword of keywords) {
      if (messageLower.includes(keyword.toLowerCase())) {
        locationKeywords.push(location);
        console.log(`[Chat Function] 위치 키워드 발견: ${keyword} → ${location}`);
        break; // 중복 방지
      }
    }
  }

  return locationKeywords;
}

// category_id로 병원 추천 (명세서 기준)
// 주의: hospitals 테이블은 'category_id' 컬럼을 사용함
// locationKeywords: 위치 키워드 배열 (예: ["서울", "강남"])
async function getRecommendedHospitals(categoryIds, locationKeywords = []) {
  const supabase = getSupabaseClient();

  if (!categoryIds || categoryIds.length === 0) {
    return [];
  }

  try {
    // hospitals 테이블은 'category_id' 컬럼 사용
    // category_id 기준으로 병원 조회
    // rating DESC, review_count DESC 정렬, 최대 10개 (위치 필터링 후 정렬을 위해)
    const { data, error } = await supabase
      .from("hospitals")
      .select(
        "hospital_id, hospital_name, address, rating, review_count, hospital_img"
      )
      .in("category_id", categoryIds)
      .order("rating", { ascending: false })
      .order("review_count", { ascending: false })
      .limit(10); // 위치 필터링을 위해 더 많이 가져옴

    if (error) {
      console.error("병원 추천 조회 오류:", error);
      return [];
    }

    let hospitals = (data || []).map((h) => ({
      hospital_id: h.hospital_id,
      hospital_name: h.hospital_name,
      address: h.address || "",
      rating: h.rating || 0,
      hospital_img: h.hospital_img || null,
    }));

    // ✅ 위치 키워드가 있으면 해당 위치의 병원을 우선 정렬
    if (locationKeywords.length > 0) {
      const addressLower = (addr) => (addr || "").toLowerCase();
      
      hospitals = hospitals.sort((a, b) => {
        const aAddress = addressLower(a.address);
        const bAddress = addressLower(b.address);
        
        // 위치 키워드 매칭 여부 확인
        const aMatches = locationKeywords.some(loc => 
          aAddress.includes(loc.toLowerCase())
        );
        const bMatches = locationKeywords.some(loc => 
          bAddress.includes(loc.toLowerCase())
        );
        
        // 위치 매칭된 병원을 우선 정렬
        if (aMatches && !bMatches) return -1;
        if (!aMatches && bMatches) return 1;
        
        // 둘 다 매칭되거나 둘 다 안 되면 기존 정렬 유지 (rating, review_count)
        if (a.rating !== b.rating) return b.rating - a.rating;
        return (b.review_count || 0) - (a.review_count || 0);
      });
      
      console.log(`[Chat Function] 위치 기반 정렬 적용: ${locationKeywords.join(", ")}`);
    }

    // 최대 3개만 반환
    return hospitals.slice(0, 3);
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
  
  // ✅ 직전 assistant 메시지 확인 (care_guidance → hospital_recommend 전환용)
  let previousCategoryIds = [];
  let shouldTransitionToHospitalRecommend = false;
  if (history && history.length > 0) {
    // 직전 assistant 메시지 찾기
    for (let i = history.length - 1; i >= 0; i--) {
      if (history[i].role === "assistant") {
        const prevMessage = history[i].content || "";
        const prevMessageLower = prevMessage.toLowerCase();
        
        // care_guidance 맥락 확인 (병원 정보 안내 문구 포함 여부)
        if (
          prevMessageLower.includes("병원 정보를 안내해드릴 수") ||
          prevMessageLower.includes("병원 알려드릴 수") ||
          prevMessageLower.includes("병원 정보를 안내") ||
          prevMessageLower.includes("병원 알려드릴")
        ) {
          // 다음 userMessage가 병원 정보 요청인지 확인
          const isHospitalInfoRequest =
            userMessageLower.includes("알려주세요") ||
            userMessageLower.includes("병원 알려주세요") ||
            userMessageLower.includes("네 알려주세요") ||
            userMessageLower.includes("그럼 알려주세요") ||
            userMessageLower.includes("보여주세요") ||
            userMessageLower.includes("추천해주세요") ||
            userMessageLower.includes("병원 추천해주세요") ||
            (userMessageLower.includes("알려") && userMessageLower.includes("병원")) ||
            (userMessageLower.includes("그럼") && (userMessageLower.includes("병원") || userMessageLower.includes("알려")));
          
          if (isHospitalInfoRequest) {
            shouldTransitionToHospitalRecommend = true;
            console.log("[Chat Function] ✅ care_guidance → hospital_recommend 전환 감지");
            
            // 직전 응답의 category_ids 추출 시도 (응답 구조에서)
            // history에는 content만 있으므로, 이전 분석 결과를 활용할 수 없음
            // 대신 현재 메시지에서 category 추출
            break;
          }
        }
        break; // 첫 번째 assistant 메시지만 확인
      }
    }
  }
  
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

    // ✅ 관리 가이드 메시지 생성 (병원 방문 기준 포함, 가독성 개선)
    const careMessage = `말씀해주신 내용을 바탕으로 안내드릴게요.

다음과 같은 경우에는 병원 방문을 고려해보시는 것이 도움이 될 수 있어요.

• 증상이 며칠 이상 지속되는 경우  
• 붉은 부위가 넓어지는 경우  
• 진물, 냄새, 탈모가 나타나는 경우  
• 긁거나 핥는 행동이 계속되는 경우  
• 통증으로 예민해 보이는 경우  

원하시면 가까운 병원 정보를 안내해드릴 수 있어요.`;

    return {
      status: "ok",
      intent: "care_guidance", // ✅ 관리 질문 의도 명시
      normalized_symptoms: [],
      suspected_diseases: [], // 관리 질문은 disease 언급 완전 차단
      category_ids: categoryIds,
      recommendations: {
        hospitals: [], // ✅ 관리 질문은 추천 없음 (병원 카드 자동 출력 금지)
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

  // ✅ 명시적 추천 요청 체크 (단독 키워드는 추천 트리거 아님)
  const isExplicitHospitalRecommend =
    userMessageLower.includes("병원 추천") ||
    userMessageLower.includes("추천해줘") ||
    userMessageLower.includes("어디 병원") ||
    userMessageLower.includes("병원 알려줘") ||
    userMessageLower.includes("병원 추천해줘") ||
    userMessageLower.includes("병원 추천해") ||
    userMessageLower.includes("병원 추천해주세요") ||
    (userMessageLower.includes("추천") && userMessageLower.includes("병원"));

  const isExplicitProductRecommend =
    userMessageLower.includes("영양제 추천") ||
    userMessageLower.includes("사료 추천") ||
    userMessageLower.includes("간식 추천") ||
    userMessageLower.includes("제품 추천") ||
    (userMessageLower.includes("추천") && (userMessageLower.includes("영양제") || userMessageLower.includes("사료") || userMessageLower.includes("간식") || userMessageLower.includes("제품")));

  // ✅ intent 결정 (우선순위: care_guidance > hospital_recommend > product_recommend > symptom_consult)
  let forcedIntent = "symptom_consult"; // 기본값

  // 0️⃣ care_guidance → hospital_recommend 전환 (최우선)
  if (shouldTransitionToHospitalRecommend) {
    forcedIntent = "hospital_recommend";
    console.log("[Chat Function] ✅ care_guidance 맥락에서 hospital_recommend로 전환");
  }
  // 1️⃣ 관리/판단 질문 (추천보다 우선)
  else if (isCareGuidanceQuestion) {
    forcedIntent = "care_guidance";
  }
  // 2️⃣ 명시적 병원 추천 요청
  else if (isExplicitHospitalRecommend) {
    forcedIntent = "hospital_recommend";
  }
  // 3️⃣ 명시적 제품 추천 요청
  else if (isExplicitProductRecommend) {
    forcedIntent = "product_recommend";
  }
  // 4️⃣ 관리/메타 질문
  else if (
    userMessageLower.includes("기준") ||
    (userMessageLower.includes("어떻게") && userMessageLower.includes("추천")) ||
    (userMessageLower.includes("무엇을") && userMessageLower.includes("기준"))
  ) {
    forcedIntent = "admin_or_meta";
  }

  // 추천 요청 키워드 확인 (명시적 요청만)
  const hasRecommendationRequest = isExplicitHospitalRecommend || isExplicitProductRecommend;

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
    forcedIntent, // ✅ intent 강제 분기
    hasRecommendationRequest,
    hasCategoryKeyword,
    hasSymptomKeywords,
    userMessage,
  });

  // 사용자 메시지에서 질병 키워드 추출 시도
  const possibleDisease = findDiseaseByKeyword(userMessage, diseases);

  // ✅ intent 기반 SYSTEM PROMPT (카테고리 노출 완전 금지)
  const intentRules = {
    symptom_consult: `[symptom_consult 규칙]
- 증상에 대한 설명과 원인 가능성만 제공
- 추가 질문을 통해 더 자세한 정보 수집
- ❌ 절대 금지: 병원 추천, 제품 추천, 카테고리/분류 언급, "카테고리로 분류했습니다" 같은 표현`,
    hospital_recommend: `[hospital_recommend 규칙]
- 병원 리스트만 제공하거나 지역을 물어보는 질문
- ❌ 절대 금지: 제품 추천, 카테고리/분류 언급`,
    product_recommend: `[product_recommend 규칙]
- 제품 또는 성분 정보 제공
- 사용 시 주의사항 안내
- ❌ 절대 금지: 병원 추천, 카테고리/분류 언급`,
    admin_or_meta: `[admin_or_meta 규칙]
- 추천 기준이나 데이터 출처 설명
- ❌ 절대 금지: 병원/제품 추천, 카테고리/분류 언급`,
  };

  const systemPrompt = `너는 반려동물(강아지, 고양이 등) 건강 상담 보조 AI다.

❗ 모든 답변은 반려동물에 대한 정보 제공 목적이다.
❗ 사람에 대한 건강 조언은 절대 하지 않는다.
❗ 의료 진단, 치료 확정, 비용 안내는 하지 않는다.

---

🔴 매우 중요 - 절대 금지 사항:

1. 카테고리, 분류, category_id, "분류했습니다", "카테고리로 분류" 같은 내부 로직 용어를 사용자에게 절대 언급하지 마세요.
2. 사용자가 요청하지 않은 추천(병원/제품)은 제공하지 마세요.
3. 증상 질문에는 설명과 추가 질문만 답하세요. 추천을 제공하지 마세요.

---

[대화 맥락]

- 이전 대화에서 언급된 반려동물 정보(종, 나이, 증상, 질병 키워드)를 기억하고 활용한다.
- 사용자가 질병명을 직접 언급한 경우, 해당 disease_id를 suspected_diseases에 포함한다.
- 대화가 이어지는 경우 이전 맥락을 고려하여 응답하라.

---

[증상 처리 규칙]

- 질병명을 모른 채 증상만 언급한 경우에만 증상 정규화를 시도한다.
- 증상은 서버에서 전달된 symptom_word 목록 중에서만 선택한다.
- 증상이 모호하거나 부족하면 status를 "uncertain"으로 설정한다.
- 새로운 증상이나 질병명을 생성하지 마라.

[disease_id 제한 규칙]

- 하나의 응답에서 disease_id는 최대 1개만 언급한다.
- status: "uncertain"인 경우 disease_id를 절대 언급하지 않는다.

---

[응답 규칙 - intent별]

${intentRules[forcedIntent] || intentRules.symptom_consult}

---

[금지 표현]

- "카테고리", "분류", "category_id", "분류했습니다", "카테고리로 분류"
- "치료", "완치", "수술 필요", "수술", "검사비", "비용"
- "~질병이 감지되었습니다" (확정 뉘앙스)

---

표준 증상 목록: ${JSON.stringify(symptomWords)}
질병 목록: ${JSON.stringify(diseaseList)}

응답은 반드시 JSON 형식으로만 출력하라.

증상 상담 응답 형식 (symptom_consult):
{
  "status": "ok",
  "normalized_symptoms": ["증상키워드1", "증상키워드2"],
  "suspected_diseases": [{"disease_id": 1, "confidence": "high"}],
  "category_ids": [8],
  "message": "증상에 대한 설명과 가능한 원인 + 추가 질문 (추천 없음)",
  "recommendations": {
    "hospitals": [],
    "products": []
  }
}

병원 추천 응답 형식 (hospital_recommend):
{
  "status": "ok",
  "normalized_symptoms": [],
  "suspected_diseases": [],
  "category_ids": [8],
  "message": "병원 안내 또는 지역 질문",
  "recommendations": {
    "hospitals": [...],
    "products": []
  }
}

제품 추천 응답 형식 (product_recommend):
{
  "status": "ok",
  "normalized_symptoms": [],
  "suspected_diseases": [],
  "category_ids": [8],
  "message": "제품 정보 및 주의사항",
  "recommendations": {
    "hospitals": [],
    "products": [...]
  }
}

판단 불가 시 (status: "uncertain"):
{
  "status": "uncertain",
  "normalized_symptoms": [],
  "suspected_diseases": [],
  "category_ids": [],
  "message": "증상을 더 자세히 알려주시면 도움을 드릴 수 있어요.",
  "recommendations": {
    "hospitals": [],
    "products": []
  }
}`;

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

    // ✅ 사용자 요청 분석 (명시적 추천 요청만)
    const wantsProducts = isExplicitProductRecommend;
    const wantsHospitals = isExplicitHospitalRecommend;

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
      
      // ✅ product_recommend는 반드시 제품 데이터 필요
      if (recommendedProducts.length === 0) {
        console.log("[Chat Function] ⚠️ 직접 제품 조회 실패 - 임시 제품 데이터 추가");
        recommendedProducts = [
          {
            product_id: 0,
            product_name: "관련 제품",
            product_img: null,
            current_price: null,
            original_price: null,
            discount_percent: null,
          }
        ];
      }
    } else if (wantsHospitals && !wantsProducts) {
      // 병원만 추천
      // ✅ 위치 키워드 추출
      const locationKeywords = extractLocationKeywords(userMessage);
      recommendedHospitals = await getRecommendedHospitals(directCategoryIds, locationKeywords);
      console.log(
        "[Chat Function] 직접 병원 추천 결과:",
        recommendedHospitals.length,
        "개",
        locationKeywords.length > 0 ? `(위치: ${locationKeywords.join(", ")})` : ""
      );
      
      // ✅ hospital_recommend는 반드시 병원 데이터 필요
      if (recommendedHospitals.length === 0) {
        console.log("[Chat Function] ⚠️ 직접 병원 조회 실패 - 임시 병원 데이터 추가");
        recommendedHospitals = [
          {
            hospital_id: 0,
            hospital_name: "가까운 동물병원",
            address: "주변 지역의 동물병원을 찾아보시기 바랍니다",
            rating: 0,
            hospital_img: null,
          }
        ];
      }
    } else {
      // 둘 다 추천 (제품 우선)
      recommendedProducts = await getRecommendedProducts(
        directCategoryIds,
        "강아지",
        detectedProductType
      );
      // ✅ 위치 키워드 추출
      const locationKeywords = extractLocationKeywords(userMessage);
      recommendedHospitals = await getRecommendedHospitals(directCategoryIds, locationKeywords);
      console.log("[Chat Function] 직접 추천 결과:", {
        products: recommendedProducts.length,
        hospitals: recommendedHospitals.length,
        productType: detectedProductType,
        location: locationKeywords.length > 0 ? locationKeywords.join(", ") : "없음",
      });
      
      // ✅ 둘 다 추천인데 병원이 없으면 추가
      if (recommendedHospitals.length === 0 && wantsHospitals) {
        console.log("[Chat Function] ⚠️ 병원 조회 실패 - 임시 병원 데이터 추가");
        recommendedHospitals = [
          {
            hospital_id: 0,
            hospital_name: "가까운 동물병원",
            address: "주변 지역의 동물병원을 찾아보시기 바랍니다",
            rating: 0,
            hospital_img: null,
          }
        ];
      }
    }

    // 메시지 생성 (카테고리 명시 없이, "검색해보세요" 같은 일반 문구 금지)
    let message = "";
    if (recommendedProducts.length > 0) {
      message = `${detectedProductType || "제품"} 추천입니다. 아래 정보를 참고하세요.`;
    } else if (recommendedHospitals.length > 0) {
      // ✅ hospital_recommend는 구체적 안내만
      message = "아래 병원 정보를 참고하세요.";
    } else {
      const productTypeText = detectedProductType
        ? `${detectedProductType} `
        : "";
      message = `${productTypeText}제품 정보가 현재 등록되어 있지 않습니다. 자사몰에서 다른 ${productTypeText}제품을 확인해보시거나 가까운 동물병원에 상담을 받아보시기 바랍니다.`;
    }

    // ✅ intent 결정 (제품 vs 병원)
    let directIntent = "recommendation";
    if (wantsProducts && !wantsHospitals) {
      directIntent = "product_recommend";
    } else if (wantsHospitals && !wantsProducts) {
      directIntent = "hospital_recommend";
    }

    // ✅ hospital_recommend 검증: 병원 데이터 필수
    if (directIntent === "hospital_recommend" && recommendedHospitals.length === 0) {
      console.log("[Chat Function] ⚠️ hospital_recommend인데 병원 데이터 없음 - 임시 데이터 추가");
      recommendedHospitals = [
        {
          hospital_id: 0,
          hospital_name: "가까운 동물병원",
          address: "주변 지역의 동물병원을 찾아보시기 바랍니다",
          rating: 0,
          hospital_img: null,
        }
      ];
      message = "아래 병원 정보를 참고하세요.";
    }

    // ✅ product_recommend 검증: 제품 데이터 필수
    if (directIntent === "product_recommend" && recommendedProducts.length === 0) {
      console.log("[Chat Function] ⚠️ product_recommend인데 제품 데이터 없음 - 임시 데이터 추가");
      recommendedProducts = [
        {
          product_id: 0,
          product_name: "관련 제품",
          product_img: null,
          current_price: null,
          original_price: null,
          discount_percent: null,
        }
      ];
      message = "아래 제품 정보를 참고하세요.";
    }

    return {
      status: "ok",
      intent: directIntent, // ✅ 직접 추천 요청 (제품/병원 구분)
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

위 메시지를 분석하고, DB 데이터만 사용하여 응답을 생성하세요. 이전 대화 맥락을 고려하여 응답하세요.

**현재 intent: ${forcedIntent}**

**중요 규칙:**
- 모든 조언은 반려동물(강아지, 고양이 등)에 대한 것이어야 합니다.
- 카테고리, 분류, category_id 같은 내부 용어를 절대 사용하지 마세요.
- intent에 따라 응답 내용을 결정하세요.

**intent별 응답 규칙:**

${forcedIntent === "symptom_consult" ? `- 증상에 대한 설명과 가능한 원인만 제공
- 추가 질문을 통해 더 자세한 정보 수집
- ❌ 추천(병원/제품) 제공 금지` : ""}

${forcedIntent === "hospital_recommend" ? `- 병원 정보 제공 또는 지역 질문
- ❌ 제품 추천 금지` : ""}

${forcedIntent === "product_recommend" ? `- 제품 정보 및 주의사항 제공
- ❌ 병원 추천 금지` : ""}

${forcedIntent === "admin_or_meta" ? `- 시스템 설명이나 추천 기준 안내
- ❌ 병원/제품 추천 금지` : ""}

**금지 표현:**
- "카테고리", "분류", "category_id", "분류했습니다"
- "치료", "완치", "수술 필요", "검사비", "비용"`;

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

      // ✅ intent별 추천 실행 (명시적 요청 또는 care_guidance 전환 허용)
      if (
        categoryIds.length > 0 &&
        forcedIntent === "hospital_recommend" &&
        (isExplicitHospitalRecommend || shouldTransitionToHospitalRecommend)
      ) {
        // 병원만 추천
        // ✅ 위치 키워드 추출
        const locationKeywords = extractLocationKeywords(userMessage);
        recommendedHospitals = await getRecommendedHospitals(categoryIds, locationKeywords);
        console.log(
          "[Chat Function] 병원 추천 결과:",
          recommendedHospitals.length,
          "개",
          locationKeywords.length > 0 ? `(위치: ${locationKeywords.join(", ")})` : ""
        );
        
        // ✅ hospital_recommend는 반드시 병원 데이터 필요 (없으면 하드코딩 예시 추가)
        if (recommendedHospitals.length === 0) {
          console.log("[Chat Function] ⚠️ 병원 조회 실패 - 임시 병원 데이터 추가");
          recommendedHospitals = [
            {
              hospital_id: 0, // 임시 ID
              hospital_name: "가까운 동물병원",
              address: "주변 지역의 동물병원을 찾아보시기 바랍니다",
              rating: 0,
              hospital_img: null,
            }
          ];
        }
      } else if (
        categoryIds.length > 0 &&
        forcedIntent === "product_recommend" &&
        isExplicitProductRecommend
      ) {
        // 제품만 추천
        recommendedProducts = await getRecommendedProducts(categoryIds);
        console.log(
          "[Chat Function] 제품 추천 결과:",
          recommendedProducts.length,
          "개"
        );
        
        // ✅ product_recommend는 반드시 제품 데이터 필요 (없으면 하드코딩 예시 추가)
        if (recommendedProducts.length === 0) {
          console.log("[Chat Function] ⚠️ 제품 조회 실패 - 임시 제품 데이터 추가");
          recommendedProducts = [
            {
              product_id: 0, // 임시 ID
              product_name: "관련 제품",
              product_img: null,
              current_price: null,
              original_price: null,
              discount_percent: null,
            }
          ];
        }
      }
      
      // ✅ admin_or_meta는 추천 없음 (시스템 설명만)
      if (forcedIntent === "admin_or_meta") {
        console.log("[Chat Function] admin_or_meta - 추천 제공하지 않음");
      }
      
      // ✅ symptom_consult는 추천 없음 (이미 조건문에서 제외됨)
      
      // ✅ categoryIds가 없어도 명시적 추천 요청은 데이터 필수
      if (forcedIntent === "hospital_recommend" && categoryIds.length === 0 && isExplicitHospitalRecommend) {
        // ✅ categoryIds가 없어도 hospital_recommend는 병원 데이터 필수
        console.log("[Chat Function] ⚠️ categoryIds 없음 - 임시 병원 데이터 추가");
        recommendedHospitals = [
          {
            hospital_id: 0,
            hospital_name: "가까운 동물병원",
            address: "주변 지역의 동물병원을 찾아보시기 바랍니다",
            rating: 0,
            hospital_img: null,
          }
        ];
      }
      
      if (forcedIntent === "product_recommend" && categoryIds.length === 0 && isExplicitProductRecommend) {
        // ✅ categoryIds가 없어도 product_recommend는 제품 데이터 필수
        console.log("[Chat Function] ⚠️ categoryIds 없음 - 임시 제품 데이터 추가");
        recommendedProducts = [
          {
            product_id: 0,
            product_name: "관련 제품",
            product_img: null,
            current_price: null,
            original_price: null,
            discount_percent: null,
          }
        ];
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
        message: (analysisResult.message || "증상을 조금 더 자세히 알려주시면 도움을 드릴 수 있어요.")
          .replace(/카테고리/g, "")
          .replace(/분류했습니다/g, "")
          .replace(/분류/gi, ""),
      };
    } else {
      // ✅ 응답 메시지 필터링 (카테고리 노출 제거)
      let finalMessage = analysisResult.message || "";
      
      // 안전장치: 카테고리 관련 키워드 제거
      finalMessage = finalMessage
        .replace(/카테고리/g, "")
        .replace(/분류했습니다/g, "")
        .replace(/분류/gi, "")
        .replace(/category[_\s]*id/gi, "")
        .replace(/로 분류/gi, "")
        .replace(/\s+/g, " ") // 연속된 공백 정리
        .trim();

      // ✅ hospital_recommend 검증: 병원 데이터 필수 (없으면 임시 데이터 추가)
      // ✅ care_guidance 전환인 경우 categoryIds가 없어도 병원 데이터 제공
      if (forcedIntent === "hospital_recommend" && recommendedHospitals.length === 0) {
        console.log("[Chat Function] ⚠️ hospital_recommend인데 병원 데이터 없음 - 임시 데이터 추가");
        recommendedHospitals = [
          {
            hospital_id: 0,
            hospital_name: "가까운 동물병원",
            address: "주변 지역의 동물병원을 찾아보시기 바랍니다",
            rating: 0,
            hospital_img: null,
          }
        ];
      }
      
      // ✅ care_guidance 전환인 경우 categoryIds가 없어도 병원 추천 실행
      if (shouldTransitionToHospitalRecommend && categoryIds.length === 0) {
        console.log("[Chat Function] ⚠️ care_guidance 전환 - categoryIds 없어도 병원 데이터 제공");
        const locationKeywords = extractLocationKeywords(userMessage);
        recommendedHospitals = await getRecommendedHospitals([6], locationKeywords); // 기본값: 피부 (6)
        if (recommendedHospitals.length === 0) {
          recommendedHospitals = [
            {
              hospital_id: 0,
              hospital_name: "가까운 동물병원",
              address: "주변 지역의 동물병원을 찾아보시기 바랍니다",
              rating: 0,
              hospital_img: null,
            }
          ];
        }
      }

      // ✅ product_recommend 검증: 제품 데이터 필수 (없으면 임시 데이터 추가)
      if (forcedIntent === "product_recommend" && recommendedProducts.length === 0) {
        console.log("[Chat Function] ⚠️ product_recommend인데 제품 데이터 없음 - 임시 데이터 추가");
        recommendedProducts = [
          {
            product_id: 0,
            product_name: "관련 제품",
            product_img: null,
            current_price: null,
            original_price: null,
            discount_percent: null,
          }
        ];
      }

      // ✅ care_guidance 전환인 경우 메시지 간단히 설정
      if (shouldTransitionToHospitalRecommend) {
        finalMessage = "아래 병원 정보를 참고하세요.";
      }
      // 필터링 후 빈 메시지면 기본 메시지 사용
      else if (!finalMessage || finalMessage.length === 0) {
        if (forcedIntent === "symptom_consult") {
          finalMessage = "증상에 대해 설명해드리겠습니다. 추가로 궁금한 점이 있으시면 알려주세요.";
        } else if (forcedIntent === "hospital_recommend") {
          // ✅ hospital_recommend는 "검색해보세요" 같은 일반 문구 금지, 구체적 안내만
          finalMessage = "아래 병원 정보를 참고하세요.";
        } else if (forcedIntent === "product_recommend") {
          // ✅ product_recommend는 "검색해보세요" 같은 일반 문구 금지, 구체적 안내만
          finalMessage = "아래 제품 정보를 참고하세요.";
        } else {
          finalMessage = "말씀해주신 내용을 바탕으로 관련 정보를 찾아보았습니다.";
        }
      }

      // ✅ hospital_recommend 메시지에서 "검색해보세요", "찾아보세요" 같은 일반 문구 제거
      if (forcedIntent === "hospital_recommend") {
        finalMessage = finalMessage
          .replace(/검색해보세요/gi, "")
          .replace(/찾아보세요/gi, "")
          .replace(/찾아보시기 바랍니다/gi, "참고하세요")
          .replace(/검색해보시기 바랍니다/gi, "참고하세요")
          .replace(/\s+/g, " ")
          .trim();
        
        // 필터링 후 빈 메시지면 기본 메시지 사용
        if (!finalMessage || finalMessage.length === 0) {
          finalMessage = "아래 병원 정보를 참고하세요.";
        }
      }

      // ✅ product_recommend 메시지에서 "검색해보세요", "찾아보세요" 같은 일반 문구 제거
      if (forcedIntent === "product_recommend") {
        finalMessage = finalMessage
          .replace(/검색해보세요/gi, "")
          .replace(/찾아보세요/gi, "")
          .replace(/찾아보시기 바랍니다/gi, "참고하세요")
          .replace(/검색해보시기 바랍니다/gi, "참고하세요")
          .replace(/\s+/g, " ")
          .trim();
        
        // 필터링 후 빈 메시지면 기본 메시지 사용
        if (!finalMessage || finalMessage.length === 0) {
          finalMessage = "아래 제품 정보를 참고하세요.";
        }
      }

      // ✅ 최종 검증: hospital_recommend/product_recommend는 반드시 데이터 필요
      if (forcedIntent === "hospital_recommend" && recommendedHospitals.length === 0) {
        console.log("[Chat Function] ❌ hospital_recommend 최종 검증 실패 - uncertain 반환");
        return {
          status: "uncertain",
          intent: "hospital_recommend",
          normalized_symptoms: validatedSymptoms,
          suspected_diseases: finalDiseases,
          category_ids: categoryIds,
          recommendations: {
            hospitals: [],
            products: [],
          },
          message: "죄송합니다. 현재 조건에 맞는 병원 정보를 찾을 수 없습니다. 다른 지역이나 조건을 말씀해주시겠어요?",
        };
      }

      if (forcedIntent === "product_recommend" && recommendedProducts.length === 0) {
        console.log("[Chat Function] ❌ product_recommend 최종 검증 실패 - uncertain 반환");
        return {
          status: "uncertain",
          intent: "product_recommend",
          normalized_symptoms: validatedSymptoms,
          suspected_diseases: finalDiseases,
          category_ids: categoryIds,
          recommendations: {
            hospitals: [],
            products: [],
          },
          message: "죄송합니다. 현재 조건에 맞는 제품 정보를 찾을 수 없습니다. 다른 조건을 말씀해주시겠어요?",
        };
      }

      console.log("[Chat Function] 최종 응답:", {
        status: "ok",
        intent: forcedIntent,
        categoryIds: categoryIds.length,
        hospitals: recommendedHospitals.length,
        products: recommendedProducts.length,
      });

      return {
        status: "ok",
        intent: forcedIntent, // ✅ 강제 분기된 intent 사용
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
