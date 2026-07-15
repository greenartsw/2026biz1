const CONFIG = {
  testMode: false,
  testRecipient: '100.1.careerdirector@gmail.com',
  feedbackSpreadsheetId: '1isyMSHjnhS4FmSujLdteEHxoFq3oM1yy44rPNIXZSRI',
  feedbackSheetName: '훈련생 피드백',
  feedbackSpreadsheetUrl: 'https://docs.google.com/spreadsheets/d/1isyMSHjnhS4FmSujLdteEHxoFq3oM1yy44rPNIXZSRI/edit',
  rosterSpreadsheetId: '1KQtB9bGa6iBzFu-N1843eAB5z9B-j1yk1a_MOEu9Cp8',
  rosterSheetName: '프로젝트1',
  scoreSpreadsheetId: '1KrOHVkR38Ms6IQkNkTxFTjkIo9v7jkAKNGE-OfxjF8w',
  scoreSheetName: '기업맞춤-1차 평가결과',
  reportBaseUrl: 'https://greenartsw.github.io/2026biz1/student-report-html/index.html',
  courseName: '[기맞1차]출판&광고',
  projectName: '프로젝트1',
  viewDeadline: '2026.07.17(금)',
  feedbackColumns: {
    submittedAt: 1,
    trainee: 2,
    maskedName: 3,
    team: 4,
    company: 5,
    evaluationType: 6,
    overallScore: 13,
    overallFeedback: 14,
    pageUrl: 17,
    adminStatus: 19,
    adminSentAt: 20,
    adminSentTo: 21,
    adminError: 22,
    releaseStatus: 23,
    releaseSentAt: 24,
    releaseSentTo: 25,
    releaseError: 26,
    releaseToken: 27,
    releaseTokenCreatedAt: 28
  },
  rosterColumns: {
    name: 2,
    email: 3,
    note: 5,
    adminName: 11,
    adminEmail: 12
  },
  status: {
    adminDone: '발송완료',
    adminTestDone: '테스트알림완료',
    studentDone: '학생발송완료',
    studentTestDone: '테스트발송완료',
    hold: '보류',
    error: '오류'
  }
};


const FEEDBACK_ITEMS = [
  "콘텐츠 기획 및 구성의 적절성",
  "디자인 및 편집 완성도",
  "실무 활용 가능성",
  "창의성 및 차별성",
  "종합 만족도"
];

const HEADERS = [
  "제출시각",
  "훈련생",
  "마스킹명",
  "팀",
  "기업",
  "본(재)평가",
  "프로젝트1",
  "채용적합도",
  ...FEEDBACK_ITEMS,
  "종합 피드백",
  "기업 메모",
  "회신대상체크",
  "테마",
  "페이지URL"
];

const COVER_SHEET_NAME = "표지 선정";
const EXPECTED_COVER_TEAMS = ["팀1", "팀2", "팀3"];
const COVER_HEADERS = [
  "제출시각",
  "응답유형",
  "기업",
  "팀",
  "선택표지",
  "선택ID",
  "선정이유",
  "표지URL",
  "이미지URL",
  "테마",
  "페이지URL",
  "선정요약",
  "원본JSON"
];

