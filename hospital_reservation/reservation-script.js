// 달력 및 시간 선택 기능
document.addEventListener('DOMContentLoaded', function() {
  let currentDate = new Date(2026, 0, 1); // 2026년 1월
  let selectedDate = null;
  let selectedTime = null;

  // 달력 렌더링
  function renderCalendar() {
    const calendarDays = document.getElementById('calendarDays');
    const calendarMonth = document.getElementById('calendarMonth');
    
    // 월 표시 업데이트
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    calendarMonth.textContent = `${year}년 ${String(month).padStart(2, '0')}월`;
    
    // 달력 초기화
    calendarDays.innerHTML = '';
    
    // 현재 월의 첫 날과 마지막 날
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const firstDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    
    // 이전 달의 마지막 날들
    const prevMonthLastDay = new Date(year, month - 1, 0).getDate();
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const day = prevMonthLastDay - i;
      const dayElement = createDayElement(day, true, false);
      calendarDays.appendChild(dayElement);
    }
    
    // 현재 달의 날들
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day);
      const isToday = isSameDay(date, new Date());
      const isSelected = selectedDate && isSameDay(date, selectedDate);
      const isDisabled = date < new Date().setHours(0, 0, 0, 0); // 오늘 이전 날짜는 비활성화
      
      const dayElement = createDayElement(day, false, isToday, isSelected, isDisabled);
      calendarDays.appendChild(dayElement);
    }
    
    // 다음 달의 첫 날들 (달력을 채우기 위해)
    const totalCells = calendarDays.children.length;
    const remainingCells = 42 - totalCells; // 6주 * 7일 = 42
    for (let day = 1; day <= remainingCells; day++) {
      const dayElement = createDayElement(day, true, false);
      calendarDays.appendChild(dayElement);
    }
  }
  
  // 날짜 요소 생성
  function createDayElement(day, isOtherMonth, isToday = false, isSelected = false, isDisabled = false) {
    const dayElement = document.createElement('div');
    dayElement.className = 'calendar-day';
    dayElement.textContent = day;
    
    if (isOtherMonth) {
      dayElement.classList.add('other-month');
    }
    if (isToday) {
      dayElement.classList.add('today');
    }
    if (isSelected) {
      dayElement.classList.add('selected');
    }
    if (isDisabled) {
      dayElement.classList.add('disabled');
    }
    
    if (!isOtherMonth && !isDisabled) {
      dayElement.addEventListener('click', function() {
        // 이전 선택 제거
        document.querySelectorAll('.calendar-day').forEach(day => {
          day.classList.remove('selected');
        });
        
        // 새 선택 추가
        this.classList.add('selected');
        
        // 선택된 날짜 저장
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        selectedDate = new Date(year, month, day);
        
        // 시간 선택 초기화
        selectedTime = null;
        updateTimeSlots();
        updateReservationButton();
      });
    }
    
    return dayElement;
  }
  
  // 같은 날인지 확인
  function isSameDay(date1, date2) {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  }
  
  // 이전 달
  document.getElementById('prevMonth').addEventListener('click', function() {
    currentDate.setMonth(currentDate.getMonth() - 1);
    selectedDate = null;
    selectedTime = null;
    renderCalendar();
    updateTimeSlots();
    updateReservationButton();
  });
  
  // 다음 달
  document.getElementById('nextMonth').addEventListener('click', function() {
    currentDate.setMonth(currentDate.getMonth() + 1);
    selectedDate = null;
    selectedTime = null;
    renderCalendar();
    updateTimeSlots();
    updateReservationButton();
  });
  
  // 시간 슬롯 생성
  function generateTimeSlots() {
    const morningSlots = [];
    const afternoonSlots = [];
    
    // 오전: 9:00 ~ 11:30 (30분 간격)
    for (let hour = 9; hour < 12; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
        morningSlots.push(time);
      }
    }
    
    // 오후: 12:00 ~ 17:30 (30분 간격)
    for (let hour = 12; hour < 18; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
        afternoonSlots.push(time);
      }
    }
    
    return { morningSlots, afternoonSlots };
  }
  
  // 시간 슬롯 렌더링
  function updateTimeSlots() {
    const { morningSlots, afternoonSlots } = generateTimeSlots();
    const morningContainer = document.getElementById('morningSlots');
    const afternoonContainer = document.getElementById('afternoonSlots');
    
    morningContainer.innerHTML = '';
    afternoonContainer.innerHTML = '';
    
    // 오전 시간 슬롯
    morningSlots.forEach(time => {
      const slot = createTimeSlot(time, '오전');
      morningContainer.appendChild(slot);
    });
    
    // 오후 시간 슬롯
    afternoonSlots.forEach(time => {
      const slot = createTimeSlot(time, '오후');
      afternoonContainer.appendChild(slot);
    });
  }
  
  // 시간 슬롯 요소 생성
  function createTimeSlot(time, period) {
    const slot = document.createElement('div');
    slot.className = 'time-slot';
    slot.textContent = time;
    
    // 선택된 시간인지 확인
    const isSelected = selectedTime === time;
    if (isSelected) {
      slot.classList.add('selected');
    }
    
    // 오늘 날짜가 선택되었을 때만 활성화
    const isDisabled = !selectedDate || isTimePast(time);
    if (isDisabled) {
      slot.classList.add('disabled');
    }
    
    if (!isDisabled) {
      slot.addEventListener('click', function() {
        // 이전 선택 제거
        document.querySelectorAll('.time-slot').forEach(s => {
          s.classList.remove('selected');
        });
        
        // 새 선택 추가
        this.classList.add('selected');
        selectedTime = time;
        updateReservationButton();
      });
    }
    
    return slot;
  }
  
  // 시간이 지났는지 확인
  function isTimePast(time) {
    if (!selectedDate) return true;
    
    const now = new Date();
    const [hours, minutes] = time.split(':').map(Number);
    const selectedDateTime = new Date(selectedDate);
    selectedDateTime.setHours(hours, minutes, 0, 0);
    
    // 오늘이고 시간이 지났으면 true
    if (isSameDay(selectedDate, now)) {
      return selectedDateTime < now;
    }
    
    return false;
  }
  
  // 예약 버튼 업데이트
  function updateReservationButton() {
    const btn = document.getElementById('reservationBtn');
    if (selectedDate && selectedTime) {
      btn.disabled = false;
    } else {
      btn.disabled = true;
    }
  }
  
  
  // 예약하기 버튼 클릭
  document.getElementById('reservationBtn').addEventListener('click', function() {
    if (selectedDate && selectedTime) {
      const year = selectedDate.getFullYear();
      const month = selectedDate.getMonth() + 1;
      const day = selectedDate.getDate();
      
      // 날짜를 YYYY-MM-DD 형식으로 변환
      const dateString = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      
      console.log('예약 정보:', {
        date: dateString,
        time: selectedTime
      });
      
      // 예약 완료 페이지로 이동 (URL 파라미터로 정보 전달)
      const params = new URLSearchParams({
        date: dateString,
        time: selectedTime,
        hospital: '예은동물의료센터'
      });
      
      window.location.href = `reservation-success.html?${params.toString()}`;
    }
  });
  
  // 뒤로가기 버튼
  document.querySelector('.back-icon').addEventListener('click', function() {
    window.history.back();
  });
  
  // 초기 렌더링
  renderCalendar();
  updateTimeSlots();
  updateReservationButton();
});

