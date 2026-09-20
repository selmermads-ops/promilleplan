// Tiny static server that mimics GitHub Pages (index.html dirs, trailing-slash redirect, 404.html)
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const ROOT = process.argv[2]; const PORT = Number(process.argv[3] || 4173);
const T = {'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.gif':'image/gif','.svg':'image/svg+xml','.ico':'image/x-icon','.woff':'font/woff','.woff2':'font/woff2','.ttf':'font/ttf','.webp':'image/webp','.pdf':'application/pdf','.txt':'text/plain','.xml':'application/xml'};
http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x'); let p = decodeURIComponent(u.pathname);
  let f = path.join(ROOT, p);
  if (!f.startsWith(ROOT)) { res.writeHead(403).end(); return; }
  if (fs.existsSync(f) && fs.statSync(f).isDirectory()) {
    if (!p.endsWith('/')) { res.writeHead(301, {Location: p + '/' + u.search}).end(); return; }
    f = path.join(f, 'index.html');
  }
  if (!fs.existsSync(f)) { const nf = path.join(ROOT, '404.html'); res.writeHead(404, {'content-type':'text/html'}); res.end(fs.existsSync(nf) ? fs.readFileSync(nf) : 'Not found'); console.log('404', p); return; }
  res.writeHead(200, {'content-type': T[path.extname(f).toLowerCase()] || 'application/octet-stream'}); fs.createReadStream(f).pipe(res);
}).listen(PORT, () => console.log('serving', ROOT, 'on', PORT));
