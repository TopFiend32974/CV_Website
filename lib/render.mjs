// lib/render.mjs
//
// Two known limits. Both fail silently, so they are pinned by tests in test/render.test.mjs.
//
// 1. No nested {{#each}}. The block body is matched non-greedily, so an inner {{/each}} closes the
//    outer block and the leftover inner tags are emitted as literal template text.
// 2. Raw-inserted content is re-scanned. The passes run each -> {{{raw}}} -> {{escaped}} over one
//    accumulating string, so anything inserted by {{{...}}} is still visible to the {{...}} pass
//    that follows. Page markdown must therefore not contain "{{": a literal {{name}} is either
//    substituted from vars or stripped to nothing.
export const esc = (v) => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const get = (obj, path) => path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);

export function render(tpl, vars) {
  tpl = tpl.replace(/\{\{#each\s+([\w.]+)\}\}([\s\S]*?)\{\{\/each\}\}/g, (_, key, body) =>
    (get(vars, key) ?? []).map((item) => render(body, { ...vars, this: item })).join(''));
  tpl = tpl.replace(/\{\{\{([\w.]+)\}\}\}/g, (_, k) => String(get(vars, k) ?? ''));
  tpl = tpl.replace(/\{\{([\w.]+)\}\}/g, (_, k) => esc(get(vars, k)));
  return tpl;
}
