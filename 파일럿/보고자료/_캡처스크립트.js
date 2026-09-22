const { chromium } = require('playwright');
const fs = require('fs');
const url = 'file:///home/user/dodgeball-timer02/오늘의숙제.html';
const DIR = __dirname + '/manual';
fs.mkdirSync(DIR, { recursive: true });

(async () => {
  const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome', headless:true, args:['--no-sandbox'] });
  const page = await b.newPage({ viewport:{width:420,height:900} });
  const errs=[]; page.on('pageerror',e=>errs.push(e.message));
  const shot = async n => {
    await page.screenshot({ path:`${DIR}/${n}.png` });
    const pg = await page.evaluate(()=>(document.querySelector('.page.active')||{}).id);
    console.log(`  📸 ${n.padEnd(18)} → ${pg}`);
  };
  const active = () => page.evaluate(()=>(document.querySelector('.page.active')||{}).id);

  await page.goto(url,{waitUntil:'domcontentloaded'});
  await page.evaluate(()=>localStorage.clear());
  await page.goto(url,{waitUntil:'domcontentloaded'}); await page.waitForTimeout(500);

  // ---------- 선생님 ----------
  console.log('\n[선생님]');
  await page.click('.welcome-start-btn'); await page.waitForTimeout(350);
  await shot('T01-역할선택');

  await page.click('.role-card.teacher'); await page.waitForTimeout(350);
  await shot('T02-로그인화면');

  await page.click('#page-t-name-input .auth-signup-btn'); await page.waitForTimeout(350);
  await page.fill('#signupName','김서연');
  await page.fill('#signupPw','Teach2026!');
  await page.fill('#signupPwConfirm','Teach2026!');
  await page.check('#agreeTerms'); await page.waitForTimeout(250);
  await shot('T03-회원가입');

  await page.click('#page-signup button:has-text("가입 완료")'); await page.waitForTimeout(450);
  await page.click('#signupDoneModal button:has-text("확인")'); await page.waitForTimeout(500);
  await page.click('.welcome-start-btn'); await page.waitForTimeout(300);
  await page.click('.role-card.teacher'); await page.waitForTimeout(300);
  await page.fill('#tchLoginName','김서연'); await page.fill('#tchLoginPw','Teach2026!');
  await page.click('#page-t-name-input button:has-text("로그인")'); await page.waitForTimeout(700);
  await shot('T04-홈_반없음');

  await page.evaluate(()=>startAddClass('t-home')); await page.waitForTimeout(400);
  await page.fill('#classInput','중2 영어 A반'); await page.waitForTimeout(200);
  await shot('T05-반이름입력');
  await page.click('#classConfirmBtn'); await page.waitForTimeout(600);
  const code = await page.evaluate(()=>[...document.querySelectorAll('#codeDisplay span')].map(s=>s.textContent).join(''));
  await shot('T06-반코드');
  console.log('  반 코드:', code);
  await page.click('#codeNextBtn'); await page.waitForTimeout(500);

  // 숙제 2건을 실제 화면에서 만들기
  await page.click('#page-t-home .nav-item[data-nav="t-students"]'); await page.waitForTimeout(400);
  await page.click('#page-t-students .student-card'); await page.waitForTimeout(500);
  await page.evaluate(()=>switchDetailTab('homework')); await page.waitForTimeout(500);
  await page.evaluate(()=>toggleAddHwForm()); await page.waitForTimeout(350);
  await page.fill('#newHwTitle','단어 시험 범위 1~30');
  await page.fill('#newHwDesc','Unit 5 단어 외우고 노트에 3번씩 쓰기');
  await page.waitForTimeout(200);
  await shot('T07-숙제만들기');
  await page.click('#newHwConfirmBtn'); await page.waitForTimeout(600);

  await page.evaluate(()=>toggleAddHwForm()); await page.waitForTimeout(300);
  await page.fill('#newHwTitle','교과서 45쪽 문제 풀기');
  await page.fill('#newHwDesc','1번~8번까지');
  await page.click('#newHwConfirmBtn'); await page.waitForTimeout(600);
  await shot('T08-숙제목록');

  // 학생 2명 추가로 채워 명단이 비지 않게
  await page.evaluate(()=>{
    classes[0].students.push({name:'박지민'},{name:'최유나'});
    saveState();
  });
  await page.evaluate(()=>switchDetailTab('manage')); await page.waitForTimeout(500);
  await shot('T09-학생관리');

  // ---------- 학생 ----------
  console.log('\n[학생]');
  await page.goto(url,{waitUntil:'domcontentloaded'}); await page.waitForTimeout(400);
  await page.click('.welcome-start-btn'); await page.waitForTimeout(300);
  await page.click('.role-card.student'); await page.waitForTimeout(350);
  await shot('S01-로그인화면');

  await page.click('#page-name-input .auth-signup-btn'); await page.waitForTimeout(350);
  await page.fill('#signupName','이준호');
  await page.fill('#signupPw','Study2026!');
  await page.fill('#signupPwConfirm','Study2026!');
  await page.check('#agreeTerms'); await page.waitForTimeout(200);
  await shot('S02-회원가입');
  await page.click('#page-signup button:has-text("가입 완료")'); await page.waitForTimeout(450);
  await page.click('#signupDoneModal button:has-text("확인")'); await page.waitForTimeout(500);

  await page.click('.welcome-start-btn'); await page.waitForTimeout(300);
  await page.click('.role-card.student'); await page.waitForTimeout(300);
  await page.fill('#stuLoginName','이준호'); await page.fill('#stuLoginPw','Study2026!');
  await page.click('#page-name-input button:has-text("로그인")'); await page.waitForTimeout(700);
  await shot('S03-반없음');

  await page.click('#sClassList .add-class-btn'); await page.waitForTimeout(500);
  const boxes = await page.$$('.otp-box');
  for (let i=0;i<6;i++){ await boxes[i].fill(code[i]); await page.waitForTimeout(70); }
  await page.waitForTimeout(500);
  await shot('S04-코드입력');
  await page.click('#codeOkBtn'); await page.waitForTimeout(700);
  await shot('S05-등록완료');
  await page.click('#restartOnboardBtn'); await page.waitForTimeout(600);
  await page.click('#sClassList .student-card'); await page.waitForTimeout(600);
  await shot('S06-홈');

  // 숙제 제출 (공책 사진처럼 보이는 이미지 생성)
  const hwId = await page.evaluate(()=>classes[joinedClassIndex].homeworks[0].id);
  await page.evaluate(id=>openDetailCard(id), hwId);
  await page.waitForTimeout(500);
  await page.evaluate(()=>{
    function photo(seed){
      const c=document.createElement('canvas'); c.width=600; c.height=800;
      const x=c.getContext('2d');
      x.fillStyle='#FDFBF6'; x.fillRect(0,0,600,800);
      x.strokeStyle='#DCE3EE'; x.lineWidth=2;
      for(let y=90;y<770;y+=46){ x.beginPath(); x.moveTo(45,y); x.lineTo(555,y); x.stroke(); }
      x.strokeStyle='#33436B'; x.lineWidth=4; x.lineCap='round';
      let r=seed;
      const rnd=()=>{ r=(r*1103515245+12345)&0x7fffffff; return r/0x7fffffff; };
      for(let y=90;y<760;y+=46){
        let cx=60; const words=3+Math.floor(rnd()*3);
        for(let w=0;w<words;w++){
          const len=50+rnd()*90;
          x.beginPath(); x.moveTo(cx,y-8);
          for(let s=0;s<len;s+=10) x.lineTo(cx+s, y-8-Math.sin(s/7+rnd())*6);
          x.stroke(); cx+=len+22;
          if(cx>470) break;
        }
      }
      return c.toDataURL('image/jpeg',0.8);
    }
    uploadedPhotos=[photo(7),photo(23)];
    renderPhotoSection(document.getElementById('photoCount'),document.getElementById('thumbRow'),uploadedPhotos,true,()=>{});
    document.getElementById('teacherNote').value='단어 3번씩 다 썼습니다!';
  });
  await page.waitForTimeout(400);
  await shot('S07-사진올리기');
  await page.click('#submitBtn'); await page.waitForTimeout(800);
  await shot('S08-제출완료');

  await page.click('button:has-text("홈 화면으로 이동하기")'); await page.waitForTimeout(700);
  await page.click('#page-home .nav-item[data-nav="calendar"]'); await page.waitForTimeout(800);
  const s9 = await active();
  if (s9 !== 'page-calendar') throw new Error('달력으로 못 감: ' + s9);
  await shot('S09-달력');

  // ---------- 선생님: 승인 ----------
  console.log('\n[선생님 승인]');
  await page.goto(url,{waitUntil:'domcontentloaded'}); await page.waitForTimeout(400);
  await page.click('.welcome-start-btn'); await page.waitForTimeout(300);
  await page.click('.role-card.teacher'); await page.waitForTimeout(300);
  await page.fill('#tchLoginName','김서연'); await page.fill('#tchLoginPw','Teach2026!');
  await page.click('#page-t-name-input button:has-text("로그인")'); await page.waitForTimeout(700);
  await shot('T10-홈');

  await page.click('#page-t-home .nav-item[data-nav="t-students"]'); await page.waitForTimeout(400);
  await page.click('#page-t-students .student-card'); await page.waitForTimeout(500);
  await page.evaluate(()=>openHwStatusTab()); await page.waitForTimeout(700);
  await shot('T11-숙제현황');

  await page.evaluate(()=>openTeacherHomeworkCalendar()); await page.waitForTimeout(600);
  await shot('T12-달력');

  console.log('\n에러:', errs.length);
  errs.forEach(e=>console.log('  ❌',e));
  await b.close();
})();
