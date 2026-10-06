# Maestro E2E

Expo 개발 빌드에 설치된 Mise Table을 Android Emulator 또는 iOS Simulator에서 검증한다.

```bash
curl -Ls "https://get.maestro.mobile.dev" | bash
cd frontend
npx expo run:android
npm run test:e2e:android
```

iOS는 `npx expo run:ios`로 개발 빌드를 실행한 뒤 `npm run test:e2e:ios`를 실행한다.

- `android-smoke.yaml`: Today → Todo 생성 → 월·주·일 일정 전환
- `ios-smoke.yaml`: Today → Focus 시작 → Timer 일시정지·재개

앱 식별자는 `com.strdeok.misetable`이다. 네이티브 폴더를 새로 생성할 때는 `npx expo prebuild --clean`으로 `app.json`의 식별자를 반영한다.
