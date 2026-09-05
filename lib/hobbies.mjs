// lib/hobbies.mjs
//
// Renders content/pages/hobbies.md into the three treatments the design calls for:
// bikes as a photo grid, GPUs as a chronological rail, gym as a stat row.
//
// The copy is rendered, never rewritten — every heading and lede below is lifted from
// the markdown rather than restated here, so editing the note is the only way to change
// the words on the page.
import { readFileSync } from 'node:fs';
import { md } from './md.mjs';
import { render, esc } from './render.mjs';

// Oldest first. Each entry is matched with String.includes against the "### " heading,
// so the list doubles as the chronology and the lookup key.
const GPU_ORDER = ['7770', '7950', '7970', '7990', '290x Lightning', '290x Vapor', 'Fury', 'Vega 56', '7900XTX'];

// Bullets that read "- **Bench**: 120kg" belong to the Strength Feats group; the design
// marks those tiles differently from the body measurements above them.
const LIFTS = new Set(['Bench', 'Deadlift', 'Squat']);

// Everything before the first "## " — the section's H1 and its opening paragraph.
const beforeH2 = (s) => md(s.split(/\n(?=## )/)[0]);

// The last "## " block that still sits above the first "### " — the sub-heading that
// introduces the items, plus any lede paragraph under it. Empty when there is none.
const h2Block = (s) => {
  const parts = s.split(/\n(?=### )/)[0].split(/\n(?=## )/);
  return parts.length > 1 ? md(parts[parts.length - 1]) : '';
};

// Split "### Title\n![alt](src)\n- bullets" blocks into objects.
function blocks(section) {
  return section.split(/\n(?=### )/).slice(1).map((b) => {
    const [head, ...rest] = b.split('\n');
    const body = rest.join('\n');
    const img = body.match(/!\[([^\]]*)\]\(([^)]+)\)/);
    const bullets = [...body.matchAll(/^- \*\*([^*]+)\*\*:\s*(.*)$/gm)].map((m) => ({ k: m[1], v: m[2] }));
    const notes = [...body.matchAll(/^- (?!\*\*)(.*)$/gm)].map((m) => m[1]);
    return { title: head.replace(/^###\s*/, ''), img: img?.[2] ?? '', alt: img?.[1] ?? '', bullets, notes };
  });
}

export function hobbiesHtml() {
  const src = readFileSync('content/pages/hobbies.md', 'utf8');
  const [bikes, tech, gym] = src.split(/\n---\n/);

  // render() cannot nest {{#each}} blocks (see the comment at the top of lib/render.mjs),
  // so every inner list is pre-rendered to an HTML string and inserted with {{{...}}} —
  // the same shape lib/projects.mjs uses for its language chips.
  const bikeItems = blocks(bikes).map((b) => ({
    ...b,
    // A bike with no bullets (the black ZX-12R) gets no <dl> at all, rather than an empty one.
    bulletsHtml: b.bullets.length
      ? `<dl class="plate">${b.bullets.map((x) => `<dt>${esc(x.k)}</dt><dd>${esc(x.v)}</dd>`).join('')}</dl>`
      : '',
  }));

  const gpuItems = blocks(tech)
    .sort((a, b) =>
      GPU_ORDER.findIndex((k) => a.title.includes(k)) - GPU_ORDER.findIndex((k) => b.title.includes(k)))
    .map((g) => ({ ...g, notesHtml: g.notes.map((n) => `<p>${esc(n)}</p>`).join('') }));

  // Stat bullets stay under the "## " heading they were written beneath, so the source's
  // own "Body Stats" / "Strength Feats" split reaches the page. Blocks with no
  // "**Label**: value" bullets — Goals — drop out here and are rendered separately.
  const gymGroups = gym.split(/\n(?=## )/).slice(1)
    .map((block) => ({
      title: block.split('\n')[0].replace(/^##\s*/, ''),
      stats: [...block.matchAll(/^- \*\*([^*]+)\*\*:\s*(.*)$/gm)]
        .map((m) => ({ k: m[1], v: m[2], g: LIFTS.has(m[1]) ? 'lift' : 'body' })),
    }))
    .filter((grp) => grp.stats.length)
    .map((grp) => ({
      title: grp.title,
      tilesHtml: grp.stats
        .map((s) => `<div class="stat ${s.g}"><span class="v">${esc(s.v)}</span><span class="k">${esc(s.k)}</span></div>`)
        .join(''),
    }));

  const gymGoals = [...gym.matchAll(/^## Goals\n((?:- .*\n?)+)/gm)]
    .flatMap((m) => m[1].trim().split('\n').map((l) => l.slice(2)));
  const goalsTitle = ((gym.match(/^## .+$/gm) ?? []).at(-1) ?? '## Goals').replace(/^##\s*/, '');

  const tpl = readFileSync('templates/hobbies.html', 'utf8');
  return render(tpl, {
    bikesIntro: beforeH2(bikes), bikesHead: h2Block(bikes), bikes: bikeItems,
    techIntro: beforeH2(tech), gpuHead: h2Block(tech), gpus: gpuItems,
    gymIntro: beforeH2(gym), gymGroups, goalsTitle, gymGoals,
  });
}
