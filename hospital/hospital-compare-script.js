// 네이버 지도 초기화 및 병원 마커 표시
let map = null;
let markers = [];
let hospitals = []; // Supabase에서 가져온 병원 데이터
let allHospitals = []; // 전체 병원 데이터 (필터링 전)
let currentCategoryId = null; // 현재 선택된 카테고리 ID (기본값: null = 종합관리)

// 카테고리 이름을 ID로 매핑
const categoryMap = {
  '종합관리': null, // null은 전체 조회
  '심장': 1,
  '간': 2,
  '위/장': 3,
  '피부': 4,
  '치아': 5,
  '뼈/관절': 6,
  '눈': 7,
  '면역력': 8,
  '행동': 9,
  '신장/방광': 10
};

// 카테고리 ID를 이름으로 역매핑
const categoryIdToName = {
  null: '종합관리',
  1: '심장',
  2: '간',
  3: '위/장',
  4: '피부',
  5: '치아',
  6: '뼈/관절',
  7: '눈',
  8: '면역력',
  9: '행동',
  10: '신장/방광'
};

// Supabase에서 병원 데이터 가져오기
async function loadHospitalsFromSupabase() {
  try {
    console.log('Supabase에서 병원 데이터 로드 시작...');
    
    if (typeof SupabaseService === 'undefined') {
      console.error('SupabaseService가 로드되지 않았습니다.');
      return [];
    }
    
    // Supabase 클라이언트 직접 사용하여 디버깅
    try {
      const client = await getSupabaseClient();
      console.log('Supabase 클라이언트 확인:', client ? 'OK' : 'FAIL');
      
      // 직접 쿼리 실행하여 에러 확인
      const { data: testData, error: testError } = await client
        .from('hospitals')
        .select('*')
        .limit(5);
      
      if (testError) {
        console.error('Supabase 쿼리 에러:', testError);
        console.error('에러 코드:', testError.code);
        console.error('에러 메시지:', testError.message);
        console.error('에러 상세:', testError);
        
        if (testError.code === '42501' || testError.message?.includes('row-level security')) {
          console.error('⚠️ RLS 정책 위반 오류입니다.');
          console.error('Supabase Dashboard에서 hospitals 테이블의 SELECT 정책을 설정해주세요.');
        }
        return [];
      }
      
      console.log('직접 쿼리 테스트 결과:', testData);
    } catch (directError) {
      console.error('직접 쿼리 실행 중 오류:', directError);
    }
    
    // SupabaseService를 통한 데이터 가져오기
    const hospitalData = await SupabaseService.getHospitals(null, null, 100);
    console.log('가져온 병원 데이터:', hospitalData);
    console.log('병원 데이터 개수:', hospitalData?.length || 0);
    
    if (!hospitalData || hospitalData.length === 0) {
      console.warn('⚠️ 병원 데이터가 없습니다.');
      console.warn('가능한 원인:');
      console.warn('1. Supabase 테이블에 데이터가 없음');
      console.warn('2. RLS 정책으로 인해 데이터 조회 불가');
      console.warn('3. 테이블 이름 또는 컬럼 이름 불일치');
      return [];
    }
    
    // 데이터 변환 및 좌표 처리
    const processedHospitals = hospitalData.map(hospital => {
      // lat, lng가 있으면 사용, 없으면 null
      const lat = hospital.lat || hospital.latitude || null;
      const lng = hospital.lng || hospital.longitude || null;
      
      return {
        hospital_id: hospital.hospital_id,
        name: hospital.hospital_name,
        address: hospital.address,
        city: hospital.city,
        phone: hospital.hospital_phone,
        review_count: hospital.review_count,
        rating: hospital.rating,
        category_id: hospital.category_id,
        img: hospital.hospital_img,
        lat: lat,
        lng: lng
      };
    });
    
    console.log('처리된 병원 데이터:', processedHospitals);
    return processedHospitals;
  } catch (error) {
    console.error('병원 데이터 로드 실패:', error);
    return [];
  }
}

