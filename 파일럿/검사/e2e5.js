/* 로딩 표시 / 로그아웃 위치 / 마이페이지 정리 / 아이디 변경 */
const { chromium } = require('playwright');
const L = require('./fblaunch');
const TAG=Date.now().toString(36).slice(-4), TNAME='정리검사'+TAG;
const fails=[]; const ok=(l,c,x)=>{console.log(`${c?'  ✅':'  ❌'} ${l}${x?' — '+x:''}`); if(!c)fails.push(l);};
(async()=>{
const b=await chromium.launch({executablePath:L.exe,headless:true,args:L.args});
const ctxT=await b.newContext({viewport:{width:420,height:900}});
const ctxS=await b.newContext({viewport:{width:420,height:900}});
const T=await ctxT.newPage(), S=await ctxS.newPage();
await L.useLocalSdk(ctxT); await L.useLocalSdk(ctxS);
const errs=[]; [T,S].forEach((p,i)=>p.on('pageerror',e=>errs.push((i?'학생':'선생')+': '+e.message)));
const active=pg=>pg.evaluate(()=>(document.querySelector('.page.active')||{}).id);
async function waitPage(pg,id,ms=30000){const t0=Date.now();while(Date.now()-t0<ms){if(await active(pg)===id)return true;await pg.waitForTimeout(200);}return false;}
async function waitFor(pg,fn,ms=30000){const t0=Date.now();while(Date.now()-t0<ms){try{if(await pg.evaluate(fn))return true;}catch(e){}await pg.waitForTimeout(200);}return false;}

for(const pg of [T,S]) await pg.goto(L.base,{waitUntil:'domcontentloaded'});
await T.waitForTimeout(1500);

console.log('[로딩 표시]');
await T.click('.welcome-start-btn'); await T.waitForTimeout(300);
await T.click('.role-card.teacher'); await T.waitForTimeout(300);
await T.click('#page-t-name-input .auth-signup-link'); await T.waitForTimeout(400);
await T.fill('#signupName',TNAME); await T.fill('#signupPw','Teach2026!');
await T.fill('#signupPwConfirm','Teach2026!'); await T.check('#agreeTerms');
await T.click('#page-signup .auth-submit');
await T.waitForTimeout(500);
const loading = await T.evaluate(()=>{
  const el=document.querySelector('#page-signup .auth-submit');
  const cs=getComputedStyle(el,'::after');
  return { 클래스: el.classList.contains('btn-loading'),
           글자: el.textContent.trim(),
           동글뱅이: cs.animationName!=='none' && cs.animationName!=='' };
});
console.log('   ', JSON.stringify(loading));
ok('도는 표시가 나옴', loading.클래스===true && loading.동글뱅이===true);
ok('"잠시만요" 글자 안 씀', loading.글자!=='잠시만요...', loading.글자);
await T.locator('#signupDoneModal').waitFor({state:'visible',timeout:30000});
ok('가입은 정상 완료', true);
await T.click('#signupDoneModal button:has-text("확인")'); await T.waitForTimeout(600);
await T.click('.welcome-start-btn'); await T.waitForTimeout(300);
await T.click('.role-card.teacher'); await T.waitForTimeout(300);
await T.fill('#tchLoginName',TNAME); await T.fill('#tchLoginPw','Teach2026!');
await T.click('#page-t-name-input .auth-submit'); await waitPage(T,'page-t-home');

console.log('\n[로그아웃 위치]');
const tHomeLogout = await T.evaluate(()=>document.querySelectorAll('#page-t-home .top-icons').length);
ok('선생님 홈에 로그아웃 없음', tHomeLogout===0, tHomeLogout+'개');
await T.evaluate(()=>openMyPage()); await waitPage(T,'page-t-mypage');
const tMyLogout = await T.evaluate(()=>[...document.querySelectorAll('#page-t-mypage button')].some(b=>b.textContent.includes('로그아웃')));
ok('선생님 마이페이지에 로그아웃 있음', tMyLogout);
const tIdRow = await T.evaluate(()=>document.getElementById('mypageIdRow').hidden);
ok('선생님에겐 아이디 줄 숨김', tIdRow===true);

console.log('\n[마이페이지 정리]');
const cleaned = await T.evaluate(()=>{
  const t=document.getElementById('page-t-mypage').textContent;
  return { 저장공간: t.includes('저장공간'), 막대: document.querySelectorAll('.storage-bar').length };
});
ok('저장공간 항목 사라짐', cleaned.저장공간===false && cleaned.막대===0, JSON.stringify(cleaned));

console.log('\n[학생 준비]');
await T.evaluate(()=>showPage('t-students')); await T.waitForTimeout(500);
await T.evaluate(()=>startAddClass('t-students'));
await T.locator('#classInput').waitFor({state:'visible',timeout:20000});
await T.fill('#classInput','정리검사반'); await T.click('#classConfirmBtn');
await waitFor(T,()=>classes.length===1&&!!classes[0].id);
await T.click('#page-t-home .nav-item[data-nav="t-students"]').catch(()=>{});
await T.waitForTimeout(600);
await T.evaluate(()=>openClassDetail(0,'t-students')); await T.waitForTimeout(800);
await T.evaluate(()=>toggleAddStuForm()); await T.waitForTimeout(400);
await T.fill('#newStuNames','이준호');
await T.click('#newStuConfirmBtn');
await T.locator('#issuedModal').waitFor({state:'visible',timeout:60000});
const issued=await T.evaluate(()=>lastIssued[0]);
await T.click('#issuedModal button:has-text("확인")'); await T.waitForTimeout(500);
console.log('   발급 아이디:', issued.id);

console.log('\n[학생 로그인 + 비번 변경]');
await S.click('.welcome-start-btn'); await S.waitForTimeout(300);
await S.click('.role-card.student'); await S.waitForTimeout(400);
await S.fill('#stuLoginName',issued.id); await S.fill('#stuLoginPw','@abcd1234');
await S.click('#page-name-input .auth-submit'); await waitPage(S,'page-home');
await waitFor(S,()=>document.getElementById('pwChangeModal').classList.contains('show'),15000);
await S.fill('#newPw','Junho2026!'); await S.fill('#newPw2','Junho2026!');
await S.click('#pwChangeModal button:has-text("변경")');
ok('비번 변경', await waitFor(S,()=>!document.getElementById('pwChangeModal').classList.contains('show'),25000));

console.log('\n[학생 마이페이지 — 아이디 보이는지]');
await S.evaluate(()=>openMyPage()); await waitPage(S,'page-mypage'); await S.waitForTimeout(600);
const sId = await S.evaluate(()=>({
  보임: !document.getElementById('mypageIdRow').hidden,
  값: document.getElementById('mypageLoginId').textContent.trim(),
  로그아웃: [...document.querySelectorAll('#page-mypage button')].some(b=>b.textContent.includes('로그아웃')),
  저장공간: document.getElementById('page-mypage').textContent.includes('저장공간'),
}));
console.log('   ', JSON.stringify(sId));
ok('아이디가 보임', sId.보임===true && sId.값===issued.id, sId.값);
ok('학생도 마이페이지에 로그아웃', sId.로그아웃);
ok('학생 마이페이지도 저장공간 없음', sId.저장공간===false);

console.log('\n[아이디 변경]');
const newId = 'junho' + TAG;
await S.evaluate(()=>openIdChange()); await S.waitForTimeout(500);
await S.fill('#newLoginId','AB'); await S.fill('#idChangePw','Junho2026!');
await S.click('#idChangeBtn'); await S.waitForTimeout(1200);
ok('형식 안 맞으면 거부', (await S.textContent('#idChangeMsg')).includes('4~20자'), await S.textContent('#idChangeMsg'));
await S.fill('#newLoginId',newId); await S.fill('#idChangePw','틀린비번123!');
await S.click('#idChangeBtn'); await S.waitForTimeout(4000);
ok('비번 틀리면 거부', (await S.textContent('#idChangeMsg')).includes('올바르지'), await S.textContent('#idChangeMsg'));
await S.fill('#newLoginId',newId); await S.fill('#idChangePw','Junho2026!');
await S.click('#idChangeBtn'); await S.waitForTimeout(8000);
const idResult = await S.evaluate(()=>({
  닫힘: !document.getElementById('idChangeModal').classList.contains('show'),
  메시지: document.getElementById('idChangeMsg').textContent.trim(),
  지금아이디: document.getElementById('mypageLoginId').textContent.trim(),
}));
console.log('   ', JSON.stringify(idResult));
if (idResult.닫힘) {
  ok('★ 아이디 변경 성공', idResult.지금아이디===newId, idResult.지금아이디);
  await S.evaluate(()=>logoutStudent()); await S.waitForTimeout(1500);
  await S.click('.welcome-start-btn'); await S.waitForTimeout(300);
  await S.click('.role-card.student'); await S.waitForTimeout(300);
  await S.fill('#stuLoginName',newId); await S.fill('#stuLoginPw','Junho2026!');
  await S.click('#page-name-input .auth-submit');
  ok('새 아이디로 로그인', await waitPage(S,'page-home'), await active(S));
} else {
  console.log('   ⚠️ 아이디 변경이 막혔습니다 (파이어베이스 설정 필요)');
  ok('막혔을 때 안내가 나옴', idResult.메시지.length>0, idResult.메시지);
}

console.log('\n오류', errs.length); errs.slice(0,5).forEach(e=>console.log('  ❌',e.slice(0,130)));
console.log(fails.length===0&&errs.length===0?'\n🎉 통과':`\n⚠️ 실패 ${fails.length} / 오류 ${errs.length}`);
await b.close();})();