function doGet(e) {
  const params = (e && e.parameter) || {};
  const action = String(params.action || '');
  const callback = String(params.callback || '');

  if (action === 'completed') {
    const payload = getCompletedFeedbackPayload_();
    if (callback) {
      return ContentService
        .createTextOutput(callback + '(' + JSON.stringify(payload) + ');')
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }
    return ContentService
      .createTextOutput(JSON.stringify(payload))
      .setMimeType(ContentService.MimeType.JSON);
  }

  const token = norm_(params.token || '');
  if (token) {
    return HtmlService
      .createHtmlOutput(buildSecureStudentHtml_(token, params))
      .setTitle('훈련생 피드백/멘토링 결과')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }

  return HtmlService
    .createHtmlOutput(buildDashboardHtml_())
    .setTitle('기업체 피드백 발송 관리')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function onFormSubmit(e) {
  const row = e && e.range ? e.range.getRow() : null;
  if (row && row > 1) notifyAdminsForRow_(row);
}

function setupReleaseColumns() {
  const sheet = getFeedbackSheet_();
  ensureReleaseColumns_(sheet);
  return '학생 발송 관리 컬럼 W:AB 확인 완료';
}

function testSendToMe() {
  MailApp.sendEmail({
    to: CONFIG.testRecipient,
    subject: '[TEST] 기업체 피드백 자동화 테스트',
    body: [
      '테스트 메일입니다.',
      '',
      `테스트 모드: ${CONFIG.testMode ? 'ON' : 'OFF'}`,
      `테스트 수신자: ${CONFIG.testRecipient}`,
      `실행시각: ${now_()}`
    ].join('\n')
  });
  return `테스트 메일 발송 완료: ${CONFIG.testRecipient}`;
}

function scanPendingAdminNotifications() {
  const sheet = getFeedbackSheet_();
  const lastRow = sheet.getLastRow();
  const results = [];
  for (let row = 2; row <= lastRow; row += 1) {
    const result = notifyAdminsForRow_(row);
    if (result) results.push(result);
  }
  return results;
}

function getDashboardData() {
  const sheet = getFeedbackSheet_();
  ensureReleaseColumns_(sheet);
  const lastRow = sheet.getLastRow();
  const roster = getRosterMap_();
  const scoreMap = getScoreMap_();

  if (lastRow <= 1) {
    return dashboardPayload_([]);
  }

  const values = sheet.getRange(2, 1, lastRow - 1, CONFIG.feedbackColumns.releaseTokenCreatedAt).getDisplayValues();
  const rows = values
    .map((valuesRow, index) => buildDashboardRow_(valuesRow, index + 2, roster, scoreMap))
    .filter(row => row.submittedAt && row.trainee)
    .sort((a, b) => b.rowNumber - a.rowNumber);

  return dashboardPayload_(rows);
}

function releaseStudent(rowNumber) {
  return releaseStudent_(rowNumber, false);
}

function releaseStudentTest(rowNumber) {
  return releaseStudent_(rowNumber, true);
}

function releaseStudent_(rowNumber, testOnly) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) {
    throw new Error('다른 발송 작업이 진행 중입니다. 잠시 후 다시 시도하세요.');
  }

  try {
    const isTest = testOnly === true;
    const sheet = getFeedbackSheet_();
    ensureReleaseColumns_(sheet);
    const row = Number(rowNumber);
    if (!row || row <= 1 || row > sheet.getLastRow()) throw new Error(`잘못된 행 번호입니다: ${rowNumber}`);

    const values = sheet.getRange(row, 1, 1, CONFIG.feedbackColumns.releaseTokenCreatedAt).getDisplayValues()[0];
    if (!isFeedbackReady_(values)) throw new Error('기업 피드백 접수 정보가 아직 충분하지 않습니다.');

    const releaseStatus = cell_(values, CONFIG.feedbackColumns.releaseStatus);
    if (!isTest && releaseStatus === CONFIG.status.studentDone) return `이미 학생 발송 완료: ${row}`;
    if (isTest && releaseStatus === CONFIG.status.studentTestDone) return `이미 테스트 발송 완료: ${row}`;
    if (releaseStatus === CONFIG.status.hold) throw new Error('보류 상태입니다. 시트에서 상태를 비운 뒤 다시 발송하세요.');

    const coverSelection = getCoverSelectionStatus_();
    if (!coverSelection.completed) {
      throw new Error('표지 선정이 완료되지 않아 학생 발송을 차단했습니다. 표지 선정 저장 후 다시 진행하세요.');
    }

    const item = buildDashboardRow_(values, row, getRosterMap_(), getScoreMap_());
    if (!item.studentEmail) throw new Error(`훈련생 이메일을 찾을 수 없습니다: ${item.trainee}`);
    if (item.rosterNote.indexOf('중탈') !== -1 || item.scoreStatus.indexOf('중탈') !== -1) {
      throw new Error(`중탈 표시가 있는 훈련생은 발송 대상에서 제외합니다: ${item.trainee}`);
    }

    const realRecipient = item.studentEmail;
    const to = isTest ? CONFIG.testRecipient : realRecipient;
    const subject = releaseSubject_(item);
    const token = ensureStudentAccessToken_(sheet, row, values);
    const accessUrl = buildStudentAccessUrl_(token);
    const coverAccessUrl = buildStudentCoverAccessUrl_(token, item.team);
    const body = releaseBody_(item, realRecipient, accessUrl, coverAccessUrl, isTest);
    const htmlBody = releaseHtmlBody_(item, realRecipient, accessUrl, coverAccessUrl, isTest);
    const adminBcc = isTest ? '' : getAdminEmails_().join(',');
    const mailOptions = { to, subject, body, htmlBody };
    if (adminBcc) mailOptions.bcc = adminBcc;

    try {
      MailApp.sendEmail(mailOptions);

      sheet.getRange(row, CONFIG.feedbackColumns.releaseStatus, 1, 4).setValues([[
        isTest ? CONFIG.status.studentTestDone : CONFIG.status.studentDone,
        now_(),
        to,
        ''
      ]]);
      return `${isTest ? '테스트' : '학생'} 발송 완료: ${item.trainee} -> ${to}`;
    } catch (error) {
      sheet.getRange(row, CONFIG.feedbackColumns.releaseStatus, 1, 4).setValues([[
        CONFIG.status.error,
        now_(),
        to,
        summarizeError_(error)
      ]]);
      throw error;
    }
  } finally {
    lock.releaseLock();
  }
}
function holdRelease(rowNumber) {
  const sheet = getFeedbackSheet_();
  ensureReleaseColumns_(sheet);
  const row = Number(rowNumber);
  if (!row || row <= 1 || row > sheet.getLastRow()) throw new Error(`잘못된 행 번호입니다: ${rowNumber}`);
  sheet.getRange(row, CONFIG.feedbackColumns.releaseStatus, 1, 4).setValues([[CONFIG.status.hold, now_(), '', '']]);
  return `보류 처리 완료: ${row}`;
}

function toggleHoldRelease(rowNumber) {
  const sheet = getFeedbackSheet_();
  ensureReleaseColumns_(sheet);
  const row = Number(rowNumber);
  if (!row || row <= 1 || row > sheet.getLastRow()) throw new Error(`잘못된 행 번호입니다: ${rowNumber}`);
  const status = sheet.getRange(row, CONFIG.feedbackColumns.releaseStatus).getDisplayValue();
  if (status === CONFIG.status.hold) {
    sheet.getRange(row, CONFIG.feedbackColumns.releaseStatus, 1, 4).clearContent();
    return `보류 해제 완료: ${row}`;
  }
  sheet.getRange(row, CONFIG.feedbackColumns.releaseStatus, 1, 4).setValues([[CONFIG.status.hold, now_(), '', '']]);
  return `보류 처리 완료: ${row}`;
}

function notifyAdminsForRow_(row) {
  const sheet = getFeedbackSheet_();
  ensureReleaseColumns_(sheet);
  const values = sheet.getRange(row, 1, 1, CONFIG.feedbackColumns.releaseTokenCreatedAt).getDisplayValues()[0];
  if (!isFeedbackReady_(values)) return '';

  const currentStatus = cell_(values, CONFIG.feedbackColumns.adminStatus);
  const skipStatuses = [CONFIG.status.adminDone, CONFIG.status.adminTestDone, CONFIG.status.hold, CONFIG.status.error];
  if (skipStatuses.indexOf(currentStatus) !== -1) return '';

  const admins = getAdminEmails_();
  const to = CONFIG.testMode ? CONFIG.testRecipient : admins.join(',');
  if (!to) {
    sheet.getRange(row, CONFIG.feedbackColumns.adminStatus, 1, 4).setValues([[CONFIG.status.error, now_(), '', '관리자 이메일 없음']]);
    return `관리자 이메일 없음: ${row}`;
  }

  try {
    MailApp.sendEmail({
      to,
      subject: CONFIG.testMode ? `[TEST] ${adminSubject_(values)}` : adminSubject_(values),
      body: adminBody_(values)
    });
    sheet.getRange(row, CONFIG.feedbackColumns.adminStatus, 1, 4).setValues([[
      CONFIG.testMode ? CONFIG.status.adminTestDone : CONFIG.status.adminDone,
      now_(),
      to,
      ''
    ]]);
    return `관리자 알림 완료: ${row}`;
  } catch (error) {
    sheet.getRange(row, CONFIG.feedbackColumns.adminStatus, 1, 4).setValues([[CONFIG.status.error, now_(), to, summarizeError_(error)]]);
    return `관리자 알림 오류: ${row}`;
  }
}

