/* =====================================================================
   FORMDOT 시안 공통 코어 (데모 모드)
   - 견적 엔진(engine.js)은 운영 사이트 코드 그대로. 결과 금액이 운영과 같아요.
   - 서버 없이 브라우저 localStorage 에만 저장해요. 운영 Firebase·ntfy 에는 절대 연결하지 않아요.
   - 실제 발송/결제/인증은 하지 않고, 어댑터와 "연동 필요" 상태로 보여 줘요.
   ===================================================================== */
(function(){
const FD = window.FD = {DEMO: true};
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const won = n => Math.round(n).toLocaleString("ko-KR") + "원";
FD.$ = $; FD.$$ = $$; FD.esc = esc; FD.won = won;
const LS = {
  get(k, d){ try{ const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; }catch(e){ return d; } },
  set(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} }
};

/* ---------------- 설정 (관리자 > 가격 설정에서 변경) ----------------
   ※ 운영값: filament·perMin·base·margin·sketch·idea·baseMin·stepMin·stepFee·studentRate·maxSize
   ※ [제안] 표시는 운영 사이트에 없던 새 값 → 사장님 확인 필요                                 */
const DEF = {
  filament: {...FILAMENT_PRICE},
  perMin: 9.5, base: 2300, margin: 1.4,
  design: {sketch: 3000, idea: 6000, modify: 3000 /*[제안]*/, pro: 9000 /*[제안]*/},
  baseMin: 60, stepMin: 30, stepFee: 1000,
  studentRate: 0.15, studentMinSec: 5,
  maxSize: 300,                      // 운영 사이트 접수 한도
  printerMax: 256,                   // [제안] A1 실제 출력 범위. 넘으면 '분할 출력 검토'로 전환
  review: {maxQty: 50, maxGram: 1000, maxDesignMin: 360, minDescLen: 15},   // [제안] 관리자 검토 전환 기준
  smartstoreUrl: "",                 // 미설정이면 링크를 만들지 않음 (운영값은 스마트스토어 첫 화면 주소뿐이라 미설정 취급)
  kakaoUrl: "https://open.kakao.com/o/s85siVVi"
};
FD.DEF = DEF;
FD.settings = Object.assign(structuredClone(DEF), LS.get("fdr_settings", {}));
FD.saveSettings = s => { FD.settings = s; LS.set("fdr_settings", s); };

/* ---------------- 서비스 ---------------- */
FD.SERVICES = [
  {id: "print",  name: "3D 프린팅",     q: "3D 파일이 있어요",          d: "STL · 3MF · G-code를 올리면 바로 자동 견적",  ic: "cube"},
  {id: "sketch", name: "손그림 구현",   q: "손그림·도면·사진이 있어요",  d: "그림을 보고 3D 모델로 만들어 출력",            ic: "pen"},
  {id: "idea",   name: "아이디어 구현", q: "아이디어만 있어요",          d: "설명만 하면 설계부터 출력까지",               ic: "bulb"},
  {id: "modify", name: "기존 모델 수정", q: "고칠 3D 파일이 있어요",     d: "크기 조정·구멍 추가·형태 변경",               ic: "wrench"},
  {id: "pro",    name: "전문 3D 모델링", q: "정확한 설계가 필요해요",     d: "치수·공차·조립까지 맞춘 설계",                ic: "ruler"}
];
FD.svc = id => FD.SERVICES.find(s => s.id === id);
FD.ICON = {
  cube: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5 20.5 7v10L12 21.5 3.5 17V7z M3.5 7 12 11.5 20.5 7 M12 11.5v10" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>',
  pen: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20l1-4L16.5 4.5a2.1 2.1 0 0 1 3 3L8 19z M14 7l3 3" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>',
  bulb: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.8a6.6 6.6 0 0 0-4 11.9c.8.7 1.2 1.5 1.2 2.4v.4h5.6v-.4c0-.9.4-1.7 1.2-2.4A6.6 6.6 0 0 0 12 2.8zM9.5 20h5M10.5 22h3" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  wrench: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.5 3.5a5 5 0 0 0-4.8 6.4L3.5 16.1a2 2 0 0 0 2.8 2.8l6.2-6.2a5 5 0 0 0 6.4-4.8l-3 1.3-2.4-.9-.9-2.4z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>',
  ruler: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 16.5 16.5 3 21 7.5 7.5 21z M7 12.5l1.8 1.8M10 9.5l1.8 1.8M13 6.5l1.8 1.8" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"/></svg>',
  search: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M16 16l4.5 4.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  arrow: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  back: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  upload: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 16V4M7 9l5-5 5 5M4 15v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  chat: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 3C6.48 3 2 6.58 2 11c0 2.85 1.86 5.35 4.67 6.77-.2.74-.74 2.7-.85 3.12-.13.52.19.51.4.37.17-.11 2.62-1.78 3.68-2.5.69.1 1.39.15 2.1.15 5.52 0 10-3.58 10-8S17.52 3 12 3z"/></svg>',
  home: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 11.2 12 4.8l8 6.4V19a1 1 0 0 1-1 1h-4.6v-5.2H9.6V20H5a1 1 0 0 1-1-1z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>'
};
FD.icon = (k, cls = "") => `<span class="fd-ic ${cls}">${FD.ICON[k] || ""}</span>`;
FD.LOGO = '<svg class="fd-logo-sym" viewBox="372 318 516 528" role="img" aria-label="FORMDOT"><defs><linearGradient id="fdTopG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1A8CFF"/><stop offset="1" stop-color="#0A4DFF"/></linearGradient></defs><polygon points="628,340 820,437 628,535 434,437" fill="url(#fdTopG)" stroke="url(#fdTopG)" stroke-width="18" stroke-linejoin="round"/><g transform="matrix(1,0.5,0,1,382,467)" fill="currentColor"><rect width="60" height="250" rx="16"/><rect width="230" height="62" rx="14"/><rect x="40" y="114" width="190" height="62" rx="12"/></g><g transform="matrix(1,-0.5,0,1,640,582)"><path fill="#0B6BFF" fill-rule="evenodd" d="M14,0H221Q235,0 235,14V178Q235,250 163,250H14Q0,250 0,236V14Q0,0 14,0ZM63,68H164Q170,68 170,74V148Q170,188 130,188H63Q57,188 57,182V74Q57,68 63,68Z"/></g></svg>';
FD.WORD = '<svg class="fd-logo-word" viewBox="-7 -7 914 114" role="img" aria-label="FORMDOT"><g fill="none" stroke="currentColor" stroke-width="25" stroke-linejoin="round"><path d="M10,92V10H88M10,50H76"/><rect x="120" y="10" width="102" height="80" rx="40"/><path d="M260,92V10H314Q347,10 347,35Q347,60 314,60H260M308,60L348,92"/><path d="M385,92V10L440,62L495,10V92"/><path d="M535,10H585Q630,10 630,50Q630,90 585,90H535Z"/><path d="M736,10H708A40,40 0 0 0 708,90H736A40,40 0 0 0 736,10Z" pathLength="100" stroke-dasharray="0 46 50 4" stroke-linejoin="miter"/><path d="M800,10H900M850,10V92"/></g><path d="M736,10H708A40,40 0 0 0 708,90H736A40,40 0 0 0 736,10Z" pathLength="100" fill="none" stroke="#1A6DFF" stroke-width="25" stroke-dasharray="42 58"/></svg>';
FD.logo = (cls = "") => `<span class="fd-logo ${cls}">${FD.LOGO}${FD.WORD}</span>`;

/* ---------------- 출력 옵션 (빠른 설정 → 엔진 값) — 운영 사이트와 같은 표 ---------------- */
FD.MATS = OPT_BY_ID.mat.list.map(([v, t, d]) => ({v, name: t.replace(/\s*\(.*\)$/, ""), d}));
FD.MAT_SHORT = {"PLA":"무난한 기본","PLA-Matte":"무광 질감","PLA-Silk":"반짝이는 광택","PETG":"질기고 물에 강함","ABS":"열·충격에 강함",
  "ASA":"실외·햇빛용","TPU":"고무처럼 말랑","PLA-CF":"탄소섬유·단단","PETG-CF":"탄소섬유·강성"};
FD.COLORS = OPT_BY_ID.color.list.map(([v, t]) => ({v, name: t}));
FD.COLOR_HEX = {"흰색":"#f2f2f0","검정":"#1c1c1f","회색":"#8e9196","빨강":"#e5383b","주황":"#f28c28","노랑":"#f5c518","초록":"#2ea44f",
  "파랑":"#2f6fe4","보라":"#8b55d6","분홍":"#f4a0c0","갈색":"#8b5a3c","투명":"#cfe9f5","기타":"#2962ff"};
FD.PURPOSES = [["deco","장식·소품"],["living","생활용품·수납"],["mount","고정·거치대"],["func","기능성 부품"],["repair","수리·교체 부품"],
  ["proto","시제품·테스트"],["gift","선물·기념품"],["hobby","취미·장난감"],["etc","기타"]];
FD.QUICK = {
  strength: {light: {walls:2, infill:10}, normal: {walls:2, infill:15}, strong: {walls:4, infill:30, pattern:"cubic", topL:6, botL:4}},
  quality:  {fast: {layerH:"0.28"}, normal: {layerH:"0.20"}, fine: {layerH:"0.12"}},
  support:  {none: {supType:"none"}, auto: {supType:"tree"}}
};
FD.QUICK_LABEL = {strength: {light:"가볍게", normal:"표준", strong:"튼튼하게"}, quality: {fast:"빠르게", normal:"표준", fine:"곱게"}, support: {none:"필요 없음", auto:"자동으로 넣기"}};
FD.OPTS = OPTS; FD.OPT_BY_ID = OPT_BY_ID;
FD.defaultPrintOpts = () => ({mat: "PLA", color: "흰색", purpose: "living", strength: "normal", quality: "normal", support: "none", qty: 1, adv: null});
// 용도 → 추천 (운영 사이트와 같은 규칙)
FD.purposeAdvice = p => ["func","mount","repair"].includes(p) ? {strength: "strong", msg: "힘을 받는 물건이라 튼튼함을 '튼튼하게'로 맞췄어요."}
  : ["deco","gift"].includes(p) ? {msg: "보이는 물건이라 표면 품질을 신경 써서 출력해요."} : null;

/* ---------------- 파일 분석 ---------------- */
FD.analyzeFile = async file => {
  const lower = file.name.toLowerCase();
  if (file.size > 150 * 1024 * 1024) return {name: file.name, error: "파일이 너무 커요 (최대 150MB)", code: "too_large"};
  if (!/\.(stl|3mf|gcode|gco|g)$/.test(lower)) return {name: file.name, error: "지원하지 않는 형식이에요. STL·3MF·G-code만 자동 견적돼요.", code: "unsupported"};
  try{
    const buf = await file.arrayBuffer();
    let r;
    if (lower.endsWith(".stl")) r = {geo: parseSTL(buf)};
    else if (lower.endsWith(".3mf")) r = await parse3MF(buf);
    else r = {sliced: parseGcodeText(gcodeHeadTail(buf))};
    if (r.sliced && !(r.sliced.g > 0 || r.sliced.sec > 0)) r.sliced = null;
    if (!r.geo && !r.sliced) throw new Error("no data");
    const m = {name: file.name, size: file.size, file, ...r};
    if (m.geo){ m.dims = m.geo.max.map((v, i) => v - m.geo.min[i]); m.vol = m.geo.vol / 1000; }
    return m;
  }catch(e){
    console.warn(e);
    return {name: file.name, error: "파일을 해석하지 못했어요. 파일이 손상됐거나 내보내기 방식이 달라요.", code: "parse_fail"};
  }
};

/* ---------------- 자동 견적 ---------------- */
const engineFor = o => {
  const v = engineDefaults();
  v.mat = o.mat; v.color = o.color;
  if (o.adv) Object.assign(v, o.adv);
  else for (const k of ["strength","quality","support"]) Object.assign(v, FD.QUICK[k][o[k]] || {});
  return v;
};
FD.printPrice = (mat, g, m) => {
  const S = FD.settings, perG = (S.filament[mat] || 18000) / 1000;
  return (perG * g + S.perMin * m + S.base) * S.margin;
};
// 3D 프린팅 견적. 반환: {kind:'auto'|'review', total, unit, g, lines, reasons, notes}
FD.quotePrint = (model, o, student) => {
  const S = FD.settings, qty = Math.max(1, parseInt(o.qty) || 1), reasons = [], notes = [];
  if (!model) return {kind: "empty"};
  if (model.error) return {kind: "review", reasons: [model.error], lines: [], notes: ["파일을 직접 확인한 뒤 견적을 알려 드려요."]};
  let g = 0, min = 0;
  if (model.sliced){
    const s = model.sliced;
    if (s.g > 0) g = s.g * qty;
    if (s.sec > 0) min = Math.ceil(s.sec * qty / 60);
    if (!(s.g > 0) && model.geo){ ENGINE_OPTV = engineFor(o); g = estimate(model.geo).g * qty; }
    notes.push("슬라이싱된 파일이라 파일 속 출력 설정으로 계산했어요.");
  } else {
    ENGINE_OPTV = engineFor(o);
    const e = estimate(model.geo);
    g = e.g * qty; min = Math.ceil(e.min * qty);
  }
  g = +g.toFixed(2);
  if (model.dims){
    const big = Math.max(...model.dims);
    if (big > S.maxSize) return {kind: "reject", reasons: [`가장 긴 변이 ${big.toFixed(0)}mm예요. 최대 ${S.maxSize}mm까지 받을 수 있어요.`], lines: [], notes: ["모델을 줄이거나 나눠서 올려 주세요."]};
    if (big > S.printerMax) reasons.push(`가장 긴 변 ${big.toFixed(0)}mm — 프린터 출력 범위(${S.printerMax}mm)를 넘어 분할 출력을 검토해야 해요.`);
  }
  if (qty > S.review.maxQty) reasons.push(`수량 ${qty}개 — 대량 주문은 일정과 단가를 따로 확인해요.`);
  if (g > S.review.maxGram) reasons.push(`예상 무게 ${Math.round(g)}g — 대형 출력이라 출력 방향·분할을 확인해요.`);
  if (o.color === "기타") reasons.push("기타 색상 — 가능한 색상을 확인한 뒤 안내해요.");
  if (!(g > 0)) reasons.push("무게를 계산하지 못했어요.");
  const total = FD.printPrice(o.mat, g, min);
  const final = student ? total * (1 - S.studentRate) : total;
  const lines = [{label: `출력비 (${qty}개)`, amount: total}];
  if (student) lines.push({label: `학생 할인 ${Math.round(S.studentRate * 100)}%`, amount: final - total});
  return {kind: reasons.length ? "review" : "auto", g, total: final, before: total, lines, reasons, notes, qty};
};

// 모델링 의뢰 자동 견적: 예상 작업 시간 → 디자인비 (기본 1시간 포함, 초과 30분마다 추가 — 운영 규칙)
FD.COMPLEXITY = [["simple","단순","직육면체·판·고리처럼 단순한 형태",60],["normal","보통","구멍·홈·곡면이 몇 개 있는 형태",120],
  ["complex","복잡","여러 부품·곡면·정밀한 맞춤이 필요한 형태",210],["unknown","잘 모르겠어요","담당자가 보고 정해요",null]];
FD.FEATURES = [["screw","나사·볼트 구멍",15],["fit","끼움·맞물림",30],["hinge","힌지·움직이는 부분",45],["text","글자·로고 각인",20],["multi","여러 부품 조립",40],["exact","치수를 정확히 맞춰야 함",30]];
FD.MOD_SCOPE = [["scale","크기 조정만",20],["hole","구멍·부분 추가/삭제",45],["shape","형태 일부 변경",90],["major","대부분 다시 설계",null]];
FD.designFee = (svc, minutes) => {
  const S = FD.settings, base = S.design[svc] || 0;
  return base + Math.ceil(Math.max(0, minutes - S.baseMin) / S.stepMin) * S.stepFee;
};
FD.quoteDesign = (svc, v, student) => {
  const S = FD.settings, reasons = [], notes = [];
  let min = 0;
  if (svc === "modify"){
    const sc = FD.MOD_SCOPE.find(x => x[0] === v.scope);
    if (!sc) return {kind: "empty"};
    if (sc[2] == null) reasons.push("대부분 다시 설계 — 새로 모델링하는 범위라 담당자가 확인해요."); else min = sc[2];
  } else {
    const cx = FD.COMPLEXITY.find(x => x[0] === v.complexity);
    if (!cx) return {kind: "empty"};
    if (cx[3] == null) reasons.push("형태 난이도를 정하지 않으셨어요. 담당자가 자료를 보고 정해요."); else min = cx[3];
    if (svc === "pro") min += Math.max(0, (parseInt(v.parts) || 1) - 1) * 30;
  }
  for (const f of FD.FEATURES) if ((v.features || []).includes(f[0])) min += f[2];
  const desc = String(v.desc || "").trim();
  if ((svc === "idea" || svc === "pro") && desc.length < S.review.minDescLen) reasons.push("설명이 짧아요. 만들 물건을 조금 더 알려 주시면 바로 견적이 나와요.");
  if (svc === "pro" && !(v.dims && v.dims.some(x => +x > 0))) reasons.push("전문 모델링은 치수가 필요해요. 치수가 없으면 담당자가 확인해요.");
  if (min > S.review.maxDesignMin) reasons.push(`예상 작업 시간이 ${Math.round(min / 60)}시간을 넘어 일정·범위를 확인해요.`);
  const fee = FD.designFee(svc, min);
  const final = student ? fee * (1 - S.studentRate) : fee;
  const lines = [{label: `디자인비 (예상 작업 ${fmtMin(min)})`, amount: fee}];
  if (student) lines.push({label: `학생 할인 ${Math.round(S.studentRate * 100)}%`, amount: final - fee});
  if (v.output !== "file") notes.push("출력비는 모델이 완성되면 3D 프린팅과 같은 계산식으로 자동 계산해 따로 안내해요.");
  notes.push(`디자인비는 기본 ${S.baseMin / 60}시간 포함, 넘으면 ${S.stepMin}분마다 ${won(S.stepFee)}이 더해져요.`);
  return {kind: reasons.length ? "review" : "auto", total: final, before: fee, minutes: min, lines, reasons, notes};
};
function fmtMin(m){ const h = Math.floor(m / 60), r = m % 60; return h ? (r ? `${h}시간 ${r}분` : `${h}시간`) : `${r}분`; }
FD.fmtMin = fmtMin;

/* ---------------- 의뢰 항목 (서비스별로 다르게) ---------------- */
const F = {
  title: (ph) => ({id: "title", label: "무엇을 만드나요?", type: "text", req: true, ph}),
  purpose: {id: "purpose", label: "사용 용도", type: "chips", options: FD.PURPOSES, def: "living"},
  dims: (req) => ({id: "dims", label: "원하는 크기 (mm)", type: "dims", req, help: "가로 × 세로 × 높이. 모르면 비워 두세요."}),
  refs: (req, label) => ({id: "refs", label: label || "참고 자료", type: "files", req, accept: "image/*,.pdf", help: "사진·그림·PDF · 여러 장 가능"}),
  complexity: {id: "complexity", label: "형태 난이도", type: "radio", req: true, options: FD.COMPLEXITY.map(x => [x[0], x[1], x[2]])},
  features: {id: "features", label: "필요한 기능", type: "checks", options: FD.FEATURES.map(x => [x[0], x[1]])},
  qty: {id: "qty", label: "수량", type: "number", def: 1, min: 1, max: 999},
  mat: {id: "mat", label: "희망 재료", type: "select", options: [["auto","추천해 주세요"], ...FD.MATS.map(m => [m.v, m.name])], def: "auto"},
  output: {id: "output", label: "받을 결과물", type: "radio", req: true, def: "print", options: [["print","출력까지 (완성품 배송)"],["file","3D 파일만"]]}
};
FD.FLOWS = {
  sketch: [
    {key: "material", title: "자료 올리기", fields: [F.refs(true, "손그림·도면·사진"), F.title("예) 선반 받침 브래킷"), F.purpose]},
    {key: "spec", title: "요구사항", fields: [F.dims(false), {id: "desc", label: "설명", type: "textarea", ph: "예) L자 모양, 나사 구멍 2개, 위에 2kg 화분을 올려요."}, F.complexity, F.features, F.output, F.qty, F.mat]}
  ],
  idea: [
    {key: "material", title: "아이디어 설명", fields: [F.title("예) 책상 밑 멀티탭 거치대"), {id: "desc", label: "자세한 설명", type: "textarea", req: true, ph: "무엇을, 어디에, 어떻게 쓰고 싶은지 적어 주세요."}, F.purpose, F.refs(false, "참고 사진 (선택)")]},
    {key: "spec", title: "요구사항", fields: [{id: "place", label: "설치·사용할 곳", type: "text", ph: "예) 책상 상판 아래, 폭 40cm"}, F.dims(false), F.complexity, F.features, F.output, F.qty, F.mat]}
  ],
  modify: [
    {key: "material", title: "수정할 파일", fields: [{id: "model", label: "기존 3D 파일", type: "files", req: true, accept: ".stl,.3mf,.step,.stp,.obj", help: "STL·3MF·STEP·OBJ"},
      {id: "desc", label: "어디를 어떻게 바꿀까요?", type: "textarea", req: true, ph: "예) 구멍 지름을 5mm → 6mm로, 전체 높이를 10mm 늘려 주세요."}, F.refs(false)]},
    {key: "spec", title: "수정 범위", fields: [{id: "scope", label: "수정 범위", type: "radio", req: true, options: FD.MOD_SCOPE.map(x => [x[0], x[1]])}, F.features, F.dims(false), F.output, F.qty]}
  ],
  pro: [
    {key: "material", title: "설계 사양", fields: [F.title("예) 센서 하우징 2파트"), {id: "desc", label: "기능·형상 요구사항", type: "textarea", req: true, ph: "맞물리는 부품, 들어갈 부품 치수, 조립 방식 등"},
      F.dims(true), {id: "tol", label: "공차", type: "radio", def: "normal", options: [["normal","일반 (±0.3mm)"],["tight","정밀 (±0.1mm)"]]}, F.refs(false, "도면·참고 자료")]},
    {key: "spec", title: "작업 범위", fields: [F.complexity, {id: "parts", label: "부품 개수", type: "number", def: 1, min: 1, max: 30}, F.features,
      {id: "format", label: "파일 형식", type: "select", def: "stl", options: [["stl","STL"],["step","STEP (수정 가능한 CAD)"],["both","둘 다"]]}, F.output, F.qty, F.mat]}
  ]
};
FD.CONTACT = [
  {id: "name", label: "이름", type: "text", req: true, ph: "홍길동", auto: "name"},
  {id: "phone", label: "휴대폰 번호", type: "tel", req: true, ph: "010-1234-5678", help: "주문 조회 인증과 진행 안내에 써요."},
  {id: "memo", label: "요청 사항 (선택)", type: "textarea", ph: "받는 날짜 등"}
];

/* ---------------- 폼 그리기·읽기 (모든 시안 공통 컴포넌트) ---------------- */
const fieldId = (p, id) => `${p}-${id}`;
FD.fieldHTML = (f, p, val) => {
  const id = fieldId(p, f.id), v = val ?? f.def ?? "";
  let c = "";
  if (f.type === "text" || f.type === "tel") c = `<input class="fd-in" id="${id}" type="${f.type}" ${f.type === "tel" ? 'inputmode="tel" autocomplete="tel"' : ""} ${f.auto ? `autocomplete="${f.auto}"` : ""} maxlength="200" placeholder="${esc(f.ph || "")}" value="${esc(v)}">`;
  else if (f.type === "textarea") c = `<textarea class="fd-in" id="${id}" maxlength="3000" rows="4" placeholder="${esc(f.ph || "")}">${esc(v)}</textarea>`;
  else if (f.type === "number") c = `<input class="fd-in fd-num" id="${id}" type="number" inputmode="numeric" min="${f.min}" max="${f.max}" value="${esc(v || f.def)}">`;
  else if (f.type === "select") c = `<select class="fd-in" id="${id}">${f.options.map(([k, t]) => `<option value="${k}"${k === (v || f.def) ? " selected" : ""}>${esc(t)}</option>`).join("")}</select>`;
  else if (f.type === "dims") c = `<div class="fd-dims" id="${id}">${["가로","세로","높이"].map((t, i) => `<input class="fd-in" type="number" inputmode="decimal" min="1" max="300" placeholder="${t}" aria-label="${t} mm" value="${esc((v || [])[i] || "")}">`).join('<span>×</span>')}</div>`;
  else if (f.type === "chips" || f.type === "radio") c = `<div class="fd-${f.type === "chips" ? "chips" : "radios"}" id="${id}" role="radiogroup">${f.options.map(([k, t, d]) =>
      `<button type="button" role="radio" class="fd-opt${k === (v || f.def) ? " on" : ""}" aria-checked="${k === (v || f.def)}" data-v="${k}"><b>${esc(t)}</b>${d ? `<small>${esc(d)}</small>` : ""}</button>`).join("")}</div>`;
  else if (f.type === "checks") c = `<div class="fd-chips" id="${id}">${f.options.map(([k, t]) => `<button type="button" class="fd-opt${(v || []).includes(k) ? " on" : ""}" aria-pressed="${(v || []).includes(k)}" data-v="${k}"><b>${esc(t)}</b></button>`).join("")}</div>`;
  else if (f.type === "files") c = `<label class="fd-drop" for="${id}">${FD.icon("upload")}<span><b>눌러서 고르거나 끌어다 놓기</b><small>${esc(f.help || "")}</small></span></label>
      <input id="${id}" type="file" accept="${f.accept || ""}" multiple hidden><div class="fd-flist" data-for="${id}"></div>`;
  return `<div class="fd-field" data-fid="${f.id}" data-type="${f.type}">
    <label class="fd-label" for="${f.type === "dims" ? "" : id}">${esc(f.label)}${f.req ? '<i class="fd-req" aria-label="필수">*</i>' : ""}</label>
    ${f.help && f.type !== "files" ? `<div class="fd-help">${esc(f.help)}</div>` : ""}${c}<div class="fd-err" role="alert" hidden></div></div>`;
};
FD.formHTML = (fields, p, vals = {}) => fields.map(f => FD.fieldHTML(f, p, vals[f.id])).join("");
const FILES = {};      // 화면에서 고른 파일 (데모: 이름·크기만 저장)
FD.bindForm = (root, onChange) => {
  root.addEventListener("click", e => {
    const b = e.target.closest(".fd-opt"); if (!b || !root.contains(b)) return;
    const box = b.parentElement, fld = b.closest(".fd-field");
    if (fld.dataset.type === "checks"){ b.classList.toggle("on"); b.setAttribute("aria-pressed", b.classList.contains("on")); }
    else box.querySelectorAll(".fd-opt").forEach(x => { x.classList.toggle("on", x === b); x.setAttribute("aria-checked", x === b); });
    clearErr(fld); onChange && onChange();
  });
  root.addEventListener("input", e => { const fld = e.target.closest(".fd-field"); if (fld) clearErr(fld); onChange && onChange(); });
  root.querySelectorAll('.fd-field[data-type="files"]').forEach(fld => {
    const inp = fld.querySelector("input[type=file]"), drop = fld.querySelector(".fd-drop"), list = fld.querySelector(".fd-flist");
    const add = fl => { FILES[inp.id] = [...(FILES[inp.id] || []), ...fl].slice(0, 10); draw(); clearErr(fld); onChange && onChange(); };
    const draw = () => { list.innerHTML = (FILES[inp.id] || []).map((f, i) => `<span class="fd-file">${esc(f.name)} <small>${(f.size / 1048576).toFixed(1)}MB</small><button type="button" data-i="${i}" aria-label="${esc(f.name)} 빼기">×</button></span>`).join(""); };
    inp.onchange = () => { add([...inp.files]); inp.value = ""; };
    ["dragenter","dragover"].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add("over"); }));
    ["dragleave","drop"].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.remove("over"); }));
    drop.addEventListener("drop", e => add([...e.dataTransfer.files]));
    list.onclick = e => { const b = e.target.closest("button[data-i]"); if (!b) return; FILES[inp.id].splice(+b.dataset.i, 1); draw(); onChange && onChange(); };
    draw();
  });
};
const clearErr = fld => { fld.classList.remove("bad"); const e = fld.querySelector(".fd-err"); if (e){ e.hidden = true; e.textContent = ""; } };
FD.readForm = (root, fields, p) => {
  const v = {};
  for (const f of fields){
    const id = fieldId(p, f.id), el = document.getElementById(id);
    if (!el) continue;
    if (f.type === "dims") v[f.id] = [...el.querySelectorAll("input")].map(i => i.value);
    else if (f.type === "chips" || f.type === "radio"){ const on = el.querySelector(".fd-opt.on"); v[f.id] = on ? on.dataset.v : ""; }
    else if (f.type === "checks") v[f.id] = [...el.querySelectorAll(".fd-opt.on")].map(b => b.dataset.v);
    else if (f.type === "files") v[f.id] = (FILES[id] || []).map(x => ({name: x.name, size: x.size}));
    else v[f.id] = el.value.trim();
  }
  return v;
};
FD.validate = (root, fields, p) => {
  const v = FD.readForm(root, fields, p); let first = null;
  for (const f of fields){
    const fld = root.querySelector(`.fd-field[data-fid="${f.id}"]`); if (!fld) continue;
    let msg = "";
    const x = v[f.id];
    if (f.req && (x == null || x === "" || (Array.isArray(x) && (f.type === "dims" ? !x.some(n => +n > 0) : !x.length)))) msg = f.type === "files" ? "파일을 하나 이상 올려 주세요." : f.type === "radio" ? "하나를 골라 주세요." : "꼭 적어 주세요.";
    else if (f.type === "tel" && x && !/^01[016789]-?\d{3,4}-?\d{4}$/.test(x.replace(/\s/g, ""))) msg = "휴대폰 번호 형식을 확인해 주세요. (예: 010-1234-5678)";
    else if (f.type === "dims" && x.some(n => n && (+n <= 0 || +n > FD.settings.maxSize))) msg = `한 변은 1~${FD.settings.maxSize}mm로 적어 주세요.`;
    if (msg){ fld.classList.add("bad"); const e = fld.querySelector(".fd-err"); e.textContent = msg; e.hidden = false; first = first || fld; }
  }
  if (first){ first.scrollIntoView({behavior: "smooth", block: "center"}); const i = first.querySelector("input,textarea,button"); i && i.focus({preventScroll: true}); }
  return first ? null : v;
};

