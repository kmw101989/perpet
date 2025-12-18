// DOM 요소 전역 변수 선언
let signupForm, emailInput, passwordInput, passwordConfirmInput, nicknameInput;
let genderInput, residenceInput, phoneInput;
let agreeAllCheckbox,
  age14Checkbox,
  serviceTermsCheckbox,
  privacyTermsCheckbox,
  marketingTermsCheckbox;
let submitBtn;
let genderButtons, residenceButtons, termCheckboxes, togglePasswordButtons;

// 비밀번호 보기/숨기기 토글 설정 함수
function setupTogglePasswordButtons() {
  if (!togglePasswordButtons || togglePasswordButtons.length === 0) {
    console.warn("비밀번호 보기 버튼을 찾을 수 없습니다.");
    return;
  }

  console.log("비밀번호 보기 버튼 설정 중...", togglePasswordButtons.length);

  togglePasswordButtons.forEach((btn, index) => {
    console.log(`비밀번호 보기 버튼 ${index + 1} 설정:`, btn);
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();

      console.log("비밀번호 보기 버튼 클릭됨");
      const targetId = this.getAttribute("data-target");
      const targetInput = document.getElementById(targetId);

      if (!targetInput) {
        console.error("대상 입력 필드를 찾을 수 없습니다:", targetId);
        return;
      }

      console.log("입력 필드 타입 변경:", targetInput.type);
      if (targetInput.type === "password") {
        targetInput.type = "text";
        this.textContent = "숨기기";
        // text 타입일 때는 원래 폰트로 복원
        targetInput.style.fontFamily =
          '"JejuGothic", "Noto Sans KR", sans-serif';
        targetInput.style.letterSpacing = "normal";
      } else {
        targetInput.type = "password";
        this.textContent = "보기";
        // password 타입일 때는 *처럼 보이도록 폰트 조정
        targetInput.style.fontFamily = '"Courier New", monospace';
        targetInput.style.letterSpacing = "2px";
      }
    });
  });
}

// 성별 선택 설정 함수
function setupGenderButtons() {
  if (!genderButtons || genderButtons.length === 0) {
    console.warn("성별 버튼을 찾을 수 없습니다.");
    return;
  }

  if (!genderInput) {
    console.warn("성별 입력 필드를 찾을 수 없습니다.");
    return;
  }

  console.log("성별 버튼 설정 중...", genderButtons.length);

  genderButtons.forEach((btn, index) => {
    console.log(
      `성별 버튼 ${index + 1} 설정:`,
      btn,
      btn.getAttribute("data-gender")
    );
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();

      console.log("성별 버튼 클릭됨:", this.getAttribute("data-gender"));
      genderButtons.forEach((b) => b.classList.remove("active"));
      this.classList.add("active");
      if (genderInput) {
        genderInput.value = this.getAttribute("data-gender");
        console.log("성별 값 설정:", genderInput.value);
      }
      saveJoinMemberData();
      validateForm();
    });
  });
}

// 거주지 선택 설정 함수
function setupResidenceButtons() {
  if (!residenceButtons || residenceButtons.length === 0) {
    console.warn("거주지 버튼을 찾을 수 없습니다.");
    return;
  }

  if (!residenceInput) {
    console.warn("거주지 입력 필드를 찾을 수 없습니다.");
    return;
  }

  console.log("거주지 버튼 설정 중...", residenceButtons.length);

  residenceButtons.forEach((btn, index) => {
    console.log(
      `거주지 버튼 ${index + 1} 설정:`,
      btn,
      btn.getAttribute("data-residence")
    );
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();

      console.log("거주지 버튼 클릭됨:", this.getAttribute("data-residence"));
      residenceButtons.forEach((b) => b.classList.remove("active"));
      this.classList.add("active");
      if (residenceInput) {
        residenceInput.value = this.getAttribute("data-residence");
        console.log("거주지 값 설정:", residenceInput.value);
      }
      saveJoinMemberData();
      validateForm();
    });
  });
}

