# FORMDOT 리디자인 시안

3D 프린팅·모델링 통합 주문 경험을 6가지 방향으로 만든 실제 작동 시안이에요.

## 열어 보기

- `index.html`을 더블클릭하면 시안 비교 갤러리가 열려요. 각 시안은 `concepts/*.html`이고, 파일 하나만 열어도 돼요.
- 인터넷이 없어도 작동해요. 폰트만 CDN(Pretendard, Google Fonts)에서 받고, 없으면 기본 글꼴로 보여요.
- **데모 모드**예요.
  - 주문은 그 브라우저의 저장소(localStorage)에만 저장돼요. 운영 Firebase·ntfy에는 연결하지 않아요.
  - 휴대폰 인증번호는 문자 대신 화면에 보여 줘요.
  - 관리자는 아무 4자리 숫자로 들어가요.
- 파일이 없으면 각 시안의 '샘플' 버튼을 누르면 돼요. `tests/fixtures/`의 STL·3MF·G-code로도 해 볼 수 있어요.

## 구조

```
formdot-redesign/
├── index.html              시안 갤러리·비교 (빌드 결과)
├── concepts/               독립 실행 시안 6개 (빌드 결과 — 직접 고치지 말 것)
├── src/
│   ├── engine.js           운영 사이트 견적 엔진 그대로 (파서·무게 추정·옵션 표)
│   ├── core.js             공통 코어: 서비스·질문 정의, 자동 견적/검토 규칙, 3D 뷰어, 폼, 데모 저장소, 인증 조회, 알림 어댑터, 관리자 데모
│   ├── core.css            공통 컴포넌트 스타일 (시안이 변수만 바꿔 씀)
│   ├── concept-*.html      시안별 화면·흐름
│   └── gallery.html        갤러리 본문
├── assets/                 갤러리 썸네일
├── docs/                   감사·비교·구조 결정·적용 계획·테스트 보고
├── tests/                  흐름 테스트, 파일 형식 테스트, 썸네일 스크립트, 샘플 파일
└── build.py                src → concepts/, index.html
```

## 다시 빌드하고 테스트하기

```bash
python3 build.py
node tests/smoke.js concept-c-guided          # 시안 하나 흐름 테스트 (PC + 휴대폰)
node tests/formats.js tests/fixtures           # 파일 형식별 견적
```

## 상태 표시

| 표시 | 뜻 |
|---|---|
| 실제 작동 확인 | 파일 분석, 자동 견적(운영과 같은 금액), 3D 미리보기, 옵션·검증·학생 할인 확인 |
| 시안/데모 | 주문 저장, 인증번호 조회, 관리자 기능 (브라우저 안에서만) |
| 연동 필요 | 문자·알림톡 발송, 서버 인증번호, 실제 주문 저장, 스마트스토어 상품 링크 |

자세한 내용은 `docs/`를 보세요. 추천안은 `docs/concept-comparison.md`, 적용 순서는 `docs/implementation-plan.md`에 있어요.
