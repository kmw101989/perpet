// 전역 변수 선언
let healthButtons, cautionButtons, cautionInputSection, cautionInput, nextBtn, backBtn;
let selectedHealthInterests = [];
let selectedCaution = null;

// 건강 관심사 선택 설정
function setupHealthButtons() {
  if (!healthButtons || healthButtons.length === 0) return;
  
  healthButtons.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      const healthType = btn.dataset.health;

      if (btn.classList.contains("active")) {
        btn.classList.remove("active");
        selectedHealthInterests = selectedHealthInterests.filter(
          (item) => item !== healthType
        );
      } else {
        btn.classList.add("active");
        selectedHealthInterests.push(healthType);
      }

      updateNextButton();
    });
  });
}

// 주의사항 선택 설정
function setupCautionButtons() {
  if (!cautionButtons || cautionButtons.length === 0 || !cautionInputSection || !cautionInput) return;
  
  cautionButtons.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      const cautionType = btn.dataset.caution;

      if (btn.classList.contains("active")) {
        // 이미 선택된 버튼을 다시 클릭하면 원상복구
        btn.classList.remove("active");
        selectedCaution = null;
        // "네 있어요"가 선택 해제되면 입력창 숨기기
        if (cautionType === "yes") {
          cautionInputSection.style.display = "none";
          cautionInput.value = "";
        }
      } else {
        // 다른 버튼의 active 제거하고 클릭한 버튼 활성화
        cautionButtons.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        selectedCaution = cautionType;
        
        // "네 있어요" 선택 시 입력창 표시
        if (cautionType === "yes") {
          cautionInputSection.style.display = "block";
        } else {
          cautionInputSection.style.display = "none";
          cautionInput.value = "";
        }
      }
      updateNextButton();
    });
  });
}

// 다음 버튼 상태 업데이트
function updateNextButton() {
  if (!nextBtn) return;
  // 선택 항목이 있으면 버튼 활성화 (선택 사항이므로 항상 활성화 가능)
  // 또는 특정 조건이 필요하면 여기에 로직 추가
  nextBtn.classList.add("active");
}

