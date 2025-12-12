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
  // category: bigint (category_id)
  // product_type: '사료', '영양제', '간식' 등
  async getProducts(categoryId = null, productType = null, limit = 100) {
    const client = await getSupabaseClient();
    let query = client
      .from('products')
      .select('*')
      .limit(limit);

    if (categoryId) {
      query = query.eq('category', categoryId);
    }

    if (productType) {
      query = query.eq('product_type', productType);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching products:', error);
      return [];
    }
    return data || [];
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
      console.error('Error fetching hospitals:', error);
      return [];
    }
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

  // 다음 사용자 ID 생성 (1부터 시작하는 순차 번호)
  async getNextUserId() {
    const client = await getSupabaseClient();
    // 가장 큰 user_id를 숫자로 변환하여 찾기
    const { data, error } = await client
      .from('users')
      .select('user_id')
      .order('user_id', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error fetching max user_id:', error);
      return '1'; // 에러 시 1 반환
    }

    if (!data || data.length === 0) {
      return '1'; // 첫 번째 사용자
    }

    // user_id를 숫자로 변환하여 최대값 찾기
    const maxId = Math.max(...data.map(u => {
      const numId = parseInt(u.user_id);
      return isNaN(numId) ? 0 : numId;
    }));

    return String(maxId + 1);
  },

  // 사용자 등록
  async createUser(userData) {
    const client = await getSupabaseClient();
    
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

  // 반려동물 등록
  async createPet(petData) {
    const client = await getSupabaseClient();
    
    // 다음 pet_id 가져오기
    const petId = await this.getNextPetId();
    
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

    const insertData = {
      pet_id: petId,
      user_id: petData.user_id || petData.userId || '',
      pet_name: petData.name || petData.pet_name || '',
      pet_species: petData.type || petData.pet_species || '',
      detailed_species: detailedSpecies, // 견종/묘종 상세명
      pet_birth: petBirth,                // YYYYMMDD 형식
      pet_gender: petGender,
      weight: petWeight,
      disease_id: diseaseId,
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
      return null;
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