/* ---------------- 견적 카드 (자동 / 검토 필요 / 접수 불가 상태) ---------------- */
FD.quoteHTML = (q, opt = {}) => {
  if (!q || q.kind === "empty") return `<div class="fd-quote empty"><div class="fd-q-head">예상 견적</div><div class="fd-q-total">—</div><p class="fd-q-note">${esc(opt.emptyText || "필요한 정보를 넣으면 바로 계산돼요.")}</p></div>`;
  if (q.kind === "reject") return `<div class="fd-quote reject" role="status"><div class="fd-q-head">접수할 수 없어요</div>${q.reasons.map(r => `<p class="fd-q-reason">${esc(r)}</p>`).join("")}${q.notes.map(n => `<p class="fd-q-note">${esc(n)}</p>`).join("")}</div>`;
  const review = q.kind === "review";
  return `<div class="fd-quote ${review ? "review" : "auto"}" role="status">
    <div class="fd-q-head"><span class="fd-badge ${review ? "warn" : "ok"}">${review ? "추가 확인 필요" : "자동 견적"}</span>${review ? "" : '<span class="fd-q-kind">예상 금액</span>'}</div>
    ${q.total != null && !(review && !q.lines.length) ? `<div class="fd-q-total">${review ? '<small>참고 금액</small> ' : ""}${won(q.total)}</div>` : `<div class="fd-q-total">확인 후 안내</div>`}
    ${q.g ? `<div class="fd-q-meta">예상 무게 ${q.g.toFixed(1)}g</div>` : ""}
    ${q.lines.length > 1 ? `<dl class="fd-q-lines">${q.lines.map(l => `<div><dt>${esc(l.label)}</dt><dd>${l.amount < 0 ? "−" + won(-l.amount) : won(l.amount)}</dd></div>`).join("")}</dl>` : ""}
    ${review ? `<div class="fd-q-why"><b>담당자가 확인하는 이유</b>${q.reasons.map(r => `<p>${esc(r)}</p>`).join("")}<p class="fd-q-note">주문은 지금 접수돼요. 확인이 끝나면 확정 금액을 문자·사이트로 알려 드려요.</p></div>` : ""}
    ${q.notes.map(n => `<p class="fd-q-note">${esc(n)}</p>`).join("")}
    <p class="fd-q-note">${review ? "" : "예상 금액이에요. 실제 출력 조건 확인 후 달라질 수 있어요. "}결제는 네이버 스마트스토어에서 해요.</p></div>`;
};