// 약관 체크박스 설정 함수
function setupTermCheckboxes() {
  if (!agreeAllCheckbox || !termCheckboxes || termCheckboxes.length === 0)
    return;

  // 약관 전체 동의 (마케팅 동의 포함)
  agreeAllCheckbox.addEventListener("change", function () {
    const isChecked = this.checked;
    termCheckboxes.forEach((checkbox) => {
      // 마케팅 동의도 포함하여 모두 체크/해제
      checkbox.checked = isChecked;
    });
    // 전체 동의 상태 업데이트
    updateAgreeAllCheckbox();
    validateForm();
  });

  // 개별 약관 체크박스 변경 시
  termCheckboxes.forEach((checkbox) => {
    checkbox.addEventListener("change", function () {
      updateAgreeAllCheckbox();
      if (checkbox.id === "marketingTerms") {
        saveJoinMemberData();
      }
      validateForm();
    });
  });
}

// 전체 동의 체크박스 상태 업데이트 (마케팅 동의 포함)
function updateAgreeAllCheckbox() {
  // 모든 약관(마케팅 동의 포함) 확인
  const allChecked = Array.from(termCheckboxes).every((cb) => cb.checked);
  agreeAllCheckbox.checked = allChecked;
}

// 입력 필드 유효성 검사 (형식 검증 제거, 입력 여부만 확인)
function validateEmail(email) {
  return email.trim().length > 0;
}

function validatePassword(password) {
  return password.length > 0;
}

function validateNickname(nickname) {
  return nickname.trim().length > 0;
}

function validatePhone(phone) {
  return phone.trim().length > 0;
}

function validateResidence(residence) {
  // 거주지가 선택되었는지 확인
  return residence !== "";
}

// joinMemberData 저장 함수
function saveJoinMemberData() {
  try {
    // DOM 요소 확인
    if (
      !emailInput ||
      !passwordInput ||
      !passwordConfirmInput ||
      !nicknameInput ||
      !genderInput ||
      !residenceInput ||
      !phoneInput ||
      !marketingTermsCheckbox
    ) {
      console.warn("DOM 요소가 초기화되지 않아 저장을 건너뜁니다.");
      return;
    }

    // 현재 입력값 저장 (빈 값도 포함)
    const joinMemberData = {
      email: emailInput.value.trim() || "",
      password: passwordInput.value || "",
      passwordConfirm: passwordConfirmInput.value || "",
      nickname: nicknameInput.value.trim() || "",
      gender: genderInput.value || "",
      residence: residenceInput.value.trim() || "",
      phone: phoneInput.value.trim() || "",
      marketingAgree: marketingTermsCheckbox.checked || false,
    };

    localStorage.setItem("joinMemberData", JSON.stringify(joinMemberData));
    // 로그는 디버깅 시에만 필요하므로 제거 (너무 자주 호출됨)
    // console.log("✅ joinMemberData 저장 완료:", {
    //   ...joinMemberData,
    //   password: "(마스킹됨)",
    //   passwordConfirm: "(마스킹됨)"
    // });
  } catch (error) {
    console.error("❌ joinMemberData 저장 실패:", error);
  }
}

// 이메일 중복 체크 함수
async function checkEmailDuplicate(email) {
  if (!email || !email.trim()) {
    hideEmailError();
    return true; // 빈 이메일은 중복 체크하지 않음
  }

  try {
    // SupabaseService가 로드되었는지 확인
    if (typeof SupabaseService === "undefined") {
      console.warn("SupabaseService가 아직 로드되지 않았습니다.");
      return true; // 서비스가 없으면 체크하지 않음
    }

    const emailExists = await SupabaseService.checkEmailExists(email);
    
    if (emailExists) {
      showEmailError("이미 가입된 이메일입니다.");
      return false;
    } else {
      hideEmailError();
      return true;
    }
  } catch (error) {
    console.error("이메일 중복 체크 오류:", error);
    // 에러 발생 시에도 계속 진행 (네트워크 오류 등)
    return true;
  }
}

