/* =========================================================================
   LABORATÓRIO DOS ELEMENTOS · microscópio
   Mostra o que acontece em escala de moléculas no ponto escolhido:
   - forma de cada molécula montada a partir da fórmula (átomo central e
     ligantes, ângulos de VSEPR), cores CPK dos elementos (PubChem)
   - sólido: retículo (metal com "mar de elétrons", cristal iônico alternando
     cátions e ânions, cristal molecular); líquido: moléculas juntas e
     agitadas, íons com camada de hidratação, gás dissolvido; gás: poucas
     moléculas rápidas; bolha: interface com o líquido (e o detergente
     virado para dentro, quando tem); objetos com superfície própria
   - um texto que explica o fenômeno com os números da simulação
   ========================================================================= */
'use strict';

const cpk = s => { const e = ELEM[s]; return e && e.cpk ? '#' + e.cpk : '#c8c8c8'; };
const RAIO_AT = s => ({ H: 0.55, C: 0.85, N: 0.8, O: 0.78, F: 0.72, Cl: 1.0, S: 1.0, P: 1.0, Na: 1.1, K: 1.25 })[s] || 0.95;
// monta a molécula a partir da composição: [{s, x, y, r}] em unidades de "raio de ligação"
const CACHE_MOL = new Map();
function moleculaDe(M) {
  if (CACHE_MOL.has(M.id)) return CACHE_MOL.get(M.id);
  let comp = M.comp; if (M.simb) comp = { [M.simb]: M.formula && /\d$/.test(M.formula) && !M.metal ? +M.formula.match(/\d+$/)[0] : 1 };
  let at = [];
  const n = comp ? Object.values(comp).reduce((a, b) => a + b, 0) : 0;
  if (!comp || n > 9) at = null; // grande demais: desenhada como cadeia
  else if (n === 1) { const s = Object.keys(comp)[0]; at = [{ s, x: 0, y: 0 }]; }
  else if (n === 2) { const ss = Object.entries(comp).flatMap(([s, k]) => Array(k).fill(s)); at = [{ s: ss[0], x: -0.55, y: 0 }, { s: ss[1], x: 0.55, y: 0 }]; }
  else {
    // átomo central: o de menor quantidade que não seja H nem F/Cl (C, N, S, P, O...)
    const els = Object.entries(comp).sort((a, b) => (a[0] === 'H') - (b[0] === 'H') || a[1] - b[1]);
    let centro = els.find(([s]) => !['H', 'F', 'Cl', 'Br', 'I'].includes(s)) || els[0];
    const lig = []; for (const [s, k] of Object.entries(comp)) for (let q = 0; q < (s === centro[0] ? k - 1 : k); q++) lig.push(s);
    const nl = lig.length; at = [{ s: centro[0], x: 0, y: 0 }];
    // ângulos: 2 ligantes num O ou S = angular (104,5°); N com 3 = pirâmide; senão espalhados por igual
    let angs;
    if (nl === 2 && ['O', 'S'].includes(centro[0])) angs = [-52.25, 52.25].map(a => (a + 90) * Math.PI / 180);
    else if (nl === 2) angs = [0, Math.PI];
    else if (nl === 3 && ['N', 'P'].includes(centro[0])) angs = [90, 210, 330].map(a => a * Math.PI / 180);
    else angs = Array.from({ length: nl }, (_, k) => k * 2 * Math.PI / nl - Math.PI / 2);
    lig.forEach((s, k) => at.push({ s, x: Math.cos(angs[k]) * 1.15, y: Math.sin(angs[k]) * 1.15 }));
  }
  if (at) at.forEach(a => { a.r = RAIO_AT(a.s); a.cor = cpk(a.s); });
  CACHE_MOL.set(M.id, at); return at;
}
function desenharMol(c, at, x, y, ang, esc, alfa = 1) {
  const ca = Math.cos(ang), sa = Math.sin(ang);
  c.globalAlpha = alfa;
  if (at.length > 1) { c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = esc * 0.35; for (let k = 1; k < at.length; k++) { c.beginPath(); c.moveTo(x + (at[0].x * ca - at[0].y * sa) * esc, y + (at[0].x * sa + at[0].y * ca) * esc); c.lineTo(x + (at[k].x * ca - at[k].y * sa) * esc, y + (at[k].x * sa + at[k].y * ca) * esc); c.stroke(); } }
  for (const a of at) { const px = x + (a.x * ca - a.y * sa) * esc, py = y + (a.x * sa + a.y * ca) * esc; esfera(c, px, py, a.r * esc * 0.62, a.cor); }
  c.globalAlpha = 1;
}
function esfera(c, x, y, r, cor) {
  const g = c.createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.1, x, y, r);
  g.addColorStop(0, '#ffffff'); g.addColorStop(0.25, cor); g.addColorStop(1, escurecer(cor));
  c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill();
}
function escurecer(hex) { const v = hexRgb(hex.length === 7 ? hex : '#c8c8c8') || [200, 200, 200]; return `rgb(${v.map(q => q * 0.45 | 0).join(',')})`; }
const ION = (txt, cor) => ({ ion: true, txt, cor });

