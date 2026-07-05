const SPREADSHEET_ID = "1isyMSHjnhS4FmSujLdteEHxoFq3oM1yy44rPNIXZSRI";
const SHEET_NAME = "훈련생 피드백";
const COVER_SHEET_NAME = "표지 선정";
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

  if (payload.responseType === "팀표지선정") {
    const coverSheet = getCoverSelectionSheet_();
    ensureHeaders_(coverSheet, COVER_HEADERS);
    const result = appendCoverSelection_(coverSheet, payload);

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true, saved: true, type: "coverSelection", rowNumber: result.rowNumber, rowsSaved: result.rowsSaved }))
      .setMimeType(ContentService.MimeType.JSON);
  }

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

function getCoverSelectionSheet_() {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
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
    "제출시각": payload.submittedAt || "",
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
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
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
      pageUrl: record["페이지URL"] || ""
    };
  }).filter((record) => String(record.team || "").trim());
  const teams = Array.from(new Set(records.map((record) => String(record.team || "").trim()).filter(Boolean)));
  return { completed: teams.length > 0, teams, records };
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