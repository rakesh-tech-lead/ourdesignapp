// node test/run.js <image> <out.jef> '<json options>'
const fs = require('fs'), jpeg = require('jpeg-js'), { PNG } = require('pngjs');
const core = require('../dist/core.js');
const [,, inp, out, optsJson] = process.argv;
const buf = fs.readFileSync(inp);
const img = /\.png$/i.test(inp) ? PNG.sync.read(buf) : jpeg.decode(buf, { useTArray: true });
const t0 = Date.now();
const res = core.digitize(img.data, img.width, img.height, JSON.parse(optsJson || '{}'), (m, p) => process.stderr.write(`.. ${p}% ${m} (${((Date.now() - t0) / 1000).toFixed(1)}s)\n`));
fs.writeFileSync(out, core.writeJEF(res));
console.log(JSON.stringify({ ...res.info, threads: res.blocks.map(b => b.thread.name), seconds: (Date.now() - t0) / 1000 }));
