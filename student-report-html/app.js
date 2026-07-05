const cfg = window.REPORT_CONFIG;
const rawStudents = window.REPORT_STUDENTS;

function controlFallback(value = "") {
  return {
    value,
    innerHTML: "",
    textContent: "",
    addEventListener() {}
  };
}

const deck = document.getElementById("reportDeck");
const studentSelect = document.getElementById("studentSelect") || controlFallback("");
const themeSelect = document.getElementById("themeSelect") || controlFallback("white");
const viewSelect = document.getElementById("viewSelect") || controlFallback("all");
const captureMode = document.getElementById("captureMode") || controlFallback("캡처 모드");
const completedFeedbackStudents = new Set();
let completedFeedbackLoading = null;
let completedFeedbackLoaded = false;

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function maskName(value) {
  const chars = Array.from(String(value || ""));
  if (!chars.length || chars.includes("O") || chars.includes("○")) return chars.join("");
  if (chars.length === 1) return chars[0];
  if (chars.length === 2) return chars[0] + "O";
  return chars[0] + "O".repeat(chars.length - 2) + chars[chars.length - 1];
}

function maskNamesInText(value) {
  let text = String(value ?? "");
  (rawStudents || []).forEach((student) => {
    if (!student.name) return;
    const masked = student.maskedName || maskName(student.name);
    text = text.replace(new RegExp(escapeRegExp(student.name), "g"), masked);
  });
  return text;
}

function displayName(value) {
  const student = (rawStudents || []).find((item) => item.name === value || item.maskedName === value);
  return student ? (student.maskedName || maskName(student.name)) : maskName(value);
}

