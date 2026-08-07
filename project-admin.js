const root = document.querySelector(".admin-shell");
const studentSelect = document.getElementById("studentSelect");
const viewSelect = document.getElementById("viewSelect");
const themeSelect = document.getElementById("themeSelect");
const adminMode = document.getElementById("adminMode");
const urlPreview = document.getElementById("urlPreview");
const openButton = document.getElementById("openButton");
const students = (window.REPORT_STUDENTS || []).filter((student) => student && student.name);

function buildReportUrl() {
  const reportPath = root?.dataset.reportPath || "student-report-html/index.html";
  const url = new URL(reportPath, location.href);
  const selectedStudent = studentSelect.value;
  let view = viewSelect.value;

  if (selectedStudent !== "__all__" && (view === "all" || view === "summary")) {
    view = "both";
  }

  url.searchParams.set("view", view);
  url.searchParams.set("theme", themeSelect.value);

  if (selectedStudent !== "__all__") {
    url.searchParams.set("student", selectedStudent);
  }

  if (adminMode.checked) {
    url.searchParams.set("admin", "1");
  }

  return url;
}

function updatePreview() {
  urlPreview.textContent = buildReportUrl().href;
}

function optionValue(student) {
  return student.maskedName || student.name;
}

studentSelect.insertAdjacentHTML(
  "beforeend",
  students
    .map((student) => `<option value="${optionValue(student)}">${student.name}</option>`)
    .join("")
);

studentSelect.addEventListener("change", updatePreview);
viewSelect.addEventListener("change", updatePreview);
themeSelect.addEventListener("change", updatePreview);
adminMode.addEventListener("change", updatePreview);
openButton.addEventListener("click", () => window.open(buildReportUrl().href, "_blank", "noopener"));
updatePreview();
