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

// 채팅 히스토리 관리
let chatHistory = [];

// 로컬 스토리지 키
const CHAT_STORAGE_KEY = 'chatHistory';
const CHAT_USER_KEY = 'chatUserId';

// 현재 사용자 ID 가져오기
function getCurrentUserId() {
  if (typeof getUserId === 'function') {
    return getUserId();
  }
  return null;
}

// 채팅 히스토리 저장
function saveChatHistory() {
  try {
    const userId = getCurrentUserId();
    if (!userId) {
      console.warn('사용자 ID가 없어 채팅을 저장할 수 없습니다.');
      return;
    }
    
    const chatData = {
      userId: userId,
      messages: getChatMessagesFromDOM(),
      history: chatHistory,
      timestamp: Date.now()
    };
    
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(chatData));
    localStorage.setItem(CHAT_USER_KEY, userId);
    console.log('✅ 채팅 히스토리 저장 완료');
  } catch (err) {
    console.error('채팅 히스토리 저장 오류:', err);
  }
}

// 채팅 히스토리 불러오기
function loadChatHistory() {
  try {
    const userId = getCurrentUserId();
    if (!userId) {
      console.warn('사용자 ID가 없어 채팅을 불러올 수 없습니다.');
      return false;
    }
    
    // 저장된 사용자 ID 확인
    const savedUserId = localStorage.getItem(CHAT_USER_KEY);
    if (savedUserId !== userId) {
      console.log('사용자가 변경되었습니다. 채팅 히스토리를 초기화합니다.');
      clearChatHistory();
      return false;
    }
    
    const savedData = localStorage.getItem(CHAT_STORAGE_KEY);
    if (!savedData) {
      return false;
    }
    
    const chatData = JSON.parse(savedData);
    
    // 사용자 ID 재확인
    if (chatData.userId !== userId) {
      clearChatHistory();
      return false;
    }
    
    // 채팅 메시지 복원
    if (chatData.messages && chatData.messages.length > 0) {
      restoreChatMessages(chatData.messages);
      chatHistory = chatData.history || [];
      console.log('✅ 채팅 히스토리 복원 완료:', chatData.messages.length, '개 메시지');
      return true;
    }
    
    return false;
  } catch (err) {
    console.error('채팅 히스토리 불러오기 오류:', err);
    return false;
  }
}

// DOM에서 채팅 메시지 추출 (초기 메시지 제외)
function getChatMessagesFromDOM() {
  const chatMessages = document.getElementById('chatMessages');
  if (!chatMessages) return [];
  
  const messages = [];
  const messageElements = chatMessages.querySelectorAll('.message:not(.loading-message)');
  
  // 초기 메시지 내용 (제외할 메시지)
  const initialMessageText = '안녕하세요! 펫봇이에요.';
  
  messageElements.forEach((el, index) => {
    // 첫 번째 봇 메시지는 초기 메시지이므로 제외
    if (index === 0 && el.classList.contains('bot-message')) {
      const bubble = el.querySelector('.message-bubble');
      if (bubble && bubble.textContent.includes(initialMessageText)) {
        return; // 초기 메시지는 저장하지 않음
      }
    }
    
    const isUser = el.classList.contains('user-message');
    const bubble = el.querySelector('.message-bubble');
    if (bubble) {
      const content = bubble.textContent || bubble.innerText;
      // 초기 메시지와 동일한 내용이면 제외
      if (!isUser && content.includes(initialMessageText)) {
        return;
      }
      
      messages.push({
        type: isUser ? 'user' : 'bot',
        content: content,
        html: bubble.innerHTML
      });
    }
  });
  
  return messages;
}

