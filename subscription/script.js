// 멤버십 선택
let selectedMembership = null;

document.addEventListener('DOMContentLoaded', function() {
  const membershipCards = document.querySelectorAll('.membership-card');
  const subscribeBtn = document.getElementById('subscribeBtn');
  const backBtn = document.getElementById('backBtn');

  // 멤버십 카드 클릭 이벤트
  membershipCards.forEach(card => {
    card.addEventListener('click', function() {
      // 모든 카드에서 selected 클래스 제거
      membershipCards.forEach(c => c.classList.remove('selected'));
      // 클릭한 카드에 selected 클래스 추가
      this.classList.add('selected');
      selectedMembership = this.getAttribute('data-membership');
      console.log('선택된 멤버십:', selectedMembership);
    });
  });

  // 구독하기 버튼 클릭 이벤트
  if (subscribeBtn) {
    subscribeBtn.addEventListener('click', function() {
      if (!selectedMembership) {
        alert('멤버십을 선택해주세요.');
        return;
      }
      
      // 웹페이지 알림으로 "준비중입니다" 표시
      alert('준비중입니다');
    });
  }

  // 이전 버튼 클릭 이벤트
  if (backBtn) {
    backBtn.addEventListener('click', function() {
      window.location.href = '/website/index.html';
    });
  }
});

