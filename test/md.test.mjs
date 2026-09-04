// test/md.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { md } from '../lib/md.mjs';

test('headings and paragraphs', () => {
  assert.equal(md('# Hi\n\nHello **there**.'), '<h1>Hi</h1>\n<p>Hello <strong>there</strong>.</p>');
});
test('links and images', () => {
  assert.equal(md('[a](/b/) ![c](/d.jpg)'), '<p><a href="/b/">a</a> <img src="/d.jpg" alt="c" loading="lazy"></p>');
});
test('lists and rules', () => {
  assert.equal(md('- one\n- two\n\n---'), '<ul>\n<li>one</li>\n<li>two</li>\n</ul>\n<hr>');
});
test('raw html passes through', () => {
  assert.equal(md('<div class="x">y</div>'), '<div class="x">y</div>');
});
test('escapes stray angle brackets in text', () => {
  assert.equal(md('a < b'), '<p>a &lt; b</p>');
});
