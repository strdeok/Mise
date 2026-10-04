# Mise Table

하루 시간표와 Todo에 실제 Focus 시간을 기록하는 iOS·Android용 React Native 프로토타입입니다.

## 실행

```bash
npm install
npm run start
```

로컬 프로토타입은 AsyncStorage에 Todo, Schedule, Session, Settings를 저장합니다. 앱의 Settings에서 샘플 데이터를 초기화할 수 있습니다.

## 문서

제품·도메인·API SDD는 [docs/sdd](docs/sdd/README.md)에 있습니다. 이번 단계는 서버·OAuth 없이 기기 로컬 데이터로 동작하며, 이후 Repository 구현체를 Node.js API로 교체하는 구조입니다.
