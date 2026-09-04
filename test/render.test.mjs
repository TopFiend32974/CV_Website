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

// The two limits documented at the top of lib/render.mjs. These tests pin the CURRENT behaviour,
// not desirable behaviour: if a change alters either, that is a deliberate decision, not a silent one.
test('LIMIT: nested each emits broken template syntax', () => {
  assert.equal(
    render('{{#each a}}{{#each this.b}}[{{this.n}}]{{/each}}{{/each}}', { a: [{ b: [{ n: 1 }] }] }),
    '{{#each this.b}}[]{{/each}}');
});
test('LIMIT: raw-inserted content is re-scanned by the escaped pass', () => {
  assert.equal(
    render('<main>{{{body}}}</main>', { body: 'literal {{secret}} here', secret: 'LEAKED' }),
    '<main>literal LEAKED here</main>');
  assert.equal(
    render('<main>{{{body}}}</main>', { body: 'literal {{nope}} here' }),
    '<main>literal  here</main>');
});