function esc(value) {
  return maskNamesInText(value).replace(/[&<>"']/g, (match) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[match]);
}

function isMissing(value) {
  return value === null || value === undefined || value === "" || value === "중탈";
}

function one(value) {
  if (isMissing(value)) return "-";
  return Number(value).toFixed(1);
}

function scoreLabel(value) {
  return isMissing(value) ? "중탈" : one(value) + "점";
}

function percentLabel(value) {
  return isMissing(value) ? "중탈" : value + "%";
}

function signed(value) {
  if (isMissing(value)) return "-";
  const number = Number(value);
  return `${number >= 0 ? "+" : ""}${one(number)}p`;
}

function slug(value) {
  return String(value || "").replace(/\s+/g, "").toLowerCase();
}

function avgScore(values) {
  const usable = values.filter((value) => !isMissing(value)).map(Number);
  if (!usable.length) return null;
  return usable.reduce((sum, value) => sum + value, 0) / usable.length;
}

function summaryProject1Score(student) {
  return student ? student.project1Score : null;
}

function projectAlignedText(value, student) {
  const score = summaryProject1Score(student);
  if (isMissing(score)) return value;
  const scoreText = one(score) + "점";
  return String(value ?? "")
    .replace(new RegExp("프로젝트1\\s*최종\\s*평가는\\s*\\d+(?:\\.\\d+)?점", "g"), "프로젝트1 최종 평가는 " + scoreText)
    .replace(new RegExp("프로젝트1\\s*(?:재평가|재시험)\\s*원점수\\s*\\d+/?90을\\s*90점\\s*만점\\s*패널티가\\s*적용된\\s*재평가\\s*원점수\\s*\\d+(?:\\.\\d+)?점", "g"), "프로젝트1 재평가 원점수는 팀 종합 기준 " + scoreText)
    .replace(new RegExp("프로젝트1\\s*(?:개인 평가 점수가\\s*)?\\d+(?:\\.\\d+)?점", "g"), "프로젝트1 " + scoreText);
}
function findTeam(studentName) {
  return cfg.teams.find((team) => team.members.includes(studentName)) || cfg.teams[0];
}

function classify(student) {
  if (student.status === "중탈") return "중탈";
  if (student.fit >= 94) return "최우수";
  if (student.fit >= 91) return "우수";
  if (student.project >= 91 || student.grade === "A") return "협업강점";
  if (student.final < 80 || student.fit < 85) return "보완관리";
  if (student.attendance < 90) return "출석관리";
  return "안정";
}
function buildInsights(student) {
  if (student.status === "중탈") {
    return {
      strengths: (student.strengths || []).slice(0, 4),
      needs: (student.needs || []).slice(0, 4),
      teacher: student.teacherOpinion || "중도탈락자로 확인되어 기업 제공용 통계에서 제외합니다."
    };
  }

  const strengths = (student.strengths && student.strengths.length) ? [...student.strengths] : [];
  const needs = (student.needs && student.needs.length) ? [...student.needs] : [];
  const growth = student.growth;

  if (!strengths.length) {
    if (student.fit >= 91) strengths.push(`채용 적합도 ${student.fit}%로 기업 검토 우선군에 해당합니다.`);
    if (summaryProject1Score(student) >= 90) strengths.push(`${cfg.projectName} 개인 평가 점수가 ${one(summaryProject1Score(student))}점으로 높습니다.`);
    if (student.project >= 90) strengths.push(`프로젝트 참여도/협업 지표가 ${one(student.project)}점으로 높습니다.`);
    if (student.attendance >= 97) strengths.push(`출석률 ${student.attendance}%로 과정 참여 안정성이 높습니다.`);
    if (student.selfCheck >= 98) strengths.push(`SELF CHECK ${one(student.selfCheck)}점으로 자기점검 태도가 우수합니다.`);
    if (!isMissing(growth) && growth >= 5) strengths.push(`사전평가 대비 본평가가 ${signed(growth)} 상승했습니다.`);
  }
  if (!strengths.length) strengths.push(`${cfg.projectName} 수행 흐름과 과정 참여 지표가 전반적으로 안정적입니다.`);

  if (!needs.length) {
    if (student.final < 80) needs.push(`본(재)평가 ${one(student.final)}점으로 실무 기초 보완 과제가 필요합니다.`);
    if (student.attendance < 90) needs.push(`출석률 ${student.attendance}%로 보강 일정과 참여 안정화 확인이 필요합니다.`);
    if (!isMissing(growth) && growth < 0) needs.push(`사전평가 대비 본평가가 ${signed(growth)}로 하락해 산출물 단위 원인 점검이 필요합니다.`);
    if (summaryProject1Score(student) < 85) needs.push(`${cfg.projectName} 산출물의 완성도와 개인 역할 설명을 보완해야 합니다.`);
    if (student.diagnostic < 75) needs.push(`사전진단 취약 단원을 중심으로 포트폴리오 설명을 정리해야 합니다.`);
  }
  if (!needs.length) needs.push("기업 제출 전 포트폴리오 설명 구조와 프로젝트 역할 서술을 더 선명하게 정리하면 좋습니다.");

  const teacher = student.teacherOpinion || "평가, 출석, 프로젝트 지표를 종합할 때 기업 과제 검토가 가능한 수준입니다.";
  return { strengths: strengths.slice(0, 4), needs: needs.slice(0, 4), teacher };
}
function enrich(student, index) {
  const team = findTeam(student.name);
  const growth = isMissing(student.final) || isMissing(student.pre) ? null : Number((student.final - student.pre).toFixed(1));
  const group = classify(student);
  return {
    ...student,
    index,
    team,
    growth,
    group,
    insights: buildInsights({ ...student, growth })
  };
}
const students = rawStudents.map(enrich);

function activeStudents() {
  return students.filter((student) => student.status !== "중탈");
}

function reportStudents() {
  return activeStudents();
}

function averageFor(list, key) {
  return avgScore(list.map((item) => item[key]));
}

function sumFor(list, key) {
  return list.reduce((sum, item) => sum + (isMissing(item[key]) ? 0 : Number(item[key])), 0);
}

function summaryMetric(label, value, meta, tone = "blue") {
  return [
    '<div class="summary-metric summary-metric-' + tone + '">',
      '<span>' + esc(label) + '</span>',
      '<strong>' + esc(value) + '</strong>',
      '<em>' + esc(meta) + '</em>',
    '</div>'
  ].join("");
}

function renderMatrixRow(student, index) {
  const fit = isMissing(student.fit) ? 0 : Number(student.fit);
  const fitTone = fit >= 93 ? "teal" : fit >= 90 ? "blue" : fit >= 85 ? "amber" : "coral";
  const width = Math.max(0, Math.min(100, fit));
  return [
    '<div class="matrix-row matrix-' + fitTone + '">',
      '<span class="matrix-rank">' + esc(index + 1) + '</span>',
      '<strong>' + esc(student.maskedName) + '</strong>',
      '<span>' + esc(student.team.id) + '</span>',
      '<span>' + esc(scoreLabel(student.final)) + '</span>',
      '<span>' + esc(scoreLabel(summaryProject1Score(student))) + '</span>',
      '<div class="matrix-fit"><i style="width:' + width + '%"></i><b>' + esc(percentLabel(student.fit)) + '</b></div>',
    '</div>'
  ].join("");
}

function renderTeamSummary(team, roster) {
  const members = roster.filter((student) => student.team.id === team.id);
  const scores = team.summaryScores || {};
  const avgFit = isMissing(scores.fit) ? averageFor(members, "fit") : scores.fit;
  const avgFinal = averageFor(members, "final");
  const avgProject = avgScore(members.map((student) => summaryProject1Score(student)));
  const memberNames = team.members.map((name) => {
    const student = students.find((item) => item.name === name);
    const inactive = student && student.status === "중탈";
    return '<span class="team-pill ' + (inactive ? 'team-pill-muted' : '') + '">' + esc(student ? student.maskedName : name) + '</span>';
  }).join("");
  return [
    '<article class="summary-team">',
      '<div><strong>' + esc(team.id) + '</strong></div>',
      '<div class="summary-team-score">',
        '<span>적합도 ' + esc(isMissing(avgFit) ? "-" : one(avgFit) + "%") + '</span>',
        '<span>본평가 ' + esc(scoreLabel(avgFinal)) + '</span>',
        '<span>프로젝트1 ' + esc(scoreLabel(avgProject)) + '</span>',
      '</div>',
      '<div class="summary-team-members">' + memberNames + '</div>',
      teamEvidence(team),
    '</article>'
  ].join("");
}

function teacherSummaryItems() {
  return [
    "벡터 드로잉과 편집 툴 운용은 반복 숙련과 시간 관리가 성취도를 가르는 핵심 항목입니다.",
    "InDesign, 전자책, AI 제작은 기획 의도와 그리드/타이포그래피/출력 전 점검을 함께 설명하면 설득력이 높습니다.",
    "프로젝트1은 수원시 시정소식지 재해석 과제로 MZ 타깃, 공공기관 톤, 팀 협업 산출물 완성도를 종합 확인했습니다."
  ];
}

function renderSummaryPage() {
  const active = activeStudents();
  const dropouts = students.filter((student) => student.status === "중탈");
  const finalAvg = averageFor(active, "final");
  const fitAvg = averageFor(active, "fit");
  const projectAvg = averageFor(active, "project");
  const project1Avg = avgScore(active.map((student) => summaryProject1Score(student)));
  const attendedDays = sumFor(active, "attendedDays");
  const totalDays = sumFor(active, "totalDays");
  const attendanceRate = totalDays ? attendedDays / totalDays * 100 : null;
  const highFit = active.filter((student) => !isMissing(student.fit) && student.fit >= 90);
  const collaborationA = active.filter((student) => student.grade === "A");
  const riskStudents = active.filter((student) => student.group === "보완관리" || student.group === "출석관리" || student.final < 80 || student.fit < 85);
  const matrix = [...active].sort((a, b) => Number(b.fit || 0) - Number(a.fit || 0));
  const topLine = matrix.slice(0, 3).map((student) => student.maskedName + " " + student.fit + "%").join("<br>");
  const riskLine = [
    ...dropouts.map((student) => student.name + " 중도탈락"),
    ...riskStudents.map((student) => student.maskedName + " " + student.group)
  ].join(" · ") || "주요 운영 리스크 없음";

  return [
    '<section class="report-page summary-page" data-page="summary">',
      '<div class="summary-header">',
        '<div class="summary-title">',
          '<h1>훈련생 성장 대시보드 종합</h1>',
        '</div>',
        '<div class="summary-mark">',
          '<strong>종합</strong>',
        '</div>',
      '</div>',
      '<div class="summary-body">',
        '<section class="summary-main">',
          '<div class="summary-kpis">',
            summaryMetric("대상 훈련생", students.length + "명", "통계 반영 " + active.length + "명 · 중탈 " + dropouts.length + "명", "blue"),
            summaryMetric("본(재)평가 평균", scoreLabel(finalAvg), "재평가 원점수 기준", finalAvg >= 88 ? "teal" : "blue"),
            summaryMetric("통합 출석률", isMissing(attendanceRate) ? "-" : one(attendanceRate) + "%", "총 80시간", attendanceRate >= 96 ? "teal" : "blue"),
            summaryMetric("채용 적합도", isMissing(fitAvg) ? "-" : one(fitAvg) + "%", highFit.length + "명 90% 이상", fitAvg >= 90 ? "teal" : "blue"),
            summaryMetric("프로젝트1 평균", scoreLabel(project1Avg), "참여도 평균 " + one(projectAvg) + "점", project1Avg >= 90 ? "teal" : "blue"),
          '</div>',
          '<section class="summary-panel matrix-panel">',
            '<div class="section-title"><h3>종합성과</h3><span>중탈 제외 통계 · 적합도 기준 정렬</span></div>',
            '<div class="matrix-head"><span>순위</span><span>훈련생</span><span>팀</span><span>본평가</span><span>프로젝트1</span><span>채용 적합도</span></div>',
            '<div class="matrix-list">' + matrix.map(renderMatrixRow).join("") + '</div>',
          '</section>',
        '</section>',
        '<aside class="summary-aside">',
          '<section class="summary-panel insight-panel">',
            '<div class="section-title"><h3>기업 맞춤 인재 추천</h3></div>',
            '<div class="insight-stack">',
              '<div><strong>' + esc(highFit.length) + '명</strong><span>채용 적합도 90% 이상</span></div>',
              '<div><strong>' + esc(collaborationA.length) + '명</strong><span>A등급 협업 지표</span></div>',
              '<div><strong>' + topLine + '</strong></div>',
            '</div>',
          '</section>',
          '<section class="summary-panel team-summary-panel">',
            '<div class="section-title"><h3>팀별 산출물</h3></div>',
            '<div class="summary-teams">' + cfg.teams.map((team) => renderTeamSummary(team, active)).join("") + '</div>',
          '</section>',
        '</aside>',
      '</div>',
      '<footer class="page-footer">그린컴퓨터아카데미 수원 · (주)더페이퍼</footer>',
    '</section>'
  ].join("");
}

function metric(label, value, meta, tone = "blue") {
  return `
    <div class="metric metric-${tone}">
      <span>${esc(label)}</span>
      <strong>${esc(value)}</strong>
      <em>${esc(meta)}</em>
    </div>
  `;
}

function bar(label, value, max = 100) {
  const width = isMissing(value) ? 0 : Math.max(0, Math.min(100, (Number(value) / max) * 100));
  return `
    <div class="bar-row">
      <div class="bar-copy">
        <span>${esc(label)}</span>
        <strong>${one(value)}</strong>
      </div>
      <div class="bar-track"><i style="width:${width}%"></i></div>
    </div>
  `;
}

function chip(text, tone = "neutral") {
  return `<span class="chip chip-${tone}">${esc(text)}</span>`;
}

function teamMembers(student) {
  return student.team.members.map((name) => `
    <li class="${name === student.name ? "active" : ""}">
      <span>${esc(name)}</span>
      <em>${name === student.name ? "피드백 대상" : "팀원"}</em>
    </li>
  `).join("");
}

function teamEvidence(team) {
  const order = ["기획서", "표지", "내지"];
  const files = team.outputFiles || [];
  const links = order.map((label) => files.find((file) => file.label === label)).filter(Boolean);
  if (!links.length) return "";
  return `<div class="team-evidence">${links.map((link) => `<a href="${esc(link.url)}" target="_blank" rel="noreferrer">${esc(link.label)}</a>`).join("")}</div>`;
}
function teamAggregateOpinion(student) {
  if (student && student.team && student.team.teamOpinion) return student.team.teamOpinion;
  return "팀 산출물의 완성도, 협업 과정, 기업 공유 전 보완 방향을 종합해 확인합니다.";
}
function radarAxes(student) {
  return [
    { label: "사전진단", value: student.diagnostic },
    { label: "본평가", value: student.final },
    { label: "SELF CHECK", value: student.selfCheck },
    { label: "프로젝트1", value: summaryProject1Score(student) },
    { label: "협업", value: avgScore([student.peer, student.selfEval, student.instructorEval]) },
    { label: "출석", value: student.attendance }
  ];
}

function radarPoint(index, count, radius, center = 160) {
  const angle = -Math.PI / 2 + (Math.PI * 2 * index) / count;
  return {
    x: center + Math.cos(angle) * radius,
    y: center + Math.sin(angle) * radius
  };
}

function pointsAttr(points) {
  return points.map((point) => one(point.x) + "," + one(point.y)).join(" ");
}

function radarChart(student) {
  const axes = radarAxes(student);
  const center = 160;
  const maxRadius = 104;
  const grid = [20, 40, 60, 80, 100].map((step) => {
    const points = axes.map((_, index) => radarPoint(index, axes.length, maxRadius * step / 100, center));
    return '<polygon class="radar-grid-shape" points="' + pointsAttr(points) + '"></polygon>';
  }).join("");
  const spokes = axes.map((axis, index) => {
    const end = radarPoint(index, axes.length, maxRadius, center);
    const label = radarPoint(index, axes.length, maxRadius + 34, center);
    const anchor = label.x < center - 10 ? "end" : label.x > center + 10 ? "start" : "middle";
    const score = isMissing(axis.value) ? "-" : one(axis.value);
    return [
      '<line class="radar-spoke" x1="' + center + '" y1="' + center + '" x2="' + one(end.x) + '" y2="' + one(end.y) + '"></line>',
      '<text class="radar-label" x="' + one(label.x) + '" y="' + one(label.y) + '" text-anchor="' + anchor + '">' + esc(axis.label) + '</text>',
      '<text class="radar-score" x="' + one(label.x) + '" y="' + one(label.y + 15) + '" text-anchor="' + anchor + '">' + esc(score) + '</text>'
    ].join("");
  }).join("");
  const dataPoints = axes.map((axis, index) => {
    const value = isMissing(axis.value) ? 0 : Math.max(0, Math.min(100, Number(axis.value)));
    return radarPoint(index, axes.length, maxRadius * value / 100, center);
  });
  const dots = dataPoints.map((point) => '<circle class="radar-dot" cx="' + one(point.x) + '" cy="' + one(point.y) + '" r="4.6"></circle>').join("");
  const status = student.status === "중탈" ? "중탈 학생은 개별 통계 참고용" : "6개 역량 100점 환산";

  return [
    '<div class="radar-card">',
      '<div class="radar-head"><strong>역량 6개 레이더</strong><span>' + esc(status) + '</span></div>',
      '<svg class="radar-svg" viewBox="0 0 320 320" role="img" aria-label="' + esc(student.name) + ' 역량 6개 레이더 차트">',
        grid,
        spokes,
        '<polygon class="radar-area" points="' + pointsAttr(dataPoints) + '"></polygon>',
        '<polyline class="radar-line" points="' + pointsAttr([...dataPoints, dataPoints[0]]) + '"></polyline>',
        dots,
      '</svg>',
    '</div>'
  ].join("");
}

function pageHeader(student, pageLabel) {
  return `
    <div class="page-header">
      <div class="header-copy">
        <h1>개인별 훈련생 성과 리포트</h1>
      </div>
      <div class="page-mark">
        <strong>${esc(pageLabel === "1P" ? "개인성적표" : pageLabel === "2P" ? "개인피드백" : pageLabel)}</strong>
        <span>${esc(cfg.projectName)} / ${esc(student.team.id)}</span>
      </div>
    </div>
  `;
}

function renderPageOne(student) {
  const projectTone = (summaryProject1Score(student) ?? student.project) >= 91 ? "teal" : (summaryProject1Score(student) ?? student.project) >= 85 ? "blue" : "amber";
  const fitTone = isMissing(student.fit) ? "coral" : student.fit >= 92 ? "teal" : student.fit >= 88 ? "blue" : "coral";
  return `
    <section class="report-page page-one" data-page="1" data-student="${esc(student.name)}">
      ${pageHeader(student, "1P")}
      <div class="page-one-grid">
        <section class="identity-panel">
          <div class="student-seal">${esc(student.name.slice(0, 1))}</div>
          <div>
            <div class="identity-title">
              <h2>${esc(student.name)}</h2>
              ${chip(student.maskedName)}
              ${chip(student.group, student.group === "중탈" || student.group === "보완관리" ? "coral" : student.group === "최우수" ? "teal" : "blue")}
            </div>
            <p>${esc(cfg.sourceNote)}</p>
            <div class="mini-summary">
              <span>사전평가 ${one(student.pre)}</span>
              <span>본평가 ${one(student.final)}</span>
              <span>프로젝트1 ${one(summaryProject1Score(student))}</span>
              <span>성장 ${signed(student.growth)}</span>
            </div>
          </div>
        </section>

        <section class="score-panel">
          <div class="section-title">
            <h3>개인별 성적표</h3>
            <span>평가 · 자기점검 · 프로젝트 · 출석 종합</span>
          </div>
          <div class="metric-grid">
            ${metric("본(재)평가", scoreLabel(student.final), `사전 대비 ${signed(student.growth)}`, isMissing(student.final) ? "coral" : student.final >= 88 ? "teal" : student.final >= 80 ? "blue" : "coral")}
            ${metric("채용 적합도", percentLabel(student.fit), "종합 산식", fitTone)}
            ${metric("프로젝트1 평가", scoreLabel(summaryProject1Score(student)), student.project1Note || "개인 평가의견서", projectTone)}
            ${metric("출석", percentLabel(student.attendance), `${student.attendedDays}/${student.totalDays}일`, student.attendance >= 95 ? "teal" : student.attendance >= 90 ? "blue" : "coral")}
          </div>
          <div class="competency-grid">
            ${radarChart(student)}
            <div class="bars bars-compact">
              ${bar("사전진단", student.diagnostic)}
              ${bar("본(재)평가", student.final)}
              ${bar("SELF CHECK", student.selfCheck)}
              ${bar("프로젝트1", summaryProject1Score(student))}
              ${bar("협업 평균", avgScore([student.peer, student.selfEval, student.instructorEval]))}
              ${bar("출석", student.attendance)}
            </div>
          </div>
          <div class="notice-line">
            <strong>산정 기준</strong>
            <span>채용 적합도 = 본(재)평가 40% + SELF CHECK 20% + 프로젝트 참여도 25% + 출석 15% · 재평가는 원점수 기준</span>
          </div>
        </section>

        <aside class="team-panel">
          <div class="section-title">
            <h3>${esc(student.team.id)} 팀 정보</h3>
          </div>
          <div class="company-box output-only">
            ${teamEvidence(student.team)}
          </div>
          <ul class="team-list">${teamMembers(student)}</ul>
          <div class="team-stats">
            ${metric("프로젝트 참여도", scoreLabel(student.project), student.grade, student.project >= 91 ? "teal" : student.project >= 86 ? "blue" : "amber")}
            ${metric("협업 평균", scoreLabel(avgScore([student.peer, student.selfEval, student.instructorEval])), "동료·자기·교수", "teal")}
          </div>
          <div class="teacher-box">
            <span>지도교수</span>
            <strong>${esc(cfg.instructors.join(", "))}</strong>
            <p>${esc(teamAggregateOpinion(student))}</p>
          </div>
        </aside>
      </div>
      <footer class="page-footer">그린컴퓨터아카데미 수원 · (주)더페이퍼</footer>
    </section>
  `;
}

function list(items, student = null) {
  return `<ul>${items.map((item) => `<li>${esc(student ? projectAlignedText(item, student) : item)}</li>`).join("")}</ul>`;
}

function feedbackEndpoint() {
  const params = new URLSearchParams(location.search);
  const fromQuery = params.get("feedbackEndpoint") || params.get("endpoint");
  if (fromQuery) {
    try { localStorage.setItem("studentReportFeedbackEndpoint", fromQuery); } catch (error) {}
    return fromQuery;
  }
  try {
    return cfg.feedbackEndpoint || localStorage.getItem("studentReportFeedbackEndpoint") || "";
  } catch (error) {
    return cfg.feedbackEndpoint || "";
  }
}

function setFeedbackStatus(form, message, tone = "neutral") {
  const status = form.querySelector("[data-feedback-status]");
  if (!status) return;
  status.textContent = message;
  status.dataset.tone = tone;
}

function feedbackFormStudent(form) {
  const page = form.closest(".report-page");
  const studentName = page ? page.dataset.student : selectedStudent().name;
  return students.find((item) => item.name === studentName || item.maskedName === studentName || displayName(item.name) === studentName) || selectedStudent();
}

function selectedRatingValue(form, student, index) {
  const names = new Set([
    student.name,
    student.maskedName,
    displayName(student.name)
  ].filter(Boolean).map((name) => name + "_" + index));
  const checked = [...form.querySelectorAll(".rating-options input[type='checkbox']")].find((input) => names.has(input.name) && input.checked);
  return checked ? checked.value : "";
}

function normalizeFeedbackKey(value) {
  return slug(String(value || "").replace(/[○]/g, "O"));
}

function feedbackStudentKeys(student) {
  return [
    student.name,
    student.maskedName,
    displayName(student.name)
  ].filter(Boolean).map(normalizeFeedbackKey);
}

function isFeedbackCompleted(student) {
  return feedbackStudentKeys(student).some((key) => completedFeedbackStudents.has(key));
}

function addCompletedFeedbackStudent(value) {
  const key = normalizeFeedbackKey(value);
  if (key) completedFeedbackStudents.add(key);
}

function applyCompletedButtonState(form, student) {
  const button = form.querySelector(".feedback-submit");
  if (!button) return;
  const completed = isFeedbackCompleted(student);
  form.classList.toggle("is-mentoring-complete", completed);
  button.disabled = completed;
  button.textContent = completed ? "멘토링 완료" : "훈련생 피드백 저장";
}

function applyCompletedButtonStates() {
  deck.querySelectorAll(".enterprise-form").forEach((form) => {
    applyCompletedButtonState(form, feedbackFormStudent(form));
  });
}

function completedFeedbackUrl(callbackName) {
  const endpoint = feedbackEndpoint();
  if (!endpoint) return "";
  const url = new URL(endpoint, location.href);
  url.searchParams.set("action", "completed");
  url.searchParams.set("callback", callbackName);
  return url.toString();
}

function loadCompletedFeedback(force = false) {
  if (completedFeedbackLoading && !force) return completedFeedbackLoading;
  const callbackName = "__studentReportCompleted_" + Date.now() + "_" + Math.random().toString(36).slice(2);
  const url = completedFeedbackUrl(callbackName);
  if (!url) return Promise.resolve(false);

  completedFeedbackLoading = new Promise((resolve) => {
    const script = document.createElement("script");
    const cleanup = () => {
      delete window[callbackName];
      script.remove();
      completedFeedbackLoading = null;
    };
    const timer = window.setTimeout(() => {
      cleanup();
      resolve(false);
    }, 8000);

    window[callbackName] = (data) => {
      window.clearTimeout(timer);
      completedFeedbackStudents.clear();
      ((data && data.completedStudents) || []).forEach(addCompletedFeedbackStudent);
      ((data && data.completedMaskedNames) || []).forEach(addCompletedFeedbackStudent);
      ((data && data.records) || []).forEach((record) => {
        addCompletedFeedbackStudent(record.student);
        addCompletedFeedbackStudent(record.maskedName);
      });
      completedFeedbackLoaded = true;
      applyCompletedButtonStates();
      cleanup();
      resolve(true);
    };

    script.onerror = () => {
      window.clearTimeout(timer);
      cleanup();
      resolve(false);
    };
    script.src = url;
    document.head.appendChild(script);
  });
  return completedFeedbackLoading;
}

async function waitForFeedbackCompletion(student, attempts = 8, delay = 1000) {
  for (let index = 0; index < attempts; index += 1) {
    await loadCompletedFeedback(true);
    if (isFeedbackCompleted(student)) return true;
    await new Promise((resolve) => window.setTimeout(resolve, delay));
  }
  return false;
}

function validateFeedbackForm(form) {
  const student = feedbackFormStudent(form);
  const missingItems = cfg.feedbackItems.filter((item, index) => !selectedRatingValue(form, student, index));
  const feedback = ((form.closest(".report-page") || form).querySelector(".feedback-lines textarea") || {}).value || "";
  const missingFeedback = !feedback.trim();
  if (!missingItems.length && !missingFeedback) return true;
  const message = displayName(student.name) + " 훈련생 피드백 평가항목 5개와 기업담당자 의견을 모두 입력해주세요.";
  const missing = [...missingItems];
  if (missingFeedback) missing.push("기업담당자 의견");
  setFeedbackStatus(form, message + " 미입력: " + missing.join(", "), "error");
  if (typeof window.alert === "function") window.alert(message);
  return false;
}

function collectFeedbackPayload(form) {
  const page = form.closest(".report-page");
  const student = feedbackFormStudent(form);
  const submittedAt = new Date().toISOString();
  const feedback = ((page || form).querySelector(".feedback-lines textarea") || {}).value || "";
  const ratings = {};
  cfg.feedbackItems.forEach((item, index) => {
    ratings[item] = selectedRatingValue(form, student, index);
  });
  return {
    submittedAt,
    student: student.name,
    maskedName: student.maskedName,
    team: student.team.id,
    company: student.team.company || cfg.companyName,
    finalScore: isMissing(student.final) ? "" : one(student.final),
    project1Score: isMissing(summaryProject1Score(student)) ? "" : one(summaryProject1Score(student)),
    fit: isMissing(student.fit) ? "" : student.fit,
    ratings,
    feedback,
    memo: "",
    targetChecked: true,
    theme: document.body.dataset.theme || "white",
    pageUrl: location.href,
    sheetUrl: cfg.feedbackSheetUrl || "",
    "제출시각": submittedAt,
    "훈련생": student.name,
    "마스킹명": student.maskedName,
    "팀": student.team.id,
    "기업": student.team.company || cfg.companyName,
    "본(재)평가": isMissing(student.final) ? "" : one(student.final),
    "프로젝트1": isMissing(summaryProject1Score(student)) ? "" : one(summaryProject1Score(student)),
    "채용적합도": isMissing(student.fit) ? "" : student.fit,
    "종합 피드백": feedback,
    "기업 메모": "",
    "회신대상체크": true,
    "테마": document.body.dataset.theme || "white",
    "페이지URL": location.href
  };
}

async function submitFeedback(form) {
  const student = feedbackFormStudent(form);
  if (isFeedbackCompleted(student)) {
    applyCompletedButtonState(form, student);
    return;
  }
  if (!validateFeedbackForm(form)) return;
  const endpoint = feedbackEndpoint();
  if (!endpoint) {
    setFeedbackStatus(form, "Apps Script 웹앱 URL이 아직 설정되지 않았습니다.", "error");
    return;
  }
  const button = form.querySelector(".feedback-submit");
  const payload = collectFeedbackPayload(form);
  if (button) button.disabled = true;
  setFeedbackStatus(form, "전송 중입니다...", "pending");
  try {
    await fetch(endpoint, {
      method: "POST",
      mode: "no-cors",
      body: JSON.stringify(payload)
    });
    setFeedbackStatus(form, "저장 요청을 보냈습니다. 시트 입력 여부를 확인 중입니다...", "pending");
    const saved = await waitForFeedbackCompletion(student);
    if (saved) {
      setFeedbackStatus(form, "입력되었습니다. 화면을 새로고침합니다...", "success");
      window.setTimeout(() => location.reload(), 900);
    } else {
      setFeedbackStatus(form, "저장 요청은 보냈지만 시트 입력이 확인되지 않았습니다. Apps Script 배포 상태를 확인해주세요.", "error");
      if (button) button.disabled = false;
    }
  } catch (error) {
    setFeedbackStatus(form, "전송 실패: " + error.message, "error");
    if (button) button.disabled = false;
  }
}

function coverCandidates(team) {
  const count = team.coverCandidateCount || (team.id === "팀3" ? 6 : 4);
  const teamNumber = (String(team.id).match(/\d+/) || [""])[0];
  return Array.from({ length: count }, (_, index) => ({
    id: `${slug(team.id)}-cover-${index + 1}`,
    label: `표지안 ${index + 1}`,
    image: `./assets/covers/${teamNumber}_cover_${index + 1}.jpg`
  }));
}

function coverFieldName(team, prefix = "cover") {
  return `${prefix}_${slug(team.id)}`;
}

function teamOutputFile(team, label) {
  return (team.outputFiles || []).find((file) => file.label === label) || null;
}

function selectedCoverForTeam(form, team) {
  const checked = form.querySelector(`input[name="${coverFieldName(team)}"]:checked`);
  if (!checked) return null;
  const candidates = coverCandidates(team);
  return candidates.find((candidate) => candidate.id === checked.value) || { id: checked.value, label: checked.value };
}

function validateCoverSelectionForm(form) {
  const missingTeams = (cfg.teams || []).filter((team) => !selectedCoverForTeam(form, team)).map((team) => team.id);
  if (!missingTeams.length) return true;
  const message = "팀별 표지를 모두 선택해주세요. 미선택: " + missingTeams.join(", ");
  setFeedbackStatus(form, message, "error");
  if (typeof window.alert === "function") window.alert(message);
  return false;
}

function coverSelectionSummary(selections) {
  return Object.entries(selections).map(([team, item]) => {
    const reason = item.reason ? ` / ${item.reason}` : "";
    return `${team}: ${item.selectedLabel || item.selectedId || "미선택"}${reason}`;
  }).join(" | ");
}

function collectCoverSelectionPayload(form) {
  const selections = {};
  (cfg.teams || []).forEach((team) => {
    const selected = selectedCoverForTeam(form, team);
    const reason = form.querySelector(`textarea[name="${coverFieldName(team, "reason")}"]`);
    const coverFile = teamOutputFile(team, "표지");
    selections[team.id] = {
      selectedId: selected ? selected.id : "",
      selectedLabel: selected ? selected.label : "",
      reason: reason ? reason.value : "",
      coverOutputUrl: coverFile ? coverFile.url : "",
      imageUrl: selected ? selected.image : ""
    };
  });
  return {
    responseType: "팀표지선정",
    submittedAt: new Date().toISOString(),
    company: cfg.companyName || "",
    selections,
    feedback: coverSelectionSummary(selections),
    theme: document.body.dataset.theme || "white",
    pageUrl: location.href,
    sheetUrl: cfg.feedbackSheetUrl || ""
  };
}

async function submitCoverSelection(form) {
  if (!validateCoverSelectionForm(form)) return;
  const endpoint = feedbackEndpoint();
  if (!endpoint) {
    setFeedbackStatus(form, "Apps Script 웹앱 URL이 아직 설정되지 않았습니다.", "error");
    return;
  }
  const button = form.querySelector(".feedback-submit");
  const payload = collectCoverSelectionPayload(form);
  if (button) button.disabled = true;
  setFeedbackStatus(form, "표지 선정 저장 중입니다...", "pending");
  try {
    await fetch(endpoint, {
      method: "POST",
      mode: "no-cors",
      body: JSON.stringify(payload)
    });
    setFeedbackStatus(form, "표지 선정 저장 요청을 보냈습니다.", "success");
  } catch (error) {
    setFeedbackStatus(form, "전송 실패: " + error.message, "error");
  } finally {
    if (button) button.disabled = false;
  }
}

function handleRatingCheck(event) {
  const input = event.target;
  if (!input || !input.matches || !input.matches(".rating-options input[type='checkbox']") || !input.checked) return;
  const group = input.closest(".rating-options");
  if (!group) return;
  [...group.querySelectorAll("input[type='checkbox']")].forEach((item) => {
    if (item !== input) item.checked = false;
  });
}

function handleFeedbackSubmit(event) {
  const form = event.target;
  if (!form || !form.classList) return;
  if (form.classList.contains("enterprise-form")) {
    event.preventDefault();
    submitFeedback(form);
    return;
  }
  if (form.classList.contains("cover-selection-form")) {
    event.preventDefault();
    submitCoverSelection(form);
  }
}

function ratingRow(student, item, index) {
  return `
    <div class="rating-row">
      <strong>${esc(item)}</strong>
      <div class="rating-options" role="group" aria-label="${esc(student.name)} ${esc(item)}">
        ${[5, 4, 3, 2, 1].map((score) => `
          <label>
            <input type="checkbox" name="${esc(student.name)}_${index}" value="${score}" />
            <span>${score}</span>
          </label>
        `).join("")}
      </div>
    </div>
  `;
}

function coverOption(team, candidate) {
  return `
    <label class="cover-option">
      <input type="radio" name="${coverFieldName(team)}" value="${esc(candidate.id)}" />
      <span class="cover-option-check" aria-hidden="true"></span>
      <span class="cover-thumb">
        <img src="${esc(candidate.image)}" alt="${esc(team.id)} ${esc(candidate.label)}" loading="lazy" />
        <span class="cover-thumb-label">${esc(candidate.label)}</span>
      </span>
    </label>
  `;
}

function renderCoverSelectionTeam(team) {
  return `
    <section class="cover-team-card ${team.id === "팀3" ? "wide" : ""}">
      <div class="cover-team-head">
        <h2>${esc(team.id)}</h2>
      </div>
      <div class="cover-team-body">
        <div class="cover-options">
          ${coverCandidates(team).map((candidate) => coverOption(team, candidate)).join("")}
        </div>
        <label class="cover-reason">
          <strong>선정 이유</strong>
          <textarea name="${coverFieldName(team, "reason")}" aria-label="${esc(team.id)} 표지 선정 이유" placeholder="선정 이유를 입력하세요."></textarea>
        </label>
      </div>
    </section>
  `;
}

function renderCoverSelectionPage() {
  return `
    <section class="report-page cover-selection-page" data-page="cover-selection">
      <form class="cover-selection-form">
        <header class="cover-selection-header">
          <div>
            <p class="eyebrow">기업 회신용</p>
            <h1>팀 표지 선정</h1>
          </div>
          <div class="cover-selection-actions">
            <div class="feedback-status" data-feedback-status aria-live="polite"></div>
            <button class="feedback-submit" type="submit">저장</button>
          </div>
        </header>
        <div class="cover-selection-grid">
          ${(cfg.teams || []).map((team) => renderCoverSelectionTeam(team)).join("")}
        </div>
      </form>
      <footer class="page-footer">그린컴퓨터아카데미 수원 · (주)더페이퍼</footer>
    </section>
  `;
}

function renderPageTwo(student) {
  return `
    <section class="report-page page-two" data-page="2" data-student="${esc(student.name)}">
      ${pageHeader(student, "2P")}
      <div class="feedback-top">
        <section class="comment-card strength-card">
          <div class="section-title">
            <h3>개인별 강점</h3>
          </div>
          <div class="comment-scroll">
            ${list(student.insights.strengths, student)}
          </div>
        </section>
        <section class="comment-card improve-card">
          <div class="section-title">
            <h3>보완점</h3>
          </div>
          <div class="comment-scroll">
            ${list(student.insights.needs, student)}
          </div>
        </section>
        <section class="comment-card teacher-card">
          <div class="section-title">
            <h3>교수자 의견</h3>
          </div>
          <div class="comment-scroll">
            <p>${esc(projectAlignedText(student.teacherOpinion || student.insights.teacher, student))}</p>
          </div>
        </section>
      </div>

      <div class="feedback-bottom">
        <form class="enterprise-form">
          <div class="form-heading">
            <div>
              <p class="eyebrow">기업 회신용</p>
              <h2>${esc(student.name)} 훈련생 피드백</h2>
            </div>
            <div class="form-actions">
              <button class="feedback-submit" type="submit"${isFeedbackCompleted(student) ? " disabled" : ""}>${isFeedbackCompleted(student) ? "멘토링 완료" : "훈련생 피드백 저장"}</button>
            </div>
          </div>
          <div class="rating-table">
            ${cfg.feedbackItems.map((item, index) => ratingRow(student, item, index)).join("")}
          </div>
          <div class="feedback-status" data-feedback-status aria-live="polite"></div>
        </form>

        <aside class="memo-panel">
          <div class="feedback-lines">
            <div class="feedback-lines-head">
              <div class="feedback-title-copy">
                <strong>종합 피드백</strong>
              </div>
              <div class="memo-tags" aria-label="피드백 태그">
                ${chip("#면접검토")}
                ${chip("#추가 포트폴리오 요청")}
                ${chip("#보완 후 재검토")}
              </div>
            </div>
            <textarea aria-label="${esc(student.name)} 종합 피드백" placeholder="기업 담당자 의견을 입력하세요."></textarea>
          </div>
        </aside>
      </div>
      <footer class="page-footer">그린컴퓨터아카데미 수원 · (주)더페이퍼</footer>
    </section>
  `;
}

function renderStudent(student) {
  const view = viewSelect.value;
  if (view === "summary") return renderSummaryPage();
  if (view === "page1") return renderPageOne(student);
  if (view === "page2") return renderPageTwo(student);
  if (view === "cover") return renderCoverSelectionPage();
  return renderPageOne(student) + renderPageTwo(student);
}

function selectedStudent() {
  const selected = studentSelect.value;
  return reportStudents().find((student) => slug(student.name) === selected || slug(student.maskedName) === selected) || reportStudents()[0] || students[0];
}

function updateUrl() {
  const url = new URL(location.href);
  url.searchParams.set("student", studentRouteName(selectedStudent()));
  url.searchParams.set("view", viewSelect.value);
  history.replaceState(null, "", url);
}

function render() {
  const view = viewSelect.value;
  if (view === "summary") {
    deck.innerHTML = renderSummaryPage();
  } else if (view === "all") {
    deck.innerHTML = renderSummaryPage() + reportStudents().map((student) => renderPageOne(student) + renderPageTwo(student)).join("") + renderCoverSelectionPage();
  } else if (view === "cover") {
    deck.innerHTML = renderCoverSelectionPage();
  } else {
    deck.innerHTML = renderStudent(selectedStudent());
  }
  applyCompletedButtonStates();
  updateUrl();
}

function applyTheme(theme, updateRoute = true) {
  const normalized = theme === "dark" ? "dark" : "white";
  document.body.classList.toggle("theme-dark", normalized === "dark");
  document.body.dataset.theme = normalized;
  themeSelect.value = normalized;
  if (updateRoute) {
    const url = new URL(location.href);
    url.searchParams.set("theme", normalized);
    history.replaceState(null, "", url);
  }
}

function studentOptionValue(student) {
  return slug(student.maskedName || student.name);
}

function studentRouteName(student) {
  return student.maskedName || maskName(student.name);
}

function handleStudentSelectChange() {
  if (["summary", "all"].includes(viewSelect.value)) {
    viewSelect.value = "page1";
  }
  render();
}

function initControls() {
  const students = reportStudents();
  studentSelect.innerHTML = students.map((student) => `
    <option value="${studentOptionValue(student)}">${esc(student.name)} (${esc(student.team.id)})</option>
  `).join("");
  if (students.length) studentSelect.value = studentOptionValue(students[0]);

  const params = new URLSearchParams(location.search);
  const studentParam = slug(params.get("student") || params.get("name") || "");
  const matched = students.find((student) => slug(student.name) === studentParam || slug(student.maskedName) === studentParam);
  if (matched) studentSelect.value = studentOptionValue(matched);

  const viewParam = params.get("view");
  if (["summary", "both", "page1", "page2", "all", "cover"].includes(viewParam)) viewSelect.value = viewParam;
  applyTheme(params.get("theme"), false);

  studentSelect.addEventListener("change", handleStudentSelectChange);
  themeSelect.addEventListener("change", () => applyTheme(themeSelect.value));
  viewSelect.addEventListener("change", render);
  deck.addEventListener("change", handleRatingCheck);
  deck.addEventListener("submit", handleFeedbackSubmit);
  captureMode.addEventListener("click", () => {
    document.body.classList.toggle("capture");
    captureMode.textContent = document.body.classList.contains("capture") ? "편집 보기" : "캡처 모드";
  });
}

initControls();
render();
loadCompletedFeedback();
