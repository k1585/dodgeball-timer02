/* 안내서에 넣을 화면 사진을 지금 앱에서 다시 찍는다.
   예전 스크립트는 반 코드로 학생이 스스로 들어오던 시절 것이라 더는 돌지 않는다.
   지금은 선생님이 계정을 발급하고, 자료가 서버에 있어서 실제 서버에 붙어야 한다. */
const { chromium } = require('playwright');
const fs = require('fs');
const L = require('/tmp/claude-0/-home-user-dodgeball-timer02/7b352a5d-060f-5a7b-8fe8-b609e1ff583a/scratchpad/fblaunch');
const DIR = __dirname + '/manual';
fs.mkdirSync(DIR, { recursive: true });

const TAG = Date.now().toString(36).slice(-4);
const TNAME = '김서연';

(async () => {
const b = await chromium.launch({ executablePath: L.exe, headless: true, args: L.args });
const ctxT = await b.newContext({ viewport:{width:420,height:900}, deviceScaleFactor:2 });
const ctxS = await b.newContext({ viewport:{width:420,height:900}, deviceScaleFactor:2 });
const T = await ctxT.newPage(), S = await ctxS.newPage();
await L.useLocalSdk(ctxT); await L.useLocalSdk(ctxS);
const errs = [];
[T,S].forEach((pg,i)=>pg.on('pageerror',e=>errs.push((i?'학생':'선생')+': '+e.message)));

const active = pg => pg.evaluate(()=>(document.querySelector('.page.active')||{}).id);
async function waitPage(pg,id,ms=30000){ const t=Date.now();
  while(Date.now()-t<ms){ if(await active(pg)===id) return true; await pg.waitForTimeout(200);} return false; }
async function waitFor(pg,fn,ms=30000){ const t=Date.now();
  while(Date.now()-t<ms){ try{ if(await pg.evaluate(fn)) return true; }catch(e){} await pg.waitForTimeout(200);} return false; }
/* 반을 지우고 나면 끝에 계정도 지워 다음 실행이 깨끗하게 시작되게 한다 */
const shot = async (pg,n) => {
  await pg.waitForTimeout(350);
  await pg.screenshot({ path:`${DIR}/${n}.png` });
  console.log(`  📸 ${n.padEnd(20)} → ${await active(pg)}`);
};
/* 공책에 쓴 것처럼 보이는 사진을 만든다. 진짜 학생 사진을 쓸 수 없어서다. */
const PHOTO = `function photo(seed){
  const c=document.createElement('canvas'); c.width=600; c.height=800;
  const x=c.getContext('2d');
  x.fillStyle='#FDFBF6'; x.fillRect(0,0,600,800);
  x.strokeStyle='#DCE3EE'; x.lineWidth=2;
  for(let y=90;y<770;y+=46){ x.beginPath(); x.moveTo(45,y); x.lineTo(555,y); x.stroke(); }
  x.strokeStyle='#33436B'; x.lineWidth=4; x.lineCap='round';
  let r=seed; const rnd=()=>{ r=(r*1103515245+12345)&0x7fffffff; return r/0x7fffffff; };
  for(let y=90;y<760;y+=46){ let cx=60; const words=3+Math.floor(rnd()*3);
    for(let w=0;w<words;w++){ const len=50+rnd()*90;
      x.beginPath(); x.moveTo(cx,y-8);
      for(let s=0;s<len;s+=10) x.lineTo(cx+s, y-8-Math.sin(s/7+rnd())*6);
      x.stroke(); cx+=len+22; if(cx>470) break; } }
  return c.toDataURL('image/jpeg',0.8);
}`;

for (const pg of [T,S]) await pg.goto(L.base,{waitUntil:'domcontentloaded'});
await T.waitForTimeout(1800);

console.log('\n[선생님]');
await T.click('.welcome-start-btn'); await shot(T,'T01-역할선택');
await T.click('.role-card.teacher'); await shot(T,'T02-선생님로그인');
/* 가입 화면은 채우기만 하고 보낸다. 실제 가입은 아래에서 필요할 때만 한다. */
await T.click('#page-t-name-input .auth-signup-link'); await T.waitForTimeout(400);
await T.fill('#signupName',TNAME); await T.fill('#signupPw','Teach2026!');
await T.fill('#signupPwConfirm','Teach2026!'); await T.check('#agreeTerms');
await shot(T,'T03-선생님가입');

/* 이 스크립트는 여러 번 돌린다. 지난번에 만든 계정이 남아 있으면 가입이 막히므로
   먼저 로그인을 해 보고, 안 되면 그때 가입한다. */
async function goTeacherLogin(){
  await T.evaluate(()=>showPage('welcome')); await T.waitForTimeout(400);
  await T.click('.welcome-start-btn'); await T.waitForTimeout(300);
  await T.click('.role-card.teacher'); await T.waitForTimeout(400);
}
await goTeacherLogin();
await T.fill('#tchLoginName',TNAME); await T.fill('#tchLoginPw','Teach2026!');
await T.click('#page-t-name-input .auth-submit');
let loggedIn = await waitPage(T,'page-t-home',20000);
if (!loggedIn) {
  console.log('   (계정이 없어 새로 가입합니다)');
  await goTeacherLogin();
  await T.click('#page-t-name-input .auth-signup-link'); await T.waitForTimeout(400);
  await T.fill('#signupName',TNAME); await T.fill('#signupPw','Teach2026!');
  await T.fill('#signupPwConfirm','Teach2026!'); await T.check('#agreeTerms');
  await T.click('#page-signup .auth-submit');
  await T.locator('#signupDoneModal').waitFor({state:'visible',timeout:60000});
  await T.click('#signupDoneModal button:has-text("확인")'); await T.waitForTimeout(700);
  await goTeacherLogin();
  await T.fill('#tchLoginName',TNAME); await T.fill('#tchLoginPw','Teach2026!');
  await T.click('#page-t-name-input .auth-submit');
  loggedIn = await waitPage(T,'page-t-home',30000);
}
if(!loggedIn) throw new Error('선생님 로그인 실패: '+await active(T));

/* 지난번 자료가 남아 있으면 화면이 지저분해진다. 반을 모두 지우고 시작한다.
   로그인 직후에는 서버 자료가 아직 안 와서 0개로 보인다. 잠시 기다렸다 센다. */
await T.waitForTimeout(5000);
let wiped = 0;
for (let guard=0; guard<12; guard++){
  const n = await T.evaluate(()=>classes.length);
  if (n === 0) break;
  await T.evaluate(()=>showPage('t-home')); await T.waitForTimeout(500);
  await T.click('#page-t-home .nav-item[data-nav="t-students"]'); await T.waitForTimeout(700);
  await T.click('#page-t-students .student-card'); await T.waitForTimeout(900);
  await T.evaluate(()=>openClassActions()); await T.waitForTimeout(350);
  await T.evaluate(()=>openDeleteClassConfirm()); await T.waitForTimeout(350);
  await T.fill('#delClassPw','Teach2026!');
  await T.evaluate(()=>confirmDeleteClass());
  if(!await waitFor(T,`classes.length < ${n}`, 30000)) throw new Error('반 삭제 실패');
  wiped++;
  await T.waitForTimeout(600);
}
if (wiped) console.log('   지난 반 '+wiped+'개 지움');
if (await T.evaluate(()=>classes.length) !== 0) throw new Error('반이 남아 있음');
await T.evaluate(()=>showPage('t-home')); await T.waitForTimeout(800);
await shot(T,'T04-홈_반없음');

/* 로그인 직후에는 서버 자료가 뒤늦게 도착하면서 화면이 다시 그려진다.
   그 사이에 반 만들기를 누르면 홈으로 되돌아온다. 화면이 실제로 바뀔 때까지 다시 누른다. */
for (let i=0; i<8; i++){
  await T.evaluate(()=>startAddClass('t-home'));
  if (await waitPage(T,'page-t-class-setup',3000)) break;
  await T.waitForTimeout(1000);
}
if (await active(T)!=='page-t-class-setup') throw new Error('반 만들기 화면으로 못 감: '+await active(T));
await T.locator('#classInput').waitFor({state:'visible',timeout:20000});
await T.fill('#classInput','중2 영어 A반'); await shot(T,'T05-반만들기');
await T.click('#classConfirmBtn');
if(!await waitFor(T,()=>classes.length===1&&!!classes[0].id,40000)) throw new Error('반 생성 실패: '+await T.evaluate(()=>classes.length)+'개');
await T.waitForTimeout(800); await shot(T,'T06-홈_반있음');

await T.click('#page-t-home .nav-item[data-nav="t-students"]'); await T.waitForTimeout(700);
await T.click('#page-t-students .student-card'); await T.waitForTimeout(900);
await T.evaluate(()=>toggleAddStuForm()); await T.waitForTimeout(500);
await T.fill('#newStuNames','이준호\n박지민\n최유나'); await shot(T,'T07-학생이름넣기');
await T.click('#newStuConfirmBtn');
await T.locator('#issuedModal').waitFor({state:'visible',timeout:90000});
const issued = await T.evaluate(()=>lastIssued.map(m=>({name:m.name,id:m.id,pw:m.pw})));
console.log('   발급:', JSON.stringify(issued));
await shot(T,'T08-발급된계정');
await T.click('#issuedModal button:has-text("확인")'); await T.waitForTimeout(700);
await shot(T,'T09-학생명단');

await T.evaluate(()=>switchDetailTab('homework')); await T.waitForTimeout(700);
await T.evaluate(()=>toggleAddHwForm()); await T.waitForTimeout(500);
await T.fill('#newHwTitle','단어 시험 범위 1~30');
await T.fill('#newHwDesc','Unit 5 단어 외우고 공책에 3번씩 쓰기');
await shot(T,'T10-숙제내기');
await T.click('#newHwConfirmBtn');
await waitFor(T,()=>classes[0].homeworks.length===1);
await T.evaluate(()=>toggleAddHwForm()); await T.waitForTimeout(400);
await T.fill('#newHwTitle','교과서 45쪽 문제 풀기'); await T.fill('#newHwDesc','1번~8번까지');
await T.click('#newHwConfirmBtn');
await waitFor(T,()=>classes[0].homeworks.length===2);
await T.waitForTimeout(700); await shot(T,'T11-숙제목록');

console.log('\n[선생님] 공지');
await T.click('#page-t-class-detail .nav-item[data-nav="t-home"]').catch(()=>{});
await T.evaluate(()=>showPage('t-home')); await T.waitForTimeout(600);
await T.evaluate(()=>openNoticeWrite()); await T.waitForTimeout(600);
await T.fill('#noticeText','이번 주 금요일은 수업이 없습니다. 숙제는 다음 주 월요일까지 내면 됩니다.');
await T.evaluate(()=>{ const el=document.querySelector('#noticeClassPick input'); if(el&&!el.checked) el.click(); });
await shot(T,'T12-공지쓰기');
await T.evaluate(()=>confirmNotice()); await T.waitForTimeout(1500);
await shot(T,'T13-선생님홈_공지');

console.log('\n[학생]');
const stu = issued[0];
await S.click('.welcome-start-btn'); await S.waitForTimeout(300);
await S.click('.role-card.student'); await shot(S,'S01-학생로그인');
await S.fill('#stuLoginName',stu.id); await S.fill('#stuLoginPw',stu.pw);
await S.click('#page-name-input .auth-submit');
/* 반 정보가 늦게 오면 반 목록 화면으로 들어간다. 그때는 반을 눌러 들어간다. */
if(!await waitFor(S,()=>{
  const p=(document.querySelector('.page.active')||{}).id;
  return p==='page-home'||p==='page-s-classes';
},40000)) throw new Error('학생 로그인 실패: '+await active(S));
if (await active(S)==='page-s-classes'){
  /* 반 목록은 들어올 때 한 번만 그려진다. 서버 자료가 그 뒤에 도착하면
     목록이 빈 채로 남는다. 자료가 올 때까지 기다렸다가 반으로 들어간다. */
  if(!await waitFor(S,()=>myStudentClasses().length>0,60000)) throw new Error('학생 반 정보가 안 옴');
  await S.evaluate(()=>enterStudentClass(myStudentClasses()[0].i));
  await S.waitForTimeout(1200);
}
if(!await waitPage(S,'page-home',30000)) throw new Error('학생 홈으로 못 감: '+await active(S));
const needPw = await waitFor(S,()=>document.getElementById('pwChangeModal').classList.contains('show'),20000);
if (needPw) {
  await shot(S,'S02-첫로그인_비번정하기');
  await S.fill('#newPw','Junho2026!'); await S.fill('#newPw2','Junho2026!');
  await S.click('#pwChangeModal button:has-text("변경")');
  await waitFor(S,()=>!document.getElementById('pwChangeModal').classList.contains('show'),30000);
}
await S.waitForTimeout(1500); await shot(S,'S03-학생홈');

const hwId = await S.evaluate(()=>classes[0].homeworks[0].id);
await S.evaluate(id=>openDetailCard(id), hwId);
await S.locator('#submitBtn').waitFor({state:'visible',timeout:20000});
await shot(S,'S04-숙제상세');
/* evaluate 는 넘긴 글자를 '식'으로 읽는다. function 선언으로 시작하면
   함수 식으로 읽혀 뒤에 붙는 문장에서 문법 오류가 난다. 즉시 실행 함수로 감싼다. */
await S.evaluate(`(() => { ${PHOTO}
  uploadedPhotos=[photo(7),photo(23)];
  renderPhotoSection(document.getElementById('photoCount'),document.getElementById('thumbRow'),uploadedPhotos,true,()=>{});
  document.getElementById('teacherNote').value='단어 3번씩 다 썼습니다!';
})()`);
await shot(S,'S05-사진올리기');
await S.click('#submitBtn');
await waitFor(S,()=>classes[0].submissions.length===1&&Cloud.pending===0);
await S.waitForTimeout(1200); await shot(S,'S06-제출완료');

await S.evaluate(()=>showPage('home')); await S.waitForTimeout(800);
await S.click('#page-home .nav-item[data-nav="calendar"]'); await S.waitForTimeout(1200);
await shot(S,'S07-학생달력');
await S.evaluate(()=>showPage('mypage')); await S.waitForTimeout(900);
await shot(S,'S08-학생마이페이지');

console.log('\n[선생님] 제출 확인 → 승인');
await T.evaluate(()=>showPage('t-home')); await T.waitForTimeout(500);
await T.click('#page-t-home .nav-item[data-nav="t-students"]'); await T.waitForTimeout(700);
await T.click('#page-t-students .student-card'); await T.waitForTimeout(900);
await waitFor(T,()=>classes[0].submissions.length===1,40000);
await T.evaluate(()=>switchDetailTab('homework')); await T.waitForTimeout(800);
await shot(T,'T14-제출현황');
const hwIdT = await T.evaluate(()=>classes[0].homeworks[0].id);
let got=false;
for(let i=0;i<8&&!got;i++){
  await T.evaluate(async ([n,h])=>{ await openSubmissionPreview(n,h); },[stu.name,hwIdT]);
  got = await T.evaluate(()=>{const s=classes[0].submissions[0]; return !!(s&&s.photosLoaded&&s.photos.length);});
  if(!got) await T.waitForTimeout(1500);
}
await T.waitForTimeout(600); await shot(T,'T15-제출물보기');
await T.evaluate(([n,h])=>approveSubmission(n,h),[stu.name,hwIdT]);
await waitFor(T,()=>classes[0].submissions[0].status==='approved',25000);
await T.waitForTimeout(900); await shot(T,'T16-승인후');

await T.evaluate(()=>openTeacherHomeworkCalendar()); await T.waitForTimeout(1200);
await shot(T,'T17-선생님달력');
await T.evaluate(()=>showPage('t-mypage')); await T.waitForTimeout(900);
await shot(T,'T18-선생님마이페이지');

console.log('\n[학생] 승인 결과');
await waitFor(S,()=>classes[0].submissions[0]&&classes[0].submissions[0].status==='approved',35000);
await S.evaluate(()=>showPage('home')); await S.waitForTimeout(1200);
await shot(S,'S09-승인받은뒤');
await S.evaluate(()=>showPage('list')); await S.waitForTimeout(1000);
await shot(S,'S10-지난숙제');

console.log('\n에러:', errs.length); errs.forEach(e=>console.log('  ❌',e));
await b.close();
})().catch(e=>{ console.error('실패:', e.message); process.exit(1); });
