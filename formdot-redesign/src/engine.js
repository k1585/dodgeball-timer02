/* FORMDOT 견적 엔진 — 운영 사이트(k1585.github.io)의 계산 코드를 그대로 옮긴 것.
   바꾸지 말 것: 운영 사이트와 같은 결과가 나와야 해요. (원본: 3D프린팅_견적계산기 v4 + 운영 패치)
   DOM 대신 ENGINE_OPTV(옵션 값 객체)를 읽도록 optVal/optData 만 바꿨어요.            */
/* ================= 출력 옵션 (뱀부 스튜디오 기준) =================
   select 항목: [값, 화면 표시, 추가 데이터]
   - mat  d: 밀도(g/cm³)  s: 속도 배율
   - pattern  m: 재료 배율  t: 시간 배율                                   */
const OPTS = [
 {sec:"재료 · 색상", icon:"🎨", always:true, items:[
  {id:"mat", label:"재료", type:"select", def:"PLA", list:[
    ["PLA","PLA Basic (기본)",{d:1.26,s:1,lt:2,prep:0,w:0}], ["PLA-Matte","PLA Matte (무광)",{d:1.32,s:0.95,lt:2,prep:0,w:0}],
    ["PLA-Silk","PLA Silk+ (광택)",{d:1.32,s:0.7,lt:2,prep:0,w:0.2}],
    ["PETG","PETG HF",{d:1.25,s:0.85,lt:2.5,prep:1,w:0.3}], ["ABS","ABS",{d:1.05,s:0.8,lt:2,prep:3,w:0.4}], ["ASA","ASA",{d:1.07,s:0.8,lt:2,prep:3,w:0.4}],
    ["TPU","TPU 95A HF (말랑)",{d:1.22,s:0.3,lt:3,prep:1,w:0.5}], ["PLA-CF","PLA-CF (카본)",{d:1.22,s:0.85,lt:2,prep:0,w:0.3}],
    ["PETG-CF","PETG-CF (카본)",{d:1.25,s:0.8,lt:2.5,prep:1,w:0.3}]],
   hint:"모르면 PLA Basic을 고르세요. 재료에 따라 가격이 달라져요.",
   help:"뱀부랩 정품 필라멘트를 사용해요. 재료마다 가격이 달라서 견적도 바뀌어요.<br><b>PLA Basic</b>: 가장 많이 쓰는 기본 재료. 출력이 깔끔하고 저렴하지만 열(약 55℃ 이상)에 약해요.<br><b>PLA Matte</b>: 무광. 적층 줄무늬가 덜 보여요.<br><b>PLA Silk+</b>: 비단처럼 반짝이는 광택. 장식용에 좋고 조금 느리게 출력해요.<br><b>PETG HF</b>: PLA보다 질기고 열·물에 강해요. 실용 부품용.<br><b>ABS / ASA</b>: 열(약 90℃)에 강하고 단단해요. ASA는 햇빛(자외선)에도 강해 야외용에 좋아요.<br><b>TPU</b>: 고무처럼 말랑하고 휘어져요. 출력이 매우 느려요.<br><b>카본(CF)</b>: 탄소섬유가 섞여 단단하고 무광 질감이에요."},
  {id:"color", label:"색상", type:"select", def:"흰색", list:[
    ["흰색","흰색"],["검정","검정"],["회색","회색"],["빨강","빨강"],["주황","주황"],["노랑","노랑"],["초록","초록"],
    ["파랑","파랑"],["보라","보라"],["분홍","분홍"],["갈색","갈색"],["투명","투명/반투명"],["기타","기타 (주문 시 상담)"]],
   help:"출력할 필라멘트 색상이에요. 가격에는 영향이 없어요. 재료에 따라 없는 색상은 주문 확인 후 연락드려요."}
 ]},
 {sec:"품질", icon:"✨", items:[
  {id:"layerH", label:"레이어 높이", type:"select", def:"0.20", list:[
    ["0.08","0.08 mm · 초정밀"],["0.12","0.12 mm · 정밀"],["0.16","0.16 mm · 고품질"],["0.20","0.20 mm · 표준"],
    ["0.24","0.24 mm · 빠름"],["0.28","0.28 mm · 초안"]],
   help:"한 층의 두께예요. <b>작을수록</b> 층 줄무늬가 덜 보이고 곡면이 매끈하지만 층 수가 늘어나 <b>시간이 많이</b> 걸려요. <b>클수록</b> 빠르지만 표면이 계단처럼 거칠어져요. 보통 0.20mm면 충분해요."},
  {id:"firstLayerH", label:"첫 레이어 높이", type:"select", def:"0.20", list:[["0.20","0.20 mm"],["0.25","0.25 mm"],["0.30","0.30 mm"]],
   help:"바닥에 처음 깔리는 층의 두께예요. 두꺼울수록 베드에 잘 붙고 바닥 수평 오차를 잘 흡수하지만, 바닥면이 조금 두툼해 보일 수 있어요."},
  {id:"lineW", label:"선 폭", type:"select", def:"0.42", list:[["0.40","0.40 mm"],["0.42","0.42 mm (기본)"],["0.45","0.45 mm"],["0.50","0.50 mm"]],
   help:"노즐에서 나오는 플라스틱 한 줄의 폭이에요(0.4mm 노즐 기준). 넓으면 벽이 두꺼워져 튼튼하고 빨라지지만, 작은 글씨나 섬세한 디테일은 뭉개질 수 있어요."},
  {id:"ironing", label:"다림질 (윗면 매끈하게)", type:"select", def:"off", list:[
    ["off","사용 안 함",{k:0}],["topmost","가장 위 면만",{k:1}],["top","모든 윗면",{k:2}]],
   help:"출력이 끝난 윗면을 뜨거운 노즐로 한 번 더 문질러 <b>평평하고 매끈하게</b> 만들어요. 명판·로고처럼 평평한 윗면이 보이는 물건에 좋아요. 윗면 넓이만큼 시간이 늘어나요."}
 ]},
 {sec:"벽 · 셸 (강도)", icon:"🧱", items:[
  {id:"walls", label:"벽 개수 (벽 루프)", type:"number", def:2, min:1, max:10, step:1, unit:"겹",
   help:"바깥 테두리 벽을 몇 겹으로 쌓을지예요. 벽은 강도에 가장 큰 영향을 줘요. <b>2겹</b>이 기본, 기능성 부품은 <b>3~4겹</b>을 추천해요. 늘리면 무게와 시간이 늘어나요."},
  {id:"topL", label:"상단 셸 레이어", type:"number", def:5, min:0, max:20, step:1, unit:"층",
   help:"물체 윗면을 꽉 채워 덮는 층 수예요. 너무 적으면 윗면에 내부 채움 무늬가 비치거나 구멍이 생겨요. 보통 4~6층."},
  {id:"botL", label:"하단 셸 레이어", type:"number", def:3, min:0, max:20, step:1, unit:"층",
   help:"물체 바닥면을 꽉 채우는 층 수예요. 바닥이 튼튼하고 물이 새지 않아야 하면 늘려 주세요. 보통 3~4층."},
  {id:"topPattern", label:"상단 표면 패턴", type:"select", def:"monotonic", list:[
    ["monotonic","단조 (기본)",{t:1}],["monotonicline","단조 선",{t:1}],["rectilinear","직선",{t:0.95}],["concentric","동심원",{t:1.05}],
    ["hilbert","힐베르트 곡선",{t:1.4}],["archimedean","아르키메데스 화음",{t:1.2}],["octagram","옥타그램 나선",{t:1.2}]],
   help:"윗면을 채우는 선의 모양이에요.<br><b>단조</b>: 한 방향으로 고르게 깔아 가장 깔끔해요(추천).<br><b>직선</b>: 지그재그로 빠르게 채워요.<br><b>동심원</b>: 테두리를 따라 동그랗게 채워요.<br><b>힐베르트·아르키메데스·옥타그램</b>: 장식 무늬. 보기엔 예쁘지만 느려요."},
  {id:"bottomPattern", label:"하단 표면 패턴", type:"select", def:"monotonic", list:[
    ["monotonic","단조 (기본)",{t:1}],["rectilinear","직선",{t:0.95}],["concentric","동심원",{t:1.05}],
    ["hilbert","힐베르트 곡선",{t:1.4}],["archimedean","아르키메데스 화음",{t:1.2}],["octagram","옥타그램 나선",{t:1.2}]],
   help:"바닥면을 채우는 선의 모양이에요. 바닥은 보통 잘 안 보이니 기본값이면 충분해요. 바닥 무늬를 꾸미고 싶을 때만 바꾸세요."}
 ]},
 {sec:"내부 채움 (인필)", icon:"🔳", items:[
  {id:"infill", label:"내부 채움 밀도", type:"number", def:15, min:0, max:100, step:1, unit:"%",
   help:"물체 속을 얼마나 채울지예요. <b>0%</b>는 속이 빈 껍데기, <b>100%</b>는 꽉 찬 덩어리예요.<br>장식품 <b>10~15%</b>, 일반 부품 <b>15~25%</b>, 힘 받는 부품 <b>30~50%</b>를 추천해요. 높을수록 무겁고 오래 걸려요."},
  {id:"pattern", label:"내부 채움 패턴", type:"select", def:"grid", list:[
    ["grid","그리드 (기본)",{m:1,t:0.95}],["rectilinear","직선",{m:1,t:1}],["line","선",{m:1,t:0.95}],["crosshatch","크로스 해치",{m:1,t:1.05}],
    ["cubic","큐빅",{m:1,t:1}],["adaptivecubic","적응형 큐빅",{m:0.8,t:0.9}],["supportcubic","서포트 큐빅",{m:0.6,t:0.8}],
    ["triangles","삼각형",{m:1,t:1}],["trihexagon","트라이헥사곤",{m:1,t:1}],["gyroid","자이로이드",{m:1,t:1.25}],
    ["honeycomb","허니콤 (벌집)",{m:1.1,t:1.35}],["3dhoneycomb","3D 허니콤",{m:1,t:1.3}],["lightning","라이트닝",{m:0.35,t:0.7}],
    ["concentric","동심원",{m:1,t:1.1}],["hilbert","힐베르트 곡선",{m:1,t:1.45}],["archimedean","아르키메데스 화음",{m:1,t:1.2}],["octagram","옥타그램 나선",{m:1,t:1.2}]],
   hint:"모르면 그리드(기본) 그대로 두세요.",
   help:"물체 속을 채우는 무늬예요.<br><b>그리드</b>: 격자 모양. 빠르고 무난한 기본값.<br><b>직선 / 선</b>: 층마다 한 방향 선. 가장 단순하고 빨라요.<br><b>크로스 해치</b>: 방향을 바꿔 가며 쌓아 고르게 튼튼해요.<br><b>큐빅 / 삼각형 / 트라이헥사곤</b>: 여러 방향 힘에 강해요.<br><b>적응형 큐빅 / 서포트 큐빅</b>: 안쪽 깊은 곳은 성글게 채워 재료와 시간을 아껴요.<br><b>자이로이드</b>: 물결 모양. 모든 방향으로 고르게 튼튼하지만 조금 느려요.<br><b>허니콤 / 3D 허니콤</b>: 벌집 모양. 튼튼하지만 느려요.<br><b>라이트닝</b>: 윗면을 받칠 만큼만 나뭇가지처럼 채워요. 가장 가볍고 빠르지만 강도는 약해요(장식용).<br><b>동심원 / 힐베르트 / 아르키메데스 / 옥타그램</b>: 투명·반투명 재료로 무늬를 보여줄 때 써요."}
 ]},
 {sec:"서포트", icon:"🪜", items:[
  {id:"supType", label:"서포트 종류", type:"select", def:"none", list:[
    ["none","사용 안 함",{f:0}],["normal","일반 (자동)",{f:1}],["tree","트리 (자동)",{f:0.6}]],
   help:"공중에 떠 있는 부분(돌출부)을 밑에서 받쳐 주는 임시 기둥이에요. 출력 후 떼어 내요.<br><b>사용 안 함</b>: 돌출부가 없거나 완만한 모델.<br><b>일반</b>: 격자 모양 기둥. 튼튼하게 받쳐 줘요.<br><b>트리</b>: 나뭇가지처럼 뻗어 받쳐 줘요. 재료를 덜 쓰고 떼어 내기 쉬워 피규어 등에 좋아요."},
  {id:"supAngle", label:"서포트 기준 각도", type:"number", def:30, min:5, max:80, step:1, unit:"°",
   help:"바닥(수평)에서 몇 도보다 <b>눕혀진</b> 아랫면부터 서포트를 넣을지예요. 값이 <b>클수록 서포트가 많이</b> 생기고, 작을수록 적게 생겨요. 기본 30°."},
  {id:"supDensity", label:"서포트 밀도", type:"select", def:"normal", list:[
    ["low","낮음 (떼기 쉬움)",{f:0.7}],["normal","보통",{f:1}],["high","높음 (튼튼하게)",{f:1.5}]],
   help:"서포트를 얼마나 촘촘하게 만들지예요. 낮으면 떼기 쉽고 재료가 적게 들지만, 무거운 돌출부는 처질 수 있어요."}
 ]},
 {sec:"바닥 접착", icon:"🧲", items:[
  {id:"brim", label:"브림", type:"select", def:"0", list:[["0","사용 안 함"],["3","3 mm"],["5","5 mm"],["8","8 mm"]],
   help:"물체 바닥 둘레에 얇은 테두리(챙)를 넓게 붙여서 출력 중 <b>떨어지거나 모서리가 들뜨는 것</b>을 막아요. 바닥이 좁고 키가 큰 모델, ABS/ASA에 추천해요. 출력 후 손으로 떼어 내요."},
  {id:"raft", label:"래프트 층 수", type:"number", def:0, min:0, max:6, step:1, unit:"층",
   help:"물체 아래에 받침판을 먼저 몇 층 깔고 그 위에 출력해요. 바닥이 울퉁불퉁하거나 아주 작은 모델에 써요. 재료·시간이 늘고 바닥면이 거칠어져서 보통은 0층(사용 안 함)이에요."}
 ]},
 {sec:"속도", icon:"⚡", items:[
  {id:"speed", label:"출력 속도 모드", type:"select", def:"standard", list:[
    ["silent","조용 (50%)",{f:0.55}],["standard","표준 (100%)",{f:1}],["sport","스포츠 (124%)",{f:1.18}],["ludicrous","루디크러스 (166%)",{f:1.4}]],
   help:"프린터 속도 모드예요. <b>조용</b>은 소음과 진동이 적고 품질이 조금 좋아지지만 오래 걸려요. <b>스포츠·루디크러스</b>는 빠르지만 표면 품질이 떨어질 수 있어요. 보통 표준을 추천해요."}
 ]}
];


