// petsContainer에 여러 pet-card를 동적으로 생성
const petsContainer = document.getElementById("petsContainer");
const startBtn = document.getElementById("startBtn");
let isEditing = {};
let selectedPetCard = null;

// pet-card HTML 생성 함수
function createPetCard(petData, index) {
  const genderSymbol = petData.gender === "male" ? "♂" : petData.gender === "female" ? "♀" : "♂";
  
  // 나이 계산
  let age = "";
  if (petData.birthday && petData.birthday.year) {
    const currentYear = new Date().getFullYear();
    const birthYear = parseInt(petData.birthday.year);
    const calculatedAge = currentYear - birthYear;
    if (!isNaN(calculatedAge) && calculatedAge >= 0) {
      age = `${calculatedAge}살`;
    }
  } else if (petData.age) {
    age = `${petData.age}살`;
  }
  
  // 건강 관심사 매핑
  const healthMap = {
    rhinitis: "비염",
    heartworm: "심장사상충",
    kidney_failure: "신부전",
    cystitis: "방광염",
    hepatitis: "간염",
    enteritis: "장염",
    dermatitis: "피부염",
    periodontitis: "치주염",
    patellar_luxation: "슬개골탈구",
    keratitis: "각막염",
    allergy: "알레르기",
    dementia: "치매"
  };
  
  // 건강 관심사 (없으면 "없음" 표시)
  const healthNames = petData.healthInterests && petData.healthInterests.length > 0
    ? petData.healthInterests.map(key => healthMap[key]).filter(name => name !== undefined).join(", ")
    : "없음";
  
  // 주의사항 (없으면 "없음" 표시)
  const cautionText = (petData.caution === "yes" && petData.cautionDetail && petData.cautionDetail.trim() !== "")
    ? petData.cautionDetail.trim()
    : "없음";
  
  // 이미지 표시 여부
  const hasImage = petData.profileImage && petData.profileImage !== null && 
                   petData.profileImage !== undefined && petData.profileImage.trim() !== "";
  
  const cardHtml = `
    <div class="pet-card" data-pet-index="${index}">
      <button class="edit-btn">수정</button>
      <button class="delete-btn">삭제</button>
      <div class="pet-info">
        <div class="pet-profile">
          <div class="pet-image" id="petImageContainer-${index}">
            <input
              type="file"
              class="petImageInput"
              data-pet-index="${index}"
              accept="image/*"
              style="display: none"
            />
            ${hasImage ? `<img data-pet-index="${index}" src="${petData.profileImage}" style="display: block;" />` : ''}
          </div>
        </div>
        <div class="pet-details">
          <h2 class="pet-name">
            <span class="gender-icon">${genderSymbol}</span>
            ${petData.name || ""}
          </h2>
          <p class="pet-breed">${petData.breed || ""}</p>
          <div class="pet-meta">
            <span class="pet-age">${age}</span>
            <span class="separator">·</span>
            <span class="pet-weight">${petData.weight ? petData.weight.replace(/kg/g, "").trim() + "kg" : ""}</span>
          </div>
          <div class="pet-tags">
            <span class="tag tag-interest">
              <span class="tag-label">질환</span>
              <span class="tag-value">${healthNames}</span>
            </span>
            <span class="tag tag-caution">
              <span class="tag-label">주의</span>
              <span class="tag-value">${cautionText}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  `;
  
  return cardHtml;
}

// pet-card 삭제 함수
function deletePetCard(petIndex) {
  try {
    // localStorage에서 petsData 가져오기
    const petsData = JSON.parse(localStorage.getItem("petsData") || "[]");
    
    // 해당 인덱스의 데이터 제거
    if (petIndex >= 0 && petIndex < petsData.length) {
      petsData.splice(petIndex, 1);
      localStorage.setItem("petsData", JSON.stringify(petsData));
      
      // 편집 상태 초기화
      delete isEditing[petIndex];
      
      // 선택된 카드가 삭제된 카드인 경우 선택 해제
      if (selectedPetCard && selectedPetCard.getAttribute("data-pet-index") === String(petIndex)) {
        selectedPetCard = null;
      }
      
      // 페이지 새로고침하여 카드 목록 재렌더링
      loadPetData();
    }
  } catch (error) {
    console.error("반려동물 삭제 실패:", error);
  }
}

