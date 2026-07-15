# 다음 작업 인수인계

## 현재 상태

- 기준 브랜치: `main`
- 기준 원격 저장소: `https://github.com/greenartsw/2026biz1.git`
- 프로젝트1 개인별 성과 리포트와 Apps Script는 운영 정상 확인됨
- 기존 학생 토큰 링크에서 개인 성적, 기업 피드백, 선정 팀 표지가 정상 표시됨
- 시트 헤더의 줄바꿈·공백 변형을 허용하는 수정이 적용됨
- 운영 Apps Script 원본과 수정 전 원본이 모두 GitHub에 보존됨

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
- `apps-script/Code.gs`
- `apps-script/Code.live-original.gs`
- `student-report-html/google-apps-script_bak/feedback-webapp.gs`