// 페이지 로드 시 초기화
window.addEventListener("DOMContentLoaded", () => {
  // DOM 요소 가져오기
  healthButtons = document.querySelectorAll(".health-btn");
  cautionButtons = document.querySelectorAll(".caution-btn");
  cautionInputSection = document.getElementById("cautionInputSection");
  cautionInput = document.getElementById("cautionInput");
  nextBtn = document.getElementById("nextBtn");
  backBtn = document.getElementById("backBtn");
  
  // 이벤트 리스너 설정
  setupHealthButtons();
  setupCautionButtons();
  
  // 다음 버튼 클릭 이벤트 설정
  if (nextBtn) {
    let isSubmitting = false; // 제출 중 플래그 (중복 클릭 방지)
    
    nextBtn.addEventListener("click", async () => {
      // 중복 클릭 방지
      if (isSubmitting) {
        console.log("이미 제출 중입니다. 중복 클릭 무시.");
        return;
      }
      
      if (nextBtn.classList.contains("active")) {
        // 제출 시작
        isSubmitting = true;
        nextBtn.disabled = true;
        nextBtn.style.opacity = "0.6";
        nextBtn.style.cursor = "not-allowed";
        
        // 현재 등록 중인 반려동물 데이터 가져오기
        try {
          const currentPetData = JSON.parse(localStorage.getItem("currentPetData") || "{}");
          const editingPetIndex = localStorage.getItem("editingPetIndex");
          
          console.log("=== pet_registration03 완료 버튼 클릭 ===");
          console.log("editingPetIndex (원본):", editingPetIndex);
          console.log("editingPetIndex 타입:", typeof editingPetIndex);
          console.log("currentPetData:", currentPetData);
          console.log("currentPetData._isEditing:", currentPetData._isEditing);
          console.log("currentPetData._editingIndex:", currentPetData._editingIndex);
          
          // 건강 정보 추가/업데이트
          currentPetData.healthInterests = selectedHealthInterests;
          currentPetData.caution = selectedCaution;
          if (cautionInput) {
            currentPetData.cautionDetail = cautionInput.value.trim();
          }
          
          // 사용자 ID 가져오기
          const userId = localStorage.getItem('userId');
          if (!userId) {
            alert('로그인이 필요합니다.');
            window.location.href = '../login/index.html';
            return;
          }
          currentPetData.user_id = userId;
          
          // petsData 배열 가져오기 (없으면 빈 배열)
          let petsData = JSON.parse(localStorage.getItem("petsData") || "[]");
          console.log("현재 petsData 길이:", petsData.length);
          
          // 수정 모드 확인: editingPetIndex 또는 currentPetData의 _isEditing 플래그 확인
          const isEditMode = (editingPetIndex !== null && 
                             editingPetIndex !== undefined && 
                             editingPetIndex !== "" &&
                             editingPetIndex !== "null") ||
                             (currentPetData._isEditing === true && 
                              currentPetData._editingIndex !== undefined);
          
          // 수정할 인덱스 결정
          let editIndex = null;
          if (isEditMode) {
            if (editingPetIndex !== null && editingPetIndex !== "" && editingPetIndex !== "null") {
              editIndex = parseInt(editingPetIndex);
            } else if (currentPetData._editingIndex !== undefined) {
              editIndex = parseInt(currentPetData._editingIndex);
            }
          }
          
          console.log("isEditMode:", isEditMode);
          console.log("editIndex:", editIndex);
          
          // Supabase에 반려동물 저장
          if (typeof SupabaseService === 'undefined') {
            console.error('SupabaseService가 로드되지 않았습니다.');
            alert('서비스 초기화 중 오류가 발생했습니다. 페이지를 새로고침해주세요.');
            isSubmitting = false;
            nextBtn.disabled = false;
            nextBtn.style.opacity = "1";
            nextBtn.style.cursor = "pointer";
            return;
          }

          let createdPet = null;
          if (!isEditMode || editIndex === null || isNaN(editIndex)) {
            // 신규 등록: Supabase에 저장
            try {
              createdPet = await SupabaseService.createPet(currentPetData);
              if (createdPet) {
                console.log("✅ Supabase에 반려동물 등록 완료:", createdPet);
                // Supabase에서 받은 pet_id를 currentPetData에 추가
                currentPetData.pet_id = createdPet.pet_id;
              } else {
                console.error("❌ 반려동물 등록 실패");
                alert('반려동물 등록 중 오류가 발생했습니다. 다시 시도해주세요.');
                isSubmitting = false;
                nextBtn.disabled = false;
                nextBtn.style.opacity = "1";
                nextBtn.style.cursor = "pointer";
                return;
              }
            } catch (error) {
              console.error("반려동물 등록 중 오류:", error);
              const msg = error?.message || error?.hint || '다시 시도해주세요.';
              alert('반려동물 등록 중 오류가 발생했습니다: ' + msg);
              isSubmitting = false;
              nextBtn.disabled = false;
              nextBtn.style.opacity = "1";
              nextBtn.style.cursor = "pointer";
              return;
            }
          } else {
            // 수정 모드: 기존 pet_id 사용 (petsData에서 가져오기)
            if (editIndex >= 0 && editIndex < petsData.length && petsData[editIndex].pet_id) {
              currentPetData.pet_id = petsData[editIndex].pet_id;
              // TODO: Supabase 업데이트 로직 추가 (필요시)
              console.log("수정 모드: 기존 pet_id 사용:", currentPetData.pet_id);
            }
          }
          
          if (isEditMode && editIndex !== null && !isNaN(editIndex)) {
            // 수정 모드: 해당 인덱스의 데이터 업데이트
            console.log("파싱된 인덱스:", editIndex);
            console.log("인덱스 유효성:", !isNaN(editIndex), "범위:", editIndex >= 0, editIndex < petsData.length);
            
            if (editIndex >= 0 && editIndex < petsData.length) {
              // 수정 플래그 제거 후 업데이트
              delete currentPetData._isEditing;
              delete currentPetData._editingIndex;
              
              // 기존 데이터 업데이트
              petsData[editIndex] = JSON.parse(JSON.stringify(currentPetData)); // 깊은 복사
              console.log(`✅ 수정 모드: 인덱스 ${editIndex} 업데이트 완료`);
              console.log("업데이트된 데이터:", petsData[editIndex]);
            } else {
              console.error("❌ 유효하지 않은 인덱스:", editIndex, "petsData.length:", petsData.length);
              // 유효하지 않은 인덱스인 경우에도 신규 추가하지 않고 에러만 로그
              alert("수정할 반려동물 정보를 찾을 수 없습니다.");
              isSubmitting = false;
              nextBtn.disabled = false;
              nextBtn.style.opacity = "1";
              nextBtn.style.cursor = "pointer";
              return;
            }
            // 수정 모드 플래그 제거
            localStorage.removeItem("editingPetIndex");
          } else {
            // 신규 등록 모드: 배열에 추가 (수정 플래그가 없어야 함)
            if (currentPetData._isEditing) {
              console.warn("⚠️ 수정 플래그가 있지만 인덱스가 유효하지 않음. 신규 등록으로 처리하지 않음.");
              alert("수정 모드로 진입했지만 유효하지 않은 상태입니다. 다시 시도해주세요.");
              isSubmitting = false;
              nextBtn.disabled = false;
              nextBtn.style.opacity = "1";
              nextBtn.style.cursor = "pointer";
              return; // 함수 종료하여 새 카드 생성 방지
            }
            // 수정 플래그 제거
            delete currentPetData._isEditing;
            delete currentPetData._editingIndex;
            petsData.push(JSON.parse(JSON.stringify(currentPetData))); // 깊은 복사
            console.log("✅ 신규 등록 모드: 새 카드 추가");
          }
          
          // petsData 배열 저장
          localStorage.setItem("petsData", JSON.stringify(petsData));
          console.log("저장된 petsData 길이:", petsData.length);
          
          // 정상적인 플로우(login부터 시작)인지 확인
          // login 페이지에서는 clearAllData()로 모든 데이터를 초기화하므로
          // editingPetIndex가 있으면 뒤로가기로 돌아온 경우
          const hasEditingIndex = editingPetIndex !== null && 
                                 editingPetIndex !== undefined && 
                                 editingPetIndex !== "" &&
                                 editingPetIndex !== "null";
          
          if (hasEditingIndex && isEditMode && editIndex !== null && !isNaN(editIndex)) {
            // 뒤로가기로 돌아온 수정 모드: currentPetData와 editingPetIndex 유지 (뒤로가기 복원용)
            delete currentPetData._isEditing;
            delete currentPetData._editingIndex;
            localStorage.setItem("currentPetData", JSON.stringify(currentPetData));
            // editingPetIndex는 명시적으로 유지 (뒤로가기 복원용)
            localStorage.setItem("editingPetIndex", String(editIndex));
            console.log("뒤로가기 복원 모드: currentPetData 및 editingPetIndex 유지 (인덱스:", editIndex, ")");
          } else {
            // 신규 등록 또는 정상적인 플로우: currentPetData 초기화
            localStorage.removeItem("currentPetData");
            localStorage.removeItem("editingPetIndex");
            console.log("신규 등록 또는 정상 플로우: currentPetData 및 editingPetIndex 초기화");
          }
          
          console.log("등록 정보:", currentPetData);
          console.log("전체 반려동물 목록:", petsData);
          console.log("================================");

          // pet_registration_complete 페이지로 이동
          window.location.href = '../pet_registration_complete/index.html';
        } catch (error) {
          console.error("데이터 저장 실패:", error);
        }
      }
    });
  }
  
  // 뒤로 가기 버튼 클릭 이벤트 설정
  if (backBtn) {
    console.log("뒤로 가기 버튼 찾음, 이벤트 리스너 등록");
    backBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log("뒤로 가기 버튼 클릭됨");
      
      try {
        // 현재 입력 중인 내용을 currentPetData에 저장
        const currentPetData = JSON.parse(localStorage.getItem("currentPetData") || "{}");
        
        // 현재 선택된 건강 정보 저장
        currentPetData.healthInterests = selectedHealthInterests;
        currentPetData.caution = selectedCaution;
        if (cautionInput) {
          currentPetData.cautionDetail = cautionInput.value.trim();
        }
        
        // 수정 모드인 경우 플래그 유지 (editingPetIndex는 이미 localStorage에 있음)
        const editingPetIndex = localStorage.getItem("editingPetIndex");
        if (editingPetIndex !== null && editingPetIndex !== "" && editingPetIndex !== "null") {
          currentPetData._isEditing = true;
          currentPetData._editingIndex = parseInt(editingPetIndex);
          // editingPetIndex도 명시적으로 유지 (뒤로가기 복원을 위해)
          localStorage.setItem("editingPetIndex", editingPetIndex);
        }
        
        // currentPetData 업데이트 (뒤로가기로 돌아올 때 복원용)
        localStorage.setItem("currentPetData", JSON.stringify(currentPetData));
        
        console.log("뒤로 가기: 현재 입력 내용 저장", currentPetData);
        console.log("editingPetIndex 유지:", editingPetIndex);
      } catch (error) {
        console.error("뒤로 가기 시 데이터 저장 실패:", error);
      }
      
      // pet_registration02 페이지로 이동
      window.location.href = "../pet_registration02/index.html";
    });
  } else {
    console.error("뒤로 가기 버튼을 찾을 수 없습니다!");
  }
  
  // 이름 표시 및 데이터 복원
  const descriptionText = document.getElementById("descriptionText");
  const referrer = document.referrer;
  const isBackNavigation = referrer.includes("pet_registration_complete") ||
                          referrer.includes("pet_registration02");
  
  try {
    const currentPetData = JSON.parse(localStorage.getItem("currentPetData") || "{}");
    const editingPetIndex = localStorage.getItem("editingPetIndex");
    
    console.log("=== pet_registration03 페이지 로드 ===");
    console.log("currentPetData:", currentPetData);
    console.log("editingPetIndex:", editingPetIndex);
    console.log("isBackNavigation:", isBackNavigation);
    console.log("referrer:", referrer);
    
    // 이름 표시 (모든 플로우에서 실행)
    if (descriptionText) {
      if (currentPetData.name) {
        descriptionText.textContent = `${currentPetData.name}의 건강 정보를 등록하면`;
        console.log("이름 표시:", currentPetData.name);
      } else {
        console.warn("currentPetData.name이 없습니다. currentPetData:", currentPetData);
        // 이름이 없어도 기본 텍스트는 유지
      }
    }
    
    // 수정 모드인 경우 또는 뒤로 가기로 돌아온 경우 기존 선택된 항목 복원
    const isEditMode = editingPetIndex !== null && 
                       editingPetIndex !== undefined && 
                       editingPetIndex !== "" &&
                       editingPetIndex !== "null";
    
    // 뒤로가기로 돌아온 경우 또는 수정 모드인 경우 데이터 복원
    if (isBackNavigation || isEditMode) {
      console.log("뒤로 가기 또는 수정 모드: 기존 데이터 복원 중...");
      
      // 건강 관심사 복원
      if (currentPetData.healthInterests && Array.isArray(currentPetData.healthInterests)) {
        currentPetData.healthInterests.forEach((healthType) => {
          const healthBtn = document.querySelector(`.health-btn[data-health="${healthType}"]`);
          if (healthBtn) {
            healthBtn.classList.add("active");
            selectedHealthInterests.push(healthType);
          }
        });
        console.log("건강 관심사 복원:", currentPetData.healthInterests);
      } else {
        console.log("건강 관심사 데이터 없음");
      }
      
      // 주의사항 복원
      if (currentPetData.caution && cautionButtons && cautionButtons.length > 0) {
        const cautionBtn = document.querySelector(`.caution-btn[data-caution="${currentPetData.caution}"]`);
        if (cautionBtn) {
          cautionBtn.classList.add("active");
          selectedCaution = currentPetData.caution;
          
          // "네 있어요" 선택 시 입력창 표시 및 값 설정
          if (currentPetData.caution === "yes" && cautionInputSection) {
            cautionInputSection.style.display = "block";
            if (currentPetData.cautionDetail && cautionInput) {
              cautionInput.value = currentPetData.cautionDetail;
            }
          } else if (cautionInputSection) {
            cautionInputSection.style.display = "none";
          }
          console.log("주의사항 복원:", currentPetData.caution, currentPetData.cautionDetail);
        }
      } else {
        // 주의사항 데이터가 없는 경우 기본 상태 설정
        if (cautionInputSection) {
          cautionInputSection.style.display = "none";
        }
        console.log("주의사항 데이터 없음");
      }
      
      console.log("뒤로 가기 또는 수정 모드: 기존 데이터 복원 완료");
    } else {
      console.log("신규 등록 모드: 새로 입력");
      // 신규 등록 모드: 기본 상태 설정
      if (cautionInputSection) {
        cautionInputSection.style.display = "none";
      }
    }
    console.log("====================================");
  } catch (error) {
    console.error("데이터 불러오기 실패:", error);
  }
  
  // 초기 상태 설정
  updateNextButton();
});


