# Figma MCP 플러그인 연결 가이드

이 가이드는 Cursor에서 Figma MCP 서버를 연결하는 방법을 설명합니다.

## 1단계: Figma 데스크톱 앱에서 MCP 서버 활성화

1. **Figma 데스크톱 앱 설치 및 업데이트**
   - [Figma 데스크톱 앱](https://www.figma.com/downloads/)을 다운로드하여 설치합니다
   - 최신 버전으로 업데이트합니다

2. **Dev Mode 활성화**
   - Figma 데스크톱 앱을 열고 디자인 파일을 엽니다
   - 화면 하단 도구 모음에서 **Dev Mode**로 전환합니다 (또는 `Shift + D` 키 누르기)
   - 검사 패널(Inspect Panel)의 **MCP 서버** 섹션을 찾습니다
   - **"데스크톱 MCP 서버 활성화"** 버튼을 클릭합니다

3. **서버 확인**
   - 서버가 성공적으로 실행되면 창 하단에 확인 메시지가 표시됩니다
   - MCP 서버는 `http://127.0.0.1:3845/mcp`에서 로컬로 실행됩니다

## 2단계: Talk to Figma MCP 플러그인 설치

1. **플러그인 검색 및 설치**
   - Figma 커뮤니티에서 **"Talk to Figma MCP"** 플러그인을 검색합니다
   - 플러그인을 설치합니다

2. **플러그인 실행 및 연결**
   - 설치된 플러그인을 실행합니다
   - **"Connect"** 버튼을 클릭하여 MCP 서버에 연결합니다

## 3단계: Cursor에서 MCP 서버 설정

Cursor에서 MCP 서버를 설정하는 방법:

### 방법 1: Cursor 설정 UI 사용
1. Cursor에서 `Ctrl + ,` (또는 `Cmd + ,` on Mac)를 눌러 설정을 엽니다
2. "MCP" 또는 "Model Context Protocol"을 검색합니다
3. MCP 서버 설정에 다음 정보를 추가합니다:
   - **서버 이름**: `figma`
   - **서버 URL**: `http://127.0.0.1:3845/mcp`

### 방법 2: 설정 파일 직접 편집
1. Cursor 설정 파일 위치:
   - Windows: `%APPDATA%\Cursor\User\settings.json`
   - 또는 Cursor 설정에서 "Open Settings (JSON)" 선택

2. 설정 파일에 다음을 추가:
```json
{
  "mcp.servers": {
    "figma": {
      "url": "http://127.0.0.1:3845/mcp"
    }
  }
}
```

### 방법 3: Cursor AI에게 요청
Cursor의 AI 채팅에서 다음과 같이 요청할 수 있습니다:
```
"Figma MCP 서버를 추가해줘. URL은 http://127.0.0.1:3845/mcp 이고 이름은 figma야"
```

## 4단계: 연결 확인

1. Figma에서 MCP 서버가 활성화되어 있는지 확인합니다
2. Cursor에서 MCP 서버 연결 상태를 확인합니다
3. Cursor AI 채팅에서 Figma 관련 작업을 요청해봅니다

## 문제 해결

### MCP 서버에 연결할 수 없는 경우
- Figma 데스크톱 앱이 실행 중인지 확인
- Dev Mode가 활성화되어 있는지 확인
- MCP 서버가 `http://127.0.0.1:3845/mcp`에서 실행 중인지 확인
- 방화벽이 로컬 연결을 차단하지 않는지 확인

### 플러그인이 연결되지 않는 경우
- Figma 앱을 재시작해보세요
- MCP 서버를 비활성화했다가 다시 활성화해보세요
- 플러그인을 재설치해보세요

## 참고 자료

- [Figma MCP 서버 가이드](https://help.figma.com/hc/ko/articles/32132100833559-Figma-MCP-%EC%84%9C%EB%B2%84-%EA%B0%80%EC%9D%B4%EB%93%9C)
- Figma 커뮤니티에서 "Talk to Figma MCP" 플러그인 검색

