/* =========================================================================
   ZONA QUENTE · mapa
   Terreno (mapa de alturas), três favelas nos morros, a BR-707 que liga tudo,
   posto, base da polícia, lojas de munição e o "mundo de colisão": caixas
   alinhadas aos eixos (casas, muros, carros parados...) num grid espacial,
   usado pelo movimento, pelas balas e pela visão dos bots.
   ========================================================================= */
import * as THREE from 'three';

export function semente(n) { return () => { n |= 0; n = n + 0x6D2B79F5 | 0; let t = Math.imul(n ^ n >>> 15, 1 | n); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

export const MX = 360, MZ = 260; // meia largura do mapa (m)
export const LADOS = [
  { id: 0, sigla: 'BDT', nome: 'Bonde do Trovão', cor: '#f6c90e', faccao: true },
  { id: 1, sigla: 'TDG', nome: 'Tropa da Garça', cor: '#4cc9f0', faccao: true },
  { id: 2, sigla: 'OC', nome: 'Os Corvos', cor: '#c77dff', faccao: true },
  { id: 3, sigla: 'FI', nome: 'Força Integrada (polícia)', cor: '#ff5d5d', faccao: false },
];
export const UNIDADES = [
  { id: 'BOEPF', nome: 'BOEPF', desc: 'Batalhão Especial para Favelas', farda: 0x16181d, detalhe: 0x2b2d33 },
  { id: 'PCM', nome: 'PCM', desc: 'Polícia da Comunidade', farda: 0x23407a, detalhe: 0x1b2f57 },
  { id: 'EXANTF', nome: 'EXANTF', desc: 'Exército Anti-Facção', farda: 0x4b5a32, detalhe: 0x3a4627 },
];
export const MORROS = [
  { id: 'jatoba', nome: 'Morro do Jatobá', x: -220, z: -120, r: 105, h: 46, lado: 0, ang: 0.6 },
  { id: 'cajueiro', nome: 'Vila Cajueiro', x: 0, z: 140, r: 115, h: 34, lado: 1, ang: -Math.PI / 2 },
  { id: 'antena', nome: 'Morro da Antena', x: 225, z: -125, r: 100, h: 56, lado: 2, ang: Math.PI - 0.6 },
];
export const BASE_POLICIA = { x: 0, z: -175 };
export const POSTO = { x: -55 };
export const brZ = x => 10 + 25 * Math.sin(x / 120);

/* ---------- linhas (BR, ruas, becos): pontos a cada 4 m ---------- */
function linha(pts, passo = 4) { const o = []; for (let i = 0; i < pts.length - 1; i++) { const [a, b] = [pts[i], pts[i + 1]], d = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.ceil(d / passo)); for (let k = 0; k < n; k++) o.push([a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n]); } o.push(pts[pts.length - 1]); return o; }
function distLinha(L, x, z) { let m = 1e9, im = 0; for (let i = 0; i < L.length; i++) { const d = (L[i][0] - x) ** 2 + (L[i][1] - z) ** 2; if (d < m) { m = d; im = i; } } return [Math.sqrt(m), im]; }
const BR = []; for (let x = -MX - 20; x <= MX + 20; x += 4) BR.push([x, brZ(x)]);
export const LINHAS = { BR, ruas: [], becos: [] };
// rua principal de cada favela: sai da BR e sobe até perto do topo (onde fica o QG)
for (const m of MORROS) {
  const xb = m.x + Math.cos(m.ang) * 30, zb = brZ(xb);
  const a = m.ang + Math.PI;
  const meio = [m.x + Math.cos(m.ang) * m.r * 0.6 + Math.cos(a + 1.2) * 18, m.z + Math.sin(m.ang) * m.r * 0.6 + Math.sin(a + 1.2) * 18];
  const fim = [m.x + Math.cos(m.ang) * m.r * 0.25, m.z + Math.sin(m.ang) * m.r * 0.25];
  m.rua = linha([[xb, zb], [m.x + Math.cos(m.ang) * m.r * 0.95, m.z + Math.sin(m.ang) * m.r * 0.95], meio, fim]);
  m.qg = { x: fim[0], z: fim[1] };
  LINHAS.ruas.push(m.rua);
  // becos: raios descendo do topo e dois anéis
  m.becos = [];
  for (let k = 0; k < 7; k++) { const ang = m.ang + 0.45 + k * (Math.PI * 2 - 0.9) / 6; m.becos.push(linha([[m.x + Math.cos(ang) * 9, m.z + Math.sin(ang) * 9], [m.x + Math.cos(ang) * m.r * 0.98, m.z + Math.sin(ang) * m.r * 0.98]], 3)); }
  for (const rr of [0.42, 0.72]) { const pts = []; for (let k = 0; k <= 48; k++) { const ang = k / 48 * Math.PI * 2; pts.push([m.x + Math.cos(ang) * m.r * rr, m.z + Math.sin(ang) * m.r * rr]); } m.becos.push(linha(pts, 3)); }
  LINHAS.becos.push(...m.becos);
}
// acesso da base da polícia até a BR
const RUA_BASE = linha([[BASE_POLICIA.x, BASE_POLICIA.z + 22], [BASE_POLICIA.x, brZ(0)]]);
LINHAS.ruas.push(RUA_BASE);

/* ---------- altura do terreno ---------- */
function alturaBruta(x, z) {
  let h = 0;
  for (const m of MORROS) { const d = Math.hypot(x - m.x, z - m.z) / m.r; if (d < 1.35) h += m.h * 0.5 * (1 + Math.cos(Math.PI * d / 1.35)) * (d < 0.12 ? 1 : 1) ; }
  // serras no fundo (o mapa termina em morros sem casas)
  const e = Math.max(Math.abs(x) - (MX - 50), Math.abs(z) - (MZ - 50));
  if (e > 0) h += Math.pow(e / 50, 1.6) * 70;
  h += Math.sin(x * 0.045) * Math.cos(z * 0.05) * 1.6 + Math.sin(x * 0.11 + z * 0.07) * 0.6;
  // topo dos morros: pracinha plana
  for (const m of MORROS) { const d = Math.hypot(x - m.x, z - m.z); if (d < 16) h = h * (1 - smooth(16, 7, d)) + (m.h * 0.5 * (1 + Math.cos(Math.PI * (7 / m.r) / 1.35)) + 0.5) * smooth(16, 7, d); }
  // BR e acesso à base: chão nivelado
  const [dBR] = distLinha(BR, x, z); h = h * (1 - smooth(26, 11, dBR)) + 1.0 * smooth(26, 11, dBR);
  const db = Math.hypot(x - BASE_POLICIA.x, z - BASE_POLICIA.z); h = h * (1 - smooth(60, 40, db)) + 1.2 * smooth(60, 40, db);
  const [dRb] = distLinha(RUA_BASE, x, z); h = h * (1 - smooth(14, 6, dRb)) + 1.1 * smooth(14, 6, dRb);
  return h;
}
export const RES = 2, NX = Math.round(MX * 2 / RES) + 1, NZ = Math.round(MZ * 2 / RES) + 1;
export const ALT = new Float32Array(NX * NZ);
for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) ALT[j * NX + i] = alturaBruta(-MX + i * RES, -MZ + j * RES);
export function alturaTerreno(x, z) {
  const fx = clamp((x + MX) / RES, 0, NX - 1.001), fz = clamp((z + MZ) / RES, 0, NZ - 1.001), i = fx | 0, j = fz | 0, tx = fx - i, tz = fz - j;
  const a = ALT[j * NX + i], b = ALT[j * NX + i + 1], c = ALT[(j + 1) * NX + i], d = ALT[(j + 1) * NX + i + 1];
  return (a * (1 - tx) + b * tx) * (1 - tz) + (c * (1 - tx) + d * tx) * tz;
}
export function normalTerreno(x, z) { const e = 1.2, hx = alturaTerreno(x + e, z) - alturaTerreno(x - e, z), hz = alturaTerreno(x, z + e) - alturaTerreno(x, z - e); return new THREE.Vector3(-hx, 2 * e, -hz).normalize(); }

