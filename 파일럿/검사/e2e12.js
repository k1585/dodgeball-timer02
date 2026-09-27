/* 처음 쓰는 사람을 위한 안내(손전등) — 학생·선생님 둘 다 */
const { chromium } = require('playwright');
const L = require('./fblaunch');
const TAG = Date.now().toString(36).slice(-4);
const fails=[]; const ok=(l,c,x)=>{console.log(`${c?'  ✅':'  ❌'} ${l}${x?' — '+x:''}`); if(!c) fails.push(l);};
(async()=>{
const b=await chromium.launch({executablePath:L.exe,headless:true,args:L.args});
const ctxT=await b.newContext({viewport:{width:420,height:900},deviceScaleFactor:2});
const ctxS=await b.newContext({viewport:{width:420,height:900},deviceScaleFactor:2});
const T=await ctxT.newPage(), S=await ctxS.newPage();
await L.useLocalSdk(ctxT,{tour:true}); await L.useLocalSdk(ctxS,{tour:true});
const errs=[]; [T,S].forEach((p,i)=>p.on('pageerror',e=>errs.push((i?'학생':'선생')+': '+e.message)));
const active=p=>p.evaluate(()=>(document.querySelector('.page.active')||{}).id);
async function waitPage(p,id,ms=30000){const t=Date.now();while(Date.now()-t<ms){if(await active(p)===id)return true;await p.waitForTimeout(200);}return false;}
async function waitFor(p,fn,ms=30000){const t=Date.now();while(Date.now()-t<ms){try{if(await p.evaluate(fn))return true;}catch(e){}await p.waitForTimeout(200);}return false;}
for(const p of [T,S]) await p.goto(L.base,{waitUntil:'domcontentloaded'});
await T.waitForTimeout(1500);

console.log('\n[선생님] 가입하면 안내가 저절로 뜨는지');
await T.click('.welcome-start-btn'); await T.waitForTimeout(300);
await T.click('.role-card.teacher'); await T.waitForTimeout(300);
await T.click('#page-t-name-input .auth-signup-link'); await T.waitForTimeout(400);
await T.fill('#signupName','안내검사'+TAG); await T.fill('#signupPw','Teach2026!');
await T.fill('#signupPwConfirm','Teach2026!'); await T.check('#agreeTerms');
await T.click('#page-signup .auth-submit');
await T.locator('#signupDoneModal').waitFor({state:'visible',timeout:60000});
await T.click('#signupDoneModal button:has-text("확인")'); await T.waitForTimeout(600);
await T.evaluate(()=>showPage('welcome')); await T.waitForTimeout(300);
await T.click('.welcome-start-btn'); await T.waitForTimeout(300);
await T.click('.role-card.teacher'); await T.waitForTimeout(300);
await T.fill('#tchLoginName','안내검사'+TAG); await T.fill('#tchLoginPw','Teach2026!');
await T.click('#page-t-name-input .auth-submit');
if(!await waitPage(T,'page-t-home')) throw new Error('선생 로그인 실패');
const auto = await waitFor(T,()=>document.getElementById('tourLay').classList.contains('show'),15000);
ok('★ 첫 로그인에 저절로 뜸', auto);

console.log('\n[선생님] 단계마다 화면과 손전등');
let blind=0, tot=0;
for(let i=0;i<11;i++){
  const st = await T.evaluate(()=>{
    const h=document.getElementById('tourHole');
    const r=document.getElementById('tourCard').getBoundingClientRect();
    const hr=h.getBoundingClientRect();
    return { 단계: document.getElementById('tourStep').textContent,
      제목: document.getElementById('tourTitle').textContent,
      화면: (document.querySelector('.page.active')||{}).id,
      밝힘: h.classList.contains('none') ? null : Math.round(hr.width)+'x'+Math.round(hr.height),
      카드밖으로: r.top < 0 || r.bottom > window.innerHeight + 1,
      겹침: !h.classList.contains('none') && !(r.top >= hr.bottom || r.bottom <= hr.top),
    };
  });
  tot++; if(!st.밝힘) blind++;
  console.log('   ', JSON.stringify(st));
  if(st.카드밖으로) ok('카드가 화면 밖 ('+st.단계+')', false);
  if(st.겹침) ok('카드가 밝힌 곳을 가림 ('+st.단계+')', false);
  if(i<10){ await T.evaluate(()=>tourNext()); await T.waitForTimeout(800); }
}
ok('선생님 단계 11개', tot===11, tot+'개');
/* 밝힐 데가 없는 단계가 일부러 있다 — 첫 인사, 그리고 반 상세 안쪽을 말하는
   네 단계(반이 없으면 들어갈 수 없다). 공지 단추도 반이 있어야 보인다.
   갓 가입한 선생님 기준이라 여섯이 맞다. */
/* 갓 가입한 선생님 기준: 첫 인사 1 + 반 상세 안쪽을 말하는 4 +
   공지 단추 1(반이 없으면 숨어 있다) = 6 */
ok('화면만 어둡게 한 단계가 설계대로', blind===6, blind+'개');
await T.screenshot({path:'tour_t.png'});
await T.evaluate(()=>tourNext()); await T.waitForTimeout(600);
ok('마지막에 닫힘', !await T.evaluate(()=>document.getElementById('tourLay').classList.contains('show')));
ok('본 것으로 기록됨', await T.evaluate(()=>!!(userById(currentUserId)||{}).tourDone));

console.log('\n[추가] 문구·이전·눌러서 넘어가기');
await T.evaluate(()=>showPage('t-mypage')); await T.waitForTimeout(500);
await T.evaluate(()=>{[...document.querySelectorAll('#page-t-mypage .menu-row')]
  .find(x=>x.textContent.includes('설명 보기')).click();});
await T.waitForTimeout(900);
let v = await T.evaluate(()=>({
  제목: document.getElementById('tourTitle').textContent,
  이전보임: !document.getElementById('tourBack').hidden,
  구멍자리: document.getElementById('tourHole').style.width || '(비움)',
}));
console.log('   1단계:', JSON.stringify(v));
ok('★ 문구가 「잠깐만요」', v.제목==='잠깐만요', v.제목);
ok('1단계에는 「이전」 없음', v.이전보임===false);
ok('★ 앞 단계 밝힌 자리가 안 남음', v.구멍자리==='(비움)', v.구멍자리);
await T.evaluate(()=>tourNext()); await T.waitForTimeout(700);
v = await T.evaluate(()=>({이전보임: !document.getElementById('tourBack').hidden,
  제목: document.getElementById('tourTitle').textContent}));
ok('★ 2단계부터 「이전」 나옴', v.이전보임===true);
await T.evaluate(()=>tourPrev()); await T.waitForTimeout(700);
ok('★ 「이전」이 진짜 되돌림',
   await T.evaluate(()=>document.getElementById('tourTitle').textContent)==='잠깐만요');
/* 눌러서 넘어가기 — '반 관리를 눌러 보세요' 단계까지 가서 진짜로 누른다 */
for(let i=0;i<3;i++){ await T.evaluate(()=>tourNext()); await T.waitForTimeout(700); }
v = await T.evaluate(()=>({제목: document.getElementById('tourTitle').textContent,
  누르라고: !document.getElementById('tourTap').hidden}));
console.log('   4단계:', JSON.stringify(v));
ok('누르라는 안내가 뜸', v.누르라고===true, v.제목);
await T.click('#page-t-home .nav-item[data-nav="t-students"]');
await T.waitForTimeout(1400);
v = await T.evaluate(()=>({제목: document.getElementById('tourTitle').textContent,
  화면: (document.querySelector('.page.active')||{}).id}));
console.log('   누른 뒤:', JSON.stringify(v));
ok('★ 밝은 곳을 누르니 저절로 넘어감', v.제목==='먼저 반을 만듭니다' && v.화면==='page-t-students', JSON.stringify(v));
await T.evaluate(()=>endTour(true)); await T.waitForTimeout(400);

console.log('\n[선생님] 새로고침하면 다시 안 뜨는지');
await T.reload({waitUntil:'domcontentloaded'});
if(!await waitPage(T,'page-t-home',30000)) throw new Error('새로고침 뒤 홈 실패');
await T.waitForTimeout(4000);
ok('★ 두 번째부터는 안 뜸', !await T.evaluate(()=>document.getElementById('tourLay').classList.contains('show')));

console.log('\n[선생님] 마이페이지 단추로 다시 보기');
await T.evaluate(()=>showPage('t-mypage')); await T.waitForTimeout(600);
const hasBtn = await T.evaluate(()=>{
  const b=[...document.querySelectorAll('#page-t-mypage .menu-row')].find(x=>x.textContent.includes('설명 보기'));
  if(b) b.click(); return !!b;
});
ok('마이페이지에 「설명 보기」 있음', hasBtn);
await T.waitForTimeout(800);
ok('★ 단추로 다시 뜸', await T.evaluate(()=>document.getElementById('tourLay').classList.contains('show')));
await T.evaluate(()=>endTour(true)); await T.waitForTimeout(400);
ok('건너뛰기로 닫힘', !await T.evaluate(()=>document.getElementById('tourLay').classList.contains('show')));

console.log('\n[학생] 준비');
for(let i=0;i<8;i++){ await T.evaluate(()=>startAddClass('t-home')); if(await waitPage(T,'page-t-class-setup',3000)) break; await T.waitForTimeout(800); }
await T.fill('#classInput','안내반'); await T.click('#classConfirmBtn');
await waitFor(T,()=>classes.length===1&&!!classes[0].id,40000);
await T.click('#page-t-home .nav-item[data-nav="t-students"]'); await T.waitForTimeout(700);
await T.click('#page-t-students .student-card'); await T.waitForTimeout(800);
await T.evaluate(()=>toggleAddStuForm()); await T.waitForTimeout(400);
await T.fill('#newStuNames','한서윤'); await T.click('#newStuConfirmBtn');
await T.locator('#issuedModal').waitFor({state:'visible',timeout:90000});
const stu=(await T.evaluate(()=>lastIssued.map(m=>({name:m.name,id:m.id,pw:m.pw}))))[0];
await T.click('#issuedModal button:has-text("확인")'); await T.waitForTimeout(500);

console.log('\n[학생] 비번 정하는 창이 끝난 뒤에 뜨는지');
await S.click('.welcome-start-btn'); await S.waitForTimeout(300);
await S.click('.role-card.student'); await S.waitForTimeout(400);
await S.fill('#stuLoginName',stu.id); await S.fill('#stuLoginPw',stu.pw);
await S.click('#page-name-input .auth-submit');
const needPw = await waitFor(S,()=>document.getElementById('pwChangeModal').classList.contains('show'),40000);
ok('먼저 비밀번호 창', needPw);
const tourWhilePw = await S.evaluate(()=>document.getElementById('tourLay').classList.contains('show'));
ok('★ 비번 창이 떠 있는 동안엔 안 뜸', tourWhilePw===false);
await S.fill('#newPw','Seoyun2026!'); await S.fill('#newPw2','Seoyun2026!');
/* 예전에 안내가 이 단추를 덮어 아무것도 못 눌렀다. 진짜로 눌러서 확인한다. */
await S.click('#pwChangeModal button:has-text("변경")', { timeout: 15000 });
ok('★ 안내가 비밀번호 단추를 가리지 않음', true);
await waitFor(S,()=>!document.getElementById('pwChangeModal').classList.contains('show'),30000);
ok('★ 비번 정하고 나면 뜸', await waitFor(S,()=>document.getElementById('tourLay').classList.contains('show'),15000));

console.log('\n[학생] 단계마다');
blind=0; tot=0;
for(let i=0;i<6;i++){
  const st = await S.evaluate(()=>{
    const h=document.getElementById('tourHole');
    const r=document.getElementById('tourCard').getBoundingClientRect();
    const hr=h.getBoundingClientRect();
    return { 단계: document.getElementById('tourStep').textContent,
      제목: document.getElementById('tourTitle').textContent,
      화면: (document.querySelector('.page.active')||{}).id,
      밝힘: h.classList.contains('none') ? null : Math.round(hr.width)+'x'+Math.round(hr.height),
      카드밖으로: r.top < 0 || r.bottom > window.innerHeight + 1,
      겹침: !h.classList.contains('none') && !(r.top >= hr.bottom || r.bottom <= hr.top),
    };
  });
  tot++; if(!st.밝힘) blind++;
  console.log('   ', JSON.stringify(st));
  if(st.카드밖으로) ok('카드가 화면 밖 ('+st.단계+')', false);
  if(st.겹침) ok('카드가 밝힌 곳을 가림 ('+st.단계+')', false);
  if(i===2) await S.screenshot({path:'tour_s.png'});
  if(i<5){ await S.evaluate(()=>tourNext()); await S.waitForTimeout(800); }
}
ok('학생 단계 6개 (선생님보다 짧음)', tot===6 && tot < 11, tot+'개');
ok('학생은 첫 인사만 빼고 다 밝힘', blind===1, '화면만 어둡게 한 단계 '+blind+'개');
await S.evaluate(()=>tourNext()); await S.waitForTimeout(600);
ok('마지막에 닫히고 앱이 멀쩡함',
   !await S.evaluate(()=>document.getElementById('tourLay').classList.contains('show'))
   && !await S.evaluate(()=>document.body.classList.contains('tour-on')));

console.log('\n오류', errs.length); errs.forEach(e=>console.log('  ❌',e));
console.log(fails.length===0&&errs.length===0 ? '\n🎉 통과' : `\n⚠️ 실패 ${fails.length} / 오류 ${errs.length}`);
await b.close();
})().catch(e=>{console.error('실패:',e.message);process.exit(1);});
