import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadProjects, cardsHtml } from '../lib/projects.mjs';

const projects = loadProjects('content/projects.json');

// A private repository is never linked. A private project may still link its live site,
// so the rule is about code hosts, not about having no links at all.
const CODE_HOSTS = ['github.com', 'gitlab.com', 'bitbucket.org', 'codeberg.org', 'sourcehut.org', 'sr.ht'];

test('every project is well-formed', () => {
  const statuses = new Set(['live', 'active', 'design', 'paused', 'done', 'dormant']);
  for (const p of projects) {
    assert.match(p.id, /^[a-z0-9-]+$/, p.id);
    assert.ok(p.name && p.blurb && p.languages.length, p.id);
    assert.ok(statuses.has(p.status), `${p.id}: ${p.status}`);
    assert.ok(Number.isInteger(p.year), p.id);
    assert.ok(!p.blurb.includes('%'), `${p.id}: no percentages`);
    if (p.private) {
      for (const l of p.links) {
        const host = new URL(l.url).hostname.toLowerCase();
        assert.ok(
          !CODE_HOSTS.some((h) => host === h || host.endsWith(`.${h}`)),
          `${p.id}: private repositories are not linked (${l.url})`,
        );
      }
    }
    for (const l of p.links) assert.match(l.url, /^https:\/\//, p.id);
  }
});

test('ids are unique and there are twenty-one', () => {
  assert.equal(new Set(projects.map((p) => p.id)).size, projects.length);
  assert.equal(projects.length, 21);
});

test('cards render name, chips and a status pill', () => {
  const html = cardsHtml(projects.slice(0, 1));
  assert.ok(html.includes(projects[0].name));
  assert.ok(html.includes('class="chip"'));
  assert.ok(html.includes(`class="pill ${projects[0].status}"`));
  assert.ok(!html.includes('{{'), 'no leftover template syntax');
  const all = cardsHtml(projects);
  assert.equal(all.split('<article class="card').length - 1, projects.length);
  assert.ok(all.includes('Private repository'));
});