/* ---------- mundo de colisão ---------- */
// cada caixa: { x0,y0,z0,x1,y1,z1, mat, vidro?: indice, quebrado?, tipo? }
export const CAIXAS = [];
const CEL = 8, GX = Math.ceil(MX * 2 / CEL), GZ = Math.ceil(MZ * 2 / CEL);
const GRADE = Array.from({ length: GX * GZ }, () => []);
const celX = x => clamp(Math.floor((x + MX) / CEL), 0, GX - 1), celZ = z => clamp(Math.floor((z + MZ) / CEL), 0, GZ - 1);
export function addCaixa(b) {
  b.id = CAIXAS.length; CAIXAS.push(b);
  for (let gz = celZ(b.z0); gz <= celZ(b.z1); gz++) for (let gx = celX(b.x0); gx <= celX(b.x1); gx++) GRADE[gz * GX + gx].push(b.id);
  return b;
}
export function caixaCentro(cx, cy, cz, sx, sy, sz, mat, extra) { return addCaixa(Object.assign({ x0: cx - sx / 2, y0: cy - sy / 2, z0: cz - sz / 2, x1: cx + sx / 2, y1: cy + sy / 2, z1: cz + sz / 2, mat }, extra || {})); }
let carimbo = 1; const visto = new Uint32Array(200000);
export function caixasPerto(x, z, r, fn) {
  carimbo++;
  for (let gz = celZ(z - r); gz <= celZ(z + r); gz++) for (let gx = celX(x - r); gx <= celX(x + r); gx++) for (const id of GRADE[gz * GX + gx]) { if (visto[id] === carimbo) continue; visto[id] = carimbo; const b = CAIXAS[id]; if (!b.quebrado) fn(b); }
}
// raio x caixa (método das lajes); devolve t de entrada e a normal
function raioCaixa(ox, oy, oz, dx, dy, dz, b, tmax) {
  let t0 = 0, t1 = tmax, nx = 0, ny = 0, nz = 0;
  const eixo = (o, d, a, c, k) => {
    if (Math.abs(d) < 1e-9) return o >= a && o <= c;
    let ta = (a - o) / d, tb = (c - o) / d, s = -1; if (ta > tb) { const q = ta; ta = tb; tb = q; s = 1; }
    if (ta > t0) { t0 = ta; nx = ny = nz = 0; if (k === 0) nx = s; else if (k === 1) ny = s; else nz = s; }
    if (tb < t1) t1 = tb; return t0 <= t1;
  };
  if (!eixo(ox, dx, b.x0, b.x1, 0) || !eixo(oy, dy, b.y0, b.y1, 1) || !eixo(oz, dz, b.z0, b.z1, 2)) return null;
  if (t0 <= 0) return null;
  return { t: t0, nx, ny, nz };
}
// raio no mundo (terreno + caixas). dir normalizada. Devolve o acerto mais próximo.
export function raio(o, d, max, ignorarVidro = false) {
  let melhor = null;
  // caixas: anda pelas células do grid (DDA)
  carimbo++;
  let x = o.x, z = o.z; const passos = Math.ceil(max / (CEL * 0.5)) + 1, sx = d.x * CEL * 0.5, sz = d.z * CEL * 0.5;
  let tLim = max;
  for (let k = 0; k <= passos; k++) {
    const gx0 = celX(x - 0.5), gx1 = celX(x + 0.5), gz0 = celZ(z - 0.5), gz1 = celZ(z + 0.5);
    for (let gz = gz0; gz <= gz1; gz++) for (let gx = gx0; gx <= gx1; gx++) for (const id of GRADE[gz * GX + gx]) {
      if (visto[id] === carimbo) continue; visto[id] = carimbo; const b = CAIXAS[id]; if (b.quebrado || (ignorarVidro && b.vidro !== undefined)) continue;
      const h = raioCaixa(o.x, o.y, o.z, d.x, d.y, d.z, b, tLim);
      if (h && h.t < tLim) { tLim = h.t; melhor = { t: h.t, nx: h.nx, ny: h.ny, nz: h.nz, mat: b.mat, caixa: b }; }
    }
    if (k * CEL * 0.5 > tLim + CEL) break;
    x += sx; z += sz;
  }
  // terreno: marcha + bisseção
  const passo = 1.5; let tPrev = 0, acimaPrev = o.y - alturaTerreno(o.x, o.z);
  if (acimaPrev < -0.05) return melhor;
  for (let t = passo; t <= Math.min(tLim, max) + passo; t += passo) {
    const tt = Math.min(t, Math.min(tLim, max)), px = o.x + d.x * tt, py = o.y + d.y * tt, pz = o.z + d.z * tt, acima = py - alturaTerreno(px, pz);
    if (acima < 0) {
      let a = tPrev, b = tt; for (let it = 0; it < 12; it++) { const m = (a + b) / 2, qa = o.y + d.y * m - alturaTerreno(o.x + d.x * m, o.z + d.z * m); if (qa < 0) b = m; else a = m; }
      if (b < tLim) { const px2 = o.x + d.x * b, pz2 = o.z + d.z * b, n = normalTerreno(px2, pz2); melhor = { t: b, nx: n.x, ny: n.y, nz: n.z, mat: materialChao(px2, pz2), terreno: true }; }
      break;
    }
    tPrev = tt; if (tt >= Math.min(tLim, max)) break;
  }
  return melhor;
}
export function visivel(a, b, ignorarVidro = true) { const dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z, d = Math.hypot(dx, dy, dz); if (d < 0.01) return true; const h = raio(a, { x: dx / d, y: dy / d, z: dz / d }, d - 0.2, ignorarVidro); return !h; }
// chão sob um ponto: maior entre terreno e topo de caixa (até "passo" acima dos pés)
export function chaoEm(x, z, yPes, raioP = 0.3, passo = 0.55) {
  let h = alturaTerreno(x, z);
  caixasPerto(x, z, raioP + 0.5, b => { if (b.vidro !== undefined || b.semChao) return; if (x + raioP > b.x0 && x - raioP < b.x1 && z + raioP > b.z0 && z - raioP < b.z1 && b.y1 <= yPes + passo && b.y1 > h) h = b.y1; });
  return h;
}
export function dentroDeCaixa(x, y, z) { let r = false; caixasPerto(x, z, 0.5, b => { if (!r && b.vidro === undefined && x > b.x0 && x < b.x1 && z > b.z0 && z < b.z1 && y > b.y0 && y < b.y1) r = true; }); return r; }
// tipo de chão (para o som dos passos e dos impactos no terreno)
export function materialChao(x, z) {
  const [dBR] = distLinha(BR, x, z); if (dBR < 11) return 'asfalto';
  for (const m of MORROS) if (Math.hypot(x - m.x, z - m.z) < m.r) return 'concreto';
  return 'terra';
}

