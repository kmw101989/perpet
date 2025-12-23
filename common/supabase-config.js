// Supabase 클라이언트 초기화
// Supabase URL과 Anon Key를 여기에 설정하세요

const SUPABASE_URL = 'https://wdrirrlwmafmrqebpvxb.supabase.co';
// Supabase Dashboard > Settings > API > Project API keys > anon public
// 여기에 anon key를 입력하세요
const SUPABASE_ANON_KEY = 'sb_publishable_6TYMynQhG55NJ79kQdzQVA_DH1w8E2K';

// Supabase 클라이언트 초기화
let supabaseClient = null;

// Supabase 클라이언트 가져오기 함수
async function getSupabaseClient() {
  if (supabaseClient) {
    return supabaseClient;
  }

  // Supabase JS 라이브러리 동적 로드
  if (typeof supabase === 'undefined') {
    await loadSupabaseLibrary();
  }

  // 클라이언트 초기화
  supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return supabaseClient;
}

// Supabase 라이브러리 동적 로드
function loadSupabaseLibrary() {
  return new Promise((resolve, reject) => {
    // 이미 로드되어 있는지 확인
    if (typeof supabase !== 'undefined') {
      resolve();
      return;
    }

    // 스크립트 태그 생성
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Supabase library'));
    document.head.appendChild(script);
  });
}

