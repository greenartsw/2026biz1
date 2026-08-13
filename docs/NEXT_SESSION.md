# 다음 작업 인수인계

## 2026-08-13 사무실 컴퓨터 이어받기 우선 문서

사무실 컴퓨터에서 이어갈 때는 먼저 `docs/인수인계.md`를 읽는다.

요청 문장:

```text
docs/인수인계.md와 docs/NEXT_SESSION.md를 읽고, 프로젝트3 온애드엔 멘토링/성장 리포트 작업을 현재 상태부터 이어서 진행해줘. 먼저 Git 동기화 상태와 공개 URL, Google Sheets DB 상태를 확인하고, 사용자 변경을 덮어쓰지 말아줘.
```

최근 라이브 DB 조치:

- 프로젝트3 DB `접수 대시보드!J7`의 `#REF!`는 `J8` 수동 입력값이 QUERY 배열 확장을 막아서 발생했다.
- `접수 대시보드!J8:K20` 수동값을 정리했고, 기업별 집계는 `온애드엔 / 8`로 정상 표시된다.
- `훈련생 피드백` 탭의 기업명과 멘토링 초안 문구 안 회사명 8건을 `온애드엔`으로 통일했다.
- 스프레드시트 제목도 `★ [DB]기업맞춤-1차 프로젝트3 온애드엔 멘토링 초안/접수 DB`로 변경했다.

2026-08-14 라우팅 조치:

- `student-report-html/index.html?view=all&theme=white`는 프로젝트1 기본 URL이다.
- 프로젝트3 데이터 파일이 `index.html`에서 항상 로드되어 프로젝트1 화면을 덮어쓰던 문제를 수정했다.
- 이제 `project=project3` 또는 `p3` 파라미터가 있을 때만 `data-project3.js`를 추가 로드한다.
- 검산 결과 기본 URL은 `프로젝트1 / (주)더페이퍼`, 프로젝트3 URL은 `프로젝트3 / 온애드엔`으로 분기된다.
- 프로젝트1 종합 페이지 우측 상단 `상위 추천 TOP 3`는 데이터상 `배O연 94%`, `장O혁 93%`, `허O아 93%`가 산출된다. 한 명만 보이던 원인은 우측 추천 패널 높이와 CSS overflow였고, `styles.css?v=20260814-top3fix1`로 1차 수정했다.
- 프로젝트1 종합 페이지 추가 레이아웃 조치: `채용 적합도 90% 이상 후보군` 7명 전원(`배O연`, `장O혁`, `허O아`, `김O수`, `박O람`, `노O진`, `유O령`)이 보이도록 한 줄 요약으로 바꿨고, `팀별 산출물`은 팀1·팀2·팀3을 카드 안쪽 박스가 아니라 얇은 행 구조로 재배치했다. 점수 3종·팀명단·기획서/표지/내지 링크 버튼 폭을 줄였으며, 공개 캐시는 `styles.css?v=20260814-summaryfit2`, `app.js?v=20260814-summaryfit2`다.
- 추가 보정: 팀 구역 식별이 약해서 `팀별 산출물` 안의 팀1·팀2·팀3을 균등 높이 블록으로 키우고, 기획서/표지/내지 버튼은 오른쪽 세로 3단으로 배치했다. 공개 CSS 캐시는 `styles.css?v=20260814-teamblocks1`다.
- 하단 안전영역 보정: 종합성과 표가 좌측 하단 기관명 footer와 겹치지 않도록 `summary-body` 하단 여백을 키우고 표 행 높이를 압축했다. 기업 맞춤 인재 추천 4개 카드는 프1·프2·프3 모두 같은 고정 높이 박스로 보이도록 조정했으며, 공개 CSS 캐시는 `styles.css?v=20260814-summarysafe2`다. 프로젝트1 기준 footer와 종합성과 박스 간격은 렌더링 검산에서 20px 이상 확보되도록 맞춘다.
- 기업 회신 완료값 표시 보정: 저장된 기업 회신이 불러와진 경우 disabled textarea 대신 읽기용 본문 박스(`feedback-readonly`)로 표시되게 했다. 프로젝트2 오름 회신 9명분은 Apps Script `action=completed` 응답으로 정상 수신되며, 공개 캐시는 `styles.css?v=20260814-feedbackread1`, `app.js?v=20260814-feedbackread1`다.

## 2026-08-13 프로젝트3 온애드엔 배포 메모

- 프로젝트3 리포트 진입점: `student-report-html/cover3.html`
- 프로젝트3 리포트 본문: `student-report-html/index.html?project=project3&view=all&theme=white`
- 프로젝트3 관리자 런처: `project3-admin.html`
- 프로젝트3 데이터 파일: `student-report-html/data-project3.js`
- 최종 성장 종합 결과: `student-report-html/growth.html?theme=white`
- 프로젝트3 DB: `https://docs.google.com/spreadsheets/d/1zZZrmg9d8Tw8CbRGbMMOu5_uGb4cfVgk6WYJ-4ZCTKw/edit`
- 프로젝트3 Apps Script 웹앱: `https://script.google.com/macros/s/AKfycbyW24J5xR5IQVnSUa_nao7Q1Q5EP3PdQqtURM77u46HeQSMbR0Y9MaG1Y4YH7PA5a2WRA/exec`
- Apps Script 원본 백업: `apps-script/Code.project3-onaddon.gs`
- `dryRun` 검증 완료: DB에 쓰지 않는 요청으로 필수값 검증 정상, 완료 조회는 기존 AI 초안 8행을 실제 완료로 집계하지 않음
- 주의: DB에 들어간 8행은 온애드엔 실제 회신이 아니라 `AI 멘토링 초안/담당자 검토용`이다. 실제 기업 제출이 들어오면 해당 훈련생 행을 실제 회신으로 갱신하는 구조다.
- 성장 종합 기준: 프로젝트1·2·3 기업 피드백 대시보드는 출판 부문 능력단위 1~7 + 해당 프로젝트만 반영하고 영상은 미포함. `growth.html`은 개인 이수·수료 및 사후관리 판단용으로 영상 + 출판 능력단위 1~7 + 프로젝트1·2·3 확정 숫자 점수를 함께 표시한다. 취업/수료·이수/중탈/미응시는 상태값으로 보존하고 점수 환산하지 않는다.

