// DOM 요소 선택
const kakaoBtn = document.getElementById('kakaoBtn');
const naverBtn = document.getElementById('naverBtn');
const googleBtn = document.getElementById('googleBtn');
const emailLogin = document.getElementById('emailLogin');
const emailSignup = document.getElementById('emailSignup');

// 모든 데이터 초기화 함수
function clearAllData() {
    localStorage.removeItem('petsData');
    localStorage.removeItem('currentPetData');
    localStorage.removeItem('petData'); // 하위 호환성
    localStorage.removeItem('joinMemberData');
    localStorage.removeItem('editingPetIndex');
    localStorage.removeItem('userData');
    localStorage.removeItem('userId'); // 사용자 ID도 삭제
    console.log('✅ 모든 데이터 초기화 완료');
}

// 카카오톡 로그인 버튼 클릭 이벤트
kakaoBtn.addEventListener('click', function() {
    console.log('카카오톡 로그인 클릭');
    clearAllData();
    // join_member 페이지로 이동
    window.location.href = '../join_member/index.html';
});

// 네이버 로그인 버튼 클릭 이벤트
naverBtn.addEventListener('click', function() {
    console.log('네이버 로그인 클릭');
    clearAllData();
    // join_member 페이지로 이동
    window.location.href = '../join_member/index.html';
});

// 구글 로그인 버튼 클릭 이벤트
googleBtn.addEventListener('click', function() {
    console.log('구글 로그인 클릭');
    clearAllData();
    // join_member 페이지로 이동
    window.location.href = '../join_member/index.html';
});

// 이메일 로그인 링크 클릭 이벤트
emailLogin.addEventListener('click', function(e) {
    e.preventDefault();
    console.log('이메일 로그인 클릭');
    clearAllData();
    // join_member 페이지로 이동
    window.location.href = '../join_member/index.html';
});

// 이메일 회원가입 링크 클릭 이벤트
emailSignup.addEventListener('click', function(e) {
    e.preventDefault();
    console.log('이메일 회원가입 클릭');
    clearAllData();
    // join_member 페이지로 이동
    window.location.href = '../join_member/index.html';
});

// 메시지 표시 함수 (임시)
function showMessage(message) {
    // 간단한 알림 표시
    const messageDiv = document.createElement('div');
    messageDiv.textContent = message;
    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background-color: #202027;
        color: #fff;
        padding: 12px 24px;
        border-radius: 8px;
        font-size: 14px;
        z-index: 1000;
        animation: slideDown 0.3s ease-out;
    `;
    
    document.body.appendChild(messageDiv);
    
    // 3초 후 제거
    setTimeout(() => {
        messageDiv.style.animation = 'slideUp 0.3s ease-out';
        setTimeout(() => {
            document.body.removeChild(messageDiv);
        }, 300);
    }, 3000);
}

// CSS 애니메이션 추가
const style = document.createElement('style');
style.textContent = `
    @keyframes slideDown {
        from {
            opacity: 0;
            transform: translateX(-50%) translateY(-20px);
        }
        to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }
    }
    
    @keyframes slideUp {
        from {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }
        to {
            opacity: 0;
            transform: translateX(-50%) translateY(-20px);
        }
    }
`;
document.head.appendChild(style);

// 페이지 로드 완료 시 초기화
document.addEventListener('DOMContentLoaded', function() {
    console.log('로그인 페이지 로드 완료');
    
    // 기존 사용자 ID 확인
    const existingUserId = localStorage.getItem('userId');
    if (existingUserId) {
        console.log('✅ 기존 사용자 ID 발견:', existingUserId);
        // 기존 사용자가 있으면 메인페이지로 이동
        window.location.href = '../website/index.html';
        return;
    }
    
    // login 페이지 접속 시 모든 관련 데이터 초기화 (새로운 세션 시작)
    console.log('새로운 세션 시작 - 모든 저장된 데이터 초기화');
    clearAllData();
    
    // 터치 이벤트 최적화 (모바일)
    if ('ontouchstart' in window) {
        document.body.style.touchAction = 'manipulation';
    }
    
    // 버튼 호버 효과 (데스크톱)
    const socialButtons = document.querySelectorAll('.social-btn');
    socialButtons.forEach(btn => {
        btn.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px)';
            this.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)';
        });
        
        btn.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = 'none';
        });
    });
});