// 이메일 에러 메시지 표시
function showEmailError(message) {
  let errorElement = document.getElementById("emailError");
  if (!errorElement) {
    // 에러 메시지 요소가 없으면 생성
    errorElement = document.createElement("div");
    errorElement.id = "emailError";
    errorElement.className = "error-message";
    errorElement.style.cssText = "display: block; color: #ff0000; font-size: 12px; margin-top: 4px;";
    
    // 이메일 입력 필드 다음에 삽입
    const emailInput = document.getElementById("email");
    if (emailInput && emailInput.parentElement) {
      emailInput.parentElement.appendChild(errorElement);
    }
  }
  
  errorElement.textContent = message;
  errorElement.style.display = "block";
}

// 이메일 에러 메시지 숨김
function hideEmailError() {
  const errorElement = document.getElementById("emailError");
  if (errorElement) {
    errorElement.style.display = "none";
  }
}

// 비밀번호 일치 확인
function checkPasswordMatch() {
  const password = passwordInput ? passwordInput.value : "";
  const passwordConfirm = passwordConfirmInput
    ? passwordConfirmInput.value
    : "";
  const errorElement = document.getElementById("passwordConfirmError");

  if (!errorElement) return true;

  // 비밀번호 확인 칸에 입력이 있고, 비밀번호와 일치하지 않으면 에러 표시
  if (passwordConfirm.trim() !== "" && password !== passwordConfirm) {
    errorElement.style.display = "block";
    return false;
  } else {
    errorElement.style.display = "none";
    return true;
  }
}

// 폼 유효성 검사
function validateForm() {
  if (
    !emailInput ||
    !passwordInput ||
    !passwordConfirmInput ||
    !nicknameInput ||
    !genderInput ||
    !residenceInput ||
    !phoneInput ||
    !submitBtn
  ) {
    return;
  }

  const email = emailInput.value.trim();
  const password = passwordInput.value;
  const passwordConfirm = passwordConfirmInput.value;
  const nickname = nicknameInput.value.trim();
  const gender = genderInput.value;
  const residence = residenceInput.value.trim();
  const phone = phoneInput.value.trim();

  // 비밀번호 일치 확인
  const passwordMatch = checkPasswordMatch();

  // 필수 약관 체크
  const requiredTermsChecked =
    age14Checkbox.checked &&
    serviceTermsCheckbox.checked &&
    privacyTermsCheckbox.checked;

  // 모든 필수 입력 필드가 채워졌는지 확인
  const allInputsFilled =
    validateEmail(email) &&
    validatePassword(password) &&
    passwordConfirm.trim() !== "" &&
    passwordMatch &&
    validateNickname(nickname) &&
    gender !== "" &&
    validateResidence(residence) &&
    validatePhone(phone);

  // 모든 필수 항목 검증
  const isValid =
    validateEmail(email) &&
    validatePassword(password) &&
    passwordConfirm.trim() !== "" &&
    passwordMatch &&
    validateNickname(nickname) &&
    gender !== "" &&
    validateResidence(residence) &&
    validatePhone(phone) &&
    requiredTermsChecked;

  // 모든 입력이 완료되고 모든 버튼이 클릭되면 submit-btn 활성화
  if (allInputsFilled && gender !== "" && residence !== "") {
    submitBtn.disabled = false;
  } else {
    submitBtn.disabled = true;
  }
}

