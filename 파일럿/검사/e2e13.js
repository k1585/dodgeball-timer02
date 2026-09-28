/* 관리자 공지 — 범위(모두/선생/학생/반)와 표시(홈/팝업/둘 다) */
const { chromium } = require('playwright');
const L = require('./fblaunch');
const TAG = Date.now().toString(36).slice(-4);
const fails=[]; const ok=(l,c,x)=>{console.log(`${c?'  ✅':'  ❌'} ${l}${x?' — '+x:''}`); if(!c) fails.push(l);};
(async()=>{
const b=await chromium.launch({executablePath:L.exe,headless:true,args:L.args});
const ctxT=await b.newContext({viewport:{width:420,height:900}});
const ctxS=await b.newContext({viewport:{width:420,height:900}});
const T=await ctxT.newPage(), S=await ctxS.newPage();
await L.useLocalSdk(ctxT); await L.useLocalSdk(ctxS);
const errs=[]; [T,S].forEach((p,i)=>p.on('pageerror',e=>errs.push((i?'학생':'선생')+': '+e.message)));
const active=p=>p.evaluate(()=>(document.querySelector('.page.active')||{}).id);
async function waitPage(p,id,ms=30000){const t=Date.now();while(Date.now()-t<ms){if(await active(p)===id)return true;await p.waitForTimeout(200);}return false;}
async function waitFor(p,fn,ms=30000){const t=Date.now();while(Date.now()-t<ms){try{if(await p.evaluate(fn))return true;}catch(e){}await p.waitForTimeout(200);}return false;}
for(const p of [T,S]) await p.goto(L.base,{waitUntil:'domcontentloaded'});
await T.waitForTimeout(1500);

console.log('\n[준비] 선생님 + 반 + 학생');
await T.click('.welcome-start-btn'); await T.waitForTimeout(300);
await T.click('.role-card.teacher'); await T.waitForTimeout(300);
await T.click('#page-t-name-input .auth-signup-link'); await T.waitForTimeout(400);
await T.fill('#signupName','공지검사'+TAG); await T.fill('#signupPw','Teach2026!');
await T.fill('#signupPwConfirm','Teach2026!'); await T.check('#agreeTerms');
await T.click('#page-signup .auth-submit');
await T.locator('#signupDoneModal').waitFor({state:'visible',timeout:60000});
await T.click('#signupDoneModal button:has-text("확인")'); await T.waitForTimeout(600);
await T.evaluate(()=>showPage('welcome')); await T.waitForTimeout(300);
await T.click('.welcome-start-btn'); await T.waitForTimeout(300);
await T.click('.role-card.teacher'); await T.waitForTimeout(300);
await T.fill('#tchLoginName','공지검사'+TAG); await T.fill('#tchLoginPw','Teach2026!');
await T.click('#page-t-name-input .auth-submit');
if(!await waitPage(T,'page-t-home')) throw new Error('선생 로그인 실패');
for(let i=0;i<8;i++){ await T.evaluate(()=>startAddClass('t-home')); if(await waitPage(T,'page-t-class-setup',3000)) break; await T.waitForTimeout(800); }
await T.fill('#classInput','공지반'); await T.click('#classConfirmBtn');
await waitFor(T,()=>classes.length===1&&!!classes[0].id,40000);
const cid = await T.evaluate(()=>classes[0].id);
await T.click('#page-t-home .nav-item[data-nav="t-students"]'); await T.waitForTimeout(700);
await T.click('#page-t-students .student-card'); await T.waitForTimeout(800);
await T.evaluate(()=>toggleAddStuForm()); await T.waitForTimeout(400);
await T.fill('#newStuNames','윤서준'); await T.click('#newStuConfirmBtn');
await T.locator('#issuedModal').waitFor({state:'visible',timeout:90000});
const stu=(await T.evaluate(()=>lastIssued.map(m=>({name:m.name,id:m.id,pw:m.pw}))))[0];
await T.click('#issuedModal button:has-text("확인")'); await T.waitForTimeout(500);

console.log('\n[관리자] 마이페이지에서 들어가기');
await T.evaluate(()=>showPage('t-mypage')); await T.waitForTimeout(600);
const hasRow = await T.evaluate(()=>{
  const r=[...document.querySelectorAll('#page-t-mypage .menu-row')].find(x=>x.textContent.includes('관리자'));
  if(r) r.click(); return !!r; });
ok('마이페이지에 「관리자」 있음', hasRow);
await T.waitForTimeout(500);
ok('비밀번호를 물음', await T.evaluate(()=>document.getElementById('masterPasswordModal').classList.contains('show')));
await T.fill('#masterPasswordInput','0000');
await T.evaluate(()=>submitMasterPassword()); await T.waitForTimeout(700);
let pg = await active(T);
if (pg !== 'page-master') {   /* 기본 비번이 다르면 해시를 직접 맞춘다 */
  await T.evaluate(()=>{ closeModal('masterPasswordModal'); renderMasterTeachers(); renderMasterAccounts(); renderMasterUsage(); renderMasterNotices(); showPage('master'); });
  await T.waitForTimeout(500); pg = await active(T);
}
ok('관리자 화면 들어감', pg==='page-master', pg);
ok('공지 관리 칸 있음', await T.evaluate(()=>document.body.textContent.includes('공지 관리')));

console.log('\n[관리자] 로그인했으면 올릴 수 있다고 알려 주는지');
const lg = await T.evaluate(()=>({
  글: document.getElementById('sysLoginNote').textContent.trim(),
  단추막힘: document.getElementById('sysWriteBtn').disabled,
}));
ok('★ 로그인 상태를 알려 줌', lg.글.includes('계정으로 올립니다') && lg.단추막힘===false, lg.글.slice(0,40));

console.log('\n[관리자] 서버 현황');
await T.evaluate(()=>renderMasterUsage()); await T.waitForTimeout(400);
const us = await T.evaluate(()=>{
  const cells=[...document.querySelectorAll('#usageGrid .usage-cell')].map(c=>c.textContent.trim());
  return { 칸수: cells.length, 글: cells.join(' | '),
           요금: document.getElementById('usageCost').textContent.trim(),
           범위안내: document.getElementById('usageScopeNote').textContent.trim() };
});
console.log('   ',JSON.stringify(us.글));
ok('★ 현황 숫자가 나옴', us.칸수===7, us.칸수+'칸');
ok('반·학생 수가 맞음', us.글.includes('반1개') && us.글.includes('학생1명'), us.글.slice(0,40));
ok('사진 공간과 무료 한도가 보임', us.글.includes('사진이 쓰는 공간') && us.글.includes('무료 1 GB'));
ok('★ 예상 요금이 보임', us.요금.includes('무료 범위 안') || us.요금.includes('한 달에 약'), us.요금.slice(0,30));
ok('어디까지 센 것인지 밝힘', us.범위안내.includes('볼 수 있는 자료만'));

console.log('\n[학생] 로그인');
await S.click('.welcome-start-btn'); await S.waitForTimeout(300);
await S.click('.role-card.student'); await S.waitForTimeout(400);
await S.fill('#stuLoginName',stu.id); await S.fill('#stuLoginPw',stu.pw);
await S.click('#page-name-input .auth-submit');
if(await waitFor(S,()=>document.getElementById('pwChangeModal').classList.contains('show'),40000)){
  await S.fill('#newPw','Seojun2026!'); await S.fill('#newPw2','Seojun2026!');
  await S.click('#pwChangeModal button:has-text("변경")');
  await waitFor(S,()=>!document.getElementById('pwChangeModal').classList.contains('show'),30000);
}
await waitPage(S,'page-home',30000); await S.waitForTimeout(1200);

/* 공지 하나 올리고 양쪽에서 확인하는 도우미 */
async function post(text, scope, show, classIds){
  await T.evaluate(()=>openSysNoticeWrite()); await T.waitForTimeout(400);
  await T.fill('#sysNoticeText', text);
  await T.selectOption('#sysScope', scope);
  await T.selectOption('#sysShow', show);
  await T.evaluate(()=>syncSysClassPick()); await T.waitForTimeout(200);
  if (classIds) await T.evaluate((ids)=>{
    document.querySelectorAll('.sys-class-cb').forEach(cb=>{ if(ids.indexOf(cb.value)>=0) cb.checked=true; });
  }, classIds);
  await T.evaluate(()=>confirmSysNotice());
  await waitFor(T, new Function('return sysNotices.some(n=>n.text==="'+text+'")'), 30000);
  await T.waitForTimeout(1200);
}
const seen = (p) => p.evaluate(()=>{
  const b1=document.getElementById('sysBannerStudent'), b2=document.getElementById('sysBannerTeacher');
  const vis=(el)=>el && !el.hidden ? el.textContent : '';
  return { 배너: (vis(b1)+vis(b2)).trim(),
    팝업: document.getElementById('sysPopupModal').classList.contains('show'),
    팝업글: document.getElementById('sysPopupBody').textContent.trim() };
});

console.log('\n[1] 모두에게 · 홈 화면');
await post('전체 안내입니다','all','home');
await T.evaluate(()=>{ showPage('t-home'); renderSysBanners(); }); await T.waitForTimeout(600);
await S.evaluate(()=>{ showPage('home'); renderSysBanners(); }); await S.waitForTimeout(600);
let t=await seen(T), s2=await seen(S);
ok('★ 선생님 홈에 보임', t.배너.includes('전체 안내입니다'), t.배너.slice(0,40));
ok('★ 학생 홈에 보임', s2.배너.includes('전체 안내입니다'), s2.배너.slice(0,40));
ok('팝업은 안 뜸(홈만 고름)', t.팝업===false && s2.팝업===false);

/* 선생님 공지(흰 카드)와 확실히 갈리도록 관리자 공지는 빨강이어야 한다 */
const color = await S.evaluate(()=>{
  const b=document.querySelector('#sysBannerStudent .sys-banner');
  const g=document.querySelector('#sysBannerStudent .sys-tag');
  if(!b||!g) return null;
  const cs=getComputedStyle(b), gs=getComputedStyle(g);
  const num=(s)=>(s.match(/\d+/g)||[]).map(Number);
  return { 배경: cs.backgroundColor, 테두리: cs.borderTopColor, 표딱지: gs.backgroundColor,
           배경값: num(cs.backgroundColor), 표딱지값: num(gs.backgroundColor) };
});
console.log('   ',JSON.stringify(color&&{배경:color.배경,표딱지:color.표딱지}));
const 빨강 = (v)=>v && v[0]>v[1]+8 && v[0]>v[2]+8;   /* 빨강 기운이 도는가 */
ok('★ 공지 바탕이 빨강 계열', 빨강(color&&color.배경값), color&&color.배경);
ok('★ 「알림」 표딱지가 빨강', 빨강(color&&color.표딱지값)
   && color.표딱지값[0]>180 && color.표딱지값[1]<110, color&&color.표딱지);

console.log('\n[2] 선생님에게만');
await post('선생님만 보세요','teacher','home');
await T.evaluate(()=>renderSysBanners()); await S.evaluate(()=>renderSysBanners());
await T.waitForTimeout(500); await S.waitForTimeout(500);
t=await seen(T); s2=await seen(S);
ok('★ 선생님에게 보임', t.배너.includes('선생님만 보세요'));
ok('★ 학생에게는 안 보임', !s2.배너.includes('선생님만 보세요'), s2.배너.slice(0,60));

console.log('\n[3] 학생에게만');
await post('학생만 보세요','student','home');
await T.evaluate(()=>renderSysBanners()); await S.evaluate(()=>renderSysBanners());
await T.waitForTimeout(500); await S.waitForTimeout(500);
t=await seen(T); s2=await seen(S);
ok('★ 학생에게 보임', s2.배너.includes('학생만 보세요'));
ok('★ 선생님에게는 안 보임', !t.배너.includes('학생만 보세요'), t.배너.slice(0,60));

console.log('\n[4] 고른 반에만');
await post('공지반 전용','class','home',[cid]);
await T.evaluate(()=>renderSysBanners()); await S.evaluate(()=>renderSysBanners());
await T.waitForTimeout(500); await S.waitForTimeout(500);
t=await seen(T); s2=await seen(S);
ok('★ 그 반 학생에게 보임', s2.배너.includes('공지반 전용'));
ok('★ 그 반 선생님에게도 보임', t.배너.includes('공지반 전용'));

console.log('\n[5] 로그인할 때 창으로');
/* 여기서부터는 팝업을 직접 봐야 하므로 자동 닫기를 끈다 */
await S.evaluate(()=>{ window.__keepSys = true; });
await T.evaluate(()=>{ window.__keepSys = true; });
/* 예전 검사가 남긴 공지가 있으면 먼저 치워 둔다(내 것만 보게) */
await S.evaluate(()=>{ if(typeof closeSysPopup==='function') { sysPopupIds = sysNotices.map(n=>n.id); sysMarkSeen(sysPopupIds); sysPopupIds=[]; } });
await S.waitForTimeout(300);
await post('창으로 알립니다','all','popup');
await S.evaluate(()=>{ closeModal('sysPopupModal'); maybeShowSysPopup(); }); await S.waitForTimeout(900);
s2=await seen(S);
ok('★ 팝업이 뜸', s2.팝업===true && s2.팝업글.includes('창으로 알립니다'), s2.팝업글.slice(0,40));
ok('팝업만 고르면 홈에는 안 나옴', !s2.배너.includes('창으로 알립니다'));
await S.evaluate(()=>closeSysPopup()); await S.waitForTimeout(500);
ok('닫기로 닫힘', !(await seen(S)).팝업);
await S.evaluate(()=>maybeShowSysPopup()); await S.waitForTimeout(700);
ok('★ 닫은 공지는 다시 안 뜸', !(await seen(S)).팝업);

console.log('\n[6] 둘 다');
await post('둘 다 띄웁니다','all','both');
await S.evaluate(()=>{ renderSysBanners(); maybeShowSysPopup(); }); await S.waitForTimeout(900);
s2=await seen(S);
ok('★ 홈에도 창에도 나옴', s2.배너.includes('둘 다 띄웁니다') && s2.팝업글.includes('둘 다 띄웁니다'));
await S.evaluate(()=>closeSysPopup()); await S.waitForTimeout(400);
ok('창을 닫아도 홈에는 남음', (await seen(S)).배너.includes('둘 다 띄웁니다'));

console.log('\n[7] 달력이 더럽혀지지 않았는지');
const cal = await S.evaluate(()=>({ 일정수: events.length, 공지수: sysNotices.length }));
console.log('   ',JSON.stringify(cal));
ok('★ 공지가 달력 일정으로 새지 않음', cal.일정수===0 && cal.공지수>=6, JSON.stringify(cal));

console.log('\n[8] 지우기');
const before = await T.evaluate(()=>sysNotices.length);
const delId = await T.evaluate(()=>sysNotices[0].id);
await T.evaluate((id)=>removeSysNoticeAsk(id), delId); await T.waitForTimeout(300);
await T.evaluate(()=>confirmRemoveSysNotice());
ok('★ 공지가 지워짐',
   await waitFor(T, new Function('return sysNotices.length===' + (before-1)), 30000),
   before+'→'+(before-1));
await T.waitForTimeout(1500);
ok('지운 뒤 개수 맞음', await T.evaluate(()=>sysNotices.length)===before-1);

console.log('\n[9] 내용 없이 올리면 거부');
await T.evaluate(()=>openSysNoticeWrite()); await T.waitForTimeout(400);
await T.evaluate(()=>confirmSysNotice()); await T.waitForTimeout(500);
ok('빈 내용 거부', await T.evaluate(()=>document.getElementById('sysNoticeMsg').textContent.includes('내용')));
await T.selectOption('#sysScope','class'); await T.evaluate(()=>syncSysClassPick());
await T.fill('#sysNoticeText','반 안 고름');
await T.evaluate(()=>confirmSysNotice()); await T.waitForTimeout(500);
ok('반 안 고르면 거부', await T.evaluate(()=>document.getElementById('sysNoticeMsg').textContent.includes('어느 반')));
await T.evaluate(()=>closeModal('sysNoticeModal'));

console.log('\n[뒷정리] 이 검사가 만든 공지 지우기');
const left = await T.evaluate(async ()=>{
  const mine = sysNotices.filter(n => n.teacherId === Cloud.uid).map(n=>n.id);
  for (const id of mine) { try { await Cloud.removeSysNotice(id); } catch(e){} }
  return mine.length;
});
await T.waitForTimeout(2000);
ok('내가 올린 공지 모두 치움',
   await waitFor(T, new Function('return sysNotices.filter(n=>n.teacherId===Cloud.uid).length===0'), 30000),
   left+'개 지움');

console.log('\n오류', errs.length); errs.forEach(e=>console.log('  ❌',e));
console.log(fails.length===0&&errs.length===0 ? '\n🎉 통과' : `\n⚠️ 실패 ${fails.length} / 오류 ${errs.length}`);
await b.close();
})().catch(e=>{console.error('실패:',e.message);process.exit(1);});