/* ---------------- 3D 미리보기 (회전·확대·처음 시점) ---------------- */
FD.Viewer = class {
  constructor(canvas, opt = {}){
    this.cv = canvas; this.ctx = canvas.getContext("2d"); this.bg = opt.bg; this.grid = opt.grid || "rgba(128,140,160,.18)";
    this.reset(); this.color = [41,98,255]; this.spin = false; this.m = null;
    let drag = null, pinch = null;
    const pts = new Map();
    canvas.style.touchAction = "none";
    canvas.addEventListener("pointerdown", e => { canvas.setPointerCapture(e.pointerId); pts.set(e.pointerId, [e.clientX, e.clientY]); this.spin = false; drag = [e.clientX, e.clientY]; });
    canvas.addEventListener("pointermove", e => {
      if (!pts.has(e.pointerId)) return; pts.set(e.pointerId, [e.clientX, e.clientY]);
      if (pts.size === 2){ const [a, b] = [...pts.values()], d = Math.hypot(a[0] - b[0], a[1] - b[1]); if (pinch) this.zoom = Math.min(6, Math.max(.3, this.zoom * d / pinch)); pinch = d; this.draw(); return; }
      if (!drag) return; this.yaw += (e.clientX - drag[0]) * .01; this.pitch = Math.min(1.55, Math.max(-.2, this.pitch + (e.clientY - drag[1]) * .01)); drag = [e.clientX, e.clientY]; this.draw();
    });
    const up = e => { pts.delete(e.pointerId); if (pts.size < 2) pinch = null; if (!pts.size) drag = null; };
    canvas.addEventListener("pointerup", up); canvas.addEventListener("pointercancel", up);
    canvas.addEventListener("wheel", e => { e.preventDefault(); this.zoom = Math.min(6, Math.max(.3, this.zoom * (e.deltaY < 0 ? 1.1 : .9))); this.draw(); }, {passive: false});
    canvas.addEventListener("dblclick", () => { this.reset(); this.draw(); });
    new ResizeObserver(() => this.draw()).observe(canvas);
    const tick = () => { if (this.spin && this.m && canvas.offsetParent){ this.yaw += .012; this.draw(); } requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  }
  reset(){ this.yaw = -.6; this.pitch = .9; this.zoom = 1; }
  setColor(name){ const h = FD.COLOR_HEX[name] || "#2962ff"; this.color = [1,3,5].map(i => parseInt(h.slice(i, i + 2), 16)); this.draw(); }
  setModel(geo){
    if (!geo){ this.m = null; this.draw(); return; }
    const total = geo.tris, step = Math.max(1, Math.ceil(total / 20000)), tris = []; let n = 0;
    for (const ch of geo.chunks) for (let i = 0; i < ch.length / 9; i++, n++){
      if (n % step) continue;
      const t = ch.subarray(i * 9, i * 9 + 9);
      const ux = t[3]-t[0], uy = t[4]-t[1], uz = t[5]-t[2], vx = t[6]-t[0], vy = t[7]-t[1], vz = t[8]-t[2];
      let nx = uy*vz-uz*vy, ny = uz*vx-ux*vz, nz = ux*vy-uy*vx; const l = Math.hypot(nx, ny, nz) || 1;
      tris.push({t, n: [nx/l, ny/l, nz/l]});
    }
    this.m = {tris, c: geo.min.map((v, i) => (v + geo.max[i]) / 2), r: Math.hypot(...geo.max.map((v, i) => v - geo.min[i])) / 2 || 1, min: geo.min, max: geo.max};
    this.reset(); this.spin = tris.length < 12000; this.draw();
  }
  draw(){
    const cv = this.cv, ctx = this.ctx, dpr = devicePixelRatio || 1, W = cv.clientWidth, H = cv.clientHeight;
    if (!W || !H) return;
    if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)){ cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
    if (this.bg){ ctx.fillStyle = this.bg; ctx.fillRect(0, 0, W, H); }
    const m = this.m; if (!m) return;
    const cy = Math.cos(this.yaw), sy = Math.sin(this.yaw), cp = Math.cos(this.pitch), sp = Math.sin(this.pitch);
    const s = Math.min(W, H) * .46 / m.r * this.zoom, c = m.c;
    const P = (x, y, z) => { x -= c[0]; y -= c[1]; z -= c[2]; const x1 = x*cy - y*sy, y1 = x*sy + y*cy; return [W/2 + x1*s, H/2 - (y1*sp + z*cp)*s, y1*cp - z*sp]; };
    const z0 = m.min[2], g0 = [Math.floor((m.min[0]-10)/10)*10, Math.floor((m.min[1]-10)/10)*10], g1 = [Math.ceil((m.max[0]+10)/10)*10, Math.ceil((m.max[1]+10)/10)*10];
    if ((g1[0]-g0[0]) + (g1[1]-g0[1]) < 1200){
      ctx.strokeStyle = this.grid; ctx.lineWidth = 1; ctx.beginPath();
      for (let x = g0[0]; x <= g1[0]; x += 10){ const a = P(x, g0[1], z0), b = P(x, g1[1], z0); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); }
      for (let y = g0[1]; y <= g1[1]; y += 10){ const a = P(g0[0], y, z0), b = P(g1[0], y, z0); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); }
      ctx.stroke();
    }
    const L = [];
    for (const {t, n} of m.tris){
      const a = P(t[0],t[1],t[2]), b = P(t[3],t[4],t[5]), d = P(t[6],t[7],t[8]);
      const vnx = n[0]*cy - n[1]*sy, vy0 = n[0]*sy + n[1]*cy, vny = vy0*cp - n[2]*sp, vnz = vy0*sp + n[2]*cp;
      L.push([a[2]+b[2]+d[2], a, b, d, Math.abs(-.3*vnx - .75*vny + .6*vnz)]);
    }
    L.sort((p, q) => q[0] - p[0]);
    const [r, g, bl] = this.color;
    for (const [, a, b, d, l] of L){
      const k = .45 + .55 * l; ctx.fillStyle = `rgb(${r*k|0},${g*k|0},${bl*k|0})`; ctx.strokeStyle = ctx.fillStyle;
      ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.lineTo(d[0], d[1]); ctx.closePath(); ctx.fill(); ctx.stroke();
    }
  }
};
// 치수 상자 (모델링 의뢰에서 원하는 크기를 3D로 보여 줄 때)
FD.boxGeo = (dx, dy, dz) => { const t = [], v = [[0,0,0],[dx,0,0],[dx,dy,0],[0,dy,0],[0,0,dz],[dx,0,dz],[dx,dy,dz],[0,dy,dz]];
  for (const f of [[0,2,1],[0,3,2],[4,5,6],[4,6,7],[0,1,5],[0,5,4],[1,2,6],[1,6,5],[2,3,7],[2,7,6],[3,0,4],[3,4,7]]) t.push(...f.flatMap(i => v[i]));
  const g = newGeo(); g.chunks.push(new Float32Array(t)); g.tris = 12; g.min = [0,0,0]; g.max = [dx,dy,dz]; g.vol = dx*dy*dz; return g; };
