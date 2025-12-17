// 탭바 아이템 클릭 이벤트 (별도 처리)
const LOG_ENABLED = false;
const __originalConsoleLog = console.log;
console.log = (...args) => {
  if (LOG_ENABLED) {
    __originalConsoleLog(...args);
  }
};
const log = (...args) => {
  if (LOG_ENABLED) {
    __originalConsoleLog(...args);
  }
};

document.addEventListener("DOMContentLoaded", function () {
  // 탭바 아이템 클릭 이벤트는 common/tabbar.js에서 처리

  // 진행도에 따른 색상 반환 함수 (50% 기준)
  function getProgressColor(percent) {
    if (percent < 50) {
      return "#ffd700"; // 노란색
    } else {
      return "#408ef5"; // 파란색
    }
  }

  // 진행도에 따른 클래스 반환 함수
  function getProgressClass(percent) {
    if (percent < 50) {
      return "progress-low";
    } else {
      return "progress-high";
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
    const innerOffset =
      innerCircumference - (innerCircumference * mealPercent) / 100;
    const outerOffset =
      outerCircumference - (outerCircumference * walkPercent) / 100;

    // SVG 요소 업데이트
    const innerCircle = document.querySelector(".circle-inner");
    const outerCircle = document.querySelector(".circle-outer");

    if (innerCircle) {
      innerCircle.setAttribute("stroke-dasharray", innerCircumference);
      innerCircle.setAttribute("stroke-dashoffset", innerOffset);
      innerCircle.setAttribute("stroke", getProgressColor(mealPercent));
      // 클래스 업데이트
      innerCircle.classList.remove(
        "progress-low",
        "progress-medium",
        "progress-high"
      );
      innerCircle.classList.add(getProgressClass(mealPercent));
    }

    if (outerCircle) {
      outerCircle.setAttribute("stroke-dasharray", outerCircumference);
      outerCircle.setAttribute("stroke-dashoffset", outerOffset);
      outerCircle.setAttribute("stroke", getProgressColor(walkPercent));
      // 클래스 업데이트
      outerCircle.classList.remove(
        "progress-low",
        "progress-medium",
        "progress-high"
      );
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
      if (
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < birthDate.getDate())
      ) {
        age--;
      }

      return age >= 0 ? age : null;
    } catch (e) {
      console.error("나이 계산 실패:", e);
      return null;
    }
  }

  // 선택된 반려동물 로드 및 표시 (마이페이지에서 선택한 반려동물 우선 사용)
  async function loadSelectedPet() {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      console.log("userId가 없습니다.");
      return;
    }

    // Supabase 스크립트 로드 확인
    if (typeof SupabaseService === "undefined") {
      console.error("SupabaseService가 로드되지 않았습니다.");
      // Supabase 스크립트 로드 대기
      let attempts = 0;
      const maxAttempts = 50; // 5초 대기
      while (typeof SupabaseService === "undefined" && attempts < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        attempts++;
      }

      if (typeof SupabaseService === "undefined") {
        console.error("SupabaseService 로드 실패");
        return;
      }
    }

    // DB에서 반려동물 정보 조회
    let selectedPet = null;
    try {
      console.log("DB에서 반려동물 조회 시작, userId:", userId);
      const pets = await SupabaseService.getPetsByUserId(userId);
      console.log("조회된 반려동물 목록:", pets);

      if (pets && pets.length > 0) {
        // pet_id 순서로 정렬
        const sorted = [...pets].sort((a, b) => {
          const aId = parseInt(a.pet_id, 10);
          const bId = parseInt(b.pet_id, 10);
          return (isNaN(aId) ? 0 : aId) - (isNaN(bId) ? 0 : bId);
        });

        // 로컬스토리지에서 선택된 반려동물 확인 (마이페이지에서 선택한 경우)
        let selectedPetId = localStorage.getItem("selectedPetId");

        if (selectedPetId) {
          // 선택된 pet_id가 있는 경우 해당 반려동물 찾기 (타입 변환하여 비교)
          selectedPet = sorted.find(
            (p) => String(p.pet_id) === String(selectedPetId)
          );
          console.log(
            "마이페이지에서 선택된 반려동물:",
            selectedPet,
            "selectedPetId:",
            selectedPetId
          );
        }

        // 선택된 반려동물이 없거나 찾을 수 없으면 가장 작은 pet_id 선택 (기본값)
        if (!selectedPet) {
          selectedPet = sorted[0];
          selectedPetId = selectedPet.pet_id;
          console.log("기본 반려동물 선택 (가장 작은 pet_id):", selectedPet);
        }

        // 선택된 반려동물 정보를 로컬스토리지에 저장
        localStorage.setItem("selectedPetId", selectedPet.pet_id);
        localStorage.setItem("selectedPetData", JSON.stringify(selectedPet));
      } else {
        console.log("반려동물이 등록되지 않았습니다.");
        // 반려동물이 없으면 기존 선택 정보 제거
        localStorage.removeItem("selectedPetId");
        localStorage.removeItem("selectedPetData");
      }
    } catch (err) {
      console.error("DB 반려동물 조회 실패:", err);
      return;
    }

    if (!selectedPet) {
      console.log("표시할 반려동물 정보가 없습니다.");
      return;
    }

    // DOM 업데이트
    const petNameEl = document.querySelector(".pet-name");
    const petDetailsEl = document.querySelector(".pet-details");
    const petProfileImageEl = document.querySelector(".pet-profile-image");
    const petGenderEl = document.querySelector(".pet-gender");

    // 랜덤 이미지 생성 함수
    function getRandomImageUrl(type = "pet") {
      // 랜덤 숫자 생성 (1-1000)
      const randomNum = Math.floor(Math.random() * 1000) + 1;
      if (type === "pet") {
        // 반려동물 이미지 (예: placeholder 서비스 사용)
        return `https://picsum.photos/seed/pet${randomNum}/200/200`;
      } else {
        // 사용자 이미지
        return `https://picsum.photos/seed/user${randomNum}/200/200`;
      }
    }

    // 반려동물 프로필 이미지 표시
    if (petProfileImageEl) {
      if (selectedPet.pet_img && selectedPet.pet_img.trim() !== "") {
        // 이미지가 있으면 표시
        petProfileImageEl.style.backgroundImage = `url('${selectedPet.pet_img}')`;
        petProfileImageEl.style.backgroundSize = "cover";
        petProfileImageEl.style.backgroundPosition = "center";
        console.log("반려동물 프로필 이미지 표시:", selectedPet.pet_img);
      } else {
        // 이미지가 없으면 랜덤 이미지 삽입
        const randomImageUrl = getRandomImageUrl("pet");
        petProfileImageEl.style.backgroundImage = `url('${randomImageUrl}')`;
        petProfileImageEl.style.backgroundSize = "cover";
        petProfileImageEl.style.backgroundPosition = "center";
        console.log("반려동물 프로필 랜덤 이미지 삽입:", randomImageUrl);
      }
    }

    // 성별 기호 표시
    if (petGenderEl) {
      const gender = selectedPet.gender || selectedPet.pet_gender || "";
      if (gender === "male" || gender === "남성" || gender === "♂") {
        petGenderEl.textContent = "♂";
      } else if (gender === "female" || gender === "여성" || gender === "♀") {
        petGenderEl.textContent = "♀";
      } else {
        petGenderEl.textContent = "";
      }
    }

    if (petNameEl) {
      // 이름이 있으면 실제 이름만 표시, 없으면 빈 값 (기본값 "내새꾸" 제거)
      const petName = selectedPet.pet_name || selectedPet.petName || "";
      petNameEl.textContent = petName;
      console.log("반려동물 이름 표시:", {
        pet_name: selectedPet.pet_name,
        petName: selectedPet.petName,
        최종표시: petName || "(이름 없음)",
        전체데이터: selectedPet,
      });
    } else {
      console.error("pet-name 요소를 찾을 수 없습니다.");
    }

    if (petDetailsEl) {
      // 품종 정보 (detailed_species)
      let speciesText = "";
      if (selectedPet.detailed_species) {
        speciesText = selectedPet.detailed_species.trim();
      }

      // 체중 정보 (weight) - double precision 타입
      let weightText = "";
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
      petDetailsEl.textContent = details.length > 0 ? details.join(" · ") : "";
      console.log("반려동물 상세 정보 표시:", {
        이름: selectedPet.pet_name,
        품종: speciesText,
        체중: weightText,
        detailed_species: selectedPet.detailed_species,
        weight: selectedPet.weight,
        전체데이터: selectedPet,
      });
    } else {
      console.error("pet-details 요소를 찾을 수 없습니다.");
    }
  }

  // 초기 게이지 업데이트
  updateCircularChart();

  // 반려동물 정보 로드 후 추천 제품 로드
  loadSelectedPet().then(() => {
    // 반려동물 정보 로드 완료 후 추천 제품 로드
    waitForSupabaseAndLoadProducts();
  });

  // 예약 일정 로드
  loadReservationSchedule();

  // 생일 일정 로드
  loadBirthdaySchedule();

  // 페이지 포커스 시 반려동물 정보 새로고침 (마이페이지에서 돌아왔을 때)
  window.addEventListener("focus", async function () {
    log("페이지 포커스 - 반려동물 정보 새로고침");
    await loadSelectedPet();

    // 현재 활성 탭에 맞는 추천 다시 로드
    const activeTab = document.querySelector(
      ".recommendation-tabs .tab-btn.active"
    );
    const tabType = activeTab ? activeTab.textContent.trim() : "사료";

    if (tabType === "병원") {
      // 병원 탭인 경우
      await loadRecommendedHospitals();
    } else {
      // 제품 탭인 경우 (사료, 영양제, 간식)
      await waitForSupabaseAndLoadProducts(tabType);
    }

    // 예약 일정도 새로고침
    await loadReservationSchedule();
  });

  // 페이지 가시성 변경 시에도 새로고침
  document.addEventListener("visibilitychange", async function () {
    if (!document.hidden) {
      log("페이지 가시성 변경 - 반려동물 정보 새로고침");
      await loadSelectedPet();

      // 현재 활성 탭에 맞는 추천 다시 로드
      const activeTab = document.querySelector(
        ".recommendation-tabs .tab-btn.active"
      );
      const tabType = activeTab ? activeTab.textContent.trim() : "사료";

      if (tabType === "병원") {
        // 병원 탭인 경우
        await loadRecommendedHospitals();
      } else {
        // 제품 탭인 경우 (사료, 영양제, 간식)
        await waitForSupabaseAndLoadProducts(tabType);
      }

      // 예약 일정도 새로고침
      await loadReservationSchedule();
      // 생일 일정도 새로고침
      await loadBirthdaySchedule();
    }
  });

  // 마이페이지 버튼 클릭 이벤트
  const mypageBtn = document.querySelector(".mypage-btn");
  if (mypageBtn) {
    mypageBtn.addEventListener("click", function () {
      window.location.href = "../mypage/mypage.html";
    });
  }

  // 내새꾸 추가 버튼 클릭 이벤트 -> 반려동물 등록 페이지로 이동
  const addPetBtn = document.querySelector(".add-pet-btn");
  if (addPetBtn) {
    addPetBtn.addEventListener("click", function () {
      window.location.href = "../pet_registration01/index.html";
    });
  }

  // 배너 광고 모달 표시
  showBannerModal();

  // 추천 탭 클릭 이벤트 (제품 로드 포함)
  const recommendationTabButtons = document.querySelectorAll(".tab-btn");
  recommendationTabButtons.forEach((button) => {
    button.addEventListener("click", async function () {
      // 모든 탭에서 active 클래스 제거
      recommendationTabButtons.forEach((btn) => btn.classList.remove("active"));
      // 클릭한 탭에 active 클래스 추가
      this.classList.add("active");

      // 탭 타입에 따라 추천 로드
      const tabType = this.textContent.trim();

      if (tabType === "병원") {
        // 병원 탭 클릭 시
        await loadRecommendedHospitals();
      } else {
        // 제품 탭 클릭 시 (사료, 영양제, 간식)
        await waitForSupabaseAndLoadProducts(tabType);
      }
    });
  });

  // 관리 카드 슬라이드 기능
  initManagementSlider();
});

