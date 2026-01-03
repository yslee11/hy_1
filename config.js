// config.js
export const CONFIG = {
  // 배포한 Apps Script Web App URL (끝이 /exec 로 끝나는 주소)
  APPS_SCRIPT_URL: "PASTE_YOUR_WEBAPP_EXEC_URL_HERE",

  // 이미지가 있는 경로 (GitHub Pages 기준)
  IMAGE_BASE_PATH: "./images",

  // 폴더명 규칙: `${gender}_${ageFolder}`
  // gender: male/female
  // ageFolder: 10,20,30,40,50,60plus
  GROUP_FOLDER: (gender, ageFolder) => `${gender}_${ageFolder}`,

  // 설문 지표(여기만 수정하면 UI/저장 반영)
  // key는 저장용, label은 화면 표시, min/max/step은 슬라이더 범위
  METRICS: [
    { key: "aesthetic", label: "심미성", min: 1, max: 7, step: 1 },
    { key: "walkability", label: "보행성", min: 1, max: 7, step: 1 },
    { key: "vitality", label: "활력", min: 1, max: 7, step: 1 },
    { key: "depress", label: "우울감", min: 1, max: 7, step: 1 },
    { key: "boring", label: "지루함", min: 1, max: 7, step: 1 },
  ],

  // 응답 검증
  REQUIRE_ALL_METRICS: true,
};
