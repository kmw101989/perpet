// 카테고리 탭 클릭 이벤트
document.addEventListener('DOMContentLoaded', function() {
  const categoryTabs = document.querySelectorAll('.category-tab');
  
  categoryTabs.forEach(tab => {
    tab.addEventListener('click', function() {
      // 모든 탭에서 active 클래스 제거
      categoryTabs.forEach(t => t.classList.remove('active'));
      // 클릭한 탭에 active 클래스 추가
      this.classList.add('active');
    });
  });
  
  // 필터 버튼 클릭 이벤트
  const filterButton = document.getElementById('filterButton');
  const filterDropdown = document.getElementById('filterDropdown');
  const filterText = document.getElementById('filterText');
  const filterOptions = document.querySelectorAll('.filter-option');
  
  if (filterButton && filterDropdown) {
    // 필터 버튼 클릭 시 드롭다운 토글
    filterButton.addEventListener('click', function(e) {
      e.stopPropagation();
      filterDropdown.classList.toggle('show');
      filterButton.classList.toggle('active');
    });
    
    // 필터 옵션 선택
    filterOptions.forEach(option => {
      option.addEventListener('click', function(e) {
        e.stopPropagation();
        
        // 모든 옵션에서 active 클래스 제거
        filterOptions.forEach(opt => opt.classList.remove('active'));
        
        // 선택한 옵션에 active 클래스 추가
        this.classList.add('active');
        
        // 필터 텍스트 업데이트
        const value = this.getAttribute('data-value');
        let text = '';
        if (value === 'latest') {
          text = '최신순';
        } else if (value === 'popular') {
          text = '인기도순';
        } else if (value === 'accuracy') {
          text = '정확도순';
        }
        filterText.textContent = text;
        
        // 드롭다운 닫기
        filterDropdown.classList.remove('show');
        filterButton.classList.remove('active');
        
        // 필터 적용 (추후 구현)
        console.log('필터 적용:', value);
      });
    });
    
    // 외부 클릭 시 드롭다운 닫기
    document.addEventListener('click', function(e) {
      if (!filterButton.contains(e.target) && !filterDropdown.contains(e.target)) {
        filterDropdown.classList.remove('show');
        filterButton.classList.remove('active');
      }
    });
  }
  
  // 탭바 아이템 클릭 이벤트
  const tabItems = document.querySelectorAll('.tab-item');
  
  tabItems.forEach(item => {
    item.addEventListener('click', function() {
      // 모든 탭에서 active 클래스 제거
      tabItems.forEach(tab => tab.classList.remove('active'));
      // 클릭한 탭에 active 클래스 추가
      this.classList.add('active');
    });
  });
  
  // 게시글 카드 클릭 이벤트
  const postCards = document.querySelectorAll('.post-card');
  
  postCards.forEach(card => {
    card.addEventListener('click', function() {
      // 게시글 상세 페이지로 이동 (추후 구현)
      console.log('게시글 상세');
    });
  });
});

