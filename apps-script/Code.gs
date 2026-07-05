const SPREADSHEET_ID = "1isyMSHjnhS4FmSujLdteEHxoFq3oM1yy44rPNIXZSRI";
const SHEET_NAME = "훈련생 피드백";
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

function doGet(e) {
  const params = (e && e.parameter) || {};
  const action = String(params.action || "");
  const callback = String(params.callback || "");
  const payload = action === "completed"
    ? getCompletedFeedbackPayload_()
    : { ok: true, message: "student feedback endpoint" };

  if (callback) {
    return ContentService
      .createTextOutput(callback + "(" + JSON.stringify(payload) + ");")
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const payload = parsePayload_(e);
  const sheet = getFeedbackSheet_();
  ensureHeaders_(sheet);
  const rowNumber = appendFeedback_(sheet, payload);

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, saved: true, rowNumber }))
    .setMimeType(ContentService.MimeType.JSON);
}

function parsePayload_(e) {
  const raw = e && e.postData && e.postData.contents ? e.postData.contents : "{}";
  try {
    return JSON.parse(raw);
  } catch (error) {
    return {};
  }
}

function getFeedbackSheet_() {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  return spreadsheet.getSheetByName(SHEET_NAME) || spreadsheet.insertSheet(SHEET_NAME);
}

function ensureHeaders_(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    return;
  }

  const current = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 1)).getValues()[0];
  const next = current.slice();
  HEADERS.forEach((header) => {
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

function valueForHeader_(payload, header) {
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

function getCompletedFeedbackPayload_() {
  const sheet = getFeedbackSheet_();
  ensureHeaders_(sheet);

  const values = sheet.getDataRange().getValues();
  if (values.length < 2) {
    return { ok: true, completedStudents: [], completedMaskedNames: [], records: [] };
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
      submittedAt: record.submittedAt || ""
    };
  });

  const records = Object.keys(recordsByStudent).map((key) => recordsByStudent[key]);
  return {
    ok: true,
    completedStudents: records.map((record) => record.student).filter(Boolean),
    completedMaskedNames: records.map((record) => record.maskedName).filter(Boolean),
    records
  };
}

function rowToRecord_(headers, row) {
  const record = {};
  headers.forEach((header, index) => {
    record[header] = row[index];
  });
  record.student = firstValue_(record, ["student", "훈련생", "훈련생명", "성명", "name"]);
  record.maskedName = firstValue_(record, ["maskedName", "마스킹명", "표시명"]);
  record.submittedAt = firstValue_(record, ["submittedAt", "저장일시", "타임스탬프", "Timestamp"]);
  record.feedback = firstValue_(record, ["feedback", "기업담당자의견", "기업 담당자 의견", "종합 피드백", "멘토링"]);
  return record;
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
