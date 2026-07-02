const SPREADSHEET_ID = '1isyMSHjnhS4FmSujLdteEHxoFq3oM1yy44rPNIXZSRI';
const STUDENT_FEEDBACK_SHEET_NAME = '훈련생 피드백 시트';
const COVER_SELECTION_SHEET_NAME = '팀 표지 선정 시트';
const FEEDBACK_ITEMS = [
  '콘텐츠 기획 및 구성의 적절성',
  '디자인 및 편집 완성도',
  '실무 활용 가능성',
  '창의성 및 차별성',
  '종합 만족도'
];
const COVER_TEAMS = ['팀1', '팀2', '팀3'];

const STUDENT_FEEDBACK_HEADERS = [
  '제출시각',
  '훈련생',
  '마스킹명',
  '팀',
  '기업',
  '본(재)평가',
  '프로젝트1',
  '채용적합도',
  ...FEEDBACK_ITEMS,
  '종합 피드백',
  '기업 메모',
  '회신대상체크',
  '테마',
  '페이지URL'
];

const COVER_SELECTION_HEADERS = [
  '제출시각',
  '기업',
  '팀1 표지',
  '팀1 선정이유',
  '팀1 이미지URL',
  '팀2 표지',
  '팀2 선정이유',
  '팀2 이미지URL',
  '팀3 표지',
  '팀3 선정이유',
  '팀3 이미지URL',
  '표지선정_JSON',
  '테마',
  '페이지URL'
];

function doGet() {
  return json_({ ok: true, message: '훈련생 피드백 / 팀 표지 선정 저장 endpoint ready' });
}

function doPost(e) {
  try {
    const payload = JSON.parse((e.postData && e.postData.contents) || '{}');
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const isCoverSelection = payload.responseType === '팀표지선정';
    const sheetName = isCoverSelection ? COVER_SELECTION_SHEET_NAME : STUDENT_FEEDBACK_SHEET_NAME;
    const headers = isCoverSelection ? COVER_SELECTION_HEADERS : STUDENT_FEEDBACK_HEADERS;
    const sheet = getOrCreateSheet_(spreadsheet, sheetName);
    ensureHeaders_(sheet, headers);
    sheet.appendRow(isCoverSelection ? toCoverSelectionRow_(payload) : toStudentFeedbackRow_(payload));
    return json_({ ok: true, sheetName });
  } catch (error) {
    return json_({ ok: false, error: String(error && error.message || error) });
  }
}

function getOrCreateSheet_(spreadsheet, sheetName) {
  return spreadsheet.getSheetByName(sheetName) || spreadsheet.insertSheet(sheetName);
}

function ensureHeaders_(sheet, headers) {
  const columnCount = Math.max(sheet.getLastColumn(), headers.length);
  const values = sheet.getRange(1, 1, 1, columnCount).getValues()[0];
  const isEmpty = values.every((value) => value === '');
  if (isEmpty) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
    return;
  }
  headers.forEach((header, index) => {
    if (values[index] !== header) sheet.getRange(1, index + 1).setValue(header);
  });
}

function toStudentFeedbackRow_(payload) {
  const ratings = payload.ratings || {};
  return [
    payload.submittedAt ? new Date(payload.submittedAt) : new Date(),
    payload.student || '',
    payload.maskedName || '',
    payload.team || '',
    payload.company || '',
    payload.finalScore || '',
    payload.project1Score || '',
    payload.fit || '',
    ...FEEDBACK_ITEMS.map((item) => ratings[item] || ''),
    payload.feedback || '',
    payload.memo || '',
    payload.targetChecked ? 'Y' : 'N',
    payload.theme || '',
    payload.pageUrl || ''
  ];
}

function toCoverSelectionRow_(payload) {
  const selections = payload.selections || {};
  const row = [
    payload.submittedAt ? new Date(payload.submittedAt) : new Date(),
    payload.company || ''
  ];
  COVER_TEAMS.forEach((team) => {
    const item = selections[team] || {};
    row.push(item.selectedLabel || item.selectedId || '');
    row.push(item.reason || '');
    row.push(item.imageUrl || '');
  });
  row.push(JSON.stringify(selections));
  row.push(payload.theme || '');
  row.push(payload.pageUrl || '');
  return row;
}

function json_(object) {
  return ContentService
    .createTextOutput(JSON.stringify(object))
    .setMimeType(ContentService.MimeType.JSON);
}
