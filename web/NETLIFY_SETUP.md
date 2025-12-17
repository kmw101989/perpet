# Netlify 호스팅 설정 가이드

## 1. Firebase 설정 제거

### 로컬 파일 삭제/백업
다음 파일들을 삭제하거나 백업 폴더로 이동하세요:
- `firebase.json`
- `.firebaserc`
- `apphosting.yaml`

### HTML에서 Firebase 스크립트 제거 (선택사항)
Firebase를 사용하지 않는다면 모든 HTML 파일에서 다음 줄을 제거하세요:
```html
<script type="module" src="/common/firebase-config.js"></script>
```

또는 `common/firebase-config.js` 파일을 삭제하거나 주석 처리하세요.

## 2. Firebase 콘솔에서 프로젝트 삭제

1. [Firebase Console](https://console.firebase.google.com/)에 접속
2. 프로젝트 선택: `perpet-d8266`
3. 프로젝트 설정 (톱니바퀴 아이콘) 클릭
4. 맨 아래로 스크롤하여 "프로젝트 삭제" 클릭
5. 프로젝트 ID 입력 확인 후 삭제

⚠️ **주의**: 프로젝트 삭제는 되돌릴 수 없습니다. 필요한 데이터가 있다면 미리 백업하세요.

## 3. Netlify 배포 방법

### 방법 1: Netlify 웹사이트에서 배포 (추천)

1. [Netlify](https://www.netlify.com/)에 가입/로그인
2. 대시보드에서 "Add new site" → "Import an existing project" 클릭
3. Git 저장소 연결:
   - GitHub/GitLab/Bitbucket 저장소를 선택하거나
   - "Deploy manually" 선택하여 파일 업로드
4. 빌드 설정:
   - **Publish directory**: `.` (루트 디렉토리)
   - **Build command**: (비워두기 - 정적 사이트이므로 빌드 불필요)
5. "Deploy site" 클릭

### 방법 2: Netlify CLI 사용

1. Netlify CLI 설치:
   ```bash
   npm install -g netlify-cli
   ```

2. Netlify 로그인:
   ```bash
   netlify login
   ```

3. 사이트 초기화:
   ```bash
   netlify init
   ```
   - "Create & configure a new site" 선택
   - 사이트 이름 입력 (또는 자동 생성)
   - Publish directory: `.` 입력

4. 배포:
   ```bash
   netlify deploy --prod
   ```

### 방법 3: GitHub 연동 (자동 배포)

1. GitHub에 코드 푸시
2. Netlify에서 "Add new site" → "Import an existing project"
3. GitHub 저장소 선택
4. 빌드 설정:
   - **Publish directory**: `.`
   - **Build command**: (비워두기)
5. "Deploy site" 클릭
6. 이후 GitHub에 푸시할 때마다 자동 배포됨

## 4. Netlify 설정 확인

`netlify.toml` 파일이 루트에 생성되어 있습니다. 이 파일은:
- 모든 페이지 경로를 올바른 HTML 파일로 리다이렉트
- 404 에러 처리

## 5. 커스텀 도메인 설정 (선택사항)

1. Netlify 대시보드 → Site settings → Domain management
2. "Add custom domain" 클릭
3. 도메인 입력 및 DNS 설정 안내 따르기

## 6. 환경 변수 설정 (필요시)

Netlify 대시보드 → Site settings → Environment variables에서 설정 가능

---

## 문제 해결

### CSS/JS 파일이 로드되지 않는 경우
- 모든 경로가 절대 경로(`/`로 시작)인지 확인
- 브라우저 개발자 도구의 Network 탭에서 404 에러 확인

### 페이지가 404 에러인 경우
- `netlify.toml`의 redirects 설정 확인
- Netlify 대시보드의 Deploy logs 확인

