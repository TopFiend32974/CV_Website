// build.mjs — node build.mjs  → dist/
import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync } from 'node:fs';
import { join } from 'node:path';
import { md } from './lib/md.mjs';
import { render } from './lib/render.mjs';
import { scan } from './lib/forbidden.mjs';
import { loadProjects, cardsHtml } from './lib/projects.mjs';
import { hobbiesHtml } from './lib/hobbies.mjs';

const site = JSON.parse(readFileSync('content/site.json', 'utf8'));
const tpl = (n) => readFileSync(`templates/${n}.html`, 'utf8');
const out = 'dist';
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
cpSync('assets', join(out, 'assets'), { recursive: true });

function page(slug, title, description, body) {
  const html = render(tpl('layout'), { site, slug: slug || 'home', title, description, body });
  const dir = join(out, slug);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), html);
}

// Generic markdown pages. The <title> comes from the explicit map below, not the markdown's H1.
const pages = { about: 'About', experience: 'Experience', skills: 'Skills', contact: 'Contact' };
for (const [slug, title] of Object.entries(pages)) {
  const src = readFileSync(`content/pages/${slug}.md`, 'utf8');
  page(slug, title, `${title} — ${site.name}`, render(tpl('page'), { content: md(src) }));
}

const projects = loadProjects('content/projects.json');
const featured = cardsHtml(projects.slice(0, 3));
page('projects', 'Projects', `What ${site.name} has built`, render(tpl('projects'), { cards: cardsHtml(projects) }));
page('hobbies', 'Hobbies', 'Bikes, GPUs and the gym', hobbiesHtml());
page('', 'Home', site.tagline, render(tpl('home'), { site, featured }));

const hits = scan(out);
if (hits.length) { console.error('FORBIDDEN CONTENT:\n' + hits.join('\n')); process.exit(1); }
console.log('built dist/');
