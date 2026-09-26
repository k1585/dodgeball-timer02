/* 요청 10가지 확인 */
const { chromium } = require('playwright');
const L = require('./fblaunch');
const TAG=Date.now().toString(36).slice(-5), TNAME='열가지'+TAG;
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
/* 제출 완료 화면이 떠 있는 동안에는 버튼을 누를 수 없다 */
const overlayGone=pg=>waitFor(pg,()=>!document.getElementById('successOverlay').classList.contains('show'),20000);
/* 제출 완료 화면이 떠 있는 동안에는 버튼을 누를 수 없다 */

for(const pg of [T,S]) await pg.goto(L.base,{waitUntil:'domcontentloaded'});
await T.waitForTimeout(1600);

console.log('[1] 회원가입 한 줄 링크');
await T.click('.welcome-start-btn'); await T.waitForTimeout(300);
await T.click('.role-card.teacher'); await T.waitForTimeout(500);
const link = await T.evaluate(()=>{
  const btn=document.querySelector('#page-t-name-input .auth-signup-link');
  if(!btn) return null;
  const cs=getComputedStyle(btn);
  return { 글자: btn.textContent.trim(), 줄: btn.parentElement.textContent.replace(/\s+/g,' ').trim(),
           밑줄: cs.textDecorationLine, 색: cs.color,
           옛버튼: document.querySelectorAll('#page-t-name-input .auth-signup-btn').length };
});
console.log('   ',JSON.stringify(link));
ok('한 줄로 합쳐짐', link && link.줄==='아직 계정이 없나요? 회원가입', link&&link.줄);
ok('남색 밑줄', link && link.밑줄==='underline' && link.색==='rgb(30, 58, 107)', link&&link.색);
ok('옛 버튼 없음', link && link.옛버튼===0);

console.log('\n[5] 앱처럼 띄우기');
const app5 = await T.evaluate(()=>({
  manifest: !!document.querySelector('link[rel="manifest"]'),
  standalone: (document.querySelector('meta[name="mobile-web-app-capable"]')||{}).content,
  apple: (document.querySelector('meta[name="apple-mobile-web-app-capable"]')||{}).content,
  theme: (document.querySelector('meta[name="theme-color"]')||{}).content,
}));
console.log('   ',JSON.stringify(app5));
ok('설명서 붙음', app5.manifest===true);
ok('앱 모드 표시', app5.standalone==='yes' && app5.apple==='yes');

/* 가입 + 로그인 */
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

await T.evaluate(()=>startAddClass('t-home'));
await T.locator('#classInput').waitFor({state:'visible',timeout:20000});
await T.fill('#classInput','열가지반'); await T.click('#classConfirmBtn');
await waitFor(T,()=>classes.length===1&&!!classes[0].id);
await T.click('#page-t-home .nav-item[data-nav="t-students"]'); await T.waitForTimeout(600);
await T.click('#page-t-students .student-card'); await T.waitForTimeout(800);

console.log('\n[3] 탭 아래 여백');
const gap = await T.evaluate(()=>{
  const el=document.querySelector('#detailTab-manage');
  return parseFloat(getComputedStyle(el).paddingTop);
});
ok('탭 내용에 위 여백', gap>=14, gap+'px');

console.log('\n[2] 계정 만들고 표로 저장');
await T.evaluate(()=>toggleAddStuForm()); await T.waitForTimeout(400);
await T.fill('#newStuNames','이준호');
await T.click('#newStuConfirmBtn');
await T.locator('#issuedModal').waitFor({state:'visible',timeout:60000});
await T.waitForTimeout(600);
const issued=await T.evaluate(()=>lastIssued[0]);
const dl = await Promise.all([
  T.waitForEvent('download',{timeout:15000}),
  T.click('#issuedModal button:has-text("표로 저장")'),
]).then(r=>r[0]).catch(()=>null);
ok('표 파일이 받아짐', !!dl, dl?dl.suggestedFilename():'없음');
if (dl) {
  const fs=require('fs'); const path=await dl.path();
  const body=fs.readFileSync(path,'utf8');
  console.log('    파일내용:', JSON.stringify(body.slice(0,90)));
  ok('한글 안 깨지게 BOM', body.charCodeAt(0)===0xFEFF);
  ok('머리글과 값이 들어있음', body.includes('아이디')&&body.includes(issued.id)&&body.includes('@abcd1234'));
  ok('엑셀이 여는 이름', /^[\x20-\x7E]+\.csv$/.test(dl.suggestedFilename()), dl.suggestedFilename());
}
await T.click('#issuedModal button:has-text("확인")'); await T.waitForTimeout(500);