// 네이버 지도 API 콜백 함수 (전역 함수로 선언)
async function initNaverMap() {
  console.log('✅ initNaverMap 호출됨 - 네이버 지도 API 인증 성공');
  window.naverMapCallbackCalled = true; // 콜백 호출됨을 표시
  
  // Supabase에서 병원 데이터 가져오기
  hospitals = await loadHospitalsFromSupabase();
  
  // 약간의 지연 후 지도 초기화 (DOM과 API가 완전히 로드되도록)
  setTimeout(function() {
    try {
      console.log('지도 초기화 시작, naver 객체 체크:', typeof naver, typeof naver?.maps);
      // naver 객체가 있는지 다시 한 번 확인
      if (typeof naver === 'undefined' || typeof naver.maps === 'undefined') {
        console.warn('네이버 지도 API가 아직 로드되지 않았습니다.');
        showMapPlaceholder();
        return;
      }
      
      // naver.maps.Map이 함수인지 확인
      if (typeof naver.maps.Map !== 'function') {
        console.error('naver.maps.Map이 함수가 아닙니다.');
        showMapPlaceholder();
        return;
      }

      const mapContainer = document.getElementById('mapContainer');
      if (!mapContainer) {
        console.error('지도 컨테이너를 찾을 수 없습니다.');
        return;
      }

      // 지도 중심점 계산 (병원 데이터가 있으면 첫 번째 병원 위치, 없으면 강남)
      let centerLat = 37.5172;
      let centerLng = 127.0473;
      
      if (hospitals.length > 0) {
        // 좌표가 있는 병원 찾기
        const hospitalWithCoords = hospitals.find(h => h.lat && h.lng);
        if (hospitalWithCoords) {
          centerLat = hospitalWithCoords.lat;
          centerLng = hospitalWithCoords.lng;
        }
      }

      // 지도 초기화
      const mapOptions = {
        center: new naver.maps.LatLng(centerLat, centerLng),
        zoom: 14,
        zoomControl: true,
        zoomControlOptions: {
          position: naver.maps.Position.TOP_RIGHT
        }
      };
      
      map = new naver.maps.Map('mapContainer', mapOptions);
      
      // 병원 마커 추가
      let markerCount = 0;
      hospitals.forEach(hospital => {
        try {
          // 좌표가 있는 병원만 마커 표시
          if (hospital.lat && hospital.lng) {
            const marker = new naver.maps.Marker({
              position: new naver.maps.LatLng(hospital.lat, hospital.lng),
              map: map,
              title: hospital.name
            });
            
            // 마커 클릭 이벤트
            naver.maps.Event.addListener(marker, 'click', function() {
              console.log('병원 선택:', hospital.name);
              // 해당 병원 카드로 스크롤하는 기능 추가 가능
              scrollToHospitalCard(hospital.hospital_id);
            });
            
            markers.push({
              marker: marker,
              hospital: hospital
            });
            markerCount++;
          } else {
            console.warn('좌표가 없는 병원:', hospital.name, hospital.address);
          }
        } catch (markerError) {
          console.error('마커 생성 오류:', markerError, hospital);
        }
      });
      
      console.log(`네이버 지도 초기화 완료 - 총 ${hospitals.length}개 병원 중 ${markerCount}개 마커 표시`);
      
      // 전체 병원 데이터 저장
      allHospitals = [...hospitals];
      
      // 병원 카드 동적 생성
      renderHospitalCards();
    } catch (error) {
      console.error('지도 초기화 오류:', error);
      showMapPlaceholder();
    }
  }, 100);
}

