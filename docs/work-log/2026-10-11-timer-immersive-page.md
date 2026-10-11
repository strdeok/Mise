# 2026-10-11 — 타이머 전체 페이지와 집중 화면

## 목표

타이머를 덮개 시트처럼 보이지 않는 전체 페이지로 전환하고, Session의 모바일 타이머 구성을 참고해 전체화면을 정리한다.

## 변경

- Expo Router의 timer presentation을 modal에서 card로 바꿨다. 전체 페이지 전환으로 뒤 화면의 딤·축소 노출을 제거했다.
- 전체화면은 검은 배경 위 다이얼로 구성했다. 케이스·그림자·다이얼 숫자를 제거하고 흰 눈금과 부채꼴, 작은 중심점·바늘을 사용했다.
- 제목·시간·상태를 시계 아래에 분리하고, 하단에 둥근 시작/일시정지/재개 및 완료 버튼을 배치했다.
- 전체화면 상태바는 밝은 글자로 표시한다. Safe Area와 가로 화면 크기에 맞춰 다이얼 크기·배치를 조정한다.
- Android 뒤로가기는 전체화면부터 해제한다. 세션 측정과 완료 정책은 유지한다.
- 추가 의존성은 없다.

## 레퍼런스

- https://www.stayinsession.com/
- https://www.stayinsession.com/iphone-timer.png
- https://www.stayinsession.com/xdr.jpg

## 검증

- iOS Simulator에서 전체 페이지 표시, 전체화면 전환, 검은 배경·흰 상태바·분리된 시간과 하단 버튼을 확인했다.
- TypeScript 검사, Web export, diff 공백 검사를 통과했다. Web export에는 기존 expo-notifications의 서버 렌더링 localStorage 경고가 남지만 산출물 생성은 성공했다.

## 남은 일

- Android 실제 기기의 시스템 뒤로가기·제스처 바, 가로 화면 및 큰 글꼴 QA.
