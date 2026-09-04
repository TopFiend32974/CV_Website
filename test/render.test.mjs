import { test } from 'node:test';
import assert from 'node:assert/strict';
import { render } from '../lib/render.mjs';

test('escapes double braces, passes triple raw', () => {
  assert.equal(render('<b>{{a}}</b>{{{b}}}', { a: '<x>', b: '<i>y</i>' }), '<b>&lt;x&gt;</b><i>y</i>');
});
test('each over arrays', () => {
  assert.equal(render('{{#each xs}}[{{this.n}}]{{/each}}', { xs: [{ n: 1 }, { n: 2 }] }), '[1][2]');
});
test('missing key renders empty', () => {
  assert.equal(render('a{{nope}}b', {}), 'ab');
});
