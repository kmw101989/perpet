// Supabase에서 병원 이미지 가져오기
async function loadHospitalImage(hospitalName) {
  try {
    if (typeof SupabaseService === 'undefined') {
      console.warn('SupabaseService가 로드되지 않았습니다.');
      return null;
    }
    
    const client = await getSupabaseClient();
    const { data: hospitals, error } = await client
      .from('hospitals')
      .select('hospital_name, hospital_img');
    
    if (error) {
      console.error('병원 이미지 로드 실패:', error);
      return null;
    }
    
    // 부분 매칭으로 병원 찾기
    const matchedHospital = hospitals.find(hospital => {
      return hospital.hospital_name.includes(hospitalName) || 
             hospitalName.includes(hospital.hospital_name);
    });
    
    if (matchedHospital) {
      console.log(`병원 이미지 매칭 성공: ${hospitalName} → ${matchedHospital.hospital_name}`);
      return matchedHospital.hospital_img;
    } else {
      console.warn(`병원 이미지 매칭 실패: ${hospitalName}`);
      return null;
    }
  } catch (error) {
    console.error('병원 이미지 로드 중 오류:', error);
    return null;
  }
}

// 선택된 수의사 정보 로드 및 표시
async function loadVetInfo() {
  const vetInfoStr = localStorage.getItem('selectedVet');
  
  if (vetInfoStr) {
    const vetInfo = JSON.parse(vetInfoStr);
    
    // 헤더 정보 업데이트
    const vetHospital = document.querySelector('.vet-hospital');
    const vetRating = document.querySelector('.vet-rating');
    const vetName = vetInfo.name;
    
    if (vetHospital) {
      vetHospital.textContent = vetInfo.hospital;
    }
    
    if (vetRating) {
      vetRating.textContent = `⭐ ${vetInfo.satisfaction}`;
    }
    
    // 병원 이미지 로드 및 표시
    const hospitalImageUrl = await loadHospitalImage(vetInfo.hospital);
    const vetProfileImage = document.querySelector('.vet-profile-image');
    const vetAvatarImage = document.querySelector('.vet-avatar-image');
    
    if (hospitalImageUrl) {
      if (vetProfileImage) {
        vetProfileImage.style.backgroundImage = `url('${hospitalImageUrl}')`;
        vetProfileImage.style.backgroundSize = 'cover';
        vetProfileImage.style.backgroundPosition = 'center';
      }
      if (vetAvatarImage) {
        vetAvatarImage.style.backgroundImage = `url('${hospitalImageUrl}')`;
        vetAvatarImage.style.backgroundSize = 'cover';
        vetAvatarImage.style.backgroundPosition = 'center';
      }
    }
    
    // 초기 메시지에 수의사 이름 반영
    const initialMessage = document.querySelector('.vet-message .message-bubble');
    if (initialMessage) {
      initialMessage.innerHTML = `안녕하세요. ${vetInfo.hospital}<br>${vetName}입니다.<br>쿵이의 증상을 얘기해주세요.`;
    }
  } else {
    // 기본값 (정보가 없을 경우)
    console.log('수의사 정보를 찾을 수 없습니다.');
  }
}

