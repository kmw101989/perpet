// URL 파라미터에서 예약 정보 가져오기
document.addEventListener('DOMContentLoaded', function() {
  const urlParams = new URLSearchParams(window.location.search);
  const date = urlParams.get('date');
  const time = urlParams.get('time');
  const hospital = urlParams.get('hospital') || '예은동물의료센터';
  
  // 예약 정보 표시
  if (date && time) {
    const reservationDate = new Date(date);
    const year = reservationDate.getFullYear();
    const month = reservationDate.getMonth() + 1;
    const day = reservationDate.getDate();
    const dayName = getDayName(reservationDate.getDay());
    
    // 예약 일시 표시
    const reservationDateTime = document.getElementById('reservationDateTime');
    reservationDateTime.textContent = `${month}.${day}(${dayName}) ${time}`;
    
    // 병원명 표시
    const reservationHospital = document.getElementById('reservationHospital');
    reservationHospital.textContent = hospital;
    
    // 작은 달력 렌더링
    renderMiniCalendar(reservationDate);
  } else {
    // 파라미터가 없으면 기본값 사용
    const defaultDate = new Date(2026, 0, 5); // 2026년 1월 5일
    const defaultTime = '17:00';
    
    const reservationDateTime = document.getElementById('reservationDateTime');
    reservationDateTime.textContent = `1.5(월) ${defaultTime}`;
    
    renderMiniCalendar(defaultDate);
  }
  
  // 작은 달력 렌더링
  function renderMiniCalendar(date) {
    const miniCalendarDays = document.getElementById('miniCalendarDays');
    const miniCalendarMonth = document.getElementById('miniCalendarMonth');
    
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    miniCalendarMonth.textContent = `${year}년 ${String(month).padStart(2, '0')}월`;
    
    miniCalendarDays.innerHTML = '';
    
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const firstDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    
    // 이전 달의 마지막 날들
    const prevMonthLastDay = new Date(year, month - 1, 0).getDate();
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const day = prevMonthLastDay - i;
      const dayElement = document.createElement('div');
      dayElement.className = 'mini-calendar-day other-month';
      dayElement.textContent = day;
      miniCalendarDays.appendChild(dayElement);
    }
    
    // 현재 달의 날들
    for (let day = 1; day <= daysInMonth; day++) {
      const dayDate = new Date(year, month - 1, day);
      const isSelected = isSameDay(dayDate, date);
      
      const dayElement = document.createElement('div');
      dayElement.className = 'mini-calendar-day';
      if (isSelected) {
        dayElement.classList.add('selected');
      }
      dayElement.textContent = day;
      miniCalendarDays.appendChild(dayElement);
    }
    
    // 다음 달의 첫 날들
    const totalCells = miniCalendarDays.children.length;
    const remainingCells = 42 - totalCells;
    for (let day = 1; day <= remainingCells; day++) {
      const dayElement = document.createElement('div');
      dayElement.className = 'mini-calendar-day other-month';
      dayElement.textContent = day;
      miniCalendarDays.appendChild(dayElement);
    }
  }
  
  // 같은 날인지 확인
  function isSameDay(date1, date2) {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  }
  
  // 요일 이름 반환
  function getDayName(dayIndex) {
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    return days[dayIndex];
  }
  
  // 예약 취소 버튼 클릭
  document.getElementById('cancelReservationBtn').addEventListener('click', function() {
    if (confirm('예약을 취소하시겠습니까?')) {
      // 여기에 예약 취소 API 호출 로직 추가
      alert('예약이 취소되었습니다.');
      // 예약 페이지로 돌아가기
      window.location.href = 'reservation.html';
    }
  });
  
  // 예약완료 버튼 클릭
  document.getElementById('completeBtn').addEventListener('click', function() {
    // 여기에 예약 완료 후 처리 로직 추가 (예: 홈으로 이동)
    window.location.href = '../website/index.html';
  });
});