const FILAMENT_PRICE = {
  "PLA":       18000,   // PLA Basic
  "PLA-Matte": 18000,   // PLA Matte
  "PLA-Silk":  22000,   // PLA Silk+ (추정)
  "PETG":      18000,   // PETG HF
  "ABS":       18000,   // ABS
  "ASA":       22000,   // ASA (추정)
  "TPU":       38000,   // TPU 95A HF (추정)
  "PLA-CF":    32000,   // PLA-CF (추정)
  "PETG-CF":   32000    // PETG-CF (추정)
};


const OPT_BY_ID = Object.fromEntries(OPTS.flatMap(s => s.items).map(o => [o.id, o]));
let ENGINE_OPTV = {};
function engineDefaults(){ const v = {}; for (const o of Object.values(OPT_BY_ID)) v[o.id] = String(o.def); return v; }
function optVal(id){
  const o = OPT_BY_ID[id], raw = ENGINE_OPTV[id] ?? o.def;
  if (o.type === "number"){ let v = parseFloat(raw); if (!isFinite(v)) v = o.def; return Math.min(o.max, Math.max(o.min, v)); }
  return String(raw);
}
function optData(id){ const o = OPT_BY_ID[id]; return (o.list.find(x => x[0] === String(ENGINE_OPTV[id] ?? o.def)) || o.list[0])[2] || {}; }
function optLabel(id){ const o = OPT_BY_ID[id]; if (o.type === "number") return optVal(id) + (o.unit || ""); const it = o.list.find(x => x[0] === optVal(id)); return it ? it[1] : ""; }