// pet-card 클릭 핸들러 설정
function setupPetCardClickHandlers() {
  const petCards = document.querySelectorAll(".pet-card");
  
  petCards.forEach((petCard) => {
    const petIndex = petCard.getAttribute("data-pet-index");
    
    petCard.addEventListener("click", (e) => {
      // 편집 모드 중이면 선택 효과 비활성화
      if (isEditing[petIndex]) {
        return;
      }
      // edit-btn, delete-btn, pet-profile, pet-image 클릭 시에는 카드 선택 효과가 발생하지 않도록
      if (e.target.closest(".edit-btn") || e.target.closest(".delete-btn") || e.target.closest(".pet-profile") || e.target.closest(".pet-image")) {
        return;
      }
      
      // 이전 선택 해제
      if (selectedPetCard && selectedPetCard !== petCard) {
        selectedPetCard.classList.remove("selected");
        selectedPetCard.querySelectorAll(".tag").forEach((tag) => {
          tag.classList.remove("selected");
        });
      }
      
      // 현재 카드 토글
      petCard.classList.toggle("selected");
      selectedPetCard = petCard.classList.contains("selected") ? petCard : null;
      
      // 태그 자동 활성화 (선택 제약 해제)
      if (petCard.classList.contains("selected")) {
        // 현재 카드의 모든 태그 자동 활성화
        petCard.querySelectorAll(".tag").forEach((tag) => {
          tag.classList.add("selected");
        });
      } else {
        // 모든 태그 비활성화
        petCard.querySelectorAll(".tag").forEach((tag) => {
          tag.classList.remove("selected");
        });
      }
    });
    
    // 수정 버튼 클릭 이벤트
    const editBtn = petCard.querySelector(".edit-btn");
    if (editBtn) {
      editBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        // 수정할 반려동물 데이터 가져오기
        try {
          const petsData = JSON.parse(localStorage.getItem("petsData") || "[]");
          const parsedIndex = parseInt(petIndex);
          
          console.log("=== 수정 버튼 클릭 ===");
          console.log("petIndex (원본):", petIndex);
          console.log("parsedIndex:", parsedIndex);
          console.log("petsData.length:", petsData.length);
          console.log("petsData[parsedIndex]:", petsData[parsedIndex]);
          
          if (!isNaN(parsedIndex) && parsedIndex >= 0 && parsedIndex < petsData.length && petsData[parsedIndex]) {
            // 기존 currentPetData를 깊은 복사로 복원 (수정 모드 표시를 위해)
            const petDataToEdit = JSON.parse(JSON.stringify(petsData[parsedIndex]));
            
            // currentPetData에 수정 플래그 추가
            petDataToEdit._isEditing = true;
            petDataToEdit._editingIndex = parsedIndex;
            
            // 수정할 반려동물 데이터를 currentPetData로 설정
            localStorage.setItem("currentPetData", JSON.stringify(petDataToEdit));
            
            // 수정 중인 인덱스 저장 (명확하게 문자열로 변환하고 검증)
            const indexString = String(parsedIndex);
            localStorage.setItem("editingPetIndex", indexString);
            
            // 검증: 저장된 값 확인
            const savedIndex = localStorage.getItem("editingPetIndex");
            console.log(`✅ 수정 모드 진입: 인덱스 ${parsedIndex}`);
            console.log("저장된 editingPetIndex:", savedIndex, "타입:", typeof savedIndex);
            console.log("currentPetData:", petDataToEdit);
            console.log("==========================");
            
            // pet_registration03 페이지로 이동
            window.location.href = '../pet_registration03/index.html';
          } else {
            console.error("❌ 유효하지 않은 인덱스 또는 데이터:", {
              parsedIndex,
              isValidIndex: !isNaN(parsedIndex),
              inRange: parsedIndex >= 0 && parsedIndex < petsData.length,
              hasData: !!petsData[parsedIndex]
            });
          }
        } catch (error) {
          console.error("수정 모드 진입 실패:", error);
        }
      });
    }
    
    // 삭제 버튼 클릭 이벤트
    const deleteBtn = petCard.querySelector(".delete-btn");
    if (deleteBtn) {
      deleteBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        // 확인 다이얼로그
        if (confirm("정말로 이 반려동물 정보를 삭제하시겠습니까?")) {
          deletePetCard(petIndex);
        }
      });
    }
    
    // 이미지 업로드 설정 (pet-profile과 pet-image 모두 클릭 가능)
    const petProfile = petCard.querySelector(".pet-profile");
    const imageContainer = petCard.querySelector(`#petImageContainer-${petIndex}`);
    const imageInput = petCard.querySelector(`.petImageInput[data-pet-index="${petIndex}"]`);
    if (imageContainer && imageInput) {
      setupPetImageClickHandler(imageContainer, imageInput, petIndex);
      // pet-profile 클릭 시에도 이미지 선택 가능하도록
      if (petProfile) {
        setupPetProfileClickHandler(petProfile, imageInput, petIndex);
      }
    }
  });
}

