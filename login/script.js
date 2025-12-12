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

// 사용자의 반려동물 정보 로드 함수
async function loadUserPets(userId) {
    try {
        if (typeof SupabaseService === 'undefined') {
            console.error('SupabaseService가 로드되지 않았습니다.');
            return;
        }
        
        console.log('반려동물 정보 로드 시작, userId:', userId);
        
        // Supabase에서 반려동물 목록 가져오기
        const pets = await SupabaseService.getPetsByUserId(userId);
        console.log('조회된 반려동물 목록:', pets);
        
        if (pets && pets.length > 0) {
            // pet_id를 숫자로 변환하여 정렬 (가장 작은 pet_id 선택)
            const sorted = [...pets].sort((a, b) => {
                const aId = parseInt(a.pet_id, 10);
                const bId = parseInt(b.pet_id, 10);
                return (isNaN(aId) ? 0 : aId) - (isNaN(bId) ? 0 : bId);
            });
            
            const selectedPet = sorted[0];
            console.log('선택된 반려동물 (가장 작은 pet_id):', selectedPet);
            
            // localStorage에 저장
            localStorage.setItem('selectedPetId', selectedPet.pet_id);
            localStorage.setItem('selectedPetData', JSON.stringify(selectedPet));
            
            console.log('✅ 반려동물 정보 로드 완료');
        } else {
            console.log('반려동물이 등록되지 않았습니다.');
            // 반려동물이 없으면 기존 선택 정보 제거
            localStorage.removeItem('selectedPetId');
            localStorage.removeItem('selectedPetData');
        }
    } catch (error) {
        console.error('반려동물 정보 로드 실패:', error);
    }
}

// 이메일/비밀번호 로그인 함수 (로컬스토리지 기반)
async function loginWithEmail(email, password) {
    try {
        // Supabase에서 사용자 조회
        if (typeof SupabaseService !== 'undefined') {
            const client = await getSupabaseClient();
            const { data: user, error } = await client
                .from('users')
                .select('*')
                .eq('email', email)
                .eq('password', password) // 비밀번호 비교 (데모용 - 프로덕션에서는 해시 비교)
                .single();

            if (error || !user) {
                console.log('로그인 실패: 이메일 또는 비밀번호가 일치하지 않습니다.');
                return false;
            }

            // 로그인 성공 - 로컬스토리지에 저장
            const userId = user.user_id;
            const userData = {
                userId: userId,
                email: user.email,
                nickname: user.nickname || user.user_name,
                gender: user.user_gender,
                residence: user.user_address1,
                phone: user.phone_num,
                createdAt: new Date().toISOString()
            };

            localStorage.setItem('userId', userId);
            localStorage.setItem('userData', JSON.stringify(userData));

            console.log('✅ 로그인 성공 - User ID:', userId);
            
            // 반려동물 정보 가져오기
            await loadUserPets(userId);
            
            return true;
        } else {
            // Supabase가 없으면 로컬스토리지에서만 확인
            const savedUserData = localStorage.getItem('userData');
            if (savedUserData) {
                const userData = JSON.parse(savedUserData);
                if (userData.email === email) {
                    // 비밀번호는 로컬스토리지에 저장되지 않으므로 이메일만 확인
                    localStorage.setItem('userId', userData.userId);
                    console.log('✅ 로컬스토리지 로그인 성공');
                    return true;
                }
            }
            return false;
        }
    } catch (error) {
        console.error('로그인 중 오류:', error);
        return false;
    }
}

