// 카테고리 탭 클릭 이벤트
document.addEventListener("DOMContentLoaded", function () {
  const categoryTabs = document.querySelectorAll(".category-tab");

  categoryTabs.forEach((tab) => {
    tab.addEventListener("click", function () {
      // 모든 탭에서 active 클래스 제거
      categoryTabs.forEach((t) => t.classList.remove("active"));
      // 클릭한 탭에 active 클래스 추가
      this.classList.add("active");
    });
  });

  // 필터 버튼 클릭 이벤트
  const filterButton = document.getElementById("filterButton");
  const filterDropdown = document.getElementById("filterDropdown");
  const filterText = document.getElementById("filterText");
  const filterOptions = document.querySelectorAll(".filter-option");

  if (filterButton && filterDropdown) {
    // 필터 버튼 클릭 시 드롭다운 토글
    filterButton.addEventListener("click", function (e) {
      e.stopPropagation();
      filterDropdown.classList.toggle("show");
      filterButton.classList.toggle("active");
    });

    // 필터 옵션 선택
    filterOptions.forEach((option) => {
      option.addEventListener("click", function (e) {
        e.stopPropagation();

        // 모든 옵션에서 active 클래스 제거
        filterOptions.forEach((opt) => opt.classList.remove("active"));

        // 선택한 옵션에 active 클래스 추가
        this.classList.add("active");

        // 필터 텍스트 업데이트
        const value = this.getAttribute("data-value");
        let text = "";
        if (value === "latest") {
          text = "최신순";
        } else if (value === "popular") {
          text = "인기도순";
        } else if (value === "accuracy") {
          text = "정확도순";
        }
        filterText.textContent = text;

        // 드롭다운 닫기
        filterDropdown.classList.remove("show");
        filterButton.classList.remove("active");

        // 필터 적용 (추후 구현)
        console.log("필터 적용:", value);
      });
    });

    // 외부 클릭 시 드롭다운 닫기
    document.addEventListener("click", function (e) {
      if (
        !filterButton.contains(e.target) &&
        !filterDropdown.contains(e.target)
      ) {
        filterDropdown.classList.remove("show");
        filterButton.classList.remove("active");
      }
    });
  }

  // 탭바 아이템 클릭 이벤트
  const tabItems = document.querySelectorAll(".tab-item");

  tabItems.forEach((item) => {
    item.addEventListener("click", function () {
      // 모든 탭에서 active 클래스 제거
      tabItems.forEach((tab) => tab.classList.remove("active"));
      // 클릭한 탭에 active 클래스 추가
      this.classList.add("active");
    });
  });

  // 게시글 카드 클릭 이벤트
  const postCards = document.querySelectorAll(".post-card");

  postCards.forEach((card) => {
    card.addEventListener("click", function () {
      // 게시글 상세 페이지로 이동 (추후 구현)
      console.log("게시글 상세");
    });
  });

  // 게시글 이미지 고정 삽입 (com_dog SVG 파일 사용)
  function loadPostImages() {
    const postImages = document.querySelectorAll(".post-image");
    console.log("게시글 이미지 요소 개수:", postImages.length);

    if (postImages.length === 0) {
      console.warn("⚠️ .post-image 요소를 찾을 수 없습니다.");
      return;
    }

    // com_dog SVG 파일 배열 (게시글 4개에 고정으로 할당)
    const dogSvgFiles = [
      "../svg/com_dog01.svg",
      "../svg/com_dog02.svg",
      "../svg/com_dog03.svg",
      "../svg/com_dog04.svg",
    ];

    // 게시글이 4개이므로 각각 고정으로 할당
    postImages.forEach((img, index) => {
      // 4개까지만 처리
      if (index >= dogSvgFiles.length) {
        return;
      }

      // 각 게시글에 고정으로 이미지 할당 (1번째: 01, 2번째: 02, 3번째: 03, 4번째: 04)
      const selectedSvg = dogSvgFiles[index];

      // SVG 이미지 로드
      img.style.backgroundImage = `url('${selectedSvg}')`;
      img.style.backgroundSize = "cover";
      img.style.backgroundPosition = "center";
      img.style.backgroundRepeat = "no-repeat";

      console.log(`✅ 게시글 이미지 ${index + 1} 로드:`, selectedSvg);
    });
  }

  // 이미지 로드 실행
  loadPostImages();
});
