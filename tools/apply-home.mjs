// Bygger forsidens indhold (tools/snippets/home.html) ind i index.html og forside/index.html.
// Første kørsel erstatter hele <main>-indholdet (det gamle Squarespace-gitter); senere kørsler erstatter kun blokken
// mellem markørerne, så scriptet kan køres igen efter ændringer i skabelonen.
// Brug: node tools/apply-home.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const template = fs.readFileSync(path.join(root, 'tools/snippets/home.html'), 'utf8').trim();
const START = '<!-- pp-home:start';
const END = '<!-- pp-home:end -->';
const THEME = '<meta name="theme-color" content="#061033" data-pp-home>';
const pages = ['index.html', 'forside/index.html']; // / og /forside er samme side

for (const page of pages) {
  const file = path.join(root, page);
  const up = '../'.repeat(page.split('/').length - 1);
  const block = template.replaceAll('{{up}}', up);
  let html = fs.readFileSync(file, 'utf8');

  const a = html.indexOf(START);
  if (a !== -1) {
    const b = html.indexOf(END, a);
    if (b === -1) throw new Error(`${page}: start-markør uden slut-markør`);
    html = html.slice(0, a) + block + html.slice(b + END.length);
  } else {
    const openTag = html.match(/<main\b[^>]*>/);
    const close = html.indexOf('</main>');
    if (!openTag || close === -1) throw new Error(`${page}: fandt ikke <main>…</main>`);
    const innerStart = openTag.index + openTag[0].length;
    html = html.slice(0, innerStart) + '\n' + block + '\n' + html.slice(close);
  }

  if (!html.includes('data-pp-home')) html = html.replace('</head>', `${THEME}\n</head>`);

  // sikkerhedsteksten står nu fremhævet i selve indholdet – fjern gentagelsen i footeren på forsiden
  const f = html.indexOf('<footer');
  if (f !== -1) {
    const dup = /<pre><code class="language-markdown">PromillePlan viser vejledende estimater[\s\S]*?<\/code><\/pre>/;
    html = html.slice(0, f) + html.slice(f).replace(dup, '');
  }
  fs.writeFileSync(file, html);
  console.log(`${page}: forside ${a !== -1 ? 'opdateret' : 'indsat'} (up="${up}", ${(html.length / 1024) | 0} kB)`);
}
