import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadEstate, estateHtml } from '../lib/hobbies.mjs';

const machines = loadEstate('content/estate.json');

// A temp file, so the invalid cases exercise the real parse-and-validate path rather
// than a hand-built object that skips JSON.parse.
const withJson = (value) => {
  const p = join(mkdtempSync(join(tmpdir(), 'estate-')), 'estate.json');
  writeFileSync(p, JSON.stringify(value));
  return p;
};

test('every machine is well-formed and there are six', () => {
  const statuses = new Set(['live', 'staged', 'planned']);
  for (const m of machines) {
    assert.match(m.id, /^[a-z0-9-]+$/, m.id);
    assert.ok(m.name && m.kind && m.purpose, m.id);
    assert.ok(statuses.has(m.status), `${m.id}: ${m.status}`);
    assert.ok(Array.isArray(m.specs) && m.specs.length, `${m.id}: specs`);
    for (const s of m.specs) assert.ok(typeof s === 'string' && s.trim(), `${m.id}: empty spec`);
    // The site-wide copy rule: no percentages anywhere in the prose.
    assert.ok(!m.purpose.includes('%'), `${m.id}: no percentages`);
  }
  assert.equal(machines.length, 6);
  assert.equal(new Set(machines.map((m) => m.id)).size, 6);
});

test('loadEstate rejects what would render as a silently broken plate', () => {
  const base = { id: 'x', name: 'X', kind: 'A box', status: 'live', specs: ['1 GB'], purpose: 'Does a thing.' };
  assert.throws(() => loadEstate(withJson({ ...base })), /expected an array/);
  assert.throws(() => loadEstate(withJson([{ ...base, name: '' }])), /required/);
  assert.throws(() => loadEstate(withJson([{ ...base, purpose: '' }])), /required/);
  assert.throws(() => loadEstate(withJson([{ ...base, status: 'retired' }])), /unknown status/);
  assert.throws(() => loadEstate(withJson([{ ...base, specs: [] }])), /non-empty/);
  assert.throws(() => loadEstate(withJson([{ ...base, specs: 'one' }])), /non-empty/);
});

test('a plate carries a name, a status pill, its specs and its purpose', () => {
  const html = estateHtml(machines.slice(0, 1));
  const m = machines[0];
  assert.ok(html.includes(`<h3>${m.name} `));
  assert.ok(html.includes(`class="pill ${m.status}"`));
  for (const s of m.specs) assert.ok(html.includes(`<li>${s}</li>`), s);
  assert.ok(html.includes(m.purpose));
  assert.ok(!html.includes('{{'), 'no leftover template syntax');
});

test('markup is escaped, not interpolated', () => {
  const html = estateHtml([
    { id: 'evil', name: '<script>', kind: 'a & b', status: 'planned', specs: ['<b>x</b>'], purpose: '"quoted"' },
  ]);
  assert.ok(!html.includes('<script>'));
  assert.ok(html.includes('&lt;script&gt;') && html.includes('a &amp; b') && html.includes('&lt;b&gt;'));
});

// `node --test` runs the test files in parallel and build.mjs clears its output directory
// before writing, so building into dist/ here would empty it under test/build.test.mjs —
// which surfaces as phantom missing assets in test/links.mjs, not as a failure here.
// Build into a directory of our own instead.
function builtHobbiesPage() {
  const out = mkdtempSync(join(tmpdir(), 'estate-build-'));
  execFileSync('node', ['build.mjs'], { env: { ...process.env, BUILD_OUT: out } });
  return readFileSync(join(out, 'hobbies', 'index.html'), 'utf8');
}

test('the built page renders all six plates', () => {
  const page = builtHobbiesPage();
  assert.equal(page.split('class="estate-plate').length - 1, 6);
  assert.ok(page.includes('<div class="estate">'));
  for (const m of machines) assert.ok(page.includes(m.purpose), `${m.id}: purpose missing from the page`);
  // The one-line bullet this area replaces is gone.
  assert.ok(!page.includes('<strong>The estate</strong>'), 'the old estate bullet is still rendered');
});
