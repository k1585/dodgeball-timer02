/* =====================================================================
   운영 연결 (C 안내형 여정 → 실제 사이트)
   - 데모 저장소 대신 운영 Firebase(Realtime Database)에 주문을 저장해요.
   - 저장 형식은 기존 관리자 화면(classic/#admin)이 그대로 읽는 형식이에요.
   - 조회는 주문번호 + 연락처 + 조회 코드 6자리 (무료 방식 ①).
   ===================================================================== */
(function(){
const FIREBASE_CONFIG = /*@@FIREBASE_CONFIG@@*/;
const NTFY_TOPIC = "formdot-biv93la4rq75";
const SITE_URL = "https://k1585.github.io/";
const ADMIN_URL = "classic/#admin";
const MAX_FILE_MB = 50;
FD.DEMO = false; FD.LIVE = true;
const {esc, won} = FD;

// 사장님 폰 알림에서 열리는 주소(#admin)는 관리자 화면으로
if (location.hash === "#admin") location.replace(ADMIN_URL);
addEventListener("hashchange", () => { if (location.hash === "#admin") location.replace(ADMIN_URL); });

FD.demoBanner = () => "";
FD.mountAdmin = el => { el.innerHTML = `<p style="text-align:center;padding:40px 0">관리자 화면으로 이동해요…</p>`; location.href = ADMIN_URL; };

/* ---------- Firebase ---------- */
let _fb = null;
async function fb(){
  if (_fb) return _fb;
  const base = "https://www.gstatic.com/firebasejs/12.0.0/";
  const [A, D] = await Promise.all([import(base + "firebase-app.js"), import(base + "firebase-database.js")]);
  const app = A.initializeApp(FIREBASE_CONFIG);
  return _fb = {db: D.getDatabase(app), D};
}
const timeout = (p, ms) => Promise.race([p, new Promise((_, r) => setTimeout(() => r(new Error("timeout")), ms))]);

/* ---------- 관리자 가격 설정 · 포트폴리오 불러오기 ---------- */
FD.ready = (async () => {
  try{
    const {db, D} = await timeout(fb(), 6000);
    const v = (await timeout(D.get(D.ref(db, "site")), 6000)).val() || {};
    const st = v.settings, S = FD.settings, num = (x, d) => isFinite(+x) && x !== "" && x !== null && x !== undefined ? +x : d;
    if (st){
      for (const k in S.filament) S.filament[k] = num((st.filament || {})[k], S.filament[k]);
      const pr = st.print || {}; S.perMin = num(pr.perMin, S.perMin); S.base = num(pr.base, S.base); S.margin = num(pr.margin, S.margin);
      const ds = st.design || {}; S.design.sketch = num(ds.sketch, S.design.sketch); S.design.idea = num(ds.idea, S.design.idea);
      S.design.modify = num(ds.modify, S.design.modify); S.design.pro = num(ds.pro, S.design.pro);
      S.baseMin = num(ds.baseMin, S.baseMin); S.stepMin = Math.max(1, num(ds.stepMin, S.stepMin)); S.stepFee = num(ds.stepFee, S.stepFee);
      S.studentRate = Math.min(.9, Math.max(0, num(st.studentRate, S.studentRate)));
      const est = st.est || {};
      FD.COMPLEXITY.forEach(c => { if (c[3] != null) c[3] = num(est[c[0]], c[3]); });
      FD.FEATURES.forEach(f => { if (f[0] !== "etc") f[2] = num(est[f[0]], f[2]); });
      FD.MOD_SCOPE.forEach(m => { if (m[2] != null) m[2] = num(est[m[0]], m[2]); });
      FD.PART_MIN = num(est.part, 30);
    }
    const pf = Object.values(v.portfolio || {}).sort((a, b) => (a.order || 0) - (b.order || 0));
    if (pf.length) FD.PORTFOLIO = pf.map(p => ({t: p.title || "", d: p.desc || "", img: p.img, svc: "idea", real: true}));
  }catch(e){ console.warn("사이트 설정을 불러오지 못했어요 (기본값으로 계산)", e); }
})();

// 설정·포트폴리오를 불러오면 첫 화면을 다시 그림 (학생 할인율·사례 반영)
FD.ready.then(() => setTimeout(() => { if ((!location.hash || location.hash === "#/") && typeof window.rerender === "function") window.rerender(); }));

/* ---------- 운영용 화면 보강 ---------- */
const KAKAO = "https://open.kakao.com/o/s85siVVi";
const PREFILL = "fd_lk_prefill";
const ss = {get(){ try{ return JSON.parse(sessionStorage.getItem(PREFILL) || "null"); }catch(e){ return null; } }, set(v){ try{ sessionStorage.setItem(PREFILL, JSON.stringify(v)); }catch(e){} }};
FD.afterRoute = name => {
  // 손님 화면에는 관리자 메뉴 대신 카카오 문의 (관리자는 주소 뒤 #admin)
  const adm = document.querySelector('.top .r a[href="#/admin"]');
  if (adm){ adm.href = KAKAO; adm.target = "_blank"; adm.rel = "noopener"; adm.className = "kk"; adm.innerHTML = FD.icon("chat") + "문의"; }
  if (name === "" ){
    const mine = FD.store.mine().slice(0, 3), hello = document.querySelector(".hello");
    if (mine.length && hello) hello.insertAdjacentHTML("afterend", `<section class="mine" aria-label="이 기기에서 한 주문"><div class="mine-h"><b>이 기기에서 한 주문</b><small>주문 코드를 여기서 다시 볼 수 있어요</small></div>
      ${mine.map(o => `<div class="mine-i"><div><b>${esc(o.code || fullCode(o.no, o.lkCode))}</b> <span>${esc(o.title || "")}</span><small>${new Date(o.createdAt).toLocaleDateString("ko-KR", {month: "long", day: "numeric"})} · ${esc(o.totalText || "")}</small></div>
        <button class="fd-btn sm" data-lk="${esc(o.code || fullCode(o.no, o.lkCode))}">진행 상황</button></div>`).join("")}</section>`);
  }
  if (name === "done"){ const no = location.hash.split("/")[2], o = FD.store.get(no); if (o) ss.set({code: o.code || fullCode(o.no, o.lkCode)}); }
  if (name === "lookup"){ const v = ss.get(); const c = document.getElementById("lkCd"); if (v && c && !c.value){ c.value = v.code || ""; (document.getElementById("lkPh") || {}).focus?.(); } }
};
document.addEventListener("click", e => { const b = e.target.closest("[data-lk]"); if (!b) return; ss.set({code: b.dataset.lk}); location.hash = "#/lookup"; });
// 관리자 들어가기: 첫 화면 '내 주문 조회' 버튼을 3초 꾹 누르기 (주소 #admin 도 그대로 됨)
{
  let timer = null, fired = false, target = null;
  const isAdminKey = el => el && el.matches('a[href="#/lookup"]') && el.textContent.includes("내 주문 조회");
  document.addEventListener("pointerdown", e => {
    const el = e.target.closest("a"); if (!isAdminKey(el)) return;
    fired = false; target = el; clearTimeout(timer);
    timer = setTimeout(() => { fired = true; navigator.vibrate?.(30); location.href = ADMIN_URL; }, 3000);
  });
  ["pointerup", "pointercancel", "pointerleave"].forEach(ev => document.addEventListener(ev, () => clearTimeout(timer), true));
  document.addEventListener("click", e => { if (fired && e.target.closest("a") === target){ e.preventDefault(); fired = false; } }, true);
  document.addEventListener("contextmenu", e => { if (isAdminKey(e.target.closest("a"))) e.preventDefault(); });
}
// 휴대폰 번호 자동 하이픈 (010-1234-5678)
document.addEventListener("input", e => {
  const t = e.target; if (t.type !== "tel") return;
  const d = t.value.replace(/\D/g, "").slice(0, 11);
  const f = d.length < 4 ? d : d.length < 8 ? `${d.slice(0, 3)}-${d.slice(3)}` : d.length < 11 ? `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}` : `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
  if (f !== t.value) t.value = f;
});

/* ---------- 조회 코드 ---------- */
const LK_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ";     // 숫자 없이 영문만 → 앞 4자리 번호와 헷갈리지 않음
const makeCode = () => [...crypto.getRandomValues(new Uint8Array(3))].map(b => LK_CHARS[b % LK_CHARS.length]).join("");
const fullCode = (no, sfx) => sfx ? `${no}-${sfx}` : String(no);
// 손님이 넣은 코드 → [번호 4자리, 영문 부분]
const splitCode = s => { const t = String(s || "").toUpperCase().replace(/[^0-9A-Z]/g, ""); return [t.slice(0, 4), t.slice(4)]; };
FD.fullCode = fullCode;
const normContact = s => String(s || "").trim().toLowerCase().replace(/[\s\-().]/g, "");
const normCode = s => String(s || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
async function lookupKey(no, contact, code){     // 기존 사이트와 같은 계산
  const h = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`formdot|${no}|${normContact(contact)}|${normCode(code)}`));
  return [...new Uint8Array(h)].map(b => b.toString(16).padStart(2, "0")).join("");
}

/* ---------- 파일 전송 (기존 사이트와 같은 방식: 3MB 조각 · 모델은 gzip · 사진은 2000px JPEG) ---------- */
const toB64 = u8 => { let s = ""; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000)); return btoa(s); };
async function shrinkImage(file){
  if (!/^image\/(jpeg|png|webp|bmp|heic|heif)$/i.test(file.type)) return null;
  try{
    const bmp = await createImageBitmap(file), k = Math.min(1, 2000 / Math.max(bmp.width, bmp.height));
    const c = document.createElement("canvas"); c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
    const g = c.getContext("2d"); g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height); g.drawImage(bmp, 0, 0, c.width, c.height);
    const blob = await new Promise(r => c.toBlob(r, "image/jpeg", .85));
    return blob && blob.size < file.size ? {blob, name: file.name.replace(/\.[^.]+$/, "") + ".jpg", mime: "image/jpeg"} : null;
  }catch(e){ return null; }
}
async function submit(d, files, progress){
  const {db, D} = await fb();
  progress("번호 만드는 중…");
  let no = null;
  for (let i = 0; i < 40 && !no; i++){
    const cand = String(crypto.getRandomValues(new Uint16Array(1))[0] % 10000).padStart(4, "0");
    const r = await D.runTransaction(D.ref(db, "orderNos/" + cand), cur => cur === null ? true : undefined);
    if (r.committed) no = cand;
  }
  if (!no) throw new Error("no number");
  const CH = 3 * 1024 * 1024, attachments = []; let idx = 0;
  for (let fi = 0; fi < files.length; fi++){
    const {file, kind} = files[fi];
    progress(`파일 준비 중… (${fi + 1}/${files.length})`);
    let bytes, name = file.name, mime = file.type || "application/octet-stream", gz = false;
    const small = kind === "attach" ? await shrinkImage(file) : null;
    if (small){ bytes = new Uint8Array(await small.blob.arrayBuffer()); name = small.name; mime = small.mime; }
    else if (kind === "model" || (!/^image\//.test(mime) && !/^video\//.test(mime))){ bytes = new Uint8Array(await new Response(file.stream().pipeThrough(new CompressionStream("gzip"))).arrayBuffer()); gz = true; }
    else bytes = new Uint8Array(await file.arrayBuffer());
    const n = Math.max(1, Math.ceil(bytes.length / CH));
    for (let i = 0; i < n; i++){ progress(`파일 보내는 중… (${fi + 1}/${files.length}) ${Math.round(i / n * 100)}%`); await D.set(D.ref(db, `files/${no}/${idx + i}`), toB64(bytes.subarray(i * CH, (i + 1) * CH))); }
    attachments.push({name, mime, bytes: file.size, start: idx, count: n, gz, kind}); idx += n;
  }
  progress("정보 저장 중…");
  const lk = await lookupKey(no, d.contact, d.lkCode);
  await D.set(D.ref(db, "orders/" + no), {lk, lkCode: d.lkCode, mat: d.mat || "", qty: d.qty || 1, no, type: d.type, name: d.name, total: d.total, contact: d.contact, test: false,
    student: !!d.student, designFee: d.designFee || 0, printMin: d.printMin || 0, weightG: d.weightG || 0, consent: "개인정보 수집·이용 동의",
    sections: d.sections.map(([t, r]) => ({t, rows: r.map(([k, v]) => ({k, v: String(v)}))})), attachments, status: "new", createdAt: D.serverTimestamp()});
  try{ await D.set(D.ref(db, "lookup/" + lk), {status: "new", type: d.typeLabel, total: d.total, createdAt: D.serverTimestamp(), updatedAt: D.serverTimestamp()}); }
  catch(e){ console.warn("조회 정보 저장 실패 (보안규칙 lookup 게시 필요)", e); }
  return no;
}

/* ---------- 주문 내용 → 기존 관리자 형식 ---------- */
const TYPE = {print: "file", sketch: "sketch", idea: "idea", modify: "modify", pro: "pro"};
const optName = (f, v) => { const o = (f.options || []).find(x => x[0] === v); return o ? o[1] : v; };
const fieldText = (f, v) => {
  if (v == null || v === "" || (Array.isArray(v) && !v.length)) return "";
  if (f.type === "dims") return v.some(x => +x > 0) ? v.map(x => x || "?").join(" × ") + " mm" : "";
  if (f.type === "checks") return v.map(x => optName(f, x)).join(", ");
  if (f.type === "files") return v.map(x => x.name).join(", ");
  if (["radio","chips","select"].includes(f.type)) return optName(f, v);
  return String(v);
};
const withEtc = (f, v, etc) => { const t = fieldText(f, v); return etc && (Array.isArray(v) ? v.includes("etc") : v === "etc") ? `${t} (${etc})` : t; };
function toOrder(st, c){
  const q = st.quote, S = FD.settings, isP = st.svc === "print", stu = st.student, svc = FD.svc(st.svc);
  const rows = [], sec = [];
  if (isP){
    const m = st.model, o = st.opts, mat = FD.OPT_BY_ID.mat.list.find(x => x[0] === o.mat);
    sec.push(["파일 정보", [["파일명", m.name], ["무게", q.g ? q.g.toFixed(1) + "g" : "-"], ["크기", m.dims ? m.dims.map(x => x.toFixed(1)).join(" × ") + " mm" : "-"]]]);
    const set = [["사용 용도", (FD.PURPOSES.find(p => p[0] === o.purpose) || [, "-"])[1] + (o.purpose === "etc" && o.purposeEtc ? ` (${o.purposeEtc})` : "")], ["재료", mat ? mat[1] : o.mat],
      ["색상", o.color === "기타" ? `기타 (${o.colorEtc || "상담"})` : (FD.COLORS.find(x => x.v === o.color) || {}).name || o.color]];
    if (m.sliced) set.push(["출력 설정", "파일에 저장된 설정"]);
    else if (o.adv) set.push(["출력 설정", "상세 설정 (" + Object.entries(o.adv).filter(([k]) => !["mat","color"].includes(k)).map(([k, v]) => `${FD.OPT_BY_ID[k]?.label || k} ${v}`).join(", ") + ")"]);
    else set.push(["튼튼함", FD.QUICK_LABEL.strength[o.strength]], ["품질", FD.QUICK_LABEL.quality[o.quality]], ["서포트", FD.QUICK_LABEL.support[o.support]]);
    set.push(["수량", o.qty + "개"]);
    sec.push(["출력 설정", set]);
  } else {
    for (const step of FD.FLOWS[st.svc]) for (const f of step.fields){ const t = withEtc(f, st.values[f.id], st.values[f.id + "_etc"]); if (t) rows.push([f.label, t]); }
    sec.push(["의뢰 내용", rows]);
  }
  const qrows = [["견적 방식", q.kind === "review" ? "추가 확인 필요" : "자동 견적"]];
  if (q.kind === "review") qrows.push(["확인 사유", q.reasons.join(" / ")]);
  if (!isP && q.minutes != null) qrows.push(["예상 작업 시간", FD.fmtMin(q.minutes)], ["예상 디자인비 (추가 포함)", won(q.est || 0)], ["진행 방식", "의뢰 출력: 기본비 결제 → 디자인 → 추가비 결제 → 파일 전달 → 손님이 파일로 출력 주문"]);
  if (stu) qrows.push(["학생 할인", `${Math.round(S.studentRate * 100)}% (인증 영상 첨부)`]);
  sec.push(["견적", qrows]);
  sec.push(["주문자", [["이름", c.name], ["연락처", c.phone], ...(c.memo ? [["요청 사항", c.memo]] : []), ["개인정보 수집·이용", "동의함"]]]);
  const fee = q.total != null ? won(q.total) : "";
  const total = q.kind === "review" ? `확인 후 안내${fee ? ` (참고 ${fee})` : ""}`
    : isP ? fee + (stu ? " (학생가)" : "")
    : `디자인 기본비 ${fee}${stu ? " (학생가)" : ""} · 추가비 별도`;
  return {type: TYPE[st.svc], typeLabel: isP ? svc.name : "의뢰 출력 · " + svc.name, name: isP ? st.model.name : (st.values.title || (st.values.desc || "").slice(0, 30) || svc.name),
    total, contact: c.phone, lkCode: makeCode(), student: !!stu, designFee: isP ? 0 : Math.round(q.before || 0),
    printMin: isP ? Math.round(FD.lastPrintMin || 0) : 0, weightG: isP && q.g ? +q.g.toFixed(1) : 0, mat: isP ? st.opts.mat : "", qty: isP ? st.opts.qty : (+st.values.qty || 1), sections: sec};
}
// 출력 시간은 손님에게 안 보이지만 관리자 원가 계산에 필요해서 따로 기억
const _qp = FD.quotePrint;
FD.quotePrint = (model, o, student) => {
  const r = _qp(model, o, student);
  if (model && model.geo && !model.sliced){ ENGINE_OPTV = FD.engineFor(o); FD.lastPrintMin = Math.ceil(estimate(model.geo).min * Math.max(1, parseInt(o.qty) || 1)); }
  else if (model && model.sliced) FD.lastPrintMin = Math.ceil((model.sliced.sec || 0) * Math.max(1, parseInt(o.qty) || 1) / 60);
  return r;
};

/* ---------- 접수 ---------- */
FD.finish = async (st, c, progress = () => {}) => {
  const d = toOrder(st, c), files = [];
  if (st.svc === "print") files.push({file: st.model.file, kind: "model"});
  for (const [id, list] of Object.entries(FD.FILES)) for (const f of list || []) files.push({file: f, kind: /-model$/.test(id) ? "model" : "attach"});
  if (st.student && FD.lastStudent?.file) files.push({file: FD.lastStudent.file, kind: "student"});
  const big = files.find(x => x.kind !== "attach" && x.file.size > MAX_FILE_MB * 1048576);
  if (big){ const e = new Error("big"); e.userMsg = `파일이 너무 커요 (최대 ${MAX_FILE_MB}MB). 줄이거나 오픈채팅으로 보내 주세요.`; throw e; }
  d.no = await submit(d, files, progress);
  for (const k of Object.keys(FD.FILES)) delete FD.FILES[k];
  fetch("https://ntfy.sh/", {method: "POST", body: JSON.stringify({topic: NTFY_TOPIC, title: `FORMDOT 새 ${d.type === "file" ? "주문" : "의뢰"} ${fullCode(d.no, d.lkCode)}`,
    message: [d.typeLabel, d.total, d.student ? "🎓 학생 할인" : ""].filter(Boolean).join(" · "), tags: ["bell"], priority: 4, click: SITE_URL + "#admin"})}).catch(() => {});
  const o = {no: d.no, code: fullCode(d.no, d.lkCode), service: st.svc, title: d.name, status: "new", lkCode: d.lkCode, quote: {kind: st.quote.kind, total: st.quote.total ?? null},
    totalText: d.total, createdAt: Date.now(), updatedAt: Date.now(), customer: {name: c.name, phone: ""}, log: []};
  FD.store.put(o);       // 이 기기에만 남기는 사본 (완료 화면용, 연락처는 저장 안 함)
  return o;
};

/* ---------- 완료 화면 ---------- */
FD.doneHTML = o => { const code = o.code || fullCode(o.no, o.lkCode), req = o.service !== "print", review = o.quote.kind === "review";
  return `<div class="fd-done">
  <div class="fd-done-ic">${FD.icon("check")}</div>
  <h2>${review ? "접수됐어요. 확인 후 금액을 알려 드릴게요." : req ? "의뢰가 접수됐어요" : "주문이 접수됐어요"}</h2>
  <div class="lv-codes"><div><small>주문 코드</small><b>${esc(code)}</b></div></div>
  <button class="fd-btn" type="button" onclick="FD.copy('FORMDOT 주문 코드 ${esc(code)}')">코드 복사</button>
  <p class="lv-note">이 코드 하나로 결제(스마트스토어 옵션)와 주문 조회를 해요. 캡처하거나 복사해 두세요. 판매자가 문자로도 보내 드려요.</p>
  <ol class="fd-next">${req
    ? `<li>스마트스토어에서 <b>디자인 기본비 ${esc(o.totalText.replace(/ ·.*$/, "").replace(/^디자인 기본비 /, ""))}</b>을 결제해요 — 옵션에 코드 <b>${esc(code)}</b></li>
       <li>디자인을 시작해요. 작업 시간이 기본 1시간을 넘으면 <b>추가 비용</b>을 문자로 알려 드리고, 결제하면 마무리해요</li>
       <li>완성된 3D 파일을 보내 드려요</li>
       <li>출력이 필요하면 받은 파일로 홈에서 <b>'3D 파일이 있어요'</b> 또는 <b>⚡ 10초 주문</b>으로 출력을 주문해요</li>`
    : review ? `<li>판매자가 내용을 확인해요</li><li>확정 금액을 문자로 알려 드려요</li><li>스마트스토어에서 결제하면 제작을 시작해요 — 옵션에 코드 <b>${esc(code)}</b></li>`
    : `<li>스마트스토어에서 결제할 때 <b>옵션</b>에 코드 <b>${esc(code)}</b>를 적어 주세요</li><li>결제가 확인되면 제작을 시작해요</li><li>완료되면 발송하고 문자로 알려 드려요</li>`}</ol>
  <div class="fd-done-sum">${esc(o.title || "")} · ${esc(o.totalText || "")}</div></div>`; };

/* ---------- 주문 조회 (번호 + 연락처 + 조회 코드) ---------- */
const ST = [["new", "스마트스토어 결제 대기중", "스마트스토어에서 결제해 주세요. 옵션에 주문 코드를 적어 주시면 바로 확인해요."],
  ["checked", "결제완료 · 요구사항 확인중", "결제가 확인됐어요. 요청하신 내용을 꼼꼼히 확인하고 있어요."],
  ["making", "제작중", "지금 열심히 만들고 있어요."], ["done", "제작완료", "제작이 완료됐어요! 네이버쇼핑에서 배송 현황을 확인해 주세요."]];
FD.mountLookup = el => {
  el.innerHTML = `<form class="fd-lk" novalidate>
    <div class="fd-field"><label class="fd-label" for="lkCd">주문 코드</label><input class="fd-in" id="lkCd" maxlength="12" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="예: 4821-KTP" style="text-transform:uppercase;letter-spacing:.1em"></div>
    <div class="fd-field"><label class="fd-label" for="lkPh">휴대폰 번호</label><input class="fd-in" id="lkPh" type="tel" inputmode="tel" autocomplete="tel" placeholder="010-1234-5678"></div>
    <button class="fd-btn primary" type="submit">조회하기</button><div class="fd-err" role="alert" hidden></div></form><div class="fd-lk-result"></div>`;
  const f = el.querySelector("form"), er = el.querySelector(".fd-err"), res = el.querySelector(".fd-lk-result"), btn = f.querySelector("button");
  const err = m => { er.textContent = m; er.hidden = !m; };
  f.onsubmit = async e => {
    e.preventDefault(); err(""); res.innerHTML = "";
    const [no, cd] = splitCode(el.querySelector("#lkCd").value), ph = el.querySelector("#lkPh").value;
    if (!/^\d{4}$/.test(no) || cd.length < 3 || normContact(ph).length < 4) return err("주문 코드(예: 4821-KTP)와 휴대폰 번호를 넣어 주세요.");
    btn.disabled = true; btn.textContent = "조회하는 중…";
    try{
      const {db, D} = await timeout(fb(), 8000);
      const v = (await timeout(D.get(D.ref(db, "lookup/" + await lookupKey(no, ph, cd))), 8000)).val();
      if (!v) return err("주문을 찾을 수 없어요. 주문 코드와 휴대폰 번호를 다시 확인해 주세요. 코드를 잃어버렸다면 오픈채팅으로 알려 주세요.");
      const idx = Math.max(0, ST.findIndex(s => s[0] === v.status)), when = v.updatedAt || v.createdAt;
      res.innerHTML = `<div class="fd-status"><div class="fd-st-head"><span class="fd-st-no">${esc(fullCode(no, cd))}</span><span class="fd-badge">${esc(v.type || "")}</span></div>
        <ol class="fd-steps" style="margin-top:14px">${ST.map((s, i) => `<li class="${i < idx ? "past" : i === idx ? "now" : ""}"><i></i><span>${s[1]}</span></li>`).join("")}</ol>
        <p class="fd-st-desc">${ST[idx][2]}</p><div class="fd-st-meta">${v.total ? esc(v.total) + " · " : ""}${when ? "최근 변경 " + new Date(when).toLocaleString("ko-KR", {month: "long", day: "numeric", hour: "2-digit", minute: "2-digit"}) : ""}</div>
        <div style="margin-top:12px">${FD.kakao("문의하기")}</div></div>`;
    }catch(e2){ console.error(e2); err("지금은 조회할 수 없어요. 잠시 후 다시 시도해 주세요."); }
    finally{ btn.disabled = false; btn.textContent = "조회하기"; }
  };
};
})();
