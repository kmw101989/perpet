// 하단바 네비게이션 기능
document.addEventListener('DOMContentLoaded', function() {
  // 현재 페이지 경로 확인
  const currentPath = window.location.pathname;
  
  // 하단바 너비를 body의 실제 너비에 맞춤
  function updateTabbarWidth() {
    const body = document.body;
    const tabbar = document.querySelector('.tabbar');
    if (body && tabbar) {
      const bodyMaxWidth = window.getComputedStyle(body).maxWidth;
      
      // body의 max-width가 설정되어 있으면 그 값을 사용
      if (bodyMaxWidth && bodyMaxWidth !== 'none') {
        // 'px' 제거하고 숫자로 변환
        const maxWidthValue = parseFloat(bodyMaxWidth);
        tabbar.style.maxWidth = maxWidthValue + 'px';
      } else {
        // max-width가 없으면 body의 실제 너비 사용
        const bodyWidth = body.offsetWidth;
        tabbar.style.maxWidth = bodyWidth + 'px';
      }
    }
  }
  
  // 즉시 초기 너비 설정 (DOMContentLoaded 전에 실행)
  if (document.body && document.querySelector('.tabbar')) {
    updateTabbarWidth();
  }
  
  // DOMContentLoaded 후에도 한 번 더 확인
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      updateTabbarWidth();
    });
  } else {
    // 이미 로드된 경우 즉시 실행
    updateTabbarWidth();
  }
  
  // 리사이즈 이벤트 리스너
  window.addEventListener('resize', updateTabbarWidth);
  
  // DOM 변경 감지 (MutationObserver를 사용하여 body의 스타일 변경 감지)
  const observer = new MutationObserver(updateTabbarWidth);
  if (document.body) {
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['style', 'class']
    });
  }
  
  // 슬라이딩 배경 요소 생성
  const tabbarTabs = document.querySelector('.tabbar-tabs');
  let slider = document.querySelector('.tab-slider');
  if (tabbarTabs && !slider) {
    slider = document.createElement('div');
    slider.className = 'tab-slider';
    tabbarTabs.appendChild(slider);
  }
  
  // 슬라이더 위치 업데이트 함수 (아래에서 위로 차오르는 애니메이션)
  function updateSliderPosition(activeItem, animate = true) {
    const slider = document.querySelector('.tab-slider');
    if (!slider || !activeItem) return;
    
    const tabbarTabs = document.querySelector('.tabbar-tabs');
    if (!tabbarTabs) return;
    
    const tabsRect = tabbarTabs.getBoundingClientRect();
    const itemRect = activeItem.getBoundingClientRect();
    
    const left = itemRect.left - tabsRect.left;
    const width = itemRect.width;
    
    if (animate) {
      // 위치와 너비 설정
      slider.style.left = left + 'px';
      slider.style.width = width + 'px';
      // showing 클래스로 아래에서 위로 차오르는 애니메이션
      slider.classList.remove('hiding');
      slider.classList.add('showing');
    } else {
      // 애니메이션 없이 즉시 설정
      slider.style.transition = 'none';
      slider.style.left = left + 'px';
      slider.style.width = width + 'px';
      slider.classList.remove('hiding');
      slider.classList.add('showing');
      // transition 복원
      setTimeout(() => {
        slider.style.transition = '';
      }, 50);
    }
  }
  
  // 초기 위치 설정 (애니메이션 없이)
  function setInitialSliderPosition(activeItem) {
    const slider = document.querySelector('.tab-slider');
    if (!slider || !activeItem) return;
    
    const tabbarTabs = document.querySelector('.tabbar-tabs');
    if (!tabbarTabs) return;
    
    const tabsRect = tabbarTabs.getBoundingClientRect();
    const itemRect = activeItem.getBoundingClientRect();
    
    const left = itemRect.left - tabsRect.left;
    const width = itemRect.width;
    
    // transition 비활성화 클래스 추가
    slider.classList.add('no-transition');
    slider.classList.remove('transition-transform', 'transition-all');
    
    // 위치와 너비 설정
    slider.style.left = left + 'px';
    slider.style.width = width + 'px';
    
    // transform을 scaleY(1)로 설정 (완전히 보이도록)
    slider.style.transform = 'scaleY(1)';
    
    // 클래스 정리
    slider.classList.remove('hiding');
    slider.classList.add('showing', 'initialized');
    
    // 강제 리플로우
    void slider.offsetHeight;
    
    // 짧은 딜레이 후 transition 클래스 제거 (CSS 기본값 사용)
    setTimeout(() => {
      slider.classList.remove('no-transition');
    }, 50);
  }
  
  // 페이지별 활성화할 탭 결정
  function getActiveTab() {
    if (currentPath.includes('mall') || currentPath.includes('shop.html')) {
      return 'mall';
    } else if (currentPath.includes('hospital')) {
      return 'hospital';
    } else if (currentPath.includes('website') || currentPath.includes('index.html')) {
      return 'home';
    } else if (currentPath.includes('consultation')) {
      return 'consultation';
    } else if (currentPath.includes('community')) {
      return 'community';
    }
    return 'home'; // 기본값
  }
  
  // 탭바 아이템 선택
  const tabItems = document.querySelectorAll('.tab-item');
  
  // 현재 페이지에 맞는 탭 활성화
  const activeTab = getActiveTab();
  let activeItem = null;
  
  tabItems.forEach(item => {
    const tabLabel = item.querySelector('.tab-label').textContent.trim();
    let shouldBeActive = false;
    
    switch(activeTab) {
      case 'mall':
        shouldBeActive = tabLabel === '자사몰';
        break;
      case 'hospital':
        shouldBeActive = tabLabel === '병원';
        break;
      case 'home':
        shouldBeActive = tabLabel === '홈';
        break;
      case 'consultation':
        shouldBeActive = tabLabel === '수의사';
        break;
      case 'community':
        shouldBeActive = tabLabel === '커뮤니티';
        break;
    }
    
    if (shouldBeActive) {
      item.classList.add('active');
      activeItem = item;
    } else {
      item.classList.remove('active');
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
    window.addEventListener('resize', () => {
      updateSliderPosition(activeItem, false);
    });
  }
  
  // 탭 클릭 시 슬라이더 이동 및 페이지 이동
  tabItems.forEach(item => {
    item.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      
      const tabLabel = this.querySelector('.tab-label').textContent.trim();
      let targetUrl = '';
      
      switch(tabLabel) {
        case '자사몰':
          targetUrl = '../mall/shop.html';
          break;
        case '병원':
          targetUrl = '../hospital/hospital-compare.html';
          break;
        case '홈':
          targetUrl = '../website/index.html';
          break;
        case '수의사':
          targetUrl = '../consultation_main/consultation.html';
          break;
        case '커뮤니티':
          targetUrl = '../community_main/community.html';
          break;
      }
      
      // 같은 페이지면 이동하지 않음
      if (!targetUrl || currentPath.includes(targetUrl.replace('../', '').replace('/', ''))) {
        return;
      }
      
      // 현재 활성화된 탭 찾기
      const currentActive = document.querySelector('.tab-item.active');
      if (currentActive && currentActive !== this) {
        const slider = document.querySelector('.tab-slider');
        if (slider) {
          // 클릭한 탭의 위치 계산
          const tabbarTabs = document.querySelector('.tabbar-tabs');
          if (!tabbarTabs) {
            window.location.href = targetUrl;
            return;
          }
          
          // 슬라이더가 초기화되지 않았으면 초기화
          if (!slider.classList.contains('initialized')) {
            setInitialSliderPosition(currentActive);
          }
          
          // 슬라이더가 보이지 않으면 보이게 설정
          if (!slider.classList.contains('initialized')) {
            slider.classList.add('initialized');
            slider.style.opacity = '1';
          }
          
          const tabsRect = tabbarTabs.getBoundingClientRect();
          const currentRect = currentActive.getBoundingClientRect();
          const newRect = this.getBoundingClientRect();
          
          const currentLeft = currentRect.left - tabsRect.left;
          const currentWidth = currentRect.width;
          const newLeft = newRect.left - tabsRect.left;
          const newWidth = newRect.width;
          
          // 현재 슬라이더의 실제 위치 확인
          const sliderRect = slider.getBoundingClientRect();
          const sliderCurrentLeft = sliderRect.left - tabsRect.left;
          const sliderCurrentWidth = sliderRect.width;
          
          // 기존 탭의 배경이 아래로 사라지는 애니메이션
          // transition 클래스 설정
          slider.classList.remove('no-transition', 'transition-all');
          slider.classList.add('transition-transform');
          
          // 현재 상태를 브라우저에 알림
          void slider.offsetHeight;
          
          // 다음 프레임에서 transform을 scaleY(0)으로 설정 (애니메이션 적용)
          requestAnimationFrame(() => {
            slider.style.transform = 'scaleY(0)';
          });
          
          // 클릭한 탭을 임시로 활성화
          currentActive.classList.remove('active');
          this.classList.add('active');
          
          // 기존 배경이 사라진 후 새 탭의 배경이 아래에서부터 차오르는 애니메이션
          setTimeout(() => {
            // 위치와 너비 설정 (애니메이션 없이 즉시)
            slider.classList.remove('transition-transform', 'transition-all');
            slider.classList.add('no-transition');
            slider.style.left = newLeft + 'px';
            slider.style.width = newWidth + 'px';
            slider.style.transform = 'scaleY(0)';
            
            // 강제 리플로우
            void slider.offsetHeight;
            
            // transition 클래스를 transform만 적용하도록 변경
            slider.classList.remove('no-transition');
            slider.classList.add('transition-transform');
            
            // 다음 프레임에서 scaleY(1)로 변경 (아래에서 위로 차오르는 애니메이션)
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                slider.style.transform = 'scaleY(1)';
                
                // 애니메이션이 완료된 후 페이지 이동 (300ms 후)
                setTimeout(() => {
                  window.location.href = targetUrl;
                }, 300);
              });
            });
          }, 300);
          
          // 페이지 이동을 여기서 하지 않고 애니메이션 완료 후에 하도록 변경
          return; // 이벤트 핸들러 종료
        }
      }
      
      // 현재 활성화된 탭이 없거나 같은 탭을 클릭한 경우, 또는 slider가 없는 경우 바로 이동
      window.location.href = targetUrl;
    });
  });
});


