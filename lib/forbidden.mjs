// lib/forbidden.mjs
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

// Lower-case substrings. Any hit fails the build. Keep this list boring and short.
export const FORBIDDEN = [
  'sonarr', 'radarr', 'lidarr', 'prowlarr', 'bazarr', 'readarr', 'jackett',
  'torrent', 'qbittorrent', 'slskd', 'soulseek', 'usenet', 'gluetun', 'flaresolverr',
  'tailscale', 'ts.net',
];

function* walk(dir) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) yield* walk(p);
    else if (/\.(html|css|js|json|txt|xml|svg)$/.test(e)) yield p;
  }
}

export function scan(dir) {
  const hits = [];
  for (const f of walk(dir)) {
    const text = readFileSync(f, 'utf8').toLowerCase();
    for (const w of FORBIDDEN) if (text.includes(w)) hits.push(`${relative(dir, f)}: ${w}`);
  }
  return hits;
}
