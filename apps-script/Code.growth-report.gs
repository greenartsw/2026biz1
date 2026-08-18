const GROWTH_RELEASE_CONFIG = {
  releaseSpreadsheetId: '1zZZrmg9d8Tw8CbRGbMMOu5_uGb4cfVgk6WYJ-4ZCTKw',
  releaseSheetName: '개인 종합 성적표 발송',
  rosterSpreadsheetId: '1KQtB9bGa6iBzFu-N1843eAB5z9B-j1yk1a_MOEu9Cp8',
  rosterSheetName: '프로젝트3',
  reportBaseUrl: 'https://greenartsw.github.io/2026biz1/student-report-html/growth.html',
  tokenRedirectBaseUrl: 'https://greenartsw.github.io/2026biz1/student-report-html/token-redirect.html',
  courseName: '[기업맞춤AI활용 출판&광고콘텐츠 제작 전문가 양성과정]',
  reportName: '개인 종합 성적표'
};

const GROWTH_RELEASE_STUDENTS = [
  { name: '김민정', maskedName: '김O정', status: '' },
  { name: '김예림', maskedName: '김O림', status: '중탈' },
  { name: '김지수', maskedName: '김O수', status: '8/3취업' },
  { name: '김혜교', maskedName: '김O교', status: '80%이상수료 / 7/20취업' },
  { name: '노예진', maskedName: '노O진', status: '' },
  { name: '문일권', maskedName: '문O권', status: '80%이상수료 / 수료·이수' },
  { name: '박가람', maskedName: '박O람', status: '' },
  { name: '배도연', maskedName: '배O연', status: '' },
  { name: '신유정', maskedName: '신O정', status: '' },
  { name: '유주령', maskedName: '유O령', status: '' },
  { name: '장동혁', maskedName: '장O혁', status: '' },
  { name: '허정아', maskedName: '허O아', status: '' }
];

const GROWTH_RELEASE_HEADERS = [
  '훈련생명',
  '마스킹명',
  '훈련생상태',
  '이메일',
  '발송상태',
  '발송시각',
  '수신자',
  '오류',
  '토큰',
  '토큰생성시각'
];

function doGet(e) {
  const params = e && e.parameter ? e.parameter : {};
  if (params.action === 'studentReportUrl') {
    return jsonOutput_(studentReportUrlPayload_(params.token), params.callback);
  }
  setupGrowthReleaseSheet_();
  return HtmlService.createHtmlOutput(renderGrowthReleaseDashboard_())
    .setTitle(GROWTH_RELEASE_CONFIG.reportName + ' 발송 관리');
}

function setupGrowthReleaseSheet() {
  setupGrowthReleaseSheet_();
}

function releaseGrowthStudent(rowNumber) {
  return releaseGrowthStudent_(Number(rowNumber), false);
}

function testReleaseGrowthStudent(rowNumber) {
  return releaseGrowthStudent_(Number(rowNumber), true);
}

function getGrowthReleaseRows() {
  setupGrowthReleaseSheet_();
  const sheet = releaseSheet_();
  const lastRow = Math.max(sheet.getLastRow(), 1);
  if (lastRow < 2) return [];
  return sheet.getRange(2, 1, lastRow - 1, GROWTH_RELEASE_HEADERS.length).getValues()
    .map((row, index) => rowToObject_(row, index + 2));
}

function setupGrowthReleaseSheet_() {
  const sheet = releaseSheet_();
  const emailMap = rosterEmailMap_();
  sheet.getRange(1, 1, 1, GROWTH_RELEASE_HEADERS.length).setValues([GROWTH_RELEASE_HEADERS]);
  const existing = sheet.getLastRow() > 1
    ? sheet.getRange(2, 1, sheet.getLastRow() - 1, GROWTH_RELEASE_HEADERS.length).getValues()
    : [];
  const existingByName = new Map(existing.map((row) => [String(row[0] || '').trim(), row]));
  const rows = GROWTH_RELEASE_STUDENTS.map((student) => {
    const current = existingByName.get(student.name) || [];
    return [
      student.name,
      student.maskedName,
      student.status,
      current[3] || emailMap.get(student.name) || '',
      current[4] || '',
      current[5] || '',
      current[6] || '',
      current[7] || '',
      current[8] || '',
      current[9] || ''
    ];
  });
  if (rows.length) sheet.getRange(2, 1, rows.length, GROWTH_RELEASE_HEADERS.length).setValues(rows);
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, GROWTH_RELEASE_HEADERS.length);
}

