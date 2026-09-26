const { chromium } = require('playwright');
const L = require('./fblaunch');
(async()=>{
const b=await chromium.launch({executablePath:L.exe,headless:true,args:L.args});
const p=await b.newPage(); await L.useLocalSdk(p);
p.on('console',m=>{ if(m.type()==='log') console.log('  '+m.text()); });
await p.goto(L.base,{waitUntil:'domcontentloaded'}); await p.waitForTimeout(1200);

const out = await p.evaluate(async () => {
  const F=window.FB, PW='TestPw12345!', R=[], made=[];
  const t=Date.now();
  const ok=(label,pass,detail)=>R.push({검사:label, 결과:pass?'✅ 통과':'❌ 실패', 상세:detail||''});
  const newUser=async(tag)=>{ const e=`atk-${tag}-${t}@todayhw.app`;
    const c=await F.createUserWithEmailAndPassword(F.auth,e,PW); made.push(e); return {e,uid:c.user.uid}; };
  const login=async(e)=>{ await F.signInWithEmailAndPassword(F.auth,e,PW); };
  const tryIt=async(fn)=>{ try{ await fn(); return 'allowed'; }catch(err){ return err.code||String(err); } };

  // --- 선생님 A: 반 + 숙제
  const tA=await newUser('teachA');
  await F.setDoc(F.doc(F.db,'users',tA.uid),{name:'선생A',role:'teacher'});
  const cA='atkclass-'+t;
  await F.setDoc(F.doc(F.db,'classes',cA),{name:'A반',code:'111111',teacherId:tA.uid,teacherName:'선생A'});
  await F.setDoc(F.doc(F.db,'classes',cA,'homeworks','hw1'),{title:'숙제1',due:'2026-09-30'});

  // --- 학생 X: 가입 + 제출
  const sX=await newUser('stuX');
  await F.setDoc(F.doc(F.db,'users',sX.uid),{name:'학생X',role:'student',classId:cA});
  await F.setDoc(F.doc(F.db,'classes',cA,'students',sX.uid),{name:'학생X'});
  const subX='hw1_'+sX.uid;
  await F.setDoc(F.doc(F.db,'classes',cA,'submissions',subX),
    {hwId:'hw1',studentUid:sX.uid,studentName:'학생X',status:'pending',photoCount:1});
  await F.setDoc(F.doc(F.db,'classes',cA,'submissions',subX,'photos','0'),{data:'사진내용X'});

  // --- 학생 Y: 가입 + 제출
  const sY=await newUser('stuY');
  await F.setDoc(F.doc(F.db,'users',sY.uid),{name:'학생Y',role:'student',classId:cA});
  await F.setDoc(F.doc(F.db,'classes',cA,'students',sY.uid),{name:'학생Y'});
  const subY='hw1_'+sY.uid;
  await F.setDoc(F.doc(F.db,'classes',cA,'submissions',subY),
    {hwId:'hw1',studentUid:sY.uid,studentName:'학생Y',status:'pending',photoCount:1});

  // ===== 공격 1: 학생Y가 학생X의 제출물을 훔쳐본다 (지금 Y로 로그인돼 있음)
  ok('학생이 다른 학생 제출물 읽기',
     (await tryIt(()=>F.getDoc(F.doc(F.db,'classes',cA,'submissions',subX))))==='permission-denied',
     '거부돼야 정상');
  ok('학생이 다른 학생 사진 읽기',
     (await tryIt(()=>F.getDoc(F.doc(F.db,'classes',cA,'submissions',subX,'photos','0'))))==='permission-denied',
     '거부돼야 정상');
  ok('학생이 반 전체 제출물 목록 훑기',
     (await tryIt(()=>F.getDocs(F.collection(F.db,'classes',cA,'submissions'))))==='permission-denied',
     '거부돼야 정상');

  // ===== 공격 2: 학생이 자기 숙제를 스스로 승인한다
  const selfApprove = await tryIt(()=>F.updateDoc(F.doc(F.db,'classes',cA,'submissions',subY),{status:'approved'}));
  ok('학생이 자기 숙제 스스로 승인', selfApprove==='permission-denied', '거부돼야 정상 / 실제='+selfApprove);
  const selfReject = await tryIt(()=>F.updateDoc(F.doc(F.db,'classes',cA,'submissions',subY),{status:'rejected'}));
  ok('학생이 상태를 임의로 바꾸기', selfReject==='permission-denied', '거부돼야 정상 / 실제='+selfReject);
  const resubmit = await tryIt(()=>F.updateDoc(F.doc(F.db,'classes',cA,'submissions',subY),{status:'pending',note:'다시 냅니다'}));
  ok('학생이 다시 제출하기', resubmit==='allowed', '허용돼야 정상 / 실제='+resubmit);

  // ===== 공격 3: 학생이 숙제를 지우거나 만든다
  ok('학생이 숙제 만들기',
     (await tryIt(()=>F.setDoc(F.doc(F.db,'classes',cA,'homeworks','fake'),{title:'가짜'})))==='permission-denied');
  ok('학생이 반 정보 고치기',
     (await tryIt(()=>F.updateDoc(F.doc(F.db,'classes',cA),{name:'내반'})))==='permission-denied');

  // ===== 공격 4: 남의 반 선생님
  const tB=await newUser('teachB');
  await F.setDoc(F.doc(F.db,'users',tB.uid),{name:'선생B',role:'teacher'});
  ok('다른 선생님이 남의 반 읽기',
     (await tryIt(()=>F.getDoc(F.doc(F.db,'classes',cA))))==='permission-denied');
  ok('다른 선생님이 남의 반 제출물 읽기',
     (await tryIt(()=>F.getDoc(F.doc(F.db,'classes',cA,'submissions',subX))))==='permission-denied');

  // ===== 정상 동작도 확인 (너무 잠가서 앱이 못 쓰게 되면 안 됨)
  await login(tA.e);
  ok('담당 선생님이 제출물 목록 읽기',
     (await tryIt(()=>F.getDocs(F.collection(F.db,'classes',cA,'submissions'))))==='allowed','허용돼야 정상');
  ok('담당 선생님이 학생 사진 읽기',
     (await tryIt(()=>F.getDoc(F.doc(F.db,'classes',cA,'submissions',subX,'photos','0'))))==='allowed','허용돼야 정상');
  ok('담당 선생님이 승인 처리',
     (await tryIt(()=>F.updateDoc(F.doc(F.db,'classes',cA,'submissions',subX),{status:'approved'})))==='allowed','허용돼야 정상');
  await login(sX.e);
  ok('학생이 자기 제출물 읽기',
     (await tryIt(()=>F.getDoc(F.doc(F.db,'classes',cA,'submissions',subX))))==='allowed','허용돼야 정상');
  ok('학생이 자기 사진 읽기',
     (await tryIt(()=>F.getDoc(F.doc(F.db,'classes',cA,'submissions',subX,'photos','0'))))==='allowed','허용돼야 정상');

  /* ===== 뒷정리
     여기서 멈추면 검사 결과가 한 줄도 안 나온다. 실제로 그렇게 멈춰서
     '검사가 통째로 죽은 것'처럼 보였다. 한 걸음마다 시간을 재고,
     오래 걸리면 포기하고 넘어간다. 치우다 실패해도 결과는 나와야 한다. */
  const cap = (pr, ms) => Promise.race([
    Promise.resolve(pr).catch(e => 'err:' + (e && e.code || e)),
    new Promise(r => setTimeout(() => r('시간초과'), ms)),
  ]);
  const cleanup=[];
  await cap(login(tA.e), 8000);
  for (const d of [
    ['classes',cA,'submissions',subX,'photos','0'],
    ['classes',cA,'submissions',subX],['classes',cA,'submissions',subY],
    ['classes',cA,'students',sX.uid],['classes',cA,'students',sY.uid],
    ['classes',cA,'homeworks','hw1'],['classes',cA]]) {
    await cap(F.deleteDoc(F.doc(F.db,...d)), 8000);
  }
  for (const u of [tA,sX,sY,tB]) {
    const a = await cap(login(u.e), 8000);
    if (a === '시간초과') { cleanup.push(u.e+': 로그인 시간초과'); continue; }
    const me = F.auth.currentUser;
    if (!me) { cleanup.push(u.e+': 로그인 안 됨'); continue; }
    await cap(F.deleteDoc(F.doc(F.db,'users',me.uid)), 8000);
    const r = await cap(F.deleteUser(me), 8000);
    if (r === '시간초과' || (typeof r === 'string' && r.startsWith('err:')))
      cleanup.push(u.e+': '+r);
  }
  return {결과:R, 정리실패:cleanup};
});

console.table(out.결과);
const fails = out.결과.filter(r=>r.결과.startsWith('❌'));
console.log(fails.length===0 ? '\n🎉 모든 검사 통과' : `\n⚠️  ${fails.length}건 실패`);
if (out.정리실패.length) console.log('정리 못한 것:', out.정리실패);
await b.close();})();
