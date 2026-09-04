// tools/shoot.mjs — node tools/shoot.mjs [name…]
// Reads shots.local.json (git-ignored), captures each target with Playwright, writes assets/shots/{name}.png.
import { readFileSync, mkdirSync, existsSync } from 'node:fs';
import { chromium } from 'playwright';

const cfg = JSON.parse(readFileSync('shots.local.json', 'utf8'));
const only = new Set(process.argv.slice(2));
// A mistyped name would otherwise capture nothing and still exit 0.
const known = new Set(cfg.targets.map((t) => t.name));
for (const name of only) if (!known.has(name)) { console.error(`FAIL ${name}: no such target`); process.exit(1); }
mkdirSync('assets/shots', { recursive: true });

// Blur anything that looks like money. Applied before capture, never saved anywhere.
const MONEY_CSS = `[data-redacted]{filter:blur(9px)!important}`;
async function redactMoney(page) {
  await page.addStyleTag({ content: MONEY_CSS });
  await page.evaluate(() => {
    const re = /£\s?\d|\d+\.\d{2}\b|\b\d{1,3}(,\d{3})+\b/;
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const hits = [];
    while (walker.nextNode()) if (re.test(walker.currentNode.nodeValue)) hits.push(walker.currentNode.parentElement);
    for (const el of hits) el.setAttribute('data-redacted', '1');
  });
}

// Prefer networkidle, but an app holding a websocket open never reaches it, and a page with one
// stalled subresource never reaches `load` either. Neither is a failed page load, so step down
// through the weaker conditions before giving up. Only a real navigation error is a FAIL.
const LOAD_STATES = ['networkidle', 'load', 'domcontentloaded'];
async function goto(page, t) {
  for (const [i, waitUntil] of LOAD_STATES.entries()) {
    try {
      await page.goto(t.url, { waitUntil, timeout: 45000 });
      if (i) console.log(`note ${t.name}: never reached ${LOAD_STATES[i - 1]}, captured on ${waitUntil}`);
      return;
    } catch (e) {
      if (!/Timeout/i.test(e.message) || i === LOAD_STATES.length - 1) throw e;
    }
  }
}

// Remove elements a target must not publish (`hide`: a list of Playwright selectors).
// A selector that matches nothing is a hard failure: silently matching nothing would let the
// thing being suppressed reappear in a committed screenshot with no warning.
async function hideElements(page, selectors, name) {
  for (const [i, sel] of selectors.entries()) {
    const n = await page.locator(sel).evaluateAll((els) => {
      for (const el of els) el.style.display = 'none';
      return els.length;
    });
    if (!n) throw new Error(`hide[${i}] matched no element on ${name}`);
  }
}

// A stale or expired login state lands on a sign-in form and would be captured happily. Check the
// page itself rather than per-app selectors: a login URL, or a password box the viewer can see.
// `:visible` matters — an app can carry a hidden sign-in form inside a settings panel.
async function assertNotLoginPage(page) {
  const looksLikeLogin =
    /\/login\b/i.test(page.url()) || (await page.locator('input[type=password]:visible').count()) > 0;
  if (looksLikeLogin) throw new Error('login required or session expired');
}

const VIEWPORT = { width: 1440, height: 900 };
const CONTEXT_OPTS = { viewport: VIEWPORT, colorScheme: 'dark', ignoreHTTPSErrors: true, deviceScaleFactor: 1 };

const browser = await chromium.launch();
const ctx = await browser.newContext(CONTEXT_OPTS);
// One extra context per login-state file, created lazily and reused.
const authContexts = new Map();
async function contextFor(storage) {
  if (!storage) return ctx;
  if (!authContexts.has(storage)) {
    authContexts.set(storage, await browser.newContext({ ...CONTEXT_OPTS, storageState: storage }));
  }
  return authContexts.get(storage);
}

for (const t of cfg.targets) {
  if (only.size && !only.has(t.name)) continue;
  if (t.storage && !existsSync(t.storage)) {
    console.log(`skip ${t.name}: no login state at ${t.storage}`);
    continue;
  }
  const page = await (await contextFor(t.storage)).newPage();
  try {
    await goto(page, t);
    if (t.wait) await page.waitForSelector(t.wait, { timeout: 20000 });
    await page.waitForTimeout(1500);
    await assertNotLoginPage(page);
    if (t.hide?.length) await hideElements(page, t.hide, t.name);
    if (t.redact === 'money') await redactMoney(page);
    await page.screenshot({ path: `assets/shots/${t.name}.png`, clip: t.clip ?? undefined });
    console.log(`ok   ${t.name}`);
  } catch (e) {
    console.error(`FAIL ${t.name}: ${e.message.split('\n')[0]}`);
    process.exitCode = 1;
  } finally { await page.close(); }
}
for (const c of authContexts.values()) await c.close();
await browser.close();
