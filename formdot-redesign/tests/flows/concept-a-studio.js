module.exports = async (p, ck, label, shot) => {
  await p.screenshot({path: shot + '-1-home.png'});
  await p.click('.svc-row[data-order="print"]');
  await p.click('[data-sample]'); await p.waitForTimeout(800);
  ck('print quote after sample', await p.textContent('#qbox .fd-q-total'));
  await p.screenshot({path: shot + '-2-upload.png'});
  await p.click('#shNext'); await p.click('[data-mat="PETG"]'); await p.click('[data-purpose="func"]');
  ck('PETG strong', await p.textContent('#qbox .fd-q-total'));
  await p.screenshot({path: shot + '-3-options.png'});
  await p.click('#shNext'); await p.click('#shNext');
  await p.click('#shNext'); ck('validation shown', await p.isVisible('.fd-field.bad'));
  await p.fill('#ac-name', '테스트'); await p.fill('#ac-phone', '010-1111-2222'); await p.check('#ac-consent');
  await p.click('#shNext'); await p.waitForTimeout(300);
  const no = (await p.textContent('.fd-done-no b')).trim(); ck('order no', no);
  await p.screenshot({path: shot + '-4-done.png'});
  // 모델링 (아이디어 → 정보 부족 → 검토)
  await p.goto(p.url().split('#')[0] + '#/order/idea'); await p.waitForTimeout(300);
  await p.fill('#a1-title', '멀티탭 거치대'); await p.fill('#a1-desc', '짧음');
  await p.click('#shNext'); await p.click('#a2-complexity [data-v="normal"]');
  ck('idea quote kind', await p.getAttribute('#qbox .fd-quote', 'class'));
  await p.screenshot({path: shot + '-5-idea.png'});
  await p.click('#shNext'); await p.click('#shNext');
  await p.fill('#ac-name', '테스트2'); await p.fill('#ac-phone', '01033334444'); await p.check('#ac-consent'); await p.click('#shNext');
  await p.waitForTimeout(300); ck('review done title', await p.textContent('.fd-done h2'));
  // 조회 (인증)
  await p.goto(p.url().split('#')[0] + '#/lookup'); await p.waitForTimeout(200);
  await p.fill('#lkNo', no); await p.fill('#lkPh', '010-1111-2222'); await p.click('.fd-lk .fd-btn');
  const code = (await p.textContent('.fd-demo-code code')).trim();
  await p.fill('#lkCode', code); await p.click('.fd-otp .fd-btn.primary');
  ck('lookup status', await p.textContent('.fd-steps li.now'));
  await p.screenshot({path: shot + '-6-lookup.png'});
  // 관리자
  await p.goto(p.url().split('#')[0] + '#/admin'); await p.waitForTimeout(200);
  await p.fill('.fd-adm-login input', '1234'); await p.click('.fd-adm-login .fd-btn');
  await p.click('[data-tab="review"]'); await p.click('.fd-orow >> nth=0'); await p.click('[data-act="confirm"]');
  ck('admin confirm -> pay_wait count', await p.locator('.fd-kpi b').nth(1).textContent());
  await p.click('[data-tab="orders"]');
  await p.screenshot({path: shot + '-7-admin.png'});
};