/* ---------------- 자체 추정 ---------------- */
function estimate(geo){
  if (!geo.fin) finalizeGeo(geo);
  const mat = optData("mat");
  const layerH = +optVal("layerH"), firstH = +optVal("firstLayerH"), lw = +optVal("lineW");
  const V = geo.vol;
  const [dx, dy, dz] = geo.max.map((v, i) => v - geo.min[i]);

  // 벽 + 상/하단 셸
  let wallV = geo.areaV * optVal("walls") * lw;
  let topV  = geo.areaUp * optVal("topL") * layerH;
  let botV  = geo.areaDown * optVal("botL") * layerH;
  const shellSum = wallV + topV + botV;
  if (shellSum > V){ const k = V / shellSum; wallV *= k; topV *= k; botV *= k; }
  const core = Math.max(0, V - wallV - topV - botV);

  // 내부 채움
  const pat = optData("pattern"), dens = optVal("infill") / 100;
  const infillV = core * dens * (dens >= 0.99 ? 1 : pat.m);

  // 서포트: 기준 각도보다 눕혀진 아랫면 × 바닥까지 높이
  let supV = 0;
  const supF = optData("supType").f;
  if (supF > 0){
    const ang = Math.round(optVal("supAngle"));
    let raw = 0; for (let i = 0; i < ang && i < 91; i++) raw += geo.supHist[i];
    supV = raw * 0.15 * supF * optData("supDensity").f;
  }

  // 바닥 접착
  const brimW = +optVal("brim");
  const brimV = brimW ? (2*(dx + dy) + Math.PI*brimW) * brimW * firstH : 0;
  const raftN = optVal("raft");
  const raftV = raftN ? (dx + 6) * (dy + 6) * layerH * raftN * 0.6 : 0;

  const ext = wallV + topV + botV + infillV + supV + brimV + raftV;          // mm³
  const g = ext / 1000 * mat.d + 0.5 + (mat.w || 0);                                        // + 프라임/퍼지 손실

  // 시간
  const layers = Math.max(1, Math.ceil((dz - firstH) / layerH) + 1) + raftN;
  const flow = 7 * Math.pow(layerH / 0.2, 0.8) * optData("speed").f * mat.s; // mm³/s
  const work = wallV + topV*optData("topPattern").t + botV*optData("bottomPattern").t
             + infillV*pat.t + supV*1.1 + brimV + raftV;
  const ironK = optData("ironing").k;
  const ironArea = ironK === 2 ? geo.areaUp : ironK === 1 ? geo.areaTopmost : 0;
  const sec = work / flow + layers * (mat.lt || 2) + ironArea / 3 + 240 + (mat.prep || 0) * 60;
  return {g, min: sec / 60, ext, layers, supV};
}
// 표면 방향 통계 + 서포트 히스토그램 (파일당 1번)
function finalizeGeo(geo){
  const zmin = geo.min[2], zmax = geo.max[2];
  let up = 0, down = 0, topmost = 0;
  const hist = new Float64Array(91);
  for (const ch of geo.chunks){
    for (let i = 0; i < ch.length; i += 9){
      const ux=ch[i+3]-ch[i], uy=ch[i+4]-ch[i+1], uz=ch[i+5]-ch[i+2];
      const vx=ch[i+6]-ch[i], vy=ch[i+7]-ch[i+1], vz=ch[i+8]-ch[i+2];
      const cx=uy*vz-uz*vy, cy=uz*vx-ux*vz, cz=ux*vy-uy*vx;
      const len = Math.hypot(cx, cy, cz); if (!len) continue;
      const area = len/2, nz = cz/len, proj = area*Math.abs(nz);
      const zc = (ch[i+2] + ch[i+5] + ch[i+8]) / 3;
      if (nz > 0){
        up += proj;
        if (nz > 0.95 && Math.min(ch[i+2], ch[i+5], ch[i+8]) > zmax - 0.05) topmost += proj;
      } else {
        down += proj;
        const h = zc - zmin;
        if (h > 0.3){
          const slope = Math.acos(Math.min(1, -nz)) * 180 / Math.PI;   // 수평면 기준 기울기
          hist[Math.min(90, Math.floor(slope))] += proj * h;
        }
      }
    }
  }
  geo.areaUp = up; geo.areaDown = down; geo.areaTopmost = topmost; geo.supHist = hist; geo.fin = true;
}
/* ---------------- 지오메트리 누적 ---------------- */
function newGeo(){
  return {vol:0, area:0, areaH:0, areaV:0, tris:0,
          min:[Infinity,Infinity,Infinity], max:[-Infinity,-Infinity,-Infinity], chunks:[]};
}
// 하나의 메쉬(정점 배열 pos[x,y,z...], 인덱스 idx) + 4x3 변환행렬 누적
function addMesh(geo, pos, idx, mtx){
  const n = idx.length/3;
  const out = new Float32Array(n*9);
  let vol = 0;
  const T = mtx || [1,0,0, 0,1,0, 0,0,1, 0,0,0];
  const tx = (i) => {
    const x=pos[i*3], y=pos[i*3+1], z=pos[i*3+2];
    return [x*T[0]+y*T[3]+z*T[6]+T[9], x*T[1]+y*T[4]+z*T[7]+T[10], x*T[2]+y*T[5]+z*T[8]+T[11]];
  };
  for (let t=0;t<n;t++){
    const a=tx(idx[t*3]), b=tx(idx[t*3+1]), c=tx(idx[t*3+2]);
    vol += triStats(geo, a, b, c);
    out.set(a, t*9); out.set(b, t*9+3); out.set(c, t*9+6);
  }
  geo.vol += Math.abs(vol);
  geo.chunks.push(out);
}
function triStats(geo, a, b, c){
  const ux=b[0]-a[0], uy=b[1]-a[1], uz=b[2]-a[2];
  const vx=c[0]-a[0], vy=c[1]-a[1], vz=c[2]-a[2];
  const cx=uy*vz-uz*vy, cy=uz*vx-ux*vz, cz=ux*vy-uy*vx;
  const len = Math.hypot(cx,cy,cz);
  const area = len/2;
  geo.area += area;
  if (len > 0){
    const nz = Math.abs(cz/len);
    geo.areaH += area*nz;
    geo.areaV += area*Math.sqrt(Math.max(0,1-nz*nz));
  }
  geo.tris++;
  for (const p of [a,b,c]) for (let k=0;k<3;k++){
    if (p[k]<geo.min[k]) geo.min[k]=p[k];
    if (p[k]>geo.max[k]) geo.max[k]=p[k];
  }
  // 부호 있는 사면체 부피
  return (a[0]*(b[1]*c[2]-b[2]*c[1]) - a[1]*(b[0]*c[2]-b[2]*c[0]) + a[2]*(b[0]*c[1]-b[1]*c[0])) / 6;
}