/* ---------- montar a cena do ponto (x, y) ---------- */
const MICRO = { cena: null, chave: '' };
function cenaDe(x, y) {
  const c = celula(x, y); if (!c) return null;
  const i = c.i, m = mt[i], W = L.W;
  // vizinhança: o que encosta (para desenhar a interface)
  let parede = null, liqViz = null;
  for (const [dx, dy, lado] of [[0, 1, 'baixo'], [-1, 0, 'esq'], [1, 0, 'dir'], [0, -1, 'cima']]) {
    const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= L.H) continue; const j = ny * W + nx;
    if (mt[j] && !(bfl[j] & 1) && estadoDe(MATS[mt[j]], T[j]) === 0 && !parede) parede = { M: MATS[mt[j]], lado, j, objeto: !!corpo[j] };
    if (mt[j] && !(bfl[j] & 1) && estadoDe(MATS[mt[j]], T[j]) === 1 && !liqViz) liqViz = { M: MATS[mt[j]], j };
  }
  const surf = tensoativo(x, y) > 0;
  const base = { i, x, y, t: T[i], parede, surf };
  if (!m) return { ...base, tipo: 'ar' };
  const M = MATS[m], s = estadoDe(M, T[i]);
  if (bfl[i] & 1) return { ...base, tipo: 'bolha', M, gas: GAS_INFO[m], gv: gv[i], grudada: !!(bfl[i] & 2), liq: liqViz && liqViz.M, disViz: liqViz ? dis[liqViz.j] : 0 };
  if (M.espuma) return { ...base, tipo: 'espuma', M };
  if (m === FOGO || m === FAISCA) return { ...base, tipo: 'fogo', M };
  if (s === 2 || m === FUMACA) return { ...base, tipo: 'gas', M };
  if (s === 1) return { ...base, tipo: 'liquido', M, dis: dis[i], gas: GAS_INFO[disG[i]] };
  return { ...base, tipo: 'solido', M, po: !!(flg[i] & PO), objeto: corpo[i] ? CORPOS.get(corpo[i]) : null };
}

