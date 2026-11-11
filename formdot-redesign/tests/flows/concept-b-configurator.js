module.exports = async (p, ck, label, shot) => {
  const mob = label === 'mobile';
  await p.screenshot({path: shot + '-1-home.png'});
  await p.click('.zone [data-sample]'); await p.waitForTimeout(800);
  ck('print price', await p.textContent(mob ? '#mTot' : '#pTot'));
  await p.click('[data-mat="PLA-Silk"]'); ck('silk price', await p.textContent(mob ? '#mTot' : '#pTot'));
  await p.locator('.fd-adv summary').click(); await p.selectOption('[data-adv="infill"]', {index: 0}).catch(()=>{});
  await p.fill('[data-adv="infill"]', '40'); await p.locator('[data-adv="infill"]').dispatchEvent('change');
  ck('adv infill 40 price', await p.textContent(mob ? '#mTot' : '#pTot'));
  await p.screenshot({path: shot + '-2-print.png', fullPage: mob});
  await p.click(mob ? '#mBuy' : '#buy');
  await p.fill('#bc-name', '테스트'); await p.fill('#bc-phone', '01012341234'); await p.check('#bc-consent');
  await p.screenshot({path: shot + '-3-checkout.png'});
  await p.click('#go'); await p.waitForTimeout(300);
  ck('done no', await p.textContent('.fd-done-no b'));
  // 전문 모델링
  await p.click('#tabs [data-svc="pro"]'); await p.waitForTimeout(200);
  await p.fill('#b1-title', '센서 하우징'); await p.fill('#b1-desc', '센서 보드 40x30 들어가는 2파트 케이스, 끼움 방식');
  const dims = p.locator('#b1-dims input'); await dims.nth(0).fill('60'); await dims.nth(1).fill('45'); await dims.nth(2).fill('25');
  await p.click('#b2-complexity [data-v="normal"]'); await p.click('#b2-features [data-v="fit"]');
  ck('pro price', await p.textContent(mob ? '#mTot' : '#pTot'));
  await p.screenshot({path: shot + '-4-pro.png', fullPage: mob});
  await p.click(mob ? '#mBuy' : '#buy'); await p.fill('#bc-name', '테스트'); await p.fill('#bc-phone', '010-5555-6666'); await p.check('#bc-consent'); await p.click('#go'); await p.waitForTimeout(300);
  ck('pro done', await p.textContent('.fd-done h2'));
  await p.goto(p.url().split('#')[0] + '#/admin'); await p.fill('.fd-adm-login input', '1234'); await p.click('.fd-adm-login .fd-btn');
  await p.screenshot({path: shot + '-5-admin.png'});
};