// 샘플 STL (데모용 T자 모델: 30×30×25mm) — 파일 없이 흐름을 볼 때
FD.sampleModel = () => {
  const box = (x0, y0, z0, x1, y1, z1) => { const v = [[x0,y0,z0],[x1,y0,z0],[x1,y1,z0],[x0,y1,z0],[x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1]];
    return [[0,2,1],[0,3,2],[4,5,6],[4,6,7],[0,1,5],[0,5,4],[1,2,6],[1,6,5],[2,3,7],[2,7,6],[3,0,4],[3,4,7]].map(f => f.map(i => v[i])); };
  const tris = [...box(10, 10, 0, 20, 20, 20), ...box(0, 0, 20, 30, 30, 25)];
  const buf = new ArrayBuffer(84 + tris.length * 50), dv = new DataView(buf); dv.setUint32(80, tris.length, true);
  tris.forEach((t, i) => t.forEach((p, k) => p.forEach((c, j) => dv.setFloat32(84 + i * 50 + 12 + k * 12 + j * 4, c, true))));
  const f = new File([buf], "샘플_T브래킷.stl"); return f;
};

/* ---------------- 주문 저장 (데모: 이 브라우저에만) ---------------- */
FD.STATUS = [
  ["received", "접수 완료", "주문이 접수됐어요."],
  ["review", "확인 중", "담당자가 내용을 확인하고 있어요. 확정 금액이 나오면 알려 드려요."],
  ["pay_wait", "결제 안내", "확정 금액을 스마트스토어에서 결제해 주세요. 주문번호를 옵션에 적어 주세요."],
  ["paid", "결제 확인", "결제가 확인됐어요. 제작을 준비해요."],
  ["making", "제작 중", "지금 열심히 만들고 있어요."],
  ["done", "완료·발송", "제작이 끝났어요. 네이버쇼핑에서 배송 현황을 확인해 주세요."],
  ["canceled", "취소", "주문이 취소됐어요."]
];
FD.stLabel = k => (FD.STATUS.find(s => s[0] === k) || [k, k])[1];
FD.stDesc = k => (FD.STATUS.find(s => s[0] === k) || [k, "", ""])[2];
FD.STEPS_PUBLIC = ["received", "review", "pay_wait", "paid", "making", "done"];
const normPhone = s => String(s || "").replace(/\D/g, "");
const SEED = () => {
  const now = Date.now(), H = 3600e3, mk = (no, svc, st, name, phone, title, total, ago, extra = {}) => ({no, demo: true, service: svc, status: st, title,
    customer: {name, phone}, quote: {kind: st === "review" ? "review" : "auto", total, reasons: st === "review" ? ["대형 출력 — 분할 출력 검토"] : []},
    createdAt: now - ago * H, updatedAt: now - ago * H / 2, memo: "", log: [{at: now - ago * H, who: "고객", act: "주문 접수"}], ...extra});
  return [
    mk("4821", "print", "making", "김예시", "01012345678", "T브래킷.stl · PLA Basic 흰색 × 2", 6890, 30),
    mk("3307", "sketch", "review", "이샘플", "01022223333", "선반 받침 브래킷", 3000, 5, {memo: "치수 확인 필요 (내부 메모 — 고객에게 안 보임)"}),
    mk("5512", "idea", "pay_wait", "박데모", "01055556666", "책상 밑 멀티탭 거치대", 8000, 12),
    mk("1290", "print", "done", "최테스트", "01077778888", "피규어받침.3mf · PLA Silk+ × 1", 4210, 96),
    mk("7745", "modify", "received", "정예시", "01099990000", "케이스 구멍 6mm로 수정", 4000, 1)
  ];
};
FD.store = {
  all(){ let o = LS.get("fdr_orders", null); if (!o){ o = SEED(); LS.set("fdr_orders", o); } return o; },
  save(list){ LS.set("fdr_orders", list); },
  get(no){ return this.all().find(o => o.no === no); },
  newNo(){ const used = new Set(this.all().map(o => o.no)); let n; do n = String(1000 + Math.floor(Math.random() * 9000)); while (used.has(n)); return n; },
  create(o){ const list = this.all(); o.no = this.newNo(); o.createdAt = o.updatedAt = Date.now(); o.log = [{at: o.createdAt, who: "고객", act: "주문 접수"}]; list.unshift(o); this.save(list); return o; },
  update(no, patch, who = "관리자", act = ""){ const list = this.all(), o = list.find(x => x.no === no); if (!o) return;
    Object.assign(o, patch); o.updatedAt = Date.now(); if (act) o.log.push({at: o.updatedAt, who, act}); this.save(list); return o; },
  remove(no){ this.save(this.all().filter(o => o.no !== no)); },
  reset(){ localStorage.removeItem("fdr_orders"); },
  mine(){ const mine = LS.get("fdr_my", []); return mine.map(no => this.get(no)).filter(Boolean); }
};
FD.submitOrder = ({service, title, values, model, opts, quote, customer, student}) => {
  const o = FD.store.create({service, title, values, customer: {name: customer.name, phone: normPhone(customer.phone)}, memoCustomer: customer.memo || "",
    model: model ? {name: model.name, dims: model.dims, sliced: !!model.sliced} : null, opts, quote, student: !!student,
    status: quote.kind === "review" ? "review" : "pay_wait", memo: ""});
  const my = LS.get("fdr_my", []); my.unshift(o.no); LS.set("fdr_my", my.slice(0, 20));
  FD.notify.send("order_created", o);
  return o;
};

