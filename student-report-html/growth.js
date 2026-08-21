const growthConfig = window.GROWTH_CONFIG || {};
const growthStudents = window.GROWTH_STUDENTS || [];
const growthPeerAssessments = window.GROWTH_PEER_ASSESSMENTS || {};
const growthSubjectDetail = window.GROWTH_SUBJECT_DETAIL || {};
const growthPdfEvidence = window.GROWTH_PDF_EVIDENCE || {};
const growthDeck = document.getElementById("growthDeck");
const growthParams = new URLSearchParams(location.search);

function escGrowth(value) {
  return String(value ?? "").replace(/[&<>"']/g, (match) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[match]);
}

function slugGrowth(value) {
  return String(value || "").replace(/\s+/g, "").toLowerCase();
}

function isGrowthMissing(value) {
  return value === null || value === undefined || value === "" || Number.isNaN(value);
}

function numericGrowth(value) {
  if (isGrowthMissing(value)) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function numberLabel(value, suffix = "") {
  if (isGrowthMissing(value)) return "-";
  if (typeof value === "number") return value.toFixed(1) + suffix;
  return String(value);
}

function avgGrowth(values) {
  const usable = values.map(numericGrowth).filter((value) => value !== null);
  if (!usable.length) return null;
  return usable.reduce((sum, value) => sum + value, 0) / usable.length;
}

function growthAdminModeEnabled() {
  return ["1", "true", "yes", "admin"].includes(String(growthParams.get("admin") || "").toLowerCase());
}

function setGrowthChrome(title, subtitle) {
  document.title = title;
  document.querySelectorAll("[data-growth-title]").forEach((item) => {
    item.textContent = title;
  });
  document.querySelectorAll("[data-growth-subtitle]").forEach((item) => {
    item.textContent = subtitle;
  });
  document.querySelectorAll("[data-admin-only]").forEach((item) => {
    item.hidden = !growthAdminModeEnabled();
  });
}

function selectedGrowthStudent() {
  const studentParam = slugGrowth(growthParams.get("student") || growthParams.get("name") || "");
  if (!studentParam) return null;
  return growthStudents.find((student) => (
    slugGrowth(student.name) === studentParam
    || slugGrowth(student.maskedName) === studentParam
  )) || null;
}

function statusTone(student) {
  const status = String(student.status || student.overall || "");
  if (status.includes("중탈")) return "status-alert";
  if (status.includes("취업") || status.includes("수료")) return "status-good";
  return "";
}

function renderMetric(label, value, meta, tone = "blue") {
  return `
    <div class="metric metric-${tone}">
      <span>${escGrowth(label)}</span>
      <strong>${escGrowth(value)}</strong>
      <em>${escGrowth(meta)}</em>
    </div>
  `;
}

function renderStudentRow(student) {
  const tone = statusTone(student);
  const detail = growthSubjectDetail[student.name] || {};
  return `
    <tr>
      <td class="score-strong">${escGrowth(student.name)}</td>
      <td class="status-cell ${tone}">${escGrowth(statusLabel(student))}</td>
      <td>${escGrowth(numberLabel(detail.preAssessment))}</td>
      <td>${escGrowth(numberLabel(detail.diagnosticAverage11))}</td>
      <td>${escGrowth(numberLabel(detail.videoFinal))}</td>
      <td>${escGrowth(numberLabel(detail.publishingFinal10))}</td>
      <td>${escGrowth(numberLabel(detail.selfCheckAverage6))}</td>
      <td>${escGrowth(numberLabel(student.attendanceRate, "%"))}</td>
      <td>${escGrowth(numberLabel(student.project1))}</td>
      <td>${escGrowth(numberLabel(student.project2))}</td>
      <td>${escGrowth(numberLabel(student.project3))}</td>
      <td class="score-strong">${escGrowth(numberLabel(student.overall))}</td>
      <td>${escGrowth(detail.aftercareShort || student.aftercare)}</td>
    </tr>
  `;
}

function peerRecord(student, key) {
  const group = growthPeerAssessments[key] || {};
  const values = group.values || {};
  return values[student.name] || values[student.maskedName] || null;
}

function peerScoreLine(record) {
  if (!record) return "원자료 확인됨 · 집계값 별도 반영 예정";
  const average = avgGrowth([record.peer, record.self, record.instructor]);
  return [
    "동료 " + numberLabel(record.peer),
    "자기 " + numberLabel(record.self),
    "교수자협업 " + numberLabel(record.instructor),
    "평균 " + numberLabel(average)
  ].join(" · ");
}

function renderPeerCard(key, student = null) {
  const group = growthPeerAssessments[key] || {};
  const record = student ? peerRecord(student, key) : null;
  let summary = "원자료 확인됨 · 집계값 별도 반영 예정";
  if (!student && key === "project1") {
    const records = Object.values(group.values || {});
    summary = [
      "동료 " + numberLabel(avgGrowth(records.map((item) => item.peer))),
      "자기 " + numberLabel(avgGrowth(records.map((item) => item.self))),
      "교수자협업 " + numberLabel(avgGrowth(records.map((item) => item.instructor)))
    ].join(" · ");
  }
  if (student) summary = peerScoreLine(record);
  const source = `<em>${escGrowth(group.source || "평가결과 종합 기준")}</em>`;
  return `
    <article class="peer-card">
      <span>${escGrowth(group.label || key)}</span>
      <strong>${escGrowth(summary)}</strong>
      ${source}
    </article>
  `;
}

function renderPeerPanel(student = null) {
  return `
    <div class="section-title">
      <h3>동료평가 별도 영역</h3>
      <span>평균 산식과 분리 표시</span>
    </div>
    <div class="peer-card-grid">
      ${renderPeerCard("unit7", student)}
      ${renderPeerCard("project1", student)}
    </div>
  `;
}

function renderStudentPeerSummary(student) {
  const record = peerRecord(student, "project1");
  if (!record) {
    return `<div class="student-peer-empty">확정된 프로젝트1 동료평가 점수가 없습니다.</div>`;
  }
  const items = [
    ["동료평가", record.peer],
    ["자기평가", record.self],
    ["교수자협업", record.instructor]
  ];
  const average = avgGrowth(items.map((item) => item[1]));
  return `
    <article class="student-peer-panel">
      <div class="student-peer-heading">
        <div><h3>동료평가 별도 영역</h3><span>프로젝트1 팀 수행 · 종합점수와 분리 표시</span></div>
        <strong>${escGrowth(numberLabel(average))}<small>평균</small></strong>
      </div>
      <div class="student-peer-bars">
        ${items.map(([label, value]) => `
          <div class="student-peer-row">
            <span>${escGrowth(label)}</span>
            <i><b style="width:${clampGrowth(value)}%"></b></i>
            <strong>${escGrowth(numberLabel(value))}</strong>
          </div>
        `).join("")}
      </div>
      <p>팀 수행 과정의 협업 경험을 동료·자기·교수자 관점으로 비교합니다.</p>
    </article>
  `;
}

function clampGrowth(value, min = 0, max = 100) {
  const number = numericGrowth(value);
  if (number === null) return min;
  return Math.min(max, Math.max(min, number));
}

function gradeByScore(value) {
  const number = numericGrowth(value);
  if (number === null) return String(value || "-");
  if (number >= 90) return "A";
  if (number >= 80) return "B+";
  if (number >= 70) return "B";
  return "보완";
}

function statusLabel(student) {
  const detail = growthSubjectDetail[student.name] || {};
  if (detail.displayStatus) return detail.displayStatus;
  const status = String(student.status || "").trim();
  if (status.includes("중탈")) return "중도탈락";
  if (status.includes("취업")) return "취업";
  if (status.includes("수료") || status.includes("이수")) return "수료";
  return "수료";
}

function scoreCell(value, missingLabel = "미실시") {
  return isGrowthMissing(value) ? missingLabel : numberLabel(value);
}

function renderSubjectScoreRows(student) {
  const detail = growthSubjectDetail[student.name] || {};
  const evidenceBySubject = growthPdfEvidence[student.name] || {};
  return (detail.subjects || []).map((subject, index) => {
    const evidence = evidenceBySubject[index] || {};
    const feedback = evidence.teacherFeedback || subject.teacherFeedback;
    const level = evidence.performanceLevel || subject.performanceLevel;
    const finalScore = numericGrowth(subject.final);
    const evaluationDetail = subject.evaluationDetail
      || (evidence.sourceTitle
        ? `${finalScore === null ? scoreCell(subject.final, "상태값") : numberLabel(finalScore) + "점"} · 수행준거·상세 배점은 개인 평가수행서 기준`
        : null);
    const evaluationFullText = evidence.evaluationFullText || null;
    return `
    <tr>
      <td>${index + 1}</td>
      <td>${escGrowth(subject.name)}</td>
      <td>${escGrowth(scoreCell(subject.diagnostic, "원자료 없음"))}</td>
      <td>${escGrowth(scoreCell(subject.final, "원자료 없음"))}</td>
      <td>${escGrowth(scoreCell(subject.selfCheck))}</td>
      <td class="${level ? "source-confirmed" : "source-missing"}">${escGrowth(level || "확인 필요")}</td>
      <td class="${feedback ? "source-confirmed" : "source-missing"}">
        ${feedback
          ? `<details class="evidence-details"><summary>교수자 의견 전체보기</summary><p>${escGrowth(feedback)}</p></details>`
          : "PDF 원문 확인 필요"}
      </td>
      <td class="${evaluationFullText ? "source-confirmed" : "source-missing"}">
        ${evaluationFullText
          ? `<details class="evidence-details evaluation-details"><summary>평가상세·수행준거 전체보기</summary><p>${escGrowth(evaluationFullText)}</p></details>`
          : escGrowth(evaluationDetail || "PDF 원문 확인 필요")}
      </td>
    </tr>
  `;
  }).join("");
}

function renderIndividualScoreDetail(student, adminEmbed = false) {
  const pageClass = adminEmbed
    ? "report-page growth-page growth-subject-page growth-admin-student-page"
    : "report-page growth-page growth-subject-page";
  return `
    <section class="${pageClass}" data-page="growth-student-detail" data-student="${escGrowth(student.name)}">
      <div class="subject-score-layout">
        <header class="subject-score-head">
          <div>
            <p>개인 성적표 · 2페이지</p>
            <h1>${escGrowth(student.name)} 과목별 평가 결과</h1>
            <span>${escGrowth(growthConfig.course || "")}</span>
          </div>
          <div class="subject-score-status">
            <span>훈련상태</span>
            <strong>${escGrowth(statusLabel(student))}</strong>
          </div>
        </header>
        <div class="subject-score-note">
          <strong>원자료 반영 기준</strong>
          <span>사전진단·본평가·셀프점검은 평가결과 종합 파일의 원점수입니다. 셀프점검 미실시 과목은 점수로 환산하지 않습니다.</span>
        </div>
        <div class="subject-score-table-wrap">
          <table class="subject-score-table">
            <thead>
              <tr>
                <th>No.</th><th>과목명</th><th>사전진단</th><th>본평가</th><th>셀프점검</th>
                <th>성취수준<br>1~5수준</th><th>교수자 피드백 Full version</th><th>평가상세·수행준거</th>
              </tr>
            </thead>
            <tbody>${renderSubjectScoreRows(student)}</tbody>
          </table>
        </div>
        <div class="subject-score-caution">
          <strong>확인 필요</strong>
          <span>개인 평가 PDF 124건의 평가상세·수행준거 전문과 성취수준을 반영했습니다. 별도 서술형 의견이 없는 영상 3건은 원문 확인 대상으로 구분했습니다.</span>
        </div>
        <footer>${escGrowth(growthConfig.issuer || "")} · 확인자 ${escGrowth(growthConfig.confirmer || "")}</footer>
      </div>
    </section>
  `;
}

function projectParticipation(student) {
  const projects = [student.project1, student.project2, student.project3];
  const participated = projects.filter((item) => numericGrowth(item) !== null).length;
  if (String(student.status || "").includes("중탈")) return "중탈";
  return Math.round((participated / projects.length) * 100);
}

function evaluationCoverage(student) {
  return [student.video, student.publishingAverage, student.projectAverage]
    .filter((value) => numericGrowth(value) !== null).length;
}

function evaluationCoverageLabel(student) {
  return `${evaluationCoverage(student)}/3`;
}

function summaryOpinion(student) {
  const trend = student.trend || "평가 결과 확인";
  const aftercare = student.aftercare || "후속 학습 지원 방향 확인";
  return `확정 점수 기준으로 ${trend} 흐름이 확인되며, 후속 지원은 ${aftercare} 중심으로 운영합니다.`;
}

function renderScoreBar(label, value) {
  const number = numericGrowth(value);
  const width = number === null ? 0 : clampGrowth(number);
  return `
    <div class="student-score-bar">
      <span>${escGrowth(label)}</span>
      <i><b style="width:${width}%"></b></i>
      <strong>${escGrowth(numberLabel(value))}</strong>
    </div>
  `;
}

function renderUnitScoreBars(student) {
  const labels = [
    "벡터드로잉",
    "디지털 이미지",
    "InDesign 편집",
    "AI 출판디자인",
    "Book Design",
    "ePub·PDF",
    "광고·브랜딩"
  ];
  const values = (student.unitScores && student.unitScores.publishing) || [];
  return labels.map((label, index) => renderScoreBar(label, values[index])).join("");
}

function chartSeries(student) {
  return [
    { label: "영상교과목", lines: ["영상", "교과목"], value: student.video },
    { label: "출판교과목(1~7단위)", lines: ["출판교과목", "(1~7단위)"], value: student.publishingAverage },
    { label: "프로젝트1", lines: ["프로젝트1"], value: student.project1 },
    { label: "프로젝트2", lines: ["프로젝트2"], value: student.project2 },
    { label: "프로젝트3", lines: ["프로젝트3"], value: student.project3 },
    { label: "종합", value: student.overall }
  ].filter((item) => numericGrowth(item.value) !== null);
}

function renderTrendChart(student) {
  const values = chartSeries(student);
  if (values.length < 2) {
    return `<div class="student-empty-chart">${escGrowth(statusLabel(student))} · 산정 가능 항목 부족</div>`;
  }
  const xStep = values.length > 1 ? 252 / (values.length - 1) : 0;
  const points = values.map((item, index) => {
    const x = 24 + (xStep * index);
    const y = 118 - (clampGrowth(item.value) * 0.94);
    return { ...item, x, y };
  });
  const polyline = points.map((point) => `${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(" ");
  return `
    <svg class="student-trend-svg" viewBox="0 0 300 148" role="img" aria-label="${escGrowth(student.name)} 평가 영역 비교">
      <g class="trend-grid">
        <line x1="24" y1="24" x2="276" y2="24"></line>
        <line x1="24" y1="48" x2="276" y2="48"></line>
        <line x1="24" y1="72" x2="276" y2="72"></line>
        <line x1="24" y1="96" x2="276" y2="96"></line>
        <line x1="24" y1="120" x2="276" y2="120"></line>
      </g>
      <polyline class="trend-line" points="${polyline}"></polyline>
      ${points.map((point) => `
        <g>
          <circle class="trend-dot" cx="${point.x.toFixed(1)}" cy="${point.y.toFixed(1)}" r="4.6"></circle>
          <text class="trend-score" x="${point.x.toFixed(1)}" y="${(point.y - 9).toFixed(1)}">${escGrowth(numberLabel(point.value))}</text>
          <text class="trend-label" x="${point.x.toFixed(1)}" y="136">
            ${(point.lines || [point.label]).map((line, lineIndex) => `<tspan x="${point.x.toFixed(1)}" dy="${lineIndex ? 10 : 0}">${escGrowth(line)}</tspan>`).join("")}
          </text>
        </g>
      `).join("")}
    </svg>
  `;
}

function renderEvaluationFlow(student) {
  const items = [
    { label: "영상 1개", value: student.video },
    { label: "출판 7개", value: student.publishingAverage },
    { label: "프로젝트 1·2·3", value: student.projectAverage },
    { label: "최종 종합", value: student.overall }
  ];
  return `
    <div class="result-growth-flow">
      ${items.map((item, index) => `
        <span>${escGrowth(item.label)}<br><b>${escGrowth(numberLabel(item.value))}</b></span>
        ${index < items.length - 1 ? "<i></i>" : ""}
      `).join("")}
    </div>
    <em class="result-flow-note">상태값 제외 · 숫자 확정 항목 평균</em>
  `;
}

function renderRadar(student) {
  const items = [
    { label: "영상교과목", value: student.video },
    { label: "출판교과목", value: student.publishingAverage },
    { label: "프로젝트1,2,3", value: student.projectAverage },
    { label: "셀프체크", value: student.selfCheck },
    { label: "출석", value: student.attendanceRate }
  ];
  const center = 82;
  const radius = 58;
  const axisPoints = items.map((item, index) => {
    const angle = (-90 + (360 / items.length) * index) * Math.PI / 180;
    const scoreRadius = radius * (clampGrowth(item.value) / 100);
    return {
      ...item,
      axisX: center + Math.cos(angle) * radius,
      axisY: center + Math.sin(angle) * radius,
      x: center + Math.cos(angle) * scoreRadius,
      y: center + Math.sin(angle) * scoreRadius,
      labelX: center + Math.cos(angle) * (radius + 18),
      labelY: center + Math.sin(angle) * (radius + 18)
    };
  });
  const polygon = axisPoints.map((point) => `${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(" ");
  return `
    <svg class="student-radar-svg" viewBox="0 0 164 164" role="img" aria-label="${escGrowth(student.name)} 역량 지표">
      <circle cx="82" cy="82" r="58"></circle>
      <circle cx="82" cy="82" r="39"></circle>
      <circle cx="82" cy="82" r="20"></circle>
      ${axisPoints.map((point) => `<line x1="82" y1="82" x2="${point.axisX.toFixed(1)}" y2="${point.axisY.toFixed(1)}"></line>`).join("")}
      <polygon points="${polygon}"></polygon>
      ${axisPoints.map((point) => `<text x="${point.labelX.toFixed(1)}" y="${point.labelY.toFixed(1)}">${escGrowth(point.label)}</text>`).join("")}
    </svg>
  `;
}

function projectGrade(value) {
  const number = numericGrowth(value);
  if (number === null) return String(value || "-");
  if (number >= 90) return "우수";
  if (number >= 80) return "양호";
  if (number >= 70) return "보완";
  return "집중보완";
}

function renderProjectRows(student) {
  return [
    ["프로젝트1", "더페이퍼 팀", student.project1],
    ["프로젝트2", "오름 개인", student.project2],
    ["프로젝트3", "온애드엔 개인", student.project3]
  ].map(([project, role, score]) => `
    <tr>
      <td>${escGrowth(project)}</td>
      <td>${escGrowth(role)}</td>
      <td>${escGrowth(numberLabel(score))}</td>
      <td>${escGrowth(projectGrade(score))}</td>
    </tr>
  `).join("");
}

function topStrengths(student) {
  const candidates = [
    ["영상 과목", student.video],
    ["출판 1~7 평균", student.publishingAverage],
    ["본(재)평가", student.finalAverage],
    ["셀프체크", student.selfCheck],
    ["출석률", student.attendanceRate],
    ["프로젝트 평균", student.projectAverage],
    ["종합점수", student.overall]
  ].filter(([, value]) => numericGrowth(value) !== null)
    .sort((a, b) => numericGrowth(b[1]) - numericGrowth(a[1]))
    .slice(0, 3);
  return candidates.map(([label, value]) => `${label} ${numberLabel(value)}`);
}

function supportFocus(student) {
  const lowItems = [
    ["영상", student.video],
    ["출판 1~7", student.publishingAverage],
    ["본평가", student.finalAverage],
    ["프로젝트", student.projectAverage]
  ].filter(([, value]) => {
    const number = numericGrowth(value);
    return number !== null && number < 80;
  }).map(([label, value]) => `${label} ${numberLabel(value)}`);
  if (lowItems.length) return lowItems;
  return [student.aftercare || "심화 과제·포트폴리오 고도화"];
}

function renderResultRows(student) {
  const rows = [
    ["출석", "출석률", numberLabel(student.attendanceRate, "%"), gradeByScore(student.attendanceRate)],
    ["영상교과목", "영상교과목", numberLabel(student.video), gradeByScore(student.video)],
    ["출판교과목", "출판교과목(1~7단위)", numberLabel(student.publishingAverage), gradeByScore(student.publishingAverage)],
    ["프로젝트1,2,3", "프로젝트1·2·3 평균", numberLabel(student.projectAverage), gradeByScore(student.projectAverage)]
  ].map((row) => `
    <tr>
      <td>${escGrowth(row[0])}</td>
      <td>${escGrowth(row[1])}</td>
      <td>${escGrowth(row[2])}</td>
      <td>${escGrowth(row[3])}</td>
    </tr>
  `).join("");
  return rows + `
    <tr class="result-total-row">
      <td colspan="2">종합</td>
      <td>${escGrowth(numberLabel(student.overall))}</td>
      <td>${escGrowth(gradeByScore(student.overall))}</td>
    </tr>
  `;
}

function topAftercareItems() {
  const groups = new Map();
  growthStudents.forEach((student) => {
    const detail = growthSubjectDetail[student.name] || {};
    const key = detail.aftercareShort || student.aftercare || "후속관리 기준 확인";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(student.name);
  });
  return [...groups.entries()].map(([label, names]) => `
    <li><strong>${escGrowth(label)}</strong>${escGrowth(names.join(" · "))}</li>
  `).join("");
}

function renderAccessGate() {
  setGrowthChrome("개인 종합 성적표", "메일 발송 링크 또는 관리자 링크로 확인");
  document.body.classList.add("growth-locked");
  return `
    <section class="report-page growth-page growth-access-page" data-page="growth-access">
      <div class="growth-access-card">
        <p class="eyebrow">성장 종합 결과</p>
        <h1>개인 종합 성적표</h1>
        <p>전체 종합표는 관리자 확인 화면에서만 열람합니다. 개인 성적표는 발송된 개별 링크 기준으로 제공합니다.</p>
      </div>
    </section>
  `;
}

function renderGrowthAdminPreparing() {
  setGrowthChrome("훈련생 성장 종합 결과", "관리자 검토 준비 중");
  document.body.classList.add("growth-admin-page", "growth-admin-preparing");
  return `
    <section class="report-page growth-page growth-preparing-page" data-page="growth-admin-preparing">
      <div class="growth-preparing-card">
        <p class="eyebrow">ADMIN MODE</p>
        <h1>성장 종합 결과<br>준비 중입니다.</h1>
        <p>현재는 개인별 성적표 발송을 우선 진행하고 있습니다.<br>종합 결과는 최종 검토 후 관리자 화면에 공개됩니다.</p>
        <span>${escGrowth(growthConfig.issuer || "")} · 관리자 검토용</span>
      </div>
    </section>
  `;
}

function renderGrowthPage() {
  const metrics = growthConfig.metrics || {};
  setGrowthChrome(growthConfig.reportTitle || "훈련생 성장 종합 결과", "영상 1개 + 출판 7개 + 프로젝트1·2·3 + 동료평가");
  document.body.classList.add("growth-admin-page");
  return `
    <section class="report-page growth-page" data-page="growth-summary">
      <div class="growth-layout">
        <header class="growth-title">
          <div>
            <h1>${escGrowth(growthConfig.reportTitle || "훈련생 성장 종합 결과")}</h1>
            <p>${escGrowth(growthConfig.course || "")}</p>
          </div>
          <div class="growth-mark">
            <strong>최종 종합</strong>
            <span>${escGrowth(growthConfig.reportDate || "")}<br>${escGrowth(growthConfig.sourceText || "")}</span>
          </div>
        </header>

        <section class="growth-kpis" aria-label="종합 핵심 지표">
          ${renderMetric("전체 대상", `${metrics.totalStudents}명`, `산정 ${metrics.scoredStudents}명 · 중탈 ${metrics.dropoutStudents}명`, "blue")}
          ${renderMetric("종합 평균", numberLabel(metrics.overallAverage), "영상+출판+프로젝트", "teal")}
          ${renderMetric("영상 평균", numberLabel(metrics.videoAverage), "개인 이수·수료 판단 포함", "blue")}
          ${renderMetric("프로젝트 평균", numberLabel(metrics.projectAverage), "확정 숫자 점수 28건", "teal")}
          ${renderMetric("상위 결과", metrics.topStudent || "-", "종합점수 기준", "amber")}
        </section>

        <section class="growth-main growth-summary-main">
          <div class="growth-panel growth-table-panel">
            <div class="section-title">
              <h3>훈련생별 성장 종합표</h3>
              <span>마스킹명 기준 · 상태값은 점수 환산하지 않음</span>
            </div>
            <div class="growth-table-wrap">
              <table class="growth-table">
                <thead>
                  <tr>
                    <th>훈련생</th>
                    <th>상태</th>
                    <th>사전평가</th>
                    <th>사전진단<br>(11과목)</th>
                    <th>영상교과목<br>(1과목) 본평가</th>
                    <th>출판교과목<br>(10과목) 본평가</th>
                    <th>셀프체크자기점검<br>(6과목)</th>
                    <th>출석률</th>
                    <th>프로젝트1<br>(본평가)</th>
                    <th>프로젝트2<br>(본평가)</th>
                    <th>프로젝트3<br>(본평가)</th>
                    <th>종합점수</th>
                    <th>사후관리 지원사항</th>
                  </tr>
                </thead>
                <tbody>${growthStudents.map(renderStudentRow).join("")}</tbody>
              </table>
            </div>
          </div>

        </section>

        <footer class="growth-links growth-links-report-only">
          <span>${escGrowth(growthConfig.issuer || "")} · 원본: 평가결과 종합 시트</span>
        </footer>
      </div>
    </section>
    <section class="report-page growth-page" data-page="growth-admin-detail">
      <div class="growth-layout growth-admin-detail-layout">
        <header class="growth-title">
          <div><h1>종합 결과 운영 기준</h1><p>관리자용 2페이지 · 개인 성적표 발송 전 확인</p></div>
          <div class="growth-mark"><strong>운영 참고</strong><span>${escGrowth(growthConfig.reportDate || "")}</span></div>
        </header>
        <section class="growth-admin-detail-grid">
          <aside class="growth-panel growth-note-panel">
            <div class="section-title">
              <h3>산정 기준</h3>
              <span>프로젝트 기업 대시보드와 구분</span>
            </div>
            <ul class="criteria-list">
              ${(growthConfig.criteria || []).map((item) => `<li>${escGrowth(item)}</li>`).join("")}
            </ul>
            ${renderPeerPanel()}
            <div class="section-title">
              <h3>사후관리 묶음</h3>
            </div>
            <ul class="aftercare-list">${topAftercareItems()}</ul>
          </aside>
        </section>

        <footer class="growth-links growth-links-report-only">
          <span>${escGrowth(growthConfig.issuer || "")} · 원본: 평가결과 종합 시트</span>
        </footer>
      </div>
    </section>
    ${growthStudents.map((student) => renderIndividualGrowthSection(student, true) + renderIndividualScoreDetail(student, true)).join("")}
  `;
}

function renderIndividualGrowthSection(student, adminEmbed = false) {
  const pageClass = adminEmbed
    ? "report-page growth-page growth-student-page growth-admin-student-page"
    : "report-page growth-page growth-student-page";
  const participation = projectParticipation(student);
  const trainingPeriod = growthConfig.trainingPeriod || "2026.02.10 ~ 2026.08.12";
  const instructors = growthConfig.instructors || "황혜진강사 / 박서연강사";
  const confirmer = growthConfig.confirmer || "황혜진 강사";
  return `
    <section class="${pageClass}" data-page="growth-student" data-student="${escGrowth(student.name)}">
      <div class="student-score-layout">
        <div class="student-score-main">
          <header class="student-score-header">
            <div class="student-brand">
              <img src="./assets/greensw_logo.png" alt="그린컴퓨터아카데미 수원" />
            </div>
            <h1>훈련생 성장 대시보드</h1>
            <div class="student-course-pill">
              <strong>${escGrowth(growthConfig.course || "")}</strong>
              <span>${escGrowth(trainingPeriod)}</span>
            </div>
          </header>

          <section class="student-kpi-strip" aria-label="개인 핵심 지표">
            <article>
              <span>출석률</span>
              <strong>${escGrowth(numberLabel(student.attendanceRate, "%"))}</strong>
              <em>HRD 출석자료 반영</em>
            </article>
            <article>
              <span>최종 종합</span>
              <strong>${escGrowth(numberLabel(student.overall))}</strong>
              <em>숫자 확정 항목 평균</em>
            </article>
            <article>
              <span>평가영역</span>
              <strong>${escGrowth(evaluationCoverageLabel(student))}</strong>
              <em>영상·출판·프로젝트</em>
            </article>
            <article>
              <span>프로젝트 참여</span>
              <strong>${escGrowth(typeof participation === "number" ? `${participation}%` : participation)}</strong>
              <em>프로젝트 1·2·3</em>
            </article>
            <article>
              <span>훈련상태</span>
              <strong>${escGrowth(statusLabel(student))}</strong>
              <em>상태값 점수 미환산</em>
            </article>
          </section>

          <section class="student-dashboard-grid">
            <article class="student-card student-profile-card">
              <div class="student-avatar" aria-hidden="true">${escGrowth(student.name.slice(0, 1))}</div>
              <h2>${escGrowth(student.name)}</h2>
              <dl>
                <div><dt>과정명</dt><dd>${escGrowth(growthConfig.course || "")}</dd></div>
                <div><dt>훈련상태</dt><dd>${escGrowth(statusLabel(student))}</dd></div>
                <div><dt>사후관리</dt><dd>${escGrowth(student.aftercare || "-")}</dd></div>
              </dl>
            </article>

            <article class="student-card student-trend-card">
              <div class="student-card-title">
                <h3>평가 영역 비교</h3>
                <span>영상·출판·프로젝트·종합</span>
              </div>
              ${renderTrendChart(student)}
            </article>

            <article class="student-card student-radar-card">
              <div class="student-card-title">
                <h3>역량별 평가</h3>
                <span>주요 확정 지표</span>
              </div>
              ${renderRadar(student)}
            </article>

            <article class="student-card student-bars-card">
              <div class="student-card-title">
                <h3>능력단위별 점수</h3>
                <span>출판 1~7 · 단위: 점</span>
              </div>
              ${renderUnitScoreBars(student)}
            </article>

            <article class="student-card student-project-card">
              <div class="student-card-title">
                <h3>프로젝트 수행 결과</h3>
                <span>기업맞춤 1·2·3</span>
              </div>
              <table>
                <thead><tr><th>프로젝트</th><th>구분</th><th>점수</th><th>등급</th></tr></thead>
                <tbody>${renderProjectRows(student)}</tbody>
              </table>
            </article>

            <article class="student-card student-fit-card">
              <div class="student-card-title">
                <h3>종합 적합도</h3>
                <span>사후관리 참고</span>
              </div>
              <div class="student-gauge" style="--fit:${clampGrowth(student.overall)}">
                <strong>${escGrowth(numberLabel(student.overall))}</strong>
                <span>${escGrowth(student.trend || "성장추이 확인")}</span>
              </div>
              <div class="fit-mini-grid">
                <span>프로젝트 <b>${escGrowth(numberLabel(student.projectAverage))}</b></span>
                <span>출석 <b>${escGrowth(numberLabel(student.attendanceRate, "%"))}</b></span>
                <span>셀프체크 <b>${escGrowth(numberLabel(student.selfCheck))}</b></span>
              </div>
            </article>
          </section>

          <section class="student-bottom-panels student-peer-section">
            ${renderStudentPeerSummary(student)}
          </section>
        </div>

        <aside class="student-result-sheet">
          <div class="result-sheet-head">
            <div class="result-icon" aria-hidden="true"></div>
            <div>
              <h2>훈련생 성적 결과서</h2>
              <p>개인 종합 성적표</p>
            </div>
          </div>
          <section>
            <h3>훈련생 정보</h3>
            <table>
              <tbody>
                <tr><th>훈련생명</th><td>${escGrowth(student.name)}</td></tr>
                <tr><th>과정명</th><td>${escGrowth(growthConfig.course || "")}</td></tr>
                <tr><th>훈련상태</th><td>${escGrowth(statusLabel(student))}</td></tr>
                <tr><th>훈련기간</th><td>${escGrowth(trainingPeriod)}</td></tr>
                <tr><th>훈련기관</th><td>${escGrowth(growthConfig.issuer || "")}</td></tr>
              </tbody>
            </table>
          </section>
          <section>
            <h3>평가 결과 요약 <small>단위: 점 / 100점 기준</small></h3>
            <table class="result-summary-table">
              <thead><tr><th>평가항목</th><th>기준</th><th>취득</th><th>등급</th></tr></thead>
              <tbody>${renderResultRows(student)}</tbody>
            </table>
          </section>
          <section>
            <h3>종합 산정 기준</h3>
            ${renderEvaluationFlow(student)}
          </section>
          <section class="confirm-box">
            <span>확인자</span>
            <strong class="confirm-signature">
              <b>지도교수&nbsp;&nbsp;${escGrowth(confirmer)}</b>
              <img src="./assets/instructor-stamp-hwang.png" alt="황혜진 강사 확인 도장" />
            </strong>
          </section>
        </aside>
      </div>
    </section>
  `;
}

function renderIndividualGrowthPage(student) {
  setGrowthChrome(`${student.name} 개인 종합 성적표`, "영상 1개 + 출판 7개 + 프로젝트1·2·3 + 동료평가");
  document.body.classList.add("growth-student-mode");
  return renderIndividualGrowthSection(student) + renderIndividualScoreDetail(student);
}

function renderGrowthApp() {
  const student = selectedGrowthStudent();
  if (student) return renderIndividualGrowthPage(student);
  if (growthAdminModeEnabled()) return renderGrowthAdminPreparing();
  return renderAccessGate();
}

growthDeck.innerHTML = renderGrowthApp();