console.log('\n[4] 학생 아이디 보기 / 비번 초기화');
const roster = await T.evaluate(()=>({
  아이디줄: (document.querySelector('#manageStudentList .student-loginid')||{}).textContent,
  비번버튼: document.querySelectorAll('#manageStudentList .student-pw-btn').length,
}));
console.log('   ',JSON.stringify(roster));
ok('명단에 아이디 보임', (roster.아이디줄||'').includes(issued.id), roster.아이디줄);
ok('★ 명단에서 비번 단추는 빠짐', roster.비번버튼===0, roster.비번버튼+'개');
const guide = await T.evaluate(()=>{
  const el=document.getElementById('page-master');
  const t=el.textContent;   /* 숨어 있는 화면이라 innerText는 빈 값이 된다 */
  return { 제목: t.includes('비밀번호 초기화'),
           주소안내: t.includes('todayhw.app'),
           /* 콘솔에서는 비번을 직접 못 바꾼다는 걸 알고 나서 안내를
              클라우드 셸 한 줄로 바꿨다. 그래서 단계 수도 줄었다. */
           셸명령: t.includes('set-password.js'),
           전체삭제: t.includes('delete-all-users.js') && t.includes('firestore:delete'),
           단계: el.querySelectorAll('#pwResetSteps li').length };
});
console.log('   ',JSON.stringify(guide));
ok('★ 안내는 관리자 화면에 있음', guide.제목===true && guide.주소안내===true && guide.셸명령===true && guide.전체삭제===true && guide.단계===2);

/* 숙제 만들기 */
await T.evaluate(()=>switchDetailTab('homework')); await T.waitForTimeout(500);
await T.evaluate(()=>toggleAddHwForm()); await T.waitForTimeout(300);
await T.fill('#newHwTitle','수학 1단원'); await T.click('#newHwConfirmBtn');
await waitFor(T,()=>classes[0].homeworks.length===1,20000);
await settle(T);
const hwId = await T.evaluate(()=>classes[0].homeworks[0].id);

/* 학생 로그인 */
await S.click('.welcome-start-btn'); await S.waitForTimeout(300);
await S.click('.role-card.student'); await S.waitForTimeout(400);
await S.fill('#stuLoginName',issued.id); await S.fill('#stuLoginPw','@abcd1234');
await S.click('#page-name-input .auth-submit'); await waitPage(S,'page-home');
await waitFor(S,()=>document.getElementById('pwChangeModal').classList.contains('show'),15000);
await S.fill('#newPw','Junho2026!'); await S.fill('#newPw2','Junho2026!');
await S.click('#pwChangeModal button:has-text("변경")');
await waitFor(S,()=>!document.getElementById('pwChangeModal').classList.contains('show'),25000);
await waitFor(S,()=>classes.length===1&&classes[0].homeworks.length===1,25000);

console.log('\n[7] 제출 → 반려 → 남은 숙제로 복귀');
await S.evaluate(()=>{ selectTab('remaining'); renderRemainingList(); });
await S.waitForTimeout(400);
ok('남은 숙제에 보임', await S.evaluate(()=>myRemainingHomeworks().length===1));
await S.evaluate((id)=>openDetailCard(id), hwId); await S.waitForTimeout(500);
await S.evaluate(()=>{ uploadedPhotos=['data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==']; renderThumbs&&renderThumbs(); });
await S.click('#submitBtn'); await S.waitForTimeout(1500);
await settle(S);
await waitFor(T,()=>classes[0].submissions.length===1,25000);
await T.evaluate(()=>{ const s=classes[0].submissions[0]; s.status='rejected'; s.rejectReason='다시 찍어 주세요'; saveState(); });
await settle(T);
ok('반려가 학생에게 도착', await waitFor(S,()=>mySubmission(classes[0].homeworks[0].id).status==='rejected',25000));
await S.evaluate(()=>{ selectTab('remaining'); renderRemainingList(); });
await S.waitForTimeout(400);
const back = await S.evaluate(()=>({
  남은: myRemainingHomeworks().length,
  카드: document.querySelectorAll('#tab-remaining .hw-card').length,
}));
console.log('   ',JSON.stringify(back));
ok('★ 반려된 숙제가 남은 숙제에 다시 뜸', back.남은===1 && back.카드===1);

console.log('\n[7] 달력 색');
const dots = await S.evaluate(()=>{
  openStudentCalendar();
  /* 작은 점 대신 날짜 칸을 세로 띠로 채우도록 바뀌었다 */
  return [...document.querySelectorAll('#calGrid .cal-bars i')].map(d=>d.className);
});
console.log('   ', JSON.stringify(dots));
ok('반려는 빨강 띠', dots.some(c=>c.includes('bar-red')));
ok('옛 점 표시는 안 씀', await S.evaluate(()=>document.querySelectorAll('#calGrid .cal-dot').length===0));

