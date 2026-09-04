// test/smoke.mjs — node test/smoke.mjs
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync, mkdirSync } from 'node:fs';
import { join, extname } from 'node:path';
import { chromium } from '../tools/node_modules/playwright/index.mjs';

const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.jpg': 'image/jpeg', '.ico': 'image/x-icon', '.svg': 'image/svg+xml' };
const server = createServer((req, res) => {
  let p = join('dist', decodeURIComponent(req.url.split('?')[0]));
  if (existsSync(p) && statSync(p).isDirectory()) p = join(p, 'index.html');
  if (!existsSync(p)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': types[extname(p)] ?? 'application/octet-stream' });
  res.end(readFileSync(p));
}).listen(0);
const base = `http://localhost:${server.address().port}`;
mkdirSync('review', { recursive: true });

const routes = ['', 'about', 'experience', 'projects', 'skills', 'hobbies', 'contact'];
const failures = [];
const browser = await chromium.launch();
for (const width of [1440, 390]) {
  const page = await browser.newPage({ viewport: { width, height: width > 600 ? 900 : 844 } });
  // `current` is set right before each goto and only advances after networkidle below,
  // so a late event from the previous route can never be blamed on the next one.
  let current = '';
  page.on('console', (m) => { if (m.type() === 'error') failures.push(`${width} /${current}/: console ${m.text()}`); });
  page.on('response', (resp) => { if (resp.status() >= 400 && resp.url().startsWith(base)) failures.push(`${width} /${current}/: ${resp.status()} ${resp.url()}`); });
  for (const r of routes) {
    current = r;
    await page.goto(`${base}/${r}${r ? '/' : ''}`, { waitUntil: 'load' });
    // Force every loading="lazy" image to be requested before judging the route —
    // otherwise one below the fold at a narrow width silently never fetches.
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: `review/${r || 'home'}-${width}.png`, fullPage: true });
  }
  await page.close();
}
await browser.close();
server.close();
if (failures.length) { console.error(failures.join('\n')); process.exit(1); }
console.log(`smoke ok: ${routes.length} routes × 2 widths`);
