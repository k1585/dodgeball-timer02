module.exports = async (p, ck, label, shot) => {
  await p.screenshot({path: shot + '-1-home.png'});
  await p.click('#start'); await p.waitForTimeout(200);
  await p.screenshot({path: shot + '-2-q1.png'});
  await p.click('[data-pick="yes"]'); await p.waitForTimeout(400);
  await p.click('[data-pick="print"]'); await p.waitForTimeout(400);
  await p.click('[data-sample]'); await p.waitForTimeout(800);
  await p.screenshot({path: shot + '-3-upload.png'});
  await p.click('#next'); await p.click('[data-pp="func"]'); ck('advice', await p.textContent('#adv'));
  await p.click('#next'); ck('recommend', await p.textContent('.choice .fd-badge >> xpath=../..'));
  await p.click('[data-mat="PETG"]'); await p.click('#next'); await p.click('[data-col="파랑"]'); await p.click('#next');
  await p.click('[data-q="1"]'); await p.click('#next');
  ck('quote', await p.textContent('.fd-q-total'));
  await p.screenshot({path: shot + '-4-quote.png'});
  await p.click('[data-jump="qty"]'); await p.click('[data-q="-1"]'); await p.click('#next');
  ck('quote qty1', await p.textContent('.fd-q-total'));
  await p.click('#next'); await p.fill('#cc-name', '테스트'); await p.fill('#cc-phone', '010-1234-0000'); await p.check('#cc-consent'); await p.click('#next'); await p.waitForTimeout(300);
  ck('done', await p.textContent('.fd-done-no b'));
  // 아이디어 경로 → 정밀 → 전문 모델링
  await p.goto(p.url().split('#')[0] + '#/'); await p.click('#start');
  await p.click('[data-pick="no"]'); await p.waitForTimeout(300); await p.click('[data-pick="idea"]'); await p.waitForTimeout(300); await p.click('[data-pick="yes"]'); await p.waitForTimeout(300);
  ck('pro first q', await p.textContent('.q h2'));
  let n = 0;
  while (n++ < 20){
    const h = await p.textContent('.q h2');
    if (h.includes('견적이 나왔어요')) break;
    if (await p.$('#c-title')) await p.fill('#c-title', '센서 케이스');
    if (await p.$('#c-desc')) await p.fill('#c-desc', '보드 40x30 들어가는 2파트 끼움 케이스');
    if (await p.$('#c-dims')){ const d = p.locator('#c-dims input'); await d.nth(0).fill('60'); await d.nth(1).fill('40'); await d.nth(2).fill('20'); }
    if (await p.$('#c-complexity')) await p.click('#c-complexity [data-v="simple"]');
    if (await p.$('#c-output')) await p.click('#c-output [data-v="print"]');
    await p.click('#next'); await p.waitForTimeout(150);
  }
  ck('pro quote', await p.textContent('.fd-q-total'));
  await p.screenshot({path: shot + '-5-pro-quote.png'});
};