// 관리 카드 슬라이드 초기화
function initManagementSlider() {
  const sliderWrapper = document.getElementById("managementSlider");
  const prevBtn = document.getElementById("sliderPrevBtn");
  const nextBtn = document.getElementById("sliderNextBtn");
  const slides = document.querySelectorAll(".management-slide");

  if (!sliderWrapper || !prevBtn || !nextBtn || slides.length === 0) {
    return;
  }

  let currentSlide = 0;
  const totalSlides = slides.length;

  // 슬라이드 이동 함수
  function goToSlide(index) {
    if (index < 0 || index >= totalSlides) return;

    currentSlide = index;

    // transform으로 슬라이드 이동
    const translateX = -currentSlide * 100;
    sliderWrapper.style.transform = `translateX(${translateX}%)`;

    // active 클래스 업데이트
    slides.forEach((slide, i) => {
      if (i === currentSlide) {
        slide.classList.add("active");
      } else {
        slide.classList.remove("active");
      }
    });
  }

  // 이전 버튼 클릭
  prevBtn.addEventListener("click", function () {
    if (currentSlide > 0) {
      goToSlide(currentSlide - 1);
    }
  });

  // 다음 버튼 클릭
  nextBtn.addEventListener("click", function () {
    if (currentSlide < totalSlides - 1) {
      goToSlide(currentSlide + 1);
    }
  });

  // 초기 슬라이드 설정
  goToSlide(0);
}

