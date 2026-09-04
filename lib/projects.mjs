// lib/projects.mjs
import { readFileSync } from 'node:fs';
import { render } from './render.mjs';

const CARD = `<article class="card {{this.status}}">
  {{{this.shotHtml}}}
  <div class="card-body">
    <h3>{{this.name}} <span class="pill {{this.status}}">{{this.statusLabel}}</span></h3>
    <p>{{this.blurb}}</p>
    <ul class="chips">{{#each this.languages}}<li class="chip">{{this}}</li>{{/each}}</ul>
    {{{this.linksHtml}}}
  </div>
</article>`;

const LABEL = { live: 'Live', active: 'In progress', design: 'In design', paused: 'Paused', done: 'Done', dormant: 'Dormant' };

export function loadProjects(path) {
  const list = JSON.parse(readFileSync(path, 'utf8'));
  return list.map((p) => ({ links: [], shot: null, private: true, ...p }));
}

export function cardsHtml(projects) {
  // render() cannot nest {{#each}} blocks, and CARD already contains one for the language
  // chips — so each card is rendered on its own rather than wrapped in an outer each.
  return projects
    .map((p) =>
      render(CARD, {
        this: {
          ...p,
          statusLabel: LABEL[p.status],
          shotHtml: p.shot
            ? `<img class="shot" src="/assets/shots/${p.shot}" alt="${p.name} screenshot" loading="lazy" width="1440" height="900">`
            : '',
          linksHtml: p.links.length
            ? `<p class="links">${p.links.map((l) => `<a href="${l.url}">${l.label}</a>`).join(' · ')}</p>`
            : (p.private ? '<p class="links muted">Private repository</p>' : ''),
        },
      }),
    )
    .join('\n');
}
