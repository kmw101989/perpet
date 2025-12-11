// 전역 변수 선언
let profileImage, profileImageContainer, imageInput;
let birthYear, birthMonth, birthDay;
let genderButtons, bodyTypeButtons;
let breedInput, weightInput, nextBtn;
let selectedGender = null;
let selectedBodyType = null;

// 일 옵션 업데이트 함수
function updateDayOptions() {
  const selectedMonth = parseInt(birthMonth.value);
  const selectedYear = parseInt(birthYear.value);

  // 기존 옵션 제거 (첫 번째 옵션 "일" 제외)
  while (birthDay.options.length > 1) {
    birthDay.remove(1);
  }

  // 월과 년도가 모두 선택되지 않은 경우 1-31
  if (!selectedMonth) {
    for (let day = 1; day <= 31; day++) {
      const option = document.createElement("option");
      option.value = day.toString().padStart(2, "0");
      option.textContent = day;
      birthDay.appendChild(option);
    }
    return;
  }

  // 선택된 월에 따라 일 수 결정
  let daysInMonth = 31;
  
  if (selectedMonth === 2) {
    // 2월: 윤년 체크
    if (selectedYear) {
      daysInMonth =
        (selectedYear % 4 === 0 && selectedYear % 100 !== 0) ||
        selectedYear % 400 === 0
          ? 29
          : 28;
    } else {
      // 년도가 선택되지 않았으면 28일까지
      daysInMonth = 28;
    }
  } else if ([4, 6, 9, 11].includes(selectedMonth)) {
    // 4월, 6월, 9월, 11월: 30일까지
    daysInMonth = 30;
  }
  // 1월, 3월, 5월, 7월, 8월, 10월, 12월: 31일까지 (기본값)

  // 일 옵션 생성
  for (let day = 1; day <= daysInMonth; day++) {
    const option = document.createElement("option");
    option.value = day.toString().padStart(2, "0");
    option.textContent = day;
    birthDay.appendChild(option);
  }

  // 현재 선택된 일이 새로운 최대 일보다 크면 초기화
  if (birthDay.value && parseInt(birthDay.value) > daysInMonth) {
    birthDay.value = "";
  }
}

// 생일 드롭다운 초기화 함수
function initializeBirthdayDropdowns() {
  if (!birthYear || !birthMonth || !birthDay) return;
  
  // 년도 옵션 생성 (현재 년도부터 30년 전까지)
  const currentYear = new Date().getFullYear();
  for (let year = currentYear; year >= currentYear - 30; year--) {
    const option = document.createElement("option");
    option.value = year;
    option.textContent = year;
    birthYear.appendChild(option);
  }

  // 월 옵션 생성 (1-12)
  for (let month = 1; month <= 12; month++) {
    const option = document.createElement("option");
    option.value = month.toString().padStart(2, "0");
    option.textContent = month;
    birthMonth.appendChild(option);
  }

  // 일 옵션 초기 생성 (1-31)
  for (let day = 1; day <= 31; day++) {
    const option = document.createElement("option");
    option.value = day.toString().padStart(2, "0");
    option.textContent = day;
    birthDay.appendChild(option);
  }
  
  // 이벤트 리스너 등록
  birthMonth.addEventListener("change", () => {
    updateDayOptions();
    checkFormCompletion();
  });

  birthYear.addEventListener("change", () => {
    updateDayOptions();
    checkFormCompletion();
  });

  birthDay.addEventListener("change", () => {
    checkFormCompletion();
  });
}

// 성별 버튼 이벤트 리스너 설정
function setupGenderButtons() {
  if (!genderButtons || genderButtons.length === 0) return;
  
  genderButtons.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      genderButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      selectedGender = btn.dataset.gender;
      checkFormCompletion();
    });
  });
}

// 체형 버튼 이벤트 리스너 설정
function setupBodyTypeButtons() {
  if (!bodyTypeButtons || bodyTypeButtons.length === 0) return;
  
  bodyTypeButtons.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      bodyTypeButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      selectedBodyType = btn.dataset.type;
      checkFormCompletion();
    });
  });
}