/* ---------------- 알림 어댑터 (데모: 실제 발송 안 함) ----------------
   실서비스: 서버(Cloud Functions 등)에서만 발송. 키·발신번호는 서버 환경변수. 인증번호는 로그에 평문 저장 금지. */
FD.notify = {
  channels: [
    {id: "owner_push", name: "사장님 폰 알림 (ntfy)", state: "test", note: "운영 사이트에서 이미 쓰는 방식. 시안에서는 실제 전송하지 않아요."},
    {id: "sms", name: "고객 문자 (SMS)", state: "pending", note: "발송 업체 계약·발신번호 등록·API 키가 필요해요."},
    {id: "kakao", name: "카카오 알림톡", state: "pending", note: "사업자 등록·카카오 비즈니스 채널·템플릿 심사가 필요해요."}
  ],
  log(){ return LS.get("fdr_notify", []); },
  send(event, o, extra = {}){
    const L = this.log();
    const masked = "010-****-" + String(o.customer?.phone || "").slice(-4);
    for (const c of this.channels){
      if (c.id === "owner_push" && event !== "order_created") continue;
      L.unshift({at: Date.now(), event, no: o.no, to: c.id === "owner_push" ? "사장님" : masked, channel: c.name,
        result: c.state === "test" ? "테스트 모드 (보내지 않음)" : "연동 대기 (보내지 않음)", ...extra});
    }
    LS.set("fdr_notify", L.slice(0, 100));
  }
};

/* ---------------- 비회원 주문 조회 (주문번호 + 휴대폰 인증) ----------------
   실서비스 설계: 서버가 (번호, 연락처) 확인 → 6자리 코드 문자 발송 (3분 유효, 5회 실패 시 잠금)
   → 코드 확인 후 짧은 조회 토큰 발급 → 토큰으로 공개 정보만 조회. 데모는 화면에 코드를 보여 줘요. */
let OTP = null;
FD.otpStart = (no, phone) => {
  no = String(no).trim(); const p = normPhone(phone);
  if (!/^\d{4}$/.test(no) || p.length < 10) return {ok: false, msg: "주문번호 4자리와 휴대폰 번호를 확인해 주세요."};
  const o = FD.store.get(no);
  const code = String(Math.floor(100000 + Math.random() * 900000));
  OTP = {no, match: !!(o && o.customer.phone === p), code, exp: Date.now() + 180e3, tries: 0};
  if (OTP.match) FD.notify.send("otp", o, {result: "연동 대기 (보내지 않음) · 코드는 기록하지 않음"});
  // 번호가 틀려도 같은 안내 → 다른 사람 주문이 있는지 알 수 없게
  return {ok: true, msg: "입력하신 번호로 인증번호를 보냈어요. (3분 안에 입력)", demoCode: OTP.match ? code : null};
};
FD.otpVerify = code => {
  if (!OTP) return {ok: false, msg: "인증번호를 먼저 받아 주세요."};
  if (Date.now() > OTP.exp){ OTP = null; return {ok: false, msg: "시간이 지났어요. 인증번호를 다시 받아 주세요."}; }
  if (++OTP.tries > 5){ OTP = null; return {ok: false, msg: "5번 틀려서 잠겼어요. 잠시 뒤 다시 시도해 주세요."}; }
  if (!OTP.match || String(code).trim() !== OTP.code) return {ok: false, msg: `인증번호가 맞지 않아요. (${OTP.tries}/5)`};
  const o = FD.store.get(OTP.no); OTP = null;
  return {ok: true, order: FD.publicView(o)};
};
// 고객에게 보여도 되는 정보만 (내부 메모·연락처·관리자 기록 제외)
FD.publicView = o => ({no: o.no, service: FD.svc(o.service)?.name || o.service, title: o.title, status: o.status, total: o.quote?.total,
  quoteKind: o.quote?.kind, updatedAt: o.updatedAt, createdAt: o.createdAt});
FD.storeLink = () => FD.settings.smartstoreUrl
  ? `<a class="fd-btn store" href="${esc(FD.settings.smartstoreUrl)}" target="_blank" rel="noopener">스마트스토어에서 결제하기</a>`
  : `<div class="fd-unset">스마트스토어 결제 링크가 아직 설정되지 않았어요 <small>(관리자 › 설정에서 상품 링크 등록 — 데모)</small></div>`;
FD.kakao = (label = "카카오톡 오픈채팅 문의") => `<a class="fd-btn kakao" href="${esc(FD.settings.kakaoUrl)}" target="_blank" rel="noopener">${FD.icon("chat")}<span>${label}</span></a>`;

/* 주문 상태 카드 (조회 결과·대시보드 공용) */
FD.statusHTML = v => {
  const steps = FD.STEPS_PUBLIC.filter(s => s !== "review" || v.quoteKind === "review" || v.status === "review");
  const idx = steps.indexOf(v.status);
  return `<div class="fd-status">
    <div class="fd-st-head"><span class="fd-st-no">#${esc(v.no)}</span><span class="fd-badge">${esc(v.service)}</span></div>
    <div class="fd-st-title">${esc(v.title || "")}</div>
    ${v.status === "canceled" ? `<p class="fd-st-desc">${FD.stDesc("canceled")}</p>` : `<ol class="fd-steps">${steps.map((s, i) => `<li class="${i < idx ? "past" : i === idx ? "now" : ""}"><i></i><span>${FD.stLabel(s)}</span></li>`).join("")}</ol>
    <p class="fd-st-desc">${FD.stDesc(v.status)}</p>`}
    ${v.status === "pay_wait" ? FD.storeLink() : ""}
    <div class="fd-st-meta">${v.total ? `${v.quoteKind === "review" ? "참고 금액" : "금액"} ${won(v.total)} · ` : ""}최근 변경 ${new Date(v.updatedAt).toLocaleString("ko-KR", {month: "long", day: "numeric", hour: "2-digit", minute: "2-digit"})}</div></div>`;
};
// 조회 위젯 (번호+연락처 → 인증번호 → 결과)
FD.mountLookup = (el, opt = {}) => {
  el.innerHTML = `<form class="fd-lk" novalidate>
      <div class="fd-field"><label class="fd-label" for="lkNo">주문번호</label><input class="fd-in" id="lkNo" inputmode="numeric" maxlength="4" placeholder="4자리" autocomplete="off"></div>
      <div class="fd-field"><label class="fd-label" for="lkPh">휴대폰 번호</label><input class="fd-in" id="lkPh" type="tel" inputmode="tel" autocomplete="tel" placeholder="010-1234-5678"></div>
      <button class="fd-btn primary" type="submit">인증번호 받기</button>
      <div class="fd-err" role="alert" hidden></div></form>
    <form class="fd-otp" hidden novalidate>
      <p class="fd-otp-msg"></p>
      <div class="fd-demo-code" hidden></div>
      <div class="fd-field"><label class="fd-label" for="lkCode">인증번호 6자리</label><input class="fd-in" id="lkCode" inputmode="numeric" maxlength="6" autocomplete="one-time-code" placeholder="000000"></div>
      <button class="fd-btn primary" type="submit">확인</button>
      <button class="fd-btn ghost" type="button" data-act="again">번호 다시 입력</button>
      <div class="fd-err" role="alert" hidden></div></form>
    <div class="fd-lk-result"></div>`;
  const f1 = $(".fd-lk", el), f2 = $(".fd-otp", el), res = $(".fd-lk-result", el);
  const err = (f, m) => { const e = $(".fd-err", f); e.textContent = m; e.hidden = !m; };
  $("#lkNo", el).addEventListener("input", e => e.target.value = e.target.value.replace(/\D/g, "").slice(0, 4));
  if (opt.no) $("#lkNo", el).value = opt.no;
  f1.onsubmit = e => { e.preventDefault(); const r = FD.otpStart($("#lkNo", el).value, $("#lkPh", el).value); err(f1, r.ok ? "" : r.msg); if (!r.ok) return;
    f1.hidden = true; f2.hidden = false; $(".fd-otp-msg", el).textContent = r.msg;
    const dc = $(".fd-demo-code", el); dc.hidden = !r.demoCode; dc.innerHTML = r.demoCode ? `<b>데모</b> 실제로는 문자로 와요 · 인증번호 <code>${r.demoCode}</code>` : "";
    $("#lkCode", el).focus(); };
  f2.onsubmit = e => { e.preventDefault(); const r = FD.otpVerify($("#lkCode", el).value); err(f2, r.ok ? "" : r.msg); if (!r.ok) return;
    f2.hidden = true; res.innerHTML = FD.statusHTML(r.order) + `<button class="fd-btn ghost" type="button" data-act="restart">다른 주문 조회</button>`; opt.onResult && opt.onResult(r.order); };
  el.addEventListener("click", e => { const a = e.target.closest("[data-act]"); if (!a) return;
    if (a.dataset.act === "again" || a.dataset.act === "restart"){ f2.hidden = true; f1.hidden = false; res.innerHTML = ""; err(f2, ""); $("#lkCode", el).value = ""; } });
};