// 배너 광고 모달 표시 함수
function showBannerModal() {
  // 로컬스토리지에서 배너 닫기 상태 확인
  const bannerClosed = localStorage.getItem("bannerClosed");
  if (bannerClosed === "true") {
    return; // 이미 닫혔으면 표시하지 않음
  }

  const bannerModal = document.getElementById("bannerModal");
  const bannerCloseBtn = document.getElementById("bannerCloseBtn");
  const bannerImage = document.getElementById("bannerImage");

  if (!bannerModal) return;

  // 배너 모달 표시
  bannerModal.classList.add("show");

  // 닫기 버튼 클릭 이벤트
  if (bannerCloseBtn) {
    bannerCloseBtn.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      closeBannerModal();
    });
  }

  // 이미지 클릭 시 구독 페이지로 이동
  if (bannerImage) {
    bannerImage.addEventListener("click", function (e) {
      // 이미지의 오른쪽 상단 영역 클릭 시 닫기 (X 버튼 영역)
      const rect = this.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;
      const imageWidth = rect.width;
      const imageHeight = rect.height;

      // 오른쪽 상단 15% 영역 클릭 시 닫기 (X 버튼이 보통 그 위치에 있음)
      if (clickX > imageWidth * 0.85 && clickY < imageHeight * 0.15) {
        closeBannerModal();
      } else {
        // 그 외 영역 클릭 시 구독 페이지로 이동
        closeBannerModal();
        window.location.href = "/subscription/index.html";
      }
    });
  }

  // 배경 클릭 시 닫기
  const overlay = bannerModal.querySelector(".banner-modal-overlay");
  if (overlay) {
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) {
        closeBannerModal();
      }
    });
  }
}

