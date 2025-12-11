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
  
  // 섹션 탭 클릭 이벤트
  const sectionTabs = document.querySelectorAll('.section-tab');
  
  sectionTabs.forEach(tab => {
    tab.addEventListener('click', function() {
      // 같은 섹션 내의 모든 탭에서 active 클래스 제거
      const section = this.closest('.recommendation-section');
      const tabsInSection = section.querySelectorAll('.section-tab');
      tabsInSection.forEach(t => t.classList.remove('active'));
      // 클릭한 탭에 active 클래스 추가
      this.classList.add('active');
    });
  });
  
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
  
  // 제품 카드 클릭 이벤트 - PDP 페이지로 이동
  const productCards = document.querySelectorAll('.product-card-small, .product-card-large');
  
  productCards.forEach(card => {
    card.style.cursor = 'pointer';
    card.addEventListener('click', function() {
      window.location.href = '../PDP/product-detail.html';
    });
  });
});


