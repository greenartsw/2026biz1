# 훈련생 피드백 Google Apps Script 배포

1. 대상 시트 열기: https://docs.google.com/spreadsheets/d/1isyMSHjnhS4FmSujLdteEHxoFq3oM1yy44rPNIXZSRI/edit?gid=0#gid=0
2. 메뉴에서 확장 프로그램 > Apps Script를 엽니다.
3. 기본 Code.gs 내용을 지우고 이 폴더의 feedback-webapp.gs 내용을 붙여넣습니다.
4. 배포 > 새 배포 > 유형: 웹 앱을 선택합니다.
5. 실행 사용자: 나, 액세스 권한: 링크가 있는 모든 사용자로 배포합니다.
6. 발급된 웹 앱 URL을 student-report-html/data.js의 feedbackEndpoint 값에 넣습니다.

웹 앱 URL을 HTML 주소에 임시로 붙여도 됩니다.
예: index.html?student=김민정&view=page2&endpoint=웹앱URL
이렇게 한 번 열면 브라우저 localStorage에 저장되어 이후 제출에 사용됩니다.


## 팀 표지 선정 저장 업데이트

마지막 페이지의 `팀 표지 선정` 저장을 사용하려면 `feedback-webapp.gs`의 최신 코드로 Apps Script 프로젝트를 교체한 뒤 새 버전으로 배포하세요. 기존 학생 피드백 행은 유지되고, 같은 시트 뒤쪽 열에 `응답유형`, `표지선정_JSON`, `팀별 표지/선정이유`가 추가됩니다.


현재 HTML feedbackEndpoint: `https://script.google.com/macros/s/AKfycbxsga-7SclThSmp-S3TAavdJ4TWxrKVHKxterQM-9tB3QMPaHEVyI7Ja3d1pI4gzsCXdQ/exec`


## 저장 시트 분리

Apps Script 최신 버전은 `훈련생 피드백 시트`와 `팀 표지 선정 시트`를 자동 생성/분리 저장합니다. `responseType === "팀표지선정"`이면 팀 표지 선정 시트에 저장되고, 그 외 훈련생 피드백은 훈련생 피드백 시트에 저장됩니다.