// 이미지 영역 클릭 가능하도록 설정
function setupPetImageClickHandler(container, input, petIndex) {
  if (container && input) {
    container.onclick = (e) => {
      e.stopPropagation();
      input.click();
    };
    container.style.cursor = "pointer";
    
    input.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          let petImage = container.querySelector(`img[data-pet-index="${petIndex}"]`);
          
          if (!petImage) {
            petImage = document.createElement("img");
            petImage.setAttribute("data-pet-index", petIndex);
            petImage.alt = "";
            container.appendChild(petImage);
          }
          
          petImage.src = e.target.result;
          petImage.style.display = "block";

          // petsData 배열 업데이트
          try {
            const petsData = JSON.parse(localStorage.getItem("petsData") || "[]");
            if (petsData[petIndex]) {
              petsData[petIndex].profileImage = e.target.result;
              localStorage.setItem("petsData", JSON.stringify(petsData));
            }
          } catch (error) {
            console.error("이미지 저장 실패:", error);
          }
        };
        reader.readAsDataURL(file);
      }
    });
  }
}

// pet-profile 클릭 시 이미지 선택 가능하도록 설정
function setupPetProfileClickHandler(profile, input, petIndex) {
  if (profile && input) {
    profile.onclick = (e) => {
      // pet-image 내부를 클릭한 경우는 중복 방지
      if (e.target.closest(".pet-image")) {
        return;
      }
      e.stopPropagation();
      input.click();
    };
    profile.style.cursor = "pointer";
  }
}

