// Headless phone-size test of the app: upload, crop, convert, save.
const puppeteer = require('puppeteer-core');
const path = require('path'), fs = require('fs');
const OUT = path.join(__dirname, 'ui_out');
fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT, { recursive: true });

(async () => {
  const browser = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--disable-gpu'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 412, height: 915, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  const cdp = await page.target().createCDPSession();
  await cdp.send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: OUT });

  await page.goto('http://localhost:8765/index.html', { waitUntil: 'load' });
  await page.screenshot({ path: path.join(OUT, '1_start.png') });

  const input = await page.$('#file');
  await input.uploadFile('/mnt/user-data/uploads/WhatsApp_Image_2026-11-05_at_19_25_17.jpeg');
  await page.waitForSelector('#stage', { visible: true });

  // drag a box over the flower motif (photo coords 228,590 -> 685,1000 of 899x1599)
  const box = await (await page.$('#src')).boundingBox();
  const sx = box.width / 899, sy = box.height / 1599;
  await page.mouse.move(box.x + 228 * sx, box.y + 590 * sy);
  await page.mouse.down();
  await page.mouse.move(box.x + 450 * sx, box.y + 800 * sy, { steps: 5 });
  await page.mouse.move(box.x + 685 * sx, box.y + 1000 * sy, { steps: 5 });
  await page.mouse.up();
  console.log('crop label:', await page.$eval('#cropInfo', e => e.textContent));

  await page.click('#kind button[data-v="photo"]');
  await page.$eval('#width', e => { e.value = 92; });
  await page.$eval('#tilt', e => { e.value = 1.13; e.dispatchEvent(new Event('input')); });
  await page.screenshot({ path: path.join(OUT, '2_cropped.png'), fullPage: true });

  const t0 = Date.now();
  await page.click('#go');
  await page.waitForSelector('#result', { visible: true, timeout: 120000 });
  console.log('converted in', ((Date.now() - t0) / 1000).toFixed(1), 's');
  console.log('chips:', await page.$eval('#chips', e => e.innerText.replace(/\n/g, ' | ')));
  console.log('hoop:', await page.$eval('#hoop', e => e.textContent));
  console.log('threads:', await page.$$eval('#threads li', l => l.map(x => x.textContent).join(', ')));
  await page.screenshot({ path: path.join(OUT, '3_result.png'), fullPage: true });

  await page.$eval('#fname', e => { e.value = 'flowers_from_app'; });
  await page.click('#save');
  for (let i = 0; i < 40 && !fs.existsSync(path.join(OUT, 'flowers_from_app.jef')); i++) await new Promise(r => setTimeout(r, 250));
  console.log('downloaded:', fs.existsSync(path.join(OUT, 'flowers_from_app.jef')));
  console.log('errors:', errors.length ? errors : 'none');
  await browser.close();
})().catch(e => { console.error('TEST FAILED', e); process.exit(1); });
