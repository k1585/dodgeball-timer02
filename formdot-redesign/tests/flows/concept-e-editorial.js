module.exports = async (p, ck, label, shot) => {
  await p.screenshot({path: shot + '-1-home.png'});
  await p.click('.cover [data-story]'); await p.waitForTimeout(200);
  await p.screenshot({path: shot + '-2-story.png'});
  await p.click('.ask [data-ask]'); await p.waitForTimeout(200);
  ck('drawer svc', await p.textContent('.drawer .fd-badge'));
  await p.setInputFiles('#e-refs', {name: 'sketch.png', mimeType: 'image/png', buffer: Buffer.from([137,80,78,71])});
  await p.fill('#e-title', '계단 레일'); await p.click('#e-complexity [data-v="simple"]');
  await p.screenshot({path: shot + '-3-drawer.png'});
  await p.click('#nx'); ck('sketch quote', await p.textContent('.fd-q-total'));
  await p.click('#nx'); await p.fill('#ec-name', '에디'); await p.fill('#ec-phone', '010-9999-1111'); await p.check('#ec-consent'); await p.click('#nx'); await p.waitForTimeout(300);
  ck('done', await p.textContent('.fd-done-no b'));
  await p.goto(p.url().split('#')[0] + '#/stories'); await p.click('[data-f="pro"]'); ck('filter pro count', await p.locator('.idx article').count());
  await p.click('.mast .order'); await p.click('[data-svc="print"]'); await p.click('#dz [data-sample]'); await p.waitForTimeout(800);
  await p.click('#nx'); ck('print quote', await p.textContent('.fd-q-total'));
};
