// lib/render.mjs
const esc = (v) => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const get = (obj, path) => path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);

export function render(tpl, vars) {
  tpl = tpl.replace(/\{\{#each\s+([\w.]+)\}\}([\s\S]*?)\{\{\/each\}\}/g, (_, key, body) =>
    (get(vars, key) ?? []).map((item) => render(body, { ...vars, this: item })).join(''));
  tpl = tpl.replace(/\{\{\{([\w.]+)\}\}\}/g, (_, k) => String(get(vars, k) ?? ''));
  tpl = tpl.replace(/\{\{([\w.]+)\}\}/g, (_, k) => esc(get(vars, k)));
  return tpl;
}
