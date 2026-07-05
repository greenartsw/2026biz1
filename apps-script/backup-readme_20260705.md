# 훈련생 성장 대시보드 수정 백업 요약

## 대상 파일/URL

- GitHub Pages 화면:
  https://greenartsw.github.io/2026biz1/student-report-html/index.html
- Google Sheet:
  https://docs.google.com/spreadsheets/d/1isyMSHjnhS4FmSujLdteEHxoFq3oM1yy44rPNIXZSRI/edit
- Apps Script:
  https://script.google.com/u/0/home/projects/1OX0PhPfctpSDtCFlOONDvL_mvFVMniZmtW_8QcimEwxdP-AuGjC0pfWX/edit


## 핵심 수정 내용

1. 저장 오류 원인
   - 체크박스 input name은 실제 훈련생명 기준인데, 검증 로직은 마스킹명 기준으로 찾고 있어서 저장 검증이 실패했음.
   - `selectedRatingValue()`에서 실제 이름, 마스킹명, 표시명을 모두 허용하도록 수정.

2. 필수 입력 조건
   - 기존: 평가항목 5개만 체크하면 저장 가능.
   - 수정: 평가항목 5개 + 기업 담당자 의견/종합 피드백까지 필수.

3. 기본 정보 자동 저장
   - 기업이 입력하지 않아도 아래 필드는 `app.js`가 자동으로 payload에 포함.
   - `제출시각`, `훈련생`, `마스킹명`, `팀`, `기업`, `본(재)평가`, `프로젝트1`, `채용적합도`.

4. 저장 대상 시트
   - 잘못 생긴 `기업회신` 탭은 사용하지 않음.
   - 실제 저장 대상은 기존 `훈련생 피드백` 탭.
   - Apps Script `SHEET_NAME`은 `"훈련생 피드백"`.

5. 완료 버튼 처리
   - localStorage 기준 완료 판정 제거.
   - Apps Script에서 시트 기준 완료 목록을 조회.
   - 해당 훈련생이 시트에 있고, 평가항목 5개 + 종합 피드백이 모두 입력된 경우에만 버튼 disabled.
   - 버튼명은 `멘토링 완료`, 회색 비활성화.

6. 저장 후 리프레시 로직
   - 기존 문제: `no-cors`라 실제 저장 성공 여부 확인 전에 리프레시될 수 있음.
   - 수정: 저장 요청 후 바로 리프레시하지 않음.
   - `loadCompletedFeedback(true)`를 반복 호출해 시트 입력 완료가 확인될 때만:
     - `입력되었습니다. 화면을 새로고침합니다...`
     - 이후 `location.reload()`.
   - 확인 실패 시 리프레시하지 않고 오류 메시지 표시.



## 주의사항

- Apps Script 편집기에 `apps-script\Code.gs` 최신 내용을 반영해야 함.
- 반영 후 반드시 새 버전으로 웹앱 배포해야 GitHub Pages 화면에서 작동함.
- 현재 배포 URL이 로그인 페이지를 반환하면, 웹앱 권한/배포 설정을 다시 확인해야 함.