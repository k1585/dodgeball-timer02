# 🏀 농구 슬레이트

농구 경기 촬영 시작/끝에 패드로 보여주는 슬레이트 웹앱입니다.

- 주소(배포 후): https://k1585.github.io/dodgeball-timer02/slate/
- 기본 비밀번호: `4242` (홈 화면 ⚙️ 에서 변경)
- 보기·검색은 누구나, 추가·수정·삭제는 비밀번호 필요

## Firebase 설정

`index.html` 안의 `firebaseConfig` 는 이 저장소의 피구 타이머와 같은 Firebase 프로젝트(`stopwatch-6bb55`)로 되어 있고,
데이터는 Realtime Database의 `basketballSlate` 위치에 저장됩니다.

현재 데이터베이스 규칙 때문에 접근이 거부되면, 앱은 자동으로 **기기 저장(localStorage)** 으로 동작합니다
(오른쪽 위 빨간 점 "기기 저장"). Firebase 콘솔 → Realtime Database → 규칙에 아래를 추가하면
여러 기기 동기화가 켜지고, 기기에 저장돼 있던 기록도 자동으로 올라갑니다.

```json
{
  "rules": {
    "basketballSlate": { ".read": true, ".write": true }
  }
}
```

(기존 피구 타이머용 `timer` 규칙이 있으면 지우지 말고 같이 두세요.)

다른 Firebase 프로젝트를 쓰려면 `firebaseConfig` 값만 바꾸면 되고, `apiKey` 를 `""` 로 비우면 Firebase 없이 기기 저장만 합니다.
