// 갤러리용 첫 화면 썸네일 (데스크톱·휴대폰)
const {chromium, devices} = require('playwright'); const path = require('path');
const R = path.resolve(__dirname, '..'), OUT = process.argv[2];
const names = ['concept-a-studio','concept-b-configurator','concept-c-guided','concept-d-engineering','concept-e-editorial','concept-f-dashboard'];
(async () => { const b = await chromium.launch();
  for (const [k, o] of [['d', {viewport: {width: 1366, height: 860}, deviceScaleFactor: 1}], ['m', {...devices['iPhone 13'], deviceScaleFactor: 1}]]){
    const c = await b.newContext(o);
    for (const n of names){ const p = await c.newPage(); await p.goto('file://' + R + '/concepts/' + n + '.html');
      await p.addStyleTag({content: '.fd-demo{display:none!important}'}); await p.waitForTimeout(900);
      await p.screenshot({path: `${OUT}/${n}-${k}.png`}); await p.close(); } await c.close(); }
  await b.close(); })();
