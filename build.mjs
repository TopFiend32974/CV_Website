// build.mjs — node build.mjs  → dist/
import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { md } from './lib/md.mjs';
import { render } from './lib/render.mjs';
import { scan } from './lib/forbidden.mjs';

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

// Generic markdown pages. First H1 becomes the <title>.
const pages = { about: 'About', experience: 'Experience', skills: 'Skills', contact: 'Contact' };
for (const [slug, title] of Object.entries(pages)) {
  const src = readFileSync(`content/pages/${slug}.md`, 'utf8');
  page(slug, title, `${title} — ${site.name}`, render(tpl('page'), { content: md(src) }));
}

// Projects and hobbies are wired in Tasks 4 and 7; until then they render as plain pages if present.
let featured = '';
if (existsSync('lib/projects.mjs')) {
  const { loadProjects, cardsHtml } = await import('./lib/projects.mjs');
  const projects = loadProjects('content/projects.json');
  featured = cardsHtml(projects.slice(0, 3));
  page('projects', 'Projects', `What ${site.name} has built`, render(tpl('projects'), { cards: cardsHtml(projects) }));
} else {
  page('projects', 'Projects', 'Projects', '<p>Coming soon.</p>');
}
if (existsSync('templates/hobbies.html')) {
  const { hobbiesHtml } = await import('./lib/hobbies.mjs');
  page('hobbies', 'Hobbies', 'Bikes, GPUs and the gym', hobbiesHtml(site));
} else {
  page('hobbies', 'Hobbies', 'Hobbies', render(tpl('page'), { content: md(readFileSync('content/pages/hobbies.md', 'utf8')) }));
}
page('', 'Home', site.tagline, render(tpl('home'), { site, featured }));

const hits = scan(out);
if (hits.length) { console.error('FORBIDDEN CONTENT:\n' + hits.join('\n')); process.exit(1); }
console.log('built dist/');
