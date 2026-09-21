// Gør delingsbilledet absolut (https://promilleplan.dk/assets/…) på alle sider.
// Den oprindelige kopi gav relative stier i og:image / twitter:image / JSON-LD, som sociale medier ikke kan bruge.
// Kan køres igen uden skade. Brug: node tools/fix-social-meta.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ORIGIN = 'https://promilleplan.dk/';
const pages = ['index.html', 'forside/index.html', 'privatliv/index.html', 'vilkaar/index.html', 'support/index.html', 'slet-data/index.html'];

for (const page of pages) {
  const file = path.join(root, page);
  let html = fs.readFileSync(file, 'utf8');
  let n = 0;
  const abs = (m, pre, rel) => { n++; return `${pre}${ORIGIN}assets/`; };
  // <meta … og:image|twitter:image|thumbnailUrl … content="…assets/…"> og <link rel="image_src" href="…assets/…">
  html = html.replace(/<(meta|link)\b[^>]*(?:og:image"|twitter:image"|thumbnailUrl"|rel="image_src")[^>]*>/g, (tag) =>
    tag.replace(/((?:content|href)=")(?:\.\.\/)*assets\//, abs));
  // JSON-LD: "image":"…assets/…"
  html = html.replace(/("image":")(?:\.\.\/)*assets\//g, abs);
  fs.writeFileSync(file, html);
  console.log(`${page}: ${n} sti(er) gjort absolutte`);
}