function buildDashboardRow_(values, rowNumber, roster, scoreMap) {
  const trainee = cell_(values, CONFIG.feedbackColumns.trainee);
  const maskedName = cell_(values, CONFIG.feedbackColumns.maskedName);
  const routeName = maskedName || trainee;
  const rosterItem = roster[trainee] || {};
  const scoreItem = scoreMap[maskedName] || scoreMap[trainee] || {};

  return {
    rowNumber,
    submittedAt: cell_(values, CONFIG.feedbackColumns.submittedAt),
    trainee,
    maskedName,
    team: cell_(values, CONFIG.feedbackColumns.team),
    company: cell_(values, CONFIG.feedbackColumns.company),
    evaluationType: cell_(values, CONFIG.feedbackColumns.evaluationType),
    overallScore: cell_(values, CONFIG.feedbackColumns.overallScore),
    ratings: feedbackRatingsFromRow_(values),
    overallFeedback: cell_(values, CONFIG.feedbackColumns.overallFeedback),
    pageUrl: cell_(values, CONFIG.feedbackColumns.pageUrl),
    adminStatus: cell_(values, CONFIG.feedbackColumns.adminStatus),
    releaseStatus: cell_(values, CONFIG.feedbackColumns.releaseStatus),
    releaseSentAt: cell_(values, CONFIG.feedbackColumns.releaseSentAt),
    releaseError: cell_(values, CONFIG.feedbackColumns.releaseError),
    studentEmail: rosterItem.email || '',
    rosterNote: rosterItem.note || '',
    scoreStatus: scoreItem.status || '',
    studentReportUrl: buildStudentReportUrl_(routeName)
  };
}

function feedbackRatingsFromRow_(values) {
  const ratings = {};
  FEEDBACK_ITEMS.forEach(item => {
    const column = HEADERS.indexOf(item) + 1;
    ratings[item] = column ? cell_(values, column) : '';
  });
  return ratings;
}

function ratingSummaryHtml_(item) {
  const ratings = item.ratings || {};
  const rows = FEEDBACK_ITEMS.map(label => {
    const selected = String(ratings[label] || '');
    const scores = [5, 4, 3, 2, 1].map(score => {
      const isSelected = selected === String(score);
      return `<span class="score ${isSelected ? 'selected' : ''}">${score}</span>`;
    }).join('');
    return `<div class="rating-row"><strong>${html_(label)}</strong><div class="score-options">${scores}</div></div>`;
  }).join('');
  return `<div class="rating-list">${rows}</div>`;
}
function doPost(e) {
  try {
    const payload = parsePayload_(e);

    if (payload.responseType === "팀표지선정") {
      if (!payload.selections || !Object.keys(payload.selections).length) {
        throw new Error("표지 선정 결과가 없습니다.");
      }
      const coverSheet = getCoverSelectionSheet_();
      ensureHeaders_(coverSheet, COVER_HEADERS);
      const result = appendCoverSelection_(coverSheet, payload);
      return jsonOutput_({ ok: true, saved: true, type: "coverSelection", sheetName: COVER_SHEET_NAME, rowNumber: result.rowNumber, rowsSaved: result.rowsSaved });
    }

    if (!norm_(payload.student || payload.maskedName)) throw new Error("훈련생 정보가 없습니다.");
    if (!norm_(payload.company)) throw new Error("기업 정보가 없습니다.");

    const sheet = getFeedbackSheet_();
    ensureHeaders_(sheet);
    const rowNumber = appendFeedback_(sheet, payload);
    return jsonOutput_({ ok: true, saved: true, type: "studentFeedback", sheetName: CONFIG.feedbackSheetName, rowNumber, rowsSaved: 1 });
  } catch (error) {
    return jsonOutput_({ ok: false, saved: false, error: summarizeError_(error) });
  }
}

function parsePayload_(e) {
  const raw = e && e.postData && e.postData.contents ? e.postData.contents : "";
  if (!raw) throw new Error("요청 본문이 없습니다.");
  try {
    return JSON.parse(raw);
  } catch (error) {
    throw new Error("JSON 요청 형식이 올바르지 않습니다.");
  }
}

function jsonOutput_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function getCoverSelectionSheet_() {
  const spreadsheet = SpreadsheetApp.openById(CONFIG.feedbackSpreadsheetId);
  return spreadsheet.getSheetByName(COVER_SHEET_NAME) || spreadsheet.insertSheet(COVER_SHEET_NAME);
}

function ensureHeaders_(sheet, expectedHeaders) {
  const headers = expectedHeaders || HEADERS;
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    return;
  }

  const current = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 1)).getValues()[0];
  const next = current.slice();
  headers.forEach((header) => {
    if (!next.includes(header)) next.push(header);
  });

  if (next.length !== current.length) {
    sheet.getRange(1, 1, 1, next.length).setValues([next]);
  }
}

function appendFeedback_(sheet, payload) {
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const ratings = payload.ratings || {};
  const row = headers.map((header) => {
    if (FEEDBACK_ITEMS.includes(header)) return ratings[header] || "";
    return valueForHeader_(payload, header);
  });
  sheet.appendRow(row);
  return sheet.getLastRow();
}

function appendCoverSelection_(sheet, payload) {
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const selections = payload.selections || {};
  const teams = Object.keys(selections);

  if (!teams.length) {
    const row = headers.map((header) => valueForCoverHeader_(payload, "", {}, header));
    sheet.appendRow(row);
    return { rowNumber: sheet.getLastRow(), rowsSaved: 1 };
  }

  let firstRowNumber = 0;
  teams.forEach((team) => {
    const selection = selections[team] || {};
    const row = headers.map((header) => valueForCoverHeader_(payload, team, selection, header));
    sheet.appendRow(row);
    if (!firstRowNumber) firstRowNumber = sheet.getLastRow();
  });

  return { rowNumber: firstRowNumber, rowsSaved: teams.length };
}

