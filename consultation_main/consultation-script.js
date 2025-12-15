// 수의사 데이터 배열
const vetData = [
  {
    id: 'park',
    hospital: '스마트동물병원',
    name: '박성준 수의사',
    consultations: '512회',
    satisfaction: '4.8(50)',
    hashtags: ['#친절함', '#빠른진단', '#꼼꼼한케어'],
    specialty: '만성 질환 통합 관리',
    hasRecentConsult: true
  },
  {
    id: 'cha',
    hospital: '24시아프리카동물메디컬센터',
    name: '차진원 수의사',
    consultations: '205회',
    satisfaction: '4.8 (50)',
    hashtags: ['#투명한가격', '#상세한설명', '#재활전문'],
    specialty: '비만/영양 맞춤 관리',
    hasRecentConsult: false
  },
  {
    id: 'lee',
    hospital: '골드퍼피동물병원',
    name: '이 호 수의사',
    consultations: '788회',
    satisfaction: '4.8(50)',
    hashtags: ['#따뜻한공감', '#신속한처치', '#최신시설'],
    specialty: '노령견 종합 건강',
    hasRecentConsult: false
  },
  {
    id: 'kim',
    hospital: '이즈동물병원',
    name: '김희수 수의사',
    consultations: '395회',
    satisfaction: '4.8(50)',
    hashtags: ['#친절함', '#투명한 가격', '#상세한설명'],
    specialty: '행동 교정 및 심리',
    hasRecentConsult: false
  }
];

// 수의사 카드 생성 함수
function createVetCard(vet) {
  const hashtagsHTML = vet.hashtags.map(tag => `<span class="hashtag">${tag}</span>`).join('');
  const recentConsultButton = vet.hasRecentConsult 
    ? '<button class="consult-button">최근 상담</button>' 
    : '';
  
  // 병원 이미지 URL (Supabase에서 가져온 이미지 또는 기본값)
  const hospitalImageUrl = vet.hospital_img || '';
  const imageStyle = hospitalImageUrl 
    ? `background-image: url('${hospitalImageUrl}'); background-size: cover; background-position: center;`
    : '';
  
  return `
    <div class="vet-card" data-vet="${vet.id}">
      <div class="vet-info">
        <div class="vet-hospital">${vet.hospital}</div>
        <div class="vet-name">${vet.name}</div>
        <div class="vet-stats">
          <div class="stat-item">
            <span class="stat-label">총 상담</span>
            <span class="stat-value">${vet.consultations}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">만족도</span>
            <span class="stat-value">⭐ ${vet.satisfaction}</span>
          </div>
        </div>
        <div class="vet-tags-row">
          <span class="tag">AI 요약</span>
          ${hashtagsHTML}
        </div>
        <div class="vet-specialty-row">
          <span class="tag">전문</span>
          <span class="vet-specialty">${vet.specialty}</span>
        </div>
      </div>
      <div class="vet-right-section">
        <div class="vet-profile-image" style="${imageStyle}"></div>
        ${recentConsultButton}
      </div>
    </div>
  `;
}

// Supabase에서 병원 이미지 가져오기
async function loadHospitalImages() {
  try {
    if (typeof SupabaseService === 'undefined') {
      console.warn('SupabaseService가 로드되지 않았습니다.');
      return;
    }
    
    // 모든 병원 데이터 가져오기
    const client = await getSupabaseClient();
    const { data: allHospitals, error } = await client
      .from('hospitals')
      .select('hospital_name, hospital_img');
    
    if (error) {
      console.error('병원 이미지 로드 실패:', error);
      return;
    }
    
    // 부분 매칭으로 병원 이미지 찾기
    vetData.forEach(vet => {
      // 병원 이름으로 부분 매칭 검색
      const matchedHospital = allHospitals.find(hospital => {
        // vetData의 병원 이름이 Supabase 병원 이름에 포함되거나
        // Supabase 병원 이름이 vetData 병원 이름에 포함되는 경우
        return hospital.hospital_name.includes(vet.hospital) || 
               vet.hospital.includes(hospital.hospital_name);
      });
      
      if (matchedHospital) {
        vet.hospital_img = matchedHospital.hospital_img;
        console.log(`병원 이미지 매칭 성공: ${vet.hospital} → ${matchedHospital.hospital_name}`);
      } else {
        vet.hospital_img = null;
        console.warn(`병원 이미지 매칭 실패: ${vet.hospital}`);
      }
    });
    
    console.log('병원 이미지 로드 완료');
  } catch (error) {
    console.error('병원 이미지 로드 중 오류:', error);
  }
}

// 수의사 카드 리스트 렌더링
async function renderVetList() {
  const vetList = document.getElementById('vetList');
  if (vetList) {
    // 병원 이미지 로드 후 렌더링
    await loadHospitalImages();
    vetList.innerHTML = vetData.map(vet => createVetCard(vet)).join('');
    
    // 카드 클릭 이벤트 다시 바인딩
    bindCardEvents();
  }
}

