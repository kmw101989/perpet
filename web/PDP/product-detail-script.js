// URL 파라미터에서 제품 ID 가져오기
function getProductIdFromURL() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get("id");
}

// 제품 정보 로드 및 표시
async function loadProductDetail() {
  const productId = getProductIdFromURL();

  if (!productId) {
    console.error("제품 ID가 없습니다.");
    return;
  }

  // Supabase 스크립트 로드 확인
  if (typeof SupabaseService === "undefined") {
    console.error("SupabaseService가 로드되지 않았습니다.");
    return;
  }

  try {
    const product = await SupabaseService.getProductById(productId);

    if (!product) {
      console.error("제품을 찾을 수 없습니다.");
      return;
    }

    console.log("제품 정보 로드 완료:", product);

    // 제품 정보 표시
    displayProductInfo(product);
  } catch (error) {
    console.error("제품 정보 로드 실패:", error);
  }
}

// 제품 정보를 DOM에 표시
function displayProductInfo(product) {
  // 제품 이미지
  const productImage = document.querySelector(".product-image");
  if (productImage && product.product_img) {
    productImage.style.backgroundImage = `url('${product.product_img}')`;
    productImage.style.backgroundSize = "cover";
    productImage.style.backgroundPosition = "center";
  }

  // 브랜드명
  const brandName = document.querySelector(".brand-name");
  if (brandName) {
    brandName.textContent = product.brand || "";
  }

  // 상품명
  const productName = document.querySelector(
    ".product-info-section .product-name"
  );
  if (productName) {
    productName.textContent = product.product_name || "";
  }

  // 평점 및 리뷰 (문자열일 수 있으므로 숫자로 변환)
  const ratingStars = document.querySelector(".rating-section .rating-stars");
  const ratingReviews = document.querySelector(
    ".rating-section .rating-reviews"
  );
  if (ratingStars) {
    const rating = product.rating ? parseFloat(product.rating) : 0;
    ratingStars.textContent = rating > 0 ? "★".repeat(Math.round(rating)) : "0";
  }
  if (ratingReviews) {
    const reviewCount = product.review_count
      ? parseInt(product.review_count, 10)
      : 0;
    ratingReviews.textContent = `리뷰 ${reviewCount}`;
  }

  // 가격 정보 (discount_percent는 null일 수 있음)
  const discountPercent = product.discount_percent
    ? parseFloat(product.discount_percent)
    : 0;
  const currentPrice = product.current_price
    ? parseFloat(product.current_price)
    : 0;
  const originalPrice = product.original_price
    ? parseFloat(product.original_price)
    : currentPrice;

  const discountSpan = document.querySelector(".price-row .discount");
  const originalPriceSpan = document.querySelector(
    ".price-row .original-price"
  );
  const salePriceDiv = document.querySelector(".sale-price");

  if (discountSpan && discountPercent > 0) {
    discountSpan.textContent = `${Math.round(discountPercent)}%`;
    discountSpan.style.display = "inline";
  } else if (discountSpan) {
    discountSpan.style.display = "none";
  }

  if (originalPriceSpan) {
    if (
      discountPercent > 0 &&
      originalPrice &&
      originalPrice !== currentPrice
    ) {
      originalPriceSpan.textContent = `${originalPrice.toLocaleString()}원`;
      originalPriceSpan.style.display = "inline";
    } else {
      originalPriceSpan.style.display = "none";
    }
  }

  if (salePriceDiv) {
    salePriceDiv.textContent = `${currentPrice.toLocaleString()}원`;
  }

  // 페이지 제목 업데이트
  document.title = `${product.product_name || "상품 상세"} - 퍼펫트`;
}