// 입력 필드 이벤트 리스너 설정 함수
function setupInputEventListeners() {
  // password input에 * 기호로 표시되도록 설정
  if (passwordInput) {
    passwordInput.addEventListener("input", function () {
      if (this.type === "password") {
        // password 타입일 때는 브라우저가 자동으로 마스킹하지만,
        // CSS로 폰트를 조정하여 *처럼 보이도록 함
        this.style.fontFamily = '"Courier New", monospace';
        this.style.letterSpacing = "2px";
      } else {
        // text 타입일 때는 원래 폰트로 복원
        this.style.fontFamily = '"JejuGothic", "Noto Sans KR", sans-serif';
        this.style.letterSpacing = "normal";
      }
      saveJoinMemberData();
      validateForm();
    });
  }

  // passwordConfirm input에 * 기호로 표시되도록 설정
  if (passwordConfirmInput) {
    passwordConfirmInput.addEventListener("input", function () {
      if (this.type === "password") {
        // password 타입일 때는 브라우저가 자동으로 마스킹하지만,
        // CSS로 폰트를 조정하여 *처럼 보이도록 함
        this.style.fontFamily = '"Courier New", monospace';
        this.style.letterSpacing = "2px";
      } else {
        // text 타입일 때는 원래 폰트로 복원
        this.style.fontFamily = '"JejuGothic", "Noto Sans KR", sans-serif';
        this.style.letterSpacing = "normal";
      }
      saveJoinMemberData();
      checkPasswordMatch(); // 비밀번호 일치 확인
      validateForm();
    });
  }

  // password input 변경 시에도 비밀번호 일치 확인
  if (passwordInput) {
    passwordInput.addEventListener("input", function () {
      checkPasswordMatch(); // 비밀번호 일치 확인
    });
  }

  // 입력 필드 이벤트 리스너 (입력 시 데이터 저장 및 검증)
  if (emailInput) {
    let emailCheckTimeout = null;
    
    emailInput.addEventListener("input", () => {
      saveJoinMemberData();
      validateForm();
      
      // 이메일 중복 체크 (입력 후 500ms 지연)
      const email = emailInput.value.trim();
      if (email) {
        // 기존 타이머 취소
        if (emailCheckTimeout) {
          clearTimeout(emailCheckTimeout);
        }
        
        // 500ms 후 중복 체크 실행
        emailCheckTimeout = setTimeout(async () => {
          await checkEmailDuplicate(email);
        }, 500);
      } else {
        // 이메일이 비어있으면 에러 메시지 숨김
        hideEmailError();
      }
    });
    
    // 포커스 아웃 시에도 중복 체크
    emailInput.addEventListener("blur", async () => {
      const email = emailInput.value.trim();
      if (email) {
        await checkEmailDuplicate(email);
      }
    });
  }

  if (nicknameInput) {
    nicknameInput.addEventListener("input", () => {
      saveJoinMemberData();
      validateForm();
    });
  }

  if (phoneInput) {
    phoneInput.addEventListener("input", () => {
      saveJoinMemberData();
      validateForm();
    });
  }

  if (residenceInput) {
    residenceInput.addEventListener("change", () => {
      saveJoinMemberData();
      validateForm();
    });
  }
}