## 현재 상태

- 기준 브랜치: `main`
- 기준 원격 저장소: `https://github.com/greenartsw/2026biz1.git`
- 프로젝트1 개인별 성과 리포트와 Apps Script는 운영 정상 확인됨
- 기존 학생 토큰 링크에서 개인 성적, 기업 피드백, 선정 팀 표지가 정상 표시됨
- 시트 헤더의 줄바꿈·공백 변형을 허용하는 수정이 적용됨
- 운영 Apps Script 원본과 수정 전 원본이 모두 GitHub에 보존됨
- 프로젝트2 오름 개인별 피드백 대시보드는 `student-report-html/index2.html`과 `cover2.html`로 분리됨
- 프로젝트1·2 슈퍼어드민 런처는 `project1-admin.html`, `project2-admin.html`로 추가됨
- 슈퍼어드민 런처는 공개 페이지이므로 비밀값을 두지 않고, 실제 권한 통제는 Apps Script와 Google Sheets 설정에서 관리해야 함
- 프로젝트2 화면에서는 개인별 페이지의 팀평가 영역과 `view=all`의 표지선정 설문 영역이 제외됨
- 프로젝트2 실제 점수는 `프로젝트2 평가결과` 탭 기준으로 `data-project2-oorum.js`에 반영됨
- 프로젝트2 전용 Apps Script 배포 원본은 `apps-script/Code.project2-oorum.gs`에 준비됨
- 프로젝트2 Apps Script 관리자 화면에서는 표지선정 완료 조건 없이 개인별 피드백 발송을 관리하도록 수정됨
- 프로젝트2 Apps Script 웹앱 URL은 아직 연결 전이며, 배포 후 `data-project2-oorum.js`의 `feedbackEndpoint`, `adminEndpoint`에 같은 URL을 반영해야 함

## 집에서 이어서 시작하기

1. GitHub에서 `greenartsw/2026biz1` 저장소를 clone하거나 기존 clone에서 `main`을 갱신한다.
2. 저장소 루트를 Codex 프로젝트로 연다.
3. Codex에 `docs/NEXT_SESSION.md를 읽고 현재 상태부터 이어서 작업해줘`라고 요청한다.
4. 작업 전 `.agents/skills/sync-project-backup/scripts/check-sync.ps1`로 동기화 상태를 확인한다.

ZIP 다운로드본은 참고 백업일 뿐 Git 이력이 없으므로 실제 작업 대상으로 사용하지 않는다.

## 프로젝트2 재사용 원칙

프로젝트1 운영본을 직접 덮어쓰지 않는다. 프로젝트2용 사본을 만들어 다음 항목만 교체한다.

- 프로젝트명과 과정 표시 문구
- 열람 마감일
- 피드백 스프레드시트 ID와 시트명
- 명단 스프레드시트 ID와 시트명
- 성적 스프레드시트 ID와 시트명
- 리포트 데이터와 학생 마스킹명
- 팀 구성과 표지 후보·선정 결과
- GitHub Pages 경로 또는 프로젝트2 라우팅 파라미터
- 메일 제목과 본문 문구

다음 기능은 검증된 공통 엔진으로 그대로 재사용한다.

- 학생별 접근 토큰 생성·검증
- 관리자 발송 대시보드
- 학생·테스트 메일 발송
- 기업 피드백 저장 및 재접속 복원
- 팀별 표지 선정 저장 및 조회
- 잘못된 요청 차단
- 헤더 공백·줄바꿈 정규화
- 동시 발송 잠금

## 프로젝트2 착수 절차

1. 프로젝트1 운영본에 태그 또는 기준 커밋을 남긴다.
2. 프로젝트2 작업 브랜치나 별도 하위 폴더를 만든다.
3. 프로젝트2 스프레드시트와 데이터 사본을 연결한다.
4. 테스트 수신자 한 명으로 저장·완료 조회·토큰 접근·표지 접근을 검증한다.
5. 기존 프로젝트1 토큰 링크가 계속 정상인지 회귀 테스트한다.
6. 프로젝트2 전용 Apps Script 배포를 만든다. 프로젝트1 배포를 덮어쓰지 않는다.
7. 검증 후 GitHub에 커밋·푸시하고 로컬/원격 SHA 일치를 확인한다.

## 관련 문서

- `AGENTS.md`
- `.agents/skills/sync-project-backup/SKILL.md`
- `docs/debug-history/2026-07-15-student-report-debug.md`
- `docs/debug-history/2026-08-06-project2-oorum-dashboard.md`
- `apps-script/Code.gs`
- `apps-script/Code.project2-oorum.gs`
- `apps-script/Code.live-original.gs`
- `student-report-html/google-apps-script_bak/feedback-webapp.gs`