// 배너 모달 닫기 함수
function closeBannerModal() {
  const bannerModal = document.getElementById("bannerModal");
  if (bannerModal) {
    bannerModal.classList.remove("show");
    // 로컬스토리지에 닫기 상태 저장 (이번 세션 동안만)
    localStorage.setItem("bannerClosed", "true");
  }
}

// 별점 표시 함수 (빈 별과 꽉 찬 별)
function getStarRating(rating) {
  const numRating = parseFloat(rating) || 0;
  const fullStars = Math.floor(numRating); // 정수 부분 (꽉 찬 별)
  const emptyStars = 5 - fullStars; // 빈 별 개수

  let stars = "★".repeat(fullStars); // 꽉 찬 별
  stars += "☆".repeat(emptyStars); // 빈 별

  return stars || "☆☆☆☆☆"; // rating이 0이면 모두 빈 별
}

// Supabase 스크립트 로드 대기 함수
async function waitForSupabaseAndLoadProducts(productType = "사료") {
  // 최대 5초 동안 대기
  let attempts = 0;
  const maxAttempts = 50; // 5초 (100ms * 50)

  while (typeof SupabaseService === "undefined" && attempts < maxAttempts) {
    await new Promise((resolve) => setTimeout(resolve, 100));
    attempts++;
  }

  if (typeof SupabaseService === "undefined") {
    console.error(
      "SupabaseService가 로드되지 않았습니다. 스크립트를 확인해주세요."
    );
    return;
  }

  console.log("SupabaseService 로드 완료, 추천 제품 로드 시작");
  await loadRecommendedProducts(productType);
}

