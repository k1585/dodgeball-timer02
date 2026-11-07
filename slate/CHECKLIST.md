# ✅ 할 일 체크리스트

## 1. Firebase (여러 기기 동기화용)
- [ ] Firebase 콘솔 접속 → https://console.firebase.google.com
- [ ] 프로젝트 고르기
  - 피구 타이머랑 같은 프로젝트(`stopwatch-6bb55`) 쓰기 → **추천, 아래 2번만 하면 끝**
  - 새로 만들기 → 프로젝트 추가 → 웹 앱(</>) 등록 → `firebaseConfig` 복사
- [ ] Realtime Database 만들기 (왼쪽 메뉴 빌드 → Realtime Database → 데이터베이스 만들기)
  - 기존 프로젝트면 이미 있음 → 생략

## 2. 보안 규칙 추가
- [ ] Realtime Database → **규칙** 탭 → 아래 내용으로 바꾸고 **게시**

```json
{
  "rules": {
    "timer":           { ".read": true, ".write": true },
    "basketballSlate": { ".read": true, ".write": true }
  }
}
```

> `timer` 줄은 피구 타이머용이에요. 지금 피구 타이머 경로도 접근이 막혀 있어서 같이 넣었어요.

## 3. 앱 연결 (새 프로젝트를 만든 경우만)
- [ ] 앱 홈 → ⚙️ 설정 → **Firebase 연결** → 복사한 `firebaseConfig` 붙여넣기 → 저장 후 연결
- [ ] 오른쪽 위에 **초록 점 "동기화"** 가 뜨면 성공 (빨간 점 "기기 저장"이면 아직 안 된 것)

## 4. GitHub 배포
- [ ] GitHub 저장소 → `claude/basketball-slate-webapp-pxo2ys` 브랜치로 **Pull Request 만들기 → Merge**
- [ ] 1~2분 뒤 접속 확인 → https://k1585.github.io/dodgeball-timer02/slate/

## 5. 패드 설정
- [ ] 패드 Safari에서 위 주소 열기 → 공유 버튼 → **홈 화면에 추가** (앱처럼 풀화면으로 열림)
- [ ] ⚙️ 설정 → **비밀번호 변경** (기본 `4242`)

## 6. 최종 확인
- [ ] 새 대회 추가 → 저장 → 다른 기기에서 바로 보이는지
- [ ] 슬레이트 모드 → 가로 풀화면 → 두 번 탭하면 돌아오는지
- [ ] 가끔 ⚙️ → **백업 파일 저장** 해두기