// 로그인 모달 표시 함수
function showLoginModal() {
    // 기존 모달이 있으면 제거
    const existingModal = document.getElementById('loginModal');
    if (existingModal) {
        existingModal.remove();
    }

    // 모달 생성
    const modal = document.createElement('div');
    modal.id = 'loginModal';
    modal.className = 'login-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>이메일 로그인</h3>
                <button class="modal-close" id="closeLoginModal">&times;</button>
            </div>
            <form id="loginForm" class="login-form">
                <div class="form-group">
                    <label for="loginEmail">이메일</label>
                    <input type="email" id="loginEmail" name="email" class="form-input" placeholder="이메일을 입력해주세요" required autocomplete="email">
                </div>
                <div class="form-group">
                    <label for="loginPassword">비밀번호</label>
                    <div class="input-wrapper">
                        <input type="password" id="loginPassword" name="password" class="form-input" placeholder="비밀번호를 입력해주세요" required autocomplete="current-password">
                        <button type="button" class="toggle-password" data-target="loginPassword">보기</button>
                    </div>
                </div>
                <div class="form-error" id="loginError" style="display: none;"></div>
                <button type="submit" class="submit-btn" id="loginSubmitBtn">로그인</button>
            </form>
        </div>
    `;

    document.body.appendChild(modal);

    // 모달 닫기
    const closeBtn = document.getElementById('closeLoginModal');
    closeBtn.addEventListener('click', () => {
        modal.remove();
    });

    // 모달 배경 클릭 시 닫기
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });

    // 비밀번호 보기/숨기기
    const togglePasswordBtn = modal.querySelector('.toggle-password');
    const passwordInput = document.getElementById('loginPassword');
    togglePasswordBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            this.textContent = '숨기기';
        } else {
            passwordInput.type = 'password';
            this.textContent = '보기';
        }
    });

    // 로그인 폼 제출
    const loginForm = document.getElementById('loginForm');
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;
        const errorDiv = document.getElementById('loginError');
        const submitBtn = document.getElementById('loginSubmitBtn');

        if (!email || !password) {
            errorDiv.textContent = '이메일과 비밀번호를 입력해주세요.';
            errorDiv.style.display = 'block';
            return;
        }

        // 로그인 버튼 비활성화
        submitBtn.disabled = true;
        submitBtn.textContent = '로그인 중...';

        // 로그인 시도
        const success = await loginWithEmail(email, password);

        if (success) {
            // 로그인 성공 - 메인 페이지로 이동
            window.location.href = '../website/index.html';
        } else {
            // 로그인 실패
            errorDiv.textContent = '이메일 또는 비밀번호가 일치하지 않습니다.';
            errorDiv.style.display = 'block';
            submitBtn.disabled = false;
            submitBtn.textContent = '로그인';
        }
    });
}

// 이메일 로그인 버튼 클릭 이벤트
if (emailLogin) {
    emailLogin.addEventListener('click', async function(e) {
        e.preventDefault();
        console.log('이메일 로그인 버튼 클릭');
        
        // Supabase 스크립트 로드 대기
        let attempts = 0;
        const maxAttempts = 50; // 5초 대기
        while (typeof SupabaseService === 'undefined' && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        // 로컬스토리지에 사용자 정보가 있는지 확인
        const userId = localStorage.getItem('userId');
        const userData = localStorage.getItem('userData');
        
        if (userId && userData) {
            try {
                const parsedUserData = JSON.parse(userData);
                console.log('✅ 기존 사용자 정보 발견, 자동 로그인:', parsedUserData);
                
                // 반려동물 정보 확인 및 로드
                const selectedPetId = localStorage.getItem('selectedPetId');
                if (!selectedPetId && typeof SupabaseService !== 'undefined') {
                    // 반려동물 정보가 없으면 가져오기
                    await loadUserPets(userId);
                }
                
                // 바로 메인 페이지로 이동
                window.location.href = '../website/index.html';
            } catch (error) {
                console.error('사용자 정보 파싱 실패:', error);
                // 파싱 실패 시 모달 표시
                showLoginModal();
            }
        } else {
            // 로컬스토리지에 정보가 없으면 로그인 모달 표시
            console.log('로컬스토리지에 사용자 정보 없음, 로그인 모달 표시');
            showLoginModal();
        }
    });
}

// 이메일 회원가입 버튼 클릭 이벤트
if (emailSignup) {
    emailSignup.addEventListener('click', function(e) {
        e.preventDefault();
        console.log('이메일 회원가입 버튼 클릭');
        clearAllData();
        // join_member 페이지로 이동
        window.location.href = '../join_member/index.html';
    });
}

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
document.addEventListener('DOMContentLoaded', async function() {
    console.log('로그인 페이지 로드 완료');
    
    // Supabase 스크립트 로드
    const supabaseScript = document.createElement('script');
    supabaseScript.src = '/common/supabase-config.js';
    document.head.appendChild(supabaseScript);
    
    // Supabase 스크립트 로드 대기
    let attempts = 0;
    const maxAttempts = 50; // 5초 대기
    while (typeof SupabaseService === 'undefined' && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
    }
    
    // 기존 사용자 ID 확인
    const existingUserId = localStorage.getItem('userId');
    if (existingUserId) {
        console.log('✅ 기존 사용자 ID 발견:', existingUserId);
        
        // 반려동물 정보 확인 및 로드
        const selectedPetId = localStorage.getItem('selectedPetId');
        if (!selectedPetId && typeof SupabaseService !== 'undefined') {
            // 반려동물 정보가 없으면 가져오기
            await loadUserPets(existingUserId);
        }
        
        // 기존 사용자가 있으면 메인페이지로 이동
        window.location.href = '../website/index.html';
        return;
    }
    
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

