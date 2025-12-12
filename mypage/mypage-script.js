// 마이페이지 정보 로드 및 동기화
document.addEventListener('DOMContentLoaded', async function() {
  // Supabase 스크립트 로드 대기
  let attempts = 0;
  const maxAttempts = 50; // 5초 대기
  while (typeof SupabaseService === 'undefined' && attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 100));
    attempts++;
  }

  if (typeof SupabaseService === 'undefined') {
    console.error('SupabaseService가 로드되지 않았습니다.');
    return;
  }

  // 사용자 정보 로드
  await loadUserInfo();
  
  // 반려동물 정보 로드
  await loadPetInfo();
  
  // 다른 내새꾸 등록 버튼 클릭 이벤트
  const addPetButton = document.querySelector('.add-pet-button');
  if (addPetButton) {
    addPetButton.addEventListener('click', function() {
      // 반려동물 등록 페이지로 이동
      window.location.href = '/pet_registration01/index.html';
    });
  }
});

// 반려동물 선택 UI 표시 함수
function displayPetSelectionUI(pets, currentSelectedId) {
  const petProfileCard = document.querySelector('.pet-profile-card');
  if (!petProfileCard || pets.length <= 1) {
    return; // 반려동물이 1마리 이하면 선택 UI 표시 안 함
  }
  
  // 선택 UI가 이미 있으면 업데이트, 없으면 생성
  let selectionUI = document.querySelector('.pet-selection-ui');
  
  if (!selectionUI) {
    // 선택 UI 생성
    selectionUI = document.createElement('div');
    selectionUI.className = 'pet-selection-ui';
    // pet-profile-card 다음에 삽입
    petProfileCard.parentNode.insertBefore(selectionUI, petProfileCard.nextSibling);
  }
  
  // 선택 UI 내용 업데이트
  selectionUI.innerHTML = `
    <div class="pet-selection-label">반려동물 선택</div>
    <div class="pet-selection-list">
      ${pets.map(pet => `
        <div class="pet-selection-item ${pet.pet_id === currentSelectedId ? 'selected' : ''}" 
             data-pet-id="${pet.pet_id}">
          <div class="pet-selection-image"></div>
          <div class="pet-selection-name">${pet.pet_name || '이름 없음'}</div>
        </div>
      `).join('')}
    </div>
  `;
  
  // 선택 아이템 클릭 이벤트
  const selectionItems = selectionUI.querySelectorAll('.pet-selection-item');
  selectionItems.forEach(item => {
    item.addEventListener('click', async function() {
      const petId = this.getAttribute('data-pet-id');
      const selectedPet = pets.find(p => p.pet_id === petId);
      
      if (selectedPet) {
        // 선택 상태 업데이트
        selectionItems.forEach(i => i.classList.remove('selected'));
        this.classList.add('selected');
        
        // 로컬스토리지에 저장
        localStorage.setItem('selectedPetId', petId);
        localStorage.setItem('selectedPetData', JSON.stringify(selectedPet));
        
        console.log('반려동물 선택 변경:', selectedPet);
        
        // 반려동물 정보 다시 로드
        await loadPetInfo();
      }
    });
  });
}

// 사용자 정보 로드 함수
async function loadUserInfo() {
  try {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      console.error('userId가 없습니다.');
      return;
    }

    console.log('사용자 정보 로드 시작, userId:', userId);
    
    // DB에서 사용자 정보 가져오기
    const user = await SupabaseService.getUser(userId);
    
    if (!user) {
      console.error('사용자 정보를 찾을 수 없습니다.');
      return;
    }

    console.log('조회된 사용자 정보:', user);

    // 사용자 이름 표시
    const userNameEl = document.querySelector('.user-name');
    if (userNameEl) {
      const nickname = user.nickname || user.user_name || '사용자';
      userNameEl.textContent = `${nickname}님`;
    }

    // 주소 표시
    const addressBtn = document.querySelector('.address-btn span');
    if (addressBtn && user.user_address1) {
      addressBtn.textContent = user.user_address1;
    }

  } catch (error) {
    console.error('사용자 정보 로드 실패:', error);
  }
}

