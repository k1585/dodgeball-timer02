/* 1) 승인 완료 누르면 지난 숙제로  2) 비면 안내 문구  3) 달력 동그라미 */
const { chromium } = require('playwright');
const L = require('./fblaunch');
const TAG = Date.now().toString(36).slice(-4);
const fails = [];
const ok=(l,c,x)=>{ console.log(`${c?'  ✅':'  ❌'} ${l}${x?' — '+x:''}`); if(!c) fails.push(l); };
(async()=>{
const b=await chromium.launch({executablePath:L.exe,headless:true,args:L.args});
const ctxT=await b.newContext({viewport:{width:420,height:900},deviceScaleFactor:2});
const ctxS=await b.newContext({viewport:{width:420,height:900},deviceScaleFactor:2});
const T=await ctxT.newPage(), S=await ctxS.newPage();
await L.useLocalSdk(ctxT); await L.useLocalSdk(ctxS);
const errs=[]; [T,S].forEach((p,i)=>p.on('pageerror',e=>errs.push((i?'학생':'선생')+': '+e.message)));
const active=p=>p.evaluate(()=>(document.querySelector('.page.active')||{}).id);
async function waitPage(p,id,ms=30000){const t=Date.now();while(Date.now()-t<ms){if(await active(p)===id)return true;await p.waitForTimeout(200);}return false;}
async function waitFor(p,fn,ms=30000){const t=Date.now();while(Date.now()-t<ms){try{if(await p.evaluate(fn))return true;}catch(e){}await p.waitForTimeout(200);}return false;}
for(const p of [T,S]) await p.goto(L.base,{waitUntil:'domcontentloaded'});
await T.waitForTimeout(1500);

console.log('\n[준비] 선생님 가입 → 반 → 학생 발급 → 숙제 2개');
await T.click('.welcome-start-btn'); await T.waitForTimeout(300);
await T.click('.role-card.teacher'); await T.waitForTimeout(300);
await T.click('#page-t-name-input .auth-signup-link'); await T.waitForTimeout(400);
await T.fill('#signupName','달력검사'+TAG); await T.fill('#signupPw','Teach2026!');
await T.fill('#signupPwConfirm','Teach2026!'); await T.check('#agreeTerms');
await T.click('#page-signup .auth-submit');
await T.locator('#signupDoneModal').waitFor({state:'visible',timeout:60000});
await T.click('#signupDoneModal button:has-text("확인")'); await T.waitForTimeout(600);
await T.evaluate(()=>showPage('welcome')); await T.waitForTimeout(300);
await T.click('.welcome-start-btn'); await T.waitForTimeout(300);
await T.click('.role-card.teacher'); await T.waitForTimeout(300);
await T.fill('#tchLoginName','달력검사'+TAG); await T.fill('#tchLoginPw','Teach2026!');
await T.click('#page-t-name-input .auth-submit');
if(!await waitPage(T,'page-t-home')) throw new Error('선생 로그인 실패');
for(let i=0;i<8;i++){ await T.evaluate(()=>startAddClass('t-home')); if(await waitPage(T,'page-t-class-setup',3000)) break; await T.waitForTimeout(800);}
await T.fill('#classInput','달력반'); await T.click('#classConfirmBtn');
await waitFor(T,()=>classes.length===1&&!!classes[0].id,40000);
await T.click('#page-t-home .nav-item[data-nav="t-students"]'); await T.waitForTimeout(700);
await T.click('#page-t-students .student-card'); await T.waitForTimeout(800);
await T.evaluate(()=>toggleAddStuForm()); await T.waitForTimeout(400);
await T.fill('#newStuNames','정민수'); await T.click('#newStuConfirmBtn');
await T.locator('#issuedModal').waitFor({state:'visible',timeout:90000});
const stu=(await T.evaluate(()=>lastIssued.map(m=>({name:m.name,id:m.id,pw:m.pw}))))[0];
await T.click('#issuedModal button:has-text("확인")'); await T.waitForTimeout(600);
await T.evaluate(()=>switchDetailTab('homework')); await T.waitForTimeout(600);
const today=new Date(); const iso=d=>d.toISOString().slice(0,10);
for(const [t,desc] of [['숙제 가','가'],['숙제 나','나']]){
  await T.evaluate(()=>toggleAddHwForm()); await T.waitForTimeout(400);
  await T.fill('#newHwTitle',t); await T.fill('#newHwDesc',desc);
  await T.evaluate(d=>{const el=document.getElementById('newHwDue'); if(el){el.value=d; el.dispatchEvent(new Event('change',{bubbles:true}));}}, iso(today));
  await T.click('#newHwConfirmBtn'); await T.waitForTimeout(800);
}
await waitFor(T,()=>classes[0].homeworks.length===2,30000);
ok('숙제 2개 준비', await T.evaluate(()=>classes[0].homeworks.length)===2);

console.log('\n[학생] 로그인');
await S.click('.welcome-start-btn'); await S.waitForTimeout(300);
await S.click('.role-card.student'); await S.waitForTimeout(400);
await S.fill('#stuLoginName',stu.id); await S.fill('#stuLoginPw',stu.pw);
await S.click('#page-name-input .auth-submit');
if(!await waitFor(S,()=>{const p=(document.querySelector('.page.active')||{}).id;return p==='page-home'||p==='page-s-classes';},40000)) throw new Error('학생 로그인 실패');
if(await waitFor(S,()=>document.getElementById('pwChangeModal').classList.contains('show'),15000)){
  await S.fill('#newPw','Minsu2026!'); await S.fill('#newPw2','Minsu2026!');
  await S.click('#pwChangeModal button:has-text("변경")');
  await waitFor(S,()=>!document.getElementById('pwChangeModal').classList.contains('show'),30000);
}
await waitPage(S,'page-home',30000);

console.log('\n[2] 아무것도 없을 때 안내 문구');
await S.evaluate(()=>{ showPage('list'); selectTab('pending'); }); await S.waitForTimeout(900);
let st = await S.evaluate(()=>({
  안내보임: !document.getElementById('pendingEmpty').hidden,
  글: document.getElementById('pendingEmpty').textContent.trim(),
  목록수: document.getElementById('pendingList').children.length,
}));
console.log('   ',JSON.stringify(st));
ok('★ 비었을 때 안내가 뜸', st.안내보임===true && st.목록수===0, st.글);

console.log('\n[학생] 숙제 하나 제출');
const hwId = await S.evaluate(()=>classes[0].homeworks[0].id);
await S.evaluate(id=>openDetailCard(id), hwId);
await S.locator('#submitBtn').waitFor({state:'visible',timeout:20000});
await S.evaluate(`(() => {
  const c=document.createElement('canvas'); c.width=300;c.height=400;
  const x=c.getContext('2d'); x.fillStyle='#FDFBF6'; x.fillRect(0,0,300,400);
  x.fillStyle='#33436B'; x.font='20px sans-serif'; x.fillText('제출',110,200);
  uploadedPhotos=[c.toDataURL('image/jpeg',0.8)];
  renderPhotoSection(document.getElementById('photoCount'),document.getElementById('thumbRow'),uploadedPhotos,true,()=>{});
})()`);
await S.click('#submitBtn');
await waitFor(S,()=>classes[0].submissions.length===1&&Cloud.pending===0,40000);
await S.evaluate(()=>{ showPage('list'); selectTab('pending'); }); await S.waitForTimeout(900);
st = await S.evaluate(()=>({
  안내보임: !document.getElementById('pendingEmpty').hidden,
  목록수: document.getElementById('pendingList').children.length,
}));
ok('낸 게 있으면 안내가 사라짐', st.안내보임===false && st.목록수===1, JSON.stringify(st));

console.log('\n[선생님] 승인');
await waitFor(T,()=>classes[0].submissions.length===1,40000);
await T.evaluate(()=>switchDetailTab('homework')); await T.waitForTimeout(600);
const hwIdT = await T.evaluate(()=>classes[0].homeworks[0].id);
await T.evaluate(([n,h])=>approveSubmission(n,h),[stu.name,hwIdT]);
await waitFor(T,()=>classes[0].submissions[0].status==='approved',25000);
await waitFor(S,()=>classes[0].submissions[0]&&classes[0].submissions[0].status==='approved',35000);

console.log('\n[1] 승인 완료 칸을 누르면 지난 숙제로');
await S.evaluate(()=>{ showPage('list'); selectTab('pending'); }); await S.waitForTimeout(900);
const before = await S.evaluate(()=>({
  완료수: document.getElementById('countApproved').textContent,
  단추인가: document.querySelector('.status-box.approved').tagName,
  화살표: !!document.querySelector('.status-box.approved .status-go'),
  지금탭: document.querySelector('#page-list .tab.active').dataset.tab,
}));
console.log('   ',JSON.stringify(before));
ok('완료 칸이 누를 수 있는 단추', before.단추인가==='BUTTON' && before.화살표===true);
ok('승인이 완료로 셈', before.완료수==='1건', before.완료수);
await S.click('.status-box.approved'); await S.waitForTimeout(800);
const after = await S.evaluate(()=>({
  탭: document.querySelector('#page-list .tab.active').dataset.tab,
  보이는칸: document.querySelector('#page-list .tab-content.active').id,
  지난숙제수: document.querySelectorAll('#tab-past .hw-card').length,
}));
console.log('   ',JSON.stringify(after));
ok('★ 지난 숙제로 이동', after.탭==='past' && after.보이는칸==='tab-past');
ok('지난 숙제에 그 숙제가 있음', after.지난숙제수===1, after.지난숙제수+'건');

console.log('\n[2-b] 승인 뒤 다시 승인현황으로 오면 안내가 돌아오는지');
await S.evaluate(()=>{ showPage('list'); selectTab('pending'); }); await S.waitForTimeout(900);
const back = await S.evaluate(()=>({
  안내보임: !document.getElementById('pendingEmpty').hidden,
  목록수: document.getElementById('pendingList').children.length,
  지난숙제수: document.querySelectorAll('#tab-past .hw-card').length,
}));
console.log('   ',JSON.stringify(back));
ok('★ 승인 뒤 비면 안내가 다시 뜸', back.안내보임===true && back.목록수===0, JSON.stringify(back));

console.log('\n[3] 달력 동그라미');
/* showPage 로 바로 가면 달력이 그려지지 않는다. 아래 메뉴를 눌러 들어간다. */
await S.evaluate(()=>showPage('home')); await S.waitForTimeout(600);
await S.click('#page-home .nav-item[data-nav="calendar"]'); await S.waitForTimeout(1400);
const cal = await S.evaluate(()=>{
  const dots=[...document.querySelectorAll('#calGrid .cal-dot')];
  const one=dots[0]?getComputedStyle(dots[0]):null;
  return {
    동그라미수: dots.length,
    띠남음: document.querySelectorAll('#calGrid .cal-bars').length,
    크기: one?one.width+'x'+one.height:'-',
    둥근가: one?one.borderRadius:'-',
    색: [...new Set(dots.map(d=>[...d.classList].find(c=>c.startsWith('dot-'))))],
    범례동그라미: document.querySelectorAll('.cal-legend .cal-dot').length,
  };
});
console.log('   ',JSON.stringify(cal));
ok('★ 동그라미로 돌아옴', cal.동그라미수>0 && cal.띠남음===0);
ok('예전(5px)보다 큼', parseFloat(cal.크기)>=8, cal.크기);
ok('둥근 모양', cal.둥근가==='50%', cal.둥근가);
ok('범례도 동그라미', cal.범례동그라미===4, cal.범례동그라미+'개');
await S.screenshot({path:'cal_new.png'});
await S.evaluate(()=>{ showPage('list'); selectTab('pending'); }); await S.waitForTimeout(600);
await S.screenshot({path:'status_new.png'});

console.log('\n오류', errs.length); errs.forEach(e=>console.log('  ❌',e));
console.log(fails.length===0&&errs.length===0 ? '\n🎉 통과' : `\n⚠️ 실패 ${fails.length} / 오류 ${errs.length}`);
await b.close();
})().catch(e=>{console.error('실패:',e.message);process.exit(1);});