// submit-btn 클릭 이벤트 설정 함수
function setupSubmitButton() {
  if (!submitBtn) return;

  let isFirstClick = true; // 첫 클릭 여부 추적
  let isSubmitting = false; // 제출 중 플래그 (중복 클릭 방지)

  submitBtn.addEventListener("click", async function (e) {
    e.preventDefault();

    // 중복 클릭 방지
    if (isSubmitting) {
      console.log("이미 제출 중입니다. 중복 클릭 무시.");
      return;
    }

    if (!submitBtn.disabled) {
      if (isFirstClick) {
        // 첫 번째 클릭: 모든 체크박스 자동 선택 (marketingTerms 포함)
        termCheckboxes.forEach((checkbox) => {
          checkbox.checked = true;
        });

        // marketingTermsCheckbox도 자동 선택
        if (marketingTermsCheckbox) {
          marketingTermsCheckbox.checked = true;
        }

        // 모든 체크박스가 체크되었으므로 agreeAllCheckbox 상태 업데이트
        updateAgreeAllCheckbox();

        // 체크박스 change 이벤트 트리거 (필수 체크박스 변경사항 반영)
        age14Checkbox.dispatchEvent(new Event("change", { bubbles: true }));
        serviceTermsCheckbox.dispatchEvent(
          new Event("change", { bubbles: true })
        );
        privacyTermsCheckbox.dispatchEvent(
          new Event("change", { bubbles: true })
        );

        // 첫 클릭 완료 표시
        isFirstClick = false;
        console.log(
          "필수 체크박스 선택 완료. 네 번째 체크박스 선택 후 다시 클릭해주세요."
        );
      } else {
        // 두 번째 클릭: 실제 폼 제출 및 페이지 이동
        // 중복 제출 방지
        if (isSubmitting) {
          console.log("이미 제출 중입니다. 중복 클릭 무시.");
          return;
        }

        // 제출 시작
        isSubmitting = true;
        submitBtn.disabled = true;
        submitBtn.textContent = "처리 중...";

        // 비밀번호 일치 확인
        if (!checkPasswordMatch()) {
          alert("비밀번호가 일치하지 않습니다.");
          isSubmitting = false;
          submitBtn.disabled = false;
          submitBtn.textContent = "가입하기";
          return;
        }

        const formData = {
          email: emailInput.value.trim(),
          password: passwordInput.value,
          nickname: nicknameInput.value.trim(),
          gender: genderInput.value,
          residence: residenceInput.value.trim(),
          phone: phoneInput.value.trim().replace(/-/g, ""), // 하이픈 제거
          marketingAgree: marketingTermsCheckbox.checked,
        };

        // 이메일 중복 최종 체크
        const emailAvailable = await checkEmailDuplicate(formData.email);
        if (!emailAvailable) {
          alert("이미 가입된 이메일입니다. 다른 이메일을 사용해주세요.");
          isSubmitting = false;
          submitBtn.disabled = false;
          submitBtn.textContent = "가입하기";
          emailInput.focus();
          return;
        }

        // Supabase에 사용자 정보 저장
        try {
          // Supabase 스크립트 로드 확인
          if (typeof SupabaseService === "undefined") {
            console.error("SupabaseService가 로드되지 않았습니다.");
            alert(
              "서비스 초기화 중 오류가 발생했습니다. 페이지를 새로고침해주세요."
            );
            isSubmitting = false;
            submitBtn.disabled = false;
            submitBtn.textContent = "가입하기";
            return;
          }

          // Supabase에 사용자 등록
          const userData = {
            email: formData.email,
            password: formData.password, // 비밀번호 포함
            nickname: formData.nickname,
            gender: formData.gender,
            residence: formData.residence,
            phone: formData.phone,
          };

          const createdUser = await SupabaseService.createUser(userData);

          if (createdUser) {
            const userId = createdUser.user_id;

            // 로컬 스토리지에도 저장 (인증 체크용)
            const localUserData = {
              userId: userId,
              email: formData.email,
              nickname: formData.nickname,
              gender: formData.gender,
              residence: formData.residence,
              phone: formData.phone,
              marketingAgree: formData.marketingAgree,
              createdAt: new Date().toISOString(),
            };

            localStorage.setItem("userId", userId);
            localStorage.setItem("userData", JSON.stringify(localUserData));

            console.log("✅ 회원가입 완료 - User ID:", userId);
            console.log("✅ Supabase에 사용자 등록 완료:", createdUser);

            // 회원가입 완료 후 joinMemberData 초기화
            localStorage.removeItem("joinMemberData");

            // 정상적인 플로우 시작을 위해 currentPetData 초기화
            localStorage.removeItem("currentPetData");
            localStorage.removeItem("editingPetIndex");

            console.log("회원가입 정보:", formData);

            // pet_registration01 페이지로 이동
            window.location.href = "../pet_registration01/index.html";
          } else {
            console.error("❌ 사용자 등록 실패");
            alert("회원가입 중 오류가 발생했습니다. 다시 시도해주세요.");
            isSubmitting = false;
            submitBtn.disabled = false;
            submitBtn.textContent = "가입하기";
            return;
          }
        } catch (error) {
          console.error("데이터 저장 실패:", error);
          
          // 이메일 중복 오류 처리
          if (error.message && error.message.includes("이미 가입된 이메일")) {
            showEmailError("이미 가입된 이메일입니다.");
            alert("이미 가입된 이메일입니다. 다른 이메일을 사용해주세요.");
            emailInput.focus();
          } else {
            alert("회원가입 중 오류가 발생했습니다: " + error.message);
          }
          
          isSubmitting = false;
          submitBtn.disabled = false;
          submitBtn.textContent = "가입하기";
          return;
        }
      }
    }
  });
}