// 지도 마커 업데이트
function updateMapMarkers() {
  if (!map) return;
  
  // 기존 마커 제거
  markers.forEach(m => m.marker.setMap(null));
  markers = [];
  
  // 필터링된 병원의 마커만 표시
  let markerCount = 0;
  hospitals.forEach(hospital => {
    try {
      if (hospital.lat && hospital.lng) {
        const marker = new naver.maps.Marker({
          position: new naver.maps.LatLng(hospital.lat, hospital.lng),
          map: map,
          title: hospital.name
        });
        
        naver.maps.Event.addListener(marker, 'click', function() {
          console.log('병원 선택:', hospital.name);
          scrollToHospitalCard(hospital.hospital_id);
        });
        
        markers.push({
          marker: marker,
          hospital: hospital
        });
        markerCount++;
      }
    } catch (markerError) {
      console.error('마커 생성 오류:', markerError, hospital);
    }
  });
  
  console.log(`마커 업데이트 완료 - ${markerCount}개 마커 표시`);
}

// 병원 카드로 스크롤
function scrollToHospitalCard(hospitalId) {
  const card = document.querySelector(`[data-hospital-id="${hospitalId}"]`);
  if (card) {
    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    // 하이라이트 효과
    card.style.transition = 'box-shadow 0.3s';
    card.style.boxShadow = '0 4px 12px rgba(2, 62, 140, 0.3)';
    setTimeout(() => {
      card.style.boxShadow = '';
    }, 2000);
  }
}

// 카테고리별 병원 필터링 및 정렬
function filterAndSortHospitals(categoryId) {
  let filtered = [...allHospitals];
  
  // 카테고리 필터링
  if (categoryId !== null) {
    // 해당 카테고리에 특화된 병원 찾기
    const specializedHospitals = filtered.filter(h => h.category_id === categoryId);
    // 나머지 병원들
    const otherHospitals = filtered.filter(h => h.category_id !== categoryId);
    
    // 특화 병원을 평점 순으로 정렬
    specializedHospitals.sort((a, b) => {
      const ratingA = a.rating || 0;
      const ratingB = b.rating || 0;
      return ratingB - ratingA;
    });
    
    // 나머지 병원도 평점 순으로 정렬
    otherHospitals.sort((a, b) => {
      const ratingA = a.rating || 0;
      const ratingB = b.rating || 0;
      return ratingB - ratingA;
    });
    
    // 특화 병원을 앞에, 나머지를 뒤에 배치
    filtered = [...specializedHospitals, ...otherHospitals];
  } else {
    // 전체 조회 시 평점 순으로 정렬
    filtered.sort((a, b) => {
      const ratingA = a.rating || 0;
      const ratingB = b.rating || 0;
      return ratingB - ratingA;
    });
  }
  
  return filtered;
}

// 병원 카드 동적 생성
function renderHospitalCards() {
  const hospitalList = document.querySelector('.hospital-list');
  if (!hospitalList) {
    console.warn('병원 리스트 컨테이너를 찾을 수 없습니다.');
    return;
  }
  
  // 기존 카드 제거 (하드코딩된 카드 제거)
  hospitalList.innerHTML = '';
  
  // 카테고리별 필터링 및 정렬
  const filteredHospitals = filterAndSortHospitals(currentCategoryId);
  
  if (filteredHospitals.length === 0) {
    hospitalList.innerHTML = '<div style="padding: 20px; text-align: center; color: #959595;">등록된 병원이 없습니다.</div>';
    return;
  }
  
  // 병원 카드 생성
  filteredHospitals.forEach((hospital, index) => {
    const card = document.createElement('div');
    card.className = 'hospital-card';
    card.setAttribute('data-hospital-id', hospital.hospital_id);
    
    const ratingValue = hospital.rating ? Math.round(hospital.rating * 20) : null;
    const heartIcon = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: inline-block; vertical-align: middle; margin-right: 2px;"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="#ff7777"/></svg>';
    const ratingText = ratingValue !== null ? `${heartIcon} 재진희망율 ${ratingValue}% (${hospital.review_count || 0})` : `${heartIcon} 재진희망율 -`;
    
    // 현재 선택된 카테고리에 특화된 병원인지 확인
    const isSpecialized = currentCategoryId !== null && hospital.category_id === currentCategoryId;
    
    // 카테고리 ID를 이름으로 변환
    const categoryName = hospital.category_id ? (categoryIdToName[hospital.category_id] || '') : '';
    
    card.innerHTML = `
      <div class="hospital-image" style="background-image: url('${hospital.img || ''}'); background-size: cover; background-position: center;"></div>
      <div class="hospital-info">
        <div class="hospital-header">
          <div class="hospital-name">${hospital.name || '병원명 없음'}</div>
          <div class="hospital-rating">${ratingText}</div>
        </div>
        <div class="hospital-details">
          ${hospital.city ? `<div class="detail-item">${hospital.city}</div>` : ''}
          <div class="detail-item">${hospital.address || '주소 없음'}</div>
          <div class="detail-item">${hospital.phone || '전화번호 없음'}</div>
          ${categoryName ? `<div class="detail-item">특화 분야: ${categoryName}</div>` : ''}
        </div>
        <div class="hospital-actions">
          <button class="action-btn primary">예약하기</button>
          <button class="action-btn secondary">상세정보</button>
        </div>
      </div>
      ${isSpecialized ? '<div class="hospital-badge">퍼펫트맞춤</div>' : ''}
    `;
    
    hospitalList.appendChild(card);
  });
  
  // 카드 이벤트 바인딩
  bindHospitalCardEvents();
}