function valueForHeader_(payload, header) {
  if (header === '제출시각') return dateValue_(payload['제출시각'] || payload.submittedAt || new Date());
  const aliases = {
    "제출시각": ["제출시각", "submittedAt"],
    "훈련생": ["훈련생", "student"],
    "마스킹명": ["마스킹명", "maskedName"],
    "팀": ["팀", "team"],
    "기업": ["기업", "company"],
    "본(재)평가": ["본(재)평가", "finalScore"],
    "프로젝트1": ["프로젝트1", "project1Score"],
    "채용적합도": ["채용적합도", "fit"],
    "종합 피드백": ["종합 피드백", "feedback"],
    "기업담당자 의견": ["기업담당자 의견", "종합 피드백", "feedback"],
    "기업 메모": ["기업 메모", "memo"],
    "회신대상체크": ["회신대상체크", "targetChecked"],
    "테마": ["테마", "theme"],
    "페이지URL": ["페이지URL", "pageUrl"],
    "sheetUrl": ["sheetUrl"]
  };
  const keys = aliases[header] || [header];
  for (let i = 0; i < keys.length; i += 1) {
    const value = payload[keys[i]];
    if (value !== undefined && value !== null) return value;
  }
  return "";
}

function valueForCoverHeader_(payload, team, selection, header) {
  const values = {
    "제출시각": dateValue_(payload.submittedAt || new Date()),
    "응답유형": payload.responseType || "팀표지선정",
    "기업": payload.company || "",
    "팀": team || "",
    "선택표지": selection.selectedLabel || "",
    "선택ID": selection.selectedId || "",
    "선정이유": selection.reason || "",
    "표지URL": selection.coverOutputUrl || "",
    "이미지URL": selection.imageUrl || "",
    "테마": payload.theme || "",
    "페이지URL": payload.pageUrl || "",
    "선정요약": payload.feedback || "",
    "원본JSON": JSON.stringify(payload)
  };
  return values[header] !== undefined ? values[header] : "";
}

function getCompletedFeedbackPayload_() {
  const coverSelection = getCoverSelectionStatus_();
  const sheet = getFeedbackSheet_();
  ensureHeaders_(sheet);

  const values = sheet.getDataRange().getValues();
  if (values.length < 2) {
    return { ok: true, completedStudents: [], completedMaskedNames: [], records: [], coverSelection, coverSelectionCompleted: coverSelection.completed };
  }

  const headers = values[0].map((header) => String(header || "").trim());
  const recordsByStudent = {};

  values.slice(1).forEach((row) => {
    const record = rowToRecord_(headers, row);
    if (!isCompletedFeedbackRecord_(record)) return;
    const key = normalizeKey_(record.student || record.maskedName);
    if (!key) return;
    recordsByStudent[key] = {
      student: record.student || "",
      maskedName: record.maskedName || "",
      submittedAt: record.submittedAt || "",
      feedback: record.feedback || "",
      ratings: feedbackRatings_(record)
    };
  });

  const records = Object.keys(recordsByStudent).map((key) => recordsByStudent[key]);
  return {
    ok: true,
    completedStudents: records.map((record) => record.student).filter(Boolean),
    completedMaskedNames: records.map((record) => record.maskedName).filter(Boolean),
    records,
    coverSelection,
    coverSelectionCompleted: coverSelection.completed
  };
}

function getCoverSelectionStatus_() {
  const spreadsheet = SpreadsheetApp.openById(CONFIG.feedbackSpreadsheetId);
  const sheet = spreadsheet.getSheetByName(COVER_SHEET_NAME);
  if (!sheet || sheet.getLastRow() < 2) return { completed: false, teams: [], records: [] };

  ensureHeaders_(sheet, COVER_HEADERS);
  const values = sheet.getDataRange().getValues();
  const headers = values[0].map((header) => String(header || "").trim());
  const records = values.slice(1).map((row) => {
    const record = {};
    headers.forEach((header, index) => {
      record[header] = row[index];
    });
    return {
      submittedAt: record["제출시각"] || "",
      team: record["팀"] || "",
      selectedLabel: record["선택표지"] || "",
      selectedId: record["선택ID"] || "",
      reason: record["선정이유"] || "",
      coverUrl: record["표지URL"] || "",
      pageUrl: record["페이지URL"] || ""
    };
  }).filter((record) => String(record.team || "").trim());
  const teams = Array.from(new Set(records.map((record) => String(record.team || "").trim()).filter(Boolean)));
  const normalizedTeams = teams.map(normalizeKey_);
  const completed = EXPECTED_COVER_TEAMS.every((team) => normalizedTeams.includes(normalizeKey_(team)));
  return { completed, teams, records };
}

function rowToRecord_(headers, row) {
  const record = {};
  headers.forEach((header, index) => {
    record[header] = row[index];
  });
  record.student = firstValue_(record, ["student", "훈련생", "훈련생명", "성명", "name"]);
  record.maskedName = firstValue_(record, ["maskedName", "마스킹명", "표시명"]);
  record.submittedAt = firstValue_(record, ["submittedAt", "제출시각", "저장일시", "타임스탬프", "Timestamp"]);
  record.feedback = firstValue_(record, ["feedback", "기업담당자의견", "기업 담당자 의견", "종합 피드백", "멘토링"]);
  return record;
}

function feedbackRatings_(record) {
  const ratings = {};
  FEEDBACK_ITEMS.forEach((item) => {
    const value = record[item];
    ratings[item] = value === undefined || value === null ? "" : String(value);
  });

  const ratingsJson = firstValue_(record, ["ratings", "평가"]);
  if (!ratingsJson) return ratings;

  try {
    const parsed = typeof ratingsJson === "string" ? JSON.parse(ratingsJson) : ratingsJson;
    FEEDBACK_ITEMS.forEach((item) => {
      if (!ratings[item] && parsed[item] !== undefined && parsed[item] !== null) {
        ratings[item] = String(parsed[item]);
      }
    });
  } catch (error) {}

  return ratings;
}

function isCompletedFeedbackRecord_(record) {
  if (!String(record.student || record.maskedName || "").trim()) return false;
  if (!String(record.feedback || "").trim()) return false;

  const ratings = FEEDBACK_ITEMS.map((item) => String(record[item] || "").trim());
  if (ratings.every(Boolean)) return true;

  const ratingsJson = firstValue_(record, ["ratings", "평가"]);
  if (!ratingsJson) return false;
  try {
    const parsed = typeof ratingsJson === "string" ? JSON.parse(ratingsJson) : ratingsJson;
    return FEEDBACK_ITEMS.every((item) => String(parsed[item] || "").trim());
  } catch (error) {
    return false;
  }
}

function firstValue_(record, keys) {
  for (let i = 0; i < keys.length; i += 1) {
    const value = record[keys[i]];
    if (value !== undefined && value !== null && String(value).trim() !== "") return value;
  }
  return "";
}

function normalizeKey_(value) {
  return String(value || "").replace(/\s+/g, "").replace(/○/g, "O").toLowerCase();
}