// 채팅 메시지 복원
function restoreChatMessages(messages) {
  const chatMessages = document.getElementById('chatMessages');
  if (!chatMessages) return;
  
  // 초기 메시지 내용 (제외할 메시지)
  const initialMessageText = '안녕하세요! 펫봇이에요.';
  
  // 기존 메시지 제거 (초기 메시지, 빠른 선택 버튼, 배너 제외)
  const allMessages = chatMessages.querySelectorAll('.message:not(.loading-message)');
  allMessages.forEach((msg, index) => {
    // 첫 번째 봇 메시지(초기 메시지)는 유지
    if (index === 0 && msg.classList.contains('bot-message')) {
      const bubble = msg.querySelector('.message-bubble');
      if (bubble && bubble.textContent.includes(initialMessageText)) {
        return; // 초기 메시지는 유지
      }
    }
    
    // 빠른 선택 버튼과 배너는 유지
    if (msg.classList.contains('quick-buttons') || msg.closest('.consultation-banner')) {
      return;
    }
    
    // 나머지 메시지는 제거
    msg.remove();
  });
  
  // 저장된 메시지 복원 (초기 메시지 제외)
  messages.forEach(msg => {
    // 초기 메시지와 동일한 내용이면 제외
    if (!msg.type && msg.content && msg.content.includes(initialMessageText)) {
      return;
    }
    
    if (msg.type === 'user') {
      const userMsg = document.createElement('div');
      userMsg.className = 'message user-message';
      userMsg.innerHTML = `
        <div class="message-content">
          <div class="message-bubble">${msg.html || msg.content}</div>
        </div>
      `;
      chatMessages.appendChild(userMsg);
    } else if (msg.type === 'bot') {
      // 초기 메시지가 아닌 경우만 복원
      if (!msg.content || !msg.content.includes(initialMessageText)) {
        const botMsg = document.createElement('div');
        botMsg.className = 'message bot-message';
        botMsg.innerHTML = `
          <div class="message-avatar">
            <img src="../svg/Union.svg" alt="펫봇" class="bot-avatar-image" />
          </div>
          <div class="message-content">
            <div class="message-bubble">${msg.html || msg.content}</div>
          </div>
        `;
        chatMessages.appendChild(botMsg);
      }
    }
  });
  
  // 스크롤을 맨 아래로
  setTimeout(() => {
    scrollToBottomIfNeeded(true);
  }, 100);
}

// 채팅 히스토리 초기화
function clearChatHistory() {
  try {
    localStorage.removeItem(CHAT_STORAGE_KEY);
    localStorage.removeItem(CHAT_USER_KEY);
    chatHistory = [];
    console.log('✅ 채팅 히스토리 초기화 완료');
  } catch (err) {
    console.error('채팅 히스토리 초기화 오류:', err);
  }
}

// 스크롤이 맨 아래에 있는지 확인 (사용자가 위로 스크롤하지 않은 상태)
function isScrolledToBottom(container, threshold = 100) {
  if (!container) return false;
  const scrollTop = container.scrollTop;
  const scrollHeight = container.scrollHeight;
  const clientHeight = container.clientHeight;
  // threshold 픽셀 이내면 맨 아래로 간주
  return scrollTop + clientHeight >= scrollHeight - threshold;
}

// 스크롤을 맨 아래로 이동 (스크롤이 맨 아래에 있을 때만)
function scrollToBottomIfNeeded(force = false) {
  const chatContainer = document.querySelector('.chat-container');
  if (!chatContainer) return;
  
  // force가 true이거나 스크롤이 맨 아래에 있으면 자동 스크롤
  if (force || isScrolledToBottom(chatContainer)) {
    // requestAnimationFrame을 사용하여 DOM 업데이트 후 스크롤
    requestAnimationFrame(() => {
      chatContainer.scrollTop = chatContainer.scrollHeight;
      // 스크롤 버튼 상태 업데이트
      updateScrollButtonVisibility();
    });
  } else {
    // 스크롤 버튼 상태 업데이트
    updateScrollButtonVisibility();
  }
}

// 강제로 맨 아래로 스크롤 (버튼 클릭 시 사용)
function scrollToBottom() {
  const chatContainer = document.querySelector('.chat-container');
  if (!chatContainer) return;
  
  chatContainer.scrollTo({
    top: chatContainer.scrollHeight,
    behavior: 'smooth'
  });
  
  // 스크롤 완료 후 버튼 숨김
  setTimeout(() => {
    updateScrollButtonVisibility();
  }, 300);
}

// 스크롤 버튼 표시/숨김 업데이트
function updateScrollButtonVisibility() {
  const chatContainer = document.querySelector('.chat-container');
  const scrollBtn = document.getElementById('scrollToBottomBtn');
  
  if (!chatContainer || !scrollBtn) return;
  
  const isAtBottom = isScrolledToBottom(chatContainer, 50);
  
  if (isAtBottom) {
    scrollBtn.classList.remove('show');
  } else {
    scrollBtn.classList.add('show');
  }
}

// 로딩 메시지 표시
function showLoadingMessage() {
  const chatMessages = document.getElementById('chatMessages');
  if (!chatMessages) return null;
  
  const loadingMessage = document.createElement('div');
  loadingMessage.className = 'message bot-message loading-message';
  loadingMessage.id = 'loadingMessage';
  loadingMessage.innerHTML = `
    <div class="message-avatar">
      <img src="../svg/bot.svg" alt="펫봇" class="bot-avatar-image" />
    </div>
    <div class="message-content">
      <div class="message-bubble">분석 중...</div>
    </div>
  `;
  
  chatMessages.appendChild(loadingMessage);
  
  // 스크롤이 맨 아래에 있으면 자동 스크롤
  scrollToBottomIfNeeded();
  
  return loadingMessage;
}

