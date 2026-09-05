// lib/hobbies.mjs
//
// Renders content/pages/hobbies.md into the four treatments the design calls for:
// bikes as a photo grid, GPUs as a chronological rail, the homelab as plain prose,
// gym as a stat row.
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

// A stat value like "72kg (down from 99kg)" is a headline plus an aside. The headline sets
// the tile's type size, so leaving the aside inside it wraps the number onto a second
// display-sized line and makes that whole plate taller than its neighbour. Split the
// parenthetical off and let the tile render it as a small muted line instead.
const splitStat = (v) => {
  const m = v.match(/^(.*?)\s+\((.*)\)$/);
  return m ? { v: m[1], note: m[2] } : { v, note: '' };
};

// --- the estate ---------------------------------------------------------------
// One plate per machine, from content/estate.json rather than from the markdown: these
// are structured records — a spec list and a status from a closed vocabulary — and the
// markdown subset in lib/md.mjs has no shape for that. The status names are shared with
// the .pill styles, so adding one here means adding a colour there too.
const ESTATE_STATUS = { live: 'Live', staged: 'Staged', planned: 'Planned' };

// A malformed entry renders a plate with an empty spec list or an uncoloured pill —
// neither of which looks broken enough to catch in a screenshot review. Throw instead.
export function loadEstate(path = 'content/estate.json') {
  const list = JSON.parse(readFileSync(path, 'utf8'));
  if (!Array.isArray(list)) throw new Error('estate.json: expected an array');
  for (const m of list) {
    const id = m?.id ?? '(no id)';
    if (!m.id || !m.name || !m.kind || !m.purpose) {
      throw new Error(`estate ${id}: id, name, kind and purpose are all required`);
    }
    if (!(m.status in ESTATE_STATUS)) throw new Error(`estate ${id}: unknown status "${m.status}"`);
    if (!Array.isArray(m.specs) || !m.specs.length) throw new Error(`estate ${id}: specs must be a non-empty array`);
  }
  return list;
}

// render() cannot nest {{#each}} blocks, and every plate carries a list — so the whole
// grid is pre-rendered to an escaped string and inserted with {{{...}}}, the same shape
// the bike bullets and the language chips in lib/projects.mjs use.
export function estateHtml(machines) {
  const plates = machines.map((m) => `    <article class="estate-plate ${esc(m.status)}">
      <h3>${esc(m.name)} <span class="pill ${esc(m.status)}">${esc(ESTATE_STATUS[m.status])}</span></h3>
      <p class="kind">${esc(m.kind)}</p>
      <ul class="specs">${m.specs.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>
      <p class="purpose">${esc(m.purpose)}</p>
    </article>`).join('\n');
  return `<div class="estate">\n${plates}\n  </div>`;
}

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
  // Four \n---\n-separated sections, in source order. Homelab is prose only: it has no
  // per-item treatment, so it is rendered whole by md() rather than picked apart.
  const [bikes, tech, homelab, gym] = src.split(/\n---\n/);

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
        .map((m) => ({ k: m[1], ...splitStat(m[2]), g: LIFTS.has(m[1]) ? 'lift' : 'body' })),
    }))
    .filter((grp) => grp.stats.length)
    .map((grp) => ({
      title: grp.title,
      tilesHtml: grp.stats
        // The note span is emitted even when empty: CSS reserves its line, so a tile with an
        // aside is exactly as tall as one without and the two plates end up the same height.
        .map((s) => `<div class="stat ${s.g}"><span class="v">${esc(s.v)}</span>`
          + `<span class="note">${esc(s.note)}</span><span class="k">${esc(s.k)}</span></div>`)
        .join(''),
    }));

  const gymGoals = [...gym.matchAll(/^## Goals\n((?:- .*\n?)+)/gm)]
    .flatMap((m) => m[1].trim().split('\n').map((l) => l.slice(2)));
  const goalsTitle = ((gym.match(/^## .+$/gm) ?? []).at(-1) ?? '## Goals').replace(/^##\s*/, '');

  const tpl = readFileSync('templates/hobbies.html', 'utf8');
  return render(tpl, {
    bikesIntro: beforeH2(bikes), bikesHead: h2Block(bikes), bikes: bikeItems,
    techIntro: beforeH2(tech), estate: estateHtml(loadEstate()), gpuHead: h2Block(tech), gpus: gpuItems,
    homelab: md(homelab),
    gymIntro: beforeH2(gym), gymGroups, goalsTitle, gymGoals,
  });
}