function testDoGetCompleted() {
  const output = doGet({ parameter: { action: "completed" } });
  Logger.log(output.getContent());
}

function testDoPostCoverSelection() {
  const output = doPost({
    postData: {
      contents: JSON.stringify({
        responseType: "팀표지선정",
        submittedAt: new Date().toISOString(),
        company: "테스트 기업",
        selections: {
          "팀1": { selectedLabel: "표지안 1", selectedId: "team1-cover-1", reason: "테스트", coverOutputUrl: "", imageUrl: "" }
        },
        feedback: "팀1: 표지안 1 / 테스트",
        theme: "white",
        pageUrl: "test"
      })
    }
  });
  Logger.log(output.getContent());
}
function getRosterMap_() {
  const sheet = getRosterSheet_();
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return {};
  const values = sheet.getRange(2, 1, lastRow - 1, CONFIG.rosterColumns.email).getDisplayValues();
  const map = {};
  values.forEach(row => {
    const name = norm_(row[CONFIG.rosterColumns.name - 1]);
    const email = norm_(row[CONFIG.rosterColumns.email - 1]);
    if (!name || !email) return;
    map[name] = { email, note: norm_(row[CONFIG.rosterColumns.note - 1]) };
  });
  return map;
}

function getAdminEmails_() {
  const sheet = getRosterSheet_();
  const values = sheet.getRange(1, CONFIG.rosterColumns.adminName, sheet.getLastRow(), 2).getDisplayValues();
  const emails = [];
  values.forEach(row => {
    const email = norm_(row[1]);
    if (isEmail_(email) && emails.indexOf(email) === -1) emails.push(email);
  });
  return emails;
}

function getScoreMap_() {
  const sheet = getScoreSheet_();
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return {};
  const values = sheet.getRange(2, 1, lastRow - 1, 15).getDisplayValues();
  const map = {};
  values.forEach(row => {
    const masked = norm_(row[0]);
    if (!masked) return;
    map[masked] = { status: norm_(row[14]) };
  });
  return map;
}

function getFeedbackSheet_() {
  const sheet = SpreadsheetApp.openById(CONFIG.feedbackSpreadsheetId).getSheetByName(CONFIG.feedbackSheetName);
  if (!sheet) throw new Error(`피드백 시트를 찾을 수 없습니다: ${CONFIG.feedbackSheetName}`);
  return sheet;
}

function getRosterSheet_() {
  const sheet = SpreadsheetApp.openById(CONFIG.rosterSpreadsheetId).getSheetByName(CONFIG.rosterSheetName);
  if (!sheet) throw new Error(`명단 시트를 찾을 수 없습니다: ${CONFIG.rosterSheetName}`);
  return sheet;
}

function getScoreSheet_() {
  const sheet = SpreadsheetApp.openById(CONFIG.scoreSpreadsheetId).getSheetByName(CONFIG.scoreSheetName);
  if (!sheet) throw new Error(`성적종합 시트를 찾을 수 없습니다: ${CONFIG.scoreSheetName}`);
  return sheet;
}

function ensureReleaseColumns_(sheet) {
  if (sheet.getMaxColumns() < CONFIG.feedbackColumns.releaseTokenCreatedAt) {
    sheet.insertColumnsAfter(sheet.getMaxColumns(), CONFIG.feedbackColumns.releaseTokenCreatedAt - sheet.getMaxColumns());
  }
  const range = sheet.getRange(1, CONFIG.feedbackColumns.releaseStatus, 1, 6);
  const headers = range.getDisplayValues()[0];
  const expected = ['학생발송상태', '학생발송시각', '학생발송수신자', '학생발송오류', '학생접근토큰', '토큰생성시각'];
  const next = headers.slice();
  let changed = false;
  expected.forEach((header, index) => {
    if (!norm_(next[index])) {
      next[index] = header;
      changed = true;
    }
  });
  if (changed) {
    range.setValues([next]);
  }
}

function isFeedbackReady_(values) {
  return Boolean(
    cell_(values, CONFIG.feedbackColumns.submittedAt) &&
    cell_(values, CONFIG.feedbackColumns.trainee) &&
    cell_(values, CONFIG.feedbackColumns.company)
  );
}

function buildStudentReportUrl_(studentRouteName) {
  return `${CONFIG.reportBaseUrl}?student=${encodeURIComponent(studentRouteName)}&view=both&theme=white`;
}

function adminSubject_(values) {
  return `[기업체 피드백 접수] ${cell_(values, CONFIG.feedbackColumns.company)} - ${CONFIG.courseName} - ${cell_(values, CONFIG.feedbackColumns.trainee)}`;
}

function adminBody_(values) {
  const lines = [
    '기업체 피드백(멘토링)이 수신되었습니다.',
    '',
    `기업체명: ${cell_(values, CONFIG.feedbackColumns.company)}`,
    `과정명: ${CONFIG.courseName}`,
    `훈련생명: ${cell_(values, CONFIG.feedbackColumns.trainee)}`,
    `제출시각: ${cell_(values, CONFIG.feedbackColumns.submittedAt)}`
  ];
  appendIfPresent_(lines, '접수 구분', cell_(values, CONFIG.feedbackColumns.evaluationType));
  appendIfPresent_(lines, '종합 만족도', cell_(values, CONFIG.feedbackColumns.overallScore));
  appendIfPresent_(lines, '종합 피드백', cell_(values, CONFIG.feedbackColumns.overallFeedback));
  appendIfPresent_(lines, '페이지URL', cell_(values, CONFIG.feedbackColumns.pageUrl));
  lines.push('', `관리 시트: ${CONFIG.feedbackSpreadsheetUrl}`);
  if (CONFIG.testMode) lines.push('', `[테스트 모드] 실제 관리자 대신 ${CONFIG.testRecipient}에게만 발송되었습니다.`);
  return lines.join('\n');
}

function releaseSubject_(item) {
  return `[${item.trainee}](기맞1차 출판&광고)[${CONFIG.projectName}] 훈련생 평가결과/평가의견/기업 현장전문가 피드백/멘토링 열람 링크를 안내드립니다.`;
}

function selectedCoverForItem_(item) {
  const status = getCoverSelectionStatus_();
  const team = norm_(item.team);
  return status.records.find(record => norm_(record.team) === team) || null;
}

