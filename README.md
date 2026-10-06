# Mise Table

하루 시간표와 Todo에 실제 Focus 시간을 기록하는 iOS·Android용 React Native 앱입니다.

## 구조

```text
frontend/  Expo · React Native 앱
backend/   Release-1 Node.js API 예정 영역
docs/      SDD, 작업 일지, 트러블슈팅
```

## 실행

```bash
cd frontend
npm install
npm run start
```

로컬 프로토타입은 AsyncStorage에 Todo, Schedule, Session, Settings를 저장합니다. 앱의 Settings에서 샘플 데이터를 초기화할 수 있습니다.

## 문서

제품·도메인·API SDD는 [docs/sdd](docs/sdd/README.md)에 있습니다. 현재 MVP-0은 서버·OAuth 없이 기기 로컬 데이터로 동작하며, `backend/`는 Release-1의 Node.js API를 위한 자리입니다.
