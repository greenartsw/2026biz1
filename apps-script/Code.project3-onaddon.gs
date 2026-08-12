const CONFIG = {
  feedbackSpreadsheetId: '1zZZrmg9d8Tw8CbRGbMMOu5_uGb4cfVgk6WYJ-4ZCTKw',
  feedbackSheetName: '훈련생 피드백',
  courseName: '[기맞1차]출판&광고',
  projectName: '프로젝트3',
  companyName: '온애드온',
  reportBaseUrl: 'https://greenartsw.github.io/2026biz1/student-report-html/index.html?project=project3',
  draftMarkers: ['AI 멘토링 초안', '담당자 검토용', '[초안 성격]']
};

const FEEDBACK_ITEMS = [
  '공공 브랜드 캠페인 기획 및 주제 적합성',
  '광고 콘텐츠 기획 및 편집디자인 표현 능력',
  'SNS 카드뉴스 콘텐츠 제작 및 매체 적용 능력',
  '개인프로젝트 완성도 및 독자적 수행능력',
  '종합 만족도'
];

const HEADERS = [
  '제출시각',
  '훈련생',
  '마스킹명',
  '팀',
  '기업',
  '본(재)평가',
  '프로젝트3',
  '채용적합도',
  ...FEEDBACK_ITEMS,
  '종합 피드백',
  '기업 메모',
  '회신대상체크',
  '테마',
  '페이지URL',
  '',
  '',
  '',
  '',
  '학생발송상태',
  '학생발송시각',
  '학생발송수신자',
  '학생발송오류',
  '학생접근토큰',
  '토큰생성시각'
];

const COL = {
  submittedAt: 1,
  student: 2,
  maskedName: 3,
  team: 4,
  company: 5,
  finalScore: 6,
  project3Score: 7,
  fit: 8,
  firstRating: 9,
  overallFeedback: 14,
  companyMemo: 15,
  targetChecked: 16,
  theme: 17,
  pageUrl: 18,
  width: 28
};

function doGet(e) {
  const params = (e && e.parameter) || {};
  const action = String(params.action || '');
  const callback = String(params.callback || '');

  if (action === 'completed') {
    const payload = getCompletedFeedbackPayload_();
    const body = callback ? callback + '(' + JSON.stringify(payload) + ');' : JSON.stringify(payload);
    return ContentService
      .createTextOutput(body)
      .setMimeType(callback ? ContentService.MimeType.JAVASCRIPT : ContentService.MimeType.JSON);
  }

  return HtmlService
    .createHtmlOutput(buildDashboardHtml_())
    .setTitle('프로젝트3 온애드온 피드백 접수 대시보드')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) {
    return json_({ ok: false, error: '다른 저장 작업이 진행 중입니다. 잠시 후 다시 시도해주세요.' });
  }

  try {
    const payload = parsePayload_(e);
    validatePayload_(payload);

    if (payload.dryRun === true || payload.dryRun === 'true') {
      return json_({
        ok: true,
        dryRun: true,
        message: '검증만 수행했습니다. DB에는 저장하지 않았습니다.',
        projectName: CONFIG.projectName,
        company: CONFIG.companyName,
        student: payload.student || payload['훈련생'] || ''
      });
    }

    const sheet = getFeedbackSheet_();
    ensureHeaders_(sheet);
    const row = buildFeedbackRow_(payload);
    const rowNumber = findExistingStudentRow_(sheet, payload);

    if (rowNumber) {
      sheet.getRange(rowNumber, 1, 1, COL.width).setValues([row]);
    } else {
      sheet.appendRow(row);
    }

    return json_({
      ok: true,
      row: rowNumber || sheet.getLastRow(),
      projectName: CONFIG.projectName,
      company: CONFIG.companyName,
      student: payload.student || payload['훈련생'] || ''
    });
  } catch (error) {
    return json_({ ok: false, error: summarizeError_(error) });
  } finally {
    lock.releaseLock();
  }
}

function parsePayload_(e) {
  const raw = e && e.postData && e.postData.contents ? e.postData.contents : '';
  if (raw) return JSON.parse(raw);
  return (e && e.parameter) || {};
}

