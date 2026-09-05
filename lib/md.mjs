// lib/md.mjs
import { esc } from './render.mjs';

function inline(s) {
  s = esc(s);
  s = s.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" loading="lazy">');
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  return s;
}

export function md(src) {
  const out = [];
  const lines = src.replace(/\r/g, '').split('\n');
  let para = [], list = null;
  const flushPara = () => { if (para.length) { out.push(`<p>${inline(para.join(' '))}</p>`); para = []; } };
  const flushList = () => { if (list) { out.push(`<ul>\n${list.map(i => `<li>${inline(i)}</li>`).join('\n')}\n</ul>`); list = null; } };
  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) { flushPara(); flushList(); continue; }
    let m;
    if ((m = line.match(/^(#{1,3})\s+(.*)$/))) { flushPara(); flushList(); out.push(`<h${m[1].length}>${inline(m[2])}</h${m[1].length}>`); continue; }
    if (line === '---') { flushPara(); flushList(); out.push('<hr>'); continue; }
    if ((m = line.match(/^-\s+(.*)$/))) { flushPara(); (list ??= []).push(m[1]); continue; }
    if (line.startsWith('<')) { flushPara(); flushList(); out.push(line); continue; }
    flushList(); para.push(line.trim());
  }
  flushPara(); flushList();
  return out.join('\n');
}