function releaseGrowthStudent_(rowNumber, testOnly) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const sheet = releaseSheet_();
    if (rowNumber < 2 || rowNumber > sheet.getLastRow()) throw new Error('발송 행 번호가 올바르지 않습니다.');
    const row = sheet.getRange(rowNumber, 1, 1, GROWTH_RELEASE_HEADERS.length).getValues()[0];
    const record = rowToObject_(row, rowNumber);
    if (!record.name) throw new Error('훈련생명이 비어 있습니다.');
    if (String(record.status || '').includes('중탈') && !testOnly) throw new Error('중탈자는 실제 발송 대상에서 제외합니다.');

    const token = Utilities.getUuid();
    const now = new Date();
    const target = testOnly ? testRecipient_() : record.email;
    if (!target) throw new Error(testOnly ? '테스트 수신자 설정이 없습니다.' : '훈련생 이메일이 비어 있습니다.');

    const accessUrl = buildGrowthAccessUrl_(token);
    const subject = GROWTH_RELEASE_CONFIG.courseName + ' ' + GROWTH_RELEASE_CONFIG.reportName + ' 안내';
    const body = [
      record.name + ' 훈련생 개인 종합 성적표 안내입니다.',
      '',
      '아래 링크에서 개인 성적표를 확인할 수 있습니다.',
      accessUrl,
      '',
      '본 링크는 개인 성적표 확인용으로만 사용해 주세요.'
    ].join('\n');

    MailApp.sendEmail(target, subject, body);
    sheet.getRange(rowNumber, 5, 1, 6).setValues([[
      testOnly ? '테스트발송완료' : '발송완료',
      now,
      target,
      '',
      token,
      now
    ]]);
    return { ok: true, rowNumber, sentTo: target, testOnly };
  } catch (error) {
    if (rowNumber >= 2) releaseSheet_().getRange(rowNumber, 8).setValue(error.message);
    return { ok: false, error: error.message };
  } finally {
    lock.releaseLock();
  }
}

function studentReportUrlPayload_(token) {
  if (!token) return { ok: false, error: '토큰이 없습니다.' };
  setupGrowthReleaseSheet_();
  const rows = getGrowthReleaseRows();
  const record = rows.find((row) => row.token === token);
  if (!record) return { ok: false, error: '유효하지 않은 토큰입니다.' };
  if (!String(record.releaseStatus || '').includes('발송완료')) {
    return { ok: false, error: '아직 발송 완료되지 않은 링크입니다.' };
  }
  return {
    ok: true,
    reportUrl: GROWTH_RELEASE_CONFIG.reportBaseUrl
      + '?student=' + encodeURIComponent(record.maskedName)
      + '&theme=white'
  };
}

function buildGrowthAccessUrl_(token) {
  return GROWTH_RELEASE_CONFIG.tokenRedirectBaseUrl
    + '?endpoint=' + encodeURIComponent(ScriptApp.getService().getUrl())
    + '&action=studentReportUrl'
    + '&token=' + encodeURIComponent(token);
}

function rosterEmailMap_() {
  const sheet = SpreadsheetApp.openById(GROWTH_RELEASE_CONFIG.rosterSpreadsheetId)
    .getSheetByName(GROWTH_RELEASE_CONFIG.rosterSheetName);
  if (!sheet) return new Map();
  const values = sheet.getRange(2, 2, Math.max(sheet.getLastRow() - 1, 0), 2).getValues();
  return new Map(values
    .filter((row) => row[0] && row[1])
    .map((row) => [String(row[0]).trim(), String(row[1]).trim()]));
}

