# news-summary-app (THE HUMBLE POST)

겸손은 힘들다 뉴스 요약본을 볼 수 있는 모바일 애플리케이션(React Native + Expo)입니다. 빈티지 신문 스타일의 UI로 마크다운 형식의 일일 요약본을 백엔드 서버로부터 가져와 제공합니다.

## 주요 스택
- **Framework**: Expo (React Native)
- **HTTP Client**: Axios
- **Markdown Renderer**: React-Native-Markdown-Display
- **UI Components**: React-Native-Svg, DateTimePicker

## 실행 및 개발 환경 설정

1. **의존성 패키지 설치**
   ```bash
   npm install
   ```

2. **환경변수 설정 (`.env`)**
   루트 경로의 `.env` 파일에 백엔드 API 주소를 설정합니다.
   ```env
   EXPO_PUBLIC_API_URL=http://localhost:8000/today-summaries
   ```

3. **로컬 실행**
   ```bash
   npx expo start -c
   ```

---

## Expo EAS 배포 가이드

EAS(Expo Application Services)를 사용하여 빌드 및 업데이트를 배포하는 명령어 요약입니다.

### 1. EAS CLI 설치 & 로그인
```bash
# EAS CLI 전역 설치 (권한 오류 발생 시 앞에 sudo 추가)
npm install -g eas-cli

# Expo 계정 로그인
eas login
```

### 2. 프로젝트 초기화 (최초 1회)
```bash
# Expo 프로젝트와 EAS 연동 초기화
eas project:init
```

### 3. OTA (Over-The-Air) 실시간 업데이트 배포
앱스토어/플레이스토어 재심사 없이, 사용자 앱의 JavaScript 번들과 에셋을 즉각 무선으로 업데이트합니다.
```bash
# production 브랜치로 즉시 배포 진행
eas update --branch production --message "업데이트 사유 입력"
```
