/* =========================================================================
   ARCÁDIA IA · service worker (app instalável no iPhone, Android e PC)
   - Páginas, scripts e dados: tenta a rede primeiro (a Arcádia muda todo dia)
     e guarda uma cópia; sem internet, usa a cópia.
   - Imagens, fontes e bibliotecas (three.js, PeerJS, CodeMirror): usa a cópia
     na hora e atualiza por trás.
   - O servidor de contas (Google) e as salas online nunca passam por aqui.
   ========================================================================= */
'use strict';
const VERSAO = 'arcadia-v1';
const BASE = ['./', './index.html', './jogos.js', './conta.js', './foto.js', './salas-publicas.js', './offline.html', './manifest.webmanifest', './img/app/icone-192.png', './img/app/apple-touch-icon.png'];
const CDNS = /^https:\/\/(unpkg\.com|cdnjs\.cloudflare\.com|cdn\.jsdelivr\.net|fonts\.(googleapis|gstatic)\.com)\//;

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSAO).then(c => Promise.all(BASE.map(u => c.add(new Request(u, { cache: 'reload' })).catch(() => {})))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSAO).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
// guarda sem o "?v=..." para a cópia offline servir qualquer versão pedida
const chave = req => { const u = new URL(req.url); u.searchParams.delete('v'); u.searchParams.delete('app'); u.searchParams.delete('x'); return u.href; };
async function redePrimeiro(req) {
  const c = await caches.open(VERSAO);
  try {
    const r = await fetch(req);
    if (r && r.ok && r.type !== 'opaqueredirect') c.put(chave(req), r.clone());
    return r;
  } catch (err) {
    const guardado = await c.match(chave(req));
    if (guardado) return guardado;
    if (req.mode === 'navigate') return (await c.match(new URL('./offline.html', self.registration.scope).href)) || Response.error();
    throw err;
  }
}
async function copiaPrimeiro(req) {
  const c = await caches.open(VERSAO), guardado = await c.match(req);
  const busca = fetch(req).then(r => { if (r && (r.ok || r.type === 'opaque')) c.put(req, r.clone()); return r; }).catch(() => guardado);
  return guardado || busca;
}
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  const u = new URL(req.url);
  if (u.origin === location.origin) {
    if (/\.(png|jpe?g|webp|gif|svg|ico|woff2?|mp3|ogg|wav)$/i.test(u.pathname)) e.respondWith(copiaPrimeiro(req));
    else e.respondWith(redePrimeiro(req));
  } else if (CDNS.test(req.url)) e.respondWith(copiaPrimeiro(req));
  // o resto (servidor de contas, PeerJS, GitHub) vai direto para a rede
});