/* ---------------- STL ---------------- */
function parseSTL(buf){
  const dv = new DataView(buf);
  const geo = newGeo();
  const isBinary = buf.byteLength >= 84 && 84 + dv.getUint32(80, true)*50 === buf.byteLength;
  let vol = 0;
  if (isBinary){
    const n = dv.getUint32(80, true);
    const out = new Float32Array(n*9);
    for (let i=0;i<n;i++){
      const o = 84 + i*50 + 12;
      const p = [];
      for (let k=0;k<3;k++) p.push([dv.getFloat32(o+k*12,true), dv.getFloat32(o+k*12+4,true), dv.getFloat32(o+k*12+8,true)]);
      vol += triStats(geo, p[0], p[1], p[2]);
      out.set(p[0], i*9); out.set(p[1], i*9+3); out.set(p[2], i*9+6);
    }
    geo.chunks.push(out);
  } else {
    const text = new TextDecoder().decode(buf);
    const re = /vertex\s+([-+\d.eE]+)\s+([-+\d.eE]+)\s+([-+\d.eE]+)/g;
    const v = []; let mt;
    while ((mt = re.exec(text))) v.push(+mt[1], +mt[2], +mt[3]);
    const n = Math.floor(v.length/9);
    if (!n) throw new Error("STL에서 삼각형을 찾지 못했습니다.");
    const out = new Float32Array(v.slice(0, n*9));
    for (let i=0;i<n;i++){
      const a=[v[i*9],v[i*9+1],v[i*9+2]], b=[v[i*9+3],v[i*9+4],v[i*9+5]], c=[v[i*9+6],v[i*9+7],v[i*9+8]];
      vol += triStats(geo, a, b, c);
    }
    geo.chunks.push(out);
  }
  geo.vol = Math.abs(vol);
  return geo;
}

