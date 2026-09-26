/* 일정 저장 / 숙제 수정 / 숙제 삭제 확인 */
const { chromium } = require('playwright');
const L = require('./fblaunch');
const TAG=Date.now().toString(36).slice(-5), TNAME='일정검사'+TAG;
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
await T.evaluate(()=>startAddClass('t-home'));
await T.locator('#classInput').waitFor({state:'visible',timeout:20000});
await T.fill('#classInput','일정반'); await T.click('#classConfirmBtn');
await waitFor(T,()=>classes.length===1&&!!classes[0].id,25000); await settle(T);

console.log('[1] 일정 저장');
/* 다른 선생님 일정이 목록에 섞여 있어도 내 것만 올라가야 한다 */
const before = await T.evaluate(()=>events.length);
console.log('   내 화면에 들어온 일정 수(남의 것 포함):', before);
await T.evaluate(()=>{
  events.push({ id:'ev'+Date.now().toString(36), title:'체육대회',
                startDate:getTodayDateStr(), endDate:getTodayDateStr(),
                teacherId: currentUserId, teacherName: teacherName });
  saveState();
});
await T.waitForTimeout(1500);
const evr = await T.evaluate(()=>({
  남은:Cloud.pending, 실패:Cloud.failed,
  경고: document.getElementById('storageFullModal').classList.contains('show'),
  경고글: document.getElementById('storageFullText').textContent,
}));
console.log('   ',JSON.stringify(evr));
ok('★ 일정이 저장됨 (인터넷 오류 안 뜸)', evr.실패!==true && evr.경고===false, evr.경고글);
await settle(T);
ok('서버에 반영', await waitFor(T,()=>events.some(e=>e.title==='체육대회'),20000));

console.log('\n[2] 숙제 수정');
await T.click('#page-t-home .nav-item[data-nav="t-students"]'); await T.waitForTimeout(600);
await T.click('#page-t-students .student-card'); await T.waitForTimeout(800);
await T.evaluate(()=>switchDetailTab('homework')); await T.waitForTimeout(600);
await T.evaluate(()=>toggleAddHwForm()); await T.waitForTimeout(300);
await T.fill('#newHwTitle','원래 제목'); await T.fill('#newHwDesc','원래 설명');
await T.click('#newHwConfirmBtn');
await waitFor(T,()=>classes[0].homeworks.length===1,20000); await settle(T);
await T.waitForTimeout(500);
const hwId = await T.evaluate(()=>classes[0].homeworks[0].id);
ok('아무도 안 냈으면 수정 단추가 보임',
   await T.evaluate(()=>[...document.querySelectorAll('#hwManageList .hw-manage-close')].some(b=>b.textContent==='수정')));
await T.evaluate((id)=>openHwEdit(id), hwId); await T.waitForTimeout(500);
ok('수정 창에 기존 내용이 들어있음',
   await T.evaluate(()=>document.getElementById('editHwTitle').value==='원래 제목'
                     && document.getElementById('editHwDesc').value==='원래 설명'));
await T.fill('#editHwTitle',''); await T.click('#hwEditModal button:has-text("저장")'); await T.waitForTimeout(400);
ok('이름 비우면 거부', (await T.textContent('#editHwMsg')).includes('이름'), await T.textContent('#editHwMsg'));
await T.fill('#editHwTitle','바꾼 제목'); await T.fill('#editHwDesc','바꾼 설명');
await T.click('#hwEditModal button:has-text("저장")'); await T.waitForTimeout(900); await settle(T);
ok('★ 숙제가 고쳐짐', await T.evaluate(()=>classes[0].homeworks[0].title==='바꾼 제목'),
   await T.evaluate(()=>classes[0].homeworks[0].title));

console.log('\n[2] 한 명이라도 내면 못 고침');
await T.evaluate(()=>switchDetailTab('manage')); await T.waitForTimeout(500);
await T.evaluate(()=>toggleAddStuForm()); await T.waitForTimeout(400);
await T.fill('#newStuNames','이준호'); await T.click('#newStuConfirmBtn');
await T.locator('#issuedModal').waitFor({state:'visible',timeout:60000});
const issued=await T.evaluate(()=>lastIssued[0]);
await T.click('#issuedModal button:has-text("확인")'); await T.waitForTimeout(500);
await S.click('.welcome-start-btn'); await S.waitForTimeout(300);
await S.click('.role-card.student'); await S.waitForTimeout(400);
await S.fill('#stuLoginName',issued.id); await S.fill('#stuLoginPw','@abcd1234');
await S.click('#page-name-input .auth-submit'); await waitPage(S,'page-home');
await waitFor(S,()=>document.getElementById('pwChangeModal').classList.contains('show'),15000);
await S.fill('#firstId', issued.id); await S.fill('#newPw','Junho2026!'); await S.fill('#newPw2','Junho2026!');
await S.click('#pwChangeModal button:has-text("변경")');
await waitFor(S,()=>!document.getElementById('pwChangeModal').classList.contains('show'),30000);
await S.evaluate(()=>closeModal('storageFullModal'));
await waitFor(S,()=>classes.length===1&&classes[0].homeworks.length===1,25000);
await S.evaluate((id)=>openDetailCard(id), hwId); await S.waitForTimeout(500);
await S.evaluate(()=>{ uploadedPhotos=['data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==']; });
await S.click('#submitBtn'); await S.waitForTimeout(1500); await settle(S);
ok('제출이 선생님께 도착', await waitFor(T,()=>classes[0].submissions.length===1,25000));
await T.evaluate(()=>switchDetailTab('homework')); await T.waitForTimeout(600);
const locked = await T.evaluate(()=>({
  수정단추: [...document.querySelectorAll('#hwManageList .hw-manage-close')].some(b=>b.textContent==='수정'),
}));
ok('★ 낸 사람이 있으면 수정 단추가 사라짐', locked.수정단추===false);

console.log('\n[3] 숙제 삭제 확인창');
await T.evaluate((id)=>askRemoveHomework(id), hwId); await T.waitForTimeout(500);
const del = await T.evaluate(()=>({
  열림: document.getElementById('delHwModal').classList.contains('show'),
  안내: document.getElementById('delHwWhat').textContent,
  아직있음: classes[0].homeworks.length,
}));
console.log('   ',JSON.stringify(del));
ok('★ 바로 안 지우고 물어봄', del.열림===true && del.아직있음===1);
ok('낸 사람 수를 알려줌', del.안내.includes('1건'), del.안내);
await T.click('#delHwModal button:has-text("아니오")'); await T.waitForTimeout(400);
ok('아니오면 그대로', await T.evaluate(()=>classes[0].homeworks.length===1));
await T.evaluate((id)=>askRemoveHomework(id), hwId); await T.waitForTimeout(400);
await T.click('#delHwModal button:has-text("삭제")'); await T.waitForTimeout(900);
ok('삭제면 지워짐', await T.evaluate(()=>classes[0].homeworks.length===0));

await T.evaluate(async()=>{ await Cloud.deleteMyAccount(userById(currentUserId)); });
await T.waitForTimeout(2500);
console.log('\n오류',errs.length); errs.slice(0,6).forEach(e=>console.log('  ❌',e.slice(0,140)));
console.log(fails.length===0&&errs.length===0?'\n🎉 통과':`\n⚠️ 실패 ${fails.length} / 오류 ${errs.length}`);
fails.forEach(f=>console.log('   -',f));
await b.close();})();
