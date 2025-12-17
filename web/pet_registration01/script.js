// 전역 변수 선언
let petCards, nameInput, nextButton;
let selectedPet = null;
let petName = "";

// Check if form is complete and enable/disable next button
function checkFormComplete() {
  if (!nextButton) return;
  if (selectedPet && petName.length > 0) {
    nextButton.disabled = false;
  } else {
    nextButton.disabled = true;
  }
}

// 페이지 로드 시 초기화
window.addEventListener("DOMContentLoaded", async () => {
  // DOM 요소 가져오기
  petCards = document.querySelectorAll(".pet-card");
  nameInput = document.getElementById("pet-name");
  nextButton = document.getElementById("next-button");
  
  const welcomeTitle = document.getElementById("welcomeTitle");
  const welcomeSubtitle = document.querySelector(".welcome-subtitle");
  const recommendationText = document.querySelector(".recommendation-text");
  
  // SupabaseService 로드 대기
  let attempts = 0;
  const maxAttempts = 50;
  while (typeof SupabaseService === 'undefined' && attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 100));
    attempts++;
  }
  
  // 상황에 따른 메시지 설정
  try {
    const currentPetData = JSON.parse(localStorage.getItem("currentPetData") || "{}");
    const isEditMode = currentPetData._isEditing === true || currentPetData._editingPetId;
    const isNewRegistrationFromMypage = localStorage.getItem("isNewRegistrationFromMypage") === "true";
    const referrer = document.referrer.toLowerCase();
    const isFromJoinMember = referrer.includes("join_member");
    
    if (isEditMode) {
      // 수정 모드
      if (welcomeTitle) {
        welcomeTitle.textContent = "반려동물 정보 수정";
      }
      if (welcomeSubtitle) {
        welcomeSubtitle.textContent = "정보를 업데이트해주세요";
      }
      if (recommendationText) {
        recommendationText.innerHTML = "정확한 정보로 업데이트하면<br />더 나은 맞춤 추천을 받을 수 있어요!";
      }
    } else if (isNewRegistrationFromMypage || (!isFromJoinMember && !isEditMode)) {
      // 기존 유저의 추가 등록 (마이페이지에서)
      // 사용자 정보 가져오기 (userData 또는 Supabase에서)
      let nickname = "회원";
      try {
        const userData = JSON.parse(localStorage.getItem("userData") || "{}");
        if (userData.nickname) {
          nickname = userData.nickname;
        } else {
          // Supabase에서 사용자 정보 가져오기 시도
          const userId = localStorage.getItem("userId");
          if (userId && typeof SupabaseService !== 'undefined' && SupabaseService.getUser) {
            try {
              const user = await SupabaseService.getUser(userId);
              if (user && user.nickname) {
                nickname = user.nickname;
              } else if (user && user.user_name) {
                nickname = user.user_name;
              }
            } catch (e) {
              console.warn("사용자 정보 가져오기 실패:", e);
            }
          }
        }
      } catch (e) {
        console.warn("사용자 정보 파싱 실패:", e);
      }
      
      if (welcomeTitle) {
        welcomeTitle.textContent = `${nickname}님, 새로운 반려동물을 등록해주세요`;
      }
      if (welcomeSubtitle) {
        welcomeSubtitle.textContent = "추가 반려동물 정보를 입력해주세요";
      }
      if (recommendationText) {
        recommendationText.innerHTML = "정확한 정보를 입력하시면<br />새로운 반려동물에게도 맞춤 추천을 받을 수 있어요!";
      }
    } else {
      // 회원가입 후 등록 (기존 텍스트 유지)
      const userData = JSON.parse(localStorage.getItem("userData") || "{}");
      if (userData.nickname && welcomeTitle) {
        welcomeTitle.textContent = `반가워요 ${userData.nickname}님`;
      }
      if (welcomeSubtitle) {
        welcomeSubtitle.textContent = "회원가입이 완료되었어요!";
      }
      if (recommendationText) {
        recommendationText.innerHTML = "정확한 입력을 해주시면,<br />오직 반려동물에게 딱 맞는 추천을 받을 수 있어요!";
      }
    }
  } catch (error) {
    console.error("메시지 설정 실패:", error);
    // 기본값 유지
    try {
      const userData = JSON.parse(localStorage.getItem("userData") || "{}");
      if (userData.nickname && welcomeTitle) {
        welcomeTitle.textContent = `반가워요 ${userData.nickname}님`;
      }
    } catch (e) {
      console.error("닉네임 불러오기 실패:", e);
    }
  }
  
  // Pet card selection
  if (petCards && petCards.length > 0) {
    petCards.forEach((card) => {
      card.addEventListener("click", () => {
        // Check if the clicked card is already selected
        const isCurrentlySelected = card.classList.contains("selected");

        // Remove selected class from all cards
        petCards.forEach((c) => c.classList.remove("selected"));

        // Toggle selection: if it was selected, deselect it; otherwise, select it
        if (!isCurrentlySelected) {
          card.classList.add("selected");
          selectedPet = card.dataset.pet;
        } else {
          selectedPet = null;
        }

        // Check if form is complete
        checkFormComplete();
      });
    });
  }

  // Name input handler
  if (nameInput) {
    nameInput.addEventListener("input", (e) => {
      petName = e.target.value.trim();
      checkFormComplete();
    });
    
    // Prevent form submission on Enter key
    nameInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        if (nextButton && !nextButton.disabled) {
          nextButton.click();
        }
      }
    });
  }

  // Next button click handler
  if (nextButton) {
    nextButton.addEventListener("click", () => {
      if (nextButton.disabled) return;

      // Store registration data
      const registrationData = {
        petType: selectedPet,
        petName: petName,
        timestamp: new Date().toISOString(),
      };

      // 현재 등록 중인 반려동물 데이터 저장
      // editingPetIndex가 있으면 수정 모드이므로 기존 데이터 유지, 없으면 신규 등록이므로 새로 생성
      try {
        const editingPetIndex = localStorage.getItem("editingPetIndex");
        const isEditMode = editingPetIndex !== null && 
                          editingPetIndex !== undefined && 
                          editingPetIndex !== "" &&
                          editingPetIndex !== "null";
        
        let currentPetData;
        if (isEditMode) {
          // 수정 모드: 기존 데이터 유지하고 이름과 타입만 업데이트
          const existingCurrentPetData = JSON.parse(localStorage.getItem("currentPetData") || "{}");
          currentPetData = {
            ...existingCurrentPetData, // 기존 데이터 유지 (breed, birthday, gender, weight, bodyType, profileImage 등)
            name: petName,
            type: selectedPet,
            timestamp: new Date().toISOString()
          };
          console.log("pet_registration next 버튼: 수정 모드 - 기존 정보 유지, 이름/타입만 업데이트", currentPetData);
        } else {
          // 신규 등록: 완전히 새로운 currentPetData 생성
          currentPetData = {
            name: petName,
            type: selectedPet,
            timestamp: new Date().toISOString()
          };
          console.log("pet_registration next 버튼: 신규 등록 - 새 데이터 생성", currentPetData);
        }
        localStorage.setItem("currentPetData", JSON.stringify(currentPetData));
        
        // joinMemberData 보존 확인
        const existingJoinMemberData = localStorage.getItem("joinMemberData");
        if (existingJoinMemberData) {
          console.log("✅ joinMemberData 보존됨 (pet_registration -> pet_registration02 이동)");
        }
      } catch (error) {
        console.error("데이터 저장 실패:", error);
      }

      // Log data (in real app, this would be sent to server)
      console.log("반려동물 등록 정보:", registrationData);

      // Navigate to pet_registration02 page
      window.location.href = '../pet_registration02/index.html';
    });
  }
  
  // 뒤로 가기로 돌아온 경우에만 입력 필드 복원
  // 정상적인 플로우(join_member에서 넘어온 경우)는 복원하지 않음
  // document.referrer를 확인하여 뒤로 가기로 돌아온 경우인지 판단
  const referrer = document.referrer;
  const isBackNavigation = referrer.includes("pet_registration02") || 
                          referrer.includes("pet_registration03") ||
                          referrer.includes("pet_registration_complete");
  
  // 수정 모드인지 확인
  const currentPetData = JSON.parse(localStorage.getItem("currentPetData") || "{}");
  const isEditMode = currentPetData._isEditing === true || currentPetData._editingPetId;
  
  if (isBackNavigation || isEditMode) {
    try {
      // 반려동물 타입 복원
      if (currentPetData.type && petCards && petCards.length > 0) {
        petCards.forEach((card) => {
          if (card.dataset.pet === currentPetData.type) {
            card.classList.add("selected");
            selectedPet = currentPetData.type;
          } else {
            card.classList.remove("selected");
          }
        });
      }
      
      // 이름 복원
      if (currentPetData.name && nameInput) {
        nameInput.value = currentPetData.name;
        petName = currentPetData.name.trim();
      }
      
      // 폼 완성도 확인
      checkFormComplete();
      
      console.log("뒤로 가기: 입력 필드 복원 완료", currentPetData);
    } catch (error) {
      console.error("입력 필드 복원 실패:", error);
    }
  } else {
    // 정상적인 플로우인지 확인 (join_member에서 온 경우)
    // login 페이지에서 시작한 경우 currentPetData가 없을 수 있음
    const referrerLower = referrer.toLowerCase();
    const isFromJoinMember = referrerLower.includes("join_member");
    
    if (isFromJoinMember) {
      // join_member에서 온 경우: 정상적인 플로우, currentPetData 초기화
      console.log("정상적인 플로우 (join_member에서): 새 데이터 입력 시작");
      // currentPetData는 이미 join_member에서 초기화되었을 수 있음
      // 하지만 확실하게 하기 위해 여기서도 확인
      const existingCurrentPetData = localStorage.getItem("currentPetData");
      if (existingCurrentPetData) {
        try {
          const parsed = JSON.parse(existingCurrentPetData);
          // 이름과 타입만 사용하고 나머지는 초기화
          if (parsed.name || parsed.type) {
            // 이름과 타입이 있으면 사용 (회원가입 후 즉시 반려동물 등록하는 경우)
            if (parsed.type && petCards && petCards.length > 0) {
              petCards.forEach((card) => {
                if (card.dataset.pet === parsed.type) {
                  card.classList.add("selected");
                  selectedPet = parsed.type;
                }
              });
            }
            if (parsed.name && nameInput) {
              nameInput.value = parsed.name;
              petName = parsed.name.trim();
            }
            checkFormComplete();
          } else {
            selectedPet = null;
            petName = "";
            checkFormComplete();
          }
        } catch (e) {
          selectedPet = null;
          petName = "";
          checkFormComplete();
        }
      } else {
        selectedPet = null;
        petName = "";
        checkFormComplete();
      }
    } else {
      // 다른 경로에서 온 경우 (예: 직접 URL 입력, 또는 뒤로가기)
      // 마이페이지에서 신규 등록으로 시작한 경우는 데이터 복원하지 않음
      const isNewRegistrationFromMypage = localStorage.getItem("isNewRegistrationFromMypage") === "true";
      
      if (isNewRegistrationFromMypage) {
        // 마이페이지에서 시작한 신규 등록: 데이터 초기화
        console.log("마이페이지에서 시작한 신규 등록: 데이터 초기화");
        localStorage.removeItem("isNewRegistrationFromMypage");
        selectedPet = null;
        petName = "";
        checkFormComplete();
      } else {
        // 다른 경로에서 온 경우: currentPetData가 있으면 복원 시도
        const currentPetData = JSON.parse(localStorage.getItem("currentPetData") || "{}");
        if (currentPetData.type || currentPetData.name) {
          console.log("다른 경로에서 온 경우, 기존 데이터 복원 시도:", currentPetData);
          // 반려동물 타입 복원
          if (currentPetData.type && petCards && petCards.length > 0) {
            petCards.forEach((card) => {
              if (card.dataset.pet === currentPetData.type) {
                card.classList.add("selected");
                selectedPet = currentPetData.type;
              } else {
                card.classList.remove("selected");
              }
            });
          }
          // 이름 복원
          if (currentPetData.name && nameInput) {
            nameInput.value = currentPetData.name;
            petName = currentPetData.name.trim();
          }
          checkFormComplete();
        } else {
          selectedPet = null;
          petName = "";
          checkFormComplete();
        }
      }
    }
  }
  
  // 뒤로 가기 버튼 클릭 이벤트 설정
  const backBtn = document.getElementById("backBtn");
  if (backBtn) {
    backBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log("뒤로 가기 버튼 클릭");
      
      try {
        // 현재 입력 중인 내용을 currentPetData에 저장
        const currentPetData = JSON.parse(localStorage.getItem("currentPetData") || "{}");
        
        // 반려동물 타입과 이름 저장
        currentPetData.type = selectedPet;
        currentPetData.name = petName;
        
        // currentPetData 업데이트
        localStorage.setItem("currentPetData", JSON.stringify(currentPetData));
        
        // joinMemberData가 존재하는지 확인하고 유지 (이미 존재하면 그대로 유지)
        const existingJoinMemberData = localStorage.getItem("joinMemberData");
        if (existingJoinMemberData) {
          console.log("joinMemberData 보존:", JSON.parse(existingJoinMemberData));
        } else {
          console.log("joinMemberData 없음 - 새로 입력해야 함");
        }
        
        console.log("뒤로 가기: 현재 입력 내용 저장", currentPetData);
      } catch (error) {
        console.error("뒤로 가기 시 데이터 저장 실패:", error);
      }
      
      // 어디서 왔는지 확인하여 적절한 페이지로 이동
      const referrer = document.referrer;
      const referrerLower = referrer.toLowerCase();
      
      // 마이페이지나 반려동물 등록 완료 페이지에서 온 경우 홈 화면으로 이동
      const isFromMypage = referrerLower.includes("mypage") || 
                          referrerLower.includes("pet_registration_complete") ||
                          referrerLower.includes("website");
      
      if (isFromMypage) {
        // 홈 화면으로 이동
        window.location.href = "../website/index.html";
      } else {
        // 회원가입에서 온 경우 join_member로 이동
        window.location.href = "../join_member/index.html";
      }
    });
  } else {
    console.error("뒤로 가기 버튼을 찾을 수 없습니다!");
  }
});

