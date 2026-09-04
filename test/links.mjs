// test/links.mjs — node test/links.mjs
import { readdirSync, readFileSync, statSync, existsSync, writeFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';

const root = 'dist';
const files = [];
(function walk(d) { for (const e of readdirSync(d)) { const p = join(d, e); statSync(p).isDirectory() ? walk(p) : files.push(p); } })(root);

const problems = [];
const ghRepos = new Set();
for (const f of files.filter((f) => /\.(html|css)$/.test(f))) {
  const text = readFileSync(f, 'utf8');
  const refs = [...text.matchAll(/(?:href|src)="([^"#?]+)|url\(["']?([^"')]+)/g)].map((m) => m[1] ?? m[2]);
  for (const ref of refs) {
    if (/^(https?:|mailto:|data:)/.test(ref)) {
      const m = ref.match(/^https:\/\/github\.com\/([\w.-]+\/[\w.-]+)/); if (m) ghRepos.add(m[1]);
      continue;
    }
    const target = ref.startsWith('/') ? join(root, ref) : resolve(dirname(f), ref);
    const ok = existsSync(target) && (statSync(target).isFile() || existsSync(join(target, 'index.html')));
    if (!ok) problems.push(`${f}: ${ref}`);
  }
}

const cachePath = 'review/gh-visibility.json';
const cache = existsSync(cachePath) ? JSON.parse(readFileSync(cachePath, 'utf8')) : {};
for (const repo of ghRepos) {
  if (!(repo in cache)) {
    try { cache[repo] = execFileSync('gh', ['repo', 'view', repo, '--json', 'visibility', '-q', '.visibility']).toString().trim(); }
    catch { cache[repo] = 'MISSING'; }
  }
  if (cache[repo] !== 'PUBLIC') problems.push(`github link not public: ${repo} (${cache[repo]})`);
}
try { writeFileSync(cachePath, JSON.stringify(cache, null, 2)); } catch {}

if (problems.length) { console.error(problems.join('\n')); process.exit(1); }
console.log(`links ok: ${files.length} files, ${ghRepos.size} github repos checked`);