// 프로필 이미지 이벤트 리스너 설정
function setupProfileImage() {
  if (!profileImage || !imageInput) return;
  
  profileImage.addEventListener("click", (e) => {
    e.stopPropagation();
    imageInput.click();
  });

  if (profileImageContainer) {
    profileImageContainer.addEventListener("click", (e) => {
      if (e.target.closest(".profile-image")) {
        return;
      }
      e.stopPropagation();
      imageInput.click();
    });
  }

  imageInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = document.createElement("img");
        img.src = e.target.result;
        profileImage.innerHTML = "";
        profileImage.appendChild(img);
        
        try {
          const currentPetData = JSON.parse(localStorage.getItem("currentPetData") || "{}");
          currentPetData.profileImage = e.target.result;
          localStorage.setItem("currentPetData", JSON.stringify(currentPetData));
        } catch (error) {
          console.error("이미지 저장 실패:", error);
        }
      };
      reader.readAsDataURL(file);
    }
  });
}

// 몸무게 입력 이벤트 리스너 설정
function setupWeightInput() {
  if (!weightInput) return;
  
  weightInput.addEventListener("focus", (e) => {
    e.target.value = e.target.value.replace(/\s*\(kg\)/g, "");
  });

  weightInput.addEventListener("input", (e) => {
    // 숫자와 소수점만 허용
    let value = e.target.value.replace(/[^0-9.]/g, "");
    e.target.value = value;
    
    // weightUnit 색상 변경
    const weightUnit = document.getElementById("weightUnit");
    if (weightUnit) {
      if (value.trim() !== "") {
        weightUnit.style.color = "#202027";
      } else {
        weightUnit.style.color = "#c5c5c5";
      }
    }
    
    checkFormCompletion();
  });

  weightInput.addEventListener("blur", (e) => {
    // blur 시 입력값이 없으면 원래 색상으로 복원
    const weightUnit = document.getElementById("weightUnit");
    if (weightUnit && e.target.value.trim() === "") {
      weightUnit.style.color = "#c5c5c5";
    }
  });
}

// 견종 입력 이벤트 리스너 설정
function setupBreedInput() {
  if (!breedInput) return;
  
  breedInput.addEventListener("input", () => {
    checkFormCompletion();
  });
}

// 폼 완성도 확인 및 다음 버튼 활성화
function checkFormCompletion() {
  if (!breedInput || !weightInput || !birthYear || !birthMonth || !birthDay || !nextBtn) return;
  
  const breed = breedInput.value.trim();
  const year = birthYear.value;
  const month = birthMonth.value;
  const day = birthDay.value;
  const weightValue = weightInput.value.trim().replace(/\s*\(kg\)/g, "");

  const isComplete =
    breed !== "" &&
    year !== "" &&
    month !== "" &&
    day !== "" &&
    selectedGender !== null &&
    weightValue !== "" &&
    selectedBodyType !== null;

  nextBtn.disabled = !isComplete;
}

// 생일 필드 변경 감지는 위에서 이미 처리됨

function saveFormData(profileImageData) {
  // 현재 등록 중인 반려동물 데이터 가져오기
  let currentPetData = {};
  try {
    currentPetData = JSON.parse(localStorage.getItem("currentPetData") || "{}");
    
    // 추가 정보 업데이트
    Object.assign(currentPetData, {
      breed: breedInput.value.trim(),
      birthday: {
        year: birthYear.value,
        month: birthMonth.value,
        day: birthDay.value,
      },
      gender: selectedGender,
      weight: weightInput.value.trim().replace(/\s*\(kg\)/g, ""),
      bodyType: selectedBodyType,
      profileImage: profileImageData,
    });
    
    // currentPetData 업데이트
    localStorage.setItem("currentPetData", JSON.stringify(currentPetData));
    
    console.log("등록 정보:", currentPetData);

    // pet_registration03 페이지로 이동
    window.location.href = '../pet_registration03/index.html';
  } catch (error) {
    console.error("데이터 저장 실패:", error);
    // 에러가 발생해도 페이지 이동 시도
    window.location.href = '../pet_registration03/index.html';
  }
}