function validatePayload_(payload) {
  const project = payload.projectName || payload['프로젝트'] || CONFIG.projectName;
  const company = payload.company || payload['기업'] || CONFIG.companyName;
  if (normalize_(project) !== normalize_(CONFIG.projectName)) {
    throw new Error('프로젝트3 전용 접수 URL입니다.');
  }
  if (company && normalize_(company) !== normalize_(CONFIG.companyName)) {
    throw new Error('온애드온 전용 접수 URL입니다.');
  }
  if (!(payload.student || payload['훈련생'])) throw new Error('훈련생명이 없습니다.');

  const ratings = payload.ratings || {};
  const missing = FEEDBACK_ITEMS.filter((item) => !String(ratings[item] || payload[item] || '').trim());
  if (missing.length) throw new Error('평가항목 미입력: ' + missing.join(', '));
  if (!String(payload.feedback || payload['종합 피드백'] || '').trim()) {
    throw new Error('종합 피드백이 없습니다.');
  }
}

function buildFeedbackRow_(payload) {
  const ratings = payload.ratings || {};
  const row = new Array(COL.width).fill('');
  row[COL.submittedAt - 1] = new Date();
  row[COL.student - 1] = payload.student || payload['훈련생'] || '';
  row[COL.maskedName - 1] = payload.maskedName || payload['마스킹명'] || '';
  row[COL.team - 1] = payload.team || payload['팀'] || '개인별';
  row[COL.company - 1] = payload.company || payload['기업'] || CONFIG.companyName;
  row[COL.finalScore - 1] = payload.finalScore || payload['본(재)평가'] || '';
  row[COL.project3Score - 1] = payload.project3Score || payload['프로젝트3'] || payload.projectScore || '';
  row[COL.fit - 1] = payload.fit || payload['채용적합도'] || '';
  FEEDBACK_ITEMS.forEach((item, index) => {
    row[COL.firstRating - 1 + index] = ratings[item] || payload[item] || '';
  });
  row[COL.overallFeedback - 1] = payload.feedback || payload['종합 피드백'] || '';
  row[COL.companyMemo - 1] = payload.memo || payload['기업 메모'] || '온애드온 실제 기업 회신';
  row[COL.targetChecked - 1] = payload.targetChecked === false ? false : true;
  row[COL.theme - 1] = payload.theme || payload['테마'] || 'white';
  row[COL.pageUrl - 1] = payload.pageUrl || payload['페이지URL'] || '';
  return row;
}

function findExistingStudentRow_(sheet, payload) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return null;

  const targetStudent = normalize_(payload.student || payload['훈련생'] || '');
  const targetMasked = normalize_(payload.maskedName || payload['마스킹명'] || '');
  const targetCompany = normalize_(payload.company || payload['기업'] || CONFIG.companyName);
  const values = sheet.getRange(2, 1, lastRow - 1, COL.width).getValues();

  for (let index = 0; index < values.length; index += 1) {
    const row = values[index];
    const rowStudent = normalize_(row[COL.student - 1]);
    const rowMasked = normalize_(row[COL.maskedName - 1]);
    const rowCompany = normalize_(row[COL.company - 1]);
    const sameStudent = targetStudent && rowStudent === targetStudent;
    const sameMasked = targetMasked && rowMasked === targetMasked;
    const sameCompany = !targetCompany || !rowCompany || rowCompany === targetCompany;
    if ((sameStudent || sameMasked) && sameCompany) return index + 2;
  }
  return null;
}

function getCompletedFeedbackPayload_() {
  const sheet = getFeedbackSheet_();
  ensureHeaders_(sheet);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    return { ok: true, completedStudents: [], completedMaskedNames: [], records: [] };
  }

  const values = sheet.getRange(2, 1, lastRow - 1, COL.width).getDisplayValues();
  const records = values
    .map(recordFromRow_)
    .filter((record) => record.student && !record.isDraft);

  return {
    ok: true,
    projectName: CONFIG.projectName,
    company: CONFIG.companyName,
    completedStudents: records.map((record) => record.student).filter(Boolean),
    completedMaskedNames: records.map((record) => record.maskedName).filter(Boolean),
    records
  };
}