// 채팅 기능
document.addEventListener('DOMContentLoaded', async function() {
  console.log('=== 채팅 스크립트 시작 ===');
  
  // 수의사 정보 로드 (비동기)
  await loadVetInfo();
  
  // 요소 선택
  const chatInput = document.getElementById('chatInput') || document.querySelector('.chat-input');
  const chatMessages = document.querySelector('.chat-messages');
  const voiceButton = document.getElementById('voiceButton');
  const voiceIcon = document.getElementById('voiceIcon');
  const sendIcon = document.getElementById('sendIcon');
  
  console.log('요소 확인:', {
    chatInput: chatInput,
    voiceButton: voiceButton,
    voiceIcon: voiceIcon,
    sendIcon: sendIcon,
    chatMessages: chatMessages
  });
  
  // 필수 요소 확인
  if (!chatInput || !voiceButton || !voiceIcon || !sendIcon || !chatMessages) {
    console.error('필수 요소를 찾을 수 없습니다!');
    return;
  }
  
  // 아이콘 전환 함수
  function toggleIcon() {
    const hasText = chatInput.value.trim().length > 0;
    console.log('[toggleIcon] 입력값:', chatInput.value, 'hasText:', hasText);
    
    if (hasText) {
      voiceButton.classList.add('has-text');
      voiceIcon.style.display = 'none';
      sendIcon.style.display = 'block';
      console.log('[toggleIcon] 전송 아이콘으로 변경');
    } else {
      voiceButton.classList.remove('has-text');
      voiceIcon.style.display = 'block';
      sendIcon.style.display = 'none';
      console.log('[toggleIcon] 마이크 아이콘으로 변경');
    }
  }
  
  // 메시지 전송 함수
  function sendMessage() {
    console.log('[sendMessage] 호출됨');
    const messageText = chatInput.value.trim();
    console.log('[sendMessage] 전송할 메시지:', messageText);
    
    if (messageText === '') {
      console.log('[sendMessage] 메시지가 비어있음');
      return;
    }
    
    // 사용자 메시지 추가
    const userMessage = document.createElement('div');
    userMessage.className = 'message user-message';
    userMessage.innerHTML = `
      <div class="message-content">
        <div class="message-bubble">${messageText}</div>
      </div>
    `;
    
    chatMessages.appendChild(userMessage);
    chatInput.value = '';
    toggleIcon(); // 아이콘 다시 마이크로 변경
    
    // 스크롤을 맨 아래로
    setTimeout(() => {
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }, 10);
    
    // 수의사 응답 시뮬레이션 (1초 후)
    setTimeout(() => {
      const vetMessage = document.createElement('div');
      vetMessage.className = 'message vet-message';
      vetMessage.innerHTML = `
        <div class="message-avatar">
          <div class="vet-avatar-image"></div>
        </div>
        <div class="message-content">
          <div class="message-bubble">네, 알겠습니다. 더 자세히 설명해주시면 도움이 될 것 같습니다.</div>
        </div>
      `;
      
             chatMessages.appendChild(vetMessage);
    
             // 스크롤을 맨 아래로
             setTimeout(() => {
               chatMessages.scrollTop = chatMessages.scrollHeight;
             }, 10);
    }, 1000);
  }
  
  // 초기 아이콘 상태 설정
  setTimeout(() => {
    console.log('[초기화] 아이콘 상태 설정');
    toggleIcon();
  }, 100);
  
  // 입력창 이벤트 리스너 - 여러 방법으로 바인딩
  console.log('[이벤트] 리스너 등록 시작');
  
  // input 이벤트 (가장 확실함)
  chatInput.addEventListener('input', function(e) {
    console.log('[이벤트] input:', e.target.value);
    toggleIcon();
  }, false);
  
  // keyup 이벤트
  chatInput.addEventListener('keyup', function(e) {
    console.log('[이벤트] keyup:', e.target.value);
    toggleIcon();
  }, false);
  
  // paste 이벤트
  chatInput.addEventListener('paste', function() {
    console.log('[이벤트] paste');
    setTimeout(toggleIcon, 10);
  }, false);
  
  // cut 이벤트
  chatInput.addEventListener('cut', function() {
    console.log('[이벤트] cut');
    setTimeout(toggleIcon, 10);
  }, false);
  
  // oninput 속성도 직접 설정 (이중 보험)
  chatInput.oninput = function() {
    console.log('[이벤트] oninput 속성:', this.value);
    toggleIcon();
  };
  
  // Enter 키로 전송
  chatInput.addEventListener('keypress', function(e) {
    console.log('[이벤트] keypress:', e.key);
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      console.log('[전송] Enter 키로 전송');
      sendMessage();
    }
  }, false);
  
  // Enter 키로 전송 (keydown도 추가)
  chatInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      console.log('[전송] keydown Enter로 전송');
      sendMessage();
    }
  }, false);
  
  // 전송 버튼 클릭 이벤트
  voiceButton.addEventListener('click', function(e) {
    e.preventDefault();
    e.stopPropagation();
    const hasText = chatInput.value.trim().length > 0;
    console.log('[전송] 버튼 클릭, hasText:', hasText, '값:', chatInput.value);
    if (hasText) {
      sendMessage();
    } else {
      console.log('[전송] 텍스트가 없어서 전송하지 않음');
    }
  }, false);
  
  console.log('[이벤트] 리스너 등록 완료');
  
  // 뒤로가기 버튼
  const backIcon = document.querySelector('.back-icon');
  if (backIcon) {
    backIcon.addEventListener('click', function() {
      window.location.href = '../consultation_main/consultation.html';
    });
  }
  
  // 액션 버튼들
  const actionButtons = document.querySelectorAll('.action-btn');
  actionButtons.forEach(button => {
    button.addEventListener('click', function() {
      const buttonText = this.textContent.trim();
      console.log('액션:', buttonText);
      
      if (buttonText === '예약하기') {
        // 예약 페이지로 이동
      } else if (buttonText === '상세정보') {
        // 상세 정보 표시
      } else if (buttonText.includes('후기보내기')) {
        // 후기 작성 페이지로 이동
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
  
         // 초기 스크롤을 맨 아래로
         if (chatMessages) {
           setTimeout(() => {
             chatMessages.scrollTop = chatMessages.scrollHeight;
           }, 100);
         }
  
  console.log('=== 채팅 스크립트 초기화 완료 ===');
});
