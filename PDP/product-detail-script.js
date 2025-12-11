// 탭바 아이템 클릭 이벤트
document.addEventListener('DOMContentLoaded', function() {
  // 이전 버튼 클릭 이벤트
  const backIcon = document.querySelector('.back-icon');
  if (backIcon) {
    backIcon.addEventListener('click', function() {
      // 이전 페이지로 돌아가기
      // referrer가 있으면 history.back() 사용, 없으면 자사몰 페이지로 이동
      if (document.referrer && document.referrer !== window.location.href) {
        window.history.back();
      } else {
        // referrer가 없거나 같은 페이지인 경우 자사몰 페이지로 이동
        window.location.href = '../mall/shop.html';
      }
    });
  }
  
  const tabItems = document.querySelectorAll('.tab-item');
  
  tabItems.forEach(item => {
    item.addEventListener('click', function() {
      // 모든 탭에서 active 클래스 제거
      tabItems.forEach(tab => tab.classList.remove('active'));
      // 클릭한 탭에 active 클래스 추가
      this.classList.add('active');
    });
  });
  
  // 장바구니 버튼 클릭 이벤트
  const cartButton = document.querySelector('.cart-button');
  if (cartButton) {
    cartButton.addEventListener('click', function() {
      // 장바구니 기능 구현
      console.log('장바구니에 추가');
    });
  }
  
  // 구매 버튼 클릭 이벤트
  const purchaseButton = document.querySelector('.purchase-button');
  if (purchaseButton) {
    purchaseButton.addEventListener('click', function() {
      // 구매 기능 구현
      console.log('바로 구매');
    });
  }
  
  // 자세히 버튼 클릭 이벤트
  const ingredientMore = document.querySelector('.ingredient-more');
  if (ingredientMore) {
    ingredientMore.addEventListener('click', function() {
      // 성분 상세 정보 표시
      console.log('성분 상세 정보');
    });
  }
});


