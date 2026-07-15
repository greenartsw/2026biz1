# 훈련생 피드백 Google Apps Script 배포

이 폴더의 `feedback-webapp.gs`는 `apps-script/Code.gs`와 동일한 통합 배포본입니다. 학생별 토큰 접근, 관리자 발송 화면, 완료 상태 조회, 학생 피드백 저장, 팀 표지 저장을 모두 포함합니다.

운영 서버에서 회수한 수정 전 원본은 `apps-script/Code.live-original.gs`에 보존합니다.

## 적용 방법

1. [대상 스프레드시트](https://docs.google.com/spreadsheets/d/1isyMSHjnhS4FmSujLdteEHxoFq3oM1yy44rPNIXZSRI/edit)를 엽니다.
2. `확장 프로그램 > Apps Script`를 엽니다.
3. Apps Script의 `Code.gs` 내용을 `feedback-webapp.gs` 전체 내용으로 교체합니다.
4. 저장한 뒤 `배포 > 배포 관리`에서 새 버전으로 배포합니다.
5. 웹앱 실행 사용자는 본인, 접근 권한은 링크를 사용하는 대상에 맞게 설정합니다.
6. 새 배포 URL이 바뀌었다면 `student-report-html/data.js`의 `feedbackEndpoint`도 갱신합니다.

현재 HTML endpoint:

`https://script.google.com/macros/s/AKfycbxsga-7SclThSmp-S3TAavdJ4TWxrKVHKxterQM-9tB3QMPaHEVyI7Ja3d1pI4gzsCXdQ/exec`

## 저장 구조

- 학생 피드백은 `훈련생 피드백` 시트에 저장됩니다.
- `responseType === "팀표지선정"` 요청은 `표지 선정` 시트에 팀별 1행으로 저장됩니다.
- `action=completed` 조회는 완료 학생, 마스킹명, 학생별 저장 record, 표지 선정 완료 상태를 반환합니다.
- 기존 행과 헤더를 삭제하지 않고 필요한 헤더만 추가합니다.

## 주의

- `feedback-webapp.gs`와 `apps-script/Code.gs` 중 한쪽을 수정했다면 다른 쪽도 같은 내용으로 맞춥니다.
- `apps-script/Code.live-original.gs`는 운영 원본 보존용이므로 직접 배포하지 않습니다.
- 실제 배포 전에 Apps Script의 `testDoGetCompleted()`와 `testDoPostCoverSelection()`을 실행해 권한과 시트 연결을 확인합니다.
- 테스트 저장으로 추가된 행은 확인 후 스프레드시트에서 정리합니다.