// 지도 로딩 실패 시 플레이스홀더 표시
function showMapPlaceholder() {
  const mapContainer = document.getElementById('mapContainer');
  if (mapContainer) {
    mapContainer.innerHTML = `
      <div style="width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;background:linear-gradient(135deg, #a5d6a7 0%, #81c784 50%, #66bb6a 100%);color:#fff;font-family:'JejuGothic',sans-serif;">
        <div style="font-size:16px;margin-bottom:8px;">🗺️</div>
        <div style="font-size:14px;text-align:center;padding:0 20px;">
          지도를 불러올 수 없습니다
        </div>
      </div>
    `;
  }
}

// Bottom Sheet 드래그 기능
document.addEventListener('DOMContentLoaded', function() {
  const bottomSheet = document.getElementById('bottomSheet');
  const sheetHandle = document.getElementById('sheetHandle');
  const sheetContent = document.querySelector('.sheet-content');
  
  let isDragging = false;
  let startY = 0;
  let currentY = 0;
  let initialHeight = 0;
  
  // 시트의 높이 설정 (상/중/하)
  const minHeight = 200; // 하: 최소 높이 (px)
  const midHeight = window.innerHeight * 0.5; // 중: 50% 높이
  const maxHeight = window.innerHeight * 0.9; // 상: 최대 높이 (90vh)
  const defaultHeight = midHeight; // 기본 높이 (중간)
  
  // 초기 높이 설정 (중간)
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
    
    // 높이 제한 (하/중/상 범위 내)
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
    bottomSheet.style.transition = 'height 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
    
    const currentHeight = bottomSheet.offsetHeight;
    
    // 상/중/하 3단계로 스냅
    const threshold1 = (minHeight + midHeight) / 2; // 하와 중 사이
    const threshold2 = (midHeight + maxHeight) / 2; // 중과 상 사이
    
    if (currentHeight < threshold1) {
      // 하 (최소)
      bottomSheet.style.height = minHeight + 'px';
      bottomSheet.classList.add('collapsed');
      bottomSheet.classList.remove('mid');
      bottomSheet.classList.remove('expanded');
    } else if (currentHeight < threshold2) {
      // 중 (50%)
      bottomSheet.style.height = midHeight + 'px';
      bottomSheet.classList.add('mid');
      bottomSheet.classList.remove('collapsed');
      bottomSheet.classList.remove('expanded');
    } else {
      // 상 (최대)
      bottomSheet.style.height = maxHeight + 'px';
      bottomSheet.classList.add('expanded');
      bottomSheet.classList.remove('collapsed');
      bottomSheet.classList.remove('mid');
    }
    
    document.removeEventListener('mousemove', drag);
    document.removeEventListener('touchmove', drag);
    document.removeEventListener('mouseup', stopDrag);
    document.removeEventListener('touchend', stopDrag);
    
    e.preventDefault();
  }
  
  // 핸들 클릭으로 토글 (하 -> 중 -> 상 -> 하 순환)
  sheetHandle.addEventListener('click', function(e) {
    if (!isDragging) {
      const currentHeight = bottomSheet.offsetHeight;
      const threshold1 = (minHeight + midHeight) / 2;
      const threshold2 = (midHeight + maxHeight) / 2;
      
      if (currentHeight < threshold1) {
        // 하 -> 중
        bottomSheet.style.height = midHeight + 'px';
        bottomSheet.classList.add('mid');
        bottomSheet.classList.remove('collapsed');
        bottomSheet.classList.remove('expanded');
      } else if (currentHeight < threshold2) {
        // 중 -> 상
        bottomSheet.style.height = maxHeight + 'px';
        bottomSheet.classList.add('expanded');
        bottomSheet.classList.remove('collapsed');
        bottomSheet.classList.remove('mid');
      } else {
        // 상 -> 하
        bottomSheet.style.height = minHeight + 'px';
        bottomSheet.classList.add('collapsed');
        bottomSheet.classList.remove('expanded');
        bottomSheet.classList.remove('mid');
      }
    }
  });
  
  // 카테고리 탭 클릭 이벤트
  const categoryTabs = document.querySelectorAll('.category-tab');
  
  categoryTabs.forEach(tab => {
    tab.addEventListener('click', function() {
      categoryTabs.forEach(t => t.classList.remove('active'));
      this.classList.add('active');
      
      // 카테고리 이름으로 ID 찾기
      const categoryName = this.textContent.trim();
      currentCategoryId = categoryMap[categoryName] !== undefined ? categoryMap[categoryName] : null;
      
      console.log('카테고리 선택:', categoryName, 'ID:', currentCategoryId);
      
      // 병원 필터링 및 재렌더링
      const filteredHospitals = filterAndSortHospitals(currentCategoryId);
      hospitals = filteredHospitals;
      
      // 지도 마커 업데이트
      updateMapMarkers();
      
      // 병원 카드 재렌더링
      renderHospitalCards();
    });
  });
  
  // 24시간 필터 버튼 클릭 이벤트
  const filter24h = document.querySelector('.filter-24h');
  if (filter24h) {
    filter24h.addEventListener('click', function() {
      this.classList.toggle('active');
    });
  }
  
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
    const newMidHeight = window.innerHeight * 0.5;
    const newMaxHeight = window.innerHeight * 0.9;
    
    if (bottomSheet.classList.contains('expanded')) {
      bottomSheet.style.height = newMaxHeight + 'px';
    } else if (bottomSheet.classList.contains('mid')) {
      bottomSheet.style.height = newMidHeight + 'px';
    } else if (bottomSheet.classList.contains('collapsed')) {
      bottomSheet.style.height = minHeight + 'px';
    } else {
      // 기본값 (중간)
      bottomSheet.style.height = newMidHeight + 'px';
    }
  });
  
  // 초기 병원 카드 이벤트 바인딩 (하드코딩된 카드용)
  bindHospitalCardEvents();
});

