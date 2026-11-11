// 파일 형식별 분석·견적 확인 (STL 바이너리/ASCII, 3MF, 슬라이싱 3MF, G-code, 손상 파일, 지원 안 하는 형식, 너무 큰 모델)
const {chromium} = require('playwright'); const path = require('path'), fs = require('fs');
const R = path.resolve(__dirname, '..'), DIR = process.argv[2];
(async () => { const b = await chromium.launch(); const p = await b.newPage();
  await p.goto('file://' + R + '/concepts/concept-b-configurator.html');
  const files = fs.readdirSync(DIR).filter(f => /\.(stl|3mf|gcode)$/.test(f));
  files.push('broken.stl', 'note.txt');
  for (const f of files){
    const buf = fs.existsSync(path.join(DIR, f)) ? [...fs.readFileSync(path.join(DIR, f))] : [...Buffer.from(f === 'broken.stl' ? 'garbage' : 'hello')];
    const r = await p.evaluate(async ([name, bytes]) => { const m = await FD.analyzeFile(new File([new Uint8Array(bytes)], name)); const q = FD.quotePrint(m, FD.defaultPrintOpts());
      return {kind: q.kind, total: q.total ? Math.round(q.total) : null, g: q.g ? +q.g.toFixed(1) : null, dims: m.dims ? m.dims.map(x => +x.toFixed(1)).join('×') : null, sliced: !!m.sliced, why: (q.reasons || [])[0] || m.error || ''}; }, [f, buf]);
    console.log(f.padEnd(24), JSON.stringify(r));
  }
  await b.close(); })();
