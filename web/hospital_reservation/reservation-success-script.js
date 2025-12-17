// 반려동물 이름 로드 함수
async function loadPetName() {
  try {
    // 먼저 localStorage에서 선택된 반려동물 확인
    const selectedPetData = localStorage.getItem("selectedPetData");
    if (selectedPetData) {
      const pet = JSON.parse(selectedPetData);
      const petNameEl = document.getElementById("petNameDisplay");
      if (petNameEl && pet.pet_name) {
        petNameEl.textContent = pet.pet_name + "의";
        return;
      }
    }

    // localStorage에 없으면 DB에서 가져오기
    const userId = localStorage.getItem("userId");
    if (!userId) {
      console.warn("userId가 없어 반려동물 이름을 불러올 수 없습니다.");
      return;
    }

    if (typeof SupabaseService === "undefined") {
      console.warn("SupabaseService가 로드되지 않았습니다.");
      return;
    }

    const pets = await SupabaseService.getPetsByUserId(userId);
    if (pets && pets.length > 0) {
      // pet_id 순서로 정렬
      const sorted = [...pets].sort((a, b) => {
        const aId = parseInt(a.pet_id, 10);
        const bId = parseInt(b.pet_id, 10);
        return (isNaN(aId) ? 0 : aId) - (isNaN(bId) ? 0 : bId);
      });

      // 선택된 반려동물 확인
      let selectedPetId = localStorage.getItem("selectedPetId");
      let selectedPet = null;

      if (selectedPetId) {
        selectedPet = sorted.find(
          (p) => String(p.pet_id) === String(selectedPetId)
        );
      }

      if (!selectedPet) {
        selectedPet = sorted[0];
      }

      const petNameEl = document.getElementById("petNameDisplay");
      if (petNameEl && selectedPet.pet_name) {
        petNameEl.textContent = selectedPet.pet_name + "의";
      }
    }
  } catch (error) {
    console.error("반려동물 이름 로드 오류:", error);
  }
}