function displayTeamLabel_(team) {
  return norm_(team).replace(/^팀(\d+)$/, '$1팀') || '해당 팀';
}
function releaseHtmlBody_(item, realRecipient, accessUrl, coverAccessUrl, testOnly) {
  const cover = selectedCoverForItem_(item);
  const coverUrl = cover && cover.coverUrl ? cover.coverUrl : '';
  const coverButton = cover && coverAccessUrl ? `<a href="${html_(coverAccessUrl)}" style="display:inline-block;background:#0f766e;color:#fff;text-decoration:none;font-weight:700;padding:12px 18px;border-radius:8px;margin-left:8px;margin-top:8px">선정된 ${html_(displayTeamLabel_(item.team))} 표지 열기</a>` : '';
  const coverFallback = cover && coverAccessUrl ? `<br>선정 표지 URL: ${html_(coverAccessUrl)}` : '';
  const testNotice = testOnly === true ? `<div style="margin:18px 0 0;padding:12px 14px;border:1px solid #fed7aa;background:#fff7ed;color:#9a3412;border-radius:8px;font-size:13px;line-height:1.6"><strong>[테스트 모드]</strong><br>실제 훈련생 수신자: ${html_(realRecipient)}<br>테스트 수신자: ${html_(CONFIG.testRecipient)}<br>정식 릴리즈 전까지 훈련생에게는 발송되지 않습니다.</div>` : '';
  return `<!doctype html><html lang="ko"><body style="margin:0;padding:0;background:#f4f7fb;font-family:Arial,'Malgun Gothic',sans-serif;color:#172033"><div style="max-width:640px;margin:0 auto;padding:24px 14px"><div style="background:#fff;border:1px solid #d9e2ef;border-radius:12px;overflow:hidden"><div style="padding:20px 22px;background:#0f3b7a;color:#fff"><div style="font-size:13px;opacity:.9">${html_(CONFIG.courseName)} · ${html_(CONFIG.projectName)}</div><h1 style="margin:8px 0 0;font-size:20px;line-height:1.35">훈련생 평가결과 및 기업 현장전문가 피드백/멘토링 열람 안내</h1></div><div style="padding:22px"><p style="margin:0 0 14px;font-size:15px;line-height:1.7"><strong>${html_(item.trainee)} 훈련생님, 안녕하세요.</strong><br>${html_(CONFIG.courseName)} ${html_(CONFIG.projectName)} 결과 열람 링크를 안내드립니다.</p><p style="margin:18px 0 8px"><a href="${html_(accessUrl)}" style="display:inline-block;background:#1455c0;color:#fff;text-decoration:none;font-weight:700;padding:12px 18px;border-radius:8px;margin-top:8px">결과 열람 링크 열기</a>${coverButton}</p><p style="margin:8px 0 0;font-size:12px;line-height:1.6;color:#667085;word-break:break-all">버튼이 열리지 않으면 아래 주소를 복사해 접속하세요.<br>결과 열람 URL: ${html_(accessUrl)}${coverFallback}</p>${testNotice}<div style="margin-top:20px;padding-top:16px;border-top:1px solid #e5e7eb;color:#475467;font-size:13px;line-height:1.7">성적 URL 열람 기간은 ${html_(CONFIG.viewDeadline)}까지입니다.<br>이의 또는 문의가 있을 경우 강사님 또는 사무실로 문의 바랍니다.</div></div></div></div></body></html>`;
}
function releaseBody_(item, realRecipient, accessUrl, coverAccessUrl, testOnly) {
  const cover = selectedCoverForItem_(item);
  const coverUrl = cover && cover.coverUrl ? cover.coverUrl : '';
  const lines = [
    `${item.trainee} 훈련생님, 안녕하세요.`,
    '',
    `${CONFIG.courseName} ${CONFIG.projectName} 기업체 피드백/멘토링 결과 열람 링크를 안내드립니다.`,
    '',
    `열람 링크: ${accessUrl}`
  ];
  if (cover && coverAccessUrl) lines.push(`선정된 ${displayTeamLabel_(item.team)} 표지 링크: ${coverAccessUrl}`);
  lines.push('', `성적 URL 열람 기간은 ${CONFIG.viewDeadline}까지입니다.`, '이의 또는 문의가 있을 경우 강사님 또는 사무실로 문의 바랍니다.');
  if (testOnly === true) {
    lines.push('', '[테스트 모드]', `실제 훈련생 수신자: ${realRecipient}`, `테스트 수신자: ${CONFIG.testRecipient}`, '정식 릴리즈 전까지 훈련생에게는 발송되지 않습니다.');
  }
  return lines.join('\n');
}
function dashboardPayload_(rows) {
  const coverSelection = getCoverSelectionStatus_();
  return {
    testMode: CONFIG.testMode,
    testRecipient: CONFIG.testRecipient,
    coverSelectionCompleted: coverSelection.completed,
    coverSelectionTeams: coverSelection.teams,
    coverSelectionRecords: coverSelection.records.map(record => ({
      submittedAt: displayValue_(record.submittedAt),
      team: norm_(record.team),
      selectedLabel: norm_(record.selectedLabel),
      selectedId: norm_(record.selectedId),
      reason: norm_(record.reason),
      pageUrl: norm_(record.pageUrl)
    })),
    rows
  };
}

