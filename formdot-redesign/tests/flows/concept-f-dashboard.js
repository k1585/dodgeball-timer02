module.exports = async (p, ck, label, shot) => {
  await p.screenshot({path: shot + '-1-home-empty.png'});
  await p.click('.zone [data-sample]'); await p.waitForTimeout(800);
  ck('quick price', await p.textContent('#qp'));
  await p.selectOption('#qs', 'strong'); await p.selectOption('#qm', 'PETG'); ck('quick petg strong', await p.textContent('#qp'));
  await p.click('#qgo'); await p.waitForTimeout(300);
  ck('carried to new', await p.textContent('#nq .fd-q-total'));
  await p.fill('#fc-name', '대시'); await p.fill('#fc-phone', '010-4444-5555'); await p.check('#fc-consent'); await p.click('#ngo'); await p.waitForTimeout(300);
  const no = (await p.textContent('.fd-done-no b')).trim(); ck('done', no);
  await p.goto(p.url().split('#')[0] + '#/'); await p.waitForTimeout(300);
  ck('active orders', await p.locator('.c4 .oc').count());
  await p.screenshot({path: shot + '-2-home.png', fullPage: label === 'desktop'});
  await p.click('.c4 [data-re]'); await p.waitForTimeout(300); ck('reorder mat', await p.getAttribute('.fd-mat.on', 'data-mat'));
  await p.click('[data-tab="idea"]'); await p.fill('#f-title', '거치대'); await p.fill('#f-desc', '책상 밑에 붙이는 멀티탭 거치대, 양면테이프'); await p.click('#f-complexity [data-v="simple"]');
  ck('idea price', await p.textContent('#nq .fd-q-total'));
  await p.screenshot({path: shot + '-3-new.png'});
  await p.goto(p.url().split('#')[0] + '#/orders'); ck('orders count', await p.locator('.oc').count());
  await p.screenshot({path: shot + '-4-orders.png'});
};
