# 프로젝트2 어드민 Apps Script

- 프로젝트2 피드백 DB: https://docs.google.com/spreadsheets/d/1mgA6LT6-Ny1a4xKM3xnmVcgIRo2DwajuDtsgNNo3MxY/edit
- 명단/메일 DB: https://docs.google.com/spreadsheets/d/1KQtB9bGa6iBzFu-N1843eAB5z9B-j1yk1a_MOEu9Cp8/edit (`프로젝트2` 탭)
- 성적 DB: https://docs.google.com/spreadsheets/d/1KrOHVkR38Ms6IQkNkTxFTjkIo9v7jkAKNGE-OfxjF8w/edit (`프로젝트2 평가결과` 탭)

## 적용 순서

1. 프로젝트2 피드백 DB를 연다.
2. `확장 프로그램 > Apps Script`를 연다.
3. 이 폴더의 `Code.gs` 전체 내용을 붙여넣고 저장한다.
4. `배포 > 새 배포` 또는 `배포 관리 > 새 버전`으로 웹앱을 배포한다.
5. 실행 사용자: 나. 접근 권한: 운영 정책에 맞게 설정한다.
6. 새 웹앱 URL을 받은 뒤 프로젝트2 리포트 HTML의 endpoint로 연결한다.

## 안전장치

초기본은 `testMode: true`입니다. 학생 메일 발송 버튼을 눌러도 테스트 수신자에게만 발송됩니다. 프로젝트2 리포트 HTML과 실제 학생 링크 검증이 끝난 뒤에만 `testMode: false`로 바꾸세요.