/* ---------------- ZIP (3MF) ---------------- */
async function readZip(buf){
  const dv = new DataView(buf), u8 = new Uint8Array(buf);
  let eocd = -1;
  for (let i = buf.byteLength-22; i >= Math.max(0, buf.byteLength-65557); i--)
    if (dv.getUint32(i, true) === 0x06054b50){ eocd = i; break; }
  if (eocd < 0) throw new Error("3MF(zip) 파일 구조를 읽을 수 없습니다.");
  let count = dv.getUint16(eocd+10, true), cdOff = dv.getUint32(eocd+16, true);
  if (cdOff === 0xFFFFFFFF || count === 0xFFFF){          // ZIP64
    const loc = eocd - 20;
    if (dv.getUint32(loc, true) === 0x07064b50){
      const z = Number(dv.getBigUint64(loc+8, true));
      count = Number(dv.getBigUint64(z+32, true));
      cdOff = Number(dv.getBigUint64(z+48, true));
    }
  }
  const files = {};
  const dec = new TextDecoder();
  let p = cdOff;
  for (let i=0;i<count;i++){
    if (dv.getUint32(p, true) !== 0x02014b50) break;
    const method = dv.getUint16(p+10, true);
    let csize = dv.getUint32(p+20, true), usize = dv.getUint32(p+24, true);
    const nl = dv.getUint16(p+28, true), el = dv.getUint16(p+30, true), cl = dv.getUint16(p+32, true);
    let lo = dv.getUint32(p+42, true);
    const name = dec.decode(u8.subarray(p+46, p+46+nl));
    // ZIP64 extra
    let e = p+46+nl; const eEnd = e+el;
    while (e+4 <= eEnd){
      const id = dv.getUint16(e, true), sz = dv.getUint16(e+2, true);
      if (id === 0x0001){
        let q = e+4;
        if (usize === 0xFFFFFFFF){ usize = Number(dv.getBigUint64(q, true)); q += 8; }
        if (csize === 0xFFFFFFFF){ csize = Number(dv.getBigUint64(q, true)); q += 8; }
        if (lo === 0xFFFFFFFF){ lo = Number(dv.getBigUint64(q, true)); }
      }
      e += 4+sz;
    }
    files[name] = {method, csize, lo};
    p = eEnd + cl;
  }
  async function get(name){
    const f = files[name]; if (!f) return null;
    const nl = dv.getUint16(f.lo+26, true), el = dv.getUint16(f.lo+28, true);
    const start = f.lo + 30 + nl + el;
    const data = u8.subarray(start, start + f.csize);
    if (f.method === 0) return data;
    if (f.method !== 8) throw new Error("지원하지 않는 압축 방식입니다.");
    if (typeof DecompressionStream === "undefined") throw new Error("이 브라우저는 3MF 압축 해제를 지원하지 않습니다. 최신 Chrome/Edge/Safari를 사용하세요.");
    const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
    return new Uint8Array(await new Response(stream).arrayBuffer());
  }
  return {names: Object.keys(files), get, text: async n => { const d = await get(n); return d ? dec.decode(d) : null; }};
}