function releaseSheet_() {
  const spreadsheet = SpreadsheetApp.openById(GROWTH_RELEASE_CONFIG.releaseSpreadsheetId);
  return spreadsheet.getSheetByName(GROWTH_RELEASE_CONFIG.releaseSheetName)
    || spreadsheet.insertSheet(GROWTH_RELEASE_CONFIG.releaseSheetName);
}

function rowToObject_(row, rowNumber) {
  return {
    rowNumber,
    name: row[0],
    maskedName: row[1],
    status: row[2],
    email: row[3],
    releaseStatus: row[4],
    sentAt: row[5],
    sentTo: row[6],
    error: row[7],
    token: row[8],
    tokenCreatedAt: row[9]
  };
}

function testRecipient_() {
  return PropertiesService.getScriptProperties().getProperty('GROWTH_TEST_RECIPIENT')
    || Session.getActiveUser().getEmail()
    || '';
}

function jsonOutput_(payload, callback) {
  const json = JSON.stringify(payload);
  const output = callback ? String(callback) + '(' + json + ');' : json;
  return ContentService.createTextOutput(output)
    .setMimeType(callback ? ContentService.MimeType.JAVASCRIPT : ContentService.MimeType.JSON);
}

function renderGrowthReleaseDashboard_() {
  const rows = getGrowthReleaseRows();
  const bodyRows = rows.map((row) => `
    <tr>
      <td>${escapeHtml_(row.maskedName)}</td>
      <td>${escapeHtml_(row.status || '재학')}</td>
      <td>${escapeHtml_(row.releaseStatus || '대기')}</td>
      <td>${escapeHtml_(row.sentTo || '')}</td>
      <td>${escapeHtml_(row.error || '')}</td>
      <td>
        <button onclick="releaseRow(${row.rowNumber}, true)">테스트</button>
        <button onclick="releaseRow(${row.rowNumber}, false)" ${String(row.status || '').includes('중탈') ? 'disabled' : ''}>발송</button>
      </td>
    </tr>
  `).join('');
  return `
    <!doctype html>
    <html lang="ko">
      <head>
        <meta charset="utf-8">
        <style>
          body{font-family:Arial,'Noto Sans KR',sans-serif;margin:0;padding:20px;background:#f5f7fb;color:#172b4d}
          h1{margin:0 0 14px;font-size:22px}
          table{width:100%;border-collapse:collapse;background:#fff}
          th,td{border:1px solid #d9e2ef;padding:8px;font-size:13px}
          th{background:#eaf2ff}
          button{border:0;background:#0b72d9;color:#fff;padding:6px 10px;border-radius:4px;font-weight:700;cursor:pointer}
          button[disabled]{background:#b8c4d6;cursor:not-allowed}
          #status{margin:10px 0;font-weight:700}
        </style>
      </head>
      <body>
        <h1>${escapeHtml_(GROWTH_RELEASE_CONFIG.reportName)} 발송 관리</h1>
        <div id="status">대기 중</div>
        <table>
          <thead><tr><th>훈련생</th><th>상태</th><th>발송상태</th><th>수신자</th><th>오류</th><th>작업</th></tr></thead>
          <tbody>${bodyRows}</tbody>
        </table>
        <script>
          function releaseRow(rowNumber, testOnly) {
            document.getElementById('status').textContent = '처리 중...';
            const runner = google.script.run
              .withSuccessHandler(function(result) {
                document.getElementById('status').textContent = result.ok ? '완료' : '오류: ' + result.error;
                setTimeout(function(){ location.reload(); }, 700);
              })
              .withFailureHandler(function(error) {
                document.getElementById('status').textContent = '오류: ' + error.message;
              });
            if (testOnly) {
              runner.testReleaseGrowthStudent(rowNumber);
            } else {
              runner.releaseGrowthStudent(rowNumber);
            }
          }
        </script>
      </body>
    </html>
  `;
}

function escapeHtml_(value) {
  return String(value == null ? '' : value).replace(/[&<>"']/g, function(match) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[match];
  });
}
