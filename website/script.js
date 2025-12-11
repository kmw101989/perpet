// 탭 버튼 클릭 이벤트
document.addEventListener('DOMContentLoaded', function() {
  const tabButtons = document.querySelectorAll('.tab-btn');
  
  tabButtons.forEach(button => {
    button.addEventListener('click', function() {
      // 모든 탭에서 active 클래스 제거
      tabButtons.forEach(btn => btn.classList.remove('active'));
      // 클릭한 탭에 active 클래스 추가
      this.classList.add('active');
    });
  });
  
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

  // 진행도에 따른 색상 반환 함수 (50% 기준)
  function getProgressColor(percent) {
    if (percent < 50) {
      return '#ffd700'; // 노란색
    } else {
      return '#408ef5'; // 파란색
    }
  }

  // 진행도에 따른 클래스 반환 함수
  function getProgressClass(percent) {
    if (percent < 50) {
      return 'progress-low';
    } else {
      return 'progress-high';
    }
  }

  // 원형 게이지 업데이트 함수
  function updateCircularChart() {
    // 밥: 성견 2회=100%, 어린 강아지 3회=100%
    // 현재는 성견 기준으로 1회 = 50%
    const mealCount = 1; // 실제 데이터로 변경 가능
    const isAdult = true; // 성견 여부 (true: 성견, false: 어린 강아지)
    const mealMax = isAdult ? 2 : 3;
    const mealPercent = (mealCount / mealMax) * 100;
    
    // 산책: 36/60 = 60%
    const walkCurrent = 36;
    const walkMax = 60;
    const walkPercent = (walkCurrent / walkMax) * 100;
    
    // 원의 둘레 계산 (r=26, 38)
    const innerRadius = 26;
    const outerRadius = 38;
    
    const innerCircumference = 2 * Math.PI * innerRadius;
    const outerCircumference = 2 * Math.PI * outerRadius;
    
    // stroke-dashoffset 계산
    const innerOffset = innerCircumference - (innerCircumference * mealPercent / 100);
    const outerOffset = outerCircumference - (outerCircumference * walkPercent / 100);
    
    // SVG 요소 업데이트
    const innerCircle = document.querySelector('.circle-inner');
    const outerCircle = document.querySelector('.circle-outer');
    
    if (innerCircle) {
      innerCircle.setAttribute('stroke-dasharray', innerCircumference);
      innerCircle.setAttribute('stroke-dashoffset', innerOffset);
      innerCircle.setAttribute('stroke', getProgressColor(mealPercent));
      // 클래스 업데이트
      innerCircle.classList.remove('progress-low', 'progress-medium', 'progress-high');
      innerCircle.classList.add(getProgressClass(mealPercent));
    }
    
    if (outerCircle) {
      outerCircle.setAttribute('stroke-dasharray', outerCircumference);
      outerCircle.setAttribute('stroke-dashoffset', outerOffset);
      outerCircle.setAttribute('stroke', getProgressColor(walkPercent));
      // 클래스 업데이트
      outerCircle.classList.remove('progress-low', 'progress-medium', 'progress-high');
      outerCircle.classList.add(getProgressClass(walkPercent));
    }
  }
  
  // 선택된 반려동물 로드 및 표시
  async function loadSelectedPet() {
    const userId = localStorage.getItem('userId');
    if (!userId) return;

    // 1) 로컬스토리지에서 우선 시도
    let selectedPet = null;
    const storedPet = localStorage.getItem('selectedPetData');
    if (storedPet) {
      try {
        selectedPet = JSON.parse(storedPet);
      } catch (e) {
        console.error('저장된 반려동물 파싱 실패:', e);
      }
    }

    // 2) 없으면 Supabase에서 조회 후 가장 작은 pet_id 선택
    if (!selectedPet && typeof SupabaseService !== 'undefined' && SupabaseService.getPetsByUserId) {
      try {
        const pets = await SupabaseService.getPetsByUserId(userId);
        if (pets && pets.length > 0) {
          const sorted = [...pets].sort((a, b) => Number(a.pet_id) - Number(b.pet_id));
          selectedPet = sorted[0];
          localStorage.setItem('selectedPetId', selectedPet.pet_id);
          localStorage.setItem('selectedPetData', JSON.stringify(selectedPet));
        }
      } catch (err) {
        console.error('Supabase 반려동물 조회 실패:', err);
      }
    }

    if (!selectedPet) return;

    // DOM 업데이트
    const petNameEl = document.querySelector('.pet-name');
    const petDetailsEl = document.querySelector('.pet-details');

    if (petNameEl) {
      petNameEl.textContent = selectedPet.pet_name || '내새꾸';
    }

    if (petDetailsEl) {
      const birth = selectedPet.pet_birth;
      let ageText = '';
      if (birth && birth.length === 8) {
        const year = parseInt(birth.slice(0, 4), 10);
        const currentYear = new Date().getFullYear();
        const age = currentYear - year;
        if (!isNaN(age) && age >= 0) ageText = `${age}살 / `;
      }
      const species = selectedPet.pet_species || '';
      const detailed = selectedPet.detailed_species ? ` ${selectedPet.detailed_species}` : '';
      petDetailsEl.textContent = `${ageText}${species}${detailed}`.trim().replace(/^\/\s*/, '');
    }
  }

  // 초기 게이지 업데이트
  updateCircularChart();
  loadSelectedPet();

  // 마이페이지 버튼 클릭 이벤트
  const mypageBtn = document.querySelector('.mypage-btn');
  if (mypageBtn) {
    mypageBtn.addEventListener('click', function() {
      window.location.href = '../mypage/mypage.html';
    });
  }
});

