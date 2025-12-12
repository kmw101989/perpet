// 카테고리 매핑 (텍스트 -> category_id)
const categoryMap = {
  '종합관리': 1,
  '심장': 2,
  '신장/방광': 3,
  '간': 4,
  '위/장': 5,
  '피부': 6,
  '치아': 7,
  '뼈/관절': 8,
  '눈': 9,
  '면역력': 10,
  '행동': 11
};

// 제품 타입 매핑
const productTypeMap = {
  '사료': '사료',
  '영양제': '영양제',
  '간식': '간식'
};

// 현재 선택된 카테고리와 제품 타입
let currentCategoryId = 1; // 기본값: 종합관리
let currentProductType = '사료'; // 기본값: 사료

// 제품 카드 생성 함수 (작은 카드)
function createProductCardSmall(product) {
  // discount_percent는 null일 수 있음
  const discountPercent = product.discount_percent ? parseFloat(product.discount_percent) : 0;
  const price = product.current_price ? parseFloat(product.current_price) : 0;
  // rating과 review_count는 문자열일 수 있으므로 숫자로 변환
  const rating = product.rating ? parseFloat(product.rating) : 0;
  const reviewCount = product.review_count ? parseInt(product.review_count, 10) : 0;
  const imageUrl = product.product_img || '';
  
  return `
    <div class="product-card-small" data-product-id="${product.product_id}">
      <div class="product-image-small" style="background-image: url('${imageUrl}'); background-size: cover; background-position: center;"></div>
      <div class="product-brand">${product.brand || ''}</div>
      <p class="product-name">${product.product_name || ''}</p>
      <div class="product-price">
        ${discountPercent > 0 ? `<span class="discount">${Math.round(discountPercent)}%</span>` : ''}
        <span class="price">${price.toLocaleString()}원</span>
      </div>
      <div class="product-rating">
        <span class="rating-stars">${rating > 0 ? '★'.repeat(Math.round(rating)) : '0'}</span>
        <span class="rating-reviews">리뷰 ${reviewCount}</span>
      </div>
    </div>
  `;
}

// 제품 카드 생성 함수 (큰 카드)
function createProductCardLarge(product) {
  // discount_percent는 null일 수 있음
  const discountPercent = product.discount_percent ? parseFloat(product.discount_percent) : 0;
  const price = product.current_price ? parseFloat(product.current_price) : 0;
  // rating과 review_count는 문자열일 수 있으므로 숫자로 변환
  const rating = product.rating ? parseFloat(product.rating) : 0;
  const reviewCount = product.review_count ? parseInt(product.review_count, 10) : 0;
  const imageUrl = product.product_img || '';
  
  return `
    <div class="product-card-large" data-product-id="${product.product_id}">
      <div class="product-image-large" style="background-image: url('${imageUrl}'); background-size: cover; background-position: center;"></div>
      <div class="product-brand">${product.brand || ''}</div>
      <p class="product-name">${product.product_name || ''}</p>
      <div class="product-price">
        ${discountPercent > 0 ? `<span class="discount">${Math.round(discountPercent)}%</span>` : ''}
        <span class="price">${price.toLocaleString()}원</span>
      </div>
      <div class="product-rating">
        <span class="rating-stars">${rating > 0 ? '★'.repeat(Math.round(rating)) : '0'}</span>
        <span class="rating-reviews">리뷰 ${reviewCount}</span>
      </div>
    </div>
  `;
}

