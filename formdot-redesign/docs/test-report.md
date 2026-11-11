# 테스트 보고

테스트 날짜: 2026-11-11 · 환경: 헤드리스 Chromium (Playwright), PC 1366×860 / 휴대폰 iPhone 13 에뮬레이션

## 무엇을 확인했나

1. **흐름 테스트** (`node tests/smoke.js <시안이름>`)
   - 6개 시안 각각을 PC와 휴대폰에서 끝까지 눌러요: 주문 → 접수 완료 → (일부) 조회 인증 → 관리자.
   - 콘솔 오류와 페이지 오류를 모아요.
   - 운영 서버(Firebase·ntfy 등) 요청이 나가면 막고 오류로 기록해요. 결과: **외부 요청 0건**. 폰트 CDN만 허용했어요.
2. **파일 형식 테스트** (`node tests/formats.js tests/fixtures`)
   - 형식별로 분석과 견적이 맞는지 봐요: STL 바이너리·ASCII, 3MF, 슬라이싱 3MF, G-code.
   - 손상 파일, 지원하지 않는 형식, 너무 큰 모델도 넣어 봐요.
3. **운영 사이트와 금액 비교**
   - 같은 파일(T브래킷 30×30×25mm)·같은 설정으로 운영 사이트와 시안이 같은 금액을 내는지 봐요.
   - PLA 기본 **3,565원**, PETG 튼튼하게 **3,730원**으로 둘 다 같아요.
4. **갤러리 페이지**: PC·휴대폰에서 가로 넘침이 없는지 확인했어요.

## 결과 요약

| 시안 | 페이지 오류 | 확인 항목 | 결과 |
|---|---|---|---|
| A 프리미엄 스튜디오 | 0 | 16 | 통과 |
| B 제작 구성기 | 0 | 12 | 통과 |
| C 안내형 여정 | 0 | 14 | 통과 |
| D 엔지니어링 랩 | 0 | 12 | 통과 |
| E 에디토리얼 | 0 | 10 | 통과 |
| F 대시보드 | 0 | 16 | 통과 |

## 파일 형식

```
a.gcode                  {"kind":"auto","total":4340,"g":7.5,"dims":null,"sliced":true,"why":""}
bambu_project.3mf        {"kind":"auto","total":3664,"g":7,"dims":"40×20×20","sliced":false,"why":""}
big.stl                  {"kind":"reject","total":null,"g":null,"dims":"400×20×20","sliced":false,"why":"가장 긴 변이 400mm예요. 최대 300mm까지 받을 수 있어요."}
cube.stl                 {"kind":"auto","total":3524,"g":4.1,"dims":"20×20×20","sliced":false,"why":""}
cube_ascii.stl           {"kind":"auto","total":3524,"g":4.1,"dims":"20×20×20","sliced":false,"why":""}
sliced.gcode.3mf         {"kind":"auto","total":4552,"g":14.3,"dims":"40×20×20","sliced":true,"why":""}
tshape.stl               {"kind":"auto","total":3565,"g":4.7,"dims":"30×30×25","sliced":false,"why":""}
broken.stl               {"kind":"review","total":null,"g":null,"dims":null,"sliced":false,"why":"파일을 해석하지 못했어요. 파일이 손상됐거나 내보내기 방식이 달라요."}
note.txt                 {"kind":"review","total":null,"g":null,"dims":null,"sliced":false,"why":"지원하지 않는 형식이에요. STL·3MF·G-code만 자동 견적돼요."}
```

- 300mm를 넘는 모델(big.stl, 400mm)은 접수를 거절하고 이유를 보여 줘요.
- 손상 파일과 지원하지 않는 형식은 금액을 지어내지 않아요. '추가 확인 필요'와 이유를 보여 줘요.

## 테스트 중 찾아서 고친 문제

- 휴대폰 주문 시트(A)에서 그리드 최소 폭 때문에 화면이 옆으로 넘쳤어요. → `minmax(0,1fr)`로 고쳤어요.
- 상세 설정 숫자를 바꾼 직후 다시 그리면 포커스 이동 중에 오류가 났어요(B). → 다시 그리기를 한 박자 늦췄어요.
- `hidden` 속성이 `display:flex`에 덮여 업로드 칸이 안 사라졌어요(B). → 공통 CSS에서 `[hidden]`을 강제했어요.
- 미리보기 캔버스가 '샘플' 버튼을 가렸어요(F). 미리보기를 드래그하면 파일 창이 열리기도 했어요. → 둘 다 고쳤어요.
- 휴대폰 상단의 아이콘 버튼이 비어 보였어요(F). → 고쳤어요.

## 확인하지 못한 것

- 실제 iPhone·Android 기기, Safari·삼성 인터넷: 에뮬레이션으로만 봤어요.
- 스크린리더: 라벨, 역할, 포커스 표시는 넣었지만 실제 낭독 테스트는 하지 않았어요.
- 아주 큰 파일(수십 MB)의 분석 속도: 운영 엔진과 같아서 운영 사이트와 같을 것으로 보지만, 시안에서 따로 재지 않았어요.
- 서버 기능(문자, 인증번호 서버, 실제 저장): 연동 전이라 데모로만 확인했어요.