// 편집 모드 활성화
function enableEditMode(petCard, petIndex) {
  isEditing[petIndex] = true;
  petCard.classList.add("editing");
  const editBtn = petCard.querySelector(".edit-btn");
  if (editBtn) editBtn.textContent = "저장";
  
  const petName = petCard.querySelector(".pet-name");
  const petBreed = petCard.querySelector(".pet-breed");
  const petAge = petCard.querySelector(".pet-age");
  const petWeight = petCard.querySelector(".pet-weight");
  
  // 원본 데이터 저장
  const originalData = {
    name: petName.textContent.trim().replace(/[♂♀]/g, "").trim(),
    breed: petBreed.textContent.trim(),
    age: petAge.textContent.replace("살", "").trim(),
    weight: petWeight.textContent.replace("kg", "").trim()
  };
  
  petCard.setAttribute("data-original", JSON.stringify(originalData));
  
  // 성별 기호 유지
  const genderIcon = petName.querySelector(".gender-icon");
  const genderSymbol = genderIcon ? genderIcon.textContent : "";
  
  // 이름 편집
  const nameInput = document.createElement("input");
  nameInput.type = "text";
  nameInput.value = originalData.name;
  nameInput.className = "pet-name-input";
  nameInput.style.cssText = `
    font-family: "JejuGothic", "Noto Sans KR", sans-serif;
    font-size: 12px;
    font-weight: 400;
    color: #202027;
    border: 1px solid #e5e5e5;
    border-radius: 5px;
    padding: 2px 6px;
    background-color: #ffffff;
    outline: none;
    width: 80px;
    line-height: 13.02px;
    height: 19px;
    margin: 0;
    vertical-align: middle;
    box-sizing: border-box;
  `;
  petName.innerHTML = "";
  if (genderIcon) {
    petName.appendChild(genderIcon.cloneNode(true));
  }
  petName.appendChild(nameInput);
  
  // 견종 편집
  const breedInput = document.createElement("input");
  breedInput.type = "text";
  breedInput.value = originalData.breed;
  breedInput.className = "pet-breed-input";
  breedInput.style.cssText = `
    font-family: "JejuGothic", "Noto Sans KR", sans-serif;
    font-size: 12px;
    font-weight: 400;
    color: #202027;
    border: 1px solid #e5e5e5;
    border-radius: 5px;
    padding: 2px 6px;
    background-color: #ffffff;
    outline: none;
    width: 100px;
    line-height: 13.02px;
    height: 19px;
    margin: 0;
    vertical-align: middle;
    box-sizing: border-box;
  `;
  petBreed.innerHTML = "";
  petBreed.appendChild(breedInput);
  
  // 나이 편집
  const ageInput = document.createElement("input");
  ageInput.type = "text";
  ageInput.value = originalData.age;
  ageInput.className = "pet-age-input";
  ageInput.style.cssText = `
    font-family: "JejuGothic", "Noto Sans KR", sans-serif;
    font-size: 12px;
    font-weight: 400;
    color: #202027;
    border: 1px solid #e5e5e5;
    border-radius: 5px;
    padding: 2px 4px;
    background-color: #ffffff;
    outline: none;
    width: 25px;
    text-align: center;
    line-height: 13.02px;
    height: 19px;
    margin: 0;
    vertical-align: middle;
    display: inline-block;
    box-sizing: border-box;
  `;
  const ageUnit = document.createElement("span");
  ageUnit.textContent = "살";
  ageUnit.style.cssText = `
    font-family: "JejuGothic", "Noto Sans KR", sans-serif;
    font-size: 12px;
    font-weight: 400;
    color: #202027;
    line-height: 13.02px;
    display: inline;
  `;
  petAge.innerHTML = "";
  petAge.appendChild(ageInput);
  petAge.appendChild(ageUnit);
  
  // 몸무게 편집
  const weightInput = document.createElement("input");
  weightInput.type = "text";
  weightInput.value = originalData.weight;
  weightInput.className = "pet-weight-input";
  weightInput.style.cssText = `
    font-family: "JejuGothic", "Noto Sans KR", sans-serif;
    font-size: 12px;
    font-weight: 400;
    color: #202027;
    border: 1px solid #e5e5e5;
    border-radius: 5px;
    padding: 2px 4px;
    background-color: #ffffff;
    outline: none;
    width: 25px;
    text-align: center;
    line-height: 13.02px;
    height: 19px;
    margin: 0;
    vertical-align: middle;
    display: inline-block;
    box-sizing: border-box;
  `;
  const weightUnit = document.createElement("span");
  weightUnit.textContent = "kg";
  weightUnit.style.cssText = `
    font-family: "JejuGothic", "Noto Sans KR", sans-serif;
    font-size: 12px;
    font-weight: 400;
    color: #202027;
    line-height: 13.02px;
    display: inline;
  `;
  petWeight.innerHTML = "";
  petWeight.appendChild(weightInput);
  petWeight.appendChild(weightUnit);
}

// 편집 모드 비활성화
function disableEditMode(petCard, petIndex) {
  isEditing[petIndex] = false;
  petCard.classList.remove("editing");
  const editBtn = petCard.querySelector(".edit-btn");
  if (editBtn) editBtn.textContent = "수정";
  
  const petName = petCard.querySelector(".pet-name");
  const petBreed = petCard.querySelector(".pet-breed");
  const petAge = petCard.querySelector(".pet-age");
  const petWeight = petCard.querySelector(".pet-weight");
  
  // 편집된 데이터 가져오기
  const nameInput = petName.querySelector(".pet-name-input");
  const genderIcon = petName.querySelector(".gender-icon");
  const genderSymbol = genderIcon ? genderIcon.textContent : "";
  const newName = nameInput ? nameInput.value.trim() : "";
  
  const breedInput = petBreed.querySelector(".pet-breed-input");
  const newBreed = breedInput ? breedInput.value.trim() : "";
  
  const ageInput = petAge.querySelector(".pet-age-input");
  const newAge = ageInput ? ageInput.value.trim() : "";
  
  const weightInput = petWeight.querySelector(".pet-weight-input");
  const newWeight = weightInput ? weightInput.value.trim() : "";
  
  // 화면 업데이트
  petName.innerHTML = "";
  if (genderIcon) {
    petName.appendChild(genderIcon);
  }
  petName.appendChild(document.createTextNode(newName));
  
  petBreed.textContent = newBreed;
  
  petAge.innerHTML = "";
  const ageText = document.createTextNode(newAge + "살");
  petAge.appendChild(ageText);
  
  petWeight.innerHTML = "";
  const weightText = document.createTextNode(newWeight + "kg");
  petWeight.appendChild(weightText);
  
  // petsData 배열 업데이트
  try {
    const petsData = JSON.parse(localStorage.getItem("petsData") || "[]");
    if (petsData[petIndex]) {
      petsData[petIndex].name = newName;
      petsData[petIndex].breed = newBreed;
      petsData[petIndex].age = newAge;
      petsData[petIndex].weight = newWeight;
      localStorage.setItem("petsData", JSON.stringify(petsData));
    }
  } catch (error) {
    console.error("데이터 저장 실패:", error);
  }
}