// 카테고리 탭 클릭 이벤트
document.addEventListener('DOMContentLoaded', function() {
  // 수의사 카드 리스트 렌더링
  renderVetList();
  const categoryTabs = document.querySelectorAll('.category-tab');
  
  categoryTabs.forEach(tab => {
    tab.addEventListener('click', function() {
      // 모든 탭에서 active 클래스 제거
      categoryTabs.forEach(t => t.classList.remove('active'));
      // 클릭한 탭에 active 클래스 추가
      this.classList.add('active');
    });
  });
  
  // 반려동물 버튼 클릭 이벤트
  const petButtons = document.querySelectorAll('.pet-button');
  
  petButtons.forEach(button => {
    button.addEventListener('click', function() {
      // 모든 버튼에서 active 클래스 제거
      petButtons.forEach(btn => btn.classList.remove('active'));
      // 클릭한 버튼에 active 클래스 추가
      this.classList.add('active');
    });
  });
  
  // 필터 버튼 클릭 이벤트
  const sortFilter = document.getElementById('sortFilter');
  const sortDropdown = document.getElementById('sortDropdown');
  const sortText = document.getElementById('sortText');
  const sortOptions = document.querySelectorAll('.filter-option');
  
  if (sortFilter && sortDropdown) {
    // 필터 버튼 클릭 시 드롭다운 토글
    sortFilter.addEventListener('click', function(e) {
      e.stopPropagation();
      sortDropdown.classList.toggle('show');
      sortFilter.classList.toggle('active');
    });
    
    // 필터 옵션 선택
    sortOptions.forEach(option => {
      option.addEventListener('click', function(e) {
        e.stopPropagation();
        
        // 모든 옵션에서 active 클래스 제거
        sortOptions.forEach(opt => opt.classList.remove('active'));
        
        // 선택한 옵션에 active 클래스 추가
        this.classList.add('active');
        
        // 필터 텍스트 업데이트
        const value = this.getAttribute('data-value');
        let text = '';
        if (value === 'distance') {
          text = '가까운 순';
        } else if (value === 'satisfaction') {
          text = '만족도 순';
        } else if (value === 'consultation') {
          text = '상담횟수 순';
        } else if (value === 'accuracy') {
          text = '정확도 순';
        }
        sortText.textContent = text;
        
        // 드롭다운 닫기
        sortDropdown.classList.remove('show');
        sortFilter.classList.remove('active');
        
        // 필터 적용 (추후 구현)
        console.log('필터 적용:', value);
      });
    });
    
    // 외부 클릭 시 드롭다운 닫기
    document.addEventListener('click', function(e) {
      if (!sortFilter.contains(e.target) && !sortDropdown.contains(e.target)) {
        sortDropdown.classList.remove('show');
        sortFilter.classList.remove('active');
      }
    });
  }
  
  // 탭바 아이템 클릭 이벤트
  const tabItems = document.querySelectorAll('.tab-item');
  
  tabItems.forEach(item => {
    item.addEventListener('click', function() {
      // 모든 탭에서 active 클래스 제거
      tabItems.forEach(tab => tab.classList.remove('active'));
      // 클릭한 탭에 active 클래스 추가
      this.classList.add('active');
    });
  });
  
  // 카드 이벤트 바인딩 함수
  bindCardEvents();
});

// 카드 클릭 이벤트 바인딩 함수
function bindCardEvents() {
  // 수의사 카드 클릭 이벤트
  const vetCards = document.querySelectorAll('.vet-card');
  
  vetCards.forEach(card => {
    card.addEventListener('click', function(e) {
      // 버튼 클릭이 아닌 경우에만 카드 클릭 처리
      if (!e.target.classList.contains('consult-button') && !e.target.closest('.consult-button')) {
        const vetId = this.getAttribute('data-vet');
        const selectedVet = vetData.find(vet => vet.id === vetId);
        
        if (selectedVet) {
          // localStorage에 수의사 정보 저장
          localStorage.setItem('selectedVet', JSON.stringify(selectedVet));
          // 채팅 화면으로 이동
          window.location.href = '../consultation_chat/chat.html';
        }
      }
    });
  });
  
  // 최근 상담 버튼 클릭 이벤트
  const consultButtons = document.querySelectorAll('.consult-button');
  
  consultButtons.forEach(button => {
    button.addEventListener('click', function(e) {
      e.stopPropagation();
      const card = this.closest('.vet-card');
      const vetId = card.getAttribute('data-vet');
      const selectedVet = vetData.find(vet => vet.id === vetId);
      
      if (selectedVet) {
        // localStorage에 수의사 정보 저장
        localStorage.setItem('selectedVet', JSON.stringify(selectedVet));
        // 채팅 화면으로 이동
        window.location.href = '../consultation_chat/chat.html';
      }
    });
  });
}


