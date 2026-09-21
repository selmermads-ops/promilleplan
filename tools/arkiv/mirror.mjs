// Mirror promilleplan.dk (Squarespace) into a self-contained static folder.
// Usage: node mirror.mjs <outDir>
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const OUT = path.resolve(process.argv[2] || './out');
const ORIGIN = 'https://promilleplan.dk';
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36';
const ASSET_DIR = 'assets';

// route -> output file
const ROUTES = ['/', '/forside', '/privatliv', '/vilkaar', '/support', '/slet-data'];
const routeFile = (r) => (r === '/' ? 'index.html' : `${r.slice(1)}/index.html`);

// Any Squarespace-owned host. Bare hosts (preconnect, no path) are ignored.
const HOST_RE = '(?:[a-z0-9-]+\\.)*(?:squarespace-cdn\\.com|squarespace\\.com|sqspcdn\\.com)';
const URL_RE = new RegExp(
  `(?:https?:)?//(${HOST_RE})(/(?:(?!&quot;|&#39;|&#x27;)[^"'\\s<>)\\\\])*)`,
  'gi'
);
// the site's internal *.squarespace.com admin domain is not an asset host
const SKIP_HOSTS = new Set(['calliope-icosahedron-nxax.squarespace.com']);

const EXTRA_ASSETS = JSON.parse(fs.readFileSync(new URL('./extra-assets.json', import.meta.url), 'utf8'));
const manifest = new Map(); // absolute url -> local path (relative to OUT)
const failed = [];

const decodeAmp = (s) => s.replace(/&amp;/g, '&');

function localPathFor(absUrl) {
  if (manifest.has(absUrl)) return manifest.get(absUrl);
  const u = new URL(absUrl);
  let p = decodeURIComponent(u.pathname);
  p = p.replace(/[^A-Za-z0-9._\-\/]/g, '_').replace(/\/{2,}/g, '/');
  const ext = path.extname(p);
  const base = ext ? p.slice(0, -ext.length) : p;
  let q = '';
  if (u.search) q = '__' + u.search.slice(1).replace(/[^A-Za-z0-9._-]/g, '-').slice(0, 60);
  let local = `${ASSET_DIR}/${u.hostname}${base}${q}${ext}`.replace(/\/$/, '/index');
  // collision guard (different urls -> same sanitized path)
  for (const [k, v] of manifest) {
    if (v === local && k !== absUrl) {
      local = `${ASSET_DIR}/${u.hostname}${base}${q}_${crypto.createHash('md5').update(absUrl).digest('hex').slice(0, 6)}${ext}`;
      break;
    }
  }
  manifest.set(absUrl, local);
  return local;
}

async function get(url, binary = true) {
  let res;
  for (let attempt = 0; attempt < 3; attempt++) {
    try { res = await fetch(url, { headers: { 'user-agent': UA, accept: '*/*' }, redirect: 'follow' }); break; }
    catch (e) { if (attempt === 2) throw new Error(`fetch failed ${url}`); await new Promise((r) => setTimeout(r, 500)); }
  }
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  return { buf, type: res.headers.get('content-type') || '' };
}

function rel(fromFile, toFile) {
  const r = path.posix.relative(path.posix.dirname(fromFile), toFile);
  return r || path.posix.basename(toFile);
}

// rewrite squarespace urls in `text` (which lives at outFile) and queue what we find
function rewrite(text, outFile, queue) {
  return text.replace(URL_RE, (m, host, rest) => {
    if (SKIP_HOSTS.has(host.toLowerCase())) return m;
    if (rest.endsWith('/')) {
      // webpack public path for lazily loaded chunks -> local dir, relative to this page
      if (!/\/static\/vta\/[^/]+\/scripts\/$/.test(rest)) return m;
      return rel(outFile, `${ASSET_DIR}/${host}${rest}x`).slice(0, -1);
    }
    const abs = decodeAmp(`https://${host}${rest}`).replace(/[;.]+$/, (s) => s); // keep as-is
    const clean = abs.replace(/&amp$/, '');
    let local;
    try { local = localPathFor(clean); } catch { return m; }
    queue.add(clean);
    return rel(outFile, local);
  });
}