/* ---------- partículas ---------- */
function popular(cena, w, h) {
  const P = []; const R = Math.min(w, h);
  const add = (n, f) => { for (let k = 0; k < n; k++) P.push(f(k)); };
  const mol = M => moleculaDe(M);
  const agua = mol(MATS[H2O]);
  const molDe = M => (M && (M.tipo === 'solucao' || M.comoAgua || M.chave === 'H2O' || M.chave === 'AguaTorneira')) ? agua : M ? mol(M) : agua;
  const solvente = M => ({ at: molDe(M), M });
  const geral = { bolha: null };
  if (cena.tipo === 'ar' || cena.tipo === 'gas' || cena.tipo === 'fogo') {
    const atm = cena.tipo === 'ar' ? (typeof ATMOSFERA !== 'undefined' ? ATMOSFERA : 'ar') : null;
    if (atm === 'vacuo') return { P, geral };
    const lista = cena.tipo === 'ar' ? (atm === 'O2' ? [MATS[id('O')]] : atm === 'N2' ? [MATS[id('N')]] : [MATS[id('N')], MATS[id('N')], MATS[id('N')], MATS[id('O')]]) : [cena.M.chave === 'FOGO' || cena.M.chave === 'FUMACA' ? MATS[id('CO2')] : cena.M];
    add(cena.tipo === 'fogo' ? 9 : 11, k => ({ at: mol(lista[k % lista.length]) || agua, x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - 0.5) * 3, vy: (Math.random() - 0.5) * 3, ang: Math.random() * 6, va: (Math.random() - 0.5) * 0.2, rapido: true }));
    return { P, geral };
  }
  if (cena.tipo === 'liquido') {
    const M = cena.M, sv = solvente(M);
    add(34, () => ({ at: sv.at, x: Math.random() * w, y: Math.random() * h, vx: 0, vy: 0, ang: Math.random() * 6, va: 0 }));
    if (M.tipo === 'solucao' && M.cat) { // íons com camada de água
      const cat = CATIONS[M.cat], an = ANIONS[M.an], sc = (M.cat === 'NH4' ? 'N' : M.cat.replace(/\d/, '')), sa = (M.an.match(/^[A-Z][a-z]?/) || ['Cl'])[0];
      add(3, () => ({ ion: { txt: '+', cor: cpk(sc), r: 0.75 }, x: Math.random() * w, y: Math.random() * h, vx: 0, vy: 0, ang: 0, va: 0, nome: (M.cat === 'H' ? 'H₃O⁺' : M.cat + SUP(cat ? cat.carga : 1)) }));
      add(3, () => ({ ion: { txt: '−', cor: cpk(sa), r: 1.05 }, x: Math.random() * w, y: Math.random() * h, vx: 0, vy: 0, ang: 0, va: 0, nome: fmt(M.an) + SUP(-(an ? an.carga : 1)) }));
    }
    if (M.surfactante || M.chave === 'Detergente') add(4, () => ({ surf: true, x: Math.random() * w, y: Math.random() * h, vx: 0, vy: 0, ang: Math.random() * 6, va: 0.02 }));
    if (cena.gas && cena.dis > 0) { const g = mol(MATS[id(cena.gas.chave)]) || agua, n = Math.min(14, Math.round(cena.dis * 2.5)); add(n, () => ({ at: g, x: Math.random() * w, y: Math.random() * h, vx: 0, vy: 0, ang: Math.random() * 6, va: 0.05, gas: true })); }
    if (cena.parede) geral.parede = cena.parede;
    return { P, geral };
  }
  if (cena.tipo === 'bolha') {
    const cx = w * 0.5, cy = h * (cena.grudada ? 0.58 : 0.5), r = R * (0.22 + 0.16 * Math.min(1.4, cena.gv));
    geral.bolha = { cx, cy, r };
    if (cena.grudada && cena.parede) geral.parede = cena.parede;
    const g = cena.gas ? mol(MATS[id(cena.gas.chave)]) : agua, sv = solvente(cena.liq);
    add(30, () => { let x, y; do { x = Math.random() * w; y = Math.random() * h; } while (Math.hypot(x - cx, y - cy) < r + 8); return { at: sv.at, x, y, vx: 0, vy: 0, ang: Math.random() * 6, va: 0, fora: true }; });
    add(6, () => { const a = Math.random() * 6.28, d = Math.random() * r * 0.75; return { at: g, x: cx + Math.cos(a) * d, y: cy + Math.sin(a) * d, vx: (Math.random() - 0.5) * 3, vy: (Math.random() - 0.5) * 3, ang: 0, va: 0.15, dentro: true, rapido: true }; });
    if (cena.surf) add(16, k => ({ surf: true, naBorda: k / 16 * Math.PI * 2, x: 0, y: 0, vx: 0, vy: 0, ang: 0, va: 0 }));
    return { P, geral };
  }
  if (cena.tipo === 'espuma') { geral.espuma = true; add(12, k => ({ surf: true, naRede: k, x: 0, y: 0, vx: 0, vy: 0, ang: 0, va: 0 })); return { P, geral }; }
  // sólido
  const M = cena.M; geral.solido = M;
  if (M.micro) { geral.textura = M.micro; return { P, geral }; }
  const at = mol(M);
  const ionico = M.ionico || M.ions;
  const lado = 34, cols = Math.ceil(w / lado) + 1, lins = Math.ceil(h / lado) + 1;
  for (let a = 0; a < lins; a++) for (let b = 0; b < cols; b++) {
    const x0 = b * lado + (a % 2) * lado / 2, y0 = a * lado * 0.87;
    if (M.metal) P.push({ ion: { txt: '', cor: M.rgb ? `rgb(${M.rgb[0].join(',')})` : '#aaa', r: 1.3 }, x0, y0, x: x0, y: y0, vib: 1.2 });
    else if (ionico && M.ions) { const [c1, a1] = M.ions, s1 = c1.replace(/\d/, '') === 'NH4' ? 'N' : c1.replace(/\d/, ''), s2 = (a1.match(/^[A-Z][a-z]?/) || ['O'])[0]; const p = (a + b) % 2; P.push({ ion: { txt: p ? '−' : '+', cor: cpk(p ? s2 : s1), r: p ? 1.15 : 0.8 }, x0, y0, x: x0, y: y0, vib: 0.8 }); }
    else if (at) P.push({ at, x0, y0, x: x0, y: y0, ang: (a + b) % 2 ? 0.3 : -0.3, vib: 1.5 });
  }
  if (M.metal) add(18, () => ({ eletron: true, x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - 0.5) * 4, vy: (Math.random() - 0.5) * 4 }));
  if (!at && !M.metal && !ionico) geral.textura = 'organico';
  return { P, geral };
}