// 병원 카드 이벤트 바인딩 함수
function bindHospitalCardEvents() {
  // 기존 이벤트 리스너 제거를 위해 이벤트 위임 방식 사용
  const hospitalList = document.querySelector('.hospital-list');
  if (!hospitalList) return;
  
  // 이벤트 위임: hospital-list에 이벤트 리스너 추가
  hospitalList.addEventListener('click', function(e) {
    const actionBtn = e.target.closest('.action-btn');
    const hospitalCard = e.target.closest('.hospital-card');
    
    if (actionBtn) {
      // 액션 버튼 클릭
      e.stopPropagation();
      const buttonText = actionBtn.textContent.trim();
      const hospitalId = hospitalCard ? hospitalCard.getAttribute('data-hospital-id') : null;
      
      console.log('액션 버튼 클릭:', buttonText, '병원 ID:', hospitalId);
      
      if (buttonText === '예약하기') {
        // 예약 페이지로 이동 (병원 ID 전달)
        if (hospitalId) {
          localStorage.setItem('selectedHospitalId', hospitalId);
          // 병원 정보도 함께 저장
          const hospital = hospitals.find(h => h.hospital_id == hospitalId);
          if (hospital) {
            localStorage.setItem('selectedHospital', JSON.stringify({
              hospital_id: hospital.hospital_id,
              hospital_name: hospital.name,
              address: hospital.address,
              phone: hospital.phone
            }));
          }
        }
        window.location.href = '../hospital_reservation/reservation.html';
      } else if (buttonText === '상세정보') {
        // 상세 정보 표시
        console.log('병원 상세 정보:', hospitalId);
        // TODO: 상세 정보 모달 또는 페이지 구현
      }
    } else if (hospitalCard && !actionBtn) {
      // 병원 카드 클릭 (버튼이 아닌 영역)
      const hospitalId = hospitalCard.getAttribute('data-hospital-id');
      console.log('병원 카드 클릭:', hospitalId);
      
      // 지도 중심을 해당 마커로 이동 (마커가 화면 상단 65% 위치에 오도록)
      if (hospitalId && map) {
        // 마커 데이터 찾기
        const markerData = markers.find(m => {
          // hospital_id를 문자열과 숫자 모두 비교
          const markerHospitalId = m.hospital.hospital_id;
          return markerHospitalId == hospitalId || String(markerHospitalId) === String(hospitalId);
        });
        
        // 지도 컨테이너의 실제 높이 가져오기
        const mapContainer = document.getElementById('mapContainer');
        const mapHeight = mapContainer ? mapContainer.offsetHeight : window.innerHeight;
        
        // 마커가 화면 하단에서 65% 올라온 지점에 오도록 계산
        // 하단에서 65% 올라온 지점 = 화면 높이의 65% 지점
        // 현재 중앙(50%)에서 아래로 15% 이동 필요 (65% - 50% = 15%)
        const targetOffsetPercent = 0.15; // 50% -> 65% = 15% 아래로 이동
        const offsetY = mapHeight * targetOffsetPercent; // 양수로 아래로 이동
        
        console.log('지도 이동 계산:', {
          mapHeight,
          offsetY,
          targetOffsetPercent,
          '계산된 오프셋(px)': offsetY
        });
        
        if (markerData && markerData.marker) {
          // 마커 위치 가져오기
          const markerPosition = markerData.marker.getPosition();
          
          // 줌 레벨 설정
          map.setZoom(16);
          
          // 마커 위치로 중심 이동 (오프셋 미리 적용하여 한 번에 이동)
          // 네이버 지도 API의 panTo를 사용하여 부드럽게 이동
          map.setCenter(markerPosition);
          
          // setCenter 직후 즉시 panBy를 실행하여 두 번 움직이는 것을 방지
          // 동기적으로 실행하여 애니메이션이 겹치지 않도록 함
          map.panBy(new naver.maps.Point(0, offsetY));
          console.log('지도 이동 완료, 오프셋:', offsetY, 'px');
        } else {
          // 마커가 없는 경우 (좌표가 없는 병원) - 병원 정보에서 직접 좌표 가져오기
          const hospital = hospitals.find(h => {
            const hId = h.hospital_id;
            return hId == hospitalId || String(hId) === String(hospitalId);
          });
          
          if (hospital && hospital.lat && hospital.lng) {
            // 좌표가 있으면 직접 지도 중심 이동
            const hospitalPosition = new naver.maps.LatLng(hospital.lat, hospital.lng);
            map.setZoom(16);
            map.setCenter(hospitalPosition);
            
            // setCenter 직후 즉시 panBy를 실행하여 두 번 움직이는 것을 방지
            map.panBy(new naver.maps.Point(0, offsetY));
            console.log('지도 이동 완료 (마커 없음), 오프셋:', offsetY, 'px');
          } else {
            console.warn('병원 좌표를 찾을 수 없습니다:', hospitalId);
          }
        }
      }
    }
  });
}
