window.GROWTH_CONFIG = {
  course: "AI활용 출판&광고콘텐츠 제작 전문가 양성과정",
  issuer: "그린컴퓨터아카데미 수원",
  reportDate: "2026.08.13",
  reportTitle: "훈련생 성장 종합 결과",
  sourceSheetUrl: "https://docs.google.com/spreadsheets/d/1KrOHVkR38Ms6IQkNkTxFTjkIo9v7jkAKNGE-OfxjF8w/edit?gid=1039441313#gid=1039441313",
  sourceText: "평가결과 공통 · 본(재)평가(개인별) · 프로젝트1/2/3 평가결과 탭 기준",
  metrics: {
    totalStudents: 12,
    scoredStudents: 11,
    dropoutStudents: 1,
    overallAverage: 85.0,
    videoAverage: 80.4,
    projectAverage: 89.6,
    topStudent: "허O아 93.0점"
  },
  criteria: [
    "프로젝트1·2·3 기업 피드백 대시보드는 출판 부문 능력단위 1~7과 해당 프로젝트 평가만 반영하며, 영상 과목은 포함하지 않습니다.",
    "본 종합 결과는 개인 이수·수료 및 사후관리 판단용으로 영상 + 출판 능력단위 1~7 + 프로젝트1·2·3 확정 점수를 함께 확인합니다.",
    "동료평가는 점수 평균에 섞지 않고 능력단위7과 프로젝트1 수행 맥락을 별도 영역으로 구분해 확인합니다.",
    "취업, 수료/이수, 중탈, 미응시는 상태값으로 보존하고 점수로 환산하지 않습니다. 종합점수는 숫자로 확정된 항목만 평균 산정합니다."
  ],
  links: [
    {
      label: "프로젝트1 기업 화면",
      url: "https://greenartsw.github.io/2026biz1/student-report-html/cover.html"
    },
    {
      label: "프로젝트2 기업 화면",
      url: "https://greenartsw.github.io/2026biz1/student-report-html/cover2.html"
    },
    {
      label: "프로젝트3 기업 화면",
      url: "https://greenartsw.github.io/2026biz1/student-report-html/cover3.html"
    },
    {
      label: "프로젝트3 관리자",
      url: "https://greenartsw.github.io/2026biz1/student-report-html/index.html?project=project3&view=all&theme=white&admin=1"
    }
  ]
};

window.GROWTH_PEER_ASSESSMENTS = {
  unit7: {
    label: "능력단위7 광고·브랜딩 동료평가",
    source: "능력단위7 팀별 역량 피드백&개인 성과 기술서 응답 원자료",
    sourceUrl: "https://drive.google.com/drive/folders/1GirW8gSPGEnmtLwJytZnxOD_oz0Cw47Y",
    values: {}
  },
  project1: {
    label: "프로젝트1 팀 수행 동료평가",
    source: "프로젝트1 평가결과 탭 동료평가·자기평가·교수자협업",
    sourceUrl: "https://drive.google.com/drive/folders/1UoVbII_HwVnu6IpUFGIJiTh8mWy0WY_M",
    values: {
      "김O정": { peer: 84, self: 88, instructor: 78 },
      "김O림": { peer: 88, self: 86, instructor: 84 },
      "김O수": { peer: 90, self: 89, instructor: 88 },
      "김O교": { peer: 92, self: 93, instructor: 90 },
      "노O진": { peer: 89, self: 90, instructor: 86 },
      "문O권": { peer: 82, self: 81, instructor: 80 },
      "박O람": { peer: 90, self: 89, instructor: 88 },
      "배O연": { peer: 94, self: 92, instructor: 91 },
      "신O정": { peer: 84, self: 85, instructor: 82 },
      "유O령": { peer: 93, self: 94, instructor: 90 },
      "장O혁": { peer: 89, self: 88, instructor: 86 },
      "허O아": { peer: 91, self: 90, instructor: 87 }
    }
  }
};

