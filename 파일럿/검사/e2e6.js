/* 구글 로그인: 계정 만들기 경로 + 오류 갈래 + 학생 화면 영향 없음 */
const { chromium } = require('playwright');
const L = require('./fblaunch');
const TAG=Date.now().toString(36).slice(-5);
const fails=[]; const ok=(l,c,x)=>{console.log(`${c?'  ✅':'  ❌'} ${l}${x?' — '+x:''}`); if(!c)fails.push(l);};
(async()=>{
const b=await chromium.launch({executablePath:L.exe,headless:true,args:L.args});
const ctx=await b.newContext({viewport:{width:420,height:900}});
const P=await ctx.newPage();
await L.useLocalSdk(ctx);
const errs=[]; P.on('pageerror',e=>errs.push(e.message));
const active=()=>P.evaluate(()=>(document.querySelector('.page.active')||{}).id);
async function waitPage(id,ms=30000){const t0=Date.now();while(Date.now()-t0<ms){if(await active()===id)return true;await P.waitForTimeout(200);}return false;}
async function waitFor(fn,ms=30000){const t0=Date.now();while(Date.now()-t0<ms){try{if(await P.evaluate(fn))return true;}catch(e){}await P.waitForTimeout(200);}return false;}

await P.goto(L.base,{waitUntil:'domcontentloaded'});
await P.waitForTimeout(1600);

console.log('[연결 확인]');
const wired = await P.evaluate(()=>({
  popup: typeof (window.FB||{}).googlePopup,
  redirect: typeof (window.FB||{}).googleRedirect,
  result: typeof (window.FB||{}).googleRedirectResult,
  authDomain: (window.FB&&window.FB.auth&&window.FB.auth.config)?window.FB.auth.config.authDomain:'?',
}));
console.log('   ',JSON.stringify(wired));
ok('구글 함수 3개 붙음', wired.popup==='function'&&wired.redirect==='function'&&wired.result==='function');
ok('구글에 등록된 authDomain을 씀', wired.authDomain==='today-homework.firebaseapp.com', wired.authDomain);

/* 돌아왔는데 결과가 비어 있는 경우(사파리 등)에도 멈추지 않는지 */
await P.evaluate(()=>{ window.FB.googleRedirectResult=()=>Promise.resolve(null); });
await P.evaluate(()=>{ sessionStorage.setItem('googleRedirect','1'); });
await P.evaluate(()=>handleGoogleRedirect());
await P.waitForTimeout(1200);
const stuck = await P.evaluate(()=>({
  화면:(document.querySelector('.page.active')||{}).id,
  안내:document.getElementById('tchLoginError').classList.contains('show')
    ? document.getElementById('tchLoginError').textContent : '',
  잠김:Cloud.signingUp, 표시:sessionStorage.getItem('googleRedirect'),
}));
console.log('   ',JSON.stringify(stuck));
ok('돌아왔는데 결과가 없으면 로그인 화면으로', stuck.화면==='page-t-name-input' && stuck.안내.includes('한 번 더'));
ok('멈추지 않음', stuck.잠김===false && stuck.표시===null);
await P.reload({waitUntil:'domcontentloaded'}); await P.waitForTimeout(1600);

console.log('\n[버튼 위치]');
await P.click('.welcome-start-btn'); await P.waitForTimeout(300);
await P.click('.role-card.teacher'); await P.waitForTimeout(400);
const btns = await P.evaluate(()=>({
  선생: document.querySelectorAll('#page-t-name-input .google-btn').length,
  학생: document.querySelectorAll('#page-name-input .google-btn').length,
  글자: (document.getElementById('tchGoogleBtn')||{}).innerText,
}));
console.log('   ',JSON.stringify(btns));
ok('선생님 화면에만 구글 버튼', btns.선생===1 && btns.학생===0);
ok('버튼 글자', (btns.글자||'').includes('구글'), btns.글자);

console.log('\n[오류 갈래]');
async function stubThrow(code){
  await P.evaluate((c)=>{ window.FB.googlePopup=()=>{const e=new Error('stub');e.code=c;return Promise.reject(e);}; },code);
}
await stubThrow('auth/operation-not-allowed');
await P.click('#tchGoogleBtn'); await P.waitForTimeout(900);
ok('콘솔 꺼져 있으면 안내', (await P.textContent('#tchLoginError')).includes('구글 로그인을 쓸 수 없어요'), await P.textContent('#tchLoginError'));
ok('막혀도 잠기지 않음', await P.evaluate(()=>Cloud.signingUp===false && authBusy===false));

await stubThrow('auth/popup-closed-by-user');
await P.evaluate(()=>{clearAuthError('tchLoginError');});
await P.click('#tchGoogleBtn'); await P.waitForTimeout(900);
const quiet = await P.evaluate(()=>document.getElementById('tchLoginError').classList.contains('show'));
ok('사용자가 닫으면 조용히', quiet===false, quiet?'경고가 떴음':'아무 말 없음');
ok('닫아도 잠기지 않음', await P.evaluate(()=>Cloud.signingUp===false && authBusy===false));

await P.evaluate(()=>{
  window.__redirected=false;
  const e=new Error('stub'); e.code='auth/popup-blocked';
  window.FB.googlePopup=()=>Promise.reject(e);
  window.FB.googleRedirect=()=>{window.__redirected=true;return new Promise(()=>{});};
});
await P.click('#tchGoogleBtn'); await P.waitForTimeout(1200);
const rd = await P.evaluate(()=>({갔음:window.__redirected, 표시:sessionStorage.getItem('googleRedirect')}));
console.log('   ',JSON.stringify(rd));
ok('창이 막히면 화면 옮기기로 넘어감', rd.갔음===true && rd.표시==='1');
await P.evaluate(()=>{sessionStorage.removeItem('googleRedirect'); Cloud.signingUp=false; setAuthBusy(document.getElementById('tchGoogleBtn'),false);});

console.log('\n[계정 만들기 — 진짜 uid로]');
/* 구글 토큰 교환만 빼고, 그 뒤 경로를 실제 서버로 그대로 밟는다 */
const uid = await P.evaluate(async (tag)=>{
  Cloud.signingUp = true;
  return await Cloud.signUp('g'+tag, 'Google2026!');   /* 계정 문서는 만들지 않는다 */
}, TAG);
ok('진짜 uid 확보', !!uid, uid);
await P.evaluate((u)=>openGoogleSetup({uid:u, email:'teacher'+u.slice(0,4)+'@gmail.com', displayName:'김선생'}), uid);
await waitFor(()=>document.getElementById('googleSetupModal').classList.contains('show'),8000);
const pre = await P.evaluate(()=>({
  이름칸: document.getElementById('googleName').value,
  메일줄: document.getElementById('googleEmail').textContent,
}));
console.log('   ',JSON.stringify(pre));
ok('구글 이름이 미리 채워짐', pre.이름칸==='김선생', pre.이름칸);
ok('어느 구글 계정인지 보임', pre.메일줄.includes('@gmail.com'), pre.메일줄);

await P.click('#googleSetupBtn'); await P.waitForTimeout(700);
ok('동의 없으면 거부', (await P.textContent('#googleSetupMsg')).includes('동의'), await P.textContent('#googleSetupMsg'));
await P.fill('#googleName',''); await P.check('#googleAgree');
await P.click('#googleSetupBtn'); await P.waitForTimeout(700);
ok('이름 없으면 거부', (await P.textContent('#googleSetupMsg')).includes('이름'), await P.textContent('#googleSetupMsg'));

await P.fill('#googleName','김선생');
await P.click('#googleSetupBtn');
ok('★ 선생님 홈으로 들어감', await waitPage('page-t-home',30000), await active());
const made = await P.evaluate(()=>({
  이름표: document.getElementById('teacherNameLabel').textContent,
  내역할: (users[0]||{}).role,
  구글표시: (users[0]||{}).google,
  잠김: Cloud.signingUp,
}));
console.log('   ',JSON.stringify(made));
ok('선생님으로 저장됨', made.내역할==='teacher' && made.구글표시===true);
ok('이름표가 맞음', made.이름표==='김선생 선생님', made.이름표);
ok('가입 잠금 풀림', made.잠김===false);

console.log('\n[마이페이지]');
await P.evaluate(()=>openMyPage()); await waitPage('page-t-mypage');
await P.waitForTimeout(500);
const my = await P.evaluate(()=>{
  const el=document.getElementById('t-pwChangeRow');
  return { 비번줄: el.hidden, 실제로보임: el.offsetParent!==null,
           로그아웃: [...document.querySelectorAll('#page-t-mypage button')].some(b=>b.textContent.includes('로그아웃')) };
});
console.log('   ',JSON.stringify(my));
ok('비밀번호 변경이 보임', my.비번줄===false && my.실제로보임===true);
await P.click('#t-pwChangeRow'); await P.waitForTimeout(600);
const gpw = await P.evaluate(()=>({
  안내열림: document.getElementById('googlePwModal').classList.contains('show'),
  비번창: document.getElementById('pwChangeModal').classList.contains('show'),
  글: document.getElementById('googlePwModal').innerText.replace(/\n+/g,' '),
}));
console.log('   ',JSON.stringify(gpw));
ok('★ 눌러도 못 바꾼다고 알려 줌', gpw.안내열림===true && gpw.비번창===false && gpw.글.includes('구글'));
await P.click('#googlePwModal button:has-text("확인")'); await P.waitForTimeout(400);
ok('로그아웃은 그대로 있음', my.로그아웃===true);

console.log('\n[반 만들기 — 보통 계정처럼 되는지]');
await P.evaluate(()=>showPage('t-home')); await P.waitForTimeout(400);
await P.evaluate(()=>startAddClass('t-home'));
await P.locator('#classInput').waitFor({state:'visible',timeout:20000});
await P.fill('#classInput','구글반'); await P.click('#classConfirmBtn');
ok('반이 서버에 만들어짐', await waitFor(()=>classes.length===1&&!!classes[0].id,25000));

console.log('\n[새로고침]');
ok('저장이 서버까지 끝남', await waitFor(()=>Cloud.pending===0 && Cloud.failed!==true, 25000),
   JSON.stringify(await P.evaluate(()=>({남은:Cloud.pending, 실패:Cloud.failed}))));
await P.reload({waitUntil:'domcontentloaded'});
ok('로그인 유지 + 홈으로', await waitPage('page-t-home',30000), await active());
const after = await P.evaluate(()=>({반:classes.length, 이름:(users[0]||{}).name, 구글:(users[0]||{}).google}));
console.log('   ',JSON.stringify(after));
ok('자료 유지', after.반===1 && after.이름==='김선생' && after.구글===true);

console.log('\n[그만두기]');
await P.evaluate(async()=>{ await Cloud.deleteMyAccount(userById(currentUserId)); });
await P.waitForTimeout(2500);

console.log('\n오류',errs.length); errs.slice(0,5).forEach(e=>console.log('  ❌',e.slice(0,140)));
console.log(fails.length===0&&errs.length===0?'\n🎉 통과':`\n⚠️ 실패 ${fails.length} / 오류 ${errs.length}`);
await b.close();})();