// 페이지 로드 시 초기화
window.addEventListener("DOMContentLoaded", () => {
  // DOM 요소 가져오기
  profileImage = document.getElementById("profileImage");
  profileImageContainer = document.querySelector(".profile-image-container");
  imageInput = document.getElementById("imageInput");
  birthYear = document.getElementById("birthYear");
  birthMonth = document.getElementById("birthMonth");
  birthDay = document.getElementById("birthDay");
  genderButtons = document.querySelectorAll(".gender-btn");
  bodyTypeButtons = document.querySelectorAll(".body-type-btn");
  breedInput = document.getElementById("breedInput");
  weightInput = document.getElementById("weightInput");
  nextBtn = document.getElementById("nextBtn");
  
  // 초기화 함수들 호출
  initializeBirthdayDropdowns();
  setupGenderButtons();
  setupBodyTypeButtons();
  setupProfileImage();
  setupWeightInput();
  setupBreedInput();
  
  // 다음 버튼 클릭 이벤트 설정
  if (nextBtn) {
    nextBtn.addEventListener("click", (e) => {
      e.preventDefault();
      
      if (nextBtn.disabled) {
        return;
      }
      
      // profileImage 컨테이너에 실제 이미지(img 태그)가 있는지 확인
      const hasImageInContainer = profileImage && profileImage.querySelector("img") !== null;
      
      // 이미지가 있으면 로컬 스토리지에 저장
      let profileImageData = null;
      if (hasImageInContainer && imageInput && imageInput.files[0]) {
        const reader = new FileReader();
        reader.onload = (e) => {
          profileImageData = e.target.result;
          saveFormData(profileImageData);
        };
        reader.readAsDataURL(imageInput.files[0]);
      } else if (hasImageInContainer) {
        // 파일 입력은 없지만 컨테이너에 이미지가 있는 경우 (이전에 업로드한 이미지)
        const savedPetData = localStorage.getItem("currentPetData");
        if (savedPetData) {
          try {
            const currentPetData = JSON.parse(savedPetData);
            profileImageData = currentPetData.profileImage || null;
          } catch (error) {
            console.error("데이터 읽기 실패:", error);
          }
        }
        saveFormData(profileImageData);
      } else {
        // 이미지가 없는 경우 명시적으로 null로 설정
        profileImageData = null;
        saveFormData(profileImageData);
      }
    });
  }
  
  // 뒤로 가기로 돌아온 경우인지 확인
  const referrer = document.referrer;
  const referrerLower = referrer.toLowerCase();
  
  // 뒤로가기로 돌아온 경우: pet_registration03, pet_registration_complete, 또는 pet_registration에서 돌아온 경우
  // (단, pet_registration에서 돌아온 경우는 currentPetData에 breed, birthday 등 추가 정보가 있을 때만)
  const isBackFrom03 = referrerLower.includes("pet_registration03");
  const isBackFromComplete = referrerLower.includes("pet_registration_complete");
  const isBackFromPetRegistration = referrerLower.includes("pet_registration") && 
                                    !referrerLower.includes("pet_registration02") && 
                                    !referrerLower.includes("pet_registration03") && 
                                    !referrerLower.includes("pet_registration_complete");
  
  const subtitle = document.getElementById("subtitle");
  const breedLabel = document.querySelector(".form-label");
  
  try {
    const currentPetData = JSON.parse(localStorage.getItem("currentPetData") || "{}");
    
    // 이름 표시 (모든 플로우에서 실행)
    if (currentPetData.name && subtitle) {
      subtitle.textContent = `내새꾸 ${currentPetData.name}에 대해 소개해주세요!`;
    }
    
    // 반려동물 타입이 cat이면 라벨 텍스트 및 placeholder 변경 (모든 플로우에서 실행)
    if (currentPetData.type === "cat") {
      if (breedLabel) {
        breedLabel.textContent = "묘종을 등록해주세요";
      }
      if (breedInput) {
        breedInput.placeholder = "예시) 코리안숏헤어, 러시안블루, 랙돌…";
      }
    }
    
    // 뒤로가기로 돌아온 경우인지 최종 판단
    // pet_registration에서 돌아온 경우: currentPetData에 breed, birthday, gender, weight, bodyType 등 추가 정보가 있으면 뒤로가기로 판단
    let isBackNavigation = isBackFrom03 || isBackFromComplete;
    if (isBackFromPetRegistration) {
      // currentPetData에 추가 정보가 있으면 뒤로가기로 판단
      if (currentPetData.breed || currentPetData.birthday || currentPetData.gender || 
          currentPetData.weight || currentPetData.bodyType || currentPetData.profileImage) {
        isBackNavigation = true;
        console.log("pet_registration에서 돌아왔고, 추가 정보가 있어서 뒤로가기로 판단");
      } else {
        console.log("pet_registration에서 왔지만, 추가 정보가 없어서 정상 플로우로 판단");
      }
    }
    
    // 뒤로 가기로 돌아온 경우에만 입력 필드 복원
    if (isBackNavigation) {
      // 입력 필드 복원
      if (currentPetData.breed && breedInput) {
        breedInput.value = currentPetData.breed;
      }
      
      // 생일 복원
      if (currentPetData.birthday) {
        // 먼저 년도와 월을 설정
        if (currentPetData.birthday.year && birthYear) {
          birthYear.value = currentPetData.birthday.year;
        }
        if (currentPetData.birthday.month && birthMonth) {
          birthMonth.value = currentPetData.birthday.month;
        }
        // 생일 옵션 업데이트 (월/년도 변경 시 일 옵션이 업데이트되도록)
        if (birthMonth && birthYear) {
          updateDayOptions();
        }
        // 일 옵션 업데이트 후 일 값 설정
        setTimeout(() => {
          if (currentPetData.birthday.day && birthDay) {
            birthDay.value = currentPetData.birthday.day;
          }
          // 생일 값 설정 후 폼 완성도 다시 확인
          checkFormCompletion();
        }, 100);
      }
      
      // 성별 복원
      if (currentPetData.gender && genderButtons && genderButtons.length > 0) {
        genderButtons.forEach((btn) => {
          if (btn.dataset.gender === currentPetData.gender) {
            btn.classList.add("active");
            selectedGender = currentPetData.gender;
          } else {
            btn.classList.remove("active");
          }
        });
      }
      
      // 몸무게 복원
      if (currentPetData.weight && weightInput) {
        weightInput.value = currentPetData.weight;
        // weightUnit 색상 변경
        const weightUnit = document.getElementById("weightUnit");
        if (weightUnit && currentPetData.weight.trim() !== "") {
          weightUnit.style.color = "#202027";
        }
      }
      
      // 체형 복원
      if (currentPetData.bodyType && bodyTypeButtons && bodyTypeButtons.length > 0) {
        bodyTypeButtons.forEach((btn) => {
          if (btn.dataset.type === currentPetData.bodyType) {
            btn.classList.add("active");
            selectedBodyType = currentPetData.bodyType;
          } else {
            btn.classList.remove("active");
          }
        });
      }
      
      // 프로필 이미지 복원
      if (currentPetData.profileImage && currentPetData.profileImage.trim() !== "" && profileImage) {
        const img = document.createElement("img");
        img.src = currentPetData.profileImage;
        profileImage.innerHTML = "";
        profileImage.appendChild(img);
      }
      
      console.log("뒤로 가기: 입력 필드 복원 완료", currentPetData);
      console.log("복원된 필드:", {
        breed: breedInput ? breedInput.value : "없음",
        birthday: currentPetData.birthday,
        gender: selectedGender,
        weight: weightInput ? weightInput.value : "없음",
        bodyType: selectedBodyType
      });
      
      // 폼 완성도 확인 (모든 필드 복원 후 최종 확인)
      // 생일이 있는 경우 생일 복원 setTimeout 내부에서도 확인하고, 여기서도 최종 확인
      const finalCheckDelay = currentPetData.birthday ? 200 : 100;
      setTimeout(() => {
        checkFormCompletion();
        console.log("폼 완성도 최종 확인:", {
          breed: breedInput ? breedInput.value : "",
          year: birthYear ? birthYear.value : "",
          month: birthMonth ? birthMonth.value : "",
          day: birthDay ? birthDay.value : "",
          gender: selectedGender,
          weight: weightInput ? weightInput.value : "",
          bodyType: selectedBodyType,
          nextBtnDisabled: nextBtn ? nextBtn.disabled : "nextBtn 없음"
        });
      }, finalCheckDelay);
    } else {
      // 정상적인 플로우인지 확인
      const referrerLower = referrer.toLowerCase();
      const isFromJoinMember = referrerLower.includes("join_member");
      const isFromPetRegistration = referrerLower.includes("pet_registration") && !referrerLower.includes("pet_registration02") && !referrerLower.includes("pet_registration03") && !referrerLower.includes("pet_registration_complete");
      
      if (isFromJoinMember || isFromPetRegistration) {
        // 정상적인 플로우: 이름과 타입만 사용하고 나머지는 새로 입력
        console.log("정상적인 플로우: 새 데이터 입력 시작", currentPetData);
        // 이름과 타입은 이미 사용됨 (위에서 처리됨)
        // 나머지 필드(breed, birthday, gender, weight, bodyType, profileImage)는 새로 입력
      } else {
        // 다른 경로에서 온 경우 (예: 직접 URL 입력)
        // currentPetData가 있으면 복원 시도 (일부 정보만)
        if (currentPetData.name || currentPetData.type) {
          console.log("다른 경로에서 온 경우, 기존 데이터 일부 복원 시도:", currentPetData);
          // 이름과 타입은 이미 위에서 처리됨
        }
      }
    }
  } catch (error) {
    console.error("반려동물 데이터 불러오기 실패:", error);
  }
  
  // 뒤로 가기 버튼 클릭 이벤트 설정
  const backBtn = document.getElementById("backBtn");
  if (backBtn) {
    backBtn.addEventListener("click", () => {
      console.log("뒤로 가기 버튼 클릭");
      
      try {
        // 현재 입력 중인 내용을 currentPetData에 저장
        const currentPetData = JSON.parse(localStorage.getItem("currentPetData") || "{}");
        
        // 현재 입력 필드 값 저장
        if (breedInput) {
          currentPetData.breed = breedInput.value.trim();
        }
        if (birthYear && birthMonth && birthDay) {
          currentPetData.birthday = {
            year: birthYear.value,
            month: birthMonth.value,
            day: birthDay.value,
          };
        }
        currentPetData.gender = selectedGender;
        if (weightInput) {
          currentPetData.weight = weightInput.value.trim().replace(/\s*\(kg\)/g, "");
        }
        currentPetData.bodyType = selectedBodyType;
        
        // 프로필 이미지 저장 (이미지가 있으면)
        if (profileImage && profileImage.querySelector("img") !== null) {
          const existingImage = profileImage.querySelector("img");
          if (existingImage && existingImage.src) {
            currentPetData.profileImage = existingImage.src;
          }
        }
        
        // currentPetData 업데이트
        localStorage.setItem("currentPetData", JSON.stringify(currentPetData));
        
        console.log("뒤로 가기: 현재 입력 내용 저장", currentPetData);
      } catch (error) {
        console.error("뒤로 가기 시 데이터 저장 실패:", error);
      }
      
      // pet_registration 페이지로 이동
      window.location.href = "../pet_registration01/index.html";
    });
  }
});