window.GROWTH_STUDENTS = [
  {
    name: "김O정",
    status: "",
    video: 68,
    publishingAverage: 76,
    finalAverage: 78.4,
    selfCheck: 90,
    attendanceRate: 96.7,
    project1: 82,
    project2: 90,
    project3: 80,
    projectAverage: 84,
    overall: 77.5,
    trend: "안정 유지·이론 확인",
    aftercare: "이론→실전 전환 훈련"
  },
  {
    name: "김O림",
    status: "중탈",
    video: 60,
    publishingAverage: "중탈",
    finalAverage: "중탈",
    selfCheck: "중탈",
    attendanceRate: 61,
    project1: "중탈",
    project2: "중탈",
    project3: "중탈",
    projectAverage: "중탈",
    overall: "중탈",
    trend: "중탈",
    aftercare: "중탈자 별도 관리"
  },
  {
    name: "김O수",
    status: "8/3취업",
    video: 79,
    publishingAverage: 87.7,
    finalAverage: 88.1,
    selfCheck: 98.6,
    attendanceRate: 95.1,
    project1: 89,
    project2: 90,
    project3: "취업",
    projectAverage: 89.5,
    overall: 87.2,
    trend: "안정 유지·이론 확인",
    aftercare: "수행 안정화·산출물 피드백"
  },
  {
    name: "김O교",
    status: "80%이상수료 / 7/20취업",
    video: 93,
    publishingAverage: 82.3,
    finalAverage: 81.5,
    selfCheck: 95.7,
    attendanceRate: 80.5,
    project1: 76,
    project2: "취업",
    project3: "취업",
    projectAverage: 76,
    overall: 82.8,
    trend: "성장 확인·이론 안정",
    aftercare: "강점 유지·실무 응용 확장"
  },
  {
    name: "노O진",
    status: "",
    video: 82,
    publishingAverage: 82.9,
    finalAverage: 84.3,
    selfCheck: 97.1,
    attendanceRate: 95.9,
    project1: 89,
    project2: 85,
    project3: 89,
    projectAverage: 87.7,
    overall: 84.1,
    trend: "안정 유지·이론 확인",
    aftercare: "수행 안정화·산출물 피드백"
  },
  {
    name: "문O권",
    status: "80%이상수료 / 수료·이수",
    video: 60,
    publishingAverage: 73.7,
    finalAverage: 73,
    selfCheck: 90,
    attendanceRate: 80.5,
    project1: 68,
    project2: "수료/이수",
    project3: "수료/이수",
    projectAverage: 68,
    overall: 71.6,
    trend: "이론 우수·실전 보완",
    aftercare: "이론→실전 전환 훈련"
  },
  {
    name: "박O람",
    status: "",
    video: 77,
    publishingAverage: 88.1,
    finalAverage: 89.6,
    selfCheck: 98.6,
    attendanceRate: 91.9,
    project1: 98,
    project2: 91,
    project3: 90,
    projectAverage: 93,
    overall: 88.5,
    trend: "성장 우수·이론 우수",
    aftercare: "심화 과제·포트폴리오 고도화"
  },
  {
    name: "배O연",
    status: "",
    video: 62,
    publishingAverage: 90,
    finalAverage: 90.4,
    selfCheck: 84.3,
    attendanceRate: 96.7,
    project1: 98,
    project2: 82,
    project3: 94,
    projectAverage: 91.3,
    overall: 87.8,
    trend: "안정 유지·이론 확인",
    aftercare: "기초 재점검·반복 실습"
  },
  {
    name: "신O정",
    status: "",
    video: 80,
    publishingAverage: 82.3,
    finalAverage: 85.7,
    selfCheck: 100,
    attendanceRate: 95.1,
    project1: 91,
    project2: 98,
    project3: 92,
    projectAverage: 93.7,
    overall: 85.2,
    trend: "안정 유지·이론 확인",
    aftercare: "수행 안정화·산출물 피드백"
  },
  {
    name: "유O령",
    status: "",
    video: 95,
    publishingAverage: 84.3,
    finalAverage: 85.9,
    selfCheck: 90,
    attendanceRate: 93.5,
    project1: 90,
    project2: 89,
    project3: 90,
    projectAverage: 89.7,
    overall: 86.7,
    trend: "성장 우수·이론 우수",
    aftercare: "심화 과제·포트폴리오 고도화"
  },
  {
    name: "장O혁",
    status: "",
    video: 93,
    publishingAverage: 88.9,
    finalAverage: 89.9,
    selfCheck: 98.6,
    attendanceRate: 100,
    project1: 97,
    project2: 90,
    project3: 90,
    projectAverage: 92.3,
    overall: 90.2,
    trend: "성장 우수·이론 우수",
    aftercare: "심화 과제·포트폴리오 고도화"
  },
  {
    name: "허O아",
    status: "",
    video: 95,
    publishingAverage: 91.1,
    finalAverage: 92.8,
    selfCheck: 98.6,
    attendanceRate: 90.2,
    project1: 98,
    project2: 100,
    project3: 92,
    projectAverage: 96.7,
    overall: 93,
    trend: "성장 우수·이론 우수",
    aftercare: "심화 과제·포트폴리오 고도화"
  }
];
