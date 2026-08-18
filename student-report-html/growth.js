const growthConfig = window.GROWTH_CONFIG || {};
const growthStudents = window.GROWTH_STUDENTS || [];
const growthPeerAssessments = window.GROWTH_PEER_ASSESSMENTS || {};
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
  return `
    <tr>
      <td class="score-strong">${escGrowth(student.name)}</td>
      <td class="status-cell ${tone}">${escGrowth(student.status || "재학")}</td>
      <td>${escGrowth(numberLabel(student.video))}</td>
      <td>${escGrowth(numberLabel(student.publishingAverage))}</td>
      <td>${escGrowth(numberLabel(student.finalAverage))}</td>
      <td>${escGrowth(numberLabel(student.selfCheck))}</td>
      <td>${escGrowth(numberLabel(student.attendanceRate, "%"))}</td>
      <td>${escGrowth(numberLabel(student.project1))}</td>
      <td>${escGrowth(numberLabel(student.project2))}</td>
      <td>${escGrowth(numberLabel(student.project3))}</td>
      <td>${escGrowth(numberLabel(student.projectAverage))}</td>
      <td class="score-strong">${escGrowth(numberLabel(student.overall))}</td>
      <td>${escGrowth(student.aftercare)}</td>
    </tr>
  `;
}

function renderLinks() {
  const links = growthConfig.links || [];
  return links.map((item) => (
    `<a href="${escGrowth(item.url)}" target="_blank" rel="noreferrer">${escGrowth(item.label)}</a>`
  )).join("");
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
  const source = group.sourceUrl
    ? `<a href="${escGrowth(group.sourceUrl)}" target="_blank" rel="noreferrer">${escGrowth(group.source || "원자료")}</a>`
    : `<em>${escGrowth(group.source || "평가결과 종합 기준")}</em>`;
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

function topAftercareItems() {
  const groups = new Map();
  growthStudents.forEach((student) => {
    const key = student.aftercare || "후속관리 기준 확인";
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

function renderGrowthPage() {
  const metrics = growthConfig.metrics || {};
  setGrowthChrome(growthConfig.reportTitle || "훈련생 성장 종합 결과", "영상 + 출판 1~7 + 프로젝트1·2·3 + 동료평가");
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

        <section class="growth-main">
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
                    <th>영상</th>
                    <th>출판 1~7 평균</th>
                    <th>본(재)평가평균</th>
                    <th>셀프체크</th>
                    <th>출석률</th>
                    <th>프1</th>
                    <th>프2</th>
                    <th>프3</th>
                    <th>프로젝트 평균</th>
                    <th>종합점수</th>
                    <th>사후관리</th>
                  </tr>
                </thead>
                <tbody>${growthStudents.map(renderStudentRow).join("")}</tbody>
              </table>
            </div>
          </div>

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

        <footer class="growth-links">
          <span>${escGrowth(growthConfig.issuer || "")} · 원본: 평가결과 종합 시트</span>
          <span>${renderLinks()}</span>
        </footer>
      </div>
    </section>
  `;
}

function renderIndividualGrowthPage(student) {
  setGrowthChrome(`${student.name} 개인 종합 성적표`, "영상 + 출판 1~7 + 프로젝트1·2·3 + 동료평가");
  document.body.classList.add("growth-student-mode");
  return `
    <section class="report-page growth-page growth-student-page" data-page="growth-student" data-student="${escGrowth(student.name)}">
      <div class="growth-layout">
        <header class="growth-title">
          <div>
            <h1>개인 종합 성적표</h1>
            <p>${escGrowth(student.name)} · ${escGrowth(growthConfig.course || "")}</p>
          </div>
          <div class="growth-mark">
            <strong>${escGrowth(student.status || "재학")}</strong>
            <span>${escGrowth(growthConfig.reportDate || "")}<br>${escGrowth(growthConfig.sourceText || "")}</span>
          </div>
        </header>

        <section class="growth-kpis growth-student-kpis" aria-label="개인 핵심 지표">
          ${renderMetric("종합점수", numberLabel(student.overall), "숫자 확정 항목 평균", "teal")}
          ${renderMetric("본(재)평가평균", numberLabel(student.finalAverage), "영상 포함 개인 종합", "blue")}
          ${renderMetric("출판 1~7 평균", numberLabel(student.publishingAverage), "프로젝트 기업 대시보드 기준축", "blue")}
          ${renderMetric("프로젝트 평균", numberLabel(student.projectAverage), "프1·프2·프3 숫자 기준", "amber")}
          ${renderMetric("출석률", numberLabel(student.attendanceRate, "%"), "프로젝트3 출석자료 반영", "teal")}
        </section>

        <section class="growth-main growth-student-main">
          <div class="growth-panel growth-table-panel">
            <div class="section-title">
              <h3>성장 흐름</h3>
              <span>사전진단-본(재)평가-셀프체크이론점검-기업맞춤1·2·3</span>
            </div>
            <div class="growth-table-wrap">
              <table class="growth-table">
                <thead>
                  <tr>
                    <th>훈련생</th>
                    <th>상태</th>
                    <th>영상</th>
                    <th>출판 1~7 평균</th>
                    <th>본(재)평가평균</th>
                    <th>셀프체크</th>
                    <th>출석률</th>
                    <th>프1</th>
                    <th>프2</th>
                    <th>프3</th>
                    <th>프로젝트 평균</th>
                    <th>종합점수</th>
                    <th>사후관리</th>
                  </tr>
                </thead>
                <tbody>${renderStudentRow(student)}</tbody>
              </table>
            </div>
            <div class="growth-personal-note">
              <strong>${escGrowth(student.trend || "성장추이 확인")}</strong>
              <span>${escGrowth(student.aftercare || "후속 학습 지원 방향 확인")}</span>
            </div>
          </div>
          <aside class="growth-panel growth-note-panel">
            ${renderPeerPanel(student)}
            <div class="section-title">
              <h3>산정 기준</h3>
              <span>상태값은 점수 환산하지 않음</span>
            </div>
            <ul class="criteria-list">
              ${(growthConfig.criteria || []).map((item) => `<li>${escGrowth(item)}</li>`).join("")}
            </ul>
          </aside>
        </section>

        <footer class="growth-links">
          <span>${escGrowth(growthConfig.issuer || "")} · 개인종합성적표</span>
        </footer>
      </div>
    </section>
  `;
}

function renderGrowthApp() {
  const student = selectedGrowthStudent();
  if (student) return renderIndividualGrowthPage(student);
  if (growthAdminModeEnabled()) return renderGrowthPage();
  return renderAccessGate();
}

growthDeck.innerHTML = renderGrowthApp();