// 예약 일정 로드 함수
async function loadReservationSchedule() {
  try {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      console.log("userId가 없어 예약 일정을 로드할 수 없습니다.");
      return;
    }

    if (typeof SupabaseService === "undefined") {
      console.error("SupabaseService가 로드되지 않았습니다.");
      return;
    }

    const client = await getSupabaseClient();
    const { data: userData, error } = await client
      .from("users")
      .select("reservation, reservation_date")
      .eq("user_id", userId)
      .single();

    if (error) {
      console.error("예약 일정 로드 실패:", error);
      return;
    }

    if (!userData || !userData.reservation || !userData.reservation_date) {
      console.log("예약 일정이 없습니다.");
      return;
    }

    // 예약 일정을 일정 리스트에 추가
    const scheduleList = document.querySelector(".schedule-list");
    if (!scheduleList) {
      console.error("일정 리스트 컨테이너를 찾을 수 없습니다.");
      return;
    }

    // reservation_date 파싱 (timestamp with timezone)
    // Supabase timestampz는 ISO 8601(Z 포함)로 오므로 Asia/Seoul로 변환
    let reservationDate;
    try {
      reservationDate = new Date(userData.reservation_date);
    } catch (e) {
      console.error("날짜 파싱 실패:", userData.reservation_date);
      return;
    }

    // 유효한 날짜인지 확인
    if (isNaN(reservationDate.getTime())) {
      console.error("유효하지 않은 날짜 형식:", userData.reservation_date);
      return;
    }

    // KST로 표시
    const formatterDate = new Intl.DateTimeFormat("ko-KR", {
      timeZone: "Asia/Seoul",
      month: "numeric",
      day: "numeric",
      weekday: "short",
    });
    const formatterTime = new Intl.DateTimeFormat("ko-KR", {
      timeZone: "Asia/Seoul",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    const dateParts = formatterDate.formatToParts(reservationDate);
    const month = dateParts.find((p) => p.type === "month")?.value;
    const day = dateParts.find((p) => p.type === "day")?.value;
    const weekday =
      dateParts.find((p) => p.type === "weekday")?.value?.replace("요일", "") ||
      "";
    const timeText = formatterTime.format(reservationDate);

    // 기존 예약 일정 제거 (이미 있는 경우)
    const existingReservation = scheduleList.querySelector(
      ".schedule-item[data-reservation]"
    );
    if (existingReservation) {
      existingReservation.remove();
    }

    // 예약 일정 아이템 생성 (한 줄로 표시)
    const reservationItem = document.createElement("div");
    reservationItem.className = "schedule-item";
    reservationItem.setAttribute("data-reservation", "true");
    reservationItem.innerHTML = `
      <div class="schedule-icon">
        <img src="/svg/checkup.svg" alt="병원" class="schedule-icon-img" />
      </div>
      <div class="schedule-text">${day}일(${weekday}) 병원 예약 - ${userData.reservation} / ${timeText}</div>
    `;

    // 일정 리스트의 첫 번째 위치에 추가
    scheduleList.insertBefore(reservationItem, scheduleList.firstChild);

    console.log("예약 일정 로드 완료:", userData);
  } catch (error) {
    console.error("예약 일정 로드 중 오류:", error);
  }
}

// 요일 이름 반환 함수
function getDayName(dayIndex) {
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  return days[dayIndex];
}

// 생일 일정 로드 함수
async function loadBirthdaySchedule() {
  try {
    const selectedPetData = localStorage.getItem("selectedPetData");
    if (!selectedPetData) {
      // 생일 일정이 없으면 기존 항목 제거
      const existingBirthday = document.querySelector(
        ".schedule-item[data-birthday]"
      );
      if (existingBirthday) {
        existingBirthday.remove();
      }
      return;
    }

    const pet = JSON.parse(selectedPetData);
    const petName = pet.pet_name || pet.petName || "내새꾸";

    // 생일 정보 확인 (pet_birth: YYYYMMDD 형식의 숫자 또는 birth_date 등)
    let birthDate = null;

    if (pet.pet_birth) {
      // pet_birth가 숫자 형식인 경우 (YYYYMMDD)
      const birthStr = pet.pet_birth.toString();
      if (birthStr.length === 8) {
        const year = parseInt(birthStr.slice(0, 4), 10);
        const month = parseInt(birthStr.slice(4, 6), 10) - 1;
        const day = parseInt(birthStr.slice(6, 8), 10);
        birthDate = new Date(year, month, day);
      }
    } else if (pet.birth_date) {
      // timestamp 형식인 경우
      if (typeof pet.birth_date === "string") {
        birthDate = new Date(pet.birth_date);
      } else if (pet.birth_date instanceof Date) {
        birthDate = pet.birth_date;
      } else {
        birthDate = new Date(pet.birth_date);
      }
    } else if (pet.birth_date_str) {
      // 문자열 형식인 경우 (YYYYMMDD)
      const birthStr = pet.birth_date_str.toString();
      if (birthStr.length === 8) {
        const year = parseInt(birthStr.slice(0, 4), 10);
        const month = parseInt(birthStr.slice(4, 6), 10) - 1;
        const day = parseInt(birthStr.slice(6, 8), 10);
        birthDate = new Date(year, month, day);
      }
    }

    if (!birthDate || isNaN(birthDate.getTime())) {
      // 생일 정보가 없으면 기존 항목 제거
      const existingBirthday = document.querySelector(
        ".schedule-item[data-birthday]"
      );
      if (existingBirthday) {
        existingBirthday.remove();
      }
      return;
    }

    // 올해 생일 날짜 계산
    const today = new Date();
    const currentYear = today.getFullYear();
    const birthdayThisYear = new Date(
      currentYear,
      birthDate.getMonth(),
      birthDate.getDate()
    );

    // 올해 생일이 지났으면 내년 생일로 설정
    const displayBirthday =
      birthdayThisYear < today
        ? new Date(currentYear + 1, birthDate.getMonth(), birthDate.getDate())
        : birthdayThisYear;

    const month = displayBirthday.getMonth() + 1;
    const day = displayBirthday.getDate();
    const dayName = getDayName(displayBirthday.getDay());

    // 일정 리스트 가져오기
    const scheduleList = document.querySelector(".schedule-list");
    if (!scheduleList) {
      console.error("일정 리스트 컨테이너를 찾을 수 없습니다.");
      return;
    }

    // 기존 생일 일정 제거
    const existingBirthday = scheduleList.querySelector(
      ".schedule-item[data-birthday]"
    );
    if (existingBirthday) {
      existingBirthday.remove();
    }

    // 생일 일정 아이템 생성
    const birthdayItem = document.createElement("div");
    birthdayItem.className = "schedule-item";
    birthdayItem.setAttribute("data-birthday", "true");
    birthdayItem.innerHTML = `
      <div class="schedule-icon">
        <img src="/svg/bday.svg" alt="생일" class="schedule-icon-img" />
      </div>
      <div class="schedule-text">${day}일(${dayName}) ${petName} 생일 ❤️</div>
    `;

    // 일정 리스트의 마지막에 추가 (예약 일정 다음)
    scheduleList.appendChild(birthdayItem);

    console.log("생일 일정 로드 완료:", { petName, birthday: displayBirthday });
  } catch (error) {
    console.error("생일 일정 로드 중 오류:", error);
  }
}

// 홈 화면 추천 제품 로드 함수
async function loadRecommendedProducts(productType = "사료") {
  // Supabase 스크립트 로드 확인
  if (typeof SupabaseService === "undefined") {
    console.error("SupabaseService가 로드되지 않았습니다.");
    return;
  }

  try {
    const selectedPetId = localStorage.getItem("selectedPetId");
    const productListContainer = document.querySelector(".product-list");

    console.log("제품 로드 시작:", {
      selectedPetId,
      productType,
      container: productListContainer !== null,
    });

    if (!productListContainer) {
      console.error("제품 리스트 컨테이너를 찾을 수 없습니다.");
      return;
    }

    // 제품 타입 매핑
    const productTypeMap = {
      사료: "사료",
      영양제: "영양제",
      간식: "간식",
    };

    const mappedProductType = productTypeMap[productType] || "사료";

    let products = [];

    if (selectedPetId) {
      // 추천 알고리즘 사용
      console.log(
        "홈 화면 추천 제품 로드 시작, petId:",
        selectedPetId,
        "productType:",
        mappedProductType
      );
      products = await SupabaseService.getRecommendedProducts(
        selectedPetId,
        mappedProductType,
        6
      );
      console.log(
        "추천 제품 로드 완료, 개수:",
        products?.length || 0,
        "제품:",
        products
      );
    } else {
      console.log("selectedPetId가 없어 기본 제품을 로드합니다.");
    }

    // 추천 제품이 없거나 6개 미만이면 기본 제품으로 채우기
    if (!products || products.length < 6) {
      const neededCount = 6 - (products?.length || 0);
      console.log(
        "추천 제품이 부족하여 기본 제품을 추가합니다. 필요 개수:",
        neededCount
      );
      const defaultProducts = await SupabaseService.getProducts(
        null,
        mappedProductType,
        neededCount,
        "rating"
      );
      console.log(
        "기본 제품 로드 완료, 개수:",
        defaultProducts?.length || 0,
        "제품:",
        defaultProducts
      );
      if (defaultProducts && defaultProducts.length > 0) {
        products = [...(products || []), ...defaultProducts].slice(0, 6);
      }
    }

    // selectedPetId가 없고 products도 없으면 전체 제품 로드
    if ((!products || products.length === 0) && !selectedPetId) {
      console.log("전체 제품을 로드합니다.");
      products = await SupabaseService.getProducts(
        null,
        mappedProductType,
        6,
        "rating"
      );
      console.log("전체 제품 로드 완료, 개수:", products?.length || 0);
    }

    if (products && products.length > 0) {
      // 제품 카드 HTML 생성
      const productCardsHTML = products
        .map((product) => {
          const discountPercent = product.discount_percent
            ? parseFloat(product.discount_percent)
            : 0;
          const price = product.current_price
            ? parseFloat(product.current_price)
            : 0;
          const rating = product.rating ? parseFloat(product.rating) : 0;
          const reviewCount = product.review_count
            ? parseInt(product.review_count, 10)
            : 0;
          const imageUrl = product.product_img || "";

          return `
          <div class="product-card" data-product-id="${
            product.product_id
          }" style="cursor: pointer;">
            <div class="product-image" style="background-image: url('${imageUrl}'); background-size: cover; background-position: center;"></div>
            <div class="product-brand">${product.brand || ""}</div>
            <p class="product-name">${product.product_name || ""}</p>
            <div class="product-price">
              ${
                discountPercent > 0
                  ? `<span class="discount">${Math.round(
                      discountPercent
                    )}%</span>`
                  : ""
              }
              <span class="price">${price.toLocaleString()}원</span>
            </div>
            <div class="product-rating">
              <span class="rating-stars">${getStarRating(rating)}</span>
              <span class="rating-reviews">리뷰 ${reviewCount}</span>
            </div>
          </div>
        `;
        })
        .join("");

      productListContainer.innerHTML = productCardsHTML;

      // 제품 카드 클릭 이벤트 추가
      const productCards =
        productListContainer.querySelectorAll(".product-card");
      productCards.forEach((card) => {
        card.addEventListener("click", function () {
          const productId = this.getAttribute("data-product-id");
          if (productId) {
            window.location.href = `/PDP/product-detail.html?id=${productId}`;
          }
        });
      });

      // 추천 제목 업데이트 (선택사항)
      const selectedPetData = localStorage.getItem("selectedPetData");
      if (selectedPetData) {
        try {
          const pet = JSON.parse(selectedPetData);
          const petName = pet.pet_name || "내새꾸";
          const subtitleEl = document.querySelector(".recommendation-subtitle");
          if (subtitleEl) {
            subtitleEl.textContent = `${petName}를 위한 최저가 ${mappedProductType} 추천`;
          }
        } catch (e) {
          console.error("반려동물 데이터 파싱 실패:", e);
        }
      }

      console.log("홈 화면 추천 제품 표시 완료");
    } else {
      console.error("표시할 제품이 없습니다.");
      productListContainer.innerHTML =
        '<p style="text-align: center; color: #959595; padding: 20px;">추천 제품을 찾을 수 없습니다.</p>';
    }
  } catch (error) {
    console.error("추천 제품 로드 실패:", error);
  }
}

// 반려동물 질병 기반 병원 추천 로드
async function loadRecommendedHospitals() {
  // Supabase 스크립트 로드 확인
  if (typeof SupabaseService === "undefined") {
    console.error("SupabaseService가 로드되지 않았습니다.");
    return;
  }

  try {
    const selectedPetId = localStorage.getItem("selectedPetId");
    const productListContainer = document.querySelector(".product-list");

    console.log("병원 추천 로드 시작:", {
      selectedPetId,
      container: productListContainer !== null,
    });

    if (!productListContainer) {
      console.error("제품 리스트 컨테이너를 찾을 수 없습니다.");
      return;
    }

    let hospitals = [];
    let categoryId = null;

    if (selectedPetId) {
      // 1. 반려동물 정보 가져오기 (disease_id 포함)
      // getSupabaseClient는 전역 함수 (common/supabase-config.js에서 로드됨)
      if (typeof getSupabaseClient === "function") {
        const client = await getSupabaseClient();

        const { data: pet, error: petError } = await client
          .from("pets")
          .select("pet_id, disease_id, pet_name")
          .eq("pet_id", selectedPetId)
          .maybeSingle();

        if (petError) {
          console.error("반려동물 정보 조회 실패:", petError);
        } else if (pet && pet.disease_id) {
          // 2. 질병 정보 가져오기 (category_id 포함)
          const { data: disease, error: diseaseError } = await client
            .from("diseases")
            .select("disease_id, disease_name, category_id")
            .eq("disease_id", pet.disease_id)
            .maybeSingle();

          if (diseaseError) {
            console.error("질병 정보 조회 실패:", diseaseError);
          } else if (disease && disease.category_id) {
            categoryId = disease.category_id;
            console.log("질병 기반 category_id 추출:", categoryId);

            // 3. category_id로 병원 추천
            hospitals = await SupabaseService.getHospitals(null, categoryId, 3);
            console.log(
              "질병 기반 병원 추천 완료, 개수:",
              hospitals?.length || 0
            );
          }
        }
      } else {
        console.warn("getSupabaseClient 함수를 찾을 수 없습니다.");
      }
    }

    // 병원이 없거나 3개 미만이면 기본 병원으로 채우기
    if (!hospitals || hospitals.length < 3) {
      const neededCount = 3 - (hospitals?.length || 0);
      console.log(
        "추천 병원이 부족하여 기본 병원을 추가합니다. 필요 개수:",
        neededCount
      );
      const defaultHospitals = await SupabaseService.getHospitals(
        null,
        null,
        neededCount
      );
      console.log("기본 병원 로드 완료, 개수:", defaultHospitals?.length || 0);
      if (defaultHospitals && defaultHospitals.length > 0) {
        hospitals = [...(hospitals || []), ...defaultHospitals].slice(0, 3);
      }
    }

    // selectedPetId가 없고 hospitals도 없으면 전체 병원 로드
    if ((!hospitals || hospitals.length === 0) && !selectedPetId) {
      console.log("전체 병원을 로드합니다.");
      hospitals = await SupabaseService.getHospitals(null, null, 3);
      console.log("전체 병원 로드 완료, 개수:", hospitals?.length || 0);
    }

    if (hospitals && hospitals.length > 0) {
      // 병원 카드 HTML 생성 (제품 카드 스타일 재활용)
      const hospitalCardsHTML = hospitals
        .map((hospital) => {
          const rating = hospital.rating ? parseFloat(hospital.rating) : 0;
          const reviewCount = hospital.review_count
            ? parseInt(hospital.review_count, 10)
            : 0;
          const imageUrl = hospital.hospital_img || "";

          return `
          <div class="product-card hospital-card" data-hospital-id="${
            hospital.hospital_id
          }" style="cursor: pointer;">
            <div class="product-image" style="background-image: url('${imageUrl}'); background-size: cover; background-position: center;"></div>
            <div class="product-brand hospital-name">${
              hospital.hospital_name || ""
            }</div>
            <p class="product-name hospital-address">${
              hospital.address || ""
            }</p>
            <div class="product-price">
              <span class="price">⭐ ${rating.toFixed(1)}</span>
            </div>
            <div class="product-rating">
              <span class="rating-reviews">리뷰 ${reviewCount}</span>
            </div>
          </div>
        `;
        })
        .join("");

      productListContainer.innerHTML = hospitalCardsHTML;

      // 병원 카드 클릭 이벤트 추가
      const hospitalCards = productListContainer.querySelectorAll(
        ".product-card[data-hospital-id]"
      );
      hospitalCards.forEach((card) => {
        card.addEventListener("click", function () {
          const hospitalId = this.getAttribute("data-hospital-id");
          // 병원 이름 가져오기 (카드 내에서)
          const hospitalNameElement = this.querySelector(".product-brand");
          const hospitalName = hospitalNameElement
            ? hospitalNameElement.textContent.trim()
            : "";

          if (hospitalId) {
            // 상대 경로로 수정하고 병원 이름도 함께 전달
            const params = new URLSearchParams({
              hospital_id: hospitalId,
            });
            if (hospitalName) {
              params.set("hospital_name", hospitalName);
            }
            window.location.href = `../hospital_reservation/reservation.html?${params.toString()}`;
          }
        });
      });

      // 추천 제목 업데이트
      const selectedPetData = localStorage.getItem("selectedPetData");
      if (selectedPetData) {
        try {
          const pet = JSON.parse(selectedPetData);
          const petName = pet.pet_name || "내새꾸";
          const subtitleEl = document.querySelector(".recommendation-subtitle");
          if (subtitleEl) {
            subtitleEl.textContent = `${petName}를 위한 맞춤 병원 추천`;
          }
        } catch (e) {
          console.error("반려동물 데이터 파싱 실패:", e);
        }
      }

      console.log("홈 화면 병원 추천 표시 완료");
    } else {
      console.error("표시할 병원이 없습니다.");
      productListContainer.innerHTML =
        '<p style="text-align: center; color: #959595; padding: 20px;">추천 병원을 찾을 수 없습니다.</p>';
    }
  } catch (error) {
    console.error("병원 추천 로드 실패:", error);
  }
}