// 데이터 가져오기 헬퍼 함수들
const SupabaseService = {
  // 제품 목록 가져오기
  // categoryId: bigint (category 필드 사용)
  // productType: '사료', '영양제', '간식' 등
  // orderBy: 정렬 기준 (null이면 정렬 안 함, 'default'면 product_id 순서)
  async getProducts(categoryId = null, productType = null, limit = 100, orderBy = 'default') {
    const client = await getSupabaseClient();
    let query = client
      .from('products')
      .select('product_id, brand, product_name, current_price, original_price, discount_percent, rating, review_count, product_img, category, product_type')
      .limit(limit);

    if (categoryId) {
      query = query.eq('category', categoryId);
    }

    if (productType) {
      query = query.eq('product_type', productType);
    }

    // 정렬 옵션 (orderBy가 null이면 정렬 안 함)
    if (orderBy === 'default') {
      // 기본 정렬: product_id 순서대로
      query = query.order('product_id', { ascending: true });
    } else if (orderBy === 'rating') {
      // 별점 순 정렬
      query = query.order('rating', { ascending: false, nullsLast: true });
    } else if (orderBy === 'review') {
      // 리뷰수 순 정렬
      query = query.order('review_count', { ascending: false, nullsLast: true });
    }
    // orderBy가 null이면 정렬하지 않음

    const { data, error } = await query;
    
    if (error) {
      console.error('제품 조회 실패:', error);
      console.error('에러 코드:', error.code);
      console.error('에러 메시지:', error.message);
      
      // RLS 정책 오류인 경우 안내
      if (error.code === '42501' || error.message?.includes('row-level security')) {
        console.error('⚠️ RLS 정책 위반 오류입니다. Supabase Dashboard에서 products 테이블의 SELECT 정책을 설정해주세요.');
      }
    }
    if (error) {
      console.error('Error fetching products:', error);
      return [];
    }
    return data || [];
  },

  // 제품 ID로 단일 제품 가져오기
  async getProductById(productId) {
    const client = await getSupabaseClient();
    const { data, error } = await client
      .from('products')
      .select('*')
      .eq('product_id', productId)
      .single();

    if (error) {
      console.error('Error fetching product:', error);
      return null;
    }
    return data;
  },

  // 제품명으로 검색 (product_name에 검색어 포함)
  async searchProducts(searchTerm, limit = 100) {
    const client = await getSupabaseClient();
    const { data, error } = await client
      .from('products')
      .select('product_id, brand, product_name, current_price, original_price, discount_percent, rating, review_count, product_img, category, product_type')
      .ilike('product_name', `%${searchTerm}%`)
      .limit(limit);

    if (error) {
      console.error('제품 검색 실패:', error);
      return [];
    }
    return data || [];
  },

  // 반려동물 기반 제품 추천
  // 반려동물의 disease_id -> diseases 테이블의 category_id -> products 테이블의 category 매칭
  // 리뷰수, 별점으로 정렬하여 상위 3개 반환
  async getRecommendedProducts(petId, productType = '사료', limit = 3) {
    const client = await getSupabaseClient();
    
    try {
      // 1. 반려동물 정보 가져오기 (disease_id 포함)
      console.log('=== 추천 알고리즘 시작 ===');
      console.log('petId:', petId, '타입:', typeof petId);
      
      // pet_id가 문자열일 수 있으므로 숫자로 변환 시도
      const numericPetId = typeof petId === 'string' ? petId : String(petId);
      console.log('조회할 pet_id:', numericPetId);
      
      const { data: pet, error: petError } = await client
        .from('pets')
        .select('pet_id, disease_id, pet_name')
        .eq('pet_id', numericPetId)
        .maybeSingle(); // .single() 대신 .maybeSingle() 사용 (결과가 없어도 에러 발생 안 함)

      if (petError) {
        console.error('반려동물 정보 조회 실패:', petError);
        return [];
      }

      console.log('반려동물 정보 조회 결과:', pet);

      if (!pet) {
        console.log('반려동물 정보를 찾을 수 없습니다. pet_id:', numericPetId);
        // pets 테이블 샘플 데이터 확인
        const { data: allPets } = await client
          .from('pets')
          .select('pet_id, disease_id, pet_name')
          .limit(10);
        console.log('pets 테이블 샘플 데이터:', allPets);
        return [];
      }

      if (!pet.disease_id) {
        console.log('반려동물 정보는 있지만 disease_id가 없습니다. pet:', pet);
        return [];
      }

      // 2. 질병 정보 가져오기 (category_id 포함)
      // disease_id는 bigint 타입
      const diseaseId = pet.disease_id;
      console.log('질병 정보 조회 시작, disease_id:', diseaseId, '타입:', typeof diseaseId);
      
      let categoryId = null;
      let disease = null;
      
      // disease_id 컬럼으로 조회 (bigint 타입)
      const { data: diseaseData, error: diseaseError } = await client
        .from('diseases')
        .select('disease_id, disease_name, category_id')
        .eq('disease_id', diseaseId)
        .maybeSingle();

      if (diseaseError) {
        console.error('질병 정보 조회 실패:', diseaseError);
        console.error('에러 코드:', diseaseError.code);
        console.error('에러 메시지:', diseaseError.message);
        console.error('에러 상세:', diseaseError);
        
        // RLS 정책 오류인 경우 안내
        if (diseaseError.code === '42501' || diseaseError.message?.includes('row-level security')) {
          console.error('⚠️ RLS 정책 위반 오류입니다. Supabase Dashboard에서 diseases 테이블의 SELECT 정책을 설정해주세요.');
        }
        return [];
      }

      disease = diseaseData;

      // 질병 정보를 찾지 못한 경우 재시도
      if (!disease) {
        console.log('질병 정보를 찾을 수 없습니다. disease_id:', diseaseId, '타입:', typeof diseaseId);
        
        // 모든 질병 목록 조회하여 디버깅
        const { data: allDiseases, error: allDiseasesError } = await client
          .from('diseases')
          .select('disease_id, disease_name, category_id')
          .limit(20);
        
        if (allDiseasesError) {
          console.error('diseases 테이블 조회 실패:', allDiseasesError);
          console.error('에러 코드:', allDiseasesError.code);
          console.error('에러 메시지:', allDiseasesError.message);
          console.error('에러 상세:', allDiseasesError);
        } else {
          console.log('diseases 테이블 전체 데이터:', allDiseases);
          console.log('diseases 테이블 데이터 개수:', allDiseases?.length || 0);
          
          if (!allDiseases || allDiseases.length === 0) {
            console.error('⚠️ diseases 테이블이 비어있거나 RLS 정책으로 인해 조회할 수 없습니다.');
            console.error('Supabase Dashboard에서 diseases 테이블의 RLS 정책을 확인하세요.');
          }
          
          // disease_id 타입 확인 및 재시도
          if (allDiseases && allDiseases.length > 0) {
            console.log('첫 번째 질병 데이터 타입:', {
              disease_id: allDiseases[0].disease_id,
              disease_id_type: typeof allDiseases[0].disease_id,
              찾는_disease_id: diseaseId,
              찾는_disease_id_type: typeof diseaseId
            });
            
            // 숫자로 변환해서 다시 시도
            const numericDiseaseId = typeof diseaseId === 'string' ? parseInt(diseaseId, 10) : diseaseId;
            console.log('숫자로 변환한 disease_id로 재시도:', numericDiseaseId);
            
            const { data: diseaseRetry, error: diseaseRetryError } = await client
              .from('diseases')
              .select('disease_id, disease_name, category_id')
              .eq('disease_id', numericDiseaseId)
              .maybeSingle();
            
            if (diseaseRetryError) {
              console.error('재시도 실패:', diseaseRetryError);
            } else if (diseaseRetry) {
              console.log('재시도 성공! 질병 정보:', diseaseRetry);
              disease = diseaseRetry; // disease 변수에 할당
            } else {
              console.log('재시도해도 질병 정보를 찾을 수 없습니다.');
            }
          }
        }
      }

      // 질병 정보 확인 및 category_id 추출
      if (disease) {
        console.log('질병 정보 조회 성공:', disease);
        
        if (disease.category_id) {
          categoryId = disease.category_id;
          console.log('category_id 추출 성공:', categoryId);
        } else {
          console.log('질병 정보는 있지만 category_id가 없습니다. disease:', disease);
          return [];
        }
      } else {
        console.log('질병 정보를 찾을 수 없어 추천을 수행할 수 없습니다.');
        return [];
      }

      if (!categoryId) {
        console.log('category_id를 찾을 수 없습니다.');
        return [];
      }

      // 3. 해당 category_id와 product_type에 맞는 제품 가져오기
      // 리뷰수, 별점, 할인율을 종합하여 평가하여 상위 3개 반환
      console.log('제품 조회 시작, category_id:', categoryId, 'product_type:', productType);
      const { data: products, error: productsError } = await client
        .from('products')
        .select('product_id, brand, product_name, current_price, original_price, discount_percent, rating, review_count, product_img, category, product_type')
        .eq('category', categoryId)
        .eq('product_type', productType);

      if (productsError) {
        console.error('제품 추천 실패:', productsError);
        return [];
      }

      if (!products || products.length === 0) {
        console.log('해당 조건의 제품이 없습니다.');
        return [];
      }

      // 제품 평가 및 정렬 (리뷰수, 평점, 할인율 종합 평가)
      // 최대 리뷰수 계산 (안전하게 처리)
      const reviewCounts = products.map(p => parseFloat(p.review_count || 0));
      const maxReviewCount = reviewCounts.length > 0 ? Math.max(...reviewCounts) : 1; // 0으로 나누기 방지
      
      console.log('제품 평가 시작, 총 제품 수:', products.length, '최대 리뷰수:', maxReviewCount);
      
      const scoredProducts = products.map(product => {
        // 리뷰수 점수 (0-100점, 최대 리뷰수를 기준으로 정규화)
        const reviewCount = product.review_count ? parseFloat(product.review_count) : 0;
        const reviewScore = maxReviewCount > 0 ? (reviewCount / maxReviewCount) * 100 : 0;

        // 평점 점수 (0-100점, 5점 만점 기준)
        const rating = product.rating ? parseFloat(product.rating) : 0;
        const ratingScore = (rating / 5) * 100;

        // 할인율 점수 (0-100점, 할인율이 높을수록 높은 점수)
        const discountPercent = product.discount_percent ? parseFloat(product.discount_percent) : 0;
        const discountScore = Math.min(discountPercent, 100); // 최대 100%까지

        // 종합 점수 (리뷰수 40%, 평점 40%, 할인율 20%)
        const totalScore = (reviewScore * 0.4) + (ratingScore * 0.4) + (discountScore * 0.2);

        return {
          product: product,
          score: totalScore
        };
      });

      // 종합 점수 순으로 정렬하여 상위 limit개 반환
      const sortedProducts = scoredProducts
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(item => item.product); // 원본 제품 객체만 반환

      console.log('추천 제품 정렬 완료 (상위', limit, '개):', sortedProducts);
      return sortedProducts;
    } catch (error) {
      console.error('추천 알고리즘 실행 중 오류:', error);
      return [];
    }
  },

  // 병원 목록 가져오기
  async getHospitals(city = null, categoryId = null, limit = 100) {
    const client = await getSupabaseClient();
    let query = client
      .from('hospitals')
      .select('*')
      .limit(limit);

    if (city) {
      query = query.eq('city', city);
    }

    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    // 평점 순으로 정렬 (기본값)
    query = query.order('rating', { ascending: false, nullsLast: true });

    const { data, error } = await query;
    if (error) {
      console.error('❌ Error fetching hospitals:', error);
      console.error('에러 코드:', error.code);
      console.error('에러 메시지:', error.message);
      console.error('에러 상세:', error);
      
      // RLS 정책 오류인 경우 안내
      if (error.code === '42501' || error.message?.includes('row-level security')) {
        console.error('⚠️ RLS 정책 위반 오류입니다. Supabase Dashboard에서 hospitals 테이블의 SELECT 정책을 설정해주세요.');
      }
      return [];
    }
    
    console.log('✅ 병원 데이터 조회 성공:', data?.length || 0, '개');
    return data || [];
  },

  // 병원 ID로 단일 병원 가져오기
  async getHospitalById(hospitalId) {
    const client = await getSupabaseClient();
    const { data, error } = await client
      .from('hospitals')
      .select('*')
      .eq('hospital_id', hospitalId)
      .single();

    if (error) {
      console.error('Error fetching hospital:', error);
      return null;
    }
    return data;
  },

  // 병원 좌표 업데이트
  async updateHospitalCoordinates(hospitalId, lat, lng) {
    const client = await getSupabaseClient();
    const { data, error } = await client
      .from('hospitals')
      .update({ lat: lat, lng: lng })
      .eq('hospital_id', hospitalId)
      .select()
      .single();

    if (error) {
      console.error('Error updating hospital coordinates:', error);
      throw error;
    }
    return data;
  },

  // 병원 정보 업데이트 (일반)
  async updateHospital(hospitalId, updateData) {
    const client = await getSupabaseClient();
    const { data, error } = await client
      .from('hospitals')
      .update(updateData)
      .eq('hospital_id', hospitalId)
      .select()
      .single();

    if (error) {
      console.error('Error updating hospital:', error);
      throw error;
    }
    return data;
  },

  // 병원 서비스 가져오기
  async getHospitalServices(hospitalId = null, limit = 100) {
    const client = await getSupabaseClient();
    let query = client
      .from('hospital_services')
      .select('*')
      .limit(limit);

    if (hospitalId) {
      query = query.eq('hospital_name', hospitalId); // hospital_name은 hospital_id를 의미
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching hospital services:', error);
      return [];
    }
    return data || [];
  },

  // 서비스 평균 가격 가져오기
  async getServiceAvg(region = null, serviceId = null) {
    const client = await getSupabaseClient();
    let query = client
      .from('service_avg')
      .select('*');

    if (region) {
      query = query.eq('region', region);
    }

    if (serviceId) {
      query = query.eq('service_id', serviceId);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching service avg:', error);
      return [];
    }
    return data || [];
  },

  // 카테고리 목록 가져오기
  async getCategories() {
    const client = await getSupabaseClient();
    const { data, error } = await client
      .from('category')
      .select('*')
      .order('category_id', { ascending: true });

    if (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
    return data || [];
  },

  // 질병 목록 가져오기
    async getDiseases(categoryId = null) {
      const client = await getSupabaseClient();
      let query = client
        .from('diseases')
        .select('*');

      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }

      const { data, error } = await query;
      if (error) {
        console.error('Error fetching diseases:', error);
        return [];
      }
      return data || [];
    },

    async getDiseaseById(diseaseId) {
      const client = await getSupabaseClient();
      const { data, error } = await client
        .from('diseases')
        .select('disease_id, disease_name, category_id')
        .eq('disease_id', diseaseId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching disease by ID:', error);
        return null;
      }
      return data;
    },

  // 사용자 반려동물 목록 가져오기
  async getPets(userId) {
    const client = await getSupabaseClient();
    const { data, error } = await client
      .from('pets')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching pets:', error);
      return [];
    }
    return data || [];
  },

  // 사용자 반려동물 목록 가져오기 (별칭)
  async getPetsByUserId(userId) {
    return this.getPets(userId);
  },

  // 반려동물 삭제
  async deletePet(petId, userId = null) {
    const client = await getSupabaseClient();
    let query = client.from('pets').delete().eq('pet_id', petId);
    if (userId) {
      query = query.eq('user_id', userId);
    }
    const { error } = await query;
    if (error) {
      console.error('Error deleting pet:', error);
      throw error;
    }
    return true;
  },

  // 반려동물 ID로 단일 반려동물 가져오기
  async getPetById(petId) {
    const client = await getSupabaseClient();
    const { data, error } = await client
      .from('pets')
      .select('*')
      .eq('pet_id', petId)
      .single();

    if (error) {
      console.error('Error fetching pet:', error);
      return null;
    }
    return data;
  },

  // 사용자 정보 가져오기
  async getUser(userId) {
    const client = await getSupabaseClient();
    const { data, error } = await client
      .from('users')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching user:', error);
      return null;
    }
    return data;
  },

  // 이메일로 사용자 정보 가져오기
  async getUserByEmail(email) {
    const client = await getSupabaseClient();
    const { data, error } = await client
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (error) {
      console.error('Error fetching user by email:', error);
      return null;
    }
    return data;
  },

  // 사용자 삭제 (이메일 기준)
  async deleteUserByEmail(email) {
    const client = await getSupabaseClient();
    
    // 먼저 사용자 정보 가져오기
    const user = await this.getUserByEmail(email);
    if (!user) {
      throw new Error('해당 이메일의 사용자를 찾을 수 없습니다.');
    }

    const userId = user.user_id;

    // 1단계: 해당 사용자의 반려동물 이미지 삭제 (Storage)
    try {
      const { data: pets } = await client
        .from('pets')
        .select('pet_img')
        .eq('user_id', userId);

      if (pets && pets.length > 0) {
        for (const pet of pets) {
          if (pet.pet_img) {
            try {
              await this.deletePetImage(pet.pet_img);
            } catch (imgError) {
              console.warn('반려동물 이미지 삭제 실패 (무시):', imgError);
            }
          }
        }
      }
    } catch (petsQueryError) {
      console.warn('반려동물 조회 중 오류 (무시):', petsQueryError);
    }

    // 2단계: 해당 사용자의 반려동물 삭제
    const { error: petsError } = await client
      .from('pets')
      .delete()
      .eq('user_id', userId);

    if (petsError) {
      // 외래키 제약조건 오류인 경우 상세 메시지 제공
      if (petsError.code === '23503' || petsError.message?.includes('foreign key')) {
        throw new Error('반려동물 데이터 삭제에 실패했습니다. Supabase에서 외래키 제약조건을 확인해주세요.');
      }
      console.warn('반려동물 삭제 중 오류:', petsError);
      // RLS 정책 오류인 경우도 처리
      if (petsError.code === '42501') {
        throw new Error('반려동물 삭제 권한이 없습니다. Supabase RLS 정책을 확인해주세요.');
      }
      // 다른 오류는 무시하고 계속 진행
    }

    // 3단계: 사용자 삭제
    const { error } = await client
      .from('users')
      .delete()
      .eq('email', email);

    if (error) {
      console.error('Error deleting user:', error);
      
      // 외래키 제약조건 오류인 경우
      if (error.code === '23503' || error.message?.includes('foreign key')) {
        throw new Error('사용자 삭제에 실패했습니다. 반려동물 데이터가 남아있을 수 있습니다. Supabase에서 외래키 제약조건을 CASCADE DELETE로 설정해주세요.');
      }
      
      // RLS 정책 오류인 경우
      if (error.code === '42501') {
        throw new Error('사용자 삭제 권한이 없습니다. Supabase RLS 정책을 확인해주세요.');
      }
      
      throw error;
    }

    return true;
  },

  // 다음 사용자 ID 생성 (1부터 시작하는 순차 번호)
  async getNextUserId() {
    const client = await getSupabaseClient();
    
    // 모든 user_id를 가져와서 JavaScript에서 최대값 계산
    // text 타입이어도 숫자로 변환하여 정확한 최대값 구하기
    const { data, error } = await client
      .from('users')
      .select('user_id');

    if (error) {
      console.error('Error fetching user_id list:', error);
      return '1'; // 에러 시 1 반환
    }

    if (!data || data.length === 0) {
      return '1'; // 첫 번째 사용자
    }

    // 숫자로 변환 가능한 것만 필터링하고 최대값 구하기
    const numericIds = data
      .map(u => parseInt(u.user_id))
      .filter(id => !isNaN(id) && id > 0);

    const maxId = numericIds.length > 0 ? Math.max(...numericIds) : 0;
    return String(maxId + 1);
  },

  // 이메일 중복 체크
  async checkEmailExists(email) {
    const client = await getSupabaseClient();
    const { data, error } = await client
      .from('users')
      .select('email')
      .eq('email', email)
      .maybeSingle();

    if (error) {
      console.error('Error checking email:', error);
      // 에러가 발생해도 중복 체크 실패로 간주하여 false 반환
      return false;
    }

    // data가 있으면 이메일이 존재함
    return data !== null;
  },

  // 사용자 등록
  async createUser(userData) {
    const client = await getSupabaseClient();
    
    // 이메일 중복 체크
    const emailExists = await this.checkEmailExists(userData.email);
    if (emailExists) {
      throw new Error('이미 가입된 이메일입니다.');
    }
    
    // 다음 user_id 가져오기
    const userId = await this.getNextUserId();
    
    const insertData = {
      user_id: userId,
      email: userData.email || '',
      password: userData.password || '', // 비밀번호 저장 (데모용 - 프로덕션에서는 해시화 필요)
      nickname: userData.nickname || '',
      user_name: userData.nickname || userData.user_name || '', // 하위 호환성
      user_gender: userData.gender || userData.user_gender || '',
      user_address1: userData.residence || userData.user_address1 || '',
      phone_num: userData.phone || userData.phone_num || '',
      user_age: userData.age || userData.user_age || null,
      user_address2: userData.address2 || userData.user_address2 || null
    };

    const { data, error } = await client
      .from('users')
      .insert([insertData])
      .select()
      .single();

    if (error) {
      console.error('Error creating user:', error);
      // RLS 정책 오류인 경우 더 자세한 정보 제공
      if (error.code === '42501') {
        console.error('RLS 정책 위반 오류입니다. Supabase Dashboard에서 RLS 정책을 설정해주세요.');
        console.error('자세한 내용은 SUPABASE_RLS_FIX.md 파일을 참고하세요.');
      }
      return null;
    }

    return data;
  },

  // 다음 반려동물 ID 생성 (1부터 시작하는 순차 번호)
  async getNextPetId() {
    const client = await getSupabaseClient();
    // 가장 큰 pet_id를 숫자로 변환하여 찾기
    const { data, error } = await client
      .from('pets')
      .select('pet_id')
      .order('pet_id', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error fetching max pet_id:', error);
      return '1'; // 에러 시 1 반환
    }

    if (!data || data.length === 0) {
      return '1'; // 첫 번째 반려동물
    }

    // pet_id를 숫자로 변환하여 최대값 찾기
    const maxId = Math.max(...data.map(p => {
      const numId = parseInt(p.pet_id);
      return isNaN(numId) ? 0 : numId;
    }));

    return String(maxId + 1);
  },

  // 반려동물 이미지 업로드 (Supabase Storage)
  async uploadPetImage(file, userId, petId = null) {
    const client = await getSupabaseClient();
    
    try {
      // 파일 유효성 검사
      if (!file || !file.type.startsWith('image/')) {
        throw new Error('이미지 파일만 업로드 가능합니다.');
      }
      
      // 파일 크기 제한 (5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        throw new Error('파일 크기는 5MB 이하여야 합니다.');
      }
      
      // 파일명 생성: userId_petId_timestamp.확장자
      const fileExt = file.name.split('.').pop();
      const timestamp = Date.now();
      const fileName = petId 
        ? `${userId}/${petId}_${timestamp}.${fileExt}`
        : `${userId}/temp_${timestamp}.${fileExt}`;
      
      // Storage에 업로드 (버킷 이름: pics)
      const { data, error } = await client.storage
        .from('pics')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false // 기존 파일 덮어쓰기 방지
        });
      
      if (error) {
        console.error('이미지 업로드 실패:', error);
        throw error;
      }
      
      // Public URL 가져오기
      const { data: urlData } = client.storage
        .from('pics')
        .getPublicUrl(fileName);
      
      return urlData.publicUrl;
      
    } catch (error) {
      console.error('이미지 업로드 오류:', error);
      throw error;
    }
  },

  // 반려동물 이미지 삭제
  async deletePetImage(imageUrl) {
    const client = await getSupabaseClient();
    
    try {
      // URL에서 파일 경로 추출
      // 예: https://xxx.supabase.co/storage/v1/object/public/pics/userId/petId_timestamp.jpg
      const urlParts = imageUrl.split('/pics/');
      if (urlParts.length < 2) {
        console.warn('잘못된 이미지 URL:', imageUrl);
        return false;
      }
      
      const filePath = urlParts[1];
      
      const { error } = await client.storage
        .from('pics')
        .remove([filePath]);
      
      if (error) {
        console.error('이미지 삭제 실패:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('이미지 삭제 오류:', error);
      return false;
    }
  },

  // 반려동물 등록 (pet_id는 DB IDENTITY로 자동 생성)
  async createPet(petData) {
    const client = await getSupabaseClient();

    // 생일을 문자열로 변환 (YYYYMMDD 형식)
    let petBirth = null;
    if (petData.birthday && petData.birthday.year && petData.birthday.month && petData.birthday.day) {
      petBirth = `${petData.birthday.year}${petData.birthday.month.padStart(2, '0')}${petData.birthday.day.padStart(2, '0')}`;
    }

    // 질병 ID: healthInterests 배열의 첫 번째 질병을 disease_id로 사용
    // 질병 이름을 disease_id로 변환
    let diseaseId = null;
    if (petData.healthInterests && petData.healthInterests.length > 0) {
      // 질병 이름 매핑 (healthInterests의 키를 disease_id로 매칭)
      const diseaseMap = {
        'rhinitis': 1,            // 비염
        'heartworm': 2,           // 심장사상충
        'kidney_failure': 3,      // 신부전
        'cystitis': 4,            // 방광염
        'hepatitis': 5,           // 간염
        'enteritis': 6,           // 장염
        'dermatitis': 7,          // 피부염
        'periodontitis': 8,       // 치주염
        'patellar_luxation': 9,   // 슬개골탈구
        'keratitis': 10,          // 각막염
        'allergy': 11,            // 알레르기
        'dementia': 12            // 치매
      };
      
      const diseaseKey = petData.healthInterests[0]; // 첫 번째 질병만 사용
      diseaseId = diseaseMap[diseaseKey] || null;
    }

    // 상세 종(견종/묘종) 텍스트
    const detailedSpecies = petData.breed || petData.detailedSpecies || null;
    // 성별: 기존 값 사용
    const petGender = petData.gender || petData.pet_gender || null;
    // 체중 문자열 그대로 저장 (혹은 숫자 변환 시 parseFloat 가능)
    const petWeight = petData.weight ? String(petData.weight) : null;

    // 백업: disease_id를 찾지 못했을 때 diseases 테이블 조회 시도
    if (!diseaseId && petData.healthInterests && petData.healthInterests.length > 0) {
      const diseases = await this.getDiseases();
      const diseaseNameFallback = petData.healthInterests[0];
      const disease = diseases.find(d => d.disease_name === diseaseNameFallback);
      if (disease) diseaseId = disease.disease_id;
    }

    // 주의사항: cautionDetail을 pet_warning에 저장
    const petWarning = (petData.cautionDetail && petData.caution === 'yes') 
      ? petData.cautionDetail.trim() 
      : null;

    // pet_id는 DB IDENTITY에 맡김
    const insertData = {
      user_id: petData.user_id || petData.userId || '',
      pet_name: petData.name || petData.pet_name || '',
      pet_species: petData.type || petData.pet_species || '',
      detailed_species: detailedSpecies, // 견종/묘종 상세명
      pet_birth: petBirth ? parseInt(petBirth, 10) : null, // bigint 타입에 맞게 숫자로 변환
      pet_gender: petGender,
      weight: petWeight,
      disease_id: diseaseId,
      pet_warning: petWarning, // 주의사항 저장
      pet_img: petData.pet_img || null, // 이미지 URL 추가
      vaccination: null, // 추후 추가 가능
      vaccination_date: null // 추후 추가 가능
    };

    const { data, error } = await client
      .from('pets')
      .insert([insertData])
      .select()
      .single();

    if (error) {
      console.error('Error creating pet:', error);
      throw error;
    }

    return data;
  },

  // 반려동물 정보 수정
  async updatePet(petId, petData) {
    const client = await getSupabaseClient();

    // 생일을 문자열로 변환 (YYYYMMDD 형식)
    let petBirth = null;
    if (petData.birthday && petData.birthday.year && petData.birthday.month && petData.birthday.day) {
      petBirth = `${petData.birthday.year}${petData.birthday.month.padStart(2, '0')}${petData.birthday.day.padStart(2, '0')}`;
    }

    // 질병 ID: healthInterests 배열의 첫 번째 질병을 disease_id로 사용
    let diseaseId = null;
    if (petData.healthInterests && petData.healthInterests.length > 0) {
      const diseaseMap = {
        'rhinitis': 1,
        'heartworm': 2,
        'kidney_failure': 3,
        'cystitis': 4,
        'hepatitis': 5,
        'enteritis': 6,
        'dermatitis': 7,
        'periodontitis': 8,
        'patellar_luxation': 9,
        'keratitis': 10,
        'allergy': 11,
        'dementia': 12
      };
      
      const diseaseKey = petData.healthInterests[0];
      diseaseId = diseaseMap[diseaseKey] || null;
    }

    // 상세 종(견종/묘종) 텍스트
    const detailedSpecies = petData.breed || petData.detailedSpecies || null;
    const petGender = petData.gender || petData.pet_gender || null;
    const petWeight = petData.weight ? String(petData.weight) : null;

    // 주의사항
    const petWarning = (petData.cautionDetail && petData.caution === 'yes') 
      ? petData.cautionDetail.trim() 
      : null;

    const updateData = {
      pet_name: petData.name || petData.pet_name || '',
      pet_species: petData.type || petData.pet_species || '',
      detailed_species: detailedSpecies,
      pet_birth: petBirth ? parseInt(petBirth, 10) : null,
      pet_gender: petGender,
      weight: petWeight,
      disease_id: diseaseId,
      pet_warning: petWarning,
      pet_img: petData.pet_img || null
    };

    // null이 아닌 값만 업데이트
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === null || updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    const { data, error } = await client
      .from('pets')
      .update(updateData)
      .eq('pet_id', petId)
      .select()
      .single();

    if (error) {
      console.error('Error updating pet:', error);
      throw error;
    }

    return data;
  },

  // 제품 ID로 단일 제품 가져오기
  async getProductById(productId) {
    const client = await getSupabaseClient();
    const { data, error } = await client
      .from('products')
      .select('*')
      .eq('product_id', productId)
      .single();

    if (error) {
      console.error('Error fetching product:', error);
      return null;
    }
    return data;
  },

  // 서비스 목록 가져오기
  async getServices() {
    const client = await getSupabaseClient();
    const { data, error } = await client
      .from('services')
      .select('*')
      .order('service_id', { ascending: true });

    if (error) {
      console.error('Error fetching services:', error);
      return [];
    }
    return data || [];
  }
};

// 전역으로 export
if (typeof window !== 'undefined') {
  window.SupabaseService = SupabaseService;
  window.getSupabaseClient = getSupabaseClient;
}