/* ---------- desenhar a cena ---------- */
function desenharMicro(cv2, cena) {
  const c = cv2.getContext('2d'), w = cv2.width, h = cv2.height, esc = 9;
  const chave = cena ? cena.tipo + ':' + (cena.M ? cena.M.id : '') + ':' + (cena.parede ? cena.parede.lado : '') + ':' + (cena.surf ? 1 : 0) + ':' + (cena.dis ? Math.round(cena.dis * 3) : 0) : '';
  if (chave !== MICRO.chave) { MICRO.chave = chave; MICRO.cena = cena ? popular(cena, w, h) : null; }
  const fundo = !cena ? '#0b0e14' : cena.tipo === 'liquido' || cena.tipo === 'bolha' ? '#0c1a2e' : cena.tipo === 'solido' ? '#16141a' : '#0b0e14';
  c.fillStyle = fundo; c.fillRect(0, 0, w, h);
  if (!MICRO.cena) return;
  const { P, geral } = MICRO.cena, temp = cena.t, agit = Math.max(0.2, Math.min(3, (temp + 273) / 298));
  // superfície encostada (parede, grão...)
  if (geral.parede) {
    const lado = geral.parede.lado, M = geral.parede.M, cor = M.rgb ? `rgb(${M.rgb[0].join(',')})` : '#999';
    c.fillStyle = cor; c.beginPath();
    const t = 30; // espessura
    if (lado === 'baixo') { c.moveTo(0, h); for (let x = 0; x <= w; x += 6) c.lineTo(x, h - t + Math.sin(x * 0.21) * (M.rug || 0.1) * 14 + ((x * 7919) % 13) * (M.rug || 0) * 0.9); c.lineTo(w, h); }
    else if (lado === 'cima') { c.moveTo(0, 0); for (let x = 0; x <= w; x += 6) c.lineTo(x, t + Math.sin(x * 0.21) * (M.rug || 0.1) * 14); c.lineTo(w, 0); }
    else { const x0 = lado === 'esq' ? 0 : w, dir = lado === 'esq' ? 1 : -1; c.moveTo(x0, 0); for (let y = 0; y <= h; y += 6) c.lineTo(x0 + dir * (t + Math.sin(y * 0.21) * (M.rug || 0.1) * 14 + ((y * 7919) % 13) * (M.rug || 0) * 0.9), y); c.lineTo(x0, h); }
    c.fill();
    // fendinhas com ar preso (núcleos de bolha) em superfícies ásperas
    if ((M.rug || 0) > 0.3 && lado === 'baixo') { c.fillStyle = 'rgba(220,240,255,.55)'; for (let x = 12; x < w; x += 34) { c.beginPath(); c.arc(x, h - t + 4, 3, 0, Math.PI * 2); c.fill(); } }
  }
  if (geral.textura) texturaSolida(c, w, h, geral.textura, geral.solido);
  if (geral.espuma) { c.strokeStyle = 'rgba(200,230,255,.8)'; c.lineWidth = 3; const r = 34; for (let a = 0; a < 6; a++) for (let b = 0; b < 8; b++) { const x = b * r * 1.5, y = a * r * 1.73 + (b % 2) * r * 0.87; c.beginPath(); for (let k = 0; k <= 6; k++) { const an = k * Math.PI / 3; c.lineTo(x + Math.cos(an) * r, y + Math.sin(an) * r); } c.stroke(); } }
  const B = geral.bolha;
  if (B) { const g = c.createRadialGradient(B.cx - B.r * 0.3, B.cy - B.r * 0.3, 2, B.cx, B.cy, B.r); g.addColorStop(0, 'rgba(30,40,60,.95)'); g.addColorStop(1, 'rgba(150,200,255,.25)'); c.fillStyle = g; c.beginPath(); c.arc(B.cx, B.cy, B.r, 0, Math.PI * 2); c.fill(); c.strokeStyle = 'rgba(200,230,255,.9)'; c.lineWidth = 2; c.stroke(); }
  for (const p of P) {
    if (p.x0 !== undefined) { p.x = p.x0 + (Math.random() - 0.5) * p.vib * agit; p.y = p.y0 + (Math.random() - 0.5) * p.vib * agit; }
    else if (p.naBorda !== undefined && B) { p.x = B.cx + Math.cos(p.naBorda) * (B.r + 6); p.y = B.cy + Math.sin(p.naBorda) * (B.r + 6); p.ang = p.naBorda + Math.PI; }
    else if (p.naRede !== undefined) { const r = 34, a = (p.naRede % 4), b = (p.naRede / 4) | 0; p.x = b * r * 1.5 + r * 0.5 + 40; p.y = a * r * 1.73 + 20; p.ang = Math.PI / 2; }
    else {
      const amp = p.rapido ? 1 : 0.35;
      p.vx = (p.vx || 0) * (p.rapido ? 1 : 0.6) + (Math.random() - 0.5) * agit * amp; p.vy = (p.vy || 0) * (p.rapido ? 1 : 0.6) + (Math.random() - 0.5) * agit * amp;
      p.x += p.vx; p.y += p.vy; p.ang += (p.va || 0) + (Math.random() - 0.5) * 0.08 * agit;
      if (p.x < 0) { p.x = 0; p.vx = Math.abs(p.vx); } if (p.x > w) { p.x = w; p.vx = -Math.abs(p.vx); } if (p.y < 0) { p.y = 0; p.vy = Math.abs(p.vy); } if (p.y > h) { p.y = h; p.vy = -Math.abs(p.vy); }
      if (B) { const d = Math.hypot(p.x - B.cx, p.y - B.cy); if (p.dentro && d > B.r - 6) { p.x = B.cx + (p.x - B.cx) * (B.r - 7) / d; p.y = B.cy + (p.y - B.cy) * (B.r - 7) / d; p.vx *= -1; p.vy *= -1; } if (p.fora && d < B.r + 8) { p.x = B.cx + (p.x - B.cx) * (B.r + 9) / d; p.y = B.cy + (p.y - B.cy) * (B.r + 9) / d; } }
    }
    if (p.eletron) { c.fillStyle = 'rgba(140,200,255,.8)'; c.beginPath(); c.arc(p.x, p.y, 1.6, 0, Math.PI * 2); c.fill(); continue; }
    if (p.surf) { desenharTensoativo(c, p.x, p.y, p.ang); continue; }
    if (p.ion) { esfera(c, p.x, p.y, p.ion.r * esc, p.ion.cor); if (p.ion.txt) { c.fillStyle = '#fff'; c.font = 'bold 12px system-ui'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(p.ion.txt, p.x, p.y); } continue; }
    if (p.at) desenharMol(c, p.at, p.x, p.y, p.ang, esc, p.gas ? 1 : 0.92);
  }
}
// molécula de detergente: cabeça que gosta de água + cauda que foge dela
function desenharTensoativo(c, x, y, ang) {
  const ca = Math.cos(ang), sa = Math.sin(ang);
  c.strokeStyle = '#b8b8b8'; c.lineWidth = 2.2; c.beginPath(); c.moveTo(x, y);
  for (let k = 1; k <= 6; k++) c.lineTo(x + ca * k * 4.2 + (k % 2 ? -sa : sa) * 2.4, y + sa * k * 4.2 + (k % 2 ? ca : -ca) * 2.4);
  c.stroke(); esfera(c, x, y, 5, '#f0c020');
}
function texturaSolida(c, w, h, tipo, M) {
  const cor = M && M.rgb ? M.rgb[0] : [200, 200, 200];
  if (tipo === 'milho' || tipo === 'organico' || tipo === 'mentos' || tipo === 'pipoca') {
    // grânulos de amido (milho), cristais de açúcar (Mentos), células cheias de ar (pipoca, cortiça)
    for (let k = 0; k < 26; k++) {
      const x = (k * 97) % w, y = (k * 57) % h, r = tipo === 'pipoca' ? 26 : 12 + (k % 5) * 3;
      c.fillStyle = tipo === 'pipoca' ? 'rgba(20,20,30,.85)' : `rgba(${cor.map(v => Math.min(255, v + (k % 3) * 12)).join(',')},.95)`;
      c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = 2; c.beginPath();
      for (let a = 0; a < 7; a++) { const an = a / 7 * Math.PI * 2 + k; c.lineTo(x + Math.cos(an) * r * (0.8 + ((a * k) % 3) * 0.1), y + Math.sin(an) * r * (0.8 + ((a + k) % 3) * 0.1)); }
      c.closePath(); c.fill(); c.stroke();
      if (tipo === 'pipoca') { c.strokeStyle = 'rgba(255,244,214,.9)'; c.stroke(); }
    }
    if (tipo === 'milho') { c.fillStyle = 'rgba(160,100,10,.5)'; c.fillRect(0, 0, w, 10); c.fillStyle = 'rgba(220,240,255,.6)'; for (let x = 10; x < w; x += 30) { c.beginPath(); c.arc(x, 12, 3.5, 0, Math.PI * 2); c.fill(); } }
  }
}

