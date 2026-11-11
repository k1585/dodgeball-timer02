# FORMDOT. 웹사이트

`index.html` 한 파일로 작동해요. 기능 정리 문서에 맞춰 처음부터 만들었어요.

## 바로 써 보기
`index.html`을 GitHub Pages 등에 올리면 바로 열려요. 서버 설정이 없어도 아래는 모두 돼요.

- 3D 파일 견적 (STL, 3MF, G-code, .gcode.3mf), 3D 미리보기, 세부 설정
- 스케치·아이디어 의뢰서 작성
- 테스트 주문: 파일 칸·첨부 칸·학생 인증 칸을 3초 꾹 누르기 → 저장 없이 완료 화면까지
- 관리자: 로고 3초 꾹 또는 주소 끝에 `#admin` → 비밀번호 `0000` (`CONFIG.localPin`)
  - 서버 없이 바꾼 가격·문구·포트폴리오는 이 브라우저에만 저장돼요.

## 실제 주문 받기 (Firebase)
1. Firebase 프로젝트를 만들고 **Firestore**, **Storage**, **Authentication(이메일/비밀번호)** 를 켜요.
2. Authentication에 관리자 계정을 만들어요.
   - 이메일: `CONFIG.adminEmail`과 같게 (기본 `admin@formdot.kr`)
   - 비밀번호: `fd-` + 4자리 + `-admin` (예: 4자리가 1234면 `fd-1234-admin`)
3. `firestore.rules`, `storage.rules`를 콘솔의 규칙 탭에 붙여 넣어요. 관리자 이메일을 맞춰 주세요.
4. `index.html` 위쪽 `CONFIG`를 채워요.
   - `firebase`: 프로젝트 설정 → 웹 앱 구성 값
   - `kakaoUrl`, `storeUrl`: 오픈채팅·스마트스토어 주소
   - `ntfyTopic`: ntfy 앱에서 구독할 주제 이름 (비우면 알림 안 보냄)
5. Storage CORS 설정: 관리자 화면에서 파일을 내려받으려면 버킷에 CORS(GET 허용)를 설정해 주세요.

## 링크 미리보기 이미지
`og:image`가 `https://k1585.github.io/og-image.png`를 가리켜요. 1200×630 이미지를 그 이름으로 올려 주세요.
