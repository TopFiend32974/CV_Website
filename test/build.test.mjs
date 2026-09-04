import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { scan, FORBIDDEN } from '../lib/forbidden.mjs';

test('build writes every route and is deterministic', () => {
  execFileSync('node', ['build.mjs']);
  for (const r of ['', 'about', 'experience', 'projects', 'skills', 'hobbies', 'contact']) {
    assert.ok(existsSync(join('dist', r, 'index.html')), `missing /${r}/`);
  }
  const a = readFileSync('dist/index.html', 'utf8');
  execFileSync('node', ['build.mjs']);
  assert.equal(readFileSync('dist/index.html', 'utf8'), a);
});

test('forbidden scan finds a planted word', () => {
  const d = mkdtempSync(join(tmpdir(), 'fb-'));
  writeFileSync(join(d, 'x.html'), `hello ${FORBIDDEN[0]} world`);
  assert.deepEqual(scan(d), [`x.html: ${FORBIDDEN[0]}`]);
  rmSync(d, { recursive: true });
});