// 반려동물 정보 로드 함수
async function loadPetInfo() {
  try {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      console.error('userId가 없습니다.');
      return;
    }

    console.log('반려동물 정보 로드 시작, userId:', userId);
    
    // DB에서 반려동물 목록 가져오기
    const pets = await SupabaseService.getPetsByUserId(userId);
    
    if (!pets || pets.length === 0) {
      console.log('등록된 반려동물이 없습니다.');
      // 반려동물이 없으면 기본 메시지 표시
      const petNameEl = document.querySelector('.pet-name');
      const petDetailsEl = document.querySelector('.pet-details');
      if (petNameEl) petNameEl.textContent = '반려동물을 등록해주세요';
      if (petDetailsEl) petDetailsEl.textContent = '';
      return;
    }

    console.log('조회된 반려동물 목록:', pets);

    // pet_id 순서로 정렬 (가장 작은 pet_id가 먼저)
    const sorted = [...pets].sort((a, b) => {
      const aId = parseInt(a.pet_id, 10);
      const bId = parseInt(b.pet_id, 10);
      return (isNaN(aId) ? 0 : aId) - (isNaN(bId) ? 0 : bId);
    });
    
    // 로컬스토리지에서 선택된 반려동물 확인, 없으면 가장 작은 pet_id 선택
    let selectedPetId = localStorage.getItem('selectedPetId');
    let selectedPet = null;
    
    if (selectedPetId) {
      // 선택된 pet_id가 있는 경우 해당 반려동물 찾기
      selectedPet = sorted.find(p => p.pet_id === selectedPetId);
    }
    
    // 선택된 반려동물이 없거나 찾을 수 없으면 가장 작은 pet_id 선택
    if (!selectedPet) {
      selectedPet = sorted[0];
      selectedPetId = selectedPet.pet_id;
      localStorage.setItem('selectedPetId', selectedPetId);
      localStorage.setItem('selectedPetData', JSON.stringify(selectedPet));
    }
    
    console.log('선택된 반려동물:', selectedPet);
    
    // 여러 반려동물이 있으면 선택 UI 표시
    if (pets.length > 1) {
      displayPetSelectionUI(sorted, selectedPet.pet_id);
    } else {
      // 반려동물이 1마리 이하면 선택 UI 제거
      const existingSelection = document.querySelector('.pet-selection-ui');
      if (existingSelection) {
        existingSelection.remove();
      }
    }

    // 반려동물 이름 표시 (성별 아이콘 포함)
    const petNameEl = document.querySelector('.pet-name');
    const genderIconEl = document.querySelector('.gender-icon');
    if (petNameEl) {
      petNameEl.textContent = selectedPet.pet_name || '이름 없음';
    }
    if (genderIconEl) {
      // 성별 아이콘 표시
      const gender = selectedPet.pet_gender || '';
      if (gender === 'male' || gender === '남성' || gender === '♂') {
        genderIconEl.textContent = '♂';
      } else if (gender === 'female' || gender === '여성' || gender === '♀') {
        genderIconEl.textContent = '♀';
      } else {
        genderIconEl.textContent = '♂'; // 기본값
      }
    }

    // 품종 표시
    const petBreedEl = document.querySelector('.pet-breed');
    if (petBreedEl) {
      petBreedEl.textContent = selectedPet.detailed_species || '';
    }

    // 나이 및 체중 표시
    const petAgeEl = document.querySelector('.pet-age');
    const petWeightEl = document.querySelector('.pet-weight');
    
    if (petAgeEl) {
      let ageText = '';
      if (selectedPet.pet_birth) {
        const birthStr = String(selectedPet.pet_birth);
        if (birthStr.length >= 8) {
          const year = parseInt(birthStr.slice(0, 4), 10);
          const currentYear = new Date().getFullYear();
          const age = currentYear - year;
          if (!isNaN(age) && age >= 0) {
            ageText = `${age}살`;
          }
        }
      }
      petAgeEl.textContent = ageText;
    }
    
    if (petWeightEl) {
      let weightText = '';
      if (selectedPet.weight) {
        const weight = parseFloat(selectedPet.weight);
        if (!isNaN(weight) && weight > 0) {
          weightText = `${weight}kg`;
        }
      }
      petWeightEl.textContent = weightText;
    }

    // 질병 및 주의 태그 표시 (순서: 질환 먼저, 그 다음 주의)
    const petTagsEl = document.querySelector('.pet-tags');
    if (petTagsEl) {
      petTagsEl.innerHTML = ''; // 기존 태그 제거
      
      // 질환 태그: disease_id를 통해 diseases 테이블에서 병명 가져오기
      if (selectedPet.disease_id) {
        try {
          const diseaseInfo = await SupabaseService.getDiseaseById(selectedPet.disease_id);
          
          if (diseaseInfo && diseaseInfo.disease_name) {
            // 질환 태그 추가 - 라벨과 병명 분리
            const diseaseContainer = document.createElement('div');
            diseaseContainer.className = 'pet-tag-container';
            
            const diseaseLabel = document.createElement('span');
            diseaseLabel.className = 'tag-label tag-disease';
            diseaseLabel.textContent = '질환';
            
            const diseaseValue = document.createElement('span');
            diseaseValue.className = 'tag-value';
            diseaseValue.textContent = diseaseInfo.disease_name;
            
            diseaseContainer.appendChild(diseaseLabel);
            diseaseContainer.appendChild(diseaseValue);
            petTagsEl.appendChild(diseaseContainer);
          }
        } catch (error) {
          console.error('질병 정보 조회 실패:', error);
        }
      }
      
      // 주의 태그: pet_warning에서 가져오기 (질환 다음에 표시)
      if (selectedPet.pet_warning) {
        // pet_warning을 쉼표로 분리하여 각각 태그로 표시
        const warnings = selectedPet.pet_warning.split(',').map(w => w.trim()).filter(w => w);
        
        warnings.forEach(warning => {
          const cautionContainer = document.createElement('div');
          cautionContainer.className = 'pet-tag-container';
          
          const cautionLabel = document.createElement('span');
          cautionLabel.className = 'tag-label tag-caution';
          cautionLabel.textContent = '주의';
          
          const cautionValue = document.createElement('span');
          cautionValue.className = 'tag-value';
          cautionValue.textContent = warning;
          
          cautionContainer.appendChild(cautionLabel);
          cautionContainer.appendChild(cautionValue);
          petTagsEl.appendChild(cautionContainer);
        });
      }
    }

  } catch (error) {
    console.error('반려동물 정보 로드 실패:', error);
  }
}

// 로그아웃 함수 (전역으로 노출)
window.logout = function() {
  // 확인 메시지
  if (confirm('로그아웃 하시겠습니까?')) {
    // 모든 로컬스토리지 데이터 삭제
    localStorage.clear();
    
    // 로그인 페이지로 이동
    window.location.href = '/login/index.html';
  }
};

