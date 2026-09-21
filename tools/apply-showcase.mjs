// Sætter "Et kig ind i appen"-sektionen (tools/snippets/app-showcase.html) ind på forsiden.
// Kan køres igen: en eksisterende sektion bliver erstattet, ikke duplikeret.
// Brug: node tools/apply-showcase.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const template = fs.readFileSync(path.join(root, 'tools/snippets/app-showcase.html'), 'utf8').trim();
const START = '<!-- pp-showcase:start';
const END = '<!-- pp-showcase:end -->';
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
    const m = html.indexOf('</main>');
    if (m === -1) throw new Error(`${page}: fandt ikke </main>`);
    html = html.slice(0, m) + block + '\n' + html.slice(m);
  }
  fs.writeFileSync(file, html);
  console.log(`${page}: sektion ${a !== -1 ? 'opdateret' : 'indsat'} (up="${up}")`);
}