// 보기 버튼 클릭 이벤트 설정 함수
function setupViewButtons() {
  const viewButtons = document.querySelectorAll(".view-btn");
  if (!viewButtons || viewButtons.length === 0) return;

  viewButtons.forEach((btn) => {
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      const termText = this.previousElementSibling.textContent;
      alert(`${termText}\n\n약관 내용은 여기에 표시됩니다.`);
    });
  });
}

// 입력 정보 복원 함수
function restoreJoinMemberData() {
  try {
    // DOM 요소들이 초기화되었는지 확인
    if (
      !emailInput ||
      !passwordInput ||
      !passwordConfirmInput ||
      !nicknameInput ||
      !genderInput ||
      !residenceInput ||
      !phoneInput ||
      !marketingTermsCheckbox
    ) {
      console.warn(
        "DOM 요소들이 아직 초기화되지 않았습니다. 복원을 건너뜁니다."
      );
      return false;
    }

    // joinMemberData에서 이전 입력 정보 가져오기
    const savedData = localStorage.getItem("joinMemberData");
    if (!savedData) {
      console.log("저장된 joinMemberData가 없습니다.");
      return false;
    }

    const joinMemberData = JSON.parse(savedData);

    // 저장된 데이터가 있으면 항상 복원 (값이 비어있어도 복원)
    console.log("=== joinMemberData 복원 시작 ===");
    console.log("저장된 데이터:", joinMemberData);

    let restored = false;

    // 입력 필드 복원 (undefined가 아닌 경우 모두 복원, 빈 문자열도 복원)
    if (joinMemberData.email !== undefined && emailInput) {
      emailInput.value = joinMemberData.email || "";
      console.log("이메일 복원:", joinMemberData.email || "(빈 값)");
      restored = true;
    }

    if (joinMemberData.password !== undefined && passwordInput) {
      passwordInput.value = joinMemberData.password || "";
      // password 타입일 때 스타일 적용
      if (passwordInput.type === "password" && passwordInput.value) {
        passwordInput.style.fontFamily = '"Courier New", monospace';
        passwordInput.style.letterSpacing = "2px";
      }
      console.log("비밀번호 복원: (마스킹됨)");
      restored = true;
    }

    if (joinMemberData.passwordConfirm !== undefined && passwordConfirmInput) {
      passwordConfirmInput.value = joinMemberData.passwordConfirm || "";
      // password 타입일 때 스타일 적용
      if (
        passwordConfirmInput.type === "password" &&
        passwordConfirmInput.value
      ) {
        passwordConfirmInput.style.fontFamily = '"Courier New", monospace';
        passwordConfirmInput.style.letterSpacing = "2px";
      }
      console.log("비밀번호 확인 복원: (마스킹됨)");
      restored = true;
    }

    if (joinMemberData.nickname !== undefined && nicknameInput) {
      nicknameInput.value = joinMemberData.nickname || "";
      console.log("닉네임 복원:", joinMemberData.nickname || "(빈 값)");
      restored = true;
    }

    if (joinMemberData.phone !== undefined && phoneInput) {
      phoneInput.value = joinMemberData.phone || "";
      console.log("휴대폰 번호 복원:", joinMemberData.phone || "(빈 값)");
      restored = true;
    }

    // 성별 복원
    if (
      joinMemberData.gender !== undefined &&
      genderInput &&
      genderButtons &&
      genderButtons.length > 0
    ) {
      if (joinMemberData.gender) {
        genderInput.value = joinMemberData.gender;
        genderButtons.forEach((btn) => {
          if (btn.getAttribute("data-gender") === joinMemberData.gender) {
            btn.classList.add("active");
          } else {
            btn.classList.remove("active");
          }
        });
        console.log("성별 복원:", joinMemberData.gender);
        restored = true;
      }
    }

    // 거주지 복원
    if (
      joinMemberData.residence !== undefined &&
      residenceInput &&
      residenceButtons &&
      residenceButtons.length > 0
    ) {
      if (joinMemberData.residence) {
        residenceInput.value = joinMemberData.residence;
        residenceButtons.forEach((btn) => {
          if (btn.getAttribute("data-residence") === joinMemberData.residence) {
            btn.classList.add("active");
          } else {
            btn.classList.remove("active");
          }
        });
        console.log("거주지 복원:", joinMemberData.residence);
        restored = true;
      }
    }

    // 약관 동의 복원
    if (joinMemberData.marketingAgree !== undefined && marketingTermsCheckbox) {
      marketingTermsCheckbox.checked = joinMemberData.marketingAgree || false;
      console.log("마케팅 동의 복원:", joinMemberData.marketingAgree);
      restored = true;
    }

    // 폼 유효성 검사
    validateForm();

    if (restored) {
      console.log("=== 입력 정보 복원 완료 ===");
      return true;
    } else {
      console.log("복원할 데이터가 없습니다.");
      return false;
    }
  } catch (error) {
    console.error("입력 정보 복원 실패:", error);
    return false;
  }
}

