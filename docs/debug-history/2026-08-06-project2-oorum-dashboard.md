# 프로젝트2 오름 개인별 피드백 대시보드 작업 기록

- 작업일: 2026-08-06
- 대상 저장소: `greenartsw/2026biz1`
- 대상 기능: 프로젝트2 오름 기업 피드백·멘토링 대시보드
- 기준 원칙: 프로젝트1 운영본을 덮어쓰지 않고 프로젝트2 전용 파일을 추가한다.

## 확인한 자료

- Google Slides 관리자 가이드에서 프로젝트2 표지 초안 확인
  - 프로젝트명: `프로젝트2`
  - 주제: `디지털 교재 및 홍보 패키지제작`
  - 대상 기업: `오름`
  - 안내 초안 URL: `student-report-html/cover2.html`
- 평가결과 스프레드시트
  - 파일: `★ [DB]기업맞춤-1차 훈련생성장현황 평가결과 종합`
  - 공통 탭: `평가결과 공통`
  - 프로젝트2 탭: `프로젝트2 평가결과`
- 프로젝트2 피드백 접수 스프레드시트
  - 파일: `★ [DB]기업맞춤-1차 프로젝트2 훈련생 피드백 접수/멘토링 결과`
  - 탭: `훈련생 피드백`
  - 주요 헤더: `제출시각`, `훈련생`, `마스킹명`, `팀`, `기업`, `본(재)평가`, `프로젝트2`, `채용적합도`, 피드백 5개 항목, `종합 피드백`, 발송 상태/토큰 열

## 적용한 수정

- `student-report-html/app.js`
  - 프로젝트별 기능 플래그를 추가했다.
  - 프로젝트2처럼 `teamPanel`, `teamSummary`, `collaborationMetrics`, `coverSelection`을 끌 수 있게 했다.
  - `미응시` 값을 결측으로 처리해 평균 계산이 깨지지 않게 했다.
  - 프로젝트 점수 라벨을 `프로젝트1` 고정이 아니라 설정값으로 표시하게 했다.
  - `view=all`에서 표지선정 페이지를 설정에 따라 제외하게 했다.
  - 프로젝트2 payload가 `프로젝트2` 열명으로 저장될 수 있게 했다.
- `student-report-html/data-project2-oorum.js`
  - 프로젝트2 평가결과 탭 기준 점수 데이터를 추가했다.
  - 대상 기업을 `(주)오름`으로 설정했다.
  - 팀/협업/표지선정 표시를 비활성화했다.
  - 프로젝트2 피드백 접수 시트 URL을 연결했다.
- `student-report-html/index2.html`
  - 오름 프로젝트2 전용 대시보드 진입 페이지를 추가했다.
- `project1-admin.html`, `project2-admin.html`
  - `greenartsw/2026biz1` GitHub Pages에서 프로젝트1·2 슈퍼어드민 런처를 함께 서비스하도록 추가했다.
  - 훈련생, 보기, 테마, 관리자 모드 여부를 선택해 각 프로젝트 리포트를 새 창으로 열 수 있게 했다.
- `project-admin.css`, `project-admin.js`
  - 프로젝트1·2 슈퍼어드민 런처의 공통 UI와 URL 생성 로직을 분리했다.
- `student-report-html/cover2.html`
  - Slides 초안 URL과 맞는 프로젝트2 오름 표지를 추가했다.
- `student-report-html/cover.css`, `student-report-html/styles.css`
  - 긴 프로젝트2 제목과 팀 패널 없는 개인 페이지 레이아웃을 보정했다.
- `apps-script/Code.project2-oorum.gs`
  - 프로젝트2용 Apps Script 배포 원본을 별도 사본으로 추가했다.
  - 프로젝트2 피드백 시트, 프로젝트2 점수 탭, `index2.html` 리포트 URL을 기준으로 변경했다.
  - 프로젝트2는 표지선정 완료를 학생 발송 조건으로 요구하지 않게 했다.
  - 관리자 화면 문구와 발송 차단 조건에서 프로젝트1 표지선정 흐름을 제거했다.

## 검증

- 프론트 JS 문법 검사 통과
  - `student-report-html/app.js`
  - `student-report-html/data-project2-oorum.js`
  - 기존 `student-report-html/data.js`
- 프로젝트2 Apps Script 사본 문법 검사 통과
- 브라우저 렌더링 확인
  - `index2.html?view=all&theme=white`: 총 23페이지
  - 구성: 요약 1P + 개인 성적표 11P + 개인 피드백 11P
  - 표지선정 페이지: 0개
  - 팀 패널: 0개
  - 개인 1P: 팀 정보/팀원/협업 세부 패널 없음
  - `cover2.html`: 프로젝트2 오름 표지 정상 표시
  - `project1-admin.html`, `project2-admin.html`: 학생 선택, 보기 선택, 관리자 모드 URL 생성 정상
- 프로젝트1 회귀 확인
  - 기존 `index.html?view=all&theme=white`: 총 24페이지
  - 표지선정 페이지 1개 유지
  - 팀 패널 11개 유지

## 남은 연결 작업

- 프로젝트2 Apps Script 배포 URL은 아직 확인되지 않았다.
- `apps-script/Code.project2-oorum.gs`를 새 Apps Script 프로젝트 또는 프로젝트2 배포본에 반영한 뒤 웹앱 URL을 발급해야 한다.
- 발급된 URL을 `student-report-html/data-project2-oorum.js`의 `feedbackEndpoint`와 필요 시 `adminEndpoint`에 입력한다.
- 슈퍼어드민 런처는 `greenartsw/2026biz1`에도 추가했다.
  - 실제 권한·데이터 접근 통제는 Apps Script와 Google Sheets 권한 설정에 의존한다.
  - 개인 계정의 `greenartswDXPoC_V1` 슈퍼어드민과 소스 버전이 다를 수 있다.
- 배포 후 다음 순서로 운영 검증한다.
  1. 오름용 링크에서 피드백 1건 저장
  2. 프로젝트2 피드백 시트의 `훈련생 피드백` 탭에 저장 확인
  3. `action=completed` 조회로 저장값 복원 확인
  4. 관리자 모드에서 테스트 발송 확인
  5. 실제 학생 발송 전 프로젝트1 링크 회귀 확인

## 사용 URL

- 오름 표지: `student-report-html/cover2.html`
- 프로젝트1 슈퍼어드민: `project1-admin.html`
- 프로젝트2 슈퍼어드민: `project2-admin.html`
- 오름 대시보드: `student-report-html/index2.html?view=all&theme=white`
- 오름 관리자 모드: `student-report-html/index2.html?view=all&theme=white&admin=1`
