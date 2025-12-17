// 하단바 네비게이션 기능
document.addEventListener("DOMContentLoaded", function () {
  // 현재 페이지 경로 확인
  const currentPath = window.location.pathname;

  // 하단바 너비를 body의 실제 너비에 맞춤
  let lastTabbarWidth = null;
  function updateTabbarWidth() {
    const body = document.body;
    const tabbar = document.querySelector(".tabbar");
    if (body && tabbar) {
      // body의 max-width를 확인 (미디어 쿼리 적용 후)
      const bodyMaxWidth = window.getComputedStyle(body).maxWidth;
      let targetWidth = 390; // 기본값

      // body의 max-width가 설정되어 있으면 그 값을 사용
      if (bodyMaxWidth && bodyMaxWidth !== "none") {
        const maxWidthValue = parseFloat(bodyMaxWidth);
        // 큰 화면에서는 body의 max-width를 따르되, 최소 390px
        if (maxWidthValue > 390) {
          targetWidth = maxWidthValue;
        } else {
          targetWidth = 390;
        }
      } else {
        // max-width가 없으면 body의 실제 너비 사용 (최소 390px)
        const bodyWidth = body.offsetWidth;
        targetWidth = Math.max(bodyWidth, 390);
      }

      // 너비가 변경될 때만 업데이트 (깜빡임 방지)
      if (lastTabbarWidth !== targetWidth) {
        tabbar.style.maxWidth = targetWidth + "px";
        lastTabbarWidth = targetWidth;
      }
    }
  }

  // 초기 너비 설정 (즉시 실행)
  if (document.body && document.querySelector(".tabbar")) {
    updateTabbarWidth();
  }

  // DOMContentLoaded 후 한 번만 실행
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      // 약간의 딜레이를 주어 CSS 미디어 쿼리가 적용된 후 실행
      setTimeout(() => {
        updateTabbarWidth();
      }, 10);
    });
  } else {
    // 이미 로드된 경우 약간의 딜레이 후 실행
    setTimeout(() => {
      updateTabbarWidth();
    }, 10);
  }

  // 리사이즈 이벤트 리스너 (디바운싱)
  let resizeTimeout;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      updateTabbarWidth();
    }, 100);
  });

  // DOM 변경 감지 제거 (너무 자주 호출되어 깜빡임 발생)
  // MutationObserver는 제거하고 리사이즈만 사용

  // 슬라이딩 배경 요소 생성
  const tabbarTabs = document.querySelector(".tabbar-tabs");
  let slider = document.querySelector(".tab-slider");
  if (tabbarTabs && !slider) {
    slider = document.createElement("div");
    slider.className = "tab-slider";
    tabbarTabs.appendChild(slider);
  }

  // 슬라이더 위치 업데이트 함수 (아래에서 위로 차오르는 애니메이션)
  function updateSliderPosition(activeItem, animate = true) {
    const slider = document.querySelector(".tab-slider");
    if (!slider || !activeItem) return;

    const tabbarTabs = document.querySelector(".tabbar-tabs");
    if (!tabbarTabs) return;

    const tabsRect = tabbarTabs.getBoundingClientRect();
    const itemRect = activeItem.getBoundingClientRect();

    const left = itemRect.left - tabsRect.left;
    const width = itemRect.width;

    if (animate) {
      // 위치와 너비 설정
      slider.style.left = left + "px";
      slider.style.width = width + "px";
      // showing 클래스로 아래에서 위로 차오르는 애니메이션
      slider.classList.remove("hiding");
      slider.classList.add("showing");
    } else {
      // 애니메이션 없이 즉시 설정
      slider.style.transition = "none";
      slider.style.left = left + "px";
      slider.style.width = width + "px";
      slider.classList.remove("hiding");
      slider.classList.add("showing");
      // transition 복원
      setTimeout(() => {
        slider.style.transition = "";
      }, 50);
    }
  }

  // 초기 위치 설정 (애니메이션 없이)
  function setInitialSliderPosition(activeItem) {
    const slider = document.querySelector(".tab-slider");
    if (!slider || !activeItem) return;

    const tabbarTabs = document.querySelector(".tabbar-tabs");
    if (!tabbarTabs) return;

    const tabsRect = tabbarTabs.getBoundingClientRect();
    const itemRect = activeItem.getBoundingClientRect();

    const left = itemRect.left - tabsRect.left;
    const width = itemRect.width;

    // transition 비활성화 클래스 추가
    slider.classList.add("no-transition");
    slider.classList.remove("transition-transform", "transition-all");

    // 위치와 너비 설정
    slider.style.left = left + "px";
    slider.style.width = width + "px";

    // transform을 scaleY(1)로 설정 (완전히 보이도록)
    slider.style.transform = "scaleY(1)";

    // 클래스 정리
    slider.classList.remove("hiding");
    slider.classList.add("showing", "initialized");

    // 강제 리플로우
    void slider.offsetHeight;

    // 짧은 딜레이 후 transition 클래스 제거 (CSS 기본값 사용)
    setTimeout(() => {
      slider.classList.remove("no-transition");
    }, 50);
  }

  // 페이지별 활성화할 탭 결정
  function getActiveTab() {
    if (currentPath.includes("mall") || currentPath.includes("shop.html")) {
      return "mall";
    } else if (currentPath.includes("hospital")) {
      return "hospital";
    } else if (
      currentPath.includes("website") ||
      currentPath.includes("index.html")
    ) {
      return "home";
    } else if (currentPath.includes("consultation")) {
      return "consultation";
    } else if (currentPath.includes("community")) {
      return "community";
    }
    return "home"; // 기본값
  }

  // 탭바 아이템 선택
  const tabItems = document.querySelectorAll(".tab-item");

  // 현재 페이지에 맞는 탭 활성화
  const activeTab = getActiveTab();
  let activeItem = null;

  tabItems.forEach((item) => {
    const tabLabel = item.querySelector(".tab-label").textContent.trim();
    let shouldBeActive = false;

    switch (activeTab) {
      case "mall":
        shouldBeActive = tabLabel === "자사몰";
        break;
      case "hospital":
        shouldBeActive = tabLabel === "병원";
        break;
      case "home":
        shouldBeActive = tabLabel === "홈";
        break;
      case "consultation":
        shouldBeActive = tabLabel === "수의사";
        break;
      case "community":
        shouldBeActive = tabLabel === "커뮤니티";
        break;
    }

    if (shouldBeActive) {
      item.classList.add("active");
      activeItem = item;
    } else {
      item.classList.remove("active");
    }
  });

  // 초기 슬라이더 위치 설정 (애니메이션 없이)
  if (activeItem) {
    // 즉시 초기 위치 설정 (애니메이션 없이)
    setInitialSliderPosition(activeItem);

    // DOM이 완전히 렌더링된 후 위치 재확인 (레이아웃 변경 대비)
    setTimeout(() => {
      setInitialSliderPosition(activeItem);
    }, 100);

    // 윈도우 리사이즈 시 위치 업데이트
    window.addEventListener("resize", () => {
      updateSliderPosition(activeItem, false);
    });
  }

  // 탭 클릭 시 슬라이더 이동 및 페이지 이동
  tabItems.forEach((item) => {
    item.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();

      const tabLabel = this.querySelector(".tab-label").textContent.trim();
      let targetUrl = "";

      switch (tabLabel) {
        case "자사몰":
          targetUrl = "../mall/shop.html";
          break;
        case "병원":
          targetUrl = "../hospital/hospital-compare.html";
          break;
        case "홈":
          targetUrl = "../website/index.html";
          break;
        case "수의사":
          targetUrl = "../consultation_main/consultation.html";
          break;
        case "커뮤니티":
          targetUrl = "../community_main/community.html";
          break;
      }

      // 같은 페이지면 이동하지 않음
      if (
        !targetUrl ||
        currentPath.includes(targetUrl.replace("../", "").replace("/", ""))
      ) {
        return;
      }

      // 바로 페이지 이동
      window.location.href = targetUrl;
    });
  });
});