/* ---------- texto explicativo ---------- */
function n2(v, d = 2) { return (Math.round(v * 10 ** d) / 10 ** d).toLocaleString('pt-BR'); }
function explicarMicro(cena) {
  if (!cena) return '';
  const t = cena.t, T = `${n2(t, 0)} °C`;
  switch (cena.tipo) {
    case 'ar': return typeof ATMOSFERA !== 'undefined' && ATMOSFERA === 'vacuo' ? '<b>Vácuo</b>: quase nenhuma molécula. Sem pressão do ar, o gás dissolvido nos líquidos sai todo (a solubilidade cai a quase zero).' : `<b>Ar</b> a ${T}: moléculas de N₂ (azuis) e O₂ (vermelhas) voando a ~500 m/s e batendo umas nas outras. Mais quente = mais rápido.`;
    case 'gas': return `<b>${esc(nomeNoEstado(cena.M, 2))}</b> (gás) a ${T}: as moléculas ficam longe umas das outras (~10 diâmetros) e se movem em linha reta até bater. Densidade ${n2(cena.M.dens[2] * 1000, 2)} g/L ${cena.M.dens[2] < AR_D ? '(mais leve que o ar: sobe)' : '(mais pesado que o ar: desce)'}.`;
    case 'fogo': return `<b>Chama</b>: gases muito quentes onde a reação de combustão acontece. As moléculas batem tão forte que quebram ligações e soltam energia em forma de luz.`;
    case 'liquido': {
      let h = `<b>${esc(nomeNoEstado(cena.M, 1))}</b> a ${T}: as moléculas ficam encostadas, mas deslizam umas sobre as outras (por isso o líquido escorre).`;
      if (cena.M.tipo === 'solucao' && cena.M.cat) h += ' Os íons dissolvidos ficam cercados por moléculas de água viradas para eles (camada de hidratação).';
      if (cena.M.surfactante) h += ' As moléculas de detergente (cabeça amarela que gosta de água, cauda cinza que foge dela) baixam a tensão superficial de 72 para ~30 mN/m.';
      if (cena.gas && cena.dis > 0.01) {
        const cs = solubilidade(cena.gas, cena.M, t), S = cena.dis / cs;
        h += `<br>💨 <b>${cena.gas.nome} dissolvido</b>: ${n2(cena.dis)} volumes de gás por volume de líquido. A lei de Henry deixa só ${n2(cs)} a ${T}${FIS.pressao < 1 ? ' no vácuo' : ' e 1 atm'}. `;
        h += S > 1.05 ? `Está <b>supersaturado ${n2(S, 1)}×</b>: o gás quer sair, mas para virar bolha precisa de um ponto de apoio ${cena.parede ? `— e aqui tem um: <b>${esc(cena.parede.M.nome)}</b> (aspereza ${n2(aspereza(cena.parede.j), 2)})` : '(superfície áspera)'}.${S > 25 ? ' Com tanto excesso, as bolhas já nascem até no meio do líquido.' : ''}` : 'Abaixo do limite: o gás fica dissolvido e não forma bolhas.';
      } else if (cena.parede) h += `<br>Encostado em <b>${esc(cena.parede.M.nome)}</b>.`;
      return h;
    }
    case 'bolha': {
      const G = cena.gas, sig = cena.surf ? SIGMA_DETERGENTE : SIGMA_AGUA;
      const hid = cena.parede ? hidrofobico(cena.parede.j) : 0, Vd = volumeSoltura(sig, hid);
      let h = `<b>Bolha de ${G ? G.nome : 'gás'}</b> com ${n2(cena.gv)} do volume de uma célula. Dentro, as moléculas de gás voam soltas; em volta, o líquido.`;
      if (cena.liq && G) { const cs = solubilidade(G, cena.liq, t), S = cena.disViz / cs; h += S > 1 ? ` O líquido em volta está supersaturado ${n2(S, 1)}×: o gás dissolvido atravessa a parede e a bolha <b>cresce</b>.` : ' O líquido em volta não está supersaturado: a bolha encolhe devagar (o gás se dissolve de volta).'; }
      if (cena.grudada) h += `<br>📌 <b>Grudada</b> em ${cena.parede ? esc(cena.parede.M.nome) : 'uma superfície'}: a tensão superficial (σ ≈ ${sig} mN/m) segura a bolha${hid > 0.5 ? ' e a superfície repele água, o que segura ainda mais' : ''}. Ela se solta com ≈ ${n2(Vd)} do volume da célula, quando o empuxo ganhar.`;
      else h += '<br>⬆️ <b>Solta</b>: sobe pelo empuxo. Quanto maior a bolha, mais rápido (lei de Stokes: velocidade ∝ raio²).';
      if (cena.surf) h += '<br>🧼 As moléculas de detergente se enfileiram na parede da bolha, com a cauda para dentro do gás. Na superfície, ela não estoura: vira espuma.';
      return h;
    }
    case 'espuma': return '<b>Espuma</b>: bolhas separadas por películas finíssimas de água, cada uma "ensanduichada" entre duas camadas de detergente. O líquido escorre das películas pela gravidade (drenagem); quando uma afina demais, estoura.';
    case 'solido': {
      const M = cena.M, b = cena.objeto && cena.objeto.info;
      let h = `<b>${esc(nomeNoEstado(M, 0))}</b> a ${T}`;
      if (M.micro === 'milho') h += ': por fora, a casca (pericarpo) cheia de fendinhas que seguram ar e repelem a água; por dentro, grânulos de amido com ~14% de água. É nas fendinhas que as bolhas nascem.';
      else if (M.micro === 'mentos') h += ': a superfície tem milhões de poros minúsculos. Cada um é um ponto de nucleação: em refrigerante o gás sai de todos ao mesmo tempo.';
      else if (M.micro === 'pipoca') h += ': espuma sólida de amido, cheia de células de ar que o vapor inflou.';
      else if (M.metal) h += ': átomos num retículo cristalino, com elétrons livres circulando entre eles ("mar de elétrons"). Por isso conduz eletricidade e calor e amassa sem quebrar.';
      else if (M.ionico || M.ions) h += ': cristal iônico, com cátions (+) e ânions (−) alternados, presos pela atração elétrica. É duro, mas quebra quando as camadas escorregam e cargas iguais ficam frente a frente.';
      else h += ': as moléculas ficam presas em posições fixas e só vibram. Mais quente = vibram mais, até derreter.';
      if (b) h += `<br>🧊 <b>Objeto</b>: densidade ${n2(MATS[mt[cena.i]].dens[0])} g/cm³${b.gas > 0.01 ? `; com ${b.bolhas} bolha${b.bolhas === 1 ? '' : 's'} grudada${b.bolhas === 1 ? '' : 's'} (${n2(b.gas)} de gás) a densidade média é <b>${n2(b.dens)}</b>` : ''}. Fluido em volta: ${n2(b.densFluido)} g/cm³ → ${b.desloc > b.massa ? '<b>empuxo maior que o peso: sobe</b>' : '<b>peso maior que o empuxo: afunda</b>'}.`;
      return h;
    }
  }
  return '';
}