/* =========================================================================
   GERAÇÃO DO MUNDO (casas, props, pontos de interesse)
   ========================================================================= */
const rnd = semente(20261123);
const R = (a, b) => a + (b - a) * rnd();
export const CASAS = [], JANELAS = [], CAIXAS_DAGUA = [], PROPS = [], POSTES = [], FIOS = [], ARVORES = [];
export const PONTOS = []; // pontos de controle
export const LOJAS = []; // lojas de munição (de graça)
export const BOMBAS = []; // bombas de combustível
export const HELIPONTO = { x: BASE_POLICIA.x + 22, z: BASE_POLICIA.z - 8 };
export const SPAWNS = { 0: [], 1: [], 2: [], 3: [] };
export const VEICULOS_INICIAIS = [];
const perto = (L, x, z, r) => distLinha(L, x, z)[0] < r;
function livre(x, z, folga = 0) { let ok = true; caixasPerto(x, z, folga + 4, b => { if (ok && x + folga > b.x0 - 0.4 && x - folga < b.x1 + 0.4 && z + folga > b.z0 - 0.4 && z - folga < b.z1 + 0.4) ok = false; }); return ok; }
const PINTADAS = ['#e9c46a', '#f4a261', '#e76f51', '#8ecae6', '#90be6d', '#f1faee', '#ffafcc', '#cdb4db', '#a8dadc', '#ffd6a5'];
function casa(x, z, w, dd, andares, opts = {}) {
  const hs = [alturaTerreno(x - w / 2, z - dd / 2), alturaTerreno(x + w / 2, z - dd / 2), alturaTerreno(x - w / 2, z + dd / 2), alturaTerreno(x + w / 2, z + dd / 2)];
  const y0 = Math.min(...hs) - 0.4, yTop = Math.max(...hs) + andares * 2.9;
  const tijolo = opts.cor ? false : rnd() < 0.62;
  const c = addCaixa({ x0: x - w / 2, y0, z0: z - dd / 2, x1: x + w / 2, y1: yTop, z1: z + dd / 2, mat: 'tijolo', tipo: 'casa' });
  CASAS.push({ b: c, cor: opts.cor || (tijolo ? '#b5654a' : PINTADAS[(rnd() * PINTADAS.length) | 0]), tijolo });
  // janelas de vidro em cada andar (quebram com tiro)
  const base = Math.max(...hs);
  for (let a = 0; a < andares; a++) {
    const yj = base + a * 2.9 + 1.25; if (yj > yTop - 0.6) break;
    for (const lado of [0, 1, 2, 3]) {
      if (rnd() > (opts.janelas ?? 0.55)) continue;
      const largo = lado < 2 ? w : dd; if (largo < 3) continue;
      const off = R(-largo / 2 + 1, largo / 2 - 1), tj = opts.vitrine ? Math.min(largo - 1, 4) : 0.9, hj = opts.vitrine ? 2.2 : 0.9;
      let cx, cz, sx, sz;
      if (lado === 0) { cx = x + off; cz = z - dd / 2 - 0.03; sx = tj; sz = 0.05; } else if (lado === 1) { cx = x + off; cz = z + dd / 2 + 0.03; sx = tj; sz = 0.05; }
      else if (lado === 2) { cx = x - w / 2 - 0.03; cz = z + off; sx = 0.05; sz = tj; } else { cx = x + w / 2 + 0.03; cz = z + off; sx = 0.05; sz = tj; }
      const yy = opts.vitrine ? base + 1.3 : yj;
      if (yy - hj / 2 < alturaTerreno(cx, cz) + 0.3) continue;
      const idx = JANELAS.length; const bv = caixaCentro(cx, yy, cz, sx, hj, sz, 'vidro', { vidro: idx });
      JANELAS.push({ b: bv, idx, quebrada: false });
      if (opts.vitrine) break;
    }
  }
  // caixa d'água azul na laje
  if (!opts.semCaixa && rnd() < 0.55 && w > 4 && dd > 4) { const cx = x + R(-w / 2 + 1, w / 2 - 1), cz = z + R(-dd / 2 + 1, dd / 2 - 1); CAIXAS_DAGUA.push([cx, yTop, cz]); caixaCentro(cx, yTop + 0.55, cz, 1.3, 1.1, 1.3, 'plastico'); }
  return c;
}
// ---------- favelas ----------
for (const m of MORROS) {
  const passo = 6.4;
  for (let gz = m.z - m.r; gz <= m.z + m.r; gz += passo) for (let gx = m.x - m.r; gx <= m.x + m.r; gx += passo) {
    const x = gx + R(-1.1, 1.1), z = gz + R(-1.1, 1.1), d = Math.hypot(x - m.x, z - m.z);
    if (d > m.r * 0.94 || d < 13) continue;
    if (alturaTerreno(x, z) < 2.2) continue;
    if (perto(BR, x, z, 19) || perto(m.rua, x, z, 6.5) || m.becos.some(L => perto(L, x, z, 3.4))) continue;
    if (Math.hypot(x - m.qg.x, z - m.qg.z) < 13) continue;
    const w = R(4.2, 5.8), dd = R(4.2, 5.8), andares = 1 + (rnd() < 0.7 ? 1 : 0) + (rnd() < 0.45 ? 1 : 0) + (d < m.r * 0.5 && rnd() < 0.3 ? 1 : 0);
    casa(x, z, w, dd, andares);
  }
  // QG da facção: casarão + sacos de areia + loja de munição
  const qx = m.qg.x, qz = m.qg.z, hq = alturaTerreno(qx, qz);
  casa(qx + 7, qz + 6, 7, 6, 2, { cor: '#6d597a', semCaixa: false, janelas: 0.8 });
  for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2; const sx = qx + Math.cos(a) * 9, sz = qz + Math.sin(a) * 9; caixaCentro(sx, alturaTerreno(sx, sz) + 0.5, sz, 2.4, 1.0, 0.8, 'terra', { tipo: 'saco' }); }
  LOJAS.push({ x: qx - 4, z: qz - 3, lado: m.lado, nome: 'Loja de munição do ' + LADOS[m.lado].sigla });
  caixaCentro(qx - 4, alturaTerreno(qx - 4, qz - 3) + 1.2, qz - 3 - 1.4, 2.6, 2.4, 0.4, 'madeira', { tipo: 'loja' });
  // spawns do lado em volta do QG
  for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2 + 0.3; const sx = qx + Math.cos(a) * 5, sz = qz + Math.sin(a) * 5; SPAWNS[m.lado].push([sx, sz]); }
  // ponto de controle no topo
  PONTOS.push({ id: m.id, nome: 'Topo do ' + m.nome.replace(/^Morro do |^Vila /, ''), x: m.x, z: m.z, r: 12, dono: m.lado, progresso: 1, quem: m.lado });
  // barricada na entrada da rua principal (pneus e contêiner)
  const e = m.rua[Math.floor(m.rua.length * 0.18)];
  caixaCentro(e[0] + 4, alturaTerreno(e[0] + 4, e[1]) + 1.3, e[1] + 3, 2.5, 2.6, 6, 'metal', { tipo: 'conteiner', cor: ['#2a6f97', '#b23a48', '#e9c46a'][m.lado] });
  caixaCentro(e[0] - 4, alturaTerreno(e[0] - 4, e[1]) + 0.45, e[1] - 2, 3, 0.9, 1.2, 'borracha', { tipo: 'pneus' });
  // picape blindada da facção perto do pé do morro
  const pe = m.rua[Math.floor(m.rua.length * 0.08)];
  VEICULOS_INICIAIS.push({ tipo: 'picape', x: pe[0] + 6, z: pe[1], yaw: 0, lado: m.lado });
}
// ---------- BR-707: mureta central, carros abandonados, postes, ônibus queimado ----------
for (let i = 2; i < BR.length - 2; i += 1) {
  const [x, z] = BR[i]; if (Math.abs(x) > MX - 40) continue;
  if (i % 2 === 0 && Math.abs(x - POSTO.x) > 30 && Math.abs(x) > 14) { const [x2, z2] = BR[i + 1]; caixaCentro((x + x2) / 2, 1.45, (z + z2) / 2, Math.abs(x2 - x) + 0.1, 0.9, Math.max(0.6, Math.abs(z2 - z) + 0.6), 'concreto', { tipo: 'mureta' }); }
  if (i % 9 === 0) for (const l of [-1, 1]) { POSTES.push([x, 1, z + l * 11.5]); }
}
for (let k = 0; k < 10; k++) { const x = -MX + 70 + k * 62 + R(-10, 10); if (Math.abs(x - POSTO.x) < 25 || Math.abs(x) < 16) continue; const z = brZ(x) + (rnd() < 0.5 ? -4.5 : 4.5); const queimado = rnd() < 0.5; caixaCentro(x, 1.0 + 0.8, z, 4.3, 1.5, 1.9, 'metal', { tipo: 'carro', cor: queimado ? '#2b2522' : PINTADAS[(rnd() * PINTADAS.length) | 0], queimado }); }
{ const x = 40, z = brZ(40) - 4; caixaCentro(x, 1 + 1.6, z, 11, 3.2, 2.6, 'metal', { tipo: 'onibus', cor: '#2b2522', queimado: true }); }
// pontos de controle na BR
PONTOS.push({ id: 'trevo', nome: 'Trevo da BR', x: 0, z: brZ(0), r: 14, dono: -1, progresso: 0, quem: -1 });
PONTOS.push({ id: 'posto', nome: 'Posto Serra Alta', x: POSTO.x, z: brZ(POSTO.x) + 20, r: 14, dono: -1, progresso: 0, quem: -1 });
// ---------- posto de gasolina ----------
{
  const px = POSTO.x, pz = brZ(px) + 20;
  for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) { if (alturaTerreno(px, pz) > 3) break; }
  casa(px + 10, pz + 7, 12, 8, 1, { cor: '#f1f1f1', vitrine: true, janelas: 1, semCaixa: true });
  for (const [dx, dz] of [[-7, -5], [7, -5], [-7, 5], [7, 5]]) caixaCentro(px + dx, 1 + 2.5, pz + dz, 0.5, 5, 0.5, 'metal', { tipo: 'pilar' });
  caixaCentro(px, 1 + 5.2, pz, 16, 0.4, 12, 'metal', { tipo: 'cobertura', semChao: false, cor: '#c1121f' });
  for (const dx of [-3.5, 3.5]) { caixaCentro(px + dx, 1 + 0.8, pz, 0.8, 1.6, 0.6, 'metal', { tipo: 'bomba' }); BOMBAS.push({ x: px + dx, z: pz + 1.4 }); BOMBAS.push({ x: px + dx, z: pz - 1.4 }); }
  LOJAS.push({ x: px + 10, z: pz + 2.2, lado: -1, nome: 'Loja de munição do posto' });
}
// ---------- base da polícia ----------
{
  const bx = BASE_POLICIA.x, bz = BASE_POLICIA.z, hb = alturaTerreno(bx, bz);
  const W = 70, D = 46;
  for (const [x0, z0, x1, z1] of [[-W / 2, -D / 2, W / 2, -D / 2], [-W / 2, -D / 2, -W / 2, D / 2], [W / 2, -D / 2, W / 2, D / 2], [-W / 2, D / 2, -6, D / 2], [6, D / 2, W / 2, D / 2]]) {
    const cx = bx + (x0 + x1) / 2, cz = bz + (z0 + z1) / 2, sx = Math.max(0.6, Math.abs(x1 - x0)), sz = Math.max(0.6, Math.abs(z1 - z0));
    caixaCentro(cx, hb + 1.5, cz, sx, 3, sz, 'concreto', { tipo: 'muro' });
  }
  casa(bx - 16, bz - 8, 24, 12, 2, { cor: '#d9d9d9', janelas: 0.9, semCaixa: true });
  caixaCentro(bx + 22, hb + 0.06, bz - 8, 14, 0.12, 14, 'concreto', { tipo: 'heliponto', semChao: false });
  LOJAS.push({ x: bx - 2, z: bz + 6, lado: 3, nome: 'Arsenal da base' });
  caixaCentro(bx - 2, hb + 1.2, bz + 7.6, 3, 2.4, 0.5, 'metal', { tipo: 'loja' });
  for (let k = 0; k < 10; k++) SPAWNS[3].push([bx - 20 + (k % 5) * 6, bz + 10 + Math.floor(k / 5) * 5]);
  VEICULOS_INICIAIS.push({ tipo: 'blindado', x: bx + 8, z: bz + 14, yaw: 0, lado: 3 });
  VEICULOS_INICIAIS.push({ tipo: 'viatura', x: bx + 16, z: bz + 14, yaw: 0, lado: 3 });
  VEICULOS_INICIAIS.push({ tipo: 'viatura', x: bx - 8, z: bz + 16, yaw: 0, lado: 3 });
  // torre de vigia
  caixaCentro(bx - W / 2 + 4, hb + 3, bz - D / 2 + 4, 3, 6, 3, 'concreto', { tipo: 'torre' });
}
// carros civis estacionados na BR (dá para dirigir)
for (const x of [-120, 95, 160, -280, 290]) VEICULOS_INICIAIS.push({ tipo: 'carro', x, z: brZ(x) + 9.5, yaw: Math.PI / 2, lado: -1 });
VEICULOS_INICIAIS.push({ tipo: 'carro', x: POSTO.x - 12, z: brZ(POSTO.x) + 26, yaw: 0, lado: -1 });
// postes e fios nas favelas
for (const m of MORROS) for (const L of m.becos) for (let k = 0; k < L.length; k += 7) { const [x, z] = L[k]; if (!livre(x + 1.6, z, 0.2)) continue; POSTES.push([x + 1.6, alturaTerreno(x + 1.6, z), z]); }
for (let i = 0; i < POSTES.length; i++) { const a = POSTES[i]; for (let j = i + 1; j < Math.min(POSTES.length, i + 6); j++) { const b = POSTES[j]; const d = Math.hypot(a[0] - b[0], a[2] - b[2]); if (d > 4 && d < 24) FIOS.push([a, b]); } }
// árvores nos morros vazios do fundo e no pé dos morros
for (let k = 0; k < 520; k++) { const x = R(-MX + 10, MX - 10), z = R(-MZ + 10, MZ - 10), h = alturaTerreno(x, z); if (perto(BR, x, z, 16)) continue; if (MORROS.some(m => Math.hypot(x - m.x, z - m.z) < m.r)) continue; if (Math.hypot(x - BASE_POLICIA.x, z - BASE_POLICIA.z) < 50) continue; if (!livre(x, z, 1)) continue; ARVORES.push([x, h, z, R(0.8, 1.4)]); if (rnd() < 0.5) caixaCentro(x, h + 2, z, 0.6, 4, 0.6, 'madeira', { tipo: 'tronco' }); }
// antena no topo do Morro da Antena
{ const m = MORROS[2]; caixaCentro(m.x + 10, alturaTerreno(m.x + 10, m.z + 8) + 14, m.z + 8, 1.2, 28, 1.2, 'metal', { tipo: 'antena' }); }