console.log('\n[6+10] 승인하면 바로 완료 + 지난 숙제');
await overlayGone(S); await S.waitForTimeout(500);
await S.evaluate((id)=>openDetailCard(id), hwId); await S.waitForTimeout(400);
await S.evaluate(()=>{ uploadedPhotos=['data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==']; });
await S.click('#submitBtn'); await S.waitForTimeout(1200);
await overlayGone(S);
await settle(S);
const dupCheck = await S.evaluate(()=>classes[0].submissions.filter(x=>x.hwId===classes[0].homeworks[0].id).length);
ok('다시 내도 제출물이 늘지 않음', dupCheck===1, dupCheck+'건');
await waitFor(T,()=>classes[0].submissions[0].status==='pending',25000);
await T.evaluate(()=>{ const s=classes[0].submissions[0]; s.status='approved'; s.rejectReason=null; saveState(); });
await settle(T);
ok('승인이 학생에게 도착', await waitFor(S,()=>mySubmission(classes[0].homeworks[0].id).status==='approved',25000));
await S.evaluate(()=>{ renderApprovalList(); renderPastList(); renderCounts(); });
await S.waitForTimeout(400);
const done = await S.evaluate(()=>({
  승인현황: document.querySelectorAll('#pendingList .hw-card').length,
  지난숙제: document.querySelectorAll('#tab-past .hw-card').length,
  완료수: document.getElementById('countApproved').textContent,
}));
console.log('   ',JSON.stringify(done));
ok('★ 승인하면 바로 지난 숙제로', done.승인현황===0 && done.지난숙제===1);
ok('완료 건수는 그대로 셈', done.완료수==='1건', done.완료수);
await S.evaluate((id)=>openStatusDetail(id), hwId); await S.waitForTimeout(500);
const detail = await S.evaluate(()=>{
  const el=document.getElementById('sdActionBtn');
  return { 보임: el.style.display, 글자: el.textContent,
           마무리단어: document.body.innerText.includes('숙제 마무리하기') };
});
console.log('   ',JSON.stringify(detail));
ok('★ 마무리하기 버튼 없어짐', detail.보임==='none' && detail.마무리단어===false);

console.log('\n[8] 기한 지난 숙제 마감');
await T.evaluate(()=>{ classes[0].homeworks[0].due='2020-01-01'; saveState(); renderHwDayList(); });
await settle(T);
await T.evaluate(()=>{ hwSelectedDate='2020-01-01'; renderHwDayList(); });
await T.waitForTimeout(400);
ok('기한 지난 숙제에 마감 버튼', await T.evaluate(()=>document.querySelectorAll('#hwManageList .hw-manage-close').length===1));
await T.click('#hwManageList .hw-manage-close'); await T.waitForTimeout(600);
await settle(T);
const closed = await T.evaluate(()=>({
  표시: document.querySelector('#hwManageList .hw-manage-dday').textContent,
  버튼: document.querySelector('#hwManageList .hw-manage-close').textContent,
  값: !!classes[0].homeworks[0].closed,
}));
console.log('   ',JSON.stringify(closed));
ok('마감으로 바뀜', closed.값===true && closed.표시==='마감됨' && closed.버튼==='마감 풀기');
ok('학생에게 마감이 전해짐', await waitFor(S,()=>!!classes[0].homeworks[0].closed,25000));
const blocked = await S.evaluate((id)=>{
  openDetailCard(id);
  return { 막힘: document.getElementById('hwClosedModal').classList.contains('show'),
           남은: myRemainingHomeworks().length };
}, hwId);
console.log('   ',JSON.stringify(blocked));
ok('★ 마감된 숙제는 못 냄', blocked.막힘===true && blocked.남은===0);
await S.evaluate(()=>closeModal('hwClosedModal'));

console.log('\n[9] 계정 삭제에 비밀번호');
await S.evaluate(()=>{ showPage('mypage'); openSelfDelete(); }); await S.waitForTimeout(500);
const delUi = await S.evaluate(()=>({
  비번칸: !document.getElementById('selfDeletePwRow').hidden,
  구글안내: !document.getElementById('selfDeleteGoogleHint').hidden,
}));
ok('비밀번호 칸이 뜸', delUi.비번칸===true && delUi.구글안내===false, JSON.stringify(delUi));
await S.click('#selfDeleteBtn'); await S.waitForTimeout(800);
ok('비우면 거부', (await S.textContent('#selfDeleteMsg')).includes('입력'), await S.textContent('#selfDeleteMsg'));
await S.fill('#selfDeletePw','틀린비번999!');
await S.click('#selfDeleteBtn'); await S.waitForTimeout(4000);
const wrong = await S.evaluate(()=>({
  메시지: document.getElementById('selfDeleteMsg').textContent,
  아직열림: document.getElementById('selfDeleteModal').classList.contains('show'),
  살아있음: !!currentUserId,
}));
console.log('   ',JSON.stringify(wrong));
ok('★ 비번 틀리면 안 지워짐', wrong.메시지.includes('올바르지') && wrong.아직열림===true && wrong.살아있음===true);
await S.fill('#selfDeletePw','Junho2026!');
await S.click('#selfDeleteBtn');
ok('맞으면 삭제됨', await waitPage(S,'page-welcome',30000), await active(S));

/* 뒷정리 */
await T.evaluate(async()=>{ await Cloud.deleteMyAccount(userById(currentUserId)); });
await T.waitForTimeout(2500);

console.log('\n오류',errs.length); errs.slice(0,6).forEach(e=>console.log('  ❌',e.slice(0,140)));
console.log(fails.length===0&&errs.length===0?'\n🎉 통과':`\n⚠️ 실패 ${fails.length} / 오류 ${errs.length}`);
fails.forEach(f=>console.log('   -',f));
await b.close();})();