/* 접수 완료 카드 */
FD.doneHTML = o => {
  const review = o.status === "review";
  return `<div class="fd-done">
    <div class="fd-done-ic">${FD.icon("check")}</div>
    <h2>${review ? "접수됐어요. 확인 후 확정 금액을 알려 드릴게요." : "주문이 접수됐어요"}</h2>
    <div class="fd-done-no"><small>주문번호</small><b>${o.no}</b></div>
    <p>이 번호와 휴대폰 번호로 언제든 진행 상황을 조회할 수 있어요.</p>
    <ol class="fd-next">${review
      ? `<li>담당자가 자료를 확인해요 <small>(보통 하루 안)</small></li><li>확정 금액을 문자와 조회 화면으로 알려 드려요 <small>(문자는 연동 후)</small></li><li>스마트스토어에서 결제하면 제작을 시작해요</li>`
      : `<li>스마트스토어에서 결제해 주세요 — 옵션에 주문번호 <b>${o.no}</b></li><li>결제가 확인되면 제작을 시작해요</li><li>완료되면 발송하고 알려 드려요</li>`}</ol>
    ${review ? "" : FD.storeLink()}
    <div class="fd-done-sum">${esc(o.title || "")} · ${o.quote.total != null ? (review ? "참고 " : "") + won(o.quote.total) : "확인 후 안내"}</div></div>`;
};

