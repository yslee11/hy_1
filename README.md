# 도시 가로경관 인식 조사 설문 시스템

## 📋 개요
이 시스템은 도시 가로경관 이미지에 대한 시민들의 인식을 조사하는 웹 기반 설문 도구입니다.

### 주요 기능
- **그룹별 이미지 관리**: 성별×연령대별로 12개 그룹 폴더 구성
- **순차적 이미지 할당**: 중복 없이 모든 이미지를 순서대로 평가
- **다중 평가 지표**: 심미성, 보행성, 활력, 우울감, 지루함
- **자동 데이터 수집**: Google Sheets와 연동하여 실시간 저장
- **동시 접속 지원**: 여러 사용자가 동시에 설문 가능

## 🚀 설정 가이드

### 1. GitHub 저장소 설정

#### 1.1 저장소 생성
1. GitHub에서 새 저장소 생성 (예: `streetscape-survey`)
2. Public으로 설정 (이미지 접근을 위해 필요)

#### 1.2 이미지 폴더 구조 생성
```
images/
├── 남_10대/
│   ├── image001.jpg
│   ├── image002.jpg
│   └── ...
├── 남_20대/
├── 남_30대/
├── 남_40대/
├── 남_50대/
├── 남_60대이상/
├── 여_10대/
├── 여_20대/
├── 여_30대/
├── 여_40대/
├── 여_50대/
└── 여_60대이상/
```

각 폴더에 500장의 이미지를 업로드합니다.

### 2. Google Sheets 설정

#### 2.1 스프레드시트 생성
1. Google Drive에서 새 스프레드시트 생성
2. 스프레드시트 ID 복사 (URL에서 `/d/` 와 `/edit` 사이의 문자열)

#### 2.2 Google Apps Script 설정
1. 스프레드시트에서 `확장 프로그램` > `Apps Script` 클릭
2. `app_script.gs` 파일 내용 복사하여 붙여넣기
3. `SPREADSHEET_ID` 부분에 복사한 ID 입력

#### 2.3 웹 앱 배포
1. Apps Script 편집기에서 `배포` > `새 배포` 클릭
2. 유형: `웹 앱` 선택
3. 설정:
   - 설명: "가로경관 설문조사"
   - 다음 사용자 신분으로 실행: "나"
   - 액세스 권한: "모든 사용자"
4. `배포` 클릭 후 나타나는 URL 복사

### 3. 웹사이트 설정

#### 3.1 코드 수정
`script.js` 파일에서 다음 항목 수정:
```javascript
const GITHUB = {
  owner: "your-github-username",    // 본인의 GitHub 사용자명
  repo: "streetscape-survey",        // 생성한 저장소 이름
  branch: "main",
  baseImagePath: "images"
};

const APPS_SCRIPT_URL = "복사한_웹앱_URL";
```

#### 3.2 GitHub Pages 배포
1. 저장소에 `index.html`, `script.js`, `style.css` 업로드
2. Settings > Pages > Source를 "Deploy from a branch"로 설정
3. Branch를 "main", 폴더를 "/ (root)"로 설정
4. Save 클릭

## 📊 데이터 구조

### Google Sheets 구조
- **Metadata 시트**: 각 그룹의 진행 상황 추적
  - GroupID: 그룹 식별자 (예: "남_20대")
  - LastImageIndex: 마지막으로 평가한 이미지 인덱스
  - LastUpdated: 마지막 업데이트 시간
  - TotalResponses: 총 응답 수

- **그룹별 시트**: 실제 평가 데이터
  - timestamp: 응답 시간
  - userID: 익명 사용자 ID
  - gender: 성별
  - age: 연령대
  - job: 직업
  - jobDetail: 직업 상세 (기타 선택시)
  - imageID: 이미지 파일명
  - imageIndex: 이미지 순서
  - aesthetic: 심미성 점수 (0-10)
  - walkability: 보행성 점수 (0-10)
  - vitality: 활력 점수 (0-10)
  - depression: 우울감 점수 (0-10)
  - boredom: 지루함 점수 (0-10)

## 🔧 평가 지표 수정 방법

`script.js`에서 `EVALUATION_CRITERIA` 배열을 수정:

```javascript
const EVALUATION_CRITERIA = [
  { id: "aesthetic", name: "심미성", description: "아름답고 보기 좋은 정도" },
  { id: "walkability", name: "보행성", description: "걷기 편하고 안전한 정도" },
  // 새로운 지표 추가
  { id: "safety", name: "안전성", description: "범죄로부터 안전한 정도" },
  // 기존 지표 제거하거나 수정
];
```

Apps Script의 헤더도 함께 수정해야 합니다:
```javascript
const headers = [
  // ... 기본 필드들
  "aesthetic",
  "walkability",
  "safety",  // 새로 추가한 지표
  // ...
];
```

## 🐛 문제 해결

### 이미지가 로드되지 않는 경우
1. GitHub 저장소가 Public인지 확인
2. 이미지 경로가 올바른지 확인
3. 이미지 파일 확장자 확인 (.jpg, .jpeg, .png, .webp만 지원)

### 데이터가 저장되지 않는 경우
1. Apps Script URL이 올바른지 확인
2. Google Sheets 권한 확인
3. 브라우저 콘솔에서 오류 메시지 확인

### 동시 접속 문제
- 각 사용자는 고유한 userID를 받으며, 이미지는 순차적으로 할당됩니다
- 동일한 시간에 시작해도 겹치지 않도록 설계되었습니다

## 📈 통계 조회

Google Apps Script에서 `getStatistics()` 함수 실행하여 전체 통계 확인 가능:
- 총 응답 수
- 그룹별 진행 상황
- 마지막 업데이트 시간

## 🔒 보안 고려사항

- 익명 사용자 ID 사용으로 개인정보 보호
- 직접적인 개인 식별 정보 수집하지 않음
- 데이터는 연구 목적으로만 사용

## 📱 모바일 대응

- 반응형 디자인으로 모바일 기기에서도 사용 가능
- 터치 인터페이스 지원
- 이미지 크기 자동 조정