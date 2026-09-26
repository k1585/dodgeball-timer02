/* 로그아웃 확인 / 공지 / 구글 나이확인 / 아이디 변경 */
const { chromium } = require('playwright');
const L = require('./fblaunch');
const TAG=Date.now().toString(36).slice(-5), TNAME='다섯가지'+TAG;
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
const settle=pg=>waitFor(pg,()=>Cloud.pending===0,25000);

for(const pg of [T,S]) await pg.goto(L.base,{waitUntil:'domcontentloaded'});
await T.waitForTimeout(1600);

console.log('[4] 구글 가입 나이 확인');
const gAge = await T.evaluate(()=>({
  나이칸: !!document.getElementById('gAgeAdultBtn'),
  보호자칸: !!document.getElementById('gGuardianName'),
  동의칸: !!document.getElementById('gAgreeGuardian'),
}));
console.log('   ',JSON.stringify(gAge));
ok('구글 창에 나이 확인이 생김', gAge.나이칸&&gAge.보호자칸&&gAge.동의칸);

/* 선생님 가입/로그인 */
await T.click('.welcome-start-btn'); await T.waitForTimeout(300);
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

/* 반 2개 */
for (const nm of ['중2 A반','중2 B반']) {
  await T.evaluate(()=>startAddClass('t-home'));
  await T.locator('#classInput').waitFor({state:'visible',timeout:20000});
  await T.fill('#classInput',nm); await T.click('#classConfirmBtn');
  await T.waitForTimeout(1200);
}
await waitFor(T,()=>classes.length===2&&classes.every(c=>c.id),25000);
await settle(T);
ok('반 2개 준비', await T.evaluate(()=>classes.length)===2);

console.log('\n[2] 공지 올리기 (반 골라서)');
await T.evaluate(()=>{ showPage('t-home'); openNoticeWrite(); }); await T.waitForTimeout(600);
const pick = await T.evaluate(()=>({
  열림: document.getElementById('noticeModal').classList.contains('show'),
  반수: document.querySelectorAll('.notice-class-cb').length,
  미리체크: document.querySelectorAll('.notice-class-cb:checked').length,
}));
console.log('   ',JSON.stringify(pick));
ok('반 목록이 체크로 나옴', pick.열림&&pick.반수===2, JSON.stringify(pick));
await T.click('#noticeSaveBtn'); await T.waitForTimeout(500);
ok('내용 없으면 거부', (await T.textContent('#noticeMsg')).includes('내용'), await T.textContent('#noticeMsg'));
await T.fill('#noticeText','이번 주 금요일은 수업이 없어요');
await T.evaluate(()=>{ document.querySelectorAll('.notice-class-cb').forEach(b=>b.checked=false); });
await T.click('#noticeSaveBtn'); await T.waitForTimeout(500);
ok('반 안 고르면 거부', (await T.textContent('#noticeMsg')).includes('골라'), await T.textContent('#noticeMsg'));
/* 첫 번째 반에만 올린다 */
await T.evaluate(()=>{ document.querySelector('.notice-class-cb').checked = true; });
await T.click('#noticeSaveBtn'); await T.waitForTimeout(900); await settle(T);
const posted = await T.evaluate(()=>({
  닫힘: !document.getElementById('noticeModal').classList.contains('show'),
  반0: (classes[0].notices||[]).length,
  반1: (classes[1].notices||[]).length,
  화면: document.querySelectorAll('#tNoticeList .notice-card').length,
  어디: (document.querySelector('.notice-where')||{}).textContent,
}));
console.log('   ',JSON.stringify(posted));
ok('★ 고른 반에만 올라감', posted.닫힘&&posted.반0===1&&posted.반1===0);
ok('선생님 홈에 보임', posted.화면===1 && (posted.어디||'').includes('A반'), posted.어디);

/* 학생 계정 만들고 로그인 */
await T.click('#page-t-home .nav-item[data-nav="t-students"]'); await T.waitForTimeout(600);
await T.click('#page-t-students .student-card'); await T.waitForTimeout(800);
await T.evaluate(()=>toggleAddStuForm()); await T.waitForTimeout(400);
await T.fill('#newStuNames','이준호');
await T.click('#newStuConfirmBtn');
await T.locator('#issuedModal').waitFor({state:'visible',timeout:60000});
await T.waitForTimeout(600);
const issued=await T.evaluate(()=>lastIssued[0]);
await T.click('#issuedModal button:has-text("확인")'); await T.waitForTimeout(500);

await S.click('.welcome-start-btn'); await S.waitForTimeout(300);
await S.click('.role-card.student'); await S.waitForTimeout(400);
await S.fill('#stuLoginName',issued.id); await S.fill('#stuLoginPw','@abcd1234');
await S.click('#page-name-input .auth-submit');
ok('학생 로그인', await waitPage(S,'page-home',30000), await active(S));

