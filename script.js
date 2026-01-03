/***** ✅ 사용자가 직접 수정해야 하는 부분 *****/
// 깃허브 저장소 정보 입력
const GITHUB = {
  owner: "yslee11",      // ✅ 본인 깃허브 ID
  repo: "hy_1",   // ✅ 저장소 이름
  branch: "main",               // ✅ 브랜치 (보통 main)
  baseImagePath: "images"       // ✅ 이미지 기본 폴더 이름
};

// Google Apps Script Web App URL 입력
// ✅ Apps Script 코드를 수정한 후 새 배포 URL을 여기에 붙여넣으세요.
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyu2kE5vvScCJ46hF1Xiri_kLGdjgw8ZJ0oRXEh54Lwi50l74r85ihOrHPllH3VTDQ3/exec";

// ✅ 평가 지표 설정 (추가/수정 가능)
const EVALUATION_CRITERIA = [
  { id: "aesthetic", name: "심미성", description: "아름답고 보기 좋은 정도" },
  { id: "walkability", name: "보행성", description: "걷기 편하고 안전한 정도" },
  { id: "vitality", name: "활력", description: "활기차고 생동감 있는 정도" },
  { id: "depression", name: "우울감", description: "우울하거나 침체된 느낌" },
  { id: "boredom", name: "지루함", description: "단조롭고 지루한 느낌" }
];

/*****************************************************/

const IMAGES_PER_SURVEY = 20;
let currentImage = 0;
let responses = [];
let participant = { gender: "", age: "", job: "", jobDetail: "" };
let selectedImages = [];
let imageStartIndex = 0;
const userID = generateUserID();

function generateUserID() {
  return 'xxxx-4xxx-yxxx-xxxx'.replace(/[xy]/g, c => {
    const r = Math.random()*16|0, v = c === 'x' ? r : (r&0x3|0x8);
    return v.toString(16);
  });
}

function getImageID(url) {
  return url.split('/').pop();
}

function getGroupFolder() {
  // 성별과 연령대를 조합하여 폴더명 생성
  return `${participant.gender}_${participant.age}`;
}

// 페이지 전환
function showPage(pageId) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  document.getElementById(pageId).classList.add("active");
}

// 이미지 목록 불러오기 (GitHub API)
async function getImageList() {
  const groupFolder = getGroupFolder();
  const folderPath = `${GITHUB.baseImagePath}/${groupFolder}`;
  const api = `https://api.github.com/repos/${GITHUB.owner}/${GITHUB.repo}/git/trees/${GITHUB.branch}?recursive=1`;
  
  try {
    const res = await fetch(api);
    const data = await res.json();

    const exts = /\.(jpg|jpeg|png|webp)$/i;
    const images = data.tree
      .filter(item => item.type === "blob" && item.path.startsWith(`${folderPath}/`) && exts.test(item.path))
      .map(item => `https://raw.githubusercontent.com/${GITHUB.owner}/${GITHUB.repo}/${GITHUB.branch}/${item.path}`)
      .sort(); // 정렬하여 순서 보장
    
    return images;
  } catch (error) {
    console.error("이미지 목록 불러오기 실패:", error);
    throw error;
  }
}

// 현재 설문의 시작 인덱스 가져오기
async function getStartIndex() {
  try {
    // 서버에서 현재 그룹의 마지막 완료 인덱스 조회
    const result = await fetchLastIndex();
    return result.lastIndex + 1;
  } catch (error) {
    console.warn("시작 인덱스 조회 실패, 0부터 시작:", error);
    return 0;
  }
}

