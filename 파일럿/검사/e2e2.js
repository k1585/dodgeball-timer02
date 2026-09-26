const { chromium } = require('playwright');
const L = require('./fblaunch');
const TAG = Date.now().toString(36).slice(-4);
const TNAME = '연동검사' + TAG;
const fails = [];
const ok = (l,c,x)=>{ console.log(`${c?'  ✅':'  ❌'} ${l}${x?' — '+x:''}`); if(!c) fails.push(l); };

(async()=>{
const b=await chromium.launch({executablePath:L.exe,headless:true,args:L.args});
/* 선생님과 학생은 서로 다른 기기라고 보고, 저장소가 분리된 창을 따로 연다 */
const ctxT=await b.newContext({viewport:{width:420,height:900}});
const ctxS=await b.newContext({viewport:{width:420,height:900}});
const T=await ctxT.newPage(), S=await ctxS.newPage();
await L.useLocalSdk(ctxT); await L.useLocalSdk(ctxS);
const errs=[];
[T,S].forEach((pg,i)=>{ pg.on('pageerror',e=>errs.push((i?'학생':'선생')+': '+e.message)); });
const active=pg=>pg.evaluate(()=>(document.querySelector('.page.active')||{}).id);
/* 서버 응답 시간이 들쭉날쭉해서 고정 대기는 불안정하다. 조건이 될 때까지 기다린다. */
async function waitPage(pg,id,ms=25000){
  const t0=Date.now();
  while(Date.now()-t0<ms){ if(await active(pg)===id) return true; await pg.waitForTimeout(200); }
  return false;
}
async function waitFor(pg,fn,ms=25000,arg=null){
  const t0=Date.now();
  while(Date.now()-t0<ms){ try{ if(await pg.evaluate(fn,arg)) return true; }catch(e){} await pg.waitForTimeout(200); }
  return false;
}

for (const pg of [T,S]) { await pg.goto(L.base,{waitUntil:'domcontentloaded'}); }
await T.waitForTimeout(1500);

console.log('\n[선생님] 가입 → 로그인 → 반 만들기');
await T.click('.welcome-start-btn'); await T.waitForTimeout(300);
await T.click('.role-card.teacher'); await T.waitForTimeout(300);
await T.click('#page-t-name-input .auth-signup-link'); await T.waitForTimeout(400);
await T.fill('#signupName',TNAME); await T.fill('#signupPw','Teach2026!');
await T.fill('#signupPwConfirm','Teach2026!'); await T.check('#agreeTerms');
await T.click('#page-signup .auth-submit');
await T.locator('#signupDoneModal').waitFor({state:'visible',timeout:25000});
await T.click('#signupDoneModal button:has-text("확인")'); await T.waitForTimeout(600);
await T.click('.welcome-start-btn'); await T.waitForTimeout(300);
await T.click('.role-card.teacher'); await T.waitForTimeout(300);
await T.fill('#tchLoginName',TNAME); await T.fill('#tchLoginPw','Teach2026!');
await T.click('#page-t-name-input .auth-submit');
await waitPage(T,'page-t-home');
ok('선생님 로그인', await active(T)==='page-t-home', await active(T));

await T.evaluate(()=>startAddClass('t-home'));
await T.locator('#classInput').waitFor({state:'visible',timeout:15000});
await T.fill('#classInput','연동반'+TAG); await T.waitForTimeout(200);
await T.click('#classConfirmBtn');
await waitFor(T,()=>classes.length===1&&!!classes[0].id);
ok('반 생성', await T.evaluate(()=>classes.length)===1);

console.log('\n[선생님] 학생 계정 발급');
await T.click('#page-t-home .nav-item[data-nav="t-students"]'); await T.waitForTimeout(500);
await T.click('#page-t-students .student-card'); await T.waitForTimeout(700);
await T.evaluate(()=>toggleAddStuForm()); await T.waitForTimeout(400);
await T.fill('#newStuNames','이준호\n박지민');
await T.click('#newStuConfirmBtn');
await T.locator('#issuedModal').waitFor({state:'visible',timeout:60000});
const issued = await T.evaluate(()=>lastIssued.map(m=>({name:m.name,id:m.id,pw:m.pw})));
console.log('   발급:', JSON.stringify(issued));
ok('학생 계정 2개 발급', issued.length===2, issued.length+'개');
if(issued.length<1){ console.log('중단'); await b.close(); process.exit(1); }
await T.click('#issuedModal button:has-text("확인")'); await T.waitForTimeout(500);
ok('명단에 학생 표시', (await T.textContent('#manageStudentList')).includes('이준호'));

console.log('\n[선생님] 숙제 내기');
await T.evaluate(()=>switchDetailTab('homework')); await T.waitForTimeout(600);
await T.evaluate(()=>toggleAddHwForm()); await T.waitForTimeout(400);
await T.fill('#newHwTitle','서버 연동 숙제'); await T.fill('#newHwDesc','사진 한 장 올리기');
await T.click('#newHwConfirmBtn');
await waitFor(T,()=>classes[0].homeworks.length===1);
ok('숙제 저장', await T.evaluate(()=>classes[0].homeworks.length)===1);

console.log('\n[학생] 발급받은 아이디로 로그인 — 다른 기기');
const stu = issued[0];
await S.click('.welcome-start-btn'); await S.waitForTimeout(300);
await S.click('.role-card.student'); await S.waitForTimeout(400);
await S.fill('#stuLoginName',stu.id); await S.fill('#stuLoginPw',stu.pw);
await S.click('#page-name-input .auth-submit');
await waitPage(S,'page-home');
ok('학생 로그인', await active(S)==='page-home', await active(S)+' / '+(await S.textContent('#stuLoginError').catch(()=>'')));

/* 처음 받은 비밀번호는 모두 같으므로, 학생은 먼저 자기 비밀번호를 정한다 */
const needPw = await waitFor(S,()=>document.getElementById('pwChangeModal').classList.contains('show'), 15000);
ok('첫 로그인에 비번 변경 요구', needPw);
if (needPw) {
  await S.fill('#newPw','Junho2026!'); await S.fill('#newPw2','Junho2026!');
  await S.click('#pwChangeModal button:has-text("변경")');
  ok('비번 변경 완료', await waitFor(S,()=>!document.getElementById('pwChangeModal').classList.contains('show'), 25000));
}
const seen = await S.evaluate(()=>({cls:classes.length, hw:classes[0]?classes[0].homeworks.length:0, name:classes[0]&&classes[0].name}));
console.log('   학생이 본 것:', JSON.stringify(seen));
ok('★ 선생님이 낸 숙제가 학생에게 도착', seen.hw===1, seen.hw+'건');

console.log('\n[학생] 숙제 제출');
const hwId = await S.evaluate(()=>classes[0].homeworks[0].id);
await S.evaluate(id=>openDetailCard(id), hwId);
await S.locator('#submitBtn').waitFor({state:'visible',timeout:15000});
await S.evaluate(()=>{
  const c=document.createElement('canvas'); c.width=300;c.height=400;
  const x=c.getContext('2d'); x.fillStyle='#FDFBF6'; x.fillRect(0,0,300,400);
  x.fillStyle='#33436B'; x.font='20px sans-serif'; x.fillText('숙제 제출',60,200);
  uploadedPhotos=[c.toDataURL('image/jpeg',0.8)];
  renderPhotoSection(document.getElementById('photoCount'),document.getElementById('thumbRow'),uploadedPhotos,true,()=>{});
  document.getElementById('teacherNote').value='다 했습니다';
});
await S.waitForTimeout(400);
await S.click('#submitBtn');
await waitFor(S,()=>classes[0].submissions.length===1&&Cloud.pending===0);
await S.waitForTimeout(1500);
const sState = await S.evaluate(()=>({
  subs: classes[0].submissions.length,
  status: classes[0].submissions.map(x=>x.status),
  ids: classes[0].submissions.map(x=>x._id),
  uid: Cloud.uid, currentUserId: typeof currentUserId!=='undefined'?currentUserId:null,
  pending: Cloud.pending, failed: Cloud.failed,
  modal: document.getElementById('storageFullModal').classList.contains('show'),
  modalText: (document.getElementById('storageFullText')||{}).textContent,
}));
console.log('   학생 상태:', JSON.stringify(sState));
ok('제출 저장', sState.subs===1, JSON.stringify(sState.status));
ok('서버 쓰기 실패 없음', sState.failed===false, sState.modalText||'');

console.log('\n[선생님] 제출물이 보이는지');
await waitFor(T,()=>classes[0].submissions.length===1, 25000);
const tSees = await T.evaluate(()=>{
  const c=classes[0];
  return { subs:c.submissions.length, status:c.submissions[0]&&c.submissions[0].status,
           photoCount:c.submissions[0]&&c.submissions[0].photoCount,
           loaded:c.submissions[0]&&c.submissions[0].photosLoaded };
});
console.log('   선생님이 본 것:', JSON.stringify(tSees));
ok('★ 학생 제출물이 선생님에게 도착', tSees.subs===1 && tSees.status==='pending');
ok('사진은 목록에서 안 받아옴(지연 로딩)', tSees.loaded===false && tSees.photoCount===1);

console.log('\n[선생님] 사진 열어보기 + 승인');
const stuName = issued[0].name;
const hwIdT = await T.evaluate(()=>classes[0].homeworks[0].id);
await T.evaluate(()=>switchDetailTab('homework')); await T.waitForTimeout(400);
let gotPhoto=false;
for (let i=0;i<6 && !gotPhoto;i++){
  await T.evaluate(async ([n,h])=>{ await openSubmissionPreview(n,h); }, [stuName,hwIdT]);
  gotPhoto = await T.evaluate(()=>{ const s=classes[0].submissions[0]; return !!(s&&s.photosLoaded&&s.photos.length>0); });
  if(!gotPhoto) await T.waitForTimeout(1500);
}
const photoState = await T.evaluate(()=>{
  const s=classes[0].submissions[0];
  return { loaded:s.photosLoaded, n:s.photos.length,
           isImage: !!(s.photos[0]&&s.photos[0].indexOf('data:image')===0),
           shown: document.querySelectorAll('#previewThumbRow .thumb').length };
});
const photoDocs = await T.evaluate(async ()=>{
  const F=window.FB, c=classes[0], sub=c.submissions[0];
  try { const qs=await F.getDocs(F.collection(F.db,'classes',c.id,'submissions',sub._id,'photos'));
        return {개수:qs.size, ids:qs.docs.map(d=>d.id)}; }
  catch(e){ return {오류:e.code}; }
});
console.log('   서버 사진 문서:', JSON.stringify(photoDocs));
console.log('   사진:', JSON.stringify(photoState));
ok('열어볼 때 사진을 받아옴', photoState.loaded===true && photoState.n===1 && photoState.isImage);
ok('화면에 사진 표시', photoState.shown===1, photoState.shown+'장');

await T.evaluate(([n,h])=>approveSubmission(n,h),[stuName,hwIdT]);
await waitFor(T,()=>classes[0].submissions[0].status==='approved', 20000);
ok('선생님 승인 처리(화면)', await T.evaluate(()=>classes[0].submissions[0].status)==='approved');
await T.waitForTimeout(2500);
const svr = await T.evaluate(async ()=>{
  const F=window.FB,c=classes[0],sub=c.submissions[0];
  const out={pending:Cloud.pending, failed:Cloud.failed};
  try{ const d=await F.getDoc(F.doc(F.db,'classes',c.id,'submissions',sub._id));
       out.서버status = d.exists()? d.data().status : '(문서없음)'; }
  catch(e){ out.읽기오류=e.code; }
  return out;
});
console.log('   서버 확인:', JSON.stringify(svr));
ok('승인이 서버에 반영', svr.서버status==='approved', JSON.stringify(svr));

const sDiag = await S.evaluate(()=>({
  subs: classes[0].submissions.length,
  ids: classes[0].submissions.map(x=>x._id),
  hwIds: classes[0].homeworks.map(h=>h.id),
  uid: Cloud.uid,
  구독수: Object.values(Cloud.classUnsubs).reduce((n,a)=>n+a.length,0),
}));
console.log('   학생 구독 상태:', JSON.stringify(sDiag));
console.log('\n[학생] 승인 결과가 보이는지');
const gotApproved = await waitFor(S,()=>classes[0].submissions[0] && classes[0].submissions[0].status==='approved', 25000);
ok('★ 승인 결과가 학생에게 도착', gotApproved, await S.evaluate(()=>classes[0].submissions[0]&&classes[0].submissions[0].status));

console.log('\n[학생] 새로고침해도 유지되는지');
await S.reload({waitUntil:'domcontentloaded'});
await waitPage(S,'page-home',25000);
await waitFor(S,()=>classes[0]&&classes[0].submissions.length===1, 25000);
const afterReload = await S.evaluate(()=>({
  page:(document.querySelector('.page.active')||{}).id,
  cls:classes.length, hw:classes[0]?classes[0].homeworks.length:0,
  sub:classes[0]?classes[0].submissions.length:0,
  status:classes[0]&&classes[0].submissions[0]?classes[0].submissions[0].status:null }));
console.log('   ', JSON.stringify(afterReload));
ok('새로고침 후 로그인 유지', afterReload.page==='page-home');
ok('새로고침 후 자료 유지', afterReload.hw===1 && afterReload.sub===1 && afterReload.status==='approved');

console.log('\n오류', errs.length); errs.slice(0,8).forEach(e=>console.log('  ❌',e.slice(0,140)));
console.log(fails.length===0&&errs.length===0 ? '\n🎉 전체 통과' : `\n⚠️  실패 ${fails.length} / 오류 ${errs.length}`);
await b.close();
})();
