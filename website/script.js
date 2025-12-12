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
  
  // 생년월일로부터 나이 계산 함수 (YYYYMMDD 형식)
  function calculateAge(birthDateStr) {
    if (!birthDateStr || birthDateStr.length !== 8) {
      return null;
    }
    
    try {
      const year = parseInt(birthDateStr.slice(0, 4), 10);
      const month = parseInt(birthDateStr.slice(4, 6), 10) - 1; // 월은 0부터 시작
      const day = parseInt(birthDateStr.slice(6, 8), 10);
      
      if (isNaN(year) || isNaN(month) || isNaN(day)) {
        return null;
      }
      
      const birthDate = new Date(year, month, day);
      const today = new Date();
      
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      // 생일이 아직 지나지 않았으면 나이에서 1 빼기
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      return age >= 0 ? age : null;
    } catch (e) {
      console.error('나이 계산 실패:', e);
      return null;
    }
  }

  // 선택된 반려동물 로드 및 표시
  async function loadSelectedPet() {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      console.log('userId가 없습니다.');
      return;
    }

    // 1) 로컬스토리지에서 우선 시도
    let selectedPet = null;
    const storedPet = localStorage.getItem('selectedPetData');
    if (storedPet) {
      try {
        selectedPet = JSON.parse(storedPet);
        console.log('로컬스토리지에서 반려동물 정보 로드:', selectedPet);
      } catch (e) {
        console.error('저장된 반려동물 파싱 실패:', e);
      }
    }

    // 2) 없으면 Supabase에서 조회 후 가장 작은 pet_id 선택
    if (!selectedPet && typeof SupabaseService !== 'undefined' && SupabaseService.getPetsByUserId) {
      try {
        console.log('Supabase에서 반려동물 조회 시작, userId:', userId);
        const pets = await SupabaseService.getPetsByUserId(userId);
        console.log('조회된 반려동물 목록:', pets);
        
        if (pets && pets.length > 0) {
          // pet_id를 숫자로 변환하여 정렬
          const sorted = [...pets].sort((a, b) => {
            const aId = parseInt(a.pet_id, 10);
            const bId = parseInt(b.pet_id, 10);
            return (isNaN(aId) ? 0 : aId) - (isNaN(bId) ? 0 : bId);
          });
          selectedPet = sorted[0];
          console.log('선택된 반려동물 (가장 작은 pet_id):', selectedPet);
          
          localStorage.setItem('selectedPetId', selectedPet.pet_id);
          localStorage.setItem('selectedPetData', JSON.stringify(selectedPet));
        } else {
          console.log('반려동물이 등록되지 않았습니다.');
        }
      } catch (err) {
        console.error('Supabase 반려동물 조회 실패:', err);
      }
    }

    if (!selectedPet) {
      console.log('표시할 반려동물 정보가 없습니다.');
      return;
    }

    // DOM 업데이트
    const petNameEl = document.querySelector('.pet-name');
    const petDetailsEl = document.querySelector('.pet-details');

    if (petNameEl) {
      // 이름이 있으면 실제 이름만 표시, 없으면 빈 값 (기본값 "내새꾸" 제거)
      const petName = selectedPet.pet_name || selectedPet.petName || '';
      petNameEl.textContent = petName;
      console.log('반려동물 이름 표시:', {
        pet_name: selectedPet.pet_name,
        petName: selectedPet.petName,
        최종표시: petName || '(이름 없음)',
        전체데이터: selectedPet
      });
    } else {
      console.error('pet-name 요소를 찾을 수 없습니다.');
    }

    if (petDetailsEl) {
      // 품종 정보 (detailed_species)
      let speciesText = '';
      if (selectedPet.detailed_species) {
        speciesText = selectedPet.detailed_species.trim();
      }
      
      // 체중 정보 (weight) - double precision 타입
      let weightText = '';
      if (selectedPet.weight !== null && selectedPet.weight !== undefined) {
        // weight는 숫자이므로 그대로 사용
        const weight = parseFloat(selectedPet.weight);
        if (!isNaN(weight) && weight > 0) {
          weightText = `${weight}kg`;
        }
      }
      
      // 품종과 체중 조합 (형식: "품종 · 체중kg")
      const details = [];
      if (speciesText) details.push(speciesText);
      if (weightText) details.push(weightText);
      
      // 상세 정보가 있으면 표시, 없으면 빈 값
      petDetailsEl.textContent = details.length > 0 ? details.join(' · ') : '';
      console.log('반려동물 상세 정보 표시:', {
        이름: selectedPet.pet_name,
        품종: speciesText,
        체중: weightText,
        detailed_species: selectedPet.detailed_species,
        weight: selectedPet.weight,
        전체데이터: selectedPet
      });
    } else {
      console.error('pet-details 요소를 찾을 수 없습니다.');
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

  // 배너 광고 모달 표시
  showBannerModal();
});

// 배너 광고 모달 표시 함수
function showBannerModal() {
  // 로컬스토리지에서 배너 닫기 상태 확인
  const bannerClosed = localStorage.getItem('bannerClosed');
  if (bannerClosed === 'true') {
    return; // 이미 닫혔으면 표시하지 않음
  }

  const bannerModal = document.getElementById('bannerModal');
  const bannerCloseBtn = document.getElementById('bannerCloseBtn');
  const bannerImage = document.getElementById('bannerImage');

  if (!bannerModal) return;

  // 배너 모달 표시
  bannerModal.classList.add('show');

  // 닫기 버튼 클릭 이벤트
  if (bannerCloseBtn) {
    bannerCloseBtn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      closeBannerModal();
    });
  }

  // 이미지 클릭 시 닫기 (이미지에 X가 포함되어 있을 수 있으므로)
  if (bannerImage) {
    bannerImage.addEventListener('click', function(e) {
      // 이미지의 오른쪽 상단 영역 클릭 시 닫기 (X 버튼 영역)
      const rect = this.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;
      const imageWidth = rect.width;
      const imageHeight = rect.height;
      
      // 오른쪽 상단 15% 영역 클릭 시 닫기 (X 버튼이 보통 그 위치에 있음)
      if (clickX > imageWidth * 0.85 && clickY < imageHeight * 0.15) {
        closeBannerModal();
      }
    });
  }

  // 배경 클릭 시 닫기
  const overlay = bannerModal.querySelector('.banner-modal-overlay');
  if (overlay) {
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) {
        closeBannerModal();
      }
    });
  }
}

// 배너 모달 닫기 함수
function closeBannerModal() {
  const bannerModal = document.getElementById('bannerModal');
  if (bannerModal) {
    bannerModal.classList.remove('show');
    // 로컬스토리지에 닫기 상태 저장 (이번 세션 동안만)
    localStorage.setItem('bannerClosed', 'true');
  }
}