// css: rewrite url(...) / @import relative to the css file's own origin url
function rewriteCss(text, cssUrl, outFile, queue) {
  const handle = (ref) => {
    if (/^(data:|#|%23|about:)/i.test(ref)) return null;
    let abs;
    try { abs = new URL(ref, cssUrl).toString(); } catch { return null; }
    const host = new URL(abs).hostname;
    if (!new RegExp(`^${HOST_RE}$`, 'i').test(host) && host !== 'promilleplan.dk') return null;
    if (host === 'promilleplan.dk') return null;
    const local = localPathFor(abs);
    queue.add(abs);
    return rel(outFile, local);
  };
  text = text.replace(/url\(\s*(['"]?)([^'")]+)\1\s*\)/g, (m, q, ref) => {
    const r = handle(ref.trim());
    return r ? `url(${q}${r}${q})` : m;
  });
  text = text.replace(/@import\s+(['"])([^'"]+)\1/g, (m, q, ref) => {
    const r = handle(ref.trim());
    return r ? `@import ${q}${r}${q}` : m;
  });
  return text;
}

// webpack public path for lazy chunks is hardcoded to Squarespace's CDN; derive it from the script's own location instead
const PP = /\.p="https:\/\/assets\.squarespace\.com\/universal\/scripts-compressed\/"/g;
function patchJs(js) {
  return js.replace(PP, '.p=(document.currentScript&&document.currentScript.src?document.currentScript.src.replace(/[^\\/]*$/,""):"https://assets.squarespace.com/universal/scripts-compressed/")');
}

// Squarespace's favicon is a 1536x1024 JPEG named .ico; use our own icon set (favicon.ico, favicon-32.png, apple-touch-icon.png) instead
function patchIcons(html, outFile) {
  const up = '../'.repeat(outFile.split('/').length - 1);
  const block = `<link rel="icon" href="${up}favicon.ico" sizes="any">\n<link rel="icon" type="image/png" sizes="32x32" href="${up}favicon-32.png">\n<link rel="apple-touch-icon" href="${up}apple-touch-icon.png">\n`;
  let first = true;
  return html.replace(/<link rel="icon"[^>]*favicon\.ico"\s*\/?>\s*/g, () => (first ? ((first = false), block) : ''));
}

function write(file, data) {
  const dest = path.join(OUT, file);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, data);
}

async function main() {
  fs.rmSync(path.join(OUT, ASSET_DIR), { recursive: true, force: true });
  const queue = new Set();

  // 1. pages
  for (const r of ROUTES) {
    const { buf } = await get(ORIGIN + r);
    let html = buf.toString('utf8');
    const file = routeFile(r);
    html = patchIcons(html, file);
    html = rewrite(html, file, queue);
    // internal absolute links -> relative (works under any base path)
    const depth = file.split('/').length - 1;
    const up = depth ? '../'.repeat(depth) : './';
    html = html.replace(/href="\/(?!\/)([^"]*)"/g, (m, p) => {
      const clean = p.split(/[?#]/)[0].replace(/\/$/, '');
      const suffix = p.slice(clean.length);
      if (clean === '') return `href="${up}${suffix}"`;
      if (['cart', 'account'].includes(clean)) return m;
      return `href="${up}${clean}/${suffix}"`;
    });
    write(file, html);
    console.log('page', r, '->', file, `${(html.length / 1024) | 0}kB`);
  }

  // lazily loaded chunks that never appear as a url in the html
  for (const extra of EXTRA_ASSETS) { localPathFor(extra); queue.add(extra); }

  // 2. assets (breadth-first; css/js may enqueue more)
  const done = new Set();
  while (true) {
    const todo = [...queue].filter((u) => !done.has(u));
    if (!todo.length) break;
    const CONC = 8;
    for (let i = 0; i < todo.length; i += CONC) {
      await Promise.all(
        todo.slice(i, i + CONC).map(async (url) => {
          done.add(url);
          const local = manifest.get(url);
          try {
            const { buf, type } = await get(url);
            if (/text\/css/.test(type) || /\.css$/i.test(new URL(url).pathname)) {
              const css = rewriteCss(buf.toString('utf8'), url, local, queue);
              write(local, css);
            } else if (/\.js$/i.test(local)) {
              write(local, patchJs(buf.toString('utf8')));
            } else {
              write(local, buf);
            }
          } catch (e) {
            failed.push(String(e.message));
          }
        })
      );
    }
  }
  fs.writeFileSync(new URL('./manifest.json', import.meta.url), JSON.stringify(Object.fromEntries(manifest), null, 1));
  console.log(`assets: ${manifest.size} referenced, ${failed.length} failed`);
  failed.forEach((f) => console.log('  FAIL', f));
}

main().catch((e) => { console.error(e); process.exit(1); });