// URL 파라미터에서 예약 정보 가져오기
document.addEventListener("DOMContentLoaded", function () {
  // 반려동물 이름 로드
  loadPetName();

  const urlParams = new URLSearchParams(window.location.search);
  const date = urlParams.get("date");
  const time = urlParams.get("time");
  let hospital = urlParams.get("hospital");

  // URL 파라미터에서 hospital이 없으면 기본값 사용
  if (!hospital) {
    hospital = "예은동물의료센터";
  } else {
    // URL 디코딩 (한글 병원명이 인코딩되어 있을 수 있음)
    hospital = decodeURIComponent(hospital);
  }

  console.log("예약 완료 페이지 - 병원명:", hospital);

  // 예약 정보 표시
  if (date && time) {
    const reservationDate = new Date(date);
    const year = reservationDate.getFullYear();
    const month = reservationDate.getMonth() + 1;
    const day = reservationDate.getDate();
    const dayName = getDayName(reservationDate.getDay());

    // 예약 일시 표시
    const reservationDateTime = document.getElementById("reservationDateTime");
    reservationDateTime.textContent = `${month}.${day}(${dayName}) ${time}`;

    // 병원명 표시
    const reservationHospital = document.getElementById("reservationHospital");
    reservationHospital.textContent = hospital;

    // 작은 달력 렌더링
    renderMiniCalendar(reservationDate);
  } else {
    // 파라미터가 없으면 기본값 사용
    const defaultDate = new Date(2026, 0, 5); // 2026년 1월 5일
    const defaultTime = "17:00";

    const reservationDateTime = document.getElementById("reservationDateTime");
    reservationDateTime.textContent = `1.5(월) ${defaultTime}`;

    renderMiniCalendar(defaultDate);
  }

  // 작은 달력 렌더링
  function renderMiniCalendar(date) {
    const miniCalendarDays = document.getElementById("miniCalendarDays");
    const miniCalendarMonth = document.getElementById("miniCalendarMonth");

    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    miniCalendarMonth.textContent = `${year}년 ${String(month).padStart(
      2,
      "0"
    )}월`;

    miniCalendarDays.innerHTML = "";

    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const firstDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    // 이전 달의 마지막 날들
    const prevMonthLastDay = new Date(year, month - 1, 0).getDate();
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const day = prevMonthLastDay - i;
      const dayElement = document.createElement("div");
      dayElement.className = "mini-calendar-day other-month";
      dayElement.textContent = day;
      miniCalendarDays.appendChild(dayElement);
    }

    // 현재 달의 날들
    for (let day = 1; day <= daysInMonth; day++) {
      const dayDate = new Date(year, month - 1, day);
      const isSelected = isSameDay(dayDate, date);

      const dayElement = document.createElement("div");
      dayElement.className = "mini-calendar-day";
      if (isSelected) {
        dayElement.classList.add("selected");
      }
      dayElement.textContent = day;
      miniCalendarDays.appendChild(dayElement);
    }

    // 다음 달의 첫 날들
    const totalCells = miniCalendarDays.children.length;
    const remainingCells = 42 - totalCells;
    for (let day = 1; day <= remainingCells; day++) {
      const dayElement = document.createElement("div");
      dayElement.className = "mini-calendar-day other-month";
      dayElement.textContent = day;
      miniCalendarDays.appendChild(dayElement);
    }
  }

  // 같은 날인지 확인
  function isSameDay(date1, date2) {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  }

  // 요일 이름 반환
  function getDayName(dayIndex) {
    const days = ["일", "월", "화", "수", "목", "금", "토"];
    return days[dayIndex];
  }

  // users 테이블에서 예약 정보 삭제
  async function cancelReservation() {
    try {
      const userId = localStorage.getItem("userId");
      if (!userId) {
        console.error("userId가 없습니다.");
        return false;
      }

      if (typeof SupabaseService === "undefined") {
        console.error("SupabaseService가 로드되지 않았습니다.");
        return false;
      }

      const client = await getSupabaseClient();

      const { data, error } = await client
        .from("users")
        .update({
          reservation: null,
          reservation_date: null,
        })
        .eq("user_id", userId)
        .select();

      if (error) {
        console.error("예약 취소 실패:", error);
        return false;
      }

      console.log("예약 취소 성공:", data);
      return true;
    } catch (error) {
      console.error("예약 취소 중 오류:", error);
      return false;
    }
  }

  // 예약 취소 버튼 클릭
  document
    .getElementById("cancelReservationBtn")
    .addEventListener("click", async function () {
      if (confirm("예약을 취소하시겠습니까?")) {
        const cancelled = await cancelReservation();

        if (cancelled) {
          alert("예약이 취소되었습니다.");
          // 홈으로 이동
          window.location.href = "../website/index.html";
        } else {
          alert("예약 취소에 실패했습니다. 다시 시도해주세요.");
        }
      }
    });

  // users 테이블에 예약 정보 저장
  async function saveReservationToUser(hospitalName, dateString, time) {
    try {
      const userId = localStorage.getItem("userId");
      if (!userId) {
        console.error("userId가 없습니다.");
        return false;
      }

      if (typeof SupabaseService === "undefined") {
        console.error("SupabaseService가 로드되지 않았습니다.");
        return false;
      }

      const client = await getSupabaseClient();

      // timestamp with timezone: YYYY-MM-DDTHH:MM:SS+09:00 (KST 고정)
      // 예: 2026-01-05T17:00:00+09:00
      const [hours, minutes] = time.split(":");
      const reservationDateTime = `${dateString}T${hours}:${minutes}:00+09:00`;

      const { data, error } = await client
        .from("users")
        .update({
          reservation: hospitalName,
          reservation_date: reservationDateTime,
        })
        .eq("user_id", userId)
        .select();

      if (error) {
        console.error("예약 정보 저장 실패:", error);
        return false;
      }

      console.log("예약 정보 저장 성공:", data);
      return true;
    } catch (error) {
      console.error("예약 정보 저장 중 오류:", error);
      return false;
    }
  }

  // 예약완료 버튼 클릭
  document
    .getElementById("completeBtn")
    .addEventListener("click", async function () {
      // users 테이블에 예약 정보 저장
      if (date && time) {
        // hospital 변수는 이미 위에서 정의됨 (URL 파라미터에서 가져온 값)
        const saved = await saveReservationToUser(hospital, date, time);

        if (saved) {
          console.log("예약 정보가 저장되었습니다.");
        } else {
          console.warn("예약 정보 저장에 실패했습니다.");
        }
      }

      // 홈으로 이동
      window.location.href = "../website/index.html";
    });
});