/* ---------------- 3MF ---------------- */
async function parse3MF(buf){
  const zip = await readZip(buf);
  const result = {};

  // 1) 뱀부 스튜디오 슬라이싱 정보
  const si = zip.names.find(n => /slice_info\.config$/i.test(n));
  if (si){
    const xml = await zip.text(si);
    let sec = 0, g = 0, plates = 0;
    for (const plate of xml.split(/<plate[\s>]/).slice(1)){
      const pr = plate.match(/key="prediction"\s+value="([\d.]+)"/);
      const wt = plate.match(/key="weight"\s+value="([\d.]+)"/);
      if (pr || wt){ plates++; sec += pr ? +pr[1] : 0; g += wt ? +wt[1] : 0; }
    }
    if (sec > 0 || g > 0) result.sliced = {sec, g, plates, source: "뱀부 스튜디오 slice_info"};
  }
  // 2) 내부 G-code 헤더 (slice_info가 없을 때)
  if (!result.sliced){
    const gc = zip.names.filter(n => /\.gcode$/i.test(n));
    let sec = 0, g = 0;
    for (const n of gc){
      const d = await zip.get(n);
      const r = parseGcodeText(gcodeHeadTail(d.buffer.slice(d.byteOffset, d.byteOffset + d.byteLength)));
      sec += r.sec || 0; g += r.g || 0;
    }
    if (sec > 0 || g > 0) result.sliced = {sec, g, plates: gc.length, source: "내장 G-code"};
  }

  // 3) 메쉬
  const modelNames = zip.names.filter(n => /\.model$/i.test(n));
  if (modelNames.length){
    const docs = {};
    for (const n of modelNames){
      const t = await zip.text(n);
      docs["/" + n.replace(/^\//, "")] = new DOMParser().parseFromString(t, "application/xml");
    }
    const rootName = Object.keys(docs).find(k => /^\/3D\/3dmodel\.model$/i.test(k)) || Object.keys(docs)[0];
    const geo = newGeo();
    const objIndex = {};
    for (const [path, doc] of Object.entries(docs)){
      const unit = (doc.documentElement.getAttribute("unit") || "millimeter").toLowerCase();
      const scale = {micron:0.001, millimeter:1, centimeter:10, inch:25.4, foot:304.8, meter:1000}[unit] || 1;
      for (const o of doc.getElementsByTagNameNS("*", "object")) objIndex[path + "#" + o.getAttribute("id")] = {o, scale};
    }
    const meshCache = {};
    function meshOf(key){
      if (key in meshCache) return meshCache[key];
      const {o, scale} = objIndex[key];
      const mesh = [...o.children].find(c => c.localName === "mesh");
      if (!mesh){ meshCache[key] = null; return null; }
      const vs = mesh.getElementsByTagNameNS("*", "vertex"), ts = mesh.getElementsByTagNameNS("*", "triangle");
      const pos = new Float64Array(vs.length*3), idx = new Uint32Array(ts.length*3);
      for (let i=0;i<vs.length;i++){
        pos[i*3] = +vs[i].getAttribute("x")*scale; pos[i*3+1] = +vs[i].getAttribute("y")*scale; pos[i*3+2] = +vs[i].getAttribute("z")*scale;
      }
      for (let i=0;i<ts.length;i++){
        idx[i*3] = +ts[i].getAttribute("v1"); idx[i*3+1] = +ts[i].getAttribute("v2"); idx[i*3+2] = +ts[i].getAttribute("v3");
      }
      return meshCache[key] = {pos, idx};
    }
    const pathAttr = el => { for (const a of el.attributes) if (a.localName === "path") return a.value; return null; };
    function walk(key, mtx, depth){
      if (!objIndex[key] || depth > 16) return;
      const {o} = objIndex[key];
      const m = meshOf(key);
      if (m) addMesh(geo, m.pos, m.idx, mtx);
      const comps = [...o.children].find(c => c.localName === "components");
      if (comps) for (const c of comps.children){
        if (c.localName !== "component") continue;
        const p = pathAttr(c) || key.split("#")[0];
        walk(p + "#" + c.getAttribute("objectid"), mul(parseT(c.getAttribute("transform")), mtx), depth+1);
      }
    }
    const items = [...docs[rootName].getElementsByTagNameNS("*", "item")];
    if (items.length){
      for (const it of items){
        if (it.getAttribute("printable") === "0") continue;
        walk((pathAttr(it) || rootName) + "#" + it.getAttribute("objectid"), parseT(it.getAttribute("transform")), 0);
      }
    } else {
      for (const k of Object.keys(objIndex)) if (k.startsWith(rootName)) walk(k, null, 0);
    }
    if (geo.tris) result.geo = geo;
  }
  return result;
}
// 3MF 변환: "m00 m01 m02 m10 m11 m12 m20 m21 m22 m30 m31 m32"
function parseT(s){
  if (!s) return [1,0,0, 0,1,0, 0,0,1, 0,0,0];
  const v = s.trim().split(/\s+/).map(Number);
  return v.length === 12 ? v : [1,0,0, 0,1,0, 0,0,1, 0,0,0];
}
// 먼저 A, 다음 B를 적용하는 합성 변환
function mul(A, B){
  if (!B) return A;
  const r = new Array(12);
  for (let i=0;i<4;i++) for (let j=0;j<3;j++){
    r[i*3+j] = A[i*3]*B[j] + A[i*3+1]*B[3+j] + A[i*3+2]*B[6+j] + (i===3 ? B[9+j] : 0);
  }
  return r;
}

/* ---------------- G-code ---------------- */
function gcodeHeadTail(buf){
  const u8 = new Uint8Array(buf), N = 400000, dec = new TextDecoder();
  if (u8.length <= N*2) return dec.decode(u8);
  return dec.decode(u8.subarray(0, N)) + "\n" + dec.decode(u8.subarray(u8.length - N));
}
function parseDuration(s){
  let sec = 0, m;
  const re = /([\d.]+)\s*([dhms])/g;
  while ((m = re.exec(s))) sec += +m[1] * {d:86400, h:3600, m:60, s:1}[m[2]];
  return sec;
}
function parseGcodeText(t){
  let sec = 0, g = 0, m;
  if ((m = t.match(/total estimated time:\s*([^;\n]+)/i))) sec = parseDuration(m[1]);
  else if ((m = t.match(/estimated printing time \(normal mode\)\s*=\s*([^\n]+)/i))) sec = parseDuration(m[1]);
  else if ((m = t.match(/model printing time:\s*([^;\n]+)/i))) sec = parseDuration(m[1]);
  else if ((m = t.match(/;\s*TIME:\s*(\d+)/))) sec = +m[1];
  if ((m = t.match(/total filament weight \[g\]\s*[:=]\s*([\d.]+)/i))) g = +m[1];
  else if ((m = t.match(/filament used \[g\]\s*[:=]\s*([\d.,\s]+)/i))) g = m[1].split(",").reduce((a,b)=>a+(parseFloat(b)||0),0);
  else if ((m = t.match(/;\s*Filament used:\s*([\d.]+)\s*m/i))){
    const L = +m[1]*1000; // mm, 1.75mm 필라멘트 기준
    g = Math.PI*0.875*0.875*L/1000 * (optData("mat").d || 1.24);
  }
  return {sec, g, plates: 1, source: "G-code 헤더"};
}

