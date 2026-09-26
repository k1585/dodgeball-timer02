/* 진행 바 제거 + 반 코드 제거 */
const { chromium } = require('playwright');
const L = require('./fblaunch');
const TAG=Date.now().toString(36).slice(-5), TNAME='번호정리'+TAG;
const fails=[]; const ok=(l,c,x)=>{console.log(`${c?'  ✅':'  ❌'} ${l}${x?' — '+x:''}`); if(!c)fails.push(l);};
(async()=>{
const b=await chromium.launch({executablePath:L.exe,headless:true,args:L.args});
const ctxT=await b.newContext({viewport:{width:420,height:900},acceptDownloads:true});
const ctxS=await b.newContext({viewport:{width:420,height:900}});
const T=await ctxT.newPage(), S=await ctxS.newPage();
await L.useLocalSdk(ctxT); await L.useLocalSdk(ctxS);
const errs=[]; [T,S].forEach((p,i)=>p.on('pageerror',e=>errs.push((i?'학생':'선생')+': '+e.message)));
const active=pg=>pg.evaluate(()=>(document.querySelector('.page.active')||{}).id);
async function waitPage(pg,id,ms=30000){const t0=Date.now();while(Date.now()-t0<ms){if(await active(pg)===id)return true;await pg.waitForTimeout(200);}return false;}
async function waitFor(pg,fn,ms=30000){const t0=Date.now();while(Date.now()-t0<ms){try{if(await pg.evaluate(fn))return true;}catch(e){}await pg.waitForTimeout(200);}return false;}
const settle=pg=>waitFor(pg,()=>Cloud.pending===0,25000);

for(const pg of [T,S]) await pg.goto(L.base,{waitUntil:'domcontentloaded'});
await T.waitForTimeout(1600);

console.log('[1] 오른쪽 위 긴 바');
await T.click('.welcome-start-btn'); await T.waitForTimeout(500);
const bar = await T.evaluate(()=>({
  역할화면: (document.querySelector('.page.active')||{}).id,
  점: document.querySelectorAll('#page-role-select .progress-dots').length,
  전체: document.querySelectorAll('.progress-dots').length,
  뒤로가기: document.querySelectorAll('#page-role-select .ob-back-btn').length,
}));
console.log('   ',JSON.stringify(bar));
ok('역할 화면에 긴 바 없음', bar.역할화면==='page-role-select' && bar.점===0);
ok('앱 어디에도 안 남음', bar.전체===0, bar.전체+'개');
ok('뒤로가기는 그대로', bar.뒤로가기===1);

console.log('\n[2] 반 코드 없애기 — 화면');
const gone = await T.evaluate(()=>({
  코드입력화면: !!document.getElementById('page-code-input'),
  코드공개화면: !!document.getElementById('page-t-code-reveal'),
  학생안내: (document.querySelector('#page-role-select .role-card.student .role-text p')||{}).textContent,
}));
console.log('   ',JSON.stringify(gone));
ok('코드 입력 화면 사라짐', gone.코드입력화면===false);
ok('코드 공개 화면 사라짐', gone.코드공개화면===false);
ok('학생 안내가 아이디로 바뀜', (gone.학생안내||'').includes('아이디') && !(gone.학생안내||'').includes('코드'), gone.학생안내);

await T.click('.role-card.teacher'); await T.waitForTimeout(300);
await T.click('#page-t-name-input .auth-signup-link'); await T.waitForTimeout(400);
await T.fill('#signupName',TNAME); await T.fill('#signupPw','Teach2026!');
await T.fill('#signupPwConfirm','Teach2026!'); await T.check('#agreeTerms');
await T.click('#page-signup .auth-submit');
await T.locator('#signupDoneModal').waitFor({state:'visible',timeout:30000});
await T.click('#signupDoneModal button:has-text("확인")'); await T.waitForTimeout(600);
await T.click('.welcome-start-btn'); await T.waitForTimeout(300);
await T.click('.role-card.teacher'); await T.waitForTimeout(300);
await T.fill('#tchLoginName',TNAME); await T.fill('#tchLoginPw','Teach2026!');
await T.click('#page-t-name-input .auth-submit'); await waitPage(T,'page-t-home');

console.log('\n[2] 반 만들면 코드 화면 없이 바로 끝');
await T.evaluate(()=>startAddClass('t-home'));
await T.locator('#classInput').waitFor({state:'visible',timeout:20000});
await T.fill('#classInput','중2 영어 A반'); await T.click('#classConfirmBtn');
ok('★ 코드 화면 안 거치고 바로 돌아옴', await waitPage(T,'page-t-home',20000), await active(T));
ok('반은 제대로 만들어짐', await waitFor(T,()=>classes.length===1&&!!classes[0].id,20000));
await settle(T);
const code = await T.evaluate(()=>classes[0].code);
console.log('    속으로 가진 번호:', code);
ok('반 구분 번호는 속으로 유지', !!code && /^\d{6}$/.test(code), code);

await T.click('#page-t-home .nav-item[data-nav="t-students"]'); await T.waitForTimeout(700);
const listMeta = await T.evaluate(()=>(document.querySelector('#page-t-students .student-meta')||{}).textContent);
console.log('    반 목록 줄:', JSON.stringify(listMeta));
ok('반 목록에 코드 안 보임', !!listMeta && !listMeta.includes('코드'), listMeta);

await T.click('#page-t-students .student-card'); await T.waitForTimeout(900);
const detail = await T.evaluate(()=>({
  칩: document.querySelectorAll('#page-t-class-detail .detail-code-chip').length,
  글: document.getElementById('page-t-class-detail').innerText.includes('코드'),
}));
console.log('   ',JSON.stringify(detail));
ok('반 상세에도 코드 없음', detail.칩===0 && detail.글===false);

console.log('\n[2] 계정 발급은 그대로 되는지');
await T.evaluate(()=>toggleAddStuForm()); await T.waitForTimeout(400);
await T.fill('#newStuNames','이준호');
await T.click('#newStuConfirmBtn');
await T.locator('#issuedModal').waitFor({state:'visible',timeout:60000});
await T.waitForTimeout(600);
const issued=await T.evaluate(()=>lastIssued[0]);
console.log('    발급:', JSON.stringify(issued));
ok('아이디가 반 번호로 시작', issued.id.startsWith(code.slice(0,3)), issued.id+' / 반번호 '+code);
const dl = await Promise.all([
  T.waitForEvent('download',{timeout:15000}),
  T.click('#issuedModal button:has-text("표로 저장")'),
]).then(r=>r[0]).catch(()=>null);
ok('표 저장도 그대로', !!dl && dl.suggestedFilename()==='students-'+code+'.csv', dl?dl.suggestedFilename():'없음');
await T.click('#issuedModal button:has-text("확인")'); await T.waitForTimeout(500);

console.log('\n[2] 학생은 아이디만으로 들어감');
await S.click('.welcome-start-btn'); await S.waitForTimeout(300);
await S.click('.role-card.student'); await S.waitForTimeout(400);
await S.fill('#stuLoginName',issued.id); await S.fill('#stuLoginPw','@abcd1234');
await S.click('#page-name-input .auth-submit');
ok('★ 코드 없이 로그인', await waitPage(S,'page-home',30000), await active(S));
await waitFor(S,()=>document.getElementById('pwChangeModal').classList.contains('show'),15000);
await S.fill('#newPw','Junho2026!'); await S.fill('#newPw2','Junho2026!');
await S.click('#pwChangeModal button:has-text("변경")');
await waitFor(S,()=>!document.getElementById('pwChangeModal').classList.contains('show'),25000);
ok('반이 바로 붙어 있음', await waitFor(S,()=>classes.length===1,25000));
const sView = await S.evaluate((code)=>{
  openStudentClasses();
  const t = document.getElementById('page-s-classes').innerText;
  return { 코드숫자: t.includes(code), 코드글자: t.includes('코드'), 본문: t.replace(/\n+/g,' | ') };
}, code);
console.log('   ',JSON.stringify(sView));
ok('학생 화면에 반 번호 안 보임', sView.코드숫자===false && sView.코드글자===false, sView.본문);

await T.evaluate(async()=>{ await Cloud.deleteMyAccount(userById(currentUserId)); });
await T.waitForTimeout(2500);

console.log('\n오류',errs.length); errs.slice(0,6).forEach(e=>console.log('  ❌',e.slice(0,140)));
console.log(fails.length===0&&errs.length===0?'\n🎉 통과':`\n⚠️ 실패 ${fails.length} / 오류 ${errs.length}`);
fails.forEach(f=>console.log('   -',f));
await b.close();})();
