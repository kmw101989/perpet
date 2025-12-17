// 인증 체크 공통 스크립트
// 로컬스토리지에 사용자 ID가 없으면 로그인 페이지로 리다이렉트

// 사용자 ID 키
const USER_ID_KEY = 'userId';
const USER_DATA_KEY = 'userData';

// 사용자 ID 가져오기
function getUserId() {
  try {
    return localStorage.getItem(USER_ID_KEY);
  } catch (error) {
    console.error('Error getting user ID:', error);
    return null;
  }
}

// 사용자 ID 설정
function setUserId(userId) {
  try {
    localStorage.setItem(USER_ID_KEY, userId);
    console.log('✅ User ID saved:', userId);
  } catch (error) {
    console.error('Error setting user ID:', error);
  }
}

// 사용자 데이터 가져오기
function getUserData() {
  try {
    const userDataStr = localStorage.getItem(USER_DATA_KEY);
    return userDataStr ? JSON.parse(userDataStr) : null;
  } catch (error) {
    console.error('Error getting user data:', error);
    return null;
  }
}

// 사용자 데이터 설정
function setUserData(userData) {
  try {
    localStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
    console.log('✅ User data saved');
  } catch (error) {
    console.error('Error setting user data:', error);
  }
}

// 로그아웃 (모든 사용자 관련 데이터 삭제)
function logout() {
  try {
    localStorage.removeItem(USER_ID_KEY);
    localStorage.removeItem(USER_DATA_KEY);
    console.log('✅ Logged out');
  } catch (error) {
    console.error('Error logging out:', error);
  }
}

// 인증 체크 (로그인 페이지 제외)
function checkAuth() {
  // 로그인/회원가입 페이지는 체크하지 않음
  const currentPath = window.location.pathname;
  const publicPages = [
    '/login/index.html',
    '/join_member/index.html',
    '/pet_registration01/index.html',
    '/pet_registration02/index.html',
    '/pet_registration03/index.html',
    '/pet_registration_complete/index.html'
  ];

  const isPublicPage = publicPages.some(page => currentPath.includes(page));
  
  if (isPublicPage) {
    return true; // 공개 페이지는 체크하지 않음
  }

  const userId = getUserId();
  
  if (!userId) {
    console.log('❌ No user ID found, redirecting to login');
    // 로그인 페이지로 리다이렉트
    window.location.href = '/login/index.html';
    return false;
  }

  console.log('✅ User authenticated:', userId);
  return true;
}

// 고유한 사용자 ID 생성 (간단한 UUID v4 스타일)
function generateUserId() {
  return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// 전역으로 export
if (typeof window !== 'undefined') {
  window.getUserId = getUserId;
  window.setUserId = setUserId;
  window.getUserData = getUserData;
  window.setUserData = setUserData;
  window.logout = logout;
  window.checkAuth = checkAuth;
  window.generateUserId = generateUserId;
}

// 페이지 로드 시 자동 인증 체크 (옵션)
// 각 페이지에서 필요에 따라 호출
// document.addEventListener('DOMContentLoaded', checkAuth);