// 페이지 로드 시 초기화
function initializePage() {
  console.log("=== 페이지 초기화 시작 ===");

  // DOM 요소 가져오기
  signupForm = document.getElementById("signupForm");
  emailInput = document.getElementById("email");
  passwordInput = document.getElementById("password");
  passwordConfirmInput = document.getElementById("passwordConfirm");
  nicknameInput = document.getElementById("nickname");
  genderInput = document.getElementById("gender");
  residenceInput = document.getElementById("residence");
  phoneInput = document.getElementById("phone");
  agreeAllCheckbox = document.getElementById("agreeAll");
  age14Checkbox = document.getElementById("age14");
  serviceTermsCheckbox = document.getElementById("serviceTerms");
  privacyTermsCheckbox = document.getElementById("privacyTerms");
  marketingTermsCheckbox = document.getElementById("marketingTerms");
  submitBtn = document.getElementById("submitBtn");

  // 버튼 선택 - 더 명확하게
  genderButtons = document.querySelectorAll(
    "button.gender-btn:not(.residence-btn)"
  );
  residenceButtons = document.querySelectorAll("button.residence-btn");
  termCheckboxes = document.querySelectorAll(".term-checkbox");
  togglePasswordButtons = document.querySelectorAll("button.toggle-password");

  // 디버깅: 선택된 요소 확인
  console.log("=== DOM 요소 확인 ===");
  console.log("성별 버튼 개수:", genderButtons.length);
  console.log("거주지 버튼 개수:", residenceButtons.length);
  console.log("비밀번호 보기 버튼 개수:", togglePasswordButtons.length);
  console.log("성별 입력 필드:", genderInput);
  console.log("거주지 입력 필드:", residenceInput);

  // 요소가 없으면 경고
  if (genderButtons.length === 0) {
    console.error("❌ 성별 버튼을 찾을 수 없습니다!");
    // 직접 선택 시도
    const allGenderBtns = document.querySelectorAll(".gender-btn");
    console.log("전체 gender-btn 개수:", allGenderBtns.length);
    allGenderBtns.forEach((btn, i) => {
      console.log(
        `버튼 ${i}:`,
        btn,
        "클래스:",
        btn.className,
        "residence-btn 포함?",
        btn.classList.contains("residence-btn")
      );
    });
  }

  if (residenceButtons.length === 0) {
    console.error("❌ 거주지 버튼을 찾을 수 없습니다!");
  }

  if (togglePasswordButtons.length === 0) {
    console.error("❌ 비밀번호 보기 버튼을 찾을 수 없습니다!");
  }

  // 이벤트 리스너 설정
  console.log("=== 이벤트 리스너 설정 시작 ===");
  setupTogglePasswordButtons();
  setupGenderButtons();
  setupResidenceButtons();
  setupTermCheckboxes();
  setupInputEventListeners();
  setupSubmitButton();
  setupViewButtons();

  // 폼 제출 (기존 submit 이벤트는 유지하되 submit-btn 클릭으로 대체)
  if (signupForm) {
    signupForm.addEventListener("submit", function (e) {
      e.preventDefault();
      // submit-btn 클릭 이벤트에서 처리
    });
  }

  // password input 초기 스타일 설정
  if (passwordInput && passwordInput.type === "password") {
    passwordInput.style.fontFamily = '"Courier New", monospace';
    passwordInput.style.letterSpacing = "2px";
  }

  // passwordConfirm input 초기 스타일 설정
  if (passwordConfirmInput && passwordConfirmInput.type === "password") {
    passwordConfirmInput.style.fontFamily = '"Courier New", monospace';
    passwordConfirmInput.style.letterSpacing = "2px";
  }

  // 뒤로 가기로 돌아온 경우인지 확인
  const referrer = document.referrer;
  const isBackNavigation =
    referrer.includes("pet_registration") ||
    referrer.includes("pet_registration02") ||
    referrer.includes("pet_registration03") ||
    referrer.includes("pet_registration_complete");

  if (isBackNavigation) {
    console.log("뒤로 가기: pet_registration에서 돌아옴");
    console.log("referrer:", referrer);
  } else {
    console.log("정상적인 플로우 또는 다른 경로");
  }

  // 저장된 데이터 확인
  const joinMemberData = localStorage.getItem("joinMemberData");
  if (joinMemberData) {
    try {
      const parsed = JSON.parse(joinMemberData);
      console.log("✅ 저장된 joinMemberData 존재:", {
        ...parsed,
        password: "(마스킹됨)",
        passwordConfirm: "(마스킹됨)",
      });
    } catch (e) {
      console.error("❌ joinMemberData 파싱 실패:", e);
    }
  } else {
    console.log("⚠️ 저장된 joinMemberData 없음");
  }

  // 저장된 데이터가 있으면 항상 복원 (직전에 입력한 정보)
  // DOM 요소들이 모두 초기화된 후에 복원 실행
  // requestAnimationFrame을 사용하여 DOM 렌더링 완료 후 복원
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      console.log("=== 데이터 복원 시작 ===");
      const restored = restoreJoinMemberData();

      if (restored) {
        console.log("✅ 데이터 복원 성공");
      } else {
        console.log("⚠️ 데이터 복원 실패 또는 저장된 데이터 없음");
        // 저장된 데이터가 있는데 복원이 안 된 경우 재시도
        const savedData = localStorage.getItem("joinMemberData");
        if (savedData) {
          console.log("저장된 데이터가 있지만 복원 실패. 재시도...");
          setTimeout(() => {
            restoreJoinMemberData();
            validateForm();
          }, 300);
        }
      }

      validateForm();
    });
  });

  // 초기 상태 설정
  validateForm();

  // 페이지를 떠나기 전에 현재 상태 저장 (로그 제거)
  window.addEventListener("beforeunload", () => {
    saveJoinMemberData();
  });

  // 페이지 가시성 변경 시에도 저장 (탭 전환 등, 로그 제거)
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      saveJoinMemberData();
    }
  });

  // 주기적 자동 저장 제거 (로그 도배 방지)
  // setInterval(() => {
  //   if (emailInput || passwordInput || nicknameInput || phoneInput) {
  //     saveJoinMemberData();
  //   }
  // }, 5000);

  // 뒤로 가기 버튼 클릭 이벤트 설정
  const backBtn = document.getElementById("backBtn");
  if (backBtn) {
    backBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log("뒤로 가기 버튼 클릭 - join_member -> login");

      // 현재 입력 중인 내용을 저장
      saveJoinMemberData();

      // login 페이지로 이동
      window.location.href = "../login/index.html";
    });
  } else {
    console.error("뒤로 가기 버튼을 찾을 수 없습니다!");
  }

  console.log("=== 페이지 초기화 완료 ===");
}

// DOMContentLoaded와 window.onload 모두 처리
if (document.readyState === "loading") {
  window.addEventListener("DOMContentLoaded", initializePage);
} else {
  // 이미 로드된 경우 즉시 실행
  initializePage();
}

// 추가 안전장치: window.onload에서도 실행
window.addEventListener("load", function () {
  console.log("window.onload 이벤트 발생");
  // 요소가 아직 없으면 다시 시도
  if (!genderButtons || genderButtons.length === 0) {
    console.log("요소를 찾지 못했으므로 재시도...");
    initializePage();
  }
});
