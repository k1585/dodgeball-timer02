// 시안 공통 스모크 테스트: 콘솔 오류, 프린트 주문(샘플 파일), 모델링 주문, 조회(인증), 관리자
const {chromium, devices} = require('playwright');
const path = require('path');
const R = path.resolve(__dirname, '..');
const SHOT = process.env.SHOT || path.join(R, 'tests', 'shots');
require('fs').mkdirSync(SHOT, {recursive: true});
const name = process.argv[2];
const steps = require(path.join(R, 'tests', 'flows', name + '.js'));
(async () => {
  const b = await chromium.launch();
  const out = {name, errors: [], checks: []};
  for (const [label, ctxOpt] of [['desktop', {viewport: {width: 1366, height: 860}}], ['mobile', {...devices['iPhone 13']}]]){
    const ctx = await b.newContext(ctxOpt);
    await ctx.route(/^(?!file:|https:\/\/cdn\.jsdelivr\.net|https:\/\/fonts\.)/, r => { out.errors.push('외부 요청 차단: ' + r.request().url()); r.abort(); });
    const p = await ctx.newPage();
    p.on('pageerror', e => out.errors.push(label + ' pageerror: ' + e.message));
    p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) out.errors.push(label + ' console: ' + m.text()); });
    await p.goto('file://' + path.join(R, 'concepts', name + '.html'));
    await p.waitForTimeout(600);
    const ck = (k, v) => out.checks.push([label, k, v]);
    try{ await steps(p, ck, label, SHOT + '/' + name + '-' + label); }
    catch(e){ out.errors.push(label + ' 흐름 실패: ' + e.message.split('\n')[0]); await p.screenshot({path: SHOT + '/' + name + '-' + label + '-FAIL.png'}); }
    await ctx.close();
  }
  await b.close();
  console.log(JSON.stringify(out, null, 1));
})();
