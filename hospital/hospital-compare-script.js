// Bottom Sheet 드래그 기능
document.addEventListener('DOMContentLoaded', function() {
  const bottomSheet = document.getElementById('bottomSheet');
  const sheetHandle = document.getElementById('sheetHandle');
  const sheetContent = document.querySelector('.sheet-content');
  
  let isDragging = false;
  let startY = 0;
  let currentY = 0;
  let initialHeight = 0;
  
  // 시트의 초기 높이 설정 (60vh)
  const minHeight = 200; // 최소 높이 (px)
  const maxHeight = window.innerHeight * 0.9; // 최대 높이 (90vh)
  const defaultHeight = window.innerHeight * 0.6; // 기본 높이 (60vh)
  
  // 초기 높이 설정
  bottomSheet.style.height = defaultHeight + 'px';
  
  // 드래그 시작
  sheetHandle.addEventListener('mousedown', startDrag);
  sheetHandle.addEventListener('touchstart', startDrag, { passive: false });
  
  function startDrag(e) {
    isDragging = true;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    startY = clientY;
    initialHeight = bottomSheet.offsetHeight;
    
    document.addEventListener('mousemove', drag);
    document.addEventListener('touchmove', drag, { passive: false });
    document.addEventListener('mouseup', stopDrag);
    document.addEventListener('touchend', stopDrag);
    
    e.preventDefault();
  }
  
  // 드래그 중
  function drag(e) {
    if (!isDragging) return;
    
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const deltaY = startY - clientY; // 위로 드래그하면 양수
    const newHeight = initialHeight + deltaY;
    
    // 높이 제한
    if (newHeight >= minHeight && newHeight <= maxHeight) {
      bottomSheet.style.height = newHeight + 'px';
      bottomSheet.style.transition = 'none';
    }
    
    e.preventDefault();
  }
  
  // 드래그 종료
  function stopDrag(e) {
    if (!isDragging) return;
    
    isDragging = false;
    bottomSheet.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
    
    const currentHeight = bottomSheet.offsetHeight;
    const threshold = (minHeight + maxHeight) / 2;
    
    // 중간 지점을 기준으로 확장/축소
    if (currentHeight > threshold) {
      bottomSheet.style.height = maxHeight + 'px';
      bottomSheet.classList.add('expanded');
      bottomSheet.classList.remove('collapsed');
    } else {
      bottomSheet.style.height = minHeight + 'px';
      bottomSheet.classList.add('collapsed');
      bottomSheet.classList.remove('expanded');
    }
    
    document.removeEventListener('mousemove', drag);
    document.removeEventListener('touchmove', drag);
    document.removeEventListener('mouseup', stopDrag);
    document.removeEventListener('touchend', stopDrag);
    
    e.preventDefault();
  }
  
  // 핸들 클릭으로 토글
  sheetHandle.addEventListener('click', function(e) {
    if (!isDragging) {
      const currentHeight = bottomSheet.offsetHeight;
      const threshold = (minHeight + maxHeight) / 2;
      
      if (currentHeight > threshold) {
        bottomSheet.style.height = minHeight + 'px';
        bottomSheet.classList.add('collapsed');
        bottomSheet.classList.remove('expanded');
      } else {
        bottomSheet.style.height = maxHeight + 'px';
        bottomSheet.classList.add('expanded');
        bottomSheet.classList.remove('collapsed');
      }
    }
  });
  
  // 카테고리 탭 클릭 이벤트
  const categoryTabs = document.querySelectorAll('.category-tab');
  
  categoryTabs.forEach(tab => {
    tab.addEventListener('click', function() {
      categoryTabs.forEach(t => t.classList.remove('active'));
      this.classList.add('active');
    });
  });
  
  // 24시간 필터 버튼 클릭 이벤트
  const filter24h = document.querySelector('.filter-24h');
  if (filter24h) {
    filter24h.addEventListener('click', function() {
      this.classList.toggle('active');
    });
  }
  
  // 액션 버튼 클릭 이벤트
  const actionButtons = document.querySelectorAll('.action-btn');
  actionButtons.forEach(button => {
    button.addEventListener('click', function(e) {
      e.stopPropagation();
      const buttonText = this.textContent.trim();
      
      if (buttonText === '예약하기') {
        // 예약 페이지로 이동
        window.location.href = '../hospital_reservation/reservation.html';
      } else if (buttonText === '상세정보') {
        // 상세 정보 표시
        console.log('상세 정보');
      }
    });
  });
  
  // 병원 카드 클릭 이벤트
  const hospitalCards = document.querySelectorAll('.hospital-card');
  hospitalCards.forEach(card => {
    card.addEventListener('click', function(e) {
      if (!e.target.classList.contains('action-btn')) {
        console.log('병원 상세');
      }
    });
  });
  
  // 탭바 아이템 클릭 이벤트
  const tabItems = document.querySelectorAll('.tab-item');
  
  tabItems.forEach(item => {
    item.addEventListener('click', function() {
      tabItems.forEach(tab => tab.classList.remove('active'));
      this.classList.add('active');
    });
  });
  
  // 윈도우 리사이즈 시 높이 재조정
  window.addEventListener('resize', function() {
    const currentHeight = bottomSheet.offsetHeight;
    const newMaxHeight = window.innerHeight * 0.9;
    const newDefaultHeight = window.innerHeight * 0.6;
    
    if (bottomSheet.classList.contains('expanded')) {
      bottomSheet.style.height = newMaxHeight + 'px';
    } else if (bottomSheet.classList.contains('collapsed')) {
      bottomSheet.style.height = minHeight + 'px';
    } else {
      bottomSheet.style.height = newDefaultHeight + 'px';
    }
  });
});