## 항목별 기록

### concept-a-studio

오류 0건 · 확인 16개

| 화면 | 확인한 것 | 결과 |
|---|---|---|
| desktop | print quote after sample | 3,565원 |
| desktop | PETG strong | 3,730원 |
| desktop | validation shown | True |
| desktop | order no | 2704 |
| desktop | idea quote kind | fd-quote review |
| desktop | review done title | 접수됐어요. 확인 후 확정 금액을 알려 드릴게요. |
| desktop | lookup status | 결제 안내 |
| desktop | admin confirm -> pay_wait count | 1 |
| mobile | print quote after sample | 3,565원 |
| mobile | PETG strong | 3,730원 |
| mobile | validation shown | True |
| mobile | order no | 7225 |
| mobile | idea quote kind | fd-quote review |
| mobile | review done title | 접수됐어요. 확인 후 확정 금액을 알려 드릴게요. |
| mobile | lookup status | 결제 안내 |
| mobile | admin confirm -> pay_wait count | 1 |

### concept-b-configurator

오류 0건 · 확인 12개

| 화면 | 확인한 것 | 결과 |
|---|---|---|
| desktop | print price | 3,565원 |
| desktop | silk price | 3,643원 |
| desktop | adv infill 40 price | 3,721원 |
| desktop | done no | 2600 |
| desktop | pro price | 12,000원 |
| desktop | pro done | 주문이 접수됐어요 |
| mobile | print price | 3,565원 |
| mobile | silk price | 3,643원 |
| mobile | adv infill 40 price | 3,721원 |
| mobile | done no | 6593 |
| mobile | pro price | 12,000원 |
| mobile | pro done | 주문이 접수됐어요 |

### concept-c-guided

오류 0건 · 확인 14개

| 화면 | 확인한 것 | 결과 |
|---|---|---|
| desktop | advice | 힘을 받는 물건이라 튼튼함을 '튼튼하게'로 맞췄어요. |
| desktop | recommend | PETG HF 추천질기고 물에 강함 |
| desktop | quote | 4,227원 |
| desktop | quote qty1 | 3,730원 |
| desktop | done | 1997 |
| desktop | pro first q | 무엇을 만드나요? |
| desktop | pro quote | 9,000원 |
| mobile | advice | 힘을 받는 물건이라 튼튼함을 '튼튼하게'로 맞췄어요. |
| mobile | recommend | PETG HF 추천질기고 물에 강함 |
| mobile | quote | 4,227원 |
| mobile | quote qty1 | 3,730원 |
| mobile | done | 6732 |
| mobile | pro first q | 무엇을 만드나요? |
| mobile | pro quote | 9,000원 |

### concept-d-engineering

오류 0건 · 확인 12개

| 화면 | 확인한 것 | 결과 |
|---|---|---|
| desktop | fit bars | 3 |
| desktop | price | 3,565원 |
| desktop | done | 7952 |
| desktop | modify price | 3,000원 |
| desktop | major -> review | 추가 확인 필요 |
| desktop | review done | 접수됐어요. 확인 후 확정 금액을 알려 드릴게요. |
| mobile | fit bars | 3 |
| mobile | price | 3,565원 |
| mobile | done | 9992 |
| mobile | modify price | 3,000원 |
| mobile | major -> review | REVIEW |
| mobile | review done | 접수됐어요. 확인 후 확정 금액을 알려 드릴게요. |

### concept-e-editorial

오류 0건 · 확인 10개

| 화면 | 확인한 것 | 결과 |
|---|---|---|
| desktop | drawer svc | 손그림 구현 |
| desktop | sketch quote | 3,000원 |
| desktop | done | 8174 |
| desktop | filter pro count | 2 |
| desktop | print quote | 3,565원 |
| mobile | drawer svc | 손그림 구현 |
| mobile | sketch quote | 3,000원 |
| mobile | done | 9824 |
| mobile | filter pro count | 2 |
| mobile | print quote | 3,565원 |

### concept-f-dashboard

오류 0건 · 확인 16개

| 화면 | 확인한 것 | 결과 |
|---|---|---|
| desktop | quick price | 3,565원 |
| desktop | quick petg strong | 3,730원 |
| desktop | carried to new | 3,730원 |
| desktop | done | 9232 |
| desktop | active orders | 1 |
| desktop | reorder mat | PETG |
| desktop | idea price | 6,000원 |
| desktop | orders count | 1 |
| mobile | quick price | 3,565원 |
| mobile | quick petg strong | 3,730원 |
| mobile | carried to new | 3,730원 |
| mobile | done | 6733 |
| mobile | active orders | 1 |
| mobile | reorder mat | PETG |
| mobile | idea price | 6,000원 |
| mobile | orders count | 1 |