// tag-value가 한 줄인지 확인하여 tag-label 정렬 조정
function adjustTagAlignment() {
  const petCards = document.querySelectorAll(".pet-card");
  
  petCards.forEach((petCard) => {
    const tagInterest = petCard.querySelector(".tag.tag-interest");
    const tagCaution = petCard.querySelector(".tag.tag-caution");
    
    // tag-interest 정렬 조정
    if (tagInterest) {
      const tagValue = tagInterest.querySelector(".tag-value");
      if (tagValue) {
        const lineHeight = parseFloat(getComputedStyle(tagValue).lineHeight);
        const height = tagValue.scrollHeight;
        if (height <= lineHeight * 1.5) {
          tagInterest.style.alignItems = "center";
        } else {
          tagInterest.style.alignItems = "flex-start";
        }
      }
    }
    
    // tag-caution 정렬 조정
    if (tagCaution) {
      const tagValue = tagCaution.querySelector(".tag-value");
      if (tagValue) {
        const lineHeight = parseFloat(getComputedStyle(tagValue).lineHeight);
        const height = tagValue.scrollHeight;
        if (height <= lineHeight * 1.5) {
          tagCaution.style.alignItems = "center";
        } else {
          tagCaution.style.alignItems = "flex-start";
        }
      }
    }
  });
}

// 로컬 스토리지에서 반려동물 정보 가져오기 및 렌더링
function loadPetData() {
  try {
    const petsData = JSON.parse(localStorage.getItem("petsData") || "[]");
    
    if (petsData.length === 0) {
      // 기존 petData가 있으면 마이그레이션 (하위 호환성)
      const oldPetData = localStorage.getItem("petData");
      if (oldPetData) {
        try {
          const petData = JSON.parse(oldPetData);
          if (petData.name) {
            petsData.push(petData);
            localStorage.setItem("petsData", JSON.stringify(petsData));
            localStorage.removeItem("petData");
          }
        } catch (error) {
          console.error("기존 데이터 마이그레이션 실패:", error);
        }
      }
    }
    
    // petsContainer 초기화
    if (petsContainer) {
      petsContainer.innerHTML = "";
      
      // 각 반려동물에 대해 pet-card 생성
      petsData.forEach((petData, index) => {
        const cardHtml = createPetCard(petData, index);
        petsContainer.insertAdjacentHTML("beforeend", cardHtml);
      });
      
      // 이벤트 핸들러 설정
      setupPetCardClickHandlers();
      
      // startBtn 항상 활성화 (선택 제약 해제)
      if (startBtn) {
        startBtn.classList.add("active");
      }
      
      // 태그 정렬 조정
      setTimeout(() => {
        adjustTagAlignment();
      }, 100);
    }
  } catch (error) {
    console.error("반려동물 데이터 로드 실패:", error);
  }
}

// 뒤로 가기 버튼 클릭 이벤트
const backBtn = document.getElementById("backBtn");
if (backBtn) {
  backBtn.addEventListener("click", () => {
    console.log("뒤로 가기 버튼 클릭");
    
    try {
      // petsData에서 가장 최근에 입력된 반려동물 정보 가져오기
      const petsData = JSON.parse(localStorage.getItem("petsData") || "[]");
      
      if (petsData.length > 0) {
        // 가장 최근 항목 (마지막 요소)
        const lastPetIndex = petsData.length - 1;
        const lastPetData = petsData[lastPetIndex];
        
        // currentPetData에 복원할 데이터 설정
        const petDataToEdit = JSON.parse(JSON.stringify(lastPetData));
        petDataToEdit._isEditing = true;
        petDataToEdit._editingIndex = lastPetIndex;
        
        // currentPetData 설정
        localStorage.setItem("currentPetData", JSON.stringify(petDataToEdit));
        
        // editingPetIndex 설정
        localStorage.setItem("editingPetIndex", String(lastPetIndex));
        
        console.log("뒤로 가기: 최근 입력 내용 복원", {
          index: lastPetIndex,
          petData: lastPetData
        });
      } else {
        // petsData가 없는 경우 currentPetData 확인
        const currentPetData = JSON.parse(localStorage.getItem("currentPetData") || "{}");
        if (Object.keys(currentPetData).length === 0) {
          console.warn("복원할 데이터가 없습니다.");
        }
      }
    } catch (error) {
      console.error("뒤로 가기 시 데이터 복원 실패:", error);
    }
    
    // pet_registration03 페이지로 이동
    window.location.href = "../pet_registration03/index.html";
  });
}