/* ---------- grafo de navegação para os bots (grade de 6 m) ---------- */
export const NAV = { passo: 6, nos: [], idx: new Map() };
{
  const P = NAV.passo;
  for (let z = -MZ + 30; z <= MZ - 30; z += P) for (let x = -MX + 30; x <= MX - 30; x += P) {
    const h = alturaTerreno(x, z); let alto = h, bloqueado = false;
    caixasPerto(x, z, 1.2, b => { if (b.vidro !== undefined) return; if (x > b.x0 - 0.5 && x < b.x1 + 0.5 && z > b.z0 - 0.5 && z < b.z1 + 0.5) { if (b.y1 - h < 1.2 && !b.tipo?.match(/casa|muro|torre|antena/)) alto = Math.max(alto, b.y1); else bloqueado = true; } });
    if (bloqueado) continue;
    const e = Math.max(Math.abs(x) - (MX - 50), Math.abs(z) - (MZ - 50)); if (e > 18) continue;
    const no = { i: NAV.nos.length, x, z, y: alto, viz: [] };
    NAV.nos.push(no); NAV.idx.set(Math.round(x) + ',' + Math.round(z), no.i);
  }
  for (const n of NAV.nos) for (const [dx, dz] of [[P, 0], [0, P], [P, P], [P, -P]]) {
    const j = NAV.idx.get(Math.round(n.x + dx) + ',' + Math.round(n.z + dz)); if (j === undefined) continue; const m = NAV.nos[j];
    if (Math.abs(m.y - n.y) > 4.2) continue;
    const a = { x: n.x, y: n.y + 0.9, z: n.z }, b = { x: m.x, y: m.y + 0.9, z: m.z };
    if (!visivel(a, b, true)) continue;
    const c = Math.hypot(dx, dz, m.y - n.y);
    n.viz.push([j, c]); m.viz.push([n.i, c]);
  }
}
export function noMaisPerto(x, z) { const P = NAV.passo; let best = -1, bd = 1e9; for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) { const gx = Math.round((x - (-MX + 30)) / P) * P + (-MX + 30) + dx * P, gz = Math.round((z - (-MZ + 30)) / P) * P + (-MZ + 30) + dz * P; const j = NAV.idx.get(Math.round(gx) + ',' + Math.round(gz)); if (j === undefined) continue; const n = NAV.nos[j], d = (n.x - x) ** 2 + (n.z - z) ** 2; if (d < bd) { bd = d; best = j; } } return best; }
// A* (com limite de nós visitados para não travar o quadro)
export function caminho(de, para, limite = 4000) {
  if (de < 0 || para < 0) return null; if (de === para) return [de];
  const N = NAV.nos, alvo = N[para], g = new Map([[de, 0]]), veio = new Map(), fechado = new Set();
  // fila de prioridade (heap binário)
  const hf = [0], hi = [de];
  const push = (f, i) => { let k = hf.length; hf.push(f); hi.push(i); while (k > 0) { const p = (k - 1) >> 1; if (hf[p] <= hf[k]) break; [hf[p], hf[k]] = [hf[k], hf[p]]; [hi[p], hi[k]] = [hi[k], hi[p]]; k = p; } };
  const pop = () => { const top = hi[0], lf = hf.pop(), li = hi.pop(); if (hf.length) { hf[0] = lf; hi[0] = li; let k = 0; for (;;) { const l = 2 * k + 1, r = l + 1; let m = k; if (l < hf.length && hf[l] < hf[m]) m = l; if (r < hf.length && hf[r] < hf[m]) m = r; if (m === k) break; [hf[m], hf[k]] = [hf[k], hf[m]]; [hi[m], hi[k]] = [hi[k], hi[m]]; k = m; } } return top; };
  const hh = i => Math.hypot(N[i].x - alvo.x, N[i].z - alvo.z);
  let vis = 0;
  while (hf.length && vis++ < limite) {
    const u = pop();
    if (u === para) { const p = [u]; let c = u; while (veio.has(c)) { c = veio.get(c); p.push(c); } return p.reverse(); }
    if (fechado.has(u)) continue; fechado.add(u);
    for (const [v, c] of N[u].viz) { const ng = g.get(u) + c; if (ng < (g.get(v) ?? 1e9)) { g.set(v, ng); veio.set(v, u); push(ng + hh(v), v); } }
  }
  return null;
}