/* ---------------- 포트폴리오 (샘플 일러스트 — 실제 고객 사례 아님) ---------------- */
const pfSvg = (c1, c2, art) => "data:image/svg+xml;charset=utf-8," + encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'><defs><linearGradient id='g' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='${c1}'/><stop offset='1' stop-color='${c2}'/></linearGradient></defs><rect width='400' height='300' fill='url(#g)'/><ellipse cx='200' cy='252' rx='130' ry='14' fill='#000' opacity='.14'/>${art}</svg>`);
FD.PORTFOLIO = [
  {t: "수건걸이 겸 수세미 거치대", d: "욕실 타일 벽 맞춤 · PETG HF", svc: "idea", img: pfSvg("#1c2a3a", "#12202e", "<rect x='90' y='90' width='220' height='22' rx='11' fill='#3b8cff'/><rect x='110' y='112' width='14' height='60' fill='#2a6fe0'/><rect x='276' y='112' width='14' height='60' fill='#2a6fe0'/><path d='M140 170h120l-12 70h-96z' fill='#6aa8ff'/>")},
  {t: "핑거보드 레일 · 계단", d: "취미용 트랙 세트 · PLA Basic", svc: "sketch", img: pfSvg("#2a2418", "#1d1912", "<path d='M60 240h60v-30h60v-30h60v-30h60v90z' fill='#f0a640'/><rect x='60' y='120' width='280' height='10' rx='5' fill='#c9a76b'/>")},
  {t: "선반 받침 브래킷", d: "손스케치로 설계 · PLA-CF", svc: "sketch", img: pfSvg("#231e33", "#191526", "<path d='M120 70h40v130h130v40H120z' fill='#8b6cf0'/><path d='M160 200l90-90v40l-50 50z' fill='#a68cff'/>")},
  {t: "케이블 정리 클립", d: "책상 모서리 끼움형 · PETG HF", svc: "pro", img: pfSvg("#17281f", "#112018", "<path d='M110 100h180v40h-30v-12H140v80h120v-12h30v40H110z' fill='#34c778'/><circle cx='175' cy='168' r='16' fill='#5fe09a'/><circle cx='225' cy='168' r='16' fill='#5fe09a'/>")},
  {t: "센서 하우징 2파트", d: "끼움 공차 ±0.1mm · ASA", svc: "pro", img: pfSvg("#1d2430", "#141a24", "<rect x='110' y='110' width='180' height='110' rx='14' fill='#5b8cff'/><rect x='130' y='90' width='140' height='30' rx='8' fill='#8fb0ff'/><circle cx='200' cy='165' r='22' fill='#1d2430'/>")},
  {t: "피규어 받침대", d: "이름 각인 · PLA Silk+", svc: "modify", img: pfSvg("#262626", "#1a1a1a", "<ellipse cx='200' cy='205' rx='110' ry='26' fill='#6b7280'/><rect x='90' y='180' width='220' height='25' fill='#9ca3af'/><ellipse cx='200' cy='180' rx='110' ry='26' fill='#d1d5db'/><circle cx='200' cy='120' r='34' fill='#f0a640'/>")}
];
FD.SAMPLE_TAG = "샘플 이미지";

/* ---------------- 관리자 (데모) ----------------
   실서비스: Firebase Auth(서버 검증) + 보안규칙. 이 데모는 브라우저 안 가짜 로그인이며 실제 데이터에 접근하지 않아요. */
FD.mountAdmin = (el, opt = {}) => {
  let authed = sessionStorage.getItem("fdr_admin") === "1", tab = "orders", filter = "all", q = "", sel = null;
  const render = () => {
    if (!authed){
      el.innerHTML = `<div class="fd-adm-login"><h2>관리자 로그인</h2><p class="fd-help">데모: 아무 4자리 숫자나 넣으면 들어가요. 실제 사이트는 Firebase 인증 서버가 비밀번호를 확인해요. 코드에 비밀번호를 넣지 않아요.</p>
        <form><input class="fd-in" type="password" inputmode="numeric" maxlength="4" placeholder="PIN 4자리" aria-label="관리자 PIN"><button class="fd-btn primary">들어가기</button><div class="fd-err" hidden></div></form></div>`;
      $("form", el).onsubmit = e => { e.preventDefault(); const v = $("input", el).value; if (!/^\d{4}$/.test(v)){ const er = $(".fd-err", el); er.hidden = false; er.textContent = "4자리 숫자를 넣어 주세요."; return; }
        authed = true; sessionStorage.setItem("fdr_admin", "1"); render(); };
      return;
    }
    const all = FD.store.all();
    const cnt = k => all.filter(o => o.status === k).length;
    el.innerHTML = `<div class="fd-adm">
      <div class="fd-adm-top"><b>관리자</b><span class="fd-badge warn">데모 데이터</span><nav class="fd-adm-tabs" role="tablist">${[["orders","주문"],["review","견적 검토"],["settings","가격·설정"],["notify","알림 기록"],["portfolio","포트폴리오"]].map(([k, t]) =>
        `<button role="tab" aria-selected="${tab === k}" class="${tab === k ? "on" : ""}" data-tab="${k}">${t}${k === "review" && cnt("review") ? ` <i>${cnt("review")}</i>` : ""}</button>`).join("")}</nav>
        <button class="fd-btn ghost sm" data-act="logout">로그아웃</button></div>
      <div class="fd-adm-body">${tab === "orders" || tab === "review" ? ordersView(all) : tab === "settings" ? settingsView() : tab === "notify" ? notifyView() : pfView()}</div></div>`;
  };
  const ordersView = all => {
    const kpi = [["새 주문", all.filter(o => o.status === "received" || o.status === "pay_wait").length], ["검토 필요", all.filter(o => o.status === "review").length],
      ["제작 중", all.filter(o => o.status === "making").length], ["이번 달 접수", all.filter(o => new Date(o.createdAt).getMonth() === new Date().getMonth()).length]];
    let list = tab === "review" ? all.filter(o => o.status === "review") : all.filter(o => filter === "all" || o.status === filter);
    if (q) list = list.filter(o => [o.no, o.title, o.customer.name, o.customer.phone].join(" ").toLowerCase().includes(q.toLowerCase()));
    const o = sel && FD.store.get(sel);
    return `<div class="fd-kpis">${kpi.map(([t, n]) => `<div class="fd-kpi"><small>${t}</small><b>${n}</b></div>`).join("")}</div>
      ${tab === "orders" ? `<div class="fd-adm-tools"><input class="fd-in" type="search" placeholder="번호·이름·연락처·내용 검색" value="${esc(q)}" data-act="q">
        <div class="fd-seg">${[["all","전체"],...FD.STATUS.map(s => [s[0], s[1]])].map(([k, t]) => `<button class="${filter === k ? "on" : ""}" data-filter="${k}">${t}</button>`).join("")}</div></div>` : `<p class="fd-help">자동 견적이 어려워 넘어온 주문이에요. 확정 금액을 넣으면 '결제 안내'로 바뀌고 고객에게 알림이 가요(연동 후).</p>`}
      <div class="fd-adm-split"><div class="fd-olist">${list.length ? list.map(x => `<button class="fd-orow${x.no === sel ? " on" : ""}" data-no="${x.no}">
          <span class="fd-orow-no">#${x.no}</span><span class="fd-orow-t">${esc(x.title)}<small>${esc(FD.svc(x.service)?.name || "")} · ${esc(x.customer.name)} · ${new Date(x.createdAt).toLocaleDateString("ko-KR")}</small></span>
          <span class="fd-st ${x.status}">${FD.stLabel(x.status)}</span></button>`).join("") : `<div class="fd-empty">해당하는 주문이 없어요.</div>`}</div>
        <div class="fd-odetail">${o ? detail(o) : `<div class="fd-empty">왼쪽에서 주문을 고르세요.</div>`}</div></div>`;
  };
  const detail = o => `<div class="fd-od-head"><b>#${o.no}</b> <span class="fd-st ${o.status}">${FD.stLabel(o.status)}</span>${o.demo ? ' <span class="fd-badge">샘플</span>' : ""}</div>
    <dl class="fd-od">${[["서비스", FD.svc(o.service)?.name], ["내용", o.title], ["고객", o.customer.name], ["연락처", o.customer.phone.replace(/(\d{3})(\d{3,4})(\d{4})/, "$1-$2-$3")],
      ["견적", o.quote?.total != null ? won(o.quote.total) + (o.quote.kind === "review" ? " (참고)" : " (자동)") : "미정"], ["검토 사유", (o.quote?.reasons || []).join(" / ") || "—"],
      ["고객 요청", o.memoCustomer || "—"], ["학생 할인", o.student ? "적용 (영상 확인)" : "—"]].map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v ?? "—")}</dd></div>`).join("")}</dl>
    ${o.status === "review" ? `<div class="fd-od-box"><label class="fd-label" for="qPrice">확정 금액 (원)</label><div class="fd-row"><input class="fd-in" id="qPrice" type="number" inputmode="numeric" value="${Math.round(o.quote?.total || 0)}"><button class="fd-btn primary" data-act="confirm" data-no="${o.no}">견적 확정</button></div></div>` : ""}
    <div class="fd-od-box"><label class="fd-label" for="stSel">상태 변경</label><div class="fd-row"><select class="fd-in" id="stSel">${FD.STATUS.map(s => `<option value="${s[0]}"${s[0] === o.status ? " selected" : ""}>${s[1]}</option>`).join("")}</select><button class="fd-btn" data-act="status" data-no="${o.no}">저장</button></div>
      <p class="fd-help">'결제 확인'은 스마트스토어에서 결제를 직접 확인한 뒤에 바꿔 주세요. 사이트가 결제를 자동으로 알 수는 없어요.</p></div>
    <div class="fd-od-box"><label class="fd-label" for="memo">내부 메모 <small>(고객에게 안 보여요)</small></label><textarea class="fd-in" id="memo" rows="2">${esc(o.memo || "")}</textarea><button class="fd-btn sm" data-act="memo" data-no="${o.no}">메모 저장</button></div>
    <details class="fd-od-log"><summary>변경 기록 ${o.log.length}건</summary>${o.log.map(l => `<div>${new Date(l.at).toLocaleString("ko-KR")} · ${esc(l.who)} · ${esc(l.act)}</div>`).join("")}</details>
    <button class="fd-btn ghost sm danger" data-act="del" data-no="${o.no}">주문 삭제</button>`;
  const settingsView = () => { const S = FD.settings;
    const num = (path, label, v, unit = "원") => `<label class="fd-set"><span>${label}</span><input class="fd-in" type="number" step="any" data-path="${path}" value="${v}"><em>${unit}</em></label>`;
    return `<p class="fd-help">여기서 바꾼 값은 이 브라우저의 시안에만 적용돼요(데모). 실제 사이트는 기존 관리자 '가격 설정' 화면과 같은 저장소를 쓰게 돼요.</p>
      <h3>필라멘트 1kg 가격</h3><div class="fd-sets">${Object.entries(S.filament).map(([k, v]) => num("filament." + k, k, v)).join("")}</div>
      <h3>출력비 계산</h3><div class="fd-sets">${num("perMin", "분당 기계비", S.perMin)}${num("base", "기본비", S.base)}${num("margin", "마진 배율", S.margin, "배")}</div>
      <h3>디자인비</h3><div class="fd-sets">${num("design.sketch", "손그림 기본", S.design.sketch)}${num("design.idea", "아이디어 기본", S.design.idea)}${num("design.modify", "모델 수정 기본 [제안]", S.design.modify)}${num("design.pro", "전문 모델링 기본 [제안]", S.design.pro)}
        ${num("baseMin", "기본 포함 시간", S.baseMin, "분")}${num("stepMin", "추가 단위", S.stepMin, "분")}${num("stepFee", "단위당 추가", S.stepFee)}${num("studentRate", "학생 할인율", S.studentRate, "(0.15=15%)")}</div>
      <h3>관리자 검토로 넘기는 기준 [제안]</h3><div class="fd-sets">${num("printerMax", "프린터 출력 범위", S.printerMax, "mm")}${num("maxSize", "접수 최대 크기", S.maxSize, "mm")}${num("review.maxQty", "수량 초과", S.review.maxQty, "개")}${num("review.maxGram", "무게 초과", S.review.maxGram, "g")}${num("review.maxDesignMin", "디자인 시간 초과", S.review.maxDesignMin, "분")}${num("review.minDescLen", "설명 최소 글자", S.review.minDescLen, "자")}</div>
      <h3>연결</h3><label class="fd-set wide"><span>스마트스토어 결제 링크</span><input class="fd-in" type="url" data-path="smartstoreUrl" placeholder="https://smartstore.naver.com/상점/products/번호" value="${esc(S.smartstoreUrl)}"></label>
      <div class="fd-row" style="margin-top:14px"><button class="fd-btn primary" data-act="saveSet">저장</button><button class="fd-btn ghost" data-act="resetSet">기본값</button></div>`; };
  const notifyView = () => `<div class="fd-chan">${FD.notify.channels.map(c => `<div class="fd-chan-i"><b>${esc(c.name)}</b><span class="fd-badge ${c.state === "test" ? "" : "warn"}">${c.state === "test" ? "테스트 모드" : "연동 필요"}</span><small>${esc(c.note)}</small></div>`).join("")}</div>
    <h3>발송 기록</h3>${FD.notify.log().length ? `<div class="fd-nlog">${FD.notify.log().map(l => `<div><span>${new Date(l.at).toLocaleString("ko-KR")}</span><b>#${l.no}</b><span>${esc(l.event)}</span><span>${esc(l.channel)} → ${esc(l.to)}</span><em>${esc(l.result)}</em></div>`).join("")}</div>` : `<div class="fd-empty">아직 기록이 없어요.</div>`}`;
  const pfView = () => `<p class="fd-help">기존 관리자의 포트폴리오 관리(사진·제목·설명 등록, 순서)는 그대로 유지해요. 아래는 표시 예시예요.</p>
    <div class="fd-pfadm">${FD.PORTFOLIO.map(p => `<div><img src="${p.img}" alt=""><b>${esc(p.t)}</b><small>${esc(p.d)} · ${FD.SAMPLE_TAG}</small></div>`).join("")}</div>`;
  el.addEventListener("click", e => {
    const t = e.target.closest("[data-tab]"); if (t){ tab = t.dataset.tab; sel = null; render(); return; }
    const f = e.target.closest("[data-filter]"); if (f){ filter = f.dataset.filter; render(); return; }
    const r = e.target.closest(".fd-orow"); if (r){ sel = r.dataset.no; render(); return; }
    const a = e.target.closest("[data-act]"); if (!a) return;
    const no = a.dataset.no, act = a.dataset.act;
    if (act === "logout"){ authed = false; sessionStorage.removeItem("fdr_admin"); render(); }
    else if (act === "status"){ const v = $("#stSel", el).value; FD.store.update(no, {status: v}, "관리자", `상태 → ${FD.stLabel(v)}`); FD.notify.send("status_" + v, FD.store.get(no)); render(); }
    else if (act === "confirm"){ const p = +$("#qPrice", el).value; if (!(p > 0)) return; const o = FD.store.get(no);
      FD.store.update(no, {status: "pay_wait", quote: {...o.quote, kind: "confirmed", total: p}}, "관리자", `견적 확정 ${won(p)}`); FD.notify.send("quote_confirmed", FD.store.get(no)); render(); }
    else if (act === "memo"){ FD.store.update(no, {memo: $("#memo", el).value}, "관리자", "내부 메모 수정"); render(); }
    else if (act === "del"){ if (confirm(`#${no} 주문을 지울까요? (데모 데이터)`)){ FD.store.remove(no); sel = null; render(); } }
    else if (act === "saveSet"){ const S = structuredClone(FD.settings);
      $$("[data-path]", el).forEach(i => { const ks = i.dataset.path.split("."), last = ks.pop(); let o = S; for (const k of ks) o = o[k]; o[last] = i.type === "number" ? +i.value : i.value.trim(); });
      if (S.smartstoreUrl && !/^https:\/\/(smartstore|brand)\.naver\.com\//.test(S.smartstoreUrl)){ alert("스마트스토어 주소(https://smartstore.naver.com/…)만 넣을 수 있어요."); return; }
      FD.saveSettings(S); opt.onSettings && opt.onSettings(); FD.toast("저장했어요"); render(); }
    else if (act === "resetSet"){ FD.saveSettings(structuredClone(DEF)); localStorage.removeItem("fdr_settings"); opt.onSettings && opt.onSettings(); render(); }
  });
  el.addEventListener("input", e => { if (e.target.dataset.act === "q"){ q = e.target.value; const pos = e.target.selectionStart; render(); const i = $('[data-act="q"]', el); i.focus(); i.setSelectionRange(pos, pos); } });
  render();
};

/* ---------------- 학생 할인 (5초 이상 영상 확인 — 운영 기능) ---------------- */
FD.videoSeconds = file => new Promise(res => {
  const v = document.createElement("video"), url = URL.createObjectURL(file); let done = false;
  const fin = x => { if (done) return; done = true; URL.revokeObjectURL(url); res(x); };
  v.preload = "metadata"; v.muted = true; v.onloadedmetadata = () => fin(isFinite(v.duration) ? v.duration : null); v.onerror = () => fin(null); setTimeout(() => fin(null), 6000); v.src = url;
});
FD.studentHTML = p => `<div class="fd-stu"><label class="fd-switch"><input type="checkbox" id="${p}-stu"><span></span><b>학생이에요 · ${Math.round(FD.settings.studentRate * 100)}% 할인</b></label>
  <div class="fd-stu-body" hidden><p class="fd-help">학생증이 보이게 ${FD.settings.studentMinSec}초 이상 찍은 영상을 올려 주세요. 판매자만 봐요.</p>
  <label class="fd-drop sm" for="${p}-stuv">${FD.icon("upload")}<span><b>영상 올리기</b></span></label><input type="file" id="${p}-stuv" accept="video/*" hidden><div class="fd-stu-st" role="status"></div></div></div>`;
FD.bindStudent = (p, onChange) => {
  const cb = document.getElementById(p + "-stu"), body = cb.closest(".fd-stu").querySelector(".fd-stu-body"), st = body.querySelector(".fd-stu-st"), inp = document.getElementById(p + "-stuv");
  const S = {on: false, ok: false};
  cb.onchange = () => { S.on = cb.checked; body.hidden = !S.on; onChange(S.on && S.ok); };
  inp.onchange = async () => { const f = inp.files[0]; inp.value = ""; if (!f) return; st.textContent = "영상 길이 확인 중…";
    const sec = await FD.videoSeconds(f); S.ok = sec == null || sec >= FD.settings.studentMinSec;
    st.textContent = S.ok ? `확인됐어요${sec ? ` (${sec.toFixed(1)}초)` : ""} · 할인 적용` : `${sec.toFixed(1)}초예요. ${FD.settings.studentMinSec}초 이상 영상을 올려 주세요.`; st.className = "fd-stu-st " + (S.ok ? "ok" : "bad"); onChange(S.on && S.ok); };
  return S;
};
FD.consentHTML = p => `<label class="fd-consent"><input type="checkbox" id="${p}-consent"><span><b>[필수]</b> 개인정보 수집·이용 동의 <small>이름·휴대폰 번호·첨부 파일 / 주문 처리·안내 목적 / 주문 완료 후 1년 보관</small></span></label><div class="fd-err" id="${p}-consent-err" hidden>동의해야 주문할 수 있어요.</div>`;
FD.checkConsent = p => { const ok = document.getElementById(p + "-consent").checked; document.getElementById(p + "-consent-err").hidden = ok; return ok; };


/* ---------------- 출력 옵션 패널 (재료 카드·색상·용도·빠른 설정·상세 설정) ----------------
   variant: "cards"(기본) | "compact" | "table"   expert: 상세 설정을 처음부터 펼침            */
FD.mountPrintOptions = (el, st, onChange, cfg = {}) => {
  const o = st.opts, v = cfg.variant || "cards";
  const seg = (k) => `<div class="fd-field"><div class="fd-label">${{strength:"튼튼함",quality:"품질",support:"서포트"}[k]}</div>
    <div class="fd-seg q" data-q="${k}">${Object.entries(FD.QUICK_LABEL[k]).map(([x, t]) => `<button type="button" class="${o[k] === x ? "on" : ""}" data-v="${x}">${t}</button>`).join("")}</div></div>`;
  const advRow = it => { const val = (o.adv || engineFor(o))[it.id];
    return `<label class="fd-adv-row"><span>${esc(it.label)}${it.unit ? ` <small>(${esc(it.unit)})</small>` : ""}</span>${it.type === "select"
      ? `<select class="fd-in" data-adv="${it.id}">${it.list.map(([k, t]) => `<option value="${k}"${String(k) === String(val) ? " selected" : ""}>${esc(t)}</option>`).join("")}</select>`
      : `<input class="fd-in" type="number" data-adv="${it.id}" min="${it.min}" max="${it.max}" step="${it.step}" value="${esc(val)}">`}</label>`; };
  const draw = () => {
    const adv = advOpen;
    el.innerHTML = `<div class="fd-popts ${v}">
      <div class="fd-field"><div class="fd-label">재료</div><div class="fd-mats" role="radiogroup">${FD.MATS.map(m => `<button type="button" role="radio" aria-checked="${o.mat === m.v}" class="fd-mat${o.mat === m.v ? " on" : ""}" data-mat="${m.v}"><b>${esc(m.name)}</b><small>${esc(FD.MAT_SHORT[m.v] || "")}</small></button>`).join("")}</div>
        ${cfg.beginner !== false ? '<div class="fd-help" style="margin-top:6px">잘 모르겠으면 PLA Basic이 가장 무난해요.</div>' : ""}</div>
      <div class="fd-field"><div class="fd-label">색상 <span class="fd-cname">${esc((FD.COLORS.find(c => c.v === o.color) || {}).name || "")}</span></div><div class="fd-dots" role="radiogroup">${FD.COLORS.map(c => `<button type="button" role="radio" aria-checked="${o.color === c.v}" aria-label="${esc(c.name)}" title="${esc(c.name)}" class="fd-dot${o.color === c.v ? " on" : ""}${c.v === "투명" ? " clear" : c.v === "기타" ? " other" : ""}" data-color="${c.v}" style="--c:${FD.COLOR_HEX[c.v]}"></button>`).join("")}</div></div>
      <div class="fd-field"><div class="fd-label">사용 용도</div><div class="fd-chips">${FD.PURPOSES.map(([k, t]) => `<button type="button" class="fd-opt${o.purpose === k ? " on" : ""}" data-purpose="${k}"><b>${t}</b></button>`).join("")}</div>
        <div class="fd-help fd-padv" ${st.advice ? "" : "hidden"} style="margin-top:6px">${esc(st.advice || "")}</div></div>
      ${o.adv ? `<div class="fd-help">상세 설정으로 계산 중이에요. <button type="button" class="fd-link" data-act="quick">빠른 설정으로 돌아가기</button></div>` : ["strength","quality","support"].map(seg).join("")}
      <div class="fd-field"><div class="fd-label">수량</div><div class="fd-qty"><button type="button" data-qty="-1" aria-label="빼기">−</button><input class="fd-in" type="number" min="1" max="999" value="${o.qty}" aria-label="수량" data-act="qty"><button type="button" data-qty="1" aria-label="더하기">+</button></div></div>
      <details class="fd-adv"${adv ? " open" : ""}><summary>상세 설정 <small>숙련자용 · 레이어·벽·인필·서포트 등 ${FD.OPTS.flatMap(s => s.items).length - 2}개 항목</small></summary>
        ${FD.OPTS.slice(1).map(sec => `<div class="fd-adv-sec"><b>${sec.icon} ${esc(sec.sec)}</b>${sec.items.map(advRow).join("")}</div>`).join("")}</details></div>`;
  };
  let advOpen = !!cfg.expert;
  const changed = () => { onChange && onChange(); };
  el.addEventListener("click", e => {
    const b = e.target.closest("button"); if (!b) return;
    if (b.dataset.mat){ o.mat = b.dataset.mat; if (o.adv) o.adv.mat = o.mat; }
    else if (b.dataset.color){ o.color = b.dataset.color; if (o.adv) o.adv.color = o.color; }
    else if (b.dataset.purpose){ o.purpose = b.dataset.purpose; const a = FD.purposeAdvice(o.purpose); st.advice = a ? a.msg : ""; if (a && a.strength && !o.adv) o.strength = a.strength; }
    else if (b.parentElement.dataset.q){ o[b.parentElement.dataset.q] = b.dataset.v; }
    else if (b.dataset.qty){ o.qty = Math.min(999, Math.max(1, (+o.qty || 1) + +b.dataset.qty)); }
    else if (b.dataset.act === "quick"){ o.adv = null; }
    else return;
    draw(); changed();
  });
  el.addEventListener("toggle", e => { if (e.target.classList.contains("fd-adv")) advOpen = e.target.open; }, true);
  el.addEventListener("change", e => {
    const t = e.target;
    // 입력칸이 바뀐 직후 다시 그리면 포커스 이동 중에 노드가 사라지므로 한 박자 뒤에 그림
    if (t.dataset.adv){ const first = !o.adv; o.adv = o.adv || engineFor(o); o.adv[t.dataset.adv] = t.value; if (first) setTimeout(draw); changed(); }
    else if (t.dataset.act === "qty"){ o.qty = Math.min(999, Math.max(1, parseInt(t.value) || 1)); t.value = o.qty; changed(); }
  });
  draw();
  return {redraw: draw};
};
FD.engineFor = engineFor;
// 주문 세션 (시안들이 같이 쓰는 상태)
FD.session = svc => ({svc, values: {}, model: null, opts: FD.defaultPrintOpts(), student: false, quote: null, advice: ""});
FD.calc = st => st.svc === "print" ? FD.quotePrint(st.model, st.opts, st.student) : FD.quoteDesign(st.svc, st.values, st.student);
FD.titleOf = st => st.svc === "print"
  ? `${st.model ? st.model.name : "파일 없음"} · ${(FD.MATS.find(m => m.v === st.opts.mat) || {}).name} ${st.opts.color} × ${st.opts.qty}`
  : (st.values.title || (st.values.desc || "").slice(0, 30) || FD.svc(st.svc).name);
FD.finish = (st, customer) => FD.submitOrder({service: st.svc, title: FD.titleOf(st), values: st.values, model: st.model, opts: st.svc === "print" ? st.opts : null,
  quote: {kind: st.quote.kind, total: st.quote.total ?? null, reasons: st.quote.reasons || [], lines: st.quote.lines || []}, customer, student: st.student});
// 파일 고르기 → 분석 → 미리보기 연결 (모든 시안 공통 동작)
FD.bindModelDrop = (drop, input, st, onDone, viewer) => {
  const go = async f => { if (!f) return; drop.classList.add("busy"); onDone && onDone("busy");
    st.model = await FD.analyzeFile(f); drop.classList.remove("busy");
    if (viewer){ viewer.setModel(st.model.geo || null); viewer.setColor(st.opts.color); }
    onDone && onDone(st.model.error ? "error" : "ok"); };
  drop.addEventListener("click", e => { if (e.target.closest("[data-sample]")) return; if (e.target.closest("canvas") && st.model?.geo) return; input.click(); });   // 미리보기 위 드래그(회전)는 파일 창을 열지 않음
  drop.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " "){ e.preventDefault(); input.click(); } });
  input.addEventListener("change", () => { const f = input.files[0]; input.value = ""; go(f); });
  ["dragenter","dragover"].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add("over"); }));
  ["dragleave","drop"].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.remove("over"); }));
  drop.addEventListener("drop", e => go(e.dataTransfer.files[0]));
  const s = drop.querySelector("[data-sample]"); if (s) s.addEventListener("click", e => { e.stopPropagation(); go(FD.sampleModel()); });
  return go;
};
FD.modelInfo = m => !m ? "" : m.error ? `<div class="fd-merr" role="alert"><b>${esc(m.name)}</b><span>${esc(m.error)}</span></div>`
  : `<div class="fd-minfo"><b>${esc(m.name)}</b>${m.dims ? `<span>${m.dims.map(x => x.toFixed(1)).join(" × ")} mm</span><span>부피 ${m.vol.toFixed(2)} cm³</span>` : ""}${m.sliced ? '<span class="fd-badge">슬라이싱 파일</span>' : ""}</div>`;

FD.toast = msg => { let t = $(".fd-toast"); if (!t){ t = document.createElement("div"); t.className = "fd-toast"; t.setAttribute("role", "status"); document.body.appendChild(t); }
  t.textContent = msg; t.classList.add("on"); clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove("on"), 2200); };
FD.copy = async txt => { try{ await navigator.clipboard.writeText(txt); FD.toast("복사했어요"); }catch(e){ prompt("아래 내용을 복사하세요", txt); } };
FD.quoteText = (svcId, title, q) => [`[FORMDOT 견적] ${FD.svc(svcId).name}`, title, ...(q.lines || []).map(l => `${l.label}: ${won(l.amount)}`), `합계: ${q.total != null ? won(q.total) : "확인 후 안내"}${q.kind === "review" ? " (참고)" : ""}`].join("\n");
FD.demoBanner = () => `<div class="fd-demo" role="note"><b>시안 · 데모 모드</b> 주문은 이 브라우저에만 저장돼요. 실제 주문·문자·결제는 일어나지 않아요. <a href="../index.html">← 시안 목록</a></div>`;
})();