function buildDashboardHtml_() {
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>프로젝트1 어드민 모드</title><style>
body{margin:0;font-family:Arial,sans-serif;color:#172033;background:#eef2f7}header{padding:18px 22px;background:#fff;border-bottom:1px solid #d7dde8}h1{margin:0 0 6px;font-size:22px}.sub{color:#667085;font-size:13px}.mode{margin-top:8px;font-weight:700;color:#b42318}.mode.ready{color:#067647}main{padding:16px 22px}.toolbar{display:flex;gap:8px;align-items:center;margin-bottom:12px;flex-wrap:wrap}.summary{display:grid;grid-template-columns:repeat(4,minmax(130px,1fr));gap:8px;margin-bottom:10px}.card{background:#fff;border:1px solid #d9dee7;border-radius:8px;padding:8px 10px;min-height:54px}.card strong{display:block;font-size:18px;margin-top:4px;line-height:1.25}.card.cover strong{font-size:14px;line-height:1.35;word-break:keep-all}.muted{color:#667085}.error{color:#b42318}.empty{background:#fff;border:1px solid #d9dee7;border-radius:8px;padding:18px}.pill{display:inline-block;padding:2px 7px;border-radius:999px;background:#eef2ff;margin:1px 0}.pill.block{background:#fff1f3;color:#b42318}.pill.ok{background:#ecfdf3;color:#067647}button{border:1px solid #b9c2cf;background:#fff;padding:7px 10px;border-radius:6px;cursor:pointer}button.primary{background:#14532d;color:#fff;border-color:#14532d}button.warn{background:#fff7ed;border-color:#fdba74}button:disabled{opacity:.45;cursor:not-allowed}table{width:100%;border-collapse:collapse;background:#fff;font-size:13px;border:1px solid #d9dee7}th,td{border-bottom:1px solid #e5e7eb;padding:8px;text-align:left;vertical-align:top}th{background:#f1f5f9;position:sticky;top:0}td.actions{min-width:170px}.feedback{max-width:360px;white-space:pre-wrap}.student-email{color:#667085;font-size:12px}@media(max-width:760px){.summary{grid-template-columns:1fr}table{font-size:12px}th:nth-child(5),td:nth-child(5),th:nth-child(6),td:nth-child(6){display:none}}
</style></head><body><header><h1>프로젝트1 어드민 모드</h1><div class="sub">기업 피드백 접수 확인 · 표지 선정 완료 후 학생 메일 발송</div><div id="mode" class="mode">상태 확인 중...</div></header><main><div class="toolbar"><button onclick="loadRows()">새로고침</button><button onclick="testSend()">메일 권한 테스트</button><span id="message" class="muted"></span></div><div id="summary" class="summary"></div><div id="table">불러오는 중...</div></main><script>
function loadRows(){setMessage('불러오는 중...');google.script.run.withSuccessHandler(render).withFailureHandler(showError).getDashboardData()}
function coverText(data){var records=data.coverSelectionRecords||[];if(!records.length)return '-';return records.map(function(item){return esc((item.team||'팀')+': '+(item.selectedLabel||item.selectedId||'미선택'))}).join('<br>')}function render(data){var mode=document.getElementById('mode');mode.className='mode '+(data.coverSelectionCompleted?'ready':'');mode.textContent='정식 릴리즈 모드: 학생 메일 발송은 실제 학생에게 발송됩니다. 나에게 테스트는 '+data.testRecipient+' 에게만 발송됩니다.'+(data.coverSelectionCompleted?' / 표지 선정 완료':' / 표지 선정 미완료: 학생 발송 차단');document.getElementById('summary').innerHTML='<div class="card"><span class="muted">접수 건수</span><strong>'+esc(data.rows.length)+'</strong></div><div class="card"><span class="muted">표지 선정</span><strong>'+(data.coverSelectionCompleted?'완료':'미완료')+'</strong></div><div class="card cover"><span class="muted">선정 표지</span><strong>'+coverText(data)+'</strong></div><div class="card"><span class="muted">발송 모드</span><strong>정식</strong></div>';if(!data.rows.length){document.getElementById('table').innerHTML='<div class="empty">접수된 피드백이 없습니다.</div>';setMessage('');return}var rows=data.rows.map(function(row){var blocked=!data.coverSelectionCompleted||row.releaseStatus==='학생발송완료'||row.releaseStatus==='보류'||row.rosterNote.indexOf('중탈')!==-1||row.scoreStatus.indexOf('중탈')!==-1;var releaseLabel=row.releaseStatus||'학생발송대기';var releaseClass=releaseLabel.indexOf('완료')!==-1?'ok':(releaseLabel==='보류'?'block':'');var holdLabel=row.releaseStatus==='보류'?'보류 해제':'발송 보류';var holdClass=row.releaseStatus==='보류'?'':'warn';return '<tr><td>'+esc(row.rowNumber)+'</td><td>'+esc(row.submittedAt)+'</td><td><strong>'+esc(row.trainee)+'</strong><br><span class="student-email">'+esc(row.studentEmail||'이메일 없음')+'</span></td><td>'+esc(row.company)+'<br><span class="muted">'+esc(row.team)+'</span></td><td>'+esc(row.overallScore)+'</td><td class="feedback">'+esc(row.overallFeedback)+'</td><td><span class="pill">'+esc(row.adminStatus||'관리자알림대기')+'</span><br><span class="pill '+releaseClass+'">'+esc(releaseLabel)+'</span></td><td class="actions"><button '+((!data.coverSelectionCompleted||row.releaseStatus==='학생발송완료'||row.releaseStatus==='보류'||row.rosterNote.indexOf('중탈')!==-1||row.scoreStatus.indexOf('중탈')!==-1)?'disabled':'')+' onclick="releaseTestRow('+row.rowNumber+')">나에게 테스트</button> <button class="primary" '+(blocked?'disabled':'')+' onclick="releaseRow('+row.rowNumber+')">학생 메일 발송</button> <button class="'+holdClass+'" onclick="toggleHoldRow('+row.rowNumber+')">'+holdLabel+'</button>'+(row.releaseError?'<div class="error">'+esc(row.releaseError)+'</div>':'')+'</td></tr>'}).join('');document.getElementById('table').innerHTML='<table><thead><tr><th>행</th><th>제출시각</th><th>훈련생</th><th>기업/팀</th><th>만족도</th><th>종합 피드백</th><th>상태</th><th>처리</th></tr></thead><tbody>'+rows+'</tbody></table>';setMessage('로드 완료')}
function releaseTestRow(rowNumber){if(!confirm('이 행을 나에게 테스트 발송할까요? 실제 학생에게는 발송되지 않습니다.'))return;setMessage('테스트 발송 중...');google.script.run.withSuccessHandler(function(message){setMessage(message);loadRows()}).withFailureHandler(showError).releaseStudentTest(rowNumber)}function releaseRow(rowNumber){if(!confirm('이 학생에게 실제 메일을 발송할까요?'))return;setMessage('학생 메일 발송 중...');google.script.run.withSuccessHandler(function(message){setMessage(message);loadRows()}).withFailureHandler(showError).releaseStudent(rowNumber)}
function toggleHoldRow(rowNumber){if(!confirm('이 행의 발송 보류 상태를 변경할까요?'))return;setMessage('보류 상태 변경 중...');google.script.run.withSuccessHandler(function(message){setMessage(message);loadRows()}).withFailureHandler(showError).toggleHoldRelease(rowNumber)}
function testSend(){setMessage('테스트 메일 발송 중...');google.script.run.withSuccessHandler(setMessage).withFailureHandler(showError).testSendToMe()}
function setMessage(message){document.getElementById('message').textContent=message||''}
function showError(error){setMessage(error&&error.message?error.message:String(error))}
function esc(value){return String(value==null?'':value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;')}
loadRows();
</script></body></html>`;
}
function ensureStudentAccessToken_(sheet, row, values) {
  const existing = cell_(values, CONFIG.feedbackColumns.releaseToken);
  if (existing) return existing;

  const token = Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '').slice(0, 16);
  sheet.getRange(row, CONFIG.feedbackColumns.releaseToken, 1, 2).setValues([[token, now_()]]);
  return token;
}

function buildStudentAccessUrl_(token) {
  const serviceUrl = ScriptApp.getService().getUrl();
  if (!serviceUrl) throw new Error('웹앱 배포 URL을 확인할 수 없습니다. 새 배포 후 다시 시도하세요.');
  return `${serviceUrl}?token=${encodeURIComponent(token)}`;
}

function buildStudentCoverAccessUrl_(token, team) {
  const serviceUrl = ScriptApp.getService().getUrl();
  if (!serviceUrl) throw new Error('웹앱 배포 URL을 확인할 수 없습니다. 새 배포 후 다시 시도하세요.');
  return `${serviceUrl}?token=${encodeURIComponent(token)}&view=cover&coverTeam=${encodeURIComponent(team || '')}`;
}

function buildSecureStudentHtml_(token, params) {
  const sheet = getFeedbackSheet_();
  ensureReleaseColumns_(sheet);
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return accessDeniedHtml_('접근 가능한 피드백 정보가 없습니다.');

  const roster = getRosterMap_();
  const scoreMap = getScoreMap_();
  const values = sheet.getRange(2, 1, lastRow - 1, CONFIG.feedbackColumns.releaseTokenCreatedAt).getDisplayValues();

  for (let index = 0; index < values.length; index += 1) {
    const rowValues = values[index];
    if (cell_(rowValues, CONFIG.feedbackColumns.releaseToken) !== token) continue;

    const item = buildDashboardRow_(rowValues, index + 2, roster, scoreMap);
    const releaseStatus = item.releaseStatus;
    if (![CONFIG.status.studentDone, CONFIG.status.studentTestDone].includes(releaseStatus)) {
      return accessDeniedHtml_('아직 학생 열람이 오픈되지 않았습니다.');
    }

    return buildStudentReportFrameHtml_(item, params || {});
  }

  return accessDeniedHtml_('유효하지 않은 접근 링크입니다.');
}

function buildStudentReportFrameHtml_(item, params) {
  const view = norm_(params && params.view);
  const baseUrl = view === 'cover' ? buildCoverReviewReportUrl_(item.team) : (item.studentReportUrl || buildStudentReportUrl_(item.maskedName || item.trainee));
  const reportUrl = withFeedbackEndpoint_(baseUrl);
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${html_(item.trainee)} 피드백/멘토링 결과</title><style>
html,body{margin:0;width:100%;height:100%;background:#dce6f2;overflow:hidden}.student-frame{display:block;width:100%;height:100vh;border:0;background:#fff}
</style></head><body><iframe class="student-frame" src="${html_(reportUrl)}" title="${html_(item.trainee)} 피드백/멘토링 결과"></iframe></body></html>`;
}

function buildCoverReviewReportUrl_(team) {
  return `${CONFIG.reportBaseUrl}?view=cover&theme=white&coverTeam=${encodeURIComponent(team || '')}`;
}
function withFeedbackEndpoint_(reportUrl) {
  const serviceUrl = ScriptApp.getService().getUrl();
  const separator = String(reportUrl).indexOf('?') === -1 ? '?' : '&';
  return `${reportUrl}${separator}endpoint=${encodeURIComponent(serviceUrl)}`;
}
function accessDeniedHtml_(message) {
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>접근 불가</title><style>body{font-family:Arial,sans-serif;background:#f7f8fb;color:#172033;margin:0}.box{max-width:560px;margin:72px auto;background:#fff;border:1px solid #d9dee7;border-radius:8px;padding:24px}h1{font-size:22px;margin:0 0 10px}.msg{color:#b42318}</style></head><body><div class="box"><h1>접근할 수 없습니다</h1><p class="msg">${html_(message)}</p><p>링크가 잘못되었거나 아직 운영팀에서 열람을 오픈하지 않았습니다.</p></div></body></html>`;
}

function html_(value) {
  return norm_(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
function dateValue_(value) {
  if (Object.prototype.toString.call(value) === '[object Date]') return value;
  const text = norm_(value);
  if (!text) return new Date();
  const normalized = text.replace(/\./g, '-').replace(/\s+/g, ' ').trim();
  const koMatch = normalized.match(/^(\d{4})-\s*(\d{1,2})-\s*(\d{1,2})\s+(오전|오후)\s+(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (koMatch) {
    let hour = Number(koMatch[5]);
    if (koMatch[4] === '오후' && hour < 12) hour += 12;
    if (koMatch[4] === '오전' && hour === 12) hour = 0;
    return new Date(Number(koMatch[1]), Number(koMatch[2]) - 1, Number(koMatch[3]), hour, Number(koMatch[6]), Number(koMatch[7] || 0));
  }
  const isoLikeMatch = normalized.match(/^(\d{4})-\s*(\d{1,2})-\s*(\d{1,2})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (isoLikeMatch) {
    return new Date(Number(isoLikeMatch[1]), Number(isoLikeMatch[2]) - 1, Number(isoLikeMatch[3]), Number(isoLikeMatch[4]), Number(isoLikeMatch[5]), Number(isoLikeMatch[6] || 0));
  }
  const date = new Date(text);
  if (!isNaN(date.getTime())) return date;
  return new Date();
}
function appendIfPresent_(lines, label, value) {
  const text = norm_(value);
  if (text) lines.push(`${label}: ${text}`);
}

function displayValue_(value) {
  if (Object.prototype.toString.call(value) === '[object Date]') {
    return Utilities.formatDate(value, 'Asia/Seoul', 'yyyy-MM-dd HH:mm:ss');
  }
  return norm_(value);
}
function now_() {
  return Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM-dd HH:mm:ss');
}

function cell_(values, column) {
  return norm_(values[column - 1]);
}

function norm_(value) {
  return value == null ? '' : String(value).trim();
}

function isEmail_(value) {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(norm_(value));
}

function summarizeError_(error) {
  const message = error && error.message ? error.message : String(error);
  return message.slice(0, 400);
}
