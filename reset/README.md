# 전체 초기화 — 계정과 자료를 모두 지우기

시험 삼아 만든 계정과 자료를 싹 지우고 처음 상태로 되돌립니다.
**선생님 계정도 함께 사라집니다.** 되돌릴 수 없습니다.

지워지는 것은 두 군데입니다.

| 어디 | 무엇이 | 지우는 방법 |
|---|---|---|
| Authentication | 로그인 계정 (선생님·학생 전부) | 아래 2단계 |
| Firestore | 반, 숙제, 제출물, 사진 | 아래 1단계 |

둘 다 지워야 깨끗해집니다. 한쪽만 지우면 짝이 안 맞는 자료가 남습니다.

---

## 클라우드 셸에서 (추천)

https://console.cloud.google.com/ 에 들어가 오른쪽 위 터미널 아이콘을 누르거나,
구글 클라우드 앱에서 클라우드 셸을 엽니다. 그다음 아래를 순서대로 붙여 넣습니다.

### 1단계 — 자료 지우기 (반·숙제·제출물·사진)

```
firebase firestore:delete --all-collections -f --project today-homework
```

### 2단계 — 계정 지우기

```
cd ~/dodgeball-timer02 && git pull
cd reset
npm install
node delete-all-users.js --yes
```

`몇 차: 몇 개 지움` 이 줄줄이 나오다가 `끝났습니다` 가 뜨면 완료입니다.

> `자격 증명을 찾지 못했다`는 말이 나오면 아래를 한 번 실행하고 2단계를 다시 하세요.
> ```
> gcloud auth application-default login
> ```

### 3단계 — 확인

```
firebase firestore:databases:list --project today-homework
```

콘솔에서 직접 보셔도 됩니다.
- 계정: Authentication > Users 가 비어 있어야 합니다
- 자료: Firestore Database 에 컬렉션이 없어야 합니다

---

## 지운 뒤에 할 일

1. 앱에 들어가 **선생님 계정을 새로 만듭니다** (또는 구글로 로그인)
2. 반을 만듭니다
3. 학생 계정을 다시 발급합니다

규칙(Rules)과 배포한 주소는 그대로라 다시 손댈 필요가 없습니다.

---

## 계정이 몇 개 없을 때 (콘솔에서 직접)

스무 개 남짓이면 콘솔에서 눌러 지우는 편이 빠릅니다.

- 계정: Authentication > Users > 왼쪽 네모 칸으로 골라서 휴지통
- 자료: Firestore Database > 컬렉션 이름 옆 ⋮ > 컬렉션 삭제

한 쪽은 50개씩 보여 주므로, 많으면 위의 클라우드 셸 방법이 낫습니다.