function recordFromRow_(row) {
  const feedback = cell_(row, COL.overallFeedback);
  const memo = cell_(row, COL.companyMemo);
  const ratings = {};
  FEEDBACK_ITEMS.forEach((item, index) => {
    ratings[item] = cell_(row, COL.firstRating + index);
  });
  return {
    submittedAt: cell_(row, COL.submittedAt),
    student: cell_(row, COL.student),
    maskedName: cell_(row, COL.maskedName),
    team: cell_(row, COL.team),
    company: cell_(row, COL.company) || CONFIG.companyName,
    projectName: CONFIG.projectName,
    finalScore: cell_(row, COL.finalScore),
    projectScore: cell_(row, COL.project3Score),
    project3Score: cell_(row, COL.project3Score),
    fit: cell_(row, COL.fit),
    ratings,
    feedback,
    memo,
    targetChecked: cell_(row, COL.targetChecked),
    theme: cell_(row, COL.theme),
    pageUrl: cell_(row, COL.pageUrl),
    isDraft: isDraftText_(feedback) || isDraftText_(memo)
  };
}

function buildDashboardHtml_() {
  const payload = getCompletedFeedbackPayload_();
  const sheetUrl = 'https://docs.google.com/spreadsheets/d/' + CONFIG.feedbackSpreadsheetId + '/edit';
  const rows = payload.records.map((record) => (
    '<tr>' +
      '<td>' + esc_(record.submittedAt) + '</td>' +
      '<td>' + esc_(record.maskedName || record.student) + '</td>' +
      '<td>' + esc_(record.project3Score) + '</td>' +
      '<td>' + esc_(record.fit) + '</td>' +
      '<td>' + esc_(record.feedback).slice(0, 80) + '</td>' +
    '</tr>'
  )).join('');
  return [
    '<!doctype html><html><head><meta charset="utf-8">',
    '<style>body{font-family:Arial,"Noto Sans KR",sans-serif;margin:24px;color:#172554}a{color:#0f62fe}table{border-collapse:collapse;width:100%;margin-top:16px}th,td{border:1px solid #d7dee8;padding:8px;text-align:left;font-size:13px}th{background:#eaf2ff}.note{background:#fff7db;padding:12px;border:1px solid #ead28a}</style>',
    '</head><body>',
    '<h1>프로젝트3 온애드온 피드백 접수</h1>',
    '<p class="note">AI 멘토링 초안 행은 실제 기업 회신으로 집계하지 않습니다. 실제 제출 시 해당 훈련생 행을 실제 회신으로 갱신합니다.</p>',
    '<p>실제 기업 회신 완료: <strong>' + payload.records.length + '건</strong> · <a target="_blank" href="' + sheetUrl + '">DB 열기</a></p>',
    '<table><thead><tr><th>제출시각</th><th>훈련생</th><th>프로젝트3</th><th>채용적합도</th><th>피드백</th></tr></thead><tbody>',
    rows || '<tr><td colspan="5">아직 실제 기업 회신이 없습니다.</td></tr>',
    '</tbody></table></body></html>'
  ].join('');
}

function getFeedbackSheet_() {
  return SpreadsheetApp.openById(CONFIG.feedbackSpreadsheetId).getSheetByName(CONFIG.feedbackSheetName);
}

function ensureHeaders_(sheet) {
  const current = sheet.getRange(1, 1, 1, COL.width).getDisplayValues()[0];
  const empty = current.every((value) => !String(value || '').trim());
  if (empty) sheet.getRange(1, 1, 1, COL.width).setValues([HEADERS]);
}

function json_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function cell_(row, oneBasedColumn) {
  return row[oneBasedColumn - 1] || '';
}

function normalize_(value) {
  return String(value || '').replace(/\s+/g, '').toLowerCase();
}

function isDraftText_(value) {
  const text = String(value || '');
  return CONFIG.draftMarkers.some((marker) => text.indexOf(marker) !== -1);
}

function esc_(value) {
  return String(value || '').replace(/[&<>"']/g, (match) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[match]);
}

function summarizeError_(error) {
  return error && error.message ? error.message : String(error);
}

function testCompleted() {
  return getCompletedFeedbackPayload_();
}