console.log('\n[5] 첫 로그인에서 아이디+비번 정하기');
await waitFor(S,()=>document.getElementById('pwChangeModal').classList.contains('show'),15000);
const NEWID = 'junho' + TAG;
await S.fill('#firstId', NEWID);
await S.fill('#newPw','Junho2026!'); await S.fill('#newPw2','Junho2026!');
await S.click('#pwChangeModal button:has-text("변경")');
await waitFor(S,()=>!document.getElementById('pwChangeModal').classList.contains('show'),30000);
await S.waitForTimeout(1200); await settle(S);
const idNow = await S.evaluate(()=>({
  내아이디: (userById(currentUserId)||{}).loginId,
  경고: document.getElementById('storageFullModal').classList.contains('show'),
  경고글: document.getElementById('storageFullText').textContent,
}));
console.log('   ',JSON.stringify(idNow));
const idWorked = idNow.내아이디===NEWID;
if (idWorked) {
  ok('★ 아이디가 바뀜', true, idNow.내아이디);
} else {
  ok('★ 못 바꿔도 비밀번호는 바뀌고 안내가 뜸',
     idNow.경고===true && (idNow.경고글||'').includes('아이디'), idNow.경고글);
  console.log('   ⚠️ 장부 규칙이 아직 안 올라가 있음 (콘솔에서 규칙 게시 필요)');
}
/* 안내 창이 떠 있으면 다음 조작을 가로막는다 */
await S.evaluate(()=>closeModal('storageFullModal')); await S.waitForTimeout(400);

console.log('\n[3] 학생 홈에 공지');
await waitFor(S,()=>classes.length===1,25000);
await S.evaluate(()=>{ renderStudentHome(); showPage('home'); }); await S.waitForTimeout(700);
const sNotice = await S.evaluate(()=>({
  보임: document.getElementById('sNoticeBox').style.display !== 'none',
  개수: document.querySelectorAll('#sNoticeList .notice-card').length,
  글: (document.querySelector('#sNoticeList .notice-text')||{}).textContent,
  날짜: (document.querySelector('#sNoticeList .notice-when')||{}).textContent,
}));
console.log('   ',JSON.stringify(sNotice));
ok('★ 학생 홈에 공지가 뜸', sNotice.보임 && sNotice.개수===1 && (sNotice.글||'').includes('금요일'));
ok('올린 날짜 표시', sNotice.날짜==='오늘', sNotice.날짜);

console.log('\n[5] 새 아이디로 다시 로그인');
await S.evaluate(()=>{ logoutStudent(); }); await S.waitForTimeout(1800);
await S.click('.welcome-start-btn'); await S.waitForTimeout(300);
await S.click('.role-card.student'); await S.waitForTimeout(400);
await S.fill('#stuLoginName', idWorked ? NEWID : issued.id);
await S.fill('#stuLoginPw','Junho2026!');
await S.click('#page-name-input .auth-submit');
ok(idWorked ? '★ 바꾼 아이디로 로그인됨' : '새 비밀번호로 로그인됨',
   await waitPage(S,'page-home',30000), await active(S));

console.log('\n[1] 로그아웃 확인창');
await S.evaluate(()=>{ showPage('mypage'); renderMyPage(); }); await S.waitForTimeout(500);
await S.click('#page-mypage .menu-row:has-text("로그아웃")'); await S.waitForTimeout(600);
const lg = await S.evaluate(()=>({
  열림: document.getElementById('logoutModal').classList.contains('show'),
  아직로그인: !!currentUserId,
}));
console.log('   ',JSON.stringify(lg));
ok('★ 바로 안 나가고 물어봄', lg.열림===true && lg.아직로그인===true);
await S.click('#logoutModal button:has-text("아니오")'); await S.waitForTimeout(500);
ok('아니오면 그대로', await S.evaluate(()=>!!currentUserId && !document.getElementById('logoutModal').classList.contains('show')));
await S.click('#page-mypage .menu-row:has-text("로그아웃")'); await S.waitForTimeout(500);
await S.click('#logoutModal button:has-text("네")');
ok('네면 나감', await waitPage(S,'page-welcome',20000), await active(S));

console.log('\n[선생님도 아이디 바뀐 걸 봄]');
await T.evaluate(()=>{ showPage('t-students'); }); await T.waitForTimeout(400);
await T.evaluate(()=>openClassDetail(0,'t-students')); await T.waitForTimeout(3000);
const seen = await T.evaluate(()=>(document.querySelector('#manageStudentList .student-loginid')||{}).textContent);
ok('선생님 명단이 학생 아이디를 보여줌', (seen||'').includes(idWorked ? NEWID : issued.id), seen);

await T.evaluate(async()=>{ await Cloud.deleteMyAccount(userById(currentUserId)); });
await T.waitForTimeout(2500);
console.log('\n오류',errs.length); errs.slice(0,6).forEach(e=>console.log('  ❌',e.slice(0,140)));
console.log(fails.length===0&&errs.length===0?'\n🎉 통과':`\n⚠️ 실패 ${fails.length} / 오류 ${errs.length}`);
fails.forEach(f=>console.log('   -',f));
await b.close();})();