// 제품 데이터 로드 및 표시 함수
async function loadProducts(sectionType = 'recommended') {
  try {
    if (sectionType === 'recommended') {
      // "내새꾸를 위한 냠냠 추천" 섹션 - 반려동물 기반 추천 알고리즘 사용
      const selectedPetId = localStorage.getItem('selectedPetId');
      const selectedPetData = localStorage.getItem('selectedPetData');
      
      console.log('=== 추천 제품 로드 시작 ===');
      console.log('selectedPetId:', selectedPetId);
      
      if (selectedPetData) {
        try {
          const petData = JSON.parse(selectedPetData);
          console.log('선택된 반려동물 정보:', {
            pet_id: petData.pet_id,
            pet_name: petData.pet_name,
            disease_id: petData.disease_id
          });
        } catch (e) {
          console.error('반려동물 데이터 파싱 실패:', e);
        }
      }
      
      if (!selectedPetId) {
        console.log('선택된 반려동물이 없습니다. 기본 제품을 표시합니다.');
        // 반려동물이 없으면 전체 제품 중 상위 3개 표시
        const products = await SupabaseService.getProducts(null, currentProductType, 3, 'rating');
        const container = document.querySelector('.recommendation-section:first-of-type .product-grid-small');
        if (container) {
          container.innerHTML = products.map(product => createProductCardSmall(product)).join('');
          attachProductCardEvents(container, 'small');
        }
        return;
      }

      // 추천 알고리즘 사용
      const recommendedProducts = await SupabaseService.getRecommendedProducts(selectedPetId, currentProductType, 3);
      console.log('추천 제품 로드 완료:', recommendedProducts);
      
      const container = document.querySelector('.recommendation-section:first-of-type .product-grid-small');
      if (container) {
        if (recommendedProducts.length > 0) {
          container.innerHTML = recommendedProducts.map(product => createProductCardSmall(product)).join('');
          attachProductCardEvents(container, 'small');
        } else {
          // 추천 제품이 없으면 전체 제품 중 상위 3개 표시
          console.log('추천 제품이 없어 기본 제품을 표시합니다.');
          const products = await SupabaseService.getProducts(null, currentProductType, 3, 'rating');
          container.innerHTML = products.map(product => createProductCardSmall(product)).join('');
          attachProductCardEvents(container, 'small');
        }
      }
    } else if (sectionType === 'category') {
      // "종합관리를 위한 냠냠" 섹션 - 현재 카테고리 기반, 순서대로 출력 (정렬 없음)
      const products = await SupabaseService.getProducts(currentCategoryId, currentProductType, 20, null);
      console.log(`제품 로드 완료 (${sectionType}):`, products);
      
      const container = document.querySelector('.recommendation-section:last-of-type .product-grid-large');
      if (container) {
        container.innerHTML = products.map(product => createProductCardLarge(product)).join('');
        attachProductCardEvents(container, 'large');
      }
      
      // 섹션 제목 업데이트
      const categoryName = Object.keys(categoryMap).find(key => categoryMap[key] === currentCategoryId) || '종합관리';
      const sectionTitle = document.querySelector('.recommendation-section:last-of-type .section-title');
      if (sectionTitle) {
        sectionTitle.textContent = `${categoryName}을 위한 냠냠`;
      }
    }
  } catch (error) {
    console.error('제품 로드 실패:', error);
  }
}

// 제품 카드 클릭 이벤트 연결
function attachProductCardEvents(container, cardType) {
  const cards = container.querySelectorAll(`.product-card-${cardType}`);
  cards.forEach(card => {
    card.style.cursor = 'pointer';
    card.addEventListener('click', function() {
      const productId = this.getAttribute('data-product-id');
      if (productId) {
        // PDP 페이지로 이동 (제품 ID 전달)
        window.location.href = `../PDP/product-detail.html?id=${productId}`;
      } else {
        window.location.href = '../PDP/product-detail.html';
      }
    });
  });
}

// 페이지 초기화
document.addEventListener('DOMContentLoaded', async function() {
  // Supabase 스크립트 로드 확인
  if (typeof SupabaseService === 'undefined') {
    console.error('SupabaseService가 로드되지 않았습니다.');
    return;
  }
  
  // 초기 제품 로드
  await loadProducts('recommended');
  await loadProducts('category');
  
  // 카테고리 탭 클릭 이벤트
  const categoryTabs = document.querySelectorAll('.category-tab');
  
  categoryTabs.forEach(tab => {
    tab.addEventListener('click', async function() {
      // 모든 탭에서 active 클래스 제거
      categoryTabs.forEach(t => t.classList.remove('active'));
      // 클릭한 탭에 active 클래스 추가
      this.classList.add('active');
      
      // 카테고리 ID 업데이트
      const categoryName = this.textContent.trim();
      currentCategoryId = categoryMap[categoryName] || 1;
      
      // 제품 다시 로드
      await loadProducts('category');
    });
  });
  
  // 섹션 탭 클릭 이벤트
  const sectionTabs = document.querySelectorAll('.section-tab');
  
  sectionTabs.forEach(tab => {
    tab.addEventListener('click', async function() {
      // 같은 섹션 내의 모든 탭에서 active 클래스 제거
      const section = this.closest('.recommendation-section');
      const tabsInSection = section.querySelectorAll('.section-tab');
      tabsInSection.forEach(t => t.classList.remove('active'));
      // 클릭한 탭에 active 클래스 추가
      this.classList.add('active');
      
      // 제품 타입 업데이트
      const productTypeText = this.textContent.trim();
      currentProductType = productTypeMap[productTypeText] || '사료';
      
      // 모든 섹션의 제품 다시 로드
      await loadProducts('recommended');
      await loadProducts('category');
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
});