// 로딩 메시지 제거
function removeLoadingMessage() {
  const loadingMessage = document.getElementById('loadingMessage');
  if (loadingMessage) {
    loadingMessage.remove();
  }
}

// AI 채팅 API 호출
async function callChatAPI(message) {
  try {
    // Netlify Function 경로 (로컬: netlify dev, 배포: 자동 라우팅)
    const apiUrl = '/.netlify/functions/chat';
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: message,
        history: chatHistory
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (err) {
    console.error('AI 채팅 API 오류:', err);
    throw err;
  }
}

// 메시지 전송 함수
async function sendMessage(messageText) {
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
    
    // 히스토리에 추가
    chatHistory.push({ role: 'user', content: messageText });
    
    // 채팅 히스토리 저장
    saveChatHistory();
  
  // 입력창 초기화
  if (chatInput) {
    chatInput.value = '';
    toggleIcon();
  }
  
  // 입력 비활성화
  if (chatInput) {
    chatInput.disabled = true;
  }
  
  // 사용자가 메시지를 보냈을 때는 항상 맨 아래로 스크롤
  scrollToBottomIfNeeded(true);
  
  // 로딩 메시지 표시
  showLoadingMessage();
  
  try {
    // AI API 호출
    const response = await callChatAPI(messageText);
    
    // 로딩 메시지 제거
    removeLoadingMessage();
    
    // 응답 메시지 표시
    const botMessage = document.createElement('div');
    botMessage.className = 'message bot-message';
    
    // 응답 메시지 구성 (명세서 형식)
    let messageContent = response.message || '응답을 생성하는 중 오류가 발생했습니다.';
    
    botMessage.innerHTML = `
      <div class="message-avatar">
        <img src="../svg/bot.svg" alt="펫봇" class="bot-avatar-image" />
      </div>
      <div class="message-content">
        <div class="message-bubble">${messageContent}</div>
      </div>
    `;
    
    chatMessages.appendChild(botMessage);
    
    // 병원·제품 추천 표시 (명세서: recommendations 필드)
    console.log('[Chat] 응답 데이터:', response);
    console.log('[Chat] 추천 데이터:', response.recommendations);
    
    if (response.recommendations) {
      const { hospitals, products } = response.recommendations;
      console.log('[Chat] 병원 개수:', hospitals?.length || 0);
      console.log('[Chat] 제품 개수:', products?.length || 0);
      
      // 병원 추천 표시 (hospital-card 스타일 재활용)
      if (hospitals && hospitals.length > 0) {
        const hospitalRecommendation = document.createElement('div');
        hospitalRecommendation.className = 'message bot-message recommendation-section';
        hospitalRecommendation.innerHTML = `
          <div class="message-avatar">
            <img src="../svg/Union.svg" alt="펫봇" class="bot-avatar-image" />
          </div>
          <div class="message-content">
            <div class="recommendation-title">추천 병원</div>
            <div class="chat-hospital-list">
              ${hospitals.map(h => `
                <div class="chat-hospital-card" data-hospital-id="${h.hospital_id}">
                  <div class="chat-hospital-image" ${h.hospital_img ? `style="background-image: url('${h.hospital_img}'); background-size: cover; background-position: center;"` : ''}></div>
                  <div class="chat-hospital-info">
                    <div class="chat-hospital-header">
                      <div class="chat-hospital-name">${h.hospital_name}</div>
                      <div class="chat-hospital-rating">⭐ ${h.rating || '0'}</div>
                    </div>
                    <div class="chat-hospital-details">
                      ${h.address ? `<div class="chat-detail-item">${h.address}</div>` : ''}
                    </div>
                    <div class="chat-hospital-actions">
                      <button class="chat-action-btn chat-action-btn-primary hospital-reservation-btn" data-hospital-id="${h.hospital_id}" data-hospital-name="${h.hospital_name}">
                        예약하기
                      </button>
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        `;
        chatMessages.appendChild(hospitalRecommendation);
        
        // 병원 예약 버튼 이벤트 리스너 추가
        hospitalRecommendation.querySelectorAll('.hospital-reservation-btn').forEach(btn => {
          btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const hospitalId = this.getAttribute('data-hospital-id');
            const hospitalName = this.getAttribute('data-hospital-name');
            // 병원 예약 페이지로 이동 (병원 정보 전달)
            window.location.href = `../hospital_reservation/reservation.html?hospital_id=${hospitalId}&hospital_name=${encodeURIComponent(hospitalName)}`;
          });
        });
      }
      
      // 제품 추천 표시 (product-card 스타일 재활용)
      if (products && products.length > 0) {
        const productRecommendation = document.createElement('div');
        productRecommendation.className = 'message bot-message recommendation-section';
        productRecommendation.innerHTML = `
          <div class="message-avatar">
            <img src="../svg/Union.svg" alt="펫봇" class="bot-avatar-image" />
          </div>
          <div class="message-content">
            <div class="recommendation-title">참고 제품</div>
            <div class="chat-product-grid">
              ${products.map(p => {
                const currentPrice = p.current_price ? parseInt(p.current_price) : null;
                const originalPrice = p.original_price ? parseInt(p.original_price) : null;
                const discountPercent = p.discount_percent ? parseFloat(p.discount_percent) : null;
                const hasDiscount = discountPercent && discountPercent > 0 && originalPrice && currentPrice && originalPrice !== currentPrice;
                
                return `
                <div class="chat-product-card" data-product-id="${p.product_id}">
                  <div class="chat-product-image" ${p.product_img ? `style="background-image: url('${p.product_img}'); background-size: cover; background-position: center;"` : ''}></div>
                  <div class="chat-product-name">${p.product_name}</div>
                  <div class="chat-product-price">
                    ${hasDiscount ? `<span class="chat-discount">${Math.round(discountPercent)}%</span>` : ''}
                    <span class="chat-price">${currentPrice ? currentPrice.toLocaleString() + '원' : '가격 정보 없음'}</span>
                  </div>
                </div>
              `;
              }).join('')}
            </div>
          </div>
        `;
        chatMessages.appendChild(productRecommendation);
        
        // 제품 클릭 이벤트 리스너 추가 (PDP로 이동)
        productRecommendation.querySelectorAll('.chat-product-card').forEach(item => {
          item.addEventListener('click', function() {
            const productId = this.getAttribute('data-product-id');
            // 제품 상세 페이지로 이동
            window.location.href = `../PDP/product-detail.html?id=${productId}`;
          });
        });
      }
    }
    
    // 히스토리에 추가
    chatHistory.push({ role: 'assistant', content: messageContent });
    
    // 채팅 히스토리 저장
    saveChatHistory();
    
    // 스크롤이 맨 아래에 있으면 자동 스크롤
    scrollToBottomIfNeeded();
  } catch (err) {
    // 로딩 메시지 제거
    removeLoadingMessage();
    
    // 에러 메시지 표시
    const errorMessage = document.createElement('div');
    errorMessage.className = 'message bot-message';
    errorMessage.innerHTML = `
      <div class="message-avatar">
        <img src="../svg/bot.svg" alt="펫봇" class="bot-avatar-image" />
      </div>
      <div class="message-content">
        <div class="message-bubble">죄송합니다. 오류가 발생했습니다: ${err.message || '알 수 없는 오류'}</div>
      </div>
    `;
    
    chatMessages.appendChild(errorMessage);
    
    // 스크롤이 맨 아래에 있으면 자동 스크롤
    scrollToBottomIfNeeded();
  } finally {
    // 입력 활성화
    if (chatInput) {
      chatInput.disabled = false;
      chatInput.focus();
    }
  }
}

// 이 함수는 더 이상 사용하지 않음 (AI API로 대체됨)

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
  
  // 채팅 히스토리 불러오기
  const historyLoaded = loadChatHistory();
  
  // 초기 스크롤을 맨 아래로
  if (chatMessages) {
    setTimeout(() => {
      scrollToBottomIfNeeded(true);
    }, 100);
  }
  
  // MutationObserver를 사용하여 새 메시지가 추가될 때 자동 스크롤
  const chatContainer = document.querySelector('.chat-container');
  if (chatContainer && chatMessages) {
    const observer = new MutationObserver(() => {
      // 새 메시지가 추가되었을 때, 스크롤이 맨 아래에 있으면 자동 스크롤
      scrollToBottomIfNeeded();
    });
    
    observer.observe(chatMessages, {
      childList: true,
      subtree: true
    });
  }
  
  // 페이지 언로드 시 채팅 저장
  window.addEventListener('beforeunload', () => {
    saveChatHistory();
  });
  
  // Visual Viewport API를 사용한 키보드 대응
  if (window.visualViewport) {
    const chatInputArea = document.querySelector('.chat-input-area');
    const chatContainer = document.querySelector('.chat-container');
    const tabbar = document.querySelector('.tabbar');
    const tabbarHeight = tabbar ? tabbar.offsetHeight : 49;
    
    let initialViewportHeight = window.visualViewport.height;
    
    function handleViewportResize() {
      const viewport = window.visualViewport;
      const currentHeight = viewport.height;
      const heightDiff = initialViewportHeight - currentHeight;
      
      // 키보드가 올라온 경우 (뷰포트 높이가 줄어든 경우)
      if (heightDiff > 50) {
        // 입력창을 키보드 위로 이동
        if (chatInputArea) {
          chatInputArea.style.bottom = `${tabbarHeight + heightDiff}px`;
        }
        
        // 채팅 컨테이너 패딩 조정 (입력창이 가리지 않도록)
        if (chatContainer) {
          const inputAreaHeight = chatInputArea ? chatInputArea.offsetHeight : 0;
          chatContainer.style.paddingBottom = `${inputAreaHeight + heightDiff + tabbarHeight}px`;
        }
      } else {
        // 키보드가 내려간 경우 원래 위치로 복귀
        if (chatInputArea) {
          chatInputArea.style.bottom = `${tabbarHeight}px`;
        }
        
        if (chatContainer) {
          const inputAreaHeight = chatInputArea ? chatInputArea.offsetHeight : 0;
          chatContainer.style.paddingBottom = `${inputAreaHeight + tabbarHeight}px`;
        }
      }
      
      // 스크롤을 맨 아래로 (키보드가 올라올 때)
      if (heightDiff > 50) {
        setTimeout(() => {
          scrollToBottomIfNeeded(true);
        }, 100);
      }
    }
    
    // Visual Viewport 리사이즈 이벤트
    window.visualViewport.addEventListener('resize', handleViewportResize);
    window.visualViewport.addEventListener('scroll', handleViewportResize);
    
    // 초기 뷰포트 높이 업데이트 (화면 회전 등 대응)
    window.addEventListener('resize', () => {
      initialViewportHeight = window.visualViewport.height;
    });
    
    // 입력창 포커스 시에도 확인
    if (chatInput) {
      chatInput.addEventListener('focus', () => {
        setTimeout(handleViewportResize, 300); // iOS Safari 지연 대응
      });
      
      chatInput.addEventListener('blur', () => {
        setTimeout(() => {
          if (chatInputArea) {
            chatInputArea.style.bottom = `${tabbarHeight}px`;
          }
          if (chatContainer) {
            const inputAreaHeight = chatInputArea ? chatInputArea.offsetHeight : 0;
            chatContainer.style.paddingBottom = `${inputAreaHeight + tabbarHeight}px`;
          }
        }, 100);
      });
    }
  } else {
    // Visual Viewport API를 지원하지 않는 브라우저를 위한 폴백
    console.warn('Visual Viewport API를 지원하지 않습니다. 키보드 대응이 제한될 수 있습니다.');
    
    const chatInputArea = document.querySelector('.chat-input-area');
    const chatContainer = document.querySelector('.chat-container');
    const tabbar = document.querySelector('.tabbar');
    const tabbarHeight = tabbar ? tabbar.offsetHeight : 49;
    
    if (chatInput) {
      let initialHeight = window.innerHeight;
      
      chatInput.addEventListener('focus', () => {
        setTimeout(() => {
          const currentHeight = window.innerHeight;
          const heightDiff = initialHeight - currentHeight;
          
          if (heightDiff > 50 && chatInputArea) {
            chatInputArea.style.bottom = `${tabbarHeight + heightDiff}px`;
          }
          
          if (chatContainer) {
            const inputAreaHeight = chatInputArea ? chatInputArea.offsetHeight : 0;
            chatContainer.style.paddingBottom = `${inputAreaHeight + heightDiff + tabbarHeight}px`;
          }
          
          setTimeout(() => {
            scrollToBottomIfNeeded(true);
          }, 100);
        }, 300);
      });
      
      chatInput.addEventListener('blur', () => {
        setTimeout(() => {
          if (chatInputArea) {
            chatInputArea.style.bottom = `${tabbarHeight}px`;
          }
          if (chatContainer) {
            const inputAreaHeight = chatInputArea ? chatInputArea.offsetHeight : 0;
            chatContainer.style.paddingBottom = `${inputAreaHeight + tabbarHeight}px`;
          }
          initialHeight = window.innerHeight;
        }, 100);
      });
    }
  }
});

