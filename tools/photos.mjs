// tools/photos.mjs — node tools/photos.mjs [srcRoot]
// Resizes the old site's photos to a 1600px long edge as JPEG q82 and renames them {group}-{n}.jpg.
import { readdirSync, mkdirSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, basename } from 'node:path';

const src = process.argv[2] ?? '../CV_Website-main/content/hobbies';
const out = 'assets/photos';
mkdirSync(out, { recursive: true });

const groups = {
  'motorbikes/zx10r': 'zx10r', 'motorbikes/tuono-1000': 'tuono-1000', 'motorbikes/er6n': 'er6n',
  'motorbikes/zx12r-blue': 'zx12r-blue', 'motorbikes/zx12r-black': 'zx12r-black',
  'gpus/7900xtx': '7900xtx', 'gpus/fury': 'fury', 'gpus/290x-lightning': '290x-lightning',
  'gpus/290x-vapor': '290x-vapor', 'gpus/7990': '7990', 'gpus/7970': '7970', 'gpus/7950': '7950',
  'gpus/7770': '7770', 'gpus/vega56': 'vega56',
};

function convert(from, to) {
  execFileSync('magick', [from, '-auto-orient', '-resize', '1600x1600>', '-strip', '-quality', '82', to]);
  console.log(`${to}  ${(statSync(to).size / 1024).toFixed(0)} KB`);
}

for (const [dir, group] of Object.entries(groups)) {
  const files = readdirSync(join(src, dir)).filter((f) => /\.(png|jpe?g)$/i.test(f)).sort();
  files.forEach((f, i) => convert(join(src, dir, f), join(out, `${group}-${i + 1}.jpg`)));
}
convert(join(src, 'motorbikes/banner.png'), join(out, 'bikes-banner-1.jpg'));