/* =========================================================================
   MALHAS (visual)
   ========================================================================= */
function texCanvas(w, h, f) { const c = document.createElement('canvas'); c.width = w; c.height = h; f(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; return t; }
export const TEX = {
  tijolo: texCanvas(256, 256, (g, w, h) => { g.fillStyle = '#c9c2b5'; g.fillRect(0, 0, w, h); for (let r = 0; r < 16; r++) for (let c = 0; c < 8; c++) { const x = c * 32 + (r % 2 ? 16 : 0), y = r * 16; const v = 150 + Math.random() * 60 | 0; g.fillStyle = `rgb(${v},${v * 0.55 | 0},${v * 0.42 | 0})`; g.fillRect(x + 1.5, y + 1.5, 29, 13); g.fillRect(x - 256 + 1.5, y + 1.5, 29, 13); } }),
  reboco: texCanvas(256, 256, (g, w, h) => { g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h); for (let i = 0; i < 4000; i++) { const v = 200 + Math.random() * 55 | 0; g.fillStyle = `rgba(${v},${v},${v},.35)`; g.fillRect(Math.random() * w, Math.random() * h, 2, 2); } for (let i = 0; i < 18; i++) { g.fillStyle = 'rgba(90,70,50,.10)'; g.beginPath(); g.ellipse(Math.random() * w, Math.random() * h, 20 + Math.random() * 40, 8 + Math.random() * 30, 0, 0, 7); g.fill(); } }),
  asfalto: texCanvas(256, 256, (g, w, h) => { g.fillStyle = '#3b3d42'; g.fillRect(0, 0, w, h); for (let i = 0; i < 3500; i++) { const v = 45 + Math.random() * 40 | 0; g.fillStyle = `rgb(${v},${v},${v + 4})`; g.fillRect(Math.random() * w, Math.random() * h, 2, 2); } }),
  chao: texCanvas(256, 256, (g, w, h) => { g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h); for (let i = 0; i < 5000; i++) { const v = 170 + Math.random() * 85 | 0; g.fillStyle = `rgba(${v},${v},${v},.5)`; g.fillRect(Math.random() * w, Math.random() * h, 3, 3); } }),
};
// material com coordenada de textura vinda da posição no mundo (para caixas esticadas não esticarem a textura)
export function matMundo(map, escala = 0.35, extra = {}) {
  const m = new THREE.MeshLambertMaterial(Object.assign({ map }, extra));
  m.onBeforeCompile = sh => {
    sh.uniforms.escalaTex = { value: escala };
    sh.vertexShader = 'varying vec3 vMundo; varying vec3 vNormMundo;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
      vec4 pm = vec4(transformed, 1.0);
      vec3 nm = objectNormal;
      #ifdef USE_INSTANCING
        pm = instanceMatrix * pm; nm = mat3(instanceMatrix) * nm;
      #endif
      vMundo = (modelMatrix * pm).xyz; vNormMundo = normalize(mat3(modelMatrix) * nm);`);
    sh.fragmentShader = 'uniform float escalaTex; varying vec3 vMundo; varying vec3 vNormMundo;\n' + sh.fragmentShader.replace('#include <map_fragment>', `
      vec3 an = abs(vNormMundo);
      vec2 uvM = an.y > 0.6 ? vMundo.xz : (an.x > an.z ? vMundo.zy : vMundo.xy);
      vec4 sampledDiffuseColor = texture2D(map, uvM * escalaTex);
      diffuseColor *= sampledDiffuseColor;`);
  };
  return m;
}
export function construirMalhas(cena, qualidade) {
  const g = new THREE.Group(); cena.add(g);
  // terreno com cores por vértice (grama, terra batida, cimento das favelas)
  const geo = new THREE.PlaneGeometry(MX * 2, MZ * 2, NX - 1, NZ - 1); geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position, cores = new Float32Array(pos.count * 3), c = new THREE.Color();
  for (let k = 0; k < pos.count; k++) {
    const x = pos.getX(k), z = pos.getZ(k), h = alturaTerreno(x, z); pos.setY(k, h);
    let cor = '#6f8a3c'; const inc = 1 - normalTerreno(x, z).y;
    if (inc > 0.25) cor = '#8a6d4a';
    for (const m of MORROS) { const d = Math.hypot(x - m.x, z - m.z); if (d < m.r) { cor = d < m.r * 0.96 ? '#8d8478' : '#8a6d4a'; if (m.becos.some(L => perto(L, x, z, 1.8))) cor = '#a39a8c'; } }
    if (Math.hypot(x - BASE_POLICIA.x, z - BASE_POLICIA.z) < 38) cor = '#8f8f8f';
    c.set(cor); const v = 0.92 + Math.random() * 0.12; cores[k * 3] = c.r * v; cores[k * 3 + 1] = c.g * v; cores[k * 3 + 2] = c.b * v;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(cores, 3)); geo.computeVertexNormals();
  const terreno = new THREE.Mesh(geo, matMundo(TEX.chao, 0.12, { vertexColors: true })); terreno.receiveShadow = true; g.add(terreno);
  // estradas: faixas sobre o terreno
  const faixa = (L, larg, cor, dy = 0.06) => {
    const p = [], idx = []; let n = 0;
    for (let i = 0; i < L.length; i++) {
      const a = L[Math.max(0, i - 1)], b = L[Math.min(L.length - 1, i + 1)], dx = b[0] - a[0], dz = b[1] - a[1], d = Math.hypot(dx, dz) || 1, nx = -dz / d, nz = dx / d;
      for (const s of [-1, 1]) { const x = L[i][0] + nx * larg / 2 * s, z = L[i][1] + nz * larg / 2 * s; p.push(x, alturaTerreno(x, z) + dy, z); }
      if (i) idx.push(n - 2, n, n - 1, n - 1, n, n + 1); n += 2;
    }
    const gg = new THREE.BufferGeometry(); gg.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); gg.setIndex(idx); gg.computeVertexNormals();
    const mm = new THREE.Mesh(gg, matMundo(TEX.asfalto, 0.25, { color: cor, polygonOffset: true, polygonOffsetFactor: -2 })); mm.receiveShadow = true; return mm;
  };
  g.add(faixa(BR, 21, 0xffffff));
  const listras = []; for (let i = 0; i < BR.length - 1; i += 2) { const [x, z] = BR[i]; if (Math.abs(x) > MX - 30) continue; for (const o of [-5.2, 5.2]) listras.push([x, z + o]); }
  g.add(faixa(RUA_BASE, 8, 0xdddddd));
  for (const m of MORROS) g.add(faixa(m.rua, 7, 0xbfbfbf));
  // caixas instanciadas por tipo
  const geoCaixa = new THREE.BoxGeometry(1, 1, 1);
  const inst = (lista, mat, cast = true) => { if (!lista.length) return null; const im = new THREE.InstancedMesh(geoCaixa, mat, lista.length); const o = new THREE.Object3D(), cc = new THREE.Color(); lista.forEach((b, k) => { o.position.set((b.x0 + b.x1) / 2, (b.y0 + b.y1) / 2, (b.z0 + b.z1) / 2); o.scale.set(b.x1 - b.x0, b.y1 - b.y0, b.z1 - b.z0); o.updateMatrix(); im.setMatrixAt(k, o.matrix); im.setColorAt(k, cc.set(b.cor || '#ffffff')); }); im.instanceMatrix.needsUpdate = true; im.castShadow = cast && qualidade > 0; im.receiveShadow = true; g.add(im); return im; };
  const tij = CASAS.filter(c => c.tijolo).map(c => Object.assign({}, c.b, { cor: '#ffffff' })), pint = CASAS.filter(c => !c.tijolo).map(c => Object.assign({}, c.b, { cor: c.cor }));
  inst(tij, matMundo(TEX.tijolo, 0.42)); inst(pint, matMundo(TEX.reboco, 0.2));
  const porTipo = t => CAIXAS.filter(b => b.tipo === t);
  inst([...porTipo('mureta'), ...porTipo('muro'), ...porTipo('torre'), ...porTipo('heliponto'), ...porTipo('pilar')].map(b => Object.assign({}, b, { cor: b.tipo === 'heliponto' ? '#5a5a5a' : '#b7b2a8' })), matMundo(TEX.reboco, 0.3));
  inst([...porTipo('carro'), ...porTipo('onibus'), ...porTipo('conteiner'), ...porTipo('cobertura'), ...porTipo('bomba'), ...porTipo('loja'), ...porTipo('antena')].map(b => Object.assign({}, b, { cor: b.cor || (b.tipo === 'bomba' ? '#d62828' : b.tipo === 'loja' ? '#6b4f2a' : '#9aa0a6') })), new THREE.MeshLambertMaterial({ color: 0xffffff }));
  inst([...porTipo('saco'), ...porTipo('pneus'), ...porTipo('tronco')].map(b => Object.assign({}, b, { cor: b.tipo === 'saco' ? '#b9a27a' : b.tipo === 'pneus' ? '#1d1d1d' : '#5b4630' })), new THREE.MeshLambertMaterial({ color: 0xffffff }));
  // laje (topo cinza) das casas
  const lajes = CASAS.map(c => ({ x0: c.b.x0 - 0.05, x1: c.b.x1 + 0.05, z0: c.b.z0 - 0.05, z1: c.b.z1 + 0.05, y0: c.b.y1 - 0.02, y1: c.b.y1 + 0.12, cor: '#8c8c8c' }));
  inst(lajes, matMundo(TEX.chao, 0.3), false);
  // janelas (vidro) — uma malha só; quebrar = sumir a instância
  const matVidro = new THREE.MeshPhongMaterial({ color: 0x7fa7c4, specular: 0xffffff, shininess: 90, transparent: true, opacity: 0.55 });
  const imV = new THREE.InstancedMesh(geoCaixa, matVidro, Math.max(1, JANELAS.length)); const o = new THREE.Object3D();
  JANELAS.forEach((j, k) => { const b = j.b; o.position.set((b.x0 + b.x1) / 2, (b.y0 + b.y1) / 2, (b.z0 + b.z1) / 2); o.scale.set(b.x1 - b.x0, b.y1 - b.y0, b.z1 - b.z0); o.updateMatrix(); imV.setMatrixAt(k, o.matrix); });
  g.add(imV);
  // parte escura atrás de cada janela (dá a ideia de cômodo)
  const fundos = JANELAS.map(j => { const b = j.b, fx = (b.x1 - b.x0) < 0.2, e = 0.04; return { x0: b.x0 - (fx ? e : 0), x1: b.x1 + (fx ? e : 0), z0: b.z0 - (fx ? 0 : e), z1: b.z1 + (fx ? 0 : e), y0: b.y0, y1: b.y1, cor: '#1e2329' }; });
  inst(fundos, new THREE.MeshBasicMaterial({ color: 0xffffff }), false).renderOrder = -1;
  // caixas d'água
  if (CAIXAS_DAGUA.length) { const im = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.62, 0.55, 1.1, 10), new THREE.MeshLambertMaterial({ color: 0x2f6fb5 }), CAIXAS_DAGUA.length); CAIXAS_DAGUA.forEach(([x, y, z], k) => { o.position.set(x, y + 0.55, z); o.scale.set(1, 1, 1); o.updateMatrix(); im.setMatrixAt(k, o.matrix); }); im.castShadow = qualidade > 0; g.add(im); }
  // postes, fios, árvores
  if (POSTES.length) { const im = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.11, 0.15, 7.5, 6).translate(0, 3.75, 0), new THREE.MeshLambertMaterial({ color: 0x7a7a7a }), POSTES.length); POSTES.forEach(([x, y, z], k) => { o.position.set(x, y, z); o.updateMatrix(); im.setMatrixAt(k, o.matrix); }); g.add(im); }
  const pf = []; for (const [a, b] of FIOS) { for (let s = 0; s < 6; s++) { const t0 = s / 6, t1 = (s + 1) / 6, ca = t0 * (1 - t0) * 2.2, cb = t1 * (1 - t1) * 2.2; pf.push(a[0] + (b[0] - a[0]) * t0, a[1] + 7.2 + (b[1] - a[1]) * t0 - ca, a[2] + (b[2] - a[2]) * t0, a[0] + (b[0] - a[0]) * t1, a[1] + 7.2 + (b[1] - a[1]) * t1 - cb, a[2] + (b[2] - a[2]) * t1); } }
  if (pf.length) { const gg = new THREE.BufferGeometry(); gg.setAttribute('position', new THREE.Float32BufferAttribute(pf, 3)); g.add(new THREE.LineSegments(gg, new THREE.LineBasicMaterial({ color: 0x151515 }))); }
  if (ARVORES.length) {
    const tr = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.22, 0.3, 4, 6).translate(0, 2, 0), new THREE.MeshLambertMaterial({ color: 0x5b4630 }), ARVORES.length);
    const co = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(2.6, 0).translate(0, 5.2, 0), new THREE.MeshLambertMaterial({ color: 0x3f6b2f, flatShading: true }), ARVORES.length);
    const cc = new THREE.Color();
    ARVORES.forEach(([x, y, z, s], k) => { o.position.set(x, y, z); o.scale.set(s, s, s); o.rotation.set(0, k, 0); o.updateMatrix(); tr.setMatrixAt(k, o.matrix); co.setMatrixAt(k, o.matrix); co.setColorAt(k, cc.setHSL(0.27 + Math.random() * 0.06, 0.45, 0.28 + Math.random() * 0.08)); });
    tr.castShadow = co.castShadow = qualidade > 0; g.add(tr, co);
  }
  // listras brancas da BR
  if (listras.length) { const im = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.25, 3).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xeeeeee }), listras.length); listras.forEach(([x, z], k) => { const a = Math.atan2(25 / 120 * Math.cos(x / 120), 1); o.position.set(x, alturaTerreno(x, z) + 0.09, z); o.rotation.set(0, Math.PI / 2 - a, 0); o.scale.set(1, 1, 1); o.updateMatrix(); im.setMatrixAt(k, o.matrix); }); g.add(im); }
  return { grupo: g, vidros: imV };
}
// placas com texto (lojas, posto, pontos de controle)
export function placa(texto, cor = '#ffd166', larg = 3) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 128; const x = c.getContext('2d');
  x.fillStyle = 'rgba(15,18,24,.9)'; x.fillRect(0, 0, 512, 128); x.strokeStyle = cor; x.lineWidth = 8; x.strokeRect(4, 4, 504, 120);
  x.fillStyle = cor; x.font = '800 54px "Barlow Condensed", Arial Narrow, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(texto, 256, 66);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t })); s.scale.set(larg, larg / 4, 1); return s;
}