// 반려동물 정보 로드 함수
async function loadPetInfo() {
  try {
    // 먼저 localStorage에서 선택된 반려동물 확인
    const selectedPetData = localStorage.getItem("selectedPetData");
    let selectedPet = null;

    if (selectedPetData) {
      selectedPet = JSON.parse(selectedPetData);
    } else {
      // localStorage에 없으면 DB에서 가져오기
      const userId = localStorage.getItem("userId");
      if (!userId) {
        console.warn("userId가 없어 반려동물 정보를 불러올 수 없습니다.");
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
        if (selectedPetId) {
          selectedPet = sorted.find(
            (p) => String(p.pet_id) === String(selectedPetId)
          );
        }

        if (!selectedPet) {
          selectedPet = sorted[0];
        }
      }
    }

    if (selectedPet) {
      // 반려동물 이름 표시
      const petNameEl = document.getElementById("petNameDisplay");
      if (petNameEl) {
        petNameEl.textContent = selectedPet.pet_name || "";
      }

      // 반려동물 나이 및 품종 표시
      const petAgeEl = document.getElementById("petAgeDisplay");
      if (petAgeEl) {
        const age = selectedPet.pet_age || "";
        const breed = selectedPet.pet_breed || selectedPet.breed || "";
        const detailedSpecies = selectedPet.detailed_species || "";

        let ageText = "";
        if (age) {
          ageText = `${age}살`;
        }

        let breedText = "";
        if (detailedSpecies) {
          breedText = detailedSpecies;
        } else if (breed) {
          breedText = breed;
        }

        if (ageText && breedText) {
          petAgeEl.textContent = `${ageText} / ${breedText}`;
        } else if (ageText) {
          petAgeEl.textContent = ageText;
        } else if (breedText) {
          petAgeEl.textContent = breedText;
        }
      }

      // 반려동물 이미지 표시
      const petImageEl = document.querySelector(".pet-info .pet-image");
      if (petImageEl) {
        if (selectedPet.pet_img) {
          petImageEl.style.backgroundImage = `url('${selectedPet.pet_img}')`;
          petImageEl.style.backgroundSize = "cover";
          petImageEl.style.backgroundPosition = "center";
        } else {
          // 이미지가 없으면 랜덤 이미지 사용
          const randomImageUrl = `https://picsum.photos/seed/${
            selectedPet.pet_id || "pet"
          }/100/100`;
          petImageEl.style.backgroundImage = `url('${randomImageUrl}')`;
          petImageEl.style.backgroundSize = "cover";
          petImageEl.style.backgroundPosition = "center";
        }
      }
    }
  } catch (error) {
    console.error("반려동물 정보 로드 오류:", error);
  }
}

// 페이지 로드 시 제품 정보 로드
document.addEventListener("DOMContentLoaded", async function () {
  // 반려동물 정보 로드
  await loadPetInfo();

  // 이전 버튼 클릭 이벤트
  const backIcon = document.querySelector(".back-icon");
  if (backIcon) {
    backIcon.addEventListener("click", function () {
      // 이전 페이지로 돌아가기
      if (document.referrer && document.referrer !== window.location.href) {
        window.history.back();
      } else {
        // referrer가 없거나 같은 페이지인 경우 자사몰 페이지로 이동
        window.location.href = "../mall/shop.html";
      }
    });
  }

  // 제품 정보 로드
  await loadProductDetail();

  // 탭바 아이템 클릭 이벤트 (탭바가 있는 경우)
  const tabItems = document.querySelectorAll(".tab-item");

  tabItems.forEach((item) => {
    item.addEventListener("click", function () {
      // 모든 탭에서 active 클래스 제거
      tabItems.forEach((tab) => tab.classList.remove("active"));
      // 클릭한 탭에 active 클래스 추가
      this.classList.add("active");
    });
  });

  // 장바구니 버튼 클릭 이벤트
  const cartButton = document.querySelector(".cart-button");
  if (cartButton) {
    cartButton.addEventListener("click", function () {
      // 장바구니 기능 구현
      console.log("장바구니에 추가");
    });
  }

  // 구매 버튼 클릭 이벤트
  const purchaseButton = document.querySelector(".purchase-button");
  if (purchaseButton) {
    purchaseButton.addEventListener("click", function () {
      // 구매 기능 구현
      console.log("바로 구매");
    });
  }

  // 자세히 버튼 클릭 이벤트
  const ingredientMore = document.querySelector(".ingredient-more");
  if (ingredientMore) {
    ingredientMore.addEventListener("click", function () {
      // 성분 상세 정보 표시
      console.log("성분 상세 정보");
    });
  }
});
