// 아이콘 전환 함수
function toggleIcon() {
  const chatInput = document.getElementById('chatInput');
  const voiceButton = document.getElementById('voiceButton');
  
  if (!chatInput || !voiceButton) return;
  
  const hasText = chatInput.value.trim().length > 0;
  
  if (hasText) {
    voiceButton.classList.add('has-text');
  } else {
    voiceButton.classList.remove('has-text');
  }
}

// 메시지 전송 함수
function sendMessage(messageText) {
  const chatInput = document.getElementById('chatInput');
  const chatMessages = document.getElementById('chatMessages');
  
  if (!chatInput || !chatMessages) return;
  
  // 입력창에서 직접 전송하는 경우
  if (!messageText) {
    messageText = chatInput.value.trim();
  }
  
  if (messageText === '') {
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
  
  // 입력창 초기화
  if (chatInput) {
    chatInput.value = '';
    toggleIcon();
  }
  
  // 스크롤을 맨 아래로
  setTimeout(() => {
    const chatContainer = document.querySelector('.chat-container');
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  }, 10);
  
  // 펫봇 응답 시뮬레이션 (1초 후)
  setTimeout(() => {
    const botResponse = getBotResponse(messageText);
    
    const botMessage = document.createElement('div');
    botMessage.className = 'message bot-message';
    botMessage.innerHTML = `
      <div class="message-avatar">
        <img src="../svg/bot.svg" alt="펫봇" class="bot-avatar-image" />
      </div>
      <div class="message-content">
        <div class="message-bubble">${botResponse}</div>
      </div>
    `;
    
    chatMessages.appendChild(botMessage);
    
    // 스크롤을 맨 아래로
    setTimeout(() => {
      const chatContainer = document.querySelector('.chat-container');
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
    }, 10);
  }, 1000);
}

// 펫봇 응답 생성 함수
function getBotResponse(userMessage) {
  const lowerMessage = userMessage.toLowerCase();
  
  // 빠른 선택 버튼에 대한 응답
  if (lowerMessage.includes('증상상담') || lowerMessage.includes('증상')) {
    return '증상에 대해 더 자세히 알려주시면 도움을 드릴 수 있어요. 어떤 증상이 나타나고 있나요?';
  } else if (lowerMessage.includes('행동문제') || lowerMessage.includes('행동')) {
    return '행동 문제는 다양한 원인이 있을 수 있어요. 구체적으로 어떤 행동이 문제인지 알려주세요.';
  } else if (lowerMessage.includes('식습관') || lowerMessage.includes('영양')) {
    return '식습관과 영양에 대해 궁금하시는 점이 있으신가요? 쿵이의 현재 사료나 식습관을 알려주시면 더 정확한 조언을 드릴 수 있어요.';
  } else if (lowerMessage.includes('예방접종') || lowerMessage.includes('접종')) {
    return '예방접종 일정에 대해 안내해드릴게요. 쿵이의 나이와 최근 접종 이력을 알려주시면 맞춤 일정을 제안해드릴 수 있어요.';
  } else if (lowerMessage.includes('약') || lowerMessage.includes('영양제')) {
    return '약이나 영양제에 대해 궁금하시군요. 쿵이의 건강 상태나 필요에 따라 적절한 제품을 추천해드릴 수 있어요.';
  } else if (lowerMessage.includes('사료성분') || lowerMessage.includes('사료')) {
    return '사료 성분에 대해 알려드릴게요. 어떤 사료에 대해 궁금하신가요?';
  } else if (lowerMessage.includes('건강필수') || lowerMessage.includes('팁')) {
    return '건강 필수 팁을 알려드릴게요! 쿵이의 건강을 위해 정기적인 검진과 적절한 운동이 중요해요.';
  } else if (lowerMessage.includes('기타') || lowerMessage.includes('궁금')) {
    return '궁금하신 점이 있으시면 언제든지 물어보세요! 더 정확한 답변을 위해 구체적으로 설명해주시면 좋아요.';
  }
  
  // 일반적인 응답
  return '네, 알겠습니다. 더 자세히 설명해주시면 도움을 드릴 수 있어요.';
}

document.addEventListener('DOMContentLoaded', function() {
  console.log('[AI 채팅] 페이지 로드됨');
  
  // 요소 선택
  const chatInput = document.getElementById('chatInput');
  const voiceButton = document.getElementById('voiceButton');
  const chatMessages = document.getElementById('chatMessages');
  const quickButtons = document.querySelectorAll('.quick-btn');
  const consultationBanner = document.querySelector('.consultation-banner');
  
  // 필수 요소 확인
  if (!chatInput || !voiceButton || !chatMessages) {
    console.error('[오류] 필수 요소를 찾을 수 없습니다!');
    return;
  }
  
  // 초기 아이콘 상태 설정
  setTimeout(() => {
    toggleIcon();
  }, 100);
  
  // 입력창 이벤트 리스너
  chatInput.addEventListener('input', function() {
    toggleIcon();
  }, false);
  
  chatInput.addEventListener('keyup', function() {
    toggleIcon();
  }, false);
  
  chatInput.addEventListener('paste', function() {
    setTimeout(toggleIcon, 10);
  }, false);
  
  chatInput.addEventListener('cut', function() {
    setTimeout(toggleIcon, 10);
  }, false);
  
  // 전송 버튼 클릭 이벤트
  voiceButton.addEventListener('click', function(e) {
    e.preventDefault();
    e.stopPropagation();
    const hasText = chatInput.value.trim().length > 0;
    if (hasText) {
      sendMessage();
    } else {
      console.log('[이벤트] 마이크 기능 활성화 (추후 구현)');
      // 여기에 마이크 녹음 시작/정지 로직 추가 가능
    }
  }, false);
  
  // Enter 키로 전송
  chatInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }, false);
  
  chatInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }, false);
  
  // 빠른 선택 버튼 클릭 이벤트
  quickButtons.forEach(button => {
    button.addEventListener('click', function() {
      const query = this.getAttribute('data-query');
      if (query) {
        sendMessage(query);
      }
    });
  });
  
  // 상담 배너 클릭 이벤트
  if (consultationBanner) {
    const bannerContent = consultationBanner.querySelector('.banner-content');
    if (bannerContent) {
      bannerContent.addEventListener('click', function() {
        window.location.href = '../consultation_main/consultation.html';
      });
    }
  }
  
  // 뒤로가기 버튼
  const backIcon = document.querySelector('.back-icon');
  if (backIcon) {
    backIcon.addEventListener('click', function() {
      window.location.href = '../website/index.html';
    });
  }
  
  // 초기 스크롤을 맨 아래로
  if (chatMessages) {
    setTimeout(() => {
      const chatContainer = document.querySelector('.chat-container');
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
    }, 100);
  }
});