// 다른 내새꾸 등록 카드 클릭 이벤트
const addPetCard = document.querySelector(".add-pet-card");
if (addPetCard) {
  addPetCard.addEventListener("click", () => {
    console.log("다른 내새꾸 등록 클릭 - 신규 등록 시작");
    // 신규 등록을 위한 완전한 초기화
    // currentPetData와 editingPetIndex 모두 초기화하여 신규 등록임을 명확히 표시
    localStorage.removeItem("currentPetData");
    localStorage.removeItem("editingPetIndex");
    console.log("신규 등록: currentPetData 및 editingPetIndex 초기화 완료");
    // 기존 petsData는 유지 (새 카드가 추가되도록)
    // pet_registration 페이지로 이동
    window.location.href = "../pet_registration01/index.html";
  });
}

// 퍼펫트 시작하기 버튼
if (startBtn) {
  let isSubmitting = false; // 제출 중 플래그 (중복 클릭 방지)
  
  startBtn.addEventListener("click", async () => {
    // 중복 클릭 방지
    if (isSubmitting) {
      console.log("이미 처리 중입니다. 중복 클릭 무시.");
      return;
    }
    
    console.log("퍼펫트 시작하기 클릭");
    
    // 제출 시작
    isSubmitting = true;
    startBtn.disabled = true;
    startBtn.style.opacity = "0.6";
    startBtn.style.cursor = "not-allowed";

    try {
      const userId = localStorage.getItem("userId");
      if (!userId) {
        isSubmitting = false;
        startBtn.disabled = false;
        startBtn.style.opacity = "1";
        startBtn.style.cursor = "pointer";
        window.location.href = "../login/index.html";
        return;
      }

      // Supabase에서 해당 사용자 반려동물 조회 후 가장 작은 pet_id 선택
      if (typeof SupabaseService !== "undefined" && SupabaseService.getPetsByUserId) {
        const pets = await SupabaseService.getPetsByUserId(userId);
        if (pets && pets.length > 0) {
          const sorted = [...pets].sort((a, b) => Number(a.pet_id) - Number(b.pet_id));
          const firstPet = sorted[0];

          // 로컬스토리지에 선택된 반려동물 저장
          localStorage.setItem("selectedPetId", firstPet.pet_id);
          localStorage.setItem("selectedPetData", JSON.stringify(firstPet));
        }
      } else {
        // Supabase 미사용 시 로컬 petsData에서 선택
        const petsData = JSON.parse(localStorage.getItem("petsData") || "[]");
        if (petsData.length > 0) {
          const petWithId = petsData.find(p => p.pet_id) || petsData[0];
          localStorage.setItem("selectedPetId", petWithId.pet_id || "local_0");
          localStorage.setItem("selectedPetData", JSON.stringify(petWithId));
        }
      }
    } catch (err) {
      console.error("초기 반려동물 선택 중 오류:", err);
    }

    // 메인페이지로 이동
    window.location.href = "../website/index.html";
  });
}

// 페이지 로드 시 반려동물 정보 로드
window.addEventListener("DOMContentLoaded", () => {
  loadPetData();
});

// 페이지 포커스 시 데이터 새로고침 (pet_registration03에서 돌아왔을 때 업데이트 반영)
window.addEventListener("focus", () => {
  console.log("페이지 포커스 - 데이터 새로고침");
  // editingPetIndex가 제거되었다는 것은 수정이 완료되었다는 의미
  // 또는 뒤로가기로 돌아온 경우에도 데이터 새로고침
  loadPetData();
});

// 페이지 가시성 변경 시에도 데이터 새로고침
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) {
    console.log("페이지 가시성 변경 - 데이터 새로고침");
    loadPetData();
  }
});
