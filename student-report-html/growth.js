const growthConfig = window.GROWTH_CONFIG || {};
const growthStudents = window.GROWTH_STUDENTS || [];
const growthDeck = document.getElementById("growthDeck");

function escGrowth(value) {
  return String(value ?? "").replace(/[&<>"']/g, (match) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[match]);
}

function isGrowthMissing(value) {
  return value === null || value === undefined || value === "" || Number.isNaN(value);
}

function numberLabel(value, suffix = "") {
  if (isGrowthMissing(value)) return "-";
  if (typeof value === "number") return value.toFixed(1) + suffix;
  return String(value);
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

function renderGrowthPage() {
  const metrics = growthConfig.metrics || {};
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

growthDeck.innerHTML = renderGrowthPage();