// 서버에서 마지막 인덱스 조회 (JSONP)
function fetchLastIndex() {
  return new Promise((resolve, reject) => {
    const callbackName = 'getIndexCallback_' + Date.now();
    const groupId = getGroupFolder();
    const url = `${APPS_SCRIPT_URL}?action=getLastIndex&group=${groupId}&callback=${callbackName}`;
    
    window[callbackName] = function(result) {
      clearTimeout(timeoutId);
      if (script && script.parentNode) {
        script.parentNode.removeChild(script);
      }
      delete window[callbackName];
      
      resolve(result);
    };

    const script = document.createElement('script');
    script.src = url;
    script.onerror = function() {
      clearTimeout(timeoutId);
      if (script && script.parentNode) {
        script.parentNode.removeChild(script);
      }
      delete window[callbackName];
      reject(new Error("네트워크 오류"));
    };
    
    const timeoutId = setTimeout(() => {
      if (script && script.parentNode) {
        script.parentNode.removeChild(script);
      }
      delete window[callbackName];
      reject(new Error("타임아웃"));
    }, 10000);
    
    document.head.appendChild(script);
  });
}

// 설문 초기화
async function initSurvey() {
  try {
    const allImages = await getImageList();
    
    if (allImages.length === 0) {
      throw new Error("이미지를 찾을 수 없습니다. 폴더 구조를 확인하세요.");
    }
    
    // 시작 인덱스 가져오기
    imageStartIndex = await getStartIndex();
    
    // 순환 처리
    const startIdx = imageStartIndex % allImages.length;
    const endIdx = Math.min(startIdx + IMAGES_PER_SURVEY, allImages.length);
    
    selectedImages = allImages.slice(startIdx, endIdx);
    
    // 부족한 경우 처음부터 추가
    if (selectedImages.length < IMAGES_PER_SURVEY) {
      const remaining = IMAGES_PER_SURVEY - selectedImages.length;
      selectedImages = selectedImages.concat(allImages.slice(0, remaining));
    }
    
    currentImage = 0;
    responses = [];
    createEvaluationForm();
    await loadImage();
  } catch (error) {
    alert("설문 초기화 실패: " + error.message);
    showPage("intro-page");
  }
}

// 평가 폼 생성
function createEvaluationForm() {
  const container = document.querySelector('.evaluation-container');
  container.innerHTML = '';
  
  EVALUATION_CRITERIA.forEach(criterion => {
    const div = document.createElement('div');
    div.className = 'evaluation-item';
    div.innerHTML = `
      <h4>${criterion.name}</h4>
      <p class="criterion-desc">${criterion.description}</p>
      <div class="scale" data-criterion="${criterion.id}">
        ${[...Array(11)].map((_, i) => `
          <label>
            <input type="radio" name="${criterion.id}" value="${i}">
            <span>${i}</span>
          </label>
        `).join('')}
      </div>
    `;
    container.appendChild(div);
  });
}

// 이미지 로딩
function loadImage() {
  const img = document.getElementById("survey-image");
  const loadingEl = document.getElementById("loading");
  
  loadingEl.style.display = "block";
  img.style.display = "none";
  
  img.onload = function() {
    loadingEl.style.display = "none";
    img.style.display = "block";
    updateProgress();
    clearAllSelections();
  };
  
  img.onerror = function() {
    loadingEl.style.display = "none";
    loadingEl.textContent = "이미지 로딩 실패";
    loadingEl.style.display = "block";
    updateProgress();
    clearAllSelections();
  };
  
  img.src = selectedImages[currentImage];
}

// 진행상황 업데이트
function updateProgress() {
  document.getElementById("progress").textContent = 
    `${currentImage + 1} / ${selectedImages.length}`;
}

// 모든 선택 초기화
function clearAllSelections() {
  EVALUATION_CRITERIA.forEach(criterion => {
    document.querySelectorAll(`input[name="${criterion.id}"]`).forEach(r => r.checked = false);
  });
}

// 평가 값 수집
function collectEvaluations() {
  const evaluations = {};
  
  for (const criterion of EVALUATION_CRITERIA) {
    const radios = document.querySelectorAll(`input[name="${criterion.id}"]`);
    let value = null;
    radios.forEach(r => { if (r.checked) value = r.value; });
    
    if (value === null) {
      alert(`⚠️ '${criterion.name}' 항목을 평가해주세요!`);
      return null;
    }
    
    evaluations[criterion.id] = parseInt(value);
  }
  
  return evaluations;
}

