// Pretend to be the Capacitor Android bridge and check what the app sends to it.
const puppeteer = require('puppeteer-core'), fs = require('fs');
(async () => {
  const browser = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 412, height: 915, isMobile: true, hasTouch: true });
  await page.evaluateOnNewDocument(() => {
    window.__calls = [];
    window.Capacitor = {
      isNativePlatform: () => true,
      PluginHeaders: [{ name: 'Filesystem' }, { name: 'Share' }],
      nativePromise: (p, m, o) => { window.__calls.push({ p, m, o }); return Promise.resolve(m === 'writeFile' ? { uri: 'file:///cache/' + o.path } : {}); }
    };
  });
  await page.goto('http://localhost:8765/index.html');
  await (await page.$('#file')).uploadFile('/home/claude/jefapp/test/clipart.png');
  await page.waitForSelector('#stage', { visible: true });
  await page.click('#go');
  await page.waitForSelector('#result', { visible: true, timeout: 60000 });
  await page.click('#save'); await new Promise(r => setTimeout(r, 300));
  await page.click('#share'); await new Promise(r => setTimeout(r, 300));
  const calls = await page.evaluate(() => window.__calls);
  for (const c of calls) {
    const o = Object.assign({}, c.o); if (o.data) { const buf = Buffer.from(o.data, 'base64'); o.data = `<${buf.length} bytes>`; if (c.o.directory === 'DOCUMENTS') fs.writeFileSync('native_saved.jef', buf); }
    console.log(c.p + '.' + c.m, JSON.stringify(o));
  }
  console.log('toast:', await page.$eval('#toast', e => e.textContent));
  await browser.close();
})().catch(e => { console.error('FAILED', e); process.exit(1); });