// 다음 질문
async function nextQuestion() {
  const evaluations = collectEvaluations();
  if (!evaluations) return;

  const response = {
    timestamp: new Date().toISOString(),
    userID,
    gender: participant.gender,
    age: participant.age,
    job: participant.job,
    jobDetail: participant.jobDetail,
    imageID: getImageID(selectedImages[currentImage]),
    imageIndex: imageStartIndex + currentImage,
    ...evaluations
  };

  responses.push(response);

  if (currentImage >= selectedImages.length - 1) {
    await submitSurvey();
    return;
  }

  currentImage++;
  loadImage();
}

// 이전 질문
function prevQuestion() {
  if (currentImage > 0) {
    currentImage--;
    responses.pop();
    loadImage();
  }
}

// 제출 함수
function submitSurvey() {
  return new Promise((resolve, reject) => {
    const submitData = {
      participant,
      userID,
      groupId: getGroupFolder(),
      responses,
      lastImageIndex: imageStartIndex + selectedImages.length - 1
    };

    console.log("제출할 데이터:", submitData);

    const callbackName = 'submitCallback_' + Date.now();
    const url = `${APPS_SCRIPT_URL}?action=submit&callback=${callbackName}&data=${encodeURIComponent(JSON.stringify(submitData))}`;
    
    window[callbackName] = function(result) {
      clearTimeout(timeoutId);
      if (script && script.parentNode) {
        script.parentNode.removeChild(script);
      }
      delete window[callbackName];
      
      if (result && result.status === "success") {
        console.log("제출 성공");
        showPage("end-page");
        resolve(result);
      } else {
        console.error("제출 실패:", result);
        alert("제출 중 오류 발생: " + (result ? result.message : "알 수 없는 오류"));
        reject(new Error(result ? result.message : "제출 실패"));
      }
    };

    const script = document.createElement('script');
    script.src = url;
    
    script.onerror = function() {
      clearTimeout(timeoutId);
      if (script && script.parentNode) {
        script.parentNode.removeChild(script);
      }
      delete window[callbackName];
      alert("네트워크 오류가 발생했습니다.");
      reject(new Error("네트워크 오류"));
    };
    
    const timeoutId = setTimeout(() => {
      if (script && script.parentNode) {
        script.parentNode.removeChild(script);
      }
      delete window[callbackName];
      alert("제출 시간이 초과되었습니다.");
      reject(new Error("타임아웃"));
    }, 30000);
    
    document.head.appendChild(script);
  });
}

// 이벤트 바인딩
document.addEventListener("DOMContentLoaded", () => {
  // 직업 선택 변경시 기타 입력 필드 표시
  document.getElementById("job").addEventListener("change", (e) => {
    const otherGroup = document.getElementById("job-other-group");
    if (e.target.value === "기타") {
      otherGroup.style.display = "block";
    } else {
      otherGroup.style.display = "none";
      document.getElementById("job-other").value = "";
    }
  });
  
  // 시작 버튼
  document.getElementById("startBtn").addEventListener("click", () => {
    const gender = document.querySelector('input[name="gender"]:checked');
    const age = document.getElementById("age").value;
    const job = document.getElementById("job").value;
    const jobOther = document.getElementById("job-other").value;
    
    if (!gender || !age || !job) {
      alert("⚠️ 모든 항목을 선택해주세요.");
      return;
    }
    
    if (job === "기타" && !jobOther.trim()) {
      alert("⚠️ 직업을 입력해주세요.");
      return;
    }
    
    participant.gender = gender.value;
    participant.age = age;
    participant.job = job;
    participant.jobDetail = job === "기타" ? jobOther : "";
    
    showPage("survey-page");
    initSurvey();
  });
  
  // 다음/이전 버튼
  document.getElementById("nextBtn").addEventListener("click", nextQuestion);
  document.getElementById("prevBtn").addEventListener("click", prevQuestion);
  
  // 다시 시작 버튼
  document.getElementById("restartBtn").addEventListener("click", () => {
    location.reload();
  });
});